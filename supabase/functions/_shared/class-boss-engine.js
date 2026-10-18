// Pure deterministic game-event scoring; no client-submitted damage.
export const BOSS_GAMES = Object.freeze(['battlegrafia','lexoma','lexitrama']);
export function battleClock(battle, nowMs=Date.now()) {
  const elapsed = Number(battle.elapsed_seconds || 0)
    + (battle.state === 'active' && battle.active_since ? Math.max(0,(nowMs-Date.parse(battle.active_since))/1000) : 0);
  return Math.max(0,Math.ceil(Number(battle.duration_seconds||900)-elapsed));
}
export function battleIntervals(battle, nowMs=Date.now()) {
  const periods = Array.isArray(battle.intervals) ? battle.intervals.slice() : [];
  if(battle.state === 'active' && battle.active_since) {
    const start = Date.parse(battle.active_since);
    const end = Math.min(nowMs,start + battleClock(battle,start)*1000);
    if(Number.isFinite(start) && end>=start)periods.push({from:new Date(start).toISOString(),to:new Date(end).toISOString()});
  }
  return periods;
}
export function countBossDamage(events, battle, workshopRuns, nowMs=Date.now()) {
  const windows=battleIntervals(battle,nowMs);
  const games = new Set(battle.game_ids || []);
  const runs=(workshopRuns||[]).filter(r=>r.published!==false && r.classroom_open===true);
  const lastByStudent=new Map(),comboBuckets=new Map(),hits=[];
  const unique=new Set();
  const sorted=[...events].sort((a,b)=>Date.parse(a.occurred_at)-Date.parse(b.occurred_at)||String(a.id).localeCompare(String(b.id)));
  for(const event of sorted){
    const id=String(event.id||'');
    if(!id || unique.has(id))continue;unique.add(id);
    if(!games.has(event.game_id)||event.event_type==='teacher_adjustment'||Number(event.xp_delta||0)<=0)continue;
    const at=Date.parse(event.occurred_at);
    if(!Number.isFinite(at)||at<Date.parse(battle.started_at)||at>nowMs)continue;
    if(!windows.some(w=>at>=Date.parse(w.from)&&at<=Date.parse(w.to)))continue;
    if(!runs.some(r=>at>=Date.parse(r.started_at)&&(!r.closed_at||at<=Date.parse(r.closed_at))&&(r.game_ids||[]).includes(event.game_id)))continue;
    const student=String(event.profile_id||'');
    if(!student||at-(lastByStudent.get(student)??-Infinity)<30000)continue;
    lastByStudent.set(student,at);hits.push({gameId:event.game_id,at});
    const bucket=Math.floor((at-Date.parse(battle.started_at))/90000);
    if(!comboBuckets.has(bucket))comboBuckets.set(bucket,new Set());
    comboBuckets.get(bucket).add(event.game_id);
  }
  const combos=[...comboBuckets.values()].filter(s=>BOSS_GAMES.every(g=>s.has(g))).length;
  const damage=hits.length+combos*4;
  return {damage,health:Math.max(0,Number(battle.health_total)-damage),hits:hits.length,combos};
}
