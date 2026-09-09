(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const state = {
    collectionFilter: 'all',
    collectionSearch: '',
    shopFilterCamp: 'all',
    shopFilterHub: 'all'
  };

  const SHOP_META = {
    venda_rapida:{cat:'heal',label:'Curación',rarity:'common'},
    cuaderno_descanso:{cat:'heal',label:'Curación',rarity:'rare'},
    pista_simple:{cat:'hint',label:'Pistas',rarity:'common'},
    lupa_corrector:{cat:'hint',label:'Pistas',rarity:'rare'},
    escudo_gramatical:{cat:'defense',label:'Defensa',rarity:'common'},
    pocion_debilitante:{cat:'defense',label:'Defensa',rarity:'rare'},
    pocion_tinta:{cat:'attack',label:'Ataque',rarity:'common'},
    tinta_corrosiva:{cat:'attack',label:'Ataque',rarity:'rare'},
    expansor_tildes:{cat:'attack',label:'Ataque',rarity:'rare'},
    pluma_maestra:{cat:'special',label:'Mejora',rarity:'legendary'},
    botas_corregidor:{cat:'special',label:'Colección',rarity:'unique'}
  };

  const CAT_ICONS = {
    heal:'✚',
    hint:'⌕',
    defense:'◆',
    attack:'⚔',
    special:'✦',
    other:'•'
  };

  function loadCss(){
    let link=$('bg2-catalog-polish-css');
    if(!link){
      link=document.createElement('link');
      link.id='bg2-catalog-polish-css';
      link.rel='stylesheet';
      document.head.appendChild(link);
    }
    link.href='./catalog-polish-v2.css?v=20260909-rpg24';
    return link;
  }

  // Las demás capas RPG insertan sus CSS en DOMContentLoaded. Recolocamos
  // esta hoja al final para que el catálogo sea realmente la última capa visual.
  function keepCssLast(){
    const link=loadCss();
    if(link && document.head && link.parentNode===document.head){
      document.head.appendChild(link);
    }
  }

  function roman(n){
    return ['I','II','III','IV','V','VI'][Math.max(0,n-1)] || String(n);
  }

  function safeText(node){
    return (node?.textContent || '').trim();
  }

  function getGold(){
    let p=null;
    try{
      if(window.BG && typeof window.BG.getPlayer==='function') p=window.BG.getPlayer();
      if(!p && window.BG) p=window.BG.player || null;
    }catch(e){ p=window.BG?.player || null; }
    const gold=Number(p?.gold);
    return Number.isFinite(gold) ? gold : null;
  }

  function collectionFilterButton(label, value){
    return '<button type="button" class="bg2-filter-btn" data-bg2-collection-filter="'+value+'">'+label+'</button>';
  }

  function ensureCollectionToolbar(){
    const screen=$('hub-collection');
    const card=screen?.querySelector('.screen-card');
    const grid=$('hub-collection-grid');
    if(!card || !grid) return null;

    const sub=card.querySelector('.screen-sub');
    if(sub && !sub.dataset.catalogCopy){
      sub.dataset.catalogCopy='1';
      sub.textContent='Completa el bestiario derrotando criaturas en el Modo Aventura. Pulsa una carta para abrir su ficha.';
    }

    let toolbar=$('bg2-collection-toolbar');
    if(!toolbar){
      toolbar=document.createElement('div');
      toolbar.id='bg2-collection-toolbar';
      toolbar.className='bg2-collection-toolbar';
      toolbar.innerHTML=
        '<div class="bg2-collection-progress-card">'+
          '<div class="bg2-progress-copy">'+
            '<span class="bg2-kicker">ARCHIVO DE CRIATURAS</span>'+
            '<strong id="bg2-collection-count">0 / 0</strong>'+
            '<span id="bg2-collection-caption">Bestiario por completar</span>'+
          '</div>'+
          '<div class="bg2-progress-track"><i id="bg2-collection-progress"></i></div>'+
        '</div>'+
        '<div class="bg2-collection-controls">'+
          '<div class="bg2-filter-row">'+
            collectionFilterButton('Todos','all')+
            collectionFilterButton('Derrotados','unlocked')+
            collectionFilterButton('Bloqueados','locked')+
            collectionFilterButton('Mundo I','world-1')+
            collectionFilterButton('Mundo II','world-2')+
            collectionFilterButton('Mundo III','world-3')+
            collectionFilterButton('Mundo IV','world-4')+
            collectionFilterButton('Mundo V','world-5')+
          '</div>'+
          '<label class="bg2-catalog-search-wrap"><span>⌕</span><input id="bg2-collection-search" type="search" placeholder="Buscar criatura o contenido…" autocomplete="off"></label>'+
        '</div>';

      grid.parentNode.insertBefore(toolbar,grid);

      toolbar.addEventListener('click',e=>{
        const btn=e.target.closest('[data-bg2-collection-filter]');
        if(!btn) return;
        state.collectionFilter=btn.dataset.bg2CollectionFilter || 'all';
        applyCollectionFilters();
      });

      $('bg2-collection-search')?.addEventListener('input',e=>{
        state.collectionSearch=(e.target.value || '').trim().toLowerCase();
        applyCollectionFilters();
      });
    }
    return toolbar;
  }

  function decorateCollection(){
    const grid=$('hub-collection-grid');
    if(!grid) return;
    ensureCollectionToolbar();

    const cards=[...grid.querySelectorAll('.mon-card')];
    const total=cards.length;
    let unlockedCount=0;

    cards.forEach((card,index)=>{
      const unlocked=!card.classList.contains('locked');
      if(unlocked) unlockedCount++;

      const world=Math.floor(index/6)+1;
      const boss=index%6===5;
      const name=safeText(card.querySelector('.mon-name'));
      const rule=safeText(card.querySelector('.mon-rule'));
      card.dataset.bg2Status=unlocked ? 'unlocked' : 'locked';
      card.dataset.bg2World=String(world);
      card.dataset.bg2Search=(name+' '+rule).toLowerCase();
      card.classList.toggle('bg2-boss-card',boss);

      const art=card.querySelector('.mon-sprite-wrap');
      if(art && !art.querySelector('.bg2-mon-world')){
        const chip=document.createElement('span');
        chip.className='bg2-mon-world';
        chip.textContent='MUNDO '+roman(world);
        art.appendChild(chip);
      }
      if(art && boss && !art.querySelector('.bg2-mon-boss')){
        const chip=document.createElement('span');
        chip.className='bg2-mon-boss';
        chip.textContent='JEFE';
        art.appendChild(chip);
      }

      let status=card.querySelector('.bg2-mon-status');
      if(!status){
        status=document.createElement('div');
        status.className='bg2-mon-status';
        card.appendChild(status);
      }
      status.innerHTML=unlocked
        ? '<span class="bg2-status-dot"></span> Derrotado <b>VER FICHA →</b>'
        : '<span class="bg2-status-lock">◆</span> Sin derrotar <b>VER FICHA →</b>';

      card.setAttribute('aria-label',name+(unlocked ? ', derrotado' : ', no derrotado')+', Mundo '+roman(world));
    });

    const count=$('bg2-collection-count');
    const caption=$('bg2-collection-caption');
    const progress=$('bg2-collection-progress');
    const pct=total ? Math.round(unlockedCount/total*100) : 0;
    if(count) count.textContent=unlockedCount+' / '+total;
    if(caption) caption.textContent=pct+'% del bestiario completado';
    if(progress) progress.style.width=pct+'%';

    applyCollectionFilters();
  }

  function applyCollectionFilters(){
    const grid=$('hub-collection-grid');
    if(!grid) return;
    const cards=[...grid.querySelectorAll('.mon-card')];
    const f=state.collectionFilter;
    const q=state.collectionSearch;

    cards.forEach(card=>{
      let ok=true;
      if(f==='unlocked') ok=card.dataset.bg2Status==='unlocked';
      else if(f==='locked') ok=card.dataset.bg2Status==='locked';
      else if(f.startsWith('world-')) ok=card.dataset.bg2World===f.slice(6);
      if(ok && q) ok=(card.dataset.bg2Search || '').includes(q);
      card.hidden=!ok;
    });

    document.querySelectorAll('[data-bg2-collection-filter]').forEach(btn=>{
      btn.classList.toggle('is-active',(btn.dataset.bg2CollectionFilter || 'all')===f);
    });

    let empty=$('bg2-collection-empty');
    const visible=cards.some(c=>!c.hidden);
    if(!empty){
      empty=document.createElement('div');
      empty.id='bg2-collection-empty';
      empty.className='bg2-catalog-empty';
      empty.textContent='No hay criaturas que coincidan con este filtro.';
      grid.parentNode.appendChild(empty);
    }
    empty.hidden=visible;
  }

  function shopCategory(id){
    return SHOP_META[id] || {cat:'other',label:'Objeto',rarity:'common'};
  }

  function shopFilterButton(label,value){
    return '<button type="button" class="bg2-shop-filter" data-bg2-shop-filter="'+value+'">'+label+'</button>';
  }

  function shopFilterKey(mount){
    return mount?.id==='hub-shop-list' ? 'shopFilterHub' : 'shopFilterCamp';
  }

  function decorateMerchantHeader(mount){
    const header=mount.querySelector('.shop-merchant-header');
    if(!header) return;

    header.classList.add('bg2-merchant-header');
    const img=header.querySelector('img');
    if(img){
      img.classList.add('bg2-merchant-avatar');
      img.removeAttribute('style');
    }

    let copy=header.querySelector('.bg2-merchant-copy');
    if(!copy){
      copy=document.createElement('div');
      copy.className='bg2-merchant-copy';
      copy.innerHTML=
        '<span class="bg2-kicker">MERCADER DEL REINO</span>'+
        '<strong>El Escriba Errante</strong>'+
        '<p>“El conocimiento protege. Una buena poción también.”</p>';
      header.insertBefore(copy,header.children[1] || null);
    }

    let gold=header.querySelector('.bg2-shop-gold');
    if(!gold){
      gold=document.createElement('div');
      gold.className='bg2-shop-gold';
      header.appendChild(gold);
    }
    const amount=getGold();
    gold.innerHTML='<span>ORO</span><strong>'+(amount===null ? '—' : amount)+'</strong><i>◈</i>';

    const tabs=header.querySelector('div:not(.bg2-merchant-copy):not(.bg2-shop-gold)');
    if(tabs) tabs.classList.add('bg2-shop-tabs');

    let filters=header.querySelector('.bg2-shop-filters');
    if(!filters){
      filters=document.createElement('div');
      filters.className='bg2-shop-filters';
      filters.innerHTML=
        shopFilterButton('Todos','all')+
        shopFilterButton('Curación','heal')+
        shopFilterButton('Pistas','hint')+
        shopFilterButton('Defensa','defense')+
        shopFilterButton('Ataque','attack')+
        shopFilterButton('Especial','special');
      header.appendChild(filters);
      filters.addEventListener('click',e=>{
        const btn=e.target.closest('[data-bg2-shop-filter]');
        if(!btn) return;
        state[shopFilterKey(mount)]=btn.dataset.bg2ShopFilter || 'all';
        applyShopFilters(mount);
      });
    }
  }

  function decorateShopCard(card){
    const id=card.dataset.id || '';
    const meta=shopCategory(id);
    card.dataset.bg2Category=meta.cat;
    card.dataset.bg2Rarity=meta.rarity;
    card.classList.add('bg2-shop-card');

    const main=card.querySelector('.shop-item-main');
    const img=main?.querySelector('.shop-item-icon');
    if(img && !img.closest('.bg2-shop-art')){
      const wrap=document.createElement('div');
      wrap.className='bg2-shop-art';
      img.parentNode.insertBefore(wrap,img);
      wrap.appendChild(img);
    }

    const text=card.querySelector('.shop-item-text');
    if(text && !text.querySelector('.bg2-shop-type')){
      const chip=document.createElement('div');
      chip.className='bg2-shop-type';
      chip.innerHTML='<span>'+CAT_ICONS[meta.cat]+'</span>'+meta.label;
      text.insertBefore(chip,text.firstChild);
    }

    const owned=card.querySelector('.shop-owned');
    card.classList.toggle('is-owned',!!owned);
    if(owned) owned.innerHTML='<span>MOCHILA</span> '+owned.textContent.replace(/^Ya tienes\s*/i,'').replace(/\s*en tu inventario\.?$/i,'');

    const footer=card.querySelector('.shop-item-footer');
    if(footer && !footer.querySelector('.bg2-card-action-label')){
      const label=document.createElement('span');
      label.className='bg2-card-action-label';
      label.textContent=footer.querySelector('.shop-sell-btn') ? 'VALOR DE REVENTA' : 'LISTO PARA EQUIPAR';
      footer.insertBefore(label,footer.firstChild);
    }
  }

  function ensureShopIntro(mount){
    const parent=mount.closest('.screen-card,.camp-box') || mount.parentElement;
    if(!parent) return;

    if(parent.classList.contains('screen-card')){
      const sub=parent.querySelector('.screen-sub');
      if(sub && !sub.dataset.catalogCopy){
        sub.dataset.catalogCopy='1';
        sub.textContent='Prepara tu equipo, gestiona tu mochila y compra ventajas para los próximos combates.';
      }
    }else if(parent.classList.contains('camp-box')){
      const title=parent.querySelector('.camp-box-title');
      const text=parent.querySelector('.camp-text');
      if(title) title.textContent='Mercader del campamento';
      if(text) text.textContent='Reabastece la mochila antes de volver al camino. Cada objeto muestra de un vistazo su función y su precio.';
    }
  }

  function decorateShop(mount){
    if(!mount) return;
    ensureShopIntro(mount);
    decorateMerchantHeader(mount);
    [...mount.querySelectorAll('.shop-item')].forEach(decorateShopCard);
    applyShopFilters(mount);
  }

  function applyShopFilters(mount){
    if(!mount) return;
    const key=shopFilterKey(mount);
    const f=state[key] || 'all';
    const cards=[...mount.querySelectorAll('.shop-item')];
    cards.forEach(card=>{
      card.hidden=!(f==='all' || card.dataset.bg2Category===f);
    });
    mount.querySelectorAll('[data-bg2-shop-filter]').forEach(btn=>{
      btn.classList.toggle('is-active',(btn.dataset.bg2ShopFilter || 'all')===f);
    });

    let empty=mount.querySelector('.bg2-shop-filter-empty');
    const visible=cards.some(c=>!c.hidden);
    if(!empty){
      empty=document.createElement('div');
      empty.className='bg2-shop-filter-empty bg2-catalog-empty';
      empty.textContent='No hay objetos de esta categoría disponibles.';
      mount.appendChild(empty);
    }
    empty.hidden=visible || cards.length===0;
  }

  function polishMonsterModal(){
    const modal=$('monster-modal');
    if(!modal || modal.dataset.catalogPolished) return;
    modal.dataset.catalogPolished='1';
    modal.querySelector('.modal-card')?.classList.add('bg2-monster-modal-card');
    const training=$('monster-modal-training');
    if(training?.parentElement) training.parentElement.classList.add('bg2-training-panel');
  }

  function afterPaint(fn){
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      try{ fn(); }catch(error){ console.warn('[BG2 catalog]',error); }
    }));
  }

  function wrapBgUi(name,decorator){
    const ui=window.BG_UI;
    if(!ui || typeof ui[name]!=='function') return false;
    const original=ui[name];
    if(original.__bg2CatalogWrapped) return true;

    const wrapped=function(...args){
      const result=original.apply(this,args);
      afterPaint(decorator);
      return result;
    };
    wrapped.__bg2CatalogWrapped=true;
    wrapped.__bg2CatalogOriginal=original;
    ui[name]=wrapped;
    return true;
  }

  function wrapGlobal(name,decorator){
    const original=window[name];
    if(typeof original!=='function' || original.__bg2CatalogWrapped) return false;

    const wrapped=function(...args){
      const result=original.apply(this,args);
      afterPaint(decorator);
      return result;
    };
    wrapped.__bg2CatalogWrapped=true;
    wrapped.__bg2CatalogOriginal=original;
    window[name]=wrapped;
    return true;
  }

  function bind(){
    /*
      Importante: esta capa NO observa globalmente el DOM.
      Solo se ejecuta después de las funciones nativas que renderizan
      Bestiario/Tienda, para no interferir con combate, pestañas ni guardado.
    */
    wrapBgUi('renderCollection',decorateCollection);
    wrapBgUi('renderHubShop',()=>decorateShop($('hub-shop-list')));
    wrapGlobal('renderShop',()=>decorateShop($('shop-list')));

    decorateCollection();
    decorateShop($('shop-list'));
    decorateShop($('hub-shop-list'));
    polishMonsterModal();

    document.addEventListener('click',e=>{
      const target=e.target.closest?.('#menu-shop,#menu-collection,#nav-camp,.shop-tab-btn,.shop-buy-btn,.shop-sell-btn');
      if(!target) return;

      if(target.matches('#menu-collection')){
        afterPaint(decorateCollection);
      }else if(target.matches('#menu-shop')){
        afterPaint(()=>decorateShop($('hub-shop-list')));
      }else if(target.matches('#nav-camp')){
        afterPaint(()=>decorateShop($('shop-list')));
      }else if(target.matches('.shop-tab-btn')){
        const mount=target.closest('#hub-shop-list,#shop-list');
        if(mount) state[shopFilterKey(mount)]='all';
        afterPaint(()=>decorateShop(mount));
      }else if(target.closest('#hub-shop-list')){
        afterPaint(()=>decorateShop($('hub-shop-list')));
      }else if(target.closest('#shop-list')){
        afterPaint(()=>decorateShop($('shop-list')));
      }
    },{passive:true});

    window.addEventListener('bg2:player-updated',()=>{
      afterPaint(()=>decorateShop($('shop-list')));
      afterPaint(()=>decorateShop($('hub-shop-list')));
    });
  }

  function boot(){
    loadCss();
    document.body.classList.add('bg2-catalog-polish');
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',()=>{
        keepCssLast();
        bind();
        setTimeout(keepCssLast,0);
      },{once:true});
    }else{
      keepCssLast();
      bind();
    }

    /* Segundo intento únicamente por si BG_UI se registra un instante después. */
    setTimeout(()=>{
      keepCssLast();
      wrapBgUi('renderCollection',decorateCollection);
      wrapBgUi('renderHubShop',()=>decorateShop($('hub-shop-list')));
      wrapGlobal('renderShop',()=>decorateShop($('shop-list')));
    },250);
  }

  boot();
})();