(() => {
'use strict';
const E=window.LexomaEngine,L=window.LexomaLanguage,C=window.LexomaContent,B=window.LexomaBridge,$=id=>document.getElementById(id);
let title=true,rerollMode=false,sound=false,audio=null,lastMessage='',collectionMode='bonuses';
const fmt=n=>Number(n||0).toLocaleString('es-ES',{maximumFractionDigits:1});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function tone(kind='click'){if(!sound)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type=kind==='score'?'triangle':'sine';o.frequency.value={click:300,select:430,score:720,error:130,reward:880}[kind]||320;g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.16);o.start();o.stop(audio.currentTime+.17);}catch{}}
function ready(){return B.initialized&&E.dictionaryReady;}
function setMessage(t){lastMessage=t||'';render();}
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
function categoryText(analysis){
 if(!analysis)return'PALABRA VÁLIDA';
 const c=L.categories[analysis.category];return c?c[0].toUpperCase():'PALABRA VÁLIDA';
}
function renderCareer(){
 const c=E.career;
 $('careerStats').innerHTML=[
  ['Récord',fmt(c.bestScore)],
  ['Mejor palabra',fmt(c.bestPlay)],
  ['Mejor MULTI','×'+fmt(c.bestMulti)],
  ['Victorias',fmt(c.wins)],
  ['Bonus vistos',(c.bonusesSeen||[]).length+'/54'],
  ['Palabras',fmt(c.words)]
 ].map(([a,b])=>'<div><small>'+a+'</small><strong>'+b+'</strong></div>').join('');
 $('continueBtn').hidden=!E.run||E.run.finished;
}
function renderTitle(){
 $('titleScreen').hidden=!title;$('gameScreen').hidden=title||!E.run;
 renderCareer();
 document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=!ready());
 $('continueBtn').disabled=!ready();
 $('dictionaryStatus').classList.toggle('ready',E.dictionaryReady);
}
function renderBonusStack(r){
 $('bonusCount').textContent=r.bonuses.length;
 const items=r.bonuses.slice(-5).reverse().map(id=>C.bonuses.find(b=>b.id===id)).filter(Boolean);
 $('bonusStack').innerHTML=items.map((b,i)=>'<button class="mini-bonus type-'+b.type+'" data-bonus-view="'+b.id+'" style="--i:'+i+'"><strong>'+esc(b.name)+'</strong><small>'+esc(b.description)+'</small></button>').join('');
}
function renderWord(r,preview){
 const byId=new Map(r.hand.map(t=>[t.id,t]));
 $('wordRow').innerHTML='';
 for(let i=0;i<9;i++){
  const sel=r.selected[i],t=sel?byId.get(sel.id):null;
  const el=document.createElement(sel?'button':'div');
  if(sel&&t){
   el.type='button';el.className='word-tile '+t.style;
   const letter=tileLetter(t,sel);
   el.innerHTML=tileStyleLabel(t)+'<strong>'+esc(letter)+'</strong><small>'+(t.style==='wild'?0:E.letterValue(letter))+'</small>';
   el.title=/^[AEIOUÁÉÍÓÚ]$/i.test(letter)?'Pulsa para poner o quitar tilde':'Pulsa para devolver a la mano';
   el.addEventListener('click',()=>{
    if(/^[AEIOUÁÉÍÓÚ]$/i.test(letter))E.cycleAccent(t.id);else E.select(t.id);
   });
  }else{
   el.className='word-tile empty';el.innerHTML='<span>'+(i+1)+'</span>';
  }
  $('wordRow').appendChild(el);
 }
}
function renderHand(r){
 const selected=new Set(r.selected.map(s=>s.id));
 $('hand').innerHTML=r.hand.filter(t=>!selected.has(t.id)).map(t=>{
   const reroll=r.rerollSelection.includes(t.id);
   return '<button class="hand-tile '+t.style+' '+(reroll?'reroll-selected':'')+'" data-tile="'+t.id+'">'+tileStyleLabel(t)+'<strong>'+esc(t.char)+'</strong><small>'+E.letterValue(t.char)+'</small></button>';
 }).join('');
 $('handInfo').textContent=r.maxHand+' letras · '+r.hand.length+' en mano';
}
function renderGame(){
 const r=E.run;if(!r)return;
 const draft=E.draft(),validation=draft?E.validate(draft):null,preview=draft?E.score(draft,true):{points:0,multis:1,total:0,effects:[]};
 $('roundLabel').textContent=r.round+' / '+(r.mode==='hard'?12:r.mode==='easy'?7:10);
 $('modeLabel').textContent=(C.modes[r.mode]?.name||r.mode).toUpperCase();
 $('runTotal').textContent=fmt(r.totalScore);
 $('pointsValue').textContent=fmt(preview.points||0);
 $('multisValue').textContent=fmt(preview.multis||1);
 $('scoreValue').textContent=fmt(r.roundScore);
 $('targetValue').textContent=fmt(r.target);
 $('goalBig').textContent=fmt(r.target);
 $('energyValue').textContent=Math.max(0,r.energy);
 $('rerollCount').textContent=r.rerolls+' ↻';
 $('bagCount').textContent=r.bag.length;
 $('scoreProgress').style.width=Math.min(100,r.roundScore/Math.max(1,r.target)*100)+'%';
 $('targetHint').textContent='BONUS OBJETIVO · '+r.targetLength+' LETRAS';
 $('categoryHint').textContent=validation?.ok?categoryText(validation.analysis):draft?'PALABRA NO VÁLIDA':'FORMA UNA PALABRA';
 $('categoryHint').classList.toggle('valid',!!validation?.ok);
 $('categoryHint').classList.toggle('invalid',!!draft&&!validation?.ok);
 $('rerollModeBtn').classList.toggle('active',rerollMode);
 $('rerollTray').textContent=r.rerollSelection.length+' / 3';
 $('doRerollBtn').disabled=!rerollMode||!r.rerollSelection.length||r.rerolls<=0;
 $('playBtn').disabled=!validation?.ok;
 $('clearBtn').disabled=!r.selected.length;
 renderBonusStack(r);renderWord(r,preview);renderHand(r);
 $('effectFloat').innerHTML=(preview.effects||[]).slice(-5).map(e=>'<span>'+esc(e)+'</span>').join('');
 if(lastMessage)$('feedback').textContent=lastMessage;
 else if(validation?.ok)$('feedback').textContent='✓ '+draft.toUpperCase()+' · '+categoryText(validation.analysis)+' · '+fmt(preview.points)+' × '+fmt(preview.multis)+' = '+fmt(preview.total);
 else if(draft)$('feedback').textContent=validation?.message||'Esta combinación no forma una palabra válida.';
 else $('feedback').textContent=rerollMode?'Selecciona hasta 3 letras de la mano y pulsa ↻.':'Selecciona letras de tu mano. Pulsa una vocal colocada para acentuarla.';
 $('saveStatus').textContent=!E.storageOK?'Error de guardado':B.embedded?'LenguArcade · guardado activo':'Guardado local';
 $('gameExitBtn').hidden=!B.embedded;
 renderOverlay();
}
function rewardCard(b){
 const icon=b.type==='points'?'●':b.type==='multi'?'◆':b.type==='hybrid'?'✦':'↻';
 return '<button class="reward-choice type-'+b.type+'" data-reward="'+b.id+'"><span class="reward-icon">'+icon+'</span><small>'+b.type.toUpperCase()+'</small><strong>'+esc(b.name)+'</strong><p>'+esc(b.description)+'</p><em>ELEGIR</em></button>';
}
function renderOverlay(){
 const r=E.run;
 $('overlay').hidden=true;$('rewardPanel').hidden=true;$('endPanel').hidden=true;$('collectionPanel').hidden=true;
 if(!r)return;
 if(collectionMode&&document.body.dataset.collectionOpen==='1'){
  $('overlay').hidden=false;$('collectionPanel').hidden=false;renderCollection();return;
 }
 if(r.status==='reward'){
  $('overlay').hidden=false;$('rewardPanel').hidden=false;
  $('rewardChoices').innerHTML=r.bonusChoices.map(id=>C.bonuses.find(b=>b.id===id)).filter(Boolean).map(rewardCard).join('');
  $('rewardRerolls').textContent=r.rerolls+' ↻';
  $('rerollBonusesBtn').disabled=r.rerolls<=0;
  $('rerollBonusesBtn').textContent='↻ Cambiar los 3 bonus · '+r.rerolls+' disponibles';
  $('rewardOwned').innerHTML=r.bonuses.length?r.bonuses.slice().reverse().map(id=>{const b=C.bonuses.find(x=>x.id===id);return b?'<div><span>'+esc(b.name)+'</span><small>'+esc(b.description)+'</small></div>':'';}).join(''):'<p>Aún no tienes bonus.</p>';
  return;
 }
 if(r.finished){
  $('overlay').hidden=false;$('endPanel').hidden=false;
  const won=r.status==='victory';$('endKicker').textContent=won?'RUN COMPLETADA':'FIN DE LA RUN';$('endTitle').textContent=won?'¡La Forja arde!':'La energía se agotó';
  $('endScore').textContent=fmt(r.totalScore);
  $('endStats').innerHTML=[
   ['Ronda',r.round+'/'+(C.modes[r.mode]?.rounds||10)],
   ['Palabras',r.words.length],
   ['Bonus',r.bonuses.length],
   ['Mejor jugada',fmt(Math.max(0,...r.wordLog.map(x=>x.total||0)))],
   ['Rerolls',r.rerolls],
   ['Energía',r.energy]
  ].map(([a,b])=>'<div><small>'+a+'</small><strong>'+b+'</strong></div>').join('');
  $('endlessBtn').hidden=!won;
 }
}
function renderCollection(){
 const c=E.career,r=E.run;
 if(collectionMode==='history'){
  $('collectionTitle').textContent='Palabras de la run';
  $('collectionBody').innerHTML=r?.wordLog?.length?'<div class="history-list">'+r.wordLog.slice().reverse().map(x=>'<div><strong>'+esc(x.word)+'</strong><span>'+fmt(x.points)+' × '+fmt(x.multis)+' = <b>'+fmt(x.total)+'</b></span><small>Ronda '+x.round+'</small></div>').join('')+'</div>':'<p>No hay palabras jugadas todavía.</p>';
 }else if(collectionMode==='achievements'){
  $('collectionTitle').textContent='Logros y bonus';
  $('collectionBody').innerHTML='<h3>Logros</h3><div class="achievement-grid">'+C.achievements.map(a=>'<div class="'+(c.achievements.includes(a.id)?'done':'')+'"><span>'+(c.achievements.includes(a.id)?'✦':'◇')+'</span><strong>'+esc(a.title)+'</strong><small>'+esc(a.description)+'</small></div>').join('')+'</div><h3>Bonus descubiertos · '+(c.bonusesSeen||[]).length+'/54</h3><div class="bonus-codex">'+C.bonuses.map(b=>'<div class="'+((c.bonusesSeen||[]).includes(b.id)?'seen':'')+'"><strong>'+esc((c.bonusesSeen||[]).includes(b.id)?b.name:'???')+'</strong><small>'+esc((c.bonusesSeen||[]).includes(b.id)?b.description:'Descúbrelo durante una run.')+'</small></div>').join('')+'</div>';
 }else{
  $('collectionTitle').textContent='Tu build';
  $('collectionBody').innerHTML=r?.bonuses?.length?'<div class="build-grid">'+r.bonuses.map(id=>{const b=C.bonuses.find(x=>x.id===id);return b?'<div class="type-'+b.type+'"><strong>'+esc(b.name)+'</strong><small>'+esc(b.description)+'</small></div>':'';}).join('')+'</div>':'<p>Aún no tienes bonus en esta run.</p>';
 }
}
function render(){
 renderTitle();
 if(!title&&E.run)renderGame();
}
function openCollection(mode){collectionMode=mode;document.body.dataset.collectionOpen='1';render();}
function closeCollection(){document.body.dataset.collectionOpen='0';render();}
function chooseWild(id){
 const letters=[...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'];$('choiceBody').innerHTML='<h2>Elige la letra del comodín</h2><div class="letter-choice">'+letters.map(c=>'<button data-letter="'+c+'">'+c+'</button>').join('')+'</div>';$('choiceDialog').showModal();
 const handler=e=>{const b=e.target.closest('[data-letter]');if(!b)return;$('choiceBody').removeEventListener('click',handler);$('choiceDialog').close();E.select(id,b.dataset.letter);};
 $('choiceBody').addEventListener('click',handler);
}
function start(mode){title=false;rerollMode=false;lastMessage='';closeCollection();E.newRun(mode);B.start();tone('reward');render();}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>start(b.dataset.mode)));
$('continueBtn').addEventListener('click',()=>{title=false;lastMessage='';B.start();render();});
$('menuBtn').addEventListener('click',()=>{title=true;rerollMode=false;E.save();B.checkpoint('menu');render();});
$('exitBtn').addEventListener('click',()=>B.saveAndExit());$('gameExitBtn').addEventListener('click',()=>B.saveAndExit());
$('soundBtn').addEventListener('click',()=>{sound=!sound;$('soundBtn').textContent='♫ '+(sound?'Sí':'No');tone();});
$('hand').addEventListener('click',e=>{
 const b=e.target.closest('[data-tile]');if(!b||!E.run)return;const id=Number(b.dataset.tile),t=E.run.hand.find(x=>x.id===id);tone('select');
 if(rerollMode){E.toggleReroll(id);return;}
 if(t?.style==='wild'||t?.char==='*')chooseWild(id);else E.select(id);
});
$('clearBtn').addEventListener('click',()=>{lastMessage='';E.clear();});
$('playBtn').addEventListener('click',()=>{
 const q=E.play();if(!q.ok){lastMessage=q.message;tone('error');render();return;}
 lastMessage=q.score.display.toUpperCase()+' · '+fmt(q.score.points)+' × '+fmt(q.score.multis)+' = '+fmt(q.score.total);tone('score');B.checkpoint('word');B.result();render();
});
$('rerollModeBtn').addEventListener('click',()=>{rerollMode=!rerollMode;if(!rerollMode&&E.run?.rerollSelection?.length){for(const id of [...E.run.rerollSelection])E.toggleReroll(id);}lastMessage=rerollMode?'Modo reroll: selecciona hasta 3 letras.':'';render();});
$('doRerollBtn').addEventListener('click',()=>{const q=E.rerollLetters();lastMessage=q.ok?'Letras renovadas.':q.message;if(q.ok)rerollMode=false;tone(q.ok?'select':'error');render();});
$('rewardChoices').addEventListener('click',e=>{const b=e.target.closest('[data-reward]');if(!b)return;const q=E.chooseBonus(b.dataset.reward);if(q.ok){lastMessage='Bonus adquirido: '+C.bonuses.find(x=>x.id===b.dataset.reward)?.name;tone('reward');B.checkpoint('bonus');render();}});
$('rerollBonusesBtn').addEventListener('click',()=>{const q=E.rerollBonuses();lastMessage=q.ok?'Tres bonus nuevos.':q.message;tone(q.ok?'select':'error');render();});
$('bonusDeckBtn').addEventListener('click',()=>openCollection('bonuses'));
$('bonusStack').addEventListener('click',()=>openCollection('bonuses'));
$('historyBtn').addEventListener('click',()=>openCollection('history'));
$('achievementsBtn').addEventListener('click',()=>openCollection('achievements'));
$('closeCollectionBtn').addEventListener('click',closeCollection);
$('againBtn').addEventListener('click',()=>start(E.run?.mode||'normal'));
$('endMenuBtn').addEventListener('click',()=>{title=true;render();});
$('endlessBtn').addEventListener('click',()=>{if(E.continueEndless()){lastMessage='Modo infinito: el objetivo seguirá creciendo.';render();}});
$('cancelChoice').addEventListener('click',()=>$('choiceDialog').close());
window.addEventListener('lexoma:change',render);
window.addEventListener('keydown',e=>{
 if(title||!E.run||E.run.status!=='play'||$('choiceDialog').open||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='Escape'){E.clear();e.preventDefault();return;}
 if(e.key==='Enter'){if(!E.validate(E.draft()).ok)return;const q=E.play();if(q.ok){lastMessage=q.score.display.toUpperCase()+' · '+fmt(q.score.total);tone('score');B.checkpoint('word');B.result();render();}e.preventDefault();return;}
 if(/^[a-zñ]$/iu.test(e.key)){const c=e.key.toUpperCase(),t=E.run.hand.find(t=>!E.run.selected.some(s=>s.id===t.id)&&!E.run.rerollSelection.includes(t.id)&&(t.char===c||t.char==='*'));if(t){if(t.char==='*')chooseWild(t.id);else E.select(t.id);e.preventDefault();}}
});
E.loadDictionary(t=>{$('dictionaryStatus').textContent=t;render();}).finally(render);
render();
})();