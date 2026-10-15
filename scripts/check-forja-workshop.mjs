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

// Execute the real marker sender against an in-memory database and webhook.
const {readFileSync}=await import('node:fs');
const vm=await import('node:vm');
const {stripTypeScriptTypes}=await import('node:module');
const source=readFileSync('supabase/functions/save-progress/index.ts','utf8');
const sender=source.slice(source.indexOf('async function sendCompletedWorkshopAwards('),source.indexOf('Deno.serve('));
let events=[event], deliveries=[];
const workshop={...session,run_id:'run:today',classroom_id:'C',published:true,is_provisional:false,game_ids:['lexoma'],target_xp:0};
const context={isForjaObjective,workshopVictory,groupWorkshops,workshopProgress,console,Date,crypto,TextEncoder,AbortSignal,
 Deno:{env:{get:()=> 'configured'}},
 fetch:async(url,opts)=>{deliveries.push(JSON.parse(opts.body));return {ok:true,json:async()=>({ok:true})}}};
vm.runInNewContext(stripTypeScriptTypes(sender)+';globalThis.send=sendCompletedWorkshopAwards;',context);
const admin={from(table){const chain={};for(const op of ['select','in','eq','neq','gte','lte','order','range','or'])chain[op]=()=>chain;chain.then=(resolve)=>Promise.resolve({data:table==='workshop_runs'?[workshop]:events,error:null}).then(resolve);return chain;}};
await context.send(admin,'student',['C'],'lexoma');
await context.send(admin,'student',['C'],'lexoma');
assert.equal(deliveries.length,2);assert.equal(deliveries[0].awardId,deliveries[1].awardId,'Retries use the same marker idempotency key');
assert.equal(deliveries[0].points,5);assert.equal(deliveries[0].categoryId,'CAT1');
events=[{...event,details:{}}];await context.send(admin,'student',['C'],'lexoma');assert.equal(deliveries.length,2);
console.log('Marker: successful victory award, no defeat award, stable deduplication key on retries.');
