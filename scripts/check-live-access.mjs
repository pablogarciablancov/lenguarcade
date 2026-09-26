import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import { webcrypto } from 'node:crypto';
import { studentGameAccess, studentGameButtonLabel, workshopModeFor } from '../supabase/functions/_shared/student-access.ts';

const read=path=>fs.readFileSync(path,'utf8');
const handlerSource=read('supabase/functions/student-access-state/index.ts');
const sharedSource=read('supabase/functions/_shared/lenguarcade.ts');
const html=read('apps-script/LenguArcade_Alumno.html');
const marker='<script>\n(function(){\n  // La identidad Supabase y la sesión del alumno';
const start=html.indexOf(marker);
assert.ok(start>0,'El sincronizador del alumno debe estar presente');
const clientSource=html.slice(start+8,html.indexOf('</script>',start));
assert.match(read('supabase/config.toml'),/\[functions\.student-access-state\]\s*verify_jwt = true/);
assert.ok(!handlerSource.includes('student-dashboard'));

function evaluateTypeScript(source,context,tail=''){
  const withoutImports=source.replace(/^import\s+(?:\{[\s\S]*?\}|[^;]+)\s+from\s+[^;]+;\s*/gm,'');
  const script=stripTypeScriptTypes(withoutImports).replace(/^export /gm,'')+'\n'+tail;
  return vm.runInContext(script,vm.createContext(context));
}

