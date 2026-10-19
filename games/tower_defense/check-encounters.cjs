const assert=require('node:assert/strict'),E=require('./encounters-core'),R=require('./adaptive-review'),C=require('./eso-lessons').catalog(),Routes=require('./branching-routes');
const all=Object.values(C).flat();
for(const tier of [2,3])for(const q of all.filter(q=>q.level<=tier&&q.level>=tier-1))assert(R.pool(C,q.cat,tier).some(other=>other.id!==q.id&&other.display!==q.display&&R.skill(other)===R.skill(q)),`Different example available for ${q.id}, tier ${tier}`);
const source=C.ortografia.find(q=>q.answer==='sino'),wrong=R.load(null,C),unrelated=C.verbos[0];
R.record(wrong,source,false,C,2);assert.equal(wrong.pending.length,1);
assert.equal(R.select(wrong,'ortografia',C,2),null);
for(let i=0;i<4;i++){assert.equal(R.select(wrong,'ortografia',C,2),null);R.record(wrong,unrelated,true,C,2);}
assert.equal(R.select(wrong,'verbos',C,2),null);
const review=R.select(wrong,'ortografia',C,2,()=>0);assert(review);assert.notEqual(review.display,source.display);assert.equal(R.skill(review),R.skill(source));assert(review.options.includes(review.answer));
assert.equal(R.select(wrong,'ortografia',C,2),null);
R.record(wrong,review,true,C,2);assert.equal(wrong.pending[0].successes,1);
for(let i=0;i<7;i++)R.record(wrong,unrelated,true,C,2);
const second=R.select(wrong,'ortografia',C,2,()=>0);assert(second);assert.notEqual(second.display,review.display);
R.record(wrong,second,true,C,2);assert.equal(wrong.pending.length,0);assert.equal(wrong.mastered,1);
// A second failure delays the same rule instead of creating duplicate entries.
R.record(wrong,source,false,C,2);R.record(wrong,source,false,C,2);assert.equal(wrong.pending.length,1);assert.equal(wrong.pending[0].successes,0);assert.equal(wrong.pending[0].due,wrong.turn+4);
const restored=R.load(JSON.parse(JSON.stringify(wrong)),C);assert.equal(restored.pending[0].skill,R.skill(source));assert.equal(restored.turn,wrong.turn);
assert.equal(R.load({pending:[{skill:'not-a-rule'},null]},C).pending.length,0);
assert.equal(R.load({turn:-5,recent:'invalid'},C).turn,0);
assert.equal(R.load(null,C).pending.length,0); // A new pupil never inherits another one's review queue.
// Mixed branch routes expose exactly the actual branching nodes, without false junctions at merges.
assert.equal(E.forks(Routes.maps.caldera.routes.map(Routes.compile)).size,2);
for(const id of ['bosque_bifurcado','marisma','cumbres'])assert.equal(E.forks(Routes.maps[id].routes.map(Routes.compile)).size,1);
const victim={alive:true,shieldActive:false,x:0,y:0},protector={type:'protector',alive:true,x:45,y:0};
assert.equal(E.protectedBy(victim,[victim,protector]),protector);assert.equal(E.protectedBy(protector,[protector]),null);
victim.shieldActive=true;assert.equal(E.protectedBy(victim,[protector]),null);victim.shieldActive=false;protector.alive=false;assert.equal(E.protectedBy(victim,[protector]),null);
assert.equal(E.stolen(200),18);assert.equal(E.stolen(5),5);assert.equal(E.stolen(-3),0);
const original=Array.from({length:10},()=>[{t:'fast',n:6,gap:1},{t:'basic',n:8,gap:1},{t:'swarm',n:10,gap:1},{t:'armored',n:4,gap:1},{t:'boss',n:1,gap:1}]),expanded=E.waves(original);
for(let i=0;i<10;i++){assert.equal(expanded[i].reduce((s,g)=>s+g.n,0),29);assert.equal(original[i].length,5);for(const g of expanded[i])if(E.types[g.t])assert(i+1>=E.types[g.t].firstWave);assert.equal(expanded[i].find(g=>g.t==='boss').n,1);}
console.log('Encounters and review passed: all questions have alternative examples, answer-based spacing, mastery, persistence, isolation, branching nodes, non-stacking protection, theft and progressive waves.');
