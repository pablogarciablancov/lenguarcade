## 2026-10-15 — Nota lateral de vocabulario

Definición en nota de papel amarilla en el lateral derecho, cinta, esquina doblada, palabra destacada y animación con respeto a movimiento reducido. Sin enlaces externos; atribución de Wikcionario en texto. En ≤850 px la nota pasa al tablero, conservando los controles.

## 2026-10-15 — Revisión general y definiciones

Banco general de español RLA-ES fijado, +48.606 formas; regresión por grupos y auditoría nativa completa. XI admitida, palabras de una letra y validación de tildes explícitas. Definición breve posterior a jugada, Wikcionario con atribución, timeout, caché y errores sin bloquear. Sin cambios de progreso ni puntuación.

## 2026-10-15 — Diccionario de Forja

Se elimina la lista de frecuencia como autoridad en Forja; se admiten ñu/ñus/ñúes y se excluyen PHI, XI y XVI. Sin cambios de guardado ni puntuación.

# LEXOMA — MVP · 4 de octubre de 2026

Juego nuevo aislado en `games/forja/`. 1.300 formas locales con análisis morfológico, ocho categorías, selección de análisis ambiguos y tildes que cambian formas. Diccionario delimitado: una forma desconocida se informa como fuera del léxico, no como necesariamente inexistente.

Bolsa de 101 fichas, mano de diez, reciclaje, descartes por ronda, comodines y tildes. Primer robo guiado EL → MAGO → CORRE; después robo determinista con RNG serializado. Una palabra rechazada conserva las fichas. Forjar consume las letras y las recicla; retirar una carta no duplica esas letras. Cerrar ronda permite renovar una mano bloqueada y cuesta una ronda.

Motor de patrones: concordancia nominal y sujeto/verbo, SN, SN enriquecido, sujeto omitido, complementos nominales/preposicionales, adverbios y copulativas sencillas. No identifica CD/CI, no valida subordinación ni asegura coherencia semántica de cualquier frase. Una construcción nominal correcta causa menos daño que una oración.

Ruta: Devorador → Duende → Tienda → Escriba → Custodio élite → Morfax. Resistencia, límite de rondas, Integridad, Tinta, combo, diez reliquias, tienda de letras/comodines/tildes/eliminación/reliquias y tres fases de Morfax. Siete logros internos y payloads para el sistema central.

Interfaz de altura disponible, paneles con overflow interno, cartas reordenables/retirables, ideas de palabras disponibles, sonidos opcionales, reducción de movimiento y arte SVG local (cinco criaturas, fondo, diez iconos y banner).

Guardado local por alumno y bridge estándar: snapshot conserva mano, selección, frase, bolsa, RNG, reliquias, encuentro, fase, puntuación y carrera. Checkpoint al finalizar frase, cada 12 s si cambia el estado, en salida, visibilidad y pagehide; confirmación antes de CLOSE_READY y fallback local declarado cuando falla el host. ResultId estable por run.

Integración central preparada en `lenguarcade.integration.json` y `central-progress.adapter.js`. No se ha modificado el catálogo ni el runner desde la rama de juego por las reglas concurrentes del repositorio. La PR debe fusionarse antes de procesar el manifest desde integration/*. No se ha publicado Apps Script ni Supabase.
