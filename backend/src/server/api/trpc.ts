import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "../../lib/prisma";

// Basic Token for Admin (In a real app, this would be a JWT or session from DB)
const ADMIN_TOKEN = "admin-token";
const ADMIN_ORG_ID = "default";

/**
 * 1. CONTEXT
 */

interface CreateContextOptions {
    headers: Headers;
}

export const createTRPCContext = async (opts: CreateContextOptions) => {
    // Extract token from headers
    const authHeader = opts.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    let authSession = null;

    if (token === ADMIN_TOKEN) {
        authSession = {
            userId: "admin",
            orgId: ADMIN_ORG_ID,
            perfil: "ADMIN",
            nome: "Administrador Sistema",
            usuario: "admin",
            permissoes: [] // Admin bypasses checks or has all
        };
    } else if (token) {
        // Tentar validar o token como um ID de usuário no banco de dados
        const user = await prisma.user.findUnique({
            where: { id: token },
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
            // Infere que a sessão não é nula aqui
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
export const permissionMiddleware = (modulo: string, acao: 'visualizar' | 'criar' | 'editar' | 'excluir') =>
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
export const checkPermission = (modulo: string, acao: 'visualizar' | 'criar' | 'editar' | 'excluir') =>
    protectedProcedure.use(permissionMiddleware(modulo, acao));
