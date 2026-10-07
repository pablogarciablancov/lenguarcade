const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');
import fs from 'node:fs';import assert from 'node:assert/strict';
import {createState,command,advance} from '../supabase/functions/conjuga-online/engine.js';
import {makePlayer,normalizeSave} from '../supabase/functions/conjuga-online/rules.js';
export const db=new PGlite();
await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create table public.organizations(id uuid primary key);create table public.profiles(id uuid primary key,role text not null default 'student');create table public.classrooms(id uuid primary key);create table public.games(id text primary key);");
const src=fs.readFileSync('supabase/migrations/202606120001_initial_lenguarcade.sql','utf8');
for(const name of ['game_progress','game_events','achievement_definitions','player_achievements','game_saves']){
 const start=src.indexOf('create table public.'+name+' ('),end=src.indexOf('\n);',start)+3;
 await db.exec(src.slice(start,end));
}
await db.exec('grant all on all tables in schema public to service_role;');
await db.exec(fs.readFileSync('supabase/migrations/20261007163618_conjuga_apuesta_online.sql','utf8'));
export const A='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',ORG='cccccccc-cccc-4ccc-cccc-cccccccccccc',CLASS='dddddddd-dddd-4ddd-dddd-dddddddddddd';
await db.query('insert into organizations values ($1)',[ORG]);await db.query('insert into classrooms values ($1)',[CLASS]);await db.query('insert into profiles(id) values ($1),($2)',[A,B]);await db.exec("insert into games values ('conjuga_apuesta');");
let now=Date.now(),n=0;
export function newState(){const save=normalizeSave(null),s=createState({id:A,name:'Alumno A',save},{rounds:5,timerSeconds:30},Date.now());s.players.push({...makePlayer('Alumno B',1,save,'opponent'),profileId:B,baseSave:structuredClone(save),ready:false});s.lastSeen[B]=Date.now();return s;}
export async function put(room){return (await db.query('select commit_conjuga_online_room($1,$2,$3,$4) as room',[room.id,room.version,room.guest_profile_id,JSON.stringify(room.state)])).rows[0].room;}
export async function insert(state,code='ABCDEFGH'){
 return (await db.query('insert into multiplayer_rooms(game_id,organization_id,classroom_id,host_profile_id,guest_profile_id,code,state) values ($1,$2,$3,$4,$5,$6,$7) returning *',['conjuga_apuesta',ORG,CLASS,A,state.players.length===2?B:null,code,JSON.stringify(state)])).rows[0];
}
const s=newState();const room=await insert(s);
const cmd=(actor,action,extra={})=>command(s,actor,action,{requestId:'db'+(++n),...extra},now);
cmd(A,'ready');cmd(B,'ready');
for(let t=0;t<10;t++){
 const actor=s.players[s.currentPlayer].profileId;s.lastSeen[A]=s.lastSeen[B]=now;
 cmd(actor,'reveal',{tier:'basic',bet:10});cmd(actor,'answer',{answer:s.currentQuestion.respuesta});now+=2801;advance(s,now);
}
room.state=s;const saved=await put(room);assert.equal(saved.state.phase,'finished');assert.equal(saved.version,1);
const progress=(await db.query('select * from game_progress order by profile_id')).rows;
assert.equal(progress.length,2);for(const p of progress){assert.equal(p.xp,30);assert.equal(p.attempts,5);assert.equal(p.successes,5);assert.equal(p.sessions,1);assert.equal(p.accuracy,'100.00');}
assert.equal((await db.query('select * from game_events')).rows.length,2);
assert.equal(await put(room),null);room.version=1;await put(room);
assert.equal((await db.query('select sum(xp) as xp,sum(sessions) as sessions from game_progress')).rows[0].xp,60);
assert.equal((await db.query('select * from game_events')).rows.length,2);
const anonPerm=(await db.query("select has_table_privilege('authenticated','multiplayer_rooms','select') as tab, has_function_privilege('authenticated','commit_conjuga_online_room(uuid,integer,uuid,jsonb)','execute') as fn")).rows[0];assert.equal(anonPerm.tab,false);assert.equal(anonPerm.fn,false);
console.log('Postgres real (PGlite): migración, recompensas de ambos perfiles, logros, transacción, versión e idempotencia correctos.');
// Concurrent-tab behavior: creation returns the existing room; a profile cannot
// occupy a second room as the guest. No version update survives the rejection.
const fresh=createState({id:A,name:'Alumno A',save:normalizeSave(null)},{},Date.now());
let created=(await db.query('select create_conjuga_online_room($1,$2,$3,$4,$5) as room',[A,ORG,CLASS,'ABCD2345',JSON.stringify(fresh)])).rows[0].room;
const duplicate=(await db.query('select create_conjuga_online_room($1,$2,$3,$4,$5) as room',[A,ORG,CLASS,'BCDE2345',JSON.stringify(fresh)])).rows[0].room;
assert.equal(duplicate.id,created.id);
const guestState=createState({id:B,name:'Alumno B',save:normalizeSave(null)},{},Date.now());
await db.query('select create_conjuga_online_room($1,$2,$3,$4,$5)',[B,ORG,CLASS,'CDEF2345',JSON.stringify(guestState)]);
created.guest_profile_id=B;created.state.players.push({...makePlayer('Alumno B',1,normalizeSave(null),'opponent'),profileId:B,baseSave:normalizeSave(null)});
await assert.rejects(()=>put(created),/already_in_room/);
assert.equal((await db.query('select version from multiplayer_rooms where id=$1',[created.id])).rows[0].version,0);
console.log('Salas: creación repetida recupera sala; pertenencia exclusiva y rechazo transaccional correctos.');
// Apply the follow-up migration to an existing database; teacher rewards stay untouched.
await db.exec(fs.readFileSync('supabase/migrations/20261007180458_conjuga_apuesta_teacher_online.sql','utf8'));
await db.exec('delete from multiplayer_rooms;');
await db.query("update profiles set role='teacher' where id=$1",[A]);
const beforeTeacher=(await db.query('select * from game_progress where profile_id=$1',[A])).rows;
const teacherMatch=newState();teacherMatch.players[0].profileRole='student'; // deliberate mismatch: database role remains teacher
const teacherRoom=await insert(teacherMatch,'TEACH234');
now=Date.now();
command(teacherMatch,A,'ready',{requestId:'teacherready'},now);command(teacherMatch,B,'ready',{requestId:'studentready'},now);
for(let t=0;t<10;t++){
 const actor=teacherMatch.players[teacherMatch.currentPlayer].profileId;teacherMatch.lastSeen[A]=teacherMatch.lastSeen[B]=now;
 command(teacherMatch,actor,'reveal',{tier:'basic',bet:10,requestId:'teacherreveal'+t},now);
 command(teacherMatch,actor,'answer',{answer:teacherMatch.currentQuestion.respuesta,requestId:'teacheranswer'+t},now);
 now+=2801;advance(teacherMatch,now);
}
teacherRoom.state=teacherMatch;await put(teacherRoom);
assert.deepEqual((await db.query('select * from game_progress where profile_id=$1',[A])).rows,beforeTeacher);
assert.equal((await db.query('select * from game_events where profile_id=$1',[A])).rows.length,1);
assert.equal((await db.query('select xp,successes,sessions from game_progress where profile_id=$1',[B])).rows[0].xp,60);
assert.equal((await db.query('select * from game_events where profile_id=$1',[B])).rows.length,2);
const idempotent=await put(teacherRoom);assert.equal(idempotent,null);
// Even a forged state role cannot turn a teacher into a rewarded student.
assert.equal((await db.query('select * from game_saves where profile_id=$1',[A])).rows[0].revision,1);
console.log('Profesor–alumno: alumno recibe progreso y recompensas; profesor conserva sus datos intactos; cierre idempotente.');
await db.close();
