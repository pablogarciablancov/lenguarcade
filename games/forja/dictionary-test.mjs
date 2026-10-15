import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const base=fs.readFileSync(new URL('../word_play/dictionary-es-50k.txt',import.meta.url),'utf8');
const extra=fs.readFileSync(new URL('dictionary-es-extra.txt',import.meta.url),'utf8');
async function engine(failed=[]){
 const window={dispatchEvent(){}};
 const ctx=vm.createContext({window,Event:class{},console,localStorage:{getItem(){return null;},setItem(){}},fetch:async url=>{
  const local=url.startsWith('dictionary-es-extra');if(failed.includes(local?'extra':'base'))throw Error('offline');
  return{ok:true,text:async()=>local?extra:base};
 }});
 for(const file of ['linguistics.js','content.js','engine.js'])vm.runInContext(fs.readFileSync(new URL(file,import.meta.url),'utf8'),ctx);
 let status='';await window.LexomaEngine.loadDictionary(s=>status=s);
 return{E:window.LexomaEngine,status};
}
const {E,status}=await engine();
const coverage=JSON.parse(fs.readFileSync(new URL('dictionary-coverage.json',import.meta.url),'utf8'));
for(const [group,words] of Object.entries(coverage))for(const word of words){assert.ok(E.validate(word).ok,group+': '+word);assert.ok(E.validate(word.toUpperCase()).ok,group+': '+word.toUpperCase());}
for(const word of ['hacieron','condujieron','cabió','sabió','tenió','escribido','abrido','morido','ponido','dijistes','fuistes','trajistes','niñoz','lápizes','árbolez','pingüinosx','ierro','ierra','rehíce','rehízo','rho','nu','PHI','XVI','XXIV'])assert.equal(E.validate(word).ok,false,word);
// El análisis gramatical nunca debe ampliar por su cuenta el banco validado.
const language={window:{}};vm.createContext(language);vm.runInContext(fs.readFileSync(new URL('linguistics.js',import.meta.url),'utf8'),language);
const approved=new Set(extra.trim().split(/\r?\n/));for(const word of language.window.LexomaLanguage.lexicon.keys())assert.ok(approved.has(word),'Forma local fuera del banco: '+word);

for(const w of ['talar','TALAR','saltar','cantar','mesa','perro','casa','jardín','jardin','rápido','rapido','jardi\u0301n','talaba','talaremos','abedul','remolacha','destornillador','brújula'])assert.ok(E.validate(w).ok,w);
for(const word of ['ciño','CIÑO','ciñes','ciñe','ceñimos','ciñó','ciñeron','ciñendo','ceñido','ceñiré','ceñiríamos','ciñáis','construyo','construyes','construyó','construyeron','construyendo','construido','hice','hicieron','haríamos','tuve','tuvieron','tendré','dije','dijeron','voy','fui','fueron','panadero','panaderas','librería','librerías','inútil','inútiles','rápidas','árboles'])assert.ok(E.validate(word).ok,word);
assert.equal(E.validate('ciño').analysis.lemma,'ceñir');
assert.equal(E.validate('ciño').analysis.person,1);
assert.equal(E.validate('ciño').analysis.tense,'presente');
assert.equal(E.validate('ciñó').analysis.tense,'pretérito');
assert.equal(E.validate('cino').ok,false,'No confundir Ñ y N');
assert.equal(E.validate('ciñeran').ok,true);
assert.equal(E.validate('hacieron').ok,false,'No inventar pretéritos regulares');
assert.equal(E.validate('talar').analysis.category,'verb');
assert.equal(E.validate('jardin').word,'jardín');
assert.equal(E.validate('rapido').analysis.category,'adj');
assert.ok(E.validate('ñandú').ok);assert.notEqual(E.validate('nandu').word,'ñandú','N no se convierte en Ñ');
for(const w of ['phi','PHI','xvi','XVI','xxiv','zzqqzz','qwertyuiop','talar/RED','mesa123'])assert.equal(E.validate(w).ok,false,w);
for(const w of ['ñu','ÑU','ñus','ÑUS','ñúes','xi','XI','a','y','e','o','u','mil','civil','dividir','vi','mi','sí'])assert.ok(E.validate(w).ok,w);
E.start('normal',42);E.leaveShop();E.run.hand=[...'TALAR'].map((char,i)=>({id:100+i,char,style:'normal'}));E.run.selected=E.run.hand.map(t=>({id:t.id,char:t.char}));
assert.ok(E.play().ok,'TALAR se juega y puntúa');assert.equal(E.run.words.at(-1),'talar');assert.ok(E.restore(E.snapshot()));
const fallback=await engine(['base']);assert.ok(fallback.E.validate('talar').ok);assert.ok(fallback.E.validate('abedul').ok);
const local=await engine(['base','extra']);assert.ok(local.E.validate('talar').ok);assert.equal(local.E.validate('talar').analysis.category,'verb');
assert.ok(local.E.validate('ñu').ok);
E.run.hand=[...'ÑU'].map((char,i)=>({id:200+i,char,style:'normal'}));E.run.selected=E.run.hand.map(t=>({id:t.id,char:t.char}));
assert.ok(E.play().ok,'ÑU se juega y puntúa');assert.equal(E.run.words.at(-1),'ñu');
for(const w of ['PHI','XVI']){const before=E.run.totalScore;assert.equal(E.score(w).valid,false);assert.equal(E.run.totalScore,before);}
console.log('Diccionario flexionado OK:',status,'· palabras, tildes, Ñ, juego, guardado y fallbacks.');
