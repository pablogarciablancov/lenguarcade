const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'apps-script/LenguArcade_Alumno.html'),'utf8');
const runner=html.slice(html.indexOf("const GAME_BRIDGE_NAMESPACE="),html.indexOf('\nconst openGameWithoutIntegration='));
const css=html.slice(html.lastIndexOf('<style>',html.indexOf("const GAME_BRIDGE_NAMESPACE="))+7,html.lastIndexOf('</style>',html.indexOf("const GAME_BRIDGE_NAMESPACE=")));
const progression=fs.readFileSync(path.join(root,'supabase/functions/_shared/progression.js'),'utf8').replaceAll('export function','function');
const game=JSON.parse(fs.readFileSync(path.join(root,'config/game-catalog.json'),'utf8')).games.find(g=>g.id==='lexoma');
const cardCode=html.slice(html.indexOf('function renderGames('),html.indexOf('function openGame(',html.indexOf('function renderGames(')));
const bannerCode=html.slice(html.indexOf('function bannerUrl('),html.indexOf('function setStatus(',html.indexOf('function bannerUrl(')));
const menuCSS=html.slice(html.indexOf('<style>')+7,html.indexOf('</style>'));
const fixture=`<!doctype html><html><head><style>${menuCSS}${css}.hidden{display:none!important}body{margin:0}button{cursor:pointer}</style></head><body><div class="games" id="games"></div><button id="play">Jugar Forja</button><script>
const $=id=>document.getElementById(id);let token='qa',currentDashboard={student:{studentId:'integration-student',nombre:'Prueba'},games:[{gameId:'lexoma',nombre:'FORJA',banner:${JSON.stringify(game.banner)},url:location.origin+'/games/lexoma/',integration:'embedded',progress:{}}]};
function esc(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('\"','&quot;');}
${bannerCode}
${cardCode}
renderGames(currentDashboard.games.map(g=>({...g,progress:{percentage:0},icono:'F',categoria:'Vocabulario y estrategia',estado:'en pruebas',descripcion:'Roguelite de palabras',buttonLabel:'Jugar'})));
window.saved=null;window.requests=[];window.failSave=false;window.achievements=new Set();const seen=new Set();function saveCache(){}function renderDashboard(){}function setStatus(){}
${progression}
async function callServer(fn,args){if(fn==='getStudentDashboardByToken')return currentDashboard;const p=args[0];requests.push(p);if(failSave)throw Error('offline');const g=currentDashboard.games[0],old=g.progress;const raw=p.rawGameData;if(!seen.has(p.resultId)){const previous=readProgressRawJson(old.rawJson);const next=snapshotProgress('lexoma',raw.save,previous.save,old,raw,previous,{checkpoint:fn==='saveGameCheckpoint'});g.progress={...old,...next,rawJson:raw};seen.add(p.resultId);saved=raw.save;for(const a of p.achievements||[])achievements.add(a.id);}return {record:g.progress};}
${runner}
mountGameRunner();$('play').onclick=()=>openEmbeddedGame(currentDashboard.games[0]);
</script></body></html>`;
const server=http.createServer((req,res)=>{if(req.url==='/fixture'){res.setHeader('Content-Type','text/html');return res.end(fixture);}let p=path.join(root,req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(p)]||'text/plain');res.end(fs.readFileSync(p));}catch{res.statusCode=404;res.end();}});

(async()=>{
 await new Promise(r=>server.listen(8766,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.LEXOMA_CHROMIUM,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://pablogarciablancov.github.io/lenguarcade/games/lexoma/assets/forja-cover-v1.webp',route=>route.fulfill({contentType:'image/webp',body:fs.readFileSync(path.join(__dirname,'assets/forja-cover-v1.webp'))}));
 await page.goto('http://127.0.0.1:8766/fixture');
 assert((await page.locator('#games .game').getAttribute('style')).includes(game.banner));
 const image=await page.evaluate(async url=>{const i=new Image();i.src=url;await i.decode();return [i.naturalWidth,i.naturalHeight];},game.banner);assert(image[0]>1000);
 if(process.env.LEXOMA_QA_DIR)await page.screenshot({path:process.env.LEXOMA_QA_DIR+'/forja-catalog.png'});
 async function open(){await page.click('#play');const f=page.frameLocator('#gameRunnerFrame');await f.locator('#dictionaryStatus.ready').waitFor();return f;}
 let f=await open();await f.locator('[data-mode=normal]').click();await f.locator('#leaveShopBtn').click();
 await f.locator('body').evaluate(()=>{const E=LexomaEngine;E.run.hand=[...'TALAR'].map((char,i)=>({id:100+i,char,style:'normal'}));E.run.tileId=200;E.run.target=999;window.dispatchEvent(new Event('lexoma:change'));});
 for(let i=0;i<5;i++)await f.locator(`[data-tile="${100+i}"]`).click();
 assert(await f.locator('#playBtn').isEnabled());await f.locator('#playBtn').click();await f.locator('body').evaluate(()=>LexomaBridge.checkpoint('test'));
 await page.waitForFunction(()=>saved?.run?.words?.includes('talar'));
 const xp=await page.evaluate(()=>currentDashboard.games[0].progress.xp);assert(xp>0);
 await f.locator('body').evaluate(()=>LexomaBridge.checkpoint('repeat'));await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>currentDashboard.games[0].progress.xp),xp);
 for(const [width,height] of [[1366,768],[1440,900],[1920,1080]]){
  await page.setViewportSize({width,height});const q=await f.locator('body').evaluate(()=>[document.documentElement.scrollHeight,document.documentElement.clientHeight,document.documentElement.scrollWidth,document.documentElement.clientWidth]);assert.equal(q[0],q[1]);assert.equal(q[2],q[3]);
 }
 await page.setViewportSize({width:1366,height:768});
 if(process.env.LEXOMA_QA_DIR)await page.screenshot({path:process.env.LEXOMA_QA_DIR+'/forja-embedded.png'});
 await page.click('#gameRunnerClose');await page.waitForFunction(()=>activeGameRunner===null);
 await page.evaluate(()=>localStorage.clear());f=await open();await f.locator('#continueBtn').click();assert.equal(await f.locator('body').evaluate(()=>LexomaEngine.run.words.at(-1)),'talar');
 await page.click('#gameRunnerClose');await page.waitForFunction(()=>activeGameRunner===null);
 assert.deepEqual(errors,[]);console.log('Integración OK: portada real, runner, TALAR, XP idempotente, salida y restauración central sin caché, responsive.');
 await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1)});
