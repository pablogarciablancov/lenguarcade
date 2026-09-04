import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appsPath = path.join(root, "apps-script", "LenguArcade_Roster.gs");
const teacherPath = path.join(root, "apps-script", "LenguArcade_Profesor.html");
const edgePath = path.join(root, "supabase", "functions", "teacher-roster-management", "index.ts");
const migrationPath = path.join(root, "supabase", "migrations", "202609040003_roster_archive_metadata.sql");

const apps = fs.readFileSync(appsPath, "utf8");
const teacher = fs.readFileSync(teacherPath, "utf8");
const edge = fs.readFileSync(edgePath, "utf8");
const migration = fs.readFileSync(migrationPath, "utf8");

new Function(apps);
for (const match of teacher.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
  new Function(match[1]);
}

for (const marker of [
  "applyRosterBackupAction",
  "archivoMotivo",
  "archivoClase",
  "rosterEnsureStudentArchiveColumns_",
]) {
  if (!apps.includes(marker)) throw new Error(`Falta lógica legacy de gestión: ${marker}`);
}

for (const marker of [
  'id="gestion"',
  "Gestión de clases y alumnado",
  "archiveStudent",
  "restoreStudent",
  "deleteStudent",
  "archiveClass",
  "restoreClass",
  "deleteClass",
  "ELIMINAR",
  "teacher-roster-management",
]) {
  if (!teacher.includes(marker)) throw new Error(`Falta interfaz consolidada de gestión: ${marker}`);
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

console.log("Gestión de clases y alumnado: arquitectura consolidada correcta.");
