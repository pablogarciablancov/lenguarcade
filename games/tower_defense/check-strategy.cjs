const assert=require('node:assert/strict'),S=require('./strategy-core');
const base={damage:20,range:100,fireRate:1,splash:40,weaken:1.3,slow:.6};
for(const [type,options]of Object.entries(S.branches)){
 assert.equal(options.length,2);
 for(const o of options){
  const t={type,level:2,specialization:null};
  assert(S.canChoose(t,o.id,o.cost));assert(!S.canChoose(t,o.id,o.cost-1));
  assert(!S.canChoose({...t,level:1},o.id,999));assert(!S.canChoose({...t,specialization:o.id},o.id,999));
  const s=S.stats(base,type,o.id);assert.notDeepEqual(s,base);assert.deepEqual(base,{damage:20,range:100,fireRate:1,splash:40,weaken:1.3,slow:.6});
  for(const n of Object.values(s))assert(Number.isFinite(n)&&n>0);
  // Multipliers scale higher-level upgrades too, rather than replacing them with level-2 constants.
  if(o.multipliers?.damage)assert.equal(S.stats({...base,damage:30},type,o.id).damage,30*o.multipliers.damage);
 }
}
assert.equal(S.option('corrector','atadura'),null);assert.deepEqual(S.stats(base,'corrector','invalid'),base);
const types={basic:{name:'Moco',shieldLayers:1},boss:{name:'Titán',shieldLayers:4}};
assert.deepEqual(S.wave([{t:'basic',n:3},{t:'boss',n:1},{t:'basic',n:2}],types),{total:6,layers:9,enemies:[{type:'basic',count:5,...types.basic},{type:'boss',count:1,...types.boss}]});
assert.equal(S.wave(undefined,types).total,0);
console.log('Strategy checks passed: costs, eligibility, upgrade scaling, tradeoffs, wave counts and shield layers.');
