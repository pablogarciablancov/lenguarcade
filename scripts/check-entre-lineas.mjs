import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root=path.resolve(process.cwd());
const gameDir=path.join(root,"games","entre_lineas");
const loader=fs.readFileSync(path.join(gameDir,"index.html"),"utf8");
for(let i=1;i<=4;i++){
  if(!loader.includes(`payload-${i}.b64`)) throw new Error(`Entre Líneas: falta payload-${i}.b64 en el loader`);
}
const encoded=[1,2,3,4]
  .map(i=>fs.readFileSync(path.join(gameDir,`payload-${i}.b64`),"utf8").trim())
  .join("");
const html=zlib.gunzipSync(Buffer.from(encoded,"base64")).toString("utf8");

const required=[
  "const GAME_ID='entre_lineas'",
  "lenguarcade-game",
  "lenguarcade-host",
  "postToHost('READY'",
  "postToHost('CHECKPOINT'",
  "postToHost('RESULT'",
  "msg.type==='INIT'",
  "msg.type==='REQUEST_EXIT'",
  "state.replay",
  "El aula vacía"
];
for(const token of required){
  if(!html.includes(token)) throw new Error(`Entre Líneas: falta marcador requerido: ${token}`);
}
if(!/function\s+sendBridgeResult\s*\(/.test(html)) throw new Error("Entre Líneas: falta sendBridgeResult()");
if(!/function\s+buildBridgeSave\s*\(/.test(html)) throw new Error("Entre Líneas: falta buildBridgeSave()");
console.log("✓ Entre Líneas: loader, expediente y puente LenguArcade verificados.");

const alumnoHost=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Alumno.html"),"utf8");
const teacherHost=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Profesor.html"),"utf8");
const codeHost=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Code.gs"),"utf8");
if(!alumnoHost.includes("__LA_ENTRE_LINEAS_STUDENT_PATCH__") || !alumnoHost.includes("buildCentralProgress")) {
  throw new Error("Entre Líneas: falta la integración consolidada del alumno.");
}
if(!teacherHost.includes("__LA_ENTRE_LINEAS_TEACHER_PATCH__") || !teacherHost.includes("diagnóstico lector")) {
  throw new Error("Entre Líneas: falta el diagnóstico consolidado del profesor.");
}
if(!codeHost.includes("gameId:'entre_lineas'") || !codeHost.includes("entre_lineas: {")) {
  throw new Error("Entre Líneas: falta el catálogo consolidado.");
}
console.log("✓ Entre Líneas: integración consolidada de alumno, profesor y catálogo verificada.");
