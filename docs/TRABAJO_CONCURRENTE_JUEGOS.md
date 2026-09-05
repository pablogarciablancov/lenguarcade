# Trabajo concurrente seguro en LenguArcade

Este documento define el método obligatorio cuando varios chats/agentes modifican juegos a la vez.

## El problema que evita

LenguArcade tiene dos clases de archivos:

1. **Juego aislado**: todo lo que vive dentro de `games/<gameId>/`.
2. **Núcleo compartido**: catálogo, runner, Apps Script, Supabase común y scripts de publicación.

Dos chats pueden editar juegos distintos sin problema. El riesgo aparece cuando ambos escriben a la vez sobre el núcleo compartido o despliegan backend/frontend en momentos diferentes.

## Regla principal

**Un chat de juego nunca modifica ni despliega el núcleo compartido.**

Cada juego se trabaja en una rama:

```
game/<gameId>/<cambio>
```

Ejemplos:

```
game/scrabble/practica-individual
game/rayuela/objetos
game/battlegrafia_v2/fantasy-arcade
```

Las ramas de juego pueden tocar:

- `games/<gameId>/...`
- su script `scripts/check-<gameId>.mjs`
- notas en `docs/game-notes/<gameId>/...`
- migraciones cuyo nombre incluya inequívocamente el `gameId`

No pueden tocar directamente:

- `apps-script/LenguArcade_Alumno.html`
- `apps-script/LenguArcade_Code.gs`
- `apps-script/LenguArcade_Auth.gs`
- `supabase/functions/student-dashboard/index.ts`
- `supabase/functions/save-progress/index.ts`
- `package.json`
- `scripts/check-game-catalog.mjs`
- `docs/CAMBIOS.md`
- `docs/PRUEBAS.md`
- archivos de despliegue/clasp

GitHub comprueba esta regla automáticamente en los pull requests de ramas `game/*`.

## Peticiones de integración

Si un juego necesita entrar en LenguArcade o cambiar su forma de integración, el chat del juego **no toca el host central**.

En su lugar crea o actualiza:

```
games/<gameId>/lenguarcade.integration.json
```

Formato recomendado:

```json
{
  "gameId": "ejemplo",
  "name": "Ejemplo",
  "status": "en pruebas",
  "integration": "embedded",
  "entry": "games/ejemplo/index.html",
  "banner": "ejemplo-banner.webp",
  "requires": {
    "studentRunner": true,
    "saveProgress": true,
    "supabaseCatalog": true
  },
  "notes": "Qué necesita el host común para poder ejecutarlo"
}
```

Esto convierte la integración en una petición declarativa, no en una edición simultánea del núcleo.

## Rama de integración

Cuando se quiera publicar uno o varios juegos se crea una única rama:

```
integration/YYYY-MM-DD
```

Solo esa rama puede:

- actualizar el catálogo;
- modificar el runner;
- adaptar Apps Script;
- adaptar Edge Functions;
- aplicar migraciones;
- publicar el despliegue estable.

La rama de integración parte siempre del `main` más reciente y procesa una petición de juego cada vez.

## Orden de publicación

1. Fusionar primero las ramas `game/*` ya probadas.
2. Crear `integration/YYYY-MM-DD` desde el nuevo `main`.
3. Leer los `lenguarcade.integration.json` pendientes.
4. Aplicar adaptadores al núcleo común.
5. Ejecutar todas las comprobaciones.
6. Actualizar Supabase.
7. Publicar Apps Script.
8. Probar el `/exec` estable.
9. Fusionar la rama de integración.

**Nunca se actualiza Supabase antes de que el host compatible esté preparado para publicarse en la misma integración.**

## Producción y laboratorio

Un juego nuevo puede existir en GitHub sin estar en el catálogo vivo.

Estados recomendados:

- **laboratorio**: solo URL de prueba fijada a un commit; no aparece en LenguArcade;
- **en pruebas**: integrado y visible, tras publicación coordinada;
- **listo**: versión estable.

Para laboratorios se usa preferentemente una URL fijada a commit:

```
https://rawcdn.githack.com/<owner>/<repo>/<commit>/games/<gameId>/index.html
```

Así una modificación posterior de `main` no cambia el prototipo que se está probando.

## Qué debe hacer cada chat

Al comenzar:

1. leer `AGENTS.md`;
2. identificar su `gameId`;
3. crear/usar `game/<gameId>/<cambio>`;
4. no desplegar infraestructura compartida.

Al terminar:

1. ejecutar sus pruebas;
2. dejar el juego funcional dentro de su carpeta;
3. actualizar su manifest de integración si hace falta;
4. abrir PR;
5. no fusionar cambios de núcleo por su cuenta.

Este flujo permite trabajar simultáneamente en Scrabble, Rayuela, Battlegrafía, Tower Defense y cualquier otro juego sin desconfigurar LenguArcade.
