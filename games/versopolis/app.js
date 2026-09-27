(function(){
"use strict";

var STORAGE="lenguarcade.versopolis.v02";
var OLD_STORAGE="lenguarcade.versopolis.v01";
var $=function(id){return document.getElementById(id);};
var run=null;
var career=loadCareer();
var toastTimer=null;
var resumeSave=null;

var districts=[
  {name:"Puerta de la Rima",rival:"La Voz del Puente",portrait:"◖✒◗",rule:"Las combinaciones de rima reciben +35% de puntuación.",target:900,hands:4,discards:2,focus:"rhyme"},
  {name:"Plaza del Ritmo",rival:"El Maestro del Pulso",portrait:"♫",rule:"Las series con la misma medida reciben +40% de puntuación.",target:1150,hands:4,discards:2,focus:"meter"},
  {name:"Jardines de la Imagen",rival:"La Dama de los Espejos",portrait:"✦",rule:"Cada recurso expresivo distinto añade una bonificación adicional.",target:1400,hands:4,discards:2,focus:"devices"},
  {name:"Gran Anfiteatro",rival:"El Cronista Mayor",portrait:"♜",rule:"Rima, ritmo, forma e imágenes cuentan a la vez. Solo las mejores estrofas conquistan el anfiteatro.",target:1750,hands:5,discards:2,focus:"all"}
];

var muses=[
  {id:"eco",icon:"◌",name:"Musa del Eco",desc:"Toda combinación con rima reconocible recibe un 30% extra.",label:"Rima ×1,30"},
  {id:"pulso",icon:"♫",name:"Musa del Pulso",desc:"Si todos los versos elegidos comparten medida, la combinación recibe un 35% extra.",label:"Ritmo ×1,35"},
  {id:"imagen",icon:"✦",name:"Musa de la Imagen",desc:"Cada recurso literario distinto aporta 55 puntos adicionales antes de multiplicar.",label:"+55 por recurso"},
  {id:"arquitecta",icon:"◇",name:"Musa Arquitecta",desc:"Los esquemas de cuatro versos ABAB, ABBA y AABB reciben un 40% extra.",label:"Estrofas ×1,40"},
  {id:"duende",icon:"✧",name:"El Duende",desc:"La primera combinación de cada distrito recibe un 50% extra.",label:"Primera jugada ×1,50"},
  {id:"afinacion",icon:"♢",name:"Afinación Perfecta",desc:"Las combinaciones de cuatro versos con una sola medida suman 180 puntos.",label:"+180 a 4 versos iguales"},
  {id:"coleccionista",icon:"❖",name:"Coleccionista de Imágenes",desc:"Si aparecen dos o más recursos distintos, suma 140 puntos.",label:"+140 por variedad"}
];

var cards=[
{id:"ino1",text:"Cruza la noche el camino",meter:8,rhyme:"ino",rhymeType:"consonante",theme:"viaje",devices:["personificación"],value:42},
{id:"ino2",text:"Guardo mi voz en destino",meter:8,rhyme:"ino",rhymeType:"consonante",theme:"viaje",devices:["metáfora"],value:44},
{id:"ino3",text:"Canta despacio el molino",meter:8,rhyme:"ino",rhymeType:"consonante",theme:"paisaje",devices:["personificación"],value:42},
{id:"ino4",text:"Brilla la luz del vecino",meter:8,rhyme:"ino",rhymeType:"consonante",theme:"paisaje",devices:[],value:38},
{id:"ente1",text:"Mira la torre de frente",meter:8,rhyme:"ente",rhymeType:"consonante",theme:"ciudad",devices:[],value:38},
{id:"ente2",text:"Suena la fuente presente",meter:8,rhyme:"ente",rhymeType:"consonante",theme:"ciudad",devices:["personificación"],value:42},
{id:"ente3",text:"Tiembla la voz del ausente",meter:8,rhyme:"ente",rhymeType:"consonante",theme:"ausencia",devices:["metáfora"],value:44},
{id:"ente4",text:"Arde la tarde paciente",meter:8,rhyme:"ente",rhymeType:"consonante",theme:"paisaje",devices:["personificación"],value:42},
{id:"ado1",text:"Vuelve el guerrero cansado",meter:8,rhyme:"ado",rhymeType:"consonante",theme:"aventura",devices:[],value:38},
{id:"ado2",text:"Queda el jardín apagado",meter:8,rhyme:"ado",rhymeType:"consonante",theme:"paisaje",devices:["metáfora"],value:42},
{id:"ado3",text:"Corre un caballo dorado",meter:8,rhyme:"ado",rhymeType:"consonante",theme:"aventura",devices:["epíteto"],value:42},
{id:"ado4",text:"Sueña el castillo encantado",meter:8,rhyme:"ado",rhymeType:"consonante",theme:"aventura",devices:["personificación"],value:42},
{id:"ia1",text:"Vuelve la luz cada día",meter:8,rhyme:"ía",rhymeType:"consonante",theme:"tiempo",devices:[],value:38},
{id:"ia2",text:"Canta la vieja abadía",meter:8,rhyme:"ía",rhymeType:"consonante",theme:"ciudad",devices:["personificación"],value:42},
{id:"ia3",text:"Tiembla la voz todavía",meter:8,rhyme:"ía",rhymeType:"consonante",theme:"ausencia",devices:["personificación"],value:42},
{id:"ia4",text:"Brilla la piedra sombría",meter:8,rhyme:"ía",rhymeType:"consonante",theme:"paisaje",devices:["epíteto"],value:42},
{id:"aa1",text:"Bajo la lluvia, mi casa",meter:8,rhyme:"a-a",rhymeType:"asonante",theme:"hogar",devices:[],value:39},
{id:"aa2",text:"Canta el gorrión en la rama",meter:8,rhyme:"a-a",rhymeType:"asonante",theme:"paisaje",devices:["personificación"],value:43},
{id:"aa3",text:"Guardo la luna de plata",meter:8,rhyme:"a-a",rhymeType:"asonante",theme:"noche",devices:["metáfora"],value:45},
{id:"aa4",text:"Tiembla la tarde en calma",meter:8,rhyme:"a-a",rhymeType:"asonante",theme:"noche",devices:["personificación"],value:43},
{id:"ea1",text:"Queda mi carta en la mesa",meter:8,rhyme:"e-a",rhymeType:"asonante",theme:"ausencia",devices:[],value:39},
{id:"ea2",text:"Sigo de noche la senda",meter:8,rhyme:"e-a",rhymeType:"asonante",theme:"viaje",devices:[],value:39},
{id:"ea3",text:"Canta la fuente tan cerca",meter:8,rhyme:"e-a",rhymeType:"asonante",theme:"paisaje",devices:["personificación"],value:43},
{id:"ea4",text:"Vuelve la música lenta",meter:8,rhyme:"e-a",rhymeType:"asonante",theme:"tiempo",devices:["sinestesia"],value:45},
{id:"ana1",text:"Sobre la piedra tiembla la mañana",meter:11,rhyme:"ana",rhymeType:"consonante",theme:"paisaje",devices:["personificación"],value:50},
{id:"ana2",text:"Canta la fuente junto a la ventana",meter:11,rhyme:"ana",rhymeType:"consonante",theme:"ciudad",devices:["personificación"],value:50},
{id:"ana3",text:"Guarda la noche luz en la ventana",meter:11,rhyme:"ana",rhymeType:"consonante",theme:"noche",devices:["metáfora"],value:52},
{id:"ana4",text:"Busca la sombra paz en la mañana",meter:11,rhyme:"ana",rhymeType:"consonante",theme:"paisaje",devices:["personificación"],value:50},
{id:"or1",text:"Cruza la tarde con lento rumor",meter:11,rhyme:"or",rhymeType:"consonante",theme:"paisaje",devices:["sinestesia"],value:52},
{id:"or2",text:"Guarda la lluvia su antiguo temblor",meter:11,rhyme:"or",rhymeType:"consonante",theme:"noche",devices:["personificación"],value:50},
{id:"or3",text:"Tiñe la brisa de cobre la flor",meter:11,rhyme:"or",rhymeType:"consonante",theme:"paisaje",devices:["metáfora"],value:52},
{id:"or4",text:"Trae la noche su claro rumor",meter:11,rhyme:"or",rhymeType:"consonante",theme:"noche",devices:["personificación"],value:50}
];

function loadCareer(){
  var base={runs:0,wins:0,bestScore:0,bestStreak:0,districtsCleared:0};
  try{
    var newer=JSON.parse(localStorage.getItem(STORAGE)||"null");
    if(newer)return Object.assign(base,newer);
    var old=JSON.parse(localStorage.getItem(OLD_STORAGE)||"null");
    if(old){base.runs=Number(old.games||0);base.bestScore=Number(old.bestScore||0);base.bestStreak=Number(old.bestStreak||0);}
  }catch(err){}
  return base;
}
function saveCareer(){try{localStorage.setItem(STORAGE,JSON.stringify(career));}catch(err){}}
function cardById(id){for(var i=0;i<cards.length;i+=1)if(cards[i].id===id)return cards[i];return null;}
function museById(id){for(var i=0;i<muses.length;i+=1)if(muses[i].id===id)return muses[i];return null;}
function shuffle(list){var a=list.slice();for(var i=a.length-1;i>0;i-=1){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function show(name){["homeScreen","museScreen","gameScreen","resultScreen"].forEach(function(id){$(id).classList.toggle("hidden",id!==name);});}
function renderCareer(){
  var text=career.runs?"Mejor expedición: "+career.bestScore.toLocaleString("es-ES")+" · "+career.districtsCleared+" distritos conquistados":"La ciudad aún no conoce tus versos.";
  $("careerLine").textContent=text;
  $("continueBtn").classList.toggle("hidden",!resumeSave);
}
function newRun(){
  run={version:2,districtIndex:0,districtScore:0,runScore:0,handsLeft:0,discardsLeft:0,deck:[],hand:[],selected:[],muses:[],awaitingMuse:true,districtStarted:false,finished:false,won:false,streak:0,bestStreak:0,firstPlay:true,stats:{compositions:0,structured:0,districtsCleared:0,bestCombo:0},startedAt:Date.now()};
  resumeSave=null;
  showMuseChoice("Elige tu primera Musa","Su poder estará activo durante toda la expedición.");
  bridgeCall("sessionStarted");
}
function showMuseChoice(title,subtitle){
  if(!run)return;
  run.awaitingMuse=true;
  show("museScreen");
  $("museTitle").textContent=title||"Elige una Musa";
  $("museSubtitle").textContent=subtitle||"Añade una nueva sinergia a tu expedición.";
  var available=muses.filter(function(m){return run.muses.indexOf(m.id)<0;});
  var choices=shuffle(available).slice(0,3);
  $("museChoices").innerHTML="";
  choices.forEach(function(m){
    var b=document.createElement("button");b.type="button";b.className="museCard";
    b.innerHTML='<span class="museIcon">'+m.icon+'</span><h3>'+m.name+'</h3><p>'+m.desc+'</p><small>'+m.label+'</small>';
    b.addEventListener("click",function(){chooseMuse(m.id);});
    $("museChoices").appendChild(b);
  });
  renderOwnedMuses();
}
function renderOwnedMuses(){
  if(!run){$("ownedMuses").innerHTML="";return;}
  $("ownedMuses").innerHTML=run.muses.length?"<b>ACTIVAS</b> "+run.muses.map(function(id){var m=museById(id);return m?"<span>"+m.icon+" "+m.name+"</span>":"";}).join(""):"<span>Aún no tienes Musas activas.</span>";
}
function chooseMuse(id){
  if(!run||run.muses.indexOf(id)>=0)return;
  run.muses.push(id);run.awaitingMuse=false;
  setupDistrict();
  bridgeCall("checkpoint","muse_choice");
}
function buildDeck(){
  var d=districts[run.districtIndex];
  var pool=cards.slice();
  if(d.focus==="rhyme")pool=cards.filter(function(c){return c.meter===8;});
  if(d.focus==="meter")pool=cards.slice();
  if(d.focus==="devices")pool=cards.filter(function(c){return c.devices.length>0;}).concat(cards.filter(function(c){return !c.devices.length;}).slice(0,6));
  return shuffle(pool.map(function(c){return c.id;}));
}
function setupDistrict(){
  var d=districts[run.districtIndex];
  run.districtScore=0;run.handsLeft=d.hands;run.discardsLeft=d.discards;run.deck=buildDeck();run.hand=[];run.selected=[];run.districtStarted=true;run.firstPlay=true;
  drawToSeven();show("gameScreen");renderGame();
}
function drawToSeven(){
  while(run.hand.length<7){
    if(!run.deck.length){
      var used=cards.map(function(c){return c.id;}).filter(function(id){return run.hand.indexOf(id)<0;});
      run.deck=shuffle(used);
    }
    if(!run.deck.length)break;
    var id=run.deck.shift();
    if(run.hand.indexOf(id)<0)run.hand.push(id);
  }
}
function toggleCard(id){
  if(!run)return;
  var idx=run.selected.indexOf(id);
  if(idx>=0)run.selected.splice(idx,1);else if(run.selected.length<4)run.selected.push(id);else showToast("Solo puedes jugar cuatro versos a la vez.","bad");
  renderGame();
}
function removeSelected(id){var i=run.selected.indexOf(id);if(i>=0){run.selected.splice(i,1);renderGame();}}
function moveSelected(id,dir){
  var i=run.selected.indexOf(id),j=i+dir;if(i<0||j<0||j>=run.selected.length)return;
  var t=run.selected[i];run.selected[i]=run.selected[j];run.selected[j]=t;renderGame();
}
function clearSelection(){if(!run)return;run.selected=[];renderGame();}
function canonicalPattern(values){
  var seen={},next=0,letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ";return values.map(function(v){if(seen[v]===undefined){seen[v]=letters[next]||"X";next+=1;}return seen[v];}).join("");
}
function analyze(ids){
  var chosen=ids.map(cardById).filter(Boolean),n=chosen.length;
  if(!n)return {name:"Elige de 2 a 4 versos",score:0,tags:[],breakdown:[],structured:false,pattern:""};
  var base=chosen.reduce(function(sum,c){return sum+c.value;},0);
  var meters=chosen.map(function(c){return c.meter;});
  var rhymes=chosen.map(function(c){return c.rhyme;});
  var pattern=canonicalPattern(rhymes);
  var allMeter=n>=2&&meters.every(function(v){return v===meters[0];});
  var sameRhyme=n>=2&&rhymes.every(function(v){return v===rhymes[0];});
  var rhymeCounts={};rhymes.forEach(function(r){rhymeCounts[r]=(rhymeCounts[r]||0)+1;});
  var repeated=Object.keys(rhymeCounts).filter(function(r){return rhymeCounts[r]>=2;});
  var rhymeKind=chosen.every(function(c){return c.rhymeType===chosen[0].rhymeType;})?chosen[0].rhymeType:"mixta";
  var devices=[];chosen.forEach(function(c){c.devices.forEach(function(d){if(devices.indexOf(d)<0)devices.push(d);});});
  var sameTheme=n>=3&&chosen.every(function(c){return c.theme===chosen[0].theme;});
  var formBonus=0,rhymeBonus=0,meterBonus=0,deviceBonus=devices.length*45,themeBonus=sameTheme?110:0,name="Combinación libre";
  if(n===2&&sameRhyme){name="PAREADO";rhymeBonus=150;}
  else if(n===3&&sameRhyme){name="TRÍO MONORRIMO";rhymeBonus=245;}
  else if(n===4&&sameRhyme){name="ESTROFA MONORRIMA";rhymeBonus=360;formBonus=80;}
  else if(n===4&&pattern==="ABAB"){
    if(rhymeKind==="consonante"&&allMeter&&meters[0]===8)name="CUARTETA";
    else if(rhymeKind==="consonante"&&allMeter&&meters[0]===11)name="SERVENTESIO";
    else name="ESQUEMA ABAB";
    rhymeBonus=310;formBonus=180;
  }else if(n===4&&pattern==="ABBA"){
    if(rhymeKind==="consonante"&&allMeter&&meters[0]===8)name="REDONDILLA";
    else if(rhymeKind==="consonante"&&allMeter&&meters[0]===11)name="CUARTETO";
    else name="ESQUEMA ABBA";
    rhymeBonus=330;formBonus=190;
  }else if(n===4&&pattern==="AABB"){name="DOBLE PAREADO";rhymeBonus=290;formBonus=140;}
  else if(repeated.length){name="CADENA DE ECOS";rhymeBonus=100*repeated.length;}
  if(allMeter&&n>=2)meterBonus=70*n+(n===4?80:0);
  var subtotal=base+rhymeBonus+formBonus+meterBonus+deviceBonus+themeBonus;
  var multiplier=1;
  var d=run?districts[run.districtIndex]:districts[0];
  if(d.focus==="rhyme"&&rhymeBonus>0)multiplier*=1.35;
  if(d.focus==="meter"&&allMeter)multiplier*=1.40;
  if(d.focus==="devices")subtotal+=devices.length*55;
  if(d.focus==="all"&&formBonus>0)multiplier*=1.25;
  var active=run?run.muses:[];
  if(active.indexOf("eco")>=0&&rhymeBonus>0)multiplier*=1.30;
  if(active.indexOf("pulso")>=0&&allMeter)multiplier*=1.35;
  if(active.indexOf("imagen")>=0)subtotal+=devices.length*55;
  if(active.indexOf("arquitecta")>=0&&n===4&&(pattern==="ABAB"||pattern==="ABBA"||pattern==="AABB"))multiplier*=1.40;
  if(active.indexOf("duende")>=0&&run&&run.firstPlay)multiplier*=1.50;
  if(active.indexOf("afinacion")>=0&&n===4&&allMeter)subtotal+=180;
  if(active.indexOf("coleccionista")>=0&&devices.length>=2)subtotal+=140;
  var score=Math.round(subtotal*multiplier);
  var tags=[];
  if(repeated.length||sameRhyme)tags.push("Rima "+rhymeKind+(n===4?" · "+pattern:""));
  if(allMeter)tags.push(meters[0]+" sílabas · ritmo uniforme");
  if(devices.length)tags.push(devices.join(" · "));
  if(sameTheme)tags.push("unidad temática: "+chosen[0].theme);
  var breakdown=[{label:"Versos",value:base},{label:"Rima y forma",value:rhymeBonus+formBonus},{label:"Ritmo",value:meterBonus},{label:"Recursos",value:deviceBonus+(d.focus==="devices"?devices.length*55:0)+(active.indexOf("imagen")>=0?devices.length*55:0)},{label:"Tema",value:themeBonus}];
  if(multiplier>1)breakdown.push({label:"Multiplicador",value:"×"+multiplier.toFixed(2).replace(".",",")});
  var structured=!!(rhymeBonus||meterBonus||devices.length>=2||sameTheme);
  return {name:name,score:score,tags:tags,breakdown:breakdown,structured:structured,pattern:pattern,meters:meters,rhymeKind:rhymeKind,devices:devices};
}
function renderGame(){
  if(!run)return;
  var d=districts[run.districtIndex],analysis=analyze(run.selected);
  $("districtStep").textContent="DISTRITO "+(run.districtIndex+1)+"/"+districts.length;
  $("districtName").textContent=d.name;$("rivalName").textContent=d.rival;$("rivalPortrait").textContent=d.portrait;$("rivalRule").textContent=d.rule;
  $("targetText").textContent=d.target.toLocaleString("es-ES");$("scoreText").textContent=run.districtScore.toLocaleString("es-ES");$("handsText").textContent=run.handsLeft;$("discardsText").textContent=run.discardsLeft;$("runScoreText").textContent=run.runScore.toLocaleString("es-ES");
  var pct=Math.min(100,Math.round(run.districtScore/d.target*100));$("targetFill").style.width=pct+"%";$("progressText").textContent=run.districtScore.toLocaleString("es-ES")+" / "+d.target.toLocaleString("es-ES");
  $("comboName").textContent=analysis.name;$("scorePreview").textContent=analysis.score.toLocaleString("es-ES");
  $("comboTags").innerHTML=analysis.tags.map(function(t){return "<span>"+t+"</span>";}).join("");
  $("analysisTitle").textContent=run.selected.length?analysis.name:"Construye una combinación";
  $("analysisText").textContent=run.selected.length?describeAnalysis(analysis):"El orden importa. Busca rimas, medidas semejantes y recursos que puedan reforzarse entre sí.";
  $("analysisBreakdown").innerHTML=analysis.breakdown.map(function(row){return "<div><span>"+row.label+"</span><b>"+(typeof row.value==="number"?"+ "+row.value.toLocaleString("es-ES"):row.value)+"</b></div>";}).join("");
  renderSlots();renderHand();renderActiveMuses();
  $("playBtn").disabled=run.selected.length<2||run.handsLeft<=0;
  $("discardBtn").disabled=!run.selected.length||run.discardsLeft<=0;
  $("clearBtn").disabled=!run.selected.length;
}
function describeAnalysis(a){
  var parts=[];
  if(a.pattern&&run.selected.length===4)parts.push("El orden crea el esquema "+a.pattern+".");
  if(a.meters&&a.meters.length&&a.meters.every(function(v){return v===a.meters[0];}))parts.push("Todos los versos tienen "+a.meters[0]+" sílabas métricas.");
  if(a.devices&&a.devices.length)parts.push("Aparecen "+a.devices.join(", ")+".");
  if(!parts.length)parts.push("Hay una combinación válida, pero todavía puedes buscar una relación poética más fuerte.");
  return parts.join(" ");
}
function renderSlots(){
  $("poemSlots").innerHTML="";
  for(var i=0;i<4;i+=1){
    var id=run.selected[i],c=id?cardById(id):null,slot=document.createElement("div");slot.className="poemSlot"+(c?" filled":"");
    if(c){
      var textNode=document.createElement("span");textNode.textContent=(i+1)+". "+c.text;slot.appendChild(textNode);
      var controls=document.createElement("span");controls.className="slotNumber";
      var left=document.createElement("button");left.type="button";left.textContent="↑";left.title="Subir verso";left.disabled=i===0;left.addEventListener("click",function(cardId){return function(e){e.stopPropagation();moveSelected(cardId,-1);};}(id));
      var right=document.createElement("button");right.type="button";right.textContent="↓";right.title="Bajar verso";right.disabled=i===run.selected.length-1;right.addEventListener("click",function(cardId){return function(e){e.stopPropagation();moveSelected(cardId,1);};}(id));
      var del=document.createElement("button");del.type="button";del.textContent="×";del.title="Quitar verso";del.addEventListener("click",function(cardId){return function(e){e.stopPropagation();removeSelected(cardId);};}(id));
      controls.appendChild(left);controls.appendChild(right);controls.appendChild(del);slot.appendChild(controls);
    }else slot.textContent="Verso "+(i+1);
    $("poemSlots").appendChild(slot);
  }
}
function renderHand(){
  $("hand").innerHTML="";
  run.hand.forEach(function(id){
    var c=cardById(id),b=document.createElement("button");b.type="button";b.className="verseCard"+(run.selected.indexOf(id)>=0?" selected":"");
    var device=c.devices.length?'<span class="device">'+c.devices[0]+"</span>":"";
    b.innerHTML='<span class="verseText">'+c.text+'</span><span class="cardMeta"><span class="meter">'+c.meter+' sílabas</span><span class="rhyme">-'+c.rhyme+'</span>'+device+"</span>";
    b.addEventListener("click",function(){toggleCard(id);});$("hand").appendChild(b);
  });
}
function renderActiveMuses(){
  $("activeMuses").innerHTML=run.muses.length?'<span class="eyebrow">MUSAS ACTIVAS</span>'+run.muses.map(function(id){var m=museById(id);return m?"<span>"+m.icon+" "+m.name+"</span>":"";}).join(""):"";
}
function playSelection(){
  if(!run||run.selected.length<2||run.handsLeft<=0)return;
  var analysis=analyze(run.selected),played=run.selected.slice();
  run.stats.compositions+=1;if(analysis.structured){run.stats.structured+=1;run.streak+=1;}else run.streak=0;
  run.bestStreak=Math.max(run.bestStreak,run.streak);run.stats.bestCombo=Math.max(run.stats.bestCombo,analysis.score);
  run.districtScore+=analysis.score;run.runScore+=analysis.score;run.handsLeft-=1;run.firstPlay=false;
  played.forEach(function(id){var i=run.hand.indexOf(id);if(i>=0)run.hand.splice(i,1);});run.selected=[];drawToSeven();
  showToast(analysis.name+" · +"+analysis.score.toLocaleString("es-ES")+" puntos"+(analysis.tags.length?" · "+analysis.tags.slice(0,2).join(" · "):""),analysis.structured?"ok":"");
  renderGame();bridgeCall("checkpoint","composition_played");
  var d=districts[run.districtIndex];
  if(run.districtScore>=d.target){setTimeout(winDistrict,650);return;}
  if(run.handsLeft<=0)setTimeout(loseRun,650);
}
function discardSelection(){
  if(!run||!run.selected.length||run.discardsLeft<=0)return;
  var thrown=run.selected.slice();thrown.forEach(function(id){var i=run.hand.indexOf(id);if(i>=0)run.hand.splice(i,1);});run.selected=[];run.discardsLeft-=1;drawToSeven();renderGame();showToast("Has cambiado "+thrown.length+" verso"+(thrown.length===1?"":"s")+". El descarte no consume una jugada.","");bridgeCall("checkpoint","discard");
}
function winDistrict(){
  if(!run||run.finished)return;
  var d=districts[run.districtIndex];run.stats.districtsCleared+=1;career.districtsCleared+=1;saveCareer();
  showToast("Distrito conquistado: "+d.name+".","ok");
  if(run.districtIndex>=districts.length-1){run.won=true;finishRun();return;}
  run.districtIndex+=1;run.districtStarted=false;run.selected=[];
  setTimeout(function(){showMuseChoice("La ciudad te ofrece una nueva Musa","Elige una mejora antes de entrar en "+districts[run.districtIndex].name+".");},500);
  bridgeCall("checkpoint","district_cleared");
}
function loseRun(){if(!run||run.finished)return;run.won=false;finishRun();}
function finishRun(){
  if(!run||run.finished)return;run.finished=true;career.runs+=1;if(run.won)career.wins+=1;career.bestScore=Math.max(career.bestScore,run.runScore);career.bestStreak=Math.max(career.bestStreak,run.bestStreak);saveCareer();resumeSave=null;
  $("finalScore").textContent=run.runScore.toLocaleString("es-ES");$("districtsText").textContent=run.stats.districtsCleared+"/"+districts.length;$("compositionsText").textContent=run.stats.compositions;$("bestStreakText").textContent=run.bestStreak;
  if(run.won){$("resultKicker").textContent="VERSÓPOLIS CONQUISTADA";$("resultTitle").textContent="La ciudad corea tus versos";$("resultText").textContent="Has construido una expedición completa combinando rima, ritmo, forma y recursos expresivos. Ahora puedes intentar una puntuación todavía mayor con otras Musas.";}
  else{$("resultKicker").textContent="EXPEDICIÓN TERMINADA";$("resultTitle").textContent="El distrito resiste";$("resultText").textContent="Te has quedado a las puertas del objetivo. Prueba otras combinaciones, reserva los descartes para manos difíciles y busca estructuras de cuatro versos.";}
  show("resultScreen");renderCareer();bridgeCall("result",run.won?"finished":"defeat");
}
function showToast(text,kind){
  if(toastTimer)clearTimeout(toastTimer);$("toast").textContent=text;$("toast").className="toast"+(kind?" "+kind:"");
  toastTimer=setTimeout(function(){$("toast").classList.add("hidden");},2600);
}
function snapshot(){return{version:2,run:run,career:career};}
function restore(raw){
  try{
    var save=raw&&raw.run!==undefined?raw:raw&&raw.save?raw.save:raw;if(!save)return false;
    if(save.career){
      if(save.version===1||save.career.games!==undefined){career.runs=Math.max(career.runs,Number(save.career.games||0));career.bestScore=Math.max(career.bestScore,Number(save.career.bestScore||0));career.bestStreak=Math.max(career.bestStreak,Number(save.career.bestStreak||0));}
      else career=Object.assign(career,save.career);saveCareer();
    }
    if(save.version===2&&save.run&&!save.run.finished){resumeSave=save.run;renderCareer();return true;}
    renderCareer();return !!save.career;
  }catch(err){return false;}
}
function continueRun(){
  if(!resumeSave)return;run=resumeSave;resumeSave=null;
  if(run.awaitingMuse)showMuseChoice("Elige una Musa","Continúa tu expedición con una nueva inspiración.");else{show("gameScreen");renderGame();}
  bridgeCall("sessionStarted");
}
function metrics(){
  var r=run||{},s=r.stats||{},attempts=Number(s.compositions||0),correct=Number(s.structured||0),accuracy=attempts?Math.round(correct/attempts*100):0;
  var pct=0;if(r.finished&&r.won)pct=100;else if(r.districtIndex!==undefined){var d=districts[Math.min(r.districtIndex,districts.length-1)],part=d?Math.min(1,Number(r.districtScore||0)/d.target):0;pct=Math.round(((Number(r.districtIndex||0)+part)/districts.length)*100);}
  return{score:Number(r.runScore||0),attempts:attempts,correct:correct,errors:Math.max(0,attempts-correct),accuracy:accuracy,percentage:pct,bestStreak:Number(r.bestStreak||0),round:Number(r.districtIndex||0)+1,games:Number(career.runs||0),careerBest:Number(career.bestScore||0),districtsCleared:Number(s.districtsCleared||0),bestCombo:Number(s.bestCombo||0)};
}
function bridgeCall(name,arg){try{if(window.VersopolisBridge&&typeof window.VersopolisBridge[name]==="function")return window.VersopolisBridge[name](arg);}catch(err){}return null;}
function saveAndHome(){if(run&&!run.finished){resumeSave=run;renderCareer();}if(window.VersopolisBridge&&window.VersopolisBridge.saveAndExit)window.VersopolisBridge.saveAndExit();else{show("homeScreen");renderCareer();}}

$("startBtn").addEventListener("click",newRun);$("continueBtn").addEventListener("click",continueRun);$("againBtn").addEventListener("click",newRun);$("homeBtn").addEventListener("click",function(){run=null;show("homeScreen");renderCareer();});
$("playBtn").addEventListener("click",playSelection);$("discardBtn").addEventListener("click",discardSelection);$("clearBtn").addEventListener("click",clearSelection);$("exitBtn").addEventListener("click",saveAndHome);$("museExitBtn").addEventListener("click",saveAndHome);
$("helpBtn").addEventListener("click",function(){$("modal").classList.remove("hidden");});$("closeModal").addEventListener("click",function(){$("modal").classList.add("hidden");});$("modal").addEventListener("click",function(e){if(e.target===$("modal"))$("modal").classList.add("hidden");});
window.VersopolisGame={snapshot:snapshot,restore:restore,metrics:metrics,get run(){return run;},get career(){return career;}};
renderCareer();
})();
