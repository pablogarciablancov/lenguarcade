import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(".");
const html = fs.readFileSync(path.join(root, "apps-script", "LenguArcade_Profesor.html"), "utf8");
const studentHtml = fs.readFileSync(path.join(root, "apps-script", "LenguArcade_Alumno.html"), "utf8");
const server = fs.readFileSync(path.join(root, "apps-script", "LenguArcade_Workshop.gs"), "utf8");
const teacherDashboard = fs.readFileSync(path.join(root, "supabase", "functions", "teacher-dashboard", "index.ts"), "utf8");
const studentDashboard = fs.readFileSync(path.join(root, "supabase", "functions", "student-dashboard", "index.ts"), "utf8");
const saveProgress = fs.readFileSync(path.join(root, "supabase", "functions", "save-progress", "index.ts"), "utf8");
const workshopAccessMigration = fs.readFileSync(path.join(root, "supabase", "migrations", "20260924191500_add_workshop_game_access.sql"), "utf8");
const workshopSessionMigration = fs.readFileSync(path.join(root, "supabase", "migrations", "20260924204500_add_class_workshop_sessions.sql"), "utf8");
const errors = [];

function expect(condition, message) {
  if (!condition) errors.push(message);
}

for (const fn of [
  "getWorkshopPlannerAdmin",
  "saveWorkshopPlan",
  "saveWorkshopPlanFast",
  "saveAndActivateWorkshopPlan",
  "deleteWorkshopPlan",
  "activateWorkshopPlan",
  "closeWorkshopPlannerSession",
  "retireWorkshopPlannerSession",
]) {
  expect(server.includes(`function ${fn}(`), `Falta la función pública ${fn}.`);
}

expect(server.includes("SHEET: 'TallerPlanes'"), "Las sesiones preparadas deben persistir en TallerPlanes.");
expect(server.includes("'plannedAt'"), "Las sesiones preparadas deben admitir una fecha prevista.");
expect(
  server.includes("Object.prototype.toString.call(value) === '[object Date]'") &&
    server.includes("Utilities.formatDate(value, tz"),
  "El planificador debe aceptar fechas Date reales devueltas por Google Sheets.",
);
expect(html.includes("window.laCreateWorkshopPlan"), "Crear taller debe poder cargar primero el planificador si hace falta.");
expect(
  workshopAccessMigration.includes("workshop_game_access") &&
  workshopAccessMigration.includes("enable row level security"),
  "La migración histórica de permisos temporales debe seguir siendo segura.",
);
expect(
  workshopSessionMigration.includes("workshop_sessions") &&
  workshopSessionMigration.includes("classroom_id uuid primary key") &&
  workshopSessionMigration.includes("enable row level security") &&
  workshopSessionMigration.includes("revoke all"),
  "La sesión activa del Taller debe persistir una sola vez por clase y quedar protegida.",
);
expect(
  teacherDashboard.includes('action === "setWorkshopGameAccess"') &&
  teacherDashboard.includes('from("workshop_sessions")') &&
  !teacherDashboard.includes('from("workshop_game_access")'),
  "El panel docente debe sincronizar el Taller por clase, no materializar permisos por alumno.",
);
expect(
  studentDashboard.includes('from("workshop_sessions")') &&
  studentDashboard.includes('workshopSelectedGameIds') &&
  studentDashboard.includes('lockedByWorkshop'),
  "El panel del alumno debe derivar el acceso desde la sesión real de su clase.",
);
expect(
  saveProgress.includes('from("workshop_sessions")') &&
  saveProgress.includes('"workshop_game_access_closed"') &&
  !saveProgress.includes('from("workshop_game_access")'),
  "El guardado debe validar el Taller por la clase real del alumno.",
);
expect(
  html.includes("syncWorkshopSupabaseAccess") &&
  html.includes("setWorkshopGameAccess"),
  "El planificador debe sincronizar sus aperturas y cierres con Supabase.",
);
expect(
  studentHtml.includes("Object.prototype.hasOwnProperty.call(currentDashboard,'workshopSession')") &&
  studentHtml.includes("workshopSessionState={session:(currentDashboard&&currentDashboard.workshopSession)||null}") &&
  studentHtml.includes("Disponible en la sesión"),
  "El alumno debe usar la sesión de LenguArcade/Supabase y no la cuenta Google para resolver su Taller.",
);
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
expect(activatePlan.includes("ensureWorkshopSessionSheet_"), "Abrir una sesión debe persistir la sesión publicada sin releerla varias veces.");
expect(activatePlan.includes("classroomOpen:!!openNow"), "La activación debe distinguir abrir en clase de publicar solo para casa.");
expect(server.includes("function saveAndActivateWorkshopPlan("), "Guardar y abrir debe poder resolverse en una sola llamada de Apps Script.");

