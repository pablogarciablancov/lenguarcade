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
if (/@import\s+url\(['"]https:\/\/fonts\.googleapis\.com/.test(html) ||
    /const AUDIO_(?:CLACK|BGM)\s*=\s*new Audio/.test(html) ||
    !html.includes("AUDIO_BGM.preload = 'none'")) {
  errors.push("Scrabble debe cargar fuentes y audio sin bloquear su apertura.");
}

const centralServer = fs.readFileSync(path.resolve("apps-script", "LenguArcade_Code.gs"), "utf8");
const centralStudent = fs.readFileSync(path.resolve("apps-script", "LenguArcade_Alumno.html"), "utf8");

if (!/function loginGameOpponent\(primaryToken,\s*email,\s*pin,\s*gameId\)[\s\S]*?requireSession_\(primaryToken,\s*'student'\)/.test(centralServer)) {
  errors.push("El acceso del contrincante debe exigir la sesión del jugador principal.");
}
const opponentLoginSource = centralServer.match(/function loginGameOpponent\([^)]*\)\s*\{([\s\S]*?)\n\}/);
if (!opponentLoginSource ||
    !opponentLoginSource[1].includes("getStudentGameRecord_") ||
    opponentLoginSource[1].includes("getStudentDashboardCore_")) {
  errors.push("El acceso del contrincante debe cargar solo su partida, no todo su panel.");
}
if (!/function saveGameCheckpoint\(payload\)[\s\S]*?requireSession_\(payload\.sessionToken,\s*'student'\)/.test(centralServer)) {
  errors.push("Los puntos de control de Scrabble deben exigir una sesión de alumno.");
}
if (!centralServer.includes("https://raw.githack.com/pablogarciablancov/lenguarcade/main/games/scrabble/") ||
    !centralServer.includes("const resultId = String(payload.resultId")) {
  errors.push("Scrabble debe abrir desde GitHub/RawGithack y guardar resultados multijugador de forma idempotente.");
}
for (const required of [
  "gameOpponentAuth",
  "loginGameOpponent",
  "persistGameCheckpoint",
  "getGameParticipantContext",
]) {
  if (!centralStudent.includes(required)) errors.push(`Falta la integración multijugador central: ${required}`);
}

if (!/\.gameOpponentAuth\{[^}]*z-index:(?:1[3-9]\d|[2-9]\d{2,})[^}]*\}/.test(centralStudent)) {
  errors.push("La ventana del contrincante debe mostrarse por encima del juego.");
}

if (errors.length) {
  throw new Error(`Comprobaciones de Scrabble fallidas:\n- ${errors.join("\n- ")}`);
}

console.log(`Scrabble correcto: ${checked} bloques JavaScript comprobados.`);
