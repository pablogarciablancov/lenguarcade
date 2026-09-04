-- Alta idempotente de Entre Líneas en el catálogo central.
insert into public.games
  (id, name, subtitle, category, status, sort_order, color, icon, url, banner, active)
values
  (
    'entre_lineas',
    'Entre Líneas',
    'Agencia de Investigación Lectora',
    'Comprensión lectora',
    'beta',
    9,
    '#d7a942',
    '🔎',
    'https://raw.githack.com/pablogarciablancov/lenguarcade/main/games/entre_lineas/',
    'entre_lineas',
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
