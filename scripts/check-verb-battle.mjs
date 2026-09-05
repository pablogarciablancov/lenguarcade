import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const game=fs.readFileSync(path.join(root,"games","verb_battle","index.html"),"utf8");
const code=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Code.gs"),"utf8");
const student=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Alumno.html"),"utf8");
const dashboard=fs.readFileSync(path.join(root,"supabase","functions","student-dashboard","index.ts"),"utf8");
const migration=fs.readFileSync(path.join(root,"supabase","migrations","202609050003_verb_battle_v1.sql"),"utf8");

const errors=[];

for(const match of game.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
  try{new Function(match[1]);}catch(error){errors.push("JavaScript inválido: "+error.message);}
}

const achievementCount=(game.match(/\{id:"[^"]+",icon:/g)||[]).length;
if(achievementCount!==24)errors.push("Batalla verbal debe tener exactamente 24 logros.");

for(const marker of [
  "Batalla Verbal",
  "Arena táctica",
  "var ROLE_DEFS=",
  "warrior:{name:\"Guerrero\"",
  "mage:{name:\"Mago\"",
  "archer:{name:\"Arquero\"",
  "cleric:{name:\"Clérigo\"",
  "var CATEGORIES=",
  "Indicativo",
  "Tiempos compuestos",
  "Subjuntivo",
  "Imperativo",
  "Maestría irregular",
  "function generatePools",
  "function createBoard",
  "while(runeIndexes.length<4)",
  "function triggerArenaEvent",
  "function useAbility",
  "function resolveDefense",
  "function finishMatch",
  "namespace:BRIDGE_NAMESPACE",
  "gameId:GAME_ID",
  "post(\"RESULT\"",
  "SAVE_CONFIRMED",
  "CLOSE_READY"
]){
  if(!game.includes(marker))errors.push("Falta contrato de juego: "+marker);
}

const personCount=(game.match(/label:"[123]\.ª persona/g)||[]).length;
if(personCount<6)errors.push("Faltan las seis personas gramaticales.");

if(!code.includes("verb_battle: {") ||
   !code.includes("games/verb_battle/") ||
   !code.includes("estado:'en pruebas'")){
  errors.push("Apps Script no activa Batalla verbal como juego embebido en pruebas.");
}
if(!dashboard.includes("verb_battle:{") || !dashboard.includes("games/verb_battle/")){
  errors.push("student-dashboard no expone Batalla verbal.");
}
if(!student.includes("verb_battle:{") ||
   !student.includes("gameRecord?.gameId==='verb_battle'")){
  errors.push("El host del alumno no integra Batalla verbal y su progreso.");
}
if(!migration.includes("status='en pruebas'") || !migration.includes("games/verb_battle/")){
  errors.push("La migración de Batalla verbal no está completa.");
}

if(errors.length)throw new Error("Comprobaciones de Batalla verbal fallidas:\n- "+errors.join("\n- "));
console.log("Batalla verbal v1 correcta: arena táctica, 4 clases, tablero variable, 24 logros e integración LenguArcade.");
