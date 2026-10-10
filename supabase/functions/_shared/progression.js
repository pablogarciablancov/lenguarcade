// Platform XP is retained. Only the cost of each successive level changes.
export const XP_REWARD_GUIDE = Object.freeze({
  battlegrafia:"6 XP por respuesta correcta nueva y 25 XP por monstruo derrotado; límite 360 XP por guardado (180 en checkpoint).",
  sopa_de_tinta:"6 XP por palabra nueva correcta; límite 320 XP por guardado (150 en checkpoint).",
  rayuela:"3 XP por elemento nuevo de estructura y 60 XP por primera entrega válida; límite 360 XP (150 en checkpoint).",
  entre_lineas:"6 XP por respuesta correcta nueva y 60 XP por caso nuevo (máximo 3 por guardado); límite 360 XP (180 en checkpoint).",
  versopolis:"6 XP por composición correcta nueva y XP adicional según la puntuación nueva de la partida; límite 360 XP (180 en checkpoint).",
  lexaria:"6 XP por respuesta correcta nueva, 12 por victoria de carrera, 6 por victoria de duelo y 2 por derrota de duelo; límite 360 XP (180 en checkpoint).",
  tierras_de_tinta:"6 XP por respuesta correcta nueva y 30 por victoria nueva; límite 360 XP (180 en checkpoint).",
  maniacgrafia:"6 XP por respuesta correcta nueva; límite 320 XP (150 en checkpoint).",
  narratoria:"6 XP por respuesta correcta nueva; límite 320 XP (150 en checkpoint).",
  scrabble:"6 XP por respuesta correcta nueva; límite 320 XP (150 en checkpoint).",
  conjuga_apuesta:"6 XP por respuesta correcta nueva; límite 320 XP (150 en checkpoint).",
  verb_battle:"6 XP por respuesta correcta nueva; límite 320 XP (150 en checkpoint).",
  tower_defense:"6 XP por respuesta correcta nueva; límite 320 XP (150 en checkpoint).",
  word_play:"6 XP por respuesta correcta nueva; límite 320 XP (150 en checkpoint).",
  lexitrama:"6 XP por respuesta correcta nueva; límite 320 XP (150 en checkpoint).",
  lexoma:"6 XP por respuesta correcta nueva; límite 320 XP (150 en checkpoint).",
});
export function capProgressionAward(requestedXp,requestedFeathers,minuteXp,tenMinuteXp,minuteFeathers,tenMinuteFeathers){
 const xp=Math.max(0,Math.round(Number(requestedXp)||0)),feathers=Math.max(0,Math.round(Number(requestedFeathers)||0));
 const awardedXp=Math.max(0,Math.min(xp,180-Math.max(0,Number(minuteXp)||0),900-Math.max(0,Number(tenMinuteXp)||0)));
 const awardedFeathers=Math.max(0,Math.min(feathers,15-Math.max(0,Number(minuteFeathers)||0),60-Math.max(0,Number(tenMinuteFeathers)||0)));
 return{awardedXp,awardedFeathers,pendingXp:xp-awardedXp,pendingFeathers:feathers-awardedFeathers};
}

