import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const base = process.argv[2] || path.resolve('games/word_play');
const index = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(base, 'styles.css'), 'utf8');
const js = fs.readFileSync(path.join(base, 'app.js'), 'utf8');

for (const required of ['id="board"','id="wordBuilder"','id="rewardChoices"','./app.js','./styles.css']) {
  if (!index.includes(required)) throw new Error(`Falta ${required} en index.html`);
}
for (const required of ['100dvh','overflow: hidden','.board','.reward-card']) {
  if (!css.includes(required)) throw new Error(`Falta ${required} en styles.css`);
}
for (const required of ['DICTIONARY_URL','LETTER_POOL','validateWord','calculateScore','openReward','localStorage']) {
  if (!js.includes(required)) throw new Error(`Falta ${required} en app.js`);
}
new vm.Script(js, { filename: 'app.js' });
console.log('Word Play: comprobaciones estáticas OK');
