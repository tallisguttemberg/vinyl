
import { z } from "zod";
import { createTRPCRouter, checkPermission } from "../trpc";

const purchaseSchema = z.object({
    totalPaid: z.number().min(0.01, "O valor da compra deve ser informado."),
    paymentMethod: z.string().min(1, "O método de pagamento é obrigatório."),
    paymentDate: z.string().min(1, "A data de pagamento é obrigatória."),
});

export const equipmentRouter = createTRPCRouter({
  getAll: checkPermission("materials", "visualizar").query(async ({ ctx }) => {
    if (!ctx.session.orgId) return [];
    return ctx.prisma.equipment.findMany({
      where: { organizationId: ctx.session.orgId },
      orderBy: { name: "asc" },
    });
  }),

  create: checkPermission("materials", "criar")
    .input(z.object({
      name: z.string().min(1),
      dailyCost: z.number().min(0),
      supplierId: z.string().min(1, "Fornecedor é obrigatório"),
      purchase: purchaseSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.orgId) return null;

      const supplier = await ctx.prisma.supplier.findUnique({
          where: { id: input.supplierId, organizationId: ctx.session.orgId },
      });

      return ctx.prisma.$transaction(async (tx) => {
        const equipment = await tx.equipment.create({
          data: {
            name: input.name,
            dailyCost: input.dailyCost,
            supplierId: input.supplierId,
            organizationId: ctx.session.orgId!,
          },
        });

        await tx.financialTransaction.create({
          data: {
            organizationId: ctx.session.orgId!,
            type: "PAYABLE",
            status: "PAID",
            description: `Aquisição de Equipamento: ${input.name}`,
            amount: input.purchase.totalPaid,
            dueDate: new Date(input.purchase.paymentDate + "T12:00:00"),
            paymentDate: new Date(input.purchase.paymentDate + "T12:00:00"),
            paymentMethod: input.purchase.paymentMethod,
            category: "Equipamentos",
            entityName: supplier?.name,
          },
        });

        return equipment;
      });
    }),

  update: checkPermission("materials", "editar")
    .input(z.object({
      id: z.string(),
      name: z.string().min(1),
      dailyCost: z.number().min(0),
      supplierId: z.string().min(1, "Fornecedor é obrigatório"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.orgId) return null;
      const { id, ...data } = input;
      return ctx.prisma.equipment.update({
        where: { id, organizationId: ctx.session.orgId },
        data,
      });
    }),

  delete: checkPermission("materials", "excluir")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session.orgId) return null;
      return ctx.prisma.equipment.delete({
        where: { id: input.id, organizationId: ctx.session.orgId },
      });
    }),
});
