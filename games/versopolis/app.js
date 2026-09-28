(function(){
"use strict";

var STORAGE="lenguarcade.versopolis.v03";
var OLD_STORAGE2="lenguarcade.versopolis.v02";
var OLD_STORAGE1="lenguarcade.versopolis.v01";
var $=function(id){return document.getElementById(id);};
var run=null,career=loadCareer(),toastTimer=null,resumeSave=null,comboTimer=null;

var districts=[
  {name:"Puerta de la Rima",rival:"La Voz del Puente",portrait:"✒",rule:"La rima hiere su prestigio con especial fuerza.",prestige:900,hands:4,discards:2,focus:"rhyme",threshold:285,taunts:["«Un eco no basta para conquistar mi puente.»","«Haz que los finales se reconozcan.»","«La ciudad escucha. No desperdicies el turno.»"],blocked:"«Eso sí tiene eco. Mi réplica se queda sin voz.»"},
  {name:"Plaza del Ritmo",rival:"El Maestro del Pulso",portrait:"♫",rule:"Las series con la misma medida rompen su compás.",prestige:1200,hands:5,discards:2,focus:"meter",threshold:330,taunts:["«Si tropieza el ritmo, tropieza el poeta.»","«Cuenta antes de atacar.»","«La plaza no perdona un pulso débil.»"],blocked:"«Compás limpio. No encuentro dónde responder.»"},
  {name:"Jardines de la Imagen",rival:"La Dama de los Espejos",portrait:"✦",rule:"Los recursos distintos multiplican el impacto.",prestige:1500,hands:5,discards:2,focus:"devices",threshold:390,taunts:["«Descríbeme algo que no pueda ver en un espejo.»","«Una imagen pobre se rompe enseguida.»","«Sorpréndeme, o responderé.»"],blocked:"«Esa imagen sí abre una grieta en mis espejos.»"},
  {name:"Gran Anfiteatro",rival:"El Cronista Mayor",portrait:"♜",rule:"Forma, rima, ritmo e imágenes cuentan a la vez.",prestige:1900,hands:6,discards:2,focus:"all",threshold:470,taunts:["«Aquí no basta con rimar. Aquí se demuestra oficio.»","«Todo Versópolis está mirando.»","«La forma y la voz deben combatir juntas.»"],blocked:"«El anfiteatro responde a tu estrofa. Continúa.»"}
];

var muses=[
  {id:"eco",icon:"◌",rarity:"RARA",name:"Musa del Eco",desc:"Toda combinación con rima reconocible recibe un 30% extra.",label:"Rima ×1,30"},
  {id:"pulso",icon:"♫",rarity:"RARA",name:"Musa del Pulso",desc:"Si todos los versos comparten medida, la combinación recibe un 35% extra.",label:"Ritmo ×1,35"},
  {id:"imagen",icon:"✦",rarity:"RARA",name:"Musa de la Imagen",desc:"Cada recurso literario distinto aporta 55 puntos adicionales.",label:"+55 por recurso"},
  {id:"arquitecta",icon:"◇",rarity:"ÉPICA",name:"Musa Arquitecta",desc:"Los esquemas ABAB, ABBA y AABB reciben un 40% extra.",label:"Estrofas ×1,40"},
  {id:"duende",icon:"✧",rarity:"ÉPICA",name:"El Duende",desc:"La primera combinación de cada distrito recibe un 50% extra.",label:"Primera jugada ×1,50"},
  {id:"afinacion",icon:"♢",rarity:"ÉPICA",name:"Afinación Perfecta",desc:"Cuatro versos con una sola medida suman 180 puntos.",label:"+180 a 4 versos iguales"},
  {id:"coleccionista",icon:"❖",rarity:"LEGENDARIA",name:"Coleccionista de Imágenes",desc:"Si aparecen dos o más recursos distintos, suma 140 puntos.",label:"+140 por variedad"}
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
  var base={runs:0,wins:0,bestScore:0,bestStreak:0,districtsCleared:0,bestCombo:0};
  try{
    var newer=JSON.parse(localStorage.getItem(STORAGE)||"null");
    if(newer)return Object.assign(base,newer);
    var old2=JSON.parse(localStorage.getItem(OLD_STORAGE2)||"null");
    if(old2)return Object.assign(base,old2);
    var old1=JSON.parse(localStorage.getItem(OLD_STORAGE1)||"null");
    if(old1){base.runs=Number(old1.games||0);base.bestScore=Number(old1.bestScore||0);base.bestStreak=Number(old1.bestStreak||0);}
  }catch(err){}
  return base;
}
function saveCareer(){try{localStorage.setItem(STORAGE,JSON.stringify(career));}catch(err){}}
function cardById(id){for(var i=0;i<cards.length;i+=1)if(cards[i].id===id)return cards[i];return null;}
function museById(id){for(var i=0;i<muses.length;i+=1)if(muses[i].id===id)return muses[i];return null;}
function shuffle(list){var a=list.slice();for(var i=a.length-1;i>0;i-=1){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function pick(list){return list[Math.floor(Math.random()*list.length)];}
function show(name){["homeScreen","museScreen","gameScreen","resultScreen"].forEach(function(id){$(id).classList.toggle("hidden",id!==name);});}
function renderCareer(){
  $("careerLine").textContent=career.runs?"Mejor expedición: "+career.bestScore.toLocaleString("es-ES")+" · "+career.wins+" victorias completas · mejor impacto "+Number(career.bestCombo||0).toLocaleString("es-ES"):"Tu primera batalla poética te espera.";
  $("continueBtn").classList.toggle("hidden",!resumeSave);
}
function newRun(){
  run={version:3,districtIndex:0,runScore:0,rivalPrestige:0,maxPrestige:0,inspiration:3,maxInspiration:3,handsLeft:0,discardsLeft:0,deck:[],hand:[],selected:[],muses:[],awaitingMuse:true,districtStarted:false,finished:false,won:false,streak:0,bestStreak:0,firstPlay:true,locked:false,stats:{compositions:0,structured:0,districtsCleared:0,bestCombo:0},startedAt:Date.now()};
  resumeSave=null;
  showMuseChoice("Elige tu primera Musa","Define tu estilo antes de cruzar la Puerta de la Rima.");
  bridgeCall("sessionStarted");
}
function showMuseChoice(title,subtitle){
  if(!run)return;
  run.awaitingMuse=true;run.locked=false;show("museScreen");
  $("museTitle").textContent=title||"Elige una Musa";
  $("museSubtitle").textContent=subtitle||"Añade una nueva sinergia a tu expedición.";
  var available=muses.filter(function(m){return run.muses.indexOf(m.id)<0;});
  var choices=shuffle(available).slice(0,Math.min(3,available.length));
  $("museChoices").innerHTML="";
  choices.forEach(function(m){
    var b=document.createElement("button");b.type="button";b.className="museCard";
    b.innerHTML='<span class="museRarity">'+m.rarity+'</span><span class="museIcon">'+m.icon+'</span><h3>'+m.name+'</h3><p>'+m.desc+'</p><small>'+m.label+'</small>';
    b.addEventListener("click",function(){chooseMuse(m.id);});
    $("museChoices").appendChild(b);
  });
  renderOwnedMuses();
}
function renderOwnedMuses(){
  if(!run){$("ownedMuses").innerHTML="";return;}
  $("ownedMuses").innerHTML=run.muses.length?'<b>PODERES ACTIVOS</b>'+run.muses.map(function(id){var m=museById(id);return m?'<span>'+m.icon+" "+m.name+"</span>":"";}).join(""):'<span>Aún no tienes Musas activas.</span>';
}
function chooseMuse(id){
  if(!run||run.muses.indexOf(id)>=0)return;
  run.muses.push(id);run.awaitingMuse=false;setupDistrict();bridgeCall("checkpoint","muse_choice");
}
function buildDeck(){
  var d=districts[run.districtIndex],pool=cards.slice();
  if(d.focus==="rhyme")pool=cards.filter(function(c){return c.meter===8;});
  if(d.focus==="devices")pool=cards.filter(function(c){return c.devices.length>0;}).concat(cards.filter(function(c){return !c.devices.length;}).slice(0,6));
  return shuffle(pool.map(function(c){return c.id;}));
}
function setupDistrict(){
  var d=districts[run.districtIndex];
  run.maxPrestige=d.prestige;run.rivalPrestige=d.prestige;run.inspiration=run.maxInspiration;run.handsLeft=d.hands;run.discardsLeft=d.discards;run.deck=buildDeck();run.hand=[];run.selected=[];run.districtStarted=true;run.firstPlay=true;run.locked=false;
  drawToSeven();show("gameScreen");$("rivalSpeech").textContent="«"+d.rival+" acepta el duelo.»";renderGame();
}
function drawToSeven(){
  while(run.hand.length<7){
    if(!run.deck.length){run.deck=shuffle(cards.map(function(c){return c.id;}).filter(function(id){return run.hand.indexOf(id)<0;}));}
    if(!run.deck.length)break;
    var id=run.deck.shift();if(run.hand.indexOf(id)<0)run.hand.push(id);
  }
}
function toggleCard(id){
  if(!run||run.locked)return;
  var idx=run.selected.indexOf(id);
  if(idx>=0)run.selected.splice(idx,1);else if(run.selected.length<4)run.selected.push(id);else showToast("El atril admite un máximo de cuatro versos.","bad");
  renderGame();
}
function removeSelected(id){if(!run||run.locked)return;var i=run.selected.indexOf(id);if(i>=0){run.selected.splice(i,1);renderGame();}}
function moveSelected(id,dir){
  if(!run||run.locked)return;var i=run.selected.indexOf(id),j=i+dir;if(i<0||j<0||j>=run.selected.length)return;
  var t=run.selected[i];run.selected[i]=run.selected[j];run.selected[j]=t;renderGame();
}
function clearSelection(){if(!run||run.locked)return;run.selected=[];renderGame();}
function canonicalPattern(values){
  var seen={},next=0,letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return values.map(function(v){if(seen[v]===undefined){seen[v]=letters[next]||"X";next+=1;}return seen[v];}).join("");
}
function analyze(ids){
  var chosen=ids.map(cardById).filter(Boolean),n=chosen.length;
  if(!n)return{name:"Elige de 2 a 4 versos",score:0,tags:[],breakdown:[],structured:false,pattern:"",tier:""};
  var base=chosen.reduce(function(sum,c){return sum+c.value;},0),meters=chosen.map(function(c){return c.meter;}),rhymes=chosen.map(function(c){return c.rhyme;}),pattern=canonicalPattern(rhymes);
  var allMeter=n>=2&&meters.every(function(v){return v===meters[0];}),sameRhyme=n>=2&&rhymes.every(function(v){return v===rhymes[0];}),rhymeCounts={};
  rhymes.forEach(function(r){rhymeCounts[r]=(rhymeCounts[r]||0)+1;});
  var repeated=Object.keys(rhymeCounts).filter(function(r){return rhymeCounts[r]>=2;}),rhymeKind=chosen.every(function(c){return c.rhymeType===chosen[0].rhymeType;})?chosen[0].rhymeType:"mixta",devices=[];
  chosen.forEach(function(c){c.devices.forEach(function(d){if(devices.indexOf(d)<0)devices.push(d);});});
  var sameTheme=n>=3&&chosen.every(function(c){return c.theme===chosen[0].theme;}),formBonus=0,rhymeBonus=0,meterBonus=0,deviceBonus=devices.length*45,themeBonus=sameTheme?110:0,name="COMBINACIÓN LIBRE";
  if(n===2&&sameRhyme){name="PAREADO";rhymeBonus=150;}
  else if(n===3&&sameRhyme){name="TRÍO MONORRIMO";rhymeBonus=245;}
  else if(n===4&&sameRhyme){name="ESTROFA MONORRIMA";rhymeBonus=360;formBonus=80;}
  else if(n===4&&pattern==="ABAB"){if(rhymeKind==="consonante"&&allMeter&&meters[0]===8)name="CUARTETA";else if(rhymeKind==="consonante"&&allMeter&&meters[0]===11)name="SERVENTESIO";else name="ESQUEMA ABAB";rhymeBonus=310;formBonus=180;}
  else if(n===4&&pattern==="ABBA"){if(rhymeKind==="consonante"&&allMeter&&meters[0]===8)name="REDONDILLA";else if(rhymeKind==="consonante"&&allMeter&&meters[0]===11)name="CUARTETO";else name="ESQUEMA ABBA";rhymeBonus=330;formBonus=190;}
  else if(n===4&&pattern==="AABB"){name="DOBLE PAREADO";rhymeBonus=290;formBonus=140;}
  else if(repeated.length){name="CADENA DE ECOS";rhymeBonus=100*repeated.length;}
  if(allMeter&&n>=2)meterBonus=70*n+(n===4?80:0);
  var subtotal=base+rhymeBonus+formBonus+meterBonus+deviceBonus+themeBonus,multiplier=1,d=run?districts[run.districtIndex]:districts[0];
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
  var score=Math.round(subtotal*multiplier),tags=[];
  if(repeated.length||sameRhyme)tags.push("Rima "+rhymeKind+(n===4?" · "+pattern:""));
  if(allMeter)tags.push(meters[0]+" sílabas · ritmo uniforme");
  if(devices.length)tags.push(devices.join(" · "));
  if(sameTheme)tags.push("unidad temática: "+chosen[0].theme);
  var breakdown=[{label:"Versos",value:base},{label:"Rima y forma",value:rhymeBonus+formBonus},{label:"Ritmo",value:meterBonus},{label:"Recursos",value:deviceBonus+(d.focus==="devices"?devices.length*55:0)+(active.indexOf("imagen")>=0?devices.length*55:0)},{label:"Tema",value:themeBonus}];
  if(multiplier>1)breakdown.push({label:"Multiplicador",value:"×"+multiplier.toFixed(2).replace(".",",")});
  var structured=!!(rhymeBonus||meterBonus||devices.length>=2||sameTheme),tier=score>=900?"LEGENDARIA":score>=650?"MAGISTRAL":score>=430?"POTENTE":score>=280?"SÓLIDA":"IMPROVISADA";
  return{name:name,score:score,tags:tags,breakdown:breakdown,structured:structured,pattern:pattern,meters:meters,rhymeKind:rhymeKind,devices:devices,tier:tier};
}
function renderGame(){
  if(!run)return;
  var d=districts[run.districtIndex],analysis=analyze(run.selected),remainingPct=Math.max(0,Math.round(run.rivalPrestige/run.maxPrestige*100));
  $("gameScreen").dataset.theme=d.focus;
  $("districtStep").textContent="DISTRITO "+(run.districtIndex+1)+" / "+districts.length;$("districtName").textContent=d.name;$("rivalName").textContent=d.rival;$("rivalPortrait").textContent=d.portrait;$("rivalRule").textContent=d.rule;
  $("handsText").textContent=run.handsLeft;$("discardsText").textContent=run.discardsLeft;$("streakText").textContent="×"+run.streak;$("runScoreText").textContent=run.runScore.toLocaleString("es-ES");
  $("prestigeText").textContent=run.rivalPrestige.toLocaleString("es-ES")+" / "+run.maxPrestige.toLocaleString("es-ES");$("prestigeFill").style.width=remainingPct+"%";$("deckCount").textContent=run.deck.length;
  $("comboName").textContent=analysis.name;$("scorePreview").textContent=analysis.score.toLocaleString("es-ES");
  $("comboTags").innerHTML=analysis.tags.map(function(t){return"<span>"+t+"</span>";}).join("");
  $("analysisTitle").textContent=run.selected.length?analysis.tier+" · "+analysis.name:"Busca una combinación";
  $("analysisText").textContent=run.selected.length?describeAnalysis(analysis):"El orden importa. Combina rima, medida y recursos para aumentar el impacto.";
  $("analysisBreakdown").innerHTML=analysis.breakdown.map(function(row){return"<div><span>"+row.label+"</span><b>"+(typeof row.value==="number"?"+ "+row.value.toLocaleString("es-ES"):row.value)+"</b></div>";}).join("");
  $("codexTip").textContent=codexTip(analysis,d);$("turnPrompt").textContent=run.locked?"EL RIVAL RESPONDE":"CONSTRUYE TU ESTROFA";
  renderSlots();renderHand();renderActiveMuses();renderInspiration();renderRoute();
  $("playBtn").disabled=run.locked||run.selected.length<2||run.handsLeft<=0;$("discardBtn").disabled=run.locked||!run.selected.length||run.discardsLeft<=0;$("clearBtn").disabled=run.locked||!run.selected.length;
}
function codexTip(a,d){
  if(!run.selected.length)return d.focus==="rhyme"?"En este distrito, una rima reconocible recibe bonificación.":d.focus==="meter"?"Aquí conviene agrupar versos de 8 u 11 sílabas.":d.focus==="devices"?"Combinar recursos distintos aumenta mucho el impacto.":"El jefe recompensa estrofas completas y bien construidas.";
  if(a.score<d.threshold)return"Con este impacto el rival podrá replicar. Busca una combinación más fuerte.";
  return"Esta jugada supera el umbral de réplica: el rival quedará sin respuesta.";
}
function describeAnalysis(a){
  var parts=[];if(a.pattern&&run.selected.length===4)parts.push("Esquema "+a.pattern+".");if(a.meters&&a.meters.length&&a.meters.every(function(v){return v===a.meters[0];}))parts.push("Ritmo uniforme de "+a.meters[0]+" sílabas.");if(a.devices&&a.devices.length)parts.push("Recursos: "+a.devices.join(", ")+".");if(!parts.length)parts.push("Es válida, pero todavía puede adquirir una estructura poética más fuerte.");return parts.join(" ");
}
function renderInspiration(){
  $("inspirationHearts").innerHTML="";for(var i=0;i<run.maxInspiration;i+=1){var heart=document.createElement("i");heart.textContent="✦";if(i>=run.inspiration)heart.className="empty";$("inspirationHearts").appendChild(heart);}
}
function renderRoute(){
  $("routePips").innerHTML="";for(var i=0;i<districts.length;i+=1){var p=document.createElement("i");if(i<run.districtIndex)p.className="done";else if(i===run.districtIndex)p.className="current";$("routePips").appendChild(p);}
}
function renderSlots(){
  $("poemSlots").innerHTML="";
  for(var i=0;i<4;i+=1){
    var id=run.selected[i],c=id?cardById(id):null,slot=document.createElement("div");slot.className="poemSlot"+(c?" filled":"");
    if(c){
      var textNode=document.createElement("span");textNode.textContent=(i+1)+". "+c.text;slot.appendChild(textNode);
      var controls=document.createElement("span");controls.className="slotNumber";
      var up=document.createElement("button");up.type="button";up.textContent="↑";up.title="Subir verso";up.disabled=i===0;up.addEventListener("click",function(cardId){return function(e){e.stopPropagation();moveSelected(cardId,-1);};}(id));
      var down=document.createElement("button");down.type="button";down.textContent="↓";down.title="Bajar verso";down.disabled=i===run.selected.length-1;down.addEventListener("click",function(cardId){return function(e){e.stopPropagation();moveSelected(cardId,1);};}(id));
      var del=document.createElement("button");del.type="button";del.textContent="×";del.title="Quitar verso";del.addEventListener("click",function(cardId){return function(e){e.stopPropagation();removeSelected(cardId);};}(id));
      controls.appendChild(up);controls.appendChild(down);controls.appendChild(del);slot.appendChild(controls);
    }else slot.textContent="Verso "+(i+1);
    $("poemSlots").appendChild(slot);
  }
}
function renderHand(){
  $("hand").innerHTML="";
  run.hand.forEach(function(id){
    var c=cardById(id),b=document.createElement("button");b.type="button";b.className="verseCard"+(c.meter===11?" grand":"")+(c.devices.length?" enchanted":"")+(run.selected.indexOf(id)>=0?" selected":"");
    var device=c.devices.length?'<span class="device">'+c.devices[0]+"</span>":"";
    b.innerHTML='<span class="cardCorners"><b class="meterBadge">'+c.meter+'</b><b class="rhymeSeal">-'+c.rhyme+'</b></span><span class="verseText">'+c.text+'</span><span class="cardMeta">'+device+'<span class="theme">'+c.theme+"</span></span>";
    b.addEventListener("click",function(){toggleCard(id);});$("hand").appendChild(b);
  });
}
function renderActiveMuses(){
  $("activeMuses").innerHTML=run.muses.length?'<span class="eyebrow">MUSAS ACTIVAS</span>'+run.muses.map(function(id){var m=museById(id);return m?'<span>'+m.icon+" "+m.name+"</span>":"";}).join(""):"";
}
function showComboBurst(a,damage){
  if(comboTimer)clearTimeout(comboTimer);
  $("comboBurstKicker").textContent=a.tier==="LEGENDARIA"?"¡COMBINACIÓN LEGENDARIA!":a.tier+" · COMBINACIÓN";
  $("comboBurstTitle").textContent=a.name;$("comboBurstDamage").textContent="−"+damage.toLocaleString("es-ES")+" PRESTIGIO";$("comboBurstTags").textContent=a.tags.slice(0,2).join(" · ")||"Versos enlazados";
  $("comboBurst").classList.remove("show");void $("comboBurst").offsetWidth;$("comboBurst").classList.add("show");
  $("gameScreen").classList.remove("impact");void $("gameScreen").offsetWidth;$("gameScreen").classList.add("impact");
  $("rivalStage").classList.remove("hit");void $("rivalStage").offsetWidth;$("rivalStage").classList.add("hit");
  $("damageFloat").textContent="−"+damage.toLocaleString("es-ES");$("damageFloat").classList.remove("show");void $("damageFloat").offsetWidth;$("damageFloat").classList.add("show");
  comboTimer=setTimeout(function(){$("comboBurst").classList.remove("show");$("gameScreen").classList.remove("impact");$("rivalStage").classList.remove("hit");},1000);
}
function playSelection(){
  if(!run||run.locked||run.selected.length<2||run.handsLeft<=0)return;
  var d=districts[run.districtIndex],analysis=analyze(run.selected),played=run.selected.slice(),damage=analysis.score;
  run.locked=true;run.stats.compositions+=1;if(analysis.structured){run.stats.structured+=1;run.streak+=1;}else run.streak=0;
  run.bestStreak=Math.max(run.bestStreak,run.streak);run.stats.bestCombo=Math.max(run.stats.bestCombo,damage);run.runScore+=damage;run.rivalPrestige=Math.max(0,run.rivalPrestige-damage);run.handsLeft-=1;run.firstPlay=false;
  played.forEach(function(id){var i=run.hand.indexOf(id);if(i>=0)run.hand.splice(i,1);});run.selected=[];drawToSeven();renderGame();showComboBurst(analysis,damage);bridgeCall("checkpoint","composition_played");
  setTimeout(function(){
    if(!run||run.finished)return;
    if(run.rivalPrestige<=0){run.locked=false;winDistrict();return;}
    rivalCounter(analysis);
  },900);
}
function rivalCounter(analysis){
  var d=districts[run.districtIndex],weak=!analysis.structured||analysis.score<d.threshold;
  if(weak){
    run.inspiration=Math.max(0,run.inspiration-1);$("rivalSpeech").textContent=pick(d.taunts);$("playerPanel").classList.remove("hurt");void $("playerPanel").offsetWidth;$("playerPanel").classList.add("hurt");showToast("RÉPLICA DEL RIVAL · Pierdes 1 de Inspiración.","bad");
  }else{$("rivalSpeech").textContent=d.blocked;showToast("RÉPLICA BLOQUEADA · Tu combinación ha sido demasiado sólida.","ok");}
  run.locked=false;renderGame();bridgeCall("checkpoint","rival_reply");
  if(run.inspiration<=0){setTimeout(loseRun,650);return;}
  if(run.handsLeft<=0){setTimeout(loseRun,650);}
}
function discardSelection(){
  if(!run||run.locked||!run.selected.length||run.discardsLeft<=0)return;
  var thrown=run.selected.slice();thrown.forEach(function(id){var i=run.hand.indexOf(id);if(i>=0)run.hand.splice(i,1);});run.selected=[];run.discardsLeft-=1;drawToSeven();renderGame();showToast("Has renovado "+thrown.length+" carta"+(thrown.length===1?"":"s")+". No consume ronda.","");bridgeCall("checkpoint","discard");
}
function winDistrict(){
  if(!run||run.finished)return;
  var d=districts[run.districtIndex];run.stats.districtsCleared+=1;career.districtsCleared+=1;career.bestCombo=Math.max(Number(career.bestCombo||0),run.stats.bestCombo);saveCareer();
  $("rivalSpeech").textContent="«El distrito reconoce tu victoria.»";showToast("MAESTRO VENCIDO · "+d.rival+" pierde todo su Prestigio.","ok");bridgeCall("checkpoint","district_cleared");
  if(run.districtIndex>=districts.length-1){run.won=true;setTimeout(finishRun,850);return;}
  run.districtIndex+=1;run.districtStarted=false;run.selected=[];run.awaitingMuse=true;
  setTimeout(function(){showMuseChoice("Victoria: elige tu recompensa","Una nueva Musa se une a ti antes de entrar en "+districts[run.districtIndex].name+".");},850);
}
function loseRun(){if(!run||run.finished)return;run.won=false;finishRun();}
function finishRun(){
  if(!run||run.finished)return;run.finished=true;run.locked=false;career.runs+=1;if(run.won)career.wins+=1;career.bestScore=Math.max(career.bestScore,run.runScore);career.bestStreak=Math.max(career.bestStreak,run.bestStreak);career.bestCombo=Math.max(Number(career.bestCombo||0),run.stats.bestCombo);saveCareer();resumeSave=null;
  $("finalScore").textContent=run.runScore.toLocaleString("es-ES");$("districtsText").textContent=run.stats.districtsCleared+"/"+districts.length;$("compositionsText").textContent=run.stats.compositions;$("bestStreakText").textContent=run.bestStreak;$("bestComboText").textContent=run.stats.bestCombo.toLocaleString("es-ES");
  if(run.won){$("resultKicker").textContent="VERSÓPOLIS CONQUISTADA";$("resultTitle").textContent="La ciudad corea tus versos";$("resultText").textContent="Has derrotado a los cuatro maestros construyendo combinaciones de rima, ritmo, forma e imágenes. La próxima expedición puede crear una estrategia completamente distinta.";}
  else{$("resultKicker").textContent="DUELO PERDIDO";$("resultTitle").textContent=run.inspiration<=0?"Tu inspiración se ha agotado":"El maestro conserva su prestigio";$("resultText").textContent="Reordena los versos, reserva descartes para manos difíciles y busca combinaciones que superen el umbral de réplica del rival.";}
  show("resultScreen");renderCareer();bridgeCall("result",run.won?"finished":"defeat");
}
function showToast(text,kind){
  if(toastTimer)clearTimeout(toastTimer);$("toast").textContent=text;$("toast").className="toast"+(kind?" "+kind:"");toastTimer=setTimeout(function(){$("toast").classList.add("hidden");},2350);
}
function snapshot(){return{version:3,run:run,career:career};}
function migrateRun(oldRun){
  if(!oldRun)return null;
  var r=Object.assign({},oldRun),d=districts[Math.min(Number(r.districtIndex||0),districts.length-1)];
  r.version=3;r.maxPrestige=Number(r.maxPrestige||d.prestige);r.rivalPrestige=r.rivalPrestige!==undefined?Number(r.rivalPrestige):Math.max(0,r.maxPrestige-Number(r.districtScore||0));r.inspiration=Number(r.inspiration||3);r.maxInspiration=Number(r.maxInspiration||3);r.locked=false;
  if(!r.stats)r.stats={compositions:0,structured:0,districtsCleared:0,bestCombo:0};if(r.stats.bestCombo===undefined)r.stats.bestCombo=0;
  return r;
}
function restore(raw){
  try{
    var save=raw&&raw.run!==undefined?raw:raw&&raw.save?raw.save:raw;if(!save)return false;
    if(save.career){
      if(save.version===1||save.career.games!==undefined){career.runs=Math.max(career.runs,Number(save.career.games||0));career.bestScore=Math.max(career.bestScore,Number(save.career.bestScore||0));career.bestStreak=Math.max(career.bestStreak,Number(save.career.bestStreak||0));}
      else career=Object.assign(career,save.career);saveCareer();
    }
    if((save.version===2||save.version===3)&&save.run&&!save.run.finished){resumeSave=migrateRun(save.run);renderCareer();return true;}
    renderCareer();return !!save.career;
  }catch(err){return false;}
}
function continueRun(){
  if(!resumeSave)return;run=migrateRun(resumeSave);resumeSave=null;
  if(run.awaitingMuse)showMuseChoice("Elige una Musa","Continúa tu expedición con una nueva inspiración.");else{show("gameScreen");renderGame();}
  bridgeCall("sessionStarted");
}
function metrics(){
  var r=run||{},s=r.stats||{},attempts=Number(s.compositions||0),correct=Number(s.structured||0),accuracy=attempts?Math.round(correct/attempts*100):0,pct=0;
  if(r.finished&&r.won)pct=100;else if(r.districtIndex!==undefined){var max=Number(r.maxPrestige||districts[Math.min(r.districtIndex,districts.length-1)].prestige),rem=Number(r.rivalPrestige===undefined?max:r.rivalPrestige),part=max?Math.max(0,Math.min(1,1-rem/max)):0;pct=Math.round(((Number(r.districtIndex||0)+part)/districts.length)*100);}
  return{score:Number(r.runScore||0),attempts:attempts,correct:correct,errors:Math.max(0,attempts-correct),accuracy:accuracy,percentage:pct,bestStreak:Number(r.bestStreak||0),round:Number(r.districtIndex||0)+1,games:Number(career.runs||0),careerBest:Number(career.bestScore||0),districtsCleared:Number(s.districtsCleared||0),bestCombo:Number(s.bestCombo||0),inspiration:Number(r.inspiration||0),rivalPrestige:Number(r.rivalPrestige||0)};
}
function bridgeCall(name,arg){try{if(window.VersopolisBridge&&typeof window.VersopolisBridge[name]==="function")return window.VersopolisBridge[name](arg);}catch(err){}return null;}
function saveAndHome(){if(run&&!run.finished){run.locked=false;resumeSave=run;renderCareer();}if(window.VersopolisBridge&&window.VersopolisBridge.saveAndExit)window.VersopolisBridge.saveAndExit();else{show("homeScreen");renderCareer();}}

$("startBtn").addEventListener("click",newRun);$("continueBtn").addEventListener("click",continueRun);$("againBtn").addEventListener("click",newRun);$("homeBtn").addEventListener("click",function(){run=null;show("homeScreen");renderCareer();});
$("playBtn").addEventListener("click",playSelection);$("discardBtn").addEventListener("click",discardSelection);$("clearBtn").addEventListener("click",clearSelection);$("exitBtn").addEventListener("click",saveAndHome);$("museExitBtn").addEventListener("click",saveAndHome);
$("helpBtn").addEventListener("click",function(){$("modal").classList.remove("hidden");});$("closeModal").addEventListener("click",function(){$("modal").classList.add("hidden");});$("modal").addEventListener("click",function(e){if(e.target===$("modal"))$("modal").classList.add("hidden");});
window.VersopolisGame={snapshot:snapshot,restore:restore,metrics:metrics,get run(){return run;},get career(){return career;}};
renderCareer();
})();
