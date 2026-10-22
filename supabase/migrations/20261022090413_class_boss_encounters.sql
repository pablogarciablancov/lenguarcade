-- New events opt into encounters; existing events keep their original clock and rules.
alter table public.class_boss_events
  drop constraint class_boss_events_duration_seconds_check,
  drop constraint class_boss_duration_max_25_minutes,
  add constraint class_boss_duration_range check (duration_seconds between 300 and 3600),
  add column encounter_config jsonb,
  add column encounter_rounds jsonb not null default '[]'::jsonb,
  add column round_results jsonb not null default '[]'::jsonb;

-- One transaction freezes a result and awards its XP exactly once, even with
-- concurrent teacher/student polling. Only the authenticated Edge service calls it.
create or replace function public.settle_class_boss_round(p_battle_id uuid,p_result jsonb,p_rewards jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare b public.class_boss_events%rowtype; reward jsonb; idx integer;
begin
  select * into strict b from public.class_boss_events where id=p_battle_id for update;
  idx := (p_result->>'index')::integer;
  if b.encounter_config is null or not exists (
    select 1 from jsonb_array_elements(b.encounter_rounds) r where (r->>'index')::integer=idx
  ) or not coalesce((p_result->>'complete')::boolean,false) then
    raise exception 'invalid_round';
  end if;
  if exists(select 1 from jsonb_array_elements(b.round_results) r where (r->>'index')::integer=idx) then
    return b.round_results;
  end if;
  for reward in select value from jsonb_array_elements(p_rewards) loop
    if (reward->>'xp')::integer > 0 and (reward->>'xp')::integer <= 1000 and exists (
      select 1 from public.profiles p where p.id=(reward->>'profileId')::uuid and p.organization_id=b.organization_id
    ) then
      insert into public.game_events(profile_id,game_id,result_id,event_type,xp_delta,details)
      values ((reward->>'profileId')::uuid,'lenguarcade_admin',
        'class_boss:'||b.id::text||':'||idx::text,'class_boss_reward',(reward->>'xp')::integer,
        jsonb_build_object('bossId',b.id,'round',idx,'position',reward->'position',
          'reason',case when (p_result->>'final')::boolean then 'Podio final del Devorapalabras' else 'Victoria contra el Devorapalabras' end))
      on conflict (profile_id,game_id,result_id) do nothing;
    end if;
  end loop;
  update public.class_boss_events set round_results=round_results||jsonb_build_array(p_result),updated_at=now()
    where id=b.id returning round_results into b.round_results;
  return b.round_results;
end;
$$;
revoke all on function public.settle_class_boss_round(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.settle_class_boss_round(uuid,jsonb,jsonb) to service_role;
