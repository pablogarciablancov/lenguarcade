import assert from 'node:assert/strict';
import {BOSS_GAMES,initialBossHealth,countBossDamage} from '../supabase/functions/_shared/class-boss-engine.js';
const start=Date.parse('2026-10-18T10:00:00Z');
function simulate(enrolled,participants,periods){
 const battle={started_at:new Date(start).toISOString(),active_since:new Date(start).toISOString(),duration_seconds:1500,state:'active',game_ids:BOSS_GAMES,health_total:initialBossHealth(enrolled),intervals:[]};
 const run={started_at:battle.started_at,published:true,classroom_open:true,closed_at:null};
 const events=[];
 for(let i=0;i<participants;i++)for(let sec=5+i%15;sec<1500;sec+=periods[i%3])events.push({id:i+'-'+sec,profile_id:'synthetic-'+i,game_id:BOSS_GAMES[i%3],xp_delta:100,event_type:'progress_saved',occurred_at:new Date(start+sec*1000).toISOString()});
 const at=seconds=>countBossDamage(events,battle,[run],start+seconds*1000);
 const end=at(1500);
 let victory=null;
 if(end.health===0){let low=0,high=1500;while(high-low>1){const mid=Math.floor((low+high)/2);if(at(mid).health===0)high=mid;else low=mid;}victory=high;}
 return {health:battle.health_total,remaining:end.health,victorySeconds:victory};
}
for(const enrolled of [25,28,30]){
 const result=simulate(enrolled,enrolled,[30,60,30]);
 assert.ok(result.victorySeconds>=15*60&&result.victorySeconds<25*60,JSON.stringify(result));
 console.log(enrolled+' alumnos, guardados cada 30/60/30 s por juego:',JSON.stringify(result));
}
const solo=simulate(1,1,[30,30,30]);assert.equal(solo.remaining,950);assert.equal(solo.victorySeconds,null);
const fast=simulate(30,30,[30,30,30]);assert.ok(fast.victorySeconds>=18*60);
const partial=simulate(30,15,[30,60,30]);assert.ok(partial.remaining>0);assert.equal(partial.victorySeconds,null);
console.log('Solo:',JSON.stringify(solo),'Clase muy rápida:',JSON.stringify(fast),'15/30 participantes:',JSON.stringify(partial));
