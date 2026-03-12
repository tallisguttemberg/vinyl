---
name: vinyl_backend_architecture
description: Padrões e regras arquiteturais para o backend do projeto Vinyl. 
---

# Vinyl - Padrões de Arquitetura de Backend (tRPC + Prisma + Zod)

Este guia define as regras obrigatórias que devem ser rigorosamente seguidas em qualquer desenvolvimento para a parte backend do projeto Vinyl. Não criar atalhos ou usar abordagens diferentes se uma já estiver definida aqui.

## 1. Estrutura e Ferramentas

O backend baseia-se em **Prisma ORM** para manipulação do banco PostgreSQL e **tRPC** (via `@trpc/server`) para criação de APIs fortemente tipadas integradas com o frontend.

- Todos os *endpoint/routers* novos devem ser criados dentro de `backend/src/server/api/routers/`
- Depois de criado, o router deve ser adicionado ao registro central em `backend/src/server/api/root.ts`
- Para validação de dados de entrada (`input`), usamos exclusivamente o pacote `zod`.

## 2. Abordagem Multitenant Obrigatória

Este sistema é **multitenant** por Organização (Tenant = `organizationId`). Isso significa que todo e qualquer recurso (com raras exceções como logs de auditoria globais de sistema) pertence a uma Organização. O usuário logado só consegue acesso aos dados da própria organização (salvos na `session` da request tRPC).

**Regras de banco de dados (`backend/prisma/schema.prisma`):**
- **Sempre** adicione a coluna `organizationId String` em novos *models*.
- **Sempre** crie um Index baseado nessa coluna (`@@index([organizationId])`).

**Regras nos Procedimentos (Routers tRPC):**
- Em leituras (queries) como `findMany`, *sempre* faça o filtro utilizando o valor obtido via API: `where: { organizationId: ctx.session.orgId }`.
- Em criações e edições (mutations), *sempre* associe e garanta a segurança antes de permitir operações em linhas que possuam este ID:
  ```typescript
    if (!ctx.session.orgId) throw new TRPCError({ code: "UNAUTHORIZED", message: "No Organization Selected" });
  ```

## 3. Sistema de Permissões de Usuários (`checkPermission`)

A aplicação prevê níveis de acesso baseados em módulos específicos. Um `middleware` personalizado valida o acesso antes mesmo de invocar o corpo da requisição.

**Como criar um endpoint protegido:**
Use a função utilitária `checkPermission(modulo, acao)` no lugar de `protectedProcedure` nas suas rotas. 

```typescript
import { createTRPCRouter, checkPermission } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const meuNovoModuloRouter = createTRPCRouter({
    // Permissão: Módulo 'meuModulo', ação 'visualizar'
    getAll: checkPermission("meuModulo", "visualizar").query(async ({ ctx }) => {
        // Implementação logica
        return ctx.prisma.novoModelo.findMany({
            where: { organizationId: ctx.session.orgId }
        });
    }),

    // Permissão: Módulo 'meuModulo', ação 'criar'
    create: checkPermission("meuModulo", "criar")
        .input(z.object({
            titulo: z.string().min(1, "Campo obrigatório"),
            valor: z.number().min(0.01)
        }))
        .mutation(async ({ ctx, input }) => {
            return ctx.prisma.novoModelo.create({
                data: {
                    organizationId: ctx.session.orgId,
                    titulo: input.titulo,
                    valor: input.valor
                }
            });
        }),
});
```
*Obs: Sempre verifique se o novo `modulo` foi registrado no TypeScript (`ModuleKey` e `PermissionAction` no frontend em `usePermission.ts`).*

## 4. Retorno e Erros

- Use explicitamente os retornos do banco nas rotas de mutação, e cuide com as deleções - evite deleção em cascata perigosa ou considere "soft deletes" (`deletedAt DateTime?`) quando o dado afetar cálculos financeiros do cliente.
- Caso ocorra problemas lógicos, retorne erros estruturados do tRPC:
  `throw new TRPCError({ code: "NOT_FOUND", message: "Registro não encontrado" });`
- Validações profundas lógicas (validação de fluxo, verificação de duplicidade complexa) devem ser feitas dentro do `mutation` antes de ir para os `create`/`update` do Prisma. As validações sintáticas/schema devem ser feitas via `.input(z.object({...}))` do próprio tRPC.
