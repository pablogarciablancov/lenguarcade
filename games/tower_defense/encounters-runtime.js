/* New enemies and answer-based review use the existing combat, codex and pupil bridge. */
(function(){
 'use strict';
 const game=window.game,E=GuardianEncounters,R=GuardianReview;if(!game)return;
 for(const [id,spec]of Object.entries(E.types)){
  const base=ENEMY_TYPES[spec.base];
  ENEMY_TYPES[id]={...base,name:spec.name,category:spec.category,badge:spec.badge,badgeColor:spec.color,color:spec.color,hp:base.hp*spec.hpFactor,speed:base.speed*spec.speedFactor,shieldLayers:spec.shieldLayers,tacticalTip:spec.role+' '+spec.counter};
  // Existing animation definitions are a safe fallback while an independent sprite loads.
  SPRITE_DEFINITIONS.enemies[id]=SPRITE_DEFINITIONS.enemies[spec.base];
 }
 const expanded=E.waves(WAVES);WAVES.splice(0,WAVES.length,...expanded);
 const enemySheet=PixelArtFactory.enemySheet;
 PixelArtFactory.enemySheet=function(type){return enemySheet.call(this,E.types[type]?.base||type);};
 const forkNodes=E.forks(game.roadRoutes),images={};
 for(const id of Object.keys(E.types)){const image=new Image();image.src=`assets/encounters/${id}.webp`;images[id]=image;}
 const move=Enemy.prototype.moveAlongPath;
 Enemy.prototype.moveAlongPath=function(amount){
  if(this.type!=='runner')return move.call(this,amount);
  this.progressScore(); // Assign a branching route before measuring its offsets.
  if(!this.surgeForks&&this.roadRoute)this.surgeForks=this.roadRoute.points.map((p,i)=>({key:p.x+','+p.y,at:this.roadRoute.offsets[i]})).filter(p=>forkNodes.has(p.key));
  const before=this.travel||0,out=move.call(this,amount*(this.surgeRemaining>0?1.7:1));
  this.usedForks=this.usedForks||new Set();
  for(const fork of this.surgeForks||[])if(!this.usedForks.has(fork.key)&&before<fork.at&&this.travel>=fork.at){
   this.usedForks.add(fork.key);this.surgeRemaining=2.5;this.game.floatText(this.x,this.y,'¡Carrera!','#ffcc79');
  }
  return out;
 };
 const enemyUpdate=Enemy.prototype.update;
 Enemy.prototype.update=function(dt){if(this.surgeRemaining)this.surgeRemaining=Math.max(0,this.surgeRemaining-dt);return enemyUpdate.call(this,dt);};
 const damage=Enemy.prototype.takeDamage;
 Enemy.prototype.takeDamage=function(amount,tower){return damage.call(this,amount*(E.protectedBy(this,this.game.enemies)?0.65:1),tower);};
 const reach=Enemy.prototype.reachLibrary;
 Enemy.prototype.reachLibrary=function(){
  if(this.alive&&this.type==='devourer'){
   const stolen=E.stolen(this.game.ink);this.game.ink-=stolen;this.game.floatText(this.x,this.y,`−${stolen} tinta`,'#d9a5ff');this.game.log(`Devoratinta robó ${stolen} de tinta.`);
  }
  return reach.call(this);
 };
 const drawEnemy=PixelRenderer.prototype.drawEnemy;
 PixelRenderer.prototype.drawEnemy=function(ctx,e){
  const image=images[e.type];if(!image?.naturalWidth)return drawEnemy.call(this,ctx,e);
  this.ensureEnemy(e);const time=performance.now()/1000,flip=this.enemyDirection(e),size=e.type==='protector'?55:48;
  if(e.type==='protector'){
   ctx.save();ctx.strokeStyle='#65d7e399';ctx.fillStyle='#57cbd512';ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(e.x,e.y,46,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
  }
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(e.x),Math.round(e.y+12));
  if(flip)ctx.scale(-1,1);
  const bob=Math.round(Math.sin(time*(e.surgeRemaining>0?19:8)+e.phase)*(e.type==='protector'?1:2));
  if(e.shieldActive){ctx.save();ctx.filter='drop-shadow(0 0 2px #ffd76a)';ctx.drawImage(image,-size/2,-size*90/96+bob,size,size);ctx.restore();}
  if(e.pixelAnimator.state==='hit')ctx.filter='brightness(1.6)';
  ctx.drawImage(image,-size/2,-size*90/96+bob,size,size);ctx.restore();
 };
 const overlay=PixelRenderer.prototype.drawEntityOverlay;
 PixelRenderer.prototype.drawEntityOverlay=function(ctx,e){
  overlay.call(this,ctx,e);ctx.save();ctx.textAlign='center';ctx.font='bold 7px monospace';
  if(E.protectedBy(e,this.game.enemies)){ctx.fillStyle='#7eeafa';ctx.fillText('◆',e.x,e.y-30);}
  if(e.type==='runner'&&e.surgeRemaining>0){ctx.fillStyle='#ffcd74';ctx.fillText('››',e.x,e.y-31);}
  if(e.type==='devourer'){
   ctx.fillStyle='#ceb0ef';ctx.fillRect(Math.round(e.x-4),Math.round(e.y-33),8,6);ctx.fillRect(Math.round(e.x-2),Math.round(e.y-36),4,3);
  }
  ctx.restore();
 };
 // Preserve the illustrated original bestiary and add actionable entries for the new threats.
 const guideModal=document.getElementById('monsterModal'),guideGrid=document.getElementById('monsterGuideGrid');
 let guidePause=null,guideFocus=null;
 const oldGuide=openMonsterGuide;
 openMonsterGuide=function(){
  if(game.questionActive||!guideModal.classList.contains('hidden'))return;
  guidePause=game.paused;guideFocus=document.activeElement;game.paused=true;oldGuide();guideGrid.classList.add('has-tactics');
  const section=document.createElement('section');section.className='encounter-bestiary';
  section.innerHTML=`<h3>Nuevas amenazas · Observa, responde y adapta tu defensa</h3><div class="encounter-cards">${Object.entries(E.types).map(([id,s])=>`<article class="encounter-card"><img src="assets/encounters/${id}.webp" alt="${s.name}"><h4>${s.name}</h4><span>Desde la oleada ${s.firstWave} · ${ENEMY_TYPES[id].shieldLayers} ${ENEMY_TYPES[id].shieldLayers===1?'capa':'capas'}</span><p>${s.role}</p><p><b>Señal:</b> ${s.signal}</p><p><b>Estrategia:</b> ${s.counter}</p></article>`).join('')}</div>`;
  guideGrid.prepend(section);document.getElementById('closeMonsterModal').focus();
 };
 function restoreGuidePause(){if(guidePause===null)return;game.paused=guidePause;guidePause=null;guideFocus?.focus();}
 document.getElementById('closeMonsterModal').addEventListener('click',restoreGuidePause);
 guideModal.addEventListener('click',e=>{if(e.target===guideModal)restoreGuidePause();});
 document.addEventListener('keydown',e=>{
  if(guidePause===null)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();guideModal.classList.add('hidden');restoreGuidePause();}
  if(e.key==='Tab'){e.preventDefault();document.getElementById('closeMonsterModal').focus();}
 },true);
 const bestiary=document.createElement('button');bestiary.type='button';bestiary.id='encounterBestiaryBtn';bestiary.textContent='Bestiario';bestiary.setAttribute('aria-haspopup','dialog');bestiary.addEventListener('click',()=>openMonsterGuide());
 document.querySelector('.guardian-orders').appendChild(bestiary);
 // Restore exclusively from the current pupil's bootstrap in embedded mode.
 function sourceSave(){return LA_TD_BRIDGE.enabled()?LA_TD_BRIDGE.save():SaveManager.load();}
 game.adaptiveReview=R.load(sourceSave()?.adaptiveReview,GUARDIAN_QUESTION_CATALOG);
 const save=SaveManager.save;
 SaveManager.save=function(data){return save.call(this,{...data,adaptiveReview:game.adaptiveReview});};
 const restore=Game.prototype.restoreCheckpoint;
 Game.prototype.restoreCheckpoint=function(){this.adaptiveReview=R.load(SaveManager.load()?.adaptiveReview,GUARDIAN_QUESTION_CATALOG);return restore.call(this);};
 const showQuestion=UIManager.prototype.showQuestion;
 UIManager.prototype.showQuestion=function(enemy){
  const review=R.select(this.game.adaptiveReview,enemy.cfg.category,GUARDIAN_QUESTION_CATALOG,this.game.mapPreset.questionTier||2);
  if(review){enemy.question={...review,kind:'choice',options:fourOptions(review.options,review.answer)};enemy.displayText=review.label||review.display;}
  const out=showQuestion.call(this,enemy);
  const previous=document.getElementById('adaptiveReviewLabel');previous?.remove();
  if(enemy.question.reviewSkill){const label=document.createElement('div');label.id='adaptiveReviewLabel';label.className='adaptive-review-label';label.textContent='Refuerzo · La misma regla, otro ejemplo';this.qEnemyWord.before(label);}
  return out;
 };
 const answer=Game.prototype.answerQuestion;
 Game.prototype.answerQuestion=function(raw){
  const q=this.currentEnemy?.question,attempts=this.stats.attempts,correct=this.stats.correct,out=answer.call(this,raw);
  if(q&&this.stats.attempts===attempts+1){
   const before=this.adaptiveReview.mastered;
   R.record(this.adaptiveReview,q,this.stats.correct>correct,GUARDIAN_QUESTION_CATALOG,this.mapPreset.questionTier||2);
   if(this.adaptiveReview.mastered>before)this.log('📚 Regla reforzada: dos repasos acertados con ejemplos distintos.');
   this.saveCheckpoint();if(LA_TD_BRIDGE.enabled())LA_TD_BRIDGE.reportProgress({reason:'language-review'});
  }
  return out;
 };
 game.ui.updateHUD();
})();
