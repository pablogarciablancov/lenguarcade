import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('./data.js',import.meta.url),'utf8');
const game=fs.readFileSync(new URL('./game.js',import.meta.url),'utf8');
const bridge=fs.readFileSync(new URL('./bridge.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const styles=fs.readFileSync(new URL('./styles.css',import.meta.url),'utf8');
const sprites=fs.readFileSync(new URL('./assets/lexarios-sprites.svg',import.meta.url),'utf8');
const sandbox={window:{}};
vm.createContext(sandbox);
vm.runInContext(source,sandbox);
const D=sandbox.window.LexariaData;

assert.equal(D.creatures.length,30,'Debe haber 30 Lexarios en el prototipo');
assert.ok(D.trainers.length>=8,'Debe haber al menos 8 entrenadores');
assert.ok(D.relics.length>=15,'Debe haber al menos 15 reliquias');
assert.ok(D.resources.length>=10,'Debe haber al menos 10 recursos');
assert.ok(D.achievements.length>=20,'Debe haber al menos 20 logros');

for(const category of Object.keys(D.TYPES)){
  for(let i=0;i<500;i++){
    const q=D.question(category,category+'_'+i);
    assert.equal(q.category,category);
    assert.equal(q.answers.length,4);
    assert.ok(q.correct>=0&&q.correct<4);
    assert.ok(q.answers[q.correct]);
    assert.ok(q.prompt);
    assert.ok(q.explanation);
  }
}

const ids=new Set();
for(const c of D.creatures){
  assert.ok(!ids.has(c.id),'ID duplicado: '+c.id);
  ids.add(c.id);
  assert.ok(c.types.length>=1);
  assert.ok(c.types.every(t=>D.TYPES[t]));
  assert.ok(D.RARITIES[c.rarity]);
  assert.ok(c.ability?.kind);
}
for(const required of [
  'id="studentBattleBtn"','id="formationHp"','id="formationDamage"','id="dayFlow"',
  'id="marketWallet"','id="studentBattleScreen"','id="publishSquadBtn"','id="opponentList"'
]) assert.ok(index.includes(required),'Falta UI: '+required);

for(const required of [
  'function moveUnit','dragstart','function formationTotals','TRAINING_STEP=.05',
  'LEVEL_MULT={1:1,2:1.7,3:3','while(incoming.level<3)','training+=x.unit.training',
  'function strategicFit','function abilityMeta','function battleActionFx',
  'function showStudentBattle','function publishCurrentSquad','function startStudentBattle',
  "battleContext==='student'","RECLUTAR"
]) assert.ok(game.includes(required),'Falta lógica UX: '+required);

for(const required of ['REQUEST_OPPONENTS','PUBLISH_SQUAD','OPPONENTS']) assert.ok(bridge.includes(required),'Falta bridge PvP: '+required);
for(const required of ['overflow:hidden!important','.position-guide','.offer-stats','.student-battle-layout','.currency-counter','.battle-projectile','.ability-callout','.market-ability','lexarios-sprites.svg','.hero-sprite','.battle-sprite']) assert.ok(styles.includes(required),'Falta estilo UX: '+required);
assert.equal((sprites.match(/transform="translate\(/g)||[]).length,30,'El atlas debe contener 30 Lexarios');
assert.ok(game.includes('function spriteMarkup'),'Falta el resolver del atlas de Lexarios');
assert.equal((game.match(/esc\(c\.emoji\)/g)||[]).length,0,'No deben quedar placeholders emoji para criaturas');

new vm.Script(game,{filename:'game.js'});
new vm.Script(bridge,{filename:'bridge.js'});

console.log('Lexaria smoke test: OK · 30 criaturas con sprites · 3000 preguntas · niveles 1/1.7/3 · entrenamiento 5% · combate visual · arena asíncrona');
