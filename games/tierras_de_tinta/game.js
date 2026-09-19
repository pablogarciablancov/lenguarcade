(function(){
"use strict";

var C=window.TINTA_CONTENT;
if(!C){throw new Error("No se ha cargado TINTA_CONTENT");}

var STORAGE_KEY="lenguarcade.tierras_de_tinta.v21";
var $=function(id){return document.getElementById(id);};
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v));};
var lerp=function(a,b,t){return a+(b-a)*t;};
var TAU=Math.PI*2;
var state=null;
var currentScreen="title";
var challengeContext=null;
var game=null;
var loopId=0;
var lastTime=performance.now();
var toastTimer=0;

var els={
  title:$("titleScreen"),camp:$("campScreen"),game:$("gameScreen"),
  continueBtn:$("continueBtn"),newGameBtn:$("newGameBtn"),titleSaveSummary:$("titleSaveSummary"),
  gold:$("goldValue"),ink:$("inkValue"),seals:$("sealValue"),level:$("levelValue"),
  heroPortrait:$("heroPortrait"),heroClass:$("heroClass"),heroName:$("heroName"),heroTrait:$("heroTrait"),
  heroHpBar:$("heroHpBar"),heroHpText:$("heroHpText"),heroXpBar:$("heroXpBar"),heroXpText:$("heroXpText"),
  weaponName:$("equippedWeaponName"),weaponDesc:$("equippedWeaponDesc"),
  regionMiniCanvas:$("regionMiniCanvas"),regionArea:$("regionArea"),regionName:$("regionName"),
  regionDescription:$("regionDescription"),regionBoss:$("regionBoss"),regionTabs:$("regionTabs"),
  difficultyTabs:$("difficultyTabs"),rewardMultiplier:$("rewardMultiplier"),regionMastery:$("regionMastery"),
  regionMasteryBar:$("regionMasteryBar"),regionObjective:$("regionObjective"),
  orderTitle:$("orderTitle"),orderText:$("orderText"),orderProgress:$("orderProgress"),
  modalBackdrop:$("modalBackdrop"),genericModal:$("genericModal"),genericModalBody:$("genericModalBody"),
  challengeModal:$("challengeModal"),pauseModal:$("pauseModal"),toast:$("toast"),
  gameCanvas:$("gameCanvas"),miniMapCanvas:$("miniMapCanvas")
};

function defaultState(){
  var rm={};C.regions.forEach(function(r){rm[r.id]=0;});
  var mastery={ortografia:0,acentuacion:0,morfologia:0,verbos:0,semantica:0,literatura:0,comprension:0};
  var weaponLevels={};C.weapons.forEach(function(w){weaponLevels[w.id]=1;});
  return {
    version:C.version,
    heroId:"aldren",
    regionId:"bosque",
    difficultyId:"guardian",
    equippedWeaponId:"grafito",
    secondaryWeaponId:"arco",
    ownedWeapons:["grafito","arco","baston","dagas"],
    weaponLevels:weaponLevels,
    level:1,xp:0,gold:90,ink:25,seals:0,victories:0,
    regionMastery:rm,mastery:mastery,
    resources:{wood:8,ore:5,fragments:6},
    errors:{},cleanAnswers:0,totalAnswers:0,
    questionCursor:{},lastQuestion:{},
    unlockedRegionLevel:7,
    orderId:"clean3",orderProgress:0,
    totalKills:0,chestsOpened:0,bossesDefeated:0,
    lastPlayed:Date.now()
  };
}

function safeObjectMerge(base,saved){
  if(!saved||typeof saved!=="object")return base;
  Object.keys(base).forEach(function(k){
    if(saved[k]!==undefined){
      if(base[k]&&typeof base[k]==="object"&&!Array.isArray(base[k])&&saved[k]&&typeof saved[k]==="object"&&!Array.isArray(saved[k])){
        base[k]=Object.assign({},base[k],saved[k]);
      }else{
        base[k]=saved[k];
      }
    }
  });
  base.version=C.version;
  return base;
}

function loadState(){
  try{
    var raw=localStorage.getItem(STORAGE_KEY);
    if(!raw)return null;
    return safeObjectMerge(defaultState(),JSON.parse(raw));
  }catch(err){
    console.warn("No se pudo cargar Tierras de tinta",err);
    return null;
  }
}

function saveState(reason){
  if(!state)return;
  state.lastPlayed=Date.now();
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(err){console.warn("No se pudo guardar",err);}
  emitProgress(reason||"autosave");
}

function serializeRun(){\n  if(!game)return null;\n  return {\n    heroId:game.hero.id,regionId:game.region.id,difficultyId:game.diff.id,\n    equippedWeaponId:state.equippedWeaponId,secondaryWeaponId:state.secondaryWeaponId,\n    hp:Math.max(1,game.player.hp),x:game.player.x,y:game.player.y,\n    carried:Object.assign({},game.carried),kills:game.kills,runKills:game.runKills,\n    giantStarted:game.giantStarted,bossSpawned:game.bossSpawned,\n    bossHp:game.boss&&!game.boss.dead?game.boss.hp:null,bossShieldIndex:game.bossShieldIndex,\n    savedAt:Date.now()\n  };\n}\n\nfunction emitProgress(reason){
  try{
    if(window.parent&&window.parent!==window){
      window.parent.postMessage({
        type:"lenguarcade:game-progress",
        gameId:"tierras_de_tinta",
        reason:reason,
        progress:{
          level:state.level,
          xp:state.xp,
          mastery:state.mastery,
          regionMastery:state.regionMastery,
          bossesDefeated:state.bossesDefeated,
          victories:state.victories
        }
      },"*");
    }
  }catch(err){}
}

function showScreen(name){
  currentScreen=name;
  els.title.classList.toggle("hidden",name!=="title");
  els.camp.classList.toggle("hidden",name!=="camp");
  els.game.classList.toggle("hidden",name!=="game");
  if(name==="camp")renderCamp();
  if(name==="game")resizeGameCanvas();
}

function fmtDate(ms){
  try{return new Intl.DateTimeFormat("es-ES",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(ms));}
  catch(err){return "";}
}

function renderTitle(){
  var saved=loadState();
  var has=!!saved;
  els.continueBtn.classList.toggle("hidden",!has);
  els.titleSaveSummary.classList.toggle("hidden",!has);
  if(has){
    var r=findRegion(saved.regionId);
    var w=findWeapon(saved.equippedWeaponId);
    els.titleSaveSummary.textContent="Partida guardada · "+r.name+" · Nivel "+saved.level+" · "+w.name+" · "+fmtDate(saved.lastPlayed);
  }
}

function newGame(){
  state=defaultState();
  saveState("new_game");
  showScreen("camp");
  toast("Nueva crónica iniciada");
}

function continueGame(){
  state=loadState()||defaultState();
  showScreen("camp");
}

function findHero(id){return C.heroes.find(function(x){return x.id===id;})||C.heroes[0];}
function findRegion(id){return C.regions.find(function(x){return x.id===id;})||C.regions[0];}
function findDifficulty(id){return C.difficulties.find(function(x){return x.id===id;})||C.difficulties[1];}
function findWeapon(id){return C.weapons.find(function(x){return x.id===id;})||C.weapons[0];}
function currentOrder(){return C.orders.find(function(x){return x.id===state.orderId;})||C.orders[0];}

function heroSvg(hero,compact){
  var h=compact?88:150;
  return '<svg class="pixel-hero-svg" viewBox="0 0 160 '+h+'" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'+
    '<defs><linearGradient id="g-'+hero.id+'" x1="0" y1="0" x2="0" y2="1"><stop stop-color="'+hero.accent+'"/><stop offset="1" stop-color="'+hero.cloth+'"/></linearGradient></defs>'+
    '<ellipse cx="80" cy="'+(h-8)+'" rx="48" ry="8" fill="rgba(0,0,0,.26)"/>'+
    '<path class="outline" d="M48 '+(h-13)+' L58 61 Q80 47 102 61 L113 '+(h-13)+' Z" fill="url(#g-'+hero.id+')"/>'+
    '<path class="outline" d="M58 70 L37 '+(h-28)+' L47 '+(h-22)+' L69 82 Z" fill="'+hero.cloth+'"/>'+
    '<path class="outline" d="M101 70 L126 '+(h-30)+' L116 '+(h-20)+' L90 82 Z" fill="'+hero.cloth+'"/>'+
    '<circle class="outline" cx="80" cy="42" r="24" fill="#d5a77f"/>'+
    '<path class="outline" d="M56 40 Q60 9 83 14 Q108 18 103 43 Q88 29 58 39" fill="'+hero.hair+'"/>'+
    '<path d="M68 44 h8 M88 44 h8" stroke="#1b1716" stroke-width="4" stroke-linecap="round"/>'+
    '<path d="M76 56 Q81 60 87 56" fill="none" stroke="#7d4c3b" stroke-width="3" stroke-linecap="round"/>'+
    '<path d="M104 75 L134 48" stroke="'+hero.accent+'" stroke-width="7" stroke-linecap="round"/>'+
    '<path d="M132 48 l12 -10 l-5 15 z" fill="'+hero.accent+'"/>'+
    '</svg>';
}

