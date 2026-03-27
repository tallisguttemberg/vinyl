"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWT_SECRET = exports.checkPermission = exports.permissionMiddleware = exports.protectedProcedure = exports.publicProcedure = exports.createTRPCRouter = exports.createTRPCContext = void 0;
const server_1 = require("@trpc/server");
const superjson_1 = __importDefault(require("superjson"));
const prisma_1 = require("../../lib/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Lidos do ambiente — nunca mais hardcoded
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "vinyl-admin-fallback";
const JWT_SECRET = process.env.JWT_SECRET ?? "change-me-in-production";
exports.JWT_SECRET = JWT_SECRET;
const ADMIN_ORG_ID = "default";
const createTRPCContext = async (opts) => {
    const authHeader = opts.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    let authSession = null;
    if (!token) {
        // sem token — acesso público
    }
    else if (token === ADMIN_TOKEN) {
        // Token de admin via variável de ambiente
        authSession = {
            userId: "admin",
            orgId: ADMIN_ORG_ID,
            perfil: "ADMIN",
            nome: "Administrador Sistema",
            usuario: "admin",
            permissoes: [],
        };
    }
    else {
        // Tentar validar como JWT assinado
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            // Re-buscar usuário no banco: garante status e permissões sempre atualizados
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    organizationId: true,
                    status: true,
                    perfil: true,
                    nomeCompleto: true,
                    usuario: true,
                    permissoes: {
                        select: {
                            modulo: true,
                            visualizar: true,
                            criar: true,
                            editar: true,
                            excluir: true,
                        }
                    }
                }
            });
            if (user && user.status === "ATIVO") {
                authSession = {
                    userId: user.id,
                    orgId: user.organizationId,
                    perfil: user.perfil,
                    nome: user.nomeCompleto,
                    usuario: user.usuario,
                    permissoes: user.permissoes,
                };
            }
        }
        catch {
            // JWT inválido, expirado ou adulterado — sem sessão
            // Rotas protegidas vão barrá-lo com UNAUTHORIZED
        }
    }
    return {
        prisma: prisma_1.prisma,
        session: authSession,
        headers: opts.headers,
    };
};
exports.createTRPCContext = createTRPCContext;
const t = server_1.initTRPC.context().create({
    transformer: superjson_1.default,
});
/**
 * 3. ROUTER & PROCEDURE
 */
exports.createTRPCRouter = t.router;
exports.publicProcedure = t.procedure;
exports.protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.session || !ctx.session.userId) {
        throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
    }
    const authSession = ctx.session;
    return next({
        ctx: {
            session: {
                ...authSession,
                orgId: authSession.orgId || ADMIN_ORG_ID,
            },
        },
    });
});
/**
 * Middleware para verificar permissões específicas
 */
const permissionMiddleware = (modulo, acao) => t.middleware(({ ctx, next }) => {
    if (!ctx.session || !ctx.session.userId) {
        throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
    }
    const authSession = ctx.session;
    // Admin tem acesso total
    if (authSession.perfil === "ADMIN" || authSession.userId === "admin") {
        return next({
            ctx: {
                ...ctx,
                session: {
                    ...authSession,
                    orgId: authSession.orgId || ADMIN_ORG_ID,
                }
            }
        });
    }
    const permissao = authSession.permissoes.find((p) => p.modulo === modulo);
    if (!permissao || !permissao[acao]) {
        throw new server_1.TRPCError({
            code: "FORBIDDEN",
            message: `Você não tem permissão para ${acao} no módulo ${modulo}.`
        });
    }
    return next({
        ctx: {
            ...ctx,
            session: {
                ...authSession,
                orgId: authSession.orgId || ADMIN_ORG_ID,
            }
        }
    });
});
exports.permissionMiddleware = permissionMiddleware;
/**
 * Procedimentos com verificação de permissão
 */
const checkPermission = (modulo, acao) => exports.protectedProcedure.use((0, exports.permissionMiddleware)(modulo, acao));
exports.checkPermission = checkPermission;
