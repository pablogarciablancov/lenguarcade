import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('apps-script/LenguArcade_Alumno.html','utf8');
const auth=source.slice(source.indexOf('let secureSessionVerified=false;'),source.indexOf('const sessionVerificationToken=token;'));
const bridge=source.slice(source.indexOf('callServer=async function(fn,args){'),source.indexOf('renderClasses=function(){};'));
const logout=source.slice(source.indexOf('async function secureStudentLogout(){'),source.indexOf('login=secureStudentLogin;'));
const google=source.slice(source.indexOf('async function loginGoogleViaSupabase(kind){'),source.indexOf('function finishGoogleStudentLogin(result,message){'));
assert.ok(auth.startsWith('let secureSessionVerified=false;')&&bridge.startsWith('callServer=async function(fn,args){')&&logout.startsWith('async function secureStudentLogout(){')&&google.startsWith('async function loginGoogleViaSupabase(kind){'));

function storage(){
  const values=new Map();
  return {
    getItem:key=>values.has(key)?values.get(key):null,
    setItem:(key,value)=>values.set(key,String(value)),
    removeItem:key=>values.delete(key),
  };
}

function server(){
  const users=new Map();
  const access=new Map();
  const refresh=new Map();
  const appSessions=new Map();
  const counts={signup:0,refresh:0,logout:0,progress:0};
  let nextId=0;
  let signupStatus=0;
  let refreshStatus=0;
  let logoutStatus=0;
  const response=(status,body)=>({ok:status>=200&&status<300,status,json:async()=>body});
  function tokens(user){
    user.serial++;
    const auth={access_token:`access-${user.id}-${user.serial}`,refresh_token:`refresh-${user.id}-${user.serial}`,expires_at:Math.floor(Date.now()/1000)+3600};
    access.set(auth.access_token,user);
    refresh.set(auth.refresh_token,user);
    user.auth=auth;
    return auth;
  }
  async function fetch(url,options){
    const path=new URL(url).pathname;
    const body=JSON.parse(options.body||'{}');
    if(path==='/auth/v1/signup'){
      counts.signup++;
      if(signupStatus)return response(signupStatus,{error:'rate_limit_reached'});
      const user={id:++nextId,serial:0};
      users.set(user.id,user);
      return response(200,tokens(user));
    }
    if(path==='/auth/v1/token'){
      counts.refresh++;
      if(refreshStatus)return response(refreshStatus,{error:'temporarily_unavailable'});
      const user=refresh.get(body.refresh_token);
      if(!user)return response(400,{error:'invalid_grant'});
      refresh.delete(body.refresh_token);
      return response(200,tokens(user));
    }
    const user=access.get(String(options.headers.Authorization||'').replace(/^Bearer /,''));
    if(!user)return response(401,{error:'unauthorized'});
    if(path==='/functions/v1/pin-login'){
      if(body.pin!=='1234')return response(401,{error:'invalid_credentials'});
      appSessions.set(user.id,body.email);
      return response(200,{profile:{email:body.email}});
    }
    if(path==='/functions/v1/teacher-login'){
      appSessions.set(user.id,'teacher');
      return response(200,{profile:{role:'teacher'}});
    }
    if(path==='/functions/v1/student-dashboard'){
      const email=appSessions.get(user.id);
      return email?response(200,{student:{email,studentId:email},games:[{gameId:'battlegrafia'}]})
        :response(401,{error:'session_expired'});
    }
    if(path==='/functions/v1/student-profile'&&body.action==='logout'){
      counts.logout++;
      if(logoutStatus)return response(logoutStatus,{error:'profile_unavailable'});
      if(!appSessions.has(user.id))return response(401,{error:'session_expired'});
      appSessions.delete(user.id);
      return response(200,{ok:true});
    }
    if(path==='/functions/v1/save-progress'){
      if(!appSessions.has(user.id))return response(401,{error:'session_expired'});
      counts.progress++;
      return response(200,{ok:true});
    }
    throw new Error(`Petición inesperada: ${path}`);
  }
  return {
    fetch,counts,appSessions,access,refresh,
    setSignupStatus:value=>signupStatus=value,
    setRefreshStatus:value=>refreshStatus=value,
    setLogoutStatus:value=>logoutStatus=value,
    invalidateRefresh:value=>refresh.delete(value),
    googleLogin:(token,kind)=>{
      const user=access.get(token);
      if(!user)throw new Error('Token no reconocido');
      appSessions.set(user.id,kind);
      return {ok:true};
    },
  };
}

