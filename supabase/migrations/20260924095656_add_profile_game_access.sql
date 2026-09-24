create table if not exists public.profile_game_access (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  enabled boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, game_id)
);

comment on table public.profile_game_access is
  'Per-player game access overrides managed from the teacher panel. Missing row means enabled.';

alter table public.profile_game_access enable row level security;

revoke all on table public.profile_game_access from anon, authenticated, public;
grant select, insert, update, delete on table public.profile_game_access to service_role;

drop trigger if exists profile_game_access_updated_at on public.profile_game_access;
create trigger profile_game_access_updated_at
before update on public.profile_game_access
for each row execute function private.set_updated_at();
