import fs from "node:fs";
const html=fs.readFileSync("games/tower_defense/index.html","utf8");
const catalog=JSON.parse(fs.readFileSync("config/game-catalog.json","utf8"));
const game=catalog.games.find(item=>item.id==="tower_defense");
const errors=[];
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
if(!html.includes("hpBefore"))errors.push("falta la protección que evita daño al romper escudo");
if(!html.includes("v29InterleaveGroups"))errors.push("falta intercalado de oleadas v29");
if(errors.length)throw new Error("Comprobaciones de Guardianes fallidas:\n- "+errors.join("\n- "));
console.log("Guardianes de la Biblioteca correcto: catálogo, bridge, escudos y oleadas.");