function client(api,localStorage=storage(),legacyCall=async()=>({ok:true})){
  const status=[];
  const elements={
    logoutBtn:{disabled:false},
    loginCard:{classList:{add(){},remove(){}},querySelector(selector){
      return selector==='[name="studentPin"]'||selector==='[name="studentEmail"]'?{value:'anterior'}:{textContent:''};
    }},
  };
  const context=vm.createContext({
    localStorage,fetch:api.fetch,console,
    callServer:legacyCall,
    baseCall:async(fn,args)=>api.googleLogin(args[0],fn),
    token:'',currentDashboard:null,busy:false,
    setStatus:message=>status.push(message),
    setSecureLoginStatus:message=>status.push(message),
    saveCache:(key,value)=>localStorage.setItem(key,JSON.stringify(value)),
    renderDashboard(){},revealStudentApp(){},
    document:{body:{classList:{add(){},remove(){}}}},
    $:id=>elements[id],
    secureLoginElement:selector=>elements.loginCard.querySelector(selector),
  });
  vm.runInContext(`${auth}\n${bridge}\n${logout}\n${google}`,context);
  const evaluate=(expression,values={})=>{
    Object.assign(context,values);
    return vm.runInContext(expression,context);
  };
  return {
    localStorage,status,evaluate,
    login:async(email='uno@alumno.fomento.edu')=>{
      const result=await evaluate('loginSupabaseStudent(testEmail,"1234",true)',{testEmail:email});
      evaluate('token=loginResult.token;supabaseBackend=true;currentDashboard=loginResult.dashboard;secureSessionVerified=true', {loginResult:result});
      return result;
    },
  };
}

