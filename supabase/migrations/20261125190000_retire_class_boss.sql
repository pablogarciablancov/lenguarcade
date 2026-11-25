-- Retire the event without deleting historical XP or game events.
update public.workshop_sessions set boss_enabled = false where boss_enabled = true;
update public.workshop_runs set boss_enabled = false where boss_enabled = true;
update public.class_boss_events
set state = 'finished', active_since = null, updated_at = now()
where state in ('prepared', 'active', 'paused');

drop function if exists public.claim_class_boss_tick(uuid);
drop function if exists public.settle_class_boss_round(uuid, jsonb, jsonb);
