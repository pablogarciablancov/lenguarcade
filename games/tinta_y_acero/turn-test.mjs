import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const ctx=vm.createContext({console,crypto:globalThis.crypto});for(const f of ['content.js','engine.js'])vm.runInContext(fs.readFileSync(new URL(f,import.meta.url),'utf8'),ctx);
const {Game}=ctx.InkEngine;
function make(){const e=new Game(['cantar','sol']);e.start('guardaplumas','tutorial','short',123);e.enter(0);e.run.enemy.hp=e.run.enemy.maxHp=100;e.run.enemy.kind='echo';e.run.board=[...'cantarsol'].map(char=>({char,card:null}));return e;}
let e=make(),r=e.run;r.enemy.armor=20;r.intent={type:'attack',damage:6,text:'6 de daño'};
const hp=r.hp,enemyHP=r.enemy.hp,def=e.preview('cantar','defend');assert.equal(def.damage,0);assert(def.shield>=6);
assert(e.play('cantar','defend',undefined,true).ok);assert.equal(r.enemy.hp,enemyHP);assert.equal(r.hp,hp);assert.equal(r.shield,def.shield);assert.equal(r.turn,1);assert(r.pendingTurn);assert(!e.play('sol').ok);assert(!e.special(true));assert(!e.reroll());
const resumed=make();assert(resumed.restore(e.snapshot()));assert(resumed.run.pendingTurn);assert(resumed.resolvePendingTurn());assert.equal(resumed.run.enemy.hp,enemyHP);assert.equal(resumed.run.hp,hp);assert.equal(resumed.run.shield,def.shield-6);assert.equal(resumed.run.turn,2);const saved=JSON.stringify(resumed.snapshot());assert(!resumed.resolvePendingTurn());assert.equal(JSON.stringify(resumed.snapshot()),saved);
e=make();r=e.run;const playerHP=r.hp;assert(e.play('cantar','attack',undefined,true).ok);assert(r.enemy.hp<100);assert.equal(r.hp,playerHP);assert.equal(r.turn,1);e.resolvePendingTurn();assert(r.hp<playerHP);assert.equal(r.turn,2);
e=make();r=e.run;r.energy=10;assert(e.special(true));assert.equal(r.shield,16);assert.equal(r.enemy.hp,100);e.resolvePendingTurn();assert(r.enemy.hp<100);assert.equal(r.hp,r.maxHp);
e=make();r=e.run;r.enemy.hp=1;assert(e.play('cantar','attack',undefined,true).ok);assert.equal(r.phase,'reward');assert(!r.pendingTurn);
e=make();e.run.shield=63;assert.equal(e.preview('sol','defend').shield,2);
console.log('PASS: defense zero damage, shield absorption and persistence, deferred enemy turn, reload recovery, duplicate resolution, special counter, lethal attack skips retaliation.');
