import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright/index.mjs')).href);
const root=process.cwd();
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://localhost');
 if(u.pathname==='/host'){
  res.setHeader('Content-Type','text/html');res.end(`<!doctype html><style>body{margin:0}iframe{width:100vw;height:100vh;border:0}</style><iframe id="game" src="/games/${u.searchParams.get('game')}/?lenguarcade=1&channel=exit-test"></iframe><script>
  window.messages=[];window.saved=null;
  function post(type,payload={}){game.contentWindow.postMessage({namespace:'lenguarcade-host',channel:'exit-test',type,payload},'*')}
  addEventListener('message',e=>{const m=e.data;if(m?.namespace!=='lenguarcade-game')return;messages.push(m);
   if(m.type==='READY')post('INIT',{student:{studentId:'exit-test',nombre:'Prueba',apellidos:'Menú'},save:saved});
   if(m.type==='CHECKPOINT'){saved={rawGameData:{save:m.payload.players[0].save}};post('CHECKPOINT_CONFIRMED',{checkpointId:m.payload.checkpointId});}
   if(m.type==='RESULT'||m.type==='SAVE')post('SAVE_CONFIRMED',{resultId:m.payload.resultId});
  });</script>`);return;
 }
 let file=path.resolve(root,'.'+u.pathname);if(u.pathname.endsWith('/'))file=path.join(file,'index.html');
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',({'.js':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.txt':'text/plain','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.GAME_MENU_CHROMIUM,args:['--no-sandbox','--no-proxy-server']});
const origin='http://127.0.0.1:'+server.address().port;
async function open(game){
 const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.route('https://**',r=>r.abort());await page.goto(origin+'/host?game='+game);
 const frame=page.frames().find(f=>f.parentFrame());return {page,frame,errors};
}
async function noClose(page){await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>messages.filter(m=>['CLOSE_READY','REQUEST_EXIT'].includes(m.type)).length),0);}
try{
 // Same embedded setup as production: exit buttons must navigate inside the iframe.
 {
  const {page,frame,errors}=await open('versopolis');
  await frame.locator('#startBtn').click();await frame.locator('.atlasCard').first().click();await frame.locator('.museCard').first().click();
  const before=await frame.evaluate(()=>VersopolisGame.snapshot().run);
  await frame.locator('#exitBtn').click();await frame.locator('#homeScreen').waitFor({state:'visible'});await noClose(page);
  assert.equal(await frame.evaluate(()=>VersopolisGame.snapshot().run.runScore),before.runScore);
  await frame.locator('#continueBtn').click();await frame.locator('#gameScreen').waitFor({state:'visible'});
  assert.deepEqual(errors,[]);console.log('Versópolis: inicio, continuar y guardado OK');await page.close();
 }
 {
  const {page,frame,errors}=await open('sopa_de_tinta');await frame.waitForFunction(()=>TintaGame.ready);
  await frame.locator('[data-action="quick"]').click();await frame.locator('[data-action="start-quick"]').click();
  const id=await frame.evaluate(()=>TintaGame.run.id);
  await frame.locator('#exit').click();assert.equal(await frame.evaluate(()=>TintaGame.getScreen()),'home');await noClose(page);
  assert.equal(await frame.evaluate(()=>TintaGame.run.id),id);
  const elapsed=await frame.evaluate(()=>TintaGame.run.elapsed);await page.waitForTimeout(1200);assert.equal(await frame.evaluate(()=>TintaGame.run.elapsed),elapsed);
  await frame.locator('[data-action="resume"]').click();assert.equal(await frame.evaluate(()=>TintaGame.getScreen()),'play');
  assert.deepEqual(errors,[]);console.log('Sopa de Tinta: inicio, pausa de reloj y continuar OK');await page.close();
 }
 {
  const {page,frame,errors}=await open('lexitrama');await frame.waitForFunction(()=>LexitramaEngine.ready);
  await frame.locator('[data-action="timed"]').click();await frame.locator('#setupForm button[type="submit"]').click();await frame.waitForFunction(()=>document.body.dataset.screen==='game');
  const id=await frame.evaluate(()=>LexitramaEngine.state.id);
  await frame.locator('#exit').click();assert.equal(await frame.evaluate(()=>document.body.dataset.screen),'menu');await noClose(page);
  assert.equal(await frame.evaluate(()=>LexitramaEngine.state.id),id);
  const remaining=await frame.evaluate(()=>LexitramaEngine.state.remaining);await page.waitForTimeout(1200);assert.equal(await frame.evaluate(()=>LexitramaEngine.state.remaining),remaining);
  await frame.locator('[data-action="continue"]').click();assert.equal(await frame.evaluate(()=>document.body.dataset.screen),'game');
  assert.deepEqual(errors,[]);console.log('Lexitrama: inicio, pausa de reloj y continuar OK');await page.close();
 }
 {
  const {page,frame,errors}=await open('word_play');await frame.locator('#quickGameBtn').click();
  const before=await frame.evaluate(()=>WordPlayEngine.state);
  await frame.locator('#pauseBtn').click();await frame.locator('#saveExitBtn').click();await frame.locator('#menuScreen').waitFor({state:'visible'});await noClose(page);
  assert.equal(await frame.evaluate(()=>WordPlayEngine.loadRun().rngCounter),before.rngCounter);
  await frame.locator('#continueBtn').click();await frame.locator('#gameScreen').waitFor({state:'visible'});
  assert.deepEqual(errors,[]);console.log('Play the Word: inicio, continuar y guardado OK');await page.close();
 }
 {
  const {page,frame,errors}=await open('conjuga_apuesta');await frame.waitForFunction(()=>document.getElementById('name1').disabled);await frame.locator('#name2').fill('Rival de prueba');await frame.locator('#startBtn').click();await frame.locator('#gameScreen').waitFor({state:'visible'});
  await frame.locator('#exitBtn').click();await frame.locator('#setupScreen').waitFor({state:'visible'});await noClose(page);
  // A subsequent explicit host request must still be allowed to close the iframe.
  await page.evaluate(()=>post('REQUEST_EXIT'));await page.waitForFunction(()=>messages.some(m=>m.type==='CLOSE_READY'));
  assert.deepEqual(errors,[]);console.log('Conjuga y apuesta: inicio y cierre explícito del host OK');await page.close();
 }
 {
  const {page,frame,errors}=await open('verb_battle');await frame.locator('#menuPracticeBtn').click();await frame.locator('#startBtn').click();
  await frame.locator('#exitBtn').click();await frame.locator('#setupScreen').waitFor({state:'visible'});await noClose(page);
  await page.evaluate(()=>post('REQUEST_EXIT'));await page.waitForFunction(()=>messages.some(m=>m.type==='CLOSE_READY'));
  assert.deepEqual(errors,[]);console.log('Batalla verbal: inicio y cierre explícito del host OK');await page.close();
 }
 {
  const {page,frame,errors}=await open('tower_defense');await frame.evaluate(()=>{document.getElementById('startScreen').classList.add('hidden');window.game.paused=false;});
  await frame.locator('#pauseBtn').click();await frame.locator('#closeToArcadeBtn').click();await frame.locator('#startScreen').waitFor({state:'visible'});await noClose(page);
  assert.equal(await frame.locator('#pauseModal').isVisible(),false);assert.equal(await frame.evaluate(()=>game.paused),true);
  assert.deepEqual(errors,[]);console.log('Guardianes: inicio sin aviso ficticio, partida guardada OK');await page.close();
 }
}finally{await browser.close();server.close();}
