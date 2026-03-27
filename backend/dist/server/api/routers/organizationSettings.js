"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.organizationSettingsRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
exports.organizationSettingsRouter = (0, trpc_1.createTRPCRouter)({
    getPublicSettings: trpc_1.publicProcedure.query(async ({ ctx }) => {
        return ctx.prisma.organizationSettings.findUnique({
            where: { organizationId: "default" },
            select: { businessName: true, logoUrl: true, logoDarkUrl: true }
        });
    }),
    getSettings: (0, trpc_1.checkPermission)("settings", "visualizar").query(async ({ ctx }) => {
        return ctx.prisma.organizationSettings.findUnique({
            where: { organizationId: ctx.session.orgId },
        });
    }),
    updateSettings: (0, trpc_1.checkPermission)("settings", "editar")
        .input(zod_1.z.object({
        businessName: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional().or(zod_1.z.literal("")),
        taxId: zod_1.z.string().optional(),
        logoUrl: zod_1.z.string().optional(),
        logoDarkUrl: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        return ctx.prisma.organizationSettings.upsert({
            where: { organizationId: ctx.session.orgId },
            update: input,
            create: {
                organizationId: ctx.session.orgId,
                ...input,
            },
        });
    }),
});
