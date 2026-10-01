// Platform XP is retained. Only the cost of each successive level changes.
function levelProgress(xp){
  xp=Math.max(0,Number(xp)||0);let level=1,start=0,cost=1000;
  while(xp>=start+cost&&level<1000){start+=cost;level++;cost=Math.ceil(1000*Math.pow(1.3,level-1)/50)*50;}
  return{level,levelStartXp:start,nextLevelXp:start+cost,levelCost:cost,levelProgress:Math.min(100,Math.floor((xp-start)/cost*100))};
}
function learningGrade(progress,missions=[]){
  const validMissions=missions.filter(m=>Number(m.target)>0);
  const assigned=new Set(validMissions.map(m=>m.gameId).filter(Boolean));
  const rows=assigned.size?[...assigned].map(id=>progress.find(r=>(r.game_id||r.gameId)===id)||{percentage:0,attempts:0,successes:0}):progress.filter(r=>Number(r.attempts)>0||Number(r.percentage)>0);
  const avg=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
  const bound=n=>Math.max(0,Math.min(100,Number(n)||0));
  // Equal weight per requested game: repeating an easy game cannot hide another.
  const mastery=avg(rows.map(r=>Number(r.attempts)>0?bound(Number(r.successes)/Number(r.attempts)*100):0));
  const advancement=avg(rows.map(r=>bound(r.percentage)));
  const objectives=avg(validMissions.map(m=>bound(Number(m.progress)/Number(m.target)*100)));
  const score=(validMissions.length?objectives*.4+mastery*.4+advancement*.2:mastery*.65+advancement*.35)/10;
  return{score:Math.round(score*10)/10,breakdown:{misiones:Math.round(objectives)/10,dominio:Math.round(mastery)/10,progreso:Math.round(advancement)/10},weights:validMissions.length?{misiones:40,dominio:40,progreso:20}:{dominio:65,progreso:35},assessedGames:rows.length};
}
function platformMilestones(xp,grade,attempts){
 const level=levelProgress(xp).level;
 return [
  ...[3,5,10,20].map(n=>({id:'level_'+n,title:'Nivel '+n,description:'Alcanza el nivel '+n,value:level,target:n})),
  ...[5000,15000,50000].map(n=>({id:'xp_'+n,title:n.toLocaleString('es-ES')+' XP',description:'Acumula experiencia en LenguArcade',value:xp,target:n})),
  ...[7,9].map(n=>({id:'grade_'+n,title:'Nota '+n,description:'Alcanza una nota de '+n+' con al menos 20 respuestas',value:attempts>=20?grade:0,target:n}))
 ].map(m=>({...m,unlocked:m.value>=m.target,progress:Math.min(m.target,m.value)}));
}


/**
 * Calcula la recompensa de plataforma desde el cambio real entre snapshots.
 * Nunca acepta XP o plumas enviados por el navegador como fuente de verdad.
 */
