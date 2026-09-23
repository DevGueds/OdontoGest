ALTER TABLE `usuarios` ADD COLUMN `senha_requer_troca` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `itens_pedido_pbs` ADD COLUMN `natureza` ENUM('CUSTEIO','INVESTIMENTO') NOT NULL DEFAULT 'CUSTEIO';
UPDATE `itens_pedido_pbs` i JOIN `materiais` m ON m.id = i.material_id SET i.natureza = m.natureza;
ALTER TABLE `materiais` ALTER COLUMN `qtd_estoque` SET DEFAULT 0;
ALTER TABLE `unidades_saude` ALTER COLUMN `orcamento_custeio` SET DEFAULT 0.00, ALTER COLUMN `orcamento_investimento` SET DEFAULT 0.00;
CREATE UNIQUE INDEX `itens_pedido_pbs_pedido_id_material_id_key` ON `itens_pedido_pbs` (`pedido_id`, `material_id`);
CREATE INDEX `pedidos_pbs_unidade_emitente_id_status_data_pedido_idx` ON `pedidos_pbs` (`unidade_emitente_id`, `status`, `data_pedido`);
CREATE INDEX `honorarios_odontologos_unidade_id_mes_referencia_idx` ON `honorarios_odontologos` (`unidade_id`, `mes_referencia`);
CREATE INDEX `chamados_manutencao_unidade_id_status_idx` ON `chamados_manutencao` (`unidade_id`, `status`);
CREATE INDEX `chamados_manutencao_equipamento_id_status_idx` ON `chamados_manutencao` (`equipamento_id`, `status`);
CREATE INDEX `entradas_recursos_unidade_id_mes_referencia_idx` ON `entradas_recursos` (`unidade_id`, `mes_referencia`);
ALTER TABLE `entradas_recursos` ADD CONSTRAINT `entradas_recursos_unidade_id_fkey` FOREIGN KEY (`unidade_id`) REFERENCES `unidades_saude` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `materiais` ADD CONSTRAINT `materiais_estoque_nao_negativo` CHECK (`qtd_estoque` >= 0), ADD CONSTRAINT `materiais_valor_nao_negativo` CHECK (`valor_estimado` >= 0);
ALTER TABLE `itens_pedido_pbs` ADD CONSTRAINT `itens_quantidades_validas` CHECK (`qtd_pedida` > 0 AND `qtd_atendida` >= 0 AND `qtd_atendida` <= `qtd_pedida`);
CREATE TABLE `audit_events` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `actor_id` INTEGER NULL,
  `action` VARCHAR(100) NOT NULL,
  `resource` VARCHAR(150) NOT NULL,
  `outcome` INTEGER NOT NULL,
  `request_id` VARCHAR(100) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `audit_events_created_at_idx` (`created_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
