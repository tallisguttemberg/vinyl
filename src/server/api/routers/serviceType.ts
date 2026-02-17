
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const serviceTypeRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.auth.orgId) return [];

        return ctx.prisma.serviceType.findMany({
            where: {
                organizationId: ctx.auth.orgId,
            },
            orderBy: {
                name: "asc",
            },
        });
    }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1),
                billingType: z.enum(["FIXED", "PER_M2"]),
                defaultPrice: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.auth.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
            }

            return ctx.prisma.serviceType.create({
                data: {
                    organizationId: ctx.auth.orgId,
                    name: input.name,
                    billingType: input.billingType,
                    defaultPrice: input.defaultPrice,
                },
            });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.auth.orgId) return null;

            const serviceType = await ctx.prisma.serviceType.findUnique({
                where: { id: input.id },
            });

            if (!serviceType || serviceType.organizationId !== ctx.auth.orgId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return ctx.prisma.serviceType.delete({
                where: { id: input.id },
            });
        }),
});
