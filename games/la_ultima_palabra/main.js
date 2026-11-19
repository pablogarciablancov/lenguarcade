import {drawScene} from './art.js?v=4';
import {BUILDINGS,WAVES,UPGRADES,FIELD,buildingAt,createState,price,build,repair,startWave,answer,selectUpgrade,step} from './core.js?v=4';
import {QUESTIONS,freshDeck,checkAnswer} from './questions.js?v=2';
import {BRANCHES,earnedSeals,buySkill,applySkills} from './tree.js?v=2';

const $=id=>document.getElementById(id),canvas=$('battle'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const params=new URLSearchParams(location.search),embedded=params.get('la')==='1'||params.get('lenguarcade')==='1',channel=params.get('channel')||'';
let state=createState(),selected='guard',hover=null,deck=[],question=-1,lastQuestion=-1,locked=false,paused=false,pausedBeforeTree=false,lastFrame=0,noticeTimer=0,started=false,runId='',reported=false,host=null,origin='*',profile=null,student=null,initialized=!embedded,inFlight=null,queue=[];

function uuid(){return crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;}
function post(type,payload={}){if(!embedded||!channel)return;const message={namespace:'lenguarcade-game',channel,gameId:'la_ultima_palabra',type,payload};if(host){host.postMessage(message,origin);return;}let w=window;for(let i=0;i<5;i++){if(w.parent===w)break;w=w.parent;w.postMessage(message,'*');}}
function ancestor(source){let w=window;for(let i=0;i<5;i++){if(w.parent===w)break;w=w.parent;if(w===source)return true;}return false;}
function saveData(){return {version:2,best:profile?.best||0,completed:profile?.completed||0,seals:profile?.seals||0,tree:profile?.tree||{},run:started&&state.phase!=='won'&&state.phase!=='lost'?JSON.parse(JSON.stringify(state)):null,runId,reported};}
function persist(){if(!embedded)try{localStorage.setItem('lenguarcade_la_ultima_palabra_v1',JSON.stringify(saveData()));}catch{}}
function player(result=false){const tries=state.correct+state.errors,accuracy=tries?Math.round(100*state.correct/tries):0;
  return {role:'primary',outcome:result?(state.phase==='won'?'victory':'finished'):'checkpoint',score:0,correct:result?state.correct:0,errors:result?state.errors:0,attempts:result?tries:0,accuracy,grade:accuracy/10,percentage:Math.round(state.wave/WAVES.length*100),metrics:{mode:'asedio',wave:state.wave,wall:state.wall,kills:state.kills,seconds:Math.round(state.seconds),correct:state.correct,errors:state.errors},achievements:[],save:saveData()};}
function pump(){if(inFlight||!queue.length)return;inFlight=queue.shift();inFlight.sent=Date.now();post(inFlight.type,inFlight.payload);}
function enqueue(type,payload){if(!embedded||!initialized)return;queue.push({type,payload});pump();}
function checkpoint(reason){persist();enqueue('CHECKPOINT',{checkpointId:`la_ultima_palabra_cp_${uuid()}`,matchId:runId||'la_ultima_palabra_profile',reason,players:[player()]});}
function result(){if(reported)return;reported=true;persist();enqueue('RESULT',{resultId:`la_ultima_palabra_result_${runId}`,matchId:runId,outcome:state.phase==='won'?'victory':'finished',players:[player(true)]});}
function init(payload={}){if(initialized&&embedded)return;student=payload.student||{};profile=payload.save&&typeof payload.save==='object'?payload.save:null;
  if(!embedded)try{profile=JSON.parse(localStorage.getItem('lenguarcade_la_ultima_palabra_v1'))||{};}catch{profile={};}
  profile||={};initialized=true;if(profile.version===2&&profile.run&&['prep','upgrade','battle'].includes(profile.run.phase)){state=profile.run;started=true;runId=profile.runId||uuid();reported=!!profile.reported;$('screen').hidden=true;$('command').hidden=false;$('pauseButton').hidden=false;chooseQuestion();refresh();}
  if(embedded)post('INITIALIZED',{profileId:student.studentId||'',restored:!!payload.save});}
if(embedded){try{const bootstrap=JSON.parse(window.name||'null');if(bootstrap?.namespace==='lenguarcade-bootstrap'&&bootstrap.channel===channel&&bootstrap.gameId==='la_ultima_palabra'){window.name='';init(bootstrap.payload||{});}}catch{}
  window.addEventListener('message',e=>{const m=e.data;if(!ancestor(e.source)||m?.namespace!=='lenguarcade-host'||m.channel!==channel||(m.gameId&&m.gameId!=='la_ultima_palabra'))return;host=e.source;origin=e.origin==='null'?'*':e.origin;
    if(m.type==='INIT'){init(m.payload||{});return;}if(!initialized)return;
    if(m.type==='REQUEST_CHECKPOINT')checkpoint('host_request');
    if(m.type==='REQUEST_EXIT'){paused=true;checkpoint('exit');}
    if(['SAVE_CONFIRMED','CHECKPOINT_CONFIRMED'].includes(m.type)&&inFlight){const id=m.payload?.resultId||m.payload?.checkpointId;if(id===(inFlight.payload.resultId||inFlight.payload.checkpointId)){const exit=inFlight.payload.reason==='exit';inFlight=null;pump();if(exit)post('CLOSE_READY',{saved:true,checkpointId:id});}}
    if(['SAVE_FAILED','CHECKPOINT_FAILED'].includes(m.type))notice('Guardado pendiente · se reintentará');
  });
  const ready=setInterval(()=>{if(initialized){clearInterval(ready);return;}post('READY',{version:1});},1500);post('READY',{version:1});
  setInterval(()=>{if(inFlight&&Date.now()-inFlight.sent>15000){inFlight.sent=Date.now();post(inFlight.type,inFlight.payload);}},5000);
}else init();

function notice(message){$('notice').textContent=message;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').textContent='',2100);}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function chooseQuestion(){if(!deck.length)deck=freshDeck(lastQuestion);question=deck.pop();lastQuestion=question;locked=false;renderQuestion();}
function renderQuestion(){const q=QUESTIONS[question];if(!q)return;const choices=q.typed?`<form id="textForm" class="text-answer"><input id="textInput" autocomplete="off" spellcheck="false" aria-label="Escribe la respuesta" maxlength="35"><button>CONFIRMAR</button></form>`:`<div class="answer-list">${q.choices.map((c,i)=>`<button type="button" data-answer="${i}">${escapeHtml(c)}</button>`).join('')}</div>`;
  $('challenge').innerHTML=`<span class="tag">${q.topic} · + TINTA</span><h2>${escapeHtml(q.prompt)}</h2>${choices}`;
  $('challenge').querySelectorAll('[data-answer]').forEach(b=>b.addEventListener('click',()=>submit(b.dataset.answer)));
  $('textForm')?.addEventListener('submit',e=>{e.preventDefault();submit($('textInput').value);});}
function submit(value){if(locked||paused||!started||['won','lost'].includes(state.phase))return;locked=true;const q=QUESTIONS[question],correct=checkAnswer(q,value),earned=answer(state,correct);
  $('feedback').className=correct?'':'error';$('feedback').textContent=`${correct?`+${earned} tinta · `:'Revisa: '}${q.why}`;
  $('challenge').querySelectorAll('button,input').forEach(b=>b.disabled=true);if(correct)notice(`+${earned} TINTA`);refresh();persist();setTimeout(()=>{if(started&&!['won','lost'].includes(state.phase))chooseQuestion();},1800);}
function refresh(){if(!started)return;$('waveLabel').textContent=`${Math.min(state.wave+1,4)} / 4`;$('inkLabel').textContent=state.ink;$('wallLabel').textContent=`${state.wall} / ${state.maxWall}`;$('sealsLabel').textContent=`◈ ${profile?.seals||0} sellos`;
  $('streakLabel').textContent=`ACIERTOS ${state.correct}`;$('waveStatus').textContent=state.phase==='battle'?`OLEADA ${state.wave+1} EN MARCHA`:state.phase==='upgrade'?'LA HORDA RETROCEDE':`OLEADA ${state.wave+1} · PREPARACIÓN`;
  $('battleHint').textContent=state.phase==='battle'?`Enemigos ${state.spawned}/${WAVES[state.wave].count} · Coloca refuerzos donde hagan falta`:'Selecciona un edificio y colócalo libremente sobre el terreno';
  $('buildings').innerHTML=Object.entries(BUILDINGS).map(([id,b])=>`<button class="building ${selected===id?'selected':''}" data-type="${id}" title="${b.detail}"><span class="symbol">${b.icon}</span><span><b>${b.name}</b><small>${b.detail}</small></span><span class="cost">${price(id)}✦</span></button>`).join('');
  $('buildings').querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.type;$('placeHint').textContent=`${BUILDINGS[selected].name}: pulsa en el campo para construir. Pulsa un edificio existente para mejorarlo.`;refresh();}));
  $('repairButton').disabled=state.wall===state.maxWall||state.ink<20;
  $('nextButton').hidden=state.phase!=='prep';$('nextButton').textContent=state.wave===0?'INICIAR OLEADA':'SIGUIENTE OLEADA';}
