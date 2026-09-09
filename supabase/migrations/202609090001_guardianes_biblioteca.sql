-- Guardianes de la Biblioteca: activa la integración oficial del antiguo slot tower_defense.
insert into public.games
  (id,name,subtitle,category,status,sort_order,color,icon,url,banner,active,description,competencies,integration,official,updated_at)
values
  ('tower_defense','Guardianes de la Biblioteca','Defiende la lengua','Estrategia lingüística','en pruebas',10,'#14b8a6','🛡️',
   'https://pablogarciablancov.github.io/lenguarcade/games/tower_defense/','tower_defense',true,
   'Tower defense lingüístico: rompe escudos resolviendo retos de Ortografía, Verbos y Semántica y deja que tus torres derroten a los monstruos.',
   'ortografía,verbos,semántica,estrategia','embedded',true,now())
on conflict (id) do update set
  name=excluded.name,subtitle=excluded.subtitle,category=excluded.category,status=excluded.status,
  sort_order=excluded.sort_order,color=excluded.color,icon=excluded.icon,url=excluded.url,banner=excluded.banner,
  active=excluded.active,description=excluded.description,competencies=excluded.competencies,
  integration=excluded.integration,official=excluded.official,updated_at=now();
