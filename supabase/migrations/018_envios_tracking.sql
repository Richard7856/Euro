-- Migration 018: Add GPS tracking columns to envios table
-- These columns support real-time tracking via carrier APIs (Estafeta, DHL, FedEx)
-- and manual GPS coordinate entry.

ALTER TABLE envios
  ADD COLUMN IF NOT EXISTS carrier               text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lat_actual            numeric(9,6) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lng_actual            numeric(9,6) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS temperatura_actual    numeric(5,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ultima_actualizacion  timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tracking_eventos      jsonb DEFAULT NULL;

-- Index for carrier-based queries
CREATE INDEX IF NOT EXISTS idx_envios_carrier ON envios(carrier) WHERE carrier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_envios_ultima_actualizacion ON envios(ultima_actualizacion) WHERE ultima_actualizacion IS NOT NULL;
