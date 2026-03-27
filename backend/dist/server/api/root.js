"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const trpc_1 = require("./trpc");
const material_1 = require("./routers/material");
const serviceType_1 = require("./routers/serviceType");
const order_1 = require("./routers/order");
const organizationSettings_1 = require("./routers/organizationSettings");
const user_1 = require("./routers/user");
const financial_1 = require("./routers/financial");
const supply_1 = require("./routers/supply");
const equipment_1 = require("./routers/equipment");
const supplier_1 = require("./routers/supplier");
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
exports.appRouter = (0, trpc_1.createTRPCRouter)({
    material: material_1.materialRouter,
    serviceType: serviceType_1.serviceTypeRouter,
    order: order_1.orderRouter,
    organizationSettings: organizationSettings_1.organizationSettingsRouter,
    user: user_1.userRouter,
    financial: financial_1.financialRouter,
    supply: supply_1.supplyRouter,
    equipment: equipment_1.equipmentRouter,
    supplier: supplier_1.supplierRouter,
});