function calculateAuthoritativeProgress_(gameId, payload, old) {
  payload = payload || {};
  old = old || {};
  const raw = payload.rawGameData && typeof payload.rawGameData === 'object' ? payload.rawGameData : {};
  const save = raw.save && typeof raw.save === 'object' ? raw.save : (payload.save && typeof payload.save === 'object' ? payload.save : {});
  let previousRaw = {};
  try {
    previousRaw = typeof old.rawJson === 'string' ? JSON.parse(old.rawJson || '{}') : (old.rawJson || {});
  } catch (error) {
    previousRaw = {};
  }
  const previousSave = previousRaw.save && typeof previousRaw.save === 'object' ? previousRaw.save : {};
  const metrics = raw.metrics && typeof raw.metrics === 'object' ? raw.metrics : {};
  const previousMetrics = previousRaw.metrics && typeof previousRaw.metrics === 'object' ? previousRaw.metrics : {};
  const checkpoint = payload.checkpoint === true || /_checkpoint$/.test(String(payload.eventType || ''));
  const n = value => Math.max(0, Number(value) || 0);
  const delta = (current, previous) => {
    current = n(current); previous = n(previous);
    return current >= previous ? current - previous : current;
  };
  const capDelta = (current, previous, cap) => Math.min(cap, delta(current, previous));
  const finish = (attemptDelta, correctDelta, errorDelta, percentage, xpGain, featherGain) => {
    const oldAttempts = n(old.attempts), oldCorrect = n(old.successes), oldErrors = n(old.errors);
    const da = Math.max(0, Math.round(attemptDelta));
    const dc = Math.min(da, Math.max(0, Math.round(correctDelta)));
    const de = Math.max(0, Math.min(da - dc, Math.round(errorDelta)));
    const attempts = oldAttempts + da;
    const successes = oldCorrect + dc;
    const errors = Math.max(oldErrors + de, attempts - successes);
    return {
      xp:n(old.xp) + Math.max(0, Math.round(xpGain)),
      plumas:n(old.plumas) + Math.max(0, Math.round(featherGain)),
      percentage:Math.min(100, Math.max(n(old.percentage), n(percentage))),
      accuracy:attempts ? Math.round(successes / attempts * 100) : n(old.accuracy),
      attempts:attempts,
      successes:successes,
      errors:errors
    };
  };

  if (gameId === 'battlegrafia') {
    const diary = Array.isArray(save.diary) ? save.diary : [];
    const previousDiary = Array.isArray(previousSave.diary) ? previousSave.diary : [];
    const diaryCorrect = diary.filter(row => row && row.isPerfect).length;
    const previousDiaryCorrect = previousDiary.filter(row => row && row.isPerfect).length;
    const currentCorrect = n(save.stats_correct != null ? save.stats_correct : (save.correct != null ? save.correct : diaryCorrect));
    const priorCorrect = n(previousSave.stats_correct != null ? previousSave.stats_correct : (previousSave.correct != null ? previousSave.correct : previousDiaryCorrect));
    const currentErrors = n(save.stats_wrong != null ? save.stats_wrong : (save.errors != null ? save.errors : Math.max(0, diary.length - diaryCorrect)));
    const priorErrors = n(previousSave.stats_wrong != null ? previousSave.stats_wrong : (previousSave.errors != null ? previousSave.errors : Math.max(0, previousDiary.length - previousDiaryCorrect)));
    const dc = capDelta(currentCorrect, priorCorrect, checkpoint ? 24 : 60);
    const de = capDelta(currentErrors, priorErrors, checkpoint ? 24 : 60);
    const currentDefeated = Array.isArray(save.defeatedMonsters) ? save.defeatedMonsters.length : n(save.monstersDefeated);
    const previousDefeated = Array.isArray(previousSave.defeatedMonsters) ? previousSave.defeatedMonsters.length : n(previousSave.monstersDefeated);
    const rawDefeatedDelta = capDelta(currentDefeated, previousDefeated, checkpoint ? 6 : 15);
    const defeatedDelta = Math.min(rawDefeatedDelta, Math.max(1, dc + 1));
    const totalMonsters = n(save.totalMonsters);
    const percentage = totalMonsters ? currentDefeated / totalMonsters * 100 : n(metrics.percentage);
    const xpGain = Math.min(checkpoint ? 180 : 360, dc * 6 + defeatedDelta * 25);
    const oldCorrect = n(old.successes), newCorrect = oldCorrect + dc;
    const featherGain = Math.min(checkpoint ? 10 : 20, Math.max(0, Math.floor(newCorrect / 8) - Math.floor(oldCorrect / 8)) + defeatedDelta);
    return finish(dc + de, dc, de, percentage, xpGain, featherGain);
  }

  if (gameId === 'rayuela') {
    const projectInfo = source => {
      source = source && typeof source === 'object' ? source : {};
      const projects = Array.isArray(source.projects) ? source.projects.filter(item => item && typeof item === 'object') : [];
      const activeId = String(source.activeProjectId || '');
      const project = projects.length ? (projects.find(item => String(item.id || '') === activeId) || projects[0]) : source;
      const nodes = Array.isArray(project.nodes) ? project.nodes : [];
      const choices = nodes.reduce((total, node) => total + (Array.isArray(node.choices) ? node.choices.filter(choice => String(choice && choice.targetId || '')).length : 0), 0);
      const endings = nodes.filter(node => node && (node.type === 'ending' || node.type === 'secret')).length;
      const objectives = Array.isArray(project.objectiveRewards) ? project.objectiveRewards.length : 0;
      return { id:String(project.id || activeId || ''), nodes:nodes.length, choices:choices, endings:endings, objectives:objectives, submitted:String(project.status || '') === 'submitted' };
    };
    const current = projectInfo(save), previous = projectInfo(previousSave);
    const sameProject = current.id && previous.id && current.id === previous.id;
    const structure = current.nodes + current.choices;
    const priorStructure = sameProject ? previous.nodes + previous.choices : 0;
    const structuralDelta = Math.min(checkpoint ? 30 : 120, delta(structure, priorStructure));
    const firstSubmission = current.submitted && (!sameProject || !previous.submitted) && current.nodes >= 2 && current.endings >= 1;
    const percentage = current.submitted ? 100 : Math.min(99, current.objectives / 8 * 100);
    return finish(
      structuralDelta,
      structuralDelta,
      0,
      percentage,
      Math.min(checkpoint ? 150 : 360, structuralDelta * 3 + (firstSubmission ? 60 : 0)),
      Math.min(12, Math.floor(structuralDelta / 10) + (firstSubmission ? 3 : 0))
    );
  }

  if (gameId === 'entre_lineas') {
    const profile = save.profile && typeof save.profile === 'object' ? save.profile : {};
    const previousProfile = previousSave.profile && typeof previousSave.profile === 'object' ? previousSave.profile : {};
    const dc = capDelta(metrics.correct, previousMetrics.correct, checkpoint ? 24 : 60);
    const de = capDelta(metrics.errors, previousMetrics.errors, checkpoint ? 24 : 60);
    const casesDelta = Math.min(3, delta(profile.cases, previousProfile.cases));
    const oldCorrect = n(old.successes), newCorrect = oldCorrect + dc;
    return finish(
      dc + de,
      dc,
      de,
      Math.max(n(metrics.percentage), casesDelta > 0 ? 100 : 0),
      Math.min(checkpoint ? 180 : 360, dc * 6 + casesDelta * 60),
      Math.min(12, Math.max(0, Math.floor(newCorrect / 8) - Math.floor(oldCorrect / 8)) + casesDelta * 2)
    );
  }

  const dc = capDelta(metrics.correct, previousMetrics.correct, checkpoint ? 24 : 60);
  const de = capDelta(metrics.errors, previousMetrics.errors, checkpoint ? 24 : 60);
  const observedAttempts = capDelta(metrics.attempts, previousMetrics.attempts, checkpoint ? 36 : 100);
  const da = Math.min(checkpoint ? 36 : 100, Math.max(dc + de, observedAttempts));
  const safeCorrect = Math.min(dc, da);
  const safeErrors = Math.max(de, da - safeCorrect);
  const oldCorrect = n(old.successes), newCorrect = oldCorrect + safeCorrect;
  return finish(
    da,
    safeCorrect,
    safeErrors,
    n(metrics.percentage),
    Math.min(checkpoint ? 150 : 320, safeCorrect * 6),
    Math.min(checkpoint ? 8 : 16, Math.max(0, Math.floor(newCorrect / 8) - Math.floor(oldCorrect / 8)))
  );
}
