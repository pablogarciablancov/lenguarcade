import fs from "node:fs";
import path from "node:path";

const migrationPath = path.resolve(
  "supabase",
  "migrations",
  "202606120001_initial_lenguarcade.sql",
);
const sql = fs.readFileSync(migrationPath, "utf8");
const pinLogin = fs.readFileSync(
  path.resolve("supabase", "functions", "pin-login", "index.ts"),
  "utf8",
);
const errors = [];

for (const table of [
  "profiles",
  "app_sessions",
  "classrooms",
  "classroom_teachers",
  "classroom_enrollments",
  "games",
  "game_progress",
  "game_events",
  "achievement_definitions",
  "player_achievements",
  "game_saves",
  "game_errors",
  "classroom_grade_mappings",
  "grade_sync_queue",
]) {
  if (!new RegExp(`create table public\\.${table}\\b`, "i").test(sql)) {
    errors.push(`Falta la tabla public.${table}.`);
  }
  if (!new RegExp(`alter table public\\.${table} enable row level security`, "i").test(sql)) {
    errors.push(`Falta activar RLS en public.${table}.`);
  }
}

for (const helper of [
  "private.current_profile_id",
  "private.is_teacher_for_class",
  "private.can_access_profile",
]) {
  if (!sql.includes(`function ${helper}`)) {
    errors.push(`Falta la funcion de seguridad ${helper}.`);
  }
}

if (!sql.includes("create table private.profile_secrets")) {
  errors.push("Los hashes de PIN deben vivir fuera del esquema publico.");
}
if (!sql.includes("profile_id = private.current_profile_id()")) {
  errors.push("Los guardados deben limitarse al perfil de la sesion.");
}
if (!sql.includes("Authoritative aggregate progress")) {
  errors.push("El progreso evaluable debe quedar marcado como escritura de backend.");
}
if (!sql.includes("function public.establish_pin_session") ||
    !sql.includes("grant execute on function public.establish_pin_session") ||
    !sql.includes("to service_role")) {
  errors.push("El login por PIN debe ejecutarse exclusivamente con service_role.");
}
if (/\bservice_role\b.*(?:html|client|browser)/i.test(sql)) {
  errors.push("La migracion sugiere exponer service_role al navegador.");
}
if (!pinLogin.includes('Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")') ||
    !pinLogin.includes('userClient.auth.getUser()') ||
    !pinLogin.includes('adminClient.rpc("establish_pin_session"')) {
  errors.push("La Edge Function de PIN debe validar al usuario y delegar la sesion en el RPC seguro.");
}
if (pinLogin.includes("SUPABASE_SERVICE_ROLE_KEY=")) {
  errors.push("La Edge Function contiene una clave service_role incrustada.");
}

if (errors.length) {
  throw new Error(`Comprobacion de Supabase fallida:\n- ${errors.join("\n- ")}`);
}

console.log("Esquema inicial de Supabase comprobado: tablas, RLS y limites de escritura presentes.");
