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

for(const required of [
  "./save-slots-v2.js",
  "./rpg-ui-v2.js",
  "./rpg-unified-v2.js",
  "./battle-clean-v2.js",
  "./battle-router-v2.js",
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
  "SLOT_COUNT = 3",
  "save_slots_backup_v1_adventure",
  "pendingNewSlotId",
  "function prepareNew",
]){
  if(!saveSlots.includes(required)) errors.push("Falta sistema de tres ranuras v2: "+required);
}

for(const required of [
  "bg2-rpg-hub",
  "CONTINUAR AVENTURA",
  "NUEVA AVENTURA",
  "MODOS DE JUEGO",
  "bg2-slots-modal",
  "function continueSlot",
  "function newSlot",
]){
  if(!rpgUi.includes(required)) errors.push("Falta shell RPG v2: "+required);
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
  "#bg2-slots-grid",
  "#battle-screen",
  "#mode-screen",
  "#start-screen",
]){
  if(!rpgCss.includes(required)) errors.push("Falta dirección visual RPG v2: "+required);
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

if(errors.length) throw new Error("Comprobaciones de Battlegrafía 2.0 fallidas:\n- "+errors.join("\n- "));
console.log("Battlegrafía 2.0 correcta: batalla limpia y enfocada, RPG pixel UI unificada, tres ranuras seguras, 5 mundos, 30 sprites, guardado aislado y modo de prueba directa.");
