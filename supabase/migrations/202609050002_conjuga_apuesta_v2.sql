update public.games
set
  name='Conjuga y apuesta',
  subtitle='Conjuga. Arriesga. Remonta.',
  category='Verbos',
  status='en pruebas',
  sort_order=6,
  color='#fb7185',
  icon='🎲',
  url='https://raw.githack.com/pablogarciablancov/lenguarcade/main/games/conjuga_apuesta/',
  banner='dice',
  active=true,
  updated_at=now()
where id='conjuga_apuesta';