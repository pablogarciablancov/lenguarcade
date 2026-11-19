import {BUILDINGS,LANES,WAVES,UPGRADES,createState,price,build,repair,startWave,answer,selectUpgrade,step} from './core.js';
import {QUESTIONS,freshDeck,checkAnswer} from './questions.js';

const $=id=>document.getElementById(id),canvas=$('battle'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const params=new URLSearchParams(location.search),embedded=params.get('la')==='1'||params.get('lenguarcade')==='1',channel=params.get('channel')||'';
let state=createState(),selected='guard',lane=0,deck=[],question=-1,lastQuestion=-1,locked=false,paused=false,lastFrame=0,noticeTimer=0,seed=0,started=false,runId='',reported=false,host=null,origin='*',profile=null,student=null,initialized=!embedded,inFlight=null,queue=[];

function uuid(){return crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;}
function post(type,payload={}){if(!embedded||!channel)return;const message={namespace:'lenguarcade-game',channel,gameId:'la_ultima_palabra',type,payload};if(host){host.postMessage(message,origin);return;}let w=window;for(let i=0;i<5;i++){if(w.parent===w)break;w=w.parent;w.postMessage(message,'*');}}
function ancestor(source){let w=window;for(let i=0;i<5;i++){if(w.parent===w)break;w=w.parent;if(w===source)return true;}return false;}
function saveData(){return {best:profile?.best||0,completed:profile?.completed||0,run:started&&state.phase!=='won'&&state.phase!=='lost'?JSON.parse(JSON.stringify(state)):null,runId,reported};}
function persist(){if(!embedded)try{localStorage.setItem('lenguarcade_la_ultima_palabra_v1',JSON.stringify(saveData()));}catch{}}
function player(result=false){const tries=state.correct+state.errors,accuracy=tries?Math.round(100*state.correct/tries):0;
  return {role:'primary',outcome:result?(state.phase==='won'?'victory':'finished'):'checkpoint',score:0,correct:result?state.correct:0,errors:result?state.errors:0,attempts:result?tries:0,accuracy,grade:accuracy/10,percentage:Math.round(state.wave/WAVES.length*100),metrics:{mode:'asedio',wave:state.wave,wall:state.wall,kills:state.kills,seconds:Math.round(state.seconds),correct:state.correct,errors:state.errors},achievements:[],save:saveData()};}
function pump(){if(inFlight||!queue.length)return;inFlight=queue.shift();inFlight.sent=Date.now();post(inFlight.type,inFlight.payload);}
function enqueue(type,payload){if(!embedded||!initialized)return;queue.push({type,payload});pump();}
function checkpoint(reason){persist();enqueue('CHECKPOINT',{checkpointId:`la_ultima_palabra_cp_${uuid()}`,matchId:runId||'la_ultima_palabra_profile',reason,players:[player()]});}
function result(){if(reported)return;reported=true;persist();enqueue('RESULT',{resultId:`la_ultima_palabra_result_${runId}`,matchId:runId,outcome:state.phase==='won'?'victory':'finished',players:[player(true)]});}
function init(payload={}){if(initialized&&embedded)return;student=payload.student||{};profile=payload.save&&typeof payload.save==='object'?payload.save:null;
  if(!embedded)try{profile=JSON.parse(localStorage.getItem('lenguarcade_la_ultima_palabra_v1'))||{};}catch{profile={};}
  profile||={};initialized=true;if(profile.run&&['prep','upgrade','battle'].includes(profile.run.phase)){state=profile.run;started=true;runId=profile.runId||uuid();reported=!!profile.reported;$('screen').hidden=true;$('command').hidden=false;$('pauseButton').hidden=false;chooseQuestion();refresh();}
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
function refresh(){if(!started)return;$('waveLabel').textContent=`${Math.min(state.wave+1,4)} / 4`;$('inkLabel').textContent=state.ink;$('wallLabel').textContent=`${state.wall} / ${state.maxWall}`;
  $('streakLabel').textContent=`ACIERTOS ${state.correct}`;$('waveStatus').textContent=state.phase==='battle'?`OLEADA ${state.wave+1} EN MARCHA`:state.phase==='upgrade'?'LA HORDA RETROCEDE':`OLEADA ${state.wave+1} · PREPARACIÓN`;
  $('battleHint').textContent=state.phase==='battle'?`Enemigos ${state.spawned}/${WAVES[state.wave].count} · Los edificios reclutan automáticamente`:'Resuelve retos y prepara tus tres caminos';
  $('buildings').innerHTML=Object.entries(BUILDINGS).map(([id,b])=>{const existing=state.buildings.find(x=>x.type===id&&x.lane===lane),cost=price(id,existing?.level||0);return `<button class="building ${selected===id?'selected':''}" data-type="${id}" ${state.ink<cost?'disabled':''} title="${b.detail}"><span class="symbol">${b.icon}</span><span><b>${b.name}</b><small>${existing?'Mejorar · nivel '+existing.level:b.detail}</small></span><span class="cost">${cost}✦</span></button>`;}).join('');
  $('buildings').querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>{selected=b.dataset.type;const present=state.buildings.find(x=>x.type===selected&&x.lane===lane);if(!build(state,selected,lane)){notice('Necesitas más tinta');return;}notice(present?`${BUILDINGS[selected].name} mejorada`:`${BUILDINGS[selected].name} construida`);checkpoint('build');refresh();}));
  $('lanes').innerHTML=LANES.map((_,i)=>`<button class="lane ${i===lane?'selected':''}" data-lane="${i}">${['▲ NORTE','◆ CENTRO','▼ SUR'][i]} · ${state.buildings.filter(b=>b.lane===i).length}</button>`).join('');$('lanes').querySelectorAll('[data-lane]').forEach(b=>b.addEventListener('click',()=>{lane=Number(b.dataset.lane);refresh();}));
  $('repairButton').disabled=state.wall===state.maxWall||state.ink<20;
  $('nextButton').hidden=state.phase!=='prep';$('nextButton').textContent=state.wave===0?'INICIAR OLEADA':'SIGUIENTE OLEADA';}
