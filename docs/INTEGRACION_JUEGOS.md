# Integración de juegos

LenguArcade abre los juegos dentro de un visor común y mantiene la identidad y el
guardado fuera del código del juego.

## Alojamiento

Los juegos de producción se sirven desde GitHub Pages:

```text
https://pablogarciablancov.github.io/lenguarcade/games/<gameId>/
```

No usar RawGitHack/RawCDN como alojamiento de producción.

## Arranque

El portal crea un iframe con:

- `lenguarcade=1`
- `channel=<identificador aleatorio>`

Además prepara un bootstrap de contexto en `iframe.name` con:

- perfil básico del alumno;
- guardado previo del juego;
- feedback/evaluación cuando proceda.

El bootstrap **no contiene el token de sesión**.

## Protocolo de mensajes

El host usa:

```js
{
  namespace: "lenguarcade-host",
  channel,
  type,
  payload
}
```

El juego usa:

```js
{
  namespace: "lenguarcade-game",
  channel,
  gameId,
  type,
  payload
}
```

### Del host al juego

- `INIT`: perfil, guardado y feedback.
- `REQUEST_EXIT`: solicita consolidar y cerrar la partida.
- `OPPONENT_AUTHENTICATED` / `OPPONENT_AUTH_FAILED`: multijugador.
- `SAVE_CONFIRMED` / `SAVE_FAILED`: resultado de guardado.
- `CHECKPOINT_CONFIRMED` / `CHECKPOINT_FAILED`: puntos de control.

### Del juego al host

- `READY`: el bridge del juego está disponible.
- `INITIALIZED`: perfil y guardado ya se aplicaron.
- `SESSION_STARTED`: comenzó una sesión.
- `RESULT`: resultado normalizado.
- `CHECKPOINT`: guardado intermedio.
- `REQUEST_OPPONENT_AUTH`: solicita identificar a otro jugador.
- `CLOSE_READY`: el visor puede cerrarse.

## Handshake robusto

El portal no depende de que `READY` llegue primero.

1. Crea el iframe y prepara el bootstrap.
2. Empieza a enviar `INIT` de forma breve y repetida.
3. El juego puede leer el bootstrap desde `window.name` como fallback.
4. El juego aplica el contexto.
5. El juego envía `INITIALIZED`.
6. El portal detiene los reintentos y oculta la pantalla de conexión.

`READY` sigue siendo útil, pero no es un punto único de fallo.

## Seguridad

- El token de sesión nunca se entrega al iframe.
- El portal valida `namespace`, `channel`, `gameId` y la ventana de origen.
- El portal realiza las llamadas de guardado central.
- El juego solo recibe los datos mínimos necesarios para jugar.

## Reglas para un juego nuevo

1. Debe funcionar de forma independiente en `games/<gameId>/index.html`.
2. Debe conservar su mecánica original.
3. Debe implementar el bridge sin depender de Apps Script.
4. Debe responder a `INIT` con `INITIALIZED`.
5. Debe enviar resultados idempotentes cuando sea posible.
6. Si necesita cambios del núcleo, declararlos en
   `games/<gameId>/lenguarcade.integration.json` y hacer la integración desde una
   rama `integration/*`.
