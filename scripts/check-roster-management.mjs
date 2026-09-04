import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appsPath = path.join(root, "apps-script", "zzzzzzzzzzz_LenguArcade_roster_management.gs");
const edgePath = path.join(root, "supabase", "functions", "teacher-roster-management", "index.ts");
const migrationPath = path.join(root, "supabase", "migrations", "202609040003_roster_archive_metadata.sql");

const apps = fs.readFileSync(appsPath, "utf8");
const edge = fs.readFileSync(edgePath, "utf8");
const migration = fs.readFileSync(migrationPath, "utf8");

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
  "archivoMotivo",
  "archivoClase",
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
  'archive_reason:"manual"',
  'archive_reason:"class"',
  '.eq("archive_reason", "class")',
]) {
  if (!edge.includes(marker)) throw new Error(`La Edge Function no protege correctamente: ${marker}`);
}

for (const marker of ["archived_at", "archive_reason", "archived_by_classroom_id"]) {
  if (!migration.includes(marker)) throw new Error(`Falta metadato de archivo en la migración: ${marker}`);
}

console.log("Gestión de clases y alumnado: comprobaciones correctas.");
