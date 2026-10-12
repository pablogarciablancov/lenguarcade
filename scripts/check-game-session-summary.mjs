import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const h=fs.readFileSync('apps-script/LenguArcade_Alumno.html','utf8'),context={};vm.createContext(context);vm.runInContext(h.slice(h.indexOf('function buildGameSessionSummary('),h.indexOf('function renderGameSessionSummary(')),context);
const runner={game:{nombre:'Lexitrama'},initialGameXp:100,confirmedGameXp:148,sessionInitialLevel:4,celebrationLevel:5,sessionInitialMissions:new Map([['a',false],['old',true]]),sessionCompletedMissions:[{id:'a',title:'Diez sustantivos'}]};
let s=context.buildGameSessionSummary(runner,{general:{level:5},missions:[{id:'a',title:'Diez sustantivos',completed:true},{id:'old',title:'Antigua',completed:true}]});assert.equal(s.xp,48);assert.equal(s.level,5);assert.equal(s.missions.length,1);assert.equal(s.saveFailed,false);
s=context.buildGameSessionSummary({...runner,pendingResult:{}});assert.equal(s.saveFailed,true);assert.equal(s.xp,48);
s=context.buildGameSessionSummary({...runner,confirmedGameXp:100,celebrationLevel:4,sessionCompletedMissions:[]});assert.equal(s.xp,0);assert.equal(s.level,0);assert.equal(s.missions.length,0);
console.log('Resumen: XP confirmada, nivel nuevo, misiones sin duplicados/antiguas, fallo y sesión sin recompensas correctos.');
