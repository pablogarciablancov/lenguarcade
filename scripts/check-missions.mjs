import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=(file)=>fs.readFileSync(path.join(root,file),"utf8");
const errors=[];

const migration=read("supabase/migrations/20260907075752_mission_board_management.sql");
const studentDashboard=read("supabase/functions/student-dashboard/index.ts");
const teacherDashboard=read("supabase/functions/teacher-dashboard/index.ts");
const studentHtml=read("apps-script/LenguArcade_Alumno.html");
const teacherHtml=read("apps-script/LenguArcade_Profesor.html");

[
  ["organización de misión","organization_id"],
  ["ámbito por clase","classroom_id"],
  ["misión destacada","featured"],
  ["prioridad de misión","priority"],
].forEach(([label,needle])=>{
  if(!migration.includes(needle))errors.push(`La migración no incluye ${label}.`);
});

[
  ["progreso de misión","function missionProgressValue("],
  ["objetivo de XP",'type === "xp"'],
  ["misiones por organización",'.eq("organization_id", organizationId)'],
  ["filtro por clase","classroomIds.has"],
  ["orden pendientes/completadas","a.completed !== b.completed"],
].forEach(([label,needle])=>{
  if(!studentDashboard.includes(needle))errors.push(`student-dashboard no cubre ${label}.`);
});

[
  ["guardar misión",'action === "saveMission"'],
  ["cerrar misión",'action === "archiveMission"'],
  ["validación de tipos","MISSION_TYPES"],
  ["resolución de clase","resolveMissionClassroom"],
  ["listado de misiones","missionsResult"],
].forEach(([label,needle])=>{
  if(!teacherDashboard.includes(needle))errors.push(`teacher-dashboard no cubre ${label}.`);
});

if(!studentHtml.includes("__LA_MISSION_BOARD_V1__")||!studentHtml.includes("Tablón de misiones")){
  errors.push("El alumno no tiene el tablón visual de misiones.");
}
if(!teacherHtml.includes("__LA_MISSION_MANAGER_V1__")||!teacherHtml.includes("Activas y programadas")){
  errors.push("El profesor no tiene el gestor visual de misiones.");
}
if(!teacherHtml.includes("Sesión del taller")){
  errors.push("La gestión de misiones no debe sustituir la Sesión del taller.");
}
if(teacherHtml.includes("missionRewardXp")||teacherHtml.includes("missionRewardFeathers")){
  errors.push("No se deben exponer recompensas hasta implementar cobro idempotente.");
}

if(errors.length){
  throw new Error("Comprobaciones de misiones fallidas:\n- "+errors.join("\n- "));
}
console.log("Misiones OK: gestor docente, ámbito por clase, tablón ordenado y progreso Supabase verificados.");
