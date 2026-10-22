-- Gallery snapshots are separate from personal game_saves. Only the authenticated
-- Edge Function may access them, after checking organization and class membership.
create table public.rayuela_gallery_stories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  publisher_profile_id uuid not null references public.profiles(id),
  source_project_id text not null check(length(source_project_id) between 1 and 160),
  title text not null,
  project jsonb not null,
  author_ids uuid[] not null default '{}',
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(classroom_id,source_project_id),
  check(not published or cardinality(author_ids)>0)
);
create index rayuela_gallery_class_idx on public.rayuela_gallery_stories(organization_id,classroom_id,published);
create table public.rayuela_gallery_reads (
  story_id uuid not null references public.rayuela_gallery_stories(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key(story_id,profile_id)
);
create table public.rayuela_gallery_ratings (
  story_id uuid not null references public.rayuela_gallery_stories(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  creativity smallint not null check(creativity between 1 and 5),
  story smallint not null check(story between 1 and 5),
  decisions smallint not null check(decisions between 1 and 5),
  updated_at timestamptz not null default now(),
  primary key(story_id,profile_id),
  foreign key(story_id,profile_id) references public.rayuela_gallery_reads(story_id,profile_id) on delete cascade
);
alter table public.rayuela_gallery_stories enable row level security;
alter table public.rayuela_gallery_reads enable row level security;
alter table public.rayuela_gallery_ratings enable row level security;
revoke all on public.rayuela_gallery_stories, public.rayuela_gallery_reads, public.rayuela_gallery_ratings from anon, authenticated;
grant all on public.rayuela_gallery_stories, public.rayuela_gallery_reads, public.rayuela_gallery_ratings to service_role;
