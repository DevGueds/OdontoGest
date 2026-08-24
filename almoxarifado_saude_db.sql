CREATE DATABASE IF NOT EXISTS almoxarifado_saude_db
DEFAULT CHARACTER SET utf8mb4
DEFAULT COLLATE utf8mb4_unicode_ci;

USE almoxarifado_saude_db;

-- 1. Tabela de Unidades / Postos de Saúde Emitentes
CREATE TABLE IF NOT EXISTS unidades_saude (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL UNIQUE,
    tipo VARCHAR(50) DEFAULT 'USF', -- Ex: USF, PAM, SMS
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabela de Usuários e Perfis (Solicitante / Gestor)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(150) NOT NULL,
    funcao VARCHAR(100) NULL, -- Ex: Cirurgiã Dentista / Gestor
    registro VARCHAR(50) NULL, -- Ex: CRO/PA 0592
    perfil ENUM('SOLICITANTE', 'GESTOR') NOT NULL DEFAULT 'SOLICITANTE',
    unidade_id INT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (unidade_id) REFERENCES unidades_saude(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. Tabela Catálogo de Materiais / Insumos
CREATE TABLE IF NOT EXISTS materiais (
    id INT AUTO_INCREMENT PRIMARY KEY,
    descricao VARCHAR(255) NOT NULL UNIQUE,
    unidade_medida VARCHAR(20) NOT NULL, -- cx, un, pot, pct, etc.
    valor_estimado DECIMAL(10,2) DEFAULT 0.00,
    qtd_estoque INT NOT NULL DEFAULT 100,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Pedidos de Bens e Serviços (PBS) - Cabeçalho do Pedido
CREATE TABLE IF NOT EXISTS pedidos_pbs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero_pbs VARCHAR(50) NULL UNIQUE,
    unidade_emitente_id INT NOT NULL,
    data_pedido DATE NOT NULL,
    
    -- Responsável pelo pedido
    responsavel_nome VARCHAR(150) NOT NULL,
    responsavel_funcao VARCHAR(100) NULL,
    responsavel_registro VARCHAR(50) NULL,
    
    -- Dados orçamentários / administrativos
    atividade_programa VARCHAR(150) NULL,
    elemento_despesa VARCHAR(100) NULL,
    observacoes TEXT NULL,
    
    -- Status do ciclo de atendimento
    status ENUM('SOLICITADO', 'RECEBIDO', 'ENVIADO', 'ATENDIDO_PARCIAL', 'ATENDIDO_TOTAL', 'CANCELADO') 
        NOT NULL DEFAULT 'SOLICITADO',
        
    valor_total_estimado DECIMAL(10,2) DEFAULT 0.00,
    
    -- Rastreabilidade de Envio e Recebimento
    apontador_envio_nome VARCHAR(150) NULL,
    data_envio DATE NULL,
    
    apontador_recebimento_nome VARCHAR(150) NULL,
    data_recebimento DATE NULL,
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (unidade_emitente_id) REFERENCES unidades_saude(id)
) ENGINE=InnoDB;

-- 5. Itens Solicitados dentro do Pedido (PBS)
CREATE TABLE IF NOT EXISTS itens_pedido_pbs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    numero_item INT NOT NULL,
    material_id INT NOT NULL,
    
    -- Quantidades
    qtd_pedida INT NOT NULL,
    qtd_atendida INT DEFAULT 0,
    
    -- Valores
    valor_unitario DECIMAL(10,2) NULL,
    valor_total DECIMAL(10,2) NULL,
    
    FOREIGN KEY (pedido_id) REFERENCES pedidos_pbs(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES materiais(id)
) ENGINE=InnoDB;


-- =======================================================
-- CARGA INICIAL DE DADOS (POPULAÇÃO INICIAL DAS TABELAS)
-- =======================================================

-- 1. Unidades de Saúde Padrão
INSERT INTO unidades_saude (id, nome, tipo) VALUES 
(1, 'USF WALDEMAR QUEIROZ', 'USF'),
(2, 'PAM COSTA E SILVA', 'PAM'),
(3, 'SECRETARIA MUNICIPAL DE SAÚDE (SMS)', 'SMS')
ON DUPLICATE KEY UPDATE nome=nome;

-- 2. Cadastro Inicial de Usuários com Perfis
INSERT INTO usuarios (id, email, senha_hash, nome, funcao, registro, perfil, unidade_id) VALUES
(1, 'solicitante@saude.gov.br', '$2b$10$e8w6yQ6S0fP/JtYv.JpS3e8w6yQ6S0fP/JtYv.JpS3e8w6yQ6S0fP', 'Dra. Maria Fernanda Silva', 'Cirurgiã Dentista', 'CRO/PA 0592', 'SOLICITANTE', 1),
(2, 'gestor@saude.gov.br', '$2b$10$e8w6yQ6S0fP/JtYv.JpS3e8w6yQ6S0fP/JtYv.JpS3e8w6yQ6S0fP', 'Carlos Eduardo Almoxarife', 'Gestor de Almoxarifado', 'SMS/PA 1020', 'GESTOR', 3)
ON DUPLICATE KEY UPDATE email=email;

-- 3. Catálogo de Materiais
INSERT INTO materiais (id, descricao, unidade_medida, valor_estimado, qtd_estoque) VALUES
(1, 'Luvas (P)', 'cx', 45.50, 100),
(2, 'Anestésico Lidostesim', 'cx', 120.00, 50),
(3, 'Fio sutura Nylon 40 (45cm) 1/2 curva', 'cx', 65.00, 60),
(4, 'Dycal', 'un', 85.00, 40),
(5, 'Ácido Fosfórico', 'pot', 35.00, 30),
(6, 'Resina Composta (A3) - Master Fill', 'un', 95.00, 45),
(7, 'Escovinha Robson', 'un', 4.50, 200),
(8, 'Sugador', 'un', 0.80, 500),
(9, 'Tesoura Íris', 'un', 38.00, 25),
(10, 'Endo Z (broca)', 'un', 42.00, 30),
(11, 'Álcool 70%', 'un', 12.50, 80),
(12, 'Lubrificante p/ Caneta', 'un', 55.00, 15),
(13, 'Algodão', 'un', 18.00, 150),
(14, 'Papel Toalha', 'pct', 15.00, 120),
(15, 'Espelho c/ cabo', 'un', 22.00, 35)
ON DUPLICATE KEY UPDATE descricao=descricao;
