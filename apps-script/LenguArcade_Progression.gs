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
