import { createTRPCRouter, publicProcedure } from "./trpc";
import { materialRouter } from "./routers/material";
import { serviceTypeRouter } from "./routers/serviceType";
import { orderRouter } from "./routers/order";
import { organizationSettingsRouter } from "./routers/organizationSettings";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    material: materialRouter,
    serviceType: serviceTypeRouter,
    order: orderRouter,
    organizationSettings: organizationSettingsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
