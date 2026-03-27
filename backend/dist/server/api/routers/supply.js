"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplyRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
exports.supplyRouter = (0, trpc_1.createTRPCRouter)({
    getAll: (0, trpc_1.checkPermission)("materials", "visualizar").query(async ({ ctx }) => {
        if (!ctx.session.orgId)
            return [];
        return ctx.prisma.supply.findMany({
            where: { organizationId: ctx.session.orgId },
            orderBy: { name: "asc" },
        });
    }),
    create: (0, trpc_1.checkPermission)("materials", "criar")
        .input(zod_1.z.object({
        name: zod_1.z.string().min(1),
        unit: zod_1.z.string().min(1),
        unitCost: zod_1.z.number().min(0),
        supplierId: zod_1.z.string().min(1, "Fornecedor é obrigatório"),
    }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            return null;
        return ctx.prisma.supply.create({
            data: {
                ...input,
                organizationId: ctx.session.orgId,
            },
        });
    }),
    update: (0, trpc_1.checkPermission)("materials", "editar")
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string().min(1),
        unit: zod_1.z.string().min(1),
        unitCost: zod_1.z.number().min(0),
        supplierId: zod_1.z.string().min(1, "Fornecedor é obrigatório"),
    }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            return null;
        const { id, ...data } = input;
        return ctx.prisma.supply.update({
            where: { id, organizationId: ctx.session.orgId },
            data,
        });
    }),
    delete: (0, trpc_1.checkPermission)("materials", "excluir")
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            return null;
        return ctx.prisma.supply.delete({
            where: { id: input.id, organizationId: ctx.session.orgId },
        });
    }),
});
