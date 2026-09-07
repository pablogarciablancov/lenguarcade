(() => {
  'use strict';

  const $=id=>document.getElementById(id);

  const ORDER=[
    ['nav-home',1],
    ['nav-battle',2],
    ['nav-camp',3],
    ['nav-map',4],
    ['nav-diary',5],
    ['nav-history',6],
    ['nav-inventory',7]
  ];

  function loadCss(){
    if($('bg2-stable-tabs-css')) return;
    const link=document.createElement('link');
    link.id='bg2-stable-tabs-css';
    link.rel='stylesheet';
    link.href='./stable-tabs-v2.css?v=20260907-rpg13';
    document.head.appendChild(link);
  }

  function annotate(){
    const nav=document.querySelector('.top-nav');
    if(!nav) return;
    nav.classList.add('bg2-stable-tabs');
    ORDER.forEach(([id,order])=>{
      const btn=$(id);
      if(!btn) return;
      btn.dataset.bg2TabOrder=String(order);
    });
  }

  function audit(){
    const nav=document.querySelector('.top-nav');
    const missing=ORDER.filter(([id])=>!$(id)).map(([id])=>id);
    if(nav) nav.dataset.bg2TabsAudit=missing.length?'fail':'ok';
    if(missing.length) console.warn('[Battlegrafía v2] pestañas ausentes:',missing);
  }

  function boot(){
    loadCss();
    annotate();
    audit();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();