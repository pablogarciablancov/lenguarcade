(() => {
  'use strict';
  const $=id=>document.getElementById(id);

  function loadCss(){
    if(!$('bg2-tabs-polish-css')){
      const link=document.createElement('link');
      link.id='bg2-tabs-polish-css';
      link.rel='stylesheet';
      link.href='./tabs-polish-v2.css?v=20260907-rpg14';
      document.head.appendChild(link);
    }
    if(!$('bg2-inventory-compact-css')){
      const compact=document.createElement('link');
      compact.id='bg2-inventory-compact-css';
      compact.rel='stylesheet';
      compact.href='./inventory-compact-v2.css?v=20260907-rpg14';
      document.head.appendChild(compact);
    }
  }

  const tabs={
    'camp-screen':{code:'02',label:'CAMPAMENTO'},
    'map-screen':{code:'03',label:'MAPA'},
    'inventory-screen':{code:'06',label:'MOCHILA'},
    'diary-screen':{code:'04',label:'DIARIO'},
    'history-screen':{code:'05',label:'HISTORIA'}
  };

  function annotate(){
    document.body.classList.add('bg2-tabs-polished');

    Object.entries(tabs).forEach(([id,meta])=>{
      const screen=$(id);
      if(!screen) return;
      screen.classList.add('bg2-tab-screen');
      screen.dataset.tabCode=meta.code;
      screen.dataset.tabLabel=meta.label;
    });

    const map=$('map-screen');
    if(map){
      const header=$('map-header');
      if(header) header.dataset.rpgKicker='CARTOGRAFÍA DEL REINO';
    }

    const inv=$('inventory-screen');
    const invTitle=inv?.querySelector('.inventory-container > .box-title');
    if(invTitle) invTitle.dataset.rpgKicker='ALMACÉN DEL AVENTURERO';
  }

  function boot(){
    loadCss();
    annotate();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();