import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const game=fs.readFileSync(path.join(root,"games","verb_battle","index.html"),"utf8");
const code=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Code.gs"),"utf8");
const student=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Alumno.html"),"utf8");
const classroom=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Classroom.gs"),"utf8");
const dashboard=fs.readFileSync(path.join(root,"supabase","functions","student-dashboard","index.ts"),"utf8");
const migration=fs.readFileSync(path.join(root,"supabase","migrations","202609050003_verb_battle_v1.sql"),"utf8");

const errors=[];
for(const match of game.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
  try{new Function(match[1]);}catch(error){errors.push("JavaScript inválido: "+error.message);}
}

const achievementCount=(game.match(/\{id:"[^"]+",icon:/g)||[]).length;
if(achievementCount!==24)errors.push("Batalla verbal debe conservar 24 logros.");

for(const marker of [
  "Piensa.<br><span>Escribe.</span><br>Ataca.",
  'data-mode="practice"',
  'data-mode="battle"',
  "opponent_1",
  "opponent_2",
  "opponent_3",
  'post("REQUEST_OPPONENT_AUTH"',
  'id="questionInput"',
  'id="defenseInput"',
  "function checkWritten",
  'result==="accent"',
  "function defenseQuestionFor",
  "const level=6-attackLevel",
  "block:[65,60,55,50,45]",
  "function activateRune",
  "showEffect(icon,team.name+\" ha conseguido una runa\"",
  "function triggerArenaEvent",
  'showEffect(e.icon,"Evento de arena"',
  "const ADVANCED_INDICATIVE=",
  "function createBoard",
  "while(runes.length<4)",
  "overflow:hidden",
  "grid-template-rows:46px repeat(5,minmax(0,1fr))",
  "function sendResult",
  "players:teams.map",
  "SAVE_CONFIRMED",
  "CLOSE_READY"
]){
  if(!game.includes(marker))errors.push("Falta contrato v2: "+marker);
}

if(game.includes("Ha acertado") || game.includes("Mostrar solución") || game.includes("Se defiende")){
  errors.push("Batalla verbal no debe permitir validación manual del profesor/jugador.");
}

const personCount=(game.match(/label:"[123]\.ª persona/g)||[]).length;
if(personCount<6)errors.push("Faltan las seis personas gramaticales.");

if(!code.includes("verb_battle: {") || !code.includes("estado:'en pruebas'"))errors.push("Catálogo Apps Script incorrecto.");
if(!dashboard.includes("verb_battle:{"))errors.push("student-dashboard no expone Batalla verbal.");
if(!student.includes("gameRecord?.gameId==='verb_battle'"))errors.push("El host no guarda progreso de Batalla verbal.");
if(!student.includes("opponents:{}") ||
   !student.includes("pendingOpponentRequest") ||
   !student.includes("getRunnerOpponent") ||
   !student.includes("openGameOpponentLogin(message.payload||{})")){
  errors.push("El host no admite varios jugadores conectados.");
}
if(!classroom.includes("['scrabble','conjuga_apuesta','verb_battle']"))errors.push("El código general no admite Batalla verbal.");
if(!migration.includes("status='en pruebas'"))errors.push("Migración de Batalla verbal incompleta.");

if(errors.length)throw new Error("Comprobaciones de Batalla verbal v2 fallidas:\n- "+errors.join("\n- "));
console.log("Batalla verbal v2 correcta: sin scroll, respuesta escrita, práctica, 2-4 perfiles, dificultad progresiva y defensa inversa.");
