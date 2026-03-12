import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { prisma } from "../../lib/prisma";
import jwt from "jsonwebtoken";

// Lidos do ambiente — nunca mais hardcoded
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "vinyl-admin-fallback";
const JWT_SECRET  = process.env.JWT_SECRET  ?? "change-me-in-production";
const ADMIN_ORG_ID = "default";

// Payload que fica dentro do JWT
interface JwtPayload {
    userId: string;
    orgId: string;
    perfil: string;
}

/**
 * 1. CONTEXT
 */

interface CreateContextOptions {
    headers: Headers;
}

export const createTRPCContext = async (opts: CreateContextOptions) => {
    const authHeader = opts.headers.get("authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    let authSession = null;

    if (!token) {
        // sem token — acesso público
    } else if (token === ADMIN_TOKEN) {
        // Token de admin via variável de ambiente
        authSession = {
            userId: "admin",
            orgId: ADMIN_ORG_ID,
            perfil: "ADMIN",
            nome: "Administrador Sistema",
            usuario: "admin",
            permissoes: [] as any[],
        };
    } else {
        // Tentar validar como JWT assinado
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

            // Re-buscar usuário no banco: garante status e permissões sempre atualizados
            const user = await prisma.user.findUnique({
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
        } catch {
            // JWT inválido, expirado ou adulterado — sem sessão
            // Rotas protegidas vão barrá-lo com UNAUTHORIZED
        }
    }

    return {
        prisma,
        session: authSession,
        headers: opts.headers,
    };
};

/**
 * 2. INITIALIZATION
 */
export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
    transformer: superjson,
});

/**
 * 3. ROUTER & PROCEDURE
 */

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.session || !ctx.session.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
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
export const permissionMiddleware = (modulo: string, acao: "visualizar" | "criar" | "editar" | "excluir") =>
    t.middleware(({ ctx, next }) => {
        if (!ctx.session || !ctx.session.userId) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
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

        const permissao = authSession.permissoes.find((p: any) => p.modulo === modulo);

        if (!permissao || !permissao[acao]) {
            throw new TRPCError({
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

/**
 * Procedimentos com verificação de permissão
 */
export const checkPermission = (modulo: string, acao: "visualizar" | "criar" | "editar" | "excluir") =>
    protectedProcedure.use(permissionMiddleware(modulo, acao));

/**
 * Utilitários exportados para o router de usuários gerar JWTs
 */
export { JWT_SECRET };
