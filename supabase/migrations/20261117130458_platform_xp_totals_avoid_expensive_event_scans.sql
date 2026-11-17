-- Evita cargar historial completo de eventos JSON para calcular los bonus
-- de XP del alumno, de su ranking y del panel del profesor.
-- Solo service_role puede ejecutar este RPC.
create or replace function public.platform_xp_totals(p_profile_ids uuid[])
returns table(profile_id uuid,event_type text,xp_delta bigint,feathers_delta bigint)
language sql stable security invoker set search_path=''
as $function$
  select e.profile_id,e.event_type::text,
    coalesce(sum(e.xp_delta),0)::bigint,
    coalesce(sum(e.feathers_delta),0)::bigint
  from public.game_events e
  where e.profile_id=any(p_profile_ids)
    and e.event_type in ('teacher_adjustment','class_boss_reward','rayuela_ending_reward')
  group by e.profile_id,e.event_type;
$function$;
revoke all on function public.platform_xp_totals(uuid[]) from public,anon,authenticated;
grant execute on function public.platform_xp_totals(uuid[]) to service_role;
