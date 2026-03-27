"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financialRouter = void 0;
const zod_1 = require("zod");
const trpc_1 = require("../trpc");
const server_1 = require("@trpc/server");
exports.financialRouter = (0, trpc_1.createTRPCRouter)({
    getAll: (0, trpc_1.checkPermission)("financial", "visualizar")
        .input(zod_1.z.object({
        page: zod_1.z.number().default(1),
        pageSize: zod_1.z.number().default(20),
        type: zod_1.z.enum(["PAYABLE", "RECEIVABLE"]).optional(),
        status: zod_1.z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
        category: zod_1.z.string().optional(),
        startDate: zod_1.z.date().optional(),
        endDate: zod_1.z.date().optional(),
    }).optional())
        .query(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            return { transactions: [], total: 0, totalPages: 0 };
        const page = input?.page ?? 1;
        const pageSize = input?.pageSize ?? 20;
        const where = {
            organizationId: ctx.session.orgId,
        };
        if (input?.type)
            where.type = input.type;
        if (input?.status) {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            if (input.status === "OVERDUE") {
                where.OR = [
                    { status: "OVERDUE" },
                    { status: "PENDING", dueDate: { lt: today } }
                ];
            }
            else if (input.status === "PENDING") {
                where.status = "PENDING";
                if (where.dueDate) {
                    where.dueDate.gte = today;
                }
                else {
                    where.dueDate = { gte: today };
                }
            }
            else {
                where.status = input.status;
            }
        }
        if (input?.category)
            where.category = input.category;
        if (input?.startDate || input?.endDate) {
            if (!where.dueDate)
                where.dueDate = {};
            if (input.startDate) {
                if (where.dueDate.gte) {
                    where.dueDate.gte = new Date(Math.max(where.dueDate.gte.getTime(), input.startDate.getTime()));
                }
                else {
                    where.dueDate.gte = input.startDate;
                }
            }
            if (input.endDate)
                where.dueDate.lte = input.endDate;
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
    getDailyMetrics: (0, trpc_1.checkPermission)("financial", "visualizar")
        .input(zod_1.z.object({ days: zod_1.z.number().default(30) }).optional())
        .query(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            return null;
        const days = input?.days || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setUTCHours(0, 0, 0, 0);
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
        const dailyData = {};
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
        orders.forEach((order) => {
            const dateStr = order.createdAt.toISOString().split("T")[0];
            if (dailyData[dateStr]) {
                dailyData[dateStr].lucroBruto += Number(order.profit);
            }
        });
        const paymentMethods = {};
        transactions.forEach((tx) => {
            const dateStr = tx.paymentDate?.toISOString().split("T")[0];
            const amt = Number(tx.amount);
            if (dateStr && dailyData[dateStr]) {
                if (tx.type === "RECEIVABLE") {
                    dailyData[dateStr].receitasRecebidas += amt;
                }
                else if (tx.type === "PAYABLE") {
                    dailyData[dateStr].despesasPagas += amt;
                }
                dailyData[dateStr].saldoCaixa = dailyData[dateStr].receitasRecebidas - dailyData[dateStr].despesasPagas;
            }
            const method = tx.paymentMethod || "OUTROS";
            if (!paymentMethods[method])
                paymentMethods[method] = { receitas: 0, despesas: 0 };
            if (tx.type === "RECEIVABLE") {
                paymentMethods[method].receitas += amt;
            }
            else if (tx.type === "PAYABLE") {
                paymentMethods[method].despesas += amt;
            }
        });
        const dailyMetricsArray = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
        return {
            daily: dailyMetricsArray,
            paymentMethods,
        };
    }),
    create: (0, trpc_1.checkPermission)("financial", "criar")
        .input(zod_1.z.object({
        type: zod_1.z.enum(["PAYABLE", "RECEIVABLE"]),
        status: zod_1.z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).default("PENDING"),
        description: zod_1.z.string().min(1),
        amount: zod_1.z.number().min(0.01),
        dueDate: zod_1.z.date(),
        paymentDate: zod_1.z.date().optional(),
        paymentMethod: zod_1.z.string().optional(),
        category: zod_1.z.string().optional(),
        orderId: zod_1.z.string().optional(),
        entityName: zod_1.z.string().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
        }
        return await ctx.prisma.$transaction(async (tx) => {
            const transaction = await tx.financialTransaction.create({
                data: {
                    organizationId: ctx.session.orgId,
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
                    organizationId: ctx.session.orgId,
                    acao: "CREATE_FINANCIAL_TRANSACTION",
                    targetId: transaction.id,
                    idUsuarioResponsavel: ctx.session.userId,
                }
            });
            return transaction;
        });
    }),
    update: (0, trpc_1.checkPermission)("financial", "editar")
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        type: zod_1.z.enum(["PAYABLE", "RECEIVABLE"]).optional(),
        status: zod_1.z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]).optional(),
        description: zod_1.z.string().optional(),
        amount: zod_1.z.number().min(0.01).optional(),
        dueDate: zod_1.z.date().optional(),
        paymentDate: zod_1.z.date().optional().nullable(),
        paymentMethod: zod_1.z.string().optional().nullable(),
        category: zod_1.z.string().optional().nullable(),
        orderId: zod_1.z.string().optional().nullable(),
        entityName: zod_1.z.string().optional().nullable(),
    }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
        }
        const transaction = await ctx.prisma.financialTransaction.findUnique({
            where: { id: input.id },
        });
        if (!transaction || transaction.organizationId !== ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "NOT_FOUND" });
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
                    organizationId: ctx.session.orgId,
                    acao: "UPDATE_FINANCIAL_TRANSACTION",
                    targetId: updated.id,
                    idUsuarioResponsavel: ctx.session.userId,
                }
            });
            return updated;
        });
    }),
    delete: (0, trpc_1.checkPermission)("financial", "excluir")
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .mutation(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            return null;
        const transaction = await ctx.prisma.financialTransaction.findUnique({
            where: { id: input.id },
        });
        if (!transaction || transaction.organizationId !== ctx.session.orgId) {
            throw new server_1.TRPCError({ code: "NOT_FOUND" });
        }
        return await ctx.prisma.$transaction(async (tx) => {
            await tx.financialTransaction.delete({
                where: { id: input.id },
            });
            await tx.auditLog.create({
                data: {
                    organizationId: ctx.session.orgId,
                    acao: "DELETE_FINANCIAL_TRANSACTION",
                    targetId: input.id,
                    idUsuarioResponsavel: ctx.session.userId,
                }
            });
            return { success: true };
        });
    }),
    getCashFlow: (0, trpc_1.checkPermission)("financial", "visualizar")
        .input(zod_1.z.object({
        startDate: zod_1.z.date().optional(),
        endDate: zod_1.z.date().optional(),
        type: zod_1.z.enum(["RECEIVABLE", "PAYABLE"]).optional(),
        status: zod_1.z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED", "ALL"]).optional(),
        category: zod_1.z.string().optional(),
    }))
        .query(async ({ ctx, input }) => {
        if (!ctx.session.orgId)
            return null;
        const where = {
            organizationId: ctx.session.orgId,
            status: { not: "CANCELLED" }
        };
        if (input.type) {
            where.type = input.type;
        }
        if (input.status && input.status !== "ALL") {
            where.status = input.status;
        }
        if (input.category && input.category !== "ALL") {
            where.category = input.category;
        }
        if (input.startDate || input.endDate) {
            where.dueDate = {};
            if (input.startDate)
                where.dueDate.gte = input.startDate;
            if (input.endDate)
                where.dueDate.lte = input.endDate;
        }
        // 1. Calculate Initial Balances (from transactions BEFORE the startDate)
        let initialRealBalance = 0;
        let initialProjectedBalance = 0;
        if (input.startDate) {
            const pastTxs = await ctx.prisma.financialTransaction.findMany({
                where: {
                    organizationId: ctx.session.orgId,
                    dueDate: { lt: input.startDate },
                    status: { not: "CANCELLED" }
                },
                select: { type: true, status: true, amount: true }
            });
            pastTxs.forEach((tx) => {
                const amount = Number(tx.amount);
                const isEntry = tx.type === "RECEIVABLE";
                const signedAmount = isEntry ? amount : -amount;
                initialProjectedBalance += signedAmount;
                if (tx.status === "PAID") {
                    initialRealBalance += signedAmount;
                }
            });
        }
        // 2. Query all transactions for the view
        const transactions = await ctx.prisma.financialTransaction.findMany({
            where,
            orderBy: { dueDate: 'asc' }
        });
        let currentRealBalance = initialRealBalance;
        let currentProjectedBalance = initialProjectedBalance;
        let periodEntries = 0;
        let periodExits = 0;
        let overdueCount = 0;
        const cashFlowItems = transactions.map(tx => {
            const amount = Number(tx.amount);
            const isEntry = tx.type === "RECEIVABLE";
            const signedAmount = isEntry ? amount : -amount;
            if (isEntry)
                periodEntries += amount;
            else
                periodExits += amount;
            if (tx.status === "OVERDUE")
                overdueCount++;
            currentProjectedBalance += signedAmount;
            let rowRealBalance = currentRealBalance;
            if (tx.status === "PAID") {
                currentRealBalance += signedAmount;
                rowRealBalance = currentRealBalance;
            }
            return {
                ...tx,
                amount,
                signedAmount,
                accumulatedReal: rowRealBalance,
                accumulatedProjected: currentProjectedBalance,
            };
        });
        return {
            items: cashFlowItems,
            summary: {
                initialRealBalance,
                initialProjectedBalance,
                finalRealBalance: currentRealBalance,
                finalProjectedBalance: currentProjectedBalance,
                periodEntries,
                periodExits,
                overdueCount
            }
        };
    }),
});
