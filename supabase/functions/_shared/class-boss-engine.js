// Cooperative boss: server-observed saved XP, fair shared cooldown and no double hits.
export const BOSS_GAMES = Object.freeze(['battlegrafia','lexoma','maniacgrafia']);
export const BOSS_DURATION_SECONDS = 25 * 60;
// A class encounter must never collapse to eight HP in a one-account test.
export function initialBossHealth(studentCount) {
  const roster=Math.max(1,Math.floor(Number(studentCount)||0));
  return Math.max(1000,Math.min(5000,roster*40));
}

const ms=value=>Date.parse(value||'');
const localDay = timestamp => {
  const fields = new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'})
    .formatToParts(new Date(timestamp));
  return ['year','month','day'].map(type=>fields.find(field=>field.type===type)?.value).join('-');
};
// Legacy events expire after 25 minutes; configured sessions after their chosen duration. Both expire at Madrid midnight.
export function battleDeadlineMs(battle) {
  const start=ms(battle.started_at);
  if(!Number.isFinite(start))return NaN;
  const requested=Number(battle.duration_seconds);
  const duration=Number.isFinite(requested)&&requested>0?Math.min(battle.encounter_config?3600:BOSS_DURATION_SECONDS,requested):BOSS_DURATION_SECONDS;
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
    if(!games.has(event.game_id)||['teacher_adjustment','class_boss_reward'].includes(event.event_type)||Number(event.xp_delta||0)<=0)continue;
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


// Versioned configuration leaves legacy, single-encounter events unchanged.
export function encounterConfig(input={}) {
  const integer=(v,f,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Math.round(Number(v)))):f;
  const reward=(values,defaults)=>defaults.map((n,i)=>integer(values?.[i],n,0,1000));
  return {version:1,sessionMinutes:integer(input.sessionMinutes,25,10,60),
    appearanceCount:integer(input.appearanceCount,4,2,6),combatSeconds:integer(input.combatSeconds,120,30,180),
    roundRewards:reward(input.roundRewards,[150,100,75]),participationXp:integer(input.participationXp,25,0,250),
    finalRewards:reward(input.finalRewards,[300,200,150])};
}
export function encounterSchedule(config,studentCount) {
  const c=encounterConfig(config),duration=c.sessionMinutes*60,n=c.appearanceCount;
  const seconds=Math.min(c.combatSeconds,Math.floor(duration*.45/n),Math.floor(duration*.125));
  const finalSeconds=seconds*2;
  return Array.from({length:n},(_,i)=>{
    const final=i===n-1,length=final?finalSeconds:seconds;
    const from=final?duration-finalSeconds:Math.round(duration*(n===2?.12:.12+i*.48/(n-2)));
    const roster=Math.max(12,Math.min(100,Number(studentCount)||12));
    return {index:i,final,from,to:from+length,health:Math.max(8,Math.ceil(roster*(length/30)*(final?.75:.65)))};
  });
}
function ranked(contributions) {
  return [...contributions.values()].sort((a,b)=>b.damage-a.damage||a.firstAt-b.firstAt||a.profileId.localeCompare(b.profileId))
    .map((p,i)=>({...p,position:i+1}));
}
export function countEncounter(events,battle,runs,nowMs=Date.now()) {
  const start=ms(battle.started_at),windows=eligibleBattleWindows(battle,runs,nowMs);
  const end=battleDeadlineMs(battle),until=Math.min(nowMs,end);
  const c=encounterConfig(battle.encounter_config);
  const sorted=[...events].sort((a,b)=>ms(a.occurred_at)-ms(b.occurred_at)||String(a.id).localeCompare(String(b.id)));
  const rounds=(battle.encounter_rounds||[]).map(round=>{
    const saved=(battle.round_results||[]).find(r=>r.index===round.index);
    if(saved)return saved;
    const from=start+round.from*1000,to=Math.min(start+round.to*1000,end);
    const players=new Map(),last=new Map(),buckets=new Map(),seen=new Set();
    let damage=0,hits=0,combos=0,defeatedAt=null;
    for(const e of sorted){
      const at=ms(e.occurred_at),id=String(e.id||''),student=String(e.profile_id||'');
      if(damage>=round.health)break;
      if(!id||seen.has(id)||!student||!Number.isFinite(at)||at<from||at>=to||at>until||
        !(battle.game_ids||[]).includes(e.game_id)||['teacher_adjustment','class_boss_reward'].includes(e.event_type)||Number(e.xp_delta)<=0||
        !windows.some(w=>at>=ms(w.from)&&at<=ms(w.to))||at-(last.get(student)??-Infinity)<30000)continue;
      seen.add(id);last.set(student,at);
      const bucket=Math.floor((at-from)/90000),games=buckets.get(bucket)||new Set();
      const wasCombo=BOSS_GAMES.every(g=>games.has(g));games.add(e.game_id);buckets.set(bucket,games);
      const combo=!wasCombo&&BOSS_GAMES.every(g=>games.has(g));
      const dealt=Math.min(round.health-damage,combo?5:1);
      damage+=dealt;hits++;if(combo)combos++;
      const p=players.get(student)||{profileId:student,damage:0,hits:0,firstAt:at};p.damage+=dealt;p.hits++;players.set(student,p);
      if(damage>=round.health)defeatedAt=new Date(at).toISOString();
    }
    const complete=!!defeatedAt||until>=to||battle.state==='finished';
    return {...round,damage,hits,combos,healthRemaining:Math.max(0,round.health-damage),defeatedAt,
      complete,victory:!!defeatedAt,leaderboard:ranked(players)};
  });
  const all=new Map();
  for(const r of rounds)for(const p of r.leaderboard){const total=all.get(p.profileId)||{profileId:p.profileId,damage:0,hits:0,firstAt:p.firstAt};total.damage+=p.damage;total.hits+=p.hits;total.firstAt=Math.min(total.firstAt,p.firstAt);all.set(p.profileId,total);}
  const leaderboard=ranked(all),elapsed=(nowMs-start)/1000;
  const current=rounds.find(r=>!r.complete&&elapsed>=r.from&&elapsed<r.to)||null;
  const next=rounds.find(r=>!r.complete&&r.from>elapsed)||null;
  const finished=battle.state==='finished'||nowMs>=end||rounds.every(r=>r.complete);
  const phase=finished?'finished':battle.state==='paused'?'paused':current?'combat':'rest';
  const latest=[...rounds].reverse().find(r=>r.complete&&start+r.from*1000<=until)||null;
  const rewards=[];
  for(const r of rounds){
    if(!r.complete||!r.victory)continue;
    if(!r.final)for(const p of r.leaderboard)rewards.push({round:r.index,profileId:p.profileId,xp:c.roundRewards[p.position-1]??c.participationXp,position:p.position});
    if(r.final)for(const p of leaderboard.slice(0,3))rewards.push({round:r.index,profileId:p.profileId,xp:c.finalRewards[p.position-1],position:p.position});
  }
  return {rounds,leaderboard,rewards,current,next,latest,phase,finished,
    outcome:finished?(rounds.at(-1)?.victory?'victory':'defeat'):null,
    secondsToNext:next?Math.max(0,Math.ceil((start+next.from*1000-nowMs)/1000)):0,
    combatSeconds:current?Math.max(0,Math.ceil((Math.min(end,start+current.to*1000)-nowMs)/1000)):0};
}
