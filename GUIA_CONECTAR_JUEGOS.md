# Guía para conectar juegos externos a LenguArcade v3

## 1. Pegar el puente en cada juego

En el HTML del juego externo, justo antes de `</body>`, pega el contenido de:

```text
LenguArcade_GameBridge_externo.js
```

Después configúralo con el ID del juego.

Ejemplo para Battlegrafía:

```html
<script>
LenguArcadeBridge.configure({
  gameId: 'battlegrafia',
  hubUrl: 'PEGA_AQUI_LA_URL_DE_LENGUARCADE'
});
</script>
```

IDs recomendados:

```text
battlegrafia
maniacgrafia
palabras_en_juego
narratoria
versopolis
verbopolis
sintax_invaders
literatron
```

---

## 2. Recibir la partida desde LenguArcade

Cuando el juego se abre desde el Hub, LenguArcade envía:

- alumno;
- clase;
- datos del juego;
- progreso anterior;
- guardado completo.

En el juego puedes escucharlo así:

```js
LenguArcadeBridge.onInit(function(ctx){
  const alumno = ctx.student;
  const progreso = ctx.progress;
  const guardado = progreso.save || {};

  console.log('Alumno:', alumno.email, alumno.name, alumno.classGroup);
  console.log('Guardado anterior:', guardado);

  aplicarGuardadoDeLenguArcade(guardado);
});
```

Luego tú creas esta función dentro de cada juego:

```js
function aplicarGuardadoDeLenguArcade(save){
  if(!save) return;
  // Aquí actualizas las variables internas del juego.
}
```

---

## 3. Guardar progreso desde el juego

Cuando el alumno complete un mundo, termine una partida, compre algo o pulse salir:

```js
LenguArcadeBridge.save({
  eventType: 'SAVE_PROGRESS',
  xpDelta: 50,
  plumesDelta: 10,
  progress: {
    status: 'in_progress',
    progressPercent: 42,
    level: 5,
    bestScore: 12500,
    playIncrement: 1,
    stats: {
      correctAnswers: 40,
      wrongAnswers: 5
    },
    save: construirGuardadoCompletoDelJuego()
  }
});
```

La parte más importante es `save`, porque ahí se guarda la partida completa del juego.

---

# Ejemplo Battlegrafía

Dentro de Battlegrafía habría que crear dos funciones puente:

```js
function construirGuardadoCompletoDelJuego(){
  return {
    player: window.player || null,
    inventory: window.inventory || null,
    collection: window.collection || null,
    worldsProgress: window.worldsProgress || null,
    achievements: window.achievements || null,
    modeProgress: window.modeProgress || null
  };
}

function aplicarGuardadoDeLenguArcade(save){
  if(!save) return;
  if(save.player) window.player = save.player;
  if(save.inventory) window.inventory = save.inventory;
  if(save.collection) window.collection = save.collection;
  if(save.worldsProgress) window.worldsProgress = save.worldsProgress;
  if(save.achievements) window.achievements = save.achievements;
  if(save.modeProgress) window.modeProgress = save.modeProgress;
}
```

Y al cargar:

```js
LenguArcadeBridge.configure({ gameId: 'battlegrafia' });

LenguArcadeBridge.onInit(function(ctx){
  aplicarGuardadoDeLenguArcade(ctx.progress.save);
});
```

Y al guardar:

```js
LenguArcadeBridge.save({
  eventType: 'BATTLEGRAFIA_SAVE',
  xpDelta: 60,
  plumesDelta: 12,
  progress: {
    status: 'in_progress',
    progressPercent: calcularPorcentajeBattlegrafia(),
    level: window.player?.world || 1,
    bestScore: window.player?.bestScore || 0,
    playIncrement: 1,
    stats: {
      monstersDefeated: window.player?.monstersDefeated || 0,
      correctAnswers: window.player?.correctAnswers || 0,
      wrongAnswers: window.player?.wrongAnswers || 0
    },
    save: construirGuardadoCompletoDelJuego()
  }
});
```

---

# Ejemplo Maniacgrafía

```js
LenguArcadeBridge.configure({ gameId: 'maniacgrafia' });

LenguArcadeBridge.onInit(function(ctx){
  const save = ctx.progress.save || {};
  if(save.userStats) userStats = Object.assign(userStats, save.userStats);
  if(save.userInventory) userInventory = Object.assign(userInventory, save.userInventory);
  if(save.achievements) achievements = save.achievements;
  if(save.state && typeof state !== 'undefined') Object.assign(state, save.state);
});

function guardarEnLenguArcade(){
  LenguArcadeBridge.save({
    eventType: 'MANIACGRAFIA_SAVE',
    xpDelta: 40,
    plumesDelta: 8,
    progress: {
      status: 'in_progress',
      progressPercent: Math.min(100, ((state.adventureWorld || 1) / 12) * 100),
      level: state.adventureWorld || 1,
      bestScore: state.score || 0,
      playIncrement: 1,
      stats: {
        totalWords: userStats.totalWords || 0,
        maxCombo: userStats.maxCombo || 0,
        livesLost: userStats.livesLost || 0
      },
      save: {
        userStats,
        userInventory,
        achievements,
        state
      }
    }
  });
}
```

Para registrar errores frecuentes:

```js
LenguArcadeBridge.error('acentuación', {
  xpDelta: 0,
  progress: {
    stats: {
      lastError: 'hiato/diptongo'
    }
  }
});
```

---

# Si un juego se abre fuera del Hub

El puente mostrará un aviso pequeño:

> Juego abierto fuera de LenguArcade. Puedes jugar, pero el guardado común solo funciona entrando desde LenguArcade.

Así no se rompe el juego, pero los alumnos aprenden a entrar desde el sitio bueno.