function renderCamp(){
  var hero=findHero(state.heroId),region=findRegion(state.regionId),weapon=findWeapon(state.equippedWeaponId);
  var diff=findDifficulty(state.difficultyId),order=currentOrder();
  els.gold.textContent=Math.floor(state.gold);
  els.ink.textContent=Math.floor(state.ink);
  els.seals.textContent=Math.floor(state.seals);
  els.level.textContent=state.level;
  els.heroPortrait.innerHTML=heroSvg(hero,false);
  els.heroClass.textContent=hero.className+" · "+hero.role;
  els.heroName.textContent=hero.name;
  els.heroTrait.textContent=hero.trait;
  els.heroHpBar.style.width="100%";
  els.heroHpText.textContent=hero.hp+" PV";
  var needed=xpNeeded(state.level);
  els.heroXpBar.style.width=clamp(state.xp/needed*100,0,100)+"%";
  els.heroXpText.textContent=Math.floor(state.xp)+" / "+needed;
  els.weaponName.textContent=weapon.name+" +"+state.weaponLevels[weapon.id];
  els.weaponDesc.textContent=weapon.desc+" · "+weapon.rarity;
  els.regionArea.textContent=region.area.toUpperCase();
  els.regionName.textContent=region.name;
  els.regionDescription.textContent=region.description;
  els.regionBoss.textContent=region.boss;
  els.regionObjective.textContent=region.objective;
  var mastery=state.regionMastery[region.id]||0;
  els.regionMastery.textContent=Math.round(mastery)+" %";
  els.regionMasteryBar.style.width=clamp(mastery,0,100)+"%";
  els.rewardMultiplier.textContent="×"+diff.reward.toFixed(2);
  els.orderTitle.textContent=order.title;
  els.orderText.textContent=order.text;
  els.orderProgress.textContent=Math.min(state.orderProgress,order.target)+" / "+order.target;
  renderRegionTabs();
  renderDifficultyTabs();
  drawRegionPreview(region);
}

function renderRegionTabs(){
  els.regionTabs.innerHTML="";
  C.regions.forEach(function(r,i){
    var b=document.createElement("button");
    b.type="button";
    b.className="region-tab"+(r.id===state.regionId?" active":"")+(r.level>state.unlockedRegionLevel?" locked":"");
    b.disabled=r.level>state.unlockedRegionLevel;
    b.setAttribute("aria-label",r.name);
    b.innerHTML="<b>"+(i+1)+"</b><span>"+r.short+"</span>";
    b.addEventListener("click",function(){state.regionId=r.id;saveState("select_region");renderCamp();});
    els.regionTabs.appendChild(b);
  });
}

function renderDifficultyTabs(){
  els.difficultyTabs.innerHTML="";
  C.difficulties.forEach(function(d){
    var b=document.createElement("button");
    b.type="button";b.className="difficulty-btn"+(d.id===state.difficultyId?" active":"");
    b.textContent=d.name;
    b.addEventListener("click",function(){state.difficultyId=d.id;saveState("select_difficulty");renderCamp();});
    els.difficultyTabs.appendChild(b);
  });
}

function drawRegionPreview(region){
  var c=els.regionMiniCanvas,ctx=c.getContext("2d"),w=c.width,h=c.height;
  ctx.clearRect(0,0,w,h);
  var g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,region.colors[0]);g.addColorStop(1,region.ground);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.globalAlpha=.32;ctx.fillStyle=region.colors[2];
  for(var i=0;i<18;i++){
    var x=(i*97+31)%w,y=(i*53+47)%h,r=8+(i%5)*5;
    ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();
  }
  ctx.globalAlpha=1;
  ctx.fillStyle=region.colors[1];ctx.beginPath();ctx.moveTo(0,h*.72);ctx.quadraticCurveTo(w*.24,h*.45,w*.45,h*.7);ctx.quadraticCurveTo(w*.72,h*.95,w,h*.58);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();
  ctx.strokeStyle=region.accent;ctx.lineWidth=3;ctx.globalAlpha=.45;ctx.beginPath();ctx.moveTo(0,h*.78);ctx.bezierCurveTo(w*.22,h*.5,w*.58,h*.92,w,h*.63);ctx.stroke();ctx.globalAlpha=1;
  for(var j=0;j<7;j++){
    var px=26+j*61,py=48+(j%3)*21;
    ctx.fillStyle=j%2?region.colors[3]:region.colors[2];ctx.fillRect(px,py,5,32);
    ctx.beginPath();ctx.arc(px+2,py,12+(j%2)*5,0,TAU);ctx.fill();
  }
  ctx.fillStyle="rgba(4,12,15,.55)";ctx.fillRect(w-112,15,94,38);
  ctx.fillStyle=region.accent;ctx.font="bold 12px sans-serif";ctx.fillText("JEFE",w-101,31);
  ctx.fillStyle="#f0e2c5";ctx.font="bold 9px sans-serif";ctx.fillText(region.boss.slice(0,18),w-101,45);
}

function openHeroPicker(){
  var html='<span class="eyebrow">HÉROES DEL CAMPAMENTO</span><h2>Elige guardián</h2><p style="font-size:10px;color:#9eb0aa">Todos son humanos y modifican de verdad la forma de combatir.</p><div class="choice-grid">';
  C.heroes.forEach(function(h){
    html+='<button class="choice-card'+(h.id===state.heroId?' active':'')+'" data-hero="'+h.id+'" type="button"><div class="choice-art">'+heroSvg(h,true)+'</div><strong>'+h.name+' · '+h.className+'</strong><small>'+h.trait+'</small><div class="stat-pills"><span>PV '+h.hp+'</span><span>VEL '+h.speed+'</span><span>'+h.role+'</span></div></button>';
  });
  html+="</div>";
  openGeneric(html);
  els.genericModalBody.querySelectorAll("[data-hero]").forEach(function(b){
    b.addEventListener("click",function(){state.heroId=b.getAttribute("data-hero");saveState("select_hero");closeGeneric();renderCamp();});
  });
}

function openWeaponPicker(){
  var html='<span class="eyebrow">ARSENAL</span><h2>Armas del guardián</h2><div class="choice-grid">';
  C.weapons.forEach(function(w){
    var owned=state.ownedWeapons.indexOf(w.id)!==-1;
    html+='<button class="choice-card'+(w.id===state.equippedWeaponId?' active':'')+'" data-weapon="'+w.id+'" type="button" '+(owned?'':'disabled')+'><div class="choice-art">'+weaponSvg(w)+'</div><strong>'+w.name+(owned?' +'+state.weaponLevels[w.id]:' · BLOQUEADA')+'</strong><small>'+w.desc+'<br>'+w.effect+'</small><div class="stat-pills"><span>Daño '+w.damage+'</span><span>'+w.rarity+'</span></div></button>';
  });
  html+="</div>";
  openGeneric(html);
  els.genericModalBody.querySelectorAll("[data-weapon]").forEach(function(b){
    b.addEventListener("click",function(){
      if(b.disabled)return;
      var id=b.getAttribute("data-weapon");
      if(id!==state.equippedWeaponId){state.secondaryWeaponId=state.equippedWeaponId;state.equippedWeaponId=id;}
      saveState("equip_weapon");closeGeneric();renderCamp();
    });
  });
}

function weaponSvg(w){
  var color=w.rarity==="Legendaria"?"#d36d8b":w.rarity==="Épico"?"#9e83dc":w.rarity==="Raro"?"#6abfc4":w.rarity==="Poco común"?"#7ab77b":"#b6b19e";
  var shape="";
  if(w.mode==="ranged"||w.mode==="pierce")shape='<path d="M46 22 Q86 48 46 78" fill="none" stroke="'+color+'" stroke-width="7"/><path d="M48 22 L48 78 M34 50 L100 50" stroke="#e8d59a" stroke-width="3"/>';
  else if(w.mode==="orb"||w.mode==="beam"||w.mode==="ink")shape='<path d="M34 82 L82 30" stroke="#aa8452" stroke-width="9" stroke-linecap="round"/><circle cx="86" cy="26" r="17" fill="'+color+'" stroke="#e7d8a6" stroke-width="3"/>';
  else shape='<path d="M30 82 L78 34" stroke="#8d6747" stroke-width="8" stroke-linecap="round"/><path d="M72 40 L100 12 L106 19 L79 48 Z" fill="'+color+'" stroke="#e7d8a6" stroke-width="2"/><path d="M53 57 L71 75" stroke="#d0a96b" stroke-width="7"/>';
  return '<svg viewBox="0 0 130 92" xmlns="http://www.w3.org/2000/svg"><rect width="130" height="92" rx="10" fill="#0a171c"/><circle cx="96" cy="68" r="22" fill="'+color+'" opacity=".12"/>'+shape+'</svg>';
}

function openFacility(type){
  if(type==="forge")openForge();
  else if(type==="archive")openArchive();
  else if(type==="storage")openStorage();
  else openPortal();
}

function openForge(){
  var w=findWeapon(state.equippedWeaponId),lvl=state.weaponLevels[w.id]||1;
  var cost=25+lvl*20,ore=Math.max(1,lvl);
  var html='<span class="eyebrow">FORJA</span><h2>Templa tu equipo</h2>'+
    '<div class="forge-item"><div><strong>'+w.name+' +'+lvl+'</strong><small>'+w.effect+'</small></div><span class="weapon-badge">'+w.rarity+'</span></div>'+
    '<div class="facility-modal-grid"><div class="info-card"><strong>Próxima mejora</strong><p>Daño +12 % y mejor respuesta del efecto propio del arma.</p><div class="stat-pills"><span>'+cost+' oro</span><span>'+ore+' mineral</span></div></div>'+
    '<div class="info-card"><strong>Forja lingüística</strong><p>Para completar la mejora debes superar un desafío. Con pista, la mejora se aplica pero sin bonificación de calidad.</p></div></div>'+
    '<button id="forgeUpgradeBtn" class="primary-btn" style="margin-top:12px" type="button">FORJAR +'+(lvl+1)+'</button>';
  openGeneric(html);
  $("forgeUpgradeBtn").addEventListener("click",function(){
    if(state.gold<cost||state.resources.ore<ore){toast("No tienes suficientes recursos");return;}
    closeGeneric();
    openChallenge(selectChallengeArea(findRegion(state.regionId)),"forge",function(result){
      if(result.correct){
        state.gold-=cost;state.resources.ore-=ore;state.weaponLevels[w.id]=lvl+1;
        if(result.clean)state.ink+=2;
        saveState("forge_upgrade");toast(w.name+" mejorada a +"+(lvl+1));renderCamp();
      }else{toast("La forja queda pendiente: conserva tus materiales");}
    });
  });
}