function start(){if(!initialized){notice('Esperando al perfil de LenguArcade');return;}state=createState();applySkills(state,profile||{});started=true;paused=false;reported=false;runId=uuid();deck=[];lastQuestion=-1;$('screen').hidden=true;$('command').hidden=false;$('pauseButton').hidden=false;$('feedback').textContent='';chooseQuestion();refresh();persist();post('SESSION_STARTED',{mode:'asedio'});checkpoint('start');}
$('startButton').addEventListener('click',start);$('repairButton').addEventListener('click',()=>{if(repair(state)){notice('Muralla reparada');checkpoint('repair');refresh();}});
$('startTreeButton').addEventListener('click',openTree);$('treeButton').addEventListener('click',openTree);$('treeBack').addEventListener('click',closeTree);
$('nextButton').addEventListener('click',()=>{if(startWave(state)){notice(`OLEADA ${state.wave+1}`);checkpoint('wave_start');refresh();}});
$('pauseButton').addEventListener('click',()=>{if(!started)return;paused=!paused;$('pauseButton').textContent=paused?'▶':'Ⅱ';$('pauseButton').title=paused?'Reanudar':'Pausar';if(paused)notice('PAUSA');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&started){paused=!paused;$('pauseButton').textContent=paused?'▶':'Ⅱ';}});
function screenUpgrades(){const choices=[UPGRADES[(state.wave-1)%4],UPGRADES[state.wave%4],UPGRADES[(state.wave+1)%4]];$('screen').hidden=false;
  $('screen').innerHTML=`<div class="titlecard"><div class="sigil">✦</div><small>RESPIRO ENTRE OLEADAS</small><h1>La biblioteca resiste</h1><p>Quedan ${4-state.wave} oleadas. Elige una mejora para esta partida.</p><div class="choices">${choices.map(u=>`<button data-upgrade="${u.id}">${u.title}<small>${u.detail}</small></button>`).join('')}</div><div class="titlefoot">+28 TINTA POR OLEADA SUPERADA</div></div>`;
  $('screen').querySelectorAll('[data-upgrade]').forEach(b=>b.addEventListener('click',()=>{if(selectUpgrade(state,b.dataset.upgrade)){$('screen').hidden=true;notice('Mejora conseguida');checkpoint('upgrade');refresh();}}));checkpoint('wave_end');}
