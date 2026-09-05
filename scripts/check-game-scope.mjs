import { execFileSync } from "node:child_process";

const branchName=process.env.BRANCH_NAME || process.env.GITHUB_HEAD_REF || "";
const baseSha=process.env.BASE_SHA || process.env.GITHUB_BASE_SHA || "HEAD^";
const headSha=process.env.HEAD_SHA || process.env.GITHUB_SHA || "HEAD";

function fail(message){
  console.error("\n❌ LenguArcade concurrent-game guard\n"+message+"\n");
  process.exit(1);
}

if(!branchName.startsWith("game/")){
  console.log("Concurrent-game guard: rama de integración o rama general; sin restricciones de juego individual.");
  process.exit(0);
}

const parts=branchName.split("/");
if(parts.length<2 || !parts[1]) fail("Usa ramas con formato game/<gameId>/<cambio>.");
const gameId=parts[1];
const gameIdDash=gameId.replaceAll("_","-");
const gameIdUnderscore=gameId.replaceAll("-","_");

let changed=[];
try{
  changed=execFileSync("git",["diff","--name-only",baseSha+"..."+headSha],{encoding:"utf8"})
    .split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
}catch(error){
  fail("No se pudo calcular el diff de la rama. "+(error?.message||error));
}

const sharedCore=new Set([
  "apps-script/LenguArcade_Alumno.html",
  "apps-script/LenguArcade_Code.gs",
  "apps-script/LenguArcade_Auth.gs",
  "supabase/functions/student-dashboard/index.ts",
  "supabase/functions/save-progress/index.ts",
  "package.json",
  "scripts/check-game-catalog.mjs",
  "docs/CAMBIOS.md",
  "docs/PRUEBAS.md",
  ".clasp.json",
  "scripts/publish-apps-script.ps1"
]);

const allowedExact=new Set([
  "scripts/check-"+gameId+".mjs",
  "scripts/check-"+gameIdDash+".mjs",
  "scripts/check-"+gameIdUnderscore+".mjs",
  "docs/game-notes/"+gameId+".md",
  "docs/game-notes/"+gameIdDash+".md",
  "docs/game-notes/"+gameIdUnderscore+".md"
]);

function migrationBelongsToGame(path){
  if(!path.startsWith("supabase/migrations/")) return false;
  const name=path.toLowerCase();
  return [gameId,gameIdDash,gameIdUnderscore].some(id=>name.includes(id.toLowerCase()));
}

function allowed(path){
  if(path.startsWith("games/"+gameId+"/")) return true;
  if(path.startsWith("docs/game-notes/"+gameId+"/")) return true;
  if(allowedExact.has(path)) return true;
  if(migrationBelongsToGame(path)) return true;
  return false;
}

const coreHits=changed.filter(path=>sharedCore.has(path));
if(coreHits.length){
  fail("La rama "+branchName+" intenta modificar el núcleo compartido:\n- "+coreHits.join("\n- ")+"\n\nLos chats de un juego NO deben tocar catálogo, runner, Apps Script central ni despliegues. Guarda la necesidad de integración en games/<gameId>/lenguarcade.integration.json y hazla después desde una rama integration/<fecha>.");
}

const gameDirs=[...new Set(changed.map(path=>path.match(/^games\/([^/]+)\//)?.[1]).filter(Boolean))];
const foreignGames=gameDirs.filter(id=>id!==gameId);
if(foreignGames.length){
  fail("La rama de "+gameId+" también modifica otros juegos: "+foreignGames.join(", ")+".");
}

const outside=changed.filter(path=>!allowed(path));
if(outside.length){
  fail("La rama "+branchName+" contiene archivos fuera de su ámbito:\n- "+outside.join("\n- ")+"\n\nÁmbito permitido: games/"+gameId+"/, comprobaciones propias, notas propias y migraciones cuyo nombre incluya "+gameId+".");
}

console.log("✅ Rama aislada correctamente: "+branchName);
console.log("Juego: "+gameId);
console.log("Archivos comprobados: "+changed.length);
