alter table public.profiles
  add column if not exists archived_at timestamptz,
  add column if not exists archive_reason text,
  add column if not exists archived_by_classroom_id uuid references public.classrooms(id) on delete set null;

create index if not exists profiles_archive_classroom_idx
  on public.profiles(archived_by_classroom_id)
  where active = false;

comment on column public.profiles.archive_reason is
  'Reason a student profile is inactive, e.g. manual or class.';

comment on column public.profiles.archived_by_classroom_id is
  'Classroom that caused an automatic archive; null for manual archives.';
