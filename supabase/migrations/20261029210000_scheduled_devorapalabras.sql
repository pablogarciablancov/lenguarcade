-- Scheduled cooperative events are opt-in; all existing class sessions remain unchanged.
alter table public.workshop_sessions
  add column if not exists boss_enabled boolean not null default false;
alter table public.workshop_runs
  add column if not exists boss_enabled boolean not null default false;
alter table public.class_boss_events
  add column if not exists last_tick_at timestamptz null;

-- Limit expensive round settlement to one student/server request per 20 seconds.
-- This uses the existing service-role Edge Function model; no public execution.
create or replace function public.claim_class_boss_tick(p_battle_id uuid)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare claimed uuid;
begin
  update public.class_boss_events
     set last_tick_at = now()
   where id = p_battle_id
     and state = 'active'
     and (last_tick_at is null or last_tick_at <= now() - interval '20 seconds')
  returning id into claimed;
  return claimed is not null;
end;
$$;
revoke all on function public.claim_class_boss_tick(uuid) from public, anon, authenticated;
grant execute on function public.claim_class_boss_tick(uuid) to service_role;
