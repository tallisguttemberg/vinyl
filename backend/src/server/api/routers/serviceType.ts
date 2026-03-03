import { z } from "zod";
import { createTRPCRouter, checkPermission } from "../trpc";
import { TRPCError } from "@trpc/server";

export const serviceTypeRouter = createTRPCRouter({
    getAll: checkPermission("services", "visualizar").query(async ({ ctx }) => {
        if (!ctx.session.orgId) return [];

        return ctx.prisma.serviceType.findMany({
            where: {
                organizationId: ctx.session.orgId,
            },
            orderBy: {
                name: "asc",
            },
        });
    }),

    create: checkPermission("services", "criar")
        .input(
            z.object({
                name: z.string().min(1),
                billingType: z.enum(["FIXED", "PER_M2"]),
                defaultPrice: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
            }

            return ctx.prisma.serviceType.create({
                data: {
                    organizationId: ctx.session.orgId,
                    name: input.name,
                    billingType: input.billingType,
                    defaultPrice: input.defaultPrice,
                },
            });
        }),

    delete: checkPermission("services", "excluir")
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) return null;

            const serviceType = await ctx.prisma.serviceType.findUnique({
                where: { id: input.id },
            });

            if (!serviceType || serviceType.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return ctx.prisma.serviceType.delete({
                where: { id: input.id },
            });
        }),

    update: checkPermission("services", "editar")
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1),
                billingType: z.enum(["FIXED", "PER_M2"]),
                defaultPrice: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
            }

            const serviceType = await ctx.prisma.serviceType.findUnique({
                where: { id: input.id },
            });

            if (!serviceType || serviceType.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return ctx.prisma.serviceType.update({
                where: { id: input.id },
                data: {
                    name: input.name,
                    billingType: input.billingType,
                    defaultPrice: input.defaultPrice,
                },
            });
        }),
});
