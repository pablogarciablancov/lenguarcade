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
export function scores(body){
  const values=['creativity','story','decisions'].map(k=>body[k]);
  if(values.some(v=>!Number.isInteger(v)||v<1||v>5))throw new GalleryError('invalid_rating');
  return Object.fromEntries(['creativity','story','decisions'].map((k,i)=>[k,values[i]]));
}
export function summary(story,ratings){
  const valid=ratings.filter(r=>r.story_id===story.id&&!story.author_ids.includes(r.profile_id));
  const average=k=>valid.length?Math.round(valid.reduce((a,r)=>a+r[k],0)/valid.length*100)/100:null;
  return {count:valid.length,creativity:average('creativity'),story:average('story'),decisions:average('decisions'),average:valid.length?Math.round(valid.reduce((a,r)=>a+r.creativity+r.story+r.decisions,0)/(valid.length*3)*100)/100:null};
}
