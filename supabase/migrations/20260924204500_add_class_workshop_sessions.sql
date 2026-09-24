create table if not exists public.workshop_sessions (
  classroom_id uuid primary key references public.classrooms(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null default '',
  message text not null default '',
  target_xp integer not null default 0 check (target_xp >= 0),
  published boolean not null default false,
  classroom_open boolean not null default false,
  home_enabled boolean not null default false,
  active_from timestamptz null,
  active_to timestamptz null,
  game_ids text[] not null default '{}',
  plan_id text not null default '',
  updated_by uuid null references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.workshop_sessions enable row level security;

revoke all on table public.workshop_sessions from anon, authenticated, public;
grant select, insert, update, delete on table public.workshop_sessions to service_role;

create index if not exists workshop_sessions_org_idx
  on public.workshop_sessions(organization_id);

create index if not exists workshop_sessions_updated_by_idx
  on public.workshop_sessions(updated_by)
  where updated_by is not null;

drop trigger if exists workshop_sessions_updated_at on public.workshop_sessions;
create trigger workshop_sessions_updated_at
before update on public.workshop_sessions
for each row execute function private.set_updated_at();
