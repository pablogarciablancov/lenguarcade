import assert from 'node:assert/strict';
import {encounterConfig,encounterSchedule,countEncounter,BOSS_GAMES,battleClock} from '../supabase/functions/_shared/class-boss-engine.js';
import {workshopProgress} from '../supabase/functions/_shared/workshop-objective.js';
const start=Date.parse('2026-10-22T10:00:00Z'),iso=s=>new Date(start+s*1000).toISOString();
const config=encounterConfig({version:1}),rounds=encounterSchedule(config,25);
assert.deepEqual(rounds.map(r=>[r.from,r.to]),[[180,300],[540,660],[900,1020],[1260,1500]]);
assert.ok(rounds.at(-1).health>rounds[0].health*2);
for(const minutes of [10,25,60])for(const count of [2,3,4,5,6])for(const seconds of [30,120,180]){
 const c=encounterConfig({sessionMinutes:minutes,appearanceCount:count,combatSeconds:seconds}),schedule=encounterSchedule(c,30);
 assert.equal(schedule.length,count);
 schedule.forEach((r,i)=>{assert.ok(r.to>r.from);if(i)assert.ok(r.from>=schedule[i-1].to);assert.ok(r.to<=minutes*60);});
}
assert.equal(encounterConfig({sessionMinutes:999}).sessionMinutes,60);
assert.equal(encounterConfig({appearanceCount:-2}).appearanceCount,2);
assert.equal(encounterConfig({roundRewards:[99999,-2,'x']}).roundRewards[0],1000);
const battle={id:'test',state:'active',started_at:iso(0),active_since:iso(0),intervals:[],game_ids:BOSS_GAMES,duration_seconds:1500,encounter_config:config,encounter_rounds:rounds,round_results:[]};
const run={started_at:iso(0),classroom_open:true,published:true};
const event=(id,p,g,s,xp=5,type='progress_saved')=>({id,profile_id:p,game_id:g,occurred_at:iso(s),xp_delta:xp,event_type:type});
const at=(events,s,b=battle,r=[run])=>countEncounter(events,b,r,start+s*1000);
assert.equal(at([],0).phase,'rest');assert.equal(at([],179).secondsToNext,1);
assert.equal(at([],180).phase,'combat');assert.equal(at([],300).phase,'rest');
assert.equal(at([],1500).outcome,'defeat');
const traffic=[];
for(let p=0;p<25;p++)for(let sec=5+p%10;sec<1510;sec+=p%3===1?60:30)traffic.push(event(p+'-'+sec,'student-'+p,BOSS_GAMES[p%3],sec,10000000));
const completed=at(traffic,1501);
assert.equal(completed.finished,true);assert.equal(completed.outcome,'victory');assert.ok(completed.rounds.every(r=>r.victory));
assert.equal(completed.rewards.length,completed.rounds.slice(0,-1).reduce((sum,r)=>sum+r.leaderboard.length,0)+3);
assert.equal(completed.leaderboard.reduce((s,p)=>s+p.damage,0),completed.rounds.reduce((s,r)=>s+r.damage,0));
const duplicates=at([...traffic,...traffic],1501);assert.deepEqual(duplicates,completed);
assert.equal(at([event('gap','p','battlegrafia',100),event('gap2','p','battlegrafia',400)],700).leaderboard.length,0);
const small={...battle,encounter_rounds:[{index:0,from:180,to:300,health:2,final:false},{index:1,from:1260,to:1500,health:5,final:true}]};
const hits=[event('1','a','battlegrafia',181),event('fast','a','battlegrafia',182),event('2','b','battlegrafia',185),event('post-victory','c','battlegrafia',190),event('boundary','d','battlegrafia',300),event('reward','e','battlegrafia',186,1000,'class_boss_reward')];
const win=at(hits,301,small);assert.equal(win.rounds[0].hits,2);assert.equal(win.rounds[0].damage,2);assert.equal(win.rounds[0].leaderboard.length,2);assert.equal(win.rewards.length,2);
assert.deepEqual(at([...hits,event('late-arrival','z','battlegrafia',180)],301,{...small,round_results:[win.rounds[0]]}).rounds[0],win.rounds[0]);
assert.equal(at(hits,301,{...small,state:'paused',active_since:null}).leaderboard.length,0);
assert.equal(at(hits,301,small,[{...run,closed_at:iso(180)}]).leaderboard.length,0);
assert.equal(at(hits,190,{...small,state:'finished',active_since:null,intervals:[{from:iso(0),to:iso(184)}]}).rounds[0].victory,false);
assert.equal(battleClock({...battle,duration_seconds:3600,encounter_config:encounterConfig({sessionMinutes:60})},start+2000*1000),1600);
// Bonus XP never qualifies the student for workshop/Flotas objectives.
const objective={...run,game_ids:[],target_xp:400};
const reward=event('reward','p','lenguarcade_admin',200,1000,'class_boss_reward');
assert.equal(workshopProgress(objective,[reward]).xp,0);assert.equal(workshopProgress(objective,[reward]).completed,false);
assert.equal(workshopProgress(objective,[reward,event('real','p','battlegrafia',205,400)]).completed,true);
// A lone account cannot beat the minimum class health.
const solo=at(traffic.filter(e=>e.profile_id==='student-0'),1501,{...battle,encounter_rounds:encounterSchedule(config,1)});
assert.ok(solo.rounds.every(r=>!r.victory));
console.log('Encounters: configurable schedule, 25 simultaneous pupils, all victories, rest windows, pause, final aggregate, duplicates, frozen awards, cooldown and Flotas isolation OK.');
const {platformXpEvents}=await import('../supabase/functions/_shared/platform-xp.js');
const history=Array.from({length:2005},(_,i)=>({id:String(i),xp_delta:25}));let pages=0;
const mock={from(){return {select(){return this},in(){return this},order(){return this},range(from,to){pages++;return Promise.resolve({data:history.slice(from,to+1),error:null})}}}};
const lifetime=await platformXpEvents(mock,['student']);assert.equal(lifetime.data.length,2005);assert.equal(pages,3);
assert.equal(lifetime.data.reduce((sum,e)=>sum+e.xp_delta,0),50125);
console.log('Platform XP: lifetime totals include more than 2,000 rewards across every page.');

