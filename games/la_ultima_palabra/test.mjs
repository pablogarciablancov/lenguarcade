import assert from 'node:assert/strict';
import {createState,build,repair,startWave,step,answer,selectUpgrade,BUILDINGS,WAVES} from './core.js';
import {QUESTIONS,checkAnswer,freshDeck} from './questions.js';

const state=createState();assert.equal(state.ink,70);assert.equal(build(state,'guard',0),true);assert.equal(build(state,'bow',1),true);assert.equal(build(state,'mage',2),false);assert.equal(state.ink,12);
assert.equal(build(state,'guard',8),false);assert.equal(answer(state,true),12);assert.equal(state.ink,24);assert.equal(answer(state,false),0);assert.equal(state.streak,0);
assert.equal(build(state,'guard',0),false);assert.equal(state.buildings[0].level,1);
state.ink=100;assert.equal(build(state,'guard',0),true);assert.equal(state.buildings[0].level,2);state.wall=90;assert.equal(repair(state),true);assert.equal(state.wall,100);
assert.equal(startWave(state),true);assert.equal(startWave(state),false);for(let i=0;i<100;i++)step(state,.1);assert.ok(state.spawned>0);assert.ok(state.allies.some(a=>a.type==='guard'));
const clean=createState();assert.equal(startWave(clean),true);clean.wall=1;clean.enemies=[{x:208,lane:0,hp:10,maxHp:10,speed:20,damage:3,attack:0}];step(clean,.1);assert.equal(clean.phase,'lost');
const upgrade=createState();upgrade.phase='upgrade';upgrade.wave=1;assert.equal(selectUpgrade(upgrade,'forge'),true);assert.ok(upgrade.damageMultiplier>1);assert.equal(upgrade.phase,'prep');
const campaign=createState();campaign.ink=2000;for(let lane=0;lane<3;lane++){build(campaign,'guard',lane);build(campaign,'guard',lane);build(campaign,'bow',lane);build(campaign,'mage',lane);}
for(let wave=0;wave<4;wave++){assert.equal(startWave(campaign),true);let ticks=0;while(campaign.phase==='battle'&&ticks++<2000)step(campaign,.1);assert.ok(ticks<2000,`Oleada ${wave+1} termina`);if(wave<3){assert.equal(campaign.phase,'upgrade');assert.equal(selectUpgrade(campaign,'forge'),true);}else assert.equal(campaign.phase,'won');}
for(const q of QUESTIONS){assert.ok(q.why&&q.prompt&&q.topic);assert.equal(checkAnswer(q,q.typed??q.answer),true);if(q.choices){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.equal(checkAnswer(q,(q.answer+1)%4),false);}}
assert.equal(freshDeck().length,QUESTIONS.length);assert.equal(Object.keys(BUILDINGS).length,3);assert.equal(WAVES.length,4);
console.log('La Última Palabra: reglas, economía, oleadas, mejoras y respuestas OK');
