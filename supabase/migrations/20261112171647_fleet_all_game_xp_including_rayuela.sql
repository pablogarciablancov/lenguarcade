-- Migration applied in production on 2026-11-12.
-- All XP genuinely earned in official LenguArcade games contributes to Flota,
-- including Rayuela gallery ending rewards and boss rewards tied to games.
-- Exclude teacher-issued adjustments and the technical admin game.
-- Keep 250 XP per point, 3/day, 6/week and weekly constancy unchanged.
create or replace function public.fleet_weekly_daily_activity(
  p_profile uuid, p_since date default date '2026-11-02'
)
returns table(local_day date, xp bigint)
language sql stable security invoker set search_path = ''
as $function$
  select (e.occurred_at at time zone 'Europe/Madrid')::date as local_day,
    sum(greatest(e.xp_delta,0))::bigint as xp
  from public.game_events e
  join public.games g on g.id=e.game_id
  where e.profile_id=p_profile
    and e.occurred_at >= (greatest(p_since,date '2026-11-02')::timestamp at time zone 'Europe/Madrid')
    and e.game_id <> 'lenguarcade_admin'
    and e.event_type <> 'teacher_adjustment'
  group by 1
  order by 1;
$function$;
revoke all on function public.fleet_weekly_daily_activity(uuid,date) from public,anon,authenticated;
grant execute on function public.fleet_weekly_daily_activity(uuid,date) to service_role;
