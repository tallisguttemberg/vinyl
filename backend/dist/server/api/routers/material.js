"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.materialRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const calculations_1 = require("../../../lib/calculations");
const server_1 = require("@trpc/server");
// Contrato da nova Skill
const registerEntrySchema = zod_1.z.object({
    materialId: zod_1.z.string().cuid(),
    supplierId: zod_1.z.string().min(1, "O fornecedor é obrigatório."),
    quantityAdded: zod_1.z.number({
        message: "A quantidade deve ser um número",
    }).gt(0, "A quantidade de entrada deve ser superior a zero."),
    note: zod_1.z.string().optional(),
});
exports.materialRouter = (0, trpc_1.createTRPCRouter)({
    getAll: (0, trpc_1.checkPermission)("materials", "visualizar").query(async ({ ctx }) => {
        if (!ctx.session.orgId)
            return [];
        return ctx.prisma.material.findMany({
            where: {
                organizationId: ctx.session.orgId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }),
    create: (0, trpc_1.checkPermission)("materials", "criar")
        .input(zod_1.z.object({
        name: zod_1.z.string().min(1),
        category: zod_1.z.enum(["ADHESIVE", "LIQUID"]).default("ADHESIVE"),
        unit: zod_1.z.enum(["M2", "ML"]).default("M2"),
        pricePerRoll: zod_1.z.number().min(0),
        rollLength: zod_1.z.number().min(0).optional(),
        width: zod_1.z.number().min(0).optional(),
        volume: zod_1.z.number().min(0).optional(),
        stockAmount: zod_1.z.number().default(0),
        supplierId: zod_1.z.string().min(1, "O fornecedor é obrigatório."),
    }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
        }
        let costs = { costPerLinearMeter: 0, costPerSqMeter: 0, costPerMl: 0 };
        if (input.category === "ADHESIVE") {
            const adhesiveCosts = (0, calculations_1.calculateMaterialCost)(input.pricePerRoll, input.rollLength || 0, input.width || 0);
            costs = { ...costs, ...adhesiveCosts };
        }
        else {
            const liquidCosts = (0, calculations_1.calculateLiquidCost)(input.pricePerRoll, input.volume || 0);
            costs = { ...costs, ...liquidCosts };
        }
        return ctx.prisma.material.create({
            data: {
                organizationId: ctx.session.orgId,
                name: input.name,
                category: input.category,
                unit: input.unit,
                pricePerRoll: input.pricePerRoll,
                rollLength: (input.rollLength ?? null),
                width: (input.width ?? null),
                volume: (input.volume ?? null),
                costPerLinearMeter: costs.costPerLinearMeter,
                costPerSqMeter: costs.costPerSqMeter,
                costPerMl: costs.costPerMl,
                stockAmount: input.stockAmount,
                supplierId: input.supplierId,
            },
        });
    }),
    delete: (0, trpc_1.checkPermission)("materials", "excluir")
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            return null;
        // Verify ownership
        const material = await ctx.prisma.material.findUnique({
            where: { id: input.id },
        });
        if (!material || material.organizationId !== ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "NOT_FOUND" });
        }
        return ctx.prisma.material.delete({
            where: { id: input.id },
        });
    }),
    update: (0, trpc_1.checkPermission)("materials", "editar")
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string().min(1),
        category: zod_1.z.enum(["ADHESIVE", "LIQUID"]),
        unit: zod_1.z.enum(["M2", "ML"]),
        pricePerRoll: zod_1.z.number().min(0),
        rollLength: zod_1.z.number().min(0).optional(),
        width: zod_1.z.number().min(0).optional(),
        volume: zod_1.z.number().min(0).optional(),
        stockAmount: zod_1.z.number().optional(),
        supplierId: zod_1.z.string().min(1, "O fornecedor é obrigatório."),
    }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
        }
        const material = await ctx.prisma.material.findUnique({
            where: { id: input.id },
        });
        if (!material || material.organizationId !== ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "NOT_FOUND" });
        }
        let costs = { costPerLinearMeter: 0, costPerSqMeter: 0, costPerMl: 0 };
        if (input.category === "ADHESIVE") {
            const adhesiveCosts = (0, calculations_1.calculateMaterialCost)(input.pricePerRoll, input.rollLength || 0, input.width || 0);
            costs = { ...costs, ...adhesiveCosts };
        }
        else {
            const liquidCosts = (0, calculations_1.calculateLiquidCost)(input.pricePerRoll, input.volume || 0);
            costs = { ...costs, ...liquidCosts };
        }
        return ctx.prisma.material.update({
            where: { id: input.id },
            data: {
                name: input.name,
                category: input.category,
                unit: input.unit,
                pricePerRoll: input.pricePerRoll,
                rollLength: (input.rollLength ?? null),
                width: (input.width ?? null),
                volume: (input.volume ?? null),
                costPerLinearMeter: costs.costPerLinearMeter,
                costPerSqMeter: costs.costPerSqMeter,
                costPerMl: costs.costPerMl,
                stockAmount: input.stockAmount,
                supplierId: input.supplierId,
            },
        });
    }),
    registerEntry: (0, trpc_1.checkPermission)("materials", "editar")
        .input(registerEntrySchema)
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
        }
        const material = await ctx.prisma.material.findUnique({
            where: { id: input.materialId, organizationId: ctx.session.orgId },
        });
        if (!material) {
            throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Material não encontrado." });
        }
        try {
            return await ctx.prisma.$transaction(async (tx) => {
                await tx.materialEntry.create({
                    data: {
                        organizationId: ctx.session.orgId,
                        materialId: input.materialId,
                        supplierId: input.supplierId,
                        quantity: input.quantityAdded,
                        note: input.note,
                    }
                });
                return await tx.material.update({
                    where: { id: input.materialId },
                    data: {
                        stockAmount: { increment: input.quantityAdded }
                    }
                });
            });
        }
        catch (error) {
            console.error("Erro ao registrar entrada de material:", error);
            throw new server_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Erro interno ao processar a entrada. Tente novamente."
            });
        }
    }),
});
