import fs from "node:fs";
const html=fs.readFileSync("games/tower_defense/index.html","utf8");
const catalog=JSON.parse(fs.readFileSync("config/game-catalog.json","utf8"));
const game=catalog.games.find(item=>item.id==="tower_defense");
const errors=[];
const assetsDir="games/tower_defense/assets";
const assetRefs=[...html.matchAll(/(?:\.\/)?assets\/([a-f0-9]{12}\.webp)/g)].map(match=>match[1]);
const uniqueAssetRefs=[...new Set(assetRefs)];
const assetFiles=fs.existsSync(assetsDir)?fs.readdirSync(assetsDir).filter(name=>name.endsWith(".webp")):[];
if(uniqueAssetRefs.length!==16)errors.push("se esperaban 16 imágenes locales referenciadas y hay "+uniqueAssetRefs.length);
for(const name of uniqueAssetRefs)if(!assetFiles.includes(name))errors.push("falta asset local: "+name);
if(/oaidalleapiprodscus|files\.oaiusercontent|\/mnt\/data\//i.test(html))errors.push("quedan referencias de imagen temporales/externas");
if(!game)errors.push("falta tower_defense en el catálogo");
else{
  if(game.name!=="Guardianes de la Biblioteca")errors.push("nombre canónico incorrecto");
  if(game.entry!=="games/tower_defense/")errors.push("entry incorrecta");
  if(game.integration!=="embedded")errors.push("debe usar integración embedded");
  if(game.status==="en revisión"||game.status==="en revision")errors.push("sigue bloqueado por estado en revisión");
}
for(const token of [
  "const GAME_ID='tower_defense'",
  "namespace:GAME_NS",
  "post('READY'",
  "post('INITIALIZED'",
  "post('CHECKPOINT'",
  "post('RESULT'",
  "LA_TD_BRIDGE.sessionStarted"
]) if(!html.includes(token))errors.push("falta bridge: "+token);
const v29Start=html.indexOf("Enemy.prototype.correct=function(question,fast)");
const v29End=v29Start>=0?html.indexOf("// 2) Reparto de enemigos",v29Start):-1;
const v29Correct=v29Start>=0&&v29End>v29Start?html.slice(v29Start,v29End):"";
if(!v29Correct)errors.push("falta override v29 de ruptura de escudo");
if(v29Correct.includes("this.hp-=")||v29Correct.includes("this.hp =")||v29Correct.includes("this.hp="))errors.push("romper el escudo sigue modificando la vida");
if(!html.includes("v29InterleaveGroups"))errors.push("falta intercalado de oleadas v29");
if(errors.length)throw new Error("Comprobaciones de Guardianes fallidas:\n- "+errors.join("\n- "));
console.log("Guardianes de la Biblioteca correcto: catálogo, bridge, escudos y oleadas.");
