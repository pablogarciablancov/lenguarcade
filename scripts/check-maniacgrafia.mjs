import fs from "node:fs";
import path from "node:path";

const root = path.resolve("games", "maniacgrafia", "apps-script");
const errors = [];
let checked = 0;

for (const name of ["Code.js", "Alumno.html", "Profesor.html"]) {
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

const studentHtml = fs.readFileSync(path.join(root, "Alumno.html"), "utf8");
for (const required of [
  "lenguarcade-game",
  "notifyLenguArcadeSessionStarted",
  "notifyLenguArcadeResult",
  "sessionCorrect",
  "sessionErrors",
  "google.script.url.getLocation",
  "postToAncestors",
  "Cargando datos del perfil",
]) {
  if (!studentHtml.includes(required)) {
    errors.push(`Falta el componente de integración: ${required}`);
  }
}

if (studentHtml.includes("include('GameBridge')")) {
  errors.push("Alumno.html conserva una inclusión de plantilla que no funciona con createHtmlOutputFromFile.");
}

const serverSource = fs.readFileSync(path.join(root, "Code.js"), "utf8");
const teacherHtml = fs.readFileSync(path.join(root, "Profesor.html"), "utf8");
if (serverSource.includes("CAMBIA_ESTA_CLAVE") ||
    teacherHtml.includes("const TEACHER_TOKEN") ||
    !serverSource.includes("TEACHER_TOKEN_SHA256") ||
    !teacherHtml.includes('id="teacher-token"')) {
  errors.push("El panel de profesor de Maniacgrafía debe exigir una clave sin publicarla en el código.");
}

if (errors.length) {
  throw new Error(`Comprobaciones de Maniacgrafía fallidas:\n- ${errors.join("\n- ")}`);
}

console.log(`Maniacgrafía correcta: ${checked} bloques JavaScript comprobados.`);
