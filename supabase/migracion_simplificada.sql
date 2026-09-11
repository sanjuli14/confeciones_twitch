-- ============================================================
-- Consultorio del Amor — Flujo "traer a pantalla" (bajo demanda)
-- El admin aprueba; el streamer saca a pantalla con el botón del overlay.
-- SQL ejecutable en el SQL Editor de Supabase. Idempotente.
-- ============================================================

-- 1. Eliminar políticas que dependían del flujo anterior
DROP POLICY IF EXISTS "Anon - Leer confesion activa" ON public.confessions;
DROP POLICY IF EXISTS "Anon - Leer aprobadas" ON public.confessions;
DROP POLICY IF EXISTS "Anon - Insertar confesion" ON public.confessions;
DROP POLICY IF EXISTS "anon read approved" ON public.confessions;
DROP POLICY IF EXISTS "anon read approved confessions" ON public.confessions;
DROP POLICY IF EXISTS "anon insert" ON public.confessions;

-- 2. Eliminar índice único de highlight
DROP INDEX IF EXISTS idx_single_highlighted;

-- 3. Eliminar columnas que ya no se usan
ALTER TABLE public.confessions
  DROP COLUMN IF EXISTS is_highlighted,
  DROP COLUMN IF EXISTS revealed_paragraphs,
  DROP COLUMN IF EXISTS overlay_paused;

-- 4. Columna que marca cuándo el streamer sacó la confesión a pantalla
ALTER TABLE public.confessions
  ADD COLUMN IF NOT EXISTS shown_at timestamptz;

-- 5. Quitar privilegios de escritura directa a anon: TODO pasa por funciones
REVOKE INSERT, UPDATE, DELETE ON public.confessions FROM anon;

-- 5b. Envío de confesiones — función segura para rol anon
CREATE OR REPLACE FUNCTION public.submit_confession(
  p_title text,
  p_body text,
  p_category text,
  p_nickname text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF length(p_title) = 0 OR length(p_body) = 0 THEN
    RAISE EXCEPTION 'El título y la confesión son obligatorios';
  END IF;
  INSERT INTO public.confessions (title, body, category, nickname)
  VALUES (
    left(p_title, 120),
    left(p_body, 3000),
    left(p_category, 40),
    left(p_nickname, 50)
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_confession(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_confession(text, text, text, text) TO anon, authenticated;

-- 5c. Traer a pantalla — atómica en servidor: marca la más antigua aún no mostrada.
--     Dos llamadas concurrentes apuntan a la misma fila; la perdedora no hace nada.
CREATE OR REPLACE FUNCTION public.mark_confession_shown()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.confessions
  SET shown_at = now()
  WHERE id = (
    SELECT id FROM public.confessions
    WHERE status = 'approved' AND shown_at IS NULL
    ORDER BY created_at
    LIMIT 1
  )
  RETURNING id;
$$;

REVOKE EXECUTE ON FUNCTION public.mark_confession_shown() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_confession_shown() TO anon, authenticated;

-- 6. Eliminar la función antigua de lanzamiento
DROP FUNCTION IF EXISTS set_active_confession(uuid);

-- 7. Políticas RLS para anon
DROP POLICY IF EXISTS "Anon - Leer aprobadas" ON public.confessions;
CREATE POLICY "Anon - Leer aprobadas"
ON public.confessions
FOR SELECT
TO anon
USING (status = 'approved');

GRANT SELECT ON public.confessions TO anon;

-- Política de inserción como "cinturón y tirantes": aunque un día se
-- re-grantee INSERT a anon, no podrá fijar estados distintos a pending.
DROP POLICY IF EXISTS "Anon - Insertar confesion" ON public.confessions;
CREATE POLICY "Anon - Insertar confesion"
ON public.confessions
FOR INSERT
TO anon
WITH CHECK (status = 'pending');

-- 8. Verificación opcional
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'confessions'
ORDER BY ordinal_position;

-- ============================================================
-- 9. Streamers del overlay (nombre + @ de Twitch por cámara)
--    El admin los gestiona desde el panel; el overlay los muestra
--    bajo cada cámara. slot 1..3 = posición en el overlay.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.streamers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  twitch_handle text NOT NULL DEFAULT '',
  slot int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS streamers_slot_key ON public.streamers (slot);

ALTER TABLE public.streamers ENABLE ROW LEVEL SECURITY;

-- anon solo lee (lo necesita el overlay sin sesión)
DROP POLICY IF EXISTS "anon read streamers" ON public.streamers;
CREATE POLICY "anon read streamers"
ON public.streamers
FOR SELECT
TO anon
USING (true);

-- el admin (rol authenticated) gestiona todo
DROP POLICY IF EXISTS "authenticated manage streamers" ON public.streamers;
CREATE POLICY "authenticated manage streamers"
ON public.streamers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT SELECT ON public.streamers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.streamers TO authenticated;