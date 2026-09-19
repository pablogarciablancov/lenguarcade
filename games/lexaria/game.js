window.LexariaGame = (() => {
'use strict';

const D=window.LexariaData;
const RUN_KEY='lexaria_run_v1';
const CAREER_KEY='lexaria_career_v1';
const SETTINGS_KEY='lexaria_settings_v1';
const TEAM_SIZE=6;
const BENCH_SIZE=4;
const WIN_TARGET=10;
const CHROMATIC_RATE=200;
const TRAINING_STEP=.05;
const LEVEL_MULT={1:1,2:1.7,3:3,4:4.5};

const ABILITY_META={
  damageBurn:{role:'ATACANTE',icon:'🔥',row:'back',tags:['DAÑO','QUEMADURA']},
  doubleIfShield:{role:'ATACANTE',icon:'⚔',row:'back',tags:['DAÑO','COMBO ESCUDO']},
  teamShieldHaste:{role:'APOYO',icon:'✦',row:'back',tags:['ESCUDO','VELOCIDAD']},
  rampingDamage:{role:'ATACANTE',icon:'↗',row:'back',tags:['DAÑO','ESCALA']},
  healShield:{role:'APOYO',icon:'✚',row:'back',tags:['CURA','ESCUDO']},
  selfHasteHit:{role:'ATACANTE',icon:'⚡',row:'back',tags:['DAÑO','RÁPIDO']},
  doubleShock:{role:'CONTROL',icon:'⚡',row:'back',tags:['2 GOLPES','DESCARGA']},
  teamHaste:{role:'APOYO',icon:'⏩',row:'back',tags:['VELOCIDAD','EQUIPO']},
  statusPunish:{role:'REMATADOR',icon:'☠',row:'back',tags:['DAÑO','CASTIGA ESTADOS']},
  poison:{role:'CONTROL',icon:'☣',row:'back',tags:['VENENO','ACUMULA']},
  crit:{role:'ATACANTE',icon:'✹',row:'back',tags:['CRÍTICO','DAÑO']},
  echoSupport:{role:'APOYO',icon:'≈',row:'back',tags:['COPIA','CURA/ESCUDO']},
  missingHpDamage:{role:'REMATADOR',icon:'◆',row:'back',tags:['DAÑO','DESESPERACIÓN']},
  cycleEffect:{role:'VERSÁTIL',icon:'◇',row:'back',tags:['DAÑO','CURA','ESCUDO']},
  maxHpHeal:{role:'DEFENSOR',icon:'♥',row:'front',tags:['CURA','RESISTENCIA']},
  shieldStrike:{role:'DEFENSOR',icon:'🛡',row:'front',tags:['ESCUDO','DAÑO']},
  startCast:{role:'ATACANTE',icon:'➤',row:'back',tags:['INICIO','DAÑO']},
  teamRamp:{role:'APOYO',icon:'↗',row:'back',tags:['BUFF','DAÑO EQUIPO']},
  teamGuard:{role:'DEFENSOR',icon:'🛡',row:'front',tags:['ESCUDO','REDUCCIÓN']},
  copyAlly:{role:'VERSÁTIL',icon:'◎',row:'back',tags:['COPIA','COMBO']},
  adjacentShield:{role:'DEFENSOR',icon:'⬡',row:'front',tags:['ADYACENCIA','ESCUDO']},
  shock:{role:'CONTROL',icon:'⚡',row:'back',tags:['DESCARGA','DAÑO']},
  typeHeal:{role:'APOYO',icon:'✚',row:'back',tags:['CURA','SINERGIA']},
  heavySilence:{role:'CONTROL',icon:'⌁',row:'back',tags:['GRAN DAÑO','SILENCIO']},
  trinity:{role:'LEGENDARIO',icon:'✦',row:'front',tags:['DAÑO','CURA','ESCUDO']},
  adjacentHaste:{role:'APOYO',icon:'♫',row:'back',tags:['ADYACENCIA','VELOCIDAD']},
  clutchHeal:{role:'DEFENSOR',icon:'♥',row:'front',tags:['CURA CRÍTICA','RESISTENCIA']},
  randomStatus:{role:'CONTROL',icon:'✹',row:'back',tags:['ESTADOS','DAÑO']},
  diversityBlast:{role:'ATACANTE',icon:'✒',row:'back',tags:['DIVERSIDAD','DAÑO']}
};

let run=null;
let career=loadCareer();
let settings=loadSettings();
let selected=null;
let currentQuestion=null;
let practiceCategory='ortografia';
let practiceStats={correct:0,attempts:0,streak:0};
let battle=null;
let battleTimer=null;
let battleSpeed=1;
let pendingRelicRewards=0;
let dragSource=null;
let studentOpponents=[];
let battleContext='adventure';
let duelRunContext=null;

const $=id=>document.getElementById(id);
const qsa=s=>Array.from(document.querySelectorAll(s));

function safeParse(raw,fallback){try{return JSON.parse(raw)||fallback;}catch{return fallback;}}
function uid(prefix){return (prefix||'id')+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function format(n){return Math.round(Number(n)||0).toLocaleString('es-ES');}
function nowIso(){return new Date().toISOString();}
function unitAt(ref){
  if(!run||!ref)return null;
  const arr=ref.area==='team'?run.team:run.bench;
  return arr[ref.index]||null;
}
function allUnitRefs(){
  if(!run)return [];
  const out=[];
  run.team.forEach((u,i)=>{if(u)out.push({area:'team',index:i,unit:u});});
  run.bench.forEach((u,i)=>{if(u)out.push({area:'bench',index:i,unit:u});});
  return out;
}
function allUnits(){return allUnitRefs().map(x=>x.unit);}
function creatureOf(unit){return unit?D.creature(unit.creatureId):null;}
function rulesRun(){return battleContext==='student'&&duelRunContext?duelRunContext:run;}
function trainer(){const rr=rulesRun();return rr?D.trainer(rr.trainerId):null;}
function hasRelic(id){const rr=rulesRun();return !!rr&&Array.isArray(rr.relics)&&rr.relics.includes(id);}
function countRelicEffect(effect){const rr=rulesRun();return !rr?0:(rr.relics||[]).map(D.relic).filter(Boolean).filter(r=>r.effect===effect).reduce((a,r)=>a+(Number(r.value)||0),0);}
function teamTypeCounts(units){
  const counts={};
  (units||run?.team.filter(Boolean)||[]).forEach(u=>{
    const c=creatureOf(u); if(!c)return;
    c.types.forEach(t=>counts[t]=(counts[t]||0)+1);
  });
  return counts;
}
function synergyBonusFor(unit,units){
  const c=creatureOf(unit); if(!c)return 0;
  const counts=teamTypeCounts(units);
  let best=0;
  c.types.forEach(t=>{
    const n=counts[t]||0;
    if(n>=6)best=Math.max(best,.20);
    else if(n>=4)best=Math.max(best,.12);
    else if(n>=2)best=Math.max(best,.05);
  });
  return best;
}
function adjacentIndexes(index){
  const r=Math.floor(index/3),c=index%3,out=[];
  [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr,dc])=>{const rr=r+dr,cc=c+dc;if(rr>=0&&rr<2&&cc>=0&&cc<3)out.push(rr*3+cc);});
  return out;
}
function adjacencyCount(index,team){return adjacentIndexes(index).filter(i=>team[i]).length;}
function abilityMeta(c){return ABILITY_META[c?.ability?.kind]||{role:'VERSÁTIL',icon:'✦',row:'back',tags:['HABILIDAD']};}
function levelStars(level){const l=clamp(Number(level)||1,1,3);return '★'.repeat(l)+'☆'.repeat(3-l);}
function fusionInfo(creatureId,level,includeIncoming){
  const l=clamp(Number(level)||1,1,3);
  if(l>=3)return{current:1,needed:1,text:'NIVEL MÁXIMO',max:true};
  const needed=l===1?3:2;
  const current=allUnits().filter(u=>u.creatureId===creatureId&&u.level===l).length+(includeIncoming?1:0);
  return{current:Math.min(current,needed),needed,text:Math.min(current,needed)+'/'+needed,max:false};
}
function strategicFit(c){
  if(!run||!c)return[];
  const notes=[];
  const active=run.team.filter(Boolean);
  const counts=teamTypeCounts(active);
  c.types.forEach(t=>{
    const before=counts[t]||0,after=before+1;
    const threshold=after>=6?6:after>=4?4:after>=2?2:0;
    if(threshold&&before<threshold)notes.push('ACTIVA '+D.TYPES[t].name.toUpperCase()+' '+threshold);
    else if(before>0)notes.push('REFUERZA '+D.TYPES[t].name.toUpperCase());
  });
  const kinds=active.map(u=>creatureOf(u)?.ability.kind);
  if(c.ability.kind==='statusPunish'&&kinds.some(k=>['damageBurn','doubleShock','poison','shock','randomStatus'].includes(k)))notes.push('COMBO CON ESTADOS');
  if(['damageBurn','doubleShock','poison','shock','randomStatus'].includes(c.ability.kind)&&kinds.includes('statusPunish'))notes.push('PREPARA REMATADOR');
  if(c.ability.kind==='doubleIfShield'&&kinds.some(k=>['teamShieldHaste','healShield','teamGuard','adjacentShield','trinity'].includes(k)))notes.push('COMBO CON ESCUDOS');
  return notes.slice(0,2);
}

function loadCareer(){
  const base={
    version:1,xp:0,level:1,championships:0,careerWins:0,games:0,
    discovered:{},chromatics:{},badges:{},achievements:{},history:[],duelSquad:null,duels:{wins:0,losses:0},
    metrics:{buys:0,trainingCorrect:0,trainingAttempts:0,trainingStreak:0,maxTrainingStreak:0,maxLevel:1,chromatics:0,biggestHit:0,maxShield:0,maxDay:1,maxRank:1}
  };
  const saved=safeParse(localStorage.getItem(CAREER_KEY),null);
  if(!saved)return base;
  return Object.assign(base,saved,{metrics:Object.assign(base.metrics,saved.metrics||{}),history:Array.isArray(saved.history)?saved.history:[],duels:Object.assign(base.duels,saved.duels||{})});
}
function loadSettings(){return Object.assign({reduceMotion:false,sound:true},safeParse(localStorage.getItem(SETTINGS_KEY),{}));}
function saveCareer(){
  career.level=Math.max(1,1+Math.floor((career.xp||0)/250));
  localStorage.setItem(CAREER_KEY,JSON.stringify(career));
  renderTitleMeta();
  window.LexariaBridge?.checkpoint?.('career');
}
function saveRun(reason){
  if(run)localStorage.setItem(RUN_KEY,JSON.stringify(run)); else localStorage.removeItem(RUN_KEY);
  if(reason)window.LexariaBridge?.checkpoint?.(reason);
}
function loadRun(){
  const s=safeParse(localStorage.getItem(RUN_KEY),null);
  if(!s||s.version!==1||s.completed)return null;
  s.team=Array.isArray(s.team)?s.team.slice(0,TEAM_SIZE):[];
  s.bench=Array.isArray(s.bench)?s.bench.slice(0,BENCH_SIZE):[];
  while(s.team.length<TEAM_SIZE)s.team.push(null);
  while(s.bench.length<BENCH_SIZE)s.bench.push(null);
  s.relics=Array.isArray(s.relics)?s.relics:[];
  s.shop=Array.isArray(s.shop)?s.shop:[];
  s.stats=Object.assign({buys:0,trainingCorrect:0,trainingAttempts:0,trainingStreak:0,maxTrainingStreak:0,merges:0,maxLevel:1,chromatics:0,biggestHit:0,maxShield:0,damage:0,casts:0},s.stats||{});
  s.flags=Object.assign({},s.flags||{});
  return s;
}
function loadSettingsToBody(){
  document.body.classList.toggle('reduce-motion',!!settings.reduceMotion);
  if($('motionToggle'))$('motionToggle').checked=!!settings.reduceMotion;
  if($('soundToggle'))$('soundToggle').checked=!!settings.sound;
}

function toast(text,kind){
  const el=document.createElement('div');
  el.className='toast '+(kind||'');
  el.textContent=text;
  $('toastHost')?.appendChild(el);
  setTimeout(()=>el.remove(),2800);
}
function showScreen(id){
  qsa('.screen').forEach(s=>s.classList.add('hidden'));
  $(id)?.classList.remove('hidden');
  closeModal();
}
function openModal(id){
  const layer=$('modalLayer');
  if(!layer)return;
  layer.classList.remove('hidden');layer.setAttribute('aria-hidden','false');
  qsa('#modalLayer .modal').forEach(m=>m.classList.add('hidden'));
  $(id)?.classList.remove('hidden');
}
function closeModal(){
  const layer=$('modalLayer');
  if(!layer)return;
  layer.classList.add('hidden');layer.setAttribute('aria-hidden','true');
  qsa('#modalLayer .modal').forEach(m=>m.classList.add('hidden'));
  currentQuestion=null;
}
function renderTitleMeta(){
  const saved=loadRun();
  $('continueRunBtn')?.classList.toggle('hidden',!saved);
  const discovered=Object.keys(career.discovered||{}).length;
  const ach=Object.keys(career.achievements||{}).length;
  if($('codexCount'))$('codexCount').textContent=discovered+'/'+D.creatures.length;
  if($('achievementCount'))$('achievementCount').textContent=ach+'/'+D.achievements.length;
  if($('historyCount'))$('historyCount').textContent=(career.history?.length||0)+' ligas';
}
function backHome(){
  selected=null;battleContext='adventure';duelRunContext=null;
  showScreen('titleScreen');
  renderTitleMeta();
}

function chooseTrainerScreen(){
  showScreen('trainerScreen');
  const host=$('trainerChoices'); if(!host)return;
  host.innerHTML=D.trainers.map(t=>
    '<article class="trainer-card">'+
      '<div class="trainer-portrait">'+esc(t.emoji)+'</div>'+
      '<span class="class">'+esc(t.class)+'</span>'+
      '<h3>'+esc(t.name)+'</h3>'+
      '<p>'+esc(t.power)+'</p>'+
      '<div class="trainer-power"><b>'+esc(t.powerName)+'</b>'+esc(t.power)+'</div>'+
      '<button class="primary full choose-trainer" data-trainer="'+esc(t.id)+'">ELEGIR ENTRENADOR</button>'+
    '</article>'
  ).join('');
}
function newRun(trainerId){
  battleContext='adventure';duelRunContext=null;
  const t=D.trainer(trainerId); if(!t)return;
  run={
    version:1,id:uid('league'),mode:'adventure',startedAt:nowIso(),completed:false,trainerId:t.id,
    day:1,wins:0,lives:10,gold:12,rank:1,freeRerolls:t.effect==='balanced'?1:0,
    trainingLeft:t.effect==='teacher'?5:3,team:Array(TEAM_SIZE).fill(null),bench:Array(BENCH_SIZE).fill(null),
    relics:[],shop:[],locked:false,itemUse:1,discount:0,rarityBoost:0,trainingBonus:0,
    secondChance:true,losses:0,eventsSeen:[],flags:{},stats:{buys:0,trainingCorrect:0,trainingAttempts:0,trainingStreak:0,maxTrainingStreak:0,merges:0,maxLevel:1,chromatics:0,biggestHit:0,maxShield:0,damage:0,casts:0}
  };
  if(t.effect==='balanced')run.trainingLeft+=1;
  if(t.effect==='lexicon')run.trainingLeft+=1;
  rollShop(true);
  saveRun('new_run');
  selected=null;
  showShop();
  window.LexariaBridge?.sessionStarted?.();
}
function continueRun(){
  run=loadRun();
  if(!run){toast('No hay una liga guardada.','bad');renderTitleMeta();return;}
  selected=null;showShop();
}
function showShop(){
  if(!run)return backHome();
  showScreen('shopScreen');
  renderRun();
}
function renderRun(){
  if(!run)return;
  const t=trainer();
  $('trainerChip').innerHTML='<span class="avatar">'+esc(t?.emoji||'🎓')+'</span><span>'+esc(t?.name||'Entrenador')+'</span>';
  $('livesValue').textContent=run.lives;
  $('dayValue').textContent=run.day;
  $('winsValue').textContent=run.wins+'/'+WIN_TARGET;
  $('goldValue').textContent=run.gold;
  $('rankValue').textContent=run.rank;
  $('trainingValue').textContent=run.trainingLeft;
  $('relicCount').textContent=run.relics.length;
  if($('marketWallet'))$('marketWallet').textContent='Tienes '+run.gold+' 🖋️';
  if($('dayFlowTitle'))$('dayFlowTitle').textContent='JORNADA '+run.day+' · PREPARACIÓN';
  if($('dayFlowIncome'))$('dayFlowIncome').textContent='Combate cuando estés listo. Después: nueva jornada, +'+(10+countRelicEffect('dailyGold'))+' Tinta y nuevas sesiones de entrenamiento.';
  renderRelics();renderSynergies();renderBoards();renderFormationTotals();renderMarket();renderInspect();
  $('lockBtn').textContent=(run.locked?'🔓 LIBERAR':'🔒 FIJAR');
  $('rerollBtn').innerHTML='↻ CAMBIAR <small>'+(run.freeRerolls>0?'GRATIS':rerollCost())+'</small>';
  $('battleBtn').disabled=!run.team.some(Boolean);
  $('abandonRunBtn')?.classList.remove('hidden');
}
function renderRelics(){
  const host=$('relicBag'); if(!host)return;
  if(!run.relics.length){host.className='relic-bag empty';host.innerHTML='<p>Fusiona Lexarios para obtener reliquias.</p>';return;}
  host.className='relic-bag';
  host.innerHTML=run.relics.map(id=>{const r=D.relic(id);return r?'<div class="relic-token" title="'+esc(r.name+': '+r.text)+'">'+esc(r.icon)+'</div>':'';}).join('');
}
function renderSynergies(){
  const host=$('synergyList'); if(!host)return;
  const counts=teamTypeCounts();
  host.innerHTML=Object.values(D.TYPES).map(t=>{
    const n=counts[t.id]||0,active=n>=2,step=n>=6?'20%':n>=4?'12%':n>=2?'5%':'—';
    return '<div class="synergy '+(active?'active':'')+'"><span>'+esc(t.icon)+' '+esc(t.name)+'</span><b>'+n+(active?' · +'+step:'')+'</b></div>';
  }).join('');
}
function formationTotals(team){
  const active=(team||run?.team||[]).filter(Boolean);
  let hp=0,damage=0;
  (team||run?.team||[]).forEach((u,i)=>{
    if(!u)return;
    const st=unitStats(u,i,team||run.team);
    hp+=st.hp;damage+=st.damage;
  });
  return {hp:Math.round(hp),damage:Math.round(damage),count:active.length};
}
function renderFormationTotals(){
  const totals=formationTotals(run.team);
  if($('formationHp'))$('formationHp').textContent=format(totals.hp);
  if($('formationDamage'))$('formationDamage').textContent=format(totals.damage);
}
function renderBoards(){
  const makeSlot=(area,i,u)=>{
    const isSel=selected&&selected.area===area&&selected.index===i;
    const rowClass=area==='team'?(i<3?'front-row':'back-row'):'reserve-row';
    return '<div class="'+(area==='team'?'board-slot':'bench-slot')+' '+rowClass+' '+(u?'occupied ':'')+(isSel?'target':'')+'" data-slot="'+area+'" data-index="'+i+'">'+(u?unitCard(u,isSel,area,i):'<span class="slot-plus">+</span>')+'</div>';
  };
  $('teamBoard').innerHTML=run.team.map((u,i)=>makeSlot('team',i,u)).join('');
  $('benchBoard').innerHTML=run.bench.map((u,i)=>makeSlot('bench',i,u)).join('');
}
function unitCard(u,isSel,area,index){
  const c=creatureOf(u); if(!c)return '';
  const meta=abilityMeta(c),trainPct=Math.round((u.training||0)*TRAINING_STEP*100);
  return '<button draggable="true" class="unit-card '+(u.chromatic?'chromatic ':'')+(isSel?'selected':'')+'" data-unit="'+esc(u.uid)+'" data-area="'+esc(area||'')+'" data-index="'+String(index??'')+'" data-rarity="'+esc(c.rarity)+'">'+
    '<i class="rarity-line"></i><span class="unit-level">'+levelStars(u.level)+'</span><span class="unit-power">🎓 +'+trainPct+'%</span>'+
    '<span class="unit-role">'+esc(meta.icon)+' '+esc(meta.role)+'</span>'+
    '<span class="unit-emoji">'+esc(c.emoji)+'</span><span class="unit-name">'+esc(c.name)+'</span>'+
  '</button>';
}
function slotClick(area,index){
  const arr=area==='team'?run.team:run.bench;
  const unit=arr[index];
  if(!unit){selected=null;renderBoards();renderInspect();return;}
  if(selected&&selected.area===area&&selected.index===index)selected=null;
  else selected={area,index};
  renderBoards();renderInspect();
}
function moveUnit(from,to){
  if(!run||!from||!to)return;
  if(from.area===to.area&&from.index===to.index)return;
  const fromArr=from.area==='team'?run.team:run.bench;
  const toArr=to.area==='team'?run.team:run.bench;
  const moving=fromArr[from.index];
  if(!moving)return;
  const displaced=toArr[to.index];
  fromArr[from.index]=displaced||null;
  toArr[to.index]=moving;
  if(selected&&selected.area===from.area&&selected.index===from.index)selected={area:to.area,index:to.index};
  saveRun('drag_unit');renderRun();
}
function clearSelection(){selected=null;renderBoards();renderInspect();}
function renderInspect(){
  const host=$('inspectCard'); if(!host)return;
  const u=unitAt(selected);
  if(!u){host.className='inspect-card empty';host.innerHTML='<div class="inspect-placeholder"><b>Selecciona un Lexario</b><span>Verás su rol, habilidad, progreso de fusión, entrenamiento y la razón para colocarlo delante o detrás.</span></div>';return;}
  const c=creatureOf(u),stats=unitStats(u,selected?.index,run.team),meta=abilityMeta(c);
  const fusion=fusionInfo(c.id,u.level,false);
  const trainPct=Math.round((u.training||0)*TRAINING_STEP*100);
  const neighbors=selected?.area==='team'?adjacencyCount(selected.index,run.team):0;
  const posText=selected?.area==='team'
    ?(selected.index<3
      ?'<b>🛡️ VANGUARDIA</b><span>+25% vida · habilidades 10% más lentas. '+neighbors+' vecino'+(neighbors===1?'':'s')+' activo'+(neighbors===1?'':'s')+'.</span>'
      :'<b>⚡ RETAGUARDIA</b><span>−10% vida · habilidades 15% más rápidas. '+neighbors+' vecino'+(neighbors===1?'':'s')+' activo'+(neighbors===1?'':'s')+'.</span>')
    :'<b>📦 RESERVA</b><span>No combate. Sí cuenta para conseguir copias y fusionar.</span>';
  host.className='inspect-card';
  host.innerHTML=
    '<div class="inspect-hero game-card-header"><span class="big-emoji">'+esc(c.emoji)+'</span><div class="inspect-name"><span class="role-badge">'+esc(meta.icon)+' '+esc(meta.role)+'</span><h3>'+esc(c.name)+(u.chromatic?' ✦':'')+'</h3><div class="level-stars">'+levelStars(u.level)+' <small>Nv.'+u.level+'</small></div></div></div>'+
    '<div class="type-pills">'+c.types.map(t=>'<span class="type-pill">'+esc(D.TYPES[t].name)+'</span>').join('')+'</div>'+
    '<div class="stat-grid game-stats"><div><span>❤️ Vida efectiva</span><b>'+format(stats.hp)+'</b></div><div><span>⚔️ Potencia</span><b>'+format(stats.damage)+'</b></div><div><span>⏱ Habilidad</span><b>'+stats.cooldown.toFixed(1)+'s</b></div><div><span>🎓 Entreno</span><b>+'+trainPct+'%</b></div></div>'+
    '<div class="ability-box featured"><div class="ability-title"><b>'+esc(c.ability.name)+'</b><span>'+esc(meta.tags.join(' · '))+'</span></div><p>'+esc(c.ability.text)+'</p><small>Cada '+stats.cooldown.toFixed(1)+' s, cuando se llena su barra, lanza esta habilidad automáticamente.</small></div>'+
    '<div class="progress-box"><div><b>SUBIDA DE NIVEL</b><span>'+levelStars(u.level)+'</span></div>'+
      (fusion.max?'<p>Nivel máximo alcanzado.</p>':'<p>Fusiona copias iguales: <strong>'+fusion.text+'</strong> '+(u.level===1?'copias Nv.1 → Nv.2 (×1,7 estadísticas)':'copias Nv.2 → Nv.3 (×3 estadísticas)')+'.</p>')+
      '<div class="fusion-pips">'+(fusion.max?'<i class="on"></i><i class="on"></i><i class="on"></i>':Array.from({length:fusion.needed},(_,i)=>'<i class="'+(i<fusion.current?'on':'')+'"></i>').join(''))+'</div></div>'+
    '<div class="progress-box training-progress"><div><b>ENTRENAMIENTO</b><span>+'+trainPct+'%</span></div><p>Cada acierto = <strong>+1 punto = +5% vida y +5% potencia</strong>. Al fusionar, los puntos de las copias se suman (máx. +20).</p></div>'+
    '<div class="position-card '+(selected?.area==='team'?(selected.index<3?'front':'back'):'reserve')+'">'+posText+'<small>Recomendación de rol: '+(meta.row==='front'?'Vanguardia':'Retaguardia')+'.</small></div>'+
    '<div class="inspect-actions"><button class="primary" data-action="train-selected">ENTRENAR (+5%)</button><button class="secondary" data-action="sell-selected">VENDER +'+sellValue(u)+'</button></div>'+
    '<button class="secondary full" style="margin-top:7px" data-action="clear-selection">CERRAR FICHA</button>';
}
function sellValue(u){return Math.max(1,Math.floor(D.rarityPrice(creatureOf(u)?.rarity||'common')*.6)*u.level);}
function sellSelected(){
  const u=unitAt(selected); if(!u)return;
  const value=sellValue(u),arr=selected.area==='team'?run.team:run.bench;
  arr[selected.index]=null;run.gold+=value;selected=null;
  toast('Lexario devuelto al mercado: +'+value+' Tinta.','good');
  saveRun('sell');renderRun();
}

function rarityRoll(rank,boost){
  const keys=Object.keys(D.RARITIES), idx=clamp((rank||1)-1+(boost||0),0,5);
  const weights=keys.map(k=>D.RARITIES[k].weight[idx]||0);
  const total=weights.reduce((a,b)=>a+b,0);
  let x=Math.random()*total;
  for(let i=0;i<keys.length;i++){x-=weights[i];if(x<=0)return keys[i];}
  return 'common';
}
function rollCreature(rank,boost){
  const rarity=rarityRoll(rank,boost);
  const pool=D.creatures.filter(c=>c.rarity===rarity);
  const c=D.pick(pool.length?pool:D.creatures);
  return {kind:'creature',creatureId:c.id,price:Math.max(1,D.rarityPrice(c.rarity)-run.discount),chromatic:Math.floor(Math.random()*CHROMATIC_RATE)===0,bought:false,id:uid('offer')};
}
function rollShop(force){
  if(!run)return;
  if(run.locked&&!force&&run.shop.length){run.locked=false;return;}
  const boost=run.rarityBoost||0;
  run.shop=[rollCreature(run.rank,boost),rollCreature(run.rank,boost),rollCreature(run.rank,boost),rollCreature(run.rank,boost)];
  const res=D.pick(D.resources);
  run.shop.push({kind:'resource',resourceId:res.id,price:Math.max(1,res.price-(trainer()?.effect==='economy'?1:0)),bought:false,id:uid('offer')});
  run.rarityBoost=0;
}
function rerollCost(){return trainer()?.effect==='economy'?2:3;}
function rerollShop(){
  if(!run)return;
  if(run.freeRerolls>0)run.freeRerolls--;
  else{const cost=rerollCost();if(run.gold<cost)return toast('No tienes suficiente Tinta.','bad');run.gold-=cost;}
  run.locked=false;rollShop(true);saveRun('reroll');renderRun();
}
function renderMarket(){
  const host=$('marketRow');if(!host)return;
  host.innerHTML=run.shop.map((o,i)=>{
    const affordable=run.gold>=o.price;
    if(o.kind==='creature'){
      const c=D.creature(o.creatureId),meta=abilityMeta(c),fit=strategicFit(c),fusion=fusionInfo(c.id,1,true);
      const rowLabel=meta.row==='front'?'🛡️ DELANTE':'⚡ DETRÁS';
      return '<article class="offer-card game-offer '+(o.bought?'bought ':'')+(o.chromatic?'chromatic ':'')+(affordable?'':'unaffordable')+'" data-role="'+esc(meta.role)+'">'+
        '<div class="offer-topline"><span class="role-badge">'+esc(meta.icon)+' '+esc(meta.role)+'</span><span class="rarity-name">'+esc(D.RARITIES[c.rarity].name)+'</span></div>'+
        '<div class="offer-body"><div class="offer-portrait"><span class="unit-emoji">'+esc(c.emoji)+'</span><div><h4>'+esc(c.name)+(o.chromatic?' ✦':'')+'</h4><small>'+rowLabel+'</small></div></div>'+
        '<div class="offer-type-row">'+c.types.map(t=>'<span class="offer-type">'+esc(D.TYPES[t].name)+'</span>').join('')+'</div>'+
        '<div class="offer-stats"><span>❤️ '+format(c.hp)+'</span><span>⚔️ '+format(c.damage)+'</span><span>⏱ '+c.cooldown.toFixed(1)+'s</span></div>'+
        '<div class="market-ability"><b>'+esc(c.ability.name)+'</b><p>'+esc(c.ability.text)+'</p><div>'+meta.tags.map(x=>'<span>'+esc(x)+'</span>').join('')+'</div></div>'+
        (fit.length?'<div class="fit-notes">'+fit.map(x=>'<span>✦ '+esc(x)+'</span>').join('')+'</div>':'')+
        '<div class="fusion-preview"><b>FUSIÓN</b><span>'+(fusion.current>=fusion.needed?'¡SUBE A Nv.2!':fusion.text+' hacia Nv.2')+'</span></div>'+
        '</div>'+
        '<div class="offer-footer"><span class="price">🖋️ '+o.price+'</span><button class="primary '+(affordable?'':'cant-afford')+'" data-buy="'+i+'" '+(!affordable?'disabled':'')+'>'+(affordable?'RECLUTAR':'FALTAN '+(o.price-run.gold))+'</button></div>'+
      '</article>';
    }
    const r=D.resource(o.resourceId);
    return '<article class="offer-card resource game-offer '+(o.bought?'bought ':'')+(affordable?'':'unaffordable')+'"><div class="offer-topline"><span class="role-badge">◆ RECURSO</span><span class="rarity-name">1 uso/jornada</span></div><div class="offer-body"><span class="unit-emoji">'+esc(r.icon)+'</span><h4>'+esc(r.name)+'</h4><div class="market-ability resource-copy"><b>EFECTO INMEDIATO</b><p>'+esc(r.text)+'</p></div></div><div class="offer-footer"><span class="price">🖋️ '+o.price+'</span><button class="primary '+(affordable?'':'cant-afford')+'" data-buy="'+i+'" '+(!affordable?'disabled':'')+'>'+(affordable?'USAR':'FALTAN '+(o.price-run.gold))+'</button></div></article>';
  }).join('');
}
function freeRef(){
  let i=run.team.findIndex(x=>!x);if(i>=0)return{area:'team',index:i};
  i=run.bench.findIndex(x=>!x);if(i>=0)return{area:'bench',index:i};
  return null;
}
function canAcceptCreature(id){
  if(freeRef())return true;
  const count=allUnits().filter(u=>u.creatureId===id&&u.level===1).length;
  return count>=2;
}
function createUnit(creatureId,chromatic,level,training){
  return {uid:uid('lex'),creatureId,level:level||1,training:training||0,chromatic:!!chromatic,createdAt:nowIso()};
}
function placeUnit(unit){
  const ref=freeRef();if(!ref)return false;
  (ref.area==='team'?run.team:run.bench)[ref.index]=unit;return true;
}
function removeUnitByUid(id){
  const ref=allUnitRefs().find(x=>x.unit.uid===id);if(!ref)return false;
  (ref.area==='team'?run.team:run.bench)[ref.index]=null;return true;
}
function addCreature(creatureId,chromatic){
  let incoming=createUnit(creatureId,chromatic,1,0);
  while(incoming.level<3){
    const need=incoming.level===1?2:1;
    const matches=allUnitRefs().filter(x=>x.unit.creatureId===incoming.creatureId&&x.unit.level===incoming.level);
    if(matches.length<need)break;
    const consumed=matches.slice(0,need);
    let chrom=incoming.chromatic,training=incoming.training;
    consumed.forEach(x=>{chrom=chrom||x.unit.chromatic;training+=x.unit.training||0;removeUnitByUid(x.unit.uid);});
    training=Math.min(20,training);
    incoming=createUnit(creatureId,chrom,incoming.level+1,training);
    run.stats.merges++;pendingRelicRewards++;
    const cc=D.creature(creatureId);
    toast('¡FUSIÓN! '+(cc?.name||'Lexario')+' sube a '+levelStars(incoming.level)+' · Nv.'+incoming.level,'good');
  }
  if(!placeUnit(incoming)){
    toast('No hay hueco para ese Lexario.','bad');return false;
  }
  run.stats.maxLevel=Math.max(run.stats.maxLevel,incoming.level);
  career.metrics.maxLevel=Math.max(career.metrics.maxLevel,incoming.level);
  if(incoming.chromatic){
    run.stats.chromatics++;career.metrics.chromatics++;career.chromatics[creatureId]=true;
  }
  career.discovered[creatureId]=true;
  return true;
}
function buyOffer(index){
  const o=run.shop[index];if(!o||o.bought)return;
  if(run.gold<o.price)return toast('No tienes suficiente Tinta.','bad');
  if(o.kind==='creature'&&!canAcceptCreature(o.creatureId))return toast('Equipo y reserva llenos. Fusiona o vende antes.','bad');
  if(o.kind==='resource'&&run.itemUse<=0)return toast('Ya has usado el Recurso de este día.','bad');
  run.gold-=o.price;o.bought=true;
  if(o.kind==='creature'){
    const wasDiscovered=!!career.discovered[o.creatureId];
    if(!addCreature(o.creatureId,o.chromatic)){run.gold+=o.price;o.bought=false;return;}
    run.stats.buys++;career.metrics.buys++;
    if(o.chromatic)toast('¡Variante cromática encontrada!','good');
    const t=trainer();
    if(t?.effect==='lexicon'&&!wasDiscovered&&!run.flags['lexicon_new_'+run.day]){
      run.trainingLeft+=1;run.flags['lexicon_new_'+run.day]=true;
    }
    if(run.discount>0)run.discount=0;
  }else{
    run.itemUse--;applyResource(D.resource(o.resourceId));
  }
  evaluateAchievements();saveCareer();saveRun('buy');renderRun();
  if(pendingRelicRewards>0)setTimeout(openRelicReward,80);
}
function applyResource(r){
  if(!r)return;
  if(r.effect==='training')run.trainingLeft+=r.value;
  if(r.effect==='gold')run.gold+=r.value;
  if(r.effect==='discount')run.discount=Math.max(run.discount,r.value);
  if(r.effect==='trainingBonus')run.trainingBonus+=r.value;
  if(r.effect==='rarityBoost')run.rarityBoost=Math.max(run.rarityBoost,r.value);
  if(r.effect==='freeReroll')run.freeRerolls+=r.value;
  if(r.effect==='retest'){run.trainingLeft+=1;run.flags.retest=true;}
  if(r.effect==='selectedTraining'){
    const u=unitAt(selected);
    if(u)u.training+=r.value; else {run.trainingBonus+=r.value;toast('Sin Lexario seleccionado: la mejora se aplicará al próximo entrenamiento.');}
  }
  if(r.effect==='typeTraining')allUnits().forEach(u=>{if(creatureOf(u)?.types.includes(r.type))u.training+=r.value;});
  toast(r.name+' aplicado.','good');
}
function openRelicReward(){
  if(pendingRelicRewards<=0)return;
  const count=(trainer()?.effect==='relics'&&run.stats.merges%2===0)?4:3;
  const owned=new Set(run.relics);
  let pool=D.shuffle(D.relics.filter(r=>!owned.has(r.id)));
  if(pool.length<count)pool=D.shuffle(D.relics);
  const choices=pool.slice(0,count);
  $('relicChoices').innerHTML=choices.map(r=>'<button class="reward-choice" data-relic="'+esc(r.id)+'"><span class="reward-icon">'+esc(r.icon)+'</span><h3>'+esc(r.name)+'</h3><p>'+esc(r.text)+'</p><small>'+esc(D.RARITIES[r.rarity]?.name||r.rarity)+'</small></button>').join('');
  openModal('relicModal');
}
function chooseRelic(id){
  if(!run.relics.includes(id))run.relics.push(id);
  pendingRelicRewards=Math.max(0,pendingRelicRewards-1);
  evaluateAchievements();saveCareer();saveRun('relic');renderRun();closeModal();
  if(pendingRelicRewards>0)setTimeout(openRelicReward,120);
}

function unitStats(u,index,teamUnits){
  const c=creatureOf(u);if(!c)return{hp:1,damage:1,cooldown:3};
  const levelMult=LEVEL_MULT[clamp(u.level,1,4)]||1;
  const trainMult=1+(u.training||0)*TRAINING_STEP;
  const team=teamUnits||rulesRun()?.team||[];
  const synergy=synergyBonusFor(u,team.filter(Boolean));
  let hp=c.hp*levelMult*trainMult*(1+synergy),damage=c.damage*levelMult*trainMult*(1+synergy),cooldown=c.cooldown;
  const t=trainer();
  if(t?.effect==='ortho'&&c.types.includes('ortografia')){hp*=1.18;damage*=1.18;}
  if(t?.effect==='verbs'&&c.types.includes('verbos'))cooldown*=.85;
  if(typeof index==='number'&&index>=0&&index<6){
    if(index<3){hp*=1.25;cooldown*=1.10;}
    else{hp*=.90;cooldown*=.85;}
  }
  if(t?.effect==='adjacency'&&typeof index==='number'&&index>=0){
    const neighbors=adjacencyCount(index,team);damage*=1+neighbors*.07;
  }
  hp*=1+countRelicEffect('teamHp');
  damage*=1+countRelicEffect('teamDamage');
  cooldown*=1-countRelicEffect('teamSpeed');
  if(u.level>=2)damage*=1+countRelicEffect('leveledDamage');
  const types=Object.keys(teamTypeCounts(team.filter(Boolean))).length;
  if(types>=4)damage*=1+countRelicEffect('diversityDamage');
  const diversityAll=countRelicEffect('diversityAll');
  if(diversityAll){hp*=1+types*diversityAll;damage*=1+types*diversityAll;cooldown*=Math.max(.55,1-types*diversityAll);}
  if(team.filter(Boolean).length===6)hp*=1+countRelicEffect('fullTeamHp');
  return{hp:Math.round(hp),damage:Math.round(damage),cooldown:Math.max(.8,cooldown)};
}

function trainSelected(){
  const u=unitAt(selected);if(!u)return toast('Selecciona antes un Lexario.','bad');
  if(run.trainingLeft<=0)return toast('No quedan sesiones de entrenamiento hoy.','bad');
  const c=creatureOf(u),category=D.pick(c.types);
  currentQuestion={mode:'run',ref:{...selected},data:D.question(category,run.id+'_'+run.day+'_'+run.stats.trainingAttempts+'_'+Date.now())};
  renderTrainingQuestion();
}
function renderTrainingQuestion(){
  if(!currentQuestion)return;
  const q=currentQuestion.data,u=currentQuestion.mode==='run'?unitAt(currentQuestion.ref):null,c=u?creatureOf(u):null;
  $('trainingTitle').textContent=currentQuestion.mode==='run'?'Entrenar '+c.name:'Entrenamiento libre';
  let projectedGain=1;
  if(currentQuestion.mode==='run'){
    projectedGain+=run.trainingBonus||0;
    if(trainer()?.effect==='teacher')projectedGain*=2;
    if(u?.chromatic&&hasRelic('folio_dorado'))projectedGain*=2;
  }
  const target=currentQuestion.mode==='run'?'<div class="training-target"><span class="unit-emoji">'+esc(c.emoji)+'</span><div><b>'+esc(c.name)+'</b><small> · '+esc(D.TYPES[q.category].name)+' · entrenamiento '+u.training+' = +'+Math.round((u.training||0)*TRAINING_STEP*100)+'% vida/potencia</small></div><strong>ACIERTO = +'+Math.round(projectedGain*TRAINING_STEP*100)+'%</strong></div>':'';
  $('trainingBody').innerHTML=target+
    '<div class="question-meta"><span>'+esc(D.TYPES[q.category].name)+'</span><span>Elige una respuesta</span></div>'+
    '<div class="question-card" style="margin-top:10px"><h3>'+esc(q.prompt)+'</h3><div class="answers">'+q.answers.map((a,i)=>'<button class="answer-btn" data-answer="'+i+'">'+esc(a)+'</button>').join('')+'</div><div id="trainingFeedback" style="margin-top:12px;color:var(--muted)"></div></div>';
  openModal('trainingModal');
}
function answerTraining(index){
  if(!currentQuestion)return;
  const buttons=qsa('#trainingBody [data-answer]');
  buttons.forEach(b=>b.disabled=true);
  const q=currentQuestion.data,correct=index===q.correct;
  buttons[index]?.classList.add(correct?'correct':'wrong');
  if(!correct)buttons[q.correct]?.classList.add('correct');
  const feedback=$('trainingFeedback');
  if(feedback)feedback.innerHTML='<b style="color:'+(correct?'var(--green)':'var(--red)')+'">'+(correct?'Correcto.':'No exactamente.')+'</b> '+esc(q.explanation);
  if(currentQuestion.mode==='run'){
    run.trainingLeft=Math.max(0,run.trainingLeft-1);
    run.stats.trainingAttempts++;career.metrics.trainingAttempts++;
    if(correct){
      const u=unitAt(currentQuestion.ref);
      let gain=1+(run.trainingBonus||0);run.trainingBonus=0;
      if(trainer()?.effect==='teacher')gain*=2;
      if(u?.chromatic&&hasRelic('folio_dorado'))gain*=2;
      if(u)u.training=Math.min(20,(u.training||0)+gain);
      if(feedback)feedback.innerHTML='<b style="color:var(--green)">Correcto · +'+Math.round(gain*TRAINING_STEP*100)+'% vida y potencia.</b> '+esc(q.explanation);
      run.stats.trainingCorrect++;run.stats.trainingStreak++;run.stats.maxTrainingStreak=Math.max(run.stats.maxTrainingStreak,run.stats.trainingStreak);
      career.metrics.trainingCorrect++;career.metrics.trainingStreak++;career.metrics.maxTrainingStreak=Math.max(career.metrics.maxTrainingStreak,career.metrics.trainingStreak);
      career.xp+=12;
      const c=u&&creatureOf(u);
      if(trainer()?.effect==='corrector'&&c?.types.includes('ortografia')&&!run.flags['ortho_refund_'+run.day]){
        run.trainingLeft++;run.flags['ortho_refund_'+run.day]=true;
      }
      if(run.flags.retest){run.gold++;run.flags.retest=false;}
    }else{
      run.stats.trainingStreak=0;career.metrics.trainingStreak=0;career.xp+=2;
    }
    evaluateAchievements();saveCareer();saveRun('training');
    setTimeout(()=>{closeModal();renderRun();},1100);
  }else{
    practiceStats.attempts++;
    if(correct){practiceStats.correct++;practiceStats.streak++;career.xp+=4;career.metrics.trainingCorrect++;career.metrics.trainingStreak++;career.metrics.maxTrainingStreak=Math.max(career.metrics.maxTrainingStreak,career.metrics.trainingStreak);}
    else{practiceStats.streak=0;career.metrics.trainingStreak=0;career.xp+=1;}
    evaluateAchievements();saveCareer();
    setTimeout(()=>{closeModal();renderPractice();newPracticeQuestion();},950);
  }
}
function showPractice(){
  showScreen('practiceScreen');
  practiceStats={correct:0,attempts:0,streak:0};
  renderPractice();newPracticeQuestion();
}
function renderPractice(){
  $('practiceCategories').innerHTML=Object.values(D.TYPES).map(t=>'<button class="secondary '+(practiceCategory===t.id?'active':'')+'" data-practice="'+esc(t.id)+'">'+esc(t.icon)+' '+esc(t.name)+'</button>').join('');
  const acc=practiceStats.attempts?Math.round(practiceStats.correct/practiceStats.attempts*100):0;
  $('practiceStats').innerHTML='<article><span>Aciertos</span><b>'+practiceStats.correct+'</b></article><article><span>Intentos</span><b>'+practiceStats.attempts+'</b></article><article><span>Precisión</span><b>'+acc+'%</b></article><article><span>Racha</span><b>'+practiceStats.streak+'</b></article><article><span>XP perfil</span><b>'+career.xp+'</b></article>';
}
function newPracticeQuestion(){
  const q=D.question(practiceCategory,'practice_'+Date.now()+'_'+Math.random());
  $('practiceQuestion').innerHTML='<span class="micro-label">'+esc(D.TYPES[practiceCategory].name)+'</span><h3>'+esc(q.prompt)+'</h3><div class="answers">'+q.answers.map((a,i)=>'<button class="answer-btn" data-practice-answer="'+i+'">'+esc(a)+'</button>').join('')+'</div><div id="practiceFeedback" style="margin-top:12px;color:var(--muted)"></div>';
  currentQuestion={mode:'practice',data:q};
}

function lockShop(){run.locked=!run.locked;saveRun('lock_shop');renderRun();}
function eventForDay(day){
  if(day===3)return{title:'El aula vacía',text:'Tienes una hora libre antes del siguiente encuentro.',choices:[
    {icon:'🪙',name:'Ordenar apuntes',text:'+7 Tinta.',effect:'gold',value:7},
    {icon:'🎓',name:'Repasar',text:'+4 sesiones de entrenamiento hoy.',effect:'training',value:4},
    {icon:'🔰',name:'Rebuscar en el archivo',text:'Elige una reliquia.',effect:'relic'}
  ]};
  if(day===6)return{title:'Feria del libro',text:'Una editorial ambulante te ofrece una ventaja para la segunda mitad.',choices:[
    {icon:'📚',name:'Comprar lote',text:'El siguiente mercado tiene más rareza.',effect:'rarity',value:2},
    {icon:'🧪',name:'Taller intensivo',text:'Todos tus Lexarios ganan +1 entrenamiento.',effect:'teamTrain',value:1},
    {icon:'🪶',name:'Puesto de antigüedades',text:'Elige una reliquia.',effect:'relic'}
  ]};
  if(day===9)return{title:'Última revisión',text:'La liga entra en su tramo decisivo.',choices:[
    {icon:'❤️',name:'Corrección extra',text:'+2 vidas.',effect:'lives',value:2},
    {icon:'🪙',name:'Presupuesto final',text:'+10 Tinta.',effect:'gold',value:10},
    {icon:'🎓',name:'Clase de refuerzo',text:'+5 sesiones hoy y +1 entrenamiento a todo el equipo.',effect:'boost',value:1}
  ]};
  return null;
}
function openDayEvent(){
  const ev=eventForDay(run.day);if(!ev||run.eventsSeen.includes(run.day))return false;
  $('eventTitle').textContent=ev.title;$('eventText').textContent=ev.text;
  $('eventChoices').innerHTML=ev.choices.map((c,i)=>'<button class="reward-choice" data-event-choice="'+i+'"><span class="reward-icon">'+c.icon+'</span><h3>'+esc(c.name)+'</h3><p>'+esc(c.text)+'</p></button>').join('');
  $('eventModal').dataset.day=run.day;
  openModal('eventModal');return true;
}
function chooseEvent(index){
  const ev=eventForDay(run.day),c=ev?.choices[index];if(!c)return;
  run.eventsSeen.push(run.day);
  if(c.effect==='gold')run.gold+=c.value;
  if(c.effect==='training')run.trainingLeft+=c.value;
  if(c.effect==='rarity')run.rarityBoost=Math.max(run.rarityBoost,c.value);
  if(c.effect==='teamTrain')run.team.filter(Boolean).forEach(u=>u.training+=c.value);
  if(c.effect==='lives')run.lives+=c.value;
  if(c.effect==='boost'){run.trainingLeft+=5;run.team.filter(Boolean).forEach(u=>u.training+=c.value);}
  if(c.effect==='relic'){pendingRelicRewards++;closeModal();openRelicReward();saveRun('event');renderRun();return;}
  closeModal();saveRun('event');renderRun();
}

function enemyForDay(){
  const rng=D.seeded(run.id+'_enemy_'+run.day);
  const count=clamp(2+Math.floor(run.day/2),2,6);
  const team=Array(TEAM_SIZE).fill(null);
  for(let i=0;i<count;i++){
    const available=D.creatures.filter(c=>{
      const tier={common:1,uncommon:2,rare:3,epic:5,legendary:7}[c.rarity]||1;
      return tier<=Math.min(7,run.day+1);
    });
    const c=D.pick(available,rng);
    let lvl=1;
    if(run.day>=5&&rng()<.28)lvl=2;
    if(run.day>=8&&rng()<.22)lvl=2;
    if(run.day>=11&&rng()<.13)lvl=3;
    team[i]=createUnit(c.id,rng()<1/280,lvl,Math.max(0,Math.floor((run.day-2)/4)));
  }
  return{trainer:D.pick(D.trainers,rng),team};
}

function makeDuelSquad(){
  if(!run||!run.team.some(Boolean))return null;
  const previousContext=battleContext,previousDuel=duelRunContext;
  battleContext='adventure';duelRunContext=null;
  const stats=formationTotals(run.team);
  battleContext=previousContext;duelRunContext=previousDuel;
  return {
    version:1,
    trainerId:run.trainerId,
    relics:(run.relics||[]).slice(),
    team:JSON.parse(JSON.stringify(run.team)),
    publishedAt:nowIso(),
    stats
  };
}
function showStudentBattle(){
  if(!run)run=loadRun();
  battleContext='student';
  const snap=career.duelSquad||makeDuelSquad();
  duelRunContext=snap?{trainerId:snap.trainerId,relics:snap.relics||[],team:snap.team,day:1,stats:{damage:0,biggestHit:0,maxShield:0,casts:0}}:null;
  showScreen('studentBattleScreen');
  const status=$('studentSyncStatus');
  if(status&&!window.__LENGUARCADE_EMBEDDED){
    status.textContent='Laboratorio local · rivales de prueba';
    status.classList.remove('online');
  }
  renderStudentBattle();
  window.LexariaBridge?.requestOpponents?.();
}
function renderStudentBattle(){
  const snap=career.duelSquad||makeDuelSquad();
  const preview=$('duelSquadPreview'),statsHost=$('duelSquadStats');
  if(snap&&snap.team?.some(Boolean)){
    preview.innerHTML=snap.team.map((u,i)=>u?unitCard(u,false,'duel',i):'<div class="board-slot"></div>').join('');
    const totals=snap.stats||formationTotals(snap.team);
    statsHost.innerHTML='<div><span>❤️ VIDA TOTAL</span><b>'+format(totals.hp)+'</b></div><div><span>⚔️ DAÑO TOTAL</span><b>'+format(totals.damage)+'</b></div>';
  }else{
    preview.innerHTML='<div class="opponent-empty" style="grid-column:1/-1">Todavía no tienes una formación. Entra en Aventura, recluta Lexarios y vuelve aquí.</div>';
    statsHost.innerHTML='';
  }
  $('publishSquadBtn').disabled=!run?.team?.some(Boolean);
  renderOpponents();
}
function publishCurrentSquad(){
  const snap=makeDuelSquad();
  if(!snap)return toast('Necesitas una formación activa en Aventura.','bad');
  career.duelSquad=snap;
  duelRunContext={trainerId:snap.trainerId,relics:snap.relics||[],team:snap.team,day:1,stats:{damage:0,biggestHit:0,maxShield:0,casts:0}};
  saveCareer();
  renderStudentBattle();
  window.LexariaBridge?.publishSquad?.(snap);
  toast('Formación publicada para la Arena de clase.','good');
}
function mockStudentOpponents(){
  if(!run?.team?.some(Boolean))return [];
  const names=['Rival de prueba · Alba','Rival de prueba · Hugo','Rival de prueba · Inés','Rival de prueba · Mateo'];
  return names.map((name,k)=>{
    const rng=D.seeded((run.id||'lexaria')+'_duel_mock_'+k);
    const team=Array(6).fill(null).map((_,i)=>{
      if(i>=3+k%3&&rng()<.28)return null;
      const pool=D.creatures.filter(c=>({common:1,uncommon:2,rare:3,epic:4,legendary:5}[c.rarity]||1)<=Math.max(2,run.rank||1));
      const c=D.pick(pool.length?pool:D.creatures,rng);
      return createUnit(c.id,rng()<.01,1+(run.day>6&&rng()<.28?1:0),Math.max(0,Math.floor((run.day-1)/4)));
    });
    return{id:'mock_'+k,name,trainerId:D.pick(D.trainers,rng).id,relics:[],team,practice:true};
  });
}
function setStudentOpponents(list){
  studentOpponents=Array.isArray(list)?list.filter(o=>o&&Array.isArray(o.team)):[];
  const status=$('studentSyncStatus');
  if(status){
    status.textContent=studentOpponents.length?'Conectado · '+studentOpponents.length+' formaciones de clase':'Conectado · todavía no hay formaciones publicadas';
    status.classList.add('online');
  }
  renderOpponents();
}
function refreshStudentOpponents(){
  window.LexariaBridge?.requestOpponents?.();
  renderOpponents();
}
function opponentTotals(op){
  let hp=0,damage=0;
  (op.team||[]).forEach((u,i)=>{
    if(!u)return;
    const st=studentOpponentStats(u,i,op.team,op);
    hp+=st.hp;damage+=st.damage;
  });
  return{hp:Math.round(hp),damage:Math.round(damage)};
}
function renderOpponents(){
  const host=$('opponentList');if(!host)return;
  const real=studentOpponents;
  const list=real.length?real:mockStudentOpponents();
  if(!list.length){
    host.innerHTML='<div class="opponent-empty">Crea primero un equipo en Modo Aventura. Cuando Lexaria esté integrado en LenguArcade, aquí aparecerán las formaciones publicadas por tus compañeros.</div>';
    return;
  }
  host.innerHTML=list.slice(0,8).map((op,i)=>{
    const t=D.trainer(op.trainerId),tot=opponentTotals(op);
    return '<article class="opponent-card"><span class="opponent-avatar">'+esc(t?.emoji||'🎓')+'</span><div><h3>'+esc(op.name||('Alumno '+(i+1)))+(op.practice?' · PRUEBA':'')+'</h3><p>'+esc(t?.name||'Entrenador')+'</p><div class="opponent-power"><span>❤️ '+format(tot.hp)+'</span><span>⚔️ '+format(tot.damage)+'</span></div></div><button class="primary" data-duel-opponent="'+i+'" data-duel-source="'+(real.length?'real':'mock')+'">DESAFIAR</button></article>';
  }).join('');
}
function studentOpponentStats(u,index,team,snapshot){
  const c=creatureOf(u);if(!c)return{hp:1,damage:1,cooldown:3};
  const levelMult=LEVEL_MULT[clamp(u.level,1,4)]||1;
  const trainMult=1+(u.training||0)*TRAINING_STEP;
  let hp=c.hp*levelMult*trainMult,damage=c.damage*levelMult*trainMult,cooldown=c.cooldown;
  const counts={};team.filter(Boolean).forEach(x=>creatureOf(x)?.types.forEach(t=>counts[t]=(counts[t]||0)+1));
  let syn=0;c.types.forEach(t=>{const n=counts[t]||0;syn=Math.max(syn,n>=6?.20:n>=4?.12:n>=2?.05:0);});
  hp*=1+syn;damage*=1+syn;
  if(index<3){hp*=1.25;cooldown*=1.10;}else{hp*=.90;cooldown*=.85;}
  const tr=D.trainer(snapshot?.trainerId);
  if(tr?.effect==='ortho'&&c.types.includes('ortografia')){hp*=1.18;damage*=1.18;}
  if(tr?.effect==='verbs'&&c.types.includes('verbos'))cooldown*=.85;
  return{hp:Math.round(hp),damage:Math.round(damage),cooldown:Math.max(.8,cooldown)};
}
function startStudentBattle(index,source){
  const own=career.duelSquad||makeDuelSquad();
  if(!own?.team?.some(Boolean))return toast('Publica primero una formación.','bad');
  const list=source==='real'?studentOpponents:mockStudentOpponents();
  const op=list[index];if(!op)return toast('Ese rival ya no está disponible.','bad');
  battleContext='student';
  duelRunContext={trainerId:own.trainerId,relics:own.relics||[],team:own.team,day:1,stats:{damage:0,biggestHit:0,maxShield:0,casts:0}};
  selected=null;showScreen('battleScreen');
  battle=createBattleState(own.team,op.team,D.trainer(op.trainerId),op);
  battle.opponentName=op.name||'Rival';
  renderBattleStatic(D.trainer(op.trainerId));
  applyBattleStart();renderBattle();
  clearInterval(battleTimer);battleTimer=setInterval(battleTick,100);
}
function startBattle(){
  battleContext='adventure';duelRunContext=null;
  if(!run.team.some(Boolean))return toast('Necesitas al menos un Lexario en el equipo.','bad');
  selected=null;
  showScreen('battleScreen');
  const enemy=enemyForDay();
  battle=createBattleState(run.team,enemy.team,enemy.trainer);
  renderBattleStatic(enemy.trainer);
  applyBattleStart();
  renderBattle();
  clearInterval(battleTimer);
  battleTimer=setInterval(battleTick,100);
  window.LexariaBridge?.checkpoint?.('battle_start');
}
function buildSide(team,kind,opponentSnapshot){
  const units=team.map((u,i)=>u?{
    unit:JSON.parse(JSON.stringify(u)),index:i,stats:kind==='player'?unitStats(u,i,team):(battleContext==='student'?studentOpponentStats(u,i,team,opponentSnapshot):enemyStats(u,i,team)),
    cooldown:0,casts:0,ramp:0,clutch:false
  }:null);
  const hp=Math.round(160+units.filter(Boolean).reduce((s,b)=>s+b.stats.hp*.82,0));
  return{kind,units,maxHp:hp,hp,shield:0,burn:0,poison:0,shock:0,guard:0,haste:0,silence:0,teamRamp:0,castCount:0,fatalGuardUsed:false,lastSupport:0};
}
function enemyStats(u,index,team){
  const c=creatureOf(u),levelMult=LEVEL_MULT[clamp(u.level,1,4)]||1;
  const scale=1+Math.max(0,run.day-1)*.035;
  let hp=c.hp*levelMult*scale,damage=c.damage*levelMult*scale,cooldown=c.cooldown*(1-Math.min(.16,run.day*.008));
  if(index<3){hp*=1.25;cooldown*=1.10;}else{hp*=.90;cooldown*=.85;}
  return{hp:Math.round(hp),damage:Math.round(damage),cooldown:Math.max(.85,cooldown)};
}
function createBattleState(playerTeam,enemyTeam,enemyTrainer,opponentSnapshot){
  const seedBase=battleContext==='student'?(career.duelSquad?.publishedAt||Date.now())+'_'+(opponentSnapshot?.id||'rival'):(run.id+'_battle_'+run.day);
  return{player:buildSide(playerTeam,'player'),enemy:buildSide(enemyTeam,'enemy',opponentSnapshot),enemyTrainer,time:0,sudden:0,ended:false,log:[],rng:D.seeded(seedBase),firstAbilityDone:{player:false,enemy:false},speed:1,opponentSnapshot};
}
function renderBattleStatic(enemyTrainer){
  const t=trainer();
  const pTotal={hp:battle.player.units.filter(Boolean).reduce((a,b)=>a+b.stats.hp,0),damage:battle.player.units.filter(Boolean).reduce((a,b)=>a+b.stats.damage,0)};
  const eTotal={hp:battle.enemy.units.filter(Boolean).reduce((a,b)=>a+b.stats.hp,0),damage:battle.enemy.units.filter(Boolean).reduce((a,b)=>a+b.stats.damage,0)};
  $('battlePlayerTrainer').innerHTML='<span class="avatar">'+esc(t?.emoji||'🎓')+'</span><span>'+esc(t?.name||'Tú')+'<small class="battle-formation-summary">❤️ <b>'+format(pTotal.hp)+'</b> · ⚔️ <b>'+format(pTotal.damage)+'</b></small></span>';
  $('battleEnemyTrainer').innerHTML='<span>'+esc(enemyTrainer?.name||'Rival')+'<small class="battle-formation-summary">❤️ <b>'+format(eTotal.hp)+'</b> · ⚔️ <b>'+format(eTotal.damage)+'</b></small></span><span class="avatar">'+esc(enemyTrainer?.emoji||'🎭')+'</span>';
  $('battleDayLabel').textContent=battleContext==='student'?'ARENA DE CLASE':'JORNADA '+run.day;
  $('battleVsLabel').textContent=battleContext==='student'?(battle.opponentName||'DUELO'):'ENCUENTRO '+(run.wins+1);
  $('battleLog').innerHTML='';
  renderBattleBoard('playerBattleBoard',battle.player);
  renderBattleBoard('enemyBattleBoard',battle.enemy);
}
function renderBattleBoard(id,side){
  $(id).innerHTML=side.units.map((b,i)=>{
    if(!b)return '<div class="battle-unit empty '+(i<3?'front':'back')+'"></div>';
    const c=creatureOf(b.unit),meta=abilityMeta(c);
    return '<div class="battle-unit '+(i<3?'front ':'back ')+(b.unit.chromatic?'chromatic ':'')+'" data-battle-side="'+side.kind+'" data-battle-index="'+i+'">'+
      '<div class="battle-unit-top"><span class="battle-stars">'+levelStars(b.unit.level)+'</span><span class="battle-role">'+esc(meta.icon)+' '+esc(meta.role)+'</span></div>'+
      '<span class="unit-emoji">'+esc(c.emoji)+'</span><span class="unit-name">'+esc(c.name)+'</span>'+
      '<span class="battle-ability-name">'+esc(c.ability.name)+'</span>'+
      '<div class="cooldown-label"><span>HABILIDAD</span><b>0%</b></div><div class="cooldown-ring"><i></i></div>'+
    '</div>';
  }).join('');
}
function logBattle(text){
  battle.log.unshift({t:battle.time,text});battle.log=battle.log.slice(0,14);
  $('battleLog').innerHTML=battle.log.map(x=>'<p><span>'+x.t.toFixed(1)+'s</span> '+x.text+'</p>').join('');
}
function sideName(side){return side.kind==='player'?'Tu equipo':'El rival';}
function addShield(side,amount){
  side.shield=Math.max(0,side.shield+Math.round(amount));side.lastSupport=amount;
  if(side.kind==='player'&&battleContext==='adventure'&&run){run.stats.maxShield=Math.max(run.stats.maxShield,side.shield);career.metrics.maxShield=Math.max(career.metrics.maxShield,side.shield);}
}
function heal(side,amount){
  const real=Math.max(0,Math.min(side.maxHp-side.hp,Math.round(amount)));side.hp+=real;side.lastSupport=real;return real;
}
function directHit(target,amount,source){
  let dmg=Math.max(1,Math.round(amount));
  if(target.guard>0)dmg=Math.round(dmg*(1-clamp(target.guard/100,0,.65)));
  if(target.shock>0){const extra=Math.round(target.shock*4);dmg+=extra;target.shock=Math.max(0,target.shock-1);}
  if(target.kind==='player'&&hasRelic('goma')&&!target.fatalGuardUsed&&target.hp-dmg<=target.maxHp*.25){
    target.fatalGuardUsed=true;dmg=Math.max(0,target.hp-Math.ceil(target.maxHp*.26));logBattle('<b>Goma imposible</b> evita una derrota crítica.');
  }
  let remaining=dmg;
  if(target.shield>0){const absorbed=Math.min(target.shield,remaining);target.shield-=absorbed;remaining-=absorbed;}
  target.hp=Math.max(0,target.hp-remaining);
  if(battle&&source?.kind==='player'&&battleContext==='adventure'&&run){run.stats.damage+=dmg;run.stats.biggestHit=Math.max(run.stats.biggestHit,dmg);career.metrics.biggestHit=Math.max(career.metrics.biggestHit,dmg);}
  return dmg;
}
function applyBattleStart(){
  const p=battle.player,e=battle.enemy;
  const back=countRelicEffect('backShield');if(back){const n=[3,4,5].filter(i=>p.units[i]).length;addShield(p,back*n);}
  const startHaste=countRelicEffect('startHaste');p.units.forEach(b=>{if(b)b.cooldown=b.stats.cooldown*(1-startHaste);});
  e.units.forEach(b=>{if(b)b.cooldown=b.stats.cooldown*(.75+battle.rng()*.25);});
  if(!startHaste)p.units.forEach(b=>{if(b)b.cooldown=b.stats.cooldown*(.65+battle.rng()*.25);});
  p.units.forEach(b=>{if(b&&creatureOf(b.unit)?.ability.kind==='startCast')castAbility(p,e,b,true);});
  e.units.forEach(b=>{if(b&&creatureOf(b.unit)?.ability.kind==='startCast')castAbility(e,p,b,true);});
  logBattle('<b>Comienza el encuentro.</b> Las habilidades se lanzan automáticamente.');
}
function abilityPower(b,base){
  const c=creatureOf(b.unit);
  const scale=c?.damage?b.stats.damage/c.damage:1;
  let amount=(base||c?.damage||b.stats.damage)*scale;
  if(battle.time>=20&&battle.player.units.includes(b))amount*=1+countRelicEffect('lateDamage');
  if(battle.player.units.includes(b))amount*=1+battle.player.teamRamp/100;
  else amount*=1+battle.enemy.teamRamp/100;
  return amount;
}
function battleActionFx(side,target,b,c,a,dealt,healed,shielded){
  const source=document.querySelector('[data-battle-side="'+side.kind+'"][data-battle-index="'+b.index+'"]');
  const targetBoard=$(target.kind==='player'?'playerBattleBoard':'enemyBattleBoard');
  const ownBoard=$(side.kind==='player'?'playerBattleBoard':'enemyBattleBoard');
  const layer=$('battleFxLayer'),callout=$('abilityCallout');
  if(source){source.classList.remove('casting');void source.offsetWidth;source.classList.add('casting');}
  if(dealt>0&&targetBoard){
    targetBoard.classList.remove('team-hit');void targetBoard.offsetWidth;targetBoard.classList.add('team-hit');
    setTimeout(()=>targetBoard.classList.remove('team-hit'),260);
  }
  if(layer&&source&&targetBoard&&dealt>0){
    const lr=layer.getBoundingClientRect(),sr=source.getBoundingClientRect(),tr=targetBoard.getBoundingClientRect();
    const x1=sr.left+sr.width/2-lr.left,y1=sr.top+sr.height/2-lr.top;
    const x2=tr.left+tr.width/2-lr.left,y2=tr.top+tr.height/2-lr.top;
    const bolt=document.createElement('i');
    bolt.className='battle-projectile '+side.kind;
    bolt.style.left=x1+'px';bolt.style.top=y1+'px';bolt.style.setProperty('--dx',(x2-x1)+'px');bolt.style.setProperty('--dy',(y2-y1)+'px');
    layer.appendChild(bolt);setTimeout(()=>bolt.remove(),420);
  }
  const floatHost=dealt>0?targetBoard:ownBoard;
  if(layer&&floatHost&&(dealt>0||healed>0||shielded>0)){
    const lr=layer.getBoundingClientRect(),hr=floatHost.getBoundingClientRect();
    const n=document.createElement('b');
    n.className='battle-float '+(dealt>0?'damage':healed>0?'heal':'shield');
    n.textContent=dealt>0?'−'+format(dealt):healed>0?'+'+format(healed)+' CURA':'+'+format(shielded)+' ESCUDO';
    n.style.left=(hr.left+hr.width/2-lr.left)+'px';n.style.top=(hr.top+hr.height*.34-lr.top)+'px';
    layer.appendChild(n);setTimeout(()=>n.remove(),760);
  }
  if(callout){
    callout.className='ability-callout '+side.kind;
    callout.innerHTML='<span>'+esc(c.name)+'</span><b>'+esc(a.name)+'</b><small>'+(dealt>0?format(dealt)+' daño':healed>0?format(healed)+' de cura':shielded>0?format(shielded)+' de escudo':'efecto de equipo')+'</small>';
    setTimeout(()=>{if(callout)callout.className='ability-callout hidden';},900);
  }
}
function castAbility(side,target,b,free){
  if(!b||battle.ended)return;
  if(side.silence>0&&!free){side.silence--;b.cooldown=b.stats.cooldown*.75;logBattle(sideName(side)+' pierde un lanzamiento por silencio.');return;}
  const c=creatureOf(b.unit),a=c.ability;
  side.castCount++;b.casts++;
  if(side.kind==='player'&&battleContext==='adventure'&&run){run.stats.casts++;}
  const mult=(side.kind==='player'&&!battle.firstAbilityDone.player&&hasRelic('lupa'))?2:1;
  if(side.kind==='player')battle.firstAbilityDone.player=true;else battle.firstAbilityDone.enemy=true;
  for(let repeat=0;repeat<mult;repeat++){
    executeAbility(a,side,target,b,c);
  }
  if(side.kind==='player'&&hasRelic('abaco')&&side.castCount%5===0)heal(side,side.maxHp*.04);
  b.cooldown=b.stats.cooldown/Math.max(.45,1+(side.haste/100));
}
function executeAbility(a,side,target,b,c){
  const p=abilityPower(b,a.power||c.damage);
  const beforeHp=side.hp,beforeShield=side.shield;
  let dealt=0;
  switch(a.kind){
    case'damageBurn':dealt=directHit(target,p,side);target.burn+=a.status||2;break;
    case'doubleIfShield':dealt=directHit(target,p,side);if(side.shield>0)dealt+=directHit(target,p*.72,side);break;
    case'teamShieldHaste':addShield(side,p);side.haste+=a.status||8;break;
    case'rampingDamage':b.ramp++;dealt=directHit(target,p*(1+b.ramp*.16),side);break;
    case'healShield':heal(side,p);addShield(side,a.status||18);break;
    case'selfHasteHit':dealt=directHit(target,p,side);b.cooldown=Math.max(0,b.cooldown-(a.status||10)/10);break;
    case'doubleShock':dealt=directHit(target,p,side)+directHit(target,p*.72,side);target.shock+=a.status||2;break;
    case'teamHaste':side.haste+=a.status||15;break;
    case'statusPunish':dealt=directHit(target,p*(target.burn+target.poison+target.shock>0?1.65:1),side);break;
    case'poison':dealt=directHit(target,p*.6,side);target.poison+=a.status||3;break;
    case'crit':{const crit=battle.rng()*100<(a.status||35);dealt=directHit(target,p*(crit?2:1),side);break;}
    case'echoSupport':{const v=Math.max(p,side.lastSupport||0);if(side.hp<side.maxHp*.72)heal(side,v);else addShield(side,v);break;}
    case'missingHpDamage':dealt=directHit(target,p*(1+(1-side.hp/side.maxHp)*1.3),side);break;
    case'cycleEffect':{const mode=b.casts%3;if(mode===1)dealt=directHit(target,p,side);else if(mode===2)addShield(side,p);else heal(side,p);break;}
    case'maxHpHeal':heal(side,p);break;
    case'shieldStrike':addShield(side,a.status||22);dealt=directHit(target,p+side.shield*.18,side);break;
    case'startCast':dealt=directHit(target,p,side);break;
    case'teamRamp':side.teamRamp+=a.power||8;break;
    case'teamGuard':addShield(side,p);side.guard=Math.min(55,side.guard+(a.status||5));break;
    case'copyAlly':{const allies=side.units.filter(x=>x&&x!==b);const other=D.pick(allies,battle.rng);if(other)executeAbility(creatureOf(other.unit).ability,side,target,b,c);else dealt=directHit(target,b.stats.damage,side);break;}
    case'adjacentShield':{const n=adjacentIndexes(b.index).filter(i=>side.units[i]).length;addShield(side,p*Math.max(1,n));break;}
    case'shock':dealt=directHit(target,p,side);target.shock+=a.status||2;break;
    case'typeHeal':{const counts=teamTypeCounts(side.units.filter(Boolean).map(x=>x.unit));const shared=c.types.reduce((s,t)=>s+(counts[t]||0),0);heal(side,p*(1+shared*.12));break;}
    case'heavySilence':dealt=directHit(target,p,side);target.silence+=a.status||1;break;
    case'trinity':dealt=directHit(target,p,side);heal(side,p*.55);addShield(side,a.status||26);break;
    case'adjacentHaste':{const n=adjacentIndexes(b.index).filter(i=>side.units[i]).length;side.haste+=Math.max(1,n)*(a.status||12);break;}
    case'clutchHeal':{if(!b.clutch&&side.hp<side.maxHp*.5){b.clutch=true;heal(side,p);logBattle('<b>'+esc(c.name)+'</b> ejecuta un giro narrativo.');}else dealt=directHit(target,b.stats.damage,side);break;}
    case'randomStatus':{dealt=directHit(target,p,side);const k=Math.floor(battle.rng()*3);if(k===0)target.burn+=a.status||3;if(k===1)target.poison+=a.status||3;if(k===2)target.shock+=a.status||3;break;}
    case'diversityBlast':{const types=Object.keys(teamTypeCounts(side.units.filter(Boolean).map(x=>x.unit))).length;dealt=directHit(target,p*(1+types*.16),side);break;}
    default:dealt=directHit(target,p,side);
  }
  const healed=Math.max(0,side.hp-beforeHp),shielded=Math.max(0,side.shield-beforeShield);
  battleActionFx(side,target,b,c,a,dealt,healed,shielded);
  if(dealt>0)logBattle('<b>'+esc(c.name)+'</b> usa '+esc(a.name)+' → <strong>'+format(dealt)+' daño</strong>.');
  else if(healed>0||shielded>0)logBattle('<b>'+esc(c.name)+'</b> usa '+esc(a.name)+' → '+(healed>0?format(healed)+' cura ':'')+(shielded>0?format(shielded)+' escudo':'')+'.');
  else logBattle('<b>'+esc(c.name)+'</b> usa '+esc(a.name)+'.');
}
function statusTick(side,target){
  if(side.burn>0){directHit(side,side.burn*2,null);side.burn=Math.max(0,side.burn-1);}
  if(side.poison>0)directHit(side,side.poison,null);
  side.haste=Math.max(0,side.haste-.7);side.guard=Math.max(0,side.guard-.25);
}
function battleTick(){
  if(!battle||battle.ended)return;
  const dt=.1*battleSpeed;battle.time+=dt;
  ['player','enemy'].forEach(k=>{
    const side=battle[k],target=k==='player'?battle.enemy:battle.player;
    side.units.forEach(b=>{if(!b)return;b.cooldown-=dt;if(b.cooldown<=0)castAbility(side,target,b,false);});
  });
  if(Math.floor((battle.time-dt)*2)!==Math.floor(battle.time*2)&&battle.time>=30){
    const pD=battle.player.maxHp*.035,eD=battle.enemy.maxHp*.035;
    directHit(battle.player,pD,null);directHit(battle.enemy,eD,null);battle.sudden++;
    if(battle.sudden===1)logBattle('<b>Revisión de emergencia:</b> empieza la muerte súbita.');
  }
  if(Math.floor(battle.time-dt)!==Math.floor(battle.time)){statusTick(battle.player,battle.enemy);statusTick(battle.enemy,battle.player);}
  renderBattle();
  if(battle.player.hp<=0||battle.enemy.hp<=0||battle.time>=45)finishBattle();
}
function renderBattle(){
  if(!battle)return;
  const p=battle.player,e=battle.enemy;
  $('playerHpText').textContent=format(p.hp)+'/'+format(p.maxHp);
  $('enemyHpText').textContent=format(e.hp)+'/'+format(e.maxHp);
  $('playerHpBar').style.width=(p.hp/p.maxHp*100)+'%';$('enemyHpBar').style.width=(e.hp/e.maxHp*100)+'%';
  $('playerShieldBar').style.width=Math.min(100,p.shield/p.maxHp*100)+'%';$('enemyShieldBar').style.width=Math.min(100,e.shield/e.maxHp*100)+'%';
  $('battleTime').textContent=battle.time.toFixed(1);
  $('battleStatus').textContent=battle.time>=30?'MUERTE SÚBITA · '+battle.sudden+' pulsos':'Quemadura '+p.burn+' · Veneno '+p.poison+' · Descarga '+p.shock;
  ['player','enemy'].forEach(k=>battle[k].units.forEach(b=>{
    if(!b)return;
    const unitEl=document.querySelector('[data-battle-side="'+k+'"][data-battle-index="'+b.index+'"]');
    const el=unitEl?.querySelector('.cooldown-ring i');
    const pct=Math.round(100*(1-clamp(b.cooldown/b.stats.cooldown,0,1)));
    if(el)el.style.width=pct+'%';
    const label=unitEl?.querySelector('.cooldown-label b');if(label)label.textContent=pct+'%';
    if(unitEl)unitEl.classList.toggle('ready',pct>=92);
  }));
}
function finishBattle(){
  if(!battle||battle.ended)return;
  battle.ended=true;clearInterval(battleTimer);
  let won=battle.enemy.hp<=0&&battle.player.hp>0;
  if(battle.time>=45&&battle.enemy.hp>0&&battle.player.hp>0)won=(battle.player.hp/battle.player.maxHp)>=(battle.enemy.hp/battle.enemy.maxHp);

  if(battleContext==='student'){
    career.duels=career.duels||{wins:0,losses:0};
    if(won)career.duels.wins++;else career.duels.losses++;
    career.xp+=won?12:4;
    saveCareer();
    showBattleResult(won);
    return;
  }

  if(won){run.wins++;career.careerWins++;run.gold+=4+Math.floor(run.day/3);}
  else{
    run.losses++;const penalty=run.day<=2?1:run.day<=4?2:3;run.lives-=penalty;
    if(run.lives<=0&&run.secondChance){run.secondChance=false;run.lives=1;toast('Última corrección: vuelves con 1 vida.','good');}
  }
  const types=Object.keys(teamTypeCounts(run.team.filter(Boolean))).length;
  run.stats.biggestHit=Math.max(run.stats.biggestHit,career.metrics.biggestHit||0);
  run.stats.maxShield=Math.max(run.stats.maxShield,career.metrics.maxShield||0);
  evaluateAchievements({typesInTeam:types,runWins:run.wins});
  saveCareer();saveRun('battle_result');
  showBattleResult(won);
}
function showBattleResult(won){
  $('resultBanner').textContent=won?'VICTORIA':'DERROTA';$('resultBanner').classList.toggle('loss',!won);
  if(battleContext==='student'){
    $('resultTitle').textContent=won?'Duelo ganado':'Duelo perdido';
    $('resultText').textContent='Este combate de clase no modifica tu Aventura: no pierdes vidas, Tinta ni progreso.';
    $('resultStats').innerHTML='<article><span>Vida restante</span><strong>'+format(battle.player.hp)+'</strong></article><article><span>Tiempo</span><strong>'+battle.time.toFixed(1)+'s</strong></article><article><span>Duelo</span><strong>'+career.duels.wins+'-'+career.duels.losses+'</strong></article>';
    $('resultContinueBtn').textContent='VOLVER A LA ARENA';
  }else{
    $('resultTitle').textContent=won?'Encuentro superado':'El rival se lleva el encuentro';
    $('resultText').textContent=won?'Tu combinación funcionó. Puedes mejorar el equipo antes del siguiente combate.':'Reordena, entrena y busca mejores sinergias. La aventura continúa mientras te queden vidas.';
    $('resultStats').innerHTML='<article><span>Vida restante</span><strong>'+format(battle.player.hp)+'</strong></article><article><span>Tiempo</span><strong>'+battle.time.toFixed(1)+'s</strong></article><article><span>Victorias</span><strong>'+run.wins+'/'+WIN_TARGET+'</strong></article>';
    $('resultContinueBtn').textContent='SIGUIENTE JORNADA';
  }
  openModal('resultModal');
}
function continueAfterBattle(){
  closeModal();
  if(battleContext==='student'){
    battle=null;showStudentBattle();return;
  }
  if(run.wins>=WIN_TARGET)return endLeague(true);
  if(run.lives<=0)return endLeague(false);
  run.day++;
  run.rank=Math.min(6,run.day);
  career.metrics.maxDay=Math.max(career.metrics.maxDay,run.day);
  career.metrics.maxRank=Math.max(career.metrics.maxRank,run.rank);
  run.gold+=10+countRelicEffect('dailyGold');
  const t=trainer();
  run.trainingLeft=t?.effect==='teacher'?5:3;
  if(t?.effect==='balanced'){run.trainingLeft++;run.freeRerolls++;}
  if(t?.effect==='lexicon')run.trainingLeft++;
  if(t?.effect==='verbs'&&run.day%2===0)run.gold+=2;
  run.itemUse=1;run.flags={};
  if(!run.locked)rollShop(true);else{run.locked=false;}
  saveRun('next_day');showShop();
  setTimeout(()=>openDayEvent(),120);
}
function endLeague(champion){
  clearInterval(battleTimer);
  run.completed=true;
  career.games++;
  if(champion){
    career.championships++;
    if(run.losses===0)career.metrics.flawless=(career.metrics.flawless||0)+1;
    run.team.filter(Boolean).forEach(u=>{
      const b=career.badges[u.creatureId]||(career.badges[u.creatureId]={trophy:false,medal:false,star:false});
      b.trophy=true;if(u.level>=3)b.medal=true;if(u.chromatic)b.star=true;
    });
  }
  const accuracy=run.stats.trainingAttempts?Math.round(run.stats.trainingCorrect/run.stats.trainingAttempts*100):0;
  career.history.unshift({id:run.id,date:nowIso(),champion,wins:run.wins,day:run.day,trainerId:run.trainerId,trainingAccuracy:accuracy,team:run.team.filter(Boolean).map(u=>({creatureId:u.creatureId,level:u.level,chromatic:u.chromatic}))});
  career.history=career.history.slice(0,30);
  evaluateAchievements({championships:career.championships,flawless:champion&&run.losses===0?1:0,runWins:run.wins});
  career.xp+=champion?150:Math.max(20,run.wins*10);
  saveCareer();saveRun('league_end');
  window.LexariaBridge?.result?.(champion?'win':'finished');
  $('endTitle').textContent=champion?'Campeón de Lexaria':'Fin de la liga';
  $('endText').textContent=champion?'Has alcanzado las 10 victorias. Los Lexarios de tu formación final reciben sus insignias de colección.':'Tu equipo llegó hasta '+run.wins+' victorias. La próxima combinación puede ir más lejos.';
  $('endStats').innerHTML='<article><span>Victorias</span><strong>'+run.wins+'</strong></article><article><span>Día</span><strong>'+run.day+'</strong></article><article><span>Entrenamiento</span><strong>'+accuracy+'%</strong></article>';
  openModal('endModal');
}
function discardRun(){
  if(!run)return;
  run.completed=true;saveRun('abandon');
  career.games++;career.history.unshift({id:run.id,date:nowIso(),champion:false,wins:run.wins,day:run.day,trainerId:run.trainerId,trainingAccuracy:0,team:[]});
  career.history=career.history.slice(0,30);saveCareer();
  run=null;localStorage.removeItem(RUN_KEY);closeModal();backHome();
}
function resetAfterEnd(newOne){
  run=null;localStorage.removeItem(RUN_KEY);closeModal();
  if(newOne)chooseTrainerScreen();else backHome();
}

function achievementValue(metric,extra){
  extra=extra||{};
  const m=career.metrics||{};
  if(metric==='buys')return m.buys||0;
  if(metric==='trainingCorrect')return m.trainingCorrect||0;
  if(metric==='trainingStreak')return m.maxTrainingStreak||0;
  if(metric==='maxLevel')return m.maxLevel||1;
  if(metric==='careerWins')return career.careerWins||0;
  if(metric==='runWins')return extra.runWins??run?.wins??0;
  if(metric==='championships')return career.championships||0;
  if(metric==='flawless')return extra.flawless||m.flawless||0;
  if(metric==='chromatics')return m.chromatics||0;
  if(metric==='discovered')return Object.keys(career.discovered||{}).length;
  if(metric==='typesInTeam')return extra.typesInTeam||0;
  if(metric==='relics')return run?.relics?.length||0;
  if(metric==='biggestHit')return m.biggestHit||0;
  if(metric==='maxShield')return m.maxShield||0;
  if(metric==='maxDay')return Math.max(m.maxDay||1,run?.day||1);
  if(metric==='maxRank')return Math.max(m.maxRank||1,run?.rank||1);
  return 0;
}
function evaluateAchievements(extra){
  let newly=0;
  D.achievements.forEach(a=>{
    if(career.achievements[a.id])return;
    if(achievementValue(a.metric,extra)>=a.value){
      career.achievements[a.id]={at:nowIso()};career.xp+=25;newly++;toast('Logro: '+a.name,'good');
    }
  });
  if(newly)saveCareer();
}
function renderCodex(){
  const types=new Set(),rarities=new Set();
  D.creatures.forEach(c=>{c.types.forEach(t=>types.add(t));rarities.add(c.rarity);});
  $('codexType').innerHTML='<option value="">Todos los tipos</option>'+Array.from(types).map(t=>'<option value="'+t+'">'+esc(D.TYPES[t].name)+'</option>').join('');
  $('codexRarity').innerHTML='<option value="">Todas las rarezas</option>'+Array.from(rarities).map(r=>'<option value="'+r+'">'+esc(D.RARITIES[r].name)+'</option>').join('');
  filterCodex();
}
function filterCodex(){
  const search=($('codexSearch')?.value||'').toLowerCase().trim(),type=$('codexType')?.value||'',rarity=$('codexRarity')?.value||'';
  const list=D.creatures.filter(c=>(!search||c.name.toLowerCase().includes(search))&&(!type||c.types.includes(type))&&(!rarity||c.rarity===rarity));
  $('codexGrid').innerHTML=list.map(c=>{
    const unlocked=!!career.discovered[c.id],b=career.badges[c.id]||{};
    return '<article class="codex-entry '+(unlocked?'':'locked')+'"><span class="unit-emoji">'+(unlocked?esc(c.emoji):'❔')+'</span><h3>'+(unlocked?esc(c.name):'???')+'</h3><p>'+(unlocked?esc(c.types.map(t=>D.TYPES[t].name).join(' · ')):'No descubierto')+'</p><p>'+(unlocked?esc(c.ability.name):'')+'</p><div class="badge-row"><span class="mini-badge '+(b.trophy?'on':'')+'" title="Ganar una liga">🏆</span><span class="mini-badge '+(b.medal?'on':'')+'" title="Ganar con nivel 3+">🎖</span><span class="mini-badge '+(b.star?'on':'')+'" title="Ganar con variante cromática">★</span></div></article>';
  }).join('');
}
function renderAchievements(){
  $('achievementGrid').innerHTML=D.achievements.map(a=>{
    const unlocked=!!career.achievements[a.id],value=achievementValue(a.metric,{});
    return '<article class="achievement-card '+(unlocked?'':'locked')+'"><span class="ach-icon">'+(unlocked?esc(a.icon):'🔒')+'</span><div><h3>'+esc(a.name)+'</h3><p>'+esc(a.desc)+'</p><small>'+Math.min(value,a.value)+' / '+a.value+'</small></div></article>';
  }).join('');
}
function renderHistory(){
  const h=career.history||[];
  $('historyList').innerHTML=h.length?h.map(x=>{
    const t=D.trainer(x.trainerId);
    return '<article class="history-row"><b>'+(x.champion?'🏆 CAMPEÓN':'Liga')+'</b><span>'+esc(t?.name||'Entrenador')+'<small> · '+new Date(x.date).toLocaleDateString('es-ES')+'</small></span><span><small>Victorias</small><b>'+x.wins+'</b></span><span><small>Día</small><b>'+x.day+'</b></span><span><small>Precisión</small><b>'+x.trainingAccuracy+'%</b></span></article>';
  }).join(''):'<div class="history-empty">Todavía no has terminado ninguna liga.</div>';
}

function bind(){
  $('newRunBtn')?.addEventListener('click',chooseTrainerScreen);
  $('studentBattleBtn')?.addEventListener('click',showStudentBattle);
  $('continueRunBtn')?.addEventListener('click',continueRun);
  $('practiceBtn')?.addEventListener('click',showPractice);
  $('codexBtn')?.addEventListener('click',()=>{renderCodex();openModal('codexModal');});
  $('achievementsBtn')?.addEventListener('click',()=>{renderAchievements();openModal('achievementsModal');});
  $('historyBtn')?.addEventListener('click',()=>{renderHistory();openModal('historyModal');});
  $('rerollBtn')?.addEventListener('click',rerollShop);
  $('lockBtn')?.addEventListener('click',lockShop);
  $('battleBtn')?.addEventListener('click',startBattle);
  $('trainBtn')?.addEventListener('click',trainSelected);
  $('publishSquadBtn')?.addEventListener('click',publishCurrentSquad);
  $('refreshOpponentsBtn')?.addEventListener('click',refreshStudentOpponents);
  $('resultContinueBtn')?.addEventListener('click',continueAfterBattle);
  $('speedBtn')?.addEventListener('click',()=>{battleSpeed=battleSpeed===1?2:battleSpeed===2?4:1;$('speedBtn').textContent='×'+battleSpeed+' VELOCIDAD';});
  $('endAgainBtn')?.addEventListener('click',()=>resetAfterEnd(true));
  $('endHomeBtn')?.addEventListener('click',()=>resetAfterEnd(false));
  $('motionToggle')?.addEventListener('change',e=>{settings.reduceMotion=e.target.checked;localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));loadSettingsToBody();});
  $('soundToggle')?.addEventListener('change',e=>{settings.sound=e.target.checked;localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));});
  $('abandonRunBtn')?.addEventListener('click',discardRun);
  ['codexSearch','codexType','codexRarity'].forEach(id=>$(id)?.addEventListener(id==='codexSearch'?'input':'change',filterCodex));

  document.addEventListener('click',e=>{
    const open=e.target.closest('[data-open]');if(open){
      const id=open.dataset.open;
      if(id==='codexModal')renderCodex();
      if(id==='achievementsModal')renderAchievements();
      if(id==='historyModal')renderHistory();
      openModal(id);return;
    }
    if(e.target.closest('[data-close-modal]')){closeModal();return;}
    const back=e.target.closest('[data-action="back-title"]');if(back){backHome();return;}
    const choose=e.target.closest('[data-trainer]');if(choose){newRun(choose.dataset.trainer);return;}
    const buy=e.target.closest('[data-buy]');if(buy){buyOffer(Number(buy.dataset.buy));return;}
    const duel=e.target.closest('[data-duel-opponent]');if(duel){startStudentBattle(Number(duel.dataset.duelOpponent),duel.dataset.duelSource);return;}
    const slot=e.target.closest('[data-slot]');if(slot){slotClick(slot.dataset.slot,Number(slot.dataset.index));return;}
    const action=e.target.closest('[data-action]')?.dataset.action;
    if(action==='train-selected'){trainSelected();return;}
    if(action==='sell-selected'){sellSelected();return;}
    if(action==='clear-selection'){clearSelection();return;}
    const rel=e.target.closest('[data-relic]');if(rel){chooseRelic(rel.dataset.relic);return;}
    const ev=e.target.closest('[data-event-choice]');if(ev){chooseEvent(Number(ev.dataset.eventChoice));return;}
    const ans=e.target.closest('[data-answer]');if(ans){answerTraining(Number(ans.dataset.answer));return;}
    const pc=e.target.closest('[data-practice]');if(pc){practiceCategory=pc.dataset.practice;renderPractice();newPracticeQuestion();return;}
    const pa=e.target.closest('[data-practice-answer]');if(pa){
      if(!currentQuestion||currentQuestion.mode!=='practice')return;
      const q=currentQuestion.data,idx=Number(pa.dataset.practiceAnswer),correct=idx===q.correct;
      qsa('[data-practice-answer]').forEach(b=>b.disabled=true);
      pa.classList.add(correct?'correct':'wrong');qsa('[data-practice-answer]')[q.correct]?.classList.add('correct');
      const feedback=$('practiceFeedback');if(feedback)feedback.textContent=(correct?'Correcto. ':'Revisa: ')+q.explanation;
      practiceStats.attempts++;career.metrics.trainingAttempts++;
      if(correct){practiceStats.correct++;practiceStats.streak++;career.xp+=4;career.metrics.trainingCorrect++;career.metrics.trainingStreak++;career.metrics.maxTrainingStreak=Math.max(career.metrics.maxTrainingStreak,career.metrics.trainingStreak);}
      else{practiceStats.streak=0;career.metrics.trainingStreak=0;career.xp+=1;}
      evaluateAchievements();saveCareer();
      setTimeout(()=>{renderPractice();newPracticeQuestion();},900);return;
    }
  });
  document.addEventListener('dragstart',e=>{
    const card=e.target.closest('.unit-card[draggable="true"]');
    if(!card||!run)return;
    dragSource={area:card.dataset.area,index:Number(card.dataset.index)};
    card.classList.add('dragging');
    if(e.dataTransfer){e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',card.dataset.unit||'lexario');}
  });
  document.addEventListener('dragover',e=>{
    const slot=e.target.closest('[data-slot]');
    if(!slot||!dragSource)return;
    e.preventDefault();
    qsa('[data-slot].drag-over').forEach(x=>x.classList.remove('drag-over'));
    slot.classList.add('drag-over');
    if(e.dataTransfer)e.dataTransfer.dropEffect='move';
  });
  document.addEventListener('dragleave',e=>{
    const slot=e.target.closest('[data-slot]');
    if(slot&&!slot.contains(e.relatedTarget))slot.classList.remove('drag-over');
  });
  document.addEventListener('drop',e=>{
    const slot=e.target.closest('[data-slot]');
    if(!slot||!dragSource)return;
    e.preventDefault();
    const from=dragSource;
    const to={area:slot.dataset.slot,index:Number(slot.dataset.index)};
    qsa('[data-slot].drag-over').forEach(x=>x.classList.remove('drag-over'));
    qsa('.unit-card.dragging').forEach(x=>x.classList.remove('dragging'));
    dragSource=null;
    moveUnit(from,to);
  });
  document.addEventListener('dragend',()=>{
    dragSource=null;
    qsa('[data-slot].drag-over').forEach(x=>x.classList.remove('drag-over'));
    qsa('.unit-card.dragging').forEach(x=>x.classList.remove('dragging'));
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
  window.addEventListener('pagehide',()=>{saveRun('pagehide');saveCareer();});
}
function init(){
  loadSettingsToBody();renderTitleMeta();bind();
  window.addEventListener('lexaria:restore',e=>{if(e.detail){localStorage.setItem(RUN_KEY,JSON.stringify(e.detail));renderTitleMeta();}});
}
document.addEventListener('DOMContentLoaded',init);

return {
  get run(){return run;},get career(){return career;},
  restore(payload){
    if(!payload)return;
    const pack=payload?.save||payload;
    if(pack?.career){
      const base=loadCareer();
      career=Object.assign(base,pack.career,{metrics:Object.assign(base.metrics,pack.career.metrics||{}),history:Array.isArray(pack.career.history)?pack.career.history:base.history,duels:Object.assign(base.duels,pack.career.duels||{})});
      localStorage.setItem(CAREER_KEY,JSON.stringify(career));
    }
    const incoming=pack?.run||((pack?.version===1&&pack?.trainerId)?pack:null);
    if(incoming){
      localStorage.setItem(RUN_KEY,JSON.stringify(incoming));
      run=loadRun();
    }
    renderTitleMeta();
  },
  metrics(){
    return {
      wins:run?.wins||0,day:run?.day||0,lives:run?.lives||0,rank:run?.rank||0,
      trainingCorrect:run?.stats?.trainingCorrect||0,trainingAttempts:run?.stats?.trainingAttempts||0,
      discovered:Object.keys(career.discovered||{}).length,championships:career.championships||0,
      xp:career.xp||0,level:career.level||1,careerWins:career.careerWins||0
    };
  },
  achievements(){return Object.keys(career.achievements||{}).map(id=>{const a=D.achievements.find(x=>x.id===id)||{};return{id,title:a.name||id,description:a.desc||'',xpReward:25};});},
  setStudentOpponents(list){setStudentOpponents(list);},
  getDuelSquad(){return career.duelSquad||null;},
  save(){saveRun('manual');saveCareer();}
};
})();