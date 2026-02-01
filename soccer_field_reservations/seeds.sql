-- Arquivo de Carga de Dados (Seeds)
-- Project: Football Field Reservation System

-- Limpeza (opcional, cuidado em produção)
TRUNCATE pagamentos, reservas, itens_venda, vendas, produtos, horarios_bloqueados, campos, clientes CASCADE;

-- 1. Clientes (8 clientes)
INSERT INTO clientes (nome, email, cpf, telefone) VALUES
('Carlos Silva', 'carlos.silva@email.com', '111.111.111-11', '(11) 99999-1001'),
('Ana Paula', 'ana.paula@email.com', '222.222.222-22', '(11) 99999-1002'),
('Marcos Santos', 'marcos.santos@email.com', '333.333.333-33', '(11) 99999-1003'),
('Julia Costa', 'julia.costa@email.com', '444.444.444-44', '(11) 99999-1004'),
('Roberto Souza', 'roberto.souza@email.com', '555.555.555-55', '(11) 99999-1005'),
('Fernanda Lima', 'fernanda.lima@email.com', '666.666.666-66', '(11) 99999-1006'),
('Ricardo Oliveira', 'ricardo.oliveira@email.com', '777.777.777-77', '(11) 99999-1007'),
('Patricia Gomes', 'patricia.gomes@email.com', '888.888.888-88', '(11) 99999-1008');

-- 2. Campos (4 campos)
INSERT INTO campos (nome, tipo, valor_hora, descricao) VALUES
('Arena Principal', 'Grama Sintética', 150.00, 'Campo oficial society com iluminação LED'),
('Quadra 1', 'Salão', 100.00, 'Quadra coberta piso rápido'),
('Campo Society B', 'Grama Sintética', 130.00, 'Campo reduzido ideal para 5x5'),
('Arena Premium', 'Grama Natural', 200.00, 'Campo de grama natural tamanho oficial');

-- 3. Produtos (Lanchonete)
INSERT INTO produtos (nome, preco, estoque) VALUES
('Gatorade', 8.50, 100),
('Água Mineral', 4.00, 200),
('Cerveja Lata', 6.00, 150),
('Salgado', 7.00, 50),
('Aluguel Colete', 15.00, 20);

-- 4. Reservas
-- Vamos usar blocos DO para buscar IDs dinamicamente e evitar erros de UUID hardcoded
DO $$
DECLARE
    c_carlos UUID;
    c_ana UUID;
    c_marcos UUID;
    cp_arena UUID;
    cp_quadra UUID;
    cp_society UUID;
    r_id UUID;
BEGIN
    SELECT id INTO c_carlos FROM clientes WHERE email = 'carlos.silva@email.com';
    SELECT id INTO c_ana FROM clientes WHERE email = 'ana.paula@email.com';
    SELECT id INTO c_marcos FROM clientes WHERE email = 'marcos.santos@email.com';
    
    SELECT id INTO cp_arena FROM campos WHERE nome = 'Arena Principal';
    SELECT id INTO cp_quadra FROM campos WHERE nome = 'Quadra 1';
    SELECT id INTO cp_society FROM campos WHERE nome = 'Campo Society B';

    -- Reserva 1: Carlos na Arena (Confirmada e Paga)
    INSERT INTO reservas (cliente_id, campo_id, data_reserva, hora_inicio, hora_fim, valor, status)
    VALUES (c_carlos, cp_arena, CURRENT_DATE + 1, '18:00', '19:00', 150.00, 'CONFIRMADA')
    RETURNING id INTO r_id;
    
    INSERT INTO pagamentos (reserva_id, valor, metodo_pagamento) 
    VALUES (r_id, 150.00, 'PIX');

    -- Reserva 2: Ana na Quadra (Agendada)
    INSERT INTO reservas (cliente_id, campo_id, data_reserva, hora_inicio, hora_fim, valor, status)
    VALUES (c_ana, cp_quadra, CURRENT_DATE + 2, '19:00', '21:00', 200.00, 'AGENDADA');

    -- Reserva 3: Marcos no Society (Concluída e Paga)
    INSERT INTO reservas (cliente_id, campo_id, data_reserva, hora_inicio, hora_fim, valor, status)
    VALUES (c_marcos, cp_society, CURRENT_DATE - 1, '20:00', '21:00', 130.00, 'CONCLUIDA')
    RETURNING id INTO r_id;

    INSERT INTO pagamentos (reserva_id, valor, metodo_pagamento) 
    VALUES (r_id, 130.00, 'Cartão');
    
    -- Reserva 4: Carlos na Quadra (Cancelada)
    INSERT INTO reservas (cliente_id, campo_id, data_reserva, hora_inicio, hora_fim, valor, status)
    VALUES (c_carlos, cp_quadra, CURRENT_DATE + 5, '10:00', '11:00', 100.00, 'CANCELADA');

    -- Mais reservas para volume
    INSERT INTO reservas (cliente_id, campo_id, data_reserva, hora_inicio, hora_fim, valor, status)
    VALUES (c_ana, cp_arena, CURRENT_DATE + 3, '22:00', '23:00', 150.00, 'AGENDADA');

END $$;

-- 5. Horários Bloqueados
DO $$
DECLARE
    cp_premium UUID;
BEGIN
    SELECT id INTO cp_premium FROM campos WHERE nome = 'Arena Premium';
    
    INSERT INTO horarios_bloqueados (campo_id, data_inicio, data_fim, motivo)
    VALUES (cp_premium, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 days', 'Manutenção do gramado');
END $$;

-- 6. Vendas Lanchonete (Teste de Trigger)
DO $$
DECLARE
    c_carlos UUID;
    p_gatorade UUID;
    p_agua UUID;
    v_id UUID;
BEGIN
    SELECT id INTO c_carlos FROM clientes WHERE email = 'carlos.silva@email.com';
    SELECT id INTO p_gatorade FROM produtos WHERE nome = 'Gatorade';
    SELECT id INTO p_agua FROM produtos WHERE nome = 'Água Mineral';

    -- Venda 1
    INSERT INTO vendas (cliente_id, total) VALUES (c_carlos, 21.00) RETURNING id INTO v_id;
    
    -- Itens (deve baixar estoque)
    INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario) VALUES
    (v_id, p_gatorade, 2, 8.50), -- -2 Gatorades
    (v_id, p_agua, 1, 4.00);     -- -1 Água
END $$;

-- 7. Usuarios (Admin)
INSERT INTO usuarios (login, senha_hash, role) VALUES
('admin', '$2a$10$8.UnVuG9HHgffUDAlk8qfOuVGkqRzgVymYen6D0H5r.mKntC9isS2', 'ADMIN');
