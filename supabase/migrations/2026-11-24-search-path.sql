-- =====================================================================
-- Endurecimiento: fija search_path en las funciones de los triggers
-- (aviso «function_search_path_mutable» del linter de Supabase).
-- Ejecutar una vez en Supabase → SQL Editor → Run
-- (ya incluido en schema.sql para instalaciones nuevas).
-- =====================================================================

alter function public.touch_server_updated_at() set search_path = '';
alter function public.keep_newest() set search_path = '';
