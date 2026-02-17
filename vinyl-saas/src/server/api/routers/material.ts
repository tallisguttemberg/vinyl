
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { calculateMaterialCost } from "@/lib/calculations";
import { TRPCError } from "@trpc/server";

export const materialRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.auth.orgId) return [];

        return ctx.prisma.material.findMany({
            where: {
                organizationId: ctx.auth.orgId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                pricePerRoll: z.number().min(0),
                rollLength: z.number().min(0),
                width: z.number().min(0),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.auth.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
            }

            const costs = calculateMaterialCost(
                input.pricePerRoll,
                input.rollLength,
                input.width
            );

            return ctx.prisma.material.create({
                data: {
                    organizationId: ctx.auth.orgId,
                    name: input.name,
                    pricePerRoll: input.pricePerRoll,
                    rollLength: input.rollLength,
                    width: input.width,
                    costPerLinearMeter: costs.costPerLinearMeter,
                    costPerSqMeter: costs.costPerSqMeter,
                },
            });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.auth.orgId) return null;

            // Verify ownership
            const material = await ctx.prisma.material.findUnique({
                where: { id: input.id },
            });

            if (!material || material.organizationId !== ctx.auth.orgId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return ctx.prisma.material.delete({
                where: { id: input.id },
            });
        }),
});
