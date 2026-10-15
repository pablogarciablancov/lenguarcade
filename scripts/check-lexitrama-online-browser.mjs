import http from 'node:http';import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {createState,makePlayer,command,advance,publicState} from '../supabase/functions/lexitrama-online/engine.js';
import {solutions} from './check-lexitrama-online.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=process.cwd(),names={A:'Ana',B:'Bruno'},saves={};let room=null,id=0;
const host=fs.readFileSync('apps-script/LenguArcade_Alumno.html','utf8'),a=host.indexOf("  if(message.type==='ONLINE_REQUEST'"),b=host.indexOf("  if(message.type==='REQUEST_EXIT'",a),proxy=host.slice(a,b);
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api'){
  let raw='';for await(const c of req)raw+=c;const body=JSON.parse(raw),actor=url.searchParams.get('actor'),now=Date.now();let result;
  try{
   if(body.action==='create')room={id:'room-'+(++id),code:'ABC23456',version:0,state:createState({id:actor,name:names[actor]},body.options,now)};
   else if(body.action==='join'){if(!room||room.code!==body.code)throw Error('room_not_found');if(!room.state.players.some(p=>p.profileId===actor)){room.state.players.push(makePlayer({id:actor,name:names[actor]}));room.state.lastSeen[actor]=now;room.version++;}}
   else if(body.action==='resume'){if(!room||!room.state.players.some(p=>p.profileId===actor)){res.setHeader('content-type','application/json');res.end(JSON.stringify({ok:true,room:null}));return;}}
   else if(body.action==='get'){room.state.lastSeen[actor]=now;advance(room.state,now);room.version++;}
   else{result=command(room.state,actor,body.action,body,now);room.version++;}
   let save=null;
   if(room.state.phase==='finished'){
    for(const p of room.state.players)if(!p.fixtureSaved){p.fixtureSaved=true;const c=saves[p.profileId]?.career;if(c){c.xp+=p.correct*7+(room.state.won?30:0);c.stats.words+=p.correct;c.updatedAt=Date.now();}}
    save=saves[actor];
   }
   res.setHeader('content-type','application/json');res.end(JSON.stringify({ok:true,room:publicState(room,actor,now),result,save}));
  }catch(e){res.statusCode=409;res.end(JSON.stringify({error:e.message}));}return;
 }
 if(url.pathname==='/host'){
  const actor=url.searchParams.get('actor');res.setHeader('content-type','text/html');res.end(`<style>body{margin:0;background:#071521;color:white}header{height:90px}iframe{height:calc(100dvh - 90px);width:100%;border:0}</style><header>LenguArcade · ${names[actor]}</header><iframe src="/games/lexitrama/?lenguarcade=1&channel=test${actor}"></iframe><script>
  let supabaseBackend=true,token='fixture',activeGameRunner={game:{gameId:'lexitrama'},channel:'test${actor}',iframe:document.querySelector('iframe')};const $=()=>({textContent:''});
  const postToGameWindow=(runner,target,type,payload)=>target.postMessage({namespace:'lenguarcade-host',channel:runner.channel,type,payload},'*');
  async function callSupabaseFunction(name,payload){if(name!=='lexitrama-online')throw Error('wrong_function');const r=await fetch('/api?actor=${actor}',{method:'POST',body:JSON.stringify(payload)}),data=await r.json();if(!r.ok){const e=new Error(data.error);e.code=data.error;throw e;}return data;}
  window.addEventListener('message',event=>{const runner=activeGameRunner,message=event.data||{};if(message.channel!==runner.channel)return;
   if(message.type==='READY'){runner.gameWindow=event.source;postToGameWindow(runner,event.source,'INIT',{student:{studentId:'${actor}',nombre:'${names[actor]}'},onlineMultiplayer:true,save:window.hostSave||null});}
   if(message.type==='CHECKPOINT'){window.hostSave=message.payload.players[0].save;fetch('/save?actor=${actor}',{method:'POST',body:JSON.stringify(hostSave)}).then(()=>postToGameWindow(runner,event.source,'CHECKPOINT_CONFIRMED',{checkpointId:message.payload.checkpointId}));}
   ${proxy}
  });</script>`);return;
 }
 if(url.pathname==='/save'){let raw='';for await(const c of req)raw+=c;saves[url.searchParams.get('actor')]=JSON.parse(raw);res.end('ok');return;}
 const p=root+url.pathname+(url.pathname.endsWith('/')?'index.html':'');if(!p.startsWith(root)||!fs.existsSync(p)){res.statusCode=404;res.end('missing');return;}
 res.setHeader('content-type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':p.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(p));
});
await new Promise(resolve=>server.listen(8766,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const errors=[];
try{
 const a=await browser.newPage({viewport:{width:1366,height:768}}),b=await browser.newPage({viewport:{width:1366,height:768}});
 for(const p of [a,b])p.on('pageerror',e=>errors.push(e.message));
 await Promise.all([a.goto('http://127.0.0.1:8766/host?actor=A'),b.goto('http://127.0.0.1:8766/host?actor=B')]);
 const fa=a.frameLocator('iframe'),fb=b.frameLocator('iframe');
 await fa.locator('[data-action=cooperative]').waitFor({state:'visible'});
 const af=a.frames().find(f=>f.url().includes('/games/')),bf=b.frames().find(f=>f.url().includes('/games/'));
 await af.evaluate(()=>{LexitramaEngine.create({mode:'mastery',seed:'LOCAL-PRESERVED'});document.getElementById('brand').click();});
 const paused=await af.evaluate(()=>LexitramaEngine.state.id);
 await fa.locator('[data-action=cooperative]').click();await fa.locator('[data-coop=create]').click();await fa.locator('#coopRoomCode').waitFor({state:'visible'});
 await fb.locator('[data-action=cooperative]').click();await fb.locator('#coopCode').fill(room.code);await fb.locator('[data-coop=join]').click();await fb.locator('#coopReady').click();await fa.locator('#coopReady').click();
 await fa.locator('#coopBoard').waitFor({state:'visible'});await fb.locator('#coopBoard').waitFor({state:'visible'});
 assert.equal(await fa.locator('[data-coop-tile]').count(),49);
 await fa.locator('[data-coop-tile="0"]').focus();await fa.locator('[data-coop-tile="0"]').press('Space');await fa.locator('[data-coop-tile="8"]').focus();await fa.locator('[data-coop-tile="8"]').press('Space');assert.equal(await fa.locator('[data-coop-tile].selected').count(),1);await fa.locator('[data-coop=clear]').click();
 const paths=solutions(room.state);
 async function select(frame,path){await frame.locator('[data-coop=clear]').click();await frame.locator('[data-coop-tile="'+path[0]+'"]').focus();for(const i of path){await frame.locator('[data-coop-tile="'+i+'"]').focus();await frame.locator('[data-coop-tile="'+i+'"]').press('Space');}}
 // A poll must preserve an in-progress keyboard selection.
 await select(fa,paths[0].path);const text=await fa.locator('#coopWord').textContent();await a.waitForTimeout(2200);assert.equal(await fa.locator('#coopWord').textContent(),text);
 await fa.locator('#coopSubmit').click();await a.waitForFunction(()=>true);await fb.locator('#coopFound').getByText(paths[0].word,{exact:true}).waitFor();
 await select(fb,paths[0].path);await fb.locator('#coopSubmit').click();await fb.locator('#coopNotice').getByText('Esa palabra ya la ha encontrado vuestro equipo.').waitFor();assert.equal(room.state.found.length,1);assert.equal(room.state.players[1].errors,0);
 // Real drag on the second browser.
 const bounds=await Promise.all(paths[1].path.map(i=>fb.locator('[data-coop-tile="'+i+'"]').boundingBox()));await b.mouse.move(bounds[0].x+bounds[0].width/2,bounds[0].y+bounds[0].height/2);await b.mouse.down();for(const r of bounds.slice(1))await b.mouse.move(r.x+r.width/2,r.y+r.height/2,{steps:2});await b.mouse.up();await fa.locator('#coopFound').getByText(paths[1].word,{exact:true}).waitFor();
 const roomId=room.id;await b.reload();await fb.locator('#coopBoard').waitFor({state:'visible'});assert.equal(room.id,roomId);assert.equal(await fb.locator('#coopFound b').count(),2);
 // Desktop controls and board fit below a 90px host header.
 for(const size of [{width:1366,height:768},{width:1440,height:900},{width:1920,height:1080}]){await a.setViewportSize(size);const metrics=await af.evaluate(()=>{const d=document.documentElement,r=document.querySelector('#coopBoard').getBoundingClientRect(),f=document.querySelector('footer').getBoundingClientRect(),c=document.querySelector('.coop-wordbar').getBoundingClientRect();return {height:d.clientHeight,scroll:d.scrollHeight,width:d.clientWidth,scrollWidth:d.scrollWidth,board:r.toJSON(),footer:f.toJSON(),controls:c.toJSON()};});assert.ok(metrics.scroll<=metrics.height+1,JSON.stringify(metrics));assert.ok(metrics.scrollWidth<=metrics.width+1);assert.ok(metrics.controls.bottom<=metrics.footer.top,JSON.stringify(metrics));assert.ok(metrics.board.width>260,JSON.stringify(metrics));}
 await a.setViewportSize({width:1366,height:768});await a.screenshot({path:'/tmp/lexitrama-coop.png'});
 await b.setViewportSize({width:390,height:844});assert.ok(await b.frames().find(f=>f.url().includes('/games/')).evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await b.setViewportSize({width:1366,height:768});
 for(let i=2;i<5;i++){await select(fa,paths[i].path);await fa.locator('#coopSubmit').click();await fa.locator('#coopFound').getByText(paths[i].word,{exact:true}).waitFor();}
 assert.equal(room.state.players[0].correct,4);assert.equal(await fa.locator('#coopSubmit').isDisabled(),true);
 await select(fb,paths[5].path);await fb.locator('#coopSubmit').click();await fa.locator('.coop-end').waitFor();await fb.locator('.coop-end').waitFor();assert.equal(room.state.won,true);
 await fa.locator('[data-coop=back]').click();assert.equal(await af.evaluate(()=>LexitramaEngine.state.id),paused);assert.equal(await af.evaluate(()=>LexitramaEngine.career.stats.words),4);
 assert.deepEqual(errors,[]);console.log('Lexitrama browsers: host proxy, local save preserved, room/ready, simultaneous drag+keyboard, polling, duplicate word, reload, 4+2 completion, own career and responsive correct.');
}finally{await browser.close();server.close();}
