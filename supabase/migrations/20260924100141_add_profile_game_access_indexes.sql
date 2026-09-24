create index if not exists profile_game_access_game_idx
  on public.profile_game_access(game_id);

create index if not exists profile_game_access_updated_by_idx
  on public.profile_game_access(updated_by)
  where updated_by is not null;
