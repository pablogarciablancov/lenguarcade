import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const saved=new Map();
const w={dispatchEvent(){}};
const box={window:w,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},Event:class{},console,fetch:async()=>({ok:true,text:async()=>['el','mago','corre','casa','sol','luna','gato','perro','sal','mesa','sapo','rama','pato'].join('\n')})};
vm.createContext(box);
for(const f of ['linguistics.js','content.js','engine.js'])vm.runInContext(fs.readFileSync(new URL(f,import.meta.url),'utf8'),box);
const E=w.LexomaEngine,L=w.LexomaLanguage,C=w.LexomaContent;

assert.equal(C.bonuses.length,54);
assert.equal(C.modes.normal.energy,5);
assert.equal(C.modes.hard.energy,4);
assert.equal(E.maxBonuses,5);
assert.equal(E.letterValue('Ñ'),8);
await E.loadDictionary();
assert.equal(E.dictionaryReady,true);

function setHand(chars,styles={}){
 E.run.hand=[...chars].map((char,i)=>({id:100+i,char,style:styles[i]||'normal',bonusPoints:0,bonusMulti:0}));
 E.run.tileId=200;E.run.selected=[];E.run.rerollSelection=[];
}
function chooseStarter(){
 assert.equal(E.run.status,'starter');
 assert.equal(E.run.bonusChoices.length,3);
 const id=E.run.bonusChoices[0];
 assert.ok(E.chooseBonus(id).ok);
 assert.equal(E.run.status,'play');
 assert.equal(E.run.bonuses.length,1);
 return id;
}

E.start('normal',42);
assert.equal(E.run.status,'starter');
assert.equal(E.run.bonusChoices.length,3);
const vowelCount=E.run.hand.filter(t=>'AEIOUÁÉÍÓÚÜ'.includes(t.char)||t.char==='*').length;
assert.ok(vowelCount>=2,'La mano inicial debe ofrecer al menos dos vocales/comodines');
chooseStarter();
assert.equal(E.run.energy,5);

// La puntuación base ya recompensa longitud sin depender de cartas.
E.run.bonuses=[];setHand('CASA');
for(const c of 'CASA'){const t=E.run.hand.find(t=>t.char===c&&!E.run.selected.some(s=>s.id===t.id));E.select(t.id);}
const base=E.score(E.draft(),true);
assert.ok(base.points>=14,'CASA debe superar la antigua base mínima');
assert.ok(base.multis>=2,'4 letras deben partir con al menos ×2');
assert.ok(base.total>=28);

// Superar una ronda no arrastra energía gastada: la siguiente se reinicia.
E.run.target=1;const first=E.play();assert.ok(first.ok);assert.equal(E.run.status,'reward');assert.equal(E.run.energy,4);
const afterRoundRerolls=E.run.rerolls;assert.ok(afterRoundRerolls>=4,'Debe premiar la ronda y la eficiencia');
const reward=E.run.bonusChoices[0];assert.ok(E.chooseBonus(reward).ok);assert.equal(E.run.round,2);assert.equal(E.run.status,'play');assert.equal(E.run.energy,5);

// Batería eleva la energía base de cada nueva ronda.
E.run.bonuses=['bateria'];E.run.status='reward';E.run.bonusChoices=['vocalista'];E.run.round=2;
assert.ok(E.chooseBonus('vocalista').ok);assert.equal(E.run.energy,6);

// Reroll de letras.
const beforeRerolls=E.run.rerolls;setHand('CASA');E.toggleReroll(100);E.toggleReroll(101);assert.ok(E.rerollLetters().ok);assert.equal(E.run.rerolls,beforeRerolls-1);

// Una carta altera de verdad el cálculo.
setHand('CASA');E.run.bonuses=[];
for(const c of 'CASA'){const t=E.run.hand.find(t=>t.char===c&&!E.run.selected.some(s=>s.id===t.id));E.select(t.id);}
const plain=E.score(E.draft(),true);E.run.bonuses=['vocalista'];const boosted=E.score(E.draft(),true);assert.ok(boosted.points>plain.points&&boosted.total>plain.total);

// Máximo 5 cartas y sustitución obligatoria.
E.run.status='reward';E.run.bonuses=['vocalista','consonante','palabra_larga','variedad','raras'];E.run.bonusChoices=['mult','punto','cinco'];
const blocked=E.chooseBonus('mult');assert.equal(blocked.needsReplace,true);assert.equal(E.run.bonuses.length,5);
const replaced=E.chooseBonus('mult','vocalista');assert.ok(replaced.ok);assert.equal(E.run.bonuses.length,5);assert.ok(E.run.bonuses.includes('mult'));assert.ok(!E.run.bonuses.includes('vocalista'));

// Una palabra inválida no consume energía.
E.run.status='play';setHand('ZZ');const energy=E.run.energy;E.select(100);E.select(101);const bad=E.play();assert.equal(bad.ok,false);assert.equal(E.run.energy,energy);

// Persistencia v2 compatible.
const snap=JSON.parse(JSON.stringify(E.snapshot()));assert.equal(snap.version,2);E.setProfile({studentId:'a'});assert.equal(E.run,null);assert.ok(E.restore(snap));assert.equal(E.run.id,snap.run.id);

// Victoria final y modo infinito reinician energía.
E.run.status='play';E.run.finished=false;E.run.round=C.modes.normal.rounds;E.run.target=1;E.run.roundScore=0;E.run.energy=1;setHand('EL');E.select(100);E.select(101);assert.ok(E.play().ok);assert.equal(E.run.status,'victory');assert.equal(E.continueEndless(),true);assert.equal(E.run.energy,E.roundEnergy());

console.log('Forja OK: carta inicial, máximo 5 cartas, energía reiniciada, manos equilibradas, puntuación base reforzada y sustitución de build.');

const adapterSource=fs.readFileSync(new URL('central-progress.adapter.js',import.meta.url),'utf8');
const adapterBox={};vm.createContext(adapterBox);vm.runInContext(adapterSource,adapterBox);
const sample={save:{career:{words:10,wins:1,errors:2,bonusesSeen:['a','b']}},percentage:100};
const initial=adapterBox.buildLexomaCentralProgress(sample,{progress:{}});assert.ok(initial.xpDelta>0);
const repeated=adapterBox.buildLexomaCentralProgress(sample,{progress:{...initial,xp:initial.xpDelta}});assert.equal(repeated.xpDelta,0);
console.log('Adaptador central OK.');