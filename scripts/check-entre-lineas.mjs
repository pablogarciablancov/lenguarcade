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
