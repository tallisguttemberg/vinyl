# Especificação Técnica: Sincronização Financeira Automática (Caixa, Entradas e Saídas)

**Projeto:** vinyl
**Estado:** Em Revisão / Planejamento
**Autor:** Tallis / AI Assistant
**Data:** 26 de março de 2026

---

## 1. Visão Geral
O sistema deve garantir que **todas as movimentações de dinheiro, sejam entradas (Receitas) ou saídas (Despesas), reflitam automaticamente no módulo Financeiro (Contas a Pagar e a Receber)**. A premissa central de controle de estoque dita que **nenhum material, insumo ou equipamento pode ter saldo adicionado ao estoque sem que o pagamento associado a sua compra seja lançado e concluído no módulo financeiro**.

## 2. Atores
* **Gestor / Administrador:** Acompanha os relatórios financeiros.
* **Operador (Estoque/Atendimento):** Insere a ordem de serviço ou recebe materiais, preenchendo as informações de forma transparente sem ter que acessar o módulo financeiro diretamente na maioria das vezes.
* **Sistema:** Responsável por sincronizar debaixo dos panos as tabelas e saldos do financeiro, garantindo a integridade dos dados (não permite estoque sem lançamento de despesa, nem serviço sem lançamento de receita).

## 3. Regras de Negócio e Pré-condições

* **RN01 (Criação de Entradas - Receitas):**
  Sempre que uma **Ordem de Serviço (OS)** for cadastrada no sistema, será gerada instantaneamente uma transação financeira do tipo "A Receber" (RECEIVABLE) vinculada à OS. 
  * O método de pagamento será exigido apenas na hora da "baixa" (pagamento feito pelo cliente).
  * O cancelamento/exclusão da OS irá alterar o status da transação financeira originada para "Cancelada".
  * Alterações no valor/itens da OS replicarão atualização em cascata no valor do financeiro.

* **RN02 (Obrigatoriedade de Saídas - Compras para Estoque):**
  **"Insumos e materiais só podem ser adicionados ao estoque quando forem pagos."**
  * Para alimentar o estoque (criar material/insumo com saldo > 0 ou fazer "Entrada/Adição de Estoque"), o usuário **deverá obrigatoriamente** informar:
    - O Fornecedor (obrigatório em todos)
    - O Valor da Compra / Preço de Custo 
    - O Método de Pagamento (PIX, Boleto, Cartão, Dinheiro, etc)
    - A Data do Pagamento
  * O sistema vai gerar automaticamente uma "Conta a Pagar" (PAYABLE) no Módulo Financeiro, atrelada à categoria "Materiais" ou "Equipamentos".
  * A atualização do saldo (X unidades ou ml a mais no estoque) será bloqueada e só ocorrerá mediante a geração da transação de saída estritamente atrelada ao registro pago.

* **RN03 (Método de Pagamento Obrigatório):**
  Qualquer lançamento liquidado (seja ao comprar estoque e pagar à vista, ou ao dar "baixa rápida" no módulo Pagar/Receber) obriga o preenchimento do método de pagamento.
  O sistema nunca validará um registro em estado "PAID" sem ter a destinação de método clara.

## 4. O que precisa ser desenvolvido (UI e Backend)

### 4.1. Cadastro e Tela de Aquisição de Materiais
- Remover a simples inserção de saldo livre "Mudar Quantidade".
- Adicionar no Formulário de Material, Insumos e Equipamentos:
  - Uma seção ou aba "Dados da Compra" ou modal específico de "Registrar Compra".
  - Campos obrigatórios da compra: Valor Total Pago, Método de Pagamento, Referência/NF (opcional).
- O backend deve receber esses dados de compra na rota tRPC correspondente (`material.create`, `material.addStock`, etc) e abrir uma Transaction no banco (`$transaction`) que:
  1. Cria e finaliza como PAID a transação Financeira da compra.
  2. Adiciona as quantidades ao estoque.
  *Se houver falha ao lançar a despesa, o estoque sofre rollback.*

### 4.2 Arquitetura TBD (A Ser Definida)
- As requisições (Entradas de Custo) trarão um link `orderId` ou similar (no caso de compras seria `materialId`) no objeto do Financeiro. Poderá ser necessário criar uma ligação `purchaseId` na tabela ou usar o campo `description` para descrever o qual material gerou o gasto caso as entidades não tenham relacionamento direto.

## 5. Critérios de Aceitação (Gherkin/BDD)

**Cenário 1: Tentativa de adicionar estoque de Vinil sem informar preço e como foi pago**
* **Dado** que o operador clica para dar "Entrada / Novo Material" de "Vinil Fosco"
* **Quando** o operador preenche: +10 Rolos, mas não preenche o método de pagamento nem o valor da compra
* **Então** o sistema desabilita o botão Salvar
* **E** notifica "Operação Bloqueada: É obrigatório informar o Método de Pagamento e o Valor para computar a saída financeira correspondente à compra."

**Cenário 2: Adição de Insumo com transação com sucesso**
* **Dado** que o operador preenche: Insumo "Fita" +5 unidades, Custo Total: R$ 50, Pago via PIX.
* **Quando** ele salva
* **Então** o estoque de Fita sobe em +5.
* **E** IMEDIATAMENTE surge em *Contas a Pagar* um registro na tela de Financeiro de "R$ -50,00" (Categoria: Materiais), Status: "Pago/Recebido", Método: "PIX".

