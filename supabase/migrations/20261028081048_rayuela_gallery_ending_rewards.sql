-- Discovery receipts and platform rewards are atomic; authoring saves stay separate.
create table public.rayuela_gallery_endings (
  story_id uuid not null references public.rayuela_gallery_stories(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  node_id text not null check(length(node_id) between 1 and 120),
  xp_awarded smallint not null check(xp_awarded in (0,20,80)),
  discovered_at timestamptz not null default now(),
  primary key(story_id,profile_id,node_id)
);
create index rayuela_gallery_endings_profile_idx on public.rayuela_gallery_endings(profile_id,story_id);
alter table public.rayuela_gallery_endings enable row level security;
revoke all on public.rayuela_gallery_endings from public,anon,authenticated;
grant all on public.rayuela_gallery_endings to service_role;

create function public.record_rayuela_ending(p_story_id uuid,p_profile_id uuid,p_node_id text)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  s public.rayuela_gallery_stories%rowtype;
  p public.profiles%rowtype;
  ending jsonb; reward integer; inserted integer; total integer;
begin
  select * into strict s from public.rayuela_gallery_stories where id=p_story_id;
  select * into strict p from public.profiles where id=p_profile_id and active;
  if p.organization_id<>s.organization_id or p.role not in ('student','teacher','admin') then raise exception 'forbidden'; end if;
  if p.role='student' and (not s.published or not exists(select 1 from public.classroom_enrollments where classroom_id=s.classroom_id and profile_id=p.id and active)) then raise exception 'forbidden'; end if;
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
