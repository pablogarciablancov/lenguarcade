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

const curatedBlock=(game.match(/const QUESTION_BANK=\[([\s\S]*?)\n  \]\.map\(\(q,index\)/)||[])[1]||"";
const literalQuestionCount=(curatedBlock.match(/\{verbo:/g)||[]).length;
const achievementCount=(game.match(/\{id:'[^']+',icon:/g)||[]).length;
const regularBlock=(game.match(/const REGULAR_VERBS=\{([\s\S]*?)\n  \};/)||[])[1]||"";
const regularVerbCount=(regularBlock.match(/'[^']+'/g)||[]).length;
const generatedPerVerb=78;
const questionCount=literalQuestionCount+(regularVerbCount*generatedPerVerb);
if(literalQuestionCount<150)errors.push("El banco curado original debe conservar al menos 150 retos.");
if(regularVerbCount<50)errors.push("La ampliación regular debe incluir al menos 50 verbos.");
if(questionCount<4000)errors.push("El banco total debe superar 4000 retos posibles.");
if(achievementCount<24)errors.push("Deben existir al menos 24 logros.");

for(const marker of [
  "Conjuga.<br><span>Arriesga.</span>",
  "const TIERS=",
  "basic:{label:'Básico'",
  "medium:{label:'Intermedio'",
  "advanced:{label:'Avanzado'",
  "expert:{label:'Experto'",
  "insurance:1",
  "swap:1",
  "Rescate automático",
  "state.used=new Set()",
  "usedAnswers:new Set()",
  "recentVerbs:[]",
  "function answerKey",
  "!state.usedAnswers.has(answerKey(q))",
  "state.recentVerbs.length>6",
  "function accentless",
  "const ALTERNATIVES=",
  "REQUEST_OPPONENT_AUTH",
  "namespace:'lenguarcade-game'",
  "gameId:GAME_ID",
  "players:[buildParticipant",
  "Bridge.commitSaves(a.save,b.save)",
  "state.finishReason==='abandoned'",
  "setTimeout(()=>{",
  "newMatch();",
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
   !student.includes("Código para jugar con otra persona") ||
   !student.includes("código general para jugar con otra persona") ||
   student.includes("genera un código de Scrabble") ||
   !student.includes("createGameOpponentCode") ||
   !student.includes("explicitExitRequested:false") ||
   !student.includes("runner.game.gameId!=='conjuga_apuesta'") ||
   !student.includes("LenguArcade ignoró CLOSE_READY de Conjuga y apuesta sin salida explícita.") ||
   !student.includes("runner.closeRequested&&runner.explicitExitRequested")){
  errors.push("El host del alumno no integra correctamente progreso, emparejamiento y cierre seguro de Conjuga y apuesta.");
}
if(!classroom.includes("function createGameOpponentCode") ||
   !classroom.includes("const LA_PAIRABLE_GAME_IDS_ = ['scrabble','conjuga_apuesta','verb_battle']") ||
   !classroom.includes("'LA_GAME_PAIR_'")){
  errors.push("El backend de Apps Script no mantiene el código general para los juegos multijugador compatibles.");
}
if(!migration.includes("status='en pruebas'") ||
   !migration.includes("games/conjuga_apuesta/")){
  errors.push("La migración de Conjuga y apuesta no está completa.");
}

if(errors.length){
  throw new Error("Comprobaciones de Conjuga y apuesta fallidas:\n- "+errors.join("\n- "));
}
console.log("Conjuga y apuesta v3 correcto: "+questionCount+" retos posibles, "+achievementCount+" logros, antirrepetición y código general 1v1.");
