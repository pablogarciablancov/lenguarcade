import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Sesiones de LenguArcade: solo Google/Fomento. Las pruebas no realizan
// peticiones externas ni comparten tokens o datos de alumnos reales.
const source=fs.readFileSync('apps-script/LenguArcade_Alumno.html','utf8');
const auth=source.slice(source.indexOf('let secureSessionVerified=false;'),source.indexOf('const sessionVerificationToken=token;'));
const bridge=source.slice(source.indexOf('callServer=async function(fn,args){'),source.indexOf('renderClasses=function(){};'));
const logout=source.slice(source.indexOf('async function secureStudentLogout(){'),source.indexOf('login=function(){return window.secureStudentLogin();};'));
const google=source.slice(source.indexOf('async function loginGoogleViaSupabase(kind){'),source.indexOf('function finishGoogleStudentLogin(result,message){'));
assert.ok(auth.startsWith('let secureSessionVerified=false;'));
assert.ok(bridge.startsWith('callServer=async function(fn,args){'));
assert.ok(logout.startsWith('async function secureStudentLogout(){'));
assert.ok(google.startsWith('async function loginGoogleViaSupabase(kind){'));

function storage() {
  const items=new Map();
  return {
    getItem:key=>items.has(key)?items.get(key):null,
    setItem:(key,value)=>items.set(key,String(value)),
    removeItem:key=>items.delete(key),
  };
}

function server() {
  const access=new Map(),refresh=new Map(),appSessions=new Map(),users=new Map();
  const stats={signup:0,refresh:0,logout:0,google:0,save:0,dashboard:0,pin:0,password:0};
  let id=0,signupStatus=0,refreshStatus=0,logoutStatus=0;
  const response=(status,body)=>({ok:status>=200&&status<300,status,json:async()=>body});
  function tokens(user) {
    const n=++user.serial;
    const session={
      access_token:'access-'+user.id+'-'+n,
      refresh_token:'refresh-'+user.id+'-'+n,
      expires_at:Math.floor(Date.now()/1000)+3600,
    };
    access.set(session.access_token,user);
    refresh.set(session.refresh_token,user);
    return session;
  }
  async function fetch(url,options={}) {
    const path=new URL(url).pathname,body=JSON.parse(options.body||'{}');
    if(path==='/auth/v1/signup') {
      stats.signup++;
      if(signupStatus)return response(signupStatus,{error:'rate_limit_reached'});
      const user={id:++id,serial:0};
      users.set(user.id,user);
      return response(200,tokens(user));
    }
    if(path==='/auth/v1/token') {
      stats.refresh++;
      if(refreshStatus)return response(refreshStatus,{error:'temporarily_unavailable'});
      const user=refresh.get(body.refresh_token);
      if(!user)return response(400,{error:'invalid_grant'});
      refresh.delete(body.refresh_token);
      return response(200,tokens(user));
    }
    const accessToken=String(options.headers.Authorization||'').replace(/^Bearer /,'');
    const user=access.get(accessToken);
    if(!user)return response(401,{error:'unauthorized'});
    if(path==='/functions/v1/pin-login') {
      stats.pin++;
      return response(410,{error:'google_login_required'});
    }
    if(path==='/functions/v1/teacher-login') {
      stats.password++;
      return response(410,{error:'google_login_required'});
    }
    if(path==='/functions/v1/student-profile'&&body.action==='logout') {
      stats.logout++;
      if(logoutStatus)return response(logoutStatus,{error:'profile_unavailable'});
      appSessions.delete(user.id);
      return response(200,{ok:true});
    }
    const login=appSessions.get(user.id);
    if(!login)return response(401,{error:'session_expired'});
    if(path==='/functions/v1/student-dashboard') {
      stats.dashboard++;
      return response(200,{
        ok:true,student:{email:login.email,studentId:login.email,role:login.role},
        general:{xp:15},games:[{gameId:'battlegrafia',progress:{xp:15}}],
      });
    }
    if(path==='/functions/v1/save-progress') {
      stats.save++;
      return response(200,{ok:true});
    }
    throw new Error('Ruta inesperada: '+path);
  }
  function googleLogin(token,fn,email) {
    const user=access.get(token);
    if(!user)throw new Error('Identidad técnica incorrecta');
    const role=fn==='loginTeacherPanelWithGoogle'?'teacher':'student';
    if(fn!=='loginStudentPanelWithGoogle'&&fn!=='loginTeacherPanelWithGoogle'&&fn!=='loginTeacherTestStudentWithGoogle')
      throw new Error('No se permite el acceso: '+fn);
    if(role==='student'&&!email.endsWith('@alumno.fomento.edu'))throw new Error('Dominio de alumno no válido');
    if(role==='teacher'&&(!email.endsWith('@fomento.edu')||email.endsWith('@alumno.fomento.edu')))
      throw new Error('Dominio de profesor no válido');
    stats.google++;
    appSessions.set(user.id,{email,role});
    return {ok:true};
  }
  return {
    fetch,stats,appSessions,googleLogin,
    setSignupStatus:value=>signupStatus=value,
    setRefreshStatus:value=>refreshStatus=value,
    setLogoutStatus:value=>logoutStatus=value,
    invalidateRefresh:value=>refresh.delete(value),
  };
}

