// Requiere Playwright; LEXOMA_CHROMIUM permite usar un Chromium ya instalado.
const hostHTML="<!doctype html><meta charset=\"utf-8\"><style>body{margin:0;background:#050818;color:white}header{height:110px;display:grid;place-items:center;font:20px system-ui}iframe{display:block;width:100%;height:calc(100vh - 110px);border:0}</style><header>LenguArcade \u00b7 Host de pruebas del protocolo com\u00fan</header><iframe id=\"game\" src=\"/?lenguarcade=1&channel=lexoma-test\"></iframe><script>\nwindow.events=[];window.saved=null;window.fail=false;window.closeReady=null;window.student='a';\nfunction post(type,payload={}){game.contentWindow.postMessage({namespace:'lenguarcade-host',channel:'lexoma-test',type,payload},'*')}\nwindow.addEventListener('message',e=>{const m=e.data;if(m?.namespace!=='lenguarcade-game'||m.channel!=='lexoma-test')return;events.push(m);if(m.type==='READY')post('INIT',{student:{studentId:student},save:saved});if(m.type==='CHECKPOINT'){if(!fail){saved={rawGameData:{save:m.payload.players[0].save}};post('CHECKPOINT_CONFIRMED',{checkpointId:m.payload.checkpointId});}else post('CHECKPOINT_FAILED',{checkpointId:m.payload.checkpointId});}if(m.type==='CLOSE_READY')closeReady=m.payload;if(m.type==='RESULT')post('SAVE_CONFIRMED',{resultId:m.payload.resultId});});\n</script>\n";
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const moduleRoot=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const {chromium}=await import(moduleRoot?pathToFileURL(path.join(moduleRoot,'playwright/index.mjs')).href:'playwright');
const root=fileURLToPath(new URL('.',import.meta.url));
const server=http.createServer((q,r)=>{const u=new URL(q.url,'http://localhost');let file=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(u.pathname==='/host-test.html'){r.setHeader('content-type','text/html');r.end(hostHTML);return;}if(u.pathname.endsWith('/'))file=path.join(file,'index.html');if(!file.startsWith(root)){r.writeHead(403).end();return;}try{r.setHeader('content-type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');r.end(fs.readFileSync(file));}catch{r.writeHead(404).end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,...(process.env.LEXOMA_CHROMIUM?{executablePath:process.env.LEXOMA_CHROMIUM}:{}),args:['--no-sandbox','--no-proxy-server']});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(r.url()+': '+r.status());});
const base=origin+'/';
await page.goto(base);await page.locator('#new').click();
for(const word of ['EL','MAGO','CORRE']){for(const char of word){await page.locator('#hand .tile:not(.selected)').filter({hasText:new RegExp('^'+char+'[0-9]')}).first().click();}await page.locator('#forge').click();}
assert.equal(await page.locator('.word-card').count(),3);await page.locator('#finish').click();assert.ok(await page.evaluate(()=>LexomaEngine.run.score>200));
await page.locator('#ideas').click();assert.ok(await page.locator('#suggestions button').count()>0);
for(const [width,height] of [[1366,768],[1440,900],[1920,1080],[1366,640],[800,600]]){
 await page.setViewportSize({width,height});const bounds=await page.evaluate(()=>{const x=id=>{const r=document.getElementById(id).getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom}};return{root:[document.documentElement.scrollHeight,document.documentElement.clientHeight,document.documentElement.scrollWidth,document.documentElement.clientWidth],hand:x('hand'),finish:x('finish'),enemy:x('enemy-art'),phrase:x('phrase')}});
 assert.equal(bounds.root[0],bounds.root[1],`scroll vertical ${width}×${height}`);assert.equal(bounds.root[2],bounds.root[3],`scroll horizontal ${width}×${height}`);for(const id of ['hand','finish','enemy','phrase']){assert.ok(bounds[id].bottom<=height&&bounds[id].top>=0,`${id} visible ${width}×${height}`);}console.log('Layout OK',width,height);
}
await page.setViewportSize({width:1366,height:768});if(process.env.LEXOMA_SCREENSHOTS)await page.screenshot({path:path.join(process.env.LEXOMA_SCREENSHOTS,'lexoma-combate.png')});
const saved=await page.evaluate(()=>LexomaEngine.snapshot());await page.reload();await page.locator('#continue').click();assert.equal(await page.evaluate(()=>LexomaEngine.run.score),saved.run.score);
await page.locator('#menu').click();await page.locator('#codex').click();assert.equal(await page.locator('#overlay .shop-item').count(),7);await page.locator('[data-title]').click();if(process.env.LEXOMA_SCREENSHOTS)await page.screenshot({path:path.join(process.env.LEXOMA_SCREENSHOTS,'lexoma-menu.png')});
await page.locator('#continue').click();await page.evaluate(()=>{LexomaEngine.run.status='reward';LexomaEngine.run.node=1;LexomaEngine.run.ink=100;LexomaEngine.next();});await page.locator('[data-buy="letter"]').click();assert.ok(await page.evaluate(()=>LexomaEngine.run.ink>=0));if(process.env.LEXOMA_SCREENSHOTS)await page.screenshot({path:path.join(process.env.LEXOMA_SCREENSHOTS,'lexoma-tienda.png')});
assert.deepEqual(errors,[]);console.log('UI OK: primera frase real, puntuación, ideas, recuperación, logros y tienda.');

