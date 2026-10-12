import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const h=fs.readFileSync('apps-script/LenguArcade_Profesor.html','utf8'),ctx={tEsc:s=>String(s??''),formatDate:s=>s};vm.createContext(ctx);vm.runInContext(h.slice(h.indexOf('  function sortMissionTrackingStudents('),h.indexOf('  function renderMissionTracking(')),ctx);
const rows=[{studentId:'a',nombre:'Ana',progress:10,completed:true},{studentId:'b',nombre:'Bruno',progress:6},{studentId:'c',nombre:'Carlos',progress:0},{studentId:'d',nombre:'Daniel',progress:2}];
assert.equal(ctx.sortMissionTrackingStudents(rows,false).map(x=>x.nombre).join(','),'Carlos,Daniel,Bruno,Ana');assert.equal(ctx.sortMissionTrackingStudents(rows,true).length,3);assert.equal(rows[0].nombre,'Ana');
let out=ctx.trackingStudentsHtml(rows,10,{students:[{studentId:'b',lastActivity:'2026-10-12T11:20Z'}]});for(const label of ['Sin empezar','En progreso','Completada','6 / 10','2026-10-12T11:20Z'])assert.ok(out.includes(label));
ctx.missionPendingOnly=true;out=ctx.trackingStudentsHtml(rows,10,{});assert.ok(!out.includes('Ana'));assert.ok(ctx.trackingStudentsHtml([rows[0]],10,{}).includes('No hay alumnos pendientes'));
console.log('Profesor: estados, orden por avance, pendientes, progreso, última actividad y lista original correctos.');