function openArchive(){
  var html='<span class="eyebrow">ARCHIVO DE APRENDIZAJE</span><h2>Crónica lingüística</h2><div class="mastery-list">';
  Object.keys(state.mastery).forEach(function(k){
    var label=areaLabel(k),v=Math.round(state.mastery[k]||0);
    html+='<div class="mastery-row"><span>'+label+'<div class="mastery-track" style="margin-top:4px"><i style="width:'+v+'%"></i></div></span><strong>'+v+' %</strong></div>';
  });
  html+='</div><div class="info-card" style="margin-top:10px"><strong>Banco activo</strong><p>'+C.questionSpace.total.toLocaleString("es-ES")+' combinaciones deterministas · sin generación mediante IA · repetición inmediata bloqueada.</p></div>';
  openGeneric(html);
}

function openStorage(){
  var html='<span class="eyebrow">ALMACÉN</span><h2>Botín asegurado</h2><div class="resource-list">'+
    resourceRow("Madera rúnica",state.resources.wood,"Se obtiene sobre todo en bosques y rutas de exploración.")+
    resourceRow("Mineral purificado",state.resources.ore,"Necesario para templar armas en la forja.")+
    resourceRow("Fragmentos de palabra",state.resources.fragments,"Material de expedición para recetas y desbloqueos.")+
    resourceRow("Tinta esencial",state.ink,"Recurso permanente ligado al dominio lingüístico.")+
    '</div>';
  openGeneric(html);
}
function resourceRow(name,value,desc){return '<div class="resource-row"><span><strong>'+name+'</strong><small style="display:block;color:#8fa29b;margin-top:2px">'+desc+'</small></span><strong>'+Math.floor(value)+'</strong></div>';}

function openPortal(){
  var r=findRegion(state.regionId),d=findDifficulty(state.difficultyId),w=findWeapon(state.equippedWeaponId);
  var html='<span class="eyebrow">PORTAL DE EXPEDICIONES</span><h2>'+r.name+'</h2>'+
    '<div class="facility-modal-grid"><div class="info-card"><strong>Objetivo</strong><p>'+r.objective+'</p></div><div class="info-card"><strong>Preparación</strong><p>'+findHero(state.heroId).name+' · '+w.name+' +'+state.weaponLevels[w.id]+' · '+d.name+'</p></div></div>'+
    '<button id="portalStartBtn" class="primary-btn" style="margin-top:12px" type="button">CRUZAR EL PORTAL</button>';
  openGeneric(html);
  $("portalStartBtn").addEventListener("click",function(){closeGeneric();startExpedition();});
}

function areaLabel(a){
  return {ortografia:"Ortografía",acentuacion:"Acentuación",morfologia:"Morfología",verbos:"Verbos",semantica:"Semántica",literatura:"Literatura",comprension:"Comprensión"}[a]||a;
}

function openGeneric(html){
  els.genericModalBody.innerHTML=html;
  els.modalBackdrop.classList.remove("hidden");
  els.genericModal.classList.remove("hidden");
  els.challengeModal.classList.add("hidden");
  els.pauseModal.classList.add("hidden");
  if(game)game.paused=true;
}

function closeGeneric(){
  els.genericModal.classList.add("hidden");
  if(els.challengeModal.classList.contains("hidden")&&els.pauseModal.classList.contains("hidden"))els.modalBackdrop.classList.add("hidden");
  if(game&&currentScreen==="game")game.paused=false;
}

function toast(msg){
  clearTimeout(toastTimer);
  els.toast.textContent=msg;els.toast.classList.remove("hidden");
  toastTimer=setTimeout(function(){els.toast.classList.add("hidden");},2200);
}

function xpNeeded(level){return 100+(level-1)*45;}
function gainXp(amount){
  state.xp+=amount;
  var leveled=false;
  while(state.xp>=xpNeeded(state.level)){
    state.xp-=xpNeeded(state.level);state.level++;state.gold+=20;state.ink+=4;leveled=true;
  }
  if(leveled)toast("Nivel "+state.level+" alcanzado · +20 oro · +4 tinta");
}

function updateOrder(type,amount){
  var o=currentOrder();
  if(o.type!==type)return;
  state.orderProgress+=amount||1;
  if(state.orderProgress>=o.target){
    state.gold+=40;state.seals+=1;state.orderProgress=0;
    var idx=C.orders.findIndex(function(x){return x.id===o.id;});
    state.orderId=C.orders[(idx+1)%C.orders.length].id;
    toast("Encargo completado · +40 oro · +1 sello");
  }
}

function selectChallengeArea(region){
  var list=region.skills&&region.skills.length?region.skills:["ortografia"];
  var available=list.filter(function(a){return C.questionBanks[a]&&C.questionBanks[a].length;});
  if(!available.length)available=["ortografia"];
  var n=(state.totalAnswers+state.totalKills+state.chestsOpened)%available.length;
  return available[n];
}

function nextQuestion(area){
  if(!C.questionBanks[area]||!C.questionBanks[area].length)area="ortografia";
  var bank=C.questionBanks[area],cursor=state.questionCursor[area]||0;
  var idx=cursor%bank.length;
  if(state.lastQuestion[area]===idx&&bank.length>1)idx=(idx+1)%bank.length;
  state.questionCursor[area]=(idx+1)%bank.length;
  state.lastQuestion[area]=idx;
  return {area:area,item:bank[idx]};
}

function openChallenge(area,source,onResolve){
  var q=nextQuestion(area),item=q.item;
  challengeContext={area:q.area,item:item,source:source,onResolve:onResolve,attempts:0,usedHint:false,done:false};
  game&& (game.paused=true);
  $("challengeArea").textContent=areaLabel(q.area).toUpperCase();
  $("challengeTitle").textContent=source==="boss"?"Rompe el sello del jefe":source==="forge"?"Templa la palabra":"Descifra el sello";
  $("challengeReward").textContent=source==="boss"?"ESCUDO DEL JEFE":source==="forge"?"CALIDAD DE FORJA":"BOTÍN COMPLETO";
  $("challengePrompt").textContent=item.q;
  $("challengeFeedback").classList.add("hidden");
  $("challengeFeedback").innerHTML="";
  $("challengeHintBtn").classList.remove("hidden");
  $("challengeContinueBtn").classList.add("hidden");
  var opts=$("challengeOptions");opts.innerHTML="";
  item.o.forEach(function(opt){
    var b=document.createElement("button");b.type="button";b.className="challenge-option";b.textContent=opt;
    b.addEventListener("click",function(){answerChallenge(opt,b);});
    opts.appendChild(b);
  });
  els.modalBackdrop.classList.remove("hidden");els.genericModal.classList.add("hidden");els.pauseModal.classList.add("hidden");els.challengeModal.classList.remove("hidden");
}

function answerChallenge(answer,button){
  var cc=challengeContext;if(!cc||cc.done)return;
  cc.attempts++;state.totalAnswers++;
  var correct=answer===cc.item.a;
  var fb=$("challengeFeedback");fb.classList.remove("hidden");
  if(correct){
    button.classList.add("correct");cc.done=true;
    var clean=cc.attempts===1&&!cc.usedHint;
    var add=clean?4:cc.usedHint?2:1.5;
    state.mastery[cc.area]=clamp((state.mastery[cc.area]||0)+add,0,100);
    if(clean){state.cleanAnswers++;updateOrder("clean",1);}
    fb.innerHTML="<strong>Correcto.</strong> "+cc.item.e;
    $("challengeReward").textContent=clean?"RECOMPENSA COMPLETA":"RECOMPENSA PARCIAL";
    $("challengeHintBtn").classList.add("hidden");$("challengeContinueBtn").classList.remove("hidden");
    saveState("challenge_correct");
  }else{
    button.classList.add("wrong");button.disabled=true;
    state.mastery[cc.area]=clamp((state.mastery[cc.area]||0)-.6,0,100);
    state.errors[cc.area]=(state.errors[cc.area]||0)+1;
    if(cc.attempts<2){
      fb.innerHTML="<strong>Todavía no.</strong> "+cc.item.e+" Tienes un segundo intento.";
      $("challengeReward").textContent="RECOMPENSA REDUCIDA";
    }else{
      cc.done=true;
      Array.prototype.forEach.call($("challengeOptions").children,function(b){if(b.textContent===cc.item.a)b.classList.add("correct");b.disabled=true;});
      fb.innerHTML="<strong>La respuesta correcta es «"+cc.item.a+"».</strong> "+cc.item.e;
      $("challengeReward").textContent="SIN BONIFICACIÓN";
      $("challengeHintBtn").classList.add("hidden");$("challengeContinueBtn").classList.remove("hidden");
      saveState("challenge_failed");
    }
  }
}

function useHint(){
  var cc=challengeContext;if(!cc||cc.done)return;
  cc.usedHint=true;
  $("challengeReward").textContent="RECOMPENSA NORMAL";
  var fb=$("challengeFeedback");fb.classList.remove("hidden");fb.innerHTML="<strong>Pista:</strong> "+cc.item.h;
  $("challengeHintBtn").classList.add("hidden");
}

