import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const store=new Map();
const window={dispatchEvent(){}};
const ctx=vm.createContext({window,CustomEvent:class{constructor(type){this.type=type;}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},console,Date,Math,JSON,Set,Map,Number,String,Object,Array});
for(const f of ['content.js','engine.js'])vm.runInContext(fs.readFileSync('games/lexitrama/'+f,'utf8'),ctx,{filename:f});
const C=window.LexitramaContent,E=window.LexitramaEngine;
assert(C.words.length>=500,`Banco insuficiente: ${C.words.length}`);
assert.equal(C.worlds.length,5);assert(C.achievements.length>=30);
assert.equal(C.byWord.get('cantábamos').tense,'pretérito imperfecto');assert.equal(C.byWord.get('cantábamos').number,'plural');assert(C.byWord.get('vivíamos').tags.includes('hiato'));
assert(!C.byWord.get('buzo').tags.includes('hiato'));assert(!C.byWord.get('búho').tags.includes('esdrújula'));assert(!C.byWord.get('rápido').tags.includes('llana'));
E.initialize({},null);
const solve=()=>{const s=E.state;const candidates=C.words.filter(w=>E.mission().test(w)&&!s.used.includes(w.word));for(const word of candidates){const route=E.route(word.word);if(route){const r=E.submit(route);assert(r.ok,`Ruta garantizada rechazada: ${word.word}`);return r;}}assert.fail('Tablero sin solución objetivo');};
let levels=0,turns=0;
for(const level of C.levels)for(let seed=0;seed<10;seed++){
  E.create({levelId:level.id,seed:`test-${seed}`});
  assert(E.route(E.state.guaranteed));
  while(!E.state.completed){const before=E.state.progress;const result=solve();assert.equal(E.state.progress,before+1);assert(result.animation.fall.length===E.state.size**2);turns++;if(!E.state.completed)assert(E.route(E.state.guaranteed));}
  assert(E.state.won);assert(E.career.stars[level.id]>=1);levels++;
}
E.create({mode:'mastery',mission:'verbo',seed:'replay',size:5});const first=JSON.stringify(E.state.board);const rng=E.state.rng;
E.abandon();E.create({mode:'mastery',mission:'verbo',seed:'replay',size:5});assert.equal(JSON.stringify(E.state.board),first);assert.equal(E.state.rng,rng);
const path=E.route(E.state.guaranteed);const repeated=[path[0],path[1],path[0]];assert(!E.submit(repeated).ok);
const save=E.snapshot();E.initialize({studentId:'one'},save,true);assert.equal(E.state.id,save.run.id);assert.equal(E.state.rng,save.run.rng);assert.equal(JSON.stringify(E.state.board),JSON.stringify(save.run.board));
E.initialize({studentId:'two'},null,true);assert.equal(E.career.xp,0);assert.equal(E.state,null);
E.create({mode:'hardcore',mission:'sustantivo',seed:'hard'});assert.equal(E.hint(),null);E.abandon();
E.create({mode:'timed',mission:'adjetivo',duration:1,seed:'clock'});E.tick();assert(E.state.completed);E.abandon();
E.create({levelId:'ciudad_6',seed:'boss'});for(let i=0;i<6;i++)E.tick(20);assert(E.state.completed&&!E.state.won);
E.create({mode:'infinite',mission:'verbo',seed:'infinite'});for(let i=0;i<12;i++)solve();assert(!E.state.completed);assert(E.state.bestStreak>=8);assert(E.state.furia>0);
E.abandon();E.create({mode:'mastery',mission:'sustantivo',seed:'gravity',size:4});
// La gravedad conserva los UID supervivientes y su orden por columna cuando no hay rescate.
const word=E.state.guaranteed,p=E.route(word),before=JSON.parse(JSON.stringify(E.state.board));E.state.board.forEach(t=>t.kind='normal');const r=E.submit(p);if(!r.rescued){for(let col=0;col<4;col++){const kept=before.filter((t,i)=>i%4===col&&!p.includes(i)).map(t=>t.uid);const after=E.state.board.filter((t,i)=>i%4===col&&kept.includes(t.uid)).map(t=>t.uid);assert.equal(JSON.stringify(after),JSON.stringify(kept));}}
const manifest=JSON.parse(fs.readFileSync('games/lexitrama/lenguarcade.integration.json','utf8'));assert.equal(manifest.gameId,'lexitrama');assert(fs.existsSync(manifest.entry));
console.log(`Lexitrama OK: ${C.words.length} términos, ${C.achievements.length} logros; ${levels} campañas/semillas y ${turns} cascadas resueltas, guardado, aislamiento, reloj, jefe y Lexifuria.`);

