import { z } from "zod";
import { createTRPCRouter, checkPermission } from "../trpc";
import { calculateMaterialCost, calculateLiquidCost } from "../../../lib/calculations";
import { TRPCError } from "@trpc/server";

const purchaseSchema = z.object({
    totalPaid: z.number().min(0.01, "O valor da compra deve ser informado."),
    paymentMethod: z.string().min(1, "O método de pagamento é obrigatório."),
    paymentDate: z.string().min(1, "A data de pagamento é obrigatória."),
});

const registerEntrySchema = z.object({
    materialId: z.string().cuid(),
    supplierId: z.string().min(1, "O fornecedor é obrigatório."),
    quantityAdded: z.number({ message: "A quantidade deve ser um número" }).gt(0, "A quantidade de entrada deve ser superior a zero."),
    note: z.string().optional(),
    purchase: purchaseSchema,
});

export const materialRouter = createTRPCRouter({
    getAll: checkPermission("materials", "visualizar").query(async ({ ctx }) => {
        if (!ctx.session.orgId) return [];

        return ctx.prisma.material.findMany({
            where: { organizationId: ctx.session.orgId },
            orderBy: { createdAt: "desc" },
        });
    }),

    create: checkPermission("materials", "criar")
        .input(
            z.object({
                name: z.string().min(1),
                category: z.enum(["ADHESIVE", "LIQUID"]).default("ADHESIVE"),
                unit: z.enum(["M2", "ML"]).default("M2"),
                pricePerRoll: z.number().min(0),
                rollLength: z.number().min(0).optional(),
                width: z.number().min(0).optional(),
                volume: z.number().min(0).optional(),
                stockAmount: z.number().default(0),
                supplierId: z.string().min(1, "O fornecedor é obrigatório."),
                purchase: purchaseSchema.optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
            }

            if (input.stockAmount > 0 && !input.purchase) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Para cadastrar material com estoque inicial, informe os dados da compra.",
                });
            }

            let costs = { costPerLinearMeter: 0, costPerSqMeter: 0, costPerMl: 0 };
            if (input.category === "ADHESIVE") {
                const res = calculateMaterialCost(input.pricePerRoll, input.rollLength || 0, input.width || 0);
                costs.costPerLinearMeter = res.costPerLinearMeter;
                costs.costPerSqMeter = res.costPerSqMeter;
            } else {
                const res = calculateLiquidCost(input.pricePerRoll, input.volume || 0);
                costs.costPerMl = res.costPerMl;
            }

            const supplier = await ctx.prisma.supplier.findUnique({
                where: { id: input.supplierId, organizationId: ctx.session.orgId },
            });

            return ctx.prisma.$transaction(async (tx) => {
                const material = await tx.material.create({
                    data: {
                        organizationId: ctx.session.orgId!,
                        name: input.name,
                        category: input.category,
                        unit: input.unit,
                        pricePerRoll: input.pricePerRoll,
                        rollLength: (input.rollLength ?? null) as any,
                        width: (input.width ?? null) as any,
                        volume: (input.volume ?? null) as any,
                        costPerLinearMeter: costs.costPerLinearMeter,
                        costPerSqMeter: costs.costPerSqMeter,
                        costPerMl: costs.costPerMl,
                        stockAmount: input.stockAmount,
                        supplierId: input.supplierId,
                    },
                });

                if (input.stockAmount > 0 && input.purchase) {
                    await tx.materialEntry.create({
                        data: {
                            organizationId: ctx.session.orgId!,
                            materialId: material.id,
                            supplierId: input.supplierId,
                            quantity: input.stockAmount,
                            note: `Estoque inicial do cadastro`,
                        },
                    });

                    await tx.financialTransaction.create({
                        data: {
                            organizationId: ctx.session.orgId!,
                            type: "PAYABLE",
                            status: "PAID",
                            description: `Compra de Material: ${input.name}`,
                            amount: input.purchase.totalPaid,
                            dueDate: new Date(input.purchase.paymentDate + "T12:00:00"),
                            paymentDate: new Date(input.purchase.paymentDate + "T12:00:00"),
                            paymentMethod: input.purchase.paymentMethod,
                            category: "Materiais",
                            entityName: supplier?.name,
                        },
                    });
                }

                return material;
            });
        }),

    delete: checkPermission("materials", "excluir")
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) return null;

            const material = await ctx.prisma.material.findUnique({ where: { id: input.id } });
            if (!material || material.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return ctx.prisma.material.delete({ where: { id: input.id } });
        }),

    update: checkPermission("materials", "editar")
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1),
                category: z.enum(["ADHESIVE", "LIQUID"]),
                unit: z.enum(["M2", "ML"]),
                pricePerRoll: z.number().min(0),
                rollLength: z.number().min(0).optional(),
                width: z.number().min(0).optional(),
                volume: z.number().min(0).optional(),
                stockAmount: z.number().optional(),
                supplierId: z.string().min(1, "O fornecedor é obrigatório."),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
            }

            const material = await ctx.prisma.material.findUnique({ where: { id: input.id } });
            if (!material || material.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }
            let costs = { costPerLinearMeter: 0, costPerSqMeter: 0, costPerMl: 0 };
            if (input.category === "ADHESIVE") {
                const res = calculateMaterialCost(input.pricePerRoll, input.rollLength || 0, input.width || 0);
                costs.costPerLinearMeter = res.costPerLinearMeter;
                costs.costPerSqMeter = res.costPerSqMeter;
            } else {
                const res = calculateLiquidCost(input.pricePerRoll, input.volume || 0);
                costs.costPerMl = res.costPerMl;
            }

            return ctx.prisma.material.update({
                where: { id: input.id },
                data: {
                    name: input.name,
                    category: input.category,
                    unit: input.unit,
                    pricePerRoll: input.pricePerRoll,
                    rollLength: (input.rollLength ?? null) as any,
                    width: (input.width ?? null) as any,
                    volume: (input.volume ?? null) as any,
                    costPerLinearMeter: costs.costPerLinearMeter,
                    costPerSqMeter: costs.costPerSqMeter,
                    costPerMl: costs.costPerMl,
                    stockAmount: input.stockAmount,
                    supplierId: input.supplierId,
                },
            });
        }),

    registerEntry: checkPermission("materials", "editar")
        .input(registerEntrySchema)
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
            }

            const material = await ctx.prisma.material.findUnique({
                where: { id: input.materialId, organizationId: ctx.session.orgId },
            });

            if (!material) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Material não encontrado." });
            }

            const supplier = await ctx.prisma.supplier.findUnique({
                where: { id: input.supplierId, organizationId: ctx.session.orgId },
            });

            try {
                return await ctx.prisma.$transaction(async (tx) => {
                    await tx.materialEntry.create({
                        data: {
                            organizationId: ctx.session.orgId!,
                            materialId: input.materialId,
                            supplierId: input.supplierId,
                            quantity: input.quantityAdded,
                            note: input.note,
                        },
                    });

                    await tx.financialTransaction.create({
                        data: {
                            organizationId: ctx.session.orgId!,
                            type: "PAYABLE",
                            status: "PAID",
                            description: `Entrada de Estoque: ${material.name} (+${input.quantityAdded} ${material.unit === "M2" ? "m²" : "ml"})`,
                            amount: input.purchase.totalPaid,
                            dueDate: new Date(input.purchase.paymentDate + "T12:00:00"),
                            paymentDate: new Date(input.purchase.paymentDate + "T12:00:00"),
                            paymentMethod: input.purchase.paymentMethod,
                            category: "Materiais",
                            entityName: supplier?.name,
                        },
                    });

                    return await tx.material.update({
                        where: { id: input.materialId },
                        data: { stockAmount: { increment: input.quantityAdded } },
                    });
                });
            } catch (error) {
                console.error("Erro ao registrar entrada de material:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Erro interno ao processar a entrada. Tente novamente.",
                });
            }
        }),
});