function finishChallenge(){
  var cc=challengeContext;if(!cc||!cc.done)return;
  var correctButton=Array.prototype.some.call($("challengeOptions").children,function(b){return b.classList.contains("correct")&&!b.disabled;});\n  var result={\n    correct:correctButton,\n    clean:cc.attempts===1&&!cc.usedHint,\n    rewardFactor:correctButton?(cc.attempts===1?(cc.usedHint?0.75:1):0.5):0\n  };
  els.challengeModal.classList.add("hidden");els.modalBackdrop.classList.add("hidden");
  var cb=cc.onResolve;challengeContext=null;
  if(game&&currentScreen==="game")game.paused=false;
  if(typeof cb==="function")cb(result);
}

function startExpedition(snapshot){\n  closeGeneric();\n  var snap=snapshot||null;\n  if(snap){\n    state.heroId=snap.heroId||state.heroId;state.regionId=snap.regionId||state.regionId;state.difficultyId=snap.difficultyId||state.difficultyId;\n    state.equippedWeaponId=snap.equippedWeaponId||state.equippedWeaponId;state.secondaryWeaponId=snap.secondaryWeaponId||state.secondaryWeaponId;\n  }\n  var hero=findHero(state.heroId),region=findRegion(state.regionId),diff=findDifficulty(state.difficultyId);\n  game=createGameState(hero,region,diff);\n  showScreen("game");\n  resizeGameCanvas();\n  if(snap){\n    game.player.hp=clamp(Number(snap.hp)||hero.hp,1,hero.hp);\n    game.player.x=clamp(Number(snap.x)||game.player.x,25,els.gameCanvas.clientWidth-25);\n    game.player.y=clamp(Number(snap.y)||game.player.y,65,els.gameCanvas.clientHeight-30);\n    game.carried=Object.assign({wood:0,ore:0,fragments:0},snap.carried||{});\n    game.kills=Math.max(0,Number(snap.kills)||0);game.runKills=Math.max(0,Number(snap.runKills)||game.kills);\n    game.giantStarted=!!snap.giantStarted;game.bossShieldIndex=Math.max(0,Number(snap.bossShieldIndex)||0);\n    if(snap.bossSpawned){spawnBoss();if(game.boss&&snap.bossHp!=null)game.boss.hp=clamp(Number(snap.bossHp)||game.boss.maxHp,1,game.boss.maxHp);}\n    else{for(var i=0;i<(game.giantStarted?6:5);i++)spawnEnemy(game.giantStarted);}\n  }else{\n    state.activeRun=null;spawnInitialEnemies();\n  }\n  updateGameHud();\n  notice(snap?"EXPEDICIÓN RECUPERADA":region.name,1400);\n  lastTime=performance.now();\n  if(loopId)cancelAnimationFrame(loopId);\n  loopId=requestAnimationFrame(loop);\n}

function createGameState(hero,region,diff){
  var w=window.innerWidth,h=window.innerHeight;
  return {
    hero:hero,region:region,diff:diff,paused:false,ended:false,
    player:{x:w*.5,y:h*.56,r:17,hp:hero.hp,maxHp:hero.hp,speed:hero.speed,invuln:0,attackCd:0,dodgeCd:0,abilityCd:0,buff:0,flash:0,facing:0},
    enemies:[],projectiles:[],enemyProjectiles:[],particles:[],slashes:[],zones:[],chests:[],props:[],
    carried:{wood:0,ore:0,fragments:0},
    kills:0,runKills:0,phase:"normal",giantStarted:false,bossSpawned:false,boss:null,
    bossShieldIndex:0,runStart:Date.now(),lastSpawn:0,lastEnemyShot:0,
    mouse:{x:w*.68,y:h*.5},keys:{},pointerDown:false,attackCounter:0,
    cameraShake:0,touchVector:{x:0,y:0}
  };
}

function resizeGameCanvas(){
  if(!els.gameCanvas)return;
  var dpr=Math.min(window.devicePixelRatio||1,2),rect=els.gameCanvas.getBoundingClientRect();
  els.gameCanvas.width=Math.max(1,Math.floor(rect.width*dpr));els.gameCanvas.height=Math.max(1,Math.floor(rect.height*dpr));
  var ctx=els.gameCanvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
  var mc=els.miniMapCanvas,mdpr=Math.min(window.devicePixelRatio||1,2),mr=mc.getBoundingClientRect();
  mc.width=Math.max(1,Math.floor(mr.width*mdpr));mc.height=Math.max(1,Math.floor(mr.height*mdpr));
  mc.getContext("2d").setTransform(mdpr,0,0,mdpr,0,0);
  if(game){
    var w=rect.width,h=rect.height;game.player.x=clamp(game.player.x,30,w-30);game.player.y=clamp(game.player.y,50,h-35);
    buildProps();
  }
}

function buildProps(){
  if(!game)return;
  var w=els.gameCanvas.clientWidth,h=els.gameCanvas.clientHeight,arr=[];
  for(var i=0;i<38;i++){
    var x=20+((i*137+53)%Math.max(80,w-40)),y=60+((i*83+97)%Math.max(100,h-110));
    if(Math.hypot(x-game.player.x,y-game.player.y)<90)continue;
    arr.push({x:x,y:y,size:7+(i%5)*3,type:i%3});
  }
  game.props=arr;
}

function spawnInitialEnemies(){for(var i=0;i<5;i++)spawnEnemy(false);buildProps();}

function spawnEnemy(elite){
  if(!game||game.ended)return;
  var w=els.gameCanvas.clientWidth,h=els.gameCanvas.clientHeight,edge=Math.floor(Math.random()*4),x,y,pad=35;
  if(edge===0){x=pad;y=70+Math.random()*(h-120);}
  else if(edge===1){x=w-pad;y=70+Math.random()*(h-120);}
  else if(edge===2){x=40+Math.random()*(w-80);y=70;}
  else{x=40+Math.random()*(w-80);y=h-pad;}
  var types=["melee","shooter","swarm","tank"],type=types[(game.enemies.length+game.kills+game.region.level)%types.length];
  if(game.region.id==="marisma"&&Math.random()<.3)type="swarm";
  if(game.region.id==="ruinas"&&Math.random()<.35)type="shooter";
  var baseHp={melee:42,shooter:34,swarm:24,tank:78}[type]*(elite?1.65:1)*game.diff.enemyHp;
  game.enemies.push({id:Math.random().toString(36).slice(2),x:x,y:y,r:elite?22:type==="tank"?20:type==="swarm"?11:15,hp:baseHp,maxHp:baseHp,type:type,speed:(type==="swarm"?105:type==="tank"?50:type==="shooter"?65:78)*(elite?1.12:1),damage:(type==="tank"?18:type==="swarm"?7:11)*game.diff.enemyDamage,hitCd:0,shotCd:1+Math.random(),flash:0,elite:elite,slow:0,boss:false,dead:false});
}

function spawnBoss(){
  if(game.bossSpawned)return;
  game.bossSpawned=true;game.phase="boss";
  var w=els.gameCanvas.clientWidth,h=els.gameCanvas.clientHeight;
  var hp=(480+game.region.level*95)*game.diff.enemyHp;
  var b={id:"boss",x:w*.5,y:95,r:38,hp:hp,maxHp:hp,type:game.region.bossType,speed:58+game.region.level*2,damage:(20+game.region.level*2)*game.diff.enemyDamage,hitCd:0,shotCd:.8,flash:0,elite:true,boss:true,dead:false,phaseClock:0,shielded:false};
  game.enemies.push(b);game.boss=b;notice("JEFE · "+game.region.boss,1900);updateGameHud();
}

function spawnChest(){
  var w=els.gameCanvas.clientWidth,h=els.gameCanvas.clientHeight;
  var x=80+Math.random()*(w-160),y=110+Math.random()*(h-190);
  game.chests.push({x:x,y:y,r:18,opened:false,pulse:0});
  toast("Ha aparecido un cofre sellado");
}

function progressSpawns(){
  if(game.bossSpawned)return;
  if(game.kills>=20){spawnBoss();return;}
  if(game.kills>=12&&!game.giantStarted){
    game.giantStarted=true;game.phase="giant";notice("OLEADA DE TINTA · RESISTE",1800);
    for(var j=0;j<8;j++)setTimeout(function(){if(game&&!game.ended)spawnEnemy(true);},j*170);
    return;
  }
  if(!game.giantStarted&&game.enemies.filter(function(e){return !e.dead;}).length<5)spawnEnemy(false);
}

function loop(now){
  if(!game||currentScreen!=="game")return;
  var dt=Math.min(.034,(now-lastTime)/1000||.016);lastTime=now;
  if(!game.paused&&!game.ended)updateGame(dt);
  renderGame();
  loopId=requestAnimationFrame(loop);
}

function updateGame(dt){
  var p=game.player,w=els.gameCanvas.clientWidth,h=els.gameCanvas.clientHeight;
  p.invuln=Math.max(0,p.invuln-dt);p.attackCd=Math.max(0,p.attackCd-dt);p.dodgeCd=Math.max(0,p.dodgeCd-dt);p.abilityCd=Math.max(0,p.abilityCd-dt);p.buff=Math.max(0,p.buff-dt);p.flash=Math.max(0,p.flash-dt);
  var dx=0,dy=0,k=game.keys;
  if(k["KeyA"]||k["ArrowLeft"])dx--;if(k["KeyD"]||k["ArrowRight"])dx++;if(k["KeyW"]||k["ArrowUp"])dy--;if(k["KeyS"]||k["ArrowDown"])dy++;
  dx+=game.touchVector.x;dy+=game.touchVector.y;
  var len=Math.hypot(dx,dy);if(len>0){dx/=len;dy/=len;}
  var speed=p.speed*(p.buff>0?1.18:1);
  p.x=clamp(p.x+dx*speed*dt,22,w-22);p.y=clamp(p.y+dy*speed*dt,64,h-28);
  p.facing=Math.atan2(game.mouse.y-p.y,game.mouse.x-p.x);
  if(game.pointerDown&&p.attackCd<=0)attack();
  updateEnemies(dt);updateProjectiles(dt);updateEffects(dt);updateChests(dt);progressSpawns();updateGameHud();
}

