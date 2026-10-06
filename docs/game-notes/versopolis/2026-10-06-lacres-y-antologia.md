# Lacres y antología personal

Versópolis amplía el banco de 52 a 1720 versos únicos, más los dos comodines
existentes. `verse-bank.js` genera familias combinatorias originales con sujetos,
verbos y complementos controlados. Filtra lecturas de 8 y 11 sílabas mediante el
motor de prosodia existente; sus lecturas son orientativas y no sustituyen la
revisión de licencias poéticas del profesor. Los 52 versos originales conservan
sus identificadores y escansiones revisadas.

Cada expedición nueva reparte un mazo distinto de 51 cartas (49 versos y dos
comodines), con familias suficientes para los contratos y al menos tres cartas
especiales. Se conserva el límite de 54 cartas, el sistema de contratos resolubles
y las partidas V5/V6 anteriores. No se añade todo el banco al mazo de una partida.
Las rarezas rara, épica y legendaria aumentan el valor base; los lacres suman +45
por rima, +55 por medida uniforme, +65 por dos recursos o +90 por estructura de
cuatro versos. Son sumas condicionales integradas en el análisis, no multiplicadores
ocultos. El mercado selecto ofrece cartas especiales.

La mesa usa los escenarios y retratos existentes con mayor protagonismo, acentos
por expedición y bordes/lacres de rareza. Las cartas son más anchas y el atril
respeta el tamaño mínimo del texto. En ventanas de poca altura solo la mesa usa
scroll interno, sin scroll general. Se conserva la retirada gradual de pistas.

`poems.js` añade Mis poemas desde el menú, el duelo y los resultados. Cada contrato
cumplido guarda una estrofa con sus versos reales, forma, fecha y puntuación.
Las estrofas del taller escrito y las anteriores también aparecen. El comodín
copia el verso de referencia, indicado en el origen de la composición.
Se pueden escribir páginas propias, editar título/texto con guardado automático,
buscar y reunir estrofas en el orden marcado. Exportación TXT, página HTML,
antología TXT y vista de impresión/PDF. El HTML exportado escapa el texto del usuario.
La edición y la unión de poemas no otorgan puntos ni modifican el combate.

Los poemas viajan en `career.poems` del snapshot existente y se guardan por perfil.
La restauración une poemas por ID/fecha para evitar que un snapshot anterior borre
composiciones locales recientes. No se modifica el bridge, catálogo, Supabase o
Apps Script, ni se escriben datos en perfiles reales durante las pruebas.

Validación: check-versopolis, check-syntax y node --check en los módulos nuevos;
contratos de cuatro mapas, conservación de cartas, lacres, variedad de mazos,
migración V5/V6 y fusión de poemas antiguos. Chromium verifica carga, textos,
1366×768, 1440×900, 1920×1080, 1366×650, 1366×580 y 1100×600; ratón, clic,
táctil, cancelación, reordenación, devolución, puntuación, recuperación local,
colección, edición, TXT/HTML real, unión sin alterar XP y CSS de impresión.