expect(html.includes("Talleres · Diseña y lanza sesiones"), "El panel debe presentar Talleres como planificador de sesiones.");
expect(
  html.includes("Tus talleres") &&
  html.includes("Próximos") &&
  html.includes("Borradores") &&
  html.includes("Realizados"),
  "Debe existir una biblioteca de talleres organizada por estado.",
);
expect(html.includes("Guardar preparación"), "Debe quedar claro que guardar no publica.");
expect(html.includes("Guardar y abrir ahora"), "Debe existir una acción directa para abrir la sesión en clase.");
expect(html.includes("Guardar y activar horario de casa"), "Debe existir una acción explícita para el acceso programado en casa.");
expect(
  server.includes("'classCodes'") &&
  server.includes("'usedByClass'") &&
  server.includes("workshopPlanClassCodes_") &&
  server.includes("workshopPlanUsedMap_"),
  "Una preparación debe poder compartirse entre varias clases sin mezclar el estado de realizado.",
);
expect(
  html.includes("Ruta LenguArcade · 8 talleres en continuidad") &&
  html.includes("WORKSHOP_ROUTE_PRESETS") &&
  html.includes("openWorkshopRoutePreset"),
  "Talleres debe incluir una ruta progresiva lista para seleccionar y activar.",
);
expect(
  html.includes('data-plan-class') &&
  html.includes("Seleccionar todas") &&
  html.includes("Compartir la preparación no abre el taller en todas a la vez"),
  "El editor debe permitir compartir una preparación entre varias clases.",
);
expect(
  html.includes("dangerPlan") &&
  html.includes("🗑 Eliminar taller"),
  "Eliminar taller debe mostrarse como una acción destructiva visible.",
);
expect(html.includes("Crear misión"), "Cada taller debe poder convertirse rápidamente en una misión.");
expect(html.includes("Sesión de juego") && html.includes("Reto de XP") && html.includes("Trabajo en casa"), "El editor de Taller debe ofrecer plantillas prácticas.");
expect(html.includes("Ajustes avanzados de disponibilidad"), "El control manual de juegos debe quedar relegado a ajustes avanzados.");
expect(html.includes("No necesitas tocar esto para preparar una sesión."), "Los ajustes avanzados deben explicar que no son el flujo principal.");
expect(
  html.includes('id="workshopAdvancedDetails"') &&
  html.includes("if(advanced&&advanced.open)loadTeacherWorkshopState"),
  "Los ajustes avanzados deben cargarse solo cuando el profesor los abre.",
);
expect(
  html.includes("saveWorkshopPlanFast") &&
  html.includes("saveAndActivateWorkshopPlan"),
  "El guardado del Taller debe usar las rutas rápidas y combinar guardar+abrir.",
);
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
  getLastRow() {
    return this.rows.length + 1;
  }
  getLastColumn() {
    return this.headers.length;
  }
  getRange(row, column, numRows, numCols) {
    const sheet = this;
    return {
      setValues(values) {
        if (row === 1) {
          sheet.headers = [...values[0]];
          return;
        }
        values.forEach((valuesRow, offset) => {
          const record = {};
          sheet.headers.forEach((header, index) => {
            record[header] = valuesRow[index] ?? "";
          });
          sheet.rows[row - 2 + offset] = record;
        });
      },
      clearContent() {
        const start = Math.max(0, row - 2);
        sheet.rows.splice(start, numRows || 1);
      },
      getValues() {
        if (row === 1) return [sheet.headers.slice(column - 1, column - 1 + numCols)];
        const values = [];
        for (let i = 0; i < numRows; i++) {
          const record = sheet.rows[row - 2 + i] || {};
          values.push(sheet.headers.slice(column - 1, column - 1 + numCols).map((header) => record[header] ?? ""));
        }
        return values;
      },
    };
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
  getHeaders_: (sheet) => [...sheet.headers],
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

let sheetDateAccepted = false;
try {
  sheetDateAccepted = context.workshopSessionNormalizeLocalDateTime_(new Date("2026-09-10T11:58:00.000Z")) === "2026-09-09T18:00";
} catch (error) {
  sheetDateAccepted = false;
}
expect(sheetDateAccepted, "Una fecha real de Google Sheets no debe romper la carga del planificador.");

const saved = context.saveWorkshopPlan("C1", {
  title:"Taller 1",
  message:"Practica",
  targetXp:100,
  plannedAt:"2026-09-15T10:00",
  homeEnabled:true,
  homeStart:"2026-09-15T18:00",
  homeEnd:"2026-09-15T20:00",
  gameIds:["g1","g3"],
  classCodes:["C1","C2"],
});
const planId = saved.savedPlanId;
const beforeSession = context.getWorkshopPlannerAdmin("C1");
const sharedBeforeC2 = context.getWorkshopPlannerAdmin("C2");
const active = context.activateWorkshopPlan("C1", planId, true);
const sharedAfterC2 = context.getWorkshopPlannerAdmin("C2");
const accessAfterOpen = context.buildWorkshopAccessState_("C1");
const closed = context.closeWorkshopPlannerSession("C1");
const retired = context.retireWorkshopPlannerSession("C1");
const accessAfterRetire = context.buildWorkshopAccessState_("C1");

expect(saved.plans.length === 1, "Guardar debe crear una preparación persistente.");
expect(saved.plans[0].classCodes.join(",") === "C1,C2", "La preparación debe conservar todas las clases seleccionadas.");
expect(sharedBeforeC2.plans.length === 1, "La misma preparación debe aparecer en la segunda clase sin duplicarla.");
expect(beforeSession.activeSession === null, "Guardar una preparación no debe publicar una sesión.");
expect(active.activeSession?.published === true, "Abrir una preparación debe publicarla.");
expect(active.activeSession?.classroomOpen === true, "Abrir ahora debe habilitar la sesión en clase.");
expect(active.activeSession?.planId === planId, "La sesión activa debe conservar su planId.");
expect(active.plans[0].usedAt, "La clase que activa el Taller debe marcarlo como realizado.");
expect(!sharedAfterC2.plans[0].usedAt, "Activar el Taller en una clase no debe marcarlo como realizado en las demás.");
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
  "saveWorkshopPlanFast",
  "saveAndActivateWorkshopPlan",
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
