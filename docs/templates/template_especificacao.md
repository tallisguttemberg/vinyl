# Especificação Técnica: [Nome da Funcionalidade]

**Projeto:** vinyl
**Estado:** [Rascunho | Em Revisão | Aprovado | Implementado]
**Autor:** [Nome do Desenvolvedor / Arquiteto]
**Data:** [Data da criação]

---

## 1. Visão Geral
*Uma descrição clara e concisa sobre o problema a resolver e o valor que a funcionalidade entrega ao sistema.*

**Exemplo:**
Permitir o registo de entrada de materiais no sistema de forma a que a quantidade em stock seja atualizada automaticamente, garantindo a rastreabilidade das operações de inventário.

## 2. Atores
*Quem ou o que vai interagir com esta funcionalidade?*

**Exemplo:**
* Gestor de Armazém (inicia a operação).
* Sistema (processa a atualização e guarda o histórico).

## 3. Regras de Negócio e Pré-condições
*Restrições absolutas e o estado em que o sistema deve estar antes da ação ocorrer.*

**Exemplo:**
* **Pré-condição:** O material a receber já tem de estar previamente registado no catálogo do sistema.
* **RN01:** A quantidade de entrada tem de ser estritamente superior a zero.
* **RN02:** Cada operação de entrada deve gerar obrigatoriamente um registo no histórico de transações para fins de auditoria.

## 4. Casos de Uso e Fluxos
### 4.1. Caminho Feliz (Fluxo Principal)
*O passo a passo de como a funcionalidade deve operar quando tudo corre bem.*

1. O utilizador acede ao ecrã de entrada de materiais.
2. Seleciona o material pretendido a partir da lista disponível.
3. Insere a quantidade recebida e confirma a operação.
4. O sistema valida os dados de entrada.
5. O sistema soma a quantidade inserida ao valor de stock atual do material.
6. O sistema guarda o registo detalhado da transação (data, hora, material, quantidade, utilizador).
7. O utilizador recebe uma mensagem de confirmação de sucesso.

### 4.2. Fluxos de Exceção e Erros
*O que o sistema deve fazer quando algo foge ao padrão.*

* **E1 - Quantidade Inválida:** Se o utilizador tentar inserir uma quantidade igual ou inferior a zero, o sistema bloqueia a submissão e apresenta a mensagem: "A quantidade deve ser superior a zero."
* **E2 - Falha na Transação:** Se ocorrer um erro na base de dados durante a atualização, o sistema reverte a operação (rollback), não guarda o histórico e informa o utilizador do erro técnico.

## 5. Critérios de Aceitação (Gherkin/BDD)
*Estas são as regras exatas que dizem quando a funcionalidade está pronta. Servem de guião direto para os testes automatizados.*

**Cenário 1: Atualização de stock com sucesso**
* **Dado** que o material "Cabo de Cobre" tem 10 unidades em stock
* **Quando** o utilizador regista uma entrada de 5 unidades
* **Então** o stock atual do material "Cabo de Cobre" deve passar a ser de 15 unidades
* **E** deve ser criado um registo de "Entrada" com 5 unidades no histórico de transações.

**Cenário 2: Tentativa de entrada com valor negativo**
* **Dado** que o utilizador está no ecrã de entrada de materiais
* **Quando** tenta registar uma entrada de -2 unidades
* **Então** o sistema deve rejeitar a operação
* **E** deve exibir uma mensagem de erro de validação.

## 6. Notas Técnicas e Arquitetura (Opcional)
*Espaço para detalhar modelos de dados, endpoints de API ou considerações de performance relevantes para a implementação.*

* **Tabelas afetadas:** `materials`, `inventory_transactions`.
* **Atenção:** Garantir que a operação de leitura do saldo atual e a adição da nova quantidade ocorrem dentro da mesma transação de base de dados (Database Transaction) para evitar problemas de concorrência.