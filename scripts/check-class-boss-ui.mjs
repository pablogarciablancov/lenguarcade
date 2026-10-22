import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../apps-script/LenguArcade_Profesor.html',import.meta.url),'utf8');
const workshopMatch=html.match(/<script>\s*(\(function\(\)\{\s*if\(window\.__LA_WORKSHOP_SESSION_PATCH__\)[\s\S]*?)<\/script>/);
const bossMatch=html.match(/<script id="la-class-boss-controller">([\s\S]*?)<\/script>/);
assert.ok(workshopMatch,'Must find workshop planner closure');
assert.ok(bossMatch,'Must find cooperative boss script');
const workshopSource=workshopMatch[1];
const bossSource=bossMatch[1];

// Keep the original planner state private. The controller may only use the
// narrow adapter exported from that closure; not private symbols directly.
assert.match(workshopSource,/window\.laBossWorkshopBridge\s*=\s*\{/);
for(const privateName of [
  'workshopPlannerState','teacherCurrentClass','sessionCall',
  'syncWorkshopSupabaseAccess','renderWorkshopPlanner'
])assert.doesNotMatch(bossSource,new RegExp('\\b'+privateName+'\\b'),
  'Cooperative boss reached into planner private state: '+privateName);

function node(id){
  const classes=new Set();
  const attributes=new Map();
  return {
    getContext(){return {clearRect(){},drawImage(...args){draws.push(args)}}},
    id,innerHTML:'',textContent:'',value:'',disabled:false,style:{},
    setAttribute(name,value){attributes.set(name,value)},
    getAttribute(name){return attributes.get(name)},
    classList:{
      add(name){classes.add(name)},remove(name){classes.delete(name)},
      contains(name){return classes.has(name)},
      toggle(name,enabled){if(enabled)classes.add(name);else classes.delete(name)}
    }
  };
}
const draws=[],frames=new Map(),listeners=new Map();let frameId=0;
const motion={matches:false,addEventListener(name,fn){listeners.set('motion',fn)}};
const nodes=new Map();
const getElementById=id=>{
  if(id==='games')return null;
  if(!nodes.has(id))nodes.set(id,node(id));
  return nodes.get(id);
};
getElementById('workshopClassSelect').value='TEST-C';
const requests=[];
const ctx={
  window:{confirm:()=>true,matchMedia:()=>motion,
    requestAnimationFrame(fn){frames.set(++frameId,fn);return frameId},
    cancelAnimationFrame(id){frames.delete(id)}},
  Image:class {
    complete=true;naturalWidth=512;naturalHeight=512;
    set src(value){this.url=value;this.onload?.()}
  },
  document:{getElementById,hidden:false,addEventListener(name,fn){listeners.set(name,fn)}},
  setInterval(){return 1},
  clearInterval(){},
  setTimeout(){return 1},
  clearTimeout(){},
  console,
  Promise,
  edge:async(name,request)=>{
    requests.push({name,request});
    if(request.action==='start'||(request.action==='status'&&requests.some(r=>r.request.action==='start')))return {event:{
      id:'synthetic',state:'active',workshopOpen:true,health:232,totalHealth:240,
      remainingSeconds:1500,combos:0,damage:8,gameIds:['battlegrafia','lexoma','maniacgrafia']
    }};
    return {event:null};
  },
  $:getElementById
};

// Test-only probe inserted into the private closure, never in production HTML.
const instrumented=workshopSource.replace(
  '  if(!installStudentSession())installTeacherSession();',
  '  window.__setPlannerForTest=function(next){workshopPlannerState=next;};\n'
  +'  if(!installStudentSession())installTeacherSession();'
);
assert.notEqual(instrumented,workshopSource,'Unable to instrument planner closure');
vm.runInNewContext(instrumented,ctx,{filename:'workshop-planner.js'});
assert.ok(ctx.window.laBossWorkshopBridge,'Planner did not expose boss adapter');
assert.equal(ctx.window.laBossWorkshopBridge.selectedClass(),'TEST-C');
assert.equal(ctx.window.laBossWorkshopBridge.activeSession(),null);

// This used to throw ReferenceError: workshopPlannerState is not defined,
// which made loadWorkshopPlanner display 'No se pudieron cargar las sesiones'.
vm.runInNewContext(bossSource.replace('  window.classBossRenderPanel=renderPanel;',
  '  window.__paintBossForTest=paint;window.classBossRenderPanel=renderPanel;'),ctx,{filename:'class-boss-controller.js'});
assert.equal(typeof ctx.window.classBossRenderPanel,'function');
ctx.window.__setPlannerForTest({activeSession:null});
assert.doesNotThrow(()=>ctx.window.classBossRenderPanel());
assert.match(getElementById('classBossPanel').innerHTML,/Preparar taller cooperativo/);

ctx.window.__setPlannerForTest({activeSession:{
  classroomOpen:true,targetXp:400,gameIds:['battlegrafia','lexoma','maniacgrafia']
}});
assert.doesNotThrow(()=>ctx.window.classBossRenderPanel());
assert.match(getElementById('classBossPanel').innerHTML,/Iniciar combate/);
await getElementById('classBossPrepare').onclick();
// The click handler schedules an async request without returning its Promise.
// Flush the event loop so the fake Edge response can paint the HUD.
await new Promise(resolve=>setImmediate(resolve));
assert.ok(requests.some(r=>r.name==='class-boss'&&r.request.action==='start'&&r.request.classCode==='TEST-C'),
  'Boss start did not use the selected workshop class');
assert.equal(getElementById('classBossHealth').textContent,'232 / 240 de vida');
assert.equal(getElementById('classBossClock').textContent,'25:00');
// Render confirmed snapshots at every boundary, without changing combat rules.
const paint=ctx.window.__paintBossForTest;
const event={id:'synthetic',state:'active',workshopOpen:true,totalHealth:100,
  remainingSeconds:1400,combos:0,damage:8};
for(const [health,phase] of [[100,1],[71,1],[70,2],[36,2],[35,3],[11,3],[10,4],[1,4],[0,4]]){
  paint({...event,health});
  assert.equal(getElementById('classBossMonster').getAttribute('data-phase'),String(phase));
  assert.equal(getElementById('classBossHealthBar').style.width,health+'%');
  assert.match(getElementById('classBossPhase').textContent,/Fase/);
}
paint({...event,health:70,damage:9});
assert.ok(getElementById('classBossMonster').classList.contains('hurt'));
assert.equal(getElementById('classBossImpact').textContent,'−1');
paint({...event,health:35,damage:14,combos:1});
assert.ok(getElementById('classBossMonster').classList.contains('combo'));
assert.equal(getElementById('classBossImpact').textContent,'¡COMBO! −5');
paint({...event,health:35,damage:14,combos:1,state:'paused'});
assert.equal(getElementById('classBossClock').textContent,'23:20');
assert.equal(getElementById('classBossPause').textContent,'▶ Reanudar');
for(const outcome of ['victory','defeat']){
  paint({...event,health:outcome==='victory'?0:10,state:'finished',outcome});
  assert.equal(getElementById('classBossStage').getAttribute('data-outcome'),outcome);
  assert.ok(getElementById('classBossOutcome').classList.contains('show'));
  assert.ok(getElementById('classBossPause').disabled);
  assert.ok(getElementById('classBossFinish').disabled);
}
paint({...event,id:'another-battle',health:100,damage:25});
assert.equal(getElementById('classBossStage').getAttribute('data-outcome'),'');
assert.equal(getElementById('classBossMonster').getAttribute('data-phase'),'1');
assert.ok(!getElementById('classBossMonster').classList.contains('hurt'),'New events must not replay old damage');
paint(null);
assert.ok(!getElementById('classBossOutcome').classList.contains('show'));
assert.equal(getElementById('classBossHealth').textContent,'—');
// The renderer loads standalone frames and never crops a neighboring cell.
paint({...event,id:'animated',health:100});
const sprite=getElementById('classBossSprite');
assert.equal(sprite.getAttribute('data-phase'),'1');
assert.equal(sprite.getAttribute('data-frame'),'0');
const seen=new Set();
for(let step=0;step<14;step++){
  const pending=[...frames.entries()];frames.clear();
  for(const [,fn] of pending)fn(1000+step*120);
  seen.add(sprite.getAttribute('data-frame'));
}
assert.equal(seen.size,12,'Must display all twelve original animation frames');
for(const [health,phase] of [[70,2],[35,3],[10,4]]){
  paint({...event,id:'animated',health});
  assert.equal(sprite.getAttribute('data-phase'),String(phase));
  assert.equal(sprite.getAttribute('data-frame'),'0');
}
assert.ok(draws.length>12);
for(const args of draws){
  assert.equal(args.length,5,'Must draw the complete isolated image, never an atlas source rectangle');
  const [img,x,y,w,h]=args;
  assert.equal(img.naturalWidth,512);assert.equal(img.naturalHeight,512);
  assert.deepEqual([x,y,w,h],[-25.6,-102.4,563.2,563.2]);
  assert.match(img.url,/frames-v2\/(healthy|cracked|torn|critical)-\d{2}\.webp$/);
}
motion.matches=true;listeners.get('motion')();
assert.equal(frames.size,0,'Reduced motion must cancel animation');
assert.equal(sprite.getAttribute('data-frame'),'0');
motion.matches=false;listeners.get('motion')();
assert.equal(frames.size,1);
ctx.document.hidden=true;listeners.get('visibilitychange')();
assert.equal(frames.size,0,'Hidden tabs must stop drawing');
ctx.document.hidden=false;listeners.get('visibilitychange')();
assert.equal(frames.size,1);
getElementById('classBossClose').onclick();
assert.equal(frames.size,0,'Closing projection must cancel animation');
console.log('Class boss UI: twelve isolated frames, visibility/motion lifecycle, workshop bridge, start, four health phases, impacts, combos, outcomes and reset OK.');
const config={roundRewards:[150,100,75],finalRewards:[300,200,150],participationXp:25};
const leaders=[{name:'Alumno <script>',damage:8},{name:'Segundo',damage:7},{name:'Tercero',damage:6}];
const round={index:0,final:false,victory:true,leaderboard:leaders};
paint({...event,health:100,encounter:{phase:'rest',latest:round,current:null,next:{index:1},secondsToNext:90,finished:false,config,rounds:[round,{}],leaderboard:leaders}});
assert.equal(getElementById('classBossMonster').style.visibility,'hidden');
assert.match(getElementById('classBossPodiumHost').innerHTML,/Alumno &lt;script&gt;/);
assert.match(getElementById('classBossPodiumHost').innerHTML,/\+150 XP/);
paint({...event,health:100,encounter:{phase:'combat',current:{index:1,final:true},secondsToNext:0,combatSeconds:120,finished:false,config,rounds:[round,{}],leaderboard:leaders}});
assert.equal(getElementById('classBossMonster').style.visibility,'visible');
assert.equal(getElementById('classBossPodiumHost').innerHTML,'');
assert.match(getElementById('classBossPhase').textContent,/COMBATE FINAL/);
paint({...event,state:'finished',outcome:'victory',health:0,encounter:{phase:'finished',finished:true,latest:round,secondsToNext:0,config,rounds:[round,{}],leaderboard:leaders}});
assert.match(getElementById('classBossPodiumHost').innerHTML,/PODIO FINAL/);
assert.match(getElementById('classBossPodiumHost').innerHTML,/\+300 XP/);
console.log('Encounter UI: monster hidden in rests, final fight, escaped names, per-round and final podium rewards OK.');
