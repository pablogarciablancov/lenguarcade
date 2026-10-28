import {corsHeaders,jsonResponse,requireProfileSession} from '../_shared/lenguarcade.ts';
import {studentGameAccess,workshopModeFor} from '../_shared/student-access.ts';
import {GalleryError,isTeacher,text,cleanProject,validatePath,scores,summary,ratingView,orthographyReview} from './model.js';

export async function handle(admin:any,profileId:string,organizationId:string,role:string,body:any){
  const teacher=isTeacher(role),action=String(body.action||'');
  if(!teacher&&role!=='student')throw new GalleryError('forbidden',403);
  let members=role==='admin'?{data:[],error:null}:await admin.from(teacher?'classroom_teachers':'classroom_enrollments').select('classroom_id').eq('profile_id',profileId).match(teacher?{}:{active:true});
  if(members.error)throw members.error;
  const classesResult=await admin.from('classrooms').select('id,name').eq('organization_id',organizationId).eq('active',true);
  if(classesResult.error)throw classesResult.error;
  const memberIds=new Set(members.data.map((m:any)=>m.classroom_id));
  const classes=classesResult.data.filter((c:any)=>role==='admin'||memberIds.has(c.id));
  const classroomId=text(body.classroomId,80)||classes[0]?.id;
  if(!classroomId||!classes.some((c:any)=>c.id===classroomId))throw new GalleryError('no_classroom',403);
  if(!teacher){
    const [game,access,workshop]=await Promise.all([
      admin.from('games').select('id,status,url,integration,active').eq('id','rayuela').single(),
      admin.from('profile_game_access').select('enabled').eq('profile_id',profileId).eq('game_id','rayuela').maybeSingle(),
      admin.from('workshop_sessions').select('*').eq('classroom_id',classroomId).eq('published',true).limit(1),
    ]);
    for(const r of [game,access,workshop])if(r.error)throw r.error;
    const w=workshop.data?.[0]||null,mode=workshopModeFor(w);
    if(!game.data?.active||studentGameAccess(game.data,new Map([['rayuela',access.data?.enabled!==false]]),w,new Set(w?.game_ids||[]),mode==='classroom'||mode==='home').locked)throw new GalleryError('game_access_closed',403);
  }
  if(action==='import'){
    if(!teacher)throw new GalleryError('forbidden',403);
    const projects=Array.isArray(body.projects)?body.projects:[];
    if(!projects.length||projects.length>30)throw new GalleryError('invalid_project');
    // Validate the entire batch before writing any rows. Reimport keeps votes and snapshots.
    const batch=projects.map((p:any)=>({organization_id:organizationId,classroom_id:classroomId,publisher_profile_id:profileId,source_project_id:text(p.id,160)||crypto.randomUUID(),title:text(p.title)||'Rayuela de clase',project:cleanProject(p),author_ids:[],published:false}));
    if(JSON.stringify(batch).length>2000000)throw new GalleryError('file_too_large');
    const r=await admin.from('rayuela_gallery_stories').upsert(batch,{onConflict:'classroom_id,source_project_id',ignoreDuplicates:true});if(r.error)throw r.error;
  }else if(action==='update'){
    if(!teacher)throw new GalleryError('forbidden',403);
    const authors=Array.isArray(body.authorIds)?[...new Set(body.authorIds.map((v:any)=>text(v,80)))]:[];
    if(authors.length>10)throw new GalleryError('invalid_authors');
    if(authors.length){
      const r=await admin.from('classroom_enrollments').select('profile_id').eq('classroom_id',classroomId).eq('active',true).in('profile_id',authors);if(r.error)throw r.error;
      if(new Set(r.data.map((p:any)=>p.profile_id)).size!==authors.length)throw new GalleryError('invalid_authors');
    }
    if(body.published===true&&!authors.length)throw new GalleryError('authors_required');
    const r=await admin.from('rayuela_gallery_stories').update({author_ids:authors,published:body.published===true,...(body.orthography?{orthography:orthographyReview(body.orthography)}:{}),updated_at:new Date().toISOString()}).eq('id',text(body.storyId,80)).eq('classroom_id',classroomId).eq('organization_id',organizationId).select('id');if(r.error)throw r.error;if(!r.data.length)throw new GalleryError('story_not_found',404);
  }else if(['get','complete','rate'].includes(action)){
    const r=await admin.from('rayuela_gallery_stories').select('*').eq('id',text(body.storyId,80)).eq('classroom_id',classroomId).eq('organization_id',organizationId).maybeSingle();if(r.error)throw r.error;
    const story=r.data;if(!story||(!teacher&&!story.published))throw new GalleryError('story_not_found',404);
    if(action==='complete'){
      validatePath(story.project,body.path);
      const done=await admin.from('rayuela_gallery_reads').upsert({story_id:story.id,profile_id:profileId},{onConflict:'story_id,profile_id'});if(done.error)throw done.error;
      const reward=await admin.rpc('record_rayuela_ending',{p_story_id:story.id,p_profile_id:profileId,p_node_id:body.path[body.path.length-1]});if(reward.error)throw reward.error;
      return {ok:true,completed:true,...reward.data};
    }
    if(action==='rate'){
      if(story.author_ids.includes(profileId))throw new GalleryError('self_rating',403);
      const done=await admin.from('rayuela_gallery_reads').select('story_id').eq('story_id',story.id).eq('profile_id',profileId).maybeSingle();if(done.error)throw done.error;
      if(!done.data)throw new GalleryError('finish_required',403);
      const r=await admin.from('rayuela_gallery_ratings').upsert({story_id:story.id,profile_id:profileId,...scores(body),updated_at:new Date().toISOString()},{onConflict:'story_id,profile_id'});if(r.error)throw r.error;
      return {ok:true};
    }
    const discoveries=await admin.from('rayuela_gallery_endings').select('node_id').eq('story_id',story.id).eq('profile_id',profileId);if(discoveries.error)throw discoveries.error;
    return {ok:true,project:{...story.project,discoveredEndings:discoveries.data.map((d:any)=>d.node_id)},canRate:!story.author_ids.includes(profileId)};
  }else if(!['list','context'].includes(action))throw new GalleryError('unknown_action');
  let query=admin.from('rayuela_gallery_stories').select('id,title,author_ids,published,project,source_project_id,orthography').eq('organization_id',organizationId).eq('classroom_id',classroomId).order('created_at');
  if(!teacher)query=query.eq('published',true);
  const result=await query;if(result.error)throw result.error;
  const stories=result.data,storyIds=stories.map((s:any)=>s.id);
  const ratings=storyIds.length?await admin.from('rayuela_gallery_ratings').select('*').in('story_id',storyIds):{data:[],error:null};if(ratings.error)throw ratings.error;
  const reads=storyIds.length?await admin.from('rayuela_gallery_reads').select('story_id,profile_id').in('story_id',storyIds):{data:[],error:null};if(reads.error)throw reads.error;
  const discoveries=await admin.from('rayuela_gallery_endings').select('story_id,node_id,xp_awarded').eq('profile_id',profileId);if(discoveries.error)throw discoveries.error;
  const totalXp=discoveries.data.reduce((sum:number,d:any)=>sum+Number(d.xp_awarded||0),0);
  const voterNames=new Map<string,string>();
  if(teacher&&ratings.data.length){
    const voters=await admin.from('profiles').select('id,first_name,last_name,role').eq('organization_id',organizationId).in('id',[...new Set(ratings.data.map((v:any)=>v.profile_id))]);if(voters.error)throw voters.error;
    for(const voter of voters.data)voterNames.set(voter.id,[voter.first_name,voter.last_name].filter(Boolean).join(' ')+(isTeacher(voter.role)?' · Profesor':''));
  }
  let roster:any[]=[];
  if(teacher){
    const r=await admin.from('classroom_enrollments').select('profile_id,profiles!inner(id,first_name,last_name,active)').eq('classroom_id',classroomId).eq('active',true);if(r.error)throw r.error;
    roster=r.data.filter((p:any)=>p.profiles.active).map((p:any)=>({id:p.profile_id,name:[p.profiles.first_name,p.profiles.last_name].filter(Boolean).join(' ')})).sort((a:any,b:any)=>a.name.localeCompare(b.name,'es'));
  }
  return {ok:true,rubricVersion:2,totalXp,teacher,classes,classroomId,roster,stories:stories.map((s:any)=>({id:s.id,title:s.title,scenes:s.project.nodes.length,endingsTotal:s.project.nodes.filter((n:any)=>['ending','secret'].includes(n.type)).length,endingsFound:discoveries.data.filter((d:any)=>d.story_id===s.id).length,spelling:s.orthography?{score:s.orthography.score,count:s.orthography.count}:null,own:s.author_ids.includes(profileId),completed:reads.data.some((r:any)=>r.story_id===s.id&&r.profile_id===profileId),myRating:s.author_ids.includes(profileId)?null:ratingView(ratings.data.find((r:any)=>r.story_id===s.id&&r.profile_id===profileId)),...(teacher?{orthography:s.orthography,authorIds:s.author_ids,published:s.published,summary:summary(s,ratings.data),reads:reads.data.filter((r:any)=>r.story_id===s.id).length,votes:ratings.data.filter((r:any)=>r.story_id===s.id&&!s.author_ids.includes(r.profile_id)).map((r:any)=>({profileId:r.profile_id,profileName:voterNames.get(r.profile_id)||'Participante',...ratingView(r)}))}:{})}))};
}
Deno.serve(async(request:Request)=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(request.method!=='POST')return jsonResponse({ok:false,error:'method_not_allowed'},405);
  try{
    const {admin,profileId,organizationId,profileRole}=await requireProfileSession(request);
    if(Number(request.headers.get('content-length')||0)>2200000)throw new GalleryError('file_too_large');
    const raw=await request.text();if(raw.length>2200000)throw new GalleryError('file_too_large');
    return jsonResponse(await handle(admin,profileId,organizationId,profileRole,JSON.parse(raw)));
  }catch(error){
    if(error instanceof Response)return error;
    if(error instanceof GalleryError)return jsonResponse({ok:false,error:error.message},error.status);
    console.error('rayuela-gallery failed',error);return jsonResponse({ok:false,error:'gallery_unavailable'},503);
  }
});
