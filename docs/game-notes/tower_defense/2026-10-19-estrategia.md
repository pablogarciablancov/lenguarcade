# Vista previa y especializaciones

Cambios aislados en Guardianes de la Biblioteca; sin cambios del núcleo ni del despliegue de Apps Script.

- «Ver oleada» muestra el número real de enemigos, sus familias lingüísticas, capas de escudo, consejos y un esquema de todas las rutas y peanas del mapa. Durante una oleada permite consultar la siguiente. La preparación no tiene cuenta atrás.
- El panel pausa la simulación, se cierra con Escape y conserva el foco. Permite empezar la oleada cuando se está preparando. No permite iniciarla mientras otro panel pausa el juego.
- Cada torre de nivel 2 o 3 puede adquirir una especialización permanente. Conserva las dos mejoras existentes de nivel. Cada torre elige de forma independiente.

| Torre | Opción A | Opción B | Tinta |
| --- | --- | --- | --- |
| Archivo Arcano | Ráfaga: intervalo ×0,60; daño ×0,80; alcance ×0,90 | Pulso: daño ×1,65; intervalo ×1,35 | 70 |
| Scriptorium | Ojo: alcance ×1,30; daño ×0,85 | Sentencia: daño ×1,55; alcance ×0,82; intervalo ×1,15 | 90 |
| Imprenta Rúnica | Expansiva: radio ×1,50; daño ×0,75 | Concentrada: daño ×1,60; radio ×0,50 | 100 |
| Orden de Guardianes | Atadura: velocidad ×0,38 durante 0,9 s con o sin escudo; daño ×0,80; debilidad ×1,10 | Marca: debilidad ×1,65 durante 2,6 s al golpear sin escudo; control de velocidad ×0,85 | 110 |

Los porcentajes se aplican a los atributos del nivel actual. Las especializaciones nunca rompen escudos: sigue siendo necesario responder preguntas. El control de Atadura se aplica también a enemigos expuestos. La venta devuelve el 65 % de la inversión, incluyendo la especialización.

El checkpoint conserva `specialization` por torre y sigue admitiendo partidas antiguas. Se descartan identificadores desconocidos o incompatibles y especializaciones de torres de nivel 1. Se utiliza el guardado y el puente existentes, incluido el payload de reinicio del iframe y el informe de progreso del alumno.

## Verificación

Ejecutadas las comprobaciones `check-strategy.cjs`, `check-guardians.cjs`, `check-expansion.cjs`, `scripts/check-tower-defense.mjs`, `scripts/check-syntax.mjs` y `git diff --check`.

Pruebas en navegador a 1366×768 y 390×844: paneles dentro del viewport, navegación y cierre con teclado, inicio desde vista previa, pausa, comparación de las diez vistas previas con las colas reales de aparición, compra única, mejora posterior, inversión, recarga del checkpoint y descarte de identificadores inválidos. Comprobación de que las ocho especializaciones respetan los escudos, de los radios de explosión y de los efectos de ralentización y debilitamiento.

Para comprobar manualmente: consultar la próxima oleada, construir una torre y subirla al nivel 2, abrir «Especializar», elegir una opción, mejorarla al nivel 3 y volver al menú. Al continuar deben conservarse la torre, su elección y la tinta. En un mapa ramificado, comprobar que el esquema muestra las alternativas reales. Revisar especialmente el equilibrio de costes y potencia en partidas completas con alumnos; no se ha automatizado una campaña completa.
