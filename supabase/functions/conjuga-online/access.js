import {studentGameAccess,workshopModeFor} from '../_shared/student-access.ts';

export const isTeacher=role=>role==='teacher'||role==='admin';
export async function access(admin,profileId){
  const p=await admin.from('profiles').select('organization_id,role,active').eq('id',profileId).single();
  if(p.error)throw p.error;
  if(!p.data?.active)return {allowed:false,classes:[],classrooms:[],role:p.data?.role};
  const role=p.data.role,teacher=isTeacher(role);
  if(!teacher&&role!=='student')return {allowed:false,classes:[],classrooms:[],role};
  let memberQuery=role==='admin'?null:admin.from(teacher?'classroom_teachers':'classroom_enrollments').select('classroom_id').eq('profile_id',profileId);
  if(memberQuery&&!teacher)memberQuery=memberQuery.eq('active',true);
  const [g,a,e,c]=await Promise.all([
    admin.from('games').select('id,status,url,integration,active').eq('id','conjuga_apuesta').single(),
    admin.from('profile_game_access').select('enabled').eq('profile_id',profileId).eq('game_id','conjuga_apuesta').maybeSingle(),
    memberQuery||Promise.resolve({data:[],error:null}),
    admin.from('classrooms').select('id,name,legacy_class_code').eq('organization_id',p.data.organization_id).eq('active',true),
  ]);
  for(const r of [g,a,e,c])if(r.error)throw r.error;
  const ids=new Set((e.data||[]).map(x=>x.classroom_id));
  const classrooms=(c.data||[]).filter(x=>role==='admin'||ids.has(x.id));
  const classes=classrooms.map(x=>x.id);
  if(teacher)return {allowed:!!g.data.active,classes,classrooms,role};
  let workshop=null;
  if(classes.length){
    const r=await admin.from('workshop_sessions').select('*').in('classroom_id',classes).eq('published',true).limit(1);
    if(r.error)throw r.error;workshop=r.data?.[0]||null;
  }
  const mode=workshopModeFor(workshop),selected=new Set(workshop?.game_ids||[]);
  const allowed=g.data.active&&!studentGameAccess(g.data,new Map([['conjuga_apuesta',a.data?.enabled!==false]]),workshop,selected,mode==='classroom'||mode==='home').locked;
  return {allowed,classes,classrooms,role};
}

export function classroomForCreate(allowed,body){
  if(!isTeacher(allowed.role))return allowed.classes[0];
  const code=String(body.classCode||'');
  return allowed.classrooms.find(c=>c.id===code||c.legacy_class_code===code)?.id;
}

export function canPair(firstRole,secondRole){
  return [firstRole,secondRole].every(r=>r==='student'||isTeacher(r))&&
    !(isTeacher(firstRole)&&isTeacher(secondRole));
}
