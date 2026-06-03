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
