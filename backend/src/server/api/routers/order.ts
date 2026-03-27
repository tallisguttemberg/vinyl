import { z } from "zod";
import { createTRPCRouter, checkPermission } from "../trpc";
import { calculateOrder } from "../../../lib/calculations";
import { prepareOrderCalculationItems } from "../../../lib/order-prep";
import { TRPCError } from "@trpc/server";

const orderItemSchema = z.object({
    serviceTypeId: z.string(),
    materialId: z.string().optional().nullable(),
    width: z.number().default(0),
    height: z.number().default(0),
    mlUsed: z.number().optional().default(0),
    quantity: z.number().min(1),
    unitPrice: z.number(), // Override or default price
    wastePercentage: z.number().default(0),
    finishings: z.array(z.object({
        name: z.string(),
        price: z.number().default(0),
        cost: z.number().default(0),
    })).default([]),
});

const orderSupplySchema = z.object({
    supplyId: z.string(),
    quantity: z.number().min(1).default(1),
});

const orderEquipmentSchema = z.object({
    equipmentId: z.string(),
    days: z.number().min(1),
});

type OrderItemInput = z.infer<typeof orderItemSchema>;
type OrderSupplyInput = z.infer<typeof orderSupplySchema>;
type OrderEquipmentInput = z.infer<typeof orderEquipmentSchema>;

import * as bcrypt from "bcrypt";

