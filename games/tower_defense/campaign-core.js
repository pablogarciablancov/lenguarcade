/* Per-map objectives and permanent stars. Independent of rendering, timers and platform XP. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GuardianCampaign=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const missions={
  bosque:{title:'El primer catálogo',description:'Responde correctamente al menos 12 preguntas.',goals:[{kind:'correct',target:12}]},
  ciudad:{title:'Las tres secciones',description:'Consigue al menos 4 aciertos de cada familia: Ortografía, Verbos y Léxico.',goals:['ortografia','verbos','lexico'].map(cat=>({kind:'category',cat,target:4}))},
  trigal:{title:'La cosecha de palabras',description:'Responde al menos 20 preguntas con un 75 % de precisión o más.',goals:[{kind:'attempts',target:20},{kind:'accuracy',target:75}]},
  bahia:{title:'Los faros verbales',description:'Consigue 8 aciertos de Verbos y termina con dos torres de nivel 2 o superior.',goals:[{kind:'category',cat:'verbos',target:8},{kind:'upgraded',target:2}]},
  bosque_bifurcado:{title:'Dos sendas, una biblioteca',description:'Derrota a 3 monstruos en cada una de las dos rutas y consigue 12 aciertos.',routes:2,goals:[{kind:'routes',target:3},{kind:'correct',target:12}]},
  marisma:{title:'Ningún cauce sin defensa',description:'Derrota a 2 monstruos en cada una de las tres rutas y consigue 18 aciertos.',routes:3,goals:[{kind:'routes',target:2},{kind:'correct',target:18}]},
  cumbres:{title:'Romper la escolta',description:'Derrota a 2 Protectores del Códice y consigue 8 aciertos de Léxico.',goals:[{kind:'protectors',target:2},{kind:'category',cat:'lexico',target:8}]},
  caldera:{title:'Dominar las encrucijadas',description:'Derrota al menos a un monstruo de cada una de las cuatro rutas. Responde 25 preguntas o más con al menos un 75 % de precisión.',routes:4,goals:[{kind:'routes',target:1},{kind:'attempts',target:25},{kind:'accuracy',target:75}]}
 };
 const number=n=>Math.max(0,Math.min(1000000,Math.floor(Number(n)||0))),count=stars=>stars.filter(Boolean).length;
 function load(raw){
  const maps={};for(const key of Object.keys(missions)){const r=raw?.maps?.[key],won=r?.stars?.[0]===true;maps[key]={stars:[won,won&&r?.stars?.[1]===true,won&&r?.stars?.[2]===true],wins:number(r?.wins)};}
  return {version:1,maps};
 }
 function run(raw,key){return {mapKey:key,finished:raw?.mapKey===key&&raw.finished===true,routeKills:Array.from({length:missions[key]?.routes||0},(_,i)=>raw?.mapKey===key?number(raw.routeKills?.[i]):0),protectors:raw?.mapKey===key?number(raw.protectors):0};}
 function kill(state,enemy){
  if(state.finished)return;
  if(Number.isInteger(enemy.routeId)&&enemy.routeId>=0&&enemy.routeId<state.routeKills.length)state.routeKills[enemy.routeId]++;
  if(enemy.type==='protector')state.protectors++;
 }
 const labels={ortografia:'Ortografía',verbos:'Verbos',lexico:'Léxico'};
 function goals(key,stats={},state=run(null,key),towers=[]){
  const attempts=number(stats.attempts),correct=number(stats.correct),accuracy=attempts?correct/attempts*100:0;
  return missions[key].goals.flatMap(g=>{
   if(g.kind==='routes')return Array.from({length:missions[key].routes},(_,i)=>({label:`Monstruos derrotados · ruta ${i+1}`,value:number(state.routeKills[i]),target:g.target,met:number(state.routeKills[i])>=g.target}));
   const value=g.kind==='correct'?correct:g.kind==='attempts'?attempts:g.kind==='accuracy'?accuracy:g.kind==='category'?number(stats.byCategory?.[g.cat]?.correct):g.kind==='upgraded'?towers.filter(t=>t.level>=2).length:number(state.protectors);
   const label=({correct:'Preguntas acertadas',attempts:'Preguntas respondidas',accuracy:'Precisión',category:`Aciertos de ${labels[g.cat]}`,upgraded:'Torres de nivel 2 o superior',protectors:'Protectores derrotados'})[g.kind];
   return [{label,value,target:g.target,met:value>=g.target,percent:g.kind==='accuracy'}];
  });
 }
 function result(key,{victory,waveIndex,lives,stats,towers},state){
  const won=!!victory&&waveIndex>=10,checks=goals(key,stats,state,towers);
  return {won,stars:[won,won&&lives>=15,won&&checks.every(g=>g.met)],goals:checks};
 }
 function award(campaign,key,result){const record=campaign.maps[key],before=count(record.stars);record.stars=record.stars.map((earned,i)=>earned||result.stars[i]);if(result.won)record.wins++;return count(record.stars)-before;}
 function total(campaign){return Object.values(campaign.maps).reduce((sum,r)=>sum+count(r.stars),0);}
 return {missions,load,run,kill,goals,result,award,total,count};
});
