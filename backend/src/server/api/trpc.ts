import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { prisma } from "../../lib/prisma";

// Basic Token for Admin (In a real app, this would be a JWT or session from DB)
const ADMIN_TOKEN = "admin-token";
const ADMIN_ORG_ID = "admin-org";

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
        };
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

    return next({
        ctx: {
            session: {
                ...ctx.session,
                orgId: ctx.session.orgId || ADMIN_ORG_ID,
            },
        },
    });
});
