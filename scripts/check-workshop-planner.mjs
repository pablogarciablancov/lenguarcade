import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(".");
const html = fs.readFileSync(path.join(root, "apps-script", "LenguArcade_Profesor.html"), "utf8");
const server = fs.readFileSync(path.join(root, "apps-script", "LenguArcade_Workshop.gs"), "utf8");
const errors = [];

function expect(condition, message) {
  if (!condition) errors.push(message);
}

for (const fn of [
  "getWorkshopPlannerAdmin",
  "saveWorkshopPlan",
  "deleteWorkshopPlan",
  "activateWorkshopPlan",
  "closeWorkshopPlannerSession",
  "retireWorkshopPlannerSession",
]) {
  expect(server.includes(`function ${fn}(`), `Falta la función pública ${fn}.`);
}

expect(server.includes("SHEET: 'TallerPlanes'"), "Las sesiones preparadas deben persistir en TallerPlanes.");
expect(server.includes("'plannedAt'"), "Las sesiones preparadas deben admitir una fecha prevista.");
expect(server.includes("planId:String(payload.planId || '')"), "La sesión activa debe conservar el planId de origen.");
expect(
  /function normalizeWorkshopScope_\([^)]*\)\s*\{[\s\S]*?return scope;\s*\}/.test(server) &&
    !/function normalizeWorkshopScope_\([^)]*\)\s*\{[\s\S]*?SHEETS\.CLASES/.test(server),
  "Taller no debe validar las clases contra la hoja legacy Clases.",
);

const savePlan = server.match(/function saveWorkshopPlan\([^)]*\)\s*\{[\s\S]*?\n\}/)?.[0] || "";
expect(!savePlan.includes("saveWorkshopSession("), "Guardar una preparación no debe publicarla ni abrirla.");

const activatePlan = server.match(/function activateWorkshopPlan\([^)]*\)\s*\{[\s\S]*?\n\}/)?.[0] || "";
expect(activatePlan.includes("applyWorkshopPlanAccess_"), "Abrir una sesión debe ajustar automáticamente los juegos disponibles.");
expect(activatePlan.includes("saveWorkshopSession("), "Abrir una sesión debe convertir la preparación en sesión publicada.");
expect(activatePlan.includes("classroomOpen:!!openNow"), "La activación debe distinguir abrir en clase de publicar solo para casa.");

expect(html.includes("Taller · Preparar sesiones"), "El panel debe presentar Taller como preparador de sesiones.");
expect(html.includes("Sesiones preparadas"), "Debe existir una biblioteca de sesiones preparadas.");
expect(html.includes("Guardar preparación"), "Debe quedar claro que guardar no publica.");
expect(html.includes("Guardar y abrir ahora"), "Debe existir una acción directa para abrir la sesión en clase.");
expect(html.includes("Guardar y activar horario de casa"), "Debe existir una acción explícita para el acceso programado en casa.");
expect(html.includes("Ajustes avanzados de disponibilidad"), "El control manual de juegos debe quedar relegado a ajustes avanzados.");
expect(html.includes("No necesitas tocar esto para preparar una sesión."), "Los ajustes avanzados deben explicar que no son el flujo principal.");
expect(!html.includes("Control del taller"), "No debe sobrevivir el antiguo encabezado ambiguo Control del taller.");
expect(!html.includes("Todas las clases · regla general"), "El planificador no debe ofrecer una regla general como si fuera una clase.");