function start(){if(!initialized){notice('Esperando al perfil de LenguArcade');return;}state=createState();started=true;reported=false;runId=uuid();deck=[];lastQuestion=-1;$('screen').hidden=true;$('command').hidden=false;$('pauseButton').hidden=false;$('feedback').textContent='';chooseQuestion();refresh();persist();post('SESSION_STARTED',{mode:'asedio'});checkpoint('start');}
$('startButton').addEventListener('click',start);$('repairButton').addEventListener('click',()=>{if(repair(state)){notice('Muralla reparada');checkpoint('repair');refresh();}});
$('nextButton').addEventListener('click',()=>{if(startWave(state)){notice(`OLEADA ${state.wave+1}`);checkpoint('wave_start');refresh();}});
$('pauseButton').addEventListener('click',()=>{if(!started)return;paused=!paused;$('pauseButton').textContent=paused?'▶':'Ⅱ';$('pauseButton').title=paused?'Reanudar':'Pausar';if(paused)notice('PAUSA');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&started){paused=!paused;$('pauseButton').textContent=paused?'▶':'Ⅱ';}});
function screenUpgrades(){const choices=[UPGRADES[(state.wave-1)%4],UPGRADES[state.wave%4],UPGRADES[(state.wave+1)%4]];$('screen').hidden=false;
  $('screen').innerHTML=`<div class="titlecard"><div class="sigil">✦</div><small>RESPIRO ENTRE OLEADAS</small><h1>La biblioteca resiste</h1><p>Quedan ${4-state.wave} oleadas. Elige una mejora para esta partida.</p><div class="choices">${choices.map(u=>`<button data-upgrade="${u.id}">${u.title}<small>${u.detail}</small></button>`).join('')}</div><div class="titlefoot">+28 TINTA POR OLEADA SUPERADA</div></div>`;
  $('screen').querySelectorAll('[data-upgrade]').forEach(b=>b.addEventListener('click',()=>{if(selectUpgrade(state,b.dataset.upgrade)){$('screen').hidden=true;notice('Mejora conseguida');checkpoint('upgrade');refresh();}}));checkpoint('wave_end');}
function finish(){const victory=state.phase==='won';profile||={};profile.best=Math.max(profile.best||0,state.wave);if(victory)profile.completed=(profile.completed||0)+1;result();
  $('screen').hidden=false;$('screen').innerHTML=`<div class="titlecard"><div class="sigil">${victory?'✦':'⚔'}</div><small>${victory?'EL REINO RECUERDA':'EL ASEDIO CONTINÚA'}</small><h1>${victory?'La última palabra<br><em>es tuya</em>':'La muralla<br><em>ha caído</em>'}</h1><p>${victory?'La horda se retira. Tus palabras mantuvieron en pie la biblioteca.':'La biblioteca aguarda otro intento. Cambia tus edificios y refuerza el camino que quedó abierto.'}</p><div class="score">${state.correct} aciertos · ${state.kills} enemigos · ${state.wave}/4 oleadas</div><p>Récord: ${profile.best}/4 oleadas</p><button id="retryButton" class="primary">VOLVER A DEFENDER</button></div>`;$('retryButton').addEventListener('click',start);persist();}

