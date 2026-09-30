import {corsHeaders,jsonResponse,requireProfileSession} from '../_shared/lenguarcade.ts';
Deno.serve(async(request)=>{
 if(request.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(request.method!=='POST')return jsonResponse({ok:false,error:'method_not_allowed'},405);
 try{
  const {admin,profileId,organizationId}=await requireProfileSession(request);
  const {data:enrollments,error:enrollmentError}=await admin.from('classroom_enrollments').select('classroom_id').eq('profile_id',profileId).eq('active',true);
  if(enrollmentError)throw enrollmentError;
  const classrooms=(enrollments||[]).map(e=>e.classroom_id);
  if(!classrooms.length)return jsonResponse({ok:true,opponents:[],ranking:[]});
  const {data:peers,error:peerError}=await admin.from('classroom_enrollments').select('profile_id').in('classroom_id',classrooms).eq('active',true);
  if(peerError)throw peerError;
  const ids=[...new Set((peers||[]).map(p=>p.profile_id))].slice(0,200);
  const {data:profiles,error:profileError}=await admin.from('profiles').select('id,first_name,last_name').in('id',ids).eq('organization_id',organizationId).eq('active',true);
  if(profileError)throw profileError;
  const safeIds=(profiles||[]).map(p=>p.id);
  if(!safeIds.length)return jsonResponse({ok:true,opponents:[],ranking:[]});
  const {data:rows,error:progressError}=await admin.from('game_progress').select('profile_id,raw_data').in('profile_id',safeIds).eq('game_id','lexaria');
  if(progressError)throw progressError;
  const byId=new Map((rows||[]).map(r=>[r.profile_id,r.raw_data?.save?.career||{}]));
  const num=n=>Math.max(0,Math.floor(Number(n)||0));
  const ranking=(profiles||[]).map(p=>{const c=byId.get(p.id)||{},d=c.duels||{};return{id:p.id,name:[p.first_name,p.last_name].filter(Boolean).join(' '),wins:num(d.wins),losses:num(d.losses),total:num(d.wins)+num(d.losses)};}).filter(p=>p.total>0).sort((a,b)=>(b.wins-b.losses)-(a.wins-a.losses)||b.wins-a.wins||a.name.localeCompare(b.name)).map((p,i)=>({...p,position:i+1,own:p.id===profileId}));
  const opponents=(profiles||[]).filter(p=>p.id!==profileId&&byId.get(p.id)?.duelSquad?.team?.some(Boolean)).map(p=>{const squad=byId.get(p.id).duelSquad;return{id:p.id,name:[p.first_name,p.last_name].filter(Boolean).join(' '),trainerId:squad.trainerId,team:squad.team.slice(0,6),relics:(squad.relics||[]).slice(0,12),publishedAt:squad.publishedAt};});
  return jsonResponse({ok:true,opponents,ranking,mode:'student_async',scope:'classroom'});
 }catch(error){if(error instanceof Response)return error;console.error('Lexaria arena failed',error);return jsonResponse({ok:false,error:'arena_unavailable'},503);}
});
