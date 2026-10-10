alter table public.workshop_runs
  add column if not exists reviewed_at timestamptz null;

comment on column public.workshop_runs.reviewed_at is
  'Teacher review timestamp for reconstructed workshop runs; does not enable automatic fleet awards.';