const embeddedPage=await browser.newPage({viewport:{width:1366,height:768}});const embeddedErrors=[];embeddedPage.on('pageerror',e=>embeddedErrors.push(e.message));await embeddedPage.goto(origin+'/host-test.html');const f=embeddedPage.frames().find(f=>f.parentFrame()!==null);await f.waitForFunction(()=>LexomaBridge.initialized);await f.locator('#new').click();
await f.locator('#hand .tile').first().click();await embeddedPage.evaluate(()=>post('REQUEST_CHECKPOINT'));await embeddedPage.waitForFunction(()=>saved?.rawGameData?.save?.run?.selection.length===1);
const before=await f.evaluate(()=>LexomaEngine.snapshot());await f.goto(f.url());await f.waitForFunction(()=>LexomaBridge.initialized);assert.equal(await f.evaluate(()=>LexomaEngine.run.selection.length),1);assert.equal(await f.evaluate(()=>LexomaEngine.run.id),before.run.id);await f.locator('#continue').click();
await embeddedPage.evaluate(()=>post('REQUEST_EXIT'));await embeddedPage.waitForFunction(()=>closeReady);assert.equal(await embeddedPage.evaluate(()=>closeReady.saved),true);
await embeddedPage.evaluate(()=>{closeReady=null;fail=true;post('REQUEST_EXIT');});await embeddedPage.waitForFunction(()=>closeReady);assert.equal(await embeddedPage.evaluate(()=>closeReady.saved),false);assert.equal(await embeddedPage.evaluate(()=>closeReady.localFallback),true);
// Simulación del final del minuto de gracia: el host solicita el checkpoint y salida.
await embeddedPage.evaluate(()=>{fail=false;post('REQUEST_CHECKPOINT');post('REQUEST_EXIT');});await embeddedPage.waitForFunction(()=>closeReady?.saved===true);
const layout=await f.evaluate(()=>({height:innerHeight,scroll:document.documentElement.scrollHeight,button:document.getElementById('finish').getBoundingClientRect().bottom}));assert.equal(layout.scroll,layout.height);assert.ok(layout.button<=layout.height);
if(process.env.LEXOMA_SCREENSHOTS)await embeddedPage.screenshot({path:path.join(process.env.LEXOMA_SCREENSHOTS,'lexoma-embedded.png')});
// Otro alumno en el mismo Chromebook no ve la partida anterior.
await embeddedPage.evaluate(()=>{student='b';saved=null;fail=true});await f.goto(f.url());await f.waitForFunction(()=>LexomaBridge.initialized);assert.equal(await f.evaluate(()=>LexomaEngine.run),null);
assert.deepEqual(embeddedErrors,[]);console.log('Bridge OK: READY/INIT, checkpoint, recuperación de selección, salida confirmada/fallida, cierre host, iframe sin scroll y perfil aislado.');const standalone=await browser.newPage();await standalone.goto(pathToFileURL(path.join(root,'index.html')).href);await standalone.locator('#new').click();assert.equal(await standalone.evaluate(()=>LexomaEngine.run.hand.length),10);console.log('Archivo local OK: se abre sin servidor ni dependencias externas.');await browser.close();server.close();
