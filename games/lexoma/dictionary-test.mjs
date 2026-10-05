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
for(const w of ['talar','TALAR','saltar','cantar','mesa','perro','casa','jardín','jardin','rápido','rapido','jardi\u0301n','talaba','talaremos','abedul','remolacha','destornillador','brújula'])assert.ok(E.validate(w).ok,w);
assert.equal(E.validate('talar').analysis.category,'verb');
assert.equal(E.validate('jardin').word,'jardín');
assert.equal(E.validate('rapido').analysis.category,'adj');
assert.ok(E.validate('ñandú').ok);assert.notEqual(E.validate('nandu').word,'ñandú','N no se convierte en Ñ');
for(const w of ['zzqqzz','qwertyuiop','talar/RED','x','mesa123'])assert.equal(E.validate(w).ok,false,w);
E.start('normal',42);E.leaveShop();E.run.hand=[...'TALAR'].map((char,i)=>({id:100+i,char,style:'normal'}));E.run.selected=E.run.hand.map(t=>({id:t.id,char:t.char}));
assert.ok(E.play().ok,'TALAR se juega y puntúa');assert.equal(E.run.words.at(-1),'talar');assert.ok(E.restore(E.snapshot()));
const fallback=await engine(['base']);assert.ok(fallback.E.validate('talar').ok);assert.ok(fallback.E.validate('abedul').ok);
const local=await engine(['base','extra']);assert.ok(local.E.validate('talar').ok);assert.equal(local.E.validate('talar').analysis.category,'verb');
console.log('Diccionario OK:',status,'· palabras, tildes, Ñ, juego, guardado y fallbacks.');
