-- Preserve historical three-field ballots on their original scale.
alter table public.rayuela_gallery_ratings
  drop constraint rayuela_gallery_ratings_creativity_check,
  drop constraint rayuela_gallery_ratings_story_check,
  drop constraint rayuela_gallery_ratings_decisions_check,
  add column fun smallint,
  add column ending smallint,
  add column rubric_version smallint not null default 1,
  add constraint rayuela_gallery_rubric_check check (
    (rubric_version = 1 and creativity between 1 and 5 and story between 1 and 5 and decisions between 1 and 5
      and fun is null and ending is null)
    or
    (rubric_version = 2 and creativity between 1 and 10 and story between 1 and 10 and decisions between 1 and 10
      and fun is not null and fun between 1 and 10
      and ending is not null and ending between 1 and 10)
  );

alter table public.rayuela_gallery_stories add column orthography jsonb;
