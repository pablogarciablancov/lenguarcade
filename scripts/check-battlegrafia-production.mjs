import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const gameRoot=path.join(root,"games","battlegrafia_v2");
const index=fs.readFileSync(path.join(gameRoot,"index.html"),"utf8");
const catalog=JSON.parse(fs.readFileSync(path.join(root,"config","game-catalog.json"),"utf8"));
const generated=fs.readFileSync(path.join(root,"apps-script","LenguArcade_GameCatalog.gs"),"utf8");
const errors=[];

const battlegrafia=catalog.games.find(game=>game.id==="battlegrafia");
if(!battlegrafia) errors.push("Falta battlegrafia en el catálogo canónico.");
else {
  if(battlegrafia.entry!=="games/battlegrafia_v2/") errors.push("Battlegrafía oficial debe apuntar a games/battlegrafia_v2/.");
  if(battlegrafia.status!=="listo") errors.push("Battlegrafía oficial debe estar en estado listo.");
  if(battlegrafia.integration!=="embedded") errors.push("Battlegrafía oficial debe estar embebida.");
  if(battlegrafia.official!==true || battlegrafia.active!==true) errors.push("Battlegrafía oficial debe estar activa y marcada como oficial.");
}

for(const required of [
  "const GAME_ID = 'battlegrafia'",
  "./enhance-v2.js",
  "./save-slots-v2.js",
  "./rpg-ui-v2.js",
  "./rpg-unified-v2.js",
  "./battle-clean-v2.js",
  "./battle-router-v2.js",
  "./tabs-polish-v2.js",
  "./stable-tabs-v2.js"
]){
  if(!index.includes(required)) errors.push("Falta en Battlegrafía de producción: "+required);
}

for(const file of [
  "enhance-v2.js","save-slots-v2.js","rpg-ui-v2.js","rpg-unified-v2.js",
  "battle-clean-v2.js","battle-router-v2.js","tabs-polish-v2.js","stable-tabs-v2.js","catalog-polish-v2.js"
]){
  const source=fs.readFileSync(path.join(gameRoot,file),"utf8");
  try { new Function(source); }
  catch(error){ errors.push(file+" no compila: "+error.message); }
}

const expectedUrl="https://pablogarciablancov.github.io/lenguarcade/games/battlegrafia_v2/";
for(const required of ['gameId:"battlegrafia"','estado:"listo"','integration:"embedded"',expectedUrl]){
  if(!generated.includes(required)) errors.push("Catálogo generado de Battlegrafía: falta "+required);
}

if(index.includes("Modo prueba · Fantasy Arcade v2")) errors.push("La versión de producción no debe mostrar el antiguo cartel de modo prueba.");

if(errors.length) throw new Error("Comprobaciones de Battlegrafía de producción fallidas:\n- "+errors.join("\n- "));
console.log("Battlegrafía de producción correcta: Fantasy Arcade oficial y módulos principales compilados.");
