update public.games
set
  name='Batalla verbal',
  subtitle='Arena táctica de los verbos',
  category='Verbos',
  status='en pruebas',
  sort_order=7,
  color='#60a5fa',
  icon='⚔️',
  url='https://raw.githack.com/pablogarciablancov/lenguarcade/main/games/verb_battle/',
  banner='battle',
  active=true,
  updated_at=now()
where id='verb_battle';