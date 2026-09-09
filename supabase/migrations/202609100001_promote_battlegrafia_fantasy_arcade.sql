-- Promoción definitiva de Battlegrafía Fantasy Arcade al catálogo oficial.
-- Mantiene la fila histórica battlegrafia_v2 oculta para no romper referencias antiguas.

update public.games
set
  name = 'Battlegrafía',
  subtitle = 'La aventura de las palabras',
  category = 'RPG',
  status = 'listo',
  sort_order = 1,
  color = '#68d9ff',
  icon = '⚔️',
  url = 'https://pablogarciablancov.github.io/lenguarcade/games/battlegrafia_v2/',
  banner = 'dragon',
  active = true,
  description = 'RPG de Lengua con combates, cinco mundos, criaturas, modos de juego y progresión.',
  competencies = 'ortografía,verbos,semántica',
  integration = 'embedded',
  official = true,
  updated_at = now()
where id = 'battlegrafia';

update public.games
set
  active = false,
  official = false,
  updated_at = now()
where id = 'battlegrafia_v2';
