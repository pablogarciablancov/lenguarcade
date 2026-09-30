/* Spanish default scansion. Synalepha is optional with | at a boundary.
   Literary licences and pronunciation variants require a teacher's review. */
(() => {
'use strict';
// References: RAE, Ortografía básica, secuencias vocálicas; DPD, diéresis.
const clean=s=>s.toLowerCase().replace(/[áéíóú]/g,c=>({'á':'a','é':'e','í':'i','ó':'o','ú':'u'}[c]));
function wordScan(input){
 const word=String(input).toLowerCase().replace(/[^a-záéíóúüñ]/g,'').replace(/([qg])u(?=[eéií])/g,'$1');
 const vowels=[...word.matchAll(/[aeiouáéíóúü]+/g)],nuclei=[];
 vowels.forEach(m=>{
  let group=[];[...m[0]].forEach((v,i)=>{
   const strong=/[aeoáéóíú]/.test(v),last=group[group.length-1];
   if(last&&((strong&&/[aeoáéóíú]/.test(last.v))||/[íú]/.test(v)||/[íú]/.test(last.v)||clean(last.v)===clean(v))){nuclei.push(group);group=[];}
   group.push({v,index:m.index+i});
  });if(group.length)nuclei.push(group);
 });
 let stress=nuclei.findIndex(g=>g.some(x=>/[áéíóú]/.test(x.v)));
 if(stress<0)stress=Math.max(0,nuclei.length-(/[aeiouüns]$/.test(word)?2:1));
 const group=nuclei[stress]||[],stressed=group.find(x=>/[áéíóúaeo]/.test(x.v))||group[group.length-1];
 const tail=stressed?clean(word.slice(stressed.index)):'';
 const ending=nuclei.length-stress;
 return{word,syllables:nuclei.length,ending,adjustment:ending===1?1:ending>=3?-1:0,consonant:tail,assonant:tail.replace(/[^aeiou]/g,'')};
}
function scan(line){
 const words=String(line).toLowerCase().match(/[a-záéíóúüñ]+|\|/g)||[];let count=0,joins=0,lastWord=null,previous='',blocked=false;
 words.forEach(w=>{if(w==='|'){blocked=true;return;}const x=wordScan(w);count+=x.syllables;
 if(!blocked&&/[aeiouáéíóúüy]$/.test(previous)&&/^h?[aeiouáéíóúü]/.test(w)){count--;joins++;}
 blocked=false;previous=w;lastWord=x;});
 return{syllables:Math.max(0,count+(lastWord?.adjustment||0)),synalephas:joins,last:lastWord};
}
function evaluate(line,reference,type='consonant'){
 const a=scan(line),b=scan(reference),different=a.last?.word!==b.last?.word;
 return{...a,meterMatches:a.syllables===b.syllables,rhymeMatches:!!a.last&&different&&a.last[type]===b.last?.[type],target:b.syllables};
}
window.VersopolisProsody={scan,wordScan,evaluate};
})();