// El atajo JWT se usa solo tras la validación del gateway, manteniendo la
// revocación de app_sessions y sin consultar /auth/v1/user en cada sondeo.
{
  let getUserCalls=0;
  const id='11111111-1111-4111-8111-111111111111';
  let revoked=false;
  const admin={from(table){
    const query={select(){return this;},eq(){return this;},is(){return this;},gt(){return this;},order(){return this;},limit(){return this;},
      async maybeSingle(){return {data:revoked?null:{profile_id:'p1',expires_at:'later'},error:null};},
      async single(){return {data:{organization_id:'org1',role:'student',active:true},error:null};}};
    assert.ok(['app_sessions','profiles'].includes(table));
    return query;
  }};
  const env={SUPABASE_URL:'https://test.supabase.co',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service'};
  const context={Deno:{env:{get:key=>env[key]}},Response,TextDecoder,Uint8Array,atob,Date,
    createClient:(_url,key)=>key==='service'?admin:{auth:{async getUser(){getUserCalls++;throw new Error('No debe llamar a Auth');}}},
    corsHeaders:{'Content-Type':'application/json'}};
  const requireSession=evaluateTypeScript(sharedSource,context,'requireProfileSession');
  function request(role='authenticated'){
    const payload={sub:id,role,exp:Math.floor(Date.now()/1000)+3600};
    return new Request('https://example.test',{headers:{Authorization:'Bearer header.'+Buffer.from(JSON.stringify(payload)).toString('base64url')+'.signature'}});
  }
  const result=await requireSession(request(),{gatewayVerifiedJwt:true});
  assert.equal(result.profileId,'p1');
  assert.equal(getUserCalls,0);
  await assert.rejects(requireSession(request('anon'),{gatewayVerifiedJwt:true}),error=>error instanceof Response&&error.status===401);
  revoked=true;
  await assert.rejects(requireSession(request(),{gatewayVerifiedJwt:true}),error=>error instanceof Response&&error.status===401);
}

const now=Date.now();
const catalog=[
  {id:'battlegrafia',status:'Disponible',url:'https://example.test/b',integration:'embedded',active:true,official:true,sort_order:1},
  {id:'scrabble',status:'Disponible',url:'https://example.test/s',integration:'embedded',active:true,official:true,sort_order:2},
];
const access=[{profile_id:'p1',game_id:'battlegrafia',enabled:false}];
const enrollments=[
  {profile_id:'p1',classroom_id:'c1',active:true,classrooms:{name:'A',legacy_class_code:'A'}},
  {profile_id:'p2',classroom_id:'c2',active:true,classrooms:{name:'B',legacy_class_code:'B'}},
];
const sessions=[];
const tables={games:catalog,profile_game_access:access,classroom_enrollments:enrollments,workshop_sessions:sessions};
let tableCalls=[];
let sessionCalls=0;
let served;
const edgeContext={
  Deno:{serve:handler=>{served=handler;}},Response,TextEncoder,crypto:webcrypto,Date,Set,Map,Number,String,console,
  corsHeaders:{},jsonResponse:(body,status=200)=>new Response(JSON.stringify(body),{status}),
  requireProfileSession:async(request,options)=>{
    assert.equal(options.gatewayVerifiedJwt,true);
    sessionCalls++;
    const profileId=request.headers.get('x-test-profile');
    if(!['p1','p2'].includes(profileId))throw new Response('{}',{status:401});
    return {admin:{from(table){
      assert.ok(Object.hasOwn(tables,table),`Consulta inesperada a ${table}`);
      tableCalls.push(table);
      const filters=[];
      const builder={select(fields){assert.ok(fields.split(',').length<=13);return this;},eq(column,value){filters.push([column,value]);return this;},order(){return this;},
        then(resolve,reject){return Promise.resolve({data:tables[table].filter(row=>filters.every(([key,value])=>row[key]===value)),error:null}).then(resolve,reject);}};
      return builder;
    }},profileId,organizationId:'org1'};
  },
  studentGameAccess,studentGameButtonLabel,workshopModeFor,
};
evaluateTypeScript(handlerSource,edgeContext);
async function edge(profileId){
  const response=await served(new Request('https://example.test',{method:'POST',headers:{'x-test-profile':profileId}}));
  assert.equal(response.status,200);
  return response.json();
}
{
  const a=await edge('p1');
  const b=await edge('p2');
  assert.equal(a.games[0].lockedByTeacher,true);
  assert.equal(b.games[0].locked,false);
  assert.equal(a.games[1].locked,false);
  const original=a.fingerprint;
  access[0].enabled=true;
  assert.notEqual((await edge('p1')).fingerprint,original);
  sessions.push({organization_id:'org1',classroom_id:'c1',title:'Taller A',published:true,classroom_open:false,
    home_enabled:true,active_from:new Date(now-60000).toISOString(),active_to:new Date(now+60000).toISOString(),
    game_ids:['scrabble'],plan_id:'plan1',started_at:new Date(now-60000).toISOString()});
  const workshop=await edge('p1');
  assert.equal(workshop.workshopSession.mode,'home');
  assert.equal(workshop.games[0].lockedByWorkshop,true);
  assert.equal(workshop.games[1].locked,false);
  assert.equal((await edge('p2')).workshopSession,null);
  sessions[0].classroom_open=false;
  sessions[0].home_enabled=false;
  const closed=await edge('p1');
  assert.equal(closed.workshopSession.mode,'closed');
  assert.equal(closed.games[1].lockedLabel,'Fuera del horario del taller');
  sessions[0].classroom_open=true;
  assert.equal((await edge('p1')).workshopSession.mode,'classroom');
  sessions[0].published=false;
  assert.equal((await edge('p1')).workshopSession,null);
  sessions.length=0;
  const bulk=await Promise.all(Array.from({length:30},(_,index)=>edge(index%2?'p1':'p2')));
  assert.equal(bulk.length,30);
  assert.equal(sessionCalls,38);
  assert.deepEqual([...new Set(tableCalls)].sort(),Object.keys(tables).sort());
  const unauthorized=await served(new Request('https://example.test',{method:'POST'}));
  assert.equal(unauthorized.status,401);
}

function browser(){
  let time=100000;
  let hidden=false;
  let offline=false;
  let calls=0;
  let baseOpens=0;
  let paints=0;
  let homePaints=0;
  let dashboardCalls=0;
  let nextState;
  const listeners={};
  const jobs=new Map();
  let id=0;
  const modal={classList:{add(name){assert.equal(name,'open');}}};
  const elements={gameModal:modal,gameModalTitle:{textContent:''},gameModalText:{textContent:''}};
  const card=()=>{
    const items={'.play':{disabled:false,textContent:'Jugar'},'.chip':{textContent:'Disponible'}};
    return {classList:{toggle(){},add(){},remove(){}},querySelector:key=>items[key],items};
  };
  const cards=[card(),card()];
  const dashboard={student:{role:'student'},general:{totalGames:2},workshopSession:null,games:catalog.map(row=>({
    gameId:row.id,estado:row.status,catalogLocked:false,accessEnabled:true,accessSource:'default',
    lockedByTeacher:false,lockedByWorkshop:false,locked:false,buttonLabel:'Jugar',nombre:row.id,
    progress:{sessions:0}
  }))};
  const context={
    supabaseBackend:true,secureSessionVerified:true,token:'jwt',studentSessionGeneration:1,currentDashboard:dashboard,
    document:{get hidden(){return hidden;},addEventListener:(name,fn)=>{listeners[name]=fn;},
      getElementById:key=>elements[key],querySelectorAll:()=>cards},
    setTimeout:(fn,ms)=>{const key=++id;jobs.set(key,{fn,due:time+ms});return key;},
    clearTimeout:key=>jobs.delete(key),
    Date:{now:()=>time},Math,Promise,JSON,Array,Number,String,console,
    callSupabaseFunction:async name=>{assert.equal(name,'student-access-state');calls++;if(offline)throw new Error('network');return structuredClone(nextState);},
    loadSupabaseDashboard:async()=>{dashboardCalls++;throw new Error('No se espera dashboard');},
    saveCache:()=>{},renderDashboard:()=>{},openGame:()=>{baseOpens++;},
  };
  context.window=context;
  context.addEventListener=(name,fn)=>{listeners[name]=fn;};
  context.laUpdateStudentWorkshopHeader=()=>{paints++;};
  context.laApplyStudentSessionToCards=()=>{paints++;};
  context.laRefreshHomeGameAccess=()=>{homePaints++;};
  vm.runInContext(clientSource,vm.createContext(context));
  async function settle(){for(let i=0;i<8;i++)await Promise.resolve();}
  async function advance(ms){
    const end=time+ms;
    while(true){
      const due=[...jobs].filter(([,job])=>job.due<=end).sort((a,b)=>a[1].due-b[1].due)[0];
      if(!due)break;
      time=due[1].due;
      jobs.delete(due[0]);
      due[1].fn();
      await settle();
    }
    time=end;
  }
  return {context,cards,modal,elements,listeners,advance,settle,
    setState:state=>{nextState=state;},setHidden:value=>{hidden=value;},setOffline:value=>{offline=value;},
    get counts(){return {calls,baseOpens,paints,homePaints,dashboardCalls,jobs:jobs.size};}};
}
{
  const ui=browser();
  const state=(fingerprint,locked)=>({ok:true,fingerprint,workshopSession:null,games:catalog.map((game,index)=>({
    gameId:game.id,estado:game.status,catalogLocked:false,accessEnabled:!(index===0&&locked),
    accessSource:'default',lockedByTeacher:index===0&&locked,lockedByWorkshop:false,
    locked:index===0&&locked,lockedLabel:index===0&&locked?'Cerrado por tu profesor':'Jugar'
  }))});
  ui.setState(state('open',false));
  await ui.advance(0);
  assert.equal(ui.counts.calls,1);
  const initialPaints=ui.counts.paints;
  await ui.advance(5000);
  assert.equal(ui.counts.calls,2);
  assert.equal(ui.counts.paints,initialPaints,'Fingerprint idéntico: ningún cambio DOM');
  ui.setState(state('closed',true));
  await ui.advance(3000);
  // La tarjeta aún parece abierta: el guard consulta justo antes de entrar.
  assert.equal(ui.cards[0].items['.play'].disabled,false);
  await ui.context.openGame('battlegrafia');
  assert.equal(ui.counts.baseOpens,0);
  assert.equal(ui.cards[0].items['.play'].disabled,true);
  assert.equal(ui.counts.homePaints,1);
  assert.equal(ui.counts.dashboardCalls,0);
  await ui.advance(3000);
  await ui.context.openGame('battlegrafia');
  assert.equal(ui.counts.baseOpens,0);
  assert.match(ui.elements.gameModalText.textContent,/Cerrado por tu profesor/);
  ui.setState(state('reopened',false));
  ui.listeners.online();
  await ui.settle();
  assert.equal(ui.cards[0].items['.play'].disabled,false);
  await ui.context.openGame('battlegrafia');
  assert.equal(ui.counts.baseOpens,1);
  ui.setHidden(true);
  ui.listeners.visibilitychange();
  await ui.advance(60000);
  assert.equal(ui.counts.jobs,0);
  ui.setState(state('closed-again',true));
  ui.setHidden(false);
  ui.listeners.visibilitychange();
  await ui.settle();
  assert.equal(ui.cards[0].items['.play'].disabled,true);
  ui.setOffline(true);
  ui.listeners.focus();
  await ui.settle();
  assert.equal(ui.context.secureSessionVerified,true);
  assert.equal(ui.cards[0].items['.play'].disabled,true);
  const failedCalls=ui.counts.calls;
  await ui.advance(5000);
  assert.equal(ui.counts.calls,failedCalls,'Un fallo de red aplica backoff de 10 segundos');
  ui.setOffline(false);
  ui.setState(state('online',false));
  ui.listeners.online();
  await ui.settle();
  assert.equal(ui.cards[0].items['.play'].disabled,false);
  assert.equal(ui.counts.dashboardCalls,0);
}

console.log('Acceso en vivo correcto: 30 sondeos ligeros, permisos por perfil/clase, taller, DOM estable, visibilidad, red y guard de juego.');
