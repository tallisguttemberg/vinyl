import { z } from "zod";
import { createTRPCRouter, checkPermission } from "../trpc";
import { calculateMaterialCost, calculateLiquidCost } from "../../../lib/calculations";
import { TRPCError } from "@trpc/server";

// Contrato da nova Skill
const registerEntrySchema = z.object({
    materialId: z.string().cuid(), // Ou seu tipo de ID
    quantityAdded: z.number().positive(),
    note: z.string().optional(),
});

export const materialRouter = createTRPCRouter({
    getAll: checkPermission("materials", "visualizar").query(async ({ ctx }) => {
        if (!ctx.session.orgId) return [];

        return ctx.prisma.material.findMany({
            where: {
                organizationId: ctx.session.orgId,
            },
            orderBy: {
                createdAt: "desc",
            },
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
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
            }

            let costs = { costPerLinearMeter: 0, costPerSqMeter: 0, costPerMl: 0 };

            if (input.category === "ADHESIVE") {
                const adhesiveCosts = calculateMaterialCost(
                    input.pricePerRoll,
                    input.rollLength || 0,
                    input.width || 0
                );
                costs = { ...costs, ...adhesiveCosts };
            } else {
                const liquidCosts = calculateLiquidCost(
                    input.pricePerRoll,
                    input.volume || 0
                );
                costs = { ...costs, ...liquidCosts };
            }

            return ctx.prisma.material.create({
                data: {
                    organizationId: ctx.session.orgId,
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
                },
            });
        }),

    delete: checkPermission("materials", "excluir")
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) return null;

            // Verify ownership
            const material = await ctx.prisma.material.findUnique({
                where: { id: input.id },
            });

            if (!material || material.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return ctx.prisma.material.delete({
                where: { id: input.id },
            });
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
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
            }

            const material = await ctx.prisma.material.findUnique({
                where: { id: input.id },
            });

            if (!material || material.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            let costs = { costPerLinearMeter: 0, costPerSqMeter: 0, costPerMl: 0 };

            if (input.category === "ADHESIVE") {
                const adhesiveCosts = calculateMaterialCost(
                    input.pricePerRoll,
                    input.rollLength || 0,
                    input.width || 0
                );
                costs = { ...costs, ...adhesiveCosts };
            } else {
                const liquidCosts = calculateLiquidCost(
                    input.pricePerRoll,
                    input.volume || 0
                );
                costs = { ...costs, ...liquidCosts };
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
                },
            });
        }),

    registerEntry: checkPermission("materials", "editar") // Entrada de estoque é considerado "editar" materiais
        .input(registerEntrySchema)
        .mutation(async ({ ctx, input }) => {
            // 1. Verificação de autorização e existência (Spec de segurança)
            const material = await ctx.prisma.material.findUnique({
                where: { id: input.materialId, organizationId: ctx.session.orgId },
            });

            if (!material) throw new TRPCError({ code: "NOT_FOUND" });

            // 2. Transação Atômica: Registrar entrada E atualizar estoque
            return await ctx.prisma.$transaction(async (tx) => {
                // A) Criar o registro de histórico (a "prova" da entrada)
                const entry = await tx.materialEntry.create({
                    data: {
                        organizationId: ctx.session.orgId!,
                        materialId: input.materialId,
                        quantity: input.quantityAdded,
                        note: input.note,
                    }
                });

                // B) Atualizar o saldo (StockAmount)
                const updatedMaterial = await tx.material.update({
                    where: { id: input.materialId },
                    data: {
                        stockAmount: { increment: input.quantityAdded }
                    }
                });

                return updatedMaterial;
            });
        }),
});
