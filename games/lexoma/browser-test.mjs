// Requiere Playwright; LEXOMA_CHROMIUM permite usar un Chromium ya instalado.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const moduleRoot=process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES;
const {chromium}=await import(moduleRoot?pathToFileURL(path.join(moduleRoot,'playwright/index.mjs')).href:'playwright');
const root=fileURLToPath(new URL('.',import.meta.url));
const hostHTML=`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#222}header{height:110px;display:grid;place-items:center;color:white;font:20px system-ui}iframe{display:block;width:100%;height:calc(100vh - 110px);border:0}</style><header>LenguArcade · Host</header><iframe id="game" src="/?lenguarcade=1&channel=lexoma-test"></iframe><script>
window.saved=null;window.closeReady=null;window.student='a';
function post(type,payload={}){game.contentWindow.postMessage({namespace:'lenguarcade-host',channel:'lexoma-test',type,payload},'*')}
addEventListener('message',e=>{const m=e.data;if(m?.namespace!=='lenguarcade-game'||m.channel!=='lexoma-test')return;if(m.type==='READY')post('INIT',{student:{studentId:student},save:saved});if(m.type==='CHECKPOINT'){saved={rawGameData:{save:m.payload.players[0].save}};post('CHECKPOINT_CONFIRMED',{checkpointId:m.payload.checkpointId});}if(m.type==='CLOSE_READY')closeReady=m.payload;});
</script>`;
const server=http.createServer((q,r)=>{
 const u=new URL(q.url,'http://localhost');
 if(u.pathname==='/host-test.html'){r.setHeader('content-type','text/html');r.end(hostHTML);return;}
 if(u.pathname==='/word_play/dictionary-es-50k.txt'){r.setHeader('content-type','text/plain');r.end('el\nmago\ncorre\ncasa\nsol\nluna\ngato\nperro\nsal\nmesa\nsapo\nrama\npato\n');return;}
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
await page.waitForSelector('#shopPanel:not([hidden])');
assert.equal(await page.evaluate(()=>LexomaEngine.run.coins),8);
assert.equal(await page.locator('.shop-offer').count(),3);
assert.equal(await page.evaluate(()=>LexomaEngine.run.bonuses.length),0);

// Se puede empezar sin comprar ninguna carta.
await page.locator('#leaveShopBtn').click();
assert.equal(await page.evaluate(()=>LexomaEngine.run.status),'play');
assert.equal(await page.evaluate(()=>LexomaEngine.run.bonuses.length),0);

// Fuerza primera tienda tras ronda, comprueba ingresos y compra.
await page.evaluate(()=>{const r=LexomaEngine.run;r.hand=[{id:101,char:'E',style:'normal'},{id:102,char:'L',style:'normal'},{id:103,char:'M',style:'normal'},{id:104,char:'A',style:'normal'},{id:105,char:'G',style:'normal'},{id:106,char:'O',style:'normal'},{id:107,char:'R',style:'normal'}];r.target=1;window.dispatchEvent(new Event('lexoma:change'));});
await page.locator('[data-tile="101"]').click();await page.locator('[data-tile="102"]').click();await page.locator('#playBtn').click();
await page.waitForSelector('#shopPanel:not([hidden])',{timeout:3000});
assert.ok(await page.evaluate(()=>LexomaEngine.run.lastIncome.total>=3));
const beforeBuy=await page.evaluate(()=>LexomaEngine.run.coins);
const price=await page.evaluate(()=>LexomaEngine.run.shop.cards[0].price);
await page.locator('.shop-offer').first().click();
assert.equal(await page.evaluate(()=>LexomaEngine.run.coins),beforeBuy-price);
assert.equal(await page.evaluate(()=>LexomaEngine.run.bonuses.length),1);

// Taller: mejorar carta y eliminar letra.
await page.evaluate(()=>{LexomaEngine.run.coins=99;window.dispatchEvent(new Event('lexoma:change'));});
await page.locator('#upgradeCardBtn').click();await page.waitForSelector('#choiceDialog[open]');assert.ok(await page.locator('[data-upgrade]').count()>=1);
await page.locator('[data-upgrade]').first().click();assert.equal(await page.evaluate(()=>Math.max(...Object.values(LexomaEngine.run.cardLevels))),2);
await page.locator('#removeLetterBtn').click();await page.waitForSelector('#choiceDialog[open]');const countBefore=await page.evaluate(()=>LexomaEngine.inventory().reduce((n,x)=>n+x.count,0));await page.locator('[data-remove-letter]').first().click();const countAfter=await page.evaluate(()=>LexomaEngine.inventory().reduce((n,x)=>n+x.count,0));assert.equal(countAfter,countBefore-1);

// Evento visible y resoluble.
await page.evaluate(()=>{const r=LexomaEngine.run;r.shop.eventId='apuesta';r.shop.eventResolved=false;window.dispatchEvent(new Event('lexoma:change'));});
await page.locator('[data-event-choice="accept"]').click();assert.equal(await page.evaluate(()=>LexomaEngine.run.nextTargetFactor),1.25);
await page.locator('#leaveShopBtn').click();assert.equal(await page.evaluate(()=>LexomaEngine.run.status),'play');

// Monedero visible y responsive sin scroll general.
for(const [width,height] of [[1366,768],[1440,900],[1920,1080],[1366,640]]){
 await page.setViewportSize({width,height});const q=await page.evaluate(()=>({scrollH:document.documentElement.scrollHeight,clientH:document.documentElement.clientHeight,scrollW:document.documentElement.scrollWidth,clientW:document.documentElement.clientWidth,hand:document.getElementById('hand').getBoundingClientRect(),wallet:document.getElementById('walletValue').getBoundingClientRect(),play:document.getElementById('playBtn').getBoundingClientRect()}));
 assert.equal(q.scrollH,q.clientH,`scroll vertical ${width}x${height}`);assert.equal(q.scrollW,q.clientW,`scroll horizontal ${width}x${height}`);for(const k of ['hand','wallet','play'])assert.ok(q[k].top>=0&&q[k].bottom<=height,`${k} visible ${width}x${height}`);
}
// Botones del final: Menú debe retirar el overlay e Infinito debe reabrir la partida.
await page.evaluate(()=>{const r=LexomaEngine.run;r.status='victory';r.finished=true;r.round=LexomaEngine.totalRounds();r.resultId='test-final';window.dispatchEvent(new Event('lexoma:change'));});
await page.waitForSelector('#endPanel:not([hidden])');
assert.equal(await page.locator('#endlessBtn').isVisible(),true);
await page.locator('#endMenuBtn').click();
assert.equal(await page.locator('#titleScreen').isVisible(),true);
assert.equal(await page.locator('#overlay').isVisible(),false);
await page.locator('#continueBtn').click().catch(()=>{});
await page.evaluate(()=>{const r=LexomaEngine.run;r.status='victory';r.finished=true;r.round=LexomaEngine.totalRounds();r.resultId='test-final-2';window.dispatchEvent(new Event('lexoma:change'));});
await page.waitForSelector('#endPanel:not([hidden])');
await page.locator('#endlessBtn').click();
assert.equal(await page.evaluate(()=>LexomaEngine.run.endless),true);
assert.equal(await page.evaluate(()=>LexomaEngine.run.status),'play');
assert.equal(await page.locator('#overlay').isVisible(),false);

const snap=await page.evaluate(()=>LexomaEngine.snapshot());await page.reload();await page.waitForFunction(()=>LexomaEngine.dictionaryReady);await page.locator('#continueBtn').click();assert.equal(await page.evaluate(()=>LexomaEngine.run.id),snap.run.id);
assert.deepEqual(errors,[]);console.log('UI OK: monedero, pasar sin comprar, compra, taller, evento y responsive.');

const host=await browser.newPage({viewport:{width:1366,height:768}});const hostErrors=[];host.on('pageerror',e=>hostErrors.push(e.message));
await host.goto(origin+'/host-test.html');const frame=host.frames().find(f=>f.parentFrame());await frame.waitForFunction(()=>LexomaBridge.initialized&&LexomaEngine.dictionaryReady);
await frame.locator('[data-mode="normal"]').click();await frame.waitForSelector('#shopPanel:not([hidden])');await frame.locator('#leaveShopBtn').click();
await frame.locator('#hand .hand-tile').first().click();await host.evaluate(()=>post('REQUEST_CHECKPOINT'));await host.waitForFunction(()=>saved?.rawGameData?.save?.run?.selected?.length===1);
const id=await frame.evaluate(()=>LexomaEngine.run.id),coins=await frame.evaluate(()=>LexomaEngine.run.coins);await frame.goto(frame.url());await frame.waitForFunction(()=>LexomaBridge.initialized&&LexomaEngine.dictionaryReady);assert.equal(await frame.evaluate(()=>LexomaEngine.run.id),id);assert.equal(await frame.evaluate(()=>LexomaEngine.run.coins),coins);
await host.evaluate(()=>post('REQUEST_EXIT'));await host.waitForFunction(()=>closeReady);assert.equal(await host.evaluate(()=>closeReady.saved),true);
assert.deepEqual(hostErrors,[]);console.log('Bridge OK: economía, checkpoint, restauración y salida.');
await browser.close();server.close();