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
for(const token of ["museScreen","eventScreen","deckScreen","challengeBanner","poemSlots","hand"]){
  if(!html.includes(token)) throw new Error("Versópolis V0.4: falta interfaz "+token);
}
for(const token of ["window.VersopolisGame","var districts=[","var muses=[","var cards=[","var challenges=[","var events=[","cardPool","function analyze(ids)","function rollChallenge()","function showEvent()","function openDeckAction(mode)","function playSelection()"]){
  if(!app.includes(token)) throw new Error("Versópolis V0.4: lógica incompleta ("+token+").");
}
for(const token of ["READY","CHECKPOINT","RESULT","REQUEST_EXIT","CLOSE_READY"]){
  if(!bridge.includes(token)) throw new Error("Versópolis bridge: falta "+token);
}
console.log("Versópolis V0.4 OK: contratos, eventos y deckbuilding presentes.");
