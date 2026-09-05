insert into public.games
  (id,name,subtitle,category,status,sort_order,color,icon,url,banner,active,updated_at)
values
  ('battlegrafia_v2','Battlegrafía 2.0','Fantasy Arcade · versión alternativa','RPG','en pruebas',1,'#68d9ff','⚔️','https://raw.githack.com/pablogarciablancov/lenguarcade/main/games/battlegrafia_v2/','dragon',true,now())
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
