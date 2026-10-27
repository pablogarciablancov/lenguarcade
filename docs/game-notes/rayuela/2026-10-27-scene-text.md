# Decisiones solo en los botones

La vista de juego elimina la lista final de decisiones cuando coincide completa con los botones de la escena, aunque cambien el orden, las mayúsculas, la puntuación o los saltos de línea. Una tarjeta compuesta solo por opciones muestra los botones sin duplicar su contenido ni añadir un aviso de texto pendiente.

El texto guardado y el editor mantienen el original. No se alteran autores, ortografía, valoraciones, destinos ni progreso. Los finales y las continuaciones únicas conservan su comportamiento. Las coincidencias incompletas o ambiguas se mantienen para no borrar narración por error.

Validación: `node scripts/check-rayuela-scene-text.mjs` cubre la captura (copa), listas en líneas o con conjunciones, tres decisiones, orden distinto, puntuación, tildes, menciones narrativas, listas parciales y tarjetas sin narración. Ejecuta el renderizador real con dependencias DOM simuladas y verifica que cada decisión aparece una sola vez y que el objeto original no cambia. La comprobación existente de Rayuela ejecuta también esta regresión.

Tras publicar Pages: abrir «La reliquia perdida», llegar al inicio del bar y comprobar que el párrafo acaba en «te invita a una copa». Solo los dos botones contienen «Aceptas la copa» y «Rechazas la copa». Revisar que siguen llevando a sus escenas y que el editor conserva el texto original. No requiere actualizar Apps Script ni desplegar funciones.
