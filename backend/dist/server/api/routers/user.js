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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = exports.SYSTEM_MODULES = void 0;
const zod_1 = require("zod");
const bcrypt = __importStar(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const server_1 = require("@trpc/server");
const trpc_1 = require("../trpc");
// Módulos do sistema disponíveis para controle de permissões
exports.SYSTEM_MODULES = [
    "dashboard",
    "orders",
    "materials",
    "services",
    "settings",
    "users",
    "financial",
];
const permissionSchema = zod_1.z.object({
    modulo: zod_1.z.string(),
    visualizar: zod_1.z.boolean().default(false),
    criar: zod_1.z.boolean().default(false),
    editar: zod_1.z.boolean().default(false),
    excluir: zod_1.z.boolean().default(false),
});
exports.userRouter = (0, trpc_1.createTRPCRouter)({
    // ─── Listar todos os usuários ─────────────────────────────────────────────
    getAll: (0, trpc_1.checkPermission)("users", "visualizar").query(async ({ ctx }) => {
        // Admin do sistema não tem orgId fixo — retorna todos
        const where = ctx.session.orgId
            ? { organizationId: ctx.session.orgId, deletedAt: null }
            : { deletedAt: null };
        // Proteção: Nunca listar o usuário master 'admin' para ninguém
        where.usuario = { not: "admin" };
        return ctx.prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                nomeCompleto: true,
                usuario: true,
                email: true,
                perfil: true,
                status: true,
                telefone: true,
                createdAt: true,
                ultimoLogin: true,
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
    }),
    // ─── Buscar usuário por ID (para edição) ──────────────────────────────────
    getById: (0, trpc_1.checkPermission)("users", "visualizar")
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .query(async ({ ctx, input }) => {
        return ctx.prisma.user.findUnique({
            where: { id: input.id },
            select: {
                id: true,
                nomeCompleto: true,
                usuario: true,
                email: true,
                perfil: true,
                status: true,
                telefone: true,
                observacoes: true,
                createdAt: true,
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
    }),
    // ─── Criar usuário ────────────────────────────────────────────────────────
    create: (0, trpc_1.checkPermission)("users", "criar")
        .input(zod_1.z.object({
        nomeCompleto: zod_1.z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
        usuario: zod_1.z.string().min(3, "Usuário deve ter no mínimo 3 caracteres"),
        email: zod_1.z.string().email("Email inválido"),
        senha: zod_1.z.string()
            .min(8, "A senha deve ter no mínimo 8 caracteres")
            .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
            .regex(/[0-9]/, "A senha deve conter ao menos um número"),
        perfil: zod_1.z.enum(["ADMIN", "GESTOR", "OPERADOR", "CLIENTE"]).default("OPERADOR"),
        telefone: zod_1.z.string().optional(),
        observacoes: zod_1.z.string().optional(),
        permissoes: zod_1.z.array(permissionSchema).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        // Verificar se o usuário está tentando atribuir permissões e não é ADMIN
        if (input.permissoes && input.permissoes.length > 0 && ctx.session.perfil !== "ADMIN") {
            throw new server_1.TRPCError({
                code: "FORBIDDEN",
                message: "Apenas administradores podem atribuir permissões."
            });
        }
        // Verificar unicidade do email
        const existingUser = await ctx.prisma.user.findUnique({
            where: { email: input.email }
        });
        if (existingUser) {
            throw new Error("Este email já está em uso.");
        }
        // Verificar unicidade do usuario
        const existingUsername = await ctx.prisma.user.findUnique({
            where: { usuario: input.usuario }
        });
        if (existingUsername) {
            throw new Error("Este nome de usuário já está em uso.");
        }
        // Hash seguro da senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(input.senha, salt);
        // Criar usuário, permissões e log em uma única transação
        const newUser = await ctx.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    nomeCompleto: input.nomeCompleto,
                    usuario: input.usuario,
                    email: input.email,
                    senhaHash,
                    perfil: input.perfil,
                    telefone: input.telefone,
                    observacoes: input.observacoes,
                    organizationId: ctx.session.orgId || "default",
                },
            });
            // Determinar permissões a salvar:
            // - Se perfil ADMIN → garante CRUD completo em todos os módulos
            // - Se não-ADMIN e permissões fornecidas → salva as fornecidas
            const permsToSave = input.perfil === "ADMIN"
                ? exports.SYSTEM_MODULES.map((m) => ({
                    userId: user.id,
                    modulo: m,
                    visualizar: true,
                    criar: true,
                    editar: true,
                    excluir: true,
                }))
                : (input.permissoes ?? []).map((p) => ({
                    userId: user.id,
                    modulo: p.modulo,
                    visualizar: p.visualizar,
                    criar: p.criar,
                    editar: p.editar,
                    excluir: p.excluir,
                }));
            if (permsToSave.length > 0) {
                await tx.userPermission.createMany({ data: permsToSave });
            }
            // Log de auditoria
            await tx.auditLog.create({
                data: {
                    organizationId: ctx.session.orgId,
                    acao: "CREATE_USER",
                    idUsuarioCriado: user.id,
                    idUsuarioResponsavel: ctx.session.userId,
                }
            });
            return user;
        });
        return { id: newUser.id, email: newUser.email, usuario: newUser.usuario, nomeCompleto: newUser.nomeCompleto };
    }),
    // ─── Atualizar usuário ────────────────────────────────────────────────────
    update: (0, trpc_1.checkPermission)("users", "editar")
        .input(zod_1.z.object({
        id: zod_1.z.string(),
        nomeCompleto: zod_1.z.string().min(3).optional(),
        usuario: zod_1.z.string().min(3).optional(),
        email: zod_1.z.string().email().optional(),
        senha: zod_1.z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).optional(),
        perfil: zod_1.z.enum(["ADMIN", "GESTOR", "OPERADOR", "CLIENTE"]).optional(),
        status: zod_1.z.enum(["ATIVO", "INATIVO", "BLOQUEADO"]).optional(),
        telefone: zod_1.z.string().optional(),
        observacoes: zod_1.z.string().optional(),
        permissoes: zod_1.z.array(permissionSchema).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const { id, permissoes, senha, ...rest } = input;
        // Verificar se o usuário está tentando alterar permissões e não é ADMIN
        if (permissoes !== undefined && ctx.session.perfil !== "ADMIN") {
            throw new server_1.TRPCError({
                code: "FORBIDDEN",
                message: "Apenas administradores podem gerenciar permissões."
            });
        }
        // Verificar email único (se estiver sendo alterado)
        if (rest.email) {
            const existingUser = await ctx.prisma.user.findFirst({
                where: { email: rest.email, NOT: { id } }
            });
            if (existingUser)
                throw new Error("Este email já está em uso.");
        }
        // Verificar usuario único (se estiver sendo alterado)
        if (rest.usuario) {
            const existingUsername = await ctx.prisma.user.findFirst({
                where: { usuario: rest.usuario, NOT: { id } }
            });
            if (existingUsername)
                throw new Error("Este nome de usuário já está em uso.");
        }
        let senhaHash;
        if (senha) {
            const salt = await bcrypt.genSalt(10);
            senhaHash = await bcrypt.hash(senha, salt);
        }
        await ctx.prisma.$transaction(async (tx) => {
            // Atualizar dados do usuário
            await tx.user.update({
                where: { id },
                data: {
                    ...rest,
                    ...(senhaHash ? { senhaHash } : {}),
                },
            });
            // Se perfil sendo alterado para ADMIN → garantir CRUD total em todos os módulos
            if (rest.perfil === "ADMIN") {
                for (const modulo of exports.SYSTEM_MODULES) {
                    await tx.userPermission.upsert({
                        where: { userId_modulo: { userId: id, modulo } },
                        create: { userId: id, modulo, visualizar: true, criar: true, editar: true, excluir: true },
                        update: { visualizar: true, criar: true, editar: true, excluir: true },
                    });
                }
            }
            else if (permissoes !== undefined && ctx.session.perfil === "ADMIN") {
                // Upsert de permissões customizadas (apenas se sessão é ADMIN)
                for (const p of permissoes) {
                    await tx.userPermission.upsert({
                        where: { userId_modulo: { userId: id, modulo: p.modulo } },
                        create: {
                            userId: id,
                            modulo: p.modulo,
                            visualizar: p.visualizar,
                            criar: p.criar,
                            editar: p.editar,
                            excluir: p.excluir,
                        },
                        update: {
                            visualizar: p.visualizar,
                            criar: p.criar,
                            editar: p.editar,
                            excluir: p.excluir,
                        },
                    });
                }
            }
            await tx.auditLog.create({
                data: {
                    organizationId: ctx.session.orgId,
                    acao: "UPDATE_USER",
                    idUsuarioCriado: id,
                    idUsuarioResponsavel: ctx.session.userId,
                }
            });
        });
        return { success: true };
    }),
    // ─── Excluir usuário ──────────────────────────────────────────────────────
    delete: (0, trpc_1.checkPermission)("users", "excluir")
        .input(zod_1.z.object({ id: zod_1.z.string() }))
        .mutation(async ({ ctx, input }) => {
        // Verificar se o usuário tem ordens vinculadas como aplicador
        const ordersCount = await ctx.prisma.order.count({
            where: { aplicadorId: input.id, deletedAt: null },
        });
        if (ordersCount > 0) {
            throw new server_1.TRPCError({
                code: "CONFLICT",
                message: `Este usuário possui ${ordersCount} ordem(ns) vinculada(s). Inative-o em vez de excluir.`,
            });
        }
        // Proteção: Nunca permitir excluir o usuário master 'admin'
        const userToDelete = await ctx.prisma.user.findUnique({ where: { id: input.id } });
        if (userToDelete?.usuario === "admin") {
            throw new server_1.TRPCError({
                code: "FORBIDDEN",
                message: "O usuário administrador mestre não pode ser excluído.",
            });
        }
        // Soft delete — nunca exclusão física
        await ctx.prisma.user.update({
            where: { id: input.id },
            data: { deletedAt: new Date(), status: "INATIVO" },
        });
        return { success: true };
    }),
    // ─── Login de usuário ─────────────────────────────────────────────────────
    login: trpc_1.publicProcedure
        .input(zod_1.z.object({
        usuario: zod_1.z.string(),
        senha: zod_1.z.string(),
    }))
        .mutation(async ({ ctx, input }) => {
        const user = await ctx.prisma.user.findUnique({
            where: { usuario: input.usuario },
        });
        if (!user) {
            throw new Error("Usuário ou senha inválidos");
        }
        const isPasswordValid = await bcrypt.compare(input.senha, user.senhaHash);
        if (!isPasswordValid) {
            throw new Error("Usuário ou senha inválidos");
        }
        if (user.status !== "ATIVO" || user.deletedAt) {
            const reason = user.deletedAt ? "desativada" : user.status.toLowerCase();
            throw new Error("Sua conta está " + reason);
        }
        // Atualizar o último login
        await ctx.prisma.user.update({
            where: { id: user.id },
            data: { ultimoLogin: new Date() },
        });
        // Gerar JWT assinado com expiração de 8 horas
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            orgId: user.organizationId,
            perfil: user.perfil,
        }, trpc_1.JWT_SECRET, { expiresIn: "8h" });
        return {
            token,
            user: {
                id: user.id,
                usuario: user.usuario,
                nomeCompleto: user.nomeCompleto,
                perfil: user.perfil,
            }
        };
    }),
    // ─── Obter dados do usuário logado ────────────────────────────────────────
    getMe: trpc_1.protectedProcedure.query(({ ctx }) => {
        return ctx.session;
    }),
});
