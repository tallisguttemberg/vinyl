import { z } from "zod";
import { createTRPCRouter, checkPermission, publicProcedure } from "../trpc";

export const organizationSettingsRouter = createTRPCRouter({
    getPublicSettings: publicProcedure.query(async ({ ctx }) => {
        return ctx.prisma.organizationSettings.findUnique({
            where: { organizationId: "default" },
            select: { businessName: true, logoUrl: true, logoDarkUrl: true }
        });
    }),
    getSettings: checkPermission("settings", "visualizar").query(async ({ ctx }) => {
        return ctx.prisma.organizationSettings.findUnique({
            where: { organizationId: ctx.session.orgId! },
        });
    }),

    updateSettings: checkPermission("settings", "editar")
        .input(
            z.object({
                businessName: z.string().optional(),
                address: z.string().optional(),
                phone: z.string().optional(),
                email: z.string().email().optional().or(z.literal("")),
                taxId: z.string().optional(),
                logoUrl: z.string().optional(),
                logoDarkUrl: z.string().optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            return ctx.prisma.organizationSettings.upsert({
                where: { organizationId: ctx.session.orgId! },
                update: input,
                create: {
                    organizationId: ctx.session.orgId!,
                    ...input,
                },
            });
        }),
});
