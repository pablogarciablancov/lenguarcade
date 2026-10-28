// Platform XP never enters a game's progression or workshop objectives.
// Read every page so older rewards do not disappear from lifetime totals.
export async function platformXpEvents(admin,profileIds) {
  const data=[];
  if(!profileIds.length)return {data,error:null};
  for(let offset=0;;offset+=1000){
    const page=await admin.from('game_events')
      .select('id,profile_id,event_type,xp_delta,feathers_delta,details,occurred_at')
      .in('profile_id',profileIds).in('event_type',['teacher_adjustment','class_boss_reward','rayuela_ending_reward'])
      .order('occurred_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+999);
    if(page.error)return {data:[],error:page.error};
    data.push(...(page.data||[]));
    if((page.data||[]).length<1000)return {data,error:null};
  }
}
