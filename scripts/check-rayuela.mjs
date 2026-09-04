import fs from 'node:fs';
import vm from 'node:vm';

const path = new URL('../games/rayuela/index.html', import.meta.url);
const html = fs.readFileSync(path, 'utf8');
const checks = [
  ['game id', 'rayuela'],
  ['bridge READY', 'READY'],
  ['bridge checkpoint', 'CHECKPOINT'],
  ['bridge result', 'RESULT'],
  ['visual map', 'board'],
  ['player mode', 'player'],
  ['inspector', 'validateStory'],
  ['autosave', 'localStorage'],
  ['achievements', 'ACHIEVEMENTS'],
  ['import/export', 'importJson'],
  ['submission', 'sendSubmissionResult']
];
for (const [label, needle] of checks) {
  if (!html.includes(needle)) throw new Error('Rayuela: falta '+label+' ('+needle+')');
}
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
for (const [index,code] of scripts.entries()) new vm.Script(code,{filename:'rayuela-script-'+(index+1)+'.js'});
console.log('Rayuela OK · '+checks.length+' comprobaciones · '+scripts.length+' scripts compilados');