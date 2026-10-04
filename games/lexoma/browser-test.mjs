// Requiere Playwright; LEXOMA_CHROMIUM permite usar un Chromium ya instalado.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const moduleRoot=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const {chromium}=await import(moduleRoot?pathToFileURL(path.join(moduleRoot,'playwright/index.mjs')).href:'playwright');
const root=fileURLToPath(new URL('.',import.meta.url));
const hostHTML=`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#222}header{height:110px;display:grid;place-items:center;color:white;font:20px system-ui}iframe{display:block;width:100%;height:calc(100vh - 110px);border:0}</style><header>LenguArcade · Host de pruebas</header><iframe id="game" src="/?lenguarcade=1&channel=lexoma-test"></iframe><script>
window.events=[];window.saved=null;window.fail=false;window.closeReady=null;window.student='a';
function post(type,payload={}){game.contentWindow.postMessage({namespace:'lenguarcade-host',channel:'lexoma-test',type,payload},'*')}
addEventListener('message',e=>{const m=e.data;if(m?.namespace!=='lenguarcade-game'||m.channel!=='lexoma-test')return;events.push(m);if(m.type==='READY')post('INIT',{student:{studentId:student},save:saved});if(m.type==='CHECKPOINT'){if(!fail){saved={rawGameData:{save:m.payload.players[0].save}};post('CHECKPOINT_CONFIRMED',{checkpointId:m.payload.checkpointId});}else post('CHECKPOINT_FAILED',{checkpointId:m.payload.checkpointId});}if(m.type==='CLOSE_READY')closeReady=m.payload;});
</script>`;
const server=http.createServer((q,r)=>{
 const u=new URL(q.url,'http://localhost');
 if(u.pathname==='/host-test.html'){r.setHeader('content-type','text/html');r.end(hostHTML);return;}
 if(u.pathname==='/word_play/dictionary-es-50k.txt'){r.setHeader('content-type','text/plain');r.end('el\nmago\ncorre\ncasa\nsol\nluna\ngato\nperro\n');return;}
 let file=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(u.pathname.endsWith('/'))file=path.join(file,'index.html');
 if(!file.startsWith(root)){r.writeHead(403).end();return;}
 try{r.setHeader('content-type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');r.end(fs.readFileSync(file));}catch{r.writeHead(404).end();}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,...(process.env.LEXOMA_CHROMIUM?{executablePath:process.env.LEXOMA_CHROMIUM}:{}),args:['--no-sandbox','--no-proxy-server']});
const page=await browser.newPage({viewport:{width:1366,height:768}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(origin+'/');await page.waitForFunction(()=>LexomaEngine.dictionaryReady);
await page.locator('[data-mode="normal"]').click();
await page.evaluate(()=>{const r=LexomaEngine.run;r.hand=[{id:101,char:'E',style:'normal'},{id:102,char:'L',style:'normal'},{id:103,char:'M',style:'normal'},{id:104,char:'A',style:'normal'},{id:105,char:'G',style:'normal'},{id:106,char:'O',style:'normal'},{id:107,char:'R',style:'normal'}];r.target=1;window.dispatchEvent(new Event('lexoma:change'));});
await page.locator('[data-tile="101"]').click();await page.locator('[data-tile="102"]').click();await page.locator('#playBtn').click();
await page.waitForSelector('#rewardPanel:not([hidden])');assert.equal(await page.locator('.reward-choice').count(),3);
await page.locator('.reward-choice').first().click();assert.equal(await page.evaluate(()=>LexomaEngine.run.round),2);assert.equal(await page.evaluate(()=>LexomaEngine.run.bonuses.length),1);
await page.evaluate(()=>{const r=LexomaEngine.run;r.hand=[{id:201,char:'C',style:'normal'},{id:202,char:'A',style:'normal'},{id:203,char:'S',style:'normal'},{id:204,char:'A',style:'normal'}];window.dispatchEvent(new Event('lexoma:change'));});
await page.locator('#rerollModeBtn').click();await page.locator('[data-tile="201"]').click();await page.locator('[data-tile="202"]').click();const rr=await page.evaluate(()=>LexomaEngine.run.rerolls);await page.locator('#doRerollBtn').click();assert.equal(await page.evaluate(()=>LexomaEngine.run.rerolls),rr-1);
for(const [width,height] of [[1366,768],[1440,900],[1920,1080],[1366,640]]){
 await page.setViewportSize({width,height});
 const q=await page.evaluate(()=>({scrollH:document.documentElement.scrollHeight,clientH:document.documentElement.clientHeight,scrollW:document.documentElement.scrollWidth,clientW:document.documentElement.clientWidth,hand:document.getElementById('hand').getBoundingClientRect(),score:document.querySelector('.score-row').getBoundingClientRect(),play:document.getElementById('playBtn').getBoundingClientRect()}));
 assert.equal(q.scrollH,q.clientH,`scroll vertical ${width}x${height}`);assert.equal(q.scrollW,q.clientW,`scroll horizontal ${width}x${height}`);
 for(const k of ['hand','score','play'])assert.ok(q[k].top>=0&&q[k].bottom<=height,`${k} visible ${width}x${height}`);
}
const snap=await page.evaluate(()=>LexomaEngine.snapshot());await page.reload();await page.waitForFunction(()=>LexomaEngine.dictionaryReady);await page.locator('#continueBtn').click();assert.equal(await page.evaluate(()=>LexomaEngine.run.id),snap.run.id);
await page.locator('#bonusDeckBtn').click();await page.waitForSelector('#collectionPanel:not([hidden])');await page.locator('#closeCollectionBtn').click();
assert.deepEqual(errors,[]);console.log('UI OK: palabra, score, recompensa, reroll, recuperación y responsive sin scroll.');

const host=await browser.newPage({viewport:{width:1366,height:768}});const hostErrors=[];host.on('pageerror',e=>hostErrors.push(e.message));
await host.goto(origin+'/host-test.html');const frame=host.frames().find(f=>f.parentFrame());await frame.waitForFunction(()=>LexomaBridge.initialized&&LexomaEngine.dictionaryReady);
await frame.locator('[data-mode="normal"]').click();await frame.locator('#hand .hand-tile').first().click();await host.evaluate(()=>post('REQUEST_CHECKPOINT'));await host.waitForFunction(()=>saved?.rawGameData?.save?.run?.selected?.length===1);
const id=await frame.evaluate(()=>LexomaEngine.run.id);await frame.goto(frame.url());await frame.waitForFunction(()=>LexomaBridge.initialized&&LexomaEngine.dictionaryReady);assert.equal(await frame.evaluate(()=>LexomaEngine.run.id),id);assert.equal(await frame.evaluate(()=>LexomaEngine.run.selected.length),1);
await host.evaluate(()=>post('REQUEST_EXIT'));await host.waitForFunction(()=>closeReady);assert.equal(await host.evaluate(()=>closeReady.saved),true);
assert.deepEqual(hostErrors,[]);console.log('Bridge OK: INIT, checkpoint, restauración y salida.');

await browser.close();server.close();