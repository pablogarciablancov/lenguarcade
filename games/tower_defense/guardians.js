/* Local integration: does not change towers, language banks or platform APIs. */
(function(){
  'use strict';
  const game=window.game,C=GuardianCore;if(!game)return;
  const art=(id,pose=null)=>pose===null?`assets/guardians/portrait-${id}.png`:`assets/guardians/${id}-${pose}.png`;
  const initialSave=LA_TD_BRIDGE.enabled()?LA_TD_BRIDGE.save():SaveManager.load();
  let roster=C.roster(initialSave?.guardianRoster),fighter=null,placing=false,preview=null,questionGuardian=null,answerLocked=false,campPaused=false;
  const shell=document.getElementById('mapShell'),canvas=game.canvas;
  const dock=document.getElementById('guardianAbilityDock');
  const portrait=dock.querySelector('.guardian-portrait');
  const hint=document.createElement('div');hint.id='guardianHint';hint.className='hidden';shell.appendChild(hint);
  const orders=document.createElement('div');orders.className='guardian-orders';
  orders.innerHTML='<button id="guardianBreak" class="hidden" type="button">Romper escudo · Lengua</button><button id="guardianCampOpen" type="button">Campamento</button><button id="guardianCancel" class="hidden" type="button">Cancelar</button>';
  shell.appendChild(orders);
  const breakBtn=orders.querySelector('#guardianBreak'),cancelBtn=orders.querySelector('#guardianCancel');
  const camp=document.createElement('div');camp.id='guardianCamp';camp.className='modal-wrap hidden';
  camp.innerHTML='<section class="guardian-camp-panel" role="dialog" aria-modal="true" aria-labelledby="guardianCampTitle"><div class="guardian-camp-head"><h2 id="guardianCampTitle">Campamento de guardianes</h2><span class="guardian-wallet"></span><button id="guardianCampClose" type="button" aria-label="Cerrar campamento">✕</button></div><p class="guardian-camp-help">Elige un compañero para esta defensa. Despliégalo en cualquier tramo del camino: atacará por su cuenta. Pulsa «Romper escudo» y resuelve una pregunta para abrir las defensas del monstruo.</p><div class="guardian-roster"></div><p class="guardian-camp-foot">Ganas 3 monedas por acierto y 15 por oleada superada. El reclutamiento es permanente. Puedes cambiar de ayudante entre oleadas; si se agota, se recupera en 12 s.</p><p id="guardianCampMessage" role="status"></p></section>';
  document.body.appendChild(camp);
  const images={};Object.keys(C.TYPES).forEach(id=>{images[id]=Array.from({length:6},(_,i)=>{const im=new Image();im.src=art(id,i);return im;});});
  let previousFocus=null;
  function notice(text){hint.textContent=text;hint.classList.remove('hidden');}
  function cancelPlacement(){placing=false;preview=null;cancelBtn.classList.add('hidden');hint.classList.add('hidden');portrait.classList.remove('placing');}
  function save(){game.saveCheckpoint();if(LA_TD_BRIDGE.enabled())LA_TD_BRIDGE.reportProgress({reason:'guardians'});}
  function refreshPortrait(){
    portrait.innerHTML=`<img src="${art(roster.selected)}" alt="${C.TYPES[roster.selected].name}">`;
    portrait.setAttribute('aria-label',`Desplegar o mover a ${C.TYPES[roster.selected].name}`);
    portrait.title=`${C.TYPES[roster.selected].name} · Pulsa y elige un punto del camino`;
  }
  function renderCamp(){
    camp.querySelector('.guardian-wallet').textContent=`${roster.coins} monedas`;
    const active=game.waveManager.active;
    camp.querySelector('.guardian-roster').innerHTML=Object.entries(C.TYPES).map(([id,cfg])=>{
      const owned=roster.owned.includes(id),selected=roster.selected===id;
      return `<article class="guardian-recruit${selected?' selected':''}"><img src="${art(id)}" alt="${cfg.name}"><h3>${cfg.name}</h3><p>${cfg.role}</p><small>${cfg.hp} vida · ${cfg.damage} daño<br>Un ataque cada ${String(cfg.rate).replace('.',',')} s</small><button type="button" data-guardian="${id}" ${active||selected||(!owned&&roster.coins<cfg.cost)?'disabled':''}>${selected?'En tu equipo':owned?'Elegir':`Reclutar · ${cfg.cost} monedas`}</button></article>`;
    }).join('');
    camp.querySelector('#guardianCampMessage').textContent=active?'Termina la oleada para reclutar o cambiar de compañero.':'';
    camp.querySelectorAll('[data-guardian]').forEach(btn=>btn.addEventListener('click',()=>{
      if(game.waveManager.active)return;
      const id=btn.dataset.guardian;
      if(roster.owned.includes(id))roster.selected=id;
      else if(!C.recruit(roster,id))return;
      fighter=null;cancelPlacement();refreshPortrait();renderCamp();save();
    }));
  }
  function openCamp(){
    if(game.questionActive||!camp.classList.contains('hidden'))return;
    cancelPlacement();campPaused=game.paused;game.paused=true;previousFocus=document.activeElement;
    renderCamp();camp.classList.remove('hidden');camp.querySelector('#guardianCampClose').focus();
  }
  function closeCamp(){camp.classList.add('hidden');game.paused=campPaused;previousFocus?.focus();}
  orders.querySelector('#guardianCampOpen').addEventListener('click',openCamp);
  camp.querySelector('#guardianCampClose').addEventListener('click',closeCamp);
  camp.addEventListener('click',e=>{if(e.target===camp)closeCamp();});
  document.addEventListener('keydown',e=>{
    if(!camp.classList.contains('hidden')){
      if(e.key==='Escape'){e.preventDefault();closeCamp();}
      if(e.key==='Tab'){
        const buttons=[...camp.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    }else if(e.key==='Escape')cancelPlacement();
  });
  ['.start-meta','.start-map-head'].forEach(sel=>{
    const host=document.querySelector(sel);if(!host)return;
    const btn=document.createElement('button');btn.type='button';btn.className='guardian-camp-btn';
    btn.innerHTML=`<img src="${art('custodio')}" alt="">Guardianes`;btn.addEventListener('click',openCamp);host.appendChild(btn);
  });
  portrait.addEventListener('click',()=>{
    if(!game.running||game.paused||game.questionActive)return;
    if(placing){cancelPlacement();return;}
    if(fighter?.recovery){notice(`Recuperándose · ${Math.ceil(fighter.recovery)} s`);return;}
    if(fighter?.moveCooldown){notice(`Podrás moverlo en ${Math.ceil(fighter.moveCooldown)} s`);return;}
    placing=true;portrait.classList.add('placing');cancelBtn.classList.remove('hidden');
    document.getElementById('guardianBuildRadial')?.classList.add('hidden');
    game.genesisBuildSite=-1;game.buildType=null;game.selectedTower=null;
    notice('Elige un punto del camino · Verde: válido · Esc: cancelar');
  });
  cancelBtn.addEventListener('click',cancelPlacement);
  // Registered first in capture phase by index.html: keeps placement separate from tower/enemy clicks.
  game.guardianPointerClick=function(e){
    if(placing){
      e.preventDefault();e.stopImmediatePropagation();
      if(game.paused||game.questionActive||!game.running)return;
      const point=C.pathPoint(game.canvasPoint(e),PATH,PIXEL_ENGINE.width,PIXEL_ENGINE.height);
      if(!point){notice('Colócalo sobre el camino, dentro del mapa.');return;}
      if(!fighter)fighter=new C.Fighter(roster.selected,point);
      else {fighter.x=point.x;fighter.y=point.y;}
      fighter.moveCooldown=6;cancelPlacement();save();return;
    }
    if(!game.paused&&!game.questionActive&&game.running&&fighter&&!fighter.recovery){
      const p=game.canvasPoint(e);
      if(C.distance(p,{x:fighter.x,y:fighter.y-12})<13){
        const target=fighter.shieldTarget(game.enemies);
        if(target){e.preventDefault();e.stopImmediatePropagation();askGuardian(target);}
      }
    }
  };
  canvas.addEventListener('pointermove',e=>{if(placing)preview={raw:game.canvasPoint(e),point:C.pathPoint(game.canvasPoint(e),PATH,PIXEL_ENGINE.width,PIXEL_ENGINE.height)};});
  canvas.addEventListener('pointerleave',()=>{preview=null;});
  function askGuardian(enemy){
    if(!fighter||fighter.recovery||game.paused||game.questionActive||!enemy?.alive||!enemy.shieldActive)return;
    cancelPlacement();game.openQuestion(enemy);questionGuardian={fighter,enemy};
    game.ui.questionHeaderTitle.textContent=`${fighter.cfg.name} · Escudo ${enemy.maxShieldLayers-enemy.shieldLayers+1}/${enemy.maxShieldLayers}`;
  }
  breakBtn.addEventListener('click',()=>askGuardian(fighter?.shieldTarget(game.enemies)));
  const baseQuestion=Game.prototype.openQuestion;
  Game.prototype.openQuestion=function(enemy){if(this.paused||!this.running||this.questionActive)return;cancelPlacement();questionGuardian=null;answerLocked=false;return baseQuestion.call(this,enemy);};
  const showQuestion=UIManager.prototype.showQuestion;
  UIManager.prototype.showQuestion=function(enemy){answerLocked=false;return showQuestion.call(this,enemy);};
  const answer=Game.prototype.answerQuestion;
  Game.prototype.answerQuestion=function(raw){
    const enemy=this.currentEnemy;if(this.paused||!this.questionActive||answerLocked||!enemy?.alive||!enemy.shieldActive)return;
    answerLocked=true;this.ui.qAnswers.querySelectorAll('button').forEach(b=>b.disabled=true);
    const correct=this.stats.correct,ctx=questionGuardian;
    answer.call(this,raw);
    if(this.stats.correct>correct){
      roster.coins+=3;
      if(ctx?.fighter===fighter&&ctx.enemy===enemy&&!enemy.shieldActive&&enemy.alive){
        fighter.attack=.4;fighter.facing=enemy.x<fighter.x?-1:1;shoot(fighter,enemy);enemy.takeDamage(fighter.cfg.damage,null);
        this.floatText(enemy.x,enemy.y,'¡Golpe del guardián!',fighter.cfg.color);
      }
      save();
    }
  };
  const closeQuestion=Game.prototype.closeQuestion;
  Game.prototype.closeQuestion=function(){questionGuardian=null;answerLocked=false;return closeQuestion.call(this);};
  const completeWave=Game.prototype.completeWave;
  Game.prototype.completeWave=function(){if(this.running)roster.coins+=15;const out=completeWave.call(this);save();return out;};
  // Save via the existing checkpoint bridge, so roster and coins follow the pupil.
  const saveData=SaveManager.save;
  SaveManager.save=function(data){
    const snapshot={...data,guardianRoster:C.roster(roster),guardianDeployment:fighter?.snapshot()||null};
    const out=saveData.call(this,snapshot);
    // Map selection reloads this iframe. Keep its own bootstrap current as well as the host checkpoint.
    if(LA_TD_BRIDGE.enabled())try{
      const bootstrap=JSON.parse(window.name||'{}');
      if(bootstrap.namespace==='lenguarcade-bootstrap'&&bootstrap.gameId==='tower_defense'&&String(bootstrap.channel)===new URLSearchParams(location.search).get('channel')){
        bootstrap.payload={...bootstrap.payload,save:snapshot};window.name=JSON.stringify(bootstrap);
      }
    }catch(_){}
    return out;
  };
  const clearData=SaveManager.clear;
  SaveManager.clear=function(){clearData.call(this);SaveManager.save({version:33,guardianRoster:roster});};
  const restore=Game.prototype.restoreCheckpoint;
  function loadGuardians(s){
    roster=C.roster(s?.guardianRoster);fighter=null;cancelPlacement();
    const raw=s?.guardianDeployment;
    if(s?.mapKey===game.mapKey&&raw&&raw.id===roster.selected&&roster.owned.includes(raw.id)&&Number.isFinite(raw.x)&&Number.isFinite(raw.y)){
      const point=C.pathPoint(raw,PATH,PIXEL_ENGINE.width,PIXEL_ENGINE.height);
      if(point){fighter=new C.Fighter(raw.id,point);fighter.hp=Math.max(1,Math.min(fighter.cfg.hp,Number(raw.hp)||fighter.cfg.hp));fighter.recovery=Math.max(0,Math.min(12,Number(raw.recovery)||0));fighter.moveCooldown=Math.max(0,Math.min(6,Number(raw.moveCooldown)||0));}
    }
    refreshPortrait();
  }
  Game.prototype.restoreCheckpoint=function(){const s=SaveManager.load();loadGuardians(s);return restore.call(this);};
  function shoot(f,e){game.projectiles.push({x:f.x,y:f.y-10,tx:e.x,ty:e.y,color:f.cfg.color,life:.16,control:!!e.shieldActive});}
  const update=Game.prototype.update;
  Game.prototype.update=function(dt){
    if(this.running&&!this.paused){
      const sim=dt*this.gameSpeed*(this.questionActive?GAME_CONFIG.questionSlowFactor:1);
      fighter?.update(sim,this.enemies,performance.now(),shoot);
    }
    update.call(this,dt);
    const target=fighter?.shieldTarget(this.enemies);
    breakBtn.classList.toggle('hidden',!target);breakBtn.classList.toggle('break-ready',!!target);
    breakBtn.disabled=this.paused||this.questionActive||!this.running;
    portrait.classList.toggle('deployed',!!fighter);
    portrait.disabled=!this.running||this.paused||this.questionActive||!!fighter?.recovery||!!fighter?.moveCooldown;
    if(fighter?.recovery)portrait.title=`${fighter.cfg.name} · Recuperándose ${Math.ceil(fighter.recovery)} s`;
    else if(fighter?.moveCooldown)portrait.title=`${C.TYPES[roster.selected].name} · Mover en ${Math.ceil(fighter.moveCooldown)} s`;
    else portrait.title=`${C.TYPES[roster.selected].name} · Pulsa para ${fighter?'mover':'desplegar'}`;
  };
  const enemyUpdate=Enemy.prototype.update;
  Enemy.prototype.update=function(dt){
    if(fighter?.blocked(game.enemies).includes(this)){this.pixelAnimator?.update(dt);return;}
    return enemyUpdate.call(this,dt);
  };
  // Draw in the existing Y-sorted scene, with no spritesheet cropping at runtime.
  PixelRenderer.prototype.drawGuardian=function(ctx,f,ghost=false){
    const pose=f.recovery?5:f.attack>.2?2:f.attack>0?3:f.hit>0?4:Math.floor(f.age*2)%2;
    const img=images[f.id]?.[pose];if(!img?.complete||!img.naturalWidth)return;
    ctx.save();ctx.translate(Math.round(f.x),Math.round(f.y));ctx.imageSmoothingEnabled=false;ctx.globalAlpha=ghost?.55:f.recovery?.45:1;
    ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,1,9,3,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.scale(f.facing,1);ctx.drawImage(img,-48,-60,96,64);ctx.restore();
    if(!ghost){ctx.fillStyle='#101b2d';ctx.fillRect(-12,5,24,4);ctx.fillStyle=f.recovery?'#78b7df':'#7ee6a0';ctx.fillRect(-11,6,22*(f.recovery?1-f.recovery/12:f.hp/f.cfg.hp),2);
      if(f.recovery){ctx.fillStyle='#fff3d3';ctx.font='bold 7px system-ui';ctx.textAlign='center';ctx.fillText(Math.ceil(f.recovery)+' s',0,-30);}}
    ctx.restore();
  };
  game.getGuardian=()=>fighter;
  const render=PixelRenderer.prototype.render;
  PixelRenderer.prototype.render=function(ctx){render.call(this,ctx);
    if(placing&&preview){const p=preview.point||preview.raw;
      ctx.save();ctx.strokeStyle=preview.point?'#8ef0ae':'#ff8e8e';ctx.fillStyle=preview.point?'#8ef0ae18':'#ff8e8e18';ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(p.x,p.y,C.TYPES[roster.selected].range,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
      if(preview.point)this.drawGuardian(ctx,new C.Fighter(roster.selected,p),true);
    }
  };
  loadGuardians(initialSave);
  // Exposed only as a read-only diagnostic snapshot for gameplay validation.
  game.guardianState=()=>({roster:C.roster(roster),fighter:fighter?.snapshot()||null,placing});
})();
