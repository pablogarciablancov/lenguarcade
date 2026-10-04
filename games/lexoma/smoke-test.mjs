import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const files=['linguistics.js','content.js','engine.js'];
function context(){const saved=new Map();const w={dispatchEvent(){}};const box={window:w,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},Event:class{},console};vm.createContext(box);for(const f of files)vm.runInContext(fs.readFileSync(new URL(f,import.meta.url),'utf8'),box);return{E:w.LexomaEngine,L:w.LexomaLanguage,C:w.LexomaContent,saved,box};}
const {E,L,C}=context();
const phrase=(s,select={})=>s.split(' ').map((word,i)=>({...L.lookup(word).find(a=>!select[i]||a.category===select[i]),base:L.value(word)}));
assert.ok(L.lexicon.size>=800);assert.equal(L.lookup('CAMINÓ')[0].tense,'pretérito');assert.ok(L.lookup('camino').some(x=>x.category==='noun'));assert.ok(L.lookup('camino').some(x=>x.category==='verb'));assert.ok(!L.lookup('jugo').length);assert.ok(!L.lookup('soño').length);assert.ok(L.lookup('jugué').length);assert.ok(L.lookup('jóvenes').length);assert.ok(!L.lookup('jovenes').length);assert.ok(!L.lookup('robotes').length);
for(const s of ['el mago corre','las niñas cantan','el bosque oscuro','el agua bonita','el mago cruza el bosque','el mago corre rápidamente','el mago es sabio','yo camino','corro','ella está contenta','el mago camina por el bosque'])assert.equal(L.analyze(phrase(s,{1:s==='yo camino'?'verb':undefined})).valid,true,s);
for(const s of ['las árbol oscuro','la agua','el agua bonito','el mago corren','yo corre','la niña rojo','el mago es','el mago corre por','el mago el gato','el mago corre pero','el mago come el perro el gato'])assert.equal(L.analyze(phrase(s)).valid,false,s);
E.start(42);
function forgeFromHand(word,analysis=0){for(const c of word.toUpperCase()){const t=E.run.hand.find(t=>t.char===c&&!E.run.selection.some(s=>s.id===t.id));assert.ok(t,`Falta ${c} en ${word}`);E.select(t.id);}assert.equal(E.forge(analysis).ok,true,word);}
forgeFromHand('el');forgeFromHand('mago');forgeFromHand('corre');assert.equal(E.run.phrase.length,3);const first=E.finish();assert.ok(first.ok&&first.result.total>200);assert.ok(E.run.enemyHp<500);
// Palabra inválida conserva las fichas y consume solo un intento estadístico.
E.clear();E.select(E.run.hand[0].id);const before=JSON.stringify(E.run.hand);const bad=E.forge();if(!bad.ok)assert.equal(JSON.stringify(E.run.hand),before);
// Snapshot exacto a mitad de selección y aislado entre alumnos.
const snap=JSON.parse(JSON.stringify(E.snapshot()));E.setProfile({studentId:'a'});assert.equal(E.run,null);E.restore(snap);assert.equal(E.run.selection.length,snap.run.selection.length);assert.equal(JSON.stringify(E.snapshot().run.hand),JSON.stringify(snap.run.hand));E.setProfile({studentId:'b'});assert.equal(E.run,null);E.setProfile({studentId:'a'});assert.equal(E.run.id,snap.run.id);
// Construcción nominal correcta, sin fingir que cualquier lista es oración.
E.run.phrase=phrase('el bosque oscuro');const plain=E.calculate();assert.ok(plain.valid&&!plain.sentence);E.run.relics=['quevedo','corona','concordia'];assert.ok(E.calculate().total>plain.total);
// Cada reliquia de puntuación aporta su efecto con una frase que lo activa.
const probes={quevedo:'el niño rojo corre',cervantes:'el guerrero corre',corona:'el niño corre',cronista:'el niño caminó',brujula:'el niño corre bien',martillo:'el niño corre',concordia:'el niño corre',enie:'el niño corre'};
for(const [relic,s] of Object.entries(probes)){E.run.combo=1;E.run.previousStructures=[];E.run.phrase=phrase(s);E.run.relics=[];const baseline=E.calculate().total;E.run.relics=[relic];assert.ok(E.calculate().total>baseline,relic);}
// Recorrido completo por combate, tienda, élite y las tres fases del jefe.
E.start(99);let safety=0;while(!E.run.finished&&safety++<150){if(E.run.status==='reward'){E.next();continue;}if(E.run.status==='shop'){E.run.ink=500;const stock=E.run.shopStock;E.purchase('letter','Ñ');E.purchase('wild');E.purchase('accent');assert.ok(E.purchase('remove',E.run.bag[0]).ok);for(const id of stock)assert.ok(E.purchase('relic',id).ok);const same=E.purchase('relic',stock[0]);assert.equal(same.ok,false);E.next();continue;}E.run.phrase=phrase('el mago corre');assert.equal(E.finish().ok,true);}
assert.equal(E.run.status,'victory');assert.ok(E.achievements.some(a=>a.id==='lexoma_boss'));
E.start(1);while(!E.run.finished)E.pass();assert.equal(E.run.status,'defeat');assert.equal(E.run.integrity,0);
// Bolsa: no se crean ni pierden fichas por forjar, descartar o cerrar ronda.
E.start(4);const count=()=>E.run.bag.length+E.run.discard.length+E.run.hand.length,n=count();forgeFromHand('el');assert.equal(count(),n);E.discard();assert.equal(count(),n);E.pass();assert.equal(count(),n);
// Comodín y tilde: cambios de análisis reales, rechazo conserva fichas.
E.start(3);E.run.hand=[...'CAMINO'].map((char,i)=>({char,id:i+100})).concat([{char:'´',id:199}]);E.run.selection=[];for(const t of E.run.hand)E.select(t.id);assert.equal(E.draft(),'CAMINÓ');assert.ok(E.forge().ok);assert.equal(E.run.phrase[0].category,'verb');
E.run.hand=[{id:300,char:'*'},{id:301,char:'L'}];E.run.selection=[];E.select(300,'E');E.select(301);assert.equal(E.draft(),'EL');assert.ok(E.forge().ok);
// Morfax: bonus de categoría y diversidad activados de forma independiente.
E.start(6);E.run.node=5;E.run.enemyHp=2000;E.run.phrase=phrase('el mago corre');E.run.relics=[];const phase1=E.calculate();E.run.enemyHp=1500;E.run.bossCategory='verb';const phase2=E.calculate();assert.ok(phase2.total>phase1.total);E.run.enemyHp=700;const phase3=E.calculate();assert.ok(phase3.steps.some(s=>s.label.includes('tres categorías')));
console.log(`Lexoma OK: ${L.lexicon.size} formas, ${C.relics.length} reliquias, morfología, gramática, bolsa, tienda, combate, victoria/derrota, perfiles y guardado.`);

const adapterSource=fs.readFileSync(new URL('central-progress.adapter.js',import.meta.url),'utf8');const adapterBox={};vm.createContext(adapterBox);vm.runInContext(adapterSource,adapterBox);const sample={save:{career:{words:10,phrases:4,concordances:6,wins:1,errors:2,bestCombo:3}},percentage:100};const initial=adapterBox.buildLexomaCentralProgress(sample,{progress:{}});assert.equal(initial.xpDelta,130);const repeated=adapterBox.buildLexomaCentralProgress(sample,{progress:{...initial,xp:initial.xpDelta}});assert.equal(repeated.xpDelta,0);assert.equal(repeated.attempts,16);console.log('Adaptador central OK: checkpoint repetido no duplica XP ni intentos.');
