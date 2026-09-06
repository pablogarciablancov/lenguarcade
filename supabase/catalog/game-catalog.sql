-- AUTO-GENERATED from config/game-catalog.json. DO NOT EDIT BY HAND.
insert into public.games
  (id,name,subtitle,category,status,sort_order,color,icon,url,banner,active,description,competencies,integration,official,updated_at)
values
  ('battlegrafia', 'Battlegrafía', 'La aventura de las palabras', 'RPG', 'en pruebas', 1, '#f59e0b', '🐉', 'https://pablogarciablancov.github.io/lenguarcade/games/battlegrafia/', 'dragon', true, 'RPG de Lengua con combates, mundos, criaturas y progresión.', 'ortografía,verbos,semántica', 'embedded', true, now()),
  ('battlegrafia_v2', 'Battlegrafía 2.0', 'Fantasy Arcade · versión alternativa', 'RPG', 'en pruebas', 1, '#68d9ff', '⚔️', 'https://pablogarciablancov.github.io/lenguarcade/games/battlegrafia_v2/', 'dragon', false, 'Versión alternativa de Battlegrafía en laboratorio, separada de la clásica.', 'ortografía,verbos,semántica', 'embedded', false, now()),
  ('maniacgrafia', 'Maniacgrafía', 'Atrapa las palabras', 'Ortografía', 'listo', 2, '#d946ef', '⚡', 'https://pablogarciablancov.github.io/lenguarcade/games/maniacgrafia/', 'neon', true, 'Atrapa y corrige palabras trampa mientras mejoras rapidez y precisión.', 'ortografía,acentuación,atención', 'embedded', true, now()),
  ('narratoria', 'Narratoria', 'Escribe. Crea. Cuenta.', 'Escritura', 'listo', 3, '#f59e0b', '📚', 'https://pablogarciablancov.github.io/lenguarcade/games/narratoria/', 'paper', true, 'Construye relatos por fases con objetivos, decisiones y creatividad.', 'narración,creatividad,redacción', 'embedded', true, now()),
  ('versopolis', 'Versópolis', 'La ciudad de la poesía', 'Poesía', 'en revisión', 4, '#8b5cf6', '✒️', '', 'city', true, 'Crea poemas, supera retos líricos y progresa como autor dentro de la ciudad de la poesía.', 'poesía,rima,métrica,creatividad', 'none', true, now()),
  ('scrabble', 'Scrabble', 'Palabras en juego', 'Léxico', 'listo', 5, '#34d399', '🔤', 'https://pablogarciablancov.github.io/lenguarcade/games/scrabble/', 'board', true, 'Forma palabras, amplía vocabulario y compite usando estrategia verbal.', 'léxico,vocabulario,estrategia', 'embedded', true, now()),
  ('conjuga_apuesta', 'Conjuga y apuesta', 'Conjuga. Arriesga. Remonta.', 'Verbos', 'en pruebas', 6, '#fb7185', '🎲', 'https://pablogarciablancov.github.io/lenguarcade/games/conjuga_apuesta/', 'dice', true, 'Duelo de conjugación con fichas, niveles de riesgo, rachas, ayudas tácticas, XP y logros.', 'verbos,morfología,conjugación,estrategia', 'embedded', true, now()),
  ('verb_battle', 'Batalla verbal', 'Arena táctica de los verbos', 'Verbos', 'en pruebas', 7, '#60a5fa', '⚔️', 'https://pablogarciablancov.github.io/lenguarcade/games/verb_battle/', 'battle', true, 'Combate por equipos con tablero variable, clases, energía, defensas, runas, eventos, XP y logros.', 'verbos,morfología,conjugación,estrategia,equipos', 'embedded', true, now()),
  ('rayuela', 'Rayuela', 'Tu historia. Tus decisiones.', 'Escritura', 'en pruebas', 8, '#22d3ee', '⌗', 'https://pablogarciablancov.github.io/lenguarcade/games/rayuela/', 'rayuela', true, 'Crea una aventura interactiva con decisiones, caminos alternativos y múltiples finales.', 'narración,creatividad,redacción,coherencia,planificación', 'embedded', true, now()),
  ('entre_lineas', 'Entre Líneas', 'Agencia de Investigación Lectora', 'Comprensión lectora', 'en pruebas', 9, '#d7a942', '🔎', 'https://pablogarciablancov.github.io/lenguarcade/games/entre_lineas/', 'entre_lineas', true, 'Investiga documentos, conecta pistas y demuestra tus hipótesis con evidencias.', 'comprensión,inferencia,síntesis,análisis,coherencia,vocabulario', 'embedded', true, now()),
  ('tower_defense', 'Tower Defense', 'Defiende la lengua', 'Estrategia lingüística', 'en revisión', 10, '#14b8a6', '🛡️', '', 'tower_defense', true, 'Detén oleadas de monstruos resolviendo retos lingüísticos antes de que alcancen la base.', 'ortografía,verbos,semántica,estrategia', 'none', true, now())
on conflict (id) do update set
  name=excluded.name,
  subtitle=excluded.subtitle,
  category=excluded.category,
  status=excluded.status,
  sort_order=excluded.sort_order,
  color=excluded.color,
  icon=excluded.icon,
  url=excluded.url,
  banner=excluded.banner,
  active=excluded.active,
  description=excluded.description,
  competencies=excluded.competencies,
  integration=excluded.integration,
  official=excluded.official,
  updated_at=now();
