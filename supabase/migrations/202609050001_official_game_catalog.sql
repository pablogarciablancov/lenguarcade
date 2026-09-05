insert into public.games
  (id,name,subtitle,category,status,sort_order,color,icon,url,banner,active,updated_at)
values
  ('battlegrafia','Battlegrafía','La aventura de las palabras','RPG','en pruebas',1,'#f59e0b','🐉','https://raw.githack.com/pablogarciablancov/lenguarcade/main/games/battlegrafia/','dragon',true,now()),
  ('maniacgrafia','Maniacgrafía','Atrapa las palabras','Ortografía','listo',2,'#d946ef','⚡','https://raw.githack.com/pablogarciablancov/lenguarcade/main/games/maniacgrafia/','neon',true,now()),
  ('narratoria','Narratoria','Escribe. Crea. Cuenta.','Escritura','listo',3,'#f59e0b','📚','https://raw.githack.com/pablogarciablancov/lenguarcade/main/games/narratoria/','paper',true,now()),
  ('versopolis','Versópolis','La ciudad de la poesía','Poesía','en revisión',4,'#8b5cf6','✒️','','city',true,now()),
  ('scrabble','Scrabble','Palabras en juego','Léxico','listo',5,'#34d399','🔤','https://raw.githack.com/pablogarciablancov/lenguarcade/main/games/scrabble/','board',true,now()),
  ('conjuga_apuesta','Conjuga y apuesta','Verbos 1 contra 1','Verbos','en revisión',6,'#fb7185','🎲','','dice',true,now()),
  ('verb_battle','Batalla verbal','Combate de verbos por equipos','Verbos','en revisión',7,'#60a5fa','⚔️','','battle',true,now()),
  ('rayuela','Rayuela','Tu historia. Tus decisiones.','Escritura','en pruebas',8,'#22d3ee','⌗','https://rawcdn.githack.com/pablogarciablancov/lenguarcade/49ca8564f1dd015c72ad86ba8547fed50a75717e/games/rayuela/index.html','rayuela',true,now()),
  ('entre_lineas','Entre Líneas','Agencia de Investigación Lectora','Comprensión lectora','en pruebas',9,'#d7a942','🔎','https://raw.githack.com/pablogarciablancov/lenguarcade/main/games/entre_lineas/','entre_lineas',true,now()),
  ('tower_defense','Tower Defense','Defiende la lengua','Estrategia lingüística','en revisión',10,'#14b8a6','🛡️','','tower_defense',true,now())
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
  updated_at=now();
