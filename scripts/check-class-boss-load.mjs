import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {BOSS_GAMES,encounterConfig,encounterSchedule,countEncounter,battleClock,countBossDamage}
  from '../supabase/functions/_shared/class-boss-engine.js';

// Isolated production-handler simulation. No HTTP, Supabase credentials, or real pupils.
const organizationId='sim-org',classroomId='sim-class',planId='sim-plan';
const players=Array.from({length:25},(_,i)=>'sim-player-'+String(i+1).padStart(2,'0'));
const t0=Date.now()-105000;
const iso=seconds=>new Date(t0+seconds*1000).toISOString();
const config=encounterConfig({version:3,sessionMinutes:10,appearanceCount:2,combatSeconds:60});
const rounds=encounterSchedule(config,players.length);
const battle={
  id:'sim-boss',organization_id:organizationId,classroom_id:classroomId,
  workshop_key:planId,game_ids:[...BOSS_GAMES],state:'active',
  started_at:iso(0),active_since:iso(0),created_at:iso(0),updated_at:iso(0),
  duration_seconds:600,health_total:rounds[0].health,elapsed_seconds:0,intervals:[],
  encounter_config:config,encounter_rounds:rounds,round_results:[]
};
const workshop={
  organization_id:organizationId,classroom_id:classroomId,
  plan_id:planId,started_at:iso(0),published:true,classroom_open:true,
  game_ids:[...BOSS_GAMES]
};
const run={
  organization_id:organizationId,classroom_id:classroomId,
  plan_id:planId,workshop_key:planId,started_at:iso(0),
  closed_at:null,published:true,classroom_open:true,game_ids:[...BOSS_GAMES]
};
const events=[];
for(let i=0;i<players.length;i++){
  for(let j=0;j<8;j++){
    const gameId=BOSS_GAMES[i%3];
    events.push({
      id:'sim-event-'+i+'-'+j,profile_id:players[i],game_id:gameId,
      event_type:'maniacgrafia_checkpoint',xp_delta:6,
      occurred_at:iso(76+j*2+i/100),
      details:{learning:{version:1,correctBefore:j,correctAfter:j+1,
        policyVersion:2,actionXp:[gameId==='maniacgrafia'?3:12]}}
    });
  }
}
const rawEncounter=countEncounter(events,{...battle,round_results:[]},[run],Date.now());
assert.deepEqual(countEncounter([...events,...events],{...battle,round_results:[]},[run],Date.now()).rounds,
  rawEncounter.rounds,'Repeated delivery must not double-count correct answers');

