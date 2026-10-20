/* Campaign records extend the existing pupil checkpoint; no additional XP or currencies. */
(function(){
 'use strict';
 const game=window.game,C=GuardianCampaign;if(!game)return;
 const embedded=LA_TD_BRIDGE.enabled(),initial=embedded?LA_TD_BRIDGE.save():SaveManager.load();
 game.mapCampaign=C.load(initial?.mapCampaign);
 game.missionRun=C.run(initial?.mapKey===game.mapKey?initial?.missionRun:null,game.mapKey);
 const save=SaveManager.save;
 SaveManager.save=function(data){return save.call(this,{...data,mapCampaign:C.load(game.mapCampaign),missionRun:data.mapKey===game.mapKey?{...game.missionRun,routeKills:[...game.missionRun.routeKills]}:null});};
 const clear=SaveManager.clear;
 SaveManager.clear=function(){game.missionRun=C.run(null,game.mapKey);return clear.call(this);};
 const checkpoint=Game.prototype.saveCheckpoint;
 Game.prototype.saveCheckpoint=function(){
  const payload=checkpoint.call(this);
  // Include all extension fields in the actual CHECKPOINT/RESULT returned to the host as well.
  return {...payload,...SaveManager.load(),mapCampaign:C.load(this.mapCampaign),missionRun:{...this.missionRun,routeKills:[...this.missionRun.routeKills]}};
 };
 const restore=Game.prototype.restoreCheckpoint;
 Game.prototype.restoreCheckpoint=function(){
  const raw=SaveManager.load();this.mapCampaign=C.load(raw?.mapCampaign);this.missionRun=C.run(raw?.mapKey===this.mapKey?raw?.missionRun:null,this.mapKey);
  if(this.missionRun.finished){SaveManager.clear();location.reload();return false;}
  const out=restore.call(this);refresh();return out;
 };
 const die=Enemy.prototype.die;
 Enemy.prototype.die=function(){
  const alive=this.alive;if(alive)this.progressScore();const out=die.call(this);
  if(alive&&!this.alive)C.kill(this.game.missionRun,this);
  return out;
 };
 function stars(values,large=false){return `<span class="campaign-stars${large?' large':''}" role="img" aria-label="${C.count(values)} de 3 estrellas">${values.map(value=>`<i class="campaign-star${value?' earned':''}" aria-hidden="true"></i>`).join('')}</span>`;}
 function record(key){return game.mapCampaign.maps[key];}
 const button=document.createElement('button');button.type='button';button.id='campaignMissionBtn';button.setAttribute('aria-haspopup','dialog');document.querySelector('.overlay-buttons').appendChild(button);
 const home=document.createElement('button');home.type='button';home.className='campaign-book-button';home.setAttribute('aria-haspopup','dialog');document.querySelector('.start-meta').appendChild(home);
 const legend=document.createElement('div');legend.className='campaign-map-legend';
 legend.innerHTML='<span>★ Gana la defensa · ★ Conserva 15 vidas · ★ Cumple la misión del mapa</span><button type="button" class="campaign-book-button">Ver misiones · 0/24</button>';
 document.getElementById('startMapGrid').before(legend);
 const modal=document.createElement('div');modal.className='campaign-modal';modal.hidden=true;
 modal.innerHTML='<section class="campaign-panel" role="dialog" aria-modal="true" aria-labelledby="campaignTitle"><header><h2 id="campaignTitle"></h2><button type="button" class="campaign-close" aria-label="Cerrar misiones">✕</button></header><div class="campaign-content"></div></section>';
 document.body.appendChild(modal);const content=modal.querySelector('.campaign-content');let pausedBefore=false,focusBefore=null,mode=null;
 function close(){if(modal.hidden)return;modal.hidden=true;game.paused=pausedBefore;mode=null;focusBefore?.focus();}
 function open(title){
  if(!modal.hidden||game.questionActive||document.querySelector('.modal-wrap:not(.hidden),.strategy-modal:not([hidden])'))return false;
  pausedBefore=game.paused;game.paused=true;focusBefore=document.activeElement;
  modal.querySelector('#campaignTitle').textContent=title;modal.hidden=false;modal.querySelector('.campaign-close').focus();return true;
 }
 modal.querySelector('.campaign-close').addEventListener('click',close);modal.addEventListener('click',e=>{if(e.target===modal)close();});
 document.addEventListener('keydown',e=>{
  if(modal.hidden)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}
  if(e.key==='Tab'){const buttons=[...modal.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 },true);
 function amount(g){return `${g.percent?Math.floor(g.value*10)/10:g.value}${g.percent?' %':''} / ${g.target}${g.percent?' %':''}`;}
 function progressRows(){return C.goals(game.mapKey,game.stats,game.missionRun,game.towers).map(g=>`<li class="${g.met?'met':''}"><span>${g.met?'✓':'○'} ${g.label}</span><b>${amount(g)}</b></li>`).join('');}
 function showMission(){
  if(!open('Misión · '+MAP_PRESETS[game.mapKey].name))return;mode='mission';const m=C.missions[game.mapKey];
  content.innerHTML=`<div class="campaign-record">${stars(record(game.mapKey).stars,true)}<span>Estrellas que ya conservas en este mapa</span></div><div class="campaign-objective"><b>Primera estrella · Biblioteca a salvo</b><p>Gana las 10 oleadas. Progreso: ${Math.min(game.waveIndex,10)}/10.</p></div><div class="campaign-objective"><b>Segunda estrella · Defensa sólida</b><p>Gana y termina con al menos 15 vidas. Ahora: ${Math.max(0,game.lives)}/${GAME_CONFIG.maxLives}.</p></div><div class="campaign-objective"><b>Tercera estrella · ${m.title}</b><p>Gana y cumple esta misión: ${m.description}</p><ul class="campaign-progress">${progressRows()}</ul></div><p class="campaign-help">Las estrellas conseguidas se conservan por separado, incluso si una repetición sale peor. Puedes conseguirlas en partidas distintas. La rapidez al responder no es un objetivo.</p><button type="button" class="campaign-continue">Seguir preparando la defensa</button>`;
  content.querySelector('.campaign-continue').textContent=game.waveManager.active?'Volver a la defensa':'Seguir preparando la defensa';content.querySelector('.campaign-continue').addEventListener('click',close);
 }
 function showBook(){
  if(!open(`Campaña · ${C.total(game.mapCampaign)}/24 estrellas`))return;mode='book';
  content.innerHTML=`<p>Ocho escenarios, tres estrellas en cada uno. Puedes jugar en el orden que prefieras.</p><p>En todos los mapas: una estrella por ganar las 10 oleadas y otra por ganar con al menos 15 vidas. La tercera depende de su misión.</p><div class="campaign-map-list">${Object.entries(C.missions).map(([key,m])=>`<article><div class="campaign-map-title"><h3>${MAP_PRESETS[key].name}</h3>${stars(record(key).stars)}</div><b>${m.title}</b><p>${m.description}</p><small>Tercera estrella: gana y cumple la misión.</small></article>`).join('')}</div><p class="campaign-help">Cada estrella obtenida es permanente. Repetir o cambiar de mapa no borra tus estrellas. No hace falta conseguir las tres en una misma partida.</p>`;
 }
 button.addEventListener('click',showMission);home.addEventListener('click',showBook);legend.querySelector('button').addEventListener('click',showBook);
 function refreshCards(){
  for(const selector of ['#startMapGrid .start-map-card','#mapGrid .map-card'])document.querySelectorAll(selector).forEach((card,i)=>{
   const key=Object.keys(MAP_PRESETS)[i];if(!record(key))return;
   let badge=card.querySelector('.campaign-map-stars');if(!badge){badge=document.createElement('span');badge.className='campaign-map-stars';card.appendChild(badge);}
   badge.innerHTML=stars(record(key).stars);card.title=`${MAP_PRESETS[key].name} · ${C.count(record(key).stars)}/3 estrellas. Misión: ${C.missions[key].description}`;
  });
 }
 function refresh(){
  const total=C.total(game.mapCampaign),current=C.count(record(game.mapKey).stars);
  const label=`Misión · ${current}/3 ★`;if(button.textContent!==label)button.textContent=label;
  button.disabled=!game.running;
  home.textContent=`Campaña · ${total}/24 ★`;legend.querySelector('button').textContent=`Ver misiones · ${total}/24 ★`;
  refreshCards();
 }
 const renderChooser=Game.prototype.renderMapChooser;
 Game.prototype.renderMapChooser=function(){const out=renderChooser.call(this);refreshCards();return out;};
 const hud=UIManager.prototype.updateHUD;let lastKey='';
 UIManager.prototype.updateHUD=function(){const out=hud.call(this),key=`${C.total(game.mapCampaign)}|${game.running}`;if(key!==lastKey){lastKey=key;refresh();}return out;};
 const end=Game.prototype.end;
 Game.prototype.end=function(victory){
  if(!this.running)return;
  const result=C.result(this.mapKey,{victory,waveIndex:this.waveIndex,lives:this.lives,stats:this.stats,towers:this.towers},this.missionRun);
  const gained=C.award(this.mapCampaign,this.mapKey,result);this.missionRun.finished=true;
  const out=end.call(this,victory);refresh();
  let panel=document.getElementById('campaignResult');if(!panel){panel=document.createElement('section');panel.id='campaignResult';this.ui.endSummary.after(panel);}
  panel.innerHTML=`<h3>Esta defensa</h3>${stars(result.stars,true)}<p class="campaign-result-earned">${gained?`¡${gained} ${gained===1?'estrella nueva':'estrellas nuevas'}!`:result.won?'Has conservado tus mejores estrellas.':'Puedes volver a intentarlo. Tus estrellas anteriores se conservan.'}</p><ul class="campaign-result-goals"><li>${result.stars[0]?'✓':'○'} Ganar las 10 oleadas</li><li>${result.stars[1]?'✓':'○'} Ganar con 15 vidas o más · ${Math.max(0,this.lives)} vidas</li><li>${result.stars[2]?'✓':'○'} ${C.missions[this.mapKey].title}</li></ul><ul class="campaign-progress">${progressRows()}</ul><div class="campaign-result-total">Tu colección en este mapa ${stars(record(this.mapKey).stars)} · Campaña ${C.total(this.mapCampaign)}/24</div>`;
  this.ui.playAgainBtn.textContent='Repetir mapa · Conservar estrellas';
  if(!document.getElementById('campaignEndMaps')){const maps=document.createElement('button');maps.type='button';maps.id='campaignEndMaps';maps.textContent='Elegir otro mapa';maps.addEventListener('click',()=>{this.ui.endModal.classList.add('hidden');returnToGuardianMainMenu();document.getElementById('startHomePanel').classList.add('hidden');document.getElementById('startMapPanel').classList.remove('hidden');refresh();});this.ui.playAgainBtn.after(maps);}
  this.saveCheckpoint();if(embedded)LA_TD_BRIDGE.reportProgress({reason:'map-stars'});return out;
 };
 // Clear only the finished defence before replaying; the existing clear adapter retains stars and learning.
 document.getElementById('startMapGrid').addEventListener('click',e=>{if(e.target.closest('.start-map-card')&&SaveManager.load()?.missionRun?.finished)SaveManager.clear();},true);
 refresh();
 const foreignLocalRun=embedded&&!initial&&!!SaveManager.load()?.mapKey;
 if(foreignLocalRun||(game.missionRun.finished&&new URLSearchParams(location.search).get('play')==='1')){SaveManager.clear();location.reload();}
})();
