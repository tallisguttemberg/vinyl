import { createTRPCRouter, publicProcedure } from "./trpc";
import { materialRouter } from "./routers/material";
import { serviceTypeRouter } from "./routers/serviceType";
import { orderRouter } from "./routers/order";
import { organizationSettingsRouter } from "./routers/organizationSettings";
import { userRouter } from "./routers/user";
import { financialRouter } from "./routers/financial";
import { supplyRouter } from "./routers/supply";
import { equipmentRouter } from "./routers/equipment";
import { supplierRouter } from "./routers/supplier";
import { customerRouter } from "./routers/customer";


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
    user: userRouter,
    financial: financialRouter,
    supply: supplyRouter,
    equipment: equipmentRouter,
    supplier: supplierRouter,
    customer: customerRouter,

});

// export type definition of API
export type AppRouter = typeof appRouter;
