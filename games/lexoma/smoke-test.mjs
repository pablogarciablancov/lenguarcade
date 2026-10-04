import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const saved=new Map();
const w={dispatchEvent(){}};
const box={window:w,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},Event:class{},console,fetch:async()=>({ok:true,text:async()=>['el','mago','corre','casa','sol','luna','gato','perro','sal','mesa','sapo','rama','pato'].join('\n')})};
vm.createContext(box);
for(const f of ['linguistics.js','content.js','engine.js'])vm.runInContext(fs.readFileSync(new URL(f,import.meta.url),'utf8'),box);
const E=w.LexomaEngine,C=w.LexomaContent;
await E.loadDictionary();

assert.equal(C.bonuses.length,54);
assert.equal(C.events.length,6);
assert.equal(C.modes.normal.wallet,8);
assert.equal(E.maxBonuses,5);

function setHand(chars,styles={}){
 E.run.hand=[...chars].map((char,i)=>({id:100+i,char,style:styles[i]||'normal',bonusPoints:0,bonusMulti:0}));
 E.run.tileId=200;E.run.selected=[];E.run.rerollSelection=[];
}

// Una run nueva empieza en tienda y se puede salir sin comprar.
E.start('normal',42);
assert.equal(E.run.status,'shop');
assert.equal(E.run.shop.origin,'starter');
assert.equal(E.run.shop.cards.length,3);
assert.equal(E.run.coins,8);
assert.equal(E.run.bonuses.length,0);
assert.ok(E.leaveShop().ok);
assert.equal(E.run.status,'play');
assert.equal(E.run.bonuses.length,0);
assert.equal(E.run.energy,5);

// Compra de carta y precio real.
E.start('normal',43);
const offer=E.run.shop.cards[0],coinsBefore=E.run.coins;
assert.ok(E.buyCard(offer.id).ok);
assert.equal(E.run.coins,coinsBefore-offer.price);
assert.ok(E.run.bonuses.includes(offer.id));
assert.equal(E.cardLevel(offer.id),1);

// Mejorar carta sube nivel y aumenta el efecto.
E.run.coins=99;E.leaveShop();E.run.bonuses=['vocalista'];E.run.cardLevels={vocalista:1};setHand('CASA');
for(const c of 'CASA'){const t=E.run.hand.find(t=>t.char===c&&!E.run.selected.some(s=>s.id===t.id));E.select(t.id);}
const lvl1=E.score(E.draft(),true);
E.run.status='shop';E.run.shop={origin:'round',cards:[],refreshCost:2,refreshes:0,eventId:null,eventResolved:false,eventResult:''};
assert.ok(E.upgradeCard('vocalista').ok);
assert.equal(E.cardLevel('vocalista'),2);
E.run.status='play';const lvl2=E.score(E.draft(),true);
assert.ok(lvl2.points>lvl1.points);

// Eliminar letra reduce una copia permanentemente.
E.run.status='shop';E.run.coins=99;E.run.shop={origin:'round',cards:[],refreshCost:2,refreshes:0,eventId:null,eventResolved:false,eventResult:''};
const invBefore=E.inventory().find(x=>x.char==='A')?.count||0;
assert.ok(invBefore>0);assert.ok(E.removeLetter('A').ok);
const invAfter=E.inventory().find(x=>x.char==='A')?.count||0;
assert.equal(invAfter,invBefore-1);

// Grabar una ficha cuesta dinero y conserva el estilo.
const target=E.run.hand.find(t=>!['wild','bang'].includes(t.style));const money=E.run.coins;
assert.ok(E.engraveTile(target.id,'gold').ok);
assert.equal(target.style,'gold');assert.equal(E.run.coins,money-E.serviceCosts.gold);

// Renovar tienda cuesta monedas y encarece el siguiente refresh.
E.run.shop.cards=[];E.run.coins=20;E.run.shop.refreshCost=2;
assert.ok(E.refreshShop().ok);assert.equal(E.run.coins,18);assert.equal(E.run.shop.refreshCost,3);assert.equal(E.run.shop.cards.length,3);

// Límite de 5 cartas y sustitución al comprar.
E.run.bonuses=['vocalista','consonante','palabra_larga','variedad','raras'];E.run.cardLevels={vocalista:1,consonante:1,palabra_larga:1,variedad:1,raras:1};E.run.coins=99;
E.run.shop.cards=[{id:'mult',price:5}];
const blocked=E.buyCard('mult');assert.equal(blocked.needsReplace,true);
assert.ok(E.buyCard('mult','vocalista').ok);assert.equal(E.run.bonuses.length,5);assert.ok(E.run.bonuses.includes('mult'));

// Ronda superada paga base + energía + interés y entra en tienda.
E.leaveShop();setHand('EL');E.run.target=1;E.run.coins=10;E.select(100);E.select(101);const played=E.play();assert.ok(played.ok);assert.equal(E.run.status,'shop');assert.ok(E.run.lastIncome.total>=3);assert.ok(E.run.coins>10);

// Evento de apuesta modifica la siguiente ronda.
E.run.shop.eventId='apuesta';E.run.shop.eventResolved=false;assert.ok(E.resolveEvent('accept').ok);assert.equal(E.run.nextTargetFactor,1.25);assert.equal(E.run.nextBounty,8);
const baseNext=E.targetForRound(E.run.round+1);E.leaveShop();assert.equal(E.run.target,Math.round(baseNext*1.25));assert.equal(E.run.activeBounty,8);

// Evento de Musa añade energía siguiente.
E.run.status='shop';E.run.shop={origin:'round',cards:[],refreshCost:2,refreshes:0,eventId:'musa',eventResolved:false,eventResult:''};E.run.coins=10;
assert.ok(E.resolveEvent('accept').ok);assert.equal(E.run.nextEnergyBonus,1);E.leaveShop();assert.equal(E.run.energy,E.roundEnergy()+1);

// Guardado v2 conserva economía y mejoras.
const snap=JSON.parse(JSON.stringify(E.snapshot()));assert.equal(snap.version,2);const coins=snap.run.coins;E.setProfile({studentId:'economy'});assert.equal(E.run,null);assert.ok(E.restore(snap));assert.equal(E.run.coins,coins);assert.ok(E.run.cardLevels);

console.log('Forja OK: monedero, compra/paso, tienda, interés, cartas nivel III, eliminación/grabado de letras, eventos y guardado.');
