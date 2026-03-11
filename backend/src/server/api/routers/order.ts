import { z } from "zod";
import { createTRPCRouter, checkPermission } from "../trpc";
import { calculateOrder } from "../../../lib/calculations";
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

import * as bcrypt from "bcrypt";

export const orderRouter = createTRPCRouter({
    getAll: checkPermission("orders", "visualizar").query(async ({ ctx }) => {
        if (!ctx.session.orgId) return [];

        return ctx.prisma.order.findMany({
            where: {
                organizationId: ctx.session.orgId,
                deletedAt: null,
            },
            include: {
                vendedor: {
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

    getDashboardStats: checkPermission("orders", "visualizar").query(async ({ ctx }) => {
        if (!ctx.session.orgId) return null;

        const orders = await ctx.prisma.order.findMany({
            where: {
                organizationId: ctx.session.orgId,
                status: { not: "CANCELLED" },
                deletedAt: null,
            },
        });

        // Calculate aggregated totals based on current dashboard rules
        let totalRevenue = 0;
        let totalCost = 0;
        let totalMaterialCost = 0;
        let totalCommission = 0;
        let grossProfit = 0;

        let projectedRevenue = 0;
        let projectedCost = 0;
        let projectedMaterialCost = 0;
        let projectedCommission = 0;
        let projectedProfit = 0;
        
        let completedCount = 0;

        orders.forEach(order => {
            if (order.status === "COMPLETED") {
                totalRevenue += Number(order.totalAmount);
                totalCost += Number(order.totalCost);
                totalMaterialCost += Number(order.totalMaterialCost);
                totalCommission += Number(order.totalCommission);
                grossProfit += Number(order.profit);
                completedCount++;
            } else if (order.status !== "CANCELLED") {
                projectedRevenue += Number(order.totalAmount);
                projectedCost += Number(order.totalCost);
                projectedMaterialCost += Number(order.totalMaterialCost);
                projectedCommission += Number(order.totalCommission);
                projectedProfit += Number(order.profit);
            }
        });

        const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const projectedMargin = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0;

        return {
            totalRevenue,
            totalCost,
            totalMaterialCost,
            totalCommission,
            grossProfit,
            projectedRevenue,
            projectedCost,
            projectedMaterialCost,
            projectedCommission,
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
                    vendedor: {
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
                commissionRate: z.number(),
                discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
                discountValue: z.number().optional().default(0),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const materials = await ctx.prisma.material.findMany({
                where: {
                    id: { in: input.items.map(i => i.materialId).filter((id): id is string => !!id) },
                }
            });

            const serviceTypes = await ctx.prisma.serviceType.findMany({
                where: {
                    id: { in: input.items.map(i => i.serviceTypeId) }
                }
            });

            // Find Varnish Material for cost calculation
            const varnishMaterial = await ctx.prisma.material.findFirst({
                where: {
                    organizationId: ctx.session.orgId,
                    name: { contains: "Verniz", mode: "insensitive" },
                    category: "LIQUID"
                }
            });

            const calcItems = input.items.map(item => {
                const material = materials.find(m => m.id === item.materialId);
                const serviceType = serviceTypes.find(st => st.id === item.serviceTypeId);

                return {
                    width: item.width,
                    height: item.height,
                    mlUsed: item.mlUsed,
                    quantity: item.quantity,
                    billingType: serviceType?.billingType || 'FIXED', // Fallback
                    unitPrice: item.unitPrice,
                    wastePercentage: item.wastePercentage || Number(serviceType?.wastePercentage || 0),
                    operationalCostPerM2: Number(serviceType?.operationalCostPerM2 || 0),
                    materialStop: material ? {
                        costPerSqMeter: Number(material.costPerSqMeter),
                        costPerMl: Number(material.costPerMl)
                    } : undefined,
                    finishings: item.finishings,
                };
            });

            return calculateOrder({
                items: calcItems,
                commissionRate: input.commissionRate,
                commissionBase: 'GROSS_REVENUE', // Or fetch from orgSettings if needed.
                discountType: input.discountType,
                discountValue: input.discountValue,
            });
        }),

    create: checkPermission("orders", "criar")
        .input(
            z.object({
                customerName: z.string().min(1),
                vendedorId: z.string().optional().nullable(),
                items: z.array(orderItemSchema),
                commissionRate: z.number().default(0),
                wastePercentage: z.number().default(0),
                discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
                discountValue: z.number().default(0),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            // 1. Prepare data for calculation
            const materials = await ctx.prisma.material.findMany({
                where: {
                    id: { in: input.items.map(i => i.materialId).filter((id): id is string => !!id) },
                    organizationId: ctx.session.orgId, // Ensure materials belong to org
                }
            });

            const serviceTypes = await ctx.prisma.serviceType.findMany({
                where: {
                    id: { in: input.items.map(i => i.serviceTypeId) },
                    organizationId: ctx.session.orgId,
                }
            });

            // Find Varnish Material for cost calculation
            const varnishMaterial = await ctx.prisma.material.findFirst({
                where: {
                    organizationId: ctx.session.orgId,
                    name: { contains: "Verniz", mode: "insensitive" },
                    category: "LIQUID"
                }
            });

            const calcItems = input.items.map(item => {
                const material = materials.find(m => m.id === item.materialId);
                const serviceType = serviceTypes.find(st => st.id === item.serviceTypeId);

                if (!serviceType) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Service Type ${item.serviceTypeId} not found or missing access`
                    });
                }

                return {
                    width: item.width,
                    height: item.height,
                    mlUsed: item.mlUsed,
                    quantity: item.quantity,
                    billingType: serviceType.billingType,
                    unitPrice: item.unitPrice,
                    wastePercentage: item.wastePercentage || Number(serviceType.wastePercentage || 0),
                    operationalCostPerM2: Number(serviceType.operationalCostPerM2 || 0),
                    materialStop: material ? {
                        costPerSqMeter: Number(material.costPerSqMeter),
                        costPerMl: Number(material.costPerMl)
                    } : undefined,
                    finishings: item.finishings,
                };
            });

            // 2. Calculate Financials
            const result = calculateOrder({
                items: calcItems,
                commissionRate: input.commissionRate,
                commissionBase: 'GROSS_REVENUE', // Adjust to use org settings if fetched.
                discountType: input.discountType,
                discountValue: input.discountValue,
            });

            // 3. Save to DB
            const order = await ctx.prisma.order.create({
                data: {
                    organizationId: ctx.session.orgId,
                    customerName: input.customerName,
                    vendedorId: input.vendedorId,
                    creatorId: ctx.session.userId === "admin" ? null : ctx.session.userId,
                    totalAmount: result.totalRevenue,
                    totalCost: result.totalCost,
                    totalMaterialCost: result.totalMaterialCost,
                    totalOperationalCost: result.totalOperationalCost,
                    totalFinishingCost: result.totalFinishingCost,
                    totalCommission: result.totalCommission,
                    profit: result.grossProfit,
                    margin: result.margin,
                    commissionRate: input.commissionRate,
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
                                    create: item.finishings.map(f => ({
                                        name: f.name,
                                        price: f.price,
                                        cost: f.cost
                                    }))
                                } : undefined
                            };
                        })
                    }
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

            return deletedOrder;
        }),

    update: checkPermission("orders", "editar")
        .input(
            z.object({
                id: z.string(),
                customerName: z.string().min(1),
                vendedorId: z.string().optional().nullable(),
                items: z.array(orderItemSchema),
                commissionRate: z.number().default(0),
                wastePercentage: z.number().default(0),
                discountType: z.enum(["PERCENTAGE", "FIXED"]).default("PERCENTAGE"),
                discountValue: z.number().default(0),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED" });
            }

            // 1. Verify ownership
            const existingOrder = await ctx.prisma.order.findUnique({
                where: { id: input.id },
            });

            if (!existingOrder || existingOrder.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            // 2. Prepare data for calculation
            const materials = await ctx.prisma.material.findMany({
                where: {
                    id: { in: input.items.map(i => i.materialId).filter((id): id is string => !!id) },
                    organizationId: ctx.session.orgId,
                }
            });

            const serviceTypes = await ctx.prisma.serviceType.findMany({
                where: {
                    id: { in: input.items.map(i => i.serviceTypeId) },
                    organizationId: ctx.session.orgId,
                }
            });

            // Find Varnish Material for cost calculation
            const varnishMaterial = await ctx.prisma.material.findFirst({
                where: {
                    organizationId: ctx.session.orgId,
                    name: { contains: "Verniz", mode: "insensitive" },
                    category: "LIQUID"
                }
            });

            const calcItems = input.items.map(item => {
                const material = materials.find(m => m.id === item.materialId);
                const serviceType = serviceTypes.find(st => st.id === item.serviceTypeId);

                if (!serviceType) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: `Service Type ${item.serviceTypeId} not found or missing access`
                    });
                }

                return {
                    width: item.width,
                    height: item.height,
                    mlUsed: item.mlUsed,
                    quantity: item.quantity,
                    billingType: serviceType.billingType,
                    unitPrice: item.unitPrice,
                    wastePercentage: item.wastePercentage || Number(serviceType.wastePercentage || 0),
                    operationalCostPerM2: Number(serviceType.operationalCostPerM2 || 0),
                    materialStop: material ? {
                        costPerSqMeter: Number(material.costPerSqMeter),
                        costPerMl: Number(material.costPerMl)
                    } : undefined,
                    finishings: item.finishings,
                };
            });

            // 3. Calculate Financials
            const result = calculateOrder({
                items: calcItems,
                commissionRate: input.commissionRate,
                commissionBase: 'GROSS_REVENUE',
                discountType: input.discountType,
                discountValue: input.discountValue,
            });

            // 4. Update DB
            return ctx.prisma.$transaction(async (tx) => {
                await tx.orderItem.deleteMany({
                    where: { orderId: input.id }
                });

                return tx.order.update({
                    where: { id: input.id },
                    data: {
                        customerName: input.customerName,
                        vendedorId: input.vendedorId,
                        totalAmount: result.totalRevenue,
                        totalCost: result.totalCost,
                        totalMaterialCost: result.totalMaterialCost,
                        totalOperationalCost: result.totalOperationalCost,
                        totalFinishingCost: result.totalFinishingCost,
                        totalCommission: result.totalCommission,
                        profit: result.grossProfit,
                        margin: result.margin,
                        commissionRate: input.commissionRate,
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
                                        create: item.finishings.map(f => ({
                                            name: f.name,
                                            price: f.price,
                                            cost: f.cost
                                        }))
                                    } : undefined
                                };
                            })
                        }
                    },
                });
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

    getCommissionReport: checkPermission("orders", "visualizar").query(async ({ ctx }) => {
        if (!ctx.session.orgId) return [];

        const salespersons = await ctx.prisma.user.findMany({
            where: {
                organizationId: ctx.session.orgId,
            },
        });

        const orders = await ctx.prisma.order.findMany({
            where: {
                organizationId: ctx.session.orgId,
                status: "COMPLETED",
                vendedorId: { not: null },
                deletedAt: null,
            },
        });

        return salespersons.map(sp => {
            const spOrders = orders.filter(o => o.vendedorId === sp.id);
            const totalRevenue = spOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
            const totalCommission = spOrders.reduce((acc, o) => acc + Number(o.totalCommission), 0);
            
            return {
                id: sp.id,
                name: sp.nomeCompleto,
                username: sp.usuario,
                orderCount: spOrders.length,
                totalRevenue,
                totalCommission,
            };
        }).filter(r => r.orderCount > 0);
    }),
});

