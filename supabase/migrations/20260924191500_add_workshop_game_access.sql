create table if not exists public.workshop_game_access (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null references public.games(id) on delete cascade,
  enabled boolean not null,
  active_from timestamptz null,
  active_to timestamptz null,
  updated_by uuid null references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (profile_id, game_id)
);

comment on table public.workshop_game_access is
  'Temporary per-player game access overrides created by an active or scheduled workshop.';

alter table public.workshop_game_access enable row level security;

revoke all on table public.workshop_game_access from anon, authenticated, public;
grant select, insert, update, delete on table public.workshop_game_access to service_role;

create index if not exists workshop_game_access_game_idx
  on public.workshop_game_access(game_id);

create index if not exists workshop_game_access_updated_by_idx
  on public.workshop_game_access(updated_by)
  where updated_by is not null;

create index if not exists workshop_game_access_window_idx
  on public.workshop_game_access(profile_id, active_from, active_to);

drop trigger if exists workshop_game_access_updated_at on public.workshop_game_access;
create trigger workshop_game_access_updated_at
before update on public.workshop_game_access
for each row execute function private.set_updated_at();