// V2: every confirmed correct answer attacks, including XP-capped checkpoints.
const v2=encounterConfig();assert.equal(v2.version,2);
assert.equal(encounterSchedule(v2,25)[0].health,rounds[0].health*3);
const modern={...battle,encounter_config:v2,encounter_rounds:[{index:0,from:180,to:300,health:1000,final:false}]};
const answer=(id,p,s,before,after,xp=0)=>({...event(id,p,'battlegrafia',s,xp),details:{learning:{version:1,correctBefore:before,correctAfter:after}}});
const rapid=Array.from({length:50},(_,i)=>answer('rapid-'+i,'quick',181+i/10,i,i+1));
let result=at(rapid,200,modern);assert.equal(result.rounds[0].hits,50);assert.equal(result.rounds[0].damage,50);
assert.deepEqual(at([...rapid,...rapid],200,modern),result);
result=at([answer('batch','slow',181,0,5),answer('overlap','slow',182,0,6),event('shop','shopper','battlegrafia',183,1000)],200,modern);
assert.equal(result.rounds[0].hits,6);assert.equal(result.leaderboard.length,1);
assert.equal(at([answer('rest','p',100,0,5),answer('replay','p',181,0,6)],200,modern).rounds[0].hits,1);
assert.equal(at(rapid,200,{...modern,state:'paused',active_since:null}).rounds[0].hits,0);
const contenders=at([...rapid,answer('less','other',190,0,10)],301,modern);
assert.equal(contenders.leaderboard[0].profileId,'quick');
console.log('V2: 50 rapid answers = 50 attacks; batches, overlapping saves, retries, zero-XP answers, shop exclusion and pauses OK.');
