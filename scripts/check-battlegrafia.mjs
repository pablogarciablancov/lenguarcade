import fs from "node:fs";
import path from "node:path";

const root = path.resolve("games", "battlegrafia", "apps-script");
const errors = [];
let checked = 0;

for (const name of ["code.js", "index.html", "game.html", "menu.html", "lenguarcade_bridge.html"]) {
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

const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const bridgeHtml = fs.readFileSync(path.join(root, "lenguarcade_bridge.html"), "utf8");
const centralServer = fs.readFileSync(path.resolve("apps-script", "LenguArcade_Code.gs"), "utf8");
const centralStudent = fs.readFileSync(path.resolve("apps-script", "LenguArcade_Alumno.html"), "utf8");
const supabaseDashboard = fs.readFileSync(path.resolve("supabase", "functions", "student-dashboard", "index.ts"), "utf8");

for (const required of [
  "include('lenguarcade_bridge')",
]) {
  if (!indexHtml.includes(required)) errors.push(`Falta la inclusion de BattleGrafia: ${required}`);
}

for (const required of [
  "const GAME_ID = 'battlegrafia'",
  "lenguarcade-game",
  "lenguarcade-host",
  "postToAncestors",
  "google.script.url.getLocation",
  "CHECKPOINT",
  "RESULT",
  "INITIALIZED",
  "battlegrafia_save_slots_v1_",
  "showEndOverlay",
  "profile.studentId",
  "bg_is_demo",
]) {
  if (!bridgeHtml.includes(required)) errors.push(`Falta el puente de BattleGrafia: ${required}`);
}

const deploymentId = "AKfycbwJRO4_CkEYp6tLtmaYohUD6dSEtAiit3OTW2669yo75DpY5IR6yGdeBv-kWor22zxEyA";
if (!centralServer.includes("battlegrafia") ||
    !centralServer.includes(deploymentId) ||
    !centralServer.includes("estado: 'beta'")) {
  errors.push("LenguArcade_Code.gs debe activar BattleGrafia como juego embebido beta.");
}

if (!centralStudent.includes("gameRecord?.gameId==='battlegrafia'") ||
    !centralStudent.includes("defeatedMonsters") ||
    !centralStudent.includes("totalMonsters") ||
    !centralStudent.includes("LA_EMBEDDED_GAME_OVERRIDES")) {
  errors.push("El runner de alumno debe calcular el progreso especifico de BattleGrafia.");
}

if (!supabaseDashboard.includes("battlegrafia") ||
    !supabaseDashboard.includes(deploymentId) ||
    !supabaseDashboard.includes("locked:!integration")) {
  errors.push("student-dashboard debe exponer BattleGrafia y desbloquearlo al tener integracion.");
}

if (errors.length) {
  throw new Error(`Comprobaciones de BattleGrafia fallidas:\n- ${errors.join("\n- ")}`);
}

console.log(`BattleGrafia correcta: ${checked} bloques JavaScript comprobados.`);
