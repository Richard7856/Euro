-- Migration 016: Límite de crédito por cliente
-- Adds limite_credito (MXN) column to clientes table.
-- NULL means no limit configured.

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS limite_credito numeric(14, 2) DEFAULT NULL;

COMMENT ON COLUMN clientes.limite_credito IS
  'Límite de crédito autorizado en MXN. NULL = sin límite configurado.';
