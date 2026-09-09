import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const v2Root=path.join(root,"games","battlegrafia_v2");
const index=fs.readFileSync(path.join(v2Root,"index.html"),"utf8");
const theme=fs.readFileSync(path.join(v2Root,"theme-v2.css"),"utf8");
const enhance=fs.readFileSync(path.join(v2Root,"enhance-v2.js"),"utf8");
const rpgUi=fs.readFileSync(path.join(v2Root,"rpg-ui-v2.js"),"utf8");
const saveSlots=fs.readFileSync(path.join(v2Root,"save-slots-v2.js"),"utf8");
const rpgCss=fs.readFileSync(path.join(v2Root,"rpg-ui-v2.css"),"utf8");
const unifiedUi=fs.readFileSync(path.join(v2Root,"rpg-unified-v2.js"),"utf8");
const unifiedCss=fs.readFileSync(path.join(v2Root,"rpg-unified-v2.css"),"utf8");
const battleUi=fs.readFileSync(path.join(v2Root,"battle-clean-v2.js"),"utf8");
const battleCss=fs.readFileSync(path.join(v2Root,"battle-clean-v2.css"),"utf8");
const battleRouter=fs.readFileSync(path.join(v2Root,"battle-router-v2.js"),"utf8");
const battleRouterCss=fs.readFileSync(path.join(v2Root,"battle-router-v2.css"),"utf8");
const tabsPolish=fs.readFileSync(path.join(v2Root,"tabs-polish-v2.js"),"utf8");
const tabsPolishCss=fs.readFileSync(path.join(v2Root,"tabs-polish-v2.css"),"utf8");
const stableTabs=fs.readFileSync(path.join(v2Root,"stable-tabs-v2.js"),"utf8");
const stableTabsCss=fs.readFileSync(path.join(v2Root,"stable-tabs-v2.css"),"utf8");
const catalogPolish=fs.readFileSync(path.join(v2Root,"catalog-polish-v2.js"),"utf8");
const classic=fs.readFileSync(path.join(root,"games","battlegrafia","index.html"),"utf8");
const catalog=JSON.parse(fs.readFileSync(path.join(root,"config","game-catalog.json"),"utf8"));
const migration=fs.readFileSync(path.join(root,"supabase","migrations","20260905144700_battlegrafia_v2.sql"),"utf8");

const errors=[];

try{ new Function(enhance); }catch(error){ errors.push("enhance-v2.js no compila: "+error.message); }
try{ new Function(rpgUi); }catch(error){ errors.push("rpg-ui-v2.js no compila: "+error.message); }
try{ new Function(saveSlots); }catch(error){ errors.push("save-slots-v2.js no compila: "+error.message); }
try{ new Function(unifiedUi); }catch(error){ errors.push("rpg-unified-v2.js no compila: "+error.message); }
try{ new Function(battleUi); }catch(error){ errors.push("battle-clean-v2.js no compila: "+error.message); }
try{ new Function(battleRouter); }catch(error){ errors.push("battle-router-v2.js no compila: "+error.message); }
try{ new Function(tabsPolish); }catch(error){ errors.push("tabs-polish-v2.js no compila: "+error.message); }
try{ new Function(stableTabs); }catch(error){ errors.push("stable-tabs-v2.js no compila: "+error.message); }
try{ new Function(catalogPolish); }catch(error){ errors.push("catalog-polish-v2.js no compila: "+error.message); }

for(const required of [
  "./save-slots-v2.js",
  "./rpg-ui-v2.js",
  "./rpg-unified-v2.js",
  "./battle-clean-v2.js",
  "./battle-router-v2.js",
  "./tabs-polish-v2.js",
  "./stable-tabs-v2.js",
]){
  if(!index.includes(required)) errors.push("Falta carga de interfaz RPG v2: "+required);
}

for(const required of [
  "const TEST_MODE = (() =>",
  "params.get('test') === '1'",
  "function enableDirectTestMode()",
  "pruebas@lenguarcade.local",
  "Modo prueba · Fantasy Arcade v2",
]){
  if(!enhance.includes(required)) errors.push("Falta modo de prueba directa en v2: "+required);
}

