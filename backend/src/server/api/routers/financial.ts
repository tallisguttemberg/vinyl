import { z } from "zod";
import { createTRPCRouter, checkPermission } from "../trpc";
import { TRPCError } from "@trpc/server";

export const financialRouter = createTRPCRouter({
    getAll: checkPermission("financial", "visualizar")
        .input(z.object({
            page: z.number().default(1),
            pageSize: z.number().default(20),
            type: z.enum(["PAYABLE", "RECEIVABLE"]).optional(),
            status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
            category: z.string().optional(),
            startDate: z.date().optional(),
            endDate: z.date().optional(),
        }).optional())
        .query(async ({ ctx, input }) => {
            if (!ctx.session.orgId) return { transactions: [], total: 0, totalPages: 0 };

            const page = input?.page ?? 1;
            const pageSize = input?.pageSize ?? 20;

            const where: any = {
                organizationId: ctx.session.orgId,
            };

            if (input?.type) where.type = input.type;
            if (input?.status) where.status = input.status;
            if (input?.category) where.category = input.category;
            if (input?.startDate || input?.endDate) {
                where.dueDate = {};
                if (input.startDate) where.dueDate.gte = input.startDate;
                if (input.endDate) where.dueDate.lte = input.endDate;
            }

            const [transactions, total] = await Promise.all([
                ctx.prisma.financialTransaction.findMany({
                    where,
                    orderBy: {
                        dueDate: "desc",
                    },
                    include: {
                        order: true,
                    },
                    skip: (page - 1) * pageSize,
                    take: pageSize,
                }),
                ctx.prisma.financialTransaction.count({ where }),
            ]);

            return {
                transactions,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }),

    getSummary: checkPermission("financial", "visualizar").query(async ({ ctx }) => {
        if (!ctx.session.orgId) return null;

        // Usar groupBy no banco em vez de processar tudo em memória
        const groups = await ctx.prisma.financialTransaction.groupBy({
            by: ["type", "status"],
            where: {
                organizationId: ctx.session.orgId,
                status: { in: ["PENDING", "PAID"] },
            },
            _sum: { amount: true },
        });

        const get = (type: string, status: string) =>
            Number(groups.find(g => g.type === type && g.status === status)?._sum?.amount ?? 0);

        const payablePending    = get("PAYABLE",    "PENDING");
        const payablePaid       = get("PAYABLE",    "PAID");
        const receivablePending = get("RECEIVABLE", "PENDING");
        const receivablePaid    = get("RECEIVABLE", "PAID");

        return {
            payablePending,
            payablePaid,
            receivablePending,
            receivablePaid,
            balancePending: receivablePending - payablePending,
            balancePaid:    receivablePaid    - payablePaid,
        };
    }),

    getDailyMetrics: checkPermission("financial", "visualizar")
        .input(z.object({ days: z.number().default(30) }).optional())
        .query(async ({ ctx, input }) => {
            if (!ctx.session.orgId) return null;

            const days = input?.days || 30;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            startDate.setHours(0, 0, 0, 0);

            const orders = await ctx.prisma.order.findMany({
                where: {
                    organizationId: ctx.session.orgId,
                    createdAt: { gte: startDate },
                    status: { not: "CANCELLED" }, 
                },
                select: {
                    profit: true,
                    totalAmount: true,
                    totalCost: true,
                    createdAt: true,
                }
            });

            const transactions = await ctx.prisma.financialTransaction.findMany({
                where: {
                    organizationId: ctx.session.orgId,
                    paymentDate: { gte: startDate },
                    status: "PAID",
                },
                select: {
                    type: true,
                    amount: true,
                    paymentDate: true,
                    paymentMethod: true,
                }
            });

            const dailyData: Record<string, {
                date: string;
                lucroBruto: number;
                receitasRecebidas: number;
                despesasPagas: number;
                saldoCaixa: number;
            }> = {};

            for (let i = 0; i <= days; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split("T")[0];
                dailyData[dateStr] = {
                    date: dateStr,
                    lucroBruto: 0,
                    receitasRecebidas: 0,
                    despesasPagas: 0,
                    saldoCaixa: 0,
                };
            }

            orders.forEach((order: any) => {
                const dateStr = order.createdAt.toISOString().split("T")[0];
                if (dailyData[dateStr]) {
                    dailyData[dateStr].lucroBruto += Number(order.profit);
                }
            });

            const paymentMethods: Record<string, { receitas: number; despesas: number }> = {};

            transactions.forEach((tx: any) => {
                const dateStr = tx.paymentDate?.toISOString().split("T")[0];
                const amt = Number(tx.amount);
                
                if (dateStr && dailyData[dateStr]) {
                    if (tx.type === "RECEIVABLE") {
                        dailyData[dateStr].receitasRecebidas += amt;
                    } else if (tx.type === "PAYABLE") {
                        dailyData[dateStr].despesasPagas += amt;
                    }
                    dailyData[dateStr].saldoCaixa = dailyData[dateStr].receitasRecebidas - dailyData[dateStr].despesasPagas;
                }

                const method = tx.paymentMethod || "OUTROS";
                if (!paymentMethods[method]) paymentMethods[method] = { receitas: 0, despesas: 0 };
                if (tx.type === "RECEIVABLE") {
                    paymentMethods[method].receitas += amt;
                } else if (tx.type === "PAYABLE") {
                    paymentMethods[method].despesas += amt;
                }
            });

            const dailyMetricsArray = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

            return {
                daily: dailyMetricsArray,
                paymentMethods,
            };
        }),

    create: checkPermission("financial", "criar")
        .input(
            z.object({
                type: z.enum(["PAYABLE", "RECEIVABLE"]),
                status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).default("PENDING"),
                description: z.string().min(1),
                amount: z.number().min(0.01),
                dueDate: z.date(),
                paymentDate: z.date().optional(),
                paymentMethod: z.string().optional(),
                category: z.string().optional(),
                orderId: z.string().optional(),
                entityName: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
            }

            return await ctx.prisma.$transaction(async (tx) => {
                const transaction = await tx.financialTransaction.create({
                    data: {
                        organizationId: ctx.session.orgId!,
                        type: input.type,
                        status: input.status,
                        description: input.description,
                        amount: input.amount,
                        dueDate: input.dueDate,
                        paymentDate: input.paymentDate,
                        paymentMethod: input.paymentMethod,
                        category: input.category,
                        orderId: input.orderId,
                        entityName: input.entityName,
                    },
                });

                await tx.auditLog.create({
                    data: {
                        organizationId: ctx.session.orgId!,
                        acao: "CREATE_FINANCIAL_TRANSACTION",
                        targetId: transaction.id,
                        idUsuarioResponsavel: ctx.session.userId,
                    }
                });

                return transaction;
            });
        }),

    update: checkPermission("financial", "editar")
        .input(
            z.object({
                id: z.string(),
                type: z.enum(["PAYABLE", "RECEIVABLE"]).optional(),
                status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
                description: z.string().optional(),
                amount: z.number().min(0.01).optional(),
                dueDate: z.date().optional(),
                paymentDate: z.date().optional().nullable(),
                paymentMethod: z.string().optional().nullable(),
                category: z.string().optional().nullable(),
                orderId: z.string().optional().nullable(),
                entityName: z.string().optional().nullable(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
            }

            const transaction = await ctx.prisma.financialTransaction.findUnique({
                where: { id: input.id },
            });

            if (!transaction || transaction.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return await ctx.prisma.$transaction(async (tx) => {
                const updated = await tx.financialTransaction.update({
                    where: { id: input.id },
                    data: {
                        type: input.type,
                        status: input.status,
                        description: input.description,
                        amount: input.amount,
                        dueDate: input.dueDate,
                        paymentDate: input.paymentDate,
                        paymentMethod: input.paymentMethod,
                        category: input.category,
                        orderId: input.orderId,
                        entityName: input.entityName,
                    },
                });

                await tx.auditLog.create({
                    data: {
                        organizationId: ctx.session.orgId!,
                        acao: "UPDATE_FINANCIAL_TRANSACTION",
                        targetId: updated.id,
                        idUsuarioResponsavel: ctx.session.userId,
                    }
                });

                return updated;
            });
        }),

    delete: checkPermission("financial", "excluir")
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (!ctx.session.orgId) return null;

            const transaction = await ctx.prisma.financialTransaction.findUnique({
                where: { id: input.id },
            });

            if (!transaction || transaction.organizationId !== ctx.session.orgId) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            return await ctx.prisma.$transaction(async (tx) => {
                await tx.financialTransaction.delete({
                    where: { id: input.id },
                });

                await tx.auditLog.create({
                    data: {
                        organizationId: ctx.session.orgId!,
                        acao: "DELETE_FINANCIAL_TRANSACTION",
                        targetId: input.id,
                        idUsuarioResponsavel: ctx.session.userId,
                    }
                });

                return { success: true };
            });
        }),
});
