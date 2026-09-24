-- Internal pseudo-game used only as a foreign-key anchor for teacher adjustments.
-- It is inactive and non-official, so it never appears in the student catalog.
insert into public.games (
  id,name,subtitle,category,status,sort_order,color,icon,url,banner,active,
  description,competencies,integration,official
)
values (
  'lenguarcade_admin',
  'LenguArcade · Ajustes',
  'Registro interno de bonificaciones y penalizaciones',
  'Sistema',
  'sistema',
  9999,
  '#64748b',
  '🛠️',
  '',
  '',
  false,
  'Juego interno no visible usado para registrar ajustes manuales del profesor.',
  '',
  'none',
  false
)
on conflict (id) do update set
  name=excluded.name,
  subtitle=excluded.subtitle,
  category=excluded.category,
  status=excluded.status,
  sort_order=excluded.sort_order,
  color=excluded.color,
  icon=excluded.icon,
  active=false,
  description=excluded.description,
  integration='none',
  official=false,
  updated_at=now();