function finish(){const victory=state.phase==='won';profile||={};profile.best=Math.max(profile.best||0,state.wave);if(victory)profile.completed=(profile.completed||0)+1;const reward=earnedSeals(state);profile.seals=(profile.seals||0)+reward;result();
  $('screen').hidden=false;$('screen').innerHTML=`<div class="titlecard"><div class="sigil">${victory?'✦':'⚔'}</div><small>${victory?'EL REINO RECUERDA':'EL ASEDIO CONTINÚA'}</small><h1>${victory?'La última palabra<br><em>es tuya</em>':'La muralla<br><em>ha caído</em>'}</h1><p>${victory?'La horda se retira. Tus palabras mantuvieron en pie la biblioteca.':'La biblioteca aguarda otro intento. Cambia tus edificios y refuerza el campo.'}</p><div class="score">${state.correct} aciertos · ${state.kills} enemigos · ${state.wave}/4 oleadas</div><p>+${reward} sellos para el árbol de mejoras · Récord: ${profile.best}/4 oleadas</p><button id="retryButton" class="primary">VOLVER A DEFENDER</button><button id="endTreeButton" class="secondary">ÁRBOL DE MEJORAS</button></div>`;$('retryButton').addEventListener('click',start);$('endTreeButton').addEventListener('click',openTree);persist();}

