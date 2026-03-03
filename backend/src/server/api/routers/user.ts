import { z } from "zod";
import * as bcrypt from "bcrypt";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, checkPermission, protectedProcedure } from "../trpc";

// Módulos do sistema disponíveis para controle de permissões
export const SYSTEM_MODULES = [
    "dashboard",
    "orders",
    "materials",
    "services",
    "settings",
    "users",
] as const;

const permissionSchema = z.object({
    modulo: z.string(),
    visualizar: z.boolean().default(false),
    criar: z.boolean().default(false),
    editar: z.boolean().default(false),
    excluir: z.boolean().default(false),
});

export const userRouter = createTRPCRouter({
    // ─── Listar todos os usuários ─────────────────────────────────────────────
    getAll: checkPermission("users", "visualizar").query(async ({ ctx }) => {
        return ctx.prisma.user.findMany({
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
    getById: checkPermission("users", "visualizar")
        .input(z.object({ id: z.string() }))
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
    create: checkPermission("users", "criar")
        .input(z.object({
            nomeCompleto: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
            usuario: z.string().min(3, "Usuário deve ter no mínimo 3 caracteres"),
            email: z.string().email("Email inválido"),
            senha: z.string()
                .min(8, "A senha deve ter no mínimo 8 caracteres")
                .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula")
                .regex(/[0-9]/, "A senha deve conter ao menos um número"),
            perfil: z.enum(["ADMIN", "GESTOR", "OPERADOR", "CLIENTE"]).default("OPERADOR"),
            telefone: z.string().optional(),
            observacoes: z.string().optional(),
            permissoes: z.array(permissionSchema).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Verificar se o usuário está tentando atribuir permissões e não é ADMIN
            if (input.permissoes && input.permissoes.length > 0 && ctx.session.perfil !== "ADMIN") {
                throw new TRPCError({
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
            const newUser = await ctx.prisma.$transaction(async (tx: any) => {
                const user = await tx.user.create({
                    data: {
                        nomeCompleto: input.nomeCompleto,
                        usuario: input.usuario,
                        email: input.email,
                        senhaHash,
                        perfil: input.perfil,
                        telefone: input.telefone,
                        observacoes: input.observacoes,
                    },
                });

                // Salvar permissões se fornecidas e se for ADMIN
                if (input.permissoes && input.permissoes.length > 0 && ctx.session.perfil === "ADMIN") {
                    await tx.userPermission.createMany({
                        data: input.permissoes.map((p) => ({
                            userId: user.id,
                            modulo: p.modulo,
                            visualizar: p.visualizar,
                            criar: p.criar,
                            editar: p.editar,
                            excluir: p.excluir,
                        })),
                    });
                }

                // Log de auditoria
                await tx.auditLog.create({
                    data: {
                        acao: "CREATE_USER",
                        idUsuarioCriado: user.id,
                    }
                });

                return user;
            });

            return { id: newUser.id, email: newUser.email, usuario: newUser.usuario, nomeCompleto: newUser.nomeCompleto };
        }),

    // ─── Atualizar usuário ────────────────────────────────────────────────────
    update: checkPermission("users", "editar")
        .input(z.object({
            id: z.string(),
            nomeCompleto: z.string().min(3).optional(),
            usuario: z.string().min(3).optional(),
            email: z.string().email().optional(),
            senha: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/).optional(),
            perfil: z.enum(["ADMIN", "GESTOR", "OPERADOR", "CLIENTE"]).optional(),
            status: z.enum(["ATIVO", "INATIVO", "BLOQUEADO"]).optional(),
            telefone: z.string().optional(),
            observacoes: z.string().optional(),
            permissoes: z.array(permissionSchema).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { id, permissoes, senha, ...rest } = input;

            // Verificar se o usuário está tentando alterar permissões e não é ADMIN
            if (permissoes !== undefined && ctx.session.perfil !== "ADMIN") {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Apenas administradores podem gerenciar permissões."
                });
            }

            // Verificar email único (se estiver sendo alterado)
            if (rest.email) {
                const existingUser = await ctx.prisma.user.findFirst({
                    where: { email: rest.email, NOT: { id } }
                });
                if (existingUser) throw new Error("Este email já está em uso.");
            }

            // Verificar usuario único (se estiver sendo alterado)
            if (rest.usuario) {
                const existingUsername = await ctx.prisma.user.findFirst({
                    where: { usuario: rest.usuario, NOT: { id } }
                });
                if (existingUsername) throw new Error("Este nome de usuário já está em uso.");
            }

            let senhaHash: string | undefined;
            if (senha) {
                const salt = await bcrypt.genSalt(10);
                senhaHash = await bcrypt.hash(senha, salt);
            }

            await ctx.prisma.$transaction(async (tx: any) => {
                // Atualizar dados do usuário
                await tx.user.update({
                    where: { id },
                    data: {
                        ...rest,
                        ...(senhaHash ? { senhaHash } : {}),
                    },
                });

                // Upsert de permissões (apenas se for ADMIN)
                if (permissoes !== undefined && ctx.session.perfil === "ADMIN") {
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
                    data: { acao: "UPDATE_USER", idUsuarioCriado: id }
                });
            });

            return { success: true };
        }),

    // ─── Excluir usuário ──────────────────────────────────────────────────────
    delete: checkPermission("users", "excluir")
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.prisma.user.delete({ where: { id: input.id } });
            return { success: true };
        }),

    // ─── Login de usuário ─────────────────────────────────────────────────────
    login: publicProcedure
        .input(z.object({
            usuario: z.string(),
            senha: z.string(),
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

            if (user.status !== "ATIVO") {
                throw new Error("Sua conta está " + user.status.toLowerCase());
            }

            // Atualizar o último login
            await ctx.prisma.user.update({
                where: { id: user.id },
                data: { ultimoLogin: new Date() },
            });

            return {
                token: user.id, // Usando o ID do usuário como token (simples como o sistema atual)
                user: {
                    id: user.id,
                    usuario: user.usuario,
                    nomeCompleto: user.nomeCompleto,
                    perfil: user.perfil,
                }
            };
        }),

    // ─── Obter dados do usuário logado ────────────────────────────────────────
    getMe: protectedProcedure.query(({ ctx }) => {
        return ctx.session;
    }),
});
