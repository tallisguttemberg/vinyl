"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceTypeRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const server_1 = require("@trpc/server");
exports.serviceTypeRouter = (0, trpc_1.createTRPCRouter)({
    getAll: (0, trpc_1.checkPermission)("services", "visualizar").query(async ({ ctx }) => {
        if (!ctx.session.orgId)
            return [];
        return ctx.prisma.serviceType.findMany({
            where: {
                organizationId: ctx.session.orgId,
            },
            orderBy: {
                name: "asc",
            },
        });
    }),
    create: (0, trpc_1.checkPermission)("services", "criar")
        .input(zod_1.z.object({
        name: zod_1.z.string().min(1),
        billingType: zod_1.z.enum(["FIXED", "PER_M2"]),
        defaultPrice: zod_1.z.number().optional(),
        operationalCostPerM2: zod_1.z.number().min(0).optional().default(0),
        wastePercentage: zod_1.z.number().min(0).optional().default(0),
    }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
        }
        return ctx.prisma.serviceType.create({
            data: {
                organizationId: ctx.session.orgId,
                name: input.name,
                billingType: input.billingType,
                defaultPrice: input.defaultPrice,
                operationalCostPerM2: input.operationalCostPerM2,
                wastePercentage: input.wastePercentage,
            },
        });
    }),
    delete: (0, trpc_1.checkPermission)("services", "excluir")
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            return null;
        const serviceType = await ctx.prisma.serviceType.findUnique({
            where: { id: input.id },
        });
        if (!serviceType || serviceType.organizationId !== ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "NOT_FOUND" });
        }
        return ctx.prisma.serviceType.delete({
            where: { id: input.id },
        });
    }),
    update: (0, trpc_1.checkPermission)("services", "editar")
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        name: zod_1.z.string().min(1),
        billingType: zod_1.z.enum(["FIXED", "PER_M2"]),
        defaultPrice: zod_1.z.number().optional(),
        operationalCostPerM2: zod_1.z.number().min(0).optional().default(0),
        wastePercentage: zod_1.z.number().min(0).optional().default(0),
    }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
        }
        const serviceType = await ctx.prisma.serviceType.findUnique({
            where: { id: input.id },
        });
        if (!serviceType || serviceType.organizationId !== ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "NOT_FOUND" });
        }
        return ctx.prisma.serviceType.update({
            where: { id: input.id },
            data: {
                name: input.name,
                billingType: input.billingType,
                defaultPrice: input.defaultPrice,
                operationalCostPerM2: input.operationalCostPerM2,
                wastePercentage: input.wastePercentage,
            },
        });
    }),
});
