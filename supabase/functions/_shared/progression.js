// Platform XP is retained. Only the cost of each successive level changes.
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
export function platformMilestones(xp,grade,attempts){
 const level=levelProgress(xp).level;
 return [
  ...[3,5,10,20].map(n=>({id:'level_'+n,title:'Nivel '+n,description:'Alcanza el nivel '+n,value:level,target:n})),
  ...[5000,15000,50000].map(n=>({id:'xp_'+n,title:n.toLocaleString('es-ES')+' XP',description:'Acumula experiencia en LenguArcade',value:xp,target:n})),
  ...[7,9].map(n=>({id:'grade_'+n,title:'Nota '+n,description:'Alcanza una nota de '+n+' con al menos 20 respuestas',value:attempts>=20?grade:0,target:n}))
 ].map(m=>({...m,unlocked:m.value>=m.target,progress:Math.min(m.target,m.value)}));
}
// Evaluate changes since the previous persisted snapshot; a repeated autosave earns 0.
export function snapshotProgress(gameId,save,previous,old={}){
 if(!save)return null;
 const n=v=>Math.max(0,Number(v)||0),sum=o=>Object.values(o||{}).reduce((a,b)=>a+n(b),0);
 let attempts=0,correct=0,score=0,pct=0,priorAttempts=0,priorCorrect=0,priorScore=0;
 const prior=previous||{};
 if(gameId==='versopolis'){
  const r=save.run||{},p=prior.run||{},same=r.startedAt&&r.startedAt===p.startedAt;
  attempts=n(r.stats?.compositions);correct=n(r.stats?.contracts);score=n(r.runScore)/100;
  if(same){priorAttempts=n(p.stats?.compositions);priorCorrect=n(p.stats?.contracts);priorScore=n(p.runScore)/100;}
  pct=r.won?100:n(r.districtIndex)*25; // Include partial progress against the current rival.
  if(r.maxPrestige)pct+=Math.max(0,1-n(r.rivalPrestige)/n(r.maxPrestige))*25;
 }else if(gameId==='lexaria'){
  const c=save.career||{},p=prior.career||{};
  attempts=n(c.metrics?.trainingAttempts);correct=n(c.metrics?.trainingCorrect);priorAttempts=n(p.metrics?.trainingAttempts);priorCorrect=n(p.metrics?.trainingCorrect);
  score=n(c.careerWins)*12+n(c.duels?.wins)*6+n(c.duels?.losses)*2;priorScore=n(p.careerWins)*12+n(p.duels?.wins)*6+n(p.duels?.losses)*2;
  pct=Math.max(n(save.run?.wins)/10*100,Object.keys(c.discovered||{}).length/50*100);
 }else if(gameId==='tierras_de_tinta'){
  const c=save.campaign,p=prior.campaign||{};if(!c)return null;
  attempts=n(c.stats?.asked);correct=n(c.stats?.correct);priorAttempts=n(p.stats?.asked);priorCorrect=n(p.stats?.correct);
  score=sum(c.victories)*30;priorScore=sum(p.victories)*30;pct=Object.values(c.victories||{}).filter(v=>n(v)>0).length/7*100;
 }else return null;
 // Entering a title without a new run must not reset the previous baseline.
 const da=Math.max(0,attempts-priorAttempts),dc=Math.min(da,Math.max(0,correct-priorCorrect));
 const totalAttempts=n(old.attempts)+da,totalCorrect=n(old.successes)+dc;
 return{xp:n(old.xp)+Math.round(dc*6+Math.max(0,score-priorScore)),feathers:n(old.feathers)+Math.max(0,Math.floor(totalCorrect/5)-Math.floor(n(old.successes)/5)),attempts:totalAttempts,successes:totalCorrect,errors:Math.max(0,totalAttempts-totalCorrect),accuracy:totalAttempts?Math.round(totalCorrect/totalAttempts*100):0,percentage:Math.min(100,Math.max(n(old.percentage),pct))};
}
