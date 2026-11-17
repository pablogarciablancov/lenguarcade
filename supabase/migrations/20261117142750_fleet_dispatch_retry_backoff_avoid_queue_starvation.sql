-- Supabase applied version 20261117142750.
-- Defer invalid or transient rewards so the dispatcher can continue with other students.
-- Idempotency remains tied to award_id, never touch delivered_at here.
alter table public.fleet_weekly_awards
 add column if not exists retry_after timestamptz;
alter table public.fleet_workshop_awards
 add column if not exists retry_after timestamptz;
