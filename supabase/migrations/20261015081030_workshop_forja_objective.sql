-- Additive: previous workshops retain their XP criterion and all history.
ALTER TABLE public.workshop_sessions ADD COLUMN IF NOT EXISTS objective_type text NOT NULL DEFAULT 'xp' CHECK (objective_type IN ('xp', 'forja_easy_win'));
ALTER TABLE public.workshop_runs ADD COLUMN IF NOT EXISTS objective_type text NOT NULL DEFAULT 'xp' CHECK (objective_type IN ('xp', 'forja_easy_win'));
