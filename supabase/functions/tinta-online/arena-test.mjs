import assert from 'node:assert/strict';
import {createRoom,joinRoom,submit,view} from './arena.mjs';
import {Game,content} from './game.mjs';
const a='a'.repeat(64),b='b'.repeat(64),other='c'.repeat(64);
function room(mode='coop'){const r=createRoom(mode,'Lía','guardaplumas',a,'seed');joinRoom(r,'Ada','tildamante',b);return r;}
function word(r,i){const g=new Game();g.profile=r.players[i].game;return g.solutions()[0];}
let r=room();assert.equal(r.players.length,2);assert.throws(()=>joinRoom(r,'Noa','sombrografo',other));assert.throws(()=>view(r,other));assert(!JSON.stringify(view(r,a)).includes(b));assert(!view(r,a).players[1].board);
let hp=r.boss.hp;submit(r,a,{action:'defend',word:word(r,0),target:'ally',round:1});assert.equal(r.boss.hp,hp);assert(r.players[0].ready);assert.equal(view(r,b).players[0].shield,0);assert(!JSON.stringify(view(r,b).players[0]).includes('word'));const snap=JSON.stringify(r);submit(r,a,{action:'attack',word:'xxxx',round:1});assert.equal(JSON.stringify(r),snap);
submit(r,b,{action:'pass',round:1});assert.equal(r.round,2);assert(r.players[1].game.run.shield>3);assert.equal(r.boss.hp,hp);assert(r.log.some(x=>x.includes('protege')));assert.throws(()=>submit(r,a,{action:'pass',round:1}));assert.throws(()=>submit(r,a,{action:'attack',word:'xyxyxy',round:2}));
r=room('duel');assert.deepEqual(r.players[0].game.run.board.map(t=>t.char),r.players[1].game.run.board.map(t=>t.char));assert.equal(r.players[0].game.run.hp,100);submit(r,a,{action:'attack',word:word(r,0),round:1});assert.equal(r.players[1].game.run.hp,100);submit(r,b,{action:'defend',word:word(r,1),round:1});assert.equal(r.players[0].game.run.hp,100);assert.equal(r.round,2);
for(let n=0;n<100&&r.status==='battle';n++){for(const [i,t]of [[0,a],[1,b]])submit(r,t,{action:'attack',word:word(r,i),round:r.round});}
assert.equal(r.status,'finished');assert([0,1,'draw'].includes(r.winner));
console.log('PASS: private seats, hidden choices, equal boards, server dictionary, duplicate rejection, stale round, ally shield, joint resolution and complete duel.');

r=room();for(let n=0;n<100&&r.status==='battle';n++){for(const [i,t]of [[0,a],[1,b]])submit(r,t,{action:'attack',word:word(r,i),round:r.round});}assert.equal(r.status,'finished');assert(['team','boss'].includes(r.winner));console.log('PASS: full cooperative fight reaches a server-owned result.');

r=room();r.players[0].game.run.shield=65;submit(r,a,{action:'defend',word:word(r,0),target:'ally',round:1});submit(r,b,{action:'pass',round:1});assert(r.players[1].game.run.shield>3);console.log('PASS: full own shield does not block support for ally.');
