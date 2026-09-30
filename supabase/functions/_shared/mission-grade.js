export function assessedMissions(definitions,rows,events,profileId,classroomIds,now=Date.now()){
 const num=v=>Math.max(0,Number(v)||0);
 return definitions.filter(m=>m.active!==false&&(!m.target_profile_id||m.target_profile_id===profileId)&&(!m.classroom_id||classroomIds.includes(m.classroom_id))&&(!m.active_from||Date.parse(m.active_from)<=now)&&(!m.active_to||Date.parse(m.active_to)>now)).map(m=>{
  const id=m.game_id==='general'?'':m.game_id||'',type=m.mission_type,scoped=id?rows.filter(r=>r.game_id===id):rows;
  let current=0;
  if(type==='save')current=scoped.filter(r=>r.last_activity_at&&(!m.active_from||Date.parse(r.last_activity_at)>=Date.parse(m.active_from))&&(!m.active_to||Date.parse(r.last_activity_at)<=Date.parse(m.active_to))).length;
  else if(m.active_from){
   const recent=events.filter(e=>e.event_type!=='teacher_adjustment'&&(!id||e.game_id===id)&&Date.parse(e.occurred_at)>=Date.parse(m.active_from)&&(!m.active_to||Date.parse(e.occurred_at)<=Date.parse(m.active_to)));
   if(type==='sessions')current=recent.filter(e=>e.details?.sessionCounted!==false).length;
   if(type==='variety')current=new Set(recent.map(e=>e.game_id)).size;
   if(type==='xp')current=recent.reduce((sum,e)=>sum+num(e.xp_delta),0);
   if(type==='accuracy')current=recent.reduce((max,e)=>Math.max(max,num(e.accuracy)),0);
  }else{
   if(type==='sessions')current=scoped.reduce((sum,r)=>sum+num(r.sessions),0);
   if(type==='variety')current=scoped.filter(r=>num(r.sessions)>0).length;
   if(type==='xp')current=scoped.reduce((sum,r)=>sum+num(r.xp),0);
   if(type==='accuracy'){const attempts=scoped.reduce((sum,r)=>sum+num(r.attempts),0),correct=scoped.reduce((sum,r)=>sum+num(r.successes),0);current=attempts?Math.round(correct/attempts*100):0;}
  }
  return{gameId:id,target:num(m.target),progress:Math.min(current,num(m.target))};
 });
}
