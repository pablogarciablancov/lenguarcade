# Opciones importadas: flechas en líneas separadas

El conversor confundía una flecha situada en una línea aparte con el comienzo de la opción siguiente. La extracción usa ahora el bloque anterior para las flechas de cierre y el posterior para las flechas de apertura. Conserva prosa y destinos. Marca `ambiguous_choice_labels` cuando varias rutas quedan con el mismo texto o con «Continuar»; esos casos necesitan `overrides` revisados antes de importar.

Se contrastaron las 25 historias publicadas con sus hojas originales: 513 tarjetas de decisión. El plan de reparación de datos comprende 27 tarjetas con etiquetas duplicadas y cuatro con un «Continuar» sin significado en una bifurcación, en seis historias. Solo cambia 48 textos de botones. En ocho tarjetas la hoja rodea una narración con flechas y no ofrece etiquetas explícitas: se redactaron a partir de la escena inmediata de destino. No se cambian enlaces, escenas, autores, ortografía editorial, lecturas ni votos.

Pruebas: `node games/rayuela/check-sheets-options.mjs`, `npm run check` y `git diff --check`. Se prueban opciones sin narración, saltos de línea, flechas al principio y al final, caso mixto, destinos y advertencias de ambigüedad.

La corrección de datos se aplica desde integración, con comprobación del texto anterior y de las huellas de todos los datos ajenos a las etiquetas dentro de una transacción. No requiere publicación de Apps Script ni Edge Functions. La rama de juego solo incluye el conversor y sus pruebas.
