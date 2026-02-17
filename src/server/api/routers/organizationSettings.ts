import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const organizationSettingsRouter = createTRPCRouter({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
        return ctx.prisma.organizationSettings.findUnique({
            where: { organizationId: ctx.auth.orgId! },
        });
    }),

    updateSettings: protectedProcedure
        .input(
            z.object({
                businessName: z.string().optional(),
                address: z.string().optional(),
                phone: z.string().optional(),
                email: z.string().email().optional().or(z.literal("")),
                taxId: z.string().optional(),
                // logoUrl: z.string().url().optional(), // Omitting for now as file upload is complex
            }),
        )
        .mutation(async ({ ctx, input }) => {
            return ctx.prisma.organizationSettings.upsert({
                where: { organizationId: ctx.auth.orgId! },
                update: input,
                create: {
                    organizationId: ctx.auth.orgId!,
                    ...input,
                },
            });
        }),
});
