-- LenguArcade · Rayuela
-- Registra el editor narrativo en el catálogo autoritativo de Supabase.
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
  '#55d8ff',
  '🧭',
  'https://raw.githack.com/pablogarciablancov/lenguarcade/main/games/rayuela/',
  '',
  true
)
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