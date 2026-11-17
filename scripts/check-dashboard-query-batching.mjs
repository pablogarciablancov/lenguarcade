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

const totalsHelper=fs.readFileSync('supabase/functions/_shared/platform-xp.js','utf8');
const teacherSource=fs.readFileSync('supabase/functions/teacher-dashboard/index.ts','utf8');
const migration=fs.readFileSync('supabase/migrations/20261117130458_platform_xp_totals_avoid_expensive_event_scans.sql','utf8');
assert.match(totalsHelper,/admin\.rpc\("platform_xp_totals"/,'Los bonus se suman en PostgreSQL');
assert.match(source,/platformXpTotals\(admin,\[profileId\]\)/,'El perfil no descarga miles de eventos de bonus');
assert.match(source,/platformXpTotals\(admin,ids\)/,'El ranking consulta sumas compactas');
assert.match(teacherSource,/platformXpTotals\(admin,activityProfileIds\)/,'El panel docente usa sumas compactas');
assert.match(migration,/revoke all on function public\.platform_xp_totals\(uuid\[\]\) from public,anon,authenticated/i,'El RPC no es público');
assert.match(migration,/grant execute on function public\.platform_xp_totals\(uuid\[\]\) to service_role/i,'Acceso solo de servicio');
const aggregateFn=new Function('admin','profiles',`
  return admin.rpc('platform_xp_totals',{p_profile_ids:profiles});
`);
const rpcCall=[];
const simulated=aggregateFn({rpc:(name,args)=>{rpcCall.push({name,args});return {data:[{profile_id:'p1',event_type:'class_boss_reward',xp_delta:12,feathers_delta:3}],error:null};}},['p1']);
assert.equal(rpcCall.length,1);
assert.equal(rpcCall[0].name,'platform_xp_totals');
assert.equal(simulated.data[0].xp_delta,12);

console.log('Panel: 30 × 12 consultas simuladas, concurrencia máxima '+maxActive+'; orden y datos correctos.');
