import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";

const root=process.cwd(),dir=path.join(root,"games","versopolis");
for(const file of ["index.html","styles.css","app.js","bridge.js","lenguarcade.integration.json"]){
  if(!fs.existsSync(path.join(dir,file))) throw new Error("Versópolis: falta "+file);
}
const html=fs.readFileSync(path.join(dir,"index.html"),"utf8");
const app=fs.readFileSync(path.join(dir,"app.js"),"utf8");
const bridge=fs.readFileSync(path.join(dir,"bridge.js"),"utf8");
if(!html.includes("./bridge.js")||!html.includes("./app.js")) throw new Error("Versópolis: index incompleto.");
for(const token of ["atlasScreen","achievementsScreen","codexScreen","museScreen","eventScreen","deckScreen","challengeBanner","poemSlots","hand"]){
  if(!html.includes(token)) throw new Error("Versópolis: falta interfaz "+token);
}
for(const token of ["window.VersopolisGame","var legacyDistricts=[","var MAPS=[","var ACHIEVEMENTS=[","var CODEX=[","var SPRITE_ASSETS=","var muses=[","var cards=[","var challenges=[","var events=[","cardPool","function analyze(ids)","function rollChallenge()","function showEvent()","function openDeckAction(mode)","function playSelection()","function migrateRun(oldRun,version)"]){
  if(!app.includes(token)) throw new Error("Versópolis: lógica incompleta ("+token+").");
}
for(const scene of ["garden","fortress","theater","tower"]){
  if(!fs.existsSync(path.join(dir,"assets","art","scene-"+scene+".webp")))throw new Error("Versópolis: falta escenario "+scene);
  for(let stage=0;stage<4;stage++){
    if(!fs.existsSync(path.join(dir,"assets","art","enemy-"+scene+"-"+stage+".webp")))throw new Error("Versópolis: falta rival "+scene+"/"+stage);
  }
}
for(const muse of ["eco","pulso","imagen","arquitecta","duende","afinacion","coleccionista"]){
  if(!fs.existsSync(path.join(dir,"assets","art","muse-"+muse+".webp")))throw new Error("Versópolis: falta Musa "+muse);
}
for(const item of ["inspiration","change","deck","discard","contract","achievement","event","quill"]){
  if(!fs.existsSync(path.join(dir,"assets","art","hud-"+item+".webp")))throw new Error("Versópolis: falta recurso HUD "+item);
}
const cardMeters=Object.fromEntries([...app.matchAll(/\{id:"([^"]+)",text:"[^"]+",meter:(\d+)/g)].map(([,id,meter])=>[id,Number(meter)]));
if(Object.keys(cardMeters).length!==52)throw new Error("Versópolis: el banco debe tener 52 versos distintos.");
for(const id of ["joker_eco","joker_pulso"]){
  if(!app.includes('id:"'+id+'"')||!fs.existsSync(path.join(dir,"assets","art",id.replace("_","-")+".webp")))throw new Error("Versópolis: falta comodín "+id);
}
const scansBlock=app.match(/var SCANS=\{([\s\S]*?)\};/);
if(!scansBlock)throw new Error("Versópolis: faltan escansiones.");
const scans=Object.fromEntries([...scansBlock[1].matchAll(/\b(\w+):"([^"]+)"/g)].map(([,id,scan])=>[id,scan]));
for(const [id,meter] of Object.entries(cardMeters)){
  const scan=scans[id];if(!scan)throw new Error("Versópolis: falta escansión "+id);
  const syllables=scan.split(/[- ]+/).length+(id.startsWith("or")?1:0);
  if(syllables!==meter)throw new Error("Versópolis: medida incoherente en "+id+" ("+syllables+"/"+meter+").");
}
for(const token of ["READY","CHECKPOINT","RESULT","REQUEST_EXIT","CLOSE_READY"]){
  if(!bridge.includes(token)) throw new Error("Versópolis bridge: falta "+token);
}
function boot(){
  const elements=new Map();
  function el(){const e={textContent:"",className:"",style:{},dataset:{},offsetWidth:1,disabled:false,classList:{add(){},remove(){},toggle(){}},appendChild(){},addEventListener(){},setAttribute(){}};Object.defineProperty(e,"innerHTML",{get(){return this.html||"";},set(v){this.html=v;}});return e;}
  const document={getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id);},createElement:el};
  const window={},localStorage={getItem(){return null;},setItem(){}};
  const exposed='window.__test={moveCard,toggleCard,moveSelected,removeSelected,cards,startingBaseIds,challenges,newRun,chooseMuse,rollChallenge,witnessFor,collectionCards,analyze,contractMet,makeInstance,applyDeckAction,migrateRun,get run(){return run;}};';
  vm.runInNewContext(app.replace(/\}\)\(\);\s*$/,exposed+'})();'),{window,document,localStorage,console,setTimeout(){return 1;},clearTimeout(){},Math,Date,Intl});
  return window.__test;
}
for(const map of ["jardines","fortaleza","teatro","torre"]){
  const t=boot();assert.equal(t.cards.length,54);assert.equal(t.startingBaseIds.length,51);t.newRun(map);t.chooseMuse("eco");
  assert.equal(t.run.cardPool.length,51);assert(t.run.hand.some(id=>t.collectionCards().find(c=>c.uid===id)?.joker),"El primer reparto muestra un comodín");
  for(const ch of t.challenges.filter(c=>c.min<=3&&c.id!=="rescate")){
    const witness=t.witnessFor(ch,t.collectionCards());
    assert(witness?.length>=2,map+": falta combinación para "+ch.id);
    t.run.challengeId=ch.id;assert(ch.test(t.analyze(witness.map(c=>c.uid))),map+": combinación inválida para "+ch.id);
  }
  t.run.challengeId=null;
  for(let turn=0;turn<45;turn++){
    t.rollChallenge();const ch=t.challenges.find(c=>c.id===t.run.challengeId);
    const hand=t.collectionCards().filter(c=>t.run.hand.includes(c.uid));
    const witness=t.witnessFor(ch,hand);
    assert(witness?.length>=2,map+": contrato sin solución visible "+ch.id);
    assert(ch.test(t.analyze(witness.map(c=>c.uid))),map+": testigo inválido "+ch.id);
    assert.equal(new Set([...t.run.hand,...t.run.deck,...t.run.discardPile]).size,t.run.cardPool.length,map+": carta duplicada o perdida");
  }
  const originalHand=t.run.hand.slice(),originalDeck=t.run.deck.slice(),originalDiscard=t.run.discardPile.slice();
  const chosen=t.run.hand.slice(0,5);t.run.selected=[];
  chosen.slice(0,4).forEach((id,i)=>assert(t.moveCard(id,"slot",i)));
  assert(!t.moveCard(chosen[4],"slot",0),"Un atril lleno rechaza una quinta carta");
  assert(!t.moveCard("invalid-card","slot",0),"Una carta ajena no entra en el atril");
  assert(t.moveCard(chosen[3],"slot",0));assert.equal(t.run.selected[0],chosen[3]);
  t.moveSelected(chosen[3],1);assert.equal(t.run.selected[1],chosen[3]);
  t.toggleCard(chosen[0]);assert(!t.run.selected.includes(chosen[0]));
  t.toggleCard(chosen[0]);assert(t.run.selected.includes(chosen[0]));
  assert.equal(new Set(t.run.selected).size,4);
  const selection=t.run.selected.slice();t.run.locked=true;assert(!t.moveCard(chosen[0],"hand",0));t.run.locked=false;
  t.run.discardMode=true;assert(!t.moveCard(chosen[0],"hand",0));t.run.discardMode=false;
  assert.deepEqual(t.run.selected,selection);assert.deepEqual(t.run.hand,originalHand);assert.deepEqual(t.run.deck,originalDeck);assert.deepEqual(t.run.discardPile,originalDiscard);
  chosen.forEach(id=>t.removeSelected(id));assert.equal(t.run.selected.length,0);
  const anchor=t.collectionCards().find(c=>!c.joker),joker=t.collectionCards().find(c=>c.joker);
  t.run.challengeId="consonante";const mimic=t.analyze([anchor.uid,joker.uid]);
  assert.equal(mimic.jokerCount,1);assert.equal(mimic.rhymes[0],mimic.rhymes[1]);assert(t.contractMet(mimic));
  const pair=t.collectionCards().filter(c=>c.joker).map(c=>c.uid);assert(!t.contractMet(t.analyze(pair)),"Dos comodines solos no cumplen el contrato");
  const old=JSON.parse(JSON.stringify(t.run));old.version=5;old.cardPool=old.cardPool.filter(c=>!c.baseId.startsWith("joker_"));old.hand=old.hand.filter(id=>old.cardPool.some(c=>c.uid===id));old.deck=old.deck.filter(id=>old.cardPool.some(c=>c.uid===id));
  const migrated=t.migrateRun(old,5);assert.equal(migrated.version,6);assert.equal(migrated.cardPool.filter(c=>c.baseId.startsWith("joker_")).length,2);assert.equal(migrated.challengeId,null);
  while(t.run.cardPool.length<54)t.run.cardPool.push(t.makeInstance(anchor.id,0));
  t.applyDeckAction("duplicate",anchor.uid);assert.equal(t.run.cardPool.length,54,"El mazo no supera 54 cartas");
}
console.log("Versópolis V0.6 OK: 52 versos, 2 comodines, contratos resolubles y límite de 54 cartas.");
