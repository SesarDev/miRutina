-- =====================================================================
-- F3 · Sesión en curso. Ejecutar una vez en Supabase → SQL Editor → Run
-- (ya incluido en schema.sql para instalaciones nuevas).
-- =====================================================================

-- Bajadas de las series descendentes: 0 = la serie, 1, 2… = cada bajada.
alter table public.set_logs
  add column if not exists drop_index smallint not null default 0;

-- Ejercicios de la sesión (copia de la rutina al empezar, editable en la sesión).
alter table public.sessions
  add column if not exists items jsonb not null default '[]'::jsonb;

-- Paso de los botones +/− de peso del ejercicio (null = el del equipo).
alter table public.exercise_settings
  add column if not exists weight_step numeric(4,1);
