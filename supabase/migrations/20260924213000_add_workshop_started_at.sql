alter table public.workshop_sessions
  add column if not exists started_at timestamptz null;

update public.workshop_sessions
set started_at = coalesce(started_at, updated_at)
where published = true;