function client(api,store=storage(),email='uno@alumno.fomento.edu') {
  const messages=[];
  const elements={
    logoutBtn:{disabled:false},
    loginCard:{classList:{add(){},remove(){}},querySelector(){return {textContent:''};}},
  };
  const ctx=vm.createContext({
    localStorage:store,fetch:api.fetch,console,
    callServer:async()=>{throw new Error('No se permite el inicio de sesión antiguo');},
    baseCall:(fn,args)=>api.googleLogin(args[0],fn,email),
    token:'',currentDashboard:null,busy:false,
    setStatus:value=>messages.push(value),
    setSecureLoginStatus:value=>messages.push(value),
    saveCache:(key,value)=>store.setItem(key,JSON.stringify(value)),
    renderDashboard(){},revealStudentApp(){},hideLoader(){},
    document:{body:{classList:{add(){},remove(){}}}},
    $:id=>elements[id],
    secureLoginElement:selector=>elements.loginCard.querySelector(selector),
  });
  vm.runInContext(auth+'\n'+bridge+'\n'+logout+'\n'+google,ctx);
  function evaluate(expression,vars={}){
    Object.assign(ctx,vars);
    return vm.runInContext(expression,ctx);
  }
  return {
    evaluate,store,messages,
    login:async(kind='student')=>{
      const result=await evaluate('loginGoogleViaSupabase(loginKind)',{loginKind:kind});
      evaluate('token=loginResult.token;supabaseBackend=true;currentDashboard=loginResult.dashboard;secureSessionVerified=true;studentSessionGeneration++',{loginResult:result});
      return result;
    },
  };
}