function updateEnemies(dt){
  var p=game.player;
  game.enemies.forEach(function(e){
    if(e.dead)return;
    e.hitCd=Math.max(0,e.hitCd-dt);e.shotCd-=dt;e.flash=Math.max(0,e.flash-dt);e.slow=Math.max(0,e.slow-dt);
    var dx=p.x-e.x,dy=p.y-e.y,dist=Math.max(1,Math.hypot(dx,dy)),nx=dx/dist,ny=dy/dist;
    var sp=e.speed*(e.slow>0?.48:1);
    if(e.boss){updateBoss(e,dt,nx,ny,dist);return;}
    if(e.type==="shooter"){
      if(dist>230){e.x+=nx*sp*dt;e.y+=ny*sp*dt;}else if(dist<155){e.x-=nx*sp*.65*dt;e.y-=ny*sp*.65*dt;}
      if(e.shotCd<=0&&dist<480){spawnEnemyProjectile(e,nx,ny,e.damage*.75);e.shotCd=1.45+Math.random()*.45;}
    }else{
      e.x+=nx*sp*dt;e.y+=ny*sp*dt;
      if(dist<e.r+p.r+5&&e.hitCd<=0){damagePlayer(e.damage,e.x,e.y);e.hitCd=e.type==="swarm"?.75:1.1;}
    }
  });
  game.enemies=game.enemies.filter(function(e){return !e.dead||e.flash>.01;});
}

function updateBoss(e,dt,nx,ny,dist){
  e.phaseClock+=dt;
  if(e.shielded)return;
  var type=e.type;
  if(type==="tank"){
    var boost=(Math.sin(e.phaseClock*1.7)>0.72)?2.3:1;e.x+=nx*e.speed*boost*dt;e.y+=ny*e.speed*boost*dt;
  }else if(type==="shooter"){
    if(dist>260){e.x+=nx*e.speed*.6*dt;e.y+=ny*e.speed*.6*dt;}
    if(e.shotCd<=0){for(var i=-2;i<=2;i++)spawnEnemyProjectile(e,Math.cos(Math.atan2(ny,nx)+i*.18),Math.sin(Math.atan2(ny,nx)+i*.18),e.damage*.7);e.shotCd=1.1;}
  }else if(type==="summoner"){
    e.x+=nx*e.speed*.45*dt;e.y+=ny*e.speed*.45*dt;
    if(e.shotCd<=0){spawnEnemy(true);spawnEnemy(false);e.shotCd=4.3;}
  }else if(type==="dasher"){
    var dash=Math.sin(e.phaseClock*2.2)>0.78?3.1:.65;e.x+=nx*e.speed*dash*dt;e.y+=ny*e.speed*dash*dt;
  }else if(type==="orbit"){
    var a=e.phaseClock*.75;e.x+=Math.cos(a)*e.speed*.38*dt+nx*e.speed*.32*dt;e.y+=Math.sin(a)*e.speed*.38*dt+ny*e.speed*.32*dt;
    if(e.shotCd<=0){radialBossShots(e,8,e.damage*.6);e.shotCd=1.8;}
  }else{
    e.x+=nx*e.speed*.75*dt;e.y+=ny*e.speed*.75*dt;
    if(e.shotCd<=0){radialBossShots(e,6,e.damage*.65);e.shotCd=1.35;}
  }
  if(dist<e.r+game.player.r+7&&e.hitCd<=0){damagePlayer(e.damage,e.x,e.y);e.hitCd=.9;}
}

function radialBossShots(e,count,damage){
  for(var i=0;i<count;i++){var a=i/count*TAU+e.phaseClock*.2;spawnEnemyProjectile(e,Math.cos(a),Math.sin(a),damage);}
}

function spawnEnemyProjectile(e,nx,ny,damage){
  game.enemyProjectiles.push({x:e.x,y:e.y,vx:nx*210,vy:ny*210,r:e.boss?7:5,damage:damage,life:4,color:game.region.accent});
}

function updateProjectiles(dt){
  var p=game.player;
  game.projectiles.forEach(function(pr){
    pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.life-=dt;
    if(pr.dead)return;
    for(var i=0;i<game.enemies.length;i++){
      var e=game.enemies[i];if(e.dead||pr.hit&&pr.hit[e.id])continue;
      if(Math.hypot(pr.x-e.x,pr.y-e.y)<pr.r+e.r){
        damageEnemy(e,pr.damage,pr.x,pr.y,pr.crit);
        pr.hit=pr.hit||{};pr.hit[e.id]=1;
        if(pr.area)areaDamage(pr.x,pr.y,pr.area,pr.damage*.45,e.id);
        if(!pr.pierce){pr.dead=true;break;}else{pr.pierce--;}
      }
    }
  });
  game.enemyProjectiles.forEach(function(pr){
    pr.x+=pr.vx*dt;pr.y+=pr.vy*dt;pr.life-=dt;
    if(!pr.dead&&Math.hypot(pr.x-p.x,pr.y-p.y)<pr.r+p.r){damagePlayer(pr.damage,pr.x,pr.y);pr.dead=true;}
  });
  game.projectiles=game.projectiles.filter(function(x){return x.life>0&&!x.dead;});
  game.enemyProjectiles=game.enemyProjectiles.filter(function(x){return x.life>0&&!x.dead;});
}

function updateEffects(dt){
  game.particles.forEach(function(pt){pt.x+=pt.vx*dt;pt.y+=pt.vy*dt;pt.vx*=.96;pt.vy*=.96;pt.life-=dt;pt.size*=.992;});
  game.particles=game.particles.filter(function(pt){return pt.life>0;});
  game.slashes.forEach(function(s){s.life-=dt;});game.slashes=game.slashes.filter(function(s){return s.life>0;});
  game.zones.forEach(function(z){
    z.life-=dt;z.tick-=dt;
    if(z.tick<=0){z.tick=.35;game.enemies.forEach(function(e){if(!e.dead&&Math.hypot(e.x-z.x,e.y-z.y)<z.r+e.r){damageEnemy(e,z.damage,z.x,z.y,false);e.slow=.5;}});}
  });
  game.zones=game.zones.filter(function(z){return z.life>0;});
}

function updateChests(dt){
  game.chests.forEach(function(c){
    c.pulse+=dt;
    if(!c.opened&&Math.hypot(c.x-game.player.x,c.y-game.player.y)<42){
      c.opened=true;state.chestsOpened++;updateOrder("chests",1);
      game.paused=true;
      openChallenge(selectChallengeArea(game.region),"chest",function(result){
        if(result.correct){
          var f=result.rewardFactor||.5;
          game.carried.fragments+=Math.max(1,Math.round(3*f));
          game.carried.wood+=Math.round((game.region.resources.wood||0)*f);
          game.carried.ore+=Math.round((game.region.resources.ore||0)*f);
          if(result.clean)state.ink+=1;
          particles(c.x,c.y,game.region.accent,22,1.2);toast("Cofre purificado");
        }else{game.carried.fragments+=1;toast("Recuperas solo un fragmento");}
        saveState("open_chest");
      });
    }
  });
}

function attack(){
  if(!game||game.paused||game.ended)return;
  var p=game.player,w=findWeapon(state.equippedWeaponId),lvl=state.weaponLevels[w.id]||1;
  if(p.attackCd>0)return;
  var dmg=w.damage*(1+(lvl-1)*.12)*game.hero.power*(p.buff>0?1.2:1);
  p.attackCd=w.cooldown*(p.buff>0?.84:1);game.attackCounter++;
  var a=p.facing,crit=false;
  if(game.hero.id==="silas"&&game.attackCounter%3===0)crit=Math.random()<.6;
  if(w.mode==="melee"||w.mode==="dual"||w.mode==="shield"||w.mode==="cleave"||w.mode==="slam"){
    var range=w.range+(w.mode==="cleave"?20:0),arc=w.mode==="dual"?.95:w.mode==="slam"?1.35:.75;
    game.slashes.push({x:p.x,y:p.y,a:a,r:range,life:.18,maxLife:.18,color:game.hero.accent,wide:arc});
    var hit=0;
    game.enemies.forEach(function(e){
      if(e.dead)return;
      var dx=e.x-p.x,dy=e.y-p.y,dist=Math.hypot(dx,dy),da=Math.abs(angleDiff(Math.atan2(dy,dx),a));
      if(dist<range+e.r&&da<arc){damageEnemy(e,dmg*(crit?1.65:1),e.x,e.y,crit);hit++;}
    });
    if(w.mode==="slam"){areaDamage(p.x+Math.cos(a)*55,p.y+Math.sin(a)*55,90,dmg*.55,null);game.cameraShake=7;}
    if(hit===0)particles(p.x+Math.cos(a)*range*.55,p.y+Math.sin(a)*range*.55,game.hero.accent,4,.35);
  }else if(w.mode==="beam"){
    fireBeam(a,dmg);
  }else{
    var speed=w.mode==="orb"?330:w.mode==="ink"?390:520;
    var pr={x:p.x+Math.cos(a)*22,y:p.y+Math.sin(a)*22,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:w.mode==="orb"?9:5,damage:dmg*(crit?1.65:1),life:1.7,color:game.hero.accent,pierce:w.mode==="pierce"?2:(w.mode==="ranged"&&game.attackCounter%5===0?2:0),area:w.mode==="orb"?58:0,crit:crit,hit:{}};
    game.projectiles.push(pr);
    if(w.mode==="ink"&&game.enemies.length>1)pr.pierce=1;
  }
  particles(p.x+Math.cos(a)*20,p.y+Math.sin(a)*20,game.hero.accent,5,.3);
}

