-- Contribución semanal a la Flota de Las Tablas (inicio: lunes 2026-11-02).
-- La experiencia y los premios históricos no se modifican.
create table if not exists public.fleet_weekly_awards (
  award_id text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null,
  award_key text not null,
  points smallint not null default 1 check (points = 1),
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique(profile_id,week_start,award_key)
);
create index if not exists fleet_weekly_awards_pending_idx
  on public.fleet_weekly_awards(profile_id,week_start)
  where delivered_at is null;
alter table public.fleet_weekly_awards enable row level security;
revoke all on public.fleet_weekly_awards from public, anon, authenticated;
grant select,insert,update on public.fleet_weekly_awards to service_role;

-- Agrupación pequeña por día local (incluidos cambios de horario de verano).
-- Sólo XP realmente acreditada por eventos de juegos, nunca ajustes docentes
-- ni premios ajenos a la práctica. Invocación exclusivamente desde el servidor.
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
    and e.event_type not in ('teacher_adjustment','class_boss_reward','rayuela_ending_reward')
  group by 1
  order by 1;
$function$;
revoke all on function public.fleet_weekly_daily_activity(uuid,date) from public,anon,authenticated;
grant execute on function public.fleet_weekly_daily_activity(uuid,date) to service_role;
