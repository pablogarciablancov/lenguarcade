import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const catalogPath=path.join(root,"config","game-catalog.json");
const appsPath=path.join(root,"apps-script","LenguArcade_GameCatalog.gs");
const sqlPath=path.join(root,"supabase","catalog","game-catalog.sql");
const checkOnly=process.argv.includes("--check");

function fail(message){
  console.error("❌ Catálogo LenguArcade: "+message);
  process.exit(1);
}
function sql(value){
  if(value===null||value===undefined)return "null";
  if(typeof value==="boolean")return value?"true":"false";
  if(typeof value==="number")return String(value);
  return "'"+String(value).replaceAll("'","''")+"'";
}
function js(value){ return JSON.stringify(value); }
function loadCatalog(){
  if(!fs.existsSync(catalogPath))fail("falta config/game-catalog.json");
  const catalog=JSON.parse(fs.readFileSync(catalogPath,"utf8"));
  if(catalog.schema!=="lenguarcade-game-catalog-v1")fail("schema no reconocido");
  if(!Number.isInteger(catalog.version)||catalog.version<1)fail("version inválida");
  if(!/^https:\/\//.test(catalog.hostingBase||""))fail("hostingBase debe ser HTTPS");
  if(!Array.isArray(catalog.games)||!catalog.games.length)fail("games debe contener entradas");
  const ids=new Set();
  const officialOrders=new Set();
  for(const game of catalog.games){
    if(!/^[a-z0-9_]+$/.test(game.id||""))fail("gameId inválido: "+game.id);
    if(ids.has(game.id))fail("gameId duplicado: "+game.id);
    ids.add(game.id);
    for(const key of ["name","subtitle","category","status","color","icon","description","banner","integration"]){
      if(typeof game[key]!=="string")fail(game.id+": campo "+key+" inválido");
    }
    if(!Array.isArray(game.competencies))fail(game.id+": competencies debe ser array");
    if(!Number.isInteger(game.sortOrder))fail(game.id+": sortOrder inválido");
    if(typeof game.active!=="boolean"||typeof game.official!=="boolean")fail(game.id+": active/official inválido");
    if(!["embedded","external","none"].includes(game.integration))fail(game.id+": integration inválida");
    if(game.official){
      if(officialOrders.has(game.sortOrder))fail("sortOrder oficial duplicado: "+game.sortOrder);
      officialOrders.add(game.sortOrder);
    }
    if(game.entry){
      if(game.entry.startsWith("/")||game.entry.includes(".."))fail(game.id+": entry no segura");
      const local=path.join(root,game.entry);
      if(!fs.existsSync(local))fail(game.id+": no existe "+game.entry);
      if(!fs.existsSync(path.join(local,"index.html")))fail(game.id+": falta index.html en "+game.entry);
    }
    if(game.integration==="embedded"&&!game.entry)fail(game.id+": embedded necesita entry");
  }
  const official=catalog.games.filter(game=>game.official);
  if(official.length!==10)fail("debe haber exactamente 10 juegos oficiales; hay "+official.length);
  return catalog;
}
function resolvedGame(catalog,game){
  return {...game,url:game.entry?catalog.hostingBase+game.entry:""};
}
function renderApps(catalog){
  const all=catalog.games.map(game=>resolvedGame(catalog,game));
  const rows=all.map(game=>"  {gameId:"+js(game.id)+",nombre:"+js(game.name)+",subtitulo:"+js(game.subtitle)+",categoria:"+js(game.category)+",competencias:"+js(game.competencies.join(","))+",estado:"+js(game.status)+",orden:"+game.sortOrder+",color:"+js(game.color)+",icono:"+js(game.icon)+",url:"+js(game.url)+",descripcion:"+js(game.description)+",banner:"+js(game.banner)+",activo:"+game.active+",integration:"+js(game.integration)+",official:"+game.official+"}");
  return "/** AUTO-GENERATED from config/game-catalog.json. DO NOT EDIT BY HAND. */\n"+
    "const LA_GAME_CATALOG_VERSION = "+catalog.version+";\n"+
    "const LA_ALL_GAMES = [\n"+rows.join(",\n")+"\n];\n"+
    "const LA_OFFICIAL_GAMES = LA_ALL_GAMES.filter(function(game){ return game.official !== false; });\n";
}
function renderSql(catalog){
  const all=catalog.games.map(game=>resolvedGame(catalog,game));
  const values=all.map(game=>"  ("+[
    "sql(game.id)","sql(game.name)","sql(game.subtitle)","sql(game.category)","sql(game.status)",
    "sql(game.sortOrder)","sql(game.color)","sql(game.icon)","sql(game.url)","sql(game.banner)",
    "sql(game.active)","sql(game.description)","sql(game.competencies.join(\",\"))","sql(game.integration)","sql(game.official)"
  ].join("+","+")+")").join(",\n");
  return "-- AUTO-GENERATED from config/game-catalog.json. DO NOT EDIT BY HAND.\n"+
    "insert into public.games\n"+
    "  (id,name,subtitle,category,status,sort_order,color,icon,url,banner,active,description,competencies,integration,official,updated_at)\n"+
    "values\n"+values+"\n"+
    "on conflict (id) do update set\n"+
    "  name=excluded.name,\n"+
    "  subtitle=excluded.subtitle,\n"+
    "  category=excluded.category,\n"+
    "  status=excluded.status,\n"+
    "  sort_order=excluded.sort_order,\n"+
    "  color=excluded.color,\n"+
    "  icon=excluded.icon,\n"+
    "  url=excluded.url,\n"+
    "  banner=excluded.banner,\n"+
    "  active=excluded.active,\n"+
    "  description=excluded.description,\n"+
    "  competencies=excluded.competencies,\n"+
    "  integration=excluded.integration,\n"+
    "  official=excluded.official,\n"+
    "  updated_at=now();\n";
}
function checkOrWrite(file,expected,label){
  if(checkOnly){
    if(!fs.existsSync(file))fail("falta generado: "+label);
    const current=fs.readFileSync(file,"utf8");
    if(current!==expected)fail(label+" no está sincronizado. Ejecuta: npm run catalog:sync");
  }else{
    fs.mkdirSync(path.dirname(file),{recursive:true});
    fs.writeFileSync(file,expected,"utf8");
  }
}
const catalog=loadCatalog();
checkOrWrite(appsPath,renderApps(catalog),"apps-script/LenguArcade_GameCatalog.gs");
checkOrWrite(sqlPath,renderSql(catalog),"supabase/catalog/game-catalog.sql");
console.log("Catálogo LenguArcade OK: "+catalog.games.filter(g=>g.official).length+" oficiales, "+catalog.games.length+" entradas totales.");
