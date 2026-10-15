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