export function levelProgress(xp){
  xp=Math.max(0,Number(xp)||0);let level=1,start=0,cost=1000;
  while(xp>=start+cost&&level<1000){start+=cost;level++;cost=Math.ceil(1000*Math.pow(1.3,level-1)/50)*50;}
  return{level,levelStartXp:start,nextLevelXp:start+cost,levelCost:cost,levelProgress:Math.min(100,Math.floor((xp-start)/cost*100))};
}
export function learningGrade(progress,missions=[]){
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
export function platformMilestones(xp,grade,attempts,stats={}){
 const level=levelProgress(xp).level;
 const value=(key)=>Math.max(0,Number(stats&&stats[key])||0);
 const sessions=value('sessions');
 const gamesPlayed=value('gamesPlayed');
 const accuracy=value('accuracy');
 const missionsCompleted=value('missionsCompleted');
 const feathers=value('feathers');
 const bestStreak=value('bestStreak');
 const milestones=[
  ...[3,5,10,20].map(n=>({id:'level_'+n,icon:'🧭',category:'Trayectoria',title:'Nivel '+n,description:'Alcanza el nivel '+n+' de LenguArcade',value:level,target:n})),
  ...[5000,15000,50000].map(n=>({id:'xp_'+n,icon:'⚡',category:'Trayectoria',title:n.toLocaleString('es-ES')+' XP',description:'Acumula experiencia en LenguArcade',value:xp,target:n})),
  ...[7,9].map(n=>({id:'grade_'+n,icon:'🎓',category:'Dominio',title:'Nota '+n,description:'Alcanza una nota de '+n+' con al menos 20 respuestas',value:attempts>=20?grade:0,target:n})),

  {id:'sessions_1',icon:'🕹️',category:'Partidas',title:'Insert coin',description:'Completa tu primera partida',value:sessions,target:1},
  {id:'sessions_10',icon:'🔥',category:'Partidas',title:'Calentando motores',description:'Completa 10 partidas',value:sessions,target:10},
  {id:'sessions_25',icon:'🎮',category:'Partidas',title:'Habitual del arcade',description:'Completa 25 partidas',value:sessions,target:25},
  {id:'sessions_50',icon:'🏅',category:'Partidas',title:'Veterano de sala',description:'Completa 50 partidas',value:sessions,target:50},
  {id:'sessions_100',icon:'👑',category:'Partidas',title:'Leyenda del recreativo',description:'Completa 100 partidas',value:sessions,target:100},

  {id:'games_3',icon:'🗺️',category:'Exploración',title:'Explorador',description:'Juega a 3 juegos distintos',value:gamesPlayed,target:3},
  {id:'games_6',icon:'🧳',category:'Exploración',title:'Trotaarcades',description:'Juega a 6 juegos distintos',value:gamesPlayed,target:6},
  {id:'games_10',icon:'🌍',category:'Exploración',title:'Maestro del mapa',description:'Juega a 10 juegos distintos',value:gamesPlayed,target:10},

  {id:'attempts_25',icon:'✍️',category:'Dominio',title:'Manos a la obra',description:'Resuelve 25 desafíos',value:attempts,target:25},
  {id:'attempts_100',icon:'💯',category:'Dominio',title:'Cien desafíos',description:'Resuelve 100 desafíos',value:attempts,target:100},
  {id:'attempts_500',icon:'🧠',category:'Dominio',title:'Mente incansable',description:'Resuelve 500 desafíos',value:attempts,target:500},
  {id:'attempts_1000',icon:'📚',category:'Dominio',title:'Mil respuestas',description:'Resuelve 1.000 desafíos',value:attempts,target:1000},

  {id:'accuracy_80',icon:'🎯',category:'Precisión',title:'Pulso firme',description:'Mantén al menos un 80 % de aciertos tras 50 respuestas',value:attempts>=50?accuracy:0,target:80},
  {id:'accuracy_90',icon:'🦅',category:'Precisión',title:'Ojo de halcón',description:'Mantén al menos un 90 % de aciertos tras 150 respuestas',value:attempts>=150?accuracy:0,target:90},
  {id:'accuracy_95',icon:'💎',category:'Precisión',title:'Cirujano de palabras',description:'Mantén al menos un 95 % de aciertos tras 300 respuestas',value:attempts>=300?accuracy:0,target:95},

  {id:'missions_1',icon:'✅',category:'Misiones',title:'Misión cumplida',description:'Completa tu primera misión',value:missionsCompleted,target:1},
  {id:'missions_5',icon:'🧩',category:'Misiones',title:'Cazamisiones',description:'Completa 5 misiones',value:missionsCompleted,target:5},
  {id:'missions_10',icon:'🛡️',category:'Misiones',title:'Agente LenguArcade',description:'Completa 10 misiones',value:missionsCompleted,target:10},
  {id:'missions_20',icon:'🏆',category:'Misiones',title:'Héroe del tablón',description:'Completa 20 misiones',value:missionsCompleted,target:20},

  {id:'feathers_25',icon:'🪶',category:'Colección',title:'Coleccionista de plumas',description:'Reúne 25 plumas',value:feathers,target:25},
  {id:'feathers_100',icon:'🪺',category:'Colección',title:'Nido dorado',description:'Reúne 100 plumas',value:feathers,target:100},
  {id:'feathers_250',icon:'✨',category:'Colección',title:'Plumaje legendario',description:'Reúne 250 plumas',value:feathers,target:250},

  {id:'streak_5',icon:'⚔️',category:'Racha',title:'En racha',description:'Alcanza una racha de 5 aciertos',value:bestStreak,target:5},
  {id:'streak_10',icon:'🚀',category:'Racha',title:'Imparable',description:'Alcanza una racha de 10 aciertos',value:bestStreak,target:10},
  {id:'streak_20',icon:'🌟',category:'Racha',title:'Modo leyenda',description:'Alcanza una racha de 20 aciertos',value:bestStreak,target:20}
 ];
 return milestones.map(m=>({...m,unlocked:m.value>=m.target,progress:Math.min(m.target,m.value)}));
}

const n=value=>Math.max(0,Number(value)||0);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
const sum=object=>Object.values(object||{}).reduce((total,value)=>total+n(value),0);
const resetDelta=(current,previous)=>{
  current=n(current);previous=n(previous);
  return current>=previous?current-previous:current;
};
const capDelta=(current,previous,cap)=>Math.min(cap,resetDelta(current,previous));
const metricsOf=raw=>raw&&typeof raw==='object'&&raw.metrics&&typeof raw.metrics==='object'?raw.metrics:{};
const defeatedCount=save=>Array.isArray(save?.defeatedMonsters)?save.defeatedMonsters.length:n(save?.monstersDefeated);
const battlegrafiaCorrect=save=>{
  const diary=Array.isArray(save?.diary)?save.diary:[];
  const diaryCorrect=diary.filter(row=>row&&row.isPerfect).length;
  return n(save?.stats_correct??save?.correct??diaryCorrect);
};
const battlegrafiaErrors=save=>{
  const diary=Array.isArray(save?.diary)?save.diary:[];
  const diaryCorrect=diary.filter(row=>row&&row.isPerfect).length;
  const diaryWrong=diary.length?Math.max(0,diary.length-diaryCorrect):0;
  return n(save?.stats_wrong??save?.errors??diaryWrong);
};
const baseResult=(old,attemptDelta,correctDelta,errorDelta,percentage,xpGain,featherGain)=>{
  const oldAttempts=n(old.attempts),oldCorrect=n(old.successes),oldErrors=n(old.errors);
  const da=Math.max(0,Math.round(attemptDelta));
  const dc=Math.min(da,Math.max(0,Math.round(correctDelta)));
  const de=Math.max(0,Math.min(da-dc,Math.round(errorDelta)));
  const totalAttempts=oldAttempts+da;
  const totalCorrect=oldCorrect+dc;
  const totalErrors=Math.max(oldErrors+de,totalAttempts-totalCorrect);
  return{
    xp:n(old.xp)+Math.max(0,Math.round(xpGain)),
    feathers:n(old.feathers)+Math.max(0,Math.round(featherGain)),
    attempts:totalAttempts,
    successes:totalCorrect,
    errors:totalErrors,
    accuracy:totalAttempts?Math.round(totalCorrect/totalAttempts*100):n(old.accuracy),
    percentage:Math.min(100,Math.max(n(old.percentage),n(percentage)))
  };
};

function sopaDeTintaSnapshot(save,prior,old,context){
  const stats=save?.profile?.stats||{},previous=prior?.profile?.stats||{};
  const checkpoint=context?.checkpoint===true;
  // Profile totals survive board changes. Resetting them must not mint rewards.
  const dc=Math.min(checkpoint?24:60,Math.max(0,n(stats.words)-n(previous.words)));
  const de=Math.min(checkpoint?24:60,Math.max(0,n(stats.errors)-n(previous.errors)));
  const levels=['narrativa','morfologia','verbos','sintaxis','literatura','semantica','ortografia'].reduce((total,id)=>total+[0,1,2,3].filter(stage=>n(save?.profile?.adventure?.[id]?.[stage])>0).length,0);
  const feathers=Math.min(checkpoint?8:16,Math.max(0,Math.floor((n(old.successes)+dc)/8)-Math.floor(n(old.successes)/8)));
  return baseResult(old,dc+de,dc,de,levels/28*100,Math.min(checkpoint?150:320,dc*6),feathers);
}

function battlegrafiaSnapshot(save,prior,old,context){
  const checkpoint=context?.checkpoint===true;
  const answerCap=checkpoint?24:60;
  const defeatCap=checkpoint?6:15;
  const currentCorrect=battlegrafiaCorrect(save),priorCorrect=battlegrafiaCorrect(prior);
  const currentErrors=battlegrafiaErrors(save),priorErrors=battlegrafiaErrors(prior);
  const dc=capDelta(currentCorrect,priorCorrect,answerCap);
  const de=capDelta(currentErrors,priorErrors,answerCap);
  const rawDefeatedDelta=capDelta(defeatedCount(save),defeatedCount(prior),defeatCap);
  // A monster cannot legitimately be cleared in bulk without answering.
  const defeatedDelta=Math.min(rawDefeatedDelta,Math.max(1,dc+1));
  const total=n(save?.totalMonsters);
  const pct=total?defeatedCount(save)/total*100:n(save?.percentage);
  const xpGain=Math.min(checkpoint?180:360,dc*6+defeatedDelta*25);
  const oldCorrect=n(old.successes),newCorrect=oldCorrect+dc;
  const featherGain=Math.min(checkpoint?10:20,
    Math.max(0,Math.floor(newCorrect/8)-Math.floor(oldCorrect/8))+defeatedDelta
  );
  return baseResult(old,dc+de,dc,de,pct,xpGain,featherGain);
}

function rayuelaSnapshot(save,prior,old,context){
  const pick=source=>{
    source=source&&typeof source==='object'?source:{};
    const projects=Array.isArray(source.projects)?source.projects.filter(item=>item&&typeof item==='object'):[];
    const activeId=String(source.activeProjectId||'');
    const project=projects.length?(projects.find(item=>String(item.id||'')===activeId)||projects[0]):source;
    const nodes=Array.isArray(project.nodes)?project.nodes:[];
    const choices=nodes.reduce((total,node)=>{
      const list=Array.isArray(node?.choices)?node.choices:[];
      return total+list.filter(choice=>String(choice?.targetId||'')).length;
    },0);
    const endings=nodes.filter(node=>node?.type==='ending'||node?.type==='secret').length;
    const objectiveRewards=Array.isArray(project.objectiveRewards)?project.objectiveRewards.length:0;
    return{id:String(project.id||activeId||''),project,nodes:nodes.length,choices,endings,objectiveRewards,submitted:String(project.status||'')==='submitted'};
  };
  const current=pick(save),previous=pick(prior);
  const sameProject=current.id&&previous.id&&current.id===previous.id;
  const priorStructure=sameProject?previous.nodes+previous.choices:0;
  const currentStructure=current.nodes+current.choices;
  const structuralDelta=Math.min(context?.checkpoint===true?30:120,resetDelta(currentStructure,priorStructure));
  const firstSubmission=current.submitted&&(!sameProject||!previous.submitted)&&current.nodes>=2&&current.endings>=1;
  const pct=current.submitted?100:Math.min(99,current.objectiveRewards/8*100);
  const xpGain=Math.min(context?.checkpoint===true?150:360,structuralDelta*3+(firstSubmission?60:0));
  const featherGain=Math.min(12,Math.floor(structuralDelta/10)+(firstSubmission?3:0));
  return baseResult(old,structuralDelta,structuralDelta,0,pct,xpGain,featherGain);
}

function entreLineasSnapshot(save,prior,old,raw,priorRaw,context){
  const profile=save&&typeof save.profile==='object'?save.profile:{};
  const priorProfile=prior&&typeof prior.profile==='object'?prior.profile:{};
  const metrics=metricsOf(raw),previousMetrics=metricsOf(priorRaw);
  const correctCap=context?.checkpoint===true?24:60;
  const dc=capDelta(metrics.correct,previousMetrics.correct,correctCap);
  const de=capDelta(metrics.errors,previousMetrics.errors,correctCap);
  const casesDelta=Math.min(3,resetDelta(profile.cases,priorProfile.cases));
  const pct=Math.max(n(metrics.percentage),casesDelta>0?100:0);
  const xpGain=Math.min(context?.checkpoint===true?180:360,dc*6+casesDelta*60);
  const oldCorrect=n(old.successes),newCorrect=oldCorrect+dc;
  const featherGain=Math.min(12,
    Math.max(0,Math.floor(newCorrect/8)-Math.floor(oldCorrect/8))+casesDelta*2
  );
  return baseResult(old,dc+de,dc,de,pct,xpGain,featherGain);
}

function genericMetricsSnapshot(raw,priorRaw,old,context){
  const metrics=metricsOf(raw),previous=metricsOf(priorRaw);
  const checkpoint=context?.checkpoint===true;
  const answerCap=checkpoint?24:60;
  const currentCorrect=n(metrics.correct),currentErrors=n(metrics.errors),currentAttempts=n(metrics.attempts);
  const priorCorrect=n(previous.correct),priorErrors=n(previous.errors),priorAttempts=n(previous.attempts);
  const dc=capDelta(currentCorrect,priorCorrect,answerCap);
  const de=capDelta(currentErrors,priorErrors,answerCap);
  const observedAttempts=capDelta(currentAttempts,priorAttempts,checkpoint?36:100);
  const da=Math.min(checkpoint?36:100,Math.max(dc+de,observedAttempts));
  const safeCorrect=Math.min(dc,da);
  const safeErrors=Math.max(de,da-safeCorrect);
  const xpGain=Math.min(checkpoint?150:320,safeCorrect*6);
  const oldCorrect=n(old.successes),newCorrect=oldCorrect+safeCorrect;
  const featherGain=Math.min(checkpoint?8:16,
    Math.max(0,Math.floor(newCorrect/8)-Math.floor(oldCorrect/8))
  );
  return baseResult(old,da,safeCorrect,safeErrors,clamp(metrics.percentage,0,100),xpGain,featherGain);
}

// Evaluate changes since the previous persisted snapshot; a repeated autosave earns 0.
// Platform XP is always derived from persisted gameplay deltas, never from client-provided XP.
export function snapshotProgress(gameId,save,previous,old={},raw={},previousRaw={},context={}){
  save=save&&typeof save==='object'?save:{};
  previous=previous&&typeof previous==='object'?previous:{};
  raw=raw&&typeof raw==='object'?raw:{};
  previousRaw=previousRaw&&typeof previousRaw==='object'?previousRaw:{};

  if(gameId==='sopa_de_tinta')return sopaDeTintaSnapshot(save,previous,old,context);
  if(gameId==='battlegrafia')return battlegrafiaSnapshot(save,previous,old,context);
  if(gameId==='rayuela')return rayuelaSnapshot(save,previous,old,context);
  if(gameId==='entre_lineas')return entreLineasSnapshot(save,previous,old,raw,previousRaw,context);

  let attempts=0,correct=0,score=0,pct=0,priorAttempts=0,priorCorrect=0,priorScore=0;
  if(gameId==='versopolis'){
    const r=save.run||{},p=previous.run||{},same=r.startedAt&&r.startedAt===p.startedAt;
    attempts=n(r.stats?.compositions);correct=n(r.stats?.contracts);score=n(r.runScore)/100;
    if(same){priorAttempts=n(p.stats?.compositions);priorCorrect=n(p.stats?.contracts);priorScore=n(p.runScore)/100;}
    pct=r.won?100:n(r.districtIndex)*25;
    if(r.maxPrestige)pct+=Math.max(0,1-n(r.rivalPrestige)/n(r.maxPrestige))*25;
  }else if(gameId==='lexaria'){
    const c=save.career||{},p=previous.career||{};
    attempts=n(c.metrics?.trainingAttempts);correct=n(c.metrics?.trainingCorrect);priorAttempts=n(p.metrics?.trainingAttempts);priorCorrect=n(p.metrics?.trainingCorrect);
    score=n(c.careerWins)*12+n(c.duels?.wins)*6+n(c.duels?.losses)*2;priorScore=n(p.careerWins)*12+n(p.duels?.wins)*6+n(p.duels?.losses)*2;
    pct=Math.max(n(save.run?.wins)/10*100,Object.keys(c.discovered||{}).length/50*100);
  }else if(gameId==='tierras_de_tinta'){
    const c=save.campaign,p=previous.campaign||{};
    if(c){
      attempts=n(c.stats?.asked);correct=n(c.stats?.correct);priorAttempts=n(p.stats?.asked);priorCorrect=n(p.stats?.correct);
      score=sum(c.victories)*30;priorScore=sum(p.victories)*30;pct=Object.values(c.victories||{}).filter(value=>n(value)>0).length/7*100;
    }else{
      return genericMetricsSnapshot(raw,previousRaw,old,context);
    }
  }else{
    return genericMetricsSnapshot(raw,previousRaw,old,context);
  }

  const checkpoint=context?.checkpoint===true;
  const da=Math.min(checkpoint?40:120,Math.max(0,attempts-priorAttempts));
  const dc=Math.min(da,Math.min(checkpoint?30:80,Math.max(0,correct-priorCorrect)));
  const scoreGain=Math.min(checkpoint?90:180,Math.max(0,score-priorScore));
  const totalAttempts=n(old.attempts)+da,totalCorrect=n(old.successes)+dc;
  const xpGain=Math.min(checkpoint?180:360,Math.round(dc*6+scoreGain));
  const featherGain=Math.min(checkpoint?10:20,Math.max(0,Math.floor(totalCorrect/8)-Math.floor(n(old.successes)/8)));
  return{
    xp:n(old.xp)+xpGain,
    feathers:n(old.feathers)+featherGain,
    attempts:totalAttempts,
    successes:totalCorrect,
    errors:Math.max(n(old.errors),totalAttempts-totalCorrect),
    accuracy:totalAttempts?Math.round(totalCorrect/totalAttempts*100):n(old.accuracy),
    percentage:Math.min(100,Math.max(n(old.percentage),pct))
  };
}