for(const required of [
  "const GAME_ID = 'battlegrafia_v2'",
  "battlegrafia_v2_player_pixel_historia_v6",
  "battlegrafia_v2_save_slots_v1",
  "battlegrafia_v2_active_slot_v1",
  "./enhance-v2.js",
]){
  if(!index.includes(required)) errors.push("Falta en index v2: "+required);
}

for(const forbidden of [
  "const GAME_ID = 'battlegrafia';",
  "battlegrafia_player_pixel_historia_v6",
  "battlegrafia_save_slots_v1_",
  "battlegrafia_active_slot_v1_",
]){
  if(index.includes(forbidden)) errors.push("La v2 conserva una clave compartida con la clásica: "+forbidden);
}

if(!classic.includes("const GAME_ID = 'battlegrafia';")) errors.push("La Battlegrafía clásica ha perdido su GAME_ID.");
if(classic.includes("./enhance-v2.js")) errors.push("La Battlegrafía clásica no debe cargar la capa v2.");

const worlds={
  montanas:["h_ghoul","vampiro_v","gargantua_gj","espectro_agudo","serpiente_comata","lexikon"],
  castillo:["diacritik","oxiton","llanor","puntor","kalkor","paper"],
  cienaga:["esdrulia","muxlor","prosodion","zarruk","minotauro","torvax"],
  acantilados:["caoskrin","hiatikus","momia","rugiton","zombie","sintaxion"],
  volcan:["gravikus","jarkon","ortograf","siseus","ciclope","don_pablo"],
};
const all=Object.values(worlds).flat();
if(all.length!==30 || new Set(all).size!==30) errors.push("El roster v2 debe contener exactamente 30 monstruos únicos.");
for(const [world,ids] of Object.entries(worlds)){
  if(ids.length!==6) errors.push(`El mundo ${world} no tiene 5 guardianes + jefe.`);
  for(const id of ids){
    if(!enhance.includes(`'${id}'`)) errors.push(`Falta monstruo v2: ${world}/${id}`);
  }
}
for(const boss of ["lexikon","paper","torvax","sintaxion","don_pablo"]){
  const re=new RegExp(`\\['${boss}'[^\\n]+true\\]`);
  if(!re.test(enhance)) errors.push("El jefe no está marcado como boss en v2: "+boss);
}
for(const bg of [
  "battle_bg_montanas.webp","battle_bg_castillo.webp","battle_bg_cienaga.webp",
  "battle_bg_acantilados.webp","battle_bg_volcan.webp"
]){
  if(!enhance.includes(bg) && !theme.includes(bg)) errors.push("Falta escenario v2: "+bg);
}

for(const required of [
  "#bg2-world-strip","#bg2-map-roster","#bg2-boss-intro",
  "#battle-screen","#main-menu","#mode-screen",
]){
  if(!theme.includes(required)) errors.push("Falta capa visual v2: "+required);
}

for(const required of [
  "rpg_slot_",
  "PERSISTENT_MODES = ['adventure','survival','dominio','strategy']",
  "MODE_BACKUP_KEY",
  "function modeSummary",
  "function activateMode",
  "function backupMode",
  "function clearMode",
  "function prepareModeNew",
]){
  if(!saveSlots.includes(required)) errors.push("Falta guardado independiente por modo v2: "+required);
}

for(const required of [
  "bg2-rpg-hub",
  ">PARTIDAS<",
  ">ENTRENAMIENTO<",
  "bg2-mode-archive",
  "Partidas por modo",
  "function launchContinueMode",
  "function launchNewMode",
  "prepareModeNew",
  "window.BG.startMode",
]){
  if(!rpgUi.includes(required)) errors.push("Falta archivo RPG de partidas por modo: "+required);
}
if(rpgUi.includes('data-action="profile"')){
  errors.push("El HUB RPG no debe recuperar el botón Perfil redundante.");
}

