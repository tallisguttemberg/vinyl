"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supplierRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const server_1 = require("@trpc/server");
exports.supplierRouter = (0, trpc_1.createTRPCRouter)({
    getAll: (0, trpc_1.checkPermission)("materials", "visualizar").query(async ({ ctx }) => {
        if (!ctx.session.orgId)
            return [];
        return await ctx.prisma.supplier.findMany({
            where: { organizationId: ctx.session.orgId },
            orderBy: { name: "asc" },
        });
    }),
    getById: (0, trpc_1.checkPermission)("materials", "visualizar")
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .query(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            return null;
        return await ctx.prisma.supplier.findUnique({
            where: { id: input.id },
        });
    }),
    create: (0, trpc_1.checkPermission)("materials", "criar")
        .input(zod_1.z.object({
        name: zod_1.z.string().min(1, "Nome é obrigatório"),
        document: zod_1.z.string().optional(),
        email: zod_1.z.string().email("E-mail inválido").optional().or(zod_1.z.literal("")),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "Organização não selecionada" });
        }
        return await ctx.prisma.$transaction(async (tx) => {
            const supplier = await tx.supplier.create({
                data: {
                    organizationId: ctx.session.orgId,
                    name: input.name,
                    document: input.document,
                    email: input.email || null,
                    phone: input.phone,
                    address: input.address,
                },
            });
            await tx.auditLog.create({
                data: {
                    organizationId: ctx.session.orgId,
                    acao: "CREATE_SUPPLIER",
                    targetId: supplier.id,
                    idUsuarioResponsavel: ctx.session.userId,
                }
            });
            return supplier;
        });
    }),
    update: (0, trpc_1.checkPermission)("materials", "editar")
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string().min(1, "Nome é obrigatório"),
        document: zod_1.z.string().optional(),
        email: zod_1.z.string().email("E-mail inválido").optional().or(zod_1.z.literal("")),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
        const existing = await ctx.prisma.supplier.findUnique({ where: { id: input.id } });
        if (!existing || existing.organizationId !== ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Fornecedor não encontrado" });
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
                    organizationId: ctx.session.orgId,
                    acao: "UPDATE_SUPPLIER",
                    targetId: supplier.id,
                    idUsuarioResponsavel: ctx.session.userId,
                }
            });
            return supplier;
        });
    }),
    delete: (0, trpc_1.checkPermission)("materials", "excluir")
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
        const existing = await ctx.prisma.supplier.findUnique({ where: { id: input.id } });
        if (!existing || existing.organizationId !== ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Fornecedor não encontrado" });
        }
        return await ctx.prisma.$transaction(async (tx) => {
            await tx.supplier.delete({ where: { id: input.id } });
            await tx.auditLog.create({
                data: {
                    organizationId: ctx.session.orgId,
                    acao: "DELETE_SUPPLIER",
                    targetId: input.id,
                    idUsuarioResponsavel: ctx.session.userId,
                }
            });
            return { success: true };
        });
    }),
});
