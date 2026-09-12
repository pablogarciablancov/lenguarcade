import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const base = process.argv[2] || path.resolve('games/word_play');
const index = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(base, 'styles.css'), 'utf8');
const content = fs.readFileSync(path.join(base, 'content.js'), 'utf8');
const engine = fs.readFileSync(path.join(base, 'engine.js'), 'utf8');
const app = fs.readFileSync(path.join(base, 'app.js'), 'utf8');

for (const required of ['id="board"','id="wordBuilder"','id="rewardChoices"','id="collectionModal"','id="dailyGameBtn"','./content.js','./engine.js','./app.js','./styles.css']) {
  if (!index.includes(required)) throw new Error(`Falta ${required} en index.html`);
}
for (const required of ['100dvh','overflow:hidden','.board','.reward-card','.collection-body','.boss-badge']) {
  if (!css.replaceAll(' ', '').includes(required.replaceAll(' ', ''))) throw new Error(`Falta ${required} en styles.css`);
}
for (const required of ['DICTIONARY_URL','LETTER_POOL','validate','score','rewards','localStorage','achievements','daily']) {
  if (!engine.includes(required)) throw new Error(`Falta ${required} en engine.js`);
}
for (const required of ['renderCareer','renderBoard','openReward','collection','wordLog']) {
  if (!app.includes(required)) throw new Error(`Falta ${required} en app.js`);
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
new vm.Script(engine, { filename: 'engine.js' });
new vm.Script(app, { filename: 'app.js' });
console.log(`Word Play: OK · ${C.modifiers.length} modificadores · ${C.gifts.length} recompensas · ${C.challenges.length} desafíos · ${C.achievements.length} logros`);
