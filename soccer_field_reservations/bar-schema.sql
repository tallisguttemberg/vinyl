-- ==============================================================================
-- Schema: bar
-- Description: Isolated schema for Bar Microservice
-- ==============================================================================

CREATE SCHEMA IF NOT EXISTS bar;

-- ==============================================================================
-- Tables - BAR SCHEMA
-- ==============================================================================

-- Tabela: produtos
CREATE TABLE IF NOT EXISTS bar.produtos (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    preco DECIMAL(10, 2) NOT NULL CHECK (preco >= 0),
    estoque INTEGER NOT NULL DEFAULT 0 CHECK (estoque >= 0),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: vendas
CREATE TABLE IF NOT EXISTS bar.vendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL, -- Referência lógica ao usuário do sistema principal
    reserva_id UUID,          -- Referência lógica opcional à reserva
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valor_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ABERTA' CHECK (status IN ('ABERTA', 'PAGA', 'CANCELADA'))
);

-- Tabela: itens_venda
CREATE TABLE IF NOT EXISTS bar.itens_venda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venda_id UUID NOT NULL REFERENCES bar.vendas(id) ON DELETE CASCADE,
    produto_id BIGINT NOT NULL REFERENCES bar.produtos(id),
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10, 2) NOT NULL CHECK (preco_unitario >= 0)
);

-- Tabela: pagamentos_bar
CREATE TABLE IF NOT EXISTS bar.pagamentos_bar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venda_id UUID NOT NULL REFERENCES bar.vendas(id),
    forma_pagamento VARCHAR(50) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),
    data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela: usuarios (AGORA NO SCHEMA BAR)
CREATE TABLE IF NOT EXISTS bar.usuarios (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Em produção, usar hash!
    role VARCHAR(20) NOT NULL
);

-- Seeding inicial (apenas se não existir)
INSERT INTO bar.usuarios (username, password, role)
VALUES ('admin', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymYen6D0H5r.mKntC9isS2', 'ADMIN')
ON CONFLICT (username) DO NOTHING;

INSERT INTO bar.usuarios (username, password, role)
VALUES ('user', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymYen6D0H5r.mKntC9isS2', 'USER')
ON CONFLICT (username) DO NOTHING;

-- ==============================================================================
-- Indexes
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_bar_vendas_usuario ON bar.vendas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_bar_vendas_reserva ON bar.vendas(reserva_id);
CREATE INDEX IF NOT EXISTS idx_bar_vendas_data ON bar.vendas(data_venda);

-- ==============================================================================
-- User / Roles
-- ==============================================================================

-- Criar usuário exclusivo do módulo BAR (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_bar') THEN
    CREATE USER app_bar WITH PASSWORD 'bar_secure_pass_123';
  END IF;
END
$$;

-- Garantir acesso ao banco
GRANT CONNECT ON DATABASE reservations TO app_bar;

-- Permitir uso do schema bar
GRANT USAGE ON SCHEMA bar TO app_bar;

-- Permissões completas nas tabelas do schema bar
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA bar TO app_bar;

-- Permitir uso de sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA bar TO app_bar;

-- Garantir que futuras tabelas/sequences herdem permissões
ALTER DEFAULT PRIVILEGES IN SCHEMA bar GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_bar;
ALTER DEFAULT PRIVILEGES IN SCHEMA bar GRANT USAGE, SELECT ON SEQUENCES TO app_bar;
