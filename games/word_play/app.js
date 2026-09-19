(() => {
'use strict';
const E=window.WordPlayEngine,C=E.C,$=id=>document.getElementById(id);
const ui={menu:$('menuScreen'),game:$('gameScreen'),dict:$('dictionaryStatus'),level:$('profileLevel'),best:$('bestScore'),bestWord:$('bestWord'),games:$('gamesPlayed'),unique:$('uniqueWords'),xp:$('careerXpLabel'),xpBar:$('careerXpBar'),cont:$('continueBtn'),contSummary:$('continueSummary'),round:$('roundLabel'),challenge:$('challengeLabel'),mode:$('modeLabel'),roundScore:$('roundScore'),target:$('targetScore'),progress:$('roundProgress'),boss:$('bossBadge'),plays:$('playsLeft'),shuffles:$('shufflesLeft'),rerolls:$('rerollsLeft'),mods:$('modifierList'),modCount:$('modifierCount'),upgrades:$('upgradeList'),upgradeCount:$('upgradeCount'),chTitle:$('challengeTitle'),chDesc:$('challengeDescription'),hint:$('wordHint'),preview:$('previewScore'),wordScore:$('wordScorePreview'),bonusScore:$('bonusScorePreview'),finalScore:$('finalScorePreview'),builder:$('wordBuilder'),combo:$('comboPreview'),board:$('board'),feedback:$('feedback'),total:$('totalScore'),words:$('wordsPlayed'),streak:$('streakValue'),runBest:$('runBestWord'),bestCombo:$('bestCombo'),reserve:$('reserveCount'),last:$('lastPlayCard'),goals:$('runGoalList'),backdrop:$('modalBackdrop'),reward:$('rewardModal'),rewardChoices:$('rewardChoices'),rewardRound:$('rewardRoundLabel'),rerollBtn:$('rerollRewardBtn'),skipReward:$('skipRewardBtn'),difficulty:$('difficultyModal'),info:$('infoModal'),infoTitle:$('infoTitle'),infoBody:$('infoBody'),pause:$('pauseModal'),collection:$('collectionModal'),collectionBody:$('collectionBody'),wordlog:$('wordLogModal'),wordlogList:$('wordLogList'),end:$('endModal'),endEye:$('endEyebrow'),endTitle:$('endTitle'),endStats:$('endStats'),newAchievements:$('newAchievements'),motion:$('reduceMotionToggle'),sound:$('soundToggle')};
let rewardOptions=[],dictionaryReady=false,activeUpgrade=null;
const fmt=n=>new Intl.NumberFormat('es-ES').format(Math.round(Number(n)||0));
function state(){return E.state}
function showFeedback(t,type=''){ui.feedback.textContent=t;ui.feedback.className=`feedback ${type}`;}
function currentWord(){return state().selected.map(x=>x.char).join('').toLowerCase();}
function showModal(m){ui.backdrop.classList.remove('hidden');[ui.reward,ui.difficulty,ui.info,ui.pause,ui.collection,ui.wordlog,ui.end].forEach(x=>x.classList.add('hidden'));m.classList.remove('hidden');}
function hideModal(){ui.backdrop.classList.add('hidden');[ui.reward,ui.difficulty,ui.info,ui.pause,ui.collection,ui.wordlog,ui.end].forEach(x=>x.classList.add('hidden'));}
function renderCareer(){const c=E.career,u=Object.keys(c.words).length,lvl=Math.floor(c.xp/250)+1,within=c.xp%250;ui.best.textContent=fmt(c.bestScore);ui.bestWord.textContent=c.bestWord?c.bestWord.toUpperCase():'—';ui.games.textContent=c.games;ui.unique.textContent=u;ui.level.textContent=`Nivel léxico ${lvl}`;ui.xp.textContent=`${within} / 250 XP`;ui.xpBar.style.width=`${within/250*100}%`;const r=E.loadRun();ui.cont.classList.toggle('hidden',!r);if(r)ui.contSummary.textContent=`Ronda ${r.round} · ${fmt(r.totalScore)} pts`;}
function render(){
  const s=state();if(!s)return;
  const ch=E.challenge(s.challenge),cfg=E.modeConfig(s.mode),sr=E.specialRound(s.specialRound);
  ui.game.dataset.challengeKind=sr?'special':(ch.kind||'normal');
  ui.game.dataset.challengeId=sr?.id||ch.id||'none';
  ui.game.dataset.mode=s.mode;
  document.documentElement.classList.toggle('reduce-motion',!!E.settings.reduceMotion);
  ui.mode.textContent=s.mode==='quick'?'PARTIDA RÁPIDA':s.mode==='daily'?'RETO DEL DÍA':cfg.name.toUpperCase()+' MODE';
  ui.round.textContent=s.mode==='quick'?'30 JUGADAS':'RONDA '+s.round+' / '+E.totalRounds(s.mode);
  ui.challenge.textContent=sr?sr.title:ch.title;
  ui.chTitle.textContent=sr?'Ronda especial · '+sr.title:ch.title;
  ui.chDesc.textContent=sr?sr.desc:ch.desc;
  ui.boss.classList.toggle('hidden',!sr);ui.boss.textContent=sr?'ESPECIAL':'';
  ui.roundScore.textContent=fmt(s.roundScore);ui.target.textContent=s.mode==='quick'?'∞':fmt(s.target);
  const cfgPlays=cfg.startPlays||10;
  ui.progress.style.width=s.mode==='quick'?Math.min(100,Math.max(0,(cfgPlays-s.playsLeft)/Math.max(1,cfgPlays)*100))+'%':Math.min(100,s.roundScore/Math.max(1,s.target)*100)+'%';
  ui.plays.textContent=Math.max(0,s.playsLeft);ui.shuffles.textContent=s.shufflesLeft;ui.rerolls.textContent=s.rerollsLeft;
  ui.total.textContent=fmt(s.totalScore);ui.words.textContent=s.words.length;ui.streak.textContent=s.validStreak;
  ui.runBest.textContent=s.bestPlay?s.bestPlay.word.toUpperCase():'—';
  ui.bestCombo.textContent='×'+Number(s.bestCombo||1).toFixed(s.bestCombo%1?2:0);ui.reserve.textContent=s.reserveTiles?.length||0;
  renderMods();renderUpgrades();renderBoard();renderWord();
  ui.goals.innerHTML=s.goals.map(g=>'<div class="goal-item '+(g.done?'done':'')+'"><span>'+(g.done?'✓':'○')+'</span><span>'+g.label+'</span></div>').join('');
  const auto=E.specialEffect()==='autoRefresh';$('shuffleBtn').disabled=auto?s.playsLeft<=0:s.shufflesLeft<=0;$('shuffleBtn').textContent=auto?'↻ Renovar · 1 jugada':'↻ Renovar';
}
function renderMods(){
  const s=state();ui.modCount.textContent=s.modifiers.length+'/6';
  if(!s.modifiers.length){ui.mods.className='modifier-list empty-list';ui.mods.innerHTML='<p>Aún no tienes modificadores.</p>';return;}
  const prices={common:1,uncommon:2,rare:3,epic:3,legendary:4};ui.mods.className='modifier-list';
  ui.mods.innerHTML=s.modifiers.map(id=>C.modifiers.find(x=>x.id===id)).filter(Boolean).map(m=>'<article class="modifier-card rarity-'+m.rarity+'"><strong><span>'+m.name+'</span><em class="rarity-tag">'+m.rarity+'</em></strong><span>'+m.desc+'</span><button class="sell-mod" type="button" data-sell="'+m.id+'">Vender · +'+(prices[m.rarity]||1)+' ↻</button></article>').join('');
  ui.mods.querySelectorAll('[data-sell]').forEach(b=>b.addEventListener('click',()=>{const n=E.sellModifier(b.dataset.sell);if(n){showFeedback('Modificador vendido · +'+n+' renovaciones','good');render();}}));
}
function renderUpgrades(){
  const s=state();ui.upgradeCount.textContent=s.upgrades.length+'/3';
  if(!s.upgrades.length){ui.upgrades.className='upgrade-list empty-list';ui.upgrades.innerHTML='<p>Elige una Mejora al superar rondas.</p>';return;}
  ui.upgrades.className='upgrade-list';
  ui.upgrades.innerHTML=s.upgrades.map(o=>{const u=C.upgrades.find(x=>x.id===o.id);return u?'<button type="button" class="upgrade-card rarity-'+u.rarity+' '+(activeUpgrade===o.id?'active':'')+'" data-upgrade="'+o.id+'"><strong>'+u.name+'<em>×'+o.uses+'</em></strong><span>'+u.desc+'</span></button>':'';}).join('');
  ui.upgrades.querySelectorAll('[data-upgrade]').forEach(b=>b.addEventListener('click',()=>{activeUpgrade=activeUpgrade===b.dataset.upgrade?null:b.dataset.upgrade;showFeedback(activeUpgrade?'Selecciona una ficha para aplicar la mejora.':'Mejora deseleccionada.','');renderUpgrades();renderBoard();}));
}
function tileLocked(t){const s=state(),effect=E.specialEffect();return effect==='topLocked'&&s.roundWords<4&&(s.specialData.lockedIds||[]).includes(t.id);}
function renderBoard(){
  const s=state();ui.board.innerHTML='';const highlighted=s.specialData?.highlightedId;
  for(const t of s.board){
    const b=document.createElement('button');b.type='button';const locked=tileLocked(t);
    b.className='tile '+t.kind+' '+(s.selected.some(x=>x.id===t.id)?'selected ':'')+(locked?'locked ':'')+(highlighted===t.id?'highlighted ':'')+(activeUpgrade?'upgrade-target':'');
    b.dataset.value=E.tileScore(t);b.dataset.bonus=t.bonus||0;b.dataset.kind=t.kind;b.textContent=t.kind==='wild'?'★':t.letter;if(locked)b.disabled=true;
    b.addEventListener('click',()=>activeUpgrade?applyUpgrade(t.id):selectTile(t.id));ui.board.appendChild(b);
  }
}
function applyUpgrade(tileId){
  if(!activeUpgrade)return;state().selected=[];const res=E.useUpgrade(activeUpgrade,tileId);
  if(res.ok){showFeedback(res.message,'good');if(!state().upgrades.some(x=>x.id===activeUpgrade))activeUpgrade=null;}else showFeedback(res.message,'warn');render();
}
function selectTile(id,forcedChar=null){const s=state(),t=s.board.find(x=>x.id===id);if(!t||tileLocked(t)||s.selected.some(x=>x.id===id))return;s.selected.push({id:t.id,char:forcedChar||(t.kind==='wild'?'A':t.letter)});renderBoard();renderWord();}
function cycleWild(current){const alpha='ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';const i=alpha.indexOf(String(current||'A').toUpperCase());return alpha[(i+1)%alpha.length];}
function renderWord(){
  const s=state(),w=currentWord(),maxSlots=C.wordLengthSlots.length;ui.builder.innerHTML='';
  for(let i=0;i<maxSlots;i++){
    const selected=s.selected[i],bonus=E.slotBonusAt(i),el=document.createElement(selected?'button':'div');
    if(selected){
      const t=s.board.find(q=>q.id===selected.id);el.type='button';el.className='word-slot filled '+(t?.kind||'normal');
      el.innerHTML='<span class="slot-bonus">'+(bonus?'+'+bonus:'')+'</span><strong>'+selected.char+'</strong><small>'+E.tileScore(t)+'</small>';
      el.addEventListener('click',()=>{if(t?.kind==='wild'){selected.char=cycleWild(selected.char);renderWord();return;}const base=E.strip(selected.char).toUpperCase(),cycle=E.ACCENTABLE[base];if(cycle){const j=cycle.indexOf(selected.char.toUpperCase());selected.char=cycle[(j+1)%cycle.length];renderWord();}else{s.selected.splice(i,1);renderBoard();renderWord();}});
    }else{el.className='word-slot empty '+(bonus?'bonus':'');el.innerHTML='<span class="slot-bonus">'+(bonus?'+'+bonus:'')+'</span><strong>'+(i+1)+'</strong>';}
    ui.builder.appendChild(el);
  }
  if(!w){ui.hint.textContent='Selecciona fichas para formar una palabra';ui.preview.textContent='0 pts';ui.wordScore.textContent='0';ui.bonusScore.textContent='0';ui.finalScore.textContent='0';ui.combo.innerHTML='';return;}
  ui.hint.textContent='4 letras mínimo · pulsa vocal para tilde · ★ para cambiar comodín';
  const tiles=s.selected.map(x=>s.board.find(t=>t.id===x.id)).filter(Boolean),sc=E.score(w,tiles,true);ui.preview.textContent=fmt(sc.total)+' pts';ui.wordScore.textContent=fmt(sc.wordScore);ui.bonusScore.textContent=fmt(sc.bonusPoints);ui.finalScore.textContent=fmt(sc.total);
  ui.combo.innerHTML=sc.effects.slice(0,6).map(e=>'<span class="combo-chip">'+e+'</span>').join('');
}
function play(){
  const s=state(),tiles=s.selected.map(x=>s.board.find(t=>t.id===x.id)).filter(Boolean),result=E.play(currentWord(),tiles);
  if(!result.ok){showFeedback(result.message,result.accent?'warn':'bad');render();return;}
  s.selected=[];activeUpgrade=null;
  const costText=result.penalty?' · -'+(result.playCost+result.penalty)+' jugadas':result.playCost>1?' · -'+result.playCost+' jugadas':'';
  showFeedback(result.word.toUpperCase()+' · +'+fmt(result.score.total)+' puntos'+costText,'good');
  ui.last.className='last-play-card';
  ui.last.innerHTML='<div class="played-word">'+result.word.toUpperCase()+'</div><div class="score-mini"><span>WORD <b>'+fmt(result.score.wordScore)+'</b></span><span>BONUS <b>+'+fmt(result.score.bonusPoints)+'</b></span><span>FINAL <b>'+fmt(result.score.total)+'</b></span></div><div class="effect-list">'+(result.score.effects.length?result.score.effects.map(e=>'<span>• '+e+'</span>').join(''):'<span>Sin efectos adicionales</span>')+'</div>';
  E.achievements();render();
  if(s.mode==='quick'&&s.playsLeft<=0)return setTimeout(()=>finish(true),220);
  if(s.mode!=='quick'&&s.roundScore>=s.target)return setTimeout(openReward,220);
  if(s.mode!=='quick'&&s.playsLeft<=0)setTimeout(()=>finish(false),220);
}
function openReward(){
  rewardOptions=E.rewards();renderRewards();$('rewardTitle').textContent=state().specialRound?'Recompensa especial':'Elige una recompensa';
  ui.reward.classList.toggle('boss-loot',!!state().specialRound);ui.rewardRound.textContent='Ronda '+state().round+' · '+fmt(state().roundScore)+' pts';ui.rerollBtn.disabled=state().rerollsLeft<=0;showModal(ui.reward);
}
function rewardType(r){return r.type==='modifier'?'MODIFICADOR':r.type==='upgrade'?'MEJORA':r.type==='bagTile'?'OBSEQUIO':r.type==='tile'?'FICHA':'RECURSO';}
function renderRewards(){
  ui.rewardChoices.innerHTML=rewardOptions.map(r=>'<button class="reward-card rarity-'+r.rarity+'" data-id="'+r.id+'" type="button"><span class="reward-type">'+rewardType(r)+' · '+r.rarity+'</span><h3>'+r.name+'</h3><p>'+r.desc+'</p><div class="reward-footer"><span>'+(r.type==='upgrade'?r.uses+' usos':r.type==='modifier'?state().modifiers.length+'/6 modificadores':r.type==='bagTile'?'Va a la reserva especial':'Mejora de partida')+'</span><strong>Elegir →</strong></div></button>').join('');
  ui.rewardChoices.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>choose(rewardOptions.find(r=>r.id===b.dataset.id))));
}
function afterReward(){
  hideModal();if(!E.nextRound())return finish(true);render();const sr=E.specialRound(state().specialRound),ch=E.challenge(state().challenge);
  showFeedback(sr?'¡Ronda especial! '+sr.title:ch.kind==='constraint'?'Regla activa: '+ch.title:'Nueva ronda. Construye una palabra potente.','good');
}
function choose(r){if(!E.chooseReward(r)){showFeedback('No puedes llevar más de ese tipo.','warn');return;}afterReward();}
function reroll(){if(state().rerollsLeft<=0)return;state().rerollsLeft--;rewardOptions=E.rewards();renderRewards();ui.rerollBtn.disabled=state().rerollsLeft<=0;E.saveRun();render();}
function skipReward(){const n=E.skipReward();showFeedback('Pasas la recompensa · +'+n+' renovaciones','good');afterReward();}
function start(mode){if(!dictionaryReady){showFeedback('Espera un instante: estoy preparando el diccionario.','warn');return;}hideModal();E.state=E.newState(mode);ui.menu.classList.add('hidden');ui.game.classList.remove('hidden');render();E.saveRun();if(E.career.games===0)howTo(true);}
function resumeRun(){if(!dictionaryReady)return;const r=E.loadRun();if(!r)return;E.state=r;ui.menu.classList.add('hidden');ui.game.classList.remove('hidden');render();}
function finish(won){
  const out=E.finish(won),s=state();ui.endEye.textContent=won?'PARTIDA COMPLETADA':'FIN DE PARTIDA';ui.endTitle.textContent=won?'¡Estrategia completada!':'Tu partida';
  const stats=[['Puntuación',fmt(s.totalScore)],['Ronda',s.mode==='quick'?'Rápida':s.round+'/'+E.totalRounds(s.mode)],['Palabras',s.words.length],['Más larga',s.longestWord||'—'],['Mejor jugada',s.bestPlay?s.bestPlay.word+' · '+fmt(s.bestPlay.score):'—'],['XP léxico','+'+out.xp]];
  ui.endStats.innerHTML=stats.map(([a,b])=>'<article><span>'+a+'</span><strong>'+b+'</strong></article>').join('');
  ui.newAchievements.classList.toggle('hidden',!out.got.length);if(out.got.length)ui.newAchievements.innerHTML='<strong>🏆 Nuevos logros</strong><div>'+out.got.map(a=>a.name).join(' · ')+'</div>';showModal(ui.end);renderCareer();
}
function collection(tab='cards'){document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));const c=E.career;if(tab==='cards')ui.collectionBody.innerHTML=[...C.modifiers,...C.upgrades,...C.gifts].map(x=>`<article class="collection-card rarity-${x.rarity} ${c.cards[x.id]?'':'locked'}"><strong>${c.cards[x.id]?x.name:'???'}</strong><span>${c.cards[x.id]?x.desc:`${x.rarity} · aún no descubierta`}</span></article>`).join('');else if(tab==='achievements')ui.collectionBody.innerHTML=C.achievements.map(a=>`<article class="collection-card ${c.achievements[a.id]?'':'locked'}"><strong>${c.achievements[a.id]?'🏆':'○'} ${a.name}</strong><span>${a.desc}</span></article>`).join('');else{const words=Object.entries(c.words).sort((a,b)=>b[1]-a[1]);ui.collectionBody.innerHTML=words.map(([w,n])=>`<article class="collection-card"><strong>${w.toUpperCase()}</strong><span>Usada ${n} ${n===1?'vez':'veces'}</span></article>`).join('')||'<article class="collection-card"><strong>Aún vacío</strong><span>Juega palabras para llenar tu archivo.</span></article>';}}
function showCollection(tab){collection(tab);showModal(ui.collection);}
function howTo(first=false){
  ui.infoTitle.textContent=first?'Primera partida':'Cómo se juega';
  ui.infoBody.innerHTML='<div class="info-step"><strong>1 · Forma palabras de 4+ fichas</strong><br>El valor de las letras crea el <b>Word Score</b>.</div><div class="info-step"><strong>2 · Las ranuras largas dan Bonus</strong><br>Las cuatro primeras no suman bonus; desde la quinta aparecen +5, +10, +15…</div><div class="info-step"><strong>3 · Word + Bonus = Final</strong><br>Los Modificadores y fichas especiales pueden multiplicar Word Score o Final Score.</div><div class="info-step"><strong>4 · Renovaciones</strong><br>Renuevan el tablero. Las fichas especiales viven en una reserva y pueden volver a aparecer.</div><div class="info-step"><strong>5 · Construye tu run</strong><br>Hasta 6 Modificadores permanentes y 3 Mejoras consumibles. También hay Obsequios que añaden fichas especiales.</div><div class="info-step"><strong>6 · Rondas especiales</strong><br>Cambian las reglas: primera letra sellada, vocales a cero, 2 jugadas por palabra, tablero inestable…</div><div class="info-step"><strong>7 · Español completo</strong><br>Se aceptan conjugaciones y derivaciones válidas; pulsa una vocal seleccionada para cambiar su tilde.</div>';showModal(ui.info);
}
function wordLog(){ui.wordlogList.innerHTML=state().wordLog.slice().reverse().map(x=>'<div class="word-log-entry"><strong>'+x.word.toUpperCase()+'</strong><span>W '+fmt(x.wordScore||0)+' · B +'+fmt(x.bonusPoints||0)+' · '+fmt(x.score)+' pts</span></div>').join('')||'<p class="empty-list">Aún no has jugado ninguna palabra.</p>';showModal(ui.wordlog);}
function menu(){hideModal();ui.game.classList.add('hidden');ui.menu.classList.remove('hidden');E.state=null;renderCareer();}
function wire(){
  $('newGameBtn').onclick=()=>showModal(ui.difficulty);
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>start(b.dataset.mode));$('closeDifficultyBtn').onclick=hideModal;
  $('quickGameBtn').onclick=()=>start('quick');$('dailyGameBtn').onclick=()=>start('daily');ui.cont.onclick=resumeRun;
  $('howToBtn').onclick=()=>howTo(false);$('helpBtn').onclick=()=>howTo(false);$('pauseBtn').onclick=()=>showModal(ui.pause);
  $('collectionBtn').onclick=()=>showCollection('cards');$('achievementsBtn').onclick=()=>showCollection('achievements');$('closeCollectionBtn').onclick=hideModal;$('closeWordLogBtn').onclick=hideModal;$('wordLogBtn').onclick=wordLog;$('closeInfoBtn').onclick=hideModal;$('resumeBtn').onclick=hideModal;
  $('saveExitBtn').onclick=()=>{E.saveRun();menu();};$('abandonBtn').onclick=()=>{E.clearRun();menu();};
  $('undoBtn').onclick=()=>{state().selected.pop();renderBoard();renderWord();};$('clearBtn').onclick=()=>{state().selected=[];renderBoard();renderWord();};$('submitBtn').onclick=play;
  $('shuffleBtn').onclick=()=>{if(E.shuffle()){showFeedback(E.specialEffect()==='autoRefresh'?'Tablero renovado · -1 jugada':'Tablero renovado.','good');render();}};
  ui.rerollBtn.onclick=reroll;ui.skipReward.onclick=skipReward;
  $('playAgainBtn').onclick=()=>{const m=state()?.mode||'normal';hideModal();start(m);};$('endMenuBtn').onclick=menu;
  document.querySelectorAll('.tab-btn').forEach(b=>b.onclick=()=>collection(b.dataset.tab));ui.motion.checked=E.settings.reduceMotion;ui.sound.checked=E.settings.sound;document.documentElement.classList.toggle('reduce-motion',!!E.settings.reduceMotion);
  ui.motion.onchange=()=>{E.settings.reduceMotion=ui.motion.checked;document.documentElement.classList.toggle('reduce-motion',!!E.settings.reduceMotion);E.saveSettings();window.WordPlayGameFeel?.syncMotionClass?.();};ui.sound.onchange=()=>{E.settings.sound=ui.sound.checked;E.saveSettings();};
  document.addEventListener('keydown',e=>{
    if(ui.game.classList.contains('hidden')||!state()||!ui.backdrop.classList.contains('hidden'))return;
    if(e.key==='Enter'){e.preventDefault();play();}else if(e.key==='Backspace'){e.preventDefault();state().selected.pop();renderBoard();renderWord();}else if(e.key==='Escape')showModal(ui.pause);
    else if(/^[a-zñ]$/i.test(e.key)){const key=e.key.toUpperCase();let t=state().board.find(t=>!state().selected.some(s=>s.id===t.id)&&!tileLocked(t)&&t.letter===key);if(!t)t=state().board.find(t=>!state().selected.some(s=>s.id===t.id)&&!tileLocked(t)&&t.kind==='wild');if(t)selectTile(t.id,key);}
  });
}
wire();
const launchButtons=[$('newGameBtn'),$('quickGameBtn'),$('dailyGameBtn'),ui.cont].filter(Boolean);
launchButtons.forEach(b=>b.disabled=true);
renderCareer();
E.loadDictionary(t=>ui.dict.textContent=t).finally(()=>{
  dictionaryReady=true;
  launchButtons.forEach(b=>b.disabled=false);
  renderCareer();
  ui.dict.textContent=ui.dict.textContent.replace('Preparando','Listo');
});
})();
