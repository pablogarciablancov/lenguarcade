export class GalleryError extends Error {
  constructor(code, status=400){super(code);this.status=status;}
}
export const isTeacher=role=>role==='teacher'||role==='admin';
export const text=(v,max=160)=>String(v??'').trim().slice(0,max);
export function cleanProject(raw){
  if(!raw||!Array.isArray(raw.nodes)||raw.nodes.length<2||raw.nodes.length>400)throw new GalleryError('invalid_project');
  const ids=new Set();
  const nodes=raw.nodes.map(n=>{
    const id=text(n.id,120);if(!id||ids.has(id))throw new GalleryError('invalid_project');ids.add(id);
    const types=['start','story','decision','ending','secret','event','item','condition'];
    return {id,type:types.includes(n.type)?n.type:'story',title:text(n.title),text:text(n.text,12000),row:Math.max(0,Math.min(99,Number(n.row)||0)),col:Math.max(0,Math.min(99,Number(n.col)||0)),chapter:text(n.chapter),image:'',endingType:['perfect','good','bad','neutral','secret','defeat','mystery'].includes(n.endingType)?n.endingType:'neutral',choices:(Array.isArray(n.choices)?n.choices:[]).slice(0,4).map((c,i)=>({id:'choice_'+i,text:text(c.text,500),targetId:text(c.targetId,120),requireItem:text(c.requireItem),conditionVar:text(c.conditionVar),conditionOp:['>=','<=','>','<','='].includes(c.conditionOp)?c.conditionOp:'>=',conditionValue:Number(c.conditionValue)||0})),giveItem:text(n.giveItem),requireItem:text(n.requireItem),variable:text(n.variable),variableDelta:Number(n.variableDelta)||0};
  });
  if(nodes.filter(n=>n.type==='start').length!==1)throw new GalleryError('invalid_start');
  for(const n of nodes)for(const c of n.choices)if(!ids.has(c.targetId))throw new GalleryError('broken_link');
  if(!nodes.some(n=>['ending','secret'].includes(n.type)))throw new GalleryError('missing_ending');
  const variables={};for(const [key,value] of Object.entries(raw.variables||{}).slice(0,80)){if(!['__proto__','constructor','prototype'].includes(key)&&Number.isFinite(Number(value)))variables[text(key)]=Number(value);}
  return {schema:'rayuela-project-v1',id:'gallery',title:text(raw.title)||'Rayuela de clase',genre:text(raw.genre,80)||'Aventura',grid:{rows:Math.max(9,...nodes.map(n=>n.row+1)),cols:Math.max(9,...nodes.map(n=>n.col+1))},nodes,variables,items:[],discoveredEndings:[],unlockedAchievements:[],objectiveRewards:[],xp:0,playTests:0,playthroughs:0};
}
export function validatePath(project,path){
  if(!Array.isArray(path)||!path.length||path.length>2000)throw new GalleryError('invalid_path');
  const nodes=new Map(project.nodes.map(n=>[n.id,n]));let current=project.nodes.find(n=>n.type==='start');
  if(path[0]!==current?.id)throw new GalleryError('invalid_path');
  const inventory=new Set(),vars={...project.variables};
  const item=v=>String(v||'').trim().toLocaleLowerCase('es');
  function enter(n){
    if(n.requireItem&&!inventory.has(item(n.requireItem)))throw new GalleryError('invalid_path');
    if(n.giveItem)inventory.add(item(n.giveItem));
    if(n.variable)vars[n.variable]=Number(vars[n.variable]||0)+Number(n.variableDelta||0);
  }
  enter(current);
  for(let i=1;i<path.length;i++){
    if(['ending','secret'].includes(current.type))throw new GalleryError('invalid_path');
    const choices=current.choices.filter(c=>c.targetId===path[i]);
    const allowed=choices.some(c=>{
      if(c.requireItem&&!inventory.has(item(c.requireItem)))return false;
      if(!c.conditionVar)return true;
      const a=Number(vars[c.conditionVar]||0),b=Number(c.conditionValue||0);
      return c.conditionOp==='>='?a>=b:c.conditionOp==='>'?a>b:c.conditionOp==='='?a===b:c.conditionOp==='<='?a<=b:c.conditionOp==='<'?a<b:false;
    });
    if(!allowed)throw new GalleryError('invalid_path');
    current=nodes.get(path[i]);if(!current)throw new GalleryError('invalid_path');enter(current);
  }
  if(!['ending','secret'].includes(current.type))throw new GalleryError('finish_required');
  return true;
}
export const ratingKeys=['fun','decisions','creativity','story','ending'];
export function scores(body){
  // Old open tabs can still send the original three scores until refreshed.
  const modern=body.rubricVersion===2;
  const keys=modern?ratingKeys:['creativity','story','decisions'],max=modern?10:5;
  const values=keys.map(k=>body[k]);
  if(values.some(v=>!Number.isInteger(v)||v<1||v>max))throw new GalleryError('invalid_rating');
  return {...Object.fromEntries(keys.map((k,i)=>[k,values[i]])),fun:modern?body.fun:null,ending:modern?body.ending:null,rubric_version:modern?2:1};
}
export function ratingView(r){
  if(!r)return null;
  return {...Object.fromEntries(ratingKeys.map(k=>[k,r[k]==null?null:r[k]*(r.rubric_version===2?1:2)])),rubricVersion:r.rubric_version===2?2:1};
}
export function summary(story,ratings){
  const valid=ratings.filter(r=>r.story_id===story.id&&!story.author_ids.includes(r.profile_id)).map(ratingView);
  const mean=values=>values.length?Math.round(values.reduce((a,v)=>a+v,0)/values.length*100)/100:null;
  return {count:valid.length,...Object.fromEntries(ratingKeys.map(k=>[k,mean(valid.map(r=>r[k]).filter(v=>v!=null))])),average:mean(valid.map(r=>mean(ratingKeys.map(k=>r[k]).filter(v=>v!=null))))};
}

// Orthography is an editorial review, never a peer ballot.
export function orthographyReview(raw){
  if(!raw||!Array.isArray(raw.mistakes)||raw.mistakes.length>5000)throw new GalleryError('invalid_orthography');
  const mistakes=raw.mistakes.map(m=>({nodeId:text(m.nodeId,120),original:text(m.original,300),correction:text(m.correction,300),reason:text(m.reason,300)}));
  if(mistakes.some(m=>!m.original||!m.correction))throw new GalleryError('invalid_orthography');
  return {version:1,reviewer:'Revisión de ChatGPT',penalty:0.2,count:mistakes.length,score:Math.max(0,Math.round((10-mistakes.length*0.2)*10)/10),mistakes};
}

// Count durable, distinct discoveries of actual endings; never trust a client counter.
export function endingProgress(project,discoveries){
  const ids=new Set(project.nodes.filter(n=>['ending','secret'].includes(n.type)).map(n=>n.id));
  const found=new Set(discoveries.map(d=>d.node_id).filter(id=>ids.has(id))).size;
  const required=Math.max(1,Math.ceil(ids.size/2));
  return {endingsTotal:ids.size,endingsFound:found,ratingRequired:required,ratingUnlocked:found>=required};
}
export function readingProject(raw){
  const safe=cleanProject(raw);
  // Keep reviewed scene/choice separation, while excluding source and author metadata.
  safe.nodes.forEach((n,i)=>{const r=raw.nodes[i].reading;if(r?.version===1)n.reading={version:1,text:r.text,sourceText:r.sourceText,choices:r.choices.map(c=>({id:c.id,text:c.text,targetId:c.targetId}))};});
  return safe;
}
