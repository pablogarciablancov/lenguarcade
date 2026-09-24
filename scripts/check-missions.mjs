import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const read=(file)=>fs.readFileSync(path.join(root,file),"utf8");
const errors=[];

const migration=read("supabase/migrations/20260907075752_mission_board_management.sql");
const statusMigration=read("supabase/migrations/20260924183000_add_mission_publication_status.sql");
const individualMigration=read("supabase/migrations/20260924190000_add_individual_mission_target.sql");
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
  ["objetivo de guardado",'type === "save"'],
  ["ámbito global legado",'rawGameId === "general"'],
  ["objetivo de XP",'type === "xp"'],
  ["misiones por organización",'.eq("organization_id", organizationId)'],
  ["filtro por clase","classroomIds.has"],
  ["orden pendientes/completadas","a.completed !== b.completed"],
  ["ventana temporal de misión","missionEvents"],
].forEach(([label,needle])=>{
  if(!studentDashboard.includes(needle))errors.push(`student-dashboard no cubre ${label}.`);
});

[
  ["guardar misión",'action === "saveMission"'],
  ["tipo misión guardado",'"save"'],
  ["cerrar misión",'action === "archiveMission"'],
  ["pausar o reanudar misión",'action === "setMissionStatus"'],
  ["estado de publicación","publication_status"],
  ["validación de tipos","MISSION_TYPES"],
  ["inicio automático de misiones nuevas","!mission.id && !activeFrom"],
  ["resolución de clase","resolveMissionClassroom"],
  ["listado de misiones","missionsResult"],
].forEach(([label,needle])=>{
  if(!teacherDashboard.includes(needle))errors.push(`teacher-dashboard no cubre ${label}.`);
});

if(!studentHtml.includes("__LA_MISSION_BOARD_V1__")||!studentHtml.includes("Tablón de misiones")){
  errors.push("El alumno no tiene el tablón visual de misiones.");
}
if(!teacherHtml.includes("__LA_MISSION_MANAGER_V2__")||
   !teacherHtml.includes("Misión rápida")||
   !teacherHtml.includes("Guardar borrador")){
  errors.push("El profesor no tiene el gestor visual de misiones V2.");
}
if(!statusMigration.includes("publication_status")||
   !statusMigration.includes("'draft'")||
   !statusMigration.includes("'paused'")||
   !statusMigration.includes("'closed'")){
  errors.push("La migración no registra los estados de publicación de las misiones.");
}
if(!teacherHtml.includes("if(existing)return existing")||
   /function ensureMissionManager\([^)]*\)\s*\{[\s\S]*?fillMissionEditor\(/.test(teacherHtml.match(/function ensureMissionManager\([^)]*\)\s*\{[\s\S]*?\n  \}/)?.[0]||"")){
  errors.push("El gestor de misiones debe montarse una sola vez y no llamarse recursivamente.");
}
if(!individualMigration.includes("target_profile_id")||
   !teacherDashboard.includes("resolveMissionStudent")||
   !studentDashboard.includes("mission.target_profile_id")||
   !teacherHtml.includes('id="missionStudent"')){
  errors.push("Las misiones individuales no están integradas de extremo a extremo.");
}
if(!teacherHtml.includes("Guardar progreso")){
  errors.push("El gestor docente no ofrece misiones de guardado.");
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
