import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the real UI listeners with delayed host replies; no browser credentials.
function harness(){
 const nodes=new Map(),listeners={},timers=new Map(),storage=new Map(),calls=[];let id=0;
 const element=()=>({dataset:{},textContent:'',value:'',append(){},remove(){nodes.delete('#arena-root');},set innerHTML(html){this.html=html;for(const key of [...nodes.keys()])if(key!=='#app'&&key!=='#arena-root')nodes.delete(key);for(const [,name] of html.matchAll(/id="([^"]+)"/g))nodes.set('#'+name,element());},get innerHTML(){return this.html;}});
 nodes.set('#app',element());const document={body:{append:el=>nodes.set('#'+el.id,el)},querySelector:s=>nodes.get(s)||null,createElement:element,addEventListener:(type,fn)=>listeners[type]=fn};
 const window={TintaHost:{onlineMultiplayer:true,student:{studentId:'A'}},TintaUI:{toast(){}},TintaGame:{profile:{settings:{reduced:true}}}};
 const ctx=vm.createContext({window,document,URLSearchParams,location:{search:'?la=1',href:'https://test/'},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},crypto,console,setTimeout:fn=>{timers.set(++id,fn);return id;},clearTimeout:i=>timers.delete(i),MutationObserver:class{observe(){}},InkContent:{classes:[{id:'guardaplumas',name:'Guarda'}],lexicon:{sol:{}}},InkArt:{sprite:()=>'',hero:()=>'',world:()=>''},InkEngine:{Game:{prototype:{match:()=>[0]}}},confirm:()=>true,TintaOnline:{request:payload=>new Promise((resolve,reject)=>calls.push({payload,resolve,reject}))}});
 vm.runInContext(fs.readFileSync('games/tinta_y_acero/multiplayer.js','utf8'),ctx);
 const click=(action,extra={})=>listeners.click({target:{closest:()=>({disabled:false,dataset:{arena:action,...extra}})}});
 const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
 return {nodes,calls,timers,click,flush,html:()=>nodes.get('#arena-root')?.innerHTML||'',poll:()=>{const fn=[...timers.values()][0];timers.clear();fn?.();}};
}
const room=(status='battle',round=1)=>({code:'ABCDEFGH',mode:'duel',status,round,me:0,players:[{name:'Ana',hero:'guardaplumas',hp:100,maxHp:100,energy:0,shield:0,board:[{char:'s'}],ready:false},...(status==='waiting'?[]:[{name:'Bruno',hero:'guardaplumas',hp:100,maxHp:100,energy:0,shield:0,ready:false}])],log:[],winner:null});
const h=harness();h.click('open');assert.match(h.html(),/Conectando/,'Opening has immediate feedback');
h.click('close');assert(!h.nodes.has('#arena-root'),'Close works while context pending');
h.calls[0].resolve({classes:[]});await h.flush();assert(!h.nodes.has('#arena-root'),'Late context cannot reopen UI');
h.click('open');h.calls[1].reject(Error('offline'));await h.flush();assert.match(h.html(),/Reintentar conexión/);
h.click('retry');h.calls[2].resolve({classes:[{classCode:'class',name:'Clase'}]});await h.flush();
h.nodes.get('#arena-name').value='Ana';h.nodes.get('#arena-hero').value='guardaplumas';h.nodes.get('#arena-class').value='class';h.click('create',{mode:'duel'});h.calls[3].resolve({room:room()});await h.flush();assert(h.nodes.has('#arena-word'));
h.poll();assert.equal(h.calls[4].payload.action,'get');h.nodes.get('#arena-word').value='sol';h.click('clear');assert.equal(h.nodes.get('#arena-word').value,'','Polling cannot lock local editing');h.click('close');assert(!h.nodes.has('#arena-root'),'Close works during room polling');h.calls[4].resolve({room:room()});await h.flush();assert.equal(h.timers.size,0,'Late room response cannot restart polling');
const f=harness();f.click('open');f.calls[0].resolve({classes:[]});await f.flush();f.nodes.get('#arena-name').value='Ana';f.nodes.get('#arena-hero').value='guardaplumas';f.nodes.get('#arena-class').value='class';f.click('create',{mode:'duel'});f.calls[1].resolve({room:room('finished')});await f.flush();assert.equal(f.timers.size,0,'Finished rooms stop polling');
console.log('Tinta arena UI: loading, retry, late replies, close during requests, editing during polling and finished rooms OK.');
