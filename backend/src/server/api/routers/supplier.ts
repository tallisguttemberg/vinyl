import { z } from "zod";
import { createTRPCRouter, checkPermission } from "../trpc";
import { TRPCError } from "@trpc/server";

export const supplierRouter = createTRPCRouter({
    getAll: checkPermission("materials", "visualizar").query(async ({ ctx }) => {
        if (!ctx.session.orgId) return [];
        return await ctx.prisma.supplier.findMany({
            where: { organizationId: ctx.session.orgId },
            orderBy: { name: "asc" },
        });
    }),

    getById: checkPermission("materials", "visualizar")
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            if (!ctx.session.orgId) return null;
            return await ctx.prisma.supplier.findUnique({
                where: { id: input.id },
            });
        }),

    create: checkPermission("materials", "criar")
        .input(
            z.object({
                name: z.string().min(1, "Nome é obrigatório"),
                document: z.string().optional(),
                email: z.string().email("E-mail inválido").optional().or(z.literal("")),
                phone: z.string().optional(),
                address: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Organização não selecionada" });
            }
            return await ctx.prisma.$transaction(async (tx) => {
                const supplier = await tx.supplier.create({
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
                        acao: "CREATE_SUPPLIER",
                        targetId: supplier.id,
                        idUsuarioResponsavel: ctx.session.userId,
                    }
                });
                return supplier;
            });
        }),

    update: checkPermission("materials", "editar")
        .input(
            z.object({
                id: z.string(),
                name: z.string().min(1, "Nome é obrigatório"),
                document: z.string().optional(),
                email: z.string().email("E-mail inválido").optional().or(z.literal("")),
                phone: z.string().optional(),
                address: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) throw new TRPCError({ code: "UNAUTHORIZED" });
            
            const existing = await ctx.prisma.supplier.findUnique({ where: { id: input.id } });
            if (!existing || existing.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Fornecedor não encontrado" });
            }

            return await ctx.prisma.$transaction(async (tx) => {
                const supplier = await tx.supplier.update({
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
                        acao: "UPDATE_SUPPLIER",
                        targetId: supplier.id,
                        idUsuarioResponsavel: ctx.session.userId,
                    }
                });
                return supplier;
            });
        }),

    delete: checkPermission("materials", "excluir")
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) throw new TRPCError({ code: "UNAUTHORIZED" });

            const existing = await ctx.prisma.supplier.findUnique({ where: { id: input.id } });
            if (!existing || existing.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Fornecedor não encontrado" });
            }

            return await ctx.prisma.$transaction(async (tx) => {
                await tx.supplier.delete({ where: { id: input.id } });

                await tx.auditLog.create({
                    data: {
                        organizationId: ctx.session.orgId!,
                        acao: "DELETE_SUPPLIER",
                        targetId: input.id,
                        idUsuarioResponsavel: ctx.session.userId,
                    }
                });
                return { success: true };
            });
        }),
});
