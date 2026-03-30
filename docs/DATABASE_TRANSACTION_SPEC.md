# Especificação de Transações de Banco de Dados - Projeto Vinyl

Esta documentação define o padrão de implementação para mutações no backend do projeto Vinyl que envolvem múltiplas operações no banco de dados. O objetivo é garantir a integridade dos dados e a consistência entre os módulos de Pedidos, Financeiro, Estoque e Auditoria.

## 1. Regra de Ouro da Atomicidade
Toda operação que altere mais de uma tabela ou que gere efeitos colaterais (logs, transações financeiras, baixa de estoque) **DEVE** ser envolvida em um bloco `ctx.prisma.$transaction`.

### Por que usar?
Sem uma transação, se o sistema falhar entre a criação de um pedido e a criação de sua conta a receber, o banco de dados ficará em um estado inconsistente (pedido "fantasma" sem registro financeiro).

---

## 2. Estrutura Padrão de Mutação

As mutações devem seguir esta ordem lógica:

1.  **Validação de Entrada**: Verificar permissões, sessões e validade dos dados de entrada (Zod).
2.  **Preparação (Fora da Transação)**: Cálculos pesados ou processamento de dados que não dependem do estado atômico atual.
3.  **Bloco de Transação**:
    *   **Recuperação de Recursos**: Buscar o registro atual usando o objeto `tx` (ex: `tx.order.findUnique`).
    *   **Validação de Estado**: Verificar se a operação é permitida no estado atual (ex: não converter algo que já é OS).
    *   **Operação Principal**: Criar ou atualizar o registro principal (ex: `tx.order.create`).
    *   **Efeitos Colaterais**:
        *   **Financeiro**: Criar ou atualizar `financialTransaction`.
        *   **Log de Auditoria**: Registrar a ação em `orderLog` ou `auditLog`.
        *   **Estoque**: Deduzir materiais se o status for finalizado.
    *   **Retorno**: Retornar o registro finalizado.

---

## 3. Exemplo de Implementação (Padrão tRPC/Prisma)

```typescript
mutationName: checkPermission("modulo", "acao")
    .input(schema)
    .mutation(async ({ ctx, input }) => {
        // 1. Validação inicial
        if (!ctx.session.orgId) throw new TRPCError({ code: "UNAUTHORIZED" });

        // 2. Início da transação atômica
        return await ctx.prisma.$transaction(async (tx) => {
            // 3. Verificação dentro da transação
            const existing = await tx.order.findUnique({ where: { id: input.id } });
            if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

            // 4. Update principal
            const updated = await tx.order.update({
                where: { id: input.id },
                data: { status: input.status }
            });

            // 5. Efeito colateral: Auditoria
            await tx.orderLog.create({
                data: {
                    orderId: updated.id,
                    userId: ctx.session.userId,
                    action: "ALTERAR_STATUS",
                    // ...
                }
            });

            // 6. Efeito colateral: Financeiro
            if (input.status === "CANCELLED") {
                await tx.financialTransaction.updateMany({
                    where: { orderId: updated.id },
                    data: { status: "CANCELLED" }
                });
            }

            return updated;
        });
    });
```

---

## 4. Anti-Padrões (O que NÃO fazer)

*   ❌ **Usar `ctx.prisma` dentro de `$transaction`**: Sempre use o objeto `tx` passado no callback. Usar `ctx.prisma` ignora o contexto da transação.
*   ❌ **Operações assíncronas externas dentro do bloco**: Evite chamadas de API externas ou processamento de arquivos pesados dentro do `$transaction`, pois isso mantém a conexão com o banco aberta por muito tempo (locking).
*   ❌ **Esquecer o `return await`**: Sempre retorne a transação para que o tRPC resolva a Promise corretamente.

---

## 5. Manutenção e Auditoria
Sempre que uma nova tabela for adicionada que dependa do ciclo de vida do Pedido (Order), esta especificação deve ser atualizada e as mutações existentes revisadas para incluir o novo efeito colateral dentro das transações existentes.
