-- =====================================================================
-- App de registro fitness — esquema de sincronización (Supabase / Postgres)
-- Ejecutar una vez en Supabase → SQL Editor → New query → Run.
--
-- Convenciones:
--   * ids UUID generados en el cliente.
--   * updated_at   = hora del cliente al editar (para last-write-wins).
--   * server_updated_at = hora del servidor al recibir el cambio (para el pull
--     incremental; evita perder cambios por relojes desajustados).
--   * deleted_at   = borrado lógico; nunca se borran filas.
--   * user_id      = auth.uid() por defecto; RLS limita cada fila a su dueño.
-- =====================================================================

-- Función común: marca server_updated_at en cada insert/update
create or replace function public.touch_server_updated_at()
returns trigger language plpgsql as $$
begin
  new.server_updated_at := now();
  return new;
end $$;

-- Función común: last-write-wins en el servidor (ignora un upsert más antiguo)
create or replace function public.keep_newest()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.updated_at < old.updated_at then
    return old;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------
create table if not exists public.exercise_settings (
  exercise_id       text        not null,
  user_id           uuid        not null default auth.uid() references auth.users on delete cascade,
  log_type          text        not null default 'weight_reps' check (log_type in ('weight_reps','reps','time')),
  rep_min           smallint,
  rep_max           smallint,
  favorite          boolean     not null default false,
  note              text,
  weight_step       numeric(4,1),
  updated_at        timestamptz not null,
  deleted_at        timestamptz,
  server_updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

create table if not exists public.custom_exercises (
  id                uuid        primary key,
  user_id           uuid        not null default auth.uid() references auth.users on delete cascade,
  name_es           text        not null,
  body_part         text,
  equipment         text,
  target            text,
  secondary_muscles text[]      not null default '{}',
  steps_es          text[]      not null default '{}',
  updated_at        timestamptz not null,
  deleted_at        timestamptz,
  server_updated_at timestamptz not null default now()
);

create table if not exists public.routines (
  id                uuid        primary key,
  user_id           uuid        not null default auth.uid() references auth.users on delete cascade,
  name              text        not null,
  items             jsonb       not null default '[]'::jsonb, -- [{exerciseId, sets, repMin, repMax, restSec, order}]
  updated_at        timestamptz not null,
  deleted_at        timestamptz,
  server_updated_at timestamptz not null default now()
);

create table if not exists public.planned_workouts (
  id                uuid        primary key,
  user_id           uuid        not null default auth.uid() references auth.users on delete cascade,
  date              date        not null,
  routine_id        uuid        not null,
  status            text        not null default 'planned' check (status in ('planned','done','skipped')),
  session_id        uuid,
  updated_at        timestamptz not null,
  deleted_at        timestamptz,
  server_updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id                uuid        primary key,
  user_id           uuid        not null default auth.uid() references auth.users on delete cascade,
  date              date        not null,
  routine_id        uuid,
  started_at        timestamptz not null,
  ended_at          timestamptz,
  notes             text,
  items             jsonb       not null default '[]'::jsonb, -- ejercicios de la sesión (SessionItem)
  updated_at        timestamptz not null,
  deleted_at        timestamptz,
  server_updated_at timestamptz not null default now()
);

create table if not exists public.set_logs (
  id                uuid        primary key,
  user_id           uuid        not null default auth.uid() references auth.users on delete cascade,
  session_id        uuid        not null,
  exercise_id       text        not null,
  "order"           smallint    not null,
  drop_index        smallint    not null default 0,
  weight            numeric(6,1),
  reps              smallint,
  duration_sec      integer,
  feel              text        check (feel in ('demasiado','justo','bien','puedo_mas','poco')),
  is_warmup         boolean     not null default false,
  completed_at      timestamptz,
  note              text,
  updated_at        timestamptz not null,
  deleted_at        timestamptz,
  server_updated_at timestamptz not null default now()
);

create table if not exists public.body_metrics (
  id                uuid        primary key,
  user_id           uuid        not null default auth.uid() references auth.users on delete cascade,
  date              date        not null,
  bodyweight        numeric(5,1),
  waist             numeric(5,1),
  chest             numeric(5,1),
  arm               numeric(5,1),
  thigh             numeric(5,1),
  notes             text,
  updated_at        timestamptz not null,
  deleted_at        timestamptz,
  server_updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Índices, triggers y RLS para todas las tablas
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'exercise_settings','custom_exercises','routines','planned_workouts',
    'sessions','set_logs','body_metrics'
  ] loop
    execute format('create index if not exists %1$s_pull_idx on public.%1$s (user_id, server_updated_at)', t);

    execute format('drop trigger if exists %1$s_keep_newest on public.%1$s', t);
    execute format('create trigger %1$s_keep_newest before update on public.%1$s
                    for each row execute function public.keep_newest()', t);

    execute format('drop trigger if exists %1$s_touch on public.%1$s', t);
    execute format('create trigger %1$s_touch before insert or update on public.%1$s
                    for each row execute function public.touch_server_updated_at()', t);

    execute format('alter table public.%1$s enable row level security', t);
    execute format('drop policy if exists "own rows" on public.%1$s', t);
    execute format('create policy "own rows" on public.%1$s
                    for all to authenticated
                    using (user_id = auth.uid())
                    with check (user_id = auth.uid())', t);
  end loop;
end $$;

create index if not exists set_logs_exercise_idx on public.set_logs (user_id, exercise_id, completed_at desc);
create index if not exists planned_workouts_date_idx on public.planned_workouts (user_id, date);
