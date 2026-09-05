import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const game=fs.readFileSync(path.join(root,"games","conjuga_apuesta","index.html"),"utf8");
const code=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Code.gs"),"utf8");
const student=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Alumno.html"),"utf8");
const classroom=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Classroom.gs"),"utf8");
const dashboard=fs.readFileSync(path.join(root,"supabase","functions","student-dashboard","index.ts"),"utf8");
const migration=fs.readFileSync(path.join(root,"supabase","migrations","202609050002_conjuga_apuesta_v2.sql"),"utf8");

const errors=[];

for(const match of game.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
  try{new Function(match[1]);}catch(error){errors.push("JavaScript del juego inválido: "+error.message);}
}

const questionCount=(game.match(/\{verbo:/g)||[]).length;
const achievementCount=(game.match(/\{id:'[^']+',icon:/g)||[]).length;
if(questionCount<150)errors.push("El banco debe conservar y ampliar el contenido hasta al menos 150 retos.");
if(achievementCount<24)errors.push("Deben existir al menos 24 logros.");

for(const marker of [
  "Conjuga.\nArriesga.",
  "const TIERS=",
  "basic:{label:'Básico'",
  "medium:{label:'Intermedio'",
  "advanced:{label:'Avanzado'",
  "expert:{label:'Experto'",
  "insurance:1",
  "swap:1",
  "Rescate automático",
  "state.used=new Set()",
  "function accentless",
  "const ALTERNATIVES=",
  "REQUEST_OPPONENT_AUTH",
  "namespace:'lenguarcade-game'",
  "gameId:GAME_ID",
  "players:[buildParticipant",
  "xpGain",
  "achievements",
]){
  if(!game.includes(marker))errors.push("Falta contrato del juego: "+marker);
}

if(!code.includes("conjuga_apuesta: {") ||
   !code.includes("games/conjuga_apuesta/") ||
   !code.includes("estado:'en pruebas'")){
  errors.push("Apps Script no activa Conjuga y apuesta como juego embebido en pruebas.");
}
if(!dashboard.includes("conjuga_apuesta:{") ||
   !dashboard.includes("games/conjuga_apuesta/")){
  errors.push("student-dashboard no expone la integración de Conjuga y apuesta.");
}
if(!student.includes("gameRecord?.gameId==='conjuga_apuesta'") ||
   !student.includes("Código para partidas 1 contra 1") ||
   !student.includes("createGameOpponentCode")){
  errors.push("El host del alumno no integra progreso y emparejamiento de Conjuga y apuesta.");
}
if(!classroom.includes("function createGameOpponentCode") ||
   !classroom.includes("['scrabble','conjuga_apuesta']") ||
   !classroom.includes("'LA_GAME_PAIR_'")){
  errors.push("El backend de Apps Script no admite códigos genéricos para los dos juegos 1v1.");
}
if(!migration.includes("status='en pruebas'") ||
   !migration.includes("games/conjuga_apuesta/")){
  errors.push("La migración de Conjuga y apuesta no está completa.");
}

if(errors.length){
  throw new Error("Comprobaciones de Conjuga y apuesta fallidas:\n- "+errors.join("\n- "));
}
console.log("Conjuga y apuesta v2 correcto: "+questionCount+" retos, "+achievementCount+" logros e integración 1v1.");
