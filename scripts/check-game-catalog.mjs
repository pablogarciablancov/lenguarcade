import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const catalog=JSON.parse(fs.readFileSync(path.join(root,"config","game-catalog.json"),"utf8"));
const generatedApps=fs.readFileSync(path.join(root,"apps-script","LenguArcade_GameCatalog.gs"),"utf8");
const code=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Code.gs"),"utf8");
const auth=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Auth.gs"),"utf8");
const student=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Alumno.html"),"utf8");
const dashboard=fs.readFileSync(path.join(root,"supabase","functions","student-dashboard","index.ts"),"utf8");
const snapshot=fs.readFileSync(path.join(root,"supabase","catalog","game-catalog.sql"),"utf8");
const canonicalMigration=fs.readFileSync(path.join(root,"supabase","migrations","202609060002_canonical_game_catalog.sql"),"utf8");

if(catalog.schema!=="lenguarcade-game-catalog-v1") throw new Error("Catálogo: schema canónico incorrecto.");
const official=catalog.games.filter(game=>game.official);
if(official.length!==10) throw new Error("Catálogo: deben existir exactamente 10 juegos oficiales.");

const ids=new Set();
for(const game of catalog.games){
  if(ids.has(game.id)) throw new Error("Catálogo: gameId duplicado "+game.id);
  ids.add(game.id);
  const url=game.entry ? catalog.hostingBase+game.entry : "";
  if(game.integration==="embedded"&&!url) throw new Error("Catálogo: "+game.id+" necesita URL embebida.");
  if(game.entry){
    const indexPath=path.join(root,game.entry,"index.html");
    if(!fs.existsSync(indexPath)) throw new Error("Catálogo: falta "+indexPath);
  }
  if(!generatedApps.includes("gameId:"+JSON.stringify(game.id))) throw new Error("Apps generado: falta "+game.id);
  if(!snapshot.includes("("+sqlLiteral(game.id)+",")) throw new Error("SQL generado: falta "+game.id);
}

function sqlLiteral(value){
  return "'"+String(value).replaceAll("'","''")+"'";
}

if(code.includes("const LA_OFFICIAL_GAMES") || code.includes("LA_GAME_INTEGRATIONS")){
  throw new Error("Apps Script central no debe contener una copia manual del catálogo.");
}
if(!generatedApps.includes("AUTO-GENERATED from config/game-catalog.json") ||
   !generatedApps.includes("const LA_OFFICIAL_GAMES")){
  throw new Error("Falta el catálogo generado de Apps Script.");
}
if(!auth.includes("LA_OFFICIAL_GAMES.forEach")){
  throw new Error("El respaldo legacy debe consumir el catálogo generado.");
}
if(dashboard.includes("const integrations") ||
   dashboard.includes("pablogarciablancov.github.io/lenguarcade/games/")){
  throw new Error("student-dashboard no debe contener un mapa o URLs de juegos hardcodeadas.");
}
for(const required of ["description,competencies,integration,official",'eq("official", true)',"integration = String(game.integration"]){
  if(!dashboard.includes(required)) throw new Error("student-dashboard no consume el catálogo completo: falta "+required);
}
if(student.includes("LA_EMBEDDED_GAME_OVERRIDES") ||
   student.includes("normalizeNarratoriaUrl") ||
   student.includes("pablogarciablancov.github.io/lenguarcade/games/")){
  throw new Error("El HTML del alumno no debe sobreescribir el catálogo central.");
}
for(const column of ["description","competencies","integration","official"]){
  if(!canonicalMigration.includes("add column if not exists "+column) &&
     !canonicalMigration.includes("add column if not exists "+column+" ")){
    throw new Error("Migración canónica: falta columna "+column);
  }
  if(!snapshot.includes(column)) throw new Error("Snapshot SQL: falta "+column);
}
if(catalog.games.find(game=>game.id==="battlegrafia_v2")?.active!==false ||
   catalog.games.find(game=>game.id==="battlegrafia_v2")?.official!==false){
  throw new Error("Battlegrafía 2.0 debe seguir aislada e inactiva.");
}
if(catalog.games.some(game=>/rim[oó]polis/i.test(game.id+" "+game.name)) ||
   code.includes("Rimópolis") || dashboard.includes("Rimópolis") || student.includes("Rimópolis")){
  throw new Error("Rimópolis no debe volver al catálogo activo.");
}

console.log("Catálogo canónico LenguArcade: 10 oficiales, una sola fuente y capas derivadas sincronizadas.");
