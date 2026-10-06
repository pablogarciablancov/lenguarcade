const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=process.cwd();const server=http.createServer((req,res)=>{const f=path.join(root,new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));try{const b=fs.readFileSync(f);res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.webp')?'image/webp':'text/html');res.end(b);}catch{res.statusCode=404;res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.VERSOPOLIS_CHROMIUM||undefined,args:["--no-sandbox","--disable-dev-shm-usage","--use-gl=angle","--use-angle=swiftshader","--single-process","--no-zygote"]});const page=await browser.newPage({viewport:{width:1366,height:768},hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**',route=>route.abort());await page.route('**/app.js?*',async route=>{const r=await route.fetch();let s=await r.text();s=s.replace(/\}\)\(\);\s*$/,'window.__test={newRun,chooseMuse,witnessFor,currentChallenge,collectionCards,renderGame,playSelection,get run(){return run;}};})();');await route.fulfill({response:r,body:s});});await page.goto('http://127.0.0.1:'+server.address().port+'/games/versopolis/');await page.evaluate(()=>window.VersopolisGame.setProfile({studentId:'table-test'}));await page.click('#startBtn');await page.locator('.atlasCard').first().click();await page.locator('.museCard').first().click();
for(const [width,height] of [[1366,768],[1440,900],[1920,1080],[1366,650],[1366,580],[1100,600]]){
 await page.setViewportSize({width,height});await page.waitForTimeout(220);
 const layout=await page.evaluate(()=>({width:document.body.scrollWidth,height:document.body.scrollHeight,font:parseFloat(getComputedStyle(document.querySelector('.hand .verseText')).fontSize),cards:Array.from(document.querySelectorAll('#hand .verseCard')).map(e=>({text:e.textContent,scroll:e.scrollHeight,client:e.clientHeight}))}));
 assert.equal(layout.width,width);assert.equal(layout.height,height);assert(layout.font>=20&&layout.font<=24);
 layout.cards.forEach(c=>assert(c.scroll<=c.client+1,'No clipped card content '+JSON.stringify(c)));
 const clipped=await page.evaluate(()=>['#rivalName','#rivalRank','#challengeTitle','#challengeDesc'].filter(selector=>{
  const element=document.querySelector(selector),range=document.createRange();range.selectNodeContents(element);
  const text=range.getBoundingClientRect(),panel=element.closest('.rivalStage,.challengeBanner').getBoundingClientRect();
  return text.top<panel.top-1||text.bottom>panel.bottom+1;
 }));
 assert.deepEqual(clipped,[],'Rival and contract text must fit their panels');
 const controls=await page.locator('#playBtn').boundingBox();assert(controls.y+controls.height<=height,'Combat action remains visible');
 console.log('Layout OK:',width,height,layout.font+'px');
}
await page.setViewportSize({width:1366,height:768});
const ids=await page.evaluate(()=>window.__test.run.hand.slice());
async function drag(source,target){let a=await source.boundingBox(),b=await target.boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:12});await page.mouse.up();}
const card=id=>page.locator('#hand [data-card-id="'+id+'"]'),slot=i=>page.locator('.poemSlot').nth(i);
await drag(card(ids[1]),slot(0));assert.deepEqual(await page.evaluate(()=>window.__test.run.selected),[ids[1]]);
await card(ids[2]).click();assert.deepEqual(await page.evaluate(()=>window.__test.run.selected),[ids[1],ids[2]]);
await drag(slot(0),slot(1));assert.deepEqual(await page.evaluate(()=>window.__test.run.selected),[ids[2],ids[1]]);
await drag(slot(1),page.locator('#districtName'));assert.deepEqual(await page.evaluate(()=>window.__test.run.selected),[ids[2],ids[1]]);
await drag(slot(1),page.locator('#hand'));assert.deepEqual(await page.evaluate(()=>window.__test.run.selected),[ids[2]]);
const cdp=await page.context().newCDPSession(page);let a=await card(ids[1]).boundingBox(),b=await slot(1).boundingBox();
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+a.width/2,y:a.y+a.height/2}]});
for(let i=1;i<=10;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:(a.x+a.width/2)*(1-i/10)+(b.x+b.width/2)*i/10,y:(a.y+a.height/2)*(1-i/10)+(b.y+b.height/2)*i/10}]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
assert.deepEqual(await page.evaluate(()=>window.__test.run.selected),[ids[2],ids[1]]);

// Cancel a real touch gesture without changing selection.
a=await card(ids[0]).boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+a.width/2,y:a.y+a.height/2}]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+a.width/2+35,y:a.y+a.height/2-35}]});
await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.deepEqual(await page.evaluate(()=>window.__test.run.selected),[ids[2],ids[1]]);
if(process.env.VERSOPOLIS_SCREENSHOT){const shot=await cdp.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(process.env.VERSOPOLIS_SCREENSHOT,Buffer.from(shot.data,'base64'));}
const before=await page.evaluate(()=>JSON.parse(JSON.stringify(window.__test.run)));
await page.evaluate(()=>window.VersopolisGame.persist());await page.click('#exitBtn');await page.reload();await page.evaluate(()=>window.VersopolisGame.setProfile({studentId:'table-test'}));await page.click('#continueBtn');
assert.deepEqual(await page.evaluate(()=>window.__test.run.selected),before.selected);
assert.deepEqual(await page.evaluate(()=>window.__test.run.hand),before.hand);
assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.querySelector('.screen:not(.hidden)').id),'gameScreen','Continue returns to the battle table');
await page.click('#tableInfoBtn');assert(await page.locator('#tableCodex').isVisible());await page.click('#tableInfoBtn');
await page.click('#openDeckBtn');await page.click('#deckBackBtn');
await page.evaluate(()=>{let t=window.__test;t.run.selected=t.witnessFor(t.currentChallenge(),t.collectionCards().filter(c=>t.run.hand.includes(c.uid))).map(c=>c.uid);t.renderGame();});
const score=await page.evaluate(()=>window.__test.run.runScore);await page.click('#playBtn');
assert(await page.evaluate(()=>window.__test.run.runScore)>score);
assert(await page.evaluate(()=>window.VersopolisGame.career.poems.length)>0,'Successful combinations become actual poems');
assert(await page.evaluate(()=>{let r=window.__test.run;return new Set([...r.hand,...r.deck,...r.discardPile]).size===r.cardPool.length;}));
await page.waitForTimeout(2100);
await page.evaluate(()=>window.VersopolisGame.show('homeScreen'));
await page.click('#poemsBtn');assert(await page.locator('#poemEditor').isVisible());
await page.fill('#poemTitle','Mi primer poema <tinta>');await page.fill('#poemText','La noche guarda mi canto\nLa luna busca mi llanto');
await page.click('#savePoemBtn');
const poemScore=await page.evaluate(()=>window.VersopolisGame.metrics().score);
const txtReady=page.waitForEvent('download');await page.click('#exportPoemTxtBtn');const txt=await txtReady;
assert.equal(txt.suggestedFilename(),'Mi-primer-poema-tinta.txt');assert(fs.readFileSync(await txt.path(),'utf8').includes('La luna busca mi llanto'));
const htmlReady=page.waitForEvent('download');await page.click('#exportPoemHtmlBtn');const htmlDownload=await htmlReady;
assert(fs.readFileSync(await htmlDownload.path(),'utf8').includes('&lt;tinta&gt;'),'Exported HTML escapes user text');
await page.click('#newPoemBtn');await page.fill('#poemTitle','Segunda estrofa');await page.fill('#poemText','El río canta la calma\nLa brisa busca mi alma');await page.click('#savePoemBtn');
await page.locator('.poemEntry input').nth(0).check();await page.locator('.poemEntry input').nth(1).check();await page.click('#assemblePoemsBtn');
assert((await page.inputValue('#poemText')).includes('\n\n'),'A complete poem keeps stanza breaks');
assert.equal(await page.evaluate(()=>window.VersopolisGame.metrics().score),poemScore,'Editing and assembling poems never awards combat XP');
await page.reload();await page.evaluate(()=>window.VersopolisGame.setProfile({studentId:'table-test'}));await page.click('#poemsBtn');
assert(await page.locator('.poemEntry').count()>=3,'Personal anthology persists with its profile');
await page.emulateMedia({media:'print'});assert(await page.locator('.poemPrint').isVisible());await page.emulateMedia({media:'screen'});
assert.deepEqual(errors,[]);console.log('PASS: interaction, score, card conservation, poem collection, editing, TXT/HTML, assembly, profile persistence and print');
await browser.close();server.close();})().catch(error=>{console.error(error);process.exit(1);});
