-- Primer evento cooperativo. No altera talleres, misiones, XP ni partidas.
create table if not exists public.class_boss_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  workshop_run_id text not null references public.workshop_runs(run_id),
  workshop_key text not null,
  game_ids text[] not null default '{}',
  state text not null default 'active' check (state in ('active','paused','finished')),
  duration_seconds integer not null default 900 check (duration_seconds between 300 and 1800),
  health_total integer not null check (health_total between 8 and 5000),
  elapsed_seconds integer not null default 0 check (elapsed_seconds >= 0),
  started_at timestamptz not null default now(),
  active_since timestamptz,
  intervals jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (classroom_id, workshop_key),
  constraint class_boss_valid_interval check (jsonb_typeof(intervals) = 'array')
);
create index if not exists class_boss_class_created_idx
  on public.class_boss_events(classroom_id,created_at desc);
alter table public.class_boss_events enable row level security;
revoke all on table public.class_boss_events from public, anon, authenticated;
grant select, insert, update on table public.class_boss_events to service_role;
