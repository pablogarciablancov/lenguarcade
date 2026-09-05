# Instrucciones permanentes para LenguArcade

## Filosofía del proyecto

LenguArcade es una plataforma modular para unificar juegos educativos de Lengua ya existentes.

La prioridad es que el profesor pueda probar versiones funcionales sin tener que editar código a mano.

## Reglas obligatorias

1. No rehacer juegos desde cero.
2. No romper mecánicas existentes.
3. No eliminar funciones, bancos de preguntas, sistemas de puntuación, guardado local o paneles existentes salvo petición explícita.
4. Integrar mediante adaptadores pequeños y reversibles.
5. Cada cambio debe terminar con algo que se pueda probar.
6. Preferir archivos completos listos para copiar/probar antes que instrucciones dispersas.
7. Mantener compatibilidad con navegador, Google Apps Script, Google Sheets, Google Sites y GitHub Pages cuando sea posible.
8. Separar siempre el núcleo de LenguArcade de los juegos individuales.
9. Battlegrafía se trata como integración avanzada posterior. No tocarla sin petición expresa.
10. Documentar cambios en `docs/CAMBIOS.md` y añadir pasos de prueba en `docs/PRUEBAS.md`.
11. `lenguarcade-assets` es el repositorio de recursos visuales. Mantener estables las rutas públicas de los archivos ya utilizados.
12. No editar manualmente el proyecto online de Apps Script mientras haya cambios locales pendientes.

## Publicación

El proyecto está conectado con Google Apps Script mediante `clasp`.

- Proyecto Apps Script: `1KQB4f1flavfbkhpfoTWljzTxsQSI6Jb9-qZWnFvbk5VUA8O24pSNi42i`
- Despliegue web estable: `AKfycbyYW1m5zkvLc87XHUqCqNZpY59ZVA6wv6GyxqB_g7u19tRbE22eYZINSV7BHZLkbLpa`
- Código sincronizado: `apps-script/`

Flujo obligatorio al terminar un cambio solicitado:

1. Ejecutar las comprobaciones disponibles.
2. Revisar `npm.cmd run apps:status`.
3. Publicar con `npm.cmd run apps:publish -- "descripcion breve"`.
4. Comprobar la URL `/exec` en alumno y profesor.
5. Confirmar los cambios en Git y subirlos a GitHub.

No crear un despliegue web nuevo. Actualizar siempre el despliegue estable indicado arriba.
No ejecutar funciones de inicialización o migración de datos sin petición expresa.

## Flujo de trabajo recomendado

- Crear cambios pequeños.
- Mantener una versión estable.
- Añadir primero funciones comunes.
- Integrar un juego cada vez.
- Si algo falla, corregir lo mínimo necesario.

## Modelo de integración

Cada juego debe poder enviar progreso a LenguArcade mediante un payload común:

```js
LenguArcade.saveProgress({
  studentId,
  studentName,
  classCode,
  gameId,
  sessionId,
  progress,
  achievements,
  missions,
  skills,
  rawGameData
});
```

## Criterios de evaluación

La evaluación automática no debe basarse solo en XP. Debe considerar progreso, dominio, misiones, constancia, variedad y logros significativos.

## Estilo visual

Estética tipo launcher/Steam educativo:

- fondo oscuro
- neón
- tarjetas de juegos
- barras de progreso
- XP, niveles y moneda
- panel del alumno atractivo
- panel del profesor muy visual y claro
\n## Trabajo concurrente obligatorio\n\nCuando varios chats/agentes trabajen en juegos simultáneamente:\n\n1. Cada juego debe usar una rama `game/<gameId>/<cambio>`.\n2. Una rama `game/*` solo puede modificar su carpeta `games/<gameId>/`, sus pruebas/notas propias y migraciones inequívocamente propias.\n3. Las ramas de juego NO pueden editar el núcleo compartido: catálogo, `LenguArcade_Alumno.html`, `LenguArcade_Code.gs`, Edge Functions comunes, `package.json` ni scripts de publicación.\n4. Si el juego necesita cambios centrales, debe declararlos en `games/<gameId>/lenguarcade.integration.json`.\n5. Solo una rama `integration/YYYY-MM-DD`, creada desde el `main` más reciente, puede tocar y desplegar el núcleo compartido.\n6. No aplicar cambios a Supabase ni publicar Apps Script desde una rama de juego.\n7. No empujar directamente a `main` desde trabajos de juego: abrir PR y dejar que `.github/workflows/game-scope-guard.yml` valide el ámbito.\n8. Antes de integrar, leer `docs/TRABAJO_CONCURRENTE_JUEGOS.md`.\n\nEsta regla tiene prioridad sobre el antiguo flujo «integrar un juego cada vez» cuando haya trabajo simultáneo.\n