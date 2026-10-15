-- Logical workshop identity; opening periods and award IDs remain unchanged.
ALTER TABLE public.workshop_runs ADD COLUMN IF NOT EXISTS workshop_key text;
CREATE INDEX IF NOT EXISTS workshop_runs_continuation_idx ON public.workshop_runs (classroom_id,workshop_key);
