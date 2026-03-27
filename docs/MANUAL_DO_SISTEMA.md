# Manual do Sistema - Vinyl SaaS

Este documento descreve as funcionalidades e o fluxo de uso do sistema Vinyl SaaS, projetado para gerenciamento de empresas de adesivagem e comunicação visual.

## 1. Autenticação e Acesso

### Login e Cadastro
- **Login (`/sign-in`)**: Tela de acesso para usuários cadastrados. Utiliza autenticação segura via Clerk.
- **Cadastro (`/sign-up`)**: Tela para registro de novos usuários/organizações. Cada usuário possui seu próprio ambiente isolado (Multi-tenant).

---

## 2. Visão Geral

### Dashboard (`/dashboard`)
A tela inicial do sistema oferece um resumo rápido da operação:
- Atalhos para as principais funcionalidades.
- (Futuro) Gráficos de faturamento e ordens recentes.

---

## 3. Cadastros Básicos

### Materiais (`/materials`)
Gerencie o estoque de vinis e insumos.
- **Funcionalidades**: Adicionar, Editar e Excluir materiais.
- **Campos Importantes**:
  - **Preço do Rolo**: Custo total de compra do rolo.
  - **Comprimento e Largura**: Dimensões do rolo para cálculo de custo por m².
  - **Cálculo Automático**: O sistema calcula automaticamente o custo por metro linear e por m² para usar nos orçamentos.

### Tipos de Serviço (`/services`)
Defina os serviços prestados e como eles são cobrados.
- **Cobrança Fixa**: Preço único independente do tamanho (ex: "Instalação de Logo Pequeno").
- **Cobrança por m²**: O preço é calculado com base nas dimensões (altura x largura) do material gasto.
- **Preço Padrão**: Define um valor base para agilizar o preenchimento de novas ordens.

---

## 4. Gestão de Ordens

### Lista de Ordens (`/orders`)
Visualização de todos os pedidos e orçamentos.
- **Status**: Pendente, Em Progresso, Concluído, Cancelado.
- **Resumo**: Mostra cliente, data e valor total.

### Nova Ordem (`/orders/new`)
A tela mais poderosa do sistema, projetada para orçamentos precisos.
- **Dados do Cliente**: Nome e informações básicas.
- **Itens do Pedido**:
  - Seleção de **Serviço** e **Material**.
  - **Dimensões**: Largura e Altura (em metros).
  - **Cálculo em Tempo Real**: O sistema calcula a área (m²), o custo do material usado e o preço final sugerido.
- **Análise Financeira (Preview)**:
  - **Margem de Desperdício**: Adicione uma porcentagem de segurança para perda de material.
  - **Comissão de Serviço**: Defina a porcentagem de comissão do aplicador.
  - **Lucro Real**: Veja exatamente quanto sobrará no bolso após descontar material e comissões de serviço.

### Detalhes da Ordem e Impressão (`/orders/[id]`)
Visualização completa de um pedido fechado.
- **Resumo Financeiro**: Detalhamento de custos, lucro bruto e margem de lucro (%) (Visível apenas na tela).
- **Modo de Impressão (PDF)**:
  - Ao clicar no ícone de **Impressora**, o sistema gera um layout limpo e profissional.
  - **Esconde**: Informações sensíveis como custos, lucro e margem.
  - **Mostra**: Cabeçalho personalizado da empresa, dados do cliente e lista de itens com totais.
  - Ideal para enviar como **Orçamento (PDF)** ou **Ordem de Serviço** para produção.

---

## 5. Configurações

### Configurações da Organização (`/settings`)
Personalize a aparência dos documentos gerados.
- **Dados da Empresa**: Nome Fantasia, CNPJ/CPF, Telefone, Email e Endereço.
- **Impacto**: Essas informações aparecem automaticamente no cabeçalho das impressões/PDFs gerados na tela de Detalhes da Ordem.