if(!rpgUi.includes("observer.observe(document.body,{subtree:true,childList:true});")){
  errors.push("La UI RPG debe observar solo inserciones DOM para evitar bucles de carga.");
}
if(rpgUi.includes("attributeFilter:['class','style']")){
  errors.push("La UI RPG no debe observar style/class globalmente: puede saturar la carga.");
}

for(const required of [
  "#bg2-rpg-hub",
  ".bg2-rpg-action",
  "#bg2-mode-archive-grid",
  ".bg2-mode-save",
  "#battle-screen",
  "#mode-screen",
  "#start-screen",
]){
  if(!rpgCss.includes(required)) errors.push("Falta dirección visual RPG v2: "+required);
}
if(rpgCss.includes('content:"PLAYER DATA"')){
  errors.push("La ficha del héroe no debe mostrar la etiqueta PLAYER DATA.");
}

for(const required of [
  "bg2-unified-rpg",
  "dataset.rpgKicker",
  "annotateNavigation",
  "annotateOverlays",
  "annotateSubmenus",
  "ensureSingleActiveScreen",
  "dataset.rpgDescription",
]){
  if(!unifiedUi.includes(required)) errors.push("Falta unificación de pantallas RPG: "+required);
}

for(const required of [
  "backdrop-filter:none!important",
  "#camp-screen",
  "#map-screen",
  "#inventory-screen",
  "#diary-screen",
  "#history-screen",
  "#hub-shop",
  "#hub-collection",
  "#hub-achievements",
  "#monster-modal",
  ".strategy-choice",
  ".end-overlay",
  ".bg2-rpg-submenu",
  ".bg2-rpg-game-submenu",
  ".app-screen:not(.is-active)",
  "#start-choice-new",
  "#hub-shop-list",
  "#shop-list",
  ".shop-merchant-header",
  ".shop-buy-btn",
  ".shop-sell-btn",
]){
  if(!unifiedCss.includes(required)) errors.push("Falta estilo RPG unificado: "+required);
}

for(const required of [
  "bg2-battle-clean",
  "bg2-in-battle",
  "function updateBattleState",
  "CORRIGE ESTE DESAFÍO",
  "CORREGIR Y ATACAR",
  "removeBattleNoise",
]){
  if(!battleUi.includes(required)) errors.push("Falta interfaz de combate limpia: "+required);
}

for(const required of [
  "#bg2-world-strip",
  "#nav-map",
  "#nav-diary",
  "#nav-history",
  "grid-template-columns:minmax(0,1fr) 390px",
  "#battle-screen .battle-sprites-row",
  "#input-panel",
  "#attack-btn",
  "#log-panel",
]){
  if(!battleCss.includes(required)) errors.push("Falta layout de combate limpio: "+required);
}

if(!enhance.includes("La ruta completa de monstruos pertenece al MAPA, no al combate.")){
  errors.push("El combate v2 debe retirar el riel de monstruos y dejarlo solo en el mapa.");
}
if(enhance.includes("strip.appendChild(rail);")){
  errors.push("El combate v2 sigue construyendo el riel de monstruos dentro de battle-screen.");
}

for(const required of [
  "VIEW_MAP",
  "SCREEN_MAP",
  "function applyView",
  "function syncFromEngine",
  "BG2BattleRouter",
  "dataset.bg2View",
]){
  if(!battleRouter.includes(required)) errors.push("Falta router visual interno v2: "+required);
}
for(const required of [
  '[data-bg2-view="battle"] #battle-screen',
  '[data-bg2-view="map"] #map-screen',
  '[data-bg2-view="camp"] #camp-screen',
  '[data-bg2-view="inventory"] #inventory-screen',
  '.top-nav .nav-btn',
  '#nav-map',
  '#nav-diary',
  '#nav-history',
]){
  if(!battleRouterCss.includes(required)) errors.push("Falta contrato de visibilidad/navegación: "+required);
}
if(index.includes("      display:flex;\n      flex-direction:column;\n      gap:.6rem;\n    }\n\n   /* Fondo de batalla */")){
  errors.push("El CSS base v2 aún fuerza display:flex a todas las pantallas internas.");
}

