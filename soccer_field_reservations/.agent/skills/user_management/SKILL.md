---
name: Cadastro de Usuários e Controle de Acesso (ADM / USER)
description: Permitir o cadastro e gerenciamento de usuários no sistema, definindo perfis de acesso (ADM e USER).
---
# Skill: Cadastro de Usuários e Controle de Acesso (ADM / USER)

## Objetivo
Permitir o cadastro e gerenciamento de usuários no sistema,
definindo perfis de acesso (ADM e USER),
onde usuários administradores possuem permissão total de edição
e usuários comuns possuem acesso apenas de visualização.

## Premissas Obrigatórias
- Controle de acesso deve ser centralizado no backend
- Frontend apenas reflete permissões retornadas pela API
- Usuários sempre possuem um perfil explícito
- Backend é a fonte única de verdade para permissões
- Frontend não deve confiar apenas em lógica visual para segurança

---

## Perfis de Usuário

### ADM
Permissões:
- Criar usuários
- Editar usuários
- Visualizar todos os dados
- Criar, editar e remover registros em todas as telas
- Acessar relatórios administrativos
- Gerenciar campos, reservas, pagamentos e bloqueios

### USER
Permissões:
- Visualizar dados permitidos
- Consultar campos
- Consultar reservas próprias
- Consultar status de pagamento

Restrições:
- Não pode criar, editar ou remover registros
- Não pode acessar telas administrativas
- Não pode alterar dados do sistema

---

## Modelo Conceitual de Usuário

Cada usuário deve possuir:
- Identificador único
- Nome
- Login (email ou CPF)
- Senha (armazenada apenas no backend, criptografada)
- Perfil (ADM ou USER)
- Status (ativo ou inativo)

---

## Funcionalidades Obrigatórias

### 1. Cadastro de Usuários
Permitir criação de usuários no sistema.

Regras:
- A apenas usuários ADM podem cadastrar novos usuários
- Perfil do usuário deve ser definido no cadastro
- Login deve ser único
- Senha deve seguir política mínima definida pelo backend

---

### 2. Edição de Usuários
Permitir atualização de dados de usuários.

Regras:
- Apenas ADM pode editar perfil de outros usuários
- USER pode editar apenas seus próprios dados permitidos
- Alteração de perfil exige permissão ADM

---

### 3. Ativação e Desativação
Controlar acesso via status do usuário.

Regras:
- Usuários inativos não podem autenticar
- Apenas ADM pode ativar ou desativar usuários
- Desativação não remove dados históricos

---

## Autorização e Controle de Acesso

### Regras Obrigatórias
- Backend deve validar perfil antes de qualquer operação sensível
- Frontend deve ocultar ações não permitidas ao perfil
- Backend deve rejeitar qualquer tentativa não autorizada
- Nenhuma rota sensível deve depender apenas do frontend

---

## Contratos de API Obrigatórios

### Criar Usuário
- `POST /api/v1/usuarios`

Request:
```json
{
  "nome": "string",
  "login": "string",
  "senha": "string",
  "perfil": "ADM | USER"
}
```
