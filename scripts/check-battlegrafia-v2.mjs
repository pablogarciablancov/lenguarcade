import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const v2Root=path.join(root,"games","battlegrafia_v2");
const index=fs.readFileSync(path.join(v2Root,"index.html"),"utf8");
const theme=fs.readFileSync(path.join(v2Root,"theme-v2.css"),"utf8");
const enhance=fs.readFileSync(path.join(v2Root,"enhance-v2.js"),"utf8");
const classic=fs.readFileSync(path.join(root,"games","battlegrafia","index.html"),"utf8");
const code=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Code.gs"),"utf8");
const student=fs.readFileSync(path.join(root,"apps-script","LenguArcade_Alumno.html"),"utf8");
const dashboard=fs.readFileSync(path.join(root,"supabase","functions","student-dashboard","index.ts"),"utf8");
const migration=fs.readFileSync(path.join(root,"supabase","migrations","20260905144700_battlegrafia_v2.sql"),"utf8");

const errors=[];

try{ new Function(enhance); }catch(error){ errors.push("enhance-v2.js no compila: "+error.message); }

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

if(!code.includes("battlegrafia_v2: {") ||
   !code.includes("gameId:'battlegrafia_v2'") ||
   !code.includes("games/battlegrafia_v2/")){
  errors.push("Apps Script no registra Battlegrafía 2.0 como juego embebido.");
}
if(!student.includes("battlegrafia_v2:'battlegrafia-banner.jpg'") ||
   !student.includes("battlegrafia_v2:{") ||
   !student.includes("gameId==='battlegrafia'||gameId==='battlegrafia_v2'") ||
   !student.includes("['battlegrafia','battlegrafia_v2'].includes(gameRecord?.gameId)")){
  errors.push("El runner de alumno no trata Battlegrafía 2.0 como versión integrada.");
}
if(!dashboard.includes("battlegrafia_v2:{") || !dashboard.includes("games/battlegrafia_v2/")){
  errors.push("student-dashboard no expone la integración v2.");
}
if(!migration.includes("'battlegrafia_v2'") || !migration.includes("on conflict (id) do update")){
  errors.push("Falta la migración idempotente de Battlegrafía 2.0.");
}

if(errors.length) throw new Error("Comprobaciones de Battlegrafía 2.0 fallidas:\n- "+errors.join("\n- "));
console.log("Battlegrafía 2.0 correcta: 5 mundos, 30 sprites originales, guardado aislado e integración paralela.");
