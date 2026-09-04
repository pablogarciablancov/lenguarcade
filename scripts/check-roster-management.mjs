import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appsPath = path.join(root, "apps-script", "zzzzzzzzzzz_LenguArcade_roster_management.gs");
const edgePath = path.join(root, "supabase", "functions", "teacher-roster-management", "index.ts");

const apps = fs.readFileSync(appsPath, "utf8");
const edge = fs.readFileSync(edgePath, "utf8");

new Function(apps);

const patchStart = apps.indexOf("function getRosterManagementTeacherPatch_()");
const returnStart = apps.indexOf("return `", patchStart);
const returnEnd = apps.indexOf("`;", returnStart + 8);
if (patchStart < 0 || returnStart < 0 || returnEnd < 0) {
  throw new Error("No se ha podido localizar el parche de gestión de alumnado.");
}
const patch = apps.slice(returnStart + 8, returnEnd);
const scriptStart = patch.indexOf("<script>");
const scriptEnd = patch.indexOf("<\\/script>");
if (scriptStart < 0 || scriptEnd < 0) {
  throw new Error("El parche de gestión debe incluir un bloque script.");
}
new Function(patch.slice(scriptStart + 8, scriptEnd));

for (const marker of [
  "applyRosterBackupAction",
  "archiveStudent",
  "restoreStudent",
  "deleteStudent",
  "archiveClass",
  "restoreClass",
  "deleteClass",
  "Gestión de clases y alumnado",
  "ELIMINAR",
]) {
  if (!apps.includes(marker)) throw new Error(`Falta el marcador de gestión: ${marker}`);
}

for (const marker of [
  "requireTeacherSession",
  'action === "list"',
  'action === "archiveStudent"',
  'action === "restoreStudent"',
  'action === "deleteStudent"',
  'action === "archiveClass"',
  'action === "restoreClass"',
  'action === "deleteClass"',
  'confirmText !== "ELIMINAR"',
  '.eq("organization_id", organizationId)',
  '.eq("role", "student")',
]) {
  if (!edge.includes(marker)) throw new Error(`La Edge Function no protege correctamente: ${marker}`);
}

console.log("Gestión de clases y alumnado: comprobaciones correctas.");
