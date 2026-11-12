import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';

// Prueba real del helper utilizado en student-dashboard sin entrar en Supabase.
const source=fs.readFileSync('supabase/functions/student-dashboard/index.ts','utf8');
const first=source.indexOf('export async function batchedDashboardReads(');
const last=source.indexOf('\nDeno.serve(',first);
assert.ok(first>0&&last>first,'Falta el límite de concurrencia del panel');
const helperSource=stripTypeScriptTypes(source.slice(first,last).replace(/^export /,''));
const batchedDashboardReads=vm.runInNewContext(helperSource+'\nbatchedDashboardReads',{Promise});
let active=0,maxActive=0,calls=0;
function dashboardTasks(student){
  return Array.from({length:12},(_,index)=>async()=>{
    active++;calls++;
    maxActive=Math.max(maxActive,active);
    await Promise.resolve();
    await Promise.resolve();
    active--;
    return student+':'+index;
  });
}
// 30 alumnos × 12 consultas: nunca más de dos solicitudes simultáneas
// por alumno, y se mantiene el orden/resultado de las doce.
const responses=await Promise.all(Array.from({length:30},(_,student)=>
  batchedDashboardReads(dashboardTasks(student),2)));
assert.equal(calls,360);
assert.ok(maxActive<=60,'Hay más de dos consultas simultáneas por alumno');
assert.equal(responses.length,30);
for(let student=0;student<30;student++)
  assert.deepEqual(Array.from(responses[student]),
    Array.from({length:12},(_,i)=>student+':'+i));
console.log('Panel: 30 × 12 consultas simuladas, concurrencia máxima '+maxActive+'; orden y datos correctos.');
