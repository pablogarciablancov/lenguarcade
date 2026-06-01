# LenguArcade v3 · Hub Orquestador

Esta versión está pensada para tu caso real: **cada juego ya existe como su propio Apps Script `/exec`**.

Por tanto, no fusionamos todos los juegos dentro del mismo proyecto. LenguArcade funciona como:

- login común;
- lanzador de juegos;
- progreso global;
- panel de profesor;
- almacén central en Sheets;
- puente de comunicación con juegos externos mediante `iframe + postMessage`.

## Archivos del pack

- `Code.gs`: backend central del Hub.
- `Alumno.html`: pantalla principal del alumno.
- `Profesor.html`: panel del profesor.
- `LenguArcade_GameBridge_externo.js`: script que debes pegar en cada juego externo.
- `GUIA_CONECTAR_JUEGOS.md`: guía paso a paso para adaptar Battlegrafía, Maniacgrafía, Narratoria, etc.

## Instalación del Hub

1. Crea un Google Sheets nuevo.
2. Abre **Extensiones → Apps Script**.
3. Pega `Code.gs`.
4. Crea dos archivos HTML llamados exactamente:
   - `Alumno`
   - `Profesor`
5. Pega `Alumno.html` en `Alumno` y `Profesor.html` en `Profesor`.
6. En `Code.gs`, cambia:

```js
TEACHER_KEY: 'CAMBIA_ESTA_CLAVE_PROFE'
```

7. Ejecuta una vez:

```js
setupLenguArcade
```

8. Implementa como **Aplicación web**.
9. Usa:

```text
/exec?view=alumno
/exec?view=profesor
```

## Conectar URLs de juegos

Entra en el panel del profesor y pega la URL `/exec` de cada juego:

- Battlegrafía
- Maniacgrafía
- Palabras en juego
- Narratoria
- Versópolis

LenguArcade los abrirá en iframe y les enviará el progreso guardado.

## Importante

Para que un juego externo guarde en LenguArcade, hay que pegar dentro de ese juego el archivo:

```text
LenguArcade_GameBridge_externo.js
```

y añadir llamadas a `LenguArcadeBridge.save(...)` en los puntos donde ya guardaba partida.
