"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const calculations_1 = require("../../../lib/calculations");
const order_prep_1 = require("../../../lib/order-prep");
const server_1 = require("@trpc/server");
const orderItemSchema = zod_1.z.object({
    serviceTypeId: zod_1.z.string(),
    materialId: zod_1.z.string().optional().nullable(),
    width: zod_1.z.number().default(0),
    height: zod_1.z.number().default(0),
    mlUsed: zod_1.z.number().optional().default(0),
    quantity: zod_1.z.number().min(1),
    unitPrice: zod_1.z.number(), // Override or default price
    wastePercentage: zod_1.z.number().default(0),
    finishings: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        price: zod_1.z.number().default(0),
        cost: zod_1.z.number().default(0),
    })).default([]),
});
const orderSupplySchema = zod_1.z.object({
    supplyId: zod_1.z.string(),
    quantity: zod_1.z.number().min(1).default(1),
});
const orderEquipmentSchema = zod_1.z.object({
    equipmentId: zod_1.z.string(),
    days: zod_1.z.number().min(1),
});
const bcrypt = __importStar(require("bcrypt"));
exports.orderRouter = (0, trpc_1.createTRPCRouter)({
    getAll: (0, trpc_1.checkPermission)("orders", "visualizar")
        .input(zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }).optional())
        .query(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            return [];
        let dateFilter = {};
        if (input?.startDate && input?.endDate) {
            dateFilter = {
                createdAt: {
                    gte: new Date(input.startDate),
                    lte: new Date(input.endDate),
                }
            };
        }
        return ctx.prisma.order.findMany({
            where: {
                organizationId: ctx.session.orgId,
                deletedAt: null,
                ...dateFilter,
            },
            include: {
                aplicador: {
                    select: {
                        id: true,
                        nomeCompleto: true,
                        usuario: true,
                    }
                },
                items: {
                    include: {
                        serviceType: true,
                        material: true,
                    }
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }),
    getDashboardStats: (0, trpc_1.checkPermission)("orders", "visualizar")
        .input(zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }).optional())
        .query(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            return null;
        let dateFilter = {};
        if (input?.startDate && input?.endDate) {
            dateFilter = {
                createdAt: {
                    gte: new Date(input.startDate),
                    lte: new Date(input.endDate),
                }
            };
        }
        const orders = await ctx.prisma.order.findMany({
            where: {
                organizationId: ctx.session.orgId,
                status: { not: "CANCELLED" },
                deletedAt: null,
                ...dateFilter,
            },
        });
        // Calculate aggregated totals based on current dashboard rules
        let totalRevenue = 0;
        let totalCost = 0;
        let totalMaterialCost = 0;
        let totalServiceCommission = 0;
        let grossProfit = 0;
        let projectedRevenue = 0;
        let projectedCost = 0;
        let projectedMaterialCost = 0;
        let projectedServiceCommission = 0;
        let projectedProfit = 0;
        let completedCount = 0;
        orders.forEach(order => {
            if (order.status === "COMPLETED") {
                totalRevenue += Number(order.totalAmount);
                totalCost += Number(order.totalCost);
                totalMaterialCost += Number(order.totalMaterialCost);
                totalServiceCommission += Number(order.totalServiceCommission);
                grossProfit += Number(order.profit);
                completedCount++;
            }
            else if (order.status !== "CANCELLED") {
                projectedRevenue += Number(order.totalAmount);
                projectedCost += Number(order.totalCost);
                projectedMaterialCost += Number(order.totalMaterialCost);
                projectedServiceCommission += Number(order.totalServiceCommission);
                projectedProfit += Number(order.profit);
            }
        });
        const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const projectedMargin = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0;
        return {
            totalRevenue,
            totalCost,
            totalMaterialCost,
            totalServiceCommission,
            grossProfit,
            projectedRevenue,
            projectedCost,
            projectedMaterialCost,
            projectedServiceCommission,
            projectedProfit,
            margin,
            projectedMargin,
            orderCount: orders.filter(o => o.status !== "CANCELLED").length,
            completedCount,
        };
    }),
    getById: (0, trpc_1.checkPermission)("orders", "visualizar")
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .query(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            return null;
        const order = await ctx.prisma.order.findUnique({
            where: { id: input.id },
            include: {
                aplicador: {
                    select: {
                        id: true,
                        nomeCompleto: true,
                    }
                },
                items: {
                    include: {
                        serviceType: true,
                        material: true,
                        finishings: true
                    }
                },
                supplies: {
                    include: { supply: true }
                },
                equipments: {
                    include: { equipment: true }
                }
            }
        });
        if (!order || order.organizationId !== ctx.session.orgId || order.deletedAt) {
            return null;
        }
        return order;
    }),
    calculate: (0, trpc_1.checkPermission)("orders", "visualizar") // Cálculo é parte da visualização/criação
        .input(zod_1.z.object({
        items: zod_1.z.array(orderItemSchema),
        supplies: zod_1.z.array(orderSupplySchema).default([]),
        equipment: zod_1.z.array(orderEquipmentSchema).default([]),
        serviceCommissionRate: zod_1.z.number(),
        discountType: zod_1.z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
        discountValue: zod_1.z.number().optional().default(0),
    }))
        .mutation(async ({ ctx, input: rawInput }) => {
        if (!ctx.session.orgId)
            throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
        const input = rawInput;
        const calcItems = await (0, order_prep_1.prepareOrderCalculationItems)(ctx.prisma, ctx.session.orgId, input.items);
        const suppliesList = input.supplies.length > 0
            ? await ctx.prisma.supply.findMany({ where: { id: { in: input.supplies.map((s) => s.supplyId) } } })
            : [];
        const equipList = input.equipment.length > 0
            ? await ctx.prisma.equipment.findMany({ where: { id: { in: input.equipment.map((e) => e.equipmentId) } } })
            : [];
        return (0, calculations_1.calculateOrder)({
            items: calcItems,
            supplies: input.supplies.map((s) => {
                const found = suppliesList.find(sl => sl.id === s.supplyId);
                return {
                    id: s.supplyId,
                    name: found?.name || "Unknown",
                    unitCost: Number(found?.unitCost || 0),
                    quantity: s.quantity || 1,
                };
            }),
            equipment: input.equipment.map((e) => {
                const found = equipList.find(el => el.id === e.equipmentId);
                return {
                    id: e.equipmentId,
                    name: found?.name || "Unknown",
                    dailyCost: Number(found?.dailyCost || 0),
                    days: e.days,
                };
            }),
            serviceCommissionRate: input.serviceCommissionRate,
            serviceCommissionBase: 'GROSS_REVENUE', // Or fetch from orgSettings if needed.
            discountType: input.discountType,
            discountValue: input.discountValue,
        });
    }),
    create: (0, trpc_1.checkPermission)("orders", "criar")
        .input(zod_1.z.object({
        customerName: zod_1.z.string().min(1),
        aplicadorId: zod_1.z.string().optional().nullable(),
        items: zod_1.z.array(orderItemSchema),
        supplies: zod_1.z.array(orderSupplySchema).default([]),
        equipment: zod_1.z.array(orderEquipmentSchema).default([]),
        serviceCommissionRate: zod_1.z.number().default(0),
        wastePercentage: zod_1.z.number().default(0),
        discountType: zod_1.z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
        discountValue: zod_1.z.number().default(0),
    }))
        .mutation(async ({ ctx, input: rawInput }) => {
        if (!ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
        }
        const input = rawInput;
        // 1. Prepare data for calculation
        const calcItems = await (0, order_prep_1.prepareOrderCalculationItems)(ctx.prisma, ctx.session.orgId, input.items);
        const suppliesList = input.supplies.length > 0
            ? await ctx.prisma.supply.findMany({ where: { id: { in: input.supplies.map((s) => s.supplyId) } } })
            : [];
        const equipList = input.equipment.length > 0
            ? await ctx.prisma.equipment.findMany({ where: { id: { in: input.equipment.map((e) => e.equipmentId) } } })
            : [];
        // 2. Calculate Financials
        const result = (0, calculations_1.calculateOrder)({
            items: calcItems,
            supplies: input.supplies.map((s) => {
                const found = suppliesList.find(sl => sl.id === s.supplyId);
                return {
                    id: s.supplyId,
                    name: found?.name || "Unknown",
                    unitCost: Number(found?.unitCost || 0),
                    quantity: s.quantity || 1,
                };
            }),
            equipment: input.equipment.map((e) => {
                const found = equipList.find(el => el.id === e.equipmentId);
                return {
                    id: e.equipmentId,
                    name: found?.name || "Unknown",
                    dailyCost: Number(found?.dailyCost || 0),
                    days: e.days,
                };
            }),
            serviceCommissionRate: input.serviceCommissionRate,
            serviceCommissionBase: 'GROSS_REVENUE', // Adjust to use org settings if fetched.
            discountType: input.discountType,
            discountValue: input.discountValue,
        });
        // 3. Save to DB
        const order = await ctx.prisma.order.create({
            data: {
                organizationId: ctx.session.orgId,
                customerName: input.customerName,
                aplicadorId: input.aplicadorId,
                creatorId: ctx.session.userId === "admin" ? null : ctx.session.userId,
                totalAmount: result.totalRevenue,
                totalCost: result.totalCost,
                totalMaterialCost: result.totalMaterialCost,
                totalOperationalCost: result.totalOperationalCost,
                totalFinishingCost: result.totalFinishingCost,
                totalSupplyCost: result.totalSupplyCost,
                totalEquipmentCost: result.totalEquipmentCost,
                totalServiceCommission: result.totalServiceCommission,
                profit: result.grossProfit,
                margin: result.margin,
                serviceCommissionRate: input.serviceCommissionRate,
                discountType: input.discountType,
                discountValue: input.discountValue,
                items: {
                    create: input.items.map((item, index) => {
                        const calcItem = result.items[index];
                        return {
                            serviceTypeId: item.serviceTypeId,
                            materialId: item.materialId,
                            width: item.width,
                            height: item.height,
                            mlUsed: item.mlUsed || 0,
                            quantity: item.quantity,
                            wastePercentage: item.wastePercentage,
                            price: calcItem.revenue,
                            cost: calcItem.materialCost,
                            operationalCost: calcItem.operationalCost,
                            finishings: item.finishings.length > 0 ? {
                                create: item.finishings.map((f) => ({
                                    name: f.name,
                                    price: f.price,
                                    cost: f.cost
                                }))
                            } : undefined
                        };
                    })
                },
                supplies: input.supplies.length > 0 ? {
                    create: input.supplies.map((s) => {
                        const found = suppliesList.find(sl => sl.id === s.supplyId);
                        const quantity = s.quantity || 1;
                        const unitCost = Number(found?.unitCost || 0);
                        return {
                            supplyId: s.supplyId,
                            quantity,
                            unitCost,
                            totalCost: quantity * unitCost
                        };
                    })
                } : undefined,
                equipments: input.equipment.length > 0 ? {
                    create: input.equipment.map((e) => {
                        const found = equipList.find(el => el.id === e.equipmentId);
                        const dailyCost = Number(found?.dailyCost || 0);
                        return {
                            equipmentId: e.equipmentId,
                            days: e.days,
                            dailyCost,
                            totalCost: e.days * dailyCost
                        };
                    })
                } : undefined
            },
        });
        await ctx.prisma.orderLog.create({
            data: {
                orderId: order.id,
                userId: ctx.session.userId === "admin" ? null : ctx.session.userId,
                action: "CRIADO",
                newStatus: "PENDING",
                reason: "Ordem criada",
            }
        });
        return order;
    }),
    delete: (0, trpc_1.checkPermission)("orders", "excluir")
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            return null;
        const order = await ctx.prisma.order.findUnique({
            where: { id: input.id },
        });
        if (!order || order.organizationId !== ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "NOT_FOUND" });
        }
        const deletedOrder = await ctx.prisma.order.update({
            where: { id: input.id },
            data: { deletedAt: new Date() }
        });
        await ctx.prisma.orderLog.create({
            data: {
                orderId: input.id,
                userId: ctx.session.userId === "admin" ? null : ctx.session.userId,
                action: "EXCLUIDO",
                reason: "Ordem excluída",
            }
        });
        return deletedOrder;
    }),
    update: (0, trpc_1.checkPermission)("orders", "editar")
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        customerName: zod_1.z.string().min(1),
        aplicadorId: zod_1.z.string().optional().nullable(),
        items: zod_1.z.array(orderItemSchema),
        supplies: zod_1.z.array(orderSupplySchema).default([]),
        equipment: zod_1.z.array(orderEquipmentSchema).default([]),
        serviceCommissionRate: zod_1.z.number().default(0),
        wastePercentage: zod_1.z.number().default(0),
        discountType: zod_1.z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
        discountValue: zod_1.z.number().default(0),
    }))
        .mutation(async ({ ctx, input: rawInput }) => {
        if (!ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
        }
        const input = rawInput;
        // 1. Verify ownership
        const existingOrder = await ctx.prisma.order.findUnique({
            where: { id: input.id },
        });
        if (!existingOrder || existingOrder.organizationId !== ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "NOT_FOUND" });
        }
        // 2. Prepare data for calculation
        const calcItems = await (0, order_prep_1.prepareOrderCalculationItems)(ctx.prisma, ctx.session.orgId, input.items);
        const suppliesList = input.supplies.length > 0
            ? await ctx.prisma.supply.findMany({ where: { id: { in: input.supplies.map((s) => s.supplyId) } } })
            : [];
        const equipList = input.equipment.length > 0
            ? await ctx.prisma.equipment.findMany({ where: { id: { in: input.equipment.map((e) => e.equipmentId) } } })
            : [];
        // 3. Calculate Financials
        const result = (0, calculations_1.calculateOrder)({
            items: calcItems,
            supplies: input.supplies.map((s) => {
                const found = suppliesList.find(sl => sl.id === s.supplyId);
                return {
                    id: s.supplyId,
                    name: found?.name || "Unknown",
                    unitCost: Number(found?.unitCost || 0),
                    quantity: s.quantity || 1,
                };
            }),
            equipment: input.equipment.map((e) => {
                const found = equipList.find(el => el.id === e.equipmentId);
                return {
                    id: e.equipmentId,
                    name: found?.name || "Unknown",
                    dailyCost: Number(found?.dailyCost || 0),
                    days: e.days,
                };
            }),
            serviceCommissionRate: input.serviceCommissionRate,
            serviceCommissionBase: 'GROSS_REVENUE',
            discountType: input.discountType,
            discountValue: input.discountValue,
        });
        // 4. Update DB
        return ctx.prisma.$transaction(async (tx) => {
            // We use nested deleteMany for cleanup
            return tx.order.update({
                where: { id: input.id },
                data: {
                    customerName: input.customerName,
                    aplicadorId: input.aplicadorId,
                    totalAmount: result.totalRevenue,
                    totalCost: result.totalCost,
                    totalMaterialCost: result.totalMaterialCost,
                    totalOperationalCost: result.totalOperationalCost,
                    totalFinishingCost: result.totalFinishingCost,
                    totalSupplyCost: result.totalSupplyCost,
                    totalEquipmentCost: result.totalEquipmentCost,
                    totalServiceCommission: result.totalServiceCommission,
                    profit: result.grossProfit,
                    margin: result.margin,
                    serviceCommissionRate: input.serviceCommissionRate,
                    discountType: input.discountType,
                    discountValue: input.discountValue,
                    items: {
                        deleteMany: {},
                        create: input.items.map((item, index) => {
                            const calcItem = result.items[index];
                            return {
                                serviceTypeId: item.serviceTypeId,
                                materialId: item.materialId,
                                width: item.width,
                                height: item.height,
                                mlUsed: item.mlUsed || 0,
                                quantity: item.quantity,
                                wastePercentage: item.wastePercentage,
                                price: calcItem.revenue,
                                cost: calcItem.materialCost,
                                operationalCost: calcItem.operationalCost,
                                finishings: item.finishings.length > 0 ? {
                                    create: item.finishings.map((f) => ({
                                        name: f.name,
                                        price: f.price,
                                        cost: f.cost
                                    }))
                                } : undefined
                            };
                        })
                    },
                    supplies: {
                        deleteMany: {},
                        create: input.supplies.map((s) => {
                            const found = suppliesList.find(sl => sl.id === s.supplyId);
                            const quantity = s.quantity || 1;
                            const unitCost = Number(found?.unitCost || 0);
                            return {
                                supplyId: s.supplyId,
                                quantity,
                                unitCost,
                                totalCost: quantity * unitCost
                            };
                        })
                    },
                    equipments: {
                        deleteMany: {},
                        create: input.equipment.map((e) => {
                            const found = equipList.find(el => el.id === e.equipmentId);
                            const dailyCost = Number(found?.dailyCost || 0);
                            return {
                                equipmentId: e.equipmentId,
                                days: e.days,
                                dailyCost,
                                totalCost: e.days * dailyCost
                            };
                        })
                    }
                },
            });
        });
    }),
    updateStatus: (0, trpc_1.checkPermission)("orders", "editar")
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        status: zod_1.z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
        adminPassword: zod_1.z.string().optional(),
        reason: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
        }
        const order = await ctx.prisma.order.findUnique({
            where: { id: input.id },
            include: { items: true }
        });
        if (!order || order.organizationId !== ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "NOT_FOUND" });
        }
        const isLockedStatus = order.status === "COMPLETED" || order.status === "CANCELLED";
        if (isLockedStatus && order.status !== input.status) {
            if (ctx.session.perfil !== "ADMIN") {
                throw new server_1.TRPCError({
                    code: "FORBIDDEN",
                    message: "Apenas administradores podem alterar o status de ordens finalizadas ou canceladas."
                });
            }
            if (!input.adminPassword) {
                throw new server_1.TRPCError({
                    code: "BAD_REQUEST",
                    message: "Senha de administrador requerida para esta ação."
                });
            }
            // Verify password
            const adminUser = await ctx.prisma.user.findUnique({ where: { id: ctx.session.userId } });
            if (!adminUser)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
            const isPasswordValid = await bcrypt.compare(input.adminPassword, adminUser.senhaHash);
            if (!isPasswordValid) {
                throw new server_1.TRPCError({ code: "FORBIDDEN", message: "Senha de administrador incorreta." });
            }
        }
        // Logic for stock deduction
        if (input.status === "COMPLETED" && order.status !== "COMPLETED") {
            await ctx.prisma.$transaction(async (tx) => {
                for (const item of order.items) {
                    // Main material deduction
                    if (item.materialId) {
                        const material = await tx.material.findUnique({ where: { id: item.materialId } });
                        let deduction = 0;
                        if (material?.category === "LIQUID") {
                            deduction = Number(item.mlUsed) * item.quantity;
                        }
                        else {
                            const wasteMult = 1 + (Number(item.wastePercentage) / 100);
                            deduction = Number(item.width) * Number(item.height) * item.quantity * wasteMult;
                        }
                        if (deduction > 0) {
                            await tx.material.update({
                                where: { id: item.materialId },
                                data: {
                                    stockAmount: {
                                        decrement: deduction
                                    }
                                }
                            });
                        }
                    }
                }
            });
        }
        const updatedOrder = await ctx.prisma.order.update({
            where: { id: input.id },
            data: { status: input.status }
        });
        if (order.status !== input.status) {
            await ctx.prisma.orderLog.create({
                data: {
                    orderId: updatedOrder.id,
                    userId: ctx.session.userId === "admin" ? null : ctx.session.userId,
                    action: "ALTERAR_STATUS",
                    previousStatus: order.status,
                    newStatus: input.status,
                    reason: input.reason ? input.reason : (isLockedStatus ? "Alteração feita por ADMIN em ordem bloqueada" : "Atualização normal"),
                }
            });
        }
        return updatedOrder;
    }),
    getLogs: (0, trpc_1.checkPermission)("orders", "visualizar").query(async ({ ctx }) => {
        if (!ctx.session.orgId)
            return [];
        return ctx.prisma.orderLog.findMany({
            where: {
                order: {
                    organizationId: ctx.session.orgId,
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        nomeCompleto: true,
                        usuario: true,
                    }
                },
                order: {
                    select: {
                        id: true,
                        creator: {
                            select: { id: true, nomeCompleto: true, usuario: true }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }),
    getServiceCommissionReport: (0, trpc_1.checkPermission)("orders", "visualizar")
        .input(zod_1.z.object({
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }).optional())
        .query(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            return [];
        const applicators = await ctx.prisma.user.findMany({
            where: {
                organizationId: ctx.session.orgId,
            },
        });
        let dateFilter = {};
        if (input?.startDate && input?.endDate) {
            dateFilter = {
                createdAt: {
                    gte: new Date(input.startDate),
                    lte: new Date(input.endDate),
                }
            };
        }
        const orders = await ctx.prisma.order.findMany({
            where: {
                organizationId: ctx.session.orgId,
                status: "COMPLETED",
                aplicadorId: { not: null },
                deletedAt: null,
                ...dateFilter,
            },
        });
        return applicators.map(sp => {
            const spOrders = orders.filter(o => o.aplicadorId === sp.id);
            const totalRevenue = spOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
            const totalServiceCommission = spOrders.reduce((acc, o) => acc + Number(o.totalServiceCommission), 0);
            return {
                id: sp.id,
                name: sp.nomeCompleto,
                username: sp.usuario,
                orderCount: spOrders.length,
                totalRevenue,
                totalServiceCommission,
            };
        }).filter(r => r.orderCount > 0);
    }),
});