// Smoke test del router con DOM mínimo: battle -> map -> camp -> inventory -> battle.
try{
  class FakeClassList{
    constructor(...tokens){ this.s=new Set(tokens); }
    contains(t){ return this.s.has(t); }
    add(...t){ t.forEach(x=>this.s.add(x)); }
    remove(...t){ t.forEach(x=>this.s.delete(x)); }
    toggle(t,on){ if(on===undefined){ on=!this.s.has(t); } on?this.s.add(t):this.s.delete(t); return on; }
  }
  class FakeEl{
    constructor(id="",classes=[]){
      this.id=id; this.classList=new FakeClassList(...classes); this.style={display:"",visibility:""};
      this.dataset={}; this.attrs={}; this.listeners={};
    }
    setAttribute(k,v){ this.attrs[k]=String(v); }
    addEventListener(k,fn){ (this.listeners[k]||(this.listeners[k]=[])).push(fn); }
    dispatch(k){ for(const fn of (this.listeners[k]||[])) fn({target:this}); }
  }
  const ids={};
  const mk=(id,classes=[])=>ids[id]=new FakeEl(id,classes);
  const body=new FakeEl("body",[]);
  body.removeAttribute=function(k){ if(k==="data-bg2-view") delete this.dataset.bg2View; };
  const head={appendChild(){}};
  const shell=new FakeEl("shell",["game-shell"]); shell.style.display="block";
  const topNav=new FakeEl("top",["top-nav"]);
  const panel=new FakeEl("panel",["panel-right"]);
  const start=mk("start-screen",[]); start.style.display="none";
  for(const [nav,screen] of [
    ["nav-battle","battle-screen"],["nav-camp","camp-screen"],["nav-map","map-screen"],
    ["nav-diary","diary-screen"],["nav-history","history-screen"],["nav-inventory","inventory-screen"]
  ]){
    mk(nav, nav==="nav-battle"?["nav-active"]:[]);
    const el=mk(screen,[]); el.style.display=screen==="battle-screen"?"flex":"none";
  }
  const documentMock={
    readyState:"complete", body, head,
    getElementById(id){ return ids[id]||null; },
    createElement(){ return new FakeEl(); },
    querySelector(sel){
      if(sel===".game-shell") return shell;
      if(sel===".top-nav") return topNav;
      if(sel===".panel-right") return panel;
      return null;
    }
  };
  const oldDocument=globalThis.document, oldWindow=globalThis.window, oldGet=globalThis.getComputedStyle;
  const oldMutation=globalThis.MutationObserver, oldRaf=globalThis.requestAnimationFrame;
  const oldSetTimeout=globalThis.setTimeout, oldClearTimeout=globalThis.clearTimeout;
  globalThis.document=documentMock;
  globalThis.window=globalThis;
  globalThis.getComputedStyle=(el)=>({display:el.style.display||"block",visibility:el.style.visibility||"visible"});
  globalThis.MutationObserver=class{ observe(){} };
  globalThis.requestAnimationFrame=(fn)=>{ fn(); return 1; };
  globalThis.setTimeout=(fn)=>{ fn(); return 1; };
  globalThis.clearTimeout=()=>{};
  try{
    new Function(battleRouter)();
    const router=globalThis.BG2BattleRouter;
    if(!router) throw new Error("BG2BattleRouter no expuesto");
    const assertView=(mode)=>{
      router.applyView(mode);
      if(body.dataset.bg2View!==mode) throw new Error("dataset incorrecto para "+mode);
      for(const [view,id] of Object.entries({battle:"battle-screen",camp:"camp-screen",map:"map-screen",diary:"diary-screen",history:"history-screen",inventory:"inventory-screen"})){
        const expected=view===mode?"1":"0";
        if(ids[id].dataset.bg2Visible!==expected) throw new Error(id+" visible="+ids[id].dataset.bg2Visible+" esperado "+expected);
      }
      if(panel.dataset.bg2Visible!==(mode==="battle"?"1":"0")) throw new Error("panel-right incorrecto en "+mode);
    };
    ["battle","map","battle","camp","inventory","battle"].forEach(assertView);
  }finally{
    globalThis.document=oldDocument; globalThis.window=oldWindow; globalThis.getComputedStyle=oldGet;
    globalThis.MutationObserver=oldMutation; globalThis.requestAnimationFrame=oldRaf;
    globalThis.setTimeout=oldSetTimeout; globalThis.clearTimeout=oldClearTimeout;
    try{ delete globalThis.BG2BattleRouter; }catch{}
  }
}catch(error){
  errors.push("Smoke test router batalla/mapa fallido: "+error.message);
}

