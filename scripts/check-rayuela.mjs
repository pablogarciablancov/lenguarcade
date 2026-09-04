import fs from 'node:fs';
import vm from 'node:vm';

const path = new URL('../games/rayuela/index.html', import.meta.url);
const html = fs.readFileSync(path, 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .filter(match => !/type=["']text\/plain/i.test(match[0]))
  .map(match => match[1]);

if (!scripts.length) throw new Error('Rayuela no contiene JavaScript ejecutable.');
for (const [index, code] of scripts.entries()) {
  new vm.Script(code, { filename:'rayuela-script-'+(index+1)+'.js' });
}

const checks = [
  ['game id', 'var GAME_ID="rayuela"'],
  ['cuadrícula inicial 9x9', 'grid:{rows:9,cols:9}'],
  ['bridge READY', 'postToHost("READY"'],
  ['bridge checkpoint', 'postToHost("CHECKPOINT"'],
  ['bridge result', 'postToHost("RESULT"'],
  ['inspector estructural', 'function validateStory('],
  ['métricas', 'function computeStats('],
  ['modo jugador', 'function startPlay('],
  ['feedback docente', 'function renderTeacherFeedback('],
  ['guardado local', 'localStorage'],
  ['accesibilidad de movimiento', 'prefers-reduced-motion'],
  ['brújula del autor', 'Brújula del autor'],
  ['entrega', 'sendSubmissionResult']
];
for (const [label, needle] of checks) {
  if (!html.includes(needle)) throw new Error('Rayuela: falta '+label+' ('+needle+')');
}
if (/\beval\s*\(/.test(html)) throw new Error('Rayuela no debe usar eval().');

const achievements = [...html.matchAll(/\{id:"[^"]+",icon:/g)].length;
if (achievements < 30) throw new Error('Rayuela: se esperaban al menos 30 logros; encontrados '+achievements);

const templates = (html.match(/data-template=/g) || []).length;
if (templates < 4) throw new Error('Rayuela: deben existir al menos cuatro plantillas de inicio.');

console.log('Rayuela OK · '+checks.length+' contratos · '+scripts.length+' script(s) compilados · '+achievements+' logros.');


const alumno = fs.readFileSync(path.resolve("apps-script","LenguArcade_Alumno.html"),"utf8");
const codeGs = fs.readFileSync(path.resolve("apps-script","LenguArcade_Code.gs"),"utf8");
const adapter = fs.readFileSync(path.resolve("apps-script","zzzzzzzzz_LenguArcade_rayuela.gs"),"utf8");
const evaluation = fs.readFileSync(path.resolve("supabase","functions","teacher-rayuela-evaluation","index.ts"),"utf8");
const dashboard = fs.readFileSync(path.resolve("supabase","functions","student-dashboard","index.ts"),"utf8");
const migrations = fs.readdirSync(path.resolve("supabase","migrations")).filter(name => name.includes("rayuela"));

if (!alumno.includes("gameRecord?.gameId==='rayuela'") || !alumno.includes("projectXp-Number(old.xp||0)")) {
  throw new Error("Rayuela: falta la integración de XP idempotente en el host del alumno.");
}
if (!codeGs.includes("rayuela: {") || !codeGs.includes("['rayuela','Rayuela'")) {
  throw new Error("Rayuela: falta el catálogo de Apps Script.");
}
if (!adapter.includes("teacher-rayuela-evaluation") || !adapter.includes("Comentarios por escena")) {
  throw new Error("Rayuela: falta la rúbrica específica del profesor.");
}
if (!evaluation.includes("nodeComments:cleanNodeComments(body.nodeComments)")) {
  throw new Error("Rayuela: la evaluación no conserva comentarios por escena.");
}
if (!dashboard.includes("evaluations:(evaluationsResult.data || [])")) {
  throw new Error("Rayuela: el alumno no recibiría el feedback docente.");
}
if (migrations.length !== 1) {
  throw new Error("Rayuela: debe existir exactamente una migración de alta; encontradas "+migrations.length+".");
}
console.log("Integración Rayuela OK · catálogo, XP, rúbrica, feedback y migración única.");
