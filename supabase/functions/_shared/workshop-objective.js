// Shared workshop criteria: XP remains the default for existing workshops.
export function isForjaObjective(session) {
  return (session?.objective_type || session?.objectiveType) === 'forja_easy_win';
}
export function forjaVictory(gameId, save) {
  const run = save?.run, win = run?.victory;
  if (gameId !== 'lexoma' || !win || win.runId !== run.id || win.mode !== 'easy' || run.mode !== 'easy' || win.rounds !== 7 || Number(run.round) < 7) return null;
  if (!(run.endless || (run.finished === true && run.status === 'victory'))) return null;
  if (!Number.isFinite(Date.parse(win.at))) return null;
  return {runId:win.runId, mode:'easy', rounds:7, at:win.at};
}
export function workshopVictory(session, event) {
  const win = event?.details?.forjaVictory;
  if (event?.game_id !== 'lexoma' || !win || win.mode !== 'easy' || win.rounds !== 7 || !win.runId) return false;
  const start = Date.parse(session.started_at || session.startedAt || session.active_from || '');
  const endValue = session.closed_at || session.endedAt || session.active_to || session.homeEnd;
  const end = endValue ? Date.parse(endValue) : Infinity;
  const at = Date.parse(win.at), saved = Date.parse(event.occurred_at);
  return Number.isFinite(start) && Number.isFinite(at) && Number.isFinite(saved) && at >= start && at <= end && saved >= start && saved <= end && at <= saved + 60000;
}

// One workshop may have several opening periods. Keep their original IDs for awards.
export function groupWorkshops(rows) {
  const groups = new Map();
  for (const row of [...rows].sort((a,b)=>Date.parse(a.started_at)-Date.parse(b.started_at))) {
    if (row.published === false) continue;
    const key = JSON.stringify([row.classroom_id,row.workshop_key || row.plan_id || row.run_id,row.objective_type || 'xp',Number(row.target_xp || 0),[...(row.game_ids || [])].sort()]);
    const periods = groups.get(key) || [];
    periods.push(row);groups.set(key,periods);
  }
  return [...groups.values()].map(periods=>({...periods.at(-1),run_id:periods[0].run_id,plan_id:periods[0].workshop_key || periods[0].plan_id,started_at:periods[0].started_at,periods}));
}
export function workshopProgress(session, events) {
  const periods = session.periods || [session];
  let xp=0, completedAt=null, awardRun=null;
  const seen=new Set();
  for (const event of [...events].sort((a,b)=>Date.parse(a.occurred_at)-Date.parse(b.occurred_at))) {
    if (event.event_type === 'teacher_adjustment') continue;
    const id=event.id || event.result_id;
    if(id && seen.has(id))continue;
    if(id)seen.add(id);
    const at=Date.parse(event.occurred_at);
    const period=periods.find(p=>{
      const start=Date.parse(p.started_at || p.active_from || '');
      const end=p.closed_at || p.active_to;
      return Number.isFinite(at)&&Number.isFinite(start)&&at>=start&&(!end||at<=Date.parse(end))&&(!(p.game_ids||[]).length||p.game_ids.includes(event.game_id));
    });
    if(!period)continue;
    xp+=Math.max(0,Number(event.xp_delta||0));
    const complete=isForjaObjective(session)?workshopVictory(period,event):Number(session.target_xp)>0&&xp>=Number(session.target_xp);
    if(!completedAt&&complete){completedAt=event.occurred_at;awardRun=period;}
  }
  return {xp,completed:!!completedAt,completedAt,awardRun};
}