export const orderRouter = createTRPCRouter({
    getAll: checkPermission("orders", "visualizar")
        .input(z.object({
            startDate: z.string().optional(),
            endDate: z.string().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
        if (!ctx.session.orgId) return [];

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

    getDashboardStats: checkPermission("orders", "visualizar")
        .input(z.object({
            startDate: z.string().optional(),
            endDate: z.string().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
        if (!ctx.session.orgId) return null;

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
            } else if (order.status !== "CANCELLED") {
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

    getById: checkPermission("orders", "visualizar")
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            if (!ctx.session.orgId) return null;

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

    calculate: checkPermission("orders", "visualizar") // Cálculo é parte da visualização/criação
        .input(
            z.object({
                items: z.array(orderItemSchema),
                supplies: z.array(orderSupplySchema).default([]),
                equipment: z.array(orderEquipmentSchema).default([]),
                serviceCommissionRate: z.number(),
                discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
                discountValue: z.number().optional().default(0),
            })
        )
        .mutation(async ({ ctx, input: rawInput }) => {
            if (!ctx.session.orgId) throw new TRPCError({ code: "UNAUTHORIZED" });
            const input = rawInput as any;

            const calcItems = await prepareOrderCalculationItems(
                ctx.prisma as any,
                ctx.session.orgId,
                input.items
            );

            const suppliesList = input.supplies.length > 0 
                ? await ctx.prisma.supply.findMany({ where: { id: { in: input.supplies.map((s: OrderSupplyInput) => s.supplyId) } } })
                : [];
            
            const equipList = input.equipment.length > 0
                ? await ctx.prisma.equipment.findMany({ where: { id: { in: input.equipment.map((e: OrderEquipmentInput) => e.equipmentId) } } })
                : [];

            return calculateOrder({
                items: calcItems,
                supplies: input.supplies.map((s: OrderSupplyInput) => {
                    const found = suppliesList.find(sl => sl.id === s.supplyId);
                    return {
                        id: s.supplyId,
                        name: found?.name || "Unknown",
                        unitCost: Number(found?.unitCost || 0),
                        quantity: s.quantity || 1,
                    };
                }),
                equipment: input.equipment.map((e: OrderEquipmentInput) => {
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

    create: checkPermission("orders", "criar")
        .input(
            z.object({
                customerName: z.string().min(1),
                aplicadorId: z.string().optional().nullable(),
                items: z.array(orderItemSchema),
                supplies: z.array(orderSupplySchema).default([]),
                equipment: z.array(orderEquipmentSchema).default([]),
                serviceCommissionRate: z.number().default(0),
                wastePercentage: z.number().default(0),
                discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
                discountValue: z.number().default(0),
            })
        )
        .mutation(async ({ ctx, input: rawInput }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }
            const input = rawInput as any;

            // 1. Prepare data for calculation
            const calcItems = await prepareOrderCalculationItems(
                ctx.prisma as any,
                ctx.session.orgId,
                input.items
            );

            const suppliesList = input.supplies.length > 0 
                ? await ctx.prisma.supply.findMany({ where: { id: { in: input.supplies.map((s: OrderSupplyInput) => s.supplyId) } } })
                : [];
            
            const equipList = input.equipment.length > 0
                ? await ctx.prisma.equipment.findMany({ where: { id: { in: input.equipment.map((e: OrderEquipmentInput) => e.equipmentId) } } })
                : [];

            // 2. Calculate Financials
            const result = calculateOrder({
                items: calcItems,
                supplies: input.supplies.map((s: OrderSupplyInput) => {
                    const found = suppliesList.find(sl => sl.id === s.supplyId);
                    return {
                        id: s.supplyId,
                        name: found?.name || "Unknown",
                        unitCost: Number(found?.unitCost || 0),
                        quantity: s.quantity || 1,
                    };
                }),
                equipment: input.equipment.map((e: OrderEquipmentInput) => {
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
                        create: input.items.map((item: OrderItemInput, index: number) => {
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
                                    create: item.finishings.map((f: any) => ({
                                        name: f.name,
                                        price: f.price,
                                        cost: f.cost
                                    }))
                                } : undefined
                            };
                        })
                    },
                    supplies: input.supplies.length > 0 ? {
                        create: input.supplies.map((s: OrderSupplyInput) => {
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
                        create: input.equipment.map((e: OrderEquipmentInput) => {
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

            // Create Financial Transaction
            await ctx.prisma.financialTransaction.create({
                data: {
                    organizationId: ctx.session.orgId,
                    type: "RECEIVABLE",
                    status: "PENDING",
                    description: `OS #${order.id.slice(-6).toUpperCase()} - ${input.customerName}`,
                    amount: result.totalRevenue,
                    dueDate: new Date(),
                    category: "Venda de Serviços",
                    orderId: order.id,
                    entityName: input.customerName,
                }
            });

            return order;
        }),

    delete: checkPermission("orders", "excluir")
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) return null;

            const order = await ctx.prisma.order.findUnique({
                where: { id: input.id },
            });

            if (!order || order.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND" });
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

            await ctx.prisma.financialTransaction.updateMany({
                where: { orderId: input.id },
                data: { status: "CANCELLED" }
            });

            return deletedOrder;
        }),

    update: checkPermission("orders", "editar")
        .input(
            z.object({
                id: z.string(),
                customerName: z.string().min(1),
                aplicadorId: z.string().optional().nullable(),
                items: z.array(orderItemSchema),
                supplies: z.array(orderSupplySchema).default([]),
                equipment: z.array(orderEquipmentSchema).default([]),
                serviceCommissionRate: z.number().default(0),
                wastePercentage: z.number().default(0),
                discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
                discountValue: z.number().default(0),
            })
        )
        .mutation(async ({ ctx, input: rawInput }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }
            const input = rawInput as any;

            // 1. Verify ownership
            const existingOrder = await ctx.prisma.order.findUnique({
                where: { id: input.id },
            });

            if (!existingOrder || existingOrder.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            // 2. Prepare data for calculation
            const calcItems = await prepareOrderCalculationItems(
                ctx.prisma as any,
                ctx.session.orgId,
                input.items
            );

            const suppliesList = input.supplies.length > 0 
                ? await ctx.prisma.supply.findMany({ where: { id: { in: input.supplies.map((s: OrderSupplyInput) => s.supplyId) } } })
                : [];
            
            const equipList = input.equipment.length > 0
                ? await ctx.prisma.equipment.findMany({ where: { id: { in: input.equipment.map((e: OrderEquipmentInput) => e.equipmentId) } } })
                : [];

            // 3. Calculate Financials
            const result = calculateOrder({
                items: calcItems,
                supplies: input.supplies.map((s: OrderSupplyInput) => {
                    const found = suppliesList.find(sl => sl.id === s.supplyId);
                    return {
                        id: s.supplyId,
                        name: found?.name || "Unknown",
                        unitCost: Number(found?.unitCost || 0),
                        quantity: s.quantity || 1,
                    };
                }),
                equipment: input.equipment.map((e: OrderEquipmentInput) => {
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

                const mappedOrder = await tx.order.update({
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
                            create: input.items.map((item: OrderItemInput, index: number) => {
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
                                        create: item.finishings.map((f: any) => ({
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
                            create: input.supplies.map((s: OrderSupplyInput) => {
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
                            create: input.equipment.map((e: OrderEquipmentInput) => {
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

                await tx.financialTransaction.updateMany({
                    where: { orderId: input.id },
                    data: {
                        amount: result.totalRevenue,
                        description: `OS #${input.id.slice(-6).toUpperCase()} - ${input.customerName}`,
                        entityName: input.customerName,
                    }
                });

                return mappedOrder;
            });
        }),

    updateStatus: checkPermission("orders", "editar")
        .input(z.object({
            id: z.string(),
            status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
            adminPassword: z.string().optional(),
            reason: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            const order = await ctx.prisma.order.findUnique({
                where: { id: input.id },
                include: { items: true }
            });

            if (!order || order.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            const isLockedStatus = order.status === "COMPLETED" || order.status === "CANCELLED";
            
            if (isLockedStatus && order.status !== input.status) {
                if (ctx.session.perfil !== "ADMIN") {
                    throw new TRPCError({ 
                        code: "FORBIDDEN", 
                        message: "Apenas administradores podem alterar o status de ordens finalizadas ou canceladas." 
                    });
                }
                
                if (!input.adminPassword) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: "Senha de administrador requerida para esta ação."
                    });
                }

                // Verify password
                const adminUser = await ctx.prisma.user.findUnique({ where: { id: ctx.session.userId } });
                if (!adminUser) throw new TRPCError({ code: "UNAUTHORIZED" });
                
                const isPasswordValid = await bcrypt.compare(input.adminPassword, adminUser.senhaHash);
                if (!isPasswordValid) {
                    throw new TRPCError({ code: "FORBIDDEN", message: "Senha de administrador incorreta." });
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
                            } else {
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

            if (input.status === "CANCELLED" && order.status !== "CANCELLED") {
                await ctx.prisma.financialTransaction.updateMany({
                    where: { orderId: input.id, status: { not: "PAID" } },
                    data: { status: "CANCELLED" }
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

    getLogs: checkPermission("orders", "visualizar").query(async ({ ctx }) => {
        if (!ctx.session.orgId) return [];

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

    getServiceCommissionReport: checkPermission("orders", "visualizar")
        .input(z.object({
            startDate: z.string().optional(),
            endDate: z.string().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
        if (!ctx.session.orgId) return [];

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

