import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve("apps-script");
const files = fs.readdirSync(root, { withFileTypes: true });
const serverSources = [];
const clientCalls = new Set();
const errors = [];
let checked = 0;

for (const entry of files) {
  if (!entry.isFile()) {
    continue;
  }

  const filePath = path.join(root, entry.name);
  const source = fs.readFileSync(filePath, "utf8");

  if (entry.name.endsWith(".gs") || entry.name.endsWith(".js")) {
    new Function(source);
    serverSources.push(source);
    checked += 1;
    continue;
  }

  if (entry.name.endsWith(".html")) {
    const ids = [...source.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    const referencedIds = [...source.matchAll(/\$\('([^']+)'\)/g)].map((match) => match[1]);
    const missingIds = [...new Set(referencedIds.filter((id) => !ids.includes(id)))];

    if (duplicateIds.length) {
      errors.push(`${entry.name}: IDs duplicados: ${[...new Set(duplicateIds)].join(", ")}`);
    }
    if (missingIds.length) {
      errors.push(`${entry.name}: IDs referenciados que no existen: ${missingIds.join(", ")}`);
    }

    for (const match of source.matchAll(/callServer\('([A-Za-z_$][\w$]*)'/g)) {
      clientCalls.add(match[1]);
    }

    const scripts = source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of scripts) {
      new Function(match[1]);
      checked += 1;
    }
  }
}

const serverSource = serverSources.join("\n");
const serverFunctions = [...serverSource.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map(
  (match) => match[1],
);
const publicFunctions = new Set(serverFunctions.filter((name) => !name.endsWith("_")));
const duplicateFunctions = serverFunctions.filter(
  (name, index) => serverFunctions.indexOf(name) !== index,
);
const missingServerFunctions = [...clientCalls].filter((name) => !publicFunctions.has(name));

if (duplicateFunctions.length) {
  errors.push(`Funciones duplicadas: ${[...new Set(duplicateFunctions)].join(", ")}`);
}
if (missingServerFunctions.length) {
  errors.push(`Llamadas sin función pública: ${missingServerFunctions.join(", ")}`);
}

for (const forbidden of [
  "setupLenguArcade",
  "setupLenguArcadeV03",
  "getStudentDashboard",
  "calculateStudentGrade",
]) {
  if (publicFunctions.has(forbidden)) {
    errors.push(`La función sensible ${forbidden} no puede ser pública.`);
  }
}

const professorHtml = fs.readFileSync(path.join(root, "LenguArcade_Profesor.html"), "utf8");
if (
  serverSource.includes("DEFAULT_TEACHER_PASSWORD") ||
  serverSource.includes("LenguArcade42") ||
  professorHtml.includes("LenguArcade42") ||
  professorHtml.includes('id="setupBtn"')
) {
  errors.push("El panel público del profesor expone credenciales o mantenimiento.");
}
if (!/function saveProgress\(payload\)[\s\S]*?requireSession_\(payload\.sessionToken,\s*'student'\)/.test(serverSource)) {
  errors.push("saveProgress debe exigir una sesión de alumno.");
}

if (!/function updateStudentAvatar\(token,\s*avatarConfig\)[\s\S]*?requireSession_\(token,\s*'student'\)/.test(serverSource)) {
  errors.push("updateStudentAvatar debe exigir una sesion de alumno.");
}
if (!/function normalizeStudentAvatar_\(avatarConfig\)[\s\S]*?LA_AVATAR_OPTIONS\[key\]\.indexOf\(value\)\s*<\s*0/.test(serverSource)) {
  errors.push("updateStudentAvatar debe validar todas las opciones del avatar.");
}
if (!/function loginStudent\(email,\s*pin\)[\s\S]*?normalizeStudentLoginEmail_\(email\)[\s\S]*?findStudentByEmail_\(cleanEmail\)/.test(serverSource)) {
  errors.push("El acceso del alumno debe buscar exclusivamente por correo institucional.");
}
if (!/function loginStudent\(email,\s*pin\)[\s\S]*?getStudentLoginThrottle_\(cleanEmail\)[\s\S]*?registerStudentLoginFailure_/.test(serverSource)) {
  errors.push("El acceso del alumno debe limitar los intentos fallidos.");
}
if (!/function getStudentsByClass\(classCode\)\s*\{\s*throw new Error/.test(serverSource) ||
    !/function getStudentsByClassV03\(classCode\)\s*\{\s*throw new Error/.test(serverSource)) {
  errors.push("Las listas publicas de alumnos deben permanecer desactivadas.");
}

const studentHtml = fs.readFileSync(path.join(root, "LenguArcade_Alumno.html"), "utf8");
if (!studentHtml.includes("mountSecureStudentLogin") ||
    !studentHtml.includes("@alumno.fomento.edu") ||
    !studentHtml.includes("body.authPending")) {
  errors.push("La vista del alumno debe quedar bloqueada por el acceso institucional.");
}

const publicStudentMatch = serverSource.match(/function publicStudent_\(s\)\s*\{([^}]+)\}/);
if (!publicStudentMatch || /\b(email|pin)\b/.test(publicStudentMatch[1])) {
  errors.push("El selector público de alumnos expone email o PIN.");
}

if (errors.length) {
  throw new Error(`Comprobaciones fallidas:\n- ${errors.join("\n- ")}`);
}

console.log(
  `Comprobaciones correctas: ${checked} bloques JavaScript, ${clientCalls.size} llamadas cliente-servidor y ${serverFunctions.length} funciones.`,
);