function fireBeam(a,dmg){
  var p=game.player,max=440,best=null,bestDist=9999;
  game.enemies.forEach(function(e){
    if(e.dead)return;
    var dx=e.x-p.x,dy=e.y-p.y,dist=Math.hypot(dx,dy),da=Math.abs(angleDiff(Math.atan2(dy,dx),a));
    if(dist<max&&da<.12&&dist<bestDist){best=e;bestDist=dist;}
  });
  if(best)damageEnemy(best,dmg,best.x,best.y,false);
  game.slashes.push({x:p.x,y:p.y,a:a,r:max,life:.11,maxLife:.11,color:"#83e0cf",wide:.05,beam:true});
}

function angleDiff(a,b){var d=(a-b+Math.PI)%TAU-Math.PI;return d<-Math.PI?d+TAU:d;}

function damageEnemy(e,amount,x,y,crit){
  if(e.dead||e.shielded)return;
  e.hp-=amount;e.flash=.12;
  floatText(x,y,(crit?"CRÍTICO ":"")+Math.round(amount),crit?"#f1cb67":"#e9e3ce");
  particles(x,y,e.boss?"#d96767":game.region.accent,crit?12:7,.45);
  if(e.boss){
    var ratio=e.hp/e.maxHp;
    var thresholds=[.68,.34];
    if(game.bossShieldIndex<thresholds.length&&ratio<=thresholds[game.bossShieldIndex]&&e.hp>0){
      triggerBossShield(e);
    }
  }
  if(e.hp<=0)killEnemy(e);
}

function triggerBossShield(e){
  game.bossShieldIndex++;e.shielded=true;game.paused=true;notice("SELLO DEL JEFE",850);
  setTimeout(function(){
    if(!game||game.ended)return;
    openChallenge(selectChallengeArea(game.region),"boss",function(result){
      if(result.correct){
        e.shielded=false;e.hitCd=1.8;e.flash=.5;
        areaDamage(e.x,e.y,70,e.maxHp*.055,null);particles(e.x,e.y,"#f2d778",38,1);
        floatText(e.x,e.y-45,"SELLO ROTO","#f2d778");
      }else{
        e.shielded=false;e.damage*=1.16;e.speed*=1.08;radialBossShots(e,10,e.damage*.48);
        floatText(e.x,e.y-45,"EL JEFE SE ENFURECE","#e96e62");
      }
    });
  },280);
}

function areaDamage(x,y,r,damage,excludeId){
  game.enemies.forEach(function(e){if(!e.dead&&e.id!==excludeId&&Math.hypot(e.x-x,e.y-y)<r+e.r)damageEnemy(e,damage,e.x,e.y,false);});
  game.slashes.push({x:x,y:y,a:0,r:r,life:.22,maxLife:.22,color:game.region.accent,wide:TAU,ring:true});
}

function killEnemy(e){
  if(e.dead)return;e.dead=true;e.flash=.26;
  if(e.boss){winExpedition();return;}
  game.kills++;game.runKills++;state.totalKills++;updateOrder("kills",1);gainXp(e.elite?10:5);
  var rr=game.region.resources;
  if(rr.wood&&Math.random()<.55)game.carried.wood+=1;
  if(rr.ore&&Math.random()<.5)game.carried.ore+=1;
  if(rr.fragments&&Math.random()<.42)game.carried.fragments+=1;
  if(game.kills===5||game.kills===10||game.kills===16)spawnChest();
  saveState("enemy_defeated");
}

function damagePlayer(amount,sx,sy){
  var p=game.player;if(p.invuln>0||game.ended)return;
  p.hp-=amount;p.invuln=.48;p.flash=.18;game.cameraShake=Math.min(12,game.cameraShake+5);
  floatText(p.x,p.y-28,"-"+Math.round(amount),"#f06f62");particles(p.x,p.y,"#c95750",9,.55);
  var dx=p.x-sx,dy=p.y-sy,d=Math.max(1,Math.hypot(dx,dy));p.x+=dx/d*13;p.y+=dy/d*13;
  if(p.hp<=0)defeat();
}

function dodge(){
  if(!game||game.paused||game.ended)return;
  var p=game.player;if(p.dodgeCd>0)return;
  var dx=0,dy=0,k=game.keys;if(k["KeyA"]||k["ArrowLeft"])dx--;if(k["KeyD"]||k["ArrowRight"])dx++;if(k["KeyW"]||k["ArrowUp"])dy--;if(k["KeyS"]||k["ArrowDown"])dy++;
  if(!dx&&!dy){dx=Math.cos(p.facing);dy=Math.sin(p.facing);}var l=Math.max(1,Math.hypot(dx,dy));dx/=l;dy/=l;
  p.x=clamp(p.x+dx*100,24,els.gameCanvas.clientWidth-24);p.y=clamp(p.y+dy*100,65,els.gameCanvas.clientHeight-28);
  p.invuln=.42;p.dodgeCd=1.65;if(game.hero.id==="aldren")p.buff=1.5;
  particles(p.x-dx*34,p.y-dy*34,"#e2d29c",12,.45);
}

function ability(){
  if(!game||game.paused||game.ended)return;
  var p=game.player;if(p.abilityCd>0)return;p.abilityCd=7.2;
  var id=game.hero.id,a=p.facing,dmg=34*game.hero.power;
  if(id==="aldren"){
    areaDamage(p.x,p.y,135,dmg,null);game.enemies.forEach(function(e){var dx=e.x-p.x,dy=e.y-p.y,d=Math.max(1,Math.hypot(dx,dy));if(d<150){e.x+=dx/d*38;e.y+=dy/d*38;}});game.cameraShake=10;
  }else if(id==="mara"){
    [-.2,0,.2].forEach(function(o){game.projectiles.push({x:p.x,y:p.y,vx:Math.cos(a+o)*600,vy:Math.sin(a+o)*600,r:6,damage:dmg,life:1.4,color:game.hero.accent,pierce:3,hit:{}});});
  }else if(id==="elio"){
    var tx=clamp(game.mouse.x,40,els.gameCanvas.clientWidth-40),ty=clamp(game.mouse.y,70,els.gameCanvas.clientHeight-40);
    game.slashes.push({x:tx,y:ty,a:0,r:110,life:.5,maxLife:.5,color:game.hero.accent,wide:TAU,ring:true});
    setTimeout(function(){if(game&&!game.ended){areaDamage(tx,ty,110,dmg*1.4,null);particles(tx,ty,game.hero.accent,35,1);}},250);
  }else if(id==="silas"){
    var ox=p.x,oy=p.y;p.x=clamp(p.x+Math.cos(a)*155,25,els.gameCanvas.clientWidth-25);p.y=clamp(p.y+Math.sin(a)*155,65,els.gameCanvas.clientHeight-30);
    game.enemies.forEach(function(e){if(pointLineDistance(e.x,e.y,ox,oy,p.x,p.y)<e.r+24)damageEnemy(e,dmg*1.15,e.x,e.y,true);});p.invuln=.45;
  }else if(id==="bruna"){
    p.buff=5.5;p.invuln=.7;areaDamage(p.x,p.y,82,dmg*.8,null);
  }else{
    game.zones.push({x:game.mouse.x,y:game.mouse.y,r:115,life:4,tick:0,damage:dmg*.18,color:game.hero.accent});
  }
  particles(p.x,p.y,game.hero.accent,24,.8);
}

function pointLineDistance(px,py,x1,y1,x2,y2){
  var A=px-x1,B=py-y1,Cx=x2-x1,Cy=y2-y1,dot=A*Cx+B*Cy,len=Cx*Cx+Cy*Cy,t=len?clamp(dot/len,0,1):0;
  return Math.hypot(px-(x1+t*Cx),py-(y1+t*Cy));
}

function swapWeapon(){
  if(!game||game.paused)return;
  var a=state.equippedWeaponId,b=state.secondaryWeaponId;
  if(state.ownedWeapons.indexOf(b)===-1)return;
  state.equippedWeaponId=b;state.secondaryWeaponId=a;saveState("swap_weapon");updateGameHud();toast(findWeapon(b).name);
}

function particles(x,y,color,count,life){
  for(var i=0;i<count;i++){var a=Math.random()*TAU,s=35+Math.random()*110;game.particles.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,size:2+Math.random()*4,life:life*(.55+Math.random()*.65),maxLife:life,color:color});}
}
function floatText(x,y,text,color){if(!game)return;game.particles.push({x:x,y:y,vx:0,vy:-34,size:0,life:.8,maxLife:.8,color:color,text:text});}

function transferCarried(factor){
  factor=factor==null?1:factor;
  state.resources.wood+=Math.floor(game.carried.wood*factor);
  state.resources.ore+=Math.floor(game.carried.ore*factor);
  state.resources.fragments+=Math.floor(game.carried.fragments*factor);
}

function voluntaryReturn(){
  if(!game||game.ended)return;
  game.ended=true;transferCarried(1);state.gold+=Math.round(game.runKills*1.2);state.activeRun=null;saveState("voluntary_return");
  stopGame();showScreen("camp");toast("Expedición cerrada · botín asegurado");
}

