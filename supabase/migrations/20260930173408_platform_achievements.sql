-- Read/write only through authenticated Edge Functions using the service role.
create table if not exists public.platform_achievements (
 profile_id uuid not null references public.profiles(id) on delete cascade,
 achievement_id text not null,
 unlocked_at timestamptz not null default now(),
 primary key(profile_id,achievement_id)
);
alter table public.platform_achievements enable row level security;
revoke all on public.platform_achievements from public, anon, authenticated;
grant select,insert,delete on public.platform_achievements to service_role;
