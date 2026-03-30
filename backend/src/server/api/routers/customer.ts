import { z } from "zod";
import { createTRPCRouter, checkPermission } from "../trpc";
import { TRPCError } from "@trpc/server";

export const customerRouter = createTRPCRouter({
    getAll: checkPermission("orders", "visualizar").query(async ({ ctx }) => {
        if (!ctx.session.orgId) return [];
        return await ctx.prisma.customer.findMany({
            where: { organizationId: ctx.session.orgId },
            orderBy: { name: "asc" },
        });
    }),

    getById: checkPermission("orders", "visualizar")
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            if (!ctx.session.orgId) return null;
            const customer = await ctx.prisma.customer.findUnique({
                where: { id: input.id },
            });
            if (!customer || customer.organizationId !== ctx.session.orgId) {
                return null;
            }
            return customer;
        }),

    create: checkPermission("orders", "criar")
        .input(
            z.object({
                name: z.string().min(1, "Nome é obrigatório"),
                document: z.string().optional().nullable(),
                email: z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
                phone: z.string().optional().nullable(),
                address: z.string().optional().nullable(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Organização não selecionada" });
            }
            return await ctx.prisma.$transaction(async (tx) => {
                const customer = await tx.customer.create({
                    data: {
                        organizationId: ctx.session.orgId!,
                        name: input.name,
                        document: input.document,
                        email: input.email || null,
                        phone: input.phone,
                        address: input.address,
                    },
                });

                await tx.auditLog.create({
                    data: {
                        organizationId: ctx.session.orgId!,
                        acao: "CREATE_CUSTOMER",
                        targetId: customer.id,
                        idUsuarioResponsavel: ctx.session.userId,
                    }
                });
                return customer;
            });
        }),

    update: checkPermission("orders", "editar")
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1, "Nome é obrigatório"),
                document: z.string().optional().nullable(),
                email: z.string().email("E-mail inválido").optional().nullable().or(z.literal("")),
                phone: z.string().optional().nullable(),
                address: z.string().optional().nullable(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) throw new TRPCError({ code: "UNAUTHORIZED" });
            
            const existing = await ctx.prisma.customer.findUnique({ where: { id: input.id } });
            if (!existing || existing.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
            }

            return await ctx.prisma.$transaction(async (tx) => {
                const customer = await tx.customer.update({
                    where: { id: input.id },
                    data: {
                        name: input.name,
                        document: input.document,
                        email: input.email || null,
                        phone: input.phone,
                        address: input.address,
                    },
                });

                await tx.auditLog.create({
                    data: {
                        organizationId: ctx.session.orgId!,
                        acao: "UPDATE_CUSTOMER",
                        targetId: customer.id,
                        idUsuarioResponsavel: ctx.session.userId,
                    }
                });
                return customer;
            });
        }),

    delete: checkPermission("orders", "excluir")
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) throw new TRPCError({ code: "UNAUTHORIZED" });

            const existing = await ctx.prisma.customer.findUnique({ where: { id: input.id } });
            if (!existing || existing.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
            }

            return await ctx.prisma.$transaction(async (tx) => {
                await tx.customer.delete({ where: { id: input.id } });

                await tx.auditLog.create({
                    data: {
                        organizationId: ctx.session.orgId!,
                        acao: "DELETE_CUSTOMER",
                        targetId: input.id,
                        idUsuarioResponsavel: ctx.session.userId,
                    }
                });
                return { success: true };
            });
        }),
});
