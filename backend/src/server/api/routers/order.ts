
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { calculateOrder } from "../../../lib/calculations";
import { TRPCError } from "@trpc/server";

const orderItemSchema = z.object({
    serviceTypeId: z.string(),
    materialId: z.string().optional().nullable(),
    width: z.number(),
    height: z.number(),
    quantity: z.number().min(1),
    unitPrice: z.number(), // Override or default price
});

export const orderRouter = createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.session.orgId) return [];

        return ctx.prisma.order.findMany({
            where: {
                organizationId: ctx.session.orgId,
            },
            include: {
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

    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.session.orgId) return null;

        const orders = await ctx.prisma.order.findMany({
            where: {
                organizationId: ctx.session.orgId,
                status: { not: "CANCELLED" },
            },
        });

        // Current totals (Revenue and Costs always show full picture)
        const totalRevenue = orders.reduce((acc, order) => acc + Number(order.totalAmount), 0);
        const totalMaterialCost = orders.reduce((acc, order) => acc + Number(order.totalCost), 0);
        const totalCommission = orders.reduce((acc, order) => acc + Number(order.totalCommission), 0);

        // Gross Profit is only from COMPLETED orders
        const completedOrders = orders.filter(o => o.status === "COMPLETED");
        const realizedProfit = completedOrders.reduce((acc, order) => acc + Number(order.profit), 0);

        // Projected Profit from other active orders
        const activeOrders = orders.filter(o => o.status === "PENDING" || o.status === "IN_PROGRESS");
        const projectedProfit = activeOrders.reduce((acc, order) => acc + Number(order.profit), 0);

        const margin = totalRevenue > 0 ? (realizedProfit / totalRevenue) * 100 : 0;

        return {
            totalRevenue,
            totalMaterialCost,
            totalCommission,
            grossProfit: realizedProfit, // Realized profit
            projectedProfit,
            margin,
            orderCount: orders.length,
            completedCount: completedOrders.length,
        };
    }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            if (!ctx.session.orgId) return null;

            const order = await ctx.prisma.order.findUnique({
                where: { id: input.id },
                include: {
                    items: {
                        include: {
                            serviceType: true,
                            material: true
                        }
                    }
                }
            });

            if (!order || order.organizationId !== ctx.session.orgId) {
                return null;
            }
            return order;
        }),

    calculate: protectedProcedure
        .input(
            z.object({
                items: z.array(orderItemSchema),
                commissionRate: z.number(),
                wastePercentage: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Fetch necessary data to perform calculation
            // We need material costs
            // In a real app we might cache this or pass it from client, but safer to fetch from DB

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

            const calcItems = input.items.map(item => {
                const material = materials.find(m => m.id === item.materialId);
                const serviceType = serviceTypes.find(st => st.id === item.serviceTypeId);

                return {
                    width: item.width,
                    height: item.height,
                    quantity: item.quantity,
                    billingType: serviceType?.billingType || 'FIXED', // Fallback
                    unitPrice: item.unitPrice,
                    materialStop: material ? {
                        costPerSqMeter: Number(material.costPerSqMeter)
                    } : undefined
                };
            });

            return calculateOrder({
                items: calcItems,
                commissionRate: input.commissionRate,
                wastePercentage: input.wastePercentage
            });
        }),

    create: protectedProcedure
        .input(
            z.object({
                customerName: z.string().min(1),
                items: z.array(orderItemSchema),
                commissionRate: z.number().default(0),
                wastePercentage: z.number().default(0),
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
                    quantity: item.quantity,
                    billingType: serviceType.billingType,
                    unitPrice: item.unitPrice,
                    materialStop: material ? {
                        costPerSqMeter: Number(material.costPerSqMeter)
                    } : undefined
                };
            });

            // 2. Calculate Financials
            const result = calculateOrder({
                items: calcItems,
                commissionRate: input.commissionRate,
                wastePercentage: input.wastePercentage
            });

            // 3. Save to DB
            return ctx.prisma.order.create({
                data: {
                    organizationId: ctx.session.orgId,
                    customerName: input.customerName,
                    totalAmount: result.totalRevenue,
                    totalCost: result.totalMaterialCost,
                    totalCommission: result.totalCommission,
                    profit: result.grossProfit,
                    margin: result.margin,
                    commissionRate: input.commissionRate,
                    wastePercentage: input.wastePercentage,
                    items: {
                        create: input.items.map((item, index) => {
                            const calcItem = result.items[index];
                            return {
                                serviceTypeId: item.serviceTypeId,
                                materialId: item.materialId,
                                width: item.width,
                                height: item.height,
                                quantity: item.quantity,
                                price: calcItem.revenue,
                                cost: calcItem.materialCost, // Include wate in stored cost? Per requirements "Total gasto com material" is order level. Item level cost helpful.
                            };
                        })
                    }
                },
            });
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) return null;

            const order = await ctx.prisma.order.findUnique({
                where: { id: input.id },
            });

            if (!order || order.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return ctx.prisma.order.delete({
                where: { id: input.id },
            });
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                customerName: z.string().min(1),
                items: z.array(orderItemSchema),
                commissionRate: z.number().default(0),
                wastePercentage: z.number().default(0),
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
                    quantity: item.quantity,
                    billingType: serviceType.billingType,
                    unitPrice: item.unitPrice,
                    materialStop: material ? {
                        costPerSqMeter: Number(material.costPerSqMeter)
                    } : undefined
                };
            });

            // 3. Calculate Financials
            const result = calculateOrder({
                items: calcItems,
                commissionRate: input.commissionRate,
                wastePercentage: input.wastePercentage
            });

            // 4. Update DB
            // We use a transaction to delete old items and create new ones (simplest way to update nested array)
            return ctx.prisma.$transaction(async (tx) => {
                // Delete existing items
                await tx.orderItem.deleteMany({
                    where: { orderId: input.id }
                });

                // Update order and create new items
                return tx.order.update({
                    where: { id: input.id },
                    data: {
                        customerName: input.customerName,
                        totalAmount: result.totalRevenue,
                        totalCost: result.totalMaterialCost,
                        totalCommission: result.totalCommission,
                        profit: result.grossProfit,
                        margin: result.margin,
                        commissionRate: input.commissionRate,
                        wastePercentage: input.wastePercentage,
                        items: {
                            create: input.items.map((item, index) => {
                                const calcItem = result.items[index];
                                return {
                                    serviceTypeId: item.serviceTypeId,
                                    materialId: item.materialId,
                                    width: item.width,
                                    height: item.height,
                                    quantity: item.quantity,
                                    price: calcItem.revenue,
                                    cost: calcItem.materialCost,
                                };
                            })
                        }
                    },
                });
            });
        }),

    updateStatus: protectedProcedure
        .input(z.object({
            id: z.string(),
            status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
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

            // Logic for stock deduction
            if (input.status === "COMPLETED" && order.status !== "COMPLETED") {
                await ctx.prisma.$transaction(async (tx) => {
                    for (const item of order.items) {
                        if (item.materialId) {
                            const areaUsed = Number(item.width) * Number(item.height) * item.quantity;
                            await tx.material.update({
                                where: { id: item.materialId },
                                data: {
                                    stockAmount: {
                                        decrement: areaUsed
                                    }
                                }
                            });
                        }
                    }
                });
            }

            return ctx.prisma.order.update({
                where: { id: input.id },
                data: { status: input.status }
            });
        }),
});

