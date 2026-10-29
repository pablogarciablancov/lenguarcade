-- Timed classroom workshops are independent of home assignments.
-- Existing sessions keep the former default (false) and preserve all progress.
alter table public.workshop_sessions
  add column if not exists scheduled_enabled boolean not null default false;

alter table public.workshop_runs
  add column if not exists scheduled_enabled boolean not null default false;

comment on column public.workshop_sessions.scheduled_enabled is
  'When enabled, classroom access follows [active_from, active_to) in server time.';
comment on column public.workshop_runs.scheduled_enabled is
  'Snapshot of timed classroom window when this workshop run was published.';
