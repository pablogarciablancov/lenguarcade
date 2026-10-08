(() => {
'use strict';
const E=window.LexomaEngine,L=window.LexomaLanguage,C=window.LexomaContent,B=window.LexomaBridge,$=id=>document.getElementById(id);
let title=true,rerollMode=false,sound=false,audio=null,lastMessage='',collectionMode='bonuses',selectedPulseId=null,scoringAnimation=null,playingNow=false,choiceState=null;
const fmt=n=>Number(n||0).toLocaleString('es-ES',{maximumFractionDigits:1});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function tone(kind='click'){if(!sound)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type=kind==='score'?'triangle':'sine';o.frequency.value={click:300,select:430,score:720,error:130,reward:880,card:620,coin:960}[kind]||320;g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.18);o.start();o.stop(audio.currentTime+.19);}catch{}}
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
function categoryText(analysis){if(!analysis)return'PALABRA VÁLIDA';const c=L.categories[analysis.category];return c?c[0].toUpperCase():'PALABRA VÁLIDA';}
function cardLevelBadge(id){const lvl=E.cardLevel(id);return '<i class="level-badge">NIVEL '+['','I','II','III'][lvl]+'</i>';}
function renderCareer(){
 const c=E.career;
 $('careerStats').innerHTML=[['Récord',fmt(c.bestScore)],['Mejor palabra',fmt(c.bestPlay)],['Mejor MULTI','×'+fmt(c.bestMulti)],['Victorias',fmt(c.wins)],['Cartas vistas',(c.bonusesSeen||[]).length+'/54'],['Palabras',fmt(c.words)]].map(([a,b])=>'<div><small>'+a+'</small><strong>'+b+'</strong></div>').join('');
 $('continueBtn').hidden=!E.run||E.run.finished;
}
function renderTitle(){
 $('titleScreen').hidden=!title;$('gameScreen').hidden=title||!E.run;renderCareer();
 document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=!ready());$('continueBtn').disabled=!ready();$('dictionaryStatus').classList.toggle('ready',E.dictionaryReady);
}
function renderBonusStack(r){
 $('bonusCount').textContent=r.bonuses.length+'/'+E.maxBonuses;
 const items=r.bonuses.slice().reverse().map(id=>C.bonuses.find(b=>b.id===id)).filter(Boolean);
 $('bonusStack').innerHTML=items.map((b,i)=>'<button class="mini-bonus type-'+b.type+'" data-bonus-view="'+b.id+'" style="--i:'+i+'">'+cardLevelBadge(b.id)+'<strong>'+esc(b.name)+'</strong><small>'+esc(b.description)+'</small></button>').join('');
}
function wordTileMarkup(t,letter){return tileStyleLabel(t)+'<strong>'+esc(letter)+'</strong><small>'+(t.style==='wild'?0:E.letterValue(letter))+'</small>';}
function renderScoringWord(sc){
 $('wordRow').innerHTML='';(sc.tileDetails||[]).forEach((t,i)=>{const el=document.createElement('div');el.className='word-tile '+t.style+' scoring-tile';el.style.setProperty('--i',i);el.innerHTML=wordTileMarkup(t,t.playedChar||t.char);$('wordRow').appendChild(el);});
 for(let i=(sc.tileDetails||[]).length;i<9;i++){const el=document.createElement('div');el.className='word-tile empty scoring-empty';el.innerHTML='<span>'+(i+1)+'</span>';$('wordRow').appendChild(el);}
}
function renderWord(r){
 const byId=new Map(r.hand.map(t=>[t.id,t]));$('wordRow').innerHTML='';
 for(let i=0;i<9;i++){
  const sel=r.selected[i],t=sel?byId.get(sel.id):null,el=document.createElement(sel?'button':'div');
  if(sel&&t){el.type='button';el.dataset.tile=t.id;el.draggable=!rerollMode&&!scoringAnimation;el.className='word-tile '+t.style+(t.id===selectedPulseId?' entering':'');const letter=sel.char||t.char;el.innerHTML=wordTileMarkup(t,letter);el.title=/^[AEIOUÁÉÍÓÚ]$/i.test(letter)?'Pulsa para poner o quitar tilde':'Pulsa para devolver a la mano';el.addEventListener('click',()=>{if(scoringAnimation)return;/^[AEIOUÁÉÍÓÚ]$/i.test(letter)?E.cycleAccent(t.id):E.select(t.id);});}
  else{el.className='word-tile empty';el.innerHTML='<span>'+(i+1)+'</span>';}
  el.dataset.slot=i;$('wordRow').appendChild(el);
 }
}
function renderHand(r){
 const selected=new Set(r.selected.map(s=>s.id));
 $('hand').innerHTML=r.hand.filter(t=>!selected.has(t.id)).map((t,i)=>{const reroll=r.rerollSelection.includes(t.id);return'<button class="hand-tile '+t.style+' '+(reroll?'reroll-selected':'')+'" data-tile="'+t.id+'" draggable="'+(!rerollMode&&!scoringAnimation)+'" style="--hand-i:'+i+'">'+tileStyleLabel(t)+'<strong>'+esc(t.char)+'</strong><small>'+(t.style==='wild'?0:E.letterValue(t.char))+'</small></button>';}).join('');
 $('handInfo').textContent=r.maxHand+' letras · '+r.hand.length+' en mano';
}
function renderGame(){
 const r=E.run;if(!r)return;const raw=E.draft(),validation=raw?E.validate(raw):null,livePreview=raw?E.score(raw,true):{points:0,multis:1,total:0,effects:[]},preview=scoringAnimation?.score||livePreview;
 $('roundLabel').textContent=r.round+' / '+E.totalRounds();$('modeLabel').textContent=(C.modes[r.mode]?.name||r.mode).toUpperCase();$('runTotal').textContent=fmt(r.totalScore);$('walletValue').textContent=fmt(r.coins)+' ◉';
 $('pointsValue').textContent=fmt(preview.points||0);$('multisValue').textContent=fmt(preview.multis||1);$('scoreValue').textContent=fmt(r.roundScore);$('targetValue').textContent=fmt(r.target);$('goalBig').textContent=fmt(r.target);$('energyValue').textContent=Math.max(0,r.energy);$('rerollCount').textContent=r.rerolls+' ↻';$('bagCount').textContent=r.bag.length;$('scoreProgress').style.width=Math.min(100,r.roundScore/Math.max(1,r.target)*100)+'%';
 $('targetHint').textContent=(r.activeBounty?'APUESTA +'+r.activeBounty+' ◉ · ':'')+'BONUS OBJETIVO · '+r.targetLength+' LETRAS';
 $('categoryHint').textContent=scoringAnimation?'PALABRA FORJADA':validation?.ok?categoryText(validation.analysis):raw?'PALABRA NO VÁLIDA':'FORMA UNA PALABRA';$('categoryHint').classList.toggle('valid',!!validation?.ok||!!scoringAnimation);$('categoryHint').classList.toggle('invalid',!!raw&&!validation?.ok&&!scoringAnimation);
 $('rerollModeBtn').classList.toggle('active',rerollMode);$('rerollTray').textContent=r.rerollSelection.length+' / 3';$('doRerollBtn').disabled=!!scoringAnimation||!rerollMode||!r.rerollSelection.length||r.rerolls<=0;$('playBtn').disabled=!!scoringAnimation||!validation?.ok;$('clearBtn').disabled=!!scoringAnimation||!r.selected.length;
 renderBonusStack(r);scoringAnimation?renderScoringWord(scoringAnimation.score):renderWord(r);renderHand(r);$('effectFloat').innerHTML=(preview.effects||[]).slice(-7).map((e,i)=>'<span style="--i:'+i+'">'+esc(e)+'</span>').join('');$('playfield').classList.toggle('score-resolving',!!scoringAnimation);
 if(scoringAnimation)$('feedback').textContent=scoringAnimation.score.display.toUpperCase()+' · '+fmt(scoringAnimation.score.points)+' × '+fmt(scoringAnimation.score.multis)+' = '+fmt(scoringAnimation.score.total);
 else if(lastMessage)$('feedback').textContent=lastMessage;else if(validation?.ok)$('feedback').textContent='✓ '+raw.toUpperCase()+' · '+categoryText(validation.analysis)+' · '+fmt(livePreview.points)+' × '+fmt(livePreview.multis)+' = '+fmt(livePreview.total);else if(raw)$('feedback').textContent=validation?.message||'Esta combinación no forma una palabra válida.';else $('feedback').textContent=rerollMode?'Selecciona hasta 3 letras de la mano y pulsa ↻.':'Arrastra fichas para formar la palabra o intercambiarlas. Pulsa una vocal para acentuarla.';
 $('saveStatus').textContent=!E.storageOK?'Error de guardado':B.embedded?'LenguArcade · guardado activo':'Guardado local';$('gameExitBtn').hidden=false;renderOverlay();
}
function shopCard(offer){
 const b=C.bonuses.find(x=>x.id===offer.id);if(!b)return'';
 const icon=b.type==='points'?'●':b.type==='multi'?'◆':b.type==='hybrid'?'✦':'↻',full=E.run.bonuses.length>=E.maxBonuses,can=E.run.coins>=offer.price;
 return '<button class="reward-choice shop-offer type-'+b.type+'" data-buy-card="'+b.id+'" '+(!can?'disabled':'')+'><span class="reward-icon">'+icon+'</span><small>CARTA · '+b.type.toUpperCase()+'</small><strong>'+esc(b.name)+'</strong><p>'+esc(b.description)+'</p><em>'+offer.price+' ◉ · '+(full?'COMPRAR Y SUSTITUIR':'COMPRAR')+'</em></button>';
}
function renderIncome(r){
 if(!r.lastIncome){$('incomePanel').innerHTML='<span>Capital inicial</span><strong>'+fmt(r.coins)+' ◉</strong><small>Puedes empezar sin comprar nada.</small>';return;}
 const i=r.lastIncome;$('incomePanel').innerHTML='<span>Ganancias de la ronda</span><strong>+'+fmt(i.total)+' ◉</strong><small>Base '+i.base+' · Energía '+i.energy+' · Interés '+i.interest+(i.bounty?' · Apuesta '+i.bounty:'')+'</small>';
}
function renderEvent(r){
 const panel=$('eventPanel'),id=r.shop?.eventId;if(!id){panel.innerHTML='<div class="no-event"><span class="kicker">EVENTO</span><h3>La calle está tranquila</h3><p>No ha ocurrido nada especial esta vez.</p></div>';return;}
 const ev=C.events.find(x=>x.id===id);if(!ev){panel.innerHTML='';return;}
 if(r.shop.eventResolved){panel.innerHTML='<span class="kicker">EVENTO RESUELTO</span><div class="event-title"><b>'+esc(ev.icon)+'</b><h3>'+esc(ev.name)+'</h3></div><p>'+esc(r.shop.eventResult||'Evento completado.')+'</p>';return;}
 panel.innerHTML='<span class="kicker">EVENTO</span><div class="event-title"><b>'+esc(ev.icon)+'</b><h3>'+esc(ev.name)+'</h3></div><p>'+esc(ev.text)+'</p><div class="event-actions">'+ev.choices.map(c=>'<button data-event-choice="'+c.id+'" '+(r.coins<c.cost?'disabled':'')+'><strong>'+esc(c.label)+(c.cost?' · '+c.cost+' ◉':'')+'</strong><small>'+esc(c.note)+'</small></button>').join('')+'</div>';
}
function renderShop(r){
 const starter=r.shop?.origin==='starter';$('shopWallet').textContent=fmt(r.coins)+' ◉';$('shopBuildCount').textContent=r.bonuses.length+'/'+E.maxBonuses;$('shopRerolls').textContent=r.rerolls+' ↻';$('shopSideTitle').textContent=starter?'Antes de empezar':'Ronda '+r.round+' superada';$('shopKicker').textContent=starter?'TIENDA INICIAL':'TIENDA · RONDA '+r.round;$('shopTitle').textContent=starter?'Prepara tu run':'Gasta, mejora o ahorra';$('shopIntro').textContent=starter?'Todas las cartas cuestan monedas. Puedes comprar una, varias o ninguna y guardar el dinero.':'Compra cartas, depura la bolsa o invierte en tu build. Nada es obligatorio.';
 const next=starter?'EMPEZAR RONDA 1 →':'IR A RONDA '+(r.round+1)+' →';$('leaveShopBtn').textContent=next;$('leaveShopBtnBottom').textContent=next;
 $('shopCards').innerHTML=(r.shop?.cards||[]).length?(r.shop.cards.map(shopCard).join('')):'<div class="sold-out"><strong>Estante vacío</strong><span>Puedes renovar la oferta o seguir a la siguiente ronda.</span></div>';
 $('refreshShopBtn').textContent='↻ Renovar cartas · '+(r.shop?.refreshCost||2)+' ◉';$('refreshShopBtn').disabled=r.coins<(r.shop?.refreshCost||2);
 $('shopOwned').innerHTML=r.bonuses.length?r.bonuses.slice().reverse().map(id=>{const b=C.bonuses.find(x=>x.id===id);return b?'<div>'+cardLevelBadge(id)+'<span>'+esc(b.name)+'</span><small>'+esc(b.description)+'</small></div>':'';}).join(''):'<p>Aún no tienes cartas. También es válido empezar así.</p>';
 renderIncome(r);renderEvent(r);$('shopMessage').textContent=lastMessage||'No estás obligado a comprar nada.';
}
function renderOverlay(){
 const r=E.run;$('overlay').hidden=true;$('shopPanel').hidden=true;$('endPanel').hidden=true;$('collectionPanel').hidden=true;if(!r||scoringAnimation)return;
 if(collectionMode&&document.body.dataset.collectionOpen==='1'){$('overlay').hidden=false;$('collectionPanel').hidden=false;renderCollection();return;}
 if(r.status==='shop'){$('overlay').hidden=false;$('shopPanel').hidden=false;renderShop(r);return;}
 if(r.finished){$('overlay').hidden=false;$('endPanel').hidden=false;const won=r.status==='victory';$('endKicker').textContent=won?'RUN COMPLETADA':'FIN DE LA RUN';$('endTitle').textContent=won?'¡La Forja arde!':'La energía se agotó';$('endScore').textContent=fmt(r.totalScore);$('endStats').innerHTML=[['Ronda',r.round+'/'+E.totalRounds()],['Palabras',r.words.length],['Cartas',r.bonuses.length+'/'+E.maxBonuses],['Monedas',fmt(r.coins)+' ◉'],['Mejor jugada',fmt(Math.max(0,...r.wordLog.map(x=>x.total||0)))],['Rerolls',r.rerolls]].map(([a,b])=>'<div><small>'+a+'</small><strong>'+b+'</strong></div>').join('');$('endlessBtn').hidden=!won;}
}
function renderCollection(){
 const c=E.career,r=E.run;
 if(collectionMode==='history'){$('collectionTitle').textContent='Palabras de la run';$('collectionBody').innerHTML=r?.wordLog?.length?'<div class="history-list">'+r.wordLog.slice().reverse().map(x=>'<div><strong>'+esc(x.word)+'</strong><span>'+fmt(x.points)+' × '+fmt(x.multis)+' = <b>'+fmt(x.total)+'</b></span><small>Ronda '+x.round+'</small></div>').join('')+'</div>':'<p>No hay palabras jugadas todavía.</p>';}
 else if(collectionMode==='achievements'){$('collectionTitle').textContent='Logros y cartas';$('collectionBody').innerHTML='<h3>Logros</h3><div class="achievement-grid">'+C.achievements.map(a=>'<div class="'+(c.achievements.includes(a.id)?'done':'')+'"><span>'+(c.achievements.includes(a.id)?'✦':'◇')+'</span><strong>'+esc(a.title)+'</strong><small>'+esc(a.description)+'</small></div>').join('')+'</div><h3>Cartas descubiertas · '+(c.bonusesSeen||[]).length+'/54</h3><div class="bonus-codex">'+C.bonuses.map(b=>'<div class="'+((c.bonusesSeen||[]).includes(b.id)?'seen':'')+'"><strong>'+esc((c.bonusesSeen||[]).includes(b.id)?b.name:'???')+'</strong><small>'+esc((c.bonusesSeen||[]).includes(b.id)?b.description:'Descúbrela durante una run.')+'</small></div>').join('')+'</div>';}
 else{$('collectionTitle').textContent='Tu build · '+(r?.bonuses?.length||0)+'/'+E.maxBonuses;$('collectionBody').innerHTML=r?.bonuses?.length?'<div class="build-grid">'+r.bonuses.map(id=>{const b=C.bonuses.find(x=>x.id===id);return b?'<div class="type-'+b.type+'">'+cardLevelBadge(id)+'<strong>'+esc(b.name)+'</strong><small>'+esc(b.description)+'</small></div>':'';}).join('')+'</div>':'<p>Aún no tienes cartas en esta run.</p>';}
}
function render(){renderTitle();if(title){$('overlay').hidden=true;$('shopPanel').hidden=true;$('endPanel').hidden=true;$('collectionPanel').hidden=true;return;}if(E.run)renderGame();}
function openCollection(mode){collectionMode=mode;document.body.dataset.collectionOpen='1';render();}
function closeCollection(){document.body.dataset.collectionOpen='0';render();}
function openDialog(html,state){choiceState=state;$('choiceBody').innerHTML=html;$('choiceDialog').showModal();}
function openWild(id,index=null){const letters=[...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'];openDialog('<h2>Elige la letra del comodín</h2><div class="letter-choice">'+letters.map(c=>'<button data-letter="'+c+'">'+c+'</button>').join('')+'</div>',{type:'wild',id,index});}
function openReplacement(newId){
 const incoming=C.bonuses.find(x=>x.id===newId),offer=E.run.shop.cards.find(x=>x.id===newId);
 openDialog('<h2>Tu build está completa</h2><p class="replace-copy">Comprar <strong>'+esc(incoming?.name||'esta carta')+'</strong> cuesta '+fmt(offer?.price)+' ◉. Elige cuál de tus 5 cartas quieres sustituir.</p><div class="replace-grid">'+E.run.bonuses.map(id=>{const b=C.bonuses.find(x=>x.id===id);return b?'<button data-replace="'+id+'">'+cardLevelBadge(id)+'<strong>'+esc(b.name)+'</strong><small>'+esc(b.description)+'</small></button>':'';}).join('')+'</div>',{type:'replace',newId});
}
function openUpgrade(){
 const ids=E.run.bonuses.filter(id=>E.cardLevel(id)<3);
 const html=ids.length?ids.map(id=>{const b=C.bonuses.find(x=>x.id===id),cost=E.upgradePrice(id);return'<button data-upgrade="'+id+'" '+(E.run.coins<cost?'disabled':'')+'>'+cardLevelBadge(id)+'<strong>'+esc(b?.name||id)+' → nivel '+['','I','II','III'][E.cardLevel(id)+1]+'</strong><small>'+cost+' ◉ · mejora su efecto.</small></button>';}).join(''):'<p>Todas tus cartas están al máximo o todavía no tienes ninguna.</p>';
 openDialog('<h2>Templar carta</h2><p class="replace-copy">Cada nivel refuerza el efecto de la carta. Las cartas de puntuación ganan potencia; las de utilidad mejoran su recurso. Máximo nivel III.</p><div class="replace-grid">'+html+'</div>',{type:'upgrade'});
}
function openRemoveLetter(){
 const inv=E.inventory();openDialog('<h2>Depurar bolsa · 4 ◉</h2><p class="replace-copy">Elige una copia de una letra para eliminarla permanentemente de esta run.</p><div class="letter-inventory">'+inv.map(x=>'<button data-remove-letter="'+x.char+'" '+(E.run.coins<E.serviceCosts.remove?'disabled':'')+'><strong>'+esc(x.char)+'</strong><small>'+x.count+' copias · valor '+x.value+'</small></button>').join('')+'</div>',{type:'remove'});
}
function openEngrave(style){
 const labels={bold:'Grabar +P · 4 ◉',italic:'Grabar +MULTI · 4 ◉',gold:'Dorar ficha · 7 ◉'},cost=E.serviceCosts[style];
 const tiles=E.run.hand.filter(t=>!['wild','bang'].includes(t.style));
 openDialog('<h2>'+labels[style]+'</h2><p class="replace-copy">Elige una ficha de tu mano. La mejora permanecerá en esa ficha cuando vuelva a la bolsa.</p><div class="tile-choice">'+tiles.map(t=>'<button data-engrave="'+t.id+'" '+(E.run.coins<cost?'disabled':'')+'>'+tileStyleLabel(t)+'<strong>'+esc(t.char)+'</strong><small>'+esc(t.style)+'</small></button>').join('')+'</div>',{type:'engrave',style});
}
function closeDialog(){choiceState=null;$('choiceDialog').close();}
function finishScoreAnimation(q){
 scoringAnimation={score:q.score};lastMessage=q.score.display.toUpperCase()+' · '+fmt(q.score.points)+' × '+fmt(q.score.multis)+' = '+fmt(q.score.total);render();tone('score');
 setTimeout(()=>{document.querySelectorAll('.mini-bonus').forEach((el,i)=>{el.style.setProperty('--score-i',i);el.classList.add('card-trigger');});},330);
 setTimeout(()=>{scoringAnimation=null;render();B.checkpoint('word');B.result();},1150);
}
function playCurrent(){if(scoringAnimation)return;playingNow=true;const q=E.play();playingNow=false;if(!q.ok){lastMessage=q.message;tone('error');render();return;}finishScoreAnimation(q);}
function start(mode){title=false;rerollMode=false;lastMessage='';scoringAnimation=null;closeCollection();E.newRun(mode);B.start();tone('reward');render();}
function shopActionResult(q,success){lastMessage=q?.message||success||'';tone(q?.ok?'coin':'error');if(q?.ok)B.checkpoint('shop');render();}

let draggedTile=null;
function canDrag(){return !title&&E.run?.status==='play'&&!E.run.finished&&!rerollMode&&!scoringAnimation&&!$('choiceDialog').open&&$('overlay').hidden;}
function clearDrag(){
 draggedTile=null;document.querySelectorAll('.drag-source,.drop-target').forEach(el=>el.classList.remove('drag-source','drop-target'));
}
$('playfield').addEventListener('dragstart',e=>{
 const tile=e.target.closest('[data-tile]');
 if(!tile||!canDrag()){e.preventDefault();return;}
 draggedTile=Number(tile.dataset.tile);e.dataTransfer.effectAllowed='move';
 e.dataTransfer.setData('text/plain',String(draggedTile));tile.classList.add('drag-source');
});
$('playfield').addEventListener('dragover',e=>{
 if(draggedTile===null||!canDrag())return;
 const target=e.target.closest('[data-slot],.hand-zone');
 document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));
 if(!target)return;
 e.preventDefault();e.dataTransfer.dropEffect='move';target.classList.add('drop-target');
});
$('playfield').addEventListener('drop',e=>{
 const id=draggedTile,target=e.target.closest('[data-slot],.hand-zone');
 if(id===null||!target||!canDrag()){clearDrag();return;}
 e.preventDefault();clearDrag();
 if(target.matches('.hand-zone')){
  if(E.run.selected.some(s=>s.id===id))E.select(id);
 }else{
  const index=Number(target.dataset.slot),tile=E.run.hand.find(t=>t.id===id);
  if(!tile)return;
  if((tile.style==='wild'||tile.char==='*')&&!E.run.selected.some(s=>s.id===id))openWild(id,index);
  else E.placeTile(id,index);
 }
 tone('select');
});
window.addEventListener('dragend',clearDrag);

document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>start(b.dataset.mode)));
$('continueBtn').addEventListener('click',()=>{title=false;lastMessage='';B.start();render();});
function returnToTitle(){clearDrag();closeDialog();title=true;rerollMode=false;scoringAnimation=null;E.save();B.checkpoint('menu');render();}
$('menuBtn').addEventListener('click',returnToTitle);
$('exitBtn').addEventListener('click',returnToTitle);$('gameExitBtn').addEventListener('click',returnToTitle);
$('soundBtn').addEventListener('click',()=>{sound=!sound;$('soundBtn').textContent='♫ '+(sound?'Sí':'No');tone();});
$('hand').addEventListener('click',e=>{const b=e.target.closest('[data-tile]');if(!b||!E.run||scoringAnimation)return;const id=Number(b.dataset.tile),t=E.run.hand.find(x=>x.id===id);tone('select');if(rerollMode){E.toggleReroll(id);return;}selectedPulseId=id;if(t?.style==='wild'||t?.char==='*')openWild(id);else E.select(id);setTimeout(()=>{selectedPulseId=null;},260);});
$('clearBtn').addEventListener('click',()=>{lastMessage='';E.clear();});$('playBtn').addEventListener('click',playCurrent);
$('rerollModeBtn').addEventListener('click',()=>{if(scoringAnimation)return;rerollMode=!rerollMode;if(!rerollMode&&E.run?.rerollSelection?.length){for(const id of [...E.run.rerollSelection])E.toggleReroll(id);}lastMessage=rerollMode?'Modo reroll: selecciona hasta 3 letras.':'';render();});
$('doRerollBtn').addEventListener('click',()=>{const q=E.rerollLetters();lastMessage=q.ok?'Letras renovadas.':q.message;if(q.ok)rerollMode=false;tone(q.ok?'select':'error');render();});
$('shopCards').addEventListener('click',e=>{const b=e.target.closest('[data-buy-card]');if(!b)return;const q=E.buyCard(b.dataset.buyCard);if(q.needsReplace){openReplacement(b.dataset.buyCard);return;}shopActionResult(q,q.ok?'Carta comprada.':'');});
$('refreshShopBtn').addEventListener('click',()=>{const q=E.refreshShop();shopActionResult(q,q.ok?'Oferta renovada.':'');});
function leaveShop(){const q=E.leaveShop();lastMessage='';if(q.ok){tone('reward');B.checkpoint('leave_shop');}else lastMessage=q.message||'';render();}
$('leaveShopBtn').addEventListener('click',leaveShop);$('leaveShopBtnBottom').addEventListener('click',leaveShop);
$('upgradeCardBtn').addEventListener('click',openUpgrade);$('removeLetterBtn').addEventListener('click',openRemoveLetter);$('engravePointsBtn').addEventListener('click',()=>openEngrave('bold'));$('engraveMultiBtn').addEventListener('click',()=>openEngrave('italic'));$('goldTileBtn').addEventListener('click',()=>openEngrave('gold'));
$('eventPanel').addEventListener('click',e=>{const b=e.target.closest('[data-event-choice]');if(!b)return;const q=E.resolveEvent(b.dataset.eventChoice);lastMessage=q.ok?q.result:q.message;tone(q.ok?'reward':'error');if(q.ok)B.checkpoint('event');render();});
$('bonusDeckBtn').addEventListener('click',()=>openCollection('bonuses'));$('bonusStack').addEventListener('click',()=>openCollection('bonuses'));$('historyBtn').addEventListener('click',()=>openCollection('history'));$('achievementsBtn').addEventListener('click',()=>openCollection('achievements'));$('closeCollectionBtn').addEventListener('click',closeCollection);
$('againBtn').addEventListener('click',()=>start(E.run?.mode||'normal'));
$('endMenuBtn').addEventListener('click',()=>{title=true;rerollMode=false;scoringAnimation=null;lastMessage='';E.save();B.checkpoint('end_menu');render();});
$('endlessBtn').addEventListener('click',()=>{const ok=E.continueEndless();if(ok){title=false;lastMessage='Modo infinito activado: los objetivos seguirán creciendo.';tone('reward');B.checkpoint('endless');render();}else{lastMessage='No se ha podido iniciar el modo infinito.';render();}});
$('choiceBody').addEventListener('click',e=>{
 const letter=e.target.closest('[data-letter]'),replace=e.target.closest('[data-replace]'),upgrade=e.target.closest('[data-upgrade]'),remove=e.target.closest('[data-remove-letter]'),engrave=e.target.closest('[data-engrave]');
 if(letter&&choiceState?.type==='wild'){const {id,index}=choiceState;closeDialog();index===null?E.select(id,letter.dataset.letter):E.placeTile(id,index,letter.dataset.letter);return;}
 if(replace&&choiceState?.type==='replace'){const newId=choiceState.newId,old=replace.dataset.replace;closeDialog();const q=E.buyCard(newId,old);shopActionResult(q,q.ok?'Carta comprada y build actualizada.':'');return;}
 if(upgrade&&choiceState?.type==='upgrade'){const id=upgrade.dataset.upgrade;const q=E.upgradeCard(id);if(q.ok)closeDialog();shopActionResult(q,q.ok?'Carta templada a nivel '+q.level+'.':'');return;}
 if(remove&&choiceState?.type==='remove'){const q=E.removeLetter(remove.dataset.removeLetter);if(q.ok)closeDialog();shopActionResult(q,q.ok?'Letra '+q.char+' eliminada de la bolsa.':'');return;}
 if(engrave&&choiceState?.type==='engrave'){const style=choiceState.style,q=E.engraveTile(Number(engrave.dataset.engrave),style);if(q.ok)closeDialog();shopActionResult(q,q.ok?'Ficha mejorada permanentemente.':'');}
});
$('cancelChoice').addEventListener('click',closeDialog);
window.addEventListener('lexoma:change',()=>{if(!playingNow)render();});
window.addEventListener('keydown',e=>{if(title||!E.run||E.run.status!=='play'||$('choiceDialog').open||scoringAnimation||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='Escape'){E.clear();e.preventDefault();return;}if(e.key==='Enter'){if(E.validate(E.draft()).ok)playCurrent();e.preventDefault();return;}if(/^[a-zñ]$/iu.test(e.key)){const c=e.key.toUpperCase(),t=E.run.hand.find(t=>!E.run.selected.some(s=>s.id===t.id)&&!E.run.rerollSelection.includes(t.id)&&(t.char===c||t.char==='*'));if(t){selectedPulseId=t.id;if(t.char==='*')openWild(t.id);else E.select(t.id);setTimeout(()=>{selectedPulseId=null;},260);e.preventDefault();}}});
E.loadDictionary(t=>{$('dictionaryStatus').textContent=t;render();}).finally(render);render();
})();