import fs from "node:fs";
import path from "node:path";

const root=process.cwd(),dir=path.join(root,"games","versopolis");
for(const file of ["index.html","styles.css","app.js","bridge.js","lenguarcade.integration.json"]){
  if(!fs.existsSync(path.join(dir,file))) throw new Error("Versópolis: falta "+file);
}
const html=fs.readFileSync(path.join(dir,"index.html"),"utf8");
const app=fs.readFileSync(path.join(dir,"app.js"),"utf8");
const bridge=fs.readFileSync(path.join(dir,"bridge.js"),"utf8");
if(!html.includes("./bridge.js")||!html.includes("./app.js")) throw new Error("Versópolis: index incompleto.");
for(const token of ["atlasScreen","achievementsScreen","codexScreen","museScreen","eventScreen","deckScreen","challengeBanner","poemSlots","hand"]){
  if(!html.includes(token)) throw new Error("Versópolis V0.5: falta interfaz "+token);
}
for(const token of ["window.VersopolisGame","var legacyDistricts=[","var MAPS=[","var ACHIEVEMENTS=[","var CODEX=[","var SPRITE_ASSETS=","var muses=[","var cards=[","var challenges=[","var events=[","cardPool","function analyze(ids)","function rollChallenge()","function showEvent()","function openDeckAction(mode)","function playSelection()","function migrateRun(oldRun,version)"]){
  if(!app.includes(token)) throw new Error("Versópolis V0.5: lógica incompleta ("+token+").");
}
for(const scene of ["garden","fortress","theater","tower"]){
  for(const suffix of [".svg","-boss.svg"]){if(!fs.existsSync(path.join(dir,"assets",scene+suffix)))throw new Error("Versópolis: falta arte "+scene+suffix);}
}
for(const muse of ["eco","pulso","imagen","arquitecta","duende","afinacion","coleccionista"]){
  if(!fs.existsSync(path.join(dir,"assets","muse-"+muse+".svg")))throw new Error("Versópolis: falta Musa "+muse);
}
const cardMeters=Object.fromEntries([...app.matchAll(/\{id:"([^"]+)",text:"[^"]+",meter:(\d+)/g)].map(([,id,meter])=>[id,Number(meter)]));
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
console.log("Versópolis V0.5 OK: atlas, contratos, eventos, logros, códice y guardados presentes.");