for(const required of [
  "bg2-tabs-polished",
  "camp-screen",
  "map-screen",
  "inventory-screen",
  "diary-screen",
  "history-screen",
]){
  if(!tabsPolish.includes(required)) errors.push("Falta pulido de pestañas v2: "+required);
}

for(const required of [
  "width:min(1320px,calc(100vw - 34px))",
  "grid-template-columns:minmax(0,1fr) 330px",
  '"canvas stages"',
  "#map-screen #map-stages::before",
  "#bg2-map-roster",
  "grid-template-columns:370px minmax(0,1fr)",
]){
  if(!tabsPolishCss.includes(required)) errors.push("Falta ensanchado/mapa estable v12: "+required);
}

for(const required of [
  "#inventory-screen #monster-collection",
  "width:46px!important",
  "height:46px!important",
  "width:38px!important",
  "height:38px!important",
  "min-height:0!important",
]){
  if(!tabsPolishCss.includes(required)) errors.push("Falta colección compacta de criaturas en Mochila v14: "+required);
}

if(!enhance.includes("El roster v2 duplicaba esa misma información y rompía la cuadrícula del mapa.")){
  errors.push("El mapa v2 debe eliminar el roster duplicado.");
}

for(const required of [
  "bg2-stable-tabs",
  "nav-home",
  "nav-battle",
  "nav-camp",
  "nav-map",
  "nav-diary",
  "nav-history",
  "nav-inventory",
]){
  if(!stableTabs.includes(required)) errors.push("Falta navegación fija v13: "+required);
}

for(const required of [
  "flex:0 0 88px!important",
  "width:88px!important",
  "height:38px!important",
  "#nav-home{order:1!important}",
  "#nav-battle{order:2!important}",
  "#nav-camp{order:3!important}",
  "#nav-map{order:4!important}",
  "#nav-diary{order:5!important}",
  "#nav-history{order:6!important}",
  "#nav-inventory{order:7!important}",
]){
  if(!stableTabsCss.includes(required)) errors.push("Falta geometría estable de pestañas v13: "+required);
}

if(!stableTabsCss.includes('@media(min-width:1100px) and (max-height:800px)')){
  errors.push("Falta cobertura Chromebook para pestañas estables.");
}

for(const required of [
  "Montañas de Lexikon",
  "Castillo de Paper",
  "Ciénaga de Torvax",
  "Acantilados de Sintaxion",
  "Volcán de Don Pablo",
  "Cartografía del Reino",
]){
  if(!index.includes(required)) errors.push("Falta nomenclatura v2 coherente en mapa: "+required);
}
if(enhance.includes("roster.appendChild(card);")){
  errors.push("El mapa v2 sigue renderizando un segundo roster de monstruos.");
}

for(const required of [
  'width:min(1240px,calc(100vw - 24px))',
  'height:min(650px,calc(100vh - 76px))',
  'grid-template-columns:minmax(0,1fr) 345px',
  'width:min(1140px,calc(100% - 12px))',
  '#camp-screen .camp-container',
  '[data-bg2-view="map"] #map-screen',
  '#inventory-screen .inventory-layout',
  '#diary-screen .diary-layout',
  '#history-screen #history-gallery',
]){
  if(!tabsPolishCss.includes(required)) errors.push("Falta layout alineado/escala contenida v2: "+required);
}

