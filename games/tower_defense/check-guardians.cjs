const assert=require('node:assert/strict');
const {TYPES,roster,recruit,pathPoint,Fighter}=require('./guardian-core');
let r=roster({coins:200,owned:['invalid','mago','mago'],selected:'invalid'});
assert.deepEqual(r.owned,['custodio','mago']);assert.equal(r.selected,'custodio');
assert(recruit(r,'arquera'));assert.equal(r.coins,110);assert(!recruit(r,'arquera'));assert(!recruit(r,'vigia'));assert.equal(r.coins,110);
const path=[{x:-30,y:50},{x:100,y:50},{x:100,y:150}];
assert.equal(pathPoint({x:20,y:54},path).y,50);assert.equal(pathPoint({x:20,y:90},path),null);
function enemy(x,y,shield=true){return {x,y,alive:true,shieldActive:shield,hp:200,cfg:{dmg:1},slowFactor:1,slowUntil:0,progressScore(){return x},takeDamage(d){if(this.shieldActive)return;this.hp-=d;if(this.hp<=0)this.alive=false}};}
for(const id of Object.keys(TYPES)){
 const f=new Fighter(id,{x:60,y:50}),e=enemy(70,50);
 f.update(.1,[e],1000);assert.equal(e.hp,200,`${id} must respect shields`);assert(e.shieldActive);
 assert.equal(f.shieldTarget([e]),e);e.shieldActive=false;
 f.update(2,[e],3000);assert(e.hp<200,`${id} damages exposed monsters`);
}
const f=new Fighter('custodio',{x:60,y:50}),near=[enemy(62,50),enemy(63,50),enemy(64,50)];
assert.equal(f.blocked(near).length,2);f.hp=.1;f.update(1,near,0);assert.equal(f.recovery,12);assert.equal(f.blocked(near).length,0);f.update(12,[],0);assert.equal(f.hp,f.cfg.hp);assert.equal(f.recovery,0);
const m=new Fighter('mago',{x:60,y:50}),pack=[enemy(70,50,false),enemy(73,50,false),enemy(74,50,true)];m.update(.1,pack,0);assert(pack[0].hp<200&&pack[1].hp<200);assert.equal(pack[2].hp,200);
const v=new Fighter('vigia',{x:60,y:50}),e=enemy(80,50);v.update(.1,[e],1000);assert.equal(e.slowFactor,TYPES.vigia.slow);assert(e.slowUntil>1000);assert.equal(e.hp,200);
console.log('Guardianes: reclutamiento, moneda, camino, cuatro ataques, escudos, bloqueo, área, ralentización y recuperación correctos.');
