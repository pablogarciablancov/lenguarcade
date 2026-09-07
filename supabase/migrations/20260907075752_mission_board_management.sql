alter table public.mission_definitions
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
  add column if not exists classroom_id uuid references public.classrooms(id) on delete set null,
  add column if not exists featured boolean not null default false,
  add column if not exists priority integer not null default 0;

create index if not exists mission_definitions_org_active_idx
  on public.mission_definitions (organization_id, active, priority desc, active_to);

create index if not exists mission_definitions_classroom_idx
  on public.mission_definitions (classroom_id)
  where classroom_id is not null;

with first_org as (
  select id from public.organizations order by created_at asc limit 1
)
insert into public.mission_definitions (
  id,title,description,game_id,mission_type,target,
  reward_xp,reward_feathers,active_from,active_to,active,
  organization_id,classroom_id,featured,priority
)
select
  seed.id,seed.title,seed.description,null,seed.mission_type,seed.target,
  0,0,null,null,true,
  first_org.id,null,seed.featured,seed.priority
from first_org
cross join (
  values
    ('mision_primera_partida','Primer aterrizaje','Juega tu primera partida en LenguArcade.','sessions',1::numeric,true,30),
    ('mision_explorador','Explorador de LenguArcade','Prueba tres juegos distintos.','variety',3::numeric,false,20),
    ('mision_precision','Cazador de errores','Alcanza al menos un 80% de precisión.','accuracy',80::numeric,false,10)
) as seed(id,title,description,mission_type,target,featured,priority)
on conflict (id) do nothing;
