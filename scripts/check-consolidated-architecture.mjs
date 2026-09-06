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



const packageJson=JSON.parse(fs.readFileSync(path.resolve("package.json"),"utf8"));
for(const forbiddenScript of ["maniac:publish","scrabble:publish","battlegrafia:publish","apps:push"]){
  if(Object.prototype.hasOwnProperty.call(packageJson.scripts||{},forbiddenScript)){
    throw new Error("Arquitectura: comando de publicación obsoleto: "+forbiddenScript);
  }
}

for(const obsoletePath of [
  path.resolve("diagnostics"),
  path.resolve("shared"),
  path.resolve("assets","games"),
]){
  if(fs.existsSync(obsoletePath)){
    throw new Error("Arquitectura: sigue existiendo una carpeta obsoleta: "+path.relative(process.cwd(),obsoletePath));
  }
}

for(const gameId of ["battlegrafia","maniacgrafia","scrabble"]){
  const clasp=path.resolve("games",gameId,"apps-script",".clasp.json");
  if(fs.existsSync(clasp)){
    throw new Error("Arquitectura: "+gameId+" conserva una .clasp.json independiente.");
  }
}

for(const standalonePublisher of [
  "publish-battlegrafia.ps1",
  "publish-maniacgrafia.ps1",
  "publish-scrabble.ps1",
]){
  if(fs.existsSync(path.resolve("scripts",standalonePublisher))){
    throw new Error("Arquitectura: sigue existiendo el publicador independiente "+standalonePublisher);
  }
}

const centralSources=[
  fs.readFileSync(path.join(appsDir,"LenguArcade_Code.gs"),"utf8"),
  student,
  fs.readFileSync(path.resolve("supabase","functions","student-dashboard","index.ts"),"utf8"),
].join("\n");
const catalogSource=fs.readFileSync(path.resolve("config","game-catalog.json"),"utf8");
const generatedCatalog=fs.readFileSync(path.join(appsDir,"LenguArcade_GameCatalog.gs"),"utf8");
if(/raw(?:cdn)?\.githack\.com/i.test(centralSources+"\n"+catalogSource+"\n"+generatedCatalog)){
  throw new Error("Arquitectura: producción no debe volver a usar RawGitHack/RawCDN.");
}
if(centralSources.includes("pablogarciablancov.github.io/lenguarcade/games/")){
  throw new Error("Arquitectura: el núcleo no debe hardcodear URLs de juegos.");
}
if(!catalogSource.includes("https://pablogarciablancov.github.io/lenguarcade/") ||
   !generatedCatalog.includes("AUTO-GENERATED from config/game-catalog.json")){
  throw new Error("Arquitectura: falta la fuente canónica de catálogo o su salida generada.");
}

console.log("Arquitectura LenguArcade consolidada: núcleo único, catálogo canónico y publicación protegida.");
