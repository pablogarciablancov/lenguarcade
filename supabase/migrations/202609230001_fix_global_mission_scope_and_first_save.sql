-- Corrige misiones globales heredadas y hace literal la misión de primer guardado.
-- "general" no es un game_id real: las misiones globales deben usar NULL.
update public.mission_definitions
set game_id = null,
    updated_at = now()
where game_id = 'general';

update public.mission_definitions
set mission_type = 'save',
    game_id = null,
    updated_at = now()
where id = 'mision_primera_partida';
