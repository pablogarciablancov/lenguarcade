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
  return {
    id,innerHTML:'',textContent:'',value:'',disabled:false,style:{},
    classList:{
      add(name){classes.add(name)},remove(name){classes.delete(name)},
      contains(name){return classes.has(name)},
      toggle(name,enabled){if(enabled)classes.add(name);else classes.delete(name)}
    }
  };
}
const nodes=new Map();
const getElementById=id=>{
  if(id==='games')return null;
  if(!nodes.has(id))nodes.set(id,node(id));
  return nodes.get(id);
};
getElementById('workshopClassSelect').value='TEST-C';
const requests=[];
const ctx={
  window:{confirm:()=>true},
  document:{getElementById},
  setInterval(){return 1},
  clearInterval(){},
  setTimeout(){return 1},
  clearTimeout(){},
  console,
  Promise,
  edge:async(name,request)=>{
    requests.push({name,request});
    if(request.action==='start')return {event:{
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
vm.runInNewContext(bossSource,ctx,{filename:'class-boss-controller.js'});
assert.equal(typeof ctx.window.classBossRenderPanel,'function');
ctx.window.__setPlannerForTest({activeSession:null});
assert.doesNotThrow(()=>ctx.window.classBossRenderPanel());
assert.match(getElementById('classBossPanel').innerHTML,/Preparar taller cooperativo/);

ctx.window.__setPlannerForTest({activeSession:{
  classroomOpen:true,gameIds:['battlegrafia','lexoma','maniacgrafia']
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
console.log('Class boss UI: private planner state bridged, workshop loading safe, starting battle and scoreboard OK.');
