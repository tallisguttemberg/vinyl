-- Skils: Database (PostgreSQL)
-- Project: Football Field Reservation System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. Tables
-- ==============================================================================

-- Tabela: clientes
-- Armazena as informações dos clientes que fazem as reservas.
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE clientes IS 'Armazena informações cadastrais dos clientes.';
COMMENT ON COLUMN clientes.cpf IS 'CPF do cliente (chave única).';

-- Tabela: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    login VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(255) NOT NULL DEFAULT 'Administrador',
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
    ativo BOOLEAN DEFAULT TRUE
);

-- Tabela: campos
-- Representa os campos de futebol disponíveis para reserva.
CREATE TABLE campos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- ex: Society, Grama Sintética, Salão
    valor_hora DECIMAL(10, 2) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE campos IS 'Cadastros dos campos disponíveis para locação.';

-- Tabela: reservas
-- Tabela principal que gerencia os agendamentos.
CREATE TABLE reservas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    campo_id UUID NOT NULL REFERENCES campos(id),
    data_reserva DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'AGENDADA' CHECK (status IN ('AGENDADA', 'CONFIRMADA', 'CANCELADA', 'CONCLUIDA')),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_horario CHECK (hora_fim > hora_inicio)
);

COMMENT ON TABLE reservas IS 'Registro das reservas efetuadas.';

-- Tabela: pagamentos
-- Gestão financeira das reservas.
CREATE TABLE pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reserva_id UUID NOT NULL REFERENCES reservas(id),
    valor DECIMAL(10, 2) NOT NULL,
    data_pagamento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metodo_pagamento VARCHAR(50), -- ex: PIX, Cartão, Dinheiro
    status VARCHAR(20) DEFAULT 'APROVADO'
);

COMMENT ON TABLE pagamentos IS 'Registro dos pagamentos vinculados às reservas.';

-- Tabela: horarios_bloqueados
-- Para manutenção ou outros impedimentos do campo.
CREATE TABLE horarios_bloqueados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campo_id UUID NOT NULL REFERENCES campos(id),
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    motivo TEXT
);

COMMENT ON TABLE horarios_bloqueados IS 'Períodos em que o campo está indisponível para reservas.';

-- Tabela: produtos (Recurso Adicional: Lanchonete/Vestiário)
CREATE TABLE produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    estoque INTEGER DEFAULT 0
);

COMMENT ON TABLE produtos IS 'Produtos disponíveis na lanchonete.';

-- Tabela: vendas
CREATE TABLE vendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id),
    total DECIMAL(10, 2) DEFAULT 0,
    data_venda TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE vendas IS 'Registro de vendas da lanchonete.';

-- Tabela: itens_venda
CREATE TABLE itens_venda (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venda_id UUID NOT NULL REFERENCES vendas(id),
    produto_id UUID NOT NULL REFERENCES produtos(id),
    quantidade INTEGER NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL
);

COMMENT ON TABLE itens_venda IS 'Itens individuais de uma venda.';

-- ==============================================================================
-- 2. Views
-- ==============================================================================

-- View: v_reservas_completas
-- Visão unificada para facilitar consultas de reservas.
CREATE OR REPLACE VIEW v_reservas_completas AS
SELECT 
    r.id AS reserva_id,
    c.nome AS cliente_nome,
    c.email AS cliente_email,
    cp.nome AS campo_nome,
    r.data_reserva,
    r.hora_inicio,
    r.hora_fim,
    r.valor,
    r.status
FROM reservas r
JOIN clientes c ON r.cliente_id = c.id
JOIN campos cp ON r.campo_id = cp.id;

-- View: v_ocupacao_campos
-- Estatísticas básicas de ocupação.
CREATE OR REPLACE VIEW v_ocupacao_campos AS
SELECT 
    cp.nome AS campo_nome,
    COUNT(r.id) AS total_reservas,
    SUM(r.valor) AS receita_total
FROM campos cp
LEFT JOIN reservas r ON cp.id = r.campo_id AND r.status != 'CANCELADA'
GROUP BY cp.nome;

