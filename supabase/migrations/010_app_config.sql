-- Configuración global de la app (ej. tipo de cambio USD -> MXN).
-- Solo admin puede actualizar vía API; lectura para usuarios autenticados.

CREATE TABLE IF NOT EXISTS public.app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Valor por defecto: 1 USD = 18 MXN
INSERT INTO public.app_config (key, value)
VALUES ('usd_to_mxn', '18')
ON CONFLICT (key) DO NOTHING;

-- RLS: cualquier autenticado puede leer; actualizaciones se hacen vía API con verificación de admin
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read app_config"
  ON public.app_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can update app_config"
  ON public.app_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.app_config IS 'Configuración global (tipo de cambio, etc.). La API restringe PATCH a admin.';
