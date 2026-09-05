(() => {
  'use strict';

  const ASSET = 'https://cdn.jsdelivr.net/gh/pablogarciablancov/BATTLEGRAFIA-FINAL@main/img/';
  const MONSTERS = ASSET + 'monsters/';
  const WORLDS = {
    montanas: {
      label: 'Montañas de Lexikon',
      short: 'Montañas',
      background: ASSET + 'backgrounds/battle_bg_montanas.webp',
      monsters: [
        ['h_ghoul','H-Ghoul','sprite_h_ghoul.webp'],
        ['vampiro_v','Vampiro de la V','sprite_vampiro_v.webp'],
        ['gargantua_gj','Gargántua G/J','sprite_gargantua_gj.webp'],
        ['espectro_agudo','Espectro Agudo','sprite_espectro_agudo.webp'],
        ['serpiente_comata','Serpiente Comata','sprite_serpiente_comata.webp'],
        ['lexikon','Lexikon','lexikon.webp',true]
      ]
    },
    castillo: {
      label: 'Castillo de Paper',
      short: 'Castillo',
      background: ASSET + 'backgrounds/battle_bg_castillo.webp',
      monsters: [
        ['diacritik','Diacritik','diacritik.webp'],
        ['oxiton','Oxiton','oxiton.webp'],
        ['llanor','Llanor','llanor.webp'],
        ['puntor','Puntor','puntor.webp'],
        ['kalkor','Kalkor','kalkor.webp'],
        ['paper','Paper','paper.webp',true]
      ]
    },
    cienaga: {
      label: 'Ciénaga de Torvax',
      short: 'Ciénaga',
      background: ASSET + 'backgrounds/battle_bg_cienaga.webp',
      monsters: [
        ['esdrulia','Esdrulia','esdrulia.webp'],
        ['muxlor','Muxlor','muxlor.webp'],
        ['prosodion','Prosodion','prosodion.webp'],
        ['zarruk','Zarruk','zarruk.webp'],
        ['minotauro','Minotauro','sprite_minotauro.webp'],
        ['torvax','Torvax','torvax.webp',true]
      ]
    },
    acantilados: {
      label: 'Acantilados de Sintaxion',
      short: 'Acantilados',
      background: ASSET + 'backgrounds/battle_bg_acantilados.webp',
      monsters: [
        ['caoskrin','Caoskrin','caoskrin.webp'],
        ['hiatikus','Hiatikus','hiatikus.webp'],
        ['momia','Momia','momia.webp'],
        ['rugiton','Rugiton','rugiton.webp'],
        ['zombie','Zombie','sprite_zombie_cz.webp'],
        ['sintaxion','Sintaxion','sintaxion.webp',true]
      ]
    },
    volcan: {
      label: 'Volcán de Don Pablo',
      short: 'Volcán',
      background: ASSET + 'backgrounds/battle_bg_volcan.webp',
      monsters: [
        ['gravikus','Gravikus','gravikus.webp'],
        ['jarkon','Jarkon','jarkon.webp'],
        ['ortograf','Ortograf','ortograf.webp'],
        ['siseus','Siseus','siseus.webp'],
        ['ciclope','Cíclope','sprite_ciclope_ojo.webp'],
        ['don_pablo','Don Pablo','donpablo.webp',true]
      ]
    }
  };

  const WORLD_ORDER = Object.keys(WORLDS);
  const BY_NAME = new Map();
  const BY_ID = new Map();

  const fold = value => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

  WORLD_ORDER.forEach(worldId => {
    WORLDS[worldId].monsters.forEach((monster, index) => {
      const record = {
        id: monster[0],
        name: monster[1],
        sprite: MONSTERS + monster[2],
        boss: !!monster[3],
        worldId,
        index
      };
      BY_ID.set(record.id, record);
      BY_NAME.set(fold(record.name), record);
      if (record.id === 'zombie') {
        BY_NAME.set(fold('Zombi C/Z'), record);
        BY_NAME.set(fold('Zombie C/Z'), record);
      }
      if (record.id === 'ciclope') BY_NAME.set(fold('Cíclope Ojo'), record);
      if (record.id === 'don_pablo') BY_NAME.set(fold('DonPablo'), record);
    });
  });

  function loadTheme() {
    if (document.getElementById('bg2-theme-link')) return;
    const link = document.createElement('link');
    link.id = 'bg2-theme-link';
    link.rel = 'stylesheet';
    link.href = './theme-v2.css';
    document.head.appendChild(link);
  }

  function setText(selector, text) {
    const node = document.querySelector(selector);
    if (node) node.textContent = text;
  }

  function decorateMenuButton(id, label, sub) {
    const button = document.getElementById(id);
    if (!button) return;
    button.dataset.bg2Sub = sub;
    const title = button.querySelector('.menu-btn-title');
    if (title) title.textContent = label;
  }

  function shortenModeRules() {
    const rules = {
      adventure: 'Explora los cinco mundos y derrota a sus 30 guardianes.',
      survival: 'Avanza sin campamento ni tienda. Cada error pesa.',
      practice: 'Entrena contra monstruos que ya hayas descubierto.',
      dominio: 'Demuestra dominio con cinco respuestas perfectas seguidas.',
      strategy: 'Elige rivales, tiempo y objetos antes de entrar.'
    };
    document.querySelectorAll('.mode-card[data-mode]').forEach(card => {
      const rule = card.querySelector('.mode-rule');
      const mode = card.dataset.mode;
      if (rule && rules[mode]) rule.textContent = rules[mode];
    });
  }

  function relabelInterface() {
    document.title = 'Battlegrafía 2.0 · LenguArcade';
    setText('#main-menu .menu-title', 'BATTLEGRAFÍA 2.0');
    setText('#main-menu .menu-sub', 'Campamento del Escriba');
    decorateMenuButton('menu-start', 'Jugar', 'Entra en los cinco mundos y continúa tu aventura.');
    decorateMenuButton('menu-account', 'Perfil', 'Tu héroe, nivel y datos de jugador.');
    decorateMenuButton('menu-collection', 'Bestiario', 'Las criaturas y cartas que ya has descubierto.');
    decorateMenuButton('menu-shop', 'Mercader', 'Objetos, mejoras y existencias del día.');
    decorateMenuButton('menu-achievements', 'Logros', 'Retos, hitos y marcas personales.');
    decorateMenuButton('menu-credits', 'Créditos', 'El mundo y sus creadores.');

    setText('#mode-screen .mode-title', 'Elige tu destino');
    setText('#mode-hint', 'Cada zona conserva sus reglas de juego.');
    shortenModeRules();

    setText('#start-screen .start-title', 'Forja tu héroe');
    setText('#start-screen .start-sub', 'Elige contenido y estilo. Después, las palabras decidirán cada combate.');

    setText('#nav-home', 'Inicio');
    setText('#nav-battle', 'Combate');
    setText('#nav-camp', 'Campamento');
    setText('#nav-map', 'Mundo');
    setText('#nav-diary', 'Diario');
    setText('#nav-history', 'Historia');
    setText('#nav-inventory', 'Mochila');

    setText('#camp-screen .camp-title-main', 'Campamento del Escriba');
    setText('#camp-screen .camp-sub', 'Recupérate, prepara objetos y vuelve al camino cuando estés listo.');
    setText('#map-sub', 'Cada mundo tiene cinco guardianes y un jefe. Tu progreso queda marcado en el camino.');
    setText('#inventory-screen .inventory-sub', 'Objetos, cartas, reliquias y criaturas en un solo lugar.');
  }

  function mountVersionPill() {
    if (document.getElementById('bg2-version-pill')) return;
    const nav = document.querySelector('.top-nav');
    if (!nav) return;
    const pill = document.createElement('span');
    pill.id = 'bg2-version-pill';
    pill.textContent = 'Fantasy Arcade · v2';
    nav.appendChild(pill);
  }

  function defeatedSet() {
    try {
      const p = window.BG && window.BG.player;
      return new Set(Array.isArray(p && p.defeatedMonsters) ? p.defeatedMonsters : []);
    } catch (error) {
      return new Set();
    }
  }

  function resolveCurrentMonster() {
    const name = document.getElementById('monster-name')?.textContent || '';
    return BY_NAME.get(fold(name)) || null;
  }

  function nodeState(record, current, defeated) {
    if (defeated.has(record.id)) return 'cleared';
    if (record.id === 'zombie' && (defeated.has('zombie_cz') || defeated.has('sprite_zombie_cz'))) return 'cleared';
    if (record.id === 'ciclope' && (defeated.has('sprite_ciclope_ojo') || defeated.has('ciclope_ojo'))) return 'cleared';
    if (record.id === 'don_pablo' && defeated.has('donpablo')) return 'cleared';
    if (current && current.id === record.id) return 'current';
    if (current && current.worldId === record.worldId && record.index < current.index) return 'cleared';
    return '';
  }

  function buildWorldStrip() {
    const battle = document.getElementById('battle-screen');
    if (!battle) return null;
    let strip = document.getElementById('bg2-world-strip');
    if (strip) return strip;
    strip = document.createElement('div');
    strip.id = 'bg2-world-strip';
    battle.appendChild(strip);
    return strip;
  }

  let lastBossKey = '';

  function renderWorldStrip() {
    const strip = buildWorldStrip();
    if (!strip) return;
    const current = resolveCurrentMonster();
    const worldId = current?.worldId || 'montanas';
    const world = WORLDS[worldId];
    const defeated = defeatedSet();

    strip.innerHTML = '';
    const label = document.createElement('div');
    label.className = 'bg2-world-name';
    label.innerHTML = world.short + '<span>5 guardianes + jefe</span>';
    strip.appendChild(label);

    const rail = document.createElement('div');
    rail.className = 'bg2-stage-rail';
    world.monsters.forEach((monster, index) => {
      const record = BY_ID.get(monster[0]);
      const node = document.createElement('div');
      node.className = 'bg2-stage-node ' + nodeState(record, current, defeated) + (record.boss ? ' boss' : '');
      node.title = (index + 1) + '/6 · ' + record.name + (record.boss ? ' · JEFE' : '');
      const img = document.createElement('img');
      img.src = record.sprite;
      img.alt = record.name;
      node.appendChild(img);
      rail.appendChild(node);
    });
    strip.appendChild(rail);

    if (current?.boss) maybeShowBoss(current);
  }

  function maybeShowBoss(record) {
    const playerMarker = String(window.BG?.player?.currentMonsterIndex ?? '');
    const key = record.id + ':' + playerMarker;
    if (key === lastBossKey || document.getElementById('bg2-boss-intro')) return;
    lastBossKey = key;

    const world = WORLDS[record.worldId];
    const overlay = document.createElement('div');
    overlay.id = 'bg2-boss-intro';
    overlay.innerHTML =
      '<div class="bg2-boss-card">' +
        '<img src="' + record.sprite + '" alt="' + record.name + '">' +
        '<div>' +
          '<div class="bg2-boss-kicker">' + world.label + ' · Jefe</div>' +
          '<div class="bg2-boss-title">' + record.name + '</div>' +
          '<div class="bg2-boss-sub">Has superado a cinco guardianes. Ahora toca cerrar el mundo.</div>' +
          '<div class="bg2-boss-hint">Haz clic para entrar en combate</div>' +
        '</div>' +
      '</div>';

    const close = () => {
      if (!overlay.isConnected) return;
      overlay.classList.add('is-leaving');
      setTimeout(() => overlay.remove(), 190);
    };
    overlay.addEventListener('click', close);
    document.body.appendChild(overlay);
    setTimeout(close, 1850);
  }

  function resolveWorldFromSelect() {
    const select = document.getElementById('map-world-select');
    const raw = fold(select?.value || select?.selectedOptions?.[0]?.textContent || '');
    if (raw.includes('mont')) return 'montanas';
    if (raw.includes('cast')) return 'castillo';
    if (raw.includes('cien') || raw.includes('pant')) return 'cienaga';
    if (raw.includes('acant') || raw.includes('sint')) return 'acantilados';
    if (raw.includes('volc') || raw.includes('pablo')) return 'volcan';
    return resolveCurrentMonster()?.worldId || 'montanas';
  }

  function mountMapRoster() {
    const map = document.getElementById('map-screen');
    if (!map) return null;
    let roster = document.getElementById('bg2-map-roster');
    if (roster) return roster;
    roster = document.createElement('div');
    roster.id = 'bg2-map-roster';
    const row = document.querySelector('#map-screen .map-world-row');
    if (row) row.insertAdjacentElement('afterend', roster);
    else map.prepend(roster);
    return roster;
  }

  function renderMapRoster() {
    const roster = mountMapRoster();
    if (!roster) return;
    const worldId = resolveWorldFromSelect();
    const world = WORLDS[worldId];
    const defeated = defeatedSet();
    roster.innerHTML = '';

    world.monsters.forEach((monster, index) => {
      const record = BY_ID.get(monster[0]);
      const card = document.createElement('div');
      card.className = 'bg2-roster-card' + (record.boss ? ' boss' : '') + (defeated.has(record.id) ? ' cleared' : '');
      card.title = record.name + (record.boss ? ' · Jefe' : '');
      card.innerHTML =
        '<img src="' + record.sprite + '" alt="' + record.name + '">' +
        '<strong>' + (index + 1) + '. ' + record.name + '</strong>';
      roster.appendChild(card);
    });
  }

  function observeGame() {
    const monsterName = document.getElementById('monster-name');
    if (monsterName && !monsterName.__bg2Observed) {
      monsterName.__bg2Observed = true;
      new MutationObserver(() => {
        renderWorldStrip();
        renderMapRoster();
      }).observe(monsterName, { childList: true, subtree: true, characterData: true });
    }

    const mapSelect = document.getElementById('map-world-select');
    if (mapSelect && !mapSelect.__bg2Observed) {
      mapSelect.__bg2Observed = true;
      mapSelect.addEventListener('change', renderMapRoster);
    }

    const heroMeta = document.getElementById('hero-meta');
    if (heroMeta && !heroMeta.__bg2Observed) {
      heroMeta.__bg2Observed = true;
      new MutationObserver(() => {
        renderWorldStrip();
        renderMapRoster();
      }).observe(heroMeta, { childList: true, subtree: true, characterData: true });
    }
  }

  function addScreenClassHints() {
    const main = document.getElementById('main-menu');
    if (main) main.dataset.bg2 = 'camp';
    const battle = document.getElementById('battle-screen');
    if (battle) battle.dataset.bg2 = 'arena';
  }

  function boot() {
    loadTheme();
    document.body.classList.add('bg2-theme');
    relabelInterface();
    mountVersionPill();
    addScreenClassHints();
    renderWorldStrip();
    renderMapRoster();
    observeGame();

    // Algunas pantallas se reconstruyen al cargar/continuar partida.
    let rounds = 0;
    const timer = setInterval(() => {
      relabelInterface();
      mountVersionPill();
      renderWorldStrip();
      renderMapRoster();
      observeGame();
      rounds += 1;
      if (rounds >= 24) clearInterval(timer);
    }, 750);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
