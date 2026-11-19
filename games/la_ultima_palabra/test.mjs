import assert from 'node:assert/strict';
import {createState,build,buildingAt,repair,startWave,step,answer,selectUpgrade,BUILDINGS,WAVES,FIELD} from './core.js';
import {BRANCHES,applySkills,buySkill,earnedSeals} from './tree.js';
import {QUESTIONS,checkAnswer,freshDeck} from './questions.js';

const state=createState();assert.equal(state.ink,70);
assert.equal(build(state,'guard',300,240),true);assert.equal(build(state,'bow',400,320),true);assert.equal(build(state,'mage',500,400),false);
assert.equal(state.ink,12);assert.equal(build(state,'guard',800,200),false);assert.equal(build(state,'guard',190,200),false);
assert.equal(answer(state,true),12);assert.equal(state.ink,24);assert.equal(answer(state,false),0);assert.equal(state.streak,0);
assert.equal(build(state,'guard',300,240),false);assert.equal(state.buildings[0].level,1);
state.ink=100;assert.equal(build(state,'guard',302,242),true);assert.equal(buildingAt(state,300,240).level,2);
assert.equal(build(state,'bow',302,242),false);assert.equal(build(state,'bow',320,245),false);
state.wall=90;assert.equal(repair(state),true);assert.equal(state.wall,100);
assert.equal(startWave(state),true);assert.equal(startWave(state),false);for(let i=0;i<100;i++)step(state,.1);
assert.ok(state.spawned>0);assert.ok(state.allies.some(a=>a.type==='guard'&&Number.isFinite(a.y)));
const clean=createState();assert.equal(startWave(clean),true);clean.wall=1;clean.enemies=[{x:191,y:300,hp:10,maxHp:10,speed:20,damage:3,attack:0}];step(clean,.1);assert.equal(clean.phase,'lost');
const upgrade=createState();upgrade.phase='upgrade';upgrade.wave=1;assert.equal(selectUpgrade(upgrade,'forge'),true);assert.ok(upgrade.damageMultiplier>1);
const profile={seals:55,tree:{}};assert.equal(buySkill(profile,'wall2'),false);assert.equal(buySkill(profile,'wall1'),true);assert.equal(profile.seals,35);assert.equal(buySkill(profile,'wall2'),true);assert.equal(profile.seals,0);
const boosted=createState();applySkills(boosted,profile);assert.equal(boosted.wall,145);assert.equal(boosted.maxWall,145);
assert.equal(earnedSeals({...boosted,wave:2,correct:10,phase:'lost'}),25);
const campaign=createState();campaign.ink=2500;for(const [x,y] of [[280,200],[310,300],[290,420]]){build(campaign,'guard',x,y);build(campaign,'guard',x,y);build(campaign,'bow',x+50,y);build(campaign,'mage',x+100,y);}
for(let wave=0;wave<4;wave++){assert.equal(startWave(campaign),true);let ticks=0;while(campaign.phase==='battle'&&ticks++<2500)step(campaign,.1);assert.ok(ticks<2500,`Oleada ${wave+1} termina`);if(wave<3){assert.equal(campaign.phase,'upgrade');assert.equal(selectUpgrade(campaign,'forge'),true);}else assert.equal(campaign.phase,'won');}
for(const q of QUESTIONS){assert.ok(q.why&&q.prompt&&q.topic);assert.equal(checkAnswer(q,q.typed??q.answer),true);if(q.choices){assert.equal(q.choices.length,4);assert.equal(new Set(q.choices).size,4);assert.equal(checkAnswer(q,(q.answer+1)%4),false);}}
assert.equal(freshDeck().length,QUESTIONS.length);assert.equal(Object.keys(BUILDINGS).length,3);assert.equal(WAVES.length,4);assert.equal(BRANCHES.reduce((n,b)=>n+b.nodes.length,0),12);assert.equal(FIELD.minX,215);
console.log('La Última Palabra: campo libre, batalla completa, árbol y retos OK');
