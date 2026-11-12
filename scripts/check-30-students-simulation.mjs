import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { performance } from 'node:perf_hooks';

// Simulación aislada: 30 navegadores con almacenamiento y tokens independientes.
// Ejecuta el código REAL del cliente, pero sustituye Google, Auth y Edge Functions
// por dobles controlados. Nunca hace llamadas a producción ni crea alumnos.
const source=fs.readFileSync('apps-script/LenguArcade_Alumno.html','utf8');
const auth=source.slice(source.indexOf('let secureSessionVerified=false;'),source.indexOf('const sessionVerificationToken=token;'));
const bridge=source.slice(source.indexOf('callServer=async function(fn,args){'),source.indexOf('renderClasses=function(){};'));
const logout=source.slice(source.indexOf('async function secureStudentLogout(){'),source.indexOf('login=secureStudentLogin;'));
const google=source.slice(source.indexOf('async function loginGoogleViaSupabase(kind){'),source.indexOf('function finishGoogleStudentLogin(result,message){'));
assert.ok(auth.startsWith('let secureSessionVerified=false;'));
assert.ok(bridge.startsWith('callServer=async function(fn,args){'));
assert.ok(google.startsWith('async function loginGoogleViaSupabase(kind){'));
assert.ok(logout.startsWith('async function secureStudentLogout(){'));

const STUDENTS=30;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function localStorage(){
  const map=new Map();
  return {
    getItem:key=>map.has(key)?map.get(key):null,
    setItem:(key,value)=>map.set(key,String(value)),
    removeItem:key=>map.delete(key),
  };
}

function fakeSupabase(){
  let nextIdentity=0,active=0,maxConcurrent=0,networkCalls=0;
  const identities=new Map(),sessions=new Map(),profiles=new Map();
  const calls={signup:0,google:0,pin:0,dashboard:0,access:0,save:0,logout:0,refresh:0};
  const response=(status,data)=>({ok:status>=200&&status<300,status,json:async()=>data});
  const profileOf=email=>{
    if(!profiles.has(email))profiles.set(email,{xp:0,results:new Set()});
    return profiles.get(email);
  };
  const bearer=options=>String(options?.headers?.Authorization||'').replace(/^Bearer /,'');
  async function fetch(url,options){
    const path=new URL(url).pathname;
    const body=JSON.parse(options?.body||'{}');
    networkCalls++;
    active++;
    maxConcurrent=Math.max(active,maxConcurrent);
    try {
      // Latencia/jitter deterministas para que las 30 peticiones se solapen.
      await delay(5+(networkCalls%5)*3);
      if(path==='/auth/v1/signup'){
        calls.signup++;
        const id=++nextIdentity;
        const accessToken='synthetic-access-'+id;
        const refreshToken='synthetic-refresh-'+id;
        identities.set(accessToken,id);
        return response(200,{access_token:accessToken,refresh_token:refreshToken,expires_at:Math.floor(Date.now()/1000)+3600});
      }
      if(path==='/auth/v1/token'){
        calls.refresh++;
        return response(400,{error:'invalid_grant'});
      }
      const id=identities.get(bearer(options));
      if(!id)return response(401,{error:'unauthorized'});
      if(path==='/functions/v1/pin-login'){
        calls.pin++;
        return response(410,{error:'google_login_required'});
      }
      if(path==='/functions/v1/student-profile'&&body.action==='logout'){
        calls.logout++;
        sessions.delete(id);
        return response(200,{ok:true});
      }
      const email=sessions.get(id);
      if(!email)return response(401,{error:'session_expired'});
      if(path==='/functions/v1/student-dashboard'){
        calls.dashboard++;
        const progress=profileOf(email);
        return response(200,{
          ok:true,student:{email,studentId:email,role:'student'},
          general:{xp:progress.xp},
          games:[{gameId:'battlegrafia',locked:false,progress:{xp:progress.xp}}],
          ranking:[],missions:[],platformAchievements:[],
        });
      }
      if(path==='/functions/v1/student-access-state'){
        calls.access++;
        return response(200,{ok:true,fingerprint:'stable',games:[{gameId:'battlegrafia',locked:false}],workshopSession:null});
      }
      if(path==='/functions/v1/save-progress'){
        calls.save++;
        if(body.gameId!=='battlegrafia'||!body.resultId)return response(400,{error:'invalid_request'});
        const progress=profileOf(email);
        if(!progress.results.has(body.resultId)){
          progress.results.add(body.resultId);
          progress.xp+=Math.max(0,Number(body.xpDelta||0));
        }
        return response(200,{ok:true,confirmedXp:progress.xp});
      }
      throw new Error('Petición no simulada: '+path);
    } finally {active--;}
  }
  async function googleLogin(token,email,fn){
    if(fn!=='loginStudentPanelWithGoogle')throw new Error('Ruta Google inesperada: '+fn);
    const id=identities.get(token);
    if(!id)throw new Error('Identidad Google no autorizada');
    calls.google++;
    await delay(8+(id%4)*3);
    sessions.set(id,email);
    profileOf(email);
    return {ok:true};
  }
  return {fetch,googleLogin,calls,profiles,identities,sessions,
    metrics:()=>({networkCalls,maxConcurrent,identities:identities.size})};
}

