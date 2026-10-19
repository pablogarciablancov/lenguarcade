# Guardianes reclutables y habilidades ilustradas

## Resultado

- La antigua G decorativa se sustituye por un ayudante desplegable.
- Cuatro guardianes: Custodio gratuito (bloquea dos enemigos), Arquera (cadencia y alcance), Mago (área), Vigía (ralentización).
- Un compañero por defensa; reclutamiento permanente entre oleadas por 90/150/120 monedas. Se ganan 3 por acierto y 15 por oleada; no se gasta XP ni se cambia la Tinta de las torres.
- Colocación libre proyectada sobre el camino real de los cuatro mapas; vista previa, cancelación y seis segundos entre movimientos.
- Ataque automático con escudos inviolables. «Romper escudo» abre la pregunta del enemigo al alcance; cada acierto rompe una capa. Al romper la última, el compañero asesta un golpe.
- Vida, impactos, agotamiento y recuperación automática en doce segundos. Las torres, mapas, bancos de preguntas y logros se conservan.
- Sprites independientes: seis poses por guardián y cuatro retratos. No se recortan spritesheets durante la partida. Renderizado ordenado por profundidad.
- Explosión de tinta, reloj de arena y libro protector sustituyen los tres glifos de habilidades. Se conservan efectos, costes y recargas; no se pueden usar en pausa ni durante preguntas.
- Recompensas bloqueadas durante la resolución para evitar doble respuesta; explicación y solución visibles tras fallar.

## Guardado

Se añaden `guardianRoster` y `guardianDeployment` al checkpoint existente. Partidas anteriores mantienen torres, niveles, estadísticas, Tinta y vidas; reciben el Custodio sin coste. El reclutamiento sobrevive a reinicios y cambios de mapa. El bootstrap del iframe se actualiza al guardar para que una recarga interna no restaure compras anteriores. En LenguArcade se carga el roster del checkpoint del alumno, sin reutilizar el roster local de otra persona.

## Validación

Desde la raíz:

```
node games/tower_defense/check-guardians.cjs
node scripts/check-tower-defense.mjs
node scripts/check-syntax.mjs
```

Prueba de navegador: reclutar, desplegar, recargar, responder por el guardián, pulsar dos veces una respuesta, pausar, cobrar oleada, cambiar de mapa y recuperar una partida v20. Comprobar roster del alumno A frente al alumno B sin guardado. Revisados 1366×768, 1440×900, 1920×1080 y 390×844: campamento dentro del viewport, sin desbordamiento horizontal y con todos los recursos cargados.

Prueba manual: comenzar con el Custodio, colocarlo en el camino, iniciar oleada, pulsar «Romper escudo» y comprobar la capa/vida del monstruo. Fallar una pregunta y leer la corrección; agotar al guardián y observar su recuperación; probar pausa y retorno al menú. Reclutar los otros tres en el campamento conforme se ganan monedas.

Solo cambia `games/tower_defense/` y esta nota. No requiere migraciones, catálogo ni publicación de Apps Script.
