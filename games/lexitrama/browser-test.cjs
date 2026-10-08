const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const screenshotDir=process.env.LEXITRAMA_SCREENSHOTS;
if(screenshotDir)fs.mkdirSync(screenshotDir,{recursive:true});
async function screenshot(page,name){if(screenshotDir)await page.screenshot({path:path.join(screenshotDir,name)});}
const fixture=`<!doctype html><html><body style="margin:0"><iframe id="game" style="width:100%;height:620px;border:0" src="/games/lexitrama/?lenguarcade=1&amp;channel=fixture"></iframe><script>window.traffic=[];window.hostSave=null;window.autoAck=true;window.held=[];const f=document.getElementById('game');function send(type,payload={}){f.contentWindow.postMessage({namespace:'lenguarcade-host',channel:'fixture',type,payload},'*');}function ack(m){if(m.type==='CHECKPOINT')send('CHECKPOINT_CONFIRMED',{checkpointId:m.payload.checkpointId});if(m.type==='RESULT')send('SAVE_CONFIRMED',{resultId:m.payload.resultId});}window.addEventListener('message',e=>{const m=e.data;if(e.source!==f.contentWindow||m?.namespace!=='lenguarcade-game')return;traffic.push(m);if(m.type==='READY')send('INIT',{student:{studentId:'browser-student'},save:hostSave});if(m.type==='CHECKPOINT'||m.type==='RESULT'){hostSave=m.payload.players[0].save;if(autoAck)ack(m);else held.push(m);}});</script></body></html>`;
const server=http.createServer((req,res)=>{if(req.url.startsWith('/fixture')){res.setHeader('Content-Type','text/html');return res.end(fixture);}let p=path.join(root,req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';try{const ext=path.extname(p);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[ext]||'text/plain');res.end(fs.readFileSync(p));}catch{res.statusCode=404;res.end('missing');}});
(async()=>{
await new Promise(resolve=>server.listen(8765,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8765/games/lexitrama/');await page.waitForSelector('[data-action=atlas]');
await screenshot(page,'lexitrama-menu.png');
await page.click('[data-action=atlas]');await page.click('[data-level=bosque_1]');
for(const size of [{width:1366,height:768},{width:1440,height:900},{width:1920,height:1080},{width:1366,height:620}]){
await page.setViewportSize(size);await page.waitForTimeout(120);const geometry=await page.evaluate(()=>({height:innerHeight,width:innerWidth,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,board:document.querySelector('#board').getBoundingClientRect().toJSON(),footer:document.querySelector('footer').getBoundingClientRect().toJSON(),feedback:document.querySelector('.feedback').getBoundingClientRect().toJSON(),actions:document.querySelector('.board-actions').getBoundingClientRect().toJSON()}));assert(geometry.scrollHeight<=size.height,JSON.stringify(geometry));assert(geometry.scrollWidth<=size.width);assert(geometry.board.y>=0);assert(geometry.actions.bottom<=geometry.footer.y,JSON.stringify(geometry));assert(geometry.feedback.bottom<=geometry.footer.y,JSON.stringify(geometry));
}
await page.setViewportSize({width:1366,height:768});await screenshot(page,'lexitrama-board.png');
async function drag(){const route=await page.evaluate(()=>LexitramaEngine.route(LexitramaEngine.state.guaranteed));const coords=[];for(const i of route){const r=await page.locator(`[data-tile="${i}"]`).boundingBox();coords.push({x:r.x+r.width/2,y:r.y+r.height/2});}await page.mouse.move(coords[0].x,coords[0].y);await page.mouse.down();for(const p of coords.slice(1))await page.mouse.move(p.x,p.y,{steps:5});await page.mouse.up();await page.waitForTimeout(320);}
await drag();assert.equal(await page.evaluate(()=>LexitramaEngine.state.correct),1);await drag();await drag();assert(await page.evaluate(()=>LexitramaEngine.state.won));
await page.reload();assert.equal(await page.evaluate(()=>LexitramaEngine.career.stars.bosque_1>=1),true);
await page.evaluate(()=>{LexitramaEngine.create({levelId:'ciudad_6',seed:'browser-boss'});});await page.click('[data-action=continue]');await screenshot(page,'lexitrama-boss.png');await drag();assert.equal(await page.evaluate(()=>LexitramaEngine.state.boss.hp),70);
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight));await screenshot(page,'lexitrama-mobile.png');
assert.deepEqual(errors,[]);
// Probar teclado con espacio/Enter sobre el mismo motor de selección.
await page.setViewportSize({width:1366,height:768});
await page.evaluate(()=>{LexitramaEngine.abandon();LexitramaEngine.create({mode:'mastery',mission:'sustantivo',seed:'keyboard'});});await page.click('#brand');await page.click('[data-action=continue]');
const keyboardRoute=await page.evaluate(()=>LexitramaEngine.route(LexitramaEngine.state.guaranteed));for(const i of keyboardRoute){await page.locator(`[data-tile="${i}"]`).focus();await page.keyboard.press('Space');}await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>LexitramaEngine.state.correct),1);
// Un host real de iframe confirma el guardado, restaura y ordena el cierre.
const hosted=await browser.newPage({viewport:{width:1366,height:768}});hosted.on('pageerror',e=>errors.push(e.message));await hosted.goto('http://127.0.0.1:8765/fixture');const frame=hosted.frames().find(f=>f.url().includes('lenguarcade=1'));await frame.waitForSelector('[data-action=atlas]');await frame.click('[data-action=atlas]');await frame.click('[data-level=bosque_1]');
const hostedRoute=await frame.evaluate(()=>LexitramaEngine.route(LexitramaEngine.state.guaranteed));const centers=[];for(const i of hostedRoute){const b=await frame.locator(`[data-tile="${i}"]`).boundingBox();centers.push({x:b.x+b.width/2,y:b.y+b.height/2});}await hosted.mouse.move(centers[0].x,centers[0].y);await hosted.mouse.down();for(const c of centers.slice(1))await hosted.mouse.move(c.x,c.y,{steps:5});await hosted.mouse.up();await hosted.waitForTimeout(1000);assert.equal(await hosted.evaluate(()=>hostSave.run.correct),1);
await hosted.evaluate(()=>{document.querySelector('#game').src='/games/lexitrama/?lenguarcade=1&channel=fixture&reload=1';});await frame.waitForSelector('[data-action=continue]');assert.equal(await frame.evaluate(()=>LexitramaEngine.state.correct),1);assert.equal(await frame.evaluate(()=>LexitramaBridge.profile.studentId),'browser-student');
await hosted.evaluate(()=>{autoAck=false;send('REQUEST_EXIT');});await hosted.waitForTimeout(100);assert.equal(await hosted.evaluate(()=>traffic.filter(m=>m.type==='CLOSE_READY').length),0);assert(await hosted.evaluate(()=>held.some(m=>m.payload.reason==='exit')));await hosted.evaluate(()=>{autoAck=true;for(const m of held.splice(0))ack(m);});await hosted.waitForTimeout(150);assert.equal(await hosted.evaluate(()=>traffic.filter(m=>m.type==='CLOSE_READY').length),1);
// Un gesto táctil real de Chromium produce Pointer Events.
const touchPage=await browser.newPage({hasTouch:true,viewport:{width:390,height:844}});touchPage.on('pageerror',e=>errors.push(e.message));await touchPage.goto('http://127.0.0.1:8765/games/lexitrama/');await touchPage.click('[data-action=atlas]');await touchPage.click('[data-level=bosque_1]');const touchRoute=await touchPage.evaluate(()=>LexitramaEngine.route(LexitramaEngine.state.guaranteed));const session=await touchPage.context().newCDPSession(touchPage);let firstTouch=true;for(const i of touchRoute){const b=await touchPage.locator(`[data-tile="${i}"]`).boundingBox();await session.send('Input.dispatchTouchEvent',{type:firstTouch?'touchStart':'touchMove',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:1}]});firstTouch=false;}await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await touchPage.evaluate(()=>LexitramaEngine.state.correct),1);assert.deepEqual(errors,[]);
// Regresión de la captura: trazar SETO con el ratón debe cumplir la misión bosque.
const categoryPage=await browser.newPage({viewport:{width:1366,height:768}});categoryPage.on('pageerror',e=>errors.push(e.message));await categoryPage.goto('http://127.0.0.1:8765/games/lexitrama/');
await categoryPage.evaluate(()=>{const E=LexitramaEngine;E.create({levelId:'bosque_2',seed:'seto-capture'});const letters=['E','R','B','R','L','O','O','T','?','I','E','E','E','V','R','S'];E.state.board.forEach((tile,i)=>Object.assign(tile,{letter:letters[i],kind:i===8?'wild':'normal',hits:1}));});await categoryPage.click('[data-action=continue]');
for(const [step,i] of [15,10,7,6].entries()){const b=await categoryPage.locator(`[data-tile="${i}"]`).boundingBox();await categoryPage.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:5});if(step===0)await categoryPage.mouse.down();}await categoryPage.mouse.up();await categoryPage.waitForTimeout(350);
assert.deepEqual(await categoryPage.evaluate(()=>({word:LexitramaEngine.state.used.at(-1),progress:LexitramaEngine.state.progress,errors:LexitramaEngine.state.errors})),{word:'seto',progress:1,errors:0});assert.deepEqual(errors,[]);
console.log('Captura SETO: arrastre real, palabra aceptada como bosque, +1 objetivo y ningún error.');
// Reproducir la nueva captura con arrastre real, incluyendo respuestas no incrustadas.
for(const word of ['losa','piso','lodo','rosa','silo','sol','boca','pupitre']) {
  await categoryPage.click('#brand');
  await categoryPage.evaluate(()=>{
    const E=LexitramaEngine;E.abandon();E.create({mode:'mastery',mission:'sustantivo',size:5,seed:'noun-capture'});
    E.state.goal=8;E.state.guaranteed='pupitre';
    E.state.board.forEach((tile,i)=>Object.assign(tile,{letter:'VELPUERTIPSLOSALIIDAEABOC'[i],kind:i===6?'ice':i===16?'gold':'normal',hits:i===6?2:1}));
  });
  await categoryPage.click('[data-action=continue]');
  const route=await categoryPage.evaluate(word=>LexitramaEngine.route(word),word);assert(route,word);
  for(const [step,i] of route.entries()) {
    const b=await categoryPage.locator(`[data-tile="${i}"]`).boundingBox();
    await categoryPage.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:5});
    if(step===0)await categoryPage.mouse.down();
  }
  await categoryPage.mouse.up();await categoryPage.waitForTimeout(350);
  assert.deepEqual(await categoryPage.evaluate(()=>({word:LexitramaEngine.state.used.at(-1),progress:LexitramaEngine.state.progress,errors:LexitramaEngine.state.errors})),{word,progress:1,errors:0});
}
assert.deepEqual(errors,[]);
console.log('Captura sustantivos: ocho respuestas aceptadas con arrastre real, +1 objetivo y ningún error.');

console.log('Host iframe, restauración central simulada, cierre confirmado, teclado y gesto táctil OK.');
console.log('Browser OK: arrastre real, victoria, recarga/guardado, jefe, 3 resoluciones + iframe 620px + móvil; sin errores JS.');
await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1)});