// Pixel art drawn at a fixed internal resolution: no image downloads or sprite-sheet bleeding.
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function poly(points,color){ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();}
function tower(x,y,roof='#2c454e'){rect(x,y,56,108,'#1b2529');rect(x+5,y+5,46,98,'#67716a');rect(x+9,y+11,38,90,'#8a8b76');for(let k=0;k<4;k++){rect(x+k*15-3,y-11,11,16,'#7b816e');rect(x+6,y+20+k*17,44,2,'#56665e');rect(x+6+(k%2)*20,y+22+k*17,2,15,'#596c62');}rect(x+18,y+31,18,26,'#1a3137');rect(x+21,y+35,12,17,'#d1a65b');poly([[x+13,y],[x+28,y-20],[x+44,y]],roof);rect(x+25,y-20,4,29,'#c7a45d');}
function castle(){rect(0,150,205,342,'#25393d');for(let y=160;y<488;y+=28){for(let x=-15+(y%56?18:0);x<206;x+=42){rect(x,y,37,25,(x+y)%3?'#6e796e':'#5e736b');rect(x+3,y+4,10,2,'#9d9b7a');}}rect(0,146,209,18,'#a29876');for(let x=0;x<208;x+=28)rect(x,125,18,29,'#8e987c');tower(17,136,'#364e52');tower(132,133,'#354d57');rect(70,257,87,106,'#182a2e');rect(78,270,71,92,'#3e4c49');rect(83,282,61,80,'#192a31');rect(87,287,53,76,'#222e32');rect(109,288,4,74,'#a98048');rect(96,317,5,5,'#e2bb71');rect(123,317,5,5,'#e2bb71');for(let x=7;x<200;x+=25){rect(x,392,15,6,'#b8a977');}rect(68,211,88,8,'#d5bd81');rect(92,179,38,40,'#25363a');rect(97,184,28,31,'#ebc57d');rect(105,190,12,18,'#4c5350');rect(32,207,10,17,'#edb866');rect(166,207,10,17,'#edb866');}
function backdrop(t){let sky=ctx.createLinearGradient(0,0,0,540);sky.addColorStop(0,'#203947');sky.addColorStop(.54,'#47636a');sky.addColorStop(1,'#1a3537');ctx.fillStyle=sky;ctx.fillRect(0,0,960,540);rect(722,32,48,48,'#e9d8a2');rect(728,38,36,36,'#fae7ad');for(let i=0;i<16;i++){let x=(i*157+39)%960,y=(i*67+34)%136;rect(x,y,2,2,'#e5d6ad');}
  poly([[160,211],[282,105],[370,187],[450,113],[550,198],[646,119],[760,221],[900,126],[960,203],[960,283],[160,283]],'#304953');poly([[180,266],[316,169],[422,258],[575,164],[732,257],[885,177],[960,222],[960,325],[180,325]],'#385954');
  for(let i=0;i<15;i++){const x=230+i*55;rect(x,176+(i%3)*25,11,96,'#253e40');poly([[x-16,199+(i%3)*25],[x+5,135+(i%3)*25],[x+27,199+(i%3)*25]],'#294b46');poly([[x-12,186+(i%3)*25],[x+5,151+(i%3)*25],[x+24,186+(i%3)*25]],'#426557');}
  rect(0,278,960,262,'#496348');for(let y=0;y<3;y++){let cy=LANES[y];rect(198,cy-28,762,57,'#816f5a');rect(198,cy-25,762,51,'#aa9370');for(let x=226;x<960;x+=45){rect(x+(y%2)*13,cy-15,16,3,'#c2a87d');rect(x+17,cy+13,9,2,'#84725e');}}
  for(let i=0;i<56;i++){let x=(i*149+251)%960,y=267+(i*79)%265;if(x<202||LANES.some(l=>Math.abs(l-y)<31))continue;rect(x,y,4,10,'#315542');rect(x-3,y+4,10,3,i%3?'#6d8960':'#78966d');}
  const fog=.045+.025*Math.sin(t/3);rect(200,288,760,10,`rgba(224,216,176,${fog})`);castle();}