// Prueba funcional aislada del ciclo principal del planificador.
// Se ejecuta el módulo de Apps Script con dobles mínimos de Sheets/Session/Utilities.
const sheets = {};
class MockSheet {
  constructor(name) {
    this.name = name;
    this.headers = [];
    this.rows = [];
  }
  deleteRow(rowNumber) {
    this.rows.splice(rowNumber - 2, 1);
  }
}
const context = {
  console,
  getDb_: () => ({
    getSheetByName: (name) => sheets[name] || (sheets[name] = new MockSheet(name)),
  }),
  ensureSheetHeaders_: (ss, name, headers) => {
    ss.getSheetByName(name).headers = [...headers];
  },
  ensureSheets_: () => {},
  rowsToObjects_: (sheet) => sheet.rows.map((row) => ({ ...row })),
  upsertByKeys_: (sheet, keys, record) => {
    const index = sheet.rows.findIndex((row) =>
      keys.every((key) => String(row[key] ?? "") === String(record[key] ?? "")),
    );
    if (index >= 0) sheet.rows[index] = { ...sheet.rows[index], ...record };
    else sheet.rows.push({ ...record });
  },
  requireActiveGoogleEmail_: () => "teacher@fomento.edu",
  isTeacherGoogleEmail_: () => true,
  isTeacherAllowed_: () => true,
  getActiveGames_: () => [
    { gameId:"g1", nombre:"Juego 1", activo:true },
    { gameId:"g2", nombre:"Juego 2", activo:true },
    { gameId:"g3", nombre:"Juego 3", activo:true },
  ],
  decorateGameIntegration_: (game) => game,
  findGame_: (id) => context.getActiveGames_().find((game) => game.gameId === id),
  nowIso_: () => "2026-09-09T16:00:00.000Z",
  SpreadsheetApp: { flush: () => {} },
  Session: { getScriptTimeZone: () => "Europe/Madrid" },
  Utilities: {
    getUuid: () => "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    formatDate: () => "2026-09-09T18:00",
  },
  LA_CONFIG: { SHEETS:{ CLASES:"Clases" } },
  getSheet_: (name) => context.getDb_().getSheetByName(name),
  isTrue_: (value) => Boolean(value),
  isStudentGoogleEmail_: () => false,
  findStudentByEmail_: () => null,
  ensureTeacherPlayerStudent_: () => ({ studentId:"teacher", clase:"C1" }),
};
vm.createContext(context);
vm.runInContext(server, context);

const saved = context.saveWorkshopPlan("C1", {
  title:"Taller 1",
  message:"Practica",
  targetXp:100,
  plannedAt:"2026-09-15T10:00",
  homeEnabled:true,
  homeStart:"2026-09-15T18:00",
  homeEnd:"2026-09-15T20:00",
  gameIds:["g1","g3"],
});
const planId = saved.savedPlanId;
const beforeSession = context.getWorkshopPlannerAdmin("C1");
const active = context.activateWorkshopPlan("C1", planId, true);
const accessAfterOpen = context.buildWorkshopAccessState_("C1");
const closed = context.closeWorkshopPlannerSession("C1");
const retired = context.retireWorkshopPlannerSession("C1");
const accessAfterRetire = context.buildWorkshopAccessState_("C1");

expect(saved.plans.length === 1, "Guardar debe crear una preparación persistente.");
expect(beforeSession.activeSession === null, "Guardar una preparación no debe publicar una sesión.");
expect(active.activeSession?.published === true, "Abrir una preparación debe publicarla.");
expect(active.activeSession?.classroomOpen === true, "Abrir ahora debe habilitar la sesión en clase.");
expect(active.activeSession?.planId === planId, "La sesión activa debe conservar su planId.");
expect(
  accessAfterOpen.games.filter((game) => game.enabled).map((game) => game.gameId).join(",") === "g1,g3",
  "Abrir debe dejar disponibles exactamente los juegos de la preparación.",
);
expect(
  closed.activeSession?.published === true && closed.activeSession?.classroomOpen === false,
  "Cerrar clase debe mantener la sesión publicada pero cerrar el acceso presencial.",
);
expect(closed.activeSession?.homeEnabled === true, "Cerrar clase debe conservar el horario de casa.");
expect(retired.activeSession?.published === false, "Retirar debe despublicar la sesión.");
expect(accessAfterRetire.games.every((game) => !game.enabled), "Retirar debe cerrar todos los juegos de la clase.");

for (const call of [
  "getWorkshopPlannerAdmin",
  "saveWorkshopPlan",
  "deleteWorkshopPlan",
  "activateWorkshopPlan",
  "closeWorkshopPlannerSession",
  "retireWorkshopPlannerSession",
]) {
  expect(html.includes(`sessionCall('${call}'`), `La interfaz no invoca ${call}.`);
}

if (errors.length) {
  throw new Error(`Comprobaciones del planificador de Taller fallidas:\n- ${errors.join("\n- ")}`);
}

console.log("Planificador de Taller correcto: sesiones preparadas, activación explícita y permisos automáticos.");
