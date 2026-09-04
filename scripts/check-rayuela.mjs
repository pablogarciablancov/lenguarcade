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
