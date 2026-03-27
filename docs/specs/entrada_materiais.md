# Especificação Técnica: Registro de Entrada de Materiais e Atualização de Estoque

**Projeto:** vinyl
**Estado:** Em Revisão
**Autor:** Tallis
**Data:** 16 de março de 2026

---

## 1. Visão Geral
Permitir o registro de entrada de materiais no sistema de forma que a quantidade em estoque seja atualizada (somada) automaticamente, garantindo a rastreabilidade de todas as operações de inventário através de um histórico de movimentações.

## 2. Atores
* **Operador de Estoque / Usuário:** Pessoa responsável por registrar o recebimento físico do material.
* **Sistema:** Processa a validação, a atualização do saldo e a gravação do log de auditoria.

## 3. Regras de Negócio e Pré-condições
* **Pré-condição:** O material a ser movimentado já deve estar previamente cadastrado no catálogo do sistema.
* **RN01 (Validação de Quantidade):** A quantidade de entrada deve ser estritamente superior a zero.
* **RN02 (Rastreabilidade):** Toda operação de entrada que alterar o saldo do estoque deve gerar obrigatoriamente um registro no histórico de movimentações (tabela de transações), contendo a data, hora, tipo de operação (Entrada), material, quantidade e o usuário responsável.

## 4. Casos de Uso e Fluxos

### 4.1. Caminho Feliz (Fluxo Principal)
1. O usuário acessa a interface de entrada de materiais.
2. O usuário seleciona o material desejado a partir do catálogo existente.
3. O usuário insere a quantidade recebida e aciona a confirmação da operação.
4. O sistema valida os dados (verificando se a quantidade é > 0).
5. O sistema soma a quantidade inserida ao valor de estoque atual do material selecionado.
6. O sistema grava o registro detalhado da transação no histórico.
7. O sistema exibe uma mensagem de sucesso ("Entrada registrada com sucesso").

### 4.2. Fluxos de Exceção e Erros
* **E1 - Quantidade Inválida (Zero ou Negativa):** Se o usuário tentar inserir uma quantidade igual ou menor que zero, o sistema bloqueia a submissão e exibe a mensagem: "A quantidade de entrada deve ser superior a zero."
* **E2 - Falha de Integridade (Banco de Dados):** Se ocorrer um erro durante a atualização do saldo ou a gravação do histórico, o sistema deve reverter a operação inteira (rollback), não alterar o saldo atual e exibir a mensagem: "Erro interno ao processar a entrada. Tente novamente."

## 5. Critérios de Aceitação (Gherkin/BDD)

**Cenário 1: Atualização de estoque com sucesso**
* **Dado** que o material "Cabo de Energia" possui 10 unidades em estoque
* **Quando** o usuário registra uma entrada de 5 unidades
* **Então** o estoque atual do material "Cabo de Energia" deve passar a ser de 15 unidades
* **E** deve ser criado um registro do tipo "Entrada" com 5 unidades no histórico de movimentações.

**Cenário 2: Tentativa de entrada com valor inválido**
* **Dado** que o usuário está na interface de entrada de materiais
* **Quando** tenta registrar uma entrada de 0 (zero) ou -3 unidades para qualquer material
* **Então** o sistema deve rejeitar a operação
* **E** deve exibir a mensagem de erro "A quantidade de entrada deve ser superior a zero."
* **E** o saldo do material deve permanecer inalterado.

## 6. Notas Técnicas e Arquitetura
* **Transações de Banco de Dados:** A operação de leitura do saldo atual, a atualização (UPDATE) da nova quantidade na tabela de materiais e a inserção (INSERT) na tabela de histórico de movimentações **devem** ocorrer dentro de uma única `Database Transaction`. Isso é crucial para evitar inconsistências caso o sistema caia no meio do processo.