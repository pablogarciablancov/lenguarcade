-- Shared room envelope; game rules remain in the dedicated Edge Function.
create table public.multiplayer_rooms (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id),
  organization_id uuid not null references public.organizations(id),
  classroom_id uuid not null references public.classrooms(id),
  host_profile_id uuid not null references public.profiles(id),
  guest_profile_id uuid references public.profiles(id),
  code text not null unique check (code ~ '^[A-Z2-9]{8}$'),
  state jsonb not null,
  version integer not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now()+interval '2 hours'),
  check (host_profile_id is distinct from guest_profile_id)
);
alter table public.multiplayer_rooms enable row level security;
-- Solutions and saves never enter a browser-readable table or Realtime channel.
revoke all on public.multiplayer_rooms from public, anon, authenticated;
grant select,insert,update,delete on public.multiplayer_rooms to service_role;
create index multiplayer_host_lookup on public.multiplayer_rooms(host_profile_id,created_at desc);
create index multiplayer_guest_lookup on public.multiplayer_rooms(guest_profile_id,created_at desc);

create function public.commit_conjuga_online_room(p_id uuid,p_version integer,p_guest uuid,p_state jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  r public.multiplayer_rooms;
  player jsonb;
  prior public.game_progress;
  current_save jsonb;
  merged_save jsonb;
  life jsonb;
  k text;
  delta integer;
  correct_count integer;
  error_count integer;
  total_attempts integer;
  xp_gain integer;
  feathers_gain integer;
  event_id text;
  recent_xp integer;
  recent_feathers integer;
  minute_xp integer;
  minute_feathers integer;
begin
  select * into r from public.multiplayer_rooms where id=p_id and game_id='conjuga_apuesta' for update;
  if not found or r.version<>p_version then return null; end if;
  if r.state->>'phase'='finished' then return to_jsonb(r); end if;
  if r.guest_profile_id is null and p_guest is not null then
    perform 1 from public.profiles where id=p_guest for update;
    if exists(select 1 from public.multiplayer_rooms where id<>p_id and expires_at>now() and state->>'phase'<>'finished' and (host_profile_id=p_guest or guest_profile_id=p_guest)) then
      raise exception 'already_in_room';
    end if;
  end if;
  update public.multiplayer_rooms set state=p_state,guest_profile_id=p_guest,version=version+1 where id=p_id returning * into r;
  if p_state->>'phase'='finished' then
    -- Room, both results, progression and saves commit together or roll back together.
    for player in select value from jsonb_array_elements(p_state->'players') order by value->>'profileId' loop
      event_id:='conjuga_online_'||r.id::text;
      insert into public.game_progress(profile_id,game_id) values((player->>'profileId')::uuid,r.game_id) on conflict do nothing;
      select * into prior from public.game_progress where profile_id=(player->>'profileId')::uuid and game_id=r.game_id for update;
      if exists(select 1 from public.game_events where profile_id=prior.profile_id and game_id=r.game_id and result_id=event_id) then continue; end if;
      select save_data into current_save from public.game_saves where profile_id=prior.profile_id and game_id=r.game_id and slot='main' for update;
      current_save:=coalesce(current_save,player->'baseSave');
      merged_save:=coalesce(current_save,'{}'::jsonb);
      life:=coalesce(current_save->'lifetime','{}'::jsonb);
      for k in select jsonb_object_keys(player->'save'->'lifetime') loop
        if k='maxStreak' then
          life:=jsonb_set(life,array[k],to_jsonb(greatest(coalesce((life->>k)::integer,0),coalesce((player->'save'->'lifetime'->>k)::integer,0))));
        else
          delta:=greatest(0,coalesce((player->'save'->'lifetime'->>k)::integer,0)-coalesce((player->'baseSave'->'lifetime'->>k)::integer,0));
          life:=jsonb_set(life,array[k],to_jsonb(coalesce((life->>k)::integer,0)+delta));
        end if;
      end loop;
      merged_save:=merged_save||jsonb_build_object('version',2,'lifetime',life,
        'xp',coalesce((current_save->>'xp')::integer,0)+coalesce((player->>'xpGain')::integer,0),
        'achievements',(select coalesce(jsonb_agg(distinct value),'[]'::jsonb) from jsonb_array_elements(coalesce(current_save->'achievements','[]'::jsonb)||coalesce(player->'save'->'achievements','[]'::jsonb))),
        'best',jsonb_build_object('chips',greatest(coalesce((current_save->'best'->>'chips')::integer,100),coalesce((player->'save'->'best'->>'chips')::integer,100)),
          'streak',greatest(coalesce((current_save->'best'->>'streak')::integer,0),coalesce((player->>'maxStreak')::integer,0))),
        'updatedAt',now());
      correct_count:=coalesce((player->>'correct')::integer,0);error_count:=coalesce((player->>'errors')::integer,0);
      total_attempts:=prior.attempts+correct_count+error_count;
      -- Match existing platform rewards: six XP per verified correct answer.
      select coalesce(sum(greatest(0,xp_delta)),0),coalesce(sum(greatest(0,feathers_delta)),0),
        coalesce(sum(greatest(0,xp_delta)) filter (where occurred_at>now()-interval '1 minute'),0),
        coalesce(sum(greatest(0,feathers_delta)) filter (where occurred_at>now()-interval '1 minute'),0)
        into recent_xp,recent_feathers,minute_xp,minute_feathers from public.game_events where profile_id=prior.profile_id and occurred_at>now()-interval '10 minutes';
      xp_gain:=greatest(0,least(correct_count*6,900-recent_xp,180-minute_xp));
      feathers_gain:=greatest(0,least((prior.successes+correct_count)/8-prior.successes/8,60-recent_feathers,15-minute_feathers));
      update public.game_progress set
        xp=prior.xp+xp_gain,feathers=prior.feathers+feathers_gain,
        attempts=total_attempts,successes=prior.successes+correct_count,errors=prior.errors+error_count,
        accuracy=case when total_attempts>0 then round((prior.successes+correct_count)::numeric/total_attempts*100) else prior.accuracy end,
        streak=greatest(prior.streak,coalesce((player->>'maxStreak')::integer,0)),
        sessions=prior.sessions+case when correct_count+error_count>0 then 1 else 0 end,
        level=greatest(prior.level,1+floor((merged_save->>'xp')::numeric/250)::integer),
        raw_data=coalesce(prior.raw_data,'{}'::jsonb)||jsonb_build_object('save',merged_save,'onlineMatchId',r.id),last_activity_at=now()
      where profile_id=prior.profile_id and game_id=r.game_id;
      insert into public.game_saves(profile_id,game_id,slot,save_data,revision,saved_at)
        values(prior.profile_id,r.game_id,'main',merged_save,1,now())
        on conflict(profile_id,game_id,slot) do update set save_data=excluded.save_data,revision=public.game_saves.revision+1,saved_at=now();
      insert into public.game_events(profile_id,game_id,result_id,event_type,xp_delta,feathers_delta,accuracy,details)
        values(prior.profile_id,r.game_id,event_id,'online_duel',xp_gain,feathers_gain,
          case when correct_count+error_count>0 then round(correct_count::numeric/(correct_count+error_count)*100) else 0 end,
          jsonb_build_object('matchId',r.id,'mode','online_duel','reason',p_state->>'reason','correct',correct_count,'errors',error_count,'sessionCounted',correct_count+error_count>0,'integrity',jsonb_build_object('serverAuthoritative',true)));
      insert into public.achievement_definitions(game_id,id,title,description,xp_reward)
        select r.game_id,a->>'id',a->>'title',a->>'desc',0 from jsonb_array_elements(coalesce(player->'newAchievements','[]'::jsonb)) a
        on conflict(game_id,id) do nothing;
      insert into public.player_achievements(profile_id,game_id,achievement_id)
        select prior.profile_id,r.game_id,a->>'id' from jsonb_array_elements(coalesce(player->'newAchievements','[]'::jsonb)) a on conflict do nothing;
      update public.game_progress set achievements_count=(select count(*) from public.player_achievements where profile_id=prior.profile_id and game_id=r.game_id) where profile_id=prior.profile_id and game_id=r.game_id;
    end loop;
  end if;
  return to_jsonb(r);
end;
$$;
revoke all on function public.commit_conjuga_online_room(uuid,integer,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.commit_conjuga_online_room(uuid,integer,uuid,jsonb) to service_role;

-- Serialize creation by profile: a retry or a second tab rejoins the same room.
create function public.create_conjuga_online_room(p_profile uuid,p_org uuid,p_class uuid,p_code text,p_state jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare r public.multiplayer_rooms;
begin
  perform 1 from public.profiles where id=p_profile for update;
  select * into r from public.multiplayer_rooms where game_id='conjuga_apuesta' and expires_at>now()
    and state->>'phase'<>'finished' and (host_profile_id=p_profile or guest_profile_id=p_profile)
    order by created_at desc limit 1;
  if found then return to_jsonb(r); end if;
  insert into public.multiplayer_rooms(game_id,organization_id,classroom_id,host_profile_id,code,state)
    values('conjuga_apuesta',p_org,p_class,p_profile,p_code,p_state) returning * into r;
  return to_jsonb(r);
end;
$$;
revoke all on function public.create_conjuga_online_room(uuid,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.create_conjuga_online_room(uuid,uuid,uuid,text,jsonb) to service_role;
