-- Rayuela · alta en el catálogo principal de LenguArcade.
-- Reutiliza las tablas generales de progreso, guardados, logros y evaluaciones.

insert into public.games (
  id, name, subtitle, category, status, sort_order, color, icon, url, banner, active
)
values (
  'rayuela',
  'Rayuela',
  'Tu historia. Tus decisiones.',
  'Escritura',
  'beta',
  8,
  '#22d3ee',
  'route',
  'https://rawcdn.githack.com/pablogarciablancov/lenguarcade/49ca8564f1dd015c72ad86ba8547fed50a75717e/games/rayuela/index.html',
  'rayuela',
  true
)
on conflict (id) do update set
  name = excluded.name,
  subtitle = excluded.subtitle,
  category = excluded.category,
  status = excluded.status,
  sort_order = excluded.sort_order,
  color = excluded.color,
  icon = excluded.icon,
  url = excluded.url,
  banner = excluded.banner,
  active = excluded.active,
  updated_at = now();
