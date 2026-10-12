import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const h=fs.readFileSync('apps-script/LenguArcade_Profesor.html','utf8'),c={safe:s=>String(s??'')};vm.createContext(c);vm.runInContext(h.slice(h.indexOf("  var todayMissionId=''"),h.indexOf('  function renderCommandCenter(')),c);
const mission={id:'a',title:'Diez sustantivos',gameId:'lexitrama',publicationStatus:'published',target:10,completion:{students:[{progress:0},{progress:6},{progress:10,completed:true}]}};
const data={missions:[mission,{...mission,id:'draft',publicationStatus:'draft'},{...mission,id:'future',activeFrom:'2099-01-01'}],games:[{id:'lexitrama',name:'Lexitrama'}]};
assert.equal(c.todayActiveMissions(data).length,1);let out=c.renderTodayMission(data);for(const value of ['Sin empezar','En progreso','Completados','Lexitrama','Ver pendientes'])assert.ok(out.includes(value));assert.equal((out.match(/<b>1<\/b>/g)||[]).length,3);
c.todayMissionId='gone';out=c.renderTodayMission(data);assert.equal(c.todayMissionId,'a');assert.ok(c.renderTodayMission({missions:[]}).includes('No hay misiones activas'));
console.log('Inicio profesor: misiones activas, borradores/futuras, estados, juego, selección y vacío correctos.');
