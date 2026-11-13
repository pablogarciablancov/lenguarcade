import assert from 'node:assert/strict';
import {forjaVictory,workshopVictory,isForjaObjective,groupWorkshops,workshopProgress} from '../supabase/functions/_shared/workshop-objective.js';
const session={objective_type:'forja_easy_win',started_at:'2026-10-15T08:00:00Z',closed_at:'2026-10-15T09:00:00Z'};
const run={id:'test',mode:'easy',round:7,finished:true,status:'victory',victory:{runId:'test',mode:'easy',rounds:7,at:'2026-10-15T08:30:00Z'}};
const win=forjaVictory('lexoma',{run});
assert.ok(win);
const event={game_id:'lexoma',occurred_at:'2026-10-15T08:31:00Z',details:{forjaVictory:win}};
assert.equal(workshopVictory(session,event),true);
for(const changes of [{mode:'normal'},{status:'defeat'},{finished:false},{round:6}]) assert.equal(forjaVictory('lexoma',{run:{...run,...changes}}),null);
assert.equal(forjaVictory('other',{run}),null);
assert.equal(forjaVictory('lexoma',{run:{...run,victory:null}}),null);
assert.ok(forjaVictory('lexoma',{run:{...run,endless:true,status:'play',finished:false,round:8}}));
for(const at of ['2026-10-14T08:30:00Z','2026-10-15T09:30:00Z','invalid']) assert.equal(workshopVictory(session,{...event,details:{forjaVictory:{...win,at}}}),false);
assert.equal(workshopVictory(session,{...event,occurred_at:'2026-10-15T09:30:00Z'}),false);
assert.equal(workshopVictory(session,{...event,game_id:'other'}),false);
assert.equal(workshopVictory(session,{...event,details:{outcome:'victory'}}),false);
assert.equal(isForjaObjective({target_xp:400}),false);
console.log('Forja workshop: victory, difficulty, time window, legacy saves and endless criteria OK.');

// Ejecutar el encolado real del taller contra una base simulada.
// Ni guardar partida ni ganar el taller hacen solicitudes a Google Apps Script.
const {readFileSync}=await import('node:fs');
const vm=await import('node:vm');
const {stripTypeScriptTypes}=await import('node:module');
const source=readFileSync('supabase/functions/save-progress/index.ts','utf8');
const sender=source.slice(source.indexOf('async function sendCompletedWorkshopAwards('),source.indexOf('Deno.serve('));
let events=[event], enqueued=[];
const workshop={...session,run_id:'run:today',classroom_id:'C',published:true,is_provisional:false,game_ids:['lexoma'],target_xp:0};
const context={isForjaObjective,workshopVictory,groupWorkshops,workshopProgress,console,Date,crypto,TextEncoder,cache:new Map()};
vm.runInNewContext('const fleetDeliveryCache=cache;'+stripTypeScriptTypes(sender)+';globalThis.send=sendCompletedWorkshopAwards;',context);
const admin={from(table){
  if(table==='fleet_workshop_awards')return {upsert:async(payload,options)=>{enqueued.push({payload,options});return {error:null};}};
  const chain={};
  for(const op of ['select','in','eq','neq','gte','lte','order','range','or'])chain[op]=()=>chain;
  chain.then=(resolve)=>Promise.resolve({data:table==='workshop_runs'?[workshop]:events,error:null}).then(resolve);
  return chain;
}};
await context.send(admin,'student',['C'],'lexoma');
await context.send(admin,'student',['C'],'lexoma');
assert.equal(enqueued.length,1,'Un taller ya encolado no debe volver a encolarse inmediatamente');
context.cache.clear(); // Tras reiniciar un worker, la restricción UNIQUE de la BD preserva la idempotencia.
await context.send(admin,'student',['C'],'lexoma');
assert.equal(enqueued.length,2);
assert.equal(enqueued[0].payload.award_id,enqueued[1].payload.award_id,'Los reintentos usan un identificador estable');
assert.equal(enqueued[0].payload.points,5);
assert.equal(enqueued[0].payload.title,'Taller: reto completado');
assert.equal(enqueued[0].options.ignoreDuplicates,true);
events=[{...event,details:{}}];
context.cache.clear();
await context.send(admin,'student',['C'],'lexoma');
assert.equal(enqueued.length,2,'Una derrota no genera premio');
console.log('Flota: talleres +5 encolados sin HTTP, idempotencia y victoria correctas.');
