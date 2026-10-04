(() => {
'use strict';
const E=window.LexomaEngine,L=window.LexomaLanguage,C=window.LexomaContent,B=window.LexomaBridge,$=id=>document.getElementById(id);
let title=true,rerollMode=false,sound=false,audio=null,lastMessage='',collectionMode='bonuses',selectedPulseId=null,scoringAnimation=null,playingNow=false,choiceState=null;
const fmt=n=>Number(n||0).toLocaleString('es-ES',{maximumFractionDigits:1});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
function tone(kind='click'){if(!sound)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type=kind==='score'?'triangle':'sine';o.frequency.value={click:300,select:430,score:720,error:130,reward:880,card:620}[kind]||320;g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.start();o.stop(audio.currentTime+.19);}catch{}}
function ready(){return B.initialized&&E.dictionaryReady;}
function tileStyleLabel(t){
 if(t.style==='bold')return'<span class="tile-mod point-mod">+2●</span>';
 if(t.style==='italic')return'<span class="tile-mod multi-mod">+1◆</span>';
 if(t.style==='underline')return'<span class="tile-mod multi-mod">×1,5◆</span>';
 if(t.style==='gold')return'<span class="tile-mod point-mod">+5●</span><span class="tile-mod multi-mod">+2◆</span>';
 if(t.style==='wild')return'<span class="tile-mod special-mod">COMODÍN</span>';
 if(t.style==='bang')return'<span class="tile-mod special-mod">+10● +3◆</span>';
 return'';
}
function tileLetter(t,sel){return sel?.char||t.char;}
function categoryText(analysis){if(!analysis)return'PALABRA VÁLIDA';const c=L.categories[analysis.category];return c?c[0].toUpperCase():'PALABRA VÁLIDA';}
function renderCareer(){
 const c=E.career;
 $('careerStats').innerHTML=[
  ['Récord',fmt(c.bestScore)],['Mejor palabra',fmt(c.bestPlay)],['Mejor MULTI','×'+fmt(c.bestMulti)],
  ['Victorias',fmt(c.wins)],['Cartas vistas',(c.bonusesSeen||[]).length+'/54'],['Palabras',fmt(c.words)]
 ].map(([a,b])=>'<div><small>'+a+'</small><strong>'+b+'</strong></div>').join('');
 $('continueBtn').hidden=!E.run||E.run.finished;
}
function renderTitle(){
 $('titleScreen').hidden=!title;$('gameScreen').hidden=title||!E.run;renderCareer();
 document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=!ready());$('continueBtn').disabled=!ready();
 $('dictionaryStatus').classList.toggle('ready',E.dictionaryReady);
}
function renderBonusStack(r){
 $('bonusCount').textContent=r.bonuses.length+'/'+E.maxBonuses;
 const items=r.bonuses.slice().reverse().map(id=>C.bonuses.find(b=>b.id===id)).filter(Boolean);
 $('bonusStack').innerHTML=items.map((b,i)=>'<button class="mini-bonus type-'+b.type+'" data-bonus-view="'+b.id+'" style="--i:'+i+'"><strong>'+esc(b.name)+'</strong><small>'+esc(b.description)+'</small></button>').join('');
}
function wordTileMarkup(t,letter){
 return tileStyleLabel(t)+'<strong>'+esc(letter)+'</strong><small>'+(t.style==='wild'?0:E.letterValue(letter))+'</small>';
}
function renderScoringWord(sc){
 $('wordRow').innerHTML='';
 (sc.tileDetails||[]).forEach((t,i)=>{
  const el=document.createElement('div');el.className='word-tile '+t.style+' scoring-tile';el.style.setProperty('--i',i);
  el.innerHTML=wordTileMarkup(t,t.playedChar||t.char);$('wordRow').appendChild(el);
 });
 for(let i=(sc.tileDetails||[]).length;i<9;i++){const el=document.createElement('div');el.className='word-tile empty scoring-empty';el.innerHTML='<span>'+(i+1)+'</span>';$('wordRow').appendChild(el);}
}
function renderWord(r){
 const byId=new Map(r.hand.map(t=>[t.id,t]));$('wordRow').innerHTML='';
 for(let i=0;i<9;i++){
  const sel=r.selected[i],t=sel?byId.get(sel.id):null;const el=document.createElement(sel?'button':'div');
  if(sel&&t){
   el.type='button';el.className='word-tile '+t.style+(t.id===selectedPulseId?' entering':'');const letter=tileLetter(t,sel);el.innerHTML=wordTileMarkup(t,letter);
   el.title=/^[AEIOUÁÉÍÓÚ]$/i.test(letter)?'Pulsa para poner o quitar tilde':'Pulsa para devolver a la mano';
   el.addEventListener('click',()=>{/^[AEIOUÁÉÍÓÚ]$/i.test(letter)?E.cycleAccent(t.id):E.select(t.id);});
  }else{el.className='word-tile empty';el.innerHTML='<span>'+(i+1)+'</span>';}
  $('wordRow').appendChild(el);
 }
}
function renderHand(r){
 const selected=new Set(r.selected.map(s=>s.id));
 $('hand').innerHTML=r.hand.filter(t=>!selected.has(t.id)).map((t,i)=>{
  const reroll=r.rerollSelection.includes(t.id);
  return '<button class="hand-tile '+t.style+' '+(reroll?'reroll-selected':'')+'" data-tile="'+t.id+'" style="--hand-i:'+i+'">'+tileStyleLabel(t)+'<strong>'+esc(t.char)+'</strong><small>'+(t.style==='wild'?0:E.letterValue(t.char))+'</small></button>';
 }).join('');
 $('handInfo').textContent=r.maxHand+' letras · '+r.hand.length+' en mano';
}
function renderGame(){
 const r=E.run;if(!r)return;
 const raw=E.draft(),validation=raw?E.validate(raw):null,livePreview=raw?E.score(raw,true):{points:0,multis:1,total:0,effects:[]};
 const preview=scoringAnimation?.score||livePreview;
 $('roundLabel').textContent=r.round+' / '+E.totalRounds();$('modeLabel').textContent=(C.modes[r.mode]?.name||r.mode).toUpperCase();$('runTotal').textContent=fmt(r.totalScore);
 $('pointsValue').textContent=fmt(preview.points||0);$('multisValue').textContent=fmt(preview.multis||1);$('scoreValue').textContent=fmt(r.roundScore);$('targetValue').textContent=fmt(r.target);$('goalBig').textContent=fmt(r.target);
 $('energyValue').textContent=Math.max(0,r.energy);$('rerollCount').textContent=r.rerolls+' ↻';$('bagCount').textContent=r.bag.length;$('scoreProgress').style.width=Math.min(100,r.roundScore/Math.max(1,r.target)*100)+'%';
 $('targetHint').textContent='BONUS OBJETIVO · '+r.targetLength+' LETRAS';
 $('categoryHint').textContent=scoringAnimation?'PALABRA FORJADA':validation?.ok?categoryText(validation.analysis):raw?'PALABRA NO VÁLIDA':'FORMA UNA PALABRA';
 $('categoryHint').classList.toggle('valid',!!validation?.ok||!!scoringAnimation);$('categoryHint').classList.toggle('invalid',!!raw&&!validation?.ok&&!scoringAnimation);
 $('rerollModeBtn').classList.toggle('active',rerollMode);$('rerollTray').textContent=r.rerollSelection.length+' / 3';$('doRerollBtn').disabled=!!scoringAnimation||!rerollMode||!r.rerollSelection.length||r.rerolls<=0;
 $('playBtn').disabled=!!scoringAnimation||!validation?.ok;$('clearBtn').disabled=!!scoringAnimation||!r.selected.length;
 renderBonusStack(r);scoringAnimation?renderScoringWord(scoringAnimation.score):renderWord(r);renderHand(r);
 $('effectFloat').innerHTML=(preview.effects||[]).slice(-7).map((e,i)=>'<span style="--i:'+i+'">'+esc(e)+'</span>').join('');
 $('playfield').classList.toggle('score-resolving',!!scoringAnimation);
 if(scoringAnimation)$('feedback').textContent=scoringAnimation.score.display.toUpperCase()+' · '+fmt(scoringAnimation.score.points)+' × '+fmt(scoringAnimation.score.multis)+' = '+fmt(scoringAnimation.score.total);
 else if(lastMessage)$('feedback').textContent=lastMessage;
 else if(validation?.ok)$('feedback').textContent='✓ '+raw.toUpperCase()+' · '+categoryText(validation.analysis)+' · '+fmt(livePreview.points)+' × '+fmt(livePreview.multis)+' = '+fmt(livePreview.total);
 else if(raw)$('feedback').textContent=validation?.message||'Esta combinación no forma una palabra válida.';
 else $('feedback').textContent=rerollMode?'Selecciona hasta 3 letras de la mano y pulsa ↻.':'Selecciona letras de tu mano. Pulsa una vocal colocada para acentuarla.';
 $('saveStatus').textContent=!E.storageOK?'Error de guardado':B.embedded?'LenguArcade · guardado activo':'Guardado local';$('gameExitBtn').hidden=!B.embedded;renderOverlay();
}
function rewardCard(b,full){
 const icon=b.type==='points'?'●':b.type==='multi'?'◆':b.type==='hybrid'?'✦':'↻';
 return '<button class="reward-choice type-'+b.type+'" data-reward="'+b.id+'"><span class="reward-icon">'+icon+'</span><small>CARTA · '+b.type.toUpperCase()+'</small><strong>'+esc(b.name)+'</strong><p>'+esc(b.description)+'</p><em>'+(full?'SUSTITUIR':'ELEGIR')+'</em></button>';
}
function renderOverlay(){
 const r=E.run;$('overlay').hidden=true;$('rewardPanel').hidden=true;$('endPanel').hidden=true;$('collectionPanel').hidden=true;if(!r||scoringAnimation)return;
 if(collectionMode&&document.body.dataset.collectionOpen==='1'){$('overlay').hidden=false;$('collectionPanel').hidden=false;renderCollection();return;}
 if(['starter','reward'].includes(r.status)){
  const starter=r.status==='starter',full=r.bonuses.length>=E.maxBonuses;
  $('overlay').hidden=false;$('rewardPanel').hidden=false;
  const main=$('rewardPanel').querySelector('.reward-main'),side=$('rewardPanel').querySelector('.reward-side');
  main.querySelector('.kicker').textContent=starter?'ANTES DE LA PRIMERA JUGADA':'RONDA SUPERADA';
  main.querySelector('h2').textContent=starter?'Elige tu primera carta':'Elige una carta';
  main.querySelector('p').textContent=starter?'Tu build empieza antes de jugar. Elige una regla que premie la forma en la que quieres construir palabras.':full?'Tu build ya tiene 5 cartas. Si eliges una nueva tendrás que sustituir una de las activas.':('Añade una carta permanente a tu build.'+(r.efficiencyReward?' Premio de eficiencia: +1 reroll por terminar con energía de sobra.':''));
  side.querySelector('h2').textContent='Cartas activas';
  $('rewardChoices').innerHTML=r.bonusChoices.map(id=>C.bonuses.find(b=>b.id===id)).filter(Boolean).map(b=>rewardCard(b,full)).join('');
  $('rewardRerolls').textContent=r.rerolls+' ↻';$('rerollBonusesBtn').hidden=starter;$('rerollBonusesBtn').disabled=r.rerolls<=0;$('rerollBonusesBtn').textContent='↻ Cambiar las 3 cartas · '+r.rerolls+' disponibles';
  $('rewardOwned').innerHTML=r.bonuses.length?r.bonuses.slice().reverse().map(id=>{const b=C.bonuses.find(x=>x.id===id);return b?'<div><span>'+esc(b.name)+'</span><small>'+esc(b.description)+'</small></div>':'';}).join(''):'<p>Elige tu primera carta para encender la build.</p>';return;
 }
 if(r.finished){
  $('overlay').hidden=false;$('endPanel').hidden=false;const won=r.status==='victory';$('endKicker').textContent=won?'RUN COMPLETADA':'FIN DE LA RUN';$('endTitle').textContent=won?'¡La Forja arde!':'La energía se agotó';$('endScore').textContent=fmt(r.totalScore);
  $('endStats').innerHTML=[['Ronda',r.round+'/'+E.totalRounds()],['Palabras',r.words.length],['Cartas',r.bonuses.length+'/'+E.maxBonuses],['Mejor jugada',fmt(Math.max(0,...r.wordLog.map(x=>x.total||0)))],['Rerolls',r.rerolls],['Energía',r.energy]].map(([a,b])=>'<div><small>'+a+'</small><strong>'+b+'</strong></div>').join('');$('endlessBtn').hidden=!won;
 }
}
function renderCollection(){
 const c=E.career,r=E.run;
 if(collectionMode==='history'){$('collectionTitle').textContent='Palabras de la run';$('collectionBody').innerHTML=r?.wordLog?.length?'<div class="history-list">'+r.wordLog.slice().reverse().map(x=>'<div><strong>'+esc(x.word)+'</strong><span>'+fmt(x.points)+' × '+fmt(x.multis)+' = <b>'+fmt(x.total)+'</b></span><small>Ronda '+x.round+'</small></div>').join('')+'</div>':'<p>No hay palabras jugadas todavía.</p>';}
 else if(collectionMode==='achievements'){$('collectionTitle').textContent='Logros y cartas';$('collectionBody').innerHTML='<h3>Logros</h3><div class="achievement-grid">'+C.achievements.map(a=>'<div class="'+(c.achievements.includes(a.id)?'done':'')+'"><span>'+(c.achievements.includes(a.id)?'✦':'◇')+'</span><strong>'+esc(a.title)+'</strong><small>'+esc(a.description)+'</small></div>').join('')+'</div><h3>Cartas descubiertas · '+(c.bonusesSeen||[]).length+'/54</h3><div class="bonus-codex">'+C.bonuses.map(b=>'<div class="'+((c.bonusesSeen||[]).includes(b.id)?'seen':'')+'"><strong>'+esc((c.bonusesSeen||[]).includes(b.id)?b.name:'???')+'</strong><small>'+esc((c.bonusesSeen||[]).includes(b.id)?b.description:'Descúbrela durante una run.')+'</small></div>').join('')+'</div>';}
 else{$('collectionTitle').textContent='Tu build · '+(r?.bonuses?.length||0)+'/'+E.maxBonuses;$('collectionBody').innerHTML=r?.bonuses?.length?'<div class="build-grid">'+r.bonuses.map(id=>{const b=C.bonuses.find(x=>x.id===id);return b?'<div class="type-'+b.type+'"><strong>'+esc(b.name)+'</strong><small>'+esc(b.description)+'</small></div>':'';}).join('')+'</div>':'<p>Aún no tienes cartas en esta run.</p>';}
}
function render(){renderTitle();if(!title&&E.run)renderGame();}
function openCollection(mode){collectionMode=mode;document.body.dataset.collectionOpen='1';render();}
function closeCollection(){document.body.dataset.collectionOpen='0';render();}
function openWild(id){
 choiceState={type:'wild',id};const letters=[...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'];$('choiceBody').innerHTML='<h2>Elige la letra del comodín</h2><div class="letter-choice">'+letters.map(c=>'<button data-letter="'+c+'">'+c+'</button>').join('')+'</div>';$('choiceDialog').showModal();
}
function openReplacement(newId){
 choiceState={type:'replace',newId};const incoming=C.bonuses.find(x=>x.id===newId);
 $('choiceBody').innerHTML='<h2>Tu build está completa</h2><p class="replace-copy">Para añadir <strong>'+esc(incoming?.name||'esta carta')+'</strong>, elige cuál de tus 5 cartas quieres sustituir.</p><div class="replace-grid">'+E.run.bonuses.map(id=>{const b=C.bonuses.find(x=>x.id===id);return b?'<button data-replace="'+id+'"><strong>'+esc(b.name)+'</strong><small>'+esc(b.description)+'</small></button>':'';}).join('')+'</div>';$('choiceDialog').showModal();
}
function finishScoreAnimation(q){
 scoringAnimation={score:q.score};lastMessage=q.score.display.toUpperCase()+' · '+fmt(q.score.points)+' × '+fmt(q.score.multis)+' = '+fmt(q.score.total);render();tone('score');
 setTimeout(()=>{document.querySelectorAll('.mini-bonus').forEach((el,i)=>{el.style.setProperty('--score-i',i);el.classList.add('card-trigger');});},330);
 setTimeout(()=>{scoringAnimation=null;render();B.checkpoint('word');B.result();},1150);
}
function playCurrent(){
 if(scoringAnimation)return;playingNow=true;const q=E.play();playingNow=false;
 if(!q.ok){lastMessage=q.message;tone('error');render();return;}finishScoreAnimation(q);
}
function start(mode){title=false;rerollMode=false;lastMessage='';scoringAnimation=null;closeCollection();E.newRun(mode);B.start();tone('reward');render();}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>start(b.dataset.mode)));
$('continueBtn').addEventListener('click',()=>{title=false;lastMessage='';B.start();render();});
$('menuBtn').addEventListener('click',()=>{title=true;rerollMode=false;scoringAnimation=null;E.save();B.checkpoint('menu');render();});
$('exitBtn').addEventListener('click',()=>B.saveAndExit());$('gameExitBtn').addEventListener('click',()=>B.saveAndExit());
$('soundBtn').addEventListener('click',()=>{sound=!sound;$('soundBtn').textContent='♫ '+(sound?'Sí':'No');tone();});
$('hand').addEventListener('click',e=>{
 const b=e.target.closest('[data-tile]');if(!b||!E.run||scoringAnimation)return;const id=Number(b.dataset.tile),t=E.run.hand.find(x=>x.id===id);tone('select');
 if(rerollMode){E.toggleReroll(id);return;}
 selectedPulseId=id;if(t?.style==='wild'||t?.char==='*')openWild(id);else E.select(id);setTimeout(()=>{selectedPulseId=null;},260);
});
$('clearBtn').addEventListener('click',()=>{lastMessage='';E.clear();});
$('playBtn').addEventListener('click',playCurrent);
$('rerollModeBtn').addEventListener('click',()=>{if(scoringAnimation)return;rerollMode=!rerollMode;if(!rerollMode&&E.run?.rerollSelection?.length){for(const id of [...E.run.rerollSelection])E.toggleReroll(id);}lastMessage=rerollMode?'Modo reroll: selecciona hasta 3 letras.':'';render();});
$('doRerollBtn').addEventListener('click',()=>{const q=E.rerollLetters();lastMessage=q.ok?'Letras renovadas.':q.message;if(q.ok)rerollMode=false;tone(q.ok?'select':'error');render();});
$('rewardChoices').addEventListener('click',e=>{const b=e.target.closest('[data-reward]');if(!b)return;const q=E.chooseBonus(b.dataset.reward);if(q.needsReplace){openReplacement(b.dataset.reward);return;}if(q.ok){lastMessage='Carta añadida: '+C.bonuses.find(x=>x.id===b.dataset.reward)?.name;tone('card');B.checkpoint('card');render();}});
$('rerollBonusesBtn').addEventListener('click',()=>{const q=E.rerollBonuses();lastMessage=q.ok?'Tres cartas nuevas.':q.message;tone(q.ok?'select':'error');render();});
$('bonusDeckBtn').addEventListener('click',()=>openCollection('bonuses'));$('bonusStack').addEventListener('click',()=>openCollection('bonuses'));$('historyBtn').addEventListener('click',()=>openCollection('history'));$('achievementsBtn').addEventListener('click',()=>openCollection('achievements'));$('closeCollectionBtn').addEventListener('click',closeCollection);
$('againBtn').addEventListener('click',()=>start(E.run?.mode||'normal'));$('endMenuBtn').addEventListener('click',()=>{title=true;render();});$('endlessBtn').addEventListener('click',()=>{if(E.continueEndless()){lastMessage='Modo infinito: el objetivo seguirá creciendo.';render();}});
$('choiceBody').addEventListener('click',e=>{
 const letter=e.target.closest('[data-letter]'),replace=e.target.closest('[data-replace]');
 if(letter&&choiceState?.type==='wild'){const id=choiceState.id;choiceState=null;$('choiceDialog').close();E.select(id,letter.dataset.letter);return;}
 if(replace&&choiceState?.type==='replace'){const newId=choiceState.newId;choiceState=null;$('choiceDialog').close();const q=E.chooseBonus(newId,replace.dataset.replace);if(q.ok){lastMessage='Build actualizada: '+C.bonuses.find(x=>x.id===newId)?.name;tone('card');B.checkpoint('card_replace');render();}}
});
$('cancelChoice').addEventListener('click',()=>{choiceState=null;$('choiceDialog').close();});
window.addEventListener('lexoma:change',()=>{if(!playingNow)render();});
window.addEventListener('keydown',e=>{
 if(title||!E.run||E.run.status!=='play'||$('choiceDialog').open||scoringAnimation||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='Escape'){E.clear();e.preventDefault();return;}if(e.key==='Enter'){if(E.validate(E.draft()).ok)playCurrent();e.preventDefault();return;}
 if(/^[a-zñ]$/iu.test(e.key)){const c=e.key.toUpperCase(),t=E.run.hand.find(t=>!E.run.selected.some(s=>s.id===t.id)&&!E.run.rerollSelection.includes(t.id)&&(t.char===c||t.char==='*'));if(t){selectedPulseId=t.id;if(t.char==='*')openWild(t.id);else E.select(t.id);setTimeout(()=>{selectedPulseId=null;},260);e.preventDefault();}}
});
E.loadDictionary(t=>{$('dictionaryStatus').textContent=t;render();}).finally(render);render();
})();