// Comprobar cada ficha especial, las tildes y la distinción misión/palabra válida.
function customBoard(kind='normal',mission='sustantivo',word='casa'){
  E.abandon();E.create({mode:'mastery',mission,size:5,seed:'special-check'});
  E.state.goal=100;E.state.board.forEach(t=>Object.assign(t,{letter:'X',kind:'normal',hits:1}));
  [...word.toUpperCase()].forEach((letter,i)=>Object.assign(E.state.board[i],{letter}));
  E.state.board[0].kind=kind;E.state.board[0].hits=kind==='ice'?2:1;
  return [...word].map((_,i)=>i);
}
let normal=E.submit(customBoard()).points;let golden=E.submit(customBoard('gold')).points;assert.equal(golden,normal*3);
let icePath=customBoard('ice'),iceUid=E.state.board[0].uid;assert(E.submit(icePath).ok);assert(E.state.board.some(t=>t.uid===iceUid&&t.kind==='ice'&&t.hits===1),'La trama no puede borrar el hielo a su primer uso');
let bombPath=customBoard('bomb'),neighborUid=E.state.board[5].uid;E.submit(bombPath);assert(!E.state.board.some(t=>t.uid===neighborUid),'La bomba debe eliminar vecinas');
let wildPath=customBoard('wild');E.state.board[0].letter='Z';assert.equal(E.submit(wildPath).word,'casa');
let sealPath=customBoard('normal','verbo','casa');E.state.board[10].kind='sealed';const sealUid=E.state.board[10].uid;let nonGoal=E.submit(sealPath);assert(nonGoal.ok&&!nonGoal.goal);assert(E.state.board.some(t=>t.uid===sealUid&&t.kind==='sealed'),'Una palabra ajena a la misión no abre sellos');
let goalPath=E.route(E.state.guaranteed);E.submit(goalPath);assert(!E.state.board.some(t=>t.kind==='sealed'));
customBoard();E.state.board[10].kind='corrupt';E.state.board[10].age=3;let corruptUid=E.state.board[10].uid;const corruptedAnswer=E.submit([0,1,2,3]);assert.equal(E.state.score,corruptedAnswer.points-20);assert(!E.state.board.some(t=>t.uid===corruptUid&&t.kind==='corrupt'),'La corrupción caduca incluso si el rescate repone esa ficha');
let accentPath=customBoard('normal','hiato','río');assert(E.submit(accentPath).goal);accentPath=customBoard('normal','hiato','rio');assert(!E.submit(accentPath).ok);

// Categorías compartidas, flexiones y clasificación ortográfica del mismo banco.
const belongs=(mission,word)=>{assert(C.byWord.has(word),`Falta ${word}`);return C.missions.find(m=>m.id===mission).test(C.byWord.get(word));};
for(const word of ['seto','setos','arbusto','arbustos','helecho','helechos','hiedra','zarza','hojarasca','bellota','pinar','arroyo','jabalí','jabalíes','búho','búhos','árbol','árboles','raíz','raíces','río','ríos','arboleda','arboledas']){
  assert(C.byWord.has(word),`Falta ${word}`);assert(belongs('bosque',word),`${word} debe servir en bosque`);
}
for(const word of ['pulpo','pulpos','delfín','ballena','boya','boyas','mástil','mástiles','marinero','marineros','atún','atunes','ola','olas','pez','peces'])assert(belongs('mar',word),`${word} debe servir en mar`);
for(const [word,fields] of [['sal',['mar','comida']],['agua',['mar','bosque','comida']],['oso',['bosque','animales']],['libro',['escuela']]])for(const field of fields)assert(C.byWord.get(word).semanticFields.includes(field),`${word}: no perder ${field}`);
assert.equal(C.byWord.get('arboleda').family,'árbol');assert.equal(C.byWord.get('arboledas').family,'árbol');
assert(belongs('sufijos','arboleda'));assert(belongs('sufijos','arboledas'));assert(belongs('verbo','nada'));assert(belongs('pronombre','nada'));assert(belongs('presente','nada'));
for(const [word,tag] of [['seto','llana'],['setos','llana'],['helecho','llana'],['árboles','esdrújula'],['raíces','hiato'],['ríos','hiato'],['búho','hiato'],['buque','llana'],['guerra','llana'],['agua','diptongo'],['tierra','diptongo'],['sauce','diptongo'],['marea','hiato'],['océano','esdrújula'],['jabalí','aguda'],['atunes','llana'],['vivíamos','esdrújula']])assert(belongs(tag,word),`${word}: falta ${tag}`);
assert(!C.byWord.has('árbols'));assert(!C.byWord.has('atúns'));assert(!belongs('bosque','tenedor'));assert(!belongs('mar','seto'));assert(!belongs('diptongo','buque'));assert(!belongs('diptongo','guerra'));
// Tablero exacto de la captura: SETO conecta cuatro casillas vecinas sin ser rechazado.
E.abandon();E.create({levelId:'bosque_2',seed:'seto-screenshot'});
const capture=['E','R','B','R','L','O','O','T','?','I','E','E','E','V','R','S'];
E.state.board.forEach((tile,i)=>Object.assign(tile,{letter:capture[i],kind:i===8?'wild':'normal',hits:1}));
const screenshotAnswer=E.submit([15,10,7,6]);assert(screenshotAnswer.ok&&screenshotAnswer.goal);assert.equal(screenshotAnswer.word,'seto');assert.equal(E.state.errors,0);assert.equal(E.state.progress,1);
// El diccionario ampliado funciona sin regenerar la partida guardada anterior.
const oldSave=E.snapshot();oldSave.run.completed=false;oldSave.run.board.forEach((tile,i)=>Object.assign(tile,{letter:capture[i],kind:i===8?'wild':'normal'}));oldSave.run.used=[];
const boardBefore=JSON.stringify(oldSave.run.board);E.initialize({studentId:'expanded-fields'},oldSave,true);assert.equal(JSON.stringify(E.state.board),boardBefore);assert(E.submit([15,10,7,6]).goal);
console.log('Campos y flexiones OK: SETO en el tablero de la captura, categorías compartidas, plurales, homógrafos, ortografía y guardados anteriores.');

