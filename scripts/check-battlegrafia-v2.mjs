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
const classic=fs.readFileSync(path.join(root,"games","battlegrafia","index.html"),"utf8");
const catalog=JSON.parse(fs.readFileSync(path.join(root,"config","game-catalog.json"),"utf8"));
const migration=fs.readFileSync(path.join(root,"supabase","migrations","20260905144700_battlegrafia_v2.sql"),"utf8");

const errors=[];

try{ new Function(enhance); }catch(error){ errors.push("enhance-v2.js no compila: "+error.message); }
try{ new Function(rpgUi); }catch(error){ errors.push("rpg-ui-v2.js no compila: "+error.message); }
try{ new Function(saveSlots); }catch(error){ errors.push("save-slots-v2.js no compila: "+error.message); }

for(const required of [
  "./save-slots-v2.js",
  "./rpg-ui-v2.js",
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
console.log("Battlegrafía 2.0 correcta: RPG pixel UI, tres ranuras seguras, 5 mundos, 30 sprites, guardado aislado y modo de prueba directa.");
