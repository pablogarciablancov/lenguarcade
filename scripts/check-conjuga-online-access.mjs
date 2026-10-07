import assert from 'node:assert/strict';
import {access,classroomForCreate,canPair} from '../supabase/functions/conjuga-online/access.js';

const rows={
  profiles:[{id:'T',role:'teacher',active:true,organization_id:'O'},{id:'U',role:'teacher',active:true,organization_id:'O'},{id:'S',role:'student',active:true,organization_id:'O'},{id:'X',role:'teacher',active:false,organization_id:'O'},{id:'A',role:'admin',active:true,organization_id:'O'}],
  games:[{id:'conjuga_apuesta',active:true,status:'en pruebas',url:'https://game.test/',integration:'embedded'}],
  profile_game_access:[],
  classrooms:[{id:'C',name:'Clase',legacy_class_code:'2C',organization_id:'O',active:true},{id:'F',name:'Otra organización',organization_id:'foreign',active:true},{id:'OLD',organization_id:'O',active:false},{id:'OTHER',name:'Otra clase',organization_id:'O',active:true}],
  classroom_teachers:[{profile_id:'T',classroom_id:'C'},{profile_id:'T',classroom_id:'F'},{profile_id:'T',classroom_id:'OLD'}],
  classroom_enrollments:[{profile_id:'S',classroom_id:'C',active:true},{profile_id:'S',classroom_id:'OTHER',active:false}],
  workshop_sessions:[],
};
const admin={from(table){let filtered=rows[table];const q={select(){return q;},eq(key,value){filtered=filtered.filter(r=>r[key]===value);return q;},in(key,values){filtered=filtered.filter(r=>values.includes(r[key]));return q;},limit(n){filtered=filtered.slice(0,n);return q;},single(){return Promise.resolve({data:filtered[0],error:null});},maybeSingle(){return q.single();},then(resolve,reject){return Promise.resolve({data:filtered,error:null}).then(resolve,reject);}};return q;}};
let t=await access(admin,'T');assert.deepEqual(t.classes,['C']);assert.equal(t.allowed,true);
assert.equal(classroomForCreate(t,{classCode:'2C'}),'C');assert.equal(classroomForCreate(t,{classCode:'C'}),'C');
assert.equal(classroomForCreate(t,{classCode:'OTHER'}),undefined);assert.equal(classroomForCreate(t,{classCode:'F'}),undefined);
assert.deepEqual((await access(admin,'U')).classes,[]);assert.equal((await access(admin,'X')).allowed,false);
assert.deepEqual((await access(admin,'A')).classes,['C','OTHER']);
let student=await access(admin,'S');assert.deepEqual(student.classes,['C']);assert.equal(student.allowed,true);
assert.equal(classroomForCreate(student,{classCode:'F'}),'C');
rows.profile_game_access.push({profile_id:'S',game_id:'conjuga_apuesta',enabled:false});
assert.equal((await access(admin,'S')).allowed,false);assert.equal((await access(admin,'T')).allowed,true);
rows.profile_game_access=[];
rows.workshop_sessions=[{classroom_id:'C',published:true,classroom_open:false,home_enabled:false,game_ids:['conjuga_apuesta']}];
assert.equal((await access(admin,'S')).allowed,false);
rows.workshop_sessions[0].classroom_open=true;assert.equal((await access(admin,'S')).allowed,true);
rows.classroom_teachers=[];assert.deepEqual((await access(admin,'T')).classes,[]);
for(const [a,b,expected] of [['student','student',true],['teacher','student',true],['student','teacher',true],['admin','student',true],['teacher','teacher',false],['teacher','admin',false],['student','unknown',false]])assert.equal(canPair(a,b),expected);
console.log('Permisos online: clases propias, organización, roles, archivo, retirada de permiso y cierre del juego correctos.');
