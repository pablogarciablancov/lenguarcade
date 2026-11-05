-- The voting exchange is limited to the two participating classes.
create function public.rayuela_class_exchange(p_organization_id uuid,p_profile_id uuid)
returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
  with pair as (
    select id from public.classrooms where organization_id=p_organization_id and active
    and id in ('6332a093-257f-4565-bb3f-052bc69f77b2','c3029de0-705b-4071-b124-2e41ab8d0253')
  ), eligible as (
    select 1 from public.classroom_enrollments e
    join pair c on c.id=e.classroom_id
    join public.profiles p on p.id=e.profile_id
    where e.profile_id=p_profile_id and e.active and p.active and p.role='student'
      and p.organization_id=p_organization_id and p.source is distinct from 'test'
  ), ballot_progress as (
    select s.classroom_id,
      (select count(*) from (
        select 1 from public.rayuela_gallery_ratings v
        join public.profiles p on p.id=v.profile_id
        where v.story_id=s.id and not (v.profile_id=any(s.author_ids))
          and p.organization_id=p_organization_id and p.active and p.source is distinct from 'test'
        limit 15
      ) ballots)=15 as reached
    from public.rayuela_gallery_stories s
    join pair c on c.id=s.classroom_id
    where s.organization_id=p_organization_id and s.published
  )
  select case when not exists(select 1 from eligible) or (select count(*) from pair)<>2 then null
    else jsonb_build_object(
      'classroomIds',(select jsonb_agg(id) from pair),
      'requiredVotes',15,
      'storiesReady',count(*) filter (where reached),
      'storiesTotal',count(*),
      'unlocked',count(distinct classroom_id)=2 and coalesce(bool_and(reached),false)
    ) end
  from ballot_progress;
$$;
revoke all on function public.rayuela_class_exchange(uuid,uuid) from public,anon,authenticated;
grant execute on function public.rayuela_class_exchange(uuid,uuid) to service_role;

create or replace function public.record_rayuela_ending(p_story_id uuid,p_profile_id uuid,p_node_id text)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  s public.rayuela_gallery_stories%rowtype;
  p public.profiles%rowtype;
  exchange jsonb; ending jsonb; reward integer; inserted integer; total integer;
begin
  select * into strict s from public.rayuela_gallery_stories where id=p_story_id;
  select * into strict p from public.profiles where id=p_profile_id and active;
  if p.organization_id<>s.organization_id or p.role not in ('student','teacher','admin') then raise exception 'forbidden'; end if;
  if p.role='student' then
    if not s.published then raise exception 'forbidden'; end if;
    if not exists(select 1 from public.classroom_enrollments where classroom_id=s.classroom_id and profile_id=p.id and active)
      and not coalesce(p.source='test' and p.email='lenguarcade.pruebas@alumno.fomento.edu',false) then
      exchange := public.rayuela_class_exchange(p.organization_id,p.id);
      if not coalesce((exchange->>'unlocked')::boolean and (exchange->'classroomIds' ? s.classroom_id::text),false) then
        raise exception 'forbidden';
      end if;
    end if;
  end if;
  if p.role='teacher' and not exists(select 1 from public.classroom_teachers where classroom_id=s.classroom_id and profile_id=p.id) then raise exception 'forbidden'; end if;
  select value into ending from jsonb_array_elements(s.project->'nodes') where value->>'id'=p_node_id and value->>'type' in ('ending','secret');
  if ending is null then raise exception 'invalid_ending'; end if;
  reward := case when p.role<>'student' or p.id=any(s.author_ids) then 0 when ending->>'endingType'='perfect' then 80 else 20 end;
  insert into public.rayuela_gallery_endings(story_id,profile_id,node_id,xp_awarded)
    values(s.id,p.id,p_node_id,reward) on conflict do nothing;
  get diagnostics inserted = row_count;
  if inserted=1 and reward>0 then
    insert into public.game_events(profile_id,game_id,result_id,event_type,xp_delta,details)
    values(p.id,'rayuela','gallery-ending:'||s.id||':'||p_node_id,'rayuela_ending_reward',reward,
      jsonb_build_object('storyId',s.id,'nodeId',p_node_id,'endingTitle',ending->>'title','endingType',ending->>'endingType','sessionCounted',false));
  end if;
  select coalesce(sum(xp_awarded),0) into total from public.rayuela_gallery_endings where profile_id=p.id;
  return jsonb_build_object('awardedXp',case when inserted=1 then reward else 0 end,'totalXp',total,'endingCount',(select count(*) from public.rayuela_gallery_endings where story_id=s.id and profile_id=p.id),'duplicate',inserted=0);
end $$;
revoke all on function public.record_rayuela_ending(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.record_rayuela_ending(uuid,uuid,text) to service_role;
