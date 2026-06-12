import fs from "node:fs";
import path from "node:path";

const root = path.resolve("games", "scrabble", "apps-script");
const errors = [];
let checked = 0;

for (const name of ["Code.js", "Alumno.html"]) {
  const source = fs.readFileSync(path.join(root, name), "utf8");
  if (name.endsWith(".js")) {
    new Function(source);
    checked += 1;
    continue;
  }
  for (const match of source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
    new Function(match[1]);
    checked += 1;
  }
}

const html = fs.readFileSync(path.join(root, "Alumno.html"), "utf8");
for (const required of [
  "gameId:'scrabble'",
  "REQUEST_OPPONENT_AUTH",
  "OPPONENT_AUTHENTICATED",
  "CHECKPOINT",
  "serializeActiveMatch",
  "boardCellMap",
  "buildPlayerResult",
  "unlockedAchievementIds",
  "Logro oculto",
  "google.script.url.getLocation",
]) {
  if (!html.includes(required)) errors.push(`Falta el componente de Scrabble: ${required}`);
}

const centralServer = fs.readFileSync(path.resolve("apps-script", "LenguArcade_Code.gs"), "utf8");
const centralStudent = fs.readFileSync(path.resolve("apps-script", "LenguArcade_Alumno.html"), "utf8");

if (!/function loginGameOpponent\(primaryToken,\s*email,\s*pin,\s*gameId\)[\s\S]*?requireSession_\(primaryToken,\s*'student'\)/.test(centralServer)) {
  errors.push("El acceso del contrincante debe exigir la sesión del jugador principal.");
}
if (!/function saveGameCheckpoint\(payload\)[\s\S]*?requireSession_\(payload\.sessionToken,\s*'student'\)/.test(centralServer)) {
  errors.push("Los puntos de control de Scrabble deben exigir una sesión de alumno.");
}
if (!centralServer.includes("AKfycbxcVJ1I8jFuhbwjjPPzGFcCdku_LDnXKeZEmnpNYwYo9beCEyNHN8ElzWnXxxjyJFJb") ||
    !centralServer.includes("const resultId = String(payload.resultId")) {
  errors.push("Scrabble debe usar su despliegue estable y guardar resultados multijugador de forma idempotente.");
}
for (const required of [
  "gameOpponentAuth",
  "loginGameOpponent",
  "persistGameCheckpoint",
  "getGameParticipantContext",
]) {
  if (!centralStudent.includes(required)) errors.push(`Falta la integración multijugador central: ${required}`);
}

if (errors.length) {
  throw new Error(`Comprobaciones de Scrabble fallidas:\n- ${errors.join("\n- ")}`);
}

console.log(`Scrabble correcto: ${checked} bloques JavaScript comprobados.`);
