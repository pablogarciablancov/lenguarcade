// Behavioral checks run against real prototype functions in an isolated VM.
// Not a substitute for browser layout / visual QA.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('./rpg-modes-v1.js',import.meta.url),'utf8');
const nodes=new Map();
function element(){return {innerHTML:'',classList:{add(){},remove(){}},setAttribute(){},addEventListener(){},querySelector(){return {insertAdjacentHTML:(_,html)=>{this.innerHTML+=html}}},appendChild(){}}}
for(const id of ['bg2-extra-root','bg2-extra-content','bg2-extra-saving','bg2-extra-css'])nodes.set(id,element());
const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
let clock=1000,id=0;const timers=new Map();
const sandbox={window:{},document:{readyState:'loading',getElementById:k=>nodes.get(k)||null,addEventListener(){}},location:{search:''},URLSearchParams,localStorage:storage,sessionStorage:storage,performance:{now:()=>clock},matchMedia:()=>({matches:false}),setTimeout:f=>{timers.set(++id,f);return id},clearTimeout:n=>timers.delete(n),console};
sandbox.window.parent=sandbox.window;
const exports='window.__qa={get state(){return state},get battle(){return battle},get resolving(){return resolving},chooseRoute,applyAction,answer,finishBattle,move,retreat,render,setMode(v){activeMode=v},get html(){return document.getElementById("bg2-extra-content").innerHTML},click(action,value){handleClick({target:{closest:()=>({dataset:{x:action,value}})}})}};';
vm.runInNewContext(source.replace('window.BG2RPGModesV1={',exports+'\nwindow.BG2RPGModesV1={'),sandbox);
const api=sandbox.window.BG2RPGModesV1,qa=sandbox.window.__qa;
function flush(){const pending=[...timers.values()];timers.clear();pending.forEach(f=>f());clock+=300}
function correct(action='attack'){qa.applyAction(action);assert.ok(qa.battle.question);qa.answer(qa.battle.question.answer);flush();}
api.open('expedition');qa.click('class','guerrero');assert.match(qa.html,/x-route-nodes/);
qa.chooseRoute(0);assert.equal(qa.resolving,true);qa.chooseRoute(1);flush();assert.equal(qa.battle.enemyId,'tilde');assert.equal(qa.state.expedition.path.length,1);
let enemyHp=qa.battle.enemyHp,hp=qa.state.hero.hp;
correct('guard');assert.equal(qa.battle.enemyHp,enemyHp,'Defending must never damage the enemy');assert.equal(qa.state.hero.hp,hp,'Successful guard blocks this enemy');qa.finishBattle();
qa.applyAction('attack');const wrong=(qa.battle.question.answer+1)%3;qa.answer(wrong);flush();assert.ok(qa.state.hero.hp<hp);assert.equal(qa.battle.enemyHp,enemyHp);qa.finishBattle();
const mana=qa.state.hero.mana;correct('spell');assert.equal(qa.state.hero.mana,mana-3);assert.ok(qa.battle.enemyHp<enemyHp);qa.finishBattle();
const potions=qa.state.inventory.potions;qa.applyAction('potion');flush();assert.equal(qa.state.inventory.potions,potions-1);qa.finishBattle();
while(!qa.battle.result){correct();if(!qa.battle.result)qa.finishBattle()}
assert.equal(qa.battle.result,'win');qa.finishBattle();assert.equal(qa.state.expedition.stage,1);assert.ok(qa.state.hero.gold>0);
qa.chooseRoute(0);flush();assert.equal(qa.state.expedition.stage,2);assert.match(qa.html,/BOTÍN RECUPERADO/);qa.click('dismiss-encounter');
qa.chooseRoute(0);flush();assert.equal(qa.state.expedition.stage,3);assert.equal(qa.state.hero.mana,qa.state.hero.maxMana);qa.click('dismiss-encounter');
qa.chooseRoute(0);flush();assert.ok(qa.state.inventory.relics.includes('Pluma rúnica'));qa.click('dismiss-encounter');
qa.chooseRoute(0);flush();assert.equal(qa.battle.enemyId,'draco');
while(!qa.battle.result){correct(qa.state.hero.mana>=3?'spell':'attack');if(!qa.battle.result)qa.finishBattle()}
assert.equal(qa.battle.result,'win');qa.finishBattle();assert.equal(qa.state.expedition.completed,1);
qa.setMode('adventure');qa.render();assert.match(qa.html,/x-world-controls/);
function move(dx,dy){clock+=200;qa.move(dx,dy)}
move(-1,0);move(0,-1);assert.equal(qa.state.adventure.npc,true);
move(-1,0);move(0,-1);move(0,-1);move(1,0);move(1,0);assert.equal(qa.state.adventure.cleared['bosque:3:1'],true);
// Collision against the border preserves the exact position.
const before=[qa.state.adventure.x,qa.state.adventure.y];move(0,-1);assert.deepEqual([qa.state.adventure.x,qa.state.adventure.y],before);
const saved=JSON.stringify(qa.state);api.close();api.open('adventure');assert.equal(JSON.stringify(qa.state),saved,'Progress survives closing and opening');
// Route to cripta avoids the forest enemies.
for(const d of [[1,0],[1,0],[0,1],[1,0],[0,1],[0,1],[0,1],[-1,0]])move(...d);
assert.equal(qa.state.adventure.map,'cripta');
// Retreat returns to the previous square; no reward and no bypass.
move(1,0);move(0,-1);move(0,-1);const gold=qa.state.hero.gold;move(0,-1);assert.equal(qa.battle.enemyId,'guardia');qa.retreat();assert.equal(qa.state.hero.gold,gold);assert.equal(qa.state.adventure.y,3);
move(0,-1);qa.state.hero.hp=1;qa.applyAction('attack');qa.answer((qa.battle.question.answer+1)%3);flush();assert.equal(qa.battle.result,'lose');qa.finishBattle();assert.equal(qa.state.adventure.map,'bosque');assert.equal(qa.state.hero.hp,qa.state.hero.maxHp);
assert.ok([...data.keys()].every(k=>k.startsWith('bg2_rpg_extra_v1')),'Official slots remain untouched');
console.log('RPG behavior OK: route lock, attack, guard, spell, potion, failure, victory, boss, treasure, camp, NPC, collision, retreat, defeat and persistence.');
