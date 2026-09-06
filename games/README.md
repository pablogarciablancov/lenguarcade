# Juegos de LenguArcade

Cada juego vive aislado dentro de `games/<gameId>/`.

## Entrada pública

La entrada de producción es siempre:

```text
games/<gameId>/index.html
```

GitHub Pages publica esa carpeta en:

```text
https://pablogarciablancov.github.io/lenguarcade/games/<gameId>/
```

## Fuentes Apps Script antiguas

Algunos juegos conservan una carpeta `apps-script/` porque nacieron como proyectos
independientes de Google Apps Script.

Esas carpetas se conservan como **fuente histórica/original** y pueden ser útiles para
editar o comparar, pero no son destinos de publicación de LenguArcade.

No deben contener una `.clasp.json` activa ni publicarse con scripts independientes.

## Juegos actuales en el repositorio

- `battlegrafia/`: Battlegrafía clásica, integrada.
- `battlegrafia_v2/`: versión 2.0 aislada, laboratorio.
- `maniacgrafia/`: integrada.
- `narratoria/`: integrada.
- `scrabble/`: integrado.
- `conjuga_apuesta/`: integrado.
- `verb_battle/`: integrado.
- `rayuela/`: integrada.
- `entre_lineas/`: integrado.

Versópolis y Tower Defense permanecen en el catálogo central como juegos en revisión
aunque su versión definitiva todavía no forme parte de este árbol.

## Trabajo por juego

Usar siempre una rama:

```text
game/<gameId>/<cambio>
```

Una rama de juego no modifica Apps Script central, Supabase común, catálogo ni scripts
de publicación. Si necesita integración, usar
`lenguarcade.integration.json` y resolverla después desde una rama `integration/*`.

Consulta `docs/TRABAJO_CONCURRENTE_JUEGOS.md`.
