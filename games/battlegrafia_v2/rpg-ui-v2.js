(() => {
  'use strict';

  const ASSET = 'https://cdn.jsdelivr.net/gh/pablogarciablancov/BATTLEGRAFIA-FINAL@main/img/';
  const $ = id => document.getElementById(id);
  const TEST_MODE = (() => {
    try {
      const p = new URLSearchParams(location.search);
      return p.get('test') === '1' || p.get('mode') === 'test';
    } catch (e) { return false; }
  })();

  function loadCss() {
    if ($('bg2-rpg-css')) return;
    const link = document.createElement('link');
    link.id = 'bg2-rpg-css';
    link.rel = 'stylesheet';
    link.href = './rpg-ui-v2.css?v=20260909-rpg26';
    document.head.appendChild(link);
  }

  function click(id) {
    const node = $(id);
    if (node) node.click();
  }

  function toast(text, tone='gold') {
    let node = $('bg2-rpg-toast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'bg2-rpg-toast';
      document.body.appendChild(node);
    }
    node.dataset.tone = tone;
    node.textContent = text;
    node.classList.remove('show');
    requestAnimationFrame(()=>node.classList.add('show'));
    clearTimeout(node.__timer);
    node.__timer = setTimeout(()=>node.classList.remove('show'), 1450);
  }

  function heroData() {
    const p = window.player || window.BG?.player || window.BG?.getPlayer?.() || {};
    const defeated = Array.isArray(p.defeatedMonsters) ? p.defeatedMonsters.length : Number(p.monstersDefeated || 0);
    const worldIndex = Math.min(4, Math.floor(Math.max(0, defeated) / 6));
    const worlds = ['Montañas de Lexikon','Castillo de Paper','Ciénaga de Torvax','Acantilados de Sintaxion','Volcán de Don Pablo'];
    return {
      name:p.name || (TEST_MODE ? 'Aventurero de prueba' : 'Nuevo aventurero'),
      level:Number(p.level || 1),
      xp:Number(p.xp || 0),
      xpToNext:Number(p.xpToNext || 100),
      gold:Number(p.gold || 0),
      avatarId:p.avatarId || 'mago',
      world:worlds[worldIndex] || worlds[0],
      defeated
    };
  }

  function heroSprite(id) {
    const safe = ['mago','guerrero','ninja','robot'].includes(id) ? id : 'mago';
    return ASSET + 'heros/sprite_hero_' + safe + '.webp';
  }

  const MODE_ARCHIVE = [
    { id:'adventure', roman:'I', label:'AVENTURA', desc:'Campaña de cinco mundos y treinta criaturas.', save:true },
    { id:'survival', roman:'II', label:'SUPERVIVENCIA', desc:'Resiste sin campamento ni tienda. Cada error importa.', save:true },
    { id:'dominio', roman:'III', label:'DOMINIO', desc:'Encadena respuestas perfectas y conserva tu progreso.', save:true },
    { id:'strategy', roman:'IV', label:'ESTRATEGIA', desc:'Retos configurables con tiempo, rivales y loadout.', save:true }
  ];

  function mountHub() {
    const panel = document.querySelector('#main-menu .menu-panel');
    if (!panel || $('bg2-rpg-hub')) return;

    const hub = document.createElement('div');
    hub.id = 'bg2-rpg-hub';
    hub.innerHTML = `
      <div class="bg2-hub-atmosphere" aria-hidden="true">
        <i></i><i></i><i></i><i></i><i></i><i></i>
      </div>
      <header class="bg2-hub-header">
        <div class="bg2-brand-lockup">
          <div class="bg2-kicker">FANTASY LANGUAGE RPG</div>
          <h1>BATTLEGRAFÍA <b>2.0</b></h1>
          <div class="bg2-brand-sub">La aventura de las palabras</div>
        </div>
        <div class="bg2-build-badge">${TEST_MODE ? 'MODO PRUEBA' : 'FANTASY ARCADE'}</div>
      </header>

      <div class="bg2-hub-body">
        <section class="bg2-hero-card" aria-label="Ficha del aventurero">
          <div class="bg2-portrait-frame"><img id="bg2-hub-hero" alt="Héroe"></div>
          <div class="bg2-hero-copy">
            <span class="bg2-label">AVENTURERO</span>
            <strong id="bg2-hub-name">—</strong>
            <span id="bg2-hub-world">—</span>
          </div>
          <div class="bg2-hero-stats">
            <div><span>NIV</span><b id="bg2-hub-level">1</b></div>
            <div><span>ORO</span><b id="bg2-hub-gold">0</b></div>
            <div><span>BESTIAS</span><b id="bg2-hub-defeated">0</b></div>
          </div>
          <div class="bg2-xp-track"><span id="bg2-hub-xp"></span></div>
        </section>

        <nav class="bg2-rpg-menu" aria-label="Menú principal RPG">
          <button class="bg2-rpg-action primary" data-action="games">
            <span class="bg2-cursor">▶</span><span><b>PARTIDAS</b><small>Cada modo conserva su propia partida y nunca pisa las demás</small></span>
          </button>
          <button class="bg2-rpg-action new" data-action="practice">
            <span class="bg2-cursor">✦</span><span><b>ENTRENAMIENTO</b><small>Práctica libre con criaturas desbloqueadas · no guarda una partida aparte</small></span>
          </button>
          <div class="bg2-menu-mini">
            <button data-action="bestiary"><b>BESTIARIO</b><small>30 criaturas</small></button>
            <button data-action="shop"><b>MERCADER</b><small>Objetos y reliquias</small></button>
            <button data-action="achievements"><b>LOGROS</b><small>Tu leyenda</small></button>
          </div>
        </nav>
      </div>

      <footer class="bg2-hub-footer">
        <span>ENTER / CLIC · ELIGE TU DESTINO</span>
        <button type="button" data-action="credits">CRÉDITOS</button>
      </footer>
    `;
    panel.appendChild(hub);

    hub.addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const action = button.dataset.action;
      if (action === 'games') return openModeArchive();
      if (action === 'practice') return launchPractice();
      if (action === 'bestiary') return click('menu-collection');
      if (action === 'shop') return click('menu-shop');
      if (action === 'achievements') return click('menu-achievements');
      if (action === 'credits') return click('menu-credits');
    });

    updateHub();
  }

  function updateHub() {
    if (!$('bg2-rpg-hub')) return;
    const h = heroData();
    const sprite = heroSprite(h.avatarId);
    const img = $('bg2-hub-hero');
    if (img && img.src !== sprite) img.src = sprite;

    const setText = (id, value) => {
      const node = $(id);
      const next = String(value);
      if (node && node.textContent !== next) node.textContent = next;
    };
    setText('bg2-hub-name', h.name);
    setText('bg2-hub-world', h.world);
    setText('bg2-hub-level', h.level);
    setText('bg2-hub-gold', h.gold);
    setText('bg2-hub-defeated', h.defeated + '/30');

    const pct = Math.max(0, Math.min(100, Math.round((h.xp / Math.max(1,h.xpToNext)) * 100)));
    const xp = $('bg2-hub-xp');
    const nextWidth = pct + '%';
    if (xp && xp.style.width !== nextWidth) xp.style.width = nextWidth;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function ensureModeArchive() {
    if ($('bg2-mode-archive')) return;
    const modal = document.createElement('div');
    modal.id = 'bg2-mode-archive';
    modal.className = 'bg2-overlay';
    modal.innerHTML = `
      <div class="bg2-overlay-card bg2-mode-archive-card" role="dialog" aria-modal="true" aria-labelledby="bg2-mode-archive-title">
        <div class="bg2-overlay-top">
          <div>
            <span class="bg2-label">ARCHIVO DEL CRONISTA</span>
            <h2 id="bg2-mode-archive-title">Partidas por modo</h2>
          </div>
          <button class="bg2-close" data-close aria-label="Cerrar">×</button>
        </div>
        <p>Cada modo tiene un guardado independiente. Empezar de nuevo solo sustituye la partida de ese modo.</p>
        <div id="bg2-mode-archive-grid"></div>
        <div class="bg2-slots-note">Aventura · Supervivencia · Dominio · Estrategia se guardan por separado. Práctica es una sesión de entrenamiento.</div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', event => {
      if (event.target === modal || event.target.closest('[data-close]')) closeModeArchive();
      const action = event.target.closest('[data-mode-save-action]');
      if (!action) return;
      const mode = action.dataset.mode;
      if (!mode) return;
      if (action.dataset.modeSaveAction === 'continue') launchContinueMode(mode);
      if (action.dataset.modeSaveAction === 'new') launchNewMode(mode);
    });
  }

  function renderModeArchive() {
    ensureModeArchive();
    const grid = $('bg2-mode-archive-grid');
    if (!grid) return;

    grid.innerHTML = MODE_ARCHIVE.map(info => {
      const meta = window.BG2Slots?.modeSummary?.(info.id) || { saved:false, empty:true, progress:0 };
      const saved = !!meta.saved;
      const updated = saved ? (window.BG2Slots?.formatDate?.(meta.updatedAt) || '—') : 'Sin partida';
      const portrait = saved
        ? `<img src="${meta.sprite}" alt="">`
        : `<span class="bg2-mode-save-roman">${info.roman}</span>`;
      return `
        <article class="bg2-mode-save ${saved ? 'occupied' : 'empty'}" data-mode-save="${info.id}">
          <div class="bg2-mode-save-top">
            <span class="bg2-mode-save-code">MODO ${info.roman}</span>
            <span class="bg2-mode-save-state">${saved ? 'PARTIDA GUARDADA' : 'SIN COMENZAR'}</span>
          </div>
          <div class="bg2-mode-save-main">
            <div class="bg2-mode-save-portrait">${portrait}</div>
            <div class="bg2-mode-save-copy">
              <strong>${info.label}</strong>
              <span>${info.desc}</span>
              <small>${saved ? escapeHtml(meta.name)+' · Nivel '+meta.level : 'Preparado para una nueva partida'}</small>
            </div>
          </div>
          <div class="bg2-slot-progress"><span style="width:${saved ? meta.progress : 0}%"></span></div>
          <div class="bg2-mode-save-meta">
            <span>${saved ? escapeHtml(meta.world) : '—'}</span>
            <span>${saved ? meta.gold+' oro' : '—'}</span>
            <span>${updated}</span>
          </div>
          <div class="bg2-mode-save-actions">
            <button data-mode-save-action="continue" data-mode="${info.id}" ${saved ? '' : 'disabled'}>CONTINUAR</button>
            <button class="new" data-mode-save-action="new" data-mode="${info.id}">${saved ? 'NUEVA PARTIDA…' : 'EMPEZAR'}</button>
          </div>
        </article>
      `;
    }).join('');
  }

  function openModeArchive() {
    if (!window.BG2Slots) return toast('El archivo de partidas todavía no está disponible.', 'red');
    renderModeArchive();
    $('bg2-mode-archive').classList.add('open');
  }

  function closeModeArchive() {
    $('bg2-mode-archive')?.classList.remove('open');
  }

  function confirmReplaceMode(mode) {
    const label = window.BG2Slots?.MODE_LABELS?.[mode] || mode;
    return new Promise(resolve => {
      let modal = $('bg2-confirm-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'bg2-confirm-modal';
        modal.className = 'bg2-overlay';
        document.body.appendChild(modal);
      }
      modal.innerHTML = `
        <div class="bg2-overlay-card bg2-confirm-card">
          <span class="bg2-label danger">ADVERTENCIA</span>
          <h2>¿Nueva partida de ${escapeHtml(label)}?</h2>
          <p>Se sustituirá únicamente la partida guardada de <strong>${escapeHtml(label)}</strong>. Las partidas de los demás modos no se tocarán.</p>
          <div class="bg2-confirm-actions">
            <button data-answer="no">CANCELAR</button>
            <button class="danger" data-answer="yes">EMPEZAR DE NUEVO</button>
          </div>
        </div>`;
      modal.classList.add('open');
      const handler = event => {
        const answer = event.target.closest('[data-answer]');
        if (!answer) return;
        modal.removeEventListener('click', handler);
        modal.classList.remove('open');
        resolve(answer.dataset.answer === 'yes');
      };
      modal.addEventListener('click', handler);
    });
  }

  function legacySelectMode(mode, intent) {
    try { localStorage.setItem('bg_modeId', mode); } catch (e) {}
    click('menu-start');
    setTimeout(()=>click(intent === 'continue' ? 'start-choice-continue' : 'start-choice-new'), 25);
    setTimeout(()=>{
      const card = document.querySelector('.mode-card[data-mode="'+mode+'"]');
      if (card) card.click();
    }, 80);
  }

  async function launchNewMode(mode) {
    const current = window.BG2Slots?.modeSummary?.(mode);
    if (current?.saved && !(await confirmReplaceMode(mode))) return;
    window.BG2Slots?.prepareModeNew?.(mode);
    closeModeArchive();
    toast((window.BG2Slots?.MODE_LABELS?.[mode] || mode) + ' · nueva partida', 'cyan');
    legacySelectMode(mode, 'new');
  }

  function launchContinueMode(mode) {
    const slot = window.BG2Slots?.activateMode?.(mode);
    if (!slot?.data) {
      renderModeArchive();
      return toast('No hay partida guardada en ese modo.', 'red');
    }
    closeModeArchive();
    legacySelectMode(mode, 'continue');
  }

  function launchPractice() {
    try {
      localStorage.setItem('bg_modeId', 'practice');
      localStorage.removeItem('battlegrafia_v2_save_slots_v1_practice');
      localStorage.removeItem('battlegrafia_v2_active_slot_v1_practice');
      localStorage.removeItem('battlegrafia_v2_player_pixel_historia_v6_practice');
    } catch (e) {}
    legacySelectMode('practice', 'new');
  }

  function decorateModes() {
    const data = {
      adventure:['I','CAMPAÑA','Explora cinco mundos y derrota a sus jefes.'],
      survival:['II','SUPERVIVENCIA','Sin campamento. Sin tienda. Cada error importa.'],
      practice:['III','ENTRENAMIENTO','Practica contra criaturas ya descubiertas.'],
      dominio:['IV','DOMINIO','Cinco respuestas perfectas para vencer.'],
      strategy:['V','ESTRATEGIA','Elige tiempo, rivales y loadout antes de luchar.']
    };
    document.querySelectorAll('.mode-card[data-mode]').forEach(card => {
      if (card.dataset.rpgDecorated) return;
      card.dataset.rpgDecorated = '1';
      const info = data[card.dataset.mode];
      if (!info) return;
      const badge = document.createElement('span');
      badge.className = 'bg2-mode-roman';
      badge.textContent = info[0];
      card.prepend(badge);
      const name = card.querySelector('.mode-name');
      if (name) name.textContent = info[1];
      const rule = card.querySelector('.mode-rule');
      if (rule) rule.textContent = info[2];
    });
  }

  function decorateHeroSelect() {
    const start = $('start-screen');
    if (!start || start.dataset.rpgDecorated) return;
    start.dataset.rpgDecorated = '1';
    const title = start.querySelector('.start-title');
    if (title) title.textContent = 'FORJA A TU HÉROE';
    const sub = start.querySelector('.start-sub');
    if (sub) sub.textContent = 'Elige tu identidad. Las palabras harán el resto.';
    start.querySelectorAll('.avatar-option').forEach(option => {
      const id = option.dataset.id || 'mago';
      option.dataset.heroTitle = ({mago:'ARCANO',guerrero:'VANGUARDIA',ninja:'SOMBRA',robot:'AUTÓMATA'})[id] || 'HÉROE';
    });
  }

  function decorateSecondaryScreens() {
    const labels = {
      'hub-collection':['BESTIARIO','Archivo de criaturas lingüísticas'],
      'hub-shop':['MERCADER','Provisiones para la próxima batalla'],
      'hub-achievements':['LOGROS','Crónicas de tus hazañas'],
      'hub-account':['PERFIL','Ficha del aventurero'],
      'hub-credits':['CRÉDITOS','Tras las puertas del reino']
    };
    Object.entries(labels).forEach(([id,copy]) => {
      const screen = $(id);
      if (!screen) return;
      const title = screen.querySelector('.screen-title');
      const sub = screen.querySelector('.screen-sub');
      if (title) title.textContent = copy[0];
      if (sub && !sub.dataset.rpgOriginal) {
        sub.dataset.rpgOriginal = sub.textContent || '';
        sub.textContent = copy[1];
      }
    });
  }

  function decorateCombat() {
    const battle = $('battle-screen');
    if (!battle || battle.dataset.rpgDecorated) return;
    battle.dataset.rpgDecorated = '1';
    const speechLabel = battle.querySelector('.speech-label');
    if (speechLabel) speechLabel.textContent = 'DESAFÍO DEL ENEMIGO';
    const monsterBox = battle.querySelector('.monster-box');
    if (monsterBox) monsterBox.dataset.badge = 'ENEMIGO';
    const heroBox = battle.querySelector('.hero-box');
    if (heroBox) heroBox.dataset.badge = 'HÉROE';
  }

  function sceneClass() {
    const screens = ['battle-screen','camp-screen','map-screen','inventory-screen','diary-screen','history-screen'];
    const current = screens.find(id => {
      const el = $(id);
      if (!el) return false;
      const style = getComputedStyle(el);
      return style.display !== 'none' && el.offsetParent !== null;
    });
    document.body.dataset.rpgScene = current || 'hub';
  }

  let lastSaveStamp = 0;
  function watchSave() {
    if (!window.BG2Slots || window.BG2Slots.isEmbedded()) return;
    const active = localStorage.getItem('battlegrafia_v2_active_slot_v1_adventure');
    const match = String(active || '').match(/^rpg_slot_([123])$/);
    if (!match) return;
    const slot = window.BG2Slots.getSlot(Number(match[1]),'adventure');
    const stamp = Number(slot?.updatedAt || 0);
    if (lastSaveStamp && stamp > lastSaveStamp) toast('✦ PARTIDA GUARDADA', 'green');
    if (stamp) lastSaveStamp = stamp;
  }

  function boot() {
    loadCss();
    document.body.classList.add('bg2-rpg');
    mountHub();
    decorateModes();
    decorateHeroSelect();
    decorateSecondaryScreens();
    decorateCombat();
    sceneClass();
    updateHub();

    // Solo observamos inserciones reales de nodos. La versión anterior vigilaba
    // style/class de todo el documento y se realimentaba con updateHub(), lo que
    // podía provocar un bucle de MutationObserver y saturar la CPU al arrancar.
    let decorateQueued = false;
    const observer = new MutationObserver((mutations)=>{
      if (!mutations.some(m => m.addedNodes && m.addedNodes.length)) return;
      if (decorateQueued) return;
      decorateQueued = true;
      requestAnimationFrame(()=>{
        decorateQueued = false;
        decorateModes();
        decorateHeroSelect();
        decorateSecondaryScreens();
        decorateCombat();
      });
    });
    observer.observe(document.body,{subtree:true,childList:true});

    setInterval(()=>{
      updateHub();
      sceneClass();
      watchSave();
    }, 1500);

    window.addEventListener('bg2:slots-changed', ()=> {
      if ($('bg2-slots-modal')?.classList.contains('open')) renderSlots(slotIntent);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();