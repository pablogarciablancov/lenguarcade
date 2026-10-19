const assert=require('node:assert/strict'),R=require('./branching-routes'),L=require('./eso-lessons');
for(const [id,preset] of Object.entries(R.maps)){
 assert(preset.routes.length>=2);
 const routes=preset.routes.map(R.compile),times=[];
 for(const r of routes){
  assert(r.total>500&&r.total<1100,`${id}: valid route length`);
  const a=R.sample(r,0),b=R.sample(r,r.total);assert.equal(a.x,-30);assert.equal(b.x,510);assert.equal(b.y,180);
  // Traverse the whole road at game-sized steps: no teleport or unfinished tail.
  let old=a;for(let t=1;t<=r.total;t+=1){const p=R.sample(r,t);assert(R.distance(p,old)<=1.001);old=p;}
  const midpoint=R.sample(r,r.total*.55);assert(R.project(midpoint,routes),`${id}: guardian can use every branch`);
  times.push(r.total/25);
 }
 assert(new Set(routes.map(x=>Math.round(x.total))).size>1,`${id}: alternatives have different lengths`);
 assert.equal(R.project({x:550,y:345},routes),null);
 assert(preset.buildSites.every(p=>!R.project(p,routes)),`${id}: platforms stay off the road`);
 console.log(id,preset.routes.length,'routes, lengths',routes.map(r=>Math.round(r.total)).join('/'));
}
const C=L.catalog();let ids=new Set();
for(const [cat,qs]of Object.entries(C)){
 assert(qs.length>=30);
 for(const q of qs){assert(!ids.has(q.id));ids.add(q.id);assert(q.options.includes(q.answer));assert(q.options.length>=2&&q.options.length<=4);assert.equal(new Set(q.options.map(x=>x.toLocaleLowerCase('es-ES'))).size,q.options.length);assert(q.explain.length>15);assert(q.level>=1&&q.level<=3);assert(q.label);assert(!q.options.some(x=>/Ninguna|Todas las anteriores|No se puede saber|vuscar|bibir|sapato|seresa|zosina/.test(x)));}
 for(const tier of [2,3])assert(qs.some(q=>q.level<=tier&&q.level>=tier-1));
 console.log(cat,qs.length,'authored questions');
}
assert(C.ortografia.some(q=>q.answer==='dónde'));assert(C.ortografia.some(q=>q.answer==='donde'));assert(C.ortografia.some(q=>q.answer==='incluido'));assert(C.verbos.some(q=>q.answer==='conduje'));
console.log('Expansion checks passed: roads, placement, endpoints, different lengths and ESO question invariants.');
