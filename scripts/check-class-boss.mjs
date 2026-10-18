import assert from 'node:assert/strict';
import {battleClock,countBossDamage} from '../supabase/functions/_shared/class-boss-engine.js';
const started='2026-10-18T10:00:00.000Z',t=Date.parse(started);
const battle={started_at:started,active_since:started,elapsed_seconds:0,duration_seconds:900,state:'active',game_ids:['battlegrafia','lexoma','lexitrama'],health_total:224,intervals:[]};
const run={started_at:started,closed_at:null,published:true,classroom_open:true,game_ids:battle.game_ids};
const ev=(id,student,game,sec,xp=6)=>({id,profile_id:student,game_id:game,xp_delta:xp,event_type:'progress_saved',occurred_at:new Date(t+sec*1000).toISOString()});
const events=[ev('1','a','battlegrafia',12),ev('2','a','battlegrafia',15),ev('3','b','lexoma',17),ev('4','c','lexitrama',19),ev('1','a','battlegrafia',12)];
assert.deepEqual(countBossDamage(events,battle,[run],t+60000),{damage:7,health:217,hits:3,combos:1});
assert.equal(countBossDamage([...events,ev('5','d','lexoma',61)],battle,[run],t+62000).damage,8);
assert.equal(countBossDamage([ev('6','a','battlegrafia',12,0)],battle,[run],t+60000).damage,0);
assert.equal(countBossDamage(events,battle,[{...run,closed_at:new Date(t+10000).toISOString()}],t+60000).damage,0);
assert.equal(countBossDamage(events,{...battle,state:'paused',active_since:null,elapsed_seconds:20,intervals:[{from:started,to:new Date(t+16000).toISOString()}]},[run],t+60000).damage,1);
assert.equal(battleClock({...battle,state:'paused',active_since:null,elapsed_seconds:65},t+200000),835);
assert.equal(battleClock({...battle,elapsed_seconds:890,active_since:new Date(t+100000).toISOString()},t+115000),0);
assert.equal(countBossDamage(events,{...battle,game_ids:['battlegrafia']},[run],t+60000).damage,1);
// Load simulation: 30 pupils saving at nearly the same time, across all three games.
const classEvents=Array.from({length:30},(_,i)=>ev('event-'+i,'student-'+i,battle.game_ids[i%3],24+i%6));
const crowded=countBossDamage([...classEvents,...classEvents],battle,[run],t+60000);
assert.equal(crowded.hits,30,'All 30 simultaneous pupils contribute once');
assert.equal(crowded.combos,1,'One cross-game combo per time window');
assert.equal(crowded.health,190,'Collective damage ignores duplicate deliveries');
// A reopened workshop interval retains contributions but not those saved in a closed gap.
const reopening={...run,started_at:new Date(t+120000).toISOString(),closed_at:null};
const previousRun={...run,classroom_open:false,closed_at:new Date(t+60000).toISOString()};
assert.equal(countBossDamage([...events,ev('gap','d','lexoma',90),ev('after','e','lexoma',130)],battle,[previousRun,reopening],t+150000).hits,4);
// Reopening a workshop the following day must not consume the boss timer.
const nextDay=t+86400000;
const firstWindow={...run,classroom_open:false,closed_at:new Date(t+60000).toISOString()};
const reopenedWindow={...run,started_at:new Date(nextDay).toISOString(),closed_at:null};
const reopenedNow=nextDay+20000;
assert.equal(battleClock(battle,reopenedNow,[firstWindow,reopenedWindow]),820);
assert.equal(countBossDamage([...events,ev('reopened','z','lexoma',86410)],battle,[firstWindow,reopenedWindow],reopenedNow).hits,4);
console.log('Class boss: unique events, cooldown, combo, closed windows, pause and timer and 30-player simulation OK.');
