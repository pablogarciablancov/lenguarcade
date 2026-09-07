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
    link.href = './rpg-ui-v2.css';
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
          <button class="bg2-rpg-action primary" data-action="continue">
            <span class="bg2-cursor">▶</span><span><b>CONTINUAR AVENTURA</b><small>Regresa a tu última expedición</small></span>
          </button>
          <button class="bg2-rpg-action new" data-action="new">
            <span class="bg2-cursor">✦</span><span><b>NUEVA AVENTURA</b><small>Elige una ranura y forja otro héroe</small></span>
          </button>
          <button class="bg2-rpg-action" data-action="modes">
            <span class="bg2-cursor">◆</span><span><b>MODOS DE JUEGO</b><small>Supervivencia · Práctica · Dominio · Estrategia</small></span>
          </button>
          <div class="bg2-menu-mini">
            <button data-action="bestiary"><b>BESTIARIO</b><small>30 criaturas</small></button>
            <button data-action="shop"><b>MERCADER</b><small>Objetos y reliquias</small></button>
            <button data-action="achievements"><b>LOGROS</b><small>Tu leyenda</small></button>
            <button data-action="profile"><b>PERFIL</b><small>Ficha del héroe</small></button>
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
      if (action === 'continue') return openSlots('continue');
      if (action === 'new') return openSlots('new');
      if (action === 'modes') return openModes();
      if (action === 'bestiary') return click('menu-collection');
      if (action === 'shop') return click('menu-shop');
      if (action === 'achievements') return click('menu-achievements');
      if (action === 'profile') return click('menu-account');
      if (action === 'credits') return click('menu-credits');
    });

    updateHub();
  }

  function updateHub() {
    if (!$('bg2-rpg-hub')) return;
    const h = heroData();
    $('bg2-hub-hero').src = heroSprite(h.avatarId);
    $('bg2-hub-name').textContent = h.name;
    $('bg2-hub-world').textContent = h.world;
    $('bg2-hub-level').textContent = h.level;
    $('bg2-hub-gold').textContent = h.gold;
    $('bg2-hub-defeated').textContent = h.defeated + '/30';
    const pct = Math.max(0, Math.min(100, Math.round((h.xp / Math.max(1,h.xpToNext)) * 100)));
    $('bg2-hub-xp').style.width = pct + '%';
  }

  function ensureSlotsModal() {
    if ($('bg2-slots-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'bg2-slots-modal';
    modal.className = 'bg2-overlay';
    modal.innerHTML = `
      <div class="bg2-overlay-card bg2-slots-card" role="dialog" aria-modal="true" aria-labelledby="bg2-slots-title">
        <div class="bg2-overlay-top">
          <div>
            <span class="bg2-label">ARCHIVO DEL CRONISTA</span>
            <h2 id="bg2-slots-title">Partidas guardadas</h2>
          </div>
          <button class="bg2-close" data-close aria-label="Cerrar">×</button>
        </div>
        <p id="bg2-slots-sub">Elige una ranura.</p>
        <div id="bg2-slots-grid"></div>
        <div class="bg2-slots-note">Las ranuras de Battlegrafía 2.0 están aisladas de la versión clásica.</div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
      if (event.target === modal || event.target.closest('[data-close]')) closeSlots();
      const action = event.target.closest('[data-slot-action]');
      if (!action) return;
      const index = Number(action.dataset.slot);
      if (action.dataset.slotAction === 'continue') continueSlot(index);
      if (action.dataset.slotAction === 'new') newSlot(index);
    });
  }

  function renderSlots(intent) {
    ensureSlotsModal();
    const grid = $('bg2-slots-grid');
    const metas = window.BG2Slots?.meta?.('adventure') || [];
    $('bg2-slots-title').textContent = intent === 'continue' ? 'Continuar aventura' : 'Nueva aventura';
    $('bg2-slots-sub').textContent = intent === 'continue'
      ? 'Elige la expedición que quieres recuperar.'
      : 'Elige dónde guardar la nueva aventura. Ninguna partida se sustituirá sin avisarte.';

    grid.innerHTML = metas.map(meta => {
      const updated = window.BG2Slots?.formatDate?.(meta.updatedAt) || '—';
      return `
        <article class="bg2-slot ${meta.empty ? 'empty' : 'occupied'}">
          <div class="bg2-slot-number">RANURA 0${meta.index}</div>
          <div class="bg2-slot-main">
            <div class="bg2-slot-portrait">${meta.empty ? '<span>＋</span>' : '<img src="'+meta.sprite+'" alt="">'}</div>
            <div class="bg2-slot-copy">
              <strong>${meta.empty ? 'Ranura vacía' : escapeHtml(meta.name)}</strong>
              <span>${meta.empty ? 'Una historia todavía no escrita' : escapeHtml(meta.world)}</span>
              <small>${meta.empty ? 'Lista para comenzar' : 'Nivel '+meta.level+' · '+meta.stage}</small>
            </div>
          </div>
          <div class="bg2-slot-progress"><span style="width:${meta.progress}%"></span></div>
          <div class="bg2-slot-meta">
            <span>${meta.empty ? '—' : meta.gold+' oro'}</span>
            <span>${meta.empty ? '—' : meta.progress+'%'}</span>
            <span>${meta.empty ? 'Sin guardar' : updated}</span>
          </div>
          <button class="bg2-slot-button ${intent === 'new' ? 'new' : ''}" data-slot-action="${intent === 'new' ? 'new' : 'continue'}" data-slot="${meta.index}" ${intent === 'continue' && meta.empty ? 'disabled' : ''}>
            ${intent === 'continue' ? (meta.empty ? 'VACÍA' : 'CONTINUAR') : (meta.empty ? 'CREAR AVENTURA' : 'SUSTITUIR…')}
          </button>
        </article>
      `;
    }).join('');
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  let slotIntent = 'continue';
  function openSlots(intent) {
    if (!window.BG2Slots) return toast('Las ranuras todavía no están disponibles.', 'red');
    slotIntent = intent;
    renderSlots(intent);
    $('bg2-slots-modal').classList.add('open');
  }
  function closeSlots() {
    $('bg2-slots-modal')?.classList.remove('open');
  }

  function confirmReplace(index) {
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
          <h2>¿Sustituir la ranura?</h2>
          <p>Esta ranura contiene una aventura. La copia actual dejará de ser la partida activa.</p>
          <div class="bg2-confirm-actions">
            <button data-answer="no">CANCELAR</button>
            <button class="danger" data-answer="yes">SUSTITUIR</button>
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

  async function newSlot(index) {
    const current = window.BG2Slots.getSlot(index,'adventure');
    if (current && !(await confirmReplace(index))) return;
    window.BG2Slots.prepareNew(index,'adventure');
    closeSlots();
    toast('Ranura 0'+index+' preparada', 'cyan');
    click('menu-start');
    setTimeout(()=>click('start-choice-new'), 30);
    setTimeout(()=>{
      const adventure = document.querySelector('.mode-card[data-mode="adventure"]');
      if (adventure) adventure.click();
    }, 85);
  }

  function continueSlot(index) {
    const slot = window.BG2Slots.getSlot(index,'adventure');
    if (!slot?.data) return;
    window.BG2Slots.setActive(index,'adventure');
    closeSlots();
    click('menu-start');
    setTimeout(()=>click('start-choice-continue'), 25);
    setTimeout(()=>{
      const adventure = document.querySelector('.mode-card[data-mode="adventure"]');
      if (adventure) adventure.click();
    }, 80);
  }

  function openModes() {
    click('menu-start');
    setTimeout(()=>click('start-choice-new'), 25);
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

    const observer = new MutationObserver(()=>{
      decorateModes();
      decorateHeroSelect();
      decorateSecondaryScreens();
      decorateCombat();
      sceneClass();
      updateHub();
    });
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});

    setInterval(()=>{
      updateHub();
      sceneClass();
      watchSave();
    }, 1100);

    window.addEventListener('bg2:slots-changed', ()=> {
      if ($('bg2-slots-modal')?.classList.contains('open')) renderSlots(slotIntent);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();