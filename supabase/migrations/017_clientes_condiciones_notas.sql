-- Añade columnas condiciones_cobro y notas a la tabla clientes
-- Estas columnas existen en el Google Sheets original y se usan en la importación CSV

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS condiciones_cobro text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notas             text DEFAULT NULL;

COMMENT ON COLUMN clientes.condiciones_cobro IS 'Condiciones de cobro acordadas con el cliente (ej: contado, 30 días, etc.)';
COMMENT ON COLUMN clientes.notas             IS 'Notas internas del cliente';
