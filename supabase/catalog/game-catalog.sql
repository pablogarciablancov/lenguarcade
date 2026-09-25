-- AUTO-GENERATED from config/game-catalog.json. DO NOT EDIT BY HAND.
insert into public.games
  (id,name,subtitle,category,status,sort_order,color,icon,url,banner,active,description,competencies,integration,official,updated_at)
values
  ('battlegrafia', 'Battlegrafía', 'La aventura de las palabras', 'RPG', 'listo', 1, '#68d9ff', '⚔️', 'https://pablogarciablancov.github.io/lenguarcade/games/battlegrafia_v2/', 'dragon', true, 'RPG de Lengua con combates, cinco mundos, criaturas, modos de juego y progresión.', 'ortografía,verbos,semántica', 'embedded', true, now()),
  ('maniacgrafia', 'Maniacgrafía', 'Atrapa las palabras', 'Ortografía', 'listo', 2, '#d946ef', '⚡', 'https://pablogarciablancov.github.io/lenguarcade/games/maniacgrafia/', 'neon', true, 'Atrapa y corrige palabras trampa mientras mejoras rapidez y precisión.', 'ortografía,acentuación,atención', 'embedded', true, now()),
  ('narratoria', 'Narratoria', 'Escribe. Crea. Cuenta.', 'Escritura', 'listo', 3, '#f59e0b', '📚', 'https://pablogarciablancov.github.io/lenguarcade/games/narratoria/', 'paper', true, 'Construye relatos por fases con objetivos, decisiones y creatividad.', 'narración,creatividad,redacción', 'embedded', true, now()),
  ('versopolis', 'Versópolis', 'La ciudad de la poesía', 'Poesía', 'en pruebas', 4, '#8b5cf6', '✒️', 'https://pablogarciablancov.github.io/lenguarcade/games/versopolis/', 'versopolis-banner.jpg', true, 'Duelo poético por rondas: reconoce rimas, métrica y recursos expresivos para conquistar Versópolis.', 'poesía,rima,métrica,creatividad', 'embedded', true, now()),
  ('scrabble', 'Scrabble', 'Palabras en juego', 'Léxico', 'listo', 5, '#34d399', '🔤', 'https://pablogarciablancov.github.io/lenguarcade/games/scrabble/', 'board', true, 'Forma palabras, amplía vocabulario y compite usando estrategia verbal.', 'léxico,vocabulario,estrategia', 'embedded', true, now()),
  ('conjuga_apuesta', 'Conjuga y apuesta', 'Conjuga. Arriesga. Remonta.', 'Verbos', 'en pruebas', 6, '#fb7185', '🎲', 'https://pablogarciablancov.github.io/lenguarcade/games/conjuga_apuesta/', 'dice', true, 'Duelo de conjugación con fichas, niveles de riesgo, rachas, ayudas tácticas, XP y logros.', 'verbos,morfología,conjugación,estrategia', 'embedded', true, now()),
  ('verb_battle', 'Batalla verbal', 'Arena táctica de los verbos', 'Verbos', 'en pruebas', 7, '#60a5fa', '⚔️', 'https://pablogarciablancov.github.io/lenguarcade/games/verb_battle/', 'battle', true, 'Combate por equipos con tablero variable, clases, energía, defensas, runas, eventos, XP y logros.', 'verbos,morfología,conjugación,estrategia,equipos', 'embedded', true, now()),
  ('rayuela', 'Rayuela', 'Tu historia. Tus decisiones.', 'Escritura', 'en pruebas', 8, '#22d3ee', '⌗', 'https://pablogarciablancov.github.io/lenguarcade/games/rayuela/', 'rayuela', true, 'Crea y gestiona varias aventuras interactivas con decisiones, objetos, caminos alternativos, pruebas y múltiples finales.', 'narración,creatividad,redacción,coherencia,planificación', 'embedded', true, now()),
  ('entre_lineas', 'Entre Líneas', 'Agencia de Investigación Lectora', 'Comprensión lectora', 'en pruebas', 9, '#d7a942', '🔎', 'https://pablogarciablancov.github.io/lenguarcade/games/entre_lineas/', 'entre_lineas', true, 'Investiga documentos, conecta pistas y demuestra tus hipótesis con evidencias.', 'comprensión,inferencia,síntesis,análisis,coherencia,vocabulario', 'embedded', true, now()),
  ('tower_defense', 'Guardianes de la Biblioteca', 'Defiende la lengua', 'Estrategia lingüística', 'en pruebas', 10, '#14b8a6', '🛡️', 'https://pablogarciablancov.github.io/lenguarcade/games/tower_defense/', 'tower_defense', true, 'Tower defense lingüístico: rompe escudos resolviendo retos de Ortografía, Verbos y Semántica y deja que tus torres derroten a los monstruos.', 'ortografía,verbos,semántica,estrategia', 'embedded', true, now()),
  ('word_play', 'Word Play', 'Construye. Combina. Rompe el marcador.', 'Léxico', 'listo', 11, '#22d3ee', '🔠', 'https://pablogarciablancov.github.io/lenguarcade/games/word_play/', 'word-play-banner-v2.webp', true, 'Roguelike de palabras con cartas, tienda, mejoras, misiones lingüísticas, fichas especiales, combos y progresión léxica.', 'léxico,vocabulario,ortografía,acentuación,estrategia', 'embedded', true, now()),
  ('tierras_de_tinta', 'Tierras de Tinta', 'Cada palabra es un arma', 'RPG de acción', 'en pruebas', 12, '#e9a23b', '🖋️', 'https://pablogarciablancov.github.io/lenguarcade/games/tierras_de_tinta/', 'tierras-de-tinta-banner.svg', true, 'RPG de acción y exploración: supera expediciones, derrota criaturas y mejora tu héroe resolviendo desafíos de Lengua.', 'ortografía,morfología,verbos,semántica,literatura,comprensión', 'embedded', true, now()),
  ('lexaria', 'Lexaria', 'Academia de criaturas lingüísticas', 'Estrategia', 'en pruebas', 13, '#4f8cff', '✦', 'https://pablogarciablancov.github.io/lenguarcade/games/lexaria/', 'lexaria-banner.svg', true, 'Auto-battler educativo: colecciona Lexarios, entrena con retos de Lengua, crea sinergias y combate en la Academia.', 'lengua,léxico,verbos,literatura,estrategia', 'embedded', true, now())
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
