import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const saved=new Map();
const w={dispatchEvent(){}};
const box={window:w,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},Event:class{},console,fetch:async()=>({ok:true,text:async()=>['el','mago','corre','casa','sol','luna','gato','perro'].join('\n')})};
vm.createContext(box);
for(const f of ['linguistics.js','content.js','engine.js'])vm.runInContext(fs.readFileSync(new URL(f,import.meta.url),'utf8'),box);
const E=w.LexomaEngine,L=w.LexomaLanguage,C=w.LexomaContent;

assert.equal(C.bonuses.length,54);
assert.equal(C.modes.normal.rounds,10);
assert.ok(L.lookup('mago').length);
await E.loadDictionary();
assert.equal(E.dictionaryReady,true);

function setHand(chars,styles={}){
 E.run.hand=[...chars].map((char,i)=>({id:100+i,char,style:styles[i]||'normal',bonusPoints:0,bonusMulti:0}));
 E.run.tileId=200;E.run.selected=[];E.run.rerollSelection=[];
}
E.start('normal',42);
setHand('ELMAGO');
E.run.target=1;
for(const c of 'EL'){const t=E.run.hand.find(t=>t.char===c&&!E.run.selected.some(s=>s.id===t.id));E.select(t.id);}
const preview=E.score(E.draft(),true);
assert.ok(preview.valid&&preview.points>0&&preview.multis>=1&&preview.total>0);
const first=E.play();
assert.ok(first.ok);
assert.equal(E.run.status,'reward');
assert.equal(E.run.energy,5); // 5 iniciales -1 +1 recompensa.
assert.equal(E.run.bonusChoices.length,3);

const chosen=E.run.bonusChoices[0];
assert.ok(E.chooseBonus(chosen).ok);
assert.equal(E.run.round,2);
assert.ok(E.run.bonuses.includes(chosen));
assert.equal(E.run.status,'play');

const beforeRerolls=E.run.rerolls;
setHand('CASA');
E.toggleReroll(100);E.toggleReroll(101);
assert.equal(E.run.rerollSelection.length,2);
assert.ok(E.rerollLetters().ok);
assert.equal(E.run.rerolls,beforeRerolls-1);
assert.equal(E.run.hand.length,E.run.maxHand);

// Un bonus modifica de verdad el cálculo.
setHand('CASA');
for(const c of 'CASA'){const t=E.run.hand.find(t=>t.char===c&&!E.run.selected.some(s=>s.id===t.id));E.select(t.id);}
const base=E.score(E.draft(),true);
E.run.bonuses.push('palabra_corta');
const boosted=E.score(E.draft(),true);
assert.ok(boosted.multis>base.multis&&boosted.total>base.total);

// Las letras mejoradas conservan su tipo al ir al descarte.
E.run.bonuses=[];setHand('EL',{0:'gold'});E.run.target=99999;E.run.energy=3;
E.select(100);E.select(101);assert.ok(E.play().ok);
assert.ok(E.run.discard.some(x=>typeof x==='object'&&x.style==='gold'));

// Una palabra inválida no consume energía.
setHand('ZZ');const energy=E.run.energy;E.select(100);E.select(101);const bad=E.play();assert.equal(bad.ok,false);assert.equal(E.run.energy,energy);

// Snapshot v2 y aislamiento por perfil.
const snap=JSON.parse(JSON.stringify(E.snapshot()));assert.equal(snap.version,2);
E.setProfile({studentId:'a'});assert.equal(E.run,null);assert.ok(E.restore(snap));assert.equal(E.run.id,snap.run.id);
E.setProfile({studentId:'b'});assert.equal(E.run,null);
E.setProfile({studentId:'a'});assert.equal(E.run.id,snap.run.id);

// Victoria final y modo infinito.
E.run.status='play';E.run.finished=false;E.run.round=C.modes.normal.rounds;E.run.target=1;E.run.roundScore=0;E.run.energy=3;setHand('EL');E.select(100);E.select(101);assert.ok(E.play().ok);assert.equal(E.run.status,'victory');assert.equal(E.run.finished,true);assert.equal(E.continueEndless(),true);assert.equal(E.run.status,'play');

console.log('Forja OK: 54 bonus, PUNTOS × MULTIS, energía, rerolls de letras/bonus, 10 rondas, guardado v2 y modo infinito.');

const adapterSource=fs.readFileSync(new URL('central-progress.adapter.js',import.meta.url),'utf8');
const adapterBox={};vm.createContext(adapterBox);vm.runInContext(adapterSource,adapterBox);
const sample={save:{career:{words:10,phrases:10,concordances:0,wins:1,errors:2}},percentage:100};
const initial=adapterBox.buildLexomaCentralProgress(sample,{progress:{}});
assert.ok(initial.xpDelta>0);
const repeated=adapterBox.buildLexomaCentralProgress(sample,{progress:{...initial,xp:initial.xpDelta}});
assert.equal(repeated.xpDelta,0);
console.log('Adaptador central OK: checkpoints repetidos no duplican XP.');