function defeat(){
  if(game.ended)return;game.ended=true;game.paused=true;transferCarried(.65);state.activeRun=null;saveState("defeat");
  var lost=35;
  openGeneric('<span class="eyebrow">EXPEDICIÓN FALLIDA</span><h2>La tinta se repliega</h2><p style="color:#a9bab4;font-size:11px;line-height:1.5">Conservas tu experiencia, dominio y equipo. Se ha perdido aproximadamente un '+lost+' % de los recursos transportados.</p><button id="defeatCampBtn" class="primary-btn" type="button">VOLVER AL CAMPAMENTO</button>');
  $("defeatCampBtn").addEventListener("click",function(){closeGeneric();stopGame();showScreen("camp");});
}

function winExpedition(){
  if(game.ended)return;game.ended=true;game.paused=true;
  transferCarried(1);state.victories++;state.bossesDefeated++;updateOrder("boss",1);state.gold+=55+game.region.level*8;state.ink+=5;state.seals+=1;
  state.regionMastery[game.region.id]=clamp((state.regionMastery[game.region.id]||0)+12,0,100);gainXp(35+game.region.level*5);state.activeRun=null;saveState("boss_defeated");
  openGeneric('<span class="eyebrow">JEFE DERROTADO</span><h2>'+game.region.boss+'</h2><p style="color:#a9bab4;font-size:11px;line-height:1.5">La región reconoce tu dominio. Todo el botín queda asegurado.</p><div class="stat-pills"><span>+'+(55+game.region.level*8)+' oro</span><span>+5 tinta</span><span>+1 sello</span><span>+12 % dominio regional</span></div><button id="victoryCampBtn" class="primary-btn" style="margin-top:14px" type="button">REGRESAR COMO VENCEDOR</button>');
  $("victoryCampBtn").addEventListener("click",function(){closeGeneric();stopGame();showScreen("camp");});
}

function stopGame(){
  if(loopId){cancelAnimationFrame(loopId);loopId=0;}game=null;
}

function pauseGame(){
  if(!game||game.ended||challengeContext)return;
  game.paused=true;els.modalBackdrop.classList.remove("hidden");els.genericModal.classList.add("hidden");els.challengeModal.classList.add("hidden");els.pauseModal.classList.remove("hidden");
}

function resumeGame(){
  if(!game)return;els.pauseModal.classList.add("hidden");els.modalBackdrop.classList.add("hidden");game.paused=false;lastTime=performance.now();
}

function updateGameHud(){
  if(!game)return;
  var p=game.player,w=findWeapon(state.equippedWeaponId);
  $("hudHeroPortrait").innerHTML=heroSvg(game.hero,true);
  $("hudHeroName").textContent=game.hero.name;
  $("hudHpText").textContent=Math.max(0,Math.round(p.hp));
  $("hudHpBar").style.width=clamp(p.hp/p.maxHp*100,0,100)+"%";
  $("carryWood").textContent=game.carried.wood;$("carryOre").textContent=game.carried.ore;$("carryFragments").textContent=game.carried.fragments;
  $("hudRegionName").textContent=game.region.name.toUpperCase();
  $("objectiveLabel").textContent=game.bossSpawned?"Derrota a "+game.region.boss:"Elimina criaturas: "+Math.min(game.kills,20)+" / 20";
  $("abilityName").textContent=game.hero.ability;
  $("abilityCooldown").textContent=p.abilityCd>0?p.abilityCd.toFixed(1)+" s":"Lista";
  $("dodgeCooldown").textContent=p.dodgeCd>0?p.dodgeCd.toFixed(1)+" s":"Lista";
  $("hudWeaponName").textContent=w.name+" +"+state.weaponLevels[w.id];
  var bh=$("bossHud");
  if(game.boss&&!game.boss.dead){bh.classList.remove("hidden");$("bossHudName").textContent=game.region.boss;$("bossHpBar").style.width=clamp(game.boss.hp/game.boss.maxHp*100,0,100)+"%";}
  else bh.classList.add("hidden");
}

function renderGame(){
  if(!game)return;
  var canvas=els.gameCanvas,ctx=canvas.getContext("2d"),w=canvas.clientWidth,h=canvas.clientHeight;
  ctx.save();
  if(game.cameraShake>0){var s=game.cameraShake;ctx.translate((Math.random()-.5)*s,(Math.random()-.5)*s);game.cameraShake*=.82;if(game.cameraShake<.3)game.cameraShake=0;}
  drawTerrain(ctx,w,h);drawChests(ctx);drawZones(ctx);drawProjectiles(ctx);drawEnemies(ctx);drawPlayer(ctx);drawEffects(ctx);ctx.restore();drawMiniMap();
}

function drawTerrain(ctx,w,h){
  var r=game.region;
  ctx.fillStyle=r.ground;ctx.fillRect(-20,-20,w+40,h+40);
  var grad=ctx.createRadialGradient(w*.48,h*.5,20,w*.5,h*.5,Math.max(w,h)*.75);grad.addColorStop(0,r.colors[1]+"aa");grad.addColorStop(1,r.colors[0]+"22");ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  ctx.globalAlpha=.15;ctx.strokeStyle=r.accent;ctx.lineWidth=1;
  var gap=64;for(var x=0;x<w;x+=gap){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(var y=0;y<h;y+=gap){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  ctx.globalAlpha=1;
  game.props.forEach(function(p){
    ctx.save();ctx.translate(p.x,p.y);
    if(p.type===0){ctx.fillStyle=r.colors[2];ctx.beginPath();ctx.arc(0,0,p.size,0,TAU);ctx.fill();ctx.fillStyle=r.colors[0];ctx.fillRect(-2,p.size*.3,4,p.size*1.2);}
    else if(p.type===1){ctx.fillStyle=r.colors[3];ctx.rotate(.6);ctx.fillRect(-p.size*.55,-p.size*.2,p.size*1.1,p.size*.4);}
    else{ctx.strokeStyle=r.accent;ctx.globalAlpha=.35;ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,p.size,0,TAU);ctx.stroke();}
    ctx.restore();
  });
}

function drawPlayer(ctx){
  var p=game.player,h=game.hero,a=p.facing;
  ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=p.invuln>0&&Math.floor(p.invuln*18)%2?0.4:1;
  ctx.fillStyle="rgba(0,0,0,.28)";ctx.beginPath();ctx.ellipse(0,12,18,8,0,0,TAU);ctx.fill();
  ctx.rotate(a);
  ctx.fillStyle=p.flash>0?"#fff":h.cloth;ctx.strokeStyle="#071015";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-13,-9);ctx.lineTo(15,0);ctx.lineTo(-12,12);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=h.accent;ctx.fillRect(3,-4,23,8);
  ctx.fillStyle="#d3a47e";ctx.beginPath();ctx.arc(-4,0,8,0,TAU);ctx.fill();ctx.stroke();
  ctx.restore();
}

function drawEnemies(ctx){
  game.enemies.forEach(function(e){
    if(e.dead&&e.flash<=0)return;
    ctx.save();ctx.translate(e.x,e.y);
    ctx.fillStyle="rgba(0,0,0,.25)";ctx.beginPath();ctx.ellipse(0,e.r*.7,e.r*.9,e.r*.38,0,0,TAU);ctx.fill();
    if(e.boss)drawBossShape(ctx,e);else drawEnemyShape(ctx,e);
    var barW=e.boss?70:34;if(!e.boss||e.flash>0){ctx.fillStyle="rgba(0,0,0,.55)";ctx.fillRect(-barW/2,-e.r-11,barW,5);ctx.fillStyle=e.boss?"#d65352":"#73c19a";ctx.fillRect(-barW/2,-e.r-11,barW*clamp(e.hp/e.maxHp,0,1),5);}
    if(e.shielded){ctx.strokeStyle="#f1cf75";ctx.lineWidth=4;ctx.globalAlpha=.75;ctx.beginPath();ctx.arc(0,0,e.r+9,0,TAU);ctx.stroke();}
    ctx.restore();
  });
}