function buildingArt(b,t){const x=235+(b.type==='guard'?0:b.type==='bow'?34:68),y=LANES[b.lane]-41,base=BUILDINGS[b.type];rect(x-2,y+41,30,5,'#304641');rect(x,y+2,25,39,'#1b242c');rect(x+3,y+6,19,33,'#8f8165');rect(x+6,y+9,13,11,b.type==='mage'?'#8e80b0':'#dbc393');poly([[x-3,y+5],[x+12,y-10],[x+29,y+5]],b.type==='guard'?'#54665b':b.type==='bow'?'#795c4c':'#646493');rect(x+10,y-14,4,11,'#e4bc6e');if(b.type==='mage')rect(x+9,y-22,6,6,'#d8aaff');for(let i=0;i<b.level;i++)rect(x+1+i*7,y+32,5,5,'#f1d28f');const c=b.clock/(base.rate*state.spawnMultiplier/(1+(b.level-1)*.23));rect(x,y+48,25,3,'#1b2527');rect(x,y+48,25*Math.min(1,c),base.color);}
function sprite(x,y,type,enemy=false,flash=0,boss=false,t=0){const s=boss?2.1:1,dy=Math.sin(t*6+x)*2;ctx.save();ctx.translate(Math.round(x),Math.round(y+dy));ctx.scale(s,s);rect(-11,0,23,5,'#304537');const color=enemy?(boss?'#764888':type==='tank'?'#695070':'#795569'):BUILDINGS[type].color;
  rect(-7,-20,14,19,flash?'#fff0b1':'#1e2b33');rect(-5,-18,10,14,flash?'#ffefbf':color);rect(-7,-4,6,6,'#26313a');rect(3,-4,6,6,'#26313a');rect(-6,-30,12,11,enemy?'#c0b6b5':'#ecd1a8');rect(-9,-32,18,5,enemy?'#2b2338':'#425a61');rect(enemy?-4:2,-26,3,2,enemy?'#fa7775':'#263b44');if(enemy){rect(-12,-20,4,16,'#30233d');rect(9,-19,4,15,'#442c43');rect(-8,-38,5,6,'#403049');rect(3,-38,5,6,'#403049');}
  else if(type==='guard'){rect(7,-23,3,19,'#e8c77f');rect(6,-27,5,8,'#eee0ae');rect(-13,-19,7,13,'#adb7a2');}
  else if(type==='bow'){rect(8,-24,2,23,'#e5be72');rect(10,-25,3,2,'#ecd9aa');rect(-8,-32,16,7,'#526b53');}
  else{rect(8,-30,3,27,'#d6b17a');rect(7,-32,6,5,'#cda5f2');rect(-8,-20,4,17,'#685b83');}
  ctx.restore();}
function draw(t){ctx.clearRect(0,0,960,540);backdrop(t);
  for(const b of state.buildings)buildingArt(b,t);for(const a of state.allies)sprite(a.x,LANES[a.lane],a.type,false,a.flash,false,t);for(const e of state.enemies){sprite(e.x,LANES[e.lane],e.tank?'tank':'normal',true,e.flash,e.boss,t);if(e.hp<e.maxHp){rect(e.x-10,LANES[e.lane]-(e.boss?92:44),22,3,'#2a252a');rect(e.x-10,LANES[e.lane]-(e.boss?92:44),22*e.hp/e.maxHp,3,'#dd8c90');}}
  for(const p of state.projectiles){let f=1-p.life/.24,x=p.x+(p.tx-p.x)*f,y=p.y+(p.ty-p.y)*f;rect(x,y,p.kind==='mage'?7:5,3,p.kind==='mage'?'#e2aaff':'#ffe2a0');}
  for(const p of state.particles){rect(p.x-5,p.y-26,10*p.life/.6+3,6,p.color);rect(p.x+9,p.y-34,4,4,p.color);}if(state.phase==='battle'){rect(792,80,139,8,'#162a32');rect(792,80,139*(state.spawned/WAVES[state.wave].count),'#eac477');rect(792,92,Math.max(0,139*(state.wall/state.maxWall)),3,'#8bcab4');}
}
function loop(now){const dt=Math.min(.1,(now-lastFrame)/1000||0);lastFrame=now;if(started&&!paused){const prior=state.phase;step(state,dt);if(state.phase!==prior){if(state.phase==='upgrade')screenUpgrades();if(state.phase==='won'||state.phase==='lost')finish();refresh();}else if(state.phase==='battle'&&Math.floor(now/400)!==Math.floor((now-dt*1000)/400))refresh();}draw(now/1000);requestAnimationFrame(loop);}requestAnimationFrame(loop);
