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
if(!app.includes("window.VersopolisGame")||!app.includes("challenges=[")) throw new Error("Versópolis: lógica principal incompleta.");
for(const token of ["READY","CHECKPOINT","RESULT","REQUEST_EXIT","CLOSE_READY"]){if(!bridge.includes(token))throw new Error("Versópolis bridge: falta "+token);}
console.log("Versópolis V0.1 OK.");