if(index.includes("const menu = document.getElementById('start-choice');\n    if(menu) menu.classList.add('is-active');")){
  errors.push("El listener demo legacy todavía puede superponer start-choice al menú principal.");
}
if(!index.includes("document.querySelectorAll('.app-screen.is-active').forEach(screen => screen.classList.remove('is-active'));")){
  errors.push("Falta normalización del arranque para evitar dos app-screen activas.");
}

for(const required of [
  "bg2-preboot",
  "bg2-preboot-screen",
  "ABRIENDO LAS PUERTAS DEL REINO",
  "__BG2_PREBOOT_FAILSAFE",
]){
  if(!index.includes(required)) errors.push("Falta cortina anti-FOUC v2: "+required);
}
for(const required of [
  "function finishPreboot",
  "setTimeout(finishPreboot, 430)",
  "document.documentElement.classList.remove('bg2-preboot')",
]){
  if(!unifiedUi.includes(required)) errors.push("Falta cierre de arranque anti-flash: "+required);
}

const catalogEntry=catalog.games.find(game=>game.id==="battlegrafia_v2");
if(!catalogEntry){
  errors.push("El catálogo canónico no registra Battlegrafía 2.0.");
}else{
  if(catalogEntry.official!==false) errors.push("Battlegrafía 2.0 debe seguir fuera del catálogo oficial.");
  if(catalogEntry.active!==false) errors.push("Battlegrafía 2.0 debe seguir inactiva en producción.");
  if(catalogEntry.integration!=="embedded") errors.push("Battlegrafía 2.0 debe conservar su integración embebida de laboratorio.");
  if(catalogEntry.entry!=="games/battlegrafia_v2/") errors.push("Battlegrafía 2.0 debe apuntar a su directorio aislado.");
}
if(!migration.includes("'battlegrafia_v2'") || !migration.includes("on conflict (id) do update")){
  errors.push("Falta la migración idempotente de Battlegrafía 2.0.");
}

for(const required of [
  'return ["adventure","survival","dominio","strategy"].filter',
  'if(getSelectedModeId() === "practice") return;',
  "function snapshotRunState()",
  "function restoreRunStateFromPlayer(savedPlayer)",
  "player.__runState = snapshotRunState();",
  "runState.strategyMonsterIds = ids.slice();",
  "async function continueSelectedMode()",
  "function startModeDirect(mode, intent='new')",
  "window.BG.startMode = startModeDirect",
  "const hasLiveRun = selected.length > 0 && Number(runState.endsAt || 0) > Date.now();",
  "const persistentModes = ['adventure','survival','dominio','strategy'];",
  "persistentModes.includes(mode)",
  "./save-slots-v2.js?v=20260909-rpg27",
  "./rpg-ui-v2.js?v=20260909-rpg27",
]){
  if(!index.includes(required)) errors.push("Falta aislamiento/continuación de partidas por modo v2: "+required);
}

for(const required of [
  "function updateBattleItemSelect()",
  "const select = document.getElementById(\'battle-item-select\')",
  "select.replaceChildren()",
  "select.appendChild(makeOption(\"\", \"Usar objeto…\"))",
  "select.appendChild(makeOption(name,",
  "battleItemSelect && (battleItemSelect.disabled = true)",
]){
  if(!index.includes(required)) errors.push("Falta reparación del selector de objetos en combate v2: "+required);
}
const battleSelectStart = index.indexOf("function updateBattleItemSelect(){");
const battleSelectEnd = index.indexOf("function getHintText(){", battleSelectStart);
const battleSelectFn = battleSelectStart >= 0 && battleSelectEnd > battleSelectStart
  ? index.slice(battleSelectStart, battleSelectEnd)
  : "";
if(!battleSelectFn || battleSelectFn.includes("innerHTML = `<div") || battleSelectFn.includes("html += `<div")){
  errors.push("El selector de objetos no puede insertar <div> dentro de un <select>.");
}

