# Integracion de juegos

LenguArcade abre los juegos integrados dentro de un visor comun y precarga el
primer juego disponible despues de validar la sesion del alumno.

## Protocolo v1

Cada juego recibe en su URL:

- `lenguarcade=1`
- `channel=<identificador aleatorio>`

En Google Apps Script estos parametros deben leerse con
`google.script.url.getLocation`, no con `location.search`.

El juego envia mensajes `postMessage` con:

```js
{
  namespace: "lenguarcade-game",
  channel,
  gameId,
  type,
  payload
}
```

Mensajes del juego:

- `READY`: el motor puede recibir el perfil.
- `INITIALIZED`: el perfil y la partida guardada ya estan aplicados.
- `SESSION_STARTED`: ha comenzado una partida.
- `RESULT`: resultado normalizado al terminar, ganar o salir.
- `CLOSE_READY`: el visor puede cerrarse.

LenguArcade responde con:

- `INIT`: alumno autenticado y guardado anterior del juego.
- `REQUEST_EXIT`: solicita cerrar y consolidar la partida.
- `SAVE_CONFIRMED` o `SAVE_FAILED`: resultado del guardado central.

El juego nunca recibe el token de sesion. LenguArcade conserva el token y
realiza la llamada a `saveProgress`.

## Perfil

Mientras espera `INIT`, el juego muestra `Cargando datos del perfil`. Tras
`INITIALIZED`, sustituye ese estado por el nombre y la clase recibidos. Los
campos editables de identidad no se muestran en el modo integrado.

## Apps Script

Las aplicaciones HTML de Apps Script usan un iframe interno adicional. Por
eso el juego anuncia `READY` a sus ventanas antecesoras y el portal fija la
ventana exacta que responde con el canal aleatorio. Los mensajes posteriores
solo se aceptan desde esa ventana.
