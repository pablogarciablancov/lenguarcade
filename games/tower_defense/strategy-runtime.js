/* Optional strategic choices, layered over the existing upgrades and checkpoint. */
(function(){
  'use strict';
  const game=window.game,S=GuardianStrategy;if(!game)return;
  const baseStats=Object.getOwnPropertyDescriptor(Tower.prototype,'stats').get;
  Object.defineProperty(Tower.prototype,'stats',{configurable:true,get(){return S.stats(baseStats.call(this),this.type,this.specialization);}});
  const investment=Tower.prototype.investment;
  Tower.prototype.investment=function(){return investment.call(this)+(S.option(this.type,this.specialization)?.cost||0);};
  const fire=Tower.prototype.fire;
  Tower.prototype.fire=function(target){
    const out=fire.call(this,target);
    if(this.type==='sintactico'&&this.specialization==='atadura'&&target.alive){target.slowFactor=Math.min(target.slowFactor,this.stats.slow);target.slowUntil=Math.max(target.slowUntil,performance.now()+900);}
    return out;
  };
  Game.prototype.specializeTower=function(tower,id){
    if(!this.running||this.questionActive||!this.towers.includes(tower)||!S.canChoose(tower,id,this.ink))return false;
    const choice=S.option(tower.type,id);this.ink-=choice.cost;tower.specialization=id;
    this.log(`✦ ${tower.cfg.name}: ${choice.name}.`);this.ui.updateHUD();this.saveCheckpoint();if(LA_TD_BRIDGE.enabled())LA_TD_BRIDGE.reportProgress({reason:'specialization'});return true;
  };
  const previewButton=document.createElement('button');previewButton.type='button';previewButton.id='strategyPreviewBtn';
  document.querySelector('.overlay-buttons').appendChild(previewButton);
  const specializeButton=document.createElement('button');specializeButton.type='button';specializeButton.id='specializeTowerBtn';
  document.getElementById('dockActionsHost').appendChild(specializeButton);
  const modal=document.createElement('div');modal.className='strategy-modal';modal.hidden=true;
  modal.innerHTML='<section class="strategy-panel" role="dialog" aria-modal="true" aria-labelledby="strategyTitle"><div class="strategy-header"><h2 id="strategyTitle"></h2><button type="button" data-strategy-close aria-label="Cerrar">✕</button></div><div class="strategy-content"></div><div class="strategy-foot"></div></section>';
  document.body.appendChild(modal);
  const content=modal.querySelector('.strategy-content'),footer=modal.querySelector('.strategy-foot');
  let pausedBefore=false,focusBefore=null,chosenTower=null;
  function close(){if(modal.hidden)return;modal.hidden=true;game.paused=pausedBefore;chosenTower=null;focusBefore?.focus();}
  function open(title){
    if(game.questionActive||!modal.hidden||!game.running||game.paused)return false;
    pausedBefore=game.paused;focusBefore=document.activeElement;game.paused=true;
    document.getElementById('guardianBuildRadial')?.classList.add('hidden');
    modal.querySelector('#strategyTitle').textContent=title;content.innerHTML='';footer.innerHTML='';modal.hidden=false;
    modal.querySelector('[data-strategy-close]').focus();return true;
  }
  modal.querySelector('[data-strategy-close]').addEventListener('click',close);
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  document.addEventListener('keydown',e=>{
    if(modal.hidden)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}
    if(e.key==='Tab'){
      const all=[...modal.querySelectorAll('button:not(:disabled)')],first=all[0],last=all.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  },true);
  function nextIndex(){return game.waveIndex+(game.waveManager.active?1:0);}
  const category={ortografia:'Ortografía',verbos:'Verbos',lexico:'Léxico'};
  function routePreview(){
    const canvas=content.querySelector('canvas'),ctx=canvas.getContext('2d');
    ctx.imageSmoothingEnabled=false;
    // The map thumbnail is schematic: the lines always use the actual road coordinates.
    ctx.fillStyle='#233c45';ctx.fillRect(0,0,560,360);
    const routes=game.roadRoutes?.map(r=>r.points)||[PATH];
    const colors=['#ffde88','#9bd9e7','#d5b5ef','#eea68c'];
    routes.forEach((points,i)=>{ctx.strokeStyle=colors[i%colors.length];ctx.lineWidth=7;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach((p,n)=>n?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();});
    for(const p of BUILD_SITES){ctx.fillStyle='#f8e5c6';ctx.fillRect(p.x-4,p.y-4,8,8);}
    const last=routes[0].at(-1);ctx.fillStyle='#fff5d5';ctx.font='bold 13px system-ui';ctx.fillText('ENTRADA',9,Math.max(16,routes[0][0].y-20));ctx.fillText('BIBLIOTECA',Math.min(460,last.x-60),Math.max(16,last.y-18));
  }
  function showPreview(){
    const index=nextIndex(),groups=WAVES[index];if(!groups||!open(`Oleada ${index+1} · Preparar la defensa`))return;
    const summary=S.wave(groups,ENEMY_TYPES),routeCount=game.roadRoutes?.length||1;
    content.innerHTML=`<p class="strategy-summary">${summary.total} monstruos · ${summary.layers} capas de escudo en total</p><div class="strategy-enemies">${summary.enemies.map(e=>`<article class="strategy-enemy"><h3>${e.count} × ${e.name}</h3><p>${category[e.category]} · ${e.shieldLayers} ${e.shieldLayers===1?'capa':'capas'} de escudo</p><p>${e.type==='fast'?'Muy rápido: vigila su avance.':e.type==='boss'?'Jefe final: sale al final y causa mucho daño a la biblioteca.':e.type==='elite'?'Minijefe: aparece tras los enemigos comunes.':e.type==='armored'?'Mucha vida; prepara daño concentrado.':e.type==='swarm'?'Aparece en grupos; conviene el daño de área.':'Enemigo común; combina control y daño.'}</p></article>`).join('')}</div><h3>${routeCount===1?'Un solo camino':`${routeCount} rutas posibles`}</h3><canvas class="strategy-route-map" width="560" height="360" role="img" aria-label="Esquema de las rutas y las peanas del mapa"></canvas><p>${routeCount===1?'Los monstruos siguen el camino marcado.': 'Los monstruos se reparten entre las alternativas. Cubre las bifurcaciones y coloca al guardián donde más lo necesites.'} Los cuadrados indican peanas para torres.</p><p>Los escudos se rompen respondiendo preguntas de Lengua. Prepara torres y guardián antes de iniciar; no hay cuenta atrás.</p>`;
    routePreview();
    const back=document.createElement('button');back.textContent=game.waveManager.active?'Seguir jugando':'Seguir preparando';back.addEventListener('click',close);footer.appendChild(back);
    if(!game.waveManager.active){const start=document.createElement('button');start.textContent=`Iniciar oleada ${index+1}`;start.addEventListener('click',()=>{close();game.startNextWave();game.ui.updateHUD();});footer.appendChild(start);}
  }
  function format(s){return `${Math.round(s.damage)} daño · ${Math.round(s.range)} alcance · ${s.fireRate.toFixed(2).replace('.',',')} s entre disparos${s.splash?' · radio '+Math.round(s.splash):''}${s.weaken?' · daño recibido ×'+s.weaken.toFixed(2).replace('.',','):''}`;}
  function showSpecializations(){
    const t=game.selectedTower;if(!t||t.level<2||t.specialization||!open(`${t.cfg.name} · Especialización`))return;
    chosenTower=t;
    content.innerHTML=`<p>Elige una especialización permanente para esta torre. Mantendrá sus mejoras de nivel. Las demás torres pueden elegir otra opción.</p><p class="strategy-summary">Ahora: ${format(t.stats)}. Tienes ${Math.floor(game.ink)} de tinta.</p><div class="strategy-options">${S.branches[t.type].map(o=>`<article class="strategy-option"><h3>${o.name}</h3><p>${o.description}</p><p>${format(S.stats(baseStats.call(t),t.type,o.id))}</p><button type="button" data-specialize="${o.id}" ${game.ink<o.cost?'disabled':''}>Elegir · ${o.cost} de tinta</button></article>`).join('')}</div><p>La especialización nunca rompe escudos automáticamente.</p>`;
    content.querySelectorAll('[data-specialize]').forEach(btn=>btn.addEventListener('click',()=>{if(game.specializeTower(chosenTower,btn.dataset.specialize))close();}));
    const later=document.createElement('button');later.textContent='Decidir después';later.addEventListener('click',close);footer.appendChild(later);
  }
  previewButton.addEventListener('click',showPreview);specializeButton.addEventListener('click',showSpecializations);
  const info=UIManager.prototype.renderTowerInfo;
  UIManager.prototype.renderTowerInfo=function(){
    info.call(this);const t=this.game.selectedTower,o=t&&S.option(t.type,t.specialization);
    specializeButton.hidden=!t;specializeButton.disabled=!t||t.level<2||!!o;
    specializeButton.textContent=o?o.name:!t||t.level<2?'Especializar en nivel 2':`Especializar · ${S.branches[t.type]?.[0].cost||0} 🖋️`;
    if(o){const label=document.createElement('span');label.className='strategy-spec-label';label.textContent=o.name;this.towerInfo.appendChild(label);}
  };
  const hud=UIManager.prototype.updateHUD;
  UIManager.prototype.updateHUD=function(){
    hud.call(this);const index=nextIndex(),summary=S.wave(WAVES[index],ENEMY_TYPES);
    previewButton.textContent=index<WAVES.length?`Ver oleada ${index+1} · ${summary.total} enemigos`:'Última oleada en curso';
    previewButton.disabled=index>=WAVES.length||!this.game.running;
    previewButton.setAttribute('aria-haspopup','dialog');
  };
  // Other input paths must respect the paused strategy dialog as well.
  const start=Game.prototype.startNextWave;
  Game.prototype.startNextWave=function(){if(this.paused||this.questionActive)return;return start.apply(this,arguments);};
  game.ui.updateHUD();
})();
