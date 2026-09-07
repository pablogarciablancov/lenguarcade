(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  function loadUnifiedCss(){
    if(document.getElementById('bg2-unified-rpg-css')) return;
    const link=document.createElement('link');
    link.id='bg2-unified-rpg-css';
    link.rel='stylesheet';
    link.href='./rpg-unified-v2.css?v=20260907-rpg4';
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

  function apply(){
    loadUnifiedCss();
    document.body.classList.add('bg2-unified-rpg');
    annotateTitles();
    annotateAccount();
    annotateNavigation();
    annotateForms();
    annotateOverlays();
  }

  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply, {once:true});
  } else {
    apply();
  }

  // Los overlays de Práctica/Estrategia se crean bajo demanda.
  document.addEventListener('click', () => {
    requestAnimationFrame(annotateOverlays);
  }, {passive:true});
})();