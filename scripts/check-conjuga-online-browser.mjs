import http from 'node:http';import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {createState,command,advance,publicState} from '../supabase/functions/conjuga-online/engine.js';import {makePlayer,normalizeSave} from '../supabase/functions/conjuga-online/rules.js';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=process.cwd();let room=null;
const names={A:'Alumno A',B:'Alumno B',T:'Profesor'};let teacherApiCalls=0;
const host=fs.readFileSync(root+'/apps-script/LenguArcade_Alumno.html','utf8');
const start=host.indexOf("  if(message.type==='ONLINE_REQUEST'"),end=host.indexOf("  if(message.type==='REQUEST_EXIT'",start);const proxy=host.slice(start,end);
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api'){
  const actor=url.searchParams.get('actor');if(actor==='T')teacherApiCalls++;let raw='';for await(const c of req)raw+=c;const body=JSON.parse(raw);const now=Date.now();let out;
  try{
   if(body.action==='context'){res.setHeader('content-type','application/json');res.end(JSON.stringify({ok:true,player:{id:'T',name:names.T},classes:[{classCode:'C',name:'2º ESO C'}]}));return;}
   if(body.action==='create'){room={id:'cccccccc-cccc-4ccc-cccc-cccccccccccc',code:'ABCD2345',version:0,state:createState({id:actor,name:names[actor],save:normalizeSave(null),profileRole:actor==='T'?'teacher':'student'},body.options,now)};}
   else if(body.action==='resume'){if(!room||!room.state.players.some(p=>p.profileId===actor)){res.end(JSON.stringify({ok:true,room:null}));return;}}
   else if(body.action==='join'){
    const save=normalizeSave(null);room.state.players.push({...makePlayer(names[actor],1,save,'opponent'),profileId:actor,profileRole:actor==='T'?'teacher':'student',baseSave:structuredClone(save),ready:false});room.state.lastSeen[actor]=now;room.version++;
   }else if(body.action==='get'){room.state.lastSeen[actor]=now;if(advance(room.state,now))room.version++;}
   else {if(!['ready','leave'].includes(body.action)&&body.turnNo!==room.state.turnNo)throw new Error('stale_turn');command(room.state,actor,body.action,body,now);room.version++;}
   out={ok:true,room:publicState(room,actor)};
  }catch(e){res.statusCode=409;out={error:e.message};}
  res.setHeader('content-type','application/json');res.end(JSON.stringify(out));return;
 }
 if(url.pathname==='/teacher'){
  res.setHeader('content-type','text/html');
  let panel=fs.readFileSync(root+'/apps-script/LenguArcade_Profesor.html','utf8');
  panel=panel.replace('</body>',`<script>
  appsCall=async()=> 'http://127.0.0.1:8765/player';
  session={access_token:'fixture'};document.getElementById('appContent').classList.remove('hidden');document.getElementById('loginCard').classList.add('hidden');
  </script></body>`);
  res.end(panel);return;
 }
 if(url.pathname==='/player'){
  res.setHeader('content-type','text/html');
  const dashboard={ok:true,source:'supabase',student:{studentId:'T',nombre:'Profesor',apellidos:'',email:'profe@fomento.edu',clase:'Profesor',role:'teacher',avatar:{}},
    general:{xp:0,level:1,plumas:0,accuracy:0,totalGames:1,sessions:0,levelProgress:0},grade:{score:0},games:[{gameId:'conjuga_apuesta',nombre:'Conjuga y apuesta',estado:'en pruebas',categoria:'Verbos',url:'http://127.0.0.1:8765/games/conjuga_apuesta/',integration:'embedded',locked:false,progress:{percentage:0,sessions:0},buttonLabel:'Jugar',color:'#fb7185'}],ranking:[],missions:[],events:[],achievements:[],evaluations:[],workshopSession:null};
  let panel=fs.readFileSync(root+'/apps-script/LenguArcade_Alumno.html','utf8');
  const bootstrap=`<script>
    window.__LA_TEACHER_PLAYER_ENTRY__=true;
    window.testDashboard=${JSON.stringify(dashboard)};
    window.google={script:{run:new Proxy({}, {get(_t,name){if(name==='withSuccessHandler')return success=>({withFailureHandler:failure=>new Proxy({}, {get(_t,fn){return ()=>Promise.resolve().then(()=>success(fn==='getPublicMetaV03'?{version:'test',classes:[],games:[]}:fn==='getWebAppUrl'?'http://127.0.0.1:8765/teacher':{ok:true,session:null}));}})});}})}};
    const baseFetch=window.fetch.bind(window);
    window.fetch=async(url,options)=>{
      if(String(url).includes('supabase.co/')){
        if(String(url).includes('/auth/'))return new Response(JSON.stringify({access_token:'fixture',refresh_token:'fixture-refresh',expires_at:Math.floor(Date.now()/1000)+3600}),{status:200});
        if(String(url).includes('/student-dashboard'))return new Response(JSON.stringify(testDashboard),{status:200});
        if(String(url).includes('/conjuga-online'))return baseFetch('/api?actor=T',options);
        if(String(url).includes('/student-access-state'))return new Response(JSON.stringify({ok:true,fingerprint:'fixture',games:testDashboard.games}),{status:200});
        return new Response(JSON.stringify({ok:true,session:null}),{status:200});
      }
      return baseFetch(url,options);
    };
  </script>`;
  panel=panel.replace('<head>','<head>'+bootstrap);res.end(panel);return;
 }
 if(url.pathname==='/host'){
  const actor=url.searchParams.get('actor');res.setHeader('content-type','text/html');
  res.end(`<style>body{margin:0;background:#151d28;color:white}header{height:90px}iframe{height:calc(100vh - 90px);width:100%;border:0}</style><header>LenguArcade · ${names[actor]}</header><iframe src="/games/conjuga_apuesta/?lenguarcade=1&channel=test${actor}"></iframe><script>
  let supabaseBackend=true,token='test',activeGameRunner={game:{gameId:'conjuga_apuesta'},channel:'test${actor}',iframe:document.querySelector('iframe')};
  const $=()=>({textContent:''});
  const postToGameWindow=(runner,target,type,payload)=>target.postMessage({namespace:'lenguarcade-host',channel:runner.channel,type,payload},'*');
  async function callSupabaseFunction(name,payload){const r=await fetch('/api?actor=${actor}',{method:'POST',body:JSON.stringify(payload)});const data=await r.json();if(!r.ok){const e=new Error(data.error);e.code=data.error;throw e;}return data;}
  window.addEventListener('message',event=>{
    const runner=activeGameRunner,message=event.data||{};if(message.channel!==runner.channel)return;
    if(message.type==='READY'){runner.gameWindow=event.source;postToGameWindow(runner,event.source,'INIT',{student:{nombre:'${names[actor]}',studentId:'${actor}'},save:{},onlineMultiplayer:true});}
    ${proxy}
  });</script>`);return;
 }
 const p=root+url.pathname+(url.pathname.endsWith('/')?'index.html':'');
 if(!p.startsWith(root)||!fs.existsSync(p)){res.statusCode=404;res.end('missing');return;}
 res.setHeader('content-type',p.endsWith('.js')?'text/javascript':p.endsWith('.html')?'text/html':'image/png');res.end(fs.readFileSync(p));
});
await new Promise(r=>server.listen(8765,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const errors=[];
try{
 const a=await browser.newPage({viewport:{width:1366,height:768}}),b=await browser.newPage({viewport:{width:1366,height:768}});
 for(const p of [a,b])p.on('pageerror',e=>errors.push(e.message));
 await Promise.all([a.goto('http://127.0.0.1:8765/host?actor=A'),b.goto('http://127.0.0.1:8765/host?actor=B')]);
 const fa=a.frameLocator('iframe'),fb=b.frameLocator('iframe');
 await fa.locator('#onlineBtn').click();await fa.locator('#onlineCreate').click();await fa.locator('#onlineRoomCode').waitFor({state:'visible'});
 await fb.locator('#onlineBtn').click();await fb.locator('#onlineCodeInput').fill(room.code);await fb.locator('#onlineJoin').click();await fb.locator('#onlineReady').click();await fa.locator('#onlineReady').click();
 await fa.locator('#gameScreen').waitFor({state:'visible'});await fb.locator('#gameScreen').waitFor({state:'visible'});
 assert.equal(await fb.locator('#revealBtn').isDisabled(),true);
 await fa.locator('#revealBtn').click();await fa.locator('#answerInput').waitFor({state:'visible'});
 await fa.locator('#answerInput').fill('texto que no se debe borrar');await a.waitForTimeout(1900);assert.equal(await fa.locator('#answerInput').inputValue(),'texto que no se debe borrar');
 await fa.locator('#answerInput').fill(room.state.currentQuestion.respuesta);await fa.locator('#submitBtn').click();await fa.locator('#feedback.ok').waitFor({state:'visible'});await fb.locator('#feedback.ok').waitFor({state:'visible'});
 assert.equal(room.state.players[0].correct,1);
 await b.waitForTimeout(4000);assert.equal(room.state.currentPlayer,1);assert.equal(await fa.locator('#revealBtn').isDisabled(),true);
 await fb.locator('#revealBtn').click();await fb.locator('#questionState').waitFor({state:'visible'});assert.equal(await fa.locator('#answerInput').isDisabled(),true);
 const match=room.id;await b.reload();await fb.locator('#gameScreen').waitFor({state:'visible'});assert.equal(room.id,match);assert.equal(room.state.currentPlayer,1);
 await fb.locator('#insuranceBtn').click();await fb.locator('#answerInput').fill('incorrecto');await fb.locator('#submitBtn').click();await fb.locator('#feedback.bad').waitFor({state:'visible'});assert.equal(room.state.result.delta,-5);
 await a.waitForTimeout(4000);
 for(const size of [{width:1366,height:768},{width:1440,height:900},{width:1920,height:1080},{width:1366,height:690}]){
  await a.setViewportSize(size);await a.waitForTimeout(100);
  const frame=a.frames().find(f=>f.url().includes('/games/'));
  const metrics=await frame.evaluate(()=>{const d=document.documentElement;return {height:d.clientHeight,scroll:d.scrollHeight,width:d.clientWidth,scrollWidth:d.scrollWidth,controls:[...document.querySelectorAll('#revealBtn,#tierList button,#betList button')].filter(e=>e.getBoundingClientRect().height>0).map(e=>({bottom:e.getBoundingClientRect().bottom,right:e.getBoundingClientRect().right}))};});
  assert.ok(metrics.scroll<=metrics.height+1,JSON.stringify({size,metrics}));assert.ok(metrics.scrollWidth<=metrics.width+1);assert.ok(metrics.controls.every(x=>x.bottom<=metrics.height+1&&x.right<=metrics.width+1));
 }
 await a.screenshot({path:process.env.ONLINE_SCREENSHOT||'/tmp/conjuga-online-battle.png'});
 // finish through the server, verify both end screens arrive via polling.
 command(room.state,'A','leave',{requestId:'testleave'},Date.now());room.version++;
 await fa.locator('#endScreen').waitFor({state:'visible'});await fb.locator('#endScreen').waitFor({state:'visible'});
 // The teacher enters the actual common player panel through its navigation button.
 const teacherPanel=await browser.newPage({viewport:{width:1366,height:768}});teacherPanel.on('pageerror',e=>errors.push(e.message));
 await teacherPanel.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:8765/')?route.continue():route.abort());
 await teacherPanel.goto('http://127.0.0.1:8765/teacher',{waitUntil:'domcontentloaded'});
 const popupPromise=teacherPanel.waitForEvent('popup');await teacherPanel.locator('#teacherPlayerModeBtn').click();const teacher=await popupPromise;
 teacher.on('pageerror',e=>errors.push(e.message));await teacher.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:8765/')?route.continue():route.abort());
 await teacher.waitForURL('**/player?page=jugador-profesor');
 await teacher.locator('#teacherReturnPanelBtn').waitFor({state:'visible'});
 assert.equal(await teacher.evaluate(()=>currentDashboard.student.role),'teacher');
 await teacher.locator('.nav [data-target=juegos]').click();
 await teacher.locator('#games .play').click();
 const ft=teacher.frameLocator('#gameRunnerFrame');
 await ft.locator('#onlineBtn').waitFor({state:'visible'});
 // The same game menu is available; the teacher keeps ordinary local play too.
 assert.equal(await ft.locator('#startBtn').isVisible(),true);
 await ft.locator('#onlineBtn').click();await ft.locator('#onlineClassInput option').first().waitFor({state:'attached'});
 assert.equal(await ft.locator('#onlineClassInput').inputValue(),'C');
 await ft.locator('#onlineCreate').click();await ft.locator('#onlineRoomCode').waitFor({state:'visible'});
 assert.equal(room.state.players[0].profileRole,'teacher');
 await b.reload();await fb.locator('#onlineBtn').click();await fb.locator('#onlineCodeInput').fill(room.code);await fb.locator('#onlineJoin').click();
 await fb.locator('#onlineReady').click();await ft.locator('#onlineReady').click();
 await ft.locator('#revealBtn').click();await ft.locator('#questionState').waitFor({state:'visible'});await ft.locator('#answerInput').fill(room.state.currentQuestion.respuesta);await ft.locator('#submitBtn').click();
 await fb.locator('#feedback.ok').waitFor({state:'visible'});
 await b.waitForTimeout(4000);assert.equal(await ft.locator('#revealBtn').isDisabled(),true);
 await fb.locator('#revealBtn').click();await fb.locator('#questionState').waitFor({state:'visible'});await fb.locator('#answerInput').fill(room.state.currentQuestion.respuesta);await fb.locator('#submitBtn').click();await ft.locator('#feedback.ok').waitFor({state:'visible'});
 const matchId=room.id;const teacherFrame=teacher.frames().find(f=>f.url().includes('/games/'));await teacherFrame.goto(teacherFrame.url());await ft.locator('#gameScreen').waitFor({state:'visible'});assert.equal(room.id,matchId);
 command(room.state,'A' in room.state.lastSeen?'A':'T','leave',{requestId:'teacher-end'},Date.now());room.version++;
 await ft.locator('#endScreen').waitFor({state:'visible'});
 await teacher.evaluate(()=>destroyGameRunner(false));
 await teacher.locator('#teacherReturnPanelBtn').click();await teacher.waitForURL('**/teacher?page=profesor');
 console.log('Modo jugador real: navegación desde profesor, login Google simulado, identidad de profesor, catálogo común, selector de clase, duelo y reconexión; vuelta al panel.');
 assert.deepEqual(errors,[]);
 console.log('Dos navegadores: crear/unirse/listos, turno exclusivo, acierto compartido, escritura conservada, seguro, recarga/reconexión, final y responsive sin scroll; sin errores JS.');
}finally{await browser.close();server.close();}
