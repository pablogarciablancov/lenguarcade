create table if not exists public.workshop_runs (
  run_id text primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  plan_id text not null default '',
  title text not null default '',
  message text not null default '',
  target_xp integer not null default 0 check (target_xp >= 0),
  published boolean not null default true,
  classroom_open boolean not null default false,
  home_enabled boolean not null default false,
  active_from timestamptz null,
  active_to timestamptz null,
  game_ids text[] not null default '{}',
  started_at timestamptz not null,
  closed_at timestamptz null,
  is_provisional boolean not null default false,
  updated_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workshop_runs enable row level security;
revoke all on table public.workshop_runs from anon, authenticated, public;
grant select, insert, update, delete on table public.workshop_runs to service_role;

create index if not exists workshop_runs_org_class_started_idx
  on public.workshop_runs(organization_id, classroom_id, started_at desc);

-- Preserve the one currently published session when upgrading. Earlier sessions
-- cannot be recovered from this table; the teacher planner supplies those as
-- provisional reconstructions from its activation log.
insert into public.workshop_runs (
  run_id,organization_id,classroom_id,plan_id,title,message,target_xp,published,
  classroom_open,home_enabled,active_from,active_to,game_ids,started_at,closed_at,updated_by,updated_at
)
select
  'run:' || classroom_id::text || ':' || coalesce(plan_id,'') || ':' || floor(extract(epoch from coalesce(started_at,active_from,updated_at))*1000)::bigint::text,
  organization_id,classroom_id,coalesce(plan_id,''),coalesce(title,''),coalesce(message,''),target_xp,
  published,classroom_open,home_enabled,active_from,active_to,game_ids,
  coalesce(started_at,active_from,updated_at),
  case when not classroom_open and not home_enabled then updated_at else null end,
  updated_by,updated_at
from public.workshop_sessions
where published or target_xp > 0
on conflict (run_id) do nothing;
