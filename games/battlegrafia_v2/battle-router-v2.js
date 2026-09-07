(() => {
  'use strict';

  const VIEW_MAP = {
    'nav-battle':'battle',
    'nav-camp':'camp',
    'nav-map':'map',
    'nav-diary':'diary',
    'nav-history':'history',
    'nav-inventory':'inventory'
  };
  const SCREEN_MAP = {
    battle:'battle-screen',
    camp:'camp-screen',
    map:'map-screen',
    diary:'diary-screen',
    history:'history-screen',
    inventory:'inventory-screen'
  };
  const $ = id => document.getElementById(id);

  function loadCss(){
    if($('bg2-battle-router-css')) return;
    const link=document.createElement('link');
    link.id='bg2-battle-router-css';
    link.rel='stylesheet';
    link.href='./battle-router-v2.css?v=20260907-rpg10';
    document.head.appendChild(link);
  }

  function shellVisible(){
    const shell=document.querySelector('.game-shell');
    if(!shell) return false;
    const style=getComputedStyle(shell);
    return style.display!=='none' && style.visibility!=='hidden';
  }

  function startVisible(){
    const start=$('start-screen');
    if(!start) return false;
    const style=getComputedStyle(start);
    return style.display!=='none' && style.visibility!=='hidden';
  }

  function modeFromNav(){
    for(const [id,mode] of Object.entries(VIEW_MAP)){
      if($(id)?.classList.contains('nav-active')) return mode;
    }
    return null;
  }

  function modeFromInlineScreens(){
    for(const [mode,id] of Object.entries(SCREEN_MAP)){
      const node=$(id);
      if(!node) continue;
      const inline=(node.style.display || '').trim();
      if(inline && inline!=='none') return mode;
    }
    return null;
  }

  let currentView='battle';
  let syncing=false;

  function applyView(mode){
    if(syncing) return;
    if(!SCREEN_MAP[mode]) mode='battle';
    currentView=mode;

    if(!shellVisible() || startVisible()){
      document.body.removeAttribute('data-bg2-view');
      document.body.classList.remove('bg2-in-battle');
      return;
    }

    syncing=true;
    document.body.dataset.bg2View=mode;
    document.body.classList.toggle('bg2-in-battle',mode==='battle');

    for(const [view,id] of Object.entries(SCREEN_MAP)){
      const node=$(id);
      if(!node) continue;
      const active=view===mode;
      node.setAttribute('aria-hidden',active?'false':'true');
      node.dataset.bg2Visible=active?'1':'0';
    }

    // El panel de acción pertenece únicamente a la batalla.
    const side=document.querySelector('.panel-right');
    if(side) side.dataset.bg2Visible=(mode==='battle'?'1':'0');

    syncing=false;
  }

  function syncFromEngine(){
    if(!shellVisible() || startVisible()){
      applyView(currentView);
      return;
    }
    const mode=modeFromNav() || modeFromInlineScreens() || currentView || 'battle';
    applyView(mode);
  }

  function bindNav(){
    Object.entries(VIEW_MAP).forEach(([id,mode])=>{
      const btn=$(id);
      if(!btn || btn.dataset.bg2RouterBound) return;
      btn.dataset.bg2RouterBound='1';
      btn.addEventListener('click',()=>{
        // El motor cambia primero sus estados; sincronizamos justo después.
        requestAnimationFrame(()=>applyView(mode));
      });
    });
  }

  function observe(){
    const nav=document.querySelector('.top-nav');
    const shell=document.querySelector('.game-shell');
    const start=$('start-screen');
    const targets=[nav,shell,start,...Object.values(SCREEN_MAP).map($)].filter(Boolean);

    let queued=false;
    const schedule=()=>{
      if(queued || syncing) return;
      queued=true;
      requestAnimationFrame(()=>{
        queued=false;
        syncFromEngine();
      });
    };

    const observer=new MutationObserver(schedule);
    targets.forEach(node=>{
      observer.observe(node,{
        attributes:true,
        attributeFilter:['class','style']
      });
    });
  }

  function auditContract(){
    const missing=[];
    for(const id of Object.values(SCREEN_MAP)) if(!$(id)) missing.push(id);
    for(const id of Object.keys(VIEW_MAP)) if(!$(id)) missing.push(id);
    document.body.dataset.bg2RouterAudit=missing.length?'fail':'ok';
    if(missing.length) console.warn('[Battlegrafía v2] Battle router missing:',missing);
  }

  function boot(){
    loadCss();
    document.body.classList.add('bg2-battle-router');
    bindNav();
    auditContract();
    syncFromEngine();
    observe();
    setTimeout(syncFromEngine,80);
    setTimeout(syncFromEngine,350);
  }

  window.BG2BattleRouter={
    applyView,
    syncFromEngine,
    getView:()=>currentView,
    auditContract
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();