function canvasPoint(e){const r=canvas.getBoundingClientRect(),scale=Math.min(r.width/960,r.height/540),left=r.left+(r.width-960*scale)/2,top=r.bottom-540*scale;return {x:(e.clientX-left)/scale,y:(e.clientY-top)/scale};}
canvas.addEventListener('pointermove',e=>{if(!started||paused||$('screen').hidden===false||$('treeOverlay').hidden===false){hover=null;return;}const p=canvasPoint(e);hover=p.x>=0&&p.x<=960&&p.y>=0&&p.y<=540?{...p,type:selected}:null;});
canvas.addEventListener('pointerleave',()=>hover=null);
canvas.addEventListener('click',e=>{if(!started||paused||!$('screen').hidden||!$('treeOverlay').hidden)return;const {x,y}=canvasPoint(e),existing=buildingAt(state,x,y),type=existing?.type||selected;
  if(!existing&&(x<FIELD.minX||x>FIELD.maxX||y<FIELD.minY||y>FIELD.maxY)){notice('Construye en la zona central del campo');return;}
  if(!build(state,type,x,y)){notice(state.ink<price(type,existing?.level||0)?'Necesitas más tinta':'Deja espacio entre edificios');return;}
  notice(existing?`${BUILDINGS[type].name} mejorado`:`${BUILDINGS[type].name} construido`);checkpoint('build');refresh();});
function openTree(){if(!initialized)return;pausedBeforeTree=paused;paused=true;$('treeOverlay').hidden=false;renderTree();}
function closeTree(){$('treeOverlay').hidden=true;paused=pausedBeforeTree;$('pauseButton').textContent=paused?'▶':'Ⅱ';refresh();}
function renderTree(){profile||={};$('treeWallet').textContent=`◈ ${profile.seals||0} SELLOS`;
  $('treeBranches').innerHTML=BRANCHES.map(branch=>`<div class="tree-branch"><h3>${branch.icon} ${branch.title}</h3><div class="tree-chain">${branch.nodes.map((n,i)=>{const owned=!!profile.tree?.[n.id],unlocked=i===0||!!profile.tree?.[branch.nodes[i-1].id];return `<button class="skill-node ${owned?'owned':unlocked?'available':'locked'}" data-skill="${n.id}" aria-label="${n.title}, ${owned?'adquirido':unlocked?`${n.cost} sellos`:'bloqueado'}"><span class="skill-icon">${n.icon}</span><span class="skill-name">${n.title}</span><span class="skill-price">${owned?'✓ ADQUIRIDA':unlocked?`◈ ${n.cost}`:'🔒'}</span></button>`;}).join('')}</div></div>`).join('');
  $('treeBranches').querySelectorAll('[data-skill]').forEach(b=>b.addEventListener('click',()=>describeSkill(b.dataset.skill)));
  describeSkill($('treeInfo').dataset.current||'wall1');}
function describeSkill(id){const branch=BRANCHES.find(b=>b.nodes.some(n=>n.id===id)),index=branch?.nodes.findIndex(n=>n.id===id);if(index==null||index<0)return;const node=branch.nodes[index],owned=!!profile.tree?.[id],unlocked=index===0||!!profile.tree?.[branch.nodes[index-1].id];$('treeInfo').dataset.current=id;
  $('treeInfo').innerHTML=`<small>${branch.title} · NIVEL ${index+1}</small><div class="tree-emblem">${node.icon}</div><h3>${node.title}</h3><p>${node.desc}</p><div class="tree-cost">${owned?'MEJORA ADQUIRIDA':`COSTE · ◈ ${node.cost} SELLOS`}</div><button id="buySkill" class="primary" ${owned||!unlocked||(profile.seals||0)<node.cost?'disabled':''}>${owned?'CONSEGUIDA':unlocked?'DESBLOQUEAR':'REQUIERE LA ANTERIOR'}</button><p class="tree-note">${owned?'Se aplica automáticamente en cada nueva partida.':unlocked?'Permanente · activa desde la próxima partida.':'Desbloquea primero la mejora anterior de esta rama.'}</p>`;
  $('buySkill').addEventListener('click',()=>{if(buySkill(profile,id)){persist();if(started)checkpoint('skill_purchase');renderTree();}});}

function loop(now){const dt=Math.min(.1,(now-lastFrame)/1000||0);lastFrame=now;if(started&&!paused){const prior=state.phase;step(state,dt);if(state.phase!==prior){if(state.phase==='upgrade')screenUpgrades();if(state.phase==='won'||state.phase==='lost')finish();refresh();}else if(state.phase==='battle'&&Math.floor(now/400)!==Math.floor((now-dt*1000)/400))refresh();}drawScene(ctx,state,now/1000,hover);requestAnimationFrame(loop);}requestAnimationFrame(loop);
