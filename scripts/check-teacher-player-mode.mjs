import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const server=fs.readFileSync('apps-script/LenguArcade_Code.gs','utf8');
const routes=server.slice(server.indexOf('function doGet(e)'),server.indexOf('function setupLenguArcade_()'));
const context=vm.createContext({LA_OFFICIAL_GAMES:[],HtmlService:{XFrameOptionsMode:{ALLOWALL:'allow'},createHtmlOutputFromFile(file){return {file,content:'<html><head></head><body></body></html>',getContent(){return this.content;},setContent(html){this.content=html;return this;},setTitle(title){this.title=title;return this;},setXFrameOptionsMode(){return this;}};}}});
vm.runInContext(routes,context);
const player=vm.runInContext("doGet({parameter:{page:'jugador-profesor'}})",context);
assert.equal(player.file,'LenguArcade_Alumno');assert.ok(player.content.includes('window.__LA_TEACHER_PLAYER_ENTRY__=true;'));
const teacher=vm.runInContext("doGet({parameter:{page:'profesor'}})",context);assert.equal(teacher.file,'LenguArcade_Profesor');assert.ok(!teacher.content.includes('__LA_TEACHER_PLAYER_ENTRY__'));
const student=vm.runInContext("doGet({parameter:{page:'alumno'}})",context);assert.equal(student.file,'LenguArcade_Alumno');assert.ok(!student.content.includes('__LA_TEACHER_PLAYER_ENTRY__'));
const malicious=vm.runInContext("doGet({parameter:{page:'<script>alert(1)</script>'}})",context);assert.ok(!malicious.content.includes('alert(1)'));

const host=fs.readFileSync('apps-script/LenguArcade_Alumno.html','utf8');
const start=host.indexOf('async function restoreSupabaseStudentSession(){'),end=host.indexOf('const sessionVerificationToken=token;',start);
const auth=host.slice(start,end);
// An explicit teacher entry never resumes a cached pupil; Google still authenticates the teacher.
const isolated=vm.createContext({__LA_TEACHER_PLAYER_ENTRY__:true});vm.runInContext(auth,isolated);
assert.equal(await vm.runInContext('restoreSupabaseStudentSession()',isolated),false);
assert.ok(host.includes("result.source==='supabase'&&!['teacher','admin'].includes(result.dashboard?.student?.role)"));
console.log('Modo jugador: ruta común, marcador sin credenciales, entrada separada de sesión de alumno y rol verificado.');
