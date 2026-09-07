(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  function loadUnifiedCss(){
    if(document.getElementById('bg2-unified-rpg-css')) return;
    const link=document.createElement('link');
    link.id='bg2-unified-rpg-css';
    link.rel='stylesheet';
    link.href='./rpg-unified-v2.css?v=20260907-rpg5';
    document.head.appendChild(link);
  }

  const titleMeta = [
    ['start-choice','.screen-title','ARCHIVO DE AVENTURAS'],
    ['mode-screen','.mode-title','ESCOGE TU DESTINO'],
    ['hub-account','.screen-title','FICHA DEL AVENTURERO'],
    ['hub-achievements','.screen-title','CRÓNICA DE HAZAÑAS'],
    ['hub-shop','.screen-title','PUESTO DEL MERCADER'],
    ['hub-collection','.screen-title','ARCHIVO DE CRIATURAS'],
    ['hub-credits','.screen-title','TRAS LAS PUERTAS DEL REINO'],
    ['start-screen','.start-title','FORJA DEL HÉROE'],
    ['camp-screen','.camp-title-main','REFUGIO DEL AVENTURERO'],
    ['map-screen','.map-header','CARTOGRAFÍA DEL REINO'],
    ['diary-screen','.diary-header','REGISTRO DE CAMPAÑA'],
    ['history-screen','.history-header','CRÓNICAS DESBLOQUEADAS']
  ];

  const submenuScreens = {
    'start-choice':['01','PARTIDAS'],
    'mode-screen':['02','MODOS'],
    'start-screen':['03','HÉROE'],
    'hub-account':['P','PERFIL'],
    'hub-achievements':['L','LOGROS'],
    'hub-shop':['M','MERCADER'],
    'hub-collection':['B','BESTIARIO'],
    'hub-credits':['C','CRÉDITOS'],
    'camp-screen':['04','CAMPAMENTO'],
    'map-screen':['05','MAPA'],
    'diary-screen':['06','DIARIO'],
    'history-screen':['07','HISTORIA'],
    'inventory-screen':['08','MOCHILA']
  };

  function annotateSubmenus(){
    Object.entries(submenuScreens).forEach(([id,meta]) => {
      const screen=$(id);
      if(!screen) return;
      screen.classList.add(id.startsWith('hub-') || ['start-choice','mode-screen','start-screen'].includes(id) ? 'bg2-rpg-submenu' : 'bg2-rpg-game-submenu');
      screen.dataset.rpgCode=meta[0];
      screen.dataset.rpgSection=meta[1];
      const card=screen.querySelector('.screen-card,.mode-content,.start-panel,.camp-container,.screen-inner,.inventory-container');
      if(card){ card.dataset.rpgCode=meta[0]; card.dataset.rpgSection=meta[1]; }
    });

    const newBtn=$('start-choice-new');
    if(newBtn){
      newBtn.dataset.rpgDescription='Empieza una nueva expedición en una ranura segura';
      newBtn.dataset.rpgNumber='I';
    }
    const continueBtn=$('start-choice-continue');
    if(continueBtn){
      continueBtn.dataset.rpgDescription='Recupera una aventura guardada';
      continueBtn.dataset.rpgNumber='II';
    }

    document.querySelectorAll('#start-choice-back,#mode-back,#hub-account-back,#hub-achievements-back,#hub-shop-back,#hub-collection-back,#hub-credits-back').forEach(btn=>{
      btn.classList.add('bg2-rpg-back');
      if(!btn.dataset.rpgOriginal) btn.dataset.rpgOriginal=btn.textContent || 'Atrás';
      btn.textContent='← VOLVER';
    });
  }

  function annotateTitles(){
    titleMeta.forEach(([screenId, selector, kicker]) => {
      const screen = $(screenId);
      const title = screen?.querySelector(selector);
      if(title) title.dataset.rpgKicker = kicker;
    });

    const inventory = $('inventory-screen');
    const invTitle = inventory?.querySelector('.inventory-container > .box-title');
    if(invTitle) invTitle.dataset.rpgKicker = 'MOCHILA Y TROFEOS';

    const commandTitle = $('input-panel')?.querySelector('.box-title');
    if(commandTitle) commandTitle.dataset.rpgKicker = 'TU TURNO';

    const logTitle = $('log-panel')?.querySelector('.log-title');
    if(logTitle) logTitle.dataset.rpgKicker = 'CRÓNICA DEL COMBATE';

    const heroTitle = $('hero-panel')?.querySelector('.box-title');
    if(heroTitle) heroTitle.dataset.rpgKicker = 'FICHA RÁPIDA';
  }

  function annotateAccount(){
    const email = $('hub-account-email');
    const card = email?.parentElement;
    if(card) {
      card.classList.add('bg2-account-seal');
      card.removeAttribute('style');
    }
  }

  function annotateNavigation(){
    const nav = [
      ['nav-home','00'],
      ['nav-battle','01'],
      ['nav-camp','02'],
      ['nav-map','03'],
      ['nav-diary','04'],
      ['nav-history','05'],
      ['nav-inventory','06']
    ];
    nav.forEach(([id,index]) => {
      const btn = $(id);
      if(btn) btn.dataset.rpgIndex = index;
    });
  }

  function annotateForms(){
    const answer = $('answer');
    if(answer) answer.setAttribute('aria-label','Respuesta de combate');
    const attack = $('attack-btn');
    if(attack && !attack.dataset.rpgLabelled){
      attack.dataset.rpgLabelled='1';
      attack.textContent='ATACAR';
      attack.title='Lanza tu respuesta contra el enemigo';
    }
    const use = $('use-item-btn');
    if(use) use.textContent='USAR';
  }

  function annotateOverlays(){
    document.querySelectorAll('.overlay-title,.modal-title').forEach(title => {
      if(!title.dataset.rpgKicker) title.dataset.rpgKicker='VENTANA DE AVENTURA';
    });
  }

  function ensureSingleActiveScreen(){
    const active=[...document.querySelectorAll('.app-screen.is-active')];
    if(active.length <= 1) return;
    const preferred=active.find(screen=>screen.id==='main-menu') || active[active.length-1];
    active.forEach(screen=>{ if(screen!==preferred) screen.classList.remove('is-active'); });
  }

  function apply(){
    loadUnifiedCss();
    document.body.classList.add('bg2-unified-rpg');
    annotateSubmenus();
    annotateTitles();
    annotateAccount();
    annotateNavigation();
    annotateForms();
    annotateOverlays();
    ensureSingleActiveScreen();
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, {once:true});
  } else {
    apply();
  }

  // Los overlays de Práctica/Estrategia se crean bajo demanda.
  document.addEventListener('click', () => {
    requestAnimationFrame(()=>{ annotateSubmenus(); annotateOverlays(); ensureSingleActiveScreen(); });
  }, {passive:true});
})();