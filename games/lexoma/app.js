(() => {
'use strict';
const E=window.LexomaEngine,L=window.LexomaLanguage,C=window.LexomaContent,B=window.LexomaBridge,$=id=>document.getElementById(id);
let title=true,showIdeas=false,message='',sound=false,audio=null,chooser=null,codexOpen=false;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>Number(n||0).toLocaleString('es-ES');
function tone(kind){if(!sound)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type='sine';o.frequency.setValueAtTime({click:320,forge:550,hit:150,win:750}[kind]||300,audio.currentTime);o.frequency.exponentialRampToValueAtTime(kind==='win'?1100:100,audio.currentTime+.16);g.gain.setValueAtTime(.05,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.2);o.start();o.stop(audio.currentTime+.21);}catch{}}
function tell(text){message=text;render();}
function choose(heading,options,callback){chooser=callback;$('choice-content').innerHTML=`<h2>${escape(heading)}</h2><div class="choice-grid">${options.map((o,i)=>`<button data-choice="${i}">${escape(o.label)}${o.detail?`<small>${escape(o.detail)}</small>`:''}</button>`).join('')}</div>`;$('choice').showModal();}
function plan(word){const available=[...E.run.hand],chosen=[];for(const char of word.toUpperCase()){
 const raw=char.normalize('NFD').replace(/[\u0300-\u0301]/g,'').normalize('NFC');
 let i=available.findIndex(t=>t.char===char);
 if(i>=0){chosen.push({id:available.splice(i,1)[0].id});continue;}
 if(/[ÁÉÍÓÚ]/.test(char)){const vowel=available.findIndex(t=>t.char===raw),accent=available.findIndex(t=>t.char==='´');if(vowel>=0&&accent>=0){const a=available[vowel],b=available[accent];chosen.push({id:a.id},{id:b.id});available.splice(Math.max(vowel,accent),1);available.splice(Math.min(vowel,accent),1);continue;}}
 i=available.findIndex(t=>t.char==='*');if(i<0)return null;chosen.push({id:available.splice(i,1)[0].id,char});
 }return chosen;}
function render(){
 const r=E.run,c=E.career,ready=B.initialized;
 $('title').hidden=!title;$('battle').hidden=title||!r;$('menu').hidden=title;$('exit').hidden=!B.embedded;
 $('new').disabled=!ready;$('continue').hidden=!r||r.finished;$('continue').disabled=!ready;
 $('save-status').textContent=!E.storageOK?'No se pudo guardar en este navegador':!ready?'Conectando con LenguArcade…':B.embedded?'Guardado LenguArcade activo':'Partida guardada en este navegador';
 $('career').innerHTML=`<span><b>${number(c.bestScore)}</b>Récord</span><span><b>${c.games}</b>Partidas</span><span><b>${c.wins}</b>Victorias</span><span><b>${c.achievements.length}/7</b>Logros</span>`;
 if(title||!r){if(!codexOpen)$('overlay').hidden=true;return;}
 const e=E.enemy(),calc=E.calculate(),combat=r.status==='combat';
 $('hud').innerHTML=`<div><small>INTEGRIDAD</small><strong class="integrity">♥ ${r.integrity}<small>/ 100</small></strong></div><div><small>TINTA</small><strong class="ink">◈ ${r.ink}</strong></div><div><small>ENCUENTRO</small><strong>${Math.min(r.node+1,C.route.length)} / ${C.route.length}</strong></div><div><small>RONDA</small><strong>${r.round} / ${e?.rounds||'—'}</strong></div><div><small>PUNTOS DE LA RUN</small><strong>${number(r.score)}</strong></div>`;
 $('route').innerHTML=C.route.map((id,i)=>`<span class="${i===r.node?'active':i<r.node?'done':''}">${id==='shop'?'◇ Tienda':id==='morfax'?'♛ Morfax':id==='elite'?'✦ Élite':'◆ '+(i+1)}</span>`).join('<b>›</b>');
 $('enemy-title').textContent=e?.title||'EL MERCADER';$('enemy-name').textContent=e?.name||'Tienda de Tinta';
 $('enemy-art').src=`assets/${e?.art||'escriba'}.svg`;$('enemy-art').alt=e?.name||'Mercader';
 $('enemy-health').innerHTML=e?`<div class="health"><i style="width:${r.enemyHp/e.hp*100}%"></i></div><div class="health-label"><span>Resistencia</span><b>${number(r.enemyHp)} / ${number(e.hp)}</b></div>`:'';
 $('enemy-rule').textContent=e?.id==='morfax'?`Fase ${E.phase()}: ${E.phase()===1?'forja libre':E.phase()===2?L.categories[r.bossCategory][0]+' +100 por carta':'tres categorías distintas → ×1,5'}`:e?.rule||'Refuerza tu bolsa y elige tu estrategia.';
 $('phrase').innerHTML=r.phrase.length?r.phrase.map((w,i)=>`<article class="word-card ${calc.spans?.some(([a,b])=>i>=a&&i<b)?'connected':''}" style="--category:${L.categories[w.category][2]}"><b>${escape(w.word)}</b><small>${L.categories[w.category][1]} ${L.categories[w.category][0]}</small><div class="word-controls"><button data-edit="left" data-index="${i}" aria-label="Mover ${escape(w.word)} a la izquierda" ${i===0?'disabled':''}>‹</button><button data-edit="remove" data-index="${i}" aria-label="Retirar ${escape(w.word)}">×</button><button data-edit="right" data-index="${i}" aria-label="Mover ${escape(w.word)} a la derecha" ${i===r.phrase.length-1?'disabled':''}>›</button></div></article>`).join(''):'<div class="empty">Cada palabra es una pieza.<br>Cada frase, un ataque.</div>';
 $('analysis').innerHTML=r.phrase.length?(calc.valid?calc.structures.map(s=>`<span class="tag">${escape(s)}</span>`).join(''):calc.errors.map(s=>`<span class="tag error">${escape(s)}</span>`).join('')):'<span class="tag">Construye un SN o una oración sencilla</span>';
 $('preview-score').textContent=number(calc.total);
 const scored=r.phrase.length?calc:r.last;
 $('score-steps').innerHTML=(scored?.steps||[]).map((s,i)=>`<div class="score-step ${r.phrase.length?'':'reveal'}" style="--i:${i}"><span>${escape(s.label)}</span><b>${s.op}${number(s.value)}</b></div>`).join('');
 $('message').textContent=message||(!r.words?'Prueba EL → MAGO → CORRE. Forja cada palabra por separado.':r.last?.text?`Último ataque: «${r.last.text}» · ${number(r.last.total)} puntos.`:'Añade un verbo para crear una oración. Los colores muestran las categorías.');
 $('relics').innerHTML=r.relics.map(id=>{const q=C.relics.find(x=>x.id===id);return`<div class="relic"><img src="assets/${q.icon}.svg" alt=""><div><b>${q.name}</b><small>${q.description}</small></div></div>`;}).join('');
 $('combo').textContent='×'+number(r.combo);
 $('bag-info').textContent=`Bolsa ${r.bag.length} · Reciclaje ${r.discard.length} · Descartes ${r.discards}`;
 const d=E.draft();$('draft').textContent=d|| (d===null?'Tilde mal colocada':'Selecciona tus letras');
 $('hand').innerHTML=r.hand.map(t=>`<button class="tile ${r.selection.some(x=>x.id===t.id)?'selected':''} ${['*','´'].includes(t.char)?'special':''}" data-tile="${t.id}" aria-label="${t.char==='*'?'Comodín':t.char==='´'?'Tilde':t.char}" aria-pressed="${r.selection.some(x=>x.id===t.id)}" ${combat?'':'disabled'}>${t.char}<small>${['*','´'].includes(t.char)?'✧':L.value(t.char.toLowerCase())}</small></button>`).join('');
 $('tutorial').textContent=!r.words?'1. Forma EL y pulsa Forjar.':r.phrase.length===1?'2. Añade un sustantivo: MAGO.':r.phrase.length===2?'3. Añade CORRE y finaliza la frase.':'Varía las estructuras para aumentar tu combo.';
 $('discard').textContent=`Descartar (${r.discards})`;
 for(const id of ['forge','finish','discard','pass','clear','ideas'])$(id).disabled=!combat||!ready;
 $('forge').disabled=!combat||!r.selection.length;$('finish').disabled=!combat||!r.phrase.length;
 $('suggestions').hidden=!showIdeas;if(showIdeas&&combat){const list=[...L.lexicon.keys()].filter(w=>w.length>=2&&w.length<=10&&plan(w)).sort((a,b)=>a.length-b.length).slice(0,8);$('suggestions').innerHTML=list.map(w=>`<button data-suggestion="${escape(w)}">${escape(w.toUpperCase())}</button>`).join('')||'<small>Prueba un descarte o cierra la ronda para renovar la mano.</small>';}
 renderOverlay();
}
function renderOverlay(){const r=E.run;if(codexOpen)return;
 $('overlay').hidden=r.status==='combat';if(r.status==='combat')return;
 if(r.status==='shop'){
 $('overlay-content').innerHTML=`<span class="eyebrow">EL MERCADER DE LETRAS</span><h2>Una buena build se escribe aquí.</h2><p>Tienes <strong>${r.ink} Tinta</strong>. Las fichas compradas quedan arriba de la bolsa para el próximo robo.</p><div class="shop-grid">${r.shopStock.map(id=>{const q=C.relics.find(x=>x.id===id),owned=r.relics.includes(id);return`<div class="shop-item"><img src="assets/${q.icon}.svg" alt=""><div><b>${q.name}</b><small>${q.description}</small></div><button data-buy="relic" data-value="${id}" ${owned||r.ink<q.price?'disabled':''}>${owned?'Tuya':q.price+' ◈'}</button></div>`;}).join('')}</div><div class="shop-tools"><label>Letra <select id="shop-letter">${[...'AEIOULMNRSTBCDFGHJPQVXYZÑ'].map(c=>`<option>${c}</option>`).join('')}</select></label><button data-buy="letter" ${r.ink<20?'disabled':''}>Comprar · 20</button><button data-buy="wild" ${r.ink<40?'disabled':''}>Comodín · 40</button><button data-buy="accent" ${r.ink<25?'disabled':''}>Tilde · 25</button></div><div class="shop-tools"><label>Eliminar de la bolsa <select id="shop-remove">${[...new Set(r.bag)].sort().map(c=>`<option>${escape(c)}</option>`).join('')}</select></label><button data-buy="remove" ${r.ink<25||!r.bag.length?'disabled':''}>Eliminar · 25</button></div><p class="modal-note" id="shop-note">${escape(message||'Las reliquias cambian cómo puntúan tus construcciones.')}</p><button class="gold next" data-next>Volver al camino</button>`;
 }else if(r.status==='reward'){
 $('overlay-content').innerHTML=`<span class="eyebrow">ENCUENTRO SUPERADO</span><h2>${escape(E.enemy().name)} derrotado.</h2><div class="win-score">${number(r.last?.total)} <small>puntos</small></div><p>+${E.enemy().reward} Tinta · Integridad ${r.integrity}/100</p><p>Tu ataque: «${escape(r.last?.text||'')}»</p><button class="gold next" data-next>${C.route[r.node+1]==='shop'?'Visitar al mercader':'Siguiente encuentro'}</button>`;
 }else{
 $('overlay-content').innerHTML=`<span class="eyebrow">${r.status==='victory'?'LA FORJA ES TUYA':'VOLVERÁS MÁS FUERTE'}</span><h2>${r.status==='victory'?'¡Morfax derrotado!':'La tinta se ha apagado.'}</h2><div class="win-score">${number(r.score)}</div><p>${r.words} palabras · ${r.phrases} frases · Combo máximo ×${number(r.bestCombo)}</p><p>Récord: ${number(E.career.bestScore)} · ${E.achievements.length} logros descubiertos.</p><button class="gold next" data-title>Volver al menú</button>`;
 }
}
function doForge(index){const result=E.forge(index);if(result.ok){message=`${result.word.toUpperCase()} forjada. ${L.categories[E.run.phrase.at(-1).category][0]} · +${L.value(result.word)} base.`;tone('forge');}else message=result.message;render();}
function forge(){const analyses=L.lookup(E.draft()||'');if(analyses.length>1){choose('Elige el uso de tu palabra',analyses.map(a=>({label:L.categories[a.category][0],detail:[a.lemma,a.gender==='m'?'masculino':a.gender==='f'?'femenino':'',a.number==='s'?'singular':a.number==='p'?'plural':'',a.tense,a.person?`${a.person}.ª persona`:null].filter(Boolean).join(' · ')})),doForge);}else doForge(0);}
$('new').addEventListener('click',()=>{function begin(){title=false;message='';E.start();B.start();render();}if(E.run&&!E.run.finished)choose('¿Empezar una partida nueva?',[{label:'Continuar la actual'},{label:'Empezar otra',detail:'Sustituye la partida en curso; conserva tus logros.'}],i=>{if(i===1)begin();else{title=false;render();}});else begin();});
$('continue').addEventListener('click',()=>{title=false;message='';B.start();render();});
function menu(){title=true;codexOpen=false;E.save();B.checkpoint('menu');render();}
$('menu').addEventListener('click',menu);$('brand').addEventListener('click',e=>{e.preventDefault();menu();});$('exit').addEventListener('click',()=>B.saveAndExit());
$('sound').addEventListener('click',()=>{sound=!sound;$('sound').textContent='Sonido: '+(sound?'sí':'no');tone('click');});
$('clear').addEventListener('click',()=>{message='';E.clear();});$('forge').addEventListener('click',forge);
$('discard').addEventListener('click',()=>{const q=E.discard();tell(q.ok?'Mano renovada. Las fichas vuelven al ciclo de bolsa.':q.message);});
$('pass').addEventListener('click',()=>choose('Cerrar esta ronda',[{label:'Seguir construyendo'},{label:'Renovar la mano',detail:'Pierdes las cartas actuales y una ronda. Agotar las rondas resta Integridad.'}],i=>{if(i===1){message='Nueva mano. Busca una combinación distinta.';E.pass();B.result();render();}}));
$('finish').addEventListener('click',()=>{const q=E.finish();if(q.ok){message=`${number(q.result.total)} puntos · ${q.result.structures.join(' · ')}`;tone(E.run.status==='combat'?'hit':'win');$('damage').textContent='−'+number(q.result.total);$('damage').classList.remove('burst');void $('damage').offsetWidth;$('damage').classList.add('burst');$('enemy-art').classList.add('hit');setTimeout(()=>$('enemy-art').classList.remove('hit'),300);B.checkpoint('phrase');B.result();}else message=q.message;render();});
$('ideas').addEventListener('click',()=>{showIdeas=!showIdeas;$('ideas').textContent=showIdeas?'Ocultar ideas':'Ver ideas';render();});
$('hand').addEventListener('click',e=>{const b=e.target.closest('[data-tile]');if(!b)return;const id=Number(b.dataset.tile),t=E.run.hand.find(x=>x.id===id);tone('click');if(t.char==='*'&&!E.run.selection.some(x=>x.id===id)){choose('Tu comodín puede ser…',[...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZÁÉÍÓÚÜ'].map(c=>({label:c})),i=>E.select(id,[...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZÁÉÍÓÚÜ'][i]));}else E.select(id);});
$('phrase').addEventListener('click',e=>{const b=e.target.closest('[data-edit]');if(b)E.edit(Number(b.dataset.index),b.dataset.edit);});
$('suggestions').addEventListener('click',e=>{const b=e.target.closest('[data-suggestion]');if(!b)return;const tiles=plan(b.dataset.suggestion);if(!tiles)return;E.clear();for(const t of tiles)E.select(t.id,t.char);});
$('overlay-content').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-next')){message='';E.next();tone('click');}if(b.hasAttribute('data-title'))menu();if(b.dataset.buy){const kind=b.dataset.buy,value=kind==='letter'?$('shop-letter').value:kind==='remove'?$('shop-remove').value:b.dataset.value;const q=E.purchase(kind,value);tell(q.ok?'Compra realizada. Tu build está preparada.':q.message);}});
$('choice-content').addEventListener('click',e=>{const b=e.target.closest('[data-choice]');if(!b)return;const cb=chooser;chooser=null;$('choice').close();cb?.(Number(b.dataset.choice));});$('cancel-choice').addEventListener('click',()=>$('choice').close());
$('codex').addEventListener('click',()=>{codexOpen=true;$('overlay').hidden=false;$('overlay-content').innerHTML=`<span class="eyebrow">TU CÓDICE</span><h2>Logros de la forja</h2><div class="shop-grid">${C.achievements.map(a=>`<div class="shop-item"><span>${E.career.achievements.includes(a.id)?'✦':'◇'}</span><div><b>${a.title}</b><small>${a.description}</small></div></div>`).join('')}</div><button class="next" data-title>Volver</button>`;});
window.addEventListener('lexoma:change',render);
window.addEventListener('keydown',e=>{if(title||$('choice').open||E.run?.status!=='combat'||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='Escape'){E.clear();e.preventDefault();return;}if(e.key==='Enter'&&e.target===document.body){forge();e.preventDefault();return;}if(/^[a-zñáéíóúü]$/iu.test(e.key)){const t=E.run.hand.find(t=>t.char===e.key.toUpperCase()&&!E.run.selection.some(x=>x.id===t.id));if(t){E.select(t.id);e.preventDefault();}}});
render();
})();
