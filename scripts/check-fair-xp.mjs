import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {snapshotProgress,actionRewards,capProgressionAward} from '../supabase/functions/_shared/progression.js';
import {workshopProgress,groupWorkshops} from '../supabase/functions/_shared/workshop-objective.js';
import {encounterConfig,encounterSchedule,countEncounter} from '../supabase/functions/_shared/class-boss-engine.js';
const old={xp:12345,feathers:5,attempts:0,successes:0,errors:0};
const before={run:{id:'one',words:[],errors:0}},after={run:{id:'one',words:['SOL','CASAS','CAMINAR'],errors:1}};
const forja=snapshotProgress('lexoma',after,before,old,{metrics:{}},{},{checkpoint:true});
assert.equal(forja.xp,old.xp+54);assert.equal(forja.successes,3);assert.equal(forja.errors,1);
assert.deepEqual(actionRewards('lexoma',after,before,3),[12,18,24]);
assert.equal(snapshotProgress('lexoma',after,after,forja,{},{},{checkpoint:true}).xp,forja.xp);
assert.equal(snapshotProgress('lexoma',{run:{id:'two',words:['SOL'],errors:0}},after,forja,{},{},{}).xp,forja.xp+12,'New run must earn its first word even if the old run had more words');
const maniac=snapshotProgress('maniacgrafia',{stats:{totalWords:105}},{stats:{totalWords:100}},old,{},{},{});
assert.equal(maniac.xp,old.xp+15);
assert.equal(snapshotProgress('battlegrafia',{stats_correct:1,defeatedMonsters:['a']},{stats_correct:0,defeatedMonsters:[]},old,{},{},{}).xp,old.xp+37);
assert.equal(snapshotProgress('maniacgrafia',{stats:{totalWords:0}},{stats:{totalWords:100}},old,{},{},{}).xp,old.xp,'Counter reset must not revalue history');
const batch=snapshotProgress('lexoma',{run:{id:'one',words:Array(24).fill('CAMINAR'),errors:0}},before,old,{},{},{checkpoint:true});
assert.equal(batch.xp-old.xp,576,'Do not clip valid long-word XP before the pending reward guard');
const payout=capProgressionAward(576,0,0,0,0,0);assert.equal(payout.awardedXp+payout.pendingXp,576);
const legacy={};vm.runInNewContext(fs.readFileSync('apps-script/LenguArcade_Progression.gs','utf8'),legacy);
for(const [game,save,prior] of [['lexoma',after,before],['maniacgrafia',{stats:{totalWords:105}},{stats:{totalWords:100}}],['battlegrafia',{stats_correct:2},{stats_correct:1}]]){
 const actual=legacy.calculateAuthoritativeProgress_(game,{checkpoint:true,rawGameData:{save}},{...old,plumas:5,rawJson:JSON.stringify({save:prior})});
 const expected=snapshotProgress(game,save,prior,old,{},{},{checkpoint:true});
 for(const key of ['xp','successes','errors','attempts'])assert.equal(actual[key],expected[key],game+' parity '+key);
}
const start=Date.parse('2026-10-25T10:00:00Z'),iso=s=>new Date(start+s*1000).toISOString();
const run={run_id:'r',started_at:iso(0),game_ids:['maniacgrafia','battlegrafia','lexoma'],target_xp:400,published:true,classroom_open:true};
function event(id,game,second,before,after,errors=0,xp=0,rewards){return {id,result_id:id,profile_id:'p',game_id:game,occurred_at:iso(second),xp_delta:xp,event_type:'checkpoint',details:{learning:{version:1,policyVersion:2,correctBefore:before,correctAfter:after,errorsBefore:0,errorsAfter:errors,actionXp:rewards||Array(after-before).fill(game==='maniacgrafia'?3:12)}}};}
const practice=Array.from({length:11},(_,i)=>event('p'+i,'battlegrafia',i*60,i?i*3:0,(i+1)*3));
let result=workshopProgress(run,practice);assert.equal(result.completed,true);assert.equal(result.completionRoute,'practice');assert.equal(result.support.activeSeconds,600);assert.equal(result.xp,0);
assert.deepEqual(workshopProgress(run,[...practice,...practice]),result,'Retries must not double work or time');
assert.equal(workshopProgress(run,practice.map(e=>({...e,occurred_at:iso(0)}))).completed,false,'Fast batch cannot manufacture sustained practice');
assert.equal(workshopProgress(run,practice.map((e,i)=>({...e,occurred_at:iso(i*300)}))).completed,false,'Idle gaps are excluded');
assert.equal(workshopProgress(run,practice.map(e=>({...e,details:{learning:{...e.details.learning,errorsAfter:100}}}))).completed,false,'Random guesses cannot pass practice');
assert.equal(workshopProgress(run,practice.map(e=>({...e,details:{}}))).completed,false,'Old workshops are unchanged');
assert.equal(workshopProgress(run,practice.map(e=>({...e,event_type:'class_boss_reward',xp_delta:1000}))).completed,false);
const closed={...run,closed_at:iso(200)};assert.equal(workshopProgress(closed,practice).completed,false);
const gapPeriods=groupWorkshops([{...run,closed_at:iso(200),workshop_key:'same'},{...run,run_id:'r2',started_at:iso(800),workshop_key:'same'}])[0];
assert.equal(workshopProgress(gapPeriods,practice).support.activeSeconds,180,'Closed periods do not add active time');
const xpRoute=workshopProgress(run,[{...practice[0],xp_delta:400}]);assert.equal(xpRoute.completionRoute,'xp');assert.equal(xpRoute.awardRun.run_id,'r');
const v3=encounterConfig();assert.equal(v3.version,3);assert.equal(encounterConfig({version:2}).version,2);
assert.ok(encounterSchedule(v3,30)[0].health>encounterSchedule({version:2},30)[0].health);
const battle={state:'active',started_at:iso(0),active_since:iso(0),intervals:[],game_ids:run.game_ids,duration_seconds:1500,encounter_config:v3,encounter_rounds:[{index:0,from:0,to:120,health:1000,final:false}],round_results:[]};
const hits=[event('m','maniacgrafia',10,0,4),{...event('b','battlegrafia',11,0,2),profile_id:'b'},{...event('f','lexoma',12,0,1,0,0,[24]),profile_id:'f'}];
const fight=countEncounter(hits,battle,[run],start+20000);assert.equal(fight.rounds[0].hits,7);assert.equal(fight.rounds[0].damage,24,'4 + 8 + 8 effort damage plus 4 cooperation');assert.equal(fight.leaderboard[0].profileId,'f','Podium uses damage, not fastest raw answer count');
assert.deepEqual(countEncounter([...hits,...hits],battle,[run],start+20000),fight);
const overlapping=[event('f1','lexoma',10,0,2,0,0,[12,18]),event('f2','lexoma',11,1,3,0,0,[18,24])];
assert.equal(countEncounter(overlapping,battle,[run],start+20000).rounds[0].damage,18,'Only fresh answer indices deal damage: 4+6+8');
const almost={...battle,encounter_rounds:[{index:0,from:0,to:120,health:5,final:false}]};
const final=countEncounter([event('last','battlegrafia',10,0,20)],almost,[run],start+20000);assert.equal(final.rounds[0].hits,2);assert.equal(final.rounds[0].damage,5);
console.log('Fair XP: historical totals, game pacing, long words, legacy parity, pending XP, sustained practice, accuracy, gaps, one award route, weighted attacks, damage podium, v2 compatibility and overlap deduplication OK.');
// Exercise the actual UI functions: an access poll must preserve a practice completion.
const html=fs.readFileSync('apps-script/LenguArcade_Alumno.html','utf8');
const access=html.slice(html.indexOf('  function updateAccess(state){'),html.indexOf('  function syncAccess(){'));
const ui={currentDashboard:{games:[],workshopSession:{objectiveType:'xp',classroomId:'c',startedAt:'now',planId:'p',targetXp:400,progressXp:312,completed:true,completionRoute:'practice',practiceProgress:result.support}},document:{querySelectorAll:()=>[]},window:{},saveCache(){}};
vm.createContext(ui);vm.runInContext(access+';globalThis.poll=updateAccess',ui);
ui.poll({games:[],workshopSession:{objectiveType:'xp',classroomId:'c',startedAt:'now',planId:'p',targetXp:400}});
assert.equal(ui.currentDashboard.workshopSession.completed,true);assert.equal(ui.currentDashboard.workshopSession.progressPercent,100);assert.equal(ui.currentDashboard.workshopSession.completionRoute,'practice');
ui.poll({games:[],workshopSession:{objectiveType:'xp',classroomId:'c',startedAt:'later',planId:'new',targetXp:400}});assert.equal(ui.currentDashboard.workshopSession.completed,false);assert.equal(ui.currentDashboard.workshopSession.practiceProgress,null);
const render=html.slice(html.indexOf('  function renderStudentMission(){'),html.indexOf('  function applyStudentSessionToCards(){'));
const card={innerHTML:''};Object.assign(ui,{document:{getElementById:()=>card},workshopSessionState:{session:{published:true,title:'Prueba',targetXp:400,progressXp:312,progressPercent:100,completed:true,completionRoute:'practice',practiceProgress:result.support}},sessionEsc:String,sessionModeClass:()=>'',sessionModeLabel:()=> 'En clase'});
vm.runInContext(render+';renderStudentMission()',ui);assert.match(card.innerHTML,/Completado por práctica/);assert.match(card.innerHTML,/70 %/);
console.log('Practice UI: real mission rendering and live access polling preserve completion and reset it for a new workshop.');
for(const pupils of [25,30]){
 const schedule=encounterSchedule(v3,pupils),traffic=[];
 for(let p=0;p<pupils;p++){
  const game=run.game_ids[p%3],step=game==='maniacgrafia'?7:game==='battlegrafia'?25:30;
  let count=0;for(let sec=1+p%7;sec<1500;sec+=step)traffic.push({...event(p+'-'+sec,game,sec,count,++count),profile_id:'p'+p});
 }
 const simulation=countEncounter(traffic,{...battle,encounter_rounds:schedule},[run],start+1500000);
 assert.equal(simulation.outcome,'victory');assert.ok(simulation.rounds.every(r=>r.victory));
 const solo=countEncounter(traffic.filter(e=>e.profile_id==='p0'),{...battle,encounter_rounds:schedule},[run],start+1500000);assert.equal(solo.outcome,'defeat');
 console.log('V3 simulated classroom:',pupils,'pupils, all appearances winnable at plausible paces; solo cannot win.');
}
