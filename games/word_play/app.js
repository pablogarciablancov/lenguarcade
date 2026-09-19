(() => {
'use strict';
const E=window.WordPlayEngine,C=E.C,$=id=>document.getElementById(id);
const ui={menu:$('menuScreen'),game:$('gameScreen'),dict:$('dictionaryStatus'),level:$('profileLevel'),best:$('bestScore'),bestWord:$('bestWord'),games:$('gamesPlayed'),unique:$('uniqueWords'),xp:$('careerXpLabel'),xpBar:$('careerXpBar'),cont:$('continueBtn'),contSummary:$('continueSummary'),round:$('roundLabel'),challenge:$('challengeLabel'),mode:$('modeLabel'),roundScore:$('roundScore'),target:$('targetScore'),progress:$('roundProgress'),boss:$('bossBadge'),plays:$('playsLeft'),shuffles:$('shufflesLeft'),rerolls:$('rerollsLeft'),mods:$('modifierList'),modCount:$('modifierCount'),upgrades:$('upgradeList'),upgradeCount:$('upgradeCount'),chTitle:$('challengeTitle'),chDesc:$('challengeDescription'),missionChip:$('missionChip'),hint:$('wordHint'),preview:$('previewScore'),wordScore:$('wordScorePreview'),bonusScore:$('bonusScorePreview'),finalScore:$('finalScorePreview'),builder:$('wordBuilder'),combo:$('comboPreview'),board:$('board'),feedback:$('feedback'),total:$('totalScore'),words:$('wordsPlayed'),streak:$('streakValue'),runBest:$('runBestWord'),bestCombo:$('bestCombo'),reserve:$('reserveCount'),last:$('lastPlayCard'),goals:$('runGoalList'),backdrop:$('modalBackdrop'),reward:$('rewardModal'),rewardChoices:$('rewardChoices'),rewardRound:$('rewardRoundLabel'),rerollBtn:$('rerollRewardBtn'),skipReward:$('skipRewardBtn'),difficulty:$('difficultyModal'),info:$('infoModal'),infoTitle:$('infoTitle'),infoBody:$('infoBody'),pause:$('pauseModal'),collection:$('collectionModal'),collectionBody:$('collectionBody'),wordlog:$('wordLogModal'),wordlogList:$('wordLogList'),end:$('endModal'),endEye:$('endEyebrow'),endTitle:$('endTitle'),endStats:$('endStats'),buildSummary:$('buildSummary'),newAchievements:$('newAchievements'),motion:$('reduceMotionToggle'),sound:$('soundToggle'),classroom:$('classroomModeToggle'),coinWallet:$('coinWallet'),coinValue:$('coinValue'),shopBtn:$('shopBtn'),shop:$('shopModal'),shopCoins:$('shopCoins'),shopGrid:$('shopGrid'),shopMessage:$('shopMessage'),letterPicker:$('letterPicker'),letterGrid:$('letterGrid'),cancelLetter:$('cancelLetterBtn'),inkWallet:$('inkWallet'),inkValue:$('inkValue'),tintaBtn:$('tintaVivaBtn'),tintaCharges:$('tintaCharges')};
let rewardOptions=[],dictionaryReady=false,activeUpgrade=null;
const fmt=n=>new Intl.NumberFormat('es-ES').format(Math.round(Number(n)||0));
const escAttr=v=>String(v??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function specialKind(item){
  const effectMap={makeGold:'gold',makeEmerald:'emerald',makeDot:'dot',makeDiamond:'diamond',makeWild:'wild'};
  if(item?.tileKind)return item.tileKind;
  if(effectMap[item?.effect])return effectMap[item.effect];
  if(C.specialTileTypes?.[item?.effect])return item.effect;
  return null;
}
function specialHelp(kind){
  const def=C.specialTileTypes?.[kind];
  return def?.desc?(def.name+': '+def.desc):'';
}
function itemTip(item){
  if(!item)return'';
  const kind=specialKind(item),extra=kind?specialHelp(kind):'';
  const desc=String(item.desc||'');
  return [item.name?item.name+'.':'',desc,extra&&!desc.includes(extra.split(':')[0])?extra:''].filter(Boolean).join(' ');
}
function tileTip(t){
  if(!t)return'';
  const value=E.tileScore(t),points=value===1?'punto':'puntos';
  const base=(t.kind==='wild'?'Comodín':t.letter)+' · '+value+' '+points+'.';
  const extra=t.kind&&t.kind!=='normal'?specialHelp(t.kind):'Ficha normal: su valor se suma al Word Score.';
  return base+' '+extra;
}
function setTip(el,text){if(el&&text)el.dataset.tip=text;}
function installStaticTips(){
  setTip(ui.plays?.closest('article'),'Jugadas: cada palabra válida consume normalmente 1. Si llegas a 0 antes de alcanzar el objetivo, termina la run.');
  setTip(ui.shuffles?.closest('article'),'Renovaciones: cambian el tablero completo. No cuentan como palabra ni gastan una Jugada, salvo reglas especiales.');
  setTip(ui.rerolls?.closest('article'),'Rerolls de recompensa: al superar una ronda puedes gastar 1 para descartar las 3 cartas ofrecidas y recibir 3 nuevas.');
  setTip(ui.coinWallet,'Monedas: las ganas formando palabras y superando rondas. Se gastan en la Tienda durante esta run.');
  setTip(ui.inkWallet,'Tinta: recurso separado de las Monedas. Sirve para comprar nuevas cargas de Tinta Viva.');
  setTip(ui.shopBtn,'Tienda: compra Jugadas, Renovaciones, rerolls, letras, fichas especiales y Mejoras con Monedas.');
  setTip($('shuffleBtn'),'Renovar: sustituye el tablero por otro jugable y consume 1 Renovación.');
  setTip($('wordLogBtn'),'Historial: revisa las palabras jugadas, su puntuación y las Monedas obtenidas.');
  setTip($('undoBtn'),'Deshacer: quita la última ficha de la palabra actual.');
  setTip($('clearBtn'),'Limpiar: devuelve todas las fichas seleccionadas al tablero.');
  setTip($('submitBtn'),'Jugar palabra: valida la palabra, calcula puntos y consume una Jugada si es válida.');
  setTip(ui.roundScore?.closest('.score-block'),'Puntuación de ronda: alcanza el objetivo indicado para superar la ronda.');
  setTip(ui.rerollBtn,'Cambiar opciones: gasta 1 reroll para sustituir las 3 cartas de recompensa por 3 nuevas.');
  setTip(ui.skipReward,'Pasar: renuncias a elegir una carta y recibes +2 Renovaciones.');
  setTip($('helpBtn'),'Ayuda: resumen de las reglas, recursos y sistemas de la partida.');
  setTip($('pauseBtn'),'Menú de pausa: guarda, abandona o cambia opciones de accesibilidad.');
  setTip($('challengeBanner'),'Regla de la ronda: esta condición modifica qué palabras valen o cómo puntúan.');

}
function initTooltips(){
  const tip=document.createElement('div');tip.className='hover-tooltip';tip.setAttribute('role','tooltip');document.body.appendChild(tip);
  let active=null;
  const show=el=>{
    if(!el?.dataset?.tip)return;
    active=el;tip.textContent=el.dataset.tip;tip.classList.add('visible');
    const r=el.getBoundingClientRect(),tr=tip.getBoundingClientRect();
    let left=Math.min(window.innerWidth-tr.width-8,Math.max(8,r.left+r.width/2-tr.width/2));
    let top=r.top-tr.height-10;
    if(top<8)top=Math.min(window.innerHeight-tr.height-8,r.bottom+10);
    tip.style.left=left+'px';tip.style.top=top+'px';
  };
  const hide=el=>{if(!el||active===el){active=null;tip.classList.remove('visible');}};
  document.addEventListener('pointerover',e=>{const el=e.target.closest?.('[data-tip]');if(el&&el!==active)show(el);});
  document.addEventListener('pointerout',e=>{const el=e.target.closest?.('[data-tip]');if(el&&!el.contains(e.relatedTarget))hide(el);});
  document.addEventListener('focusin',e=>{const el=e.target.closest?.('[data-tip]');if(el)show(el);});
  document.addEventListener('focusout',e=>{const el=e.target.closest?.('[data-tip]');if(el)hide(el);});
  window.addEventListener('resize',()=>hide());
}
function state(){return E.state}
const COACH_KEY='lenguarcade.wordplay.coach.v1';
let coachFlags=(()=>{try{return JSON.parse(localStorage.getItem(COACH_KEY)||'{}')}catch{return{}}})();
function showCoach(key,title,text){
  if(coachFlags[key]||E.settings.reduceMotion)return;
  coachFlags[key]=true;try{localStorage.setItem(COACH_KEY,JSON.stringify(coachFlags));}catch{}
  let el=document.getElementById('coachMark');
  if(!el){el=document.createElement('aside');el.id='coachMark';el.className='coach-mark';document.body.appendChild(el);}
  el.innerHTML='<button type="button" aria-label="Cerrar">×</button><span>'+title+'</span><p>'+text+'</p>';
  el.classList.add('visible');
  const close=()=>el.classList.remove('visible');el.querySelector('button').onclick=close;
  clearTimeout(showCoach.timer);showCoach.timer=setTimeout(close,6500);
}
function activeSynergies(run=state()){
  const owned=new Set(run?.modifiers||[]);
  return (C.synergies||[]).filter(syn=>syn.members.filter(id=>owned.has(id)).length>=Number(syn.min||2));
}
function tileStateLabel(t){
  if(!t)return'';
  if(t.kind==='diamond'&&Number(t.charge||0)>0)return'+'+Number(t.charge||0);
  if(t.kind==='ink'&&Number(t.bonus||0)>0)return'+'+Number(t.bonus||0);
  if(t.kind==='emerald')return'25%';
  if(t.kind==='dot')return'×2';
  if(t.kind==='echo')return'×2';
  if(t.kind==='volatile')return'×1,35';
  if(t.kind==='crown')return'+25';
  if(t.kind==='gold')return'2+';
  if(t.kind==='potion')return'+J';
  return'';
}
function flashModifierActivations(items=[]){
  for(const a of items){
    const el=ui.mods.querySelector('[data-mod-id="'+a.id+'"]');if(!el)continue;
    el.classList.remove('triggered');void el.offsetWidth;el.classList.add('triggered');
    setTimeout(()=>el.classList.remove('triggered'),900);
  }
}
function buildProfile(run){
  const syn=activeSynergies(run);
  if(syn.length)return{name:syn[0].name,desc:syn[0].desc,synergies:syn};
  if(Number(run.specialTilesUsed||0)>=5)return{name:'Alquimista de fichas',desc:'Has construido la run alrededor de fichas especiales.',synergies:[]};
  if((run.longestWord||'').length>=8)return{name:'Arquitecto de palabras largas',desc:'Tu partida ha destacado por construir palabras de gran longitud.',synergies:[]};
  if(Number(run.shopPurchases||0)>=4)return{name:'Mercader estratégico',desc:'Has usado la tienda como parte central de tu estrategia.',synergies:[]};
  if(Number(run.maxStreak||0)>=5)return{name:'Cadena de precisión',desc:'Has mantenido una racha larga de palabras válidas.',synergies:[]};
  return{name:'Constructor equilibrado',desc:'Una run versátil sin depender de una única estrategia.',synergies:[]};
}
function showFeedback(t,type=''){ui.feedback.textContent=t;ui.feedback.className=`feedback ${type}`;}
function syncSpecialChars(){const s=state();if(!s)return;s.selected.forEach((x,i)=>{const t=s.board.find(q=>q.id===x.id);if(t?.kind==='mirror'&&i>0)x.char=s.selected[i-1].char;if(t?.kind==='plus')x.char='+';if(t?.kind==='bang')x.char='!';});}
function sanitizeSelection(){
  const s=state();if(!s)return;
  const ids=new Set(s.board.map(t=>t.id));
  s.selected=s.selected.filter(x=>ids.has(x.id));
}
function currentWord(){sanitizeSelection();syncSpecialChars();return state().selected.map(x=>x.char).join('').toLowerCase();}
function showModal(m){ui.backdrop.classList.remove('hidden');[ui.reward,ui.shop,ui.difficulty,ui.info,ui.pause,ui.collection,ui.wordlog,ui.end].forEach(x=>x.classList.add('hidden'));m.classList.remove('hidden');}
function hideModal(){ui.backdrop.classList.add('hidden');[ui.reward,ui.shop,ui.difficulty,ui.info,ui.pause,ui.collection,ui.wordlog,ui.end].forEach(x=>x.classList.add('hidden'));}
function renderCareer(){const c=E.career,u=Object.keys(c.words).length,lvl=Math.floor(c.xp/250)+1,within=c.xp%250;ui.best.textContent=fmt(c.bestScore);ui.bestWord.textContent=c.bestWord?c.bestWord.toUpperCase():'—';ui.games.textContent=c.games;ui.unique.textContent=u;ui.level.textContent=`Nivel léxico ${lvl}`;ui.xp.textContent=`${within} / 250 XP`;ui.xpBar.style.width=`${within/250*100}%`;const r=E.loadRun();ui.cont.classList.toggle('hidden',!r);if(r)ui.contSummary.textContent=`Ronda ${r.round} · ${fmt(r.totalScore)} pts`;}
function render(){
  const s=state();if(!s)return;
  const ch=E.challenge(s.challenge),cfg=E.modeConfig(s.mode),sr=E.specialRound(s.specialRound);
  ui.game.dataset.challengeKind=sr?'special':(ch.kind||'normal');
  ui.game.dataset.challengeId=sr?.id||ch.id||'none';
  ui.game.dataset.mode=s.mode;ui.game.dataset.roundTone=String(((Number(s.round||1)-1)%4)+1);
  document.documentElement.classList.toggle('reduce-motion',!!E.settings.reduceMotion);
  ui.mode.textContent=s.mode==='quick'?'PARTIDA RÁPIDA':s.mode==='daily'?'RETO DEL DÍA':cfg.name.toUpperCase()+' MODE';
  ui.round.textContent=s.mode==='quick'?'30 JUGADAS':'RONDA '+s.round+' / '+E.totalRounds(s.mode);
  ui.challenge.textContent=sr?sr.title:ch.title;
  ui.chTitle.textContent=sr?'Ronda especial · '+sr.title:ch.title;
  ui.chDesc.textContent=sr?sr.desc:ch.desc;
  const mission=s.mission;
  ui.missionChip.classList.toggle('hidden',!mission);
  if(mission){
    ui.missionChip.classList.toggle('done',!!s.missionDone);
    ui.missionChip.textContent=s.missionDone?'✓ '+mission.name:'MISIÓN · '+mission.name+' · +'+mission.reward+' ◉';
    ui.missionChip.dataset.tip=mission.desc+(s.missionDone?' Completada.':' Recompensa: +'+mission.reward+' Monedas.');
  }
  ui.boss.classList.toggle('hidden',!sr);ui.boss.textContent=sr?'ESPECIAL':'';
  ui.roundScore.textContent=fmt(s.roundScore);ui.target.textContent=s.mode==='quick'?'∞':fmt(s.target);
  const cfgPlays=cfg.startPlays||10;
  ui.progress.style.width=s.mode==='quick'?Math.min(100,Math.max(0,(cfgPlays-s.playsLeft)/Math.max(1,cfgPlays)*100))+'%':Math.min(100,s.roundScore/Math.max(1,s.target)*100)+'%';
  ui.plays.textContent=Math.max(0,s.playsLeft);ui.shuffles.textContent=s.shufflesLeft;ui.rerolls.textContent=s.rerollsLeft;
  ui.total.textContent=fmt(s.totalScore);ui.words.textContent=s.words.length;ui.streak.textContent=s.validStreak;
  ui.runBest.textContent=s.bestPlay?s.bestPlay.word.toUpperCase():'—';
  ui.bestCombo.textContent='×'+Number(s.bestCombo||1).toFixed(s.bestCombo%1?2:0);ui.reserve.textContent=s.reserveTiles?.length||0;
  ui.coinValue.textContent=Number(s.coins||0);ui.inkValue.textContent=Number(s.ink||0);
  ui.tintaCharges.textContent='×'+Number(s.tintaCharges||0);
  const canBuy=Number(s.tintaCharges||0)<=0&&Number(s.ink||0)>=3;
  ui.tintaBtn.classList.toggle('can-buy',canBuy);
  ui.tintaBtn.classList.toggle('empty',Number(s.tintaCharges||0)<=0&&!canBuy);
  ui.tintaBtn.title=Number(s.tintaCharges||0)>0?'Muta 6 fichas sin gastar recursos':canBuy?'Compra 1 carga por 3 Tintas':'Necesitas 3 Tintas para comprar otra carga';ui.tintaBtn.dataset.tip=ui.tintaBtn.title;
  renderMods();renderUpgrades();renderBoard();renderWord();
  ui.goals.innerHTML=s.goals.map(g=>'<div class="goal-item '+(g.done?'done':'')+'"><span>'+(g.done?'✓':'○')+'</span><span>'+g.label+'</span></div>').join('');
  const auto=E.specialEffect()==='autoRefresh';$('shuffleBtn').disabled=auto?s.playsLeft<=0:s.shufflesLeft<=0;$('shuffleBtn').textContent=auto?'↻ Renovar · 1 jugada':'↻ Renovar';
}
function renderMods(){
  const s=state();ui.modCount.textContent=s.modifiers.length+'/6';
  if(!s.modifiers.length){ui.mods.className='modifier-list empty-list';ui.mods.innerHTML='<p>Aún no tienes modificadores.</p>';return;}
  const prices={common:1,uncommon:2,rare:3,epic:3,legendary:4};ui.mods.className='modifier-list';
  const synergies=activeSynergies(s);
  const synergyHtml=synergies.length?'<div class="synergy-strip">'+synergies.map(x=>'<span data-tip="'+escAttr(x.desc)+'">SINERGIA · '+x.name+'</span>').join('')+'</div>':'';
  ui.mods.innerHTML=synergyHtml+s.modifiers.map(id=>C.modifiers.find(x=>x.id===id)).filter(Boolean).map(m=>'<article class="modifier-card rarity-'+m.rarity+'" data-mod-id="'+m.id+'" data-tip="'+escAttr(itemTip(m))+'"><strong><span>'+m.name+'</span><em class="rarity-tag">'+m.rarity+'</em></strong><span>'+m.desc+'</span><button class="sell-mod" type="button" data-sell="'+m.id+'">Vender · +'+(prices[m.rarity]||1)+' ↻</button></article>').join('');
  ui.mods.querySelectorAll('[data-sell]').forEach(b=>b.addEventListener('click',()=>{const n=E.sellModifier(b.dataset.sell);if(n){showFeedback('Modificador vendido · +'+n+' renovaciones','good');render();}}));
}
function renderUpgrades(){
  const s=state();ui.upgradeCount.textContent=s.upgrades.length+'/3';
  if(!s.upgrades.length){ui.upgrades.className='upgrade-list empty-list';ui.upgrades.innerHTML='<p>Elige una Mejora al superar rondas.</p>';return;}
  ui.upgrades.className='upgrade-list';
  ui.upgrades.innerHTML=s.upgrades.map(o=>{const u=C.upgrades.find(x=>x.id===o.id);return u?'<button type="button" class="upgrade-card rarity-'+u.rarity+' '+(activeUpgrade===o.id?'active':'')+'" data-upgrade="'+o.id+'" data-tip="'+escAttr(itemTip(u))+'"><strong>'+u.name+'<em>×'+o.uses+'</em></strong><span>'+u.desc+'</span></button>':'';}).join('');
  ui.upgrades.querySelectorAll('[data-upgrade]').forEach(b=>b.addEventListener('click',()=>{activeUpgrade=activeUpgrade===b.dataset.upgrade?null:b.dataset.upgrade;showFeedback(activeUpgrade?'Selecciona una ficha para aplicar la mejora.':'Mejora deseleccionada.','');renderUpgrades();renderBoard();}));
}
function tileLocked(t){const s=state(),effect=E.specialEffect();return effect==='topLocked'&&s.roundWords<4&&(s.specialData.lockedIds||[]).includes(t.id);}
function valueClass(t){
  if(!t||t.kind!=='normal')return'';
  const v=Math.max(0,Number(E.tileScore(t)||0));
  if(v<=1)return'value-1';
  if(v===2)return'value-2';
  if(v===3)return'value-3';
  if(v===4)return'value-4';
  if(v===5)return'value-5';
  if(v<=8)return'value-6';
  return'value-9';
}
function renderBoard(){
  const s=state();ui.board.innerHTML='';const highlighted=s.specialData?.highlightedId;const selectedGold=s.selected.filter(x=>s.board.find(t=>t.id===x.id)?.kind==='gold').length;
  for(const t of s.board){
    const b=document.createElement('button');b.type='button';const locked=tileLocked(t);
    b.className='tile '+t.kind+' '+valueClass(t)+' '+(s.selected.some(x=>x.id===t.id)?'selected ':'')+(locked?'locked ':'')+(highlighted===t.id?'highlighted ':'')+(activeUpgrade?'upgrade-target ':'')+(t.kind==='diamond'&&Number(t.charge||0)>0?'charged ':'')+(t.kind==='gold'&&selectedGold===1&&!s.selected.some(x=>x.id===t.id)?'gold-ready ':'');
    b.dataset.value=E.tileScore(t);b.dataset.bonus=t.bonus||0;b.dataset.kind=t.kind;b.dataset.tip=tileTip(t);const glyph={wild:'★',mirror:'◀',bang:'!',plus:'+'}[t.kind],stateLabel=tileStateLabel(t);b.innerHTML='<span class="tile-letter">'+(glyph||t.letter)+'</span><span class="tile-points">'+E.tileScore(t)+'</span>'+(stateLabel?'<span class="tile-state">'+stateLabel+'</span>':'');if(locked)b.disabled=true;
    b.addEventListener('click',()=>activeUpgrade?applyUpgrade(t.id):selectTile(t.id));ui.board.appendChild(b);
  }
  if(s.board.some(t=>t.kind&&t.kind!=='normal'))setTimeout(()=>showCoach('special','Tu primera ficha especial','Las fichas especiales cambian las reglas de puntuación. Pasa el ratón por encima para ver exactamente qué hace cada una.'),120);
}
function applyUpgrade(tileId){
  if(!activeUpgrade)return;
  const upgradeId=activeUpgrade;
  state().selected=[];
  const res=E.useUpgrade(upgradeId,tileId);
  if(res.ok){
    activeUpgrade=null;
    showFeedback(res.rescue?.rescued?'Mejora aplicada · el tablero se ha reajustado para mantenerlo jugable.':res.message,'good');
  }else showFeedback(res.message,'warn');
  render();
}
function selectTile(id,forcedChar=null){const s=state(),t=s.board.find(x=>x.id===id);if(!t||tileLocked(t)||s.selected.some(x=>x.id===id))return;if(t.kind==='mirror'&&!s.selected.length){showFeedback('El Espejo necesita una ficha a su izquierda.','warn');return;}const specialChar=t.kind==='wild'?'A':t.kind==='mirror'?s.selected.at(-1)?.char||'A':t.kind==='plus'?'+':t.kind==='bang'?'!':t.letter;s.selected.push({id:t.id,char:forcedChar||specialChar});renderBoard();renderWord();}
function cycleWild(current){const alpha='ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';const i=alpha.indexOf(String(current||'A').toUpperCase());return alpha[(i+1)%alpha.length];}
function renderWord(){
  const s=state(),w=currentWord(),maxSlots=C.wordLengthSlots.length;ui.builder.innerHTML='';ui.builder.classList.toggle('gold-combo',s.selected.filter(x=>s.board.find(t=>t.id===x.id)?.kind==='gold').length>=2);
  for(let i=0;i<maxSlots;i++){
    const selected=s.selected[i],bonus=E.slotBonusAt(i),el=document.createElement(selected?'button':'div');
    if(selected){
      const t=s.board.find(q=>q.id===selected.id);el.type='button';el.className='word-slot filled '+(t?.kind||'normal')+' '+valueClass(t);if(t)el.dataset.tip=tileTip(t);
      el.innerHTML='<span class="slot-bonus">'+(bonus?'+'+bonus:'')+'</span><strong>'+selected.char+'</strong><small>'+E.tileScore(t)+'</small>';
      el.addEventListener('click',()=>{if(t?.kind==='wild'){selected.char=cycleWild(selected.char);renderWord();return;}if(['mirror','plus','bang'].includes(t?.kind)){s.selected.splice(i,1);renderBoard();renderWord();return;}const base=E.strip(selected.char).toUpperCase(),cycle=E.ACCENTABLE[base];if(cycle){const j=cycle.indexOf(selected.char.toUpperCase());selected.char=cycle[(j+1)%cycle.length];renderWord();}else{s.selected.splice(i,1);renderBoard();renderWord();}});
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
  const missionText=result.missionCompleted?' · MISIÓN +'+result.missionGain+' Monedas':'';showFeedback(result.rescue?.rescued?result.word.toUpperCase()+' · +'+fmt(result.score.total)+' · Tinta de rescate activada'+missionText:result.word.toUpperCase()+' · +'+fmt(result.score.total)+' puntos · +'+result.coinGain+' Moneda'+(result.coinGain===1?'':'s')+costText+missionText,'good');
  window.WordPlayGameFeel?.scoreWord?.({word:result.word,tilePoints:result.score.tilePoints,wordScore:result.score.wordScore,bonusPoints:result.score.bonusPoints,wordMultiplier:result.score.wordMultiplier,finalMultiplier:result.score.finalMultiplier,total:result.score.total,coins:result.coinGain});
  flashModifierActivations(result.score.triggeredModifiers||[]);
  window.WordPlayGameFeel?.activations?.({modifiers:result.score.triggeredModifiers||[],specialEvents:result.score.specialEvents||[],mission:result.missionCompleted});
  if(Number(s.coins||0)>=3)setTimeout(()=>showCoach('shop','Ya puedes comprar','Las Monedas se gastan en la Tienda. El stock cambia cada ronda y siempre hay una oferta.'),450);
  ui.last.className='last-play-card';
  ui.last.innerHTML='<div class="played-word">'+result.word.toUpperCase()+' <small>+'+result.coinGain+' moneda'+(result.coinGain===1?'':'s')+'</small></div><div class="score-mini"><span>WORD <b>'+fmt(result.score.wordScore)+'</b></span><span>BONUS <b>+'+fmt(result.score.bonusPoints)+'</b></span><span>FINAL <b>'+fmt(result.score.total)+'</b></span></div><div class="effect-list">'+(result.score.effects.length?result.score.effects.map(e=>'<span>• '+e+'</span>').join(''):'<span>Sin efectos adicionales</span>')+'</div>';
  E.achievements();render();
  if(s.mode==='quick'&&s.playsLeft<=0)return setTimeout(()=>finish(true),220);
  if(s.mode!=='quick'&&s.roundScore>=s.target)return setTimeout(openReward,220);
  if(s.mode!=='quick'&&s.playsLeft<=0)setTimeout(()=>finish(false),220);
}
function shopCard(offer){
  const item=offer.item,status=E.shopStatus(item.id),disabled=!status.ok,sold=!!offer.sold;
  const price=Number(offer.price??item.cost),sale=Number(offer.discount||0)>0;
  return '<button class="shop-card '+(disabled?'disabled ':'')+(sold?'sold ':'')+(sale?'on-sale':'')+'" data-shop="'+item.id+'" data-tip="'+escAttr(itemTip(item))+'" type="button" '+(disabled?'disabled':'')+'>'+
    (sale?'<span class="sale-badge">-'+offer.discount+'%</span>':'')+
    '<div class="shop-card-art">'+rewardArtSvg(item)+'</div>'+
    '<div class="shop-card-copy"><span class="shop-kind">'+(item.effect==='letter'?'LETRA':item.effect==='upgrade'?'MEJORA':'RECURSO')+'</span><strong>'+item.name+'</strong><p>'+item.desc+'</p></div>'+
    '<span class="shop-price"><i></i>'+(sale?'<del>'+item.cost+'</del>':'')+price+'</span>'+
    (sold?'<span class="sold-label">VENDIDO</span>':'')+
  '</button>';
}
function renderLetterPicker(){
  const alphabet='ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  ui.letterGrid.innerHTML=[...alphabet].map(letter=>'<button type="button" data-letter="'+letter+'" data-tip="Añade una '+letter+' a la reserva. Valor base: '+Number(E.LETTER_VALUES?.[letter]||1)+' puntos."><strong>'+letter+'</strong><span>'+Number(E.LETTER_VALUES?.[letter]||1)+' pts</span></button>').join('');
  ui.letterGrid.querySelectorAll('[data-letter]').forEach(b=>b.addEventListener('click',()=>buyShopLetter(b.dataset.letter)));
}
function renderShop(message=''){
  const st=state();if(!st)return;
  ui.shopCoins.textContent=Number(st.coins||0);
  ui.shopGrid.innerHTML=E.shopOffers().map(shopCard).join('');
  ui.shopGrid.querySelectorAll('[data-shop]').forEach(b=>b.addEventListener('click',()=>buyFromShop(b.dataset.shop)));
  if(message)ui.shopMessage.textContent=message;
}
function openShop(){
  ui.letterPicker.classList.add('hidden');renderLetterPicker();renderShop('Stock de la ronda '+state().round+' · cada artículo solo puede comprarse una vez.');showModal(ui.shop);
}
function buyFromShop(id){
  const item=C.shopItems.find(x=>x.id===id);if(!item)return;
  if(item.effect==='letter'){
    const status=E.shopStatus(id);
    if(!status.ok){renderShop(status.message);return;}
    ui.letterPicker.classList.remove('hidden');ui.shopMessage.textContent='Elige la letra que quieres añadir a tu reserva.';return;
  }
  const out=E.buyShopItem(id);
  if(out.ok){render();renderShop('Comprado: '+out.detail+'.');}
  else renderShop(out.message);
}
function buyShopLetter(letter){
  const out=E.buyShopItem('shop_letter',{letter});
  if(out.ok){ui.letterPicker.classList.add('hidden');render();renderShop('Comprado: '+out.detail+'.');}
  else renderShop(out.message);
}
function openReward(){
  rewardOptions=E.rewards();renderRewards();$('rewardTitle').textContent=state().specialRound?'Recompensa especial':'Elige una recompensa';
  ui.reward.classList.toggle('boss-loot',!!state().specialRound);ui.rewardRound.textContent='Ronda '+state().round+' · '+fmt(state().roundScore)+' pts';ui.rerollBtn.disabled=state().rerollsLeft<=0;showModal(ui.reward);setTimeout(()=>showCoach('rewards','Construye tu build','Elige una carta o usa un reroll para sustituir las tres. Las combinaciones de cartas pueden formar Sinergias visibles.'),250);
}
function rewardType(r){return r.type==='modifier'?'MODIFICADOR':r.type==='upgrade'?'MEJORA':r.type==='bagTile'?'OBSEQUIO':r.type==='tile'?'FICHA':'RECURSO';}
function rewardArt(r){
  if(r.artKey)return r.artKey;
  const effectMap={
    extraPlay:'art-play',instantPlay:'art-play',bossPlay:'art-play',
    extraShuffle:'art-refresh',instantShuffle:'art-refresh',reroll:'art-refresh',
    lengthMult:'art-long',letterMult:'art-score',roundSeed:'art-score',nextRoundSeed:'art-score',
    careerXp:'art-xp',rareLuck:'art-rare',
    gold:'art-gold',makeGold:'art-gold',
    diamond:'art-diamond',makeDiamond:'art-diamond',
    emerald:'art-emerald',makeEmerald:'art-emerald',
    dot:'art-dot',makeDot:'art-dot',
    wild:'art-wild',makeWild:'art-wild',
    potion:'art-potion',glass:'art-glass',mirror:'art-mirror',bang:'art-bang',plus:'art-plus',
    holdRefresh:'art-refresh',swapVowel:'art-vowels',swapConsonant:'art-consonants',
    duplicate:'art-duplicate',destroyPlay:'art-destroy',
    addScore:'art-score',randomScore:'art-score',randomSpecial:'art-transmute'
  };
  if(effectMap[r.effect])return effectMap[r.effect];
  const c=String(r.condition||'');
  if(/accent/i.test(c))return'art-accent';
  if(/ntilde/i.test(c))return'art-enye';
  if(/rare|containsJ|containsZ|containsX|containsQ/i.test(c))return'art-rare';
  if(/vowel|twoA|twoE/i.test(c))return'art-vowels';
  if(/consonant/i.test(c))return'art-consonants';
  if(/starts|ends|Edges/i.test(c))return'art-startend';
  if(/len|min[0-9]|long|perfectWord|sixUnique/i.test(c))return'art-long';
  if(/streak|palindrome|longerThanPrev|shorterThanPrev/i.test(c))return'art-combo';
  if(/special|crown/i.test(c))return'art-transmute';
  return'art-generic';
}
function rewardArtSvg(r){
  return '<svg class="reward-art-image" viewBox="0 0 160 110" aria-hidden="true" focusable="false"><use href="./assets/reward-art.svg#'+rewardArt(r)+'"></use></svg>';
}
function rewardAccent(r){
  return r.rarity==='legendary'?'legendary':r.rarity==='epic'?'epic':r.rarity==='rare'?'rare':r.rarity==='uncommon'?'uncommon':'common';
}

function renderRewards(){
  ui.rewardChoices.innerHTML=rewardOptions.map(r=>{
    const type=rewardType(r),accent=rewardAccent(r),art=rewardArtSvg(r);
    const meta=r.type==='upgrade'?r.uses+' USOS':r.type==='modifier'?state().modifiers.length+'/6 ACTIVOS':r.type==='bagTile'?'A LA RESERVA':'EFECTO DE RUN';
    return '<button class="reward-card rarity-'+r.rarity+' card-'+accent+'" data-id="'+r.id+'" data-tip="'+escAttr(itemTip(r))+'" type="button">'+
      '<span class="card-corner top-left"></span><span class="card-corner top-right"></span>'+
      '<div class="reward-art">'+art+'<i></i></div>'+
      '<div class="reward-card-body">'+
        '<div class="reward-card-topline"><span class="reward-type">'+type+'</span><span class="rarity-gem">'+r.rarity.toUpperCase()+'</span></div>'+
        '<h3>'+r.name+'</h3>'+
        '<p>'+r.desc+'</p>'+
        '<div class="reward-effect"><span>'+meta+'</span><strong>Elegir</strong></div>'+
      '</div>'+
      '<span class="card-corner bottom-left"></span><span class="card-corner bottom-right"></span>'+
    '</button>';
  }).join('');
  ui.rewardChoices.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>choose(rewardOptions.find(r=>r.id===b.dataset.id))));
}
function afterReward(){
  hideModal();if(!E.nextRound())return finish(true);
  const gain=Number(state().lastInkGain||0),coinGain=Number(state().lastCoinGain||0);
  render();const sr=E.specialRound(state().specialRound),ch=E.challenge(state().challenge);
  const prefix=(gain?('+'+gain+' Tinta · '):'')+(coinGain?('+'+coinGain+' Monedas · '):'');
  showFeedback(prefix+(sr?'¡Ronda especial! '+sr.title:ch.kind==='constraint'?'Regla activa: '+ch.title:'Nueva ronda. Construye una palabra potente.'),'good');
}
function choose(r){if(!E.chooseReward(r)){showFeedback('No puedes llevar más de ese tipo.','warn');return;}afterReward();}
function reroll(){if(state().rerollsLeft<=0)return;state().rerollsLeft--;rewardOptions=E.rewards();renderRewards();ui.rerollBtn.disabled=state().rerollsLeft<=0;E.saveRun();render();}
function skipReward(){const n=E.skipReward();showFeedback('Pasas la recompensa · +'+n+' renovaciones','good');afterReward();}
function start(mode){if(!dictionaryReady){showFeedback('Espera un instante: estoy preparando el diccionario.','warn');return;}hideModal();E.state=E.newState(mode);ui.menu.classList.add('hidden');ui.game.classList.remove('hidden');render();E.saveRun();setTimeout(()=>showCoach('resources','Tus tres recursos','Jugadas permiten formar palabras; Renovaciones cambian el tablero; los Rerolls cambian las tres cartas de recompensa.'),350);if(E.career.games===0)howTo(true);}
function resumeRun(){if(!dictionaryReady)return;const r=E.loadRun();if(!r)return;E.state=r;ui.menu.classList.add('hidden');ui.game.classList.remove('hidden');render();}
function finish(won){
  const out=E.finish(won),s=state();ui.endEye.textContent=won?'PARTIDA COMPLETADA':'FIN DE PARTIDA';ui.endTitle.textContent=won?'¡Estrategia completada!':'Tu partida';
  const stats=[['Puntuación',fmt(s.totalScore)],['Ronda',s.mode==='quick'?'Rápida':s.round+'/'+E.totalRounds(s.mode)],['Palabras',s.words.length],['Más larga',s.longestWord||'—'],['Mejor jugada',s.bestPlay?s.bestPlay.word+' · '+fmt(s.bestPlay.score):'—'],['Monedas',fmt(s.coinsEarned||0)+' ganadas · '+fmt(s.coinsSpent||0)+' gastadas'],['Misiones',String((s.missionHistory||[]).length)],['XP léxico','+'+out.xp]];
  ui.endStats.innerHTML=stats.map(([a,b])=>'<article><span>'+a+'</span><strong>'+b+'</strong></article>').join('');
  const profile=buildProfile(s),keyCards=s.modifiers.slice(0,4).map(id=>C.modifiers.find(x=>x.id===id)?.name).filter(Boolean);
  ui.buildSummary.innerHTML='<span class="eyebrow">TU ESTRATEGIA</span><h3>'+profile.name+'</h3><p>'+profile.desc+'</p>'+
    (profile.synergies.length?'<div class="build-synergies">'+profile.synergies.map(x=>'<span>'+x.name+'</span>').join('')+'</div>':'')+
    (keyCards.length?'<small>Cartas clave · '+keyCards.join(' · ')+'</small>':'');
  ui.newAchievements.classList.toggle('hidden',!out.got.length);if(out.got.length)ui.newAchievements.innerHTML='<strong>🏆 Nuevos logros</strong><div>'+out.got.map(a=>a.name).join(' · ')+'</div>';showModal(ui.end);renderCareer();
}
function collection(tab='cards'){document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));const c=E.career;if(tab==='cards')ui.collectionBody.innerHTML=[...C.modifiers,...C.upgrades,...C.gifts].map(x=>`<article class="collection-card rarity-${x.rarity} ${c.cards[x.id]?'':'locked'}" ${c.cards[x.id]?`data-tip="${escAttr(itemTip(x))}"`:''}><strong>${c.cards[x.id]?x.name:'???'}</strong><span>${c.cards[x.id]?x.desc:`${x.rarity} · aún no descubierta`}</span></article>`).join('');else if(tab==='achievements')ui.collectionBody.innerHTML=C.achievements.map(a=>`<article class="collection-card ${c.achievements[a.id]?'':'locked'}"><strong>${c.achievements[a.id]?'🏆':'○'} ${a.name}</strong><span>${a.desc}</span></article>`).join('');else{const words=Object.entries(c.words).sort((a,b)=>b[1]-a[1]);ui.collectionBody.innerHTML=words.map(([w,n])=>`<article class="collection-card"><strong>${w.toUpperCase()}</strong><span>Usada ${n} ${n===1?'vez':'veces'}</span></article>`).join('')||'<article class="collection-card"><strong>Aún vacío</strong><span>Juega palabras para llenar tu archivo.</span></article>';}}
function showCollection(tab){collection(tab);showModal(ui.collection);}
function howTo(first=false){
  ui.infoTitle.textContent=first?'Primera partida':'Cómo se juega';
  ui.infoBody.innerHTML='<div class="info-step"><strong>1 · Forma palabras de 4+ fichas</strong><br>El valor de las letras crea el <b>Word Score</b>.</div><div class="info-step"><strong>2 · Las ranuras largas dan Bonus</strong><br>Las cuatro primeras no suman bonus; desde la quinta aparecen +5, +10, +15…</div><div class="info-step"><strong>3 · Word + Bonus = Final</strong><br>Los Modificadores y fichas especiales pueden multiplicar Word Score o Final Score.</div><div class="info-step"><strong>4 · Renovaciones</strong><br>Renuevan el tablero. Las fichas especiales viven en una reserva y pueden volver a aparecer.</div><div class="info-step"><strong>5 · Construye tu run</strong><br>Hasta 6 Modificadores permanentes y 3 Mejoras consumibles. También hay Obsequios que añaden fichas especiales.</div><div class="info-step"><strong>6 · Rondas especiales</strong><br>Cambian las reglas: primera letra sellada, vocales a cero, 2 jugadas por palabra, tablero inestable…</div><div class="info-step"><strong>7 · Español completo</strong><br>Se aceptan conjugaciones y derivaciones válidas; pulsa una vocal seleccionada para cambiar su tilde.</div><div class="info-step"><strong>8 · Tinta Viva</strong><br>Empiezas con 1 carga. Actívala para mutar 6 fichas sin gastar Jugadas ni Renovaciones. Superar rondas da Tinta y 3 Tintas compran una carga nueva.</div><div class="info-step"><strong>9 · Monedas y Tienda</strong><br>Cada palabra concede Monedas: las largas y las que usan fichas especiales dan más. Gástalas en Jugadas, Renovaciones, letras, fichas especiales o Mejoras.</div>';showModal(ui.info);
}
function wordLog(){ui.wordlogList.innerHTML=state().wordLog.slice().reverse().map(x=>'<div class="word-log-entry"><strong>'+x.word.toUpperCase()+'</strong><span>W '+fmt(x.wordScore||0)+' · B +'+fmt(x.bonusPoints||0)+' · '+fmt(x.score)+' pts · +'+Number(x.coins||0)+' monedas</span></div>').join('')||'<p class="empty-list">Aún no has jugado ninguna palabra.</p>';showModal(ui.wordlog);}
function menu(){hideModal();ui.game.classList.add('hidden');ui.menu.classList.remove('hidden');E.state=null;renderCareer();}
function wire(){
  $('newGameBtn').onclick=()=>showModal(ui.difficulty);
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>start(b.dataset.mode));$('closeDifficultyBtn').onclick=hideModal;
  $('quickGameBtn').onclick=()=>start('quick');$('dailyGameBtn').onclick=()=>start('daily');ui.cont.onclick=resumeRun;
  $('howToBtn').onclick=()=>howTo(false);$('helpBtn').onclick=()=>howTo(false);$('pauseBtn').onclick=()=>showModal(ui.pause);ui.shopBtn.onclick=openShop;$('closeShopBtn').onclick=hideModal;ui.cancelLetter.onclick=()=>{ui.letterPicker.classList.add('hidden');ui.shopMessage.textContent='Elige otro artículo o cierra la tienda.';};
  $('collectionBtn').onclick=()=>showCollection('cards');$('achievementsBtn').onclick=()=>showCollection('achievements');$('closeCollectionBtn').onclick=hideModal;$('closeWordLogBtn').onclick=hideModal;$('wordLogBtn').onclick=wordLog;$('closeInfoBtn').onclick=hideModal;$('resumeBtn').onclick=hideModal;
  $('saveExitBtn').onclick=()=>{E.saveRun();menu();};$('abandonBtn').onclick=()=>{E.clearRun();menu();};
  $('undoBtn').onclick=()=>{state().selected.pop();renderBoard();renderWord();};$('clearBtn').onclick=()=>{state().selected=[];renderBoard();renderWord();};$('submitBtn').onclick=play;
  $('shuffleBtn').onclick=()=>{if(E.shuffle()){showFeedback(E.specialEffect()==='autoRefresh'?'Tablero renovado · -1 jugada':'Tablero renovado.','good');render();}};
  ui.rerollBtn.onclick=reroll;ui.skipReward.onclick=skipReward;
  ui.tintaBtn.onclick=()=>{
    const st=state();if(!st)return;
    if(Number(st.tintaCharges||0)>0){
      activeUpgrade=null;
      const out=E.useTintaViva(6);
      if(out.ok){render();showFeedback('Tinta Viva: 6 fichas han mutado. Cargas restantes: '+out.charges+'.','good');}
      else showFeedback(out.message,'warn');
      return;
    }
    const buy=E.buyTintaViva(3);
    if(buy.ok){render();showFeedback('Has comprado 1 carga de Tinta Viva por 3 Tintas.','good');}
    else showFeedback(buy.message,'warn');
  };
  $('playAgainBtn').onclick=()=>{const m=state()?.mode||'normal';hideModal();start(m);};$('endMenuBtn').onclick=menu;
  document.querySelectorAll('.tab-btn').forEach(b=>b.onclick=()=>collection(b.dataset.tab));ui.motion.checked=E.settings.reduceMotion;ui.sound.checked=E.settings.sound;ui.classroom.checked=E.settings.classroomMode;document.documentElement.classList.toggle('reduce-motion',!!E.settings.reduceMotion);
  ui.motion.onchange=()=>{E.settings.reduceMotion=ui.motion.checked;document.documentElement.classList.toggle('reduce-motion',!!E.settings.reduceMotion);E.saveSettings();window.WordPlayGameFeel?.syncMotionClass?.();};ui.sound.onchange=()=>{E.settings.sound=ui.sound.checked;E.saveSettings();};ui.classroom.onchange=()=>{E.settings.classroomMode=ui.classroom.checked;E.saveSettings();render();showFeedback(E.settings.classroomMode?'Modo Aula activado.':'Modo Aula desactivado.','good');};
  document.addEventListener('keydown',e=>{
    if(ui.game.classList.contains('hidden')||!state()||!ui.backdrop.classList.contains('hidden'))return;
    if(e.key==='Enter'){e.preventDefault();play();}else if(e.key==='Backspace'){e.preventDefault();state().selected.pop();renderBoard();renderWord();}else if(e.key==='Escape')showModal(ui.pause);
    else if(/^[a-zñ]$/i.test(e.key)){const key=e.key.toUpperCase();let t=state().board.find(t=>!state().selected.some(s=>s.id===t.id)&&!tileLocked(t)&&t.letter===key);if(!t)t=state().board.find(t=>!state().selected.some(s=>s.id===t.id)&&!tileLocked(t)&&t.kind==='wild');if(t)selectTile(t.id,key);}
  });
  const gameIsActive=()=>!ui.game.classList.contains('hidden')&&!!state()&&!state().completed;
  document.addEventListener('copy',e=>{
    if(!E.settings.classroomMode||!gameIsActive())return;
    e.preventDefault();showFeedback('Modo Aula: el tablero no se puede copiar.','warn');
  });
  ui.board.addEventListener('contextmenu',e=>{if(E.settings.classroomMode){e.preventDefault();showFeedback('Modo Aula: el tablero está protegido frente a copia y arrastre.','warn');}});
  ui.board.addEventListener('dragstart',e=>{if(E.settings.classroomMode)e.preventDefault();});

}
wire();
installStaticTips();
initTooltips();
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
