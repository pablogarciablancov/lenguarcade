import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const shared=fs.readFileSync(new URL('../supabase/functions/_shared/student-access.ts',import.meta.url),'utf8');
const sandbox={Date,Map,Set};
vm.createContext(sandbox);
vm.runInContext(stripTypeScriptTypes(shared).replace(/\bexport\s+/g,''),sandbox);
const window={
  published:true,
  classroom_open:false,
  scheduled_enabled:true,
  home_enabled:false,
  active_from:'2026-10-30T12:45:00.000Z',
  active_to:'2026-10-30T13:30:00.000Z',
  game_ids:['battlegrafia','lexoma']
};
const mode=(iso,row=window)=>sandbox.workshopModeFor(row,Date.parse(iso));
assert.equal(mode('2026-10-30T12:44:59.000Z'),'closed','No early opening');
assert.equal(mode('2026-10-30T12:45:00.000Z'),'scheduled','Start is inclusive');
assert.equal(mode('2026-10-30T13:29:59.000Z'),'scheduled','Play remains open until deadline');
assert.equal(mode('2026-10-30T13:30:00.000Z'),'closed','End is exclusive');
assert.equal(mode('2026-10-30T13:31:00.000Z',{...window,classroom_open:true}),'closed','Stale open switch cannot override schedule expiry');
assert.equal(mode('2026-10-30T13:00:00.000Z',{...window,scheduled_enabled:false,classroom_open:true}),'classroom','Legacy classroom remains active');
assert.equal(mode('2026-10-30T13:00:00.000Z',{...window,scheduled_enabled:false,home_enabled:true}),'home','Legacy home window preserved');
const games=new Map([['battlegrafia',true],['lexoma',true]]);
const allowed=(time,game)=>sandbox.studentGameAccess({id:game,status:'Disponible',url:'https://test.local',integration:'embedded'},games,window,new Set(window.game_ids),mode(time)==='scheduled');
assert.equal(allowed('2026-10-30T12:44:59.000Z','battlegrafia').locked,true);
assert.equal(allowed('2026-10-30T12:45:00.000Z','battlegrafia').locked,false);
assert.equal(allowed('2026-10-30T13:00:00.000Z','maniacgrafia').locked,true);
assert.equal(allowed('2026-10-30T13:30:00.000Z','battlegrafia').locked,true);
const repoRoot=new URL('../',import.meta.url);
const get=(path)=>fs.readFileSync(new URL(path,repoRoot),'utf8');
const teacher=get('supabase/functions/teacher-dashboard/index.ts');
const save=get('supabase/functions/save-progress/index.ts');
const student=get('supabase/functions/student-dashboard/index.ts');
const access=get('supabase/functions/student-access-state/index.ts');
const gs=get('apps-script/LenguArcade_Workshop.gs');
const ui=get('apps-script/LenguArcade_Profesor.html');
const boss=get('supabase/functions/class-boss/index.ts');
assert.match(teacher,/scheduled_enabled:scheduledEnabled/);
assert.match(teacher,/closedAt = classroomOpen \|\| homeEnabled \|\| scheduledEnabled/);
assert.match(save,/workshopModeFor\(workshopSession\)/);
assert.match(access,/scheduledExpiry/);
assert.match(student,/mode === "scheduled"|workshopMode === "scheduled"/);
assert.match(gs,/scheduledActive =/);
assert.match(gs,/scheduledEnabled:!!plan.scheduledEnabled && !openNow/);
assert.match(ui,/id="workshopPlanSaveSchedule"/);
assert.match(ui,/function setScheduleEndFromDuration\(/);
assert.match(boss,/data.scheduled_enabled===true/);
console.log('Timed workshops: pre-start, start, exclusion, automatic expiry, override protection, legacy modes and end-of-session save grace OK.');
