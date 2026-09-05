import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const code=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Code.gs"),"utf8");
const auth=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Auth.gs"),"utf8");
const dashboard=fs.readFileSync(path.join(root,"supabase","functions","student-dashboard","index.ts"),"utf8");
const student=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Alumno.html"),"utf8");
const migration=fs.readFileSync(path.join(root,"supabase","migrations","202609050001_official_game_catalog.sql"),"utf8");

const official=[
  ["battlegrafia","Battlegrafía","en pruebas"],
  ["maniacgrafia","Maniacgrafía","listo"],
  ["narratoria","Narratoria","listo"],
  ["versopolis","Versópolis","en revisión"],
  ["scrabble","Scrabble","listo"],
  ["conjuga_apuesta","Conjuga y apuesta","en revisión"],
  ["verb_battle","Batalla verbal","en revisión"],
  ["rayuela","Rayuela","en pruebas"],
  ["entre_lineas","Entre Líneas","en pruebas"],
  ["tower_defense","Tower Defense","en revisión"],
];

for(const [id,name,status] of official){
  if(!code.includes(`gameId:'${id}'`)) throw new Error(`Catálogo Apps Script: falta ${id}`);
  if(!code.includes(`nombre:'${name}'`)) throw new Error(`Catálogo Apps Script: nombre incorrecto para ${id}`);
  if(!code.includes(`estado:'${status}'`)) throw new Error(`Catálogo Apps Script: estado incorrecto para ${id}`);
  if(!migration.includes(`('${id}'`)) throw new Error(`Migración Supabase: falta ${id}`);
  if(!migration.includes(`'${status}'`)) throw new Error(`Migración Supabase: falta estado ${status}`);
}

if(code.includes("Rimópolis") || code.includes("rimopolis") ||
   dashboard.includes("Rimópolis") || dashboard.includes("rimopolis") ||
   student.includes("Rimópolis") || student.includes("rimopolis")) {
  throw new Error("Rimópolis no debe existir en el código activo de LenguArcade.");
}
if(fs.existsSync(path.join(root,"apps-script","Rimopolis_Alumno.html")) ||
   fs.existsSync(path.join(root,"games","rimopolis"))) {
  throw new Error("Rimópolis no debe conservar archivos o carpetas activas en el proyecto.");
}
if(!dashboard.includes("function isLockedStatus") || !dashboard.includes('"en revisión"')){
  throw new Error("El dashboard debe bloquear juegos en revisión.");
}
if(!code.includes("function isGameLockedStatus_") || !code.includes("LA_OFFICIAL_GAMES")){
  throw new Error("Apps Script debe usar el catálogo oficial y su regla de bloqueo.");
}
if(!auth.includes("LA_OFFICIAL_GAMES.forEach")){
  throw new Error("El catálogo legacy debe sincronizarse desde la lista oficial.");
}
if(!student.includes("20260905-catalog10-clean") || !auth.includes("public_meta_v05_catalog10")){
  throw new Error("La retirada de Rimópolis debe invalidar las cachés antiguas del catálogo.");
}
if(!student.includes("rayuela:'rayuela-banner.jpg'") ||
   !student.includes("entre_lineas:'entre-lineas-banner.jpg'")){
  throw new Error("Rayuela y Entre Líneas deben usar portadas específicas, no el banner genérico.");
}

const ids=[...code.matchAll(/gameId:'([a-z_]+)'/g)].map(match=>match[1]);
const officialIds=official.map(row=>row[0]);
for(const id of officialIds){
  if(!ids.includes(id)) throw new Error(`No se encontró ${id}`);
}

console.log("Catálogo oficial LenguArcade: 10 juegos, identidades y estados correctos.");
