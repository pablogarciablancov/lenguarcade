import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const source=html.slice(html.indexOf('function renderEnding(n){'),html.indexOf('\nfunction closePlay('));
const nodes=['good','perfect','neutral','bad','defeat','mystery','secret'].map(type=>({id:type,type:'ending',endingType:type,title:type,text:'Explicación del final '+type}));
nodes.push({id:'locked',type:'ending',endingType:'bad',title:'NO REVELAR'});
const content={innerHTML:''},fields={};
const ctx={project:{nodes,discoveredEndings:nodes.slice(0,-1).map(n=>n.id)},playState:{},gallerySession:null,awardAchievement(){},scheduleSave(){},computeStats:()=>({endings:8}),isEnding:()=>true,ENDING_TYPES:Object.fromEntries(nodes.map(n=>[n.endingType,{label:n.endingType,icon:'x'}])),esc:String,startPlay(){},closePlay(){},$:id=>id==='playContent'?content:(fields[id]??={})};
vm.createContext(ctx);vm.runInContext(source,ctx);
for(const [type,tone] of [['good','endingGood'],['perfect','endingGood'],['neutral','endingRegular'],['bad','endingBad'],['defeat','endingBad'],['mystery','endingRegular'],['secret','endingRegular']]){
 ctx.renderEnding(nodes.find(n=>n.id===type));
 assert(content.innerHTML.includes('endingOutcome '+tone));
 assert(content.innerHTML.includes('endingDot found '+tone+'" title="'+type+'" type="button"'));
 assert(content.innerHTML.includes('endingDot locked">?????</span>'));
 assert(!content.innerHTML.includes('NO REVELAR'));
}
console.log('Rayuela: colores por tipo en final y colección; finales pendientes sin spoilers.');

const calls={awards:0,saves:0,completions:0};ctx.project.playthroughs=9;ctx.playState.path=['start','good'];ctx.gallerySession={id:'story'};ctx.gallery={finished(){calls.completions++;}};ctx.awardAchievement=()=>calls.awards++;ctx.scheduleSave=()=>calls.saves++;
const discoveredBefore=JSON.stringify(ctx.project.discoveredEndings),pathBefore=JSON.stringify(ctx.playState.path);
fields.endingReview_0.onclick();
assert(content.innerHTML.includes('<h1>good</h1>'));assert(content.innerHTML.includes('Explicación del final good'));assert(content.innerHTML.includes('Tu colección de finales'));
assert.equal(ctx.project.playthroughs,9);assert.equal(calls.awards+calls.saves+calls.completions,0);
assert.equal(JSON.stringify(ctx.project.discoveredEndings),discoveredBefore);assert.equal(JSON.stringify(ctx.playState.path),pathBefore);
const beforeLocked=content.innerHTML;ctx.renderEndingCard(nodes.at(-1),true);assert.equal(content.innerHTML,beforeLocked);
console.log('Consulta de finales: tarjeta completa al pulsar, sin desbloqueos, partidas, XP ni confirmaciones de lectura adicionales.');