const html=source;
assert.doesNotMatch(html,/<label>PIN<\/label>/);
assert.doesNotMatch(html,/<input name="studentPin"/);
assert.doesNotMatch(html,/callSupabaseFunction\('pin-login'/);
assert.doesNotMatch(html,/callSupabaseFunction\('teacher-login'/);
assert.match(html,/data-google-student-login/);
assert.match(html,/data-google-teacher-player-login/);
assert.match(html,/loginGameOpponentByCode/);
assert.match(fs.readFileSync('apps-script/LenguArcade_Code.gs','utf8'),/function loginStudent\(email, pin\)[\s\S]{0,170}El acceso con PIN se ha retirado/);

const api=server();
const shared=storage();
let first=client(api,shared);
const initial=await first.login();
assert.equal(api.stats.signup,1,'Primera entrada Google crea identidad técnica');
assert.equal(api.stats.google,1);
assert.equal(initial.dashboard.student.email,'uno@alumno.fomento.edu');
assert.equal(api.appSessions.size,1);
assert.ok(shared.getItem('LA_SUPABASE_SESSION'));
await assert.rejects(first.evaluate('loginSupabaseStudent("uno@alumno.fomento.edu","1234",true)'),/PIN/);
await assert.rejects(first.evaluate('loginSupabaseTeacher("clave",true)'),/clave|Google/);
assert.equal(api.stats.pin,0,'PIN no se consulta');
assert.equal(api.stats.password,0,'Contraseña docente no se consulta');
const saved=await first.evaluate('callServer("saveProgress",[{sessionToken:token,gameId:"battlegrafia"}])');
assert.equal(saved.dashboard.student.email,'uno@alumno.fomento.edu');
assert.equal(api.stats.save,1);

assert.equal(await first.evaluate('secureStudentLogout()'),true);
assert.equal(api.stats.logout,1);
assert.equal(api.appSessions.size,0,'Logout revoca app_sessions');
assert.ok(shared.getItem('LA_SUPABASE_SESSION'),'Mantiene identidad técnica para reutilizar Auth');
await assert.rejects(first.evaluate('loadSupabaseDashboard(oldToken)',{oldToken:initial.token}),/caducado/);
let reloaded=client(api,shared);
assert.equal(await reloaded.evaluate('restoreSupabaseStudentSession()'),false);
await reloaded.login();
assert.equal(api.stats.signup,1,'Segundo Google no crea más identidades');
assert.equal(api.stats.google,2);
assert.equal(await client(api,shared).evaluate('restoreSupabaseStudentSession()'),true);

const expiring=JSON.parse(shared.getItem('LA_SUPABASE_SESSION'));
expiring.expires_at=0;
shared.setItem('LA_SUPABASE_SESSION',JSON.stringify(expiring));
const rotating=client(api,shared);
assert.equal(await rotating.evaluate('restoreSupabaseStudentSession()'),true);
assert.equal(api.stats.refresh,1,'Refresca token antes de recuperar panel');
assert.notEqual(JSON.parse(shared.getItem('LA_SUPABASE_SESSION')).refresh_token,expiring.refresh_token);

const stalled=JSON.parse(shared.getItem('LA_SUPABASE_SESSION'));
stalled.expires_at=0;
shared.setItem('LA_SUPABASE_SESSION',JSON.stringify(stalled));
api.setRefreshStatus(503);
await assert.rejects(rotating.evaluate('getOrCreateSupabaseAnonymousSession()'));
assert.equal(api.stats.signup,1,'Error temporal no crea identidades repetidas');
assert.equal(JSON.parse(shared.getItem('LA_SUPABASE_SESSION')).refresh_token,stalled.refresh_token);
api.setRefreshStatus(0);
const concurrent=await Promise.all([
  rotating.evaluate('getOrCreateSupabaseAnonymousSession()'),
  rotating.evaluate('getOrCreateSupabaseAnonymousSession()'),
]);
assert.equal(concurrent[0].access_token,concurrent[1].access_token);
assert.equal(api.stats.signup,1);

await rotating.evaluate('secureStudentLogout()');
const teacher=client(api,shared,'docente@fomento.edu');
const teacherResult=await teacher.login('teacher');
assert.equal(teacherResult.dashboard.student.role,'teacher');
assert.equal(api.stats.signup,1,'Profesor reutiliza su identidad técnica');
assert.equal(await teacher.evaluate('secureStudentLogout()'),true);

const noSession=client(api,storage());
api.setSignupStatus(429);
await assert.rejects(noSession.evaluate('getOrCreateSupabaseAnonymousSession()'),/demasiados accesos|Demasiados accesos/);
api.setSignupStatus(0);
const failedLogout=client(api,shared);
await failedLogout.login();
api.setLogoutStatus(503);
assert.equal(await failedLogout.evaluate('secureStudentLogout()'),false);
assert.equal(failedLogout.evaluate('secureSessionVerified'),true);
api.setLogoutStatus(0);
assert.equal(await failedLogout.evaluate('secureStudentLogout()'),true);

console.log('Google/Fomento: entrada alumno/profesor, restauración, refresh, logout, guardado y PIN/clave retirados, correctos.');
await import('./check-teacher-player-mode.mjs');
