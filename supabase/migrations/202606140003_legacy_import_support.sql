alter table public.classrooms
add column legacy_class_code text;

create unique index classrooms_legacy_code_unique
on public.classrooms(organization_id, legacy_class_code)
where legacy_class_code is not null;

create table public.profile_aliases (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source text not null,
  alias text not null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (organization_id, source, alias)
);

create index profile_aliases_profile_idx
on public.profile_aliases(profile_id);

create table public.mission_definitions (
  id text primary key,
  title text not null,
  description text not null default '',
  game_id text,
  mission_type text not null default '',
  target numeric not null default 0,
  reward_xp integer not null default 0,
  reward_feathers integer not null default 0,
  active_from timestamptz,
  active_to timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evaluations (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  classroom_id uuid references public.classrooms(id) on delete set null,
  scope text not null default 'general',
  game_id text not null default 'general',
  score numeric(5,2) not null default 0,
  breakdown jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (profile_id, scope, game_id)
);

create trigger mission_definitions_updated_at
before update on public.mission_definitions
for each row execute function private.set_updated_at();

alter table public.profile_aliases enable row level security;
alter table public.mission_definitions enable row level security;
alter table public.evaluations enable row level security;

create policy profile_aliases_select_accessible
on public.profile_aliases for select to authenticated
using (private.can_access_profile(profile_id));

create policy mission_definitions_select_active
on public.mission_definitions for select to authenticated
using (active);

create policy evaluations_select_accessible
on public.evaluations for select to authenticated
using (private.can_access_profile(profile_id));

grant select on public.profile_aliases,
  public.mission_definitions,
  public.evaluations
to authenticated;