// Bestiario canónico: mismo roster de 30 criaturas que la aventura.
const rawCatalogStart=index.indexOf("  const rawCatalog = [");
const rawCatalogEnd=index.indexOf("\n  ];", rawCatalogStart);
const rawCatalogBlock=rawCatalogStart >= 0 && rawCatalogEnd > rawCatalogStart ? index.slice(rawCatalogStart,rawCatalogEnd) : "";
const rawCatalogLines=rawCatalogBlock.split("\n").filter(line=>line.includes('{ id:"'));
const rawCatalogEntries=rawCatalogLines.map(line=>({
  id:(line.match(/id:"([^"]+)"/)||[])[1] || "",
  world:(line.match(/world:"([^"]+)"/)||[])[1] || "",
  worldIndex:Number((line.match(/worldIndex:(\d+)/)||[])[1] || 0),
  boss:/boss:true/.test(line)
}));
if(rawCatalogEntries.length!==30) errors.push("El bestiario v2 debe contener exactamente 30 criaturas canónicas.");
if(new Set(rawCatalogEntries.map(x=>x.id)).size!==30) errors.push("El bestiario v2 contiene ids duplicados.");
for(const [worldId,ids] of Object.entries(worlds)){
  const entries=rawCatalogEntries.filter(x=>x.world===worldId);
  if(entries.length!==6) errors.push("El bestiario v2 debe tener 6 criaturas en "+worldId+".");
  const actualBoss=entries.filter(x=>x.boss).map(x=>x.id);
  if(actualBoss.length!==1 || actualBoss[0]!==ids[5]) errors.push("Jefe incorrecto en bestiario v2 para "+worldId+".");
  for(const id of ids){ if(!rawCatalogEntries.some(x=>x.id===id)) errors.push("Falta criatura canónica en bestiario v2: "+id); }
}
const loreStart=index.indexOf("const MONSTER_LORE = {");
const loreEnd=index.indexOf("\n};\n\nfunction getMonsterLore", loreStart);
const loreBlock=loreStart >= 0 && loreEnd > loreStart ? index.slice(loreStart,loreEnd) : "";
for(const id of all){
  if(!loreBlock.includes("\n  "+id+": {")) errors.push("Falta descripción propia en bestiario v2: "+id);
}
if(index.includes('desc:"Criatura del bestiario linguistico de Battlegrafia."')) errors.push("El bestiario v2 conserva la descripción genérica antigua.");
for(const required of [
  'card.dataset.monsterWorld = m.world || ""',
  'card.dataset.monsterBoss = m.boss ? "1" : "0"',
  'monster.boss ? "JEFE" : "CRIATURA"',
  'monster.worldName || "Mundo desconocido"',
  './catalog-polish-v2.js?v=20260909-rpg28'
]){ if(!index.includes(required)) errors.push("Falta metadata canónica del bestiario v2: "+required); }
for(const required of [
  "card.dataset.monsterWorld",
  "card.dataset.monsterBoss",
  "world-montanas",
  "world-castillo",
  "world-cienaga",
  "world-acantilados",
  "world-volcan",
  "const boss=card.dataset.monsterBoss === '1'"
]){ if(!catalogPolish.includes(required)) errors.push("La capa visual del bestiario no usa metadata real: "+required); }

for(const required of [
  "function getInventorySaleDef(itemName)",
  "function renderInventorySaleHtml()",
  "sellShopItem(root.dataset.itemName || root.dataset.id)",
  "BOSS_RELICS.includes(name)",
  "sellValue:6",
  "Fragmento de Diccionario",
  "battleState.precisionBoost",
  "battleState.noPenaltyTurns",
  "El Cristal Vocálico anula por completo el contraataque",
  "SHOP_ITEMS.forEach(item=>",
]){
  if(!index.includes(required)) errors.push("Falta auditoría funcional de objetos v2: "+required);
}

if(errors.length) throw new Error("Comprobaciones de Battlegrafía 2.0 fallidas:\n- "+errors.join("\n- "));
console.log("Battlegrafía 2.0 correcta: batalla limpia, RPG pixel UI unificada, partidas independientes por modo, 5 mundos, 30 sprites, objetos auditados y modo de prueba directa.");