function browser(api,email,store=localStorage()){
  const status=[];
  const loginCard={
    classList:{add(){},remove(){}},
    querySelector:selector=>selector==='[name="studentPin"]'||selector==='[name="studentEmail"]'
      ?{value:''}:{textContent:''},
  };
  const elements={loginCard,logoutBtn:{disabled:false}};
  const context=vm.createContext({
    localStorage:store,fetch:api.fetch,console,
    callServer:async()=>({ok:true}),
    baseCall:(fn,args)=>api.googleLogin(args[0],email,fn),
    token:'',currentDashboard:null,busy:false,
    setStatus:message=>status.push(message),
    setSecureLoginStatus:message=>status.push(message),
    saveCache:(key,value)=>store.setItem(key,JSON.stringify(value)),
    renderDashboard(){},revealStudentApp(){},
    document:{body:{classList:{add(){},remove(){}}}},
    $:id=>elements[id],
    secureLoginElement:selector=>loginCard.querySelector(selector),
  });
  vm.runInContext(auth+'\n'+bridge+'\n'+logout+'\n'+google,context);
  const evaluate=(expression,vars={})=>{
    Object.assign(context,vars);
    return vm.runInContext(expression,context);
  };
  function activate(result){
    evaluate('token=simResult.token;supabaseBackend=true;secureSessionVerified=true;currentDashboard=simResult.dashboard;studentSessionGeneration++',{simResult:result});
  }
  return {email,store,evaluate,activate,status};
}
const api=fakeSupabase();
const clients=Array.from({length:STUDENTS},(_,i)=>
  browser(api,'sim'+String(i+1).padStart(2,'0')+'@alumno.fomento.edu'));
const durations={};
async function phase(name,fn){
  const began=performance.now();
  const values=await Promise.all(clients.map(fn));
  durations[name]=Math.round(performance.now()-began);
  return values;
}

// Fase 1: los 30 usan sus propias identidades y entran con Google a la vez.
await phase('google',async client=>{
  const result=await client.evaluate('loginGoogleViaSupabase("student")');
  assert.equal(result.dashboard.student.email,client.email);
  client.activate(result);
  return result;
});
assert.equal(api.calls.signup,STUDENTS);
assert.equal(api.calls.google,STUDENTS);
assert.equal(new Set(clients.map(c=>c.evaluate('token'))).size,STUDENTS);

// Fase 2: los 30 comprueban acceso al mismo juego sin interferirse.
await phase('accesoJuego',async client=>{
  const state=await client.evaluate('callSupabaseFunction("student-access-state",{},token)');
  assert.equal(state.games[0].gameId,'battlegrafia');
  assert.equal(state.games[0].locked,false);
});
assert.equal(api.calls.access,STUDENTS);

// Fase 3: guardan todos a la vez; tras el guardado se solicita un dashboard.
await phase('guardado',async (client,i)=>{
  const result=await client.evaluate(
    'callServer("saveProgress",[{sessionToken:token,gameId:"battlegrafia",resultId:simId,xpDelta:15}])',
    {simId:'simulation-'+(i+1)}
  );
  assert.equal(result.dashboard.student.email,client.email);
  assert.equal(result.dashboard.general.xp,15);
  assert.equal(result.dashboard.games[0].progress.xp,15);
});
assert.equal(api.calls.save,STUDENTS);
assert.equal(api.profiles.size,STUDENTS);
for(const p of api.profiles.values())assert.equal(p.xp,15);

// Fase 4: recargan todos a la vez con sus 30 sesiones independientes.
await phase('recarga',async client=>{
  const refreshed=browser(api,client.email,client.store);
  assert.equal(await refreshed.evaluate('restoreSupabaseStudentSession()'),true);
  assert.equal(refreshed.evaluate('currentDashboard.general.xp'),15);
});
assert.equal(api.calls.signup,STUDENTS,'Recargar no genera usuarios adicionales');

// Fase 5: salidas simultáneas, revocación y nueva entrada exclusiva por Google.
await phase('logout',async client=>{
  assert.equal(await client.evaluate('secureStudentLogout()'),true);
});
assert.equal(api.sessions.size,0);
await phase('googleReentry',async client=>{
  const result=await client.evaluate('loginGoogleViaSupabase("student")');
  client.activate(result);
  assert.equal(result.dashboard.general.xp,15);
  assert.equal(result.dashboard.student.email,client.email);
});
assert.equal(api.calls.pin,0,'Ningún alumno ha utilizado PIN');
assert.equal(api.calls.google,STUDENTS*2,'Todos han entrado exclusivamente por Google');
assert.equal(api.calls.signup,STUDENTS,'Google reutiliza cada identidad');
assert.equal(api.calls.dashboard,STUDENTS*4,'Google, guardado, recarga y reentrada cargan el panel');
assert.equal(api.calls.refresh,0);
assert.equal(api.calls.logout,STUDENTS);
assert.equal(api.sessions.size,STUDENTS);
assert.equal(api.metrics().identities,STUDENTS);

console.log(JSON.stringify({
  simulation:'30 alumnos aislados, código cliente real y backend simulado',
  users:STUDENTS,passed:true,
  requests:api.calls,
  networkCalls:api.metrics().networkCalls,
  maxSimultaneousMockRequests:api.metrics().maxConcurrent,
  stageDurationsMs:durations,
  xpPerUser:15,
  productionWrites:0,
  warning:'Google y Supabase simulados: no mide infraestructura real.',
},null,2));
