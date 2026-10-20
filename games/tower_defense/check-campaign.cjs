const assert=require('node:assert/strict'),C=require('./campaign-core');
const clean=C.load(null);assert.equal(Object.keys(clean.maps).length,8);assert.equal(C.total(clean),0);
const stats={attempts:40,correct:32,byCategory:{ortografia:{correct:12},verbos:{correct:10},lexico:{correct:10}}},towers=[{level:2},{level:3}];
for(const key of Object.keys(C.missions)){
 const run=C.run(null,key);run.routeKills.fill(3);run.protectors=2;
 const perfect=C.result(key,{victory:true,waveIndex:10,lives:15,stats,towers},run);assert.deepEqual(perfect.stars,[true,true,true],key);
 assert.deepEqual(C.result(key,{victory:false,waveIndex:10,lives:20,stats,towers},run).stars,[false,false,false]);
 assert.deepEqual(C.result(key,{victory:true,waveIndex:9,lives:20,stats,towers},run).stars,[false,false,false]);
 assert.equal(C.award(clean,key,perfect),3);assert.equal(C.award(clean,key,perfect),0);assert.equal(clean.maps[key].wins,2);
}
assert.equal(C.total(clean),24);
const campaign=C.load(null),run=C.run(null,'bosque');
const one=C.result('bosque',{victory:true,waveIndex:10,lives:16,stats:{correct:8},towers:[]},run);assert.deepEqual(one.stars,[true,true,false]);assert.equal(C.award(campaign,'bosque',one),2);
const two=C.result('bosque',{victory:true,waveIndex:10,lives:14,stats:{correct:12},towers:[]},run);assert.deepEqual(two.stars,[true,false,true]);assert.equal(C.award(campaign,'bosque',two),1);assert.deepEqual(campaign.maps.bosque.stars,[true,true,true]);
C.award(campaign,'bosque',{won:false,stars:[false,false,false]});assert.equal(C.count(campaign.maps.bosque.stars),3);
const invalid=C.load({maps:{bosque:{stars:[false,true,true],wins:-1},unknown:{stars:[true,true,true]}}});assert.equal(C.total(invalid),0);assert.equal(invalid.maps.bosque.wins,0);
assert.equal(C.goals('trigal',{attempts:20,correct:15})[1].met,true);assert.equal(C.goals('trigal',{attempts:24,correct:17})[1].met,false);assert.equal(C.goals('trigal',{})[1].met,false);
const routes=C.run(null,'caldera');for(let i=0;i<4;i++)C.kill(routes,{routeId:i,type:'basic'});assert(routes.routeKills.every(n=>n===1));C.kill(routes,{routeId:99,type:'protector'});assert.equal(routes.protectors,1);assert.equal(routes.routeKills.length,4);
routes.finished=true;C.kill(routes,{routeId:0,type:'protector'});assert.equal(routes.protectors,1);assert.equal(routes.routeKills[0],1);
assert.deepEqual(C.run(routes,'marisma').routeKills,[0,0,0]);assert.equal(C.run(routes,'caldera').finished,true);assert.equal(C.run(null,'caldera').finished,false);
const saved=C.load(JSON.parse(JSON.stringify(campaign)));assert.equal(C.total(saved),3);assert.equal(C.total(C.load(null)),0);
console.log('Campaign checks passed: eight missions, 24 stars, victory gating, exact accuracy, per-star permanent records, route kills, completed runs, old/corrupt saves and pupil isolation.');
