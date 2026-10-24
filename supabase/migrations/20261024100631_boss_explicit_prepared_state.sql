-- Add an inert preparation phase. Existing active/paused/finished records remain valid.
alter table public.class_boss_events drop constraint if exists class_boss_events_state_check;
alter table public.class_boss_events add constraint class_boss_events_state_check check (state in ('prepared','active','paused','finished'));
