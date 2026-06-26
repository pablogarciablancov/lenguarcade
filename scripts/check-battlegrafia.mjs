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
const codeSource = fs.readFileSync(path.join(root, "code.js"), "utf8");
const bridgeHtml = fs.readFileSync(path.join(root, "lenguarcade_bridge.html"), "utf8");
const arenaUiHtml = fs.readFileSync(path.join(root, "arena_ui.html"), "utf8");
const centralServer = fs.readFileSync(path.resolve("apps-script", "LenguArcade_Code.gs"), "utf8");
const centralStudent = fs.readFileSync(path.resolve("apps-script", "LenguArcade_Alumno.html"), "utf8");
const supabaseDashboard = fs.readFileSync(path.resolve("supabase", "functions", "student-dashboard", "index.ts"), "utf8");

for (const required of [
  "include('arena_ui')",
  "include('lenguarcade_bridge')",
]) {
  if (!indexHtml.includes(required)) errors.push(`Falta la inclusion de BattleGrafia: ${required}`);
}

if (indexHtml.indexOf("include('arena_ui')") < indexHtml.indexOf("include('styles')")) {
  errors.push("Arena UI debe cargarse despues de styles.html para actuar como capa visual reversible.");
}

if (indexHtml.indexOf("include('lenguarcade_bridge')") > indexHtml.indexOf("include('game')")) {
  errors.push("El puente de LenguArcade debe cargarse antes que game.html en BattleGrafia.");
}

for (const required of [
  "Battlegraf",
  ".battle-screen",
  ".battle-sprites-row",
  "#attack-btn",
  "Arena UI - menu and hub polish",
  ".menu-panel",
  ".mode-card",
]) {
  if (!arenaUiHtml.includes(required)) errors.push(`Falta la capa Arena UI de BattleGrafia: ${required}`);
}

if (arenaUiHtml.includes("scaleX(-1)")) {
  errors.push("Arena UI no debe invertir los monstruos: quedan de espaldas al heroe.");
}

if (!codeSource.includes("setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)")) {
  errors.push("BattleGrafia debe permitir iframe con HtmlService.XFrameOptionsMode.ALLOWALL.");
}

for (const required of [
  "const GAME_ID = 'battlegrafia'",
  "lenguarcade-game",
  "lenguarcade-host",
  "postToAncestors",
  "startBridgeFromAppsScriptUrl",
  "google.script.url.getLocation",
  "CHECKPOINT",
  "RESULT",
  "INITIALIZED",
  "metrics:stats",
  "accuracy:stats.accuracy",
  "__LENGUARCADE_BRIDGE_SCRIPT",
  "__LENGUARCADE_PROFILE_READY",
  "__LENGUARCADE_PROFILE_LABEL",
  "exposeProfileMarkers",
  "__LENGUARCADE_SLOT_ID",
  "isolateLocalSlotsForProfile",
  "clearRuntimePlayer",
  "refreshVisibleProfile",
  "__lenguarcadeProfileKey",
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
    !centralStudent.includes("buildEvaluableSnapshot") ||
    !centralStudent.includes("lenguarcade-save-v3") ||
    !centralStudent.includes("LA_EMBEDDED_GAME_OVERRIDES")) {
  errors.push("El runner de alumno debe calcular el progreso especifico de BattleGrafia.");
}

if (!centralStudent.includes("getEmbeddedGameConnectionDelay") ||
    !centralStudent.includes("gameId==='battlegrafia'") ||
    !centralStudent.includes("return 12000")) {
  errors.push("LenguArcade_Alumno.html debe dar mas margen de conexion a BattleGrafia.");
}

const gameHtml = fs.readFileSync(path.join(root, "game.html"), "utf8");
if (!gameHtml.includes("__LENGUARCADE_SLOT_ID") ||
    !gameHtml.includes("requiredSlotId") ||
    !gameHtml.includes("window.__LENGUARCADE_SLOT_ID") ||
    !gameHtml.includes("function isLenguArcadeEmbeddedMode()") ||
    !gameHtml.includes("if(isLenguArcadeEmbeddedMode()) return null;") ||
    !gameHtml.includes("const saved = loadSavedPlayerLocal();") ||
    !gameHtml.includes("if(isLenguArcadeEmbeddedMode()) return;") ||
    !gameHtml.includes("getSafeHubPlayer") ||
    !gameHtml.includes("Conectando con tu perfil de LenguArcade") ||
    gameHtml.includes("pgarciab")) {
  errors.push("BattleGrafia debe aislar los guardados locales por alumno cuando se abre desde LenguArcade.");
}

const menuHtml = fs.readFileSync(path.join(root, "menu.html"), "utf8");
if (!menuHtml.includes("bg-game-notice") ||
    menuHtml.includes("alert('No tienes ninguna partida guardada") ||
    menuHtml.includes('alert("Elige modo primero')) {
  errors.push("BattleGrafia debe mostrar avisos de menu dentro del juego, no con alertas del navegador.");
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