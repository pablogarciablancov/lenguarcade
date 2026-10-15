-- Uses the existing private multiplayer envelope. Only the authenticated Edge
-- Function (service_role) may execute these invoker functions.
create function public.create_lexitrama_online_room(p_profile uuid,p_org uuid,p_class uuid,p_code text,p_state jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.multiplayer_rooms;
begin
 perform 1 from public.profiles where id=p_profile for update;
 select * into r from public.multiplayer_rooms where game_id='lexitrama' and expires_at>now() and state->>'phase'<>'finished' and (host_profile_id=p_profile or guest_profile_id=p_profile) order by created_at desc limit 1;
 if found then return to_jsonb(r); end if;
 insert into public.multiplayer_rooms(game_id,organization_id,classroom_id,host_profile_id,code,state)
 values('lexitrama',p_org,p_class,p_profile,p_code,p_state) returning * into r;
 return to_jsonb(r);
end;
$$;
revoke all on function public.create_lexitrama_online_room(uuid,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.create_lexitrama_online_room(uuid,uuid,uuid,text,jsonb) to service_role;

create function public.commit_lexitrama_online_room(p_id uuid,p_version integer,p_guest uuid,p_state jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 r public.multiplayer_rooms; p jsonb; prior public.game_progress; saved jsonb; career jsonb; stats jsonb; discovered jsonb; mastery jsonb;
 correct_count integer; errors_count integer; xp_gain integer; recent_xp integer; minute_xp integer; event_id text; career_gain integer; participated boolean; word_row jsonb;
begin
 select * into r from public.multiplayer_rooms where id=p_id and game_id='lexitrama' for update;
 if not found or r.version<>p_version then return null; end if;
 if r.state->>'phase'='finished' then return to_jsonb(r); end if;
 if r.guest_profile_id is null and p_guest is not null then
  perform 1 from public.profiles where id=p_guest for update;
  if exists(select 1 from public.multiplayer_rooms where id<>p_id and game_id='lexitrama' and expires_at>now() and state->>'phase'<>'finished' and (host_profile_id=p_guest or guest_profile_id=p_guest)) then raise exception 'already_in_room'; end if;
 end if;
 update public.multiplayer_rooms set state=p_state,guest_profile_id=p_guest,version=version+1 where id=p_id returning * into r;
 if p_state->>'phase'='finished' then
  for p in select value from jsonb_array_elements(p_state->'players') order by value->>'profileId' loop
   -- Database role is authoritative. Teacher practice never earns rewards.
   if not exists(select 1 from public.profiles where id=(p->>'profileId')::uuid and role='student') then continue; end if;
   correct_count:=coalesce((p->>'correct')::integer,0);errors_count:=coalesce((p->>'errors')::integer,0);participated:=correct_count+errors_count>0;
   if not participated then continue; end if;
   event_id:='lexitrama_coop_'||r.id::text;
   insert into public.game_progress(profile_id,game_id) values((p->>'profileId')::uuid,'lexitrama') on conflict do nothing;
   select * into prior from public.game_progress where profile_id=(p->>'profileId')::uuid and game_id='lexitrama' for update;
   if exists(select 1 from public.game_events where profile_id=prior.profile_id and game_id='lexitrama' and result_id=event_id) then continue; end if;
   select coalesce(sum(greatest(0,xp_delta)),0),coalesce(sum(greatest(0,xp_delta)) filter(where occurred_at>now()-interval '1 minute'),0)
    into recent_xp,minute_xp from public.game_events where profile_id=prior.profile_id and occurred_at>now()-interval '10 minutes';
   xp_gain:=greatest(0,least(correct_count*6,900-recent_xp,180-minute_xp));
   select save_data into saved from public.game_saves where profile_id=prior.profile_id and game_id='lexitrama' and slot='main' for update;
   saved:=coalesce(saved,'{"version":1,"gameId":"lexitrama","run":null}'::jsonb);
   career:=coalesce(saved->'career','{}'::jsonb);stats:=coalesce(career->'stats','{}'::jsonb);discovered:=coalesce(career->'discovered','{}'::jsonb);mastery:=coalesce(career->'mastery','{}'::jsonb);
   for word_row in select value from jsonb_array_elements(p_state->'found') where (p_state->'players'->((value->>'player')::integer)->>'profileId')=p->>'profileId' loop
    discovered:=jsonb_set(discovered,array[word_row->>'word'],'true'::jsonb);
   end loop;
   mastery:=jsonb_set(mastery,array[p_state->>'mission'],to_jsonb(coalesce((mastery->>(p_state->>'mission'))::integer,0)+correct_count));
   stats:=stats||jsonb_build_object('words',coalesce((stats->>'words')::integer,0)+correct_count,'longest',greatest(coalesce((stats->>'longest')::integer,0),coalesce((p->>'longest')::integer,0)),
     'coopGames',coalesce((stats->>'coopGames')::integer,0)+1,'coopWins',coalesce((stats->>'coopWins')::integer,0)+case when (p_state->>'won')::boolean then 1 else 0 end);
   career_gain:=correct_count*7+case when (p_state->>'won')::boolean and correct_count>=2 then 30 else 0 end;
   career:=career||jsonb_build_object('version',1,'stats',stats,'xp',coalesce((career->>'xp')::integer,0)+career_gain,'discovered',discovered,'mastery',mastery,'updatedAt',floor(extract(epoch from now())*1000)::bigint);
   saved:=saved||jsonb_build_object('career',career);
   insert into public.game_saves(profile_id,game_id,slot,save_data,revision,saved_at) values(prior.profile_id,'lexitrama','main',saved,1,now())
    on conflict(profile_id,game_id,slot) do update set save_data=excluded.save_data,revision=public.game_saves.revision+1,saved_at=now();
   update public.game_progress set xp=prior.xp+xp_gain,attempts=prior.attempts+correct_count+errors_count,successes=prior.successes+correct_count,errors=prior.errors+errors_count,
    accuracy=round((prior.successes+correct_count)::numeric/(prior.attempts+correct_count+errors_count)*100),sessions=prior.sessions+1,
    raw_data=coalesce(prior.raw_data,'{}'::jsonb)||jsonb_build_object('save',saved,'onlineMatchId',r.id),last_activity_at=now()
    where profile_id=prior.profile_id and game_id='lexitrama';
   insert into public.game_events(profile_id,game_id,result_id,event_type,xp_delta,feathers_delta,accuracy,details)
    values(prior.profile_id,'lexitrama',event_id,'online_coop',xp_gain,0,round(correct_count::numeric/(correct_count+errors_count)*100),
     jsonb_build_object('matchId',r.id,'mode','online_coop','reason',p_state->>'reason','correct',correct_count,'errors',errors_count,'sessionCounted',true,'integrity',jsonb_build_object('serverAuthoritative',true)));
  end loop;
 end if;
 return to_jsonb(r);
end;
$$;
revoke all on function public.commit_lexitrama_online_room(uuid,integer,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.commit_lexitrama_online_room(uuid,integer,uuid,jsonb) to service_role;
