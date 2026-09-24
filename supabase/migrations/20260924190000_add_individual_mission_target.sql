alter table public.mission_definitions
  add column if not exists target_profile_id uuid null references public.profiles(id) on delete cascade;

create index if not exists idx_mission_definitions_target_profile
  on public.mission_definitions(target_profile_id)
  where target_profile_id is not null;
