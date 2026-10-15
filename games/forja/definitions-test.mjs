import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
// DOMParser comes from the browser; a standards DOM can be supplied for Node.
const {DOMParser}=await import(process.env.FORJA_DOM_MODULE||'linkedom');
const src=fs.readFileSync(new URL('definitions.js',import.meta.url),'utf8');
const saved=new Map();let calls=0,fail=false;
const html='<h2 id="Français">Français</h2><dl><dt>1</dt><dd>Incorrecto.</dd></dl><h2 id="Español">Español</h2><dl><dt>Etimología</dt><dd>No es definición.</dd><dt>1 Zoología</dt><dd>Antílope africano.<sup>[1]</sup><ul><li>Ejemplo.</li></ul></dd></dl><h2 id="Otomí">Otomí</h2><dl><dt>1</dt><dd>Otra lengua.</dd></dl>';
const box={window:{},DOMParser,URLSearchParams,AbortController,setTimeout,clearTimeout,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},fetch:async()=>{calls++;if(fail)throw Error('offline');return{ok:true,json:async()=>({parse:{title:'ñu',text:{'*':html}}})};}};
vm.createContext(box);vm.runInContext(src,box);const D=box.window.ForjaDefinitions;
assert.equal(D.extract(html),'Antílope africano.');
assert.equal(D.extract('<h2 id="English">English</h2><dt>1</dt><dd>No.</dd>'),null);
const [a,b]=await Promise.all([D.lookup('ÑU'),D.lookup('ñu')]);assert.equal(calls,1);assert.equal(a.text,'Antílope africano.');assert.equal(b.url,'https://es.wiktionary.org/wiki/%C3%B1u');
await D.lookup('ñu');assert.equal(calls,1);
assert.equal(await D.lookup('<script>'),null);assert.equal(calls,1);
fail=true;assert.equal(await D.lookup('casa'),null);
vm.runInContext(src,box);assert.equal((await box.window.ForjaDefinitions.lookup('ñu')).text,'Antílope africano.');assert.equal(calls,2,'Caché persistente evita petición');
// Respuestas tardías no sobrescriben la definición de una jugada posterior.
const app=fs.readFileSync(new URL('app.js',import.meta.url),'utf8');
const methods=app.slice(app.indexOf('let definitionRequest='),app.indexOf('function finishScoreAnimation'));
let resolveFirst;const results=new Map();const panel={classList:{remove(){},add(){}},hidden:true,textContent:'',children:[],replaceChildren(){this.children=[];},append(n){this.children.push(n);}};
const ui={window:{addEventListener(){},ForjaDefinitions:{lookup:w=>w==='casa'?new Promise(r=>resolveFirst=r):Promise.resolve({text:'Astro luminoso.',url:'https://es.wiktionary.org/wiki/sol'})}},document:{createElement:()=>({})},$:()=>panel};
vm.createContext(ui);vm.runInContext(methods,ui);
const first=ui.showDefinition({word:'casa',display:'CASA'});await ui.showDefinition({word:'sol',display:'SOL'});resolveFirst({text:'Vivienda.'});await first;assert.equal(panel.children.find(n=>n.className==='note-word').textContent,'SOL');assert.match(panel.children.find(n=>n.className==='note-meaning').textContent,/Astro/);assert.ok(!panel.children.some(n=>n.href),'La nota no tiene enlaces');
ui.clearDefinition();assert.equal(panel.hidden,true);
console.log('Definiciones OK: idioma español, limpieza, caché, errores, concurrencia y cierre.');
