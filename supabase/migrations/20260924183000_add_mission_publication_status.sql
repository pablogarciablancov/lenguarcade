alter table public.mission_definitions
  add column if not exists publication_status text not null default 'published';

alter table public.mission_definitions
  drop constraint if exists mission_definitions_publication_status_check;

alter table public.mission_definitions
  add constraint mission_definitions_publication_status_check
  check (publication_status in ('draft','published','paused','closed'));

update public.mission_definitions
set publication_status = case when active then 'published' else 'closed' end
where publication_status is null
   or publication_status not in ('draft','published','paused','closed');