-- View: v_faturamento_mensal
-- Agrupamento de receita por mês.
CREATE OR REPLACE VIEW v_faturamento_mensal AS
SELECT 
    TO_CHAR(data_reserva, 'YYYY-MM') AS mes,
    SUM(valor) AS faturamento
FROM reservas
WHERE status != 'CANCELADA'
GROUP BY TO_CHAR(data_reserva, 'YYYY-MM')
ORDER BY mes DESC;

-- ==============================================================================
-- 3. Functions / Procedures
-- ==============================================================================

-- Function: verificar_disponibilidade
-- Retorna TRUE se o horário estiver livre.
CREATE OR REPLACE FUNCTION verificar_disponibilidade(
    p_campo_id UUID, 
    p_data DATE, 
    p_hora_inicio TIME, 
    p_hora_fim TIME
) RETURNS BOOLEAN AS $$
DECLARE
    conflitos INTEGER;
BEGIN
    SELECT COUNT(*) INTO conflitos
    FROM reservas
    WHERE campo_id = p_campo_id
      AND data_reserva = p_data
      AND status != 'CANCELADA'
      AND (
          (hora_inicio < p_hora_fim AND hora_fim > p_hora_inicio)
      );
    
    RETURN conflitos = 0;
END;
$$ LANGUAGE plpgsql;

-- Function: calcular_valor_reserva
-- Calcula valor baseado no preço do campo e duração.
CREATE OR REPLACE FUNCTION calcular_valor_reserva(
    p_campo_id UUID, 
    p_duracao_horas DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_valor_hora DECIMAL;
BEGIN
    SELECT valor_hora INTO v_valor_hora FROM campos WHERE id = p_campo_id;
    RETURN Coalesce(v_valor_hora, 0) * p_duracao_horas;
END;
$$ LANGUAGE plpgsql;

-- Function: gerar_relatorio_ocupacao
-- Exemplo de função que retorna uma tabela
CREATE OR REPLACE FUNCTION gerar_relatorio_ocupacao(p_data_inicio DATE, p_data_fim DATE)
RETURNS TABLE (
    campo_nome VARCHAR,
    total_horas DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.nome,
        SUM(EXTRACT(EPOCH FROM (r.hora_fim - r.hora_inicio))/3600)::DECIMAL
    FROM reservas r
    JOIN campos c ON r.campo_id = c.id
    WHERE r.data_reserva BETWEEN p_data_inicio AND p_data_fim
      AND r.status != 'CANCELADA'
    GROUP BY c.nome;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 4. Triggers
-- ==============================================================================

-- Trigger: atualizar_estoque
-- Baixa o estoque ao inserir um item de venda.
CREATE OR REPLACE FUNCTION trg_atualizar_estoque() RETURNS TRIGGER AS $$
BEGIN
    UPDATE produtos
    SET estoque = estoque - NEW.quantidade
    WHERE id = NEW.produto_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER atualizar_estoque
AFTER INSERT ON itens_venda
FOR EACH ROW
EXECUTE FUNCTION trg_atualizar_estoque();

-- Trigger: validar_horario_reserva
-- Garante que não haja sobreposição antes de inserir.
CREATE OR REPLACE FUNCTION trg_validar_reserva() RETURNS TRIGGER AS $$
BEGIN
    IF NOT verificar_disponibilidade(NEW.campo_id, NEW.data_reserva, NEW.hora_inicio, NEW.hora_fim) THEN
        RAISE EXCEPTION 'Horário indisponível para este campo.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validar_horario_reserva
BEFORE INSERT ON reservas
FOR EACH ROW
EXECUTE FUNCTION trg_validar_reserva();

-- Trigger: atualizar_timestamp
-- Atualiza o campo atualizado_em automaticamente.
CREATE OR REPLACE FUNCTION trg_atualizar_timestamp() RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER atualizar_timestamp
BEFORE UPDATE ON reservas
FOR EACH ROW
EXECUTE FUNCTION trg_atualizar_timestamp();
