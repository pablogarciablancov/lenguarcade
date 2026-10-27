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

const reconnect=host.slice(host.indexOf('  const openGameBeforeRayuelaReconnect='),host.indexOf('  window.secureTestStudentLogin='));
function recovery({backend=false,profile={clase:'PROFES'},failure=false,role='teacher'}={}){
  const opened=[],elements={},calls=[];
  const ctx=vm.createContext({currentDashboard:{student:profile},supabaseBackend:backend,
    openGame:id=>opened.push(id),showLoader(){},hideLoader(){},setStatus:s=>calls.push(s),
    q:id=>elements[id]??=( {textContent:'',classList:{add(){}}} ),
    async loginGoogleViaSupabase(kind){calls.push(kind);await Promise.resolve();if(failure)throw Error('Conexión interrumpida');return {source:'supabase',dashboard:{student:{role}}};},
    finishGoogleStudentLogin(result){ctx.currentDashboard=result.dashboard;ctx.supabaseBackend=true;}
  });
  vm.runInContext(reconnect,ctx);return {ctx,opened,elements,calls};
}
const restored=recovery();
const first=restored.ctx.openGame('rayuela'),duplicate=restored.ctx.openGame('rayuela');
assert.equal(first,duplicate,'doble clic comparte la reconexión');await first;
assert.deepEqual(restored.opened,['rayuela']);assert.equal(restored.ctx.supabaseBackend,true);
assert.equal(restored.calls.filter(c=>c==='teacher').length,1);
for(const options of [{backend:true},{profile:{role:'student'}}]){
  const bypass=recovery(options);await bypass.ctx.openGame('rayuela');assert.deepEqual(bypass.opened,['rayuela']);assert.equal(bypass.calls.length,0);
}
const other=recovery();await other.ctx.openGame('scrabble');assert.deepEqual(other.opened,['scrabble']);assert.equal(other.calls.length,0);
for(const options of [{failure:true},{role:'student'}]){
  const failed=recovery(options);await failed.ctx.openGame('rayuela');assert.equal(failed.opened.length,0);assert.equal(failed.ctx.supabaseBackend,false);
  assert.match(failed.elements.gameModalText.textContent,/No se ha podido/);
  await failed.ctx.openGame('rayuela');assert.equal(failed.calls.filter(c=>c==='teacher').length,2,'se puede reintentar tras un fallo');
}
console.log('Rayuela: reconexión de profesor legacy, doble clic, error visible, reintento y aislamiento de alumnos y otros juegos correctos.');
