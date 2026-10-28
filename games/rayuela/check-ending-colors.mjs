import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('function renderEnding(n){'),html.indexOf('\nfunction closePlay('));
const nodes=['good','perfect','neutral','bad','defeat','mystery','secret'].map(type=>({id:type,type:'ending',endingType:type,title:type,text:'Final'}));
nodes.push({id:'locked',type:'ending',endingType:'bad',title:'NO REVELAR'});
const content={innerHTML:''},fields={};
const ctx={project:{nodes,discoveredEndings:nodes.slice(0,-1).map(n=>n.id)},playState:{},gallerySession:null,awardAchievement(){},scheduleSave(){},computeStats:()=>({endings:8}),isEnding:()=>true,ENDING_TYPES:Object.fromEntries(nodes.map(n=>[n.endingType,{label:n.endingType,icon:'x'}])),esc:String,startPlay(){},closePlay(){},$:id=>id==='playContent'?content:(fields[id]??={})};
vm.createContext(ctx);vm.runInContext(source,ctx);
for(const [type,tone] of [['good','endingGood'],['perfect','endingGood'],['neutral','endingRegular'],['bad','endingBad'],['defeat','endingBad'],['mystery','endingRegular'],['secret','endingRegular']]){
 ctx.renderEnding(nodes.find(n=>n.id===type));
 assert(content.innerHTML.includes('endingOutcome '+tone));
 assert(content.innerHTML.includes('endingDot found '+tone+'" title="'+type+'">'+type));
 assert(content.innerHTML.includes('endingDot locked">?????</span>'));
 assert(!content.innerHTML.includes('NO REVELAR'));
}
console.log('Rayuela: colores por tipo en final y colección; finales pendientes sin spoilers.');
