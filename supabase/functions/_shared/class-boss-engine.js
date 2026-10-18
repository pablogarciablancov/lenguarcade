// Cooperative boss: server-observed saved XP, fair shared cooldown and no double hits.
export const BOSS_GAMES = Object.freeze(['battlegrafia','lexoma','maniacgrafia']);
export const BOSS_DURATION_SECONDS = 25 * 60;
const ms=value=>Date.parse(value||'');
const localDay = timestamp => {
  const fields = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'})
    .formatToParts(new Date(timestamp));
  return ['year','month','day'].map(type=>fields.find(field=>field.type===type)?.value).join('-');
};
// The event expires 25 real minutes after starting, or at Madrid midnight if sooner.
export function battleDeadlineMs(battle) {
  const start=ms(battle.started_at);
  if(!Number.isFinite(start))return NaN;
  const requested=Number(battle.duration_seconds);
  const duration=Number.isFinite(requested)&&requested>0?Math.min(BOSS_DURATION_SECONDS,requested):BOSS_DURATION_SECONDS;
  const end=start+duration*1000;
  if(localDay(start)===localDay(end-1))return end;
  let lower=start,upper=end;
  const day=localDay(start);
  while(upper-lower>1) {
    const mid=Math.floor((lower+upper)/2);
    if(localDay(mid)===day)lower=mid;
    else upper=mid;
  }
  return upper;
}
function rawWindows(battle,nowMs) {
  const periods=Array.isArray(battle.intervals)?battle.intervals.slice():[];
  if(battle.state==='active' && battle.active_since)periods.push({from:battle.active_since,to:new Date(nowMs).toISOString()});
  return periods.map(p=>({from:ms(p.from),to:ms(p.to)})).filter(p=>Number.isFinite(p.from)&&Number.isFinite(p.to)&&p.to>p.from);
}
// Attacks require an open workshop; closing it or pausing cannot extend the deadline.
export function eligibleBattleWindows(battle,runs,nowMs=Date.now()) {
  const deadline=battleDeadlineMs(battle);
  const until=Math.min(nowMs,deadline);
  if(!Number.isFinite(until))return [];
  const active=rawWindows(battle,until);
  const intervals=[];
  for(const a of active)for(const r of runs||[]){
    if(r.published===false||(!r.classroom_open&&!r.closed_at))continue;
    const from=Math.max(a.from,ms(r.started_at),ms(battle.started_at));
    const to=Math.min(a.to,r.closed_at?ms(r.closed_at):until,until);
    if(Number.isFinite(from)&&Number.isFinite(to)&&to>from)intervals.push({from,to});
  }
  intervals.sort((a,b)=>a.from-b.from);
  const merged=[];
  for(const p of intervals){const last=merged[merged.length-1];if(last&&p.from<=last.to)last.to=Math.max(last.to,p.to);else merged.push({...p});}
  return merged.map(p=>({from:new Date(p.from).toISOString(),to:new Date(p.to).toISOString()}));
}
export function battleClock(battle,nowMs=Date.now(),_runs) {
  const deadline=battleDeadlineMs(battle);
  return Number.isFinite(deadline)?Math.max(0,Math.ceil((deadline-nowMs)/1000)):0;
}
export function battleIntervals(battle,nowMs=Date.now()) {
  const periods=Array.isArray(battle.intervals)?battle.intervals.slice():[];
  if(battle.state==='active'&&battle.active_since) {
    const end=Math.min(nowMs,battleDeadlineMs(battle));
    if(end>ms(battle.active_since))periods.push({from:battle.active_since,to:new Date(end).toISOString()});
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
