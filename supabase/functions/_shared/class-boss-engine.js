// Cooperative boss: server-observed saved XP, fair shared cooldown and no double hits.
export const BOSS_GAMES = Object.freeze(['battlegrafia','lexoma','lexitrama']);
const ms=value=>Date.parse(value||'');
function rawWindows(battle,nowMs) {
  const periods=Array.isArray(battle.intervals)?battle.intervals.slice():[];
  if(battle.state==='active' && battle.active_since)periods.push({from:battle.active_since,to:new Date(nowMs).toISOString()});
  return periods.map(p=>({from:ms(p.from),to:ms(p.to)})).filter(p=>Number.isFinite(p.from)&&Number.isFinite(p.to)&&p.to>p.from);
}
// The timer is counted only inside workshop openings. Long closed gaps cost no time.
export function eligibleBattleWindows(battle,runs,nowMs=Date.now()) {
  const active=rawWindows(battle,nowMs);
  const intervals=[];
  for(const a of active)for(const r of runs||[]){
    if(r.published===false||(!r.classroom_open&&!r.closed_at))continue;
    const from=Math.max(a.from,ms(r.started_at),ms(battle.started_at));
    const to=Math.min(a.to,r.closed_at?ms(r.closed_at):nowMs,nowMs);
    if(Number.isFinite(from)&&Number.isFinite(to)&&to>from)intervals.push({from,to});
  }
  intervals.sort((a,b)=>a.from-b.from);
  const merged=[];
  for(const p of intervals){const last=merged[merged.length-1];if(last&&p.from<=last.to)last.to=Math.max(last.to,p.to);else merged.push({...p});}
  let budget=Number(battle.duration_seconds||900)*1000;
  const result=[];
  for(const p of merged){if(budget<=0)break;const to=Math.min(p.to,p.from+budget);result.push({from:new Date(p.from).toISOString(),to:new Date(to).toISOString()});budget-=to-p.from;}
  return result;
}
export function battleClock(battle,nowMs=Date.now(),runs) {
  if(Array.isArray(runs)){
    const used=eligibleBattleWindows(battle,runs,nowMs).reduce((total,p)=>total+ms(p.to)-ms(p.from),0);
    return Math.max(0,Math.ceil((Number(battle.duration_seconds||900)*1000-used)/1000));
  }
  // Fallback for legacy/test callers without the workshop timeline.
  const elapsed=Number(battle.elapsed_seconds||0)+(battle.state==='active'&&battle.active_since?Math.max(0,(nowMs-ms(battle.active_since))/1000):0);
  return Math.max(0,Math.ceil(Number(battle.duration_seconds||900)-elapsed));
}
export function battleIntervals(battle,nowMs=Date.now()) {
  const periods=Array.isArray(battle.intervals)?battle.intervals.slice():[];
  if(battle.state==='active'&&battle.active_since){
    const start=ms(battle.active_since),end=Math.min(nowMs,start+battleClock(battle,start)*1000);
    if(Number.isFinite(start)&&end>=start)periods.push({from:new Date(start).toISOString(),to:new Date(end).toISOString()});
  }
  return periods;
}
export function countBossDamage(events,battle,workshopRuns,nowMs=Date.now()) {
  const windows=eligibleBattleWindows(battle,workshopRuns,nowMs);
  const games=new Set(battle.game_ids||[]);
  const lastByStudent=new Map(),comboBuckets=new Map(),hits=[],unique=new Set();
  const sorted=[...events].sort((a,b)=>ms(a.occurred_at)-ms(b.occurred_at)||String(a.id).localeCompare(String(b.id)));
  for(const event of sorted){
    const id=String(event.id||'');if(!id||unique.has(id))continue;unique.add(id);
    if(!games.has(event.game_id)||event.event_type==='teacher_adjustment'||Number(event.xp_delta||0)<=0)continue;
    const at=ms(event.occurred_at);
    if(!Number.isFinite(at)||at<ms(battle.started_at)||at>nowMs)continue;
    if(!windows.some(w=>at>=ms(w.from)&&at<=ms(w.to)))continue;
    const student=String(event.profile_id||'');
    if(!student||at-(lastByStudent.get(student)??-Infinity)<30000)continue;
    lastByStudent.set(student,at);hits.push({gameId:event.game_id,at});
    const bucket=Math.floor((at-ms(battle.started_at))/90000);
    if(!comboBuckets.has(bucket))comboBuckets.set(bucket,new Set());
    comboBuckets.get(bucket).add(event.game_id);
  }
  const combos=[...comboBuckets.values()].filter(s=>BOSS_GAMES.every(g=>s.has(g))).length;
  const damage=hits.length+combos*4;
  return {damage,health:Math.max(0,Number(battle.health_total)-damage),hits:hits.length,combos};
}
