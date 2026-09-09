import fs from "node:fs";
import path from "node:path";

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