const database={
  classrooms:[{id:classroomId,organization_id:organizationId,active:true,
    name:'Simulated 2 ESO C',section:'2 ESO C',legacy_class_code:null}],
  workshop_sessions:[workshop],
  workshop_runs:[run],
  class_boss_events:[battle],
  classroom_enrollments:players.map(id=>({profile_id:id,classroom_id:classroomId,active:true})),
  profiles:players.map(id=>({id,organization_id:organizationId,first_name:id,last_name:''})),
  game_events:events
};
const reads=new Map();
let settleCalls=0;
function query(table){
  const filters=[],orders=[];let start=0,end=Infinity;
  const q={
    select(){return this},
    eq(k,v){filters.push(row=>row[k]===v);return this},
    in(k,values){filters.push(row=>values.includes(row[k]));return this},
    is(k,v){filters.push(row=>row[k]===v);return this},
    gte(k,v){filters.push(row=>row[k]>=v);return this},
    lte(k,v){filters.push(row=>row[k]<=v);return this},
    order(k,opts={}){orders.push([k,opts.ascending!==false]);return this},
    limit(n){end=n-1;return this},
    range(a,b){start=a;end=b;return this}
  };
  function rows(){
    reads.set(table,(reads.get(table)||0)+1);
    let values=(database[table]||[]).filter(row=>filters.every(fn=>fn(row)));
    if(orders.length)values=values.slice().sort((a,b)=>{
      for(const [k,asc] of orders){
        const x=String(a[k]??''),y=String(b[k]??'');
        if(x!==y)return (x<y?-1:1)*(asc?1:-1);
      }
      return 0;
    });
    return values.slice(start,end+1);
  }
  q.then=(resolve,reject)=>Promise.resolve({data:rows(),error:null}).then(resolve,reject);
  q.maybeSingle=async()=>({data:rows()[0]||null,error:null});
  q.single=async()=>({data:rows()[0]||null,error:null});
  return q;
}
const admin={
  from:query,
  async rpc(name,args){
    assert.equal(name,'settle_class_boss_round');
    settleCalls++;
    if(!battle.round_results.some(r=>r.index===args.p_result.index)){
      battle.round_results.push(args.p_result);
    }
    return {data:[...battle.round_results],error:null};
  }
};
let handler;
const file=readFileSync(new URL('../supabase/functions/class-boss/index.ts',import.meta.url),'utf8');
const source=file.replace(/^import .*?from ["'][^"']+["'];\s*/gm,'');
vm.runInNewContext(stripTypeScriptTypes(source),{
  Deno:{serve(fn){handler=fn}},
  Response,
  console,
  corsHeaders:{},
  jsonResponse:(data,status=200)=>new Response(JSON.stringify(data),{
    status,headers:{'content-type':'application/json'}}),
  requireProfileSession:async request=>({
    admin,organizationId,profileId:request.headers.get('x-sim-student')}),
  requireTeacherSession:async()=>({admin,organizationId,profileId:'sim-teacher'}),
  BOSS_GAMES,battleClock,countBossDamage,encounterConfig,encounterSchedule,countEncounter
});
assert.equal(typeof handler,'function');
const request=(action,student)=>new Request('http://isolated-test/class-boss',{
  method:'POST',headers:{'content-type':'application/json',...(student?{'x-sim-student':student}:{})},
  body:JSON.stringify({action,classCode:classroomId})
});
async function call(action,student){
  const response=await handler(request(action,student));
  assert.equal(response.status,200,action+' HTTP '+response.status);
  const body=await response.json();
  assert.equal(body.ok,true);
  return body.event;
}

// Each of 25 pupils is polling simultaneously in 8 waves while attacking.
const startReads=reads.get('game_events')||0;
for(let wave=0;wave<8;wave++){
  const statuses=await Promise.all(players.map(player=>call('studentStatus',player)));
  assert.ok(statuses.every(s=>s&&s.id===battle.id));
}
const studentEventReads=(reads.get('game_events')||0)-startReads;
assert.equal(studentEventReads,0,'Student polling must never rescan the whole class');
const simultaneousTeacher=await Promise.all(Array.from({length:5},()=>call('status')));
assert.ok(simultaneousTeacher.every(x=>x?.encounter?.rounds?.length===2));
const teacherEventReads=(reads.get('game_events')||0)-startReads;
assert.equal(teacherEventReads,1,'Concurrent projection requests should share one event query');
assert.ok(settleCalls<=1,'One round must not be awarded repeatedly');
assert.equal(simultaneousTeacher[0].encounter.rounds[0].damage,rawEncounter.rounds[0].damage);

// Once all rounds are settled, requests must use stored podiums, not re-read game events.
battle.round_results=rounds.map((round,i)=>({
  ...round,complete:true,victory:i===0,damage:i===0?round.health:0,
  hits:i===0?rawEncounter.rounds[0].hits:0,combos:0,
  healthRemaining:i===0?0:round.health,leaderboard:i===0?rawEncounter.rounds[0].leaderboard:[],
  defeatedAt:i===0?iso(99):null
}));
battle.state='finished';battle.updated_at=new Date().toISOString();
const readsBeforeFinished=reads.get('game_events')||0;
const finishedStatuses=await Promise.all(Array.from({length:25},()=>call('status')));
assert.ok(finishedStatuses.every(s=>s.state==='finished'));
const finalReads=(reads.get('game_events')||0)-readsBeforeFinished;
assert.equal(finalReads,0,'Finalized battles must not re-read the whole history');
console.log(JSON.stringify({
  simulatedStudents:players.length,attacksSubmitted:events.length,simulatedStudentPolls:200,
  simultaneousTeacherPolls:5,studentHistoryScans:studentEventReads,
  teacherHistoryScans:teacherEventReads,finalHistoryScans:finalReads,
  settlementCalls:settleCalls,firstRoundDamage:rawEncounter.rounds[0].damage,
  duplicateAttacksIgnored:true,realAccountsTouched:0,realXPModified:0
},null,2));
console.log('25-player isolated concurrency and server-handler simulation passed.');