function drawEnemyShape(ctx,e){
  var r=e.r,color=e.flash>0?"#fff":game.region.colors[(e.type==="tank"?3:e.type==="shooter"?2:1)];
  ctx.strokeStyle="#091016";ctx.lineWidth=3;ctx.fillStyle=color;
  if(e.type==="tank"){ctx.beginPath();for(var i=0;i<8;i++){var a=i/8*TAU,rr=i%2?r*.85:r*1.05;var x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();}
  else if(e.type==="shooter"){ctx.rotate(Math.PI/4);ctx.fillRect(-r*.7,-r*.7,r*1.4,r*1.4);ctx.strokeRect(-r*.7,-r*.7,r*1.4,r*1.4);}
  else{ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.stroke();}
  ctx.fillStyle="#071015";ctx.beginPath();ctx.arc(-r*.28,-2,2.4,0,TAU);ctx.arc(r*.28,-2,2.4,0,TAU);ctx.fill();
}

function drawBossShape(ctx,e){
  var r=e.r,color=e.flash>0?"#fff":game.region.accent;ctx.strokeStyle="#140d14";ctx.lineWidth=5;ctx.fillStyle=color;
  if(e.type==="tank"){ctx.beginPath();for(var i=0;i<10;i++){var a=i/10*TAU,rr=i%2?r:r*.78;var x=Math.cos(a)*rr,y=Math.sin(a)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();}
  else if(e.type==="shooter"){ctx.rotate(game?performance.now()/1800:0);ctx.beginPath();for(var j=0;j<12;j++){var aa=j/12*TAU,rr=j%2?r:r*.55;var xx=Math.cos(aa)*rr,yy=Math.sin(aa)*rr;j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.closePath();ctx.fill();ctx.stroke();}
  else if(e.type==="summoner"){ctx.beginPath();ctx.arc(0,0,r*.74,0,TAU);ctx.fill();ctx.stroke();for(var k=0;k<6;k++){var ak=k/6*TAU;ctx.beginPath();ctx.moveTo(Math.cos(ak)*r*.55,Math.sin(ak)*r*.55);ctx.lineTo(Math.cos(ak)*r*1.12,Math.sin(ak)*r*1.12);ctx.stroke();}}
  else if(e.type==="orbit"){ctx.beginPath();ctx.arc(0,-5,r*.62,0,TAU);ctx.fill();ctx.stroke();for(var t=0;t<5;t++){ctx.beginPath();ctx.moveTo(-r*.45+t*r*.22,r*.25);ctx.quadraticCurveTo(-r*.7+t*r*.35,r*.75,-r*.55+t*r*.28,r);ctx.stroke();}}
  else{ctx.rotate(Math.PI/4);ctx.fillRect(-r*.65,-r*.65,r*1.3,r*1.3);ctx.strokeRect(-r*.65,-r*.65,r*1.3,r*1.3);}
  ctx.fillStyle="#1a1015";ctx.beginPath();ctx.arc(-9,-5,4,0,TAU);ctx.arc(9,-5,4,0,TAU);ctx.fill();
}

function drawProjectiles(ctx){
  game.projectiles.forEach(function(p){ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill();ctx.shadowBlur=0;});
  game.enemyProjectiles.forEach(function(p){ctx.fillStyle="#e16c5c";ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,TAU);ctx.fill();});
}

function drawEffects(ctx){
  game.slashes.forEach(function(s){
    var alpha=clamp(s.life/s.maxLife,0,1);ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=s.color;ctx.lineWidth=s.beam?7:5;
    if(s.ring){ctx.beginPath();ctx.arc(s.x,s.y,s.r*(1-alpha*.2),0,TAU);ctx.stroke();}
    else if(s.beam){ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x+Math.cos(s.a)*s.r,s.y+Math.sin(s.a)*s.r);ctx.stroke();}
    else{ctx.beginPath();ctx.arc(s.x,s.y,s.r,s.a-s.wide,s.a+s.wide);ctx.stroke();}
    ctx.restore();
  });
  game.particles.forEach(function(p){
    var a=clamp(p.life/p.maxLife,0,1);ctx.globalAlpha=a;
    if(p.text){ctx.fillStyle=p.color;ctx.font="900 11px sans-serif";ctx.textAlign="center";ctx.fillText(p.text,p.x,p.y);}
    else{ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(1,p.size),0,TAU);ctx.fill();}
  });ctx.globalAlpha=1;
}

function drawZones(ctx){
  game.zones.forEach(function(z){ctx.save();ctx.globalAlpha=.18+.08*Math.sin(performance.now()/180);ctx.fillStyle=z.color;ctx.strokeStyle=z.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,TAU);ctx.fill();ctx.stroke();ctx.restore();});
}

function drawChests(ctx){
  game.chests.forEach(function(c){if(c.opened)return;var bob=Math.sin(c.pulse*3)*3;ctx.save();ctx.translate(c.x,c.y+bob);ctx.fillStyle="#805b2e";ctx.strokeStyle="#e0b65b";ctx.lineWidth=3;ctx.fillRect(-16,-10,32,23);ctx.strokeRect(-16,-10,32,23);ctx.fillStyle="#e0b65b";ctx.fillRect(-3,-3,6,9);ctx.restore();});
}

function drawMiniMap(){
  if(!game)return;var c=els.miniMapCanvas,ctx=c.getContext("2d"),w=c.clientWidth,h=c.clientHeight;
  ctx.clearRect(0,0,w,h);ctx.fillStyle="rgba(3,12,16,.9)";ctx.fillRect(0,0,w,h);ctx.strokeStyle=game.region.accent;ctx.globalAlpha=.22;
  for(var i=0;i<5;i++){ctx.strokeRect(5+i*7,5+i*4,w-10-i*14,h-10-i*8);}
  ctx.globalAlpha=1;
  game.chests.forEach(function(ch){if(!ch.opened){ctx.fillStyle="#dfb95f";ctx.fillRect(ch.x/els.gameCanvas.clientWidth*w-2,ch.y/els.gameCanvas.clientHeight*h-2,4,4);}});
  game.enemies.forEach(function(e){if(!e.dead){ctx.fillStyle=e.boss?"#ee5e58":"#b75c58";ctx.beginPath();ctx.arc(e.x/els.gameCanvas.clientWidth*w,e.y/els.gameCanvas.clientHeight*h,e.boss?4:2,0,TAU);ctx.fill();}});
  ctx.fillStyle="#76d0ad";ctx.beginPath();ctx.arc(game.player.x/els.gameCanvas.clientWidth*w,game.player.y/els.gameCanvas.clientHeight*h,3.5,0,TAU);ctx.fill();
}

function notice(text,ms){
  var el=$("waveNotice");el.textContent=text;el.classList.remove("hidden");setTimeout(function(){el.classList.add("hidden");},ms||1300);
}

/* Desktop input */
window.addEventListener("keydown",function(ev){
  if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(ev.code)!==-1)ev.preventDefault();
  if(!game||currentScreen!=="game")return;
  if(ev.code==="Escape"){if(game.paused&& !els.pauseModal.classList.contains("hidden"))resumeGame();else pauseGame();return;}
  game.keys[ev.code]=true;
  if(ev.code==="Space"&&!ev.repeat)dodge();
  if(ev.code==="KeyQ"&&!ev.repeat)ability();
  if(ev.code==="KeyR"&&!ev.repeat)swapWeapon();
});
window.addEventListener("keyup",function(ev){if(game)game.keys[ev.code]=false;});
els.gameCanvas.addEventListener("mousemove",function(ev){if(game){var r=els.gameCanvas.getBoundingClientRect();game.mouse.x=ev.clientX-r.left;game.mouse.y=ev.clientY-r.top;}});
els.gameCanvas.addEventListener("mousedown",function(ev){if(game&&ev.button===0){game.pointerDown=true;var r=els.gameCanvas.getBoundingClientRect();game.mouse.x=ev.clientX-r.left;game.mouse.y=ev.clientY-r.top;attack();}});
window.addEventListener("mouseup",function(){if(game)game.pointerDown=false;});
els.gameCanvas.addEventListener("contextmenu",function(ev){ev.preventDefault();});

/* Touch controls */
(function initTouch(){
  var stick=$("touchStick"),knob=stick?stick.querySelector("i"):null,touchId=null;
  if(!stick)return;
  function updateStick(t){
    var r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=t.clientX-cx,dy=t.clientY-cy,d=Math.hypot(dx,dy),max=r.width*.34;
    if(d>max){dx=dx/d*max;dy=dy/d*max;}if(knob)knob.style.transform="translate("+dx+"px,"+dy+"px)";
    if(game){game.touchVector.x=dx/max;game.touchVector.y=dy/max;}
  }
  stick.addEventListener("pointerdown",function(e){touchId=e.pointerId;stick.setPointerCapture(touchId);updateStick(e);});
  stick.addEventListener("pointermove",function(e){if(e.pointerId===touchId)updateStick(e);});
  function end(e){if(e.pointerId!==touchId)return;touchId=null;if(knob)knob.style.transform="";if(game){game.touchVector.x=0;game.touchVector.y=0;}}
  stick.addEventListener("pointerup",end);stick.addEventListener("pointercancel",end);
  $("touchAttack").addEventListener("pointerdown",function(e){e.preventDefault();if(game){game.pointerDown=true;attack();}});
  $("touchAttack").addEventListener("pointerup",function(){if(game)game.pointerDown=false;});
  $("touchAbility").addEventListener("click",ability);$("touchDodge").addEventListener("click",dodge);
})();

window.addEventListener("beforeunload",function(){if(game&&currentScreen==="game"&&!game.ended)saveState("beforeunload");});\ndocument.addEventListener("visibilitychange",function(){if(document.hidden&&game&&currentScreen==="game"&&!game.paused){saveState("visibility_autosave");pauseGame();}});
window.addEventListener("blur",function(){if(game&&currentScreen==="game"&&!game.paused)pauseGame();});
window.addEventListener("resize",function(){resizeGameCanvas();if(currentScreen==="camp")renderCamp();});

/* UI events */
els.newGameBtn.addEventListener("click",newGame);
els.continueBtn.addEventListener("click",continueGame);
$("changeHeroBtn").addEventListener("click",openHeroPicker);
$("changeWeaponBtn").addEventListener("click",openWeaponPicker);
$("startExpeditionBtn").addEventListener("click",startExpedition);
$("campMenuBtn").addEventListener("click",function(){openGeneric('<span class="eyebrow">CAMPAMENTO</span><h2>Opciones</h2><div class="pause-grid"><button id="manualSaveBtn" class="primary-btn" type="button">Guardar partida</button><button id="titleReturnBtn" class="secondary-btn" type="button">Volver al título</button></div>');$("manualSaveBtn").addEventListener("click",function(){saveState("manual_save");toast("Partida guardada");closeGeneric();});$("titleReturnBtn").addEventListener("click",function(){saveState("title_return");closeGeneric();renderTitle();showScreen("title");});});
document.querySelectorAll("[data-facility]").forEach(function(b){b.addEventListener("click",function(){openFacility(b.getAttribute("data-facility"));});});
$("closeGenericModal").addEventListener("click",closeGeneric);
$("challengeHintBtn").addEventListener("click",useHint);
$("challengeContinueBtn").addEventListener("click",finishChallenge);
$("returnCampBtn").addEventListener("click",function(){if(!game)return;pauseGame();});
$("resumeGameBtn").addEventListener("click",resumeGame);
$("pauseSaveBtn").addEventListener("click",function(){saveState("manual_game_save");toast("Partida guardada");});
$("pauseCampBtn").addEventListener("click",function(){els.pauseModal.classList.add("hidden");els.modalBackdrop.classList.add("hidden");voluntaryReturn();});

renderTitle();
})();