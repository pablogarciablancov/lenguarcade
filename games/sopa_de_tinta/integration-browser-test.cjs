const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'apps-script/LenguArcade_Alumno.html'),'utf8');
const runner=html.slice(html.indexOf("const GAME_BRIDGE_NAMESPACE="),html.indexOf('\nconst openGameWithoutIntegration='));
const css=html.slice(html.lastIndexOf('<style>',html.indexOf("const GAME_BRIDGE_NAMESPACE="))+7,html.lastIndexOf('</style>',html.indexOf("const GAME_BRIDGE_NAMESPACE=")));
const progression=fs.readFileSync(path.join(root,'supabase/functions/_shared/progression.js'),'utf8').replaceAll('export function','function');
const game=JSON.parse(fs.readFileSync(path.join(root,'config/game-catalog.json'),'utf8')).games.find(g=>g.id==='sopa_de_tinta');
const cardCode=html.slice(html.indexOf('function renderGames('),html.indexOf('function openGame(',html.indexOf('function renderGames(')));
const bannerCode=html.slice(html.indexOf('function bannerUrl('),html.indexOf('function setStatus(',html.indexOf('function bannerUrl(')));
const menuCSS=html.slice(html.indexOf('<style>')+7,html.indexOf('</style>'));
const fixture=`<!doctype html><html><head><style>${menuCSS}${css}.hidden{display:none!important}body{margin:0}button{cursor:pointer}</style></head><body><div class="games" id="games"></div><button id="play">Jugar Sopa de Tinta</button><script>
const $=id=>document.getElementById(id);let token='qa',currentDashboard={student:{studentId:'integration-student',nombre:'Prueba'},games:[{gameId:'sopa_de_tinta',nombre:'Sopa de Tinta',banner:${JSON.stringify(game.banner)},url:location.origin+'/games/sopa_de_tinta/',integration:'embedded',progress:{}}]};
function esc(s){return String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('\"','&quot;');}
${bannerCode}
${cardCode}
renderGames(currentDashboard.games.map(g=>({...g,progress:{percentage:0},icono:'☕',categoria:'Conceptos de Lengua',estado:'en pruebas',descripcion:'El café de los conceptos',buttonLabel:'Jugar'})));
window.saved=null;window.requests=[];window.failSave=false;window.achievements=new Set();const seen=new Set();function saveCache(){}function renderDashboard(){}function setStatus(){}
${progression}
async function callServer(fn,args){if(fn==='getStudentDashboardByToken')return currentDashboard;const p=args[0];requests.push(p);if(failSave)throw Error('offline');const g=currentDashboard.games[0],old=g.progress;const raw=p.rawGameData;if(!seen.has(p.resultId)){const previous=readProgressRawJson(old.rawJson);const next=snapshotProgress('sopa_de_tinta',raw.save,previous.save,old,raw,previous,{checkpoint:fn==='saveGameCheckpoint'});g.progress={...old,...next,rawJson:raw};seen.add(p.resultId);saved=raw.save;for(const a of p.achievements||[])achievements.add(a.id);}return {record:g.progress};}
${runner}
mountGameRunner();$('play').onclick=()=>openEmbeddedGame(currentDashboard.games[0]);
</script></body></html>`;
const server=http.createServer((req,res)=>{if(req.url==='/fixture'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(fixture);}let p=path.join(root,req.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(p)]||'text/plain');res.end(fs.readFileSync(p));}catch{res.statusCode=404;res.end();}});

(async()=>{
 await new Promise(r=>server.listen(8766,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.TINTA_CHROMIUM_PATH,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1366,height:768}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(game.banner,route=>route.fulfill({contentType:'image/webp',body:fs.readFileSync(path.join(__dirname,'cafe.webp'))}));
 await page.goto('http://127.0.0.1:8766/fixture');
 assert((await page.locator('#games .game').getAttribute('style')).includes(game.banner));
 const size=await page.evaluate(async url=>{const i=new Image();i.src=url;await i.decode();return i.naturalWidth;},game.banner);assert.equal(size,1440);
 if(process.env.TINTA_QA_DIR)await page.screenshot({path:process.env.TINTA_QA_DIR+'/sopa-catalog.png'});
 async function open(){await page.click('#play');const f=page.frameLocator('#gameRunnerFrame');await f.getByRole('button',{name:/JUGAR AVENTURA/}).waitFor();return f;}
 let f=await open();await f.getByRole('button',{name:/JUGAR AVENTURA/}).click();await f.locator('.district-play[data-category="narrativa"]').click();
 await f.locator('body').evaluate(()=>TintaGame.submit(TintaGame.run.words[0].cells));
 await page.waitForFunction(()=>saved?.profile?.stats?.words===1);
 const xp=await page.evaluate(()=>currentDashboard.games[0].progress.xp);assert.equal(xp,6);
 assert.equal(await page.evaluate(()=>currentDashboard.games[0].progress.percentage),0);
 assert(await page.evaluate(()=>achievements.has('primer_sorbo')));
 assert.equal(await page.evaluate(()=>Object.keys(saved.profile.discovered).length),1);
 await f.locator('body').evaluate(()=>TintaBridge.checkpoint('repeat'));await page.waitForTimeout(150);
 assert.equal(await page.evaluate(()=>currentDashboard.games[0].progress.xp),xp);
 await page.click('#gameRunnerClose');await page.waitForFunction(()=>activeGameRunner===null);
 await page.evaluate(()=>localStorage.clear());f=await open();await f.getByRole('button',{name:'Continuar pedido'}).click();
 assert.equal(await f.locator('body').evaluate(()=>TintaGame.run.words.filter(w=>w.found).length),1);
 await f.locator('body').evaluate(()=>{for(const w of TintaGame.run.words.filter(w=>!w.found))TintaGame.submit(w.cells);});
 await page.waitForFunction(()=>saved?.run?.done===true);
 assert(Math.abs(await page.evaluate(()=>currentDashboard.games[0].progress.percentage)-100/28)<1e-10);
 const finalXp=await page.evaluate(()=>currentDashboard.games[0].progress.xp);
 await f.locator('body').evaluate(()=>TintaBridge.result());await page.waitForTimeout(150);
 assert.equal(await page.evaluate(()=>currentDashboard.games[0].progress.xp),finalXp);
 await page.click('#gameRunnerClose');await page.waitForFunction(()=>activeGameRunner===null);
 assert.deepEqual(errors,[]);
 console.log('Integración Sopa OK: portada real, runner, glosario/logros, XP idempotente, cierre confirmado, restauración central y progreso 1/28.');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exit(1)});
