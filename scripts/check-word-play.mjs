import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const base = process.argv[2] || path.resolve('games/word_play');
const read = file => fs.readFileSync(path.join(base, file), 'utf8');
const index = read('index.html');
const css = read('styles.css');
const responsive = read('responsive.css');
const content = read('content.js');
const engine = read('engine.js');
const app = read('app.js');
const layout = read('layout.js');
const bridge = read('bridge.js');
const sound = read('sound.js');

for (const required of [
  'id="board"','id="wordBuilder"','id="rewardChoices"','id="collectionModal"','id="dailyGameBtn"',
  './content.js','./engine.js','./bridge.js','./app.js','./layout.js','./sound.js','./styles.css','./responsive.css'
]) if (!index.includes(required)) throw new Error(`Falta ${required} en index.html`);

for (const required of ['100dvh','overflow:hidden','.board','.reward-card','.collection-body','.boss-badge']) {
  if (!css.replaceAll(' ', '').includes(required.replaceAll(' ', ''))) throw new Error(`Falta ${required} en styles.css`);
}
for (const required of ['--tile-size','--board-gap','grid-template-columns:repeat(4,var(--tile-size))','max-height:100dvh','max-height:850px','max-width:820px']) {
  if (!responsive.replaceAll(' ', '').includes(required.replaceAll(' ', ''))) throw new Error(`Falta ${required} en responsive.css`);
}
for (const required of ['computeTileSize','ResizeObserver','MutationObserver','visualViewport','--tile-size','--board-gap']) {
  if (!layout.includes(required)) throw new Error(`Falta ${required} en layout.js`);
}
for (const required of ['DICTIONARY_URL','LETTER_POOL','validate','score','rewards','localStorage','achievements','dailySeed','rngCounter','runRandom','state?.won']) {
  if (!engine.includes(required)) throw new Error(`Falta ${required} en engine.js`);
}
for (const required of ['renderCareer','renderBoard','openReward','collection','wordLog']) {
  if (!app.includes(required)) throw new Error(`Falta ${required} en app.js`);
}
for (const required of ["const GAME_ID='word_play'","post('READY'","post('INITIALIZED'","post('CHECKPOINT'","post('RESULT'",'SESSION_STARTED']) {
  if (!bridge.includes(required)) throw new Error(`Falta bridge: ${required}`);
}
for (const required of ['AudioContext','Oscillator','WordPlaySound','MutationObserver']) {
  if (!sound.includes(required)) throw new Error(`Falta sonido: ${required}`);
}

const sandbox = { window: {} };
vm.createContext(sandbox);
new vm.Script(content, { filename: 'content.js' }).runInContext(sandbox);
const C = sandbox.window.WordPlayContent;
if (!C) throw new Error('content.js no expone WordPlayContent');
if (C.modifiers.length < 45) throw new Error(`Solo hay ${C.modifiers.length} modificadores`);
if (C.gifts.length < 15) throw new Error(`Solo hay ${C.gifts.length} recompensas`);
if (C.challenges.length < 15) throw new Error(`Solo hay ${C.challenges.length} desafíos`);
if (C.achievements.length < 20) throw new Error(`Solo hay ${C.achievements.length} logros`);
for (const list of [C.modifiers,C.gifts,C.challenges,C.achievements]) {
  const ids = list.map(x => x.id);
  if (new Set(ids).size !== ids.length) throw new Error('Hay IDs duplicados en content.js');
}

// Sintaxis de todos los módulos.
for (const [name, code] of [['engine.js',engine],['app.js',app],['layout.js',layout],['bridge.js',bridge],['sound.js',sound]]) {
  new vm.Script(code, { filename:name });
}

// Prueba funcional del motor sin navegador.
const store = new Map();
let uuid = 0;
const runtime = {
  window:{WordPlayContent:C},
  localStorage:{
    getItem:key=>store.has(key)?store.get(key):null,
    setItem:(key,value)=>store.set(key,String(value)),
    removeItem:key=>store.delete(key)
  },
  crypto:{randomUUID:()=>`test-${++uuid}`},
  fetch:async()=>{throw new Error('offline-test');},
  Intl,Date,Math,Set,Map,JSON,Object,Array,String,Number,RegExp,console,
  setTimeout,clearTimeout
};
runtime.globalThis=runtime;
vm.createContext(runtime);
new vm.Script(engine,{filename:'engine.js'}).runInContext(runtime);
const E=runtime.window.WordPlayEngine;
if(!E)throw new Error('engine.js no expone WordPlayEngine');

const daily1=E.newState('daily');
const letters1=daily1.board.map(t=>t.letter).join('');
E.state=daily1;
E.shuffle();
const shuffled1=daily1.board.map(t=>t.letter).join('');
const cursor1=daily1.rngCounter;
const daily2=E.newState('daily');
const letters2=daily2.board.map(t=>t.letter).join('');
E.state=daily2;
E.shuffle();
const shuffled2=daily2.board.map(t=>t.letter).join('');
if(letters1!==letters2||shuffled1!==shuffled2||cursor1!==daily2.rngCounter)throw new Error('El reto diario no es determinista');

E.state=E.newState('normal');
E.state.invalidAttempts=0;
const loss=E.finish(false);
if(loss.got.some(a=>a.id==='perfect')||E.career.achievements.perfect)throw new Error('El logro Perfecto se concede al perder');

// Fórmula pura de layout: 4×4 debe caber siempre dentro del espacio entregado.
function layoutSize(w,h,g=7,max=112){const bw=(Math.max(0,w)-g*3)/4,bh=(Math.max(0,h)-g*3)/4;return Math.max(30,Math.floor(Math.min(max,bw,bh)));}
for(const [w,h] of [[700,430],[520,360],[390,250],[900,500]]){
  const s=layoutSize(w,h);if(s*4+21>w+1||s*4+21>h+1)throw new Error(`El tablero puede desbordar ${w}×${h}`);
}

console.log(`Word Play: OK · ${C.modifiers.length} modificadores · ${C.gifts.length} recompensas · ${C.challenges.length} desafíos · ${C.achievements.length} logros · responsive/bridge/audio/daily OK`);
