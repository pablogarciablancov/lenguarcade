-- Keep database defaults aligned with the non-extendable 25-minute class event.
-- Earlier migrations remain untouched; existing encounters are preserved.
alter table public.class_boss_events
  alter column duration_seconds set default 1500;
alter table public.class_boss_events
  add constraint class_boss_duration_max_25_minutes check (duration_seconds <= 1500);