// Host simulado: escrituras serializadas, aislamiento del canal y salida confirmada.
const messages=[],events=new Map(),timers=new Map();let timerId=0;
const host={postMessage(m){messages.push(JSON.parse(JSON.stringify(m)));}};host.parent=host;
const W={parent:host,name:'',addEventListener(type,fn){if(!events.has(type))events.set(type,[]);events.get(type).push(fn);},dispatchEvent(e){for(const fn of events.get(e.type)||[])fn(e);}};
const bridgeContext=vm.createContext({window:W,document:{hidden:false,addEventListener(){}},location:{search:'?lenguarcade=1&channel=fixture'},URLSearchParams,CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},localStorage:{getItem(){return null;},setItem(){}},setInterval(){return 0;},clearInterval(){},setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);},console,Date,Math,JSON,Set,Map,Number,String,Object,Array});
for(const f of ['content.js','engine.js','bridge.js'])vm.runInContext(fs.readFileSync('games/lexitrama/'+f,'utf8'),bridgeContext,{filename:f});
const BE=W.LexitramaEngine,B=W.LexitramaBridge;
function hostMessage(type,payload={},channel='fixture',source=host){W.dispatchEvent({type:'message',source,data:{namespace:'lenguarcade-host',channel,type,payload}});}
hostMessage('INIT',{student:{studentId:'alice'}},'wrong');assert(!BE.ready);
hostMessage('INIT',{student:{studentId:'alice'}},'fixture',{});assert(!BE.ready);
hostMessage('INIT',{student:{studentId:'alice'}});assert(BE.ready);
BE.create({mode:'mastery',mission:'verbo',seed:'bridge-one'});const firstCP=messages.find(m=>m.type==='CHECKPOINT');assert(firstCP);
B.checkpoint('progress');BE.abandon();const previousId=BE.state.id;BE.create({mode:'mastery',mission:'sustantivo',seed:'bridge-two'});
assert.equal(messages.filter(m=>m.type==='CHECKPOINT').length,1,'Debe haber solo una escritura en vuelo');
hostMessage('CHECKPOINT_FAILED',{checkpointId:firstCP.payload.checkpointId});B.retry();assert.equal(messages.at(-1).payload.checkpointId,firstCP.payload.checkpointId,'El reintento conserva el ID');
hostMessage('CHECKPOINT_CONFIRMED',{checkpointId:firstCP.payload.checkpointId});let latest=messages.at(-1);assert.equal(latest.type,'CHECKPOINT');hostMessage('CHECKPOINT_CONFIRMED',{checkpointId:latest.payload.checkpointId});latest=messages.at(-1);assert.equal(latest.type,'RESULT');assert.equal(latest.payload.players[0].save.run.id,previousId,'El resultado conserva su instantánea original');
hostMessage('SAVE_CONFIRMED',{resultId:latest.payload.resultId});latest=messages.at(-1);assert.equal(latest.type,'CHECKPOINT');assert.equal(latest.payload.players[0].save.run.seed,'bridge-two');
B.saveAndExit();assert(!messages.some(m=>m.type==='CLOSE_READY'));
hostMessage('CHECKPOINT_CONFIRMED',{checkpointId:latest.payload.checkpointId});latest=messages.at(-1);assert.equal(latest.payload.reason,'exit');hostMessage('CHECKPOINT_FAILED',{checkpointId:latest.payload.checkpointId});assert(!messages.some(m=>m.type==='CLOSE_READY'));B.retry();hostMessage('CHECKPOINT_CONFIRMED',{checkpointId:latest.payload.checkpointId});assert(messages.some(m=>m.type==='CLOSE_READY'&&m.payload.saved));
console.log('Fichas, tildes, misión y bridge OK: cola de guardado, resultado estable, fallo/reintento, canal y salida tras confirmación.');
