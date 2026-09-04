import fs from "node:fs";
import path from "node:path";

const appsDir=path.resolve("apps-script");
const entries=fs.readdirSync(appsDir);

const legacy=entries.filter(name=>/^zz/i.test(name));
if(legacy.length){
  throw new Error("Arquitectura: siguen existiendo capas zz: "+legacy.join(", "));
}

for(const required of [
  "LenguArcade_Code.gs",
  "LenguArcade_Auth.gs",
  "LenguArcade_Workshop.gs",
  "LenguArcade_Roster.gs",
  "LenguArcade_Classroom.gs",
  "LenguArcade_Alumno.html",
  "LenguArcade_Profesor.html",
]){
  if(!entries.includes(required)) throw new Error("Arquitectura: falta "+required);
}

const gsSources=entries
  .filter(name=>name.endsWith(".gs"))
  .map(name=>fs.readFileSync(path.join(appsDir,name),"utf8"))
  .join("\n");

for(const forbidden of [
  "_BASE_BUILD_HTML_OUTPUT_",
  "ORIGINAL_BUILD_HTML_OUTPUT_",
  "ClientPatch_",
  "buildLenguArcadeHtmlOutput_ = function",
]){
  if(gsSources.includes(forbidden)) throw new Error("Arquitectura: queda una cadena de parche dinámica: "+forbidden);
}

const student=fs.readFileSync(path.join(appsDir,"LenguArcade_Alumno.html"),"utf8");
const teacher=fs.readFileSync(path.join(appsDir,"LenguArcade_Profesor.html"),"utf8");
for(const marker of [
  "__LA_GOOGLE_LOGIN_CONSOLIDATED__",
  "la-workshop-access-style",
  "la-workshop-session-style",
  "la-screen-navigation-style",
  "__LA_ENTRE_LINEAS_STUDENT_PATCH__",
]){
  if(!student.includes(marker)) throw new Error("Arquitectura: alumno no contiene "+marker);
}
for(const marker of [
  'id="gestion"',
  "la-workshop-access-style",
  "la-workshop-session-style",
  "la-screen-navigation-style",
  "__LA_TEACHER_DIRECT_ACCESS_PATCH__",
  "__LA_RAYUELA_TEACHER_PATCH__",
  "__LA_ENTRE_LINEAS_TEACHER_PATCH__",
]){
  if(!teacher.includes(marker)) throw new Error("Arquitectura: profesor no contiene "+marker);
}

console.log("Arquitectura LenguArcade consolidada: sin capas zz ni inyección dinámica de HTML.");