async function check(){
  const api=server();
  const browserStorage=storage();
  let first=client(api,browserStorage);
  const initial=await first.login();
  assert.equal(api.counts.signup,1,'Primer login crea una identidad');
  assert.equal(api.appSessions.get(1),'uno@alumno.fomento.edu');
  assert.ok(browserStorage.getItem('LA_SUPABASE_SESSION'));

  assert.equal(await first.evaluate('secureStudentLogout()'),true);
  assert.equal(api.counts.logout,1);
  assert.equal(api.appSessions.has(1),false,'El logout revoca app_sessions');
  assert.ok(browserStorage.getItem('LA_SUPABASE_SESSION'),'El logout conserva la identidad técnica');
  await assert.rejects(first.evaluate('loadSupabaseDashboard(oldToken)',{oldToken:initial.token}),/caducado/);

  first=client(api,browserStorage); // Recarga tras salir: hay identidad, pero no sesión de alumno.
  browserStorage.setItem('LA_LEGACY_STUDENT_TOKEN','sesion-anterior');
  assert.equal(await first.evaluate('restoreSupabaseStudentSession()'),false);
  assert.ok(browserStorage.getItem('LA_SUPABASE_SESSION'));
  assert.equal(browserStorage.getItem('LA_LEGACY_STUDENT_TOKEN'),null,'Restore limpia respaldo antiguo');
  assert.equal(api.counts.signup,1);
  await first.login();
  assert.equal(api.counts.signup,1,'Segundo login no llama /signup');
  assert.equal(await first.evaluate('secureStudentLogout()'),true);
  const second=await first.login('dos@alumno.fomento.edu');
  assert.equal(api.appSessions.get(1),'dos@alumno.fomento.edu');
  assert.equal(api.counts.signup,1,'Otro alumno reutiliza el navegador');

  let reloaded=client(api,browserStorage);
  assert.equal(await reloaded.evaluate('restoreSupabaseStudentSession()'),true,'Recarga autenticada');
  assert.equal(reloaded.evaluate('currentDashboard.student.email'),'dos@alumno.fomento.edu');

  await reloaded.evaluate('secureStudentLogout()');
  await assert.rejects(reloaded.evaluate('loginSupabaseStudent("uno@alumno.fomento.edu","9999",true)'),/Credenciales incorrectas/);
  assert.ok(browserStorage.getItem('LA_SUPABASE_SESSION'),'PIN incorrecto no destruye identidad');
  assert.equal(api.counts.signup,1);

  const expired=JSON.parse(browserStorage.getItem('LA_SUPABASE_SESSION'));
  expired.expires_at=0;
  browserStorage.setItem('LA_SUPABASE_SESSION',JSON.stringify(expired));
  await reloaded.login();
  assert.equal(api.counts.refresh,1,'Token caducado rota mediante refresh');
  assert.equal(api.counts.signup,1);
  assert.notEqual(JSON.parse(browserStorage.getItem('LA_SUPABASE_SESSION')).refresh_token,expired.refresh_token);

  const opponent=await reloaded.evaluate('callServer("loginGameOpponent",[token,"rival@alumno.fomento.edu","1234","battlegrafia"])');
  assert.notEqual(opponent.token,reloaded.evaluate('token'));
  assert.equal(api.counts.signup,2,'Rival crea identidad independiente');
  assert.equal(JSON.parse(browserStorage.getItem('LA_SUPABASE_SESSION')).access_token,reloaded.evaluate('token'));
  assert.equal(api.appSessions.get(1),'uno@alumno.fomento.edu','Rival no desplaza sesión principal');
  await reloaded.evaluate('callServer("saveProgress",[{sessionToken:token,gameId:"battlegrafia"}])');
  assert.equal(api.counts.progress,1,'Guardado principal sigue funcionando');

  await reloaded.evaluate('secureStudentLogout()');
  const teacher=await reloaded.evaluate('loginSupabaseTeacher("clave-docente",true)');
  assert.equal(teacher.dashboard.student.email,'teacher');
  assert.equal(api.counts.signup,2,'Profesor jugador reutiliza identidad');

  await reloaded.evaluate('callSupabaseFunction("student-profile",{action:"logout"},teacherToken)',{teacherToken:teacher.token});
  const googleResult=await reloaded.evaluate('loginGoogleViaSupabase("student")');
  assert.equal(googleResult.dashboard.student.email,'loginStudentPanelWithGoogle');
  assert.equal(api.counts.signup,2,'Acceso Google también reutiliza identidad');

  const badRefresh=JSON.parse(browserStorage.getItem('LA_SUPABASE_SESSION'));
  badRefresh.expires_at=0;
  browserStorage.setItem('LA_SUPABASE_SESSION',JSON.stringify(badRefresh));
  api.invalidateRefresh(badRefresh.refresh_token);
  const newIdentity=await reloaded.evaluate('getOrCreateSupabaseAnonymousSession()');
  assert.notEqual(newIdentity.access_token,badRefresh.access_token);
  assert.equal(api.counts.signup,3,'Refresh inválido crea una sola identidad nueva');

  const transient=JSON.parse(browserStorage.getItem('LA_SUPABASE_SESSION'));
  transient.expires_at=0;
  browserStorage.setItem('LA_SUPABASE_SESSION',JSON.stringify(transient));
  api.setRefreshStatus(503);
  await assert.rejects(reloaded.evaluate('getOrCreateSupabaseAnonymousSession()'));
  assert.equal(api.counts.signup,3,'Error transitorio no crea otra identidad');
  assert.equal(JSON.parse(browserStorage.getItem('LA_SUPABASE_SESSION')).refresh_token,transient.refresh_token);
  api.setRefreshStatus(0);

  const concurrent=await Promise.all([
    reloaded.evaluate('getOrCreateSupabaseAnonymousSession()'),
    reloaded.evaluate('getOrCreateSupabaseAnonymousSession()'),
  ]);
  assert.equal(concurrent[0].access_token,concurrent[1].access_token);
  assert.equal(api.counts.signup,3);

  const noSession=client(api,storage());
  api.setSignupStatus(429);
  await assert.rejects(noSession.evaluate('getOrCreateSupabaseAnonymousSession()'),/Demasiados accesos|demasiados accesos/);
  assert.equal(api.counts.signup,4,'429 provoca una sola petición');
  api.setSignupStatus(0);

  const logoutFailure=client(api,browserStorage);
  await logoutFailure.login();
  api.setLogoutStatus(503);
  assert.equal(await logoutFailure.evaluate('secureStudentLogout()'),false);
  assert.equal(logoutFailure.evaluate('secureSessionVerified'),true,'Un fallo de revocación no finge cerrar sesión');
  assert.ok(browserStorage.getItem('LA_SUPABASE_SESSION'));
  api.setLogoutStatus(0);
  assert.equal(await logoutFailure.evaluate('secureStudentLogout()'),true);
  assert.equal(await client(api,browserStorage).evaluate('restoreSupabaseStudentSession()'),false);

  let completeLegacy;
  const pendingLegacy=new Promise(resolve=>completeLegacy=resolve);
  const background=client(api,browserStorage,()=>pendingLegacy);
  await background.login();
  background.evaluate('connectLegacyStudentInBackground("uno@alumno.fomento.edu","1234",token)');
  await background.evaluate('secureStudentLogout()');
  completeLegacy({token:'sesion-antigua-de-Sheets'});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(browserStorage.getItem('LA_LEGACY_STUDENT_TOKEN'),null,'Respaldo tardío no restaura sesión cerrada');

  const invalidTech=JSON.parse(browserStorage.getItem('LA_SUPABASE_SESSION'));
  invalidTech.expires_at=0;
  browserStorage.setItem('LA_SUPABASE_SESSION',JSON.stringify(invalidTech));
  api.invalidateRefresh(invalidTech.refresh_token);
  assert.equal(await client(api,browserStorage).evaluate('restoreSupabaseStudentSession()'),false);
  assert.equal(browserStorage.getItem('LA_SUPABASE_SESSION'),null,'Restore borra identidad realmente inválida');

  console.log('Sesiones de alumno: 429, PIN, logout, refresh, recarga, cambio de alumno, Google, profesor, rival y guardado correctos.');
}

await check();
