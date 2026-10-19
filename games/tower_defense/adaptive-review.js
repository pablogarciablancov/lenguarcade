/* Answer-based spaced review. No timers, XP changes or cross-pupil storage. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GuardianReview=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const lower=s=>String(s||'').trim().toLocaleLowerCase('es');
 function skill(q){
  if(q.skill)return q.skill;
  const prefix=q.cat+':'+q.sub+':',a=lower(q.answer),why=lower(q.explain),opts=[...new Set(q.options.map(lower))].sort().join('|');
  if(['homofonos','diacriticas'].includes(q.sub))return prefix+opts;
  if(q.sub==='acentuacion'){
   if(['incluido','construido'].includes(a))return prefix+'vocales-cerradas';
   if(['fue','dio','vio'].includes(a))return prefix+'monosilabos';
   if(a.endsWith('mente'))return prefix+'mente';
   if(['dímelo','dámelo'].includes(a))return prefix+'encliticos';
   if(['examen','exámenes','imagen','imágenes'].includes(a))return prefix+'llanas-esdrujulas';
   return prefix+'hiato';
  }
  if(q.sub==='conjugacion')return prefix+lower(q.prompt)+'|'+lower(q.display.split(' · ').at(-1));
  if(q.sub==='analisis')return prefix+lower(q.answer.split(' · ').at(-1)).replace(/^pretérito /,'');
  if(q.sub==='puntuacion'){
   for(const [test,key] of [[/vocativo/,'vocativo'],[/sujeto.*verbo/,'sujeto-verbo'],[/enumeración/,'enumeracion'],[/cita|dos puntos/,'cita'],[/interrogativ|signos/,'interrogacion'],[/conector/,'conector'],[/relativa|inciso/,'incisos'],[/suspensivos/,'suspensivos']])if(test.test(why))return prefix+key;
   return prefix+'cortesia';
  }
  if(q.sub==='uso'){
   if(/haber.*impersonal|impersonal.*haber/.test(why))return prefix+'haber-impersonal';
   if(/participio/.test(why))return prefix+'participios';
   if(/imperativo|órdenes|orden negativa/.test(why))return prefix+'imperativo';
   if(/subjuntivo/.test(why))return prefix+'subjuntivo';
   return prefix+'tiempos';
  }
  if(q.cat==='lexico'){
   for(const key of ['metáfora','metonimia','polisemia','homonimia','hiperonimia','hiponimia','sinonimia','antonimia'])if((why+' '+a).includes(key))return prefix+key;
   if(q.sub==='relaciones'&&/antónimo/.test(q.display))return prefix+'antonimia';
   return prefix+q.sub;
  }
  return prefix+opts;
 }
 function load(raw,catalog){
  const valid=new Set(Object.values(catalog).flat().map(skill)),n=v=>Math.max(0,Math.min(1000000,Math.floor(Number(v)||0))),turn=n(raw?.turn);
  const seen=new Set(),pending=[];
  for(const e of Array.isArray(raw?.pending)?raw.pending:[]){
   if(!e||!valid.has(e.skill)||seen.has(e.skill))continue;seen.add(e.skill);
   pending.push({skill:e.skill,cat:e.cat,sourceId:String(e.sourceId||'').slice(0,90),lastId:String(e.lastId||'').slice(0,90),due:Math.min(turn+12,n(e.due)),successes:Math.min(1,n(e.successes)),lastShown:-1});if(pending.length>=24)break;
  }
  return {version:1,turn,pending,mastered:n(raw?.mastered),recent:Array.isArray(raw?.recent)?raw.recent.filter(x=>typeof x==='string').slice(-8):[]};
 }
 function pool(catalog,cat,tier){return (catalog[cat]||[]).filter(q=>q.level<=tier&&q.level>=Math.max(1,tier-1));}
 function record(state,q,ok,catalog,tier){
  state.turn++;state.recent.push(q.id);state.recent=state.recent.slice(-8);
  const key=skill(q),existing=state.pending.find(e=>e.skill===key);
  if(!ok){
   if(!pool(catalog,q.cat,tier).some(other=>skill(other)===key&&other.display!==q.display))return;
   const entry=existing||{skill:key,cat:q.cat,sourceId:q.id};
   Object.assign(entry,{lastId:q.id,due:state.turn+4,successes:0,lastShown:-1});
   if(!existing){if(state.pending.length>=24)state.pending.shift();state.pending.push(entry);}
  }else if(q.reviewSkill===key&&existing){
   if(existing.successes>=1){state.pending=state.pending.filter(e=>e!==existing);state.mastered++;}
   else Object.assign(existing,{lastId:q.id,successes:1,due:state.turn+7,lastShown:-1});
  }
 }
 function select(state,cat,catalog,tier,random=Math.random){
  // At most one review per two answers, so errors never take over the whole session.
  if(state.turn===state.lastReviewTurn||state.turn-(state.lastReviewTurn??-10)<2)return null;
  const entries=state.pending.filter(e=>e.cat===cat&&e.due<=state.turn&&e.lastShown!==state.turn).sort((a,b)=>a.due-b.due);
  for(const e of entries){
   const all=pool(catalog,cat,tier),source=all.find(q=>q.id===e.sourceId),last=all.find(q=>q.id===e.lastId);
   const candidates=all.filter(q=>skill(q)===e.skill&&(e.successes>=1||q.id!==e.sourceId)&&q.id!==e.lastId&&(e.successes>=1||q.display!==source?.display)&&q.display!==last?.display&&!state.recent.includes(q.id));
   if(!candidates.length)continue;
   e.lastShown=state.turn;state.lastReviewTurn=state.turn;
   const q=candidates[Math.min(candidates.length-1,Math.floor(Math.max(0,random())*candidates.length))];
   return {...q,reviewSkill:e.skill,options:[...q.options]};
  }
  return null;
 }
 return {skill,load,pool,record,select};
});
