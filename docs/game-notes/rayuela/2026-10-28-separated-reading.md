# Texto de lectura separado de las opciones

La comparación literal no resolvía botones truncados por una flecha dentro de la frase, opciones reformuladas, conectores pegados y preguntas después de las opciones. Se revisaron las 513 tarjetas de decisión de las 25 historias: 84 no se limpiaban y otras 36 tenían narración dentro del primer botón.

Los datos de galería guardan ahora una presentación `reading` independiente con texto de lectura y la fuente y las opciones que se revisaron. No se modifica la prosa original. Se completan o acortan 47 botones; se conservan identificadores y destinos, títulos/tipos de finales, lecturas, votos y XP. El renderer usa la presentación revisada y comprueba que coincide con el original y con las opciones. Tolera diferencias de espacios, espacios no separables y saltos de línea; si cambian palabras o destinos descarta una presentación obsoleta.

Pruebas: captura con «Les saludas aunque no te entiendan», espacios dobles/no separables, escena sin narración, cambios de texto y destino, renderer real, auditoría de las 513 presentaciones y comprobaciones generales. Los datos se corrigen desde integración. Publicación del juego en Pages; sin cambios de Apps Script ni de funciones.
