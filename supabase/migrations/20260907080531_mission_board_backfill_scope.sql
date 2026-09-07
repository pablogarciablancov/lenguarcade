with first_org as (
  select id from public.organizations order by created_at asc limit 1
)
update public.mission_definitions m
set organization_id = first_org.id,
    updated_at = now()
from first_org
where m.organization_id is null;

update public.mission_definitions
set featured = case when id='mision_primera_partida' then true else featured end,
    priority = case
      when id='mision_primera_partida' then greatest(priority,30)
      when id='mision_explorador' then greatest(priority,20)
      when id='mision_precision' then greatest(priority,10)
      else priority
    end,
    updated_at = now()
where id in ('mision_primera_partida','mision_explorador','mision_precision');
