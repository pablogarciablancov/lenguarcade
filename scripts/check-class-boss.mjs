import assert from 'node:assert/strict';
import {
  BOSS_GAMES,BOSS_DURATION_SECONDS,battleClock,battleDeadlineMs,countBossDamage
} from '../supabase/functions/_shared/class-boss-engine.js';

const started='2026-10-18T10:00:00.000Z',t=Date.parse(started);
const battle={started_at:started,active_since:started,elapsed_seconds:0,duration_seconds:1500,
  state:'active',game_ids:['battlegrafia','lexoma','maniacgrafia'],health_total:224,intervals:[]};
const run={started_at:started,closed_at:null,published:true,classroom_open:true,game_ids:battle.game_ids};
const ev=(id,student,game,sec,xp=6)=>({id,profile_id:student,game_id:game,xp_delta:xp,
  event_type:'progress_saved',occurred_at:new Date(t+sec*1000).toISOString()});

assert.deepEqual(BOSS_GAMES,['battlegrafia','lexoma','maniacgrafia']);
assert.equal(BOSS_DURATION_SECONDS,25*60);
assert.equal(battleClock(battle,t),1500);
assert.equal(battleClock(battle,t+25*60*1000),0);
assert.equal(battleClock(battle,t+24*60*1000),60);
// A client specifying 40 minutes cannot extend the battle beyond 25.
assert.equal(battleClock({...battle,duration_seconds:2400},t+1500000),0);

const events=[
  ev('1','a','battlegrafia',12),ev('2','a','battlegrafia',15),
  ev('3','b','lexoma',17),ev('4','c','maniacgrafia',19),
  ev('1','a','battlegrafia',12)
];
assert.deepEqual(countBossDamage(events,battle,[run],t+60000),{damage:7,health:217,hits:3,combos:1});
assert.equal(countBossDamage([...events,ev('5','d','lexoma',61)],battle,[run],t+62000).damage,8);
assert.equal(countBossDamage([ev('6','a','battlegrafia',12,0)],battle,[run],t+60000).damage,0);
assert.equal(countBossDamage(events,battle,[{...run,closed_at:new Date(t+10000).toISOString()}],t+60000).damage,0);
assert.equal(countBossDamage(events,{...battle,state:'paused',active_since:null,elapsed_seconds:20,
  intervals:[{from:started,to:new Date(t+16000).toISOString()}]},[run],t+60000).damage,1);
assert.equal(battleClock({...battle,state:'paused',active_since:null,elapsed_seconds:65},t+200000),1300,
  'Pausing stops attacks, not the 25-minute countdown');
assert.equal(countBossDamage(events,{...battle,game_ids:['battlegrafia']},[run],t+60000).damage,1);

// Simulate 30 concurrent players and repeated deliveries.
const classEvents=Array.from({length:30},(_,i)=>ev('event-'+i,'student-'+i,battle.game_ids[i%3],24+i%6));
const crowded=countBossDamage([...classEvents,...classEvents],battle,[run],t+60000);
assert.equal(crowded.hits,30);
assert.equal(crowded.combos,1);
assert.equal(crowded.health,190);

// Opening a workshop again within 25 minutes keeps progress, without granting extra time.
const closedWindow={...run,classroom_open:false,closed_at:new Date(t+60000).toISOString()};
const reopening={...run,started_at:new Date(t+120000).toISOString(),closed_at:null};
const current=t+150000;
assert.equal(countBossDamage([...events,ev('gap','d','lexoma',90),ev('after','e','lexoma',130)],
  battle,[closedWindow,reopening],current).hits,4);
assert.equal(battleClock(battle,current,[closedWindow,reopening]),1350);

// A workshop reopened the following day cannot revive the old battle.
const nextDay=t+86400000;
const reopenedTomorrow={...run,started_at:new Date(nextDay).toISOString(),closed_at:null};
assert.equal(battleClock(battle,nextDay+20000,[closedWindow,reopenedTomorrow]),0);
assert.equal(countBossDamage([...events,ev('late','z','lexoma',86410)],
  battle,[closedWindow,reopenedTomorrow],nextDay+20000).hits,3);

// Late events never attack, even when the workshop remains open.
assert.equal(countBossDamage([ev('last','a','maniacgrafia',1499)],battle,[run],t+1510000).hits,1);
assert.equal(countBossDamage([ev('late','a','maniacgrafia',1501)],battle,[run],t+1510000).hits,0);

// The encounter also ends at local midnight (Madrid) if started very late.
const lateNight='2026-10-18T21:50:00.000Z'; // 23:50 in Madrid (CEST)
const nightBattle={...battle,started_at:lateNight,active_since:lateNight};
assert.equal(battleDeadlineMs(nightBattle),Date.parse('2026-10-18T22:00:00.000Z'));
assert.equal(battleClock(nightBattle,Date.parse('2026-10-18T21:55:00.000Z')),300);
assert.equal(battleClock(nightBattle,Date.parse('2026-10-18T22:00:00.000Z')),0);

console.log('Class boss: Maniacgrafía, 25-minute hard deadline, same-day expiry, cooldown, 30 pupils, pause and closed workshop OK.');
