-- Consolida el alojamiento de los juegos en GitHub Pages.
-- No reescribir las migraciones históricas que usaron RawGitHack/RawCDN.

update public.games
set
  url = case id
    when 'battlegrafia' then 'https://pablogarciablancov.github.io/lenguarcade/games/battlegrafia/'
    when 'battlegrafia_v2' then 'https://pablogarciablancov.github.io/lenguarcade/games/battlegrafia_v2/'
    when 'maniacgrafia' then 'https://pablogarciablancov.github.io/lenguarcade/games/maniacgrafia/'
    when 'narratoria' then 'https://pablogarciablancov.github.io/lenguarcade/games/narratoria/'
    when 'scrabble' then 'https://pablogarciablancov.github.io/lenguarcade/games/scrabble/'
    when 'conjuga_apuesta' then 'https://pablogarciablancov.github.io/lenguarcade/games/conjuga_apuesta/'
    when 'verb_battle' then 'https://pablogarciablancov.github.io/lenguarcade/games/verb_battle/'
    when 'rayuela' then 'https://pablogarciablancov.github.io/lenguarcade/games/rayuela/'
    when 'entre_lineas' then 'https://pablogarciablancov.github.io/lenguarcade/games/entre_lineas/'
    else url
  end,
  updated_at = now()
where id in (
  'battlegrafia',
  'battlegrafia_v2',
  'maniacgrafia',
  'narratoria',
  'scrabble',
  'conjuga_apuesta',
  'verb_battle',
  'rayuela',
  'entre_lineas'
);
