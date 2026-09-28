(function(){
"use strict";

var STORAGE="lenguarcade.versopolis.v04";
var OLD_STORAGE3="lenguarcade.versopolis.v03";
var OLD_STORAGE2="lenguarcade.versopolis.v02";
var OLD_STORAGE1="lenguarcade.versopolis.v01";
var $=function(id){return document.getElementById(id);};
var run=null,career=loadCareer(),toastTimer=null,resumeSave=null,comboTimer=null,deckView={mode:"inspect",from:"game"};

var districts=[
{name:"Puerta de la Rima",rival:"La Voz del Puente",portrait:"✒",rank:"DUELISTA",rule:"La rima hace más daño.",prestige:1050,hands:5,discards:2,focus:"rhyme",threshold:350,failPenalty:1,taunts:["«Sin contrato no hay poema que cruce mi puente.»","«Busca mejor entre tus pergaminos.»","«El eco correcto estaba en otra carta.»"],blocked:"«Has encontrado la llave de la rima.»"},
{name:"Plaza del Ritmo",rival:"El Maestro del Pulso",portrait:"♫",rank:"DUELISTA",rule:"La regularidad métrica multiplica el impacto.",prestige:1450,hands:5,discards:2,focus:"meter",threshold:420,failPenalty:1,taunts:["«Tu compás se ha quebrado.»","«La plaza oye cada sílaba.»","«No fuerces un verso que no encaja.»"],blocked:"«Ese pulso sí mantiene en pie la plaza.»"},
{name:"Jardines de la Imagen",rival:"La Dama de los Espejos",portrait:"✦",rank:"ÉLITE",rule:"Los recursos distintos abren grietas en sus espejos.",prestige:1800,hands:6,discards:2,focus:"devices",threshold:500,failPenalty:1,taunts:["«No veo la imagen que prometía tu contrato.»","«Tus palabras no han atravesado el espejo.»","«Un recurso aislado no basta.»"],blocked:"«Esa imagen no puedo reflejarla.»"},
{name:"Gran Anfiteatro",rival:"El Cronista Mayor",portrait:"♜",rank:"JEFE · FALLO = −2",rule:"Cambia el contrato en cada ronda y castiga los fallos.",prestige:2350,hands:7,discards:2,focus:"all",threshold:610,failPenalty:2,taunts:["«Versópolis no premia aproximaciones.»","«Contrato incumplido. El anfiteatro sentencia.»","«Aquí cada error cuesta el doble.»"],blocked:"«El anfiteatro reconoce la forma. Continúa.»"}
];

var muses=[
{id:"eco",icon:"◌",rarity:"RARA",name:"Musa del Eco",desc:"Toda combinación con rima reconocible recibe un 30% extra.",label:"Rima ×1,30"},
{id:"pulso",icon:"♫",rarity:"RARA",name:"Musa del Pulso",desc:"Si todos los versos comparten medida, la combinación recibe un 35% extra.",label:"Ritmo ×1,35"},
{id:"imagen",icon:"✦",rarity:"RARA",name:"Musa de la Imagen",desc:"Cada recurso literario distinto aporta 55 puntos adicionales.",label:"+55 por recurso"},
{id:"arquitecta",icon:"◇",rarity:"ÉPICA",name:"Musa Arquitecta",desc:"Los esquemas ABAB, ABBA y AABB reciben un 40% extra.",label:"Estrofas ×1,40"},
{id:"duende",icon:"✧",rarity:"ÉPICA",name:"El Duende",desc:"La primera combinación válida de cada distrito recibe un 50% extra.",label:"Primer ataque ×1,50"},
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

var startingBaseIds=["ino1","ino2","ino3","ente1","ente2","ente3","ado1","ado2","ado3","ia1","ia2","ia3","aa1","aa2","aa3","ea1","ea2","ea3","ana1","ana2","ana3","or1","or2","or3"];

var challenges=[
{id:"abba",title:"CERROJO ABBA",desc:"Construye cuatro versos con esquema de rima ABBA.",mult:1.55,min:0,test:function(a){return a.n===4&&a.pattern==="ABBA";},can:function(list){return canTwoRhymePairs(list);}},
{id:"abab",title:"CRUCE ABAB",desc:"Construye cuatro versos con esquema de rima ABAB.",mult:1.50,min:0,test:function(a){return a.n===4&&a.pattern==="ABAB";},can:function(list){return canTwoRhymePairs(list);}},
{id:"aabb",title:"DOBLE PAREADO",desc:"Construye cuatro versos con esquema AABB.",mult:1.45,min:1,test:function(a){return a.n===4&&a.pattern==="AABB";},can:function(list){return canTwoRhymePairs(list);}},
{id:"octo4",title:"PULSO OCTOSÍLABO",desc:"Juega cuatro versos y haz que todos midan 8 sílabas.",mult:1.38,min:0,test:function(a){return a.n===4&&a.allMeter&&a.meterValue===8;},can:function(list){return list.filter(function(c){return c.meter===8;}).length>=4;}},
{id:"hendeca4",title:"PULSO ENDECASÍLABO",desc:"Juega cuatro versos y haz que todos midan 11 sílabas.",mult:1.62,min:1,test:function(a){return a.n===4&&a.allMeter&&a.meterValue===11;},can:function(list){return list.filter(function(c){return c.meter===11;}).length>=4;}},
{id:"asonante",title:"ECO ASONANTE",desc:"Juega al menos dos versos que compartan una rima asonante.",mult:1.35,min:0,test:function(a){return a.n>=2&&a.sameRhyme&&a.rhymeKind==="asonante";},can:function(list){return canRhymeType(list,"asonante",2);}},
{id:"consonante",title:"ECO CONSONANTE",desc:"Juega al menos dos versos que compartan rima consonante.",mult:1.30,min:0,test:function(a){return a.n>=2&&a.sameRhyme&&a.rhymeKind==="consonante";},can:function(list){return canRhymeType(list,"consonante",2);}},
{id:"monorhyme",title:"JURAMENTO MONORRIMO",desc:"Juega tres o cuatro versos con la misma terminación.",mult:1.52,min:1,test:function(a){return a.n>=3&&a.sameRhyme;},can:function(list){return maxGroup(list,"rhyme")>=3;}},
{id:"devices2",title:"DOBLE IMAGEN",desc:"Activa al menos dos recursos literarios distintos.",mult:1.48,min:2,test:function(a){return a.devices.length>=2;},can:function(list){return distinctDevices(list)>=2;}},
{id:"theme3",title:"UNIDAD TEMÁTICA",desc:"Juega tres o cuatro versos del mismo tema.",mult:1.42,min:2,test:function(a){return a.n>=3&&a.sameTheme;},can:function(list){return maxGroup(list,"theme")>=3;}},
{id:"fullform",title:"ESTROFA CON FORMA",desc:"Construye una forma reconocible de cuatro versos.",mult:1.58,min:3,test:function(a){return a.n===4&&a.formBonus>0;},can:function(list){return canTwoRhymePairs(list);}}
];

var events=[
{id:"archivo",icon:"⌘",title:"El Archivo de los Márgenes",text:"El archivista te deja tocar la estructura del mazo. Una decisión pequeña puede salvar —o arruinar— los contratos del próximo distrito.",choices:[
{icon:"＋",title:"Incorporar un verso",desc:"Elige una carta entre tres pergaminos nuevos.",reward:"Aumenta el mazo",action:"draft"},
{icon:"✦",title:"Pulir un verso",desc:"Mejora una carta: +25 de valor base. Máximo nivel III.",reward:"Mejora permanente",action:"upgrade"},
{icon:"−",title:"Depurar el mazo",desc:"Elimina para siempre una carta. Un mazo más fino roba mejor.",reward:"Más consistencia",action:"remove"}]},
{id:"copista",icon:"❖",title:"El Taller del Copista",text:"El copista puede repetir tus mejores líneas, reforzarlas o darte más margen para buscar una mano concreta.",choices:[
{icon:"⧉",title:"Duplicar un verso",desc:"Elige una carta y añade una copia idéntica a tu mazo.",reward:"Refuerza una rima",action:"duplicate"},
{icon:"✦",title:"Iluminar un verso",desc:"Sube un nivel una carta del mazo.",reward:"+25 de valor",action:"upgrade"},
{icon:"♻",title:"Bolsa de descartes",desc:"Ganas un descarte adicional en todos los duelos restantes.",reward:"+1 descarte por duelo",action:"discardPlus"}]},
{id:"fuente",icon:"♢",title:"La Fuente de la Inspiración",text:"El agua devuelve claridad, pero también puede alterar la manera en que afrontas las próximas manos.",choices:[
{icon:"♥",title:"Recobrar el aliento",desc:"Recupera hasta 2 puntos de Inspiración.",reward:"+2 Inspiración",action:"heal2"},
{icon:"✥",title:"Ensanchamiento",desc:"Aumenta en 1 el tamaño permanente de tu mano.",reward:"+1 carta en mano",action:"handPlus"},
{icon:"✧",title:"Reserva interior",desc:"Aumenta tu Inspiración máxima en 1 y recupera 1.",reward:"+1 máximo",action:"maxInspiration"}]},
{id:"mercado",icon:"⚖",title:"El Mercado de los Versos",text:"Los mercaderes conocen pergaminos que no aparecían en tu mazo inicial. También compran aquello que te estorba.",choices:[
{icon:"★",title:"Pergamino selecto",desc:"Elige entre tres cartas de la reserva completa.",reward:"Carta nueva",action:"draftRare"},
{icon:"−",title:"Vender un estorbo",desc:"Elimina definitivamente una carta del mazo.",reward:"Mazo más fino",action:"remove"},
{icon:"♻",title:"Tinta de búsqueda",desc:"Añade un descarte extra a cada combate restante.",reward:"+1 descarte",action:"discardPlus"}]}
];

function loadCareer(){
 var base={runs:0,wins:0,bestScore:0,bestStreak:0,districtsCleared:0,bestCombo:0};
 try{
  var newer=JSON.parse(localStorage.getItem(STORAGE)||"null");if(newer)return Object.assign(base,newer);
  var old3=JSON.parse(localStorage.getItem(OLD_STORAGE3)||"null");if(old3)return Object.assign(base,old3);
  var old2=JSON.parse(localStorage.getItem(OLD_STORAGE2)||"null");if(old2)return Object.assign(base,old2);
  var old1=JSON.parse(localStorage.getItem(OLD_STORAGE1)||"null");if(old1){base.runs=Number(old1.games||0);base.bestScore=Number(old1.bestScore||0);base.bestStreak=Number(old1.bestStreak||0);}
 }catch(err){}
 return base;
}
function saveCareer(){try{localStorage.setItem(STORAGE,JSON.stringify(career));}catch(err){}}
function baseCard(id){for(var i=0;i<cards.length;i+=1)if(cards[i].id===id)return cards[i];return null;}
function museById(id){for(var i=0;i<muses.length;i+=1)if(muses[i].id===id)return muses[i];return null;}
function challengeById(id){for(var i=0;i<challenges.length;i+=1)if(challenges[i].id===id)return challenges[i];return null;}
function eventById(id){for(var i=0;i<events.length;i+=1)if(events[i].id===id)return events[i];return null;}
function shuffle(list){var a=list.slice();for(var i=a.length-1;i>0;i-=1){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}
function pick(list){return list[Math.floor(Math.random()*list.length)];}
function uid(){return"v_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7);}
function makeInstance(baseId,level){return{uid:uid(),baseId:baseId,level:Number(level||0)};}
function instanceByUid(id){if(!run||!run.cardPool)return null;for(var i=0;i<run.cardPool.length;i+=1)if(run.cardPool[i].uid===id)return run.cardPool[i];return null;}
function effectiveCard(id){
 var inst=instanceByUid(id),b=inst&&baseCard(inst.baseId);if(!inst||!b)return null;
 return Object.assign({},b,{uid:inst.uid,level:inst.level,value:b.value+inst.level*25});
}
function collectionCards(){return(run&&run.cardPool||[]).map(function(x){return effectiveCard(x.uid);}).filter(Boolean);}
function familyOf(c){if(c.level>=3)return"master";if(c.meter===11)return"rhythm";if(c.rhymeType==="asonante")return"echo";if(c.devices.length)return"image";return"rhyme";}
function familyLabel(f){return{rhyme:"RIMA",echo:"ECO",rhythm:"RITMO",image:"IMAGEN",master:"MAESTRO"}[f]||"VERSO";}
function stars(level){var s="";for(var i=0;i<level;i+=1)s+="★";return s;}
function show(name){["homeScreen","museScreen","eventScreen","deckScreen","gameScreen","resultScreen"].forEach(function(id){$(id).classList.toggle("hidden",id!==name);});}
function renderCareer(){
 $("careerLine").textContent=career.runs?"Mejor expedición: "+career.bestScore.toLocaleString("es-ES")+" · "+career.wins+" victorias · mejor impacto "+Number(career.bestCombo||0).toLocaleString("es-ES"):"Tu primera expedición te espera.";
 $("continueBtn").classList.toggle("hidden",!resumeSave);
}

function newRun(){
 run={version:4,districtIndex:0,runScore:0,rivalPrestige:0,maxPrestige:0,inspiration:4,maxInspiration:4,handsLeft:0,discardsLeft:0,bonusDiscards:0,handSize:7,cardPool:startingBaseIds.map(function(id){return makeInstance(id,0);}),deck:[],discardPile:[],hand:[],selected:[],muses:[],challengeId:null,lastChallengeId:null,awaitingMuse:true,awaitingEvent:false,eventId:null,districtStarted:false,finished:false,won:false,streak:0,bestStreak:0,firstPlay:true,locked:false,lastEventId:null,stats:{compositions:0,structured:0,districtsCleared:0,bestCombo:0,contracts:0,failedContracts:0},startedAt:Date.now()};
 resumeSave=null;showMuseChoice("Elige tu primera Musa","Define la estrategia de tu mazo antes de cruzar la Puerta de la Rima.");bridgeCall("sessionStarted");
}
function showMuseChoice(title,subtitle){
 if(!run)return;run.awaitingMuse=true;run.locked=false;show("museScreen");
 $("museTitle").textContent=title||"Elige una Musa";$("museSubtitle").textContent=subtitle||"Añade una sinergia a tu expedición.";
 var available=muses.filter(function(m){return run.muses.indexOf(m.id)<0;}),choices=shuffle(available).slice(0,Math.min(3,available.length));
 $("museChoices").innerHTML="";
 choices.forEach(function(m){var b=document.createElement("button");b.type="button";b.className="museCard";b.innerHTML='<span class="museRarity">'+m.rarity+'</span><span class="museIcon">'+m.icon+'</span><h3>'+m.name+'</h3><p>'+m.desc+'</p><small>'+m.label+'</small>';b.addEventListener("click",function(){chooseMuse(m.id);});$("museChoices").appendChild(b);});
 renderOwnedMuses();
}
function renderOwnedMuses(){
 if(!run){$("ownedMuses").innerHTML="";return;}
 $("ownedMuses").innerHTML=run.muses.length?'<b>PODERES ACTIVOS</b>'+run.muses.map(function(id){var m=museById(id);return m?'<span>'+m.icon+" "+m.name+"</span>":"";}).join(""):'<span>Aún no tienes Musas activas.</span>';
}
function chooseMuse(id){if(!run||run.muses.indexOf(id)>=0)return;run.muses.push(id);run.awaitingMuse=false;setupDistrict();bridgeCall("checkpoint","muse_choice");}

function setupDistrict(){
 var d=districts[run.districtIndex];
 run.maxPrestige=d.prestige;run.rivalPrestige=d.prestige;run.handsLeft=d.hands;run.discardsLeft=d.discards+Number(run.bonusDiscards||0);run.deck=shuffle(run.cardPool.map(function(x){return x.uid;}));run.discardPile=[];run.hand=[];run.selected=[];run.districtStarted=true;run.firstPlay=true;run.locked=false;
 drawToHand();rollChallenge();show("gameScreen");$("rivalSpeech").textContent="«"+d.rival+" acepta el duelo.»";renderGame();
}
function drawToHand(){
 while(run.hand.length<run.handSize){
  if(!run.deck.length&&run.discardPile.length){run.deck=shuffle(run.discardPile);run.discardPile=[];showToast("El descarte vuelve al mazo.","");}
  if(!run.deck.length)break;
  var id=run.deck.shift();if(run.hand.indexOf(id)<0)run.hand.push(id);
 }
}
function moveSelectedToDiscard(){
 var played=run.selected.slice();played.forEach(function(id){var i=run.hand.indexOf(id);if(i>=0)run.hand.splice(i,1);run.discardPile.push(id);});run.selected=[];drawToHand();return played;
}

function canTwoRhymePairs(list){var counts={};list.forEach(function(c){counts[c.rhyme]=(counts[c.rhyme]||0)+1;});return Object.keys(counts).filter(function(k){return counts[k]>=2;}).length>=2;}
function canRhymeType(list,type,count){var groups={};list.filter(function(c){return c.rhymeType===type;}).forEach(function(c){groups[c.rhyme]=(groups[c.rhyme]||0)+1;});return Object.keys(groups).some(function(k){return groups[k]>=count;});}
function maxGroup(list,key){var counts={},max=0;list.forEach(function(c){counts[c[key]]=(counts[c[key]]||0)+1;max=Math.max(max,counts[c[key]]);});return max;}
function distinctDevices(list){var d=[];list.forEach(function(c){c.devices.forEach(function(x){if(d.indexOf(x)<0)d.push(x);});});return d.length;}
function rollChallenge(){
 var pool=collectionCards(),eligible=challenges.filter(function(c){return c.min<=run.districtIndex&&c.can(pool)&&c.id!==run.challengeId;});
 if(!eligible.length)eligible=challenges.filter(function(c){return c.min<=run.districtIndex&&c.can(pool);});
 var ch=pick(eligible.length?eligible:[challenges[0]]);run.lastChallengeId=run.challengeId;run.challengeId=ch.id;
}
function currentChallenge(){return challengeById(run&&run.challengeId)||challenges[0];}

function toggleCard(id){
 if(!run||run.locked)return;var idx=run.selected.indexOf(id);
 if(idx>=0)run.selected.splice(idx,1);else if(run.selected.length<4)run.selected.push(id);else showToast("El atril admite cuatro pergaminos como máximo.","bad");
 renderGame();
}
function removeSelected(id){if(!run||run.locked)return;var i=run.selected.indexOf(id);if(i>=0){run.selected.splice(i,1);renderGame();}}
function moveSelected(id,dir){if(!run||run.locked)return;var i=run.selected.indexOf(id),j=i+dir;if(i<0||j<0||j>=run.selected.length)return;var t=run.selected[i];run.selected[i]=run.selected[j];run.selected[j]=t;renderGame();}
function clearSelection(){if(!run||run.locked)return;run.selected=[];renderGame();}
function canonicalPattern(values){var seen={},next=0,letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ";return values.map(function(v){if(seen[v]===undefined){seen[v]=letters[next]||"X";next+=1;}return seen[v];}).join("");}

function analyze(ids){
 var chosen=ids.map(effectiveCard).filter(Boolean),n=chosen.length;
 if(!n)return{name:"Elige de 2 a 4 versos",score:0,tags:[],breakdown:[],structured:false,pattern:"",tier:"",n:0,devices:[],formBonus:0,allMeter:false,meterValue:0,sameRhyme:false,rhymeKind:"",sameTheme:false};
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
 var subtotal=base+rhymeBonus+formBonus+meterBonus+deviceBonus+themeBonus,multiplier=1,d=districts[run.districtIndex],active=run.muses;
 if(d.focus==="rhyme"&&rhymeBonus>0)multiplier*=1.25;if(d.focus==="meter"&&allMeter)multiplier*=1.28;if(d.focus==="devices")subtotal+=devices.length*55;if(d.focus==="all"&&formBonus>0)multiplier*=1.18;
 if(active.indexOf("eco")>=0&&rhymeBonus>0)multiplier*=1.30;if(active.indexOf("pulso")>=0&&allMeter)multiplier*=1.35;if(active.indexOf("imagen")>=0)subtotal+=devices.length*55;
 if(active.indexOf("arquitecta")>=0&&n===4&&(pattern==="ABAB"||pattern==="ABBA"||pattern==="AABB"))multiplier*=1.40;if(active.indexOf("duende")>=0&&run.firstPlay)multiplier*=1.50;if(active.indexOf("afinacion")>=0&&n===4&&allMeter)subtotal+=180;if(active.indexOf("coleccionista")>=0&&devices.length>=2)subtotal+=140;
 var score=Math.round(subtotal*multiplier),tags=[];
 if(repeated.length||sameRhyme)tags.push("Rima "+rhymeKind+(n===4?" · "+pattern:""));if(allMeter)tags.push(meters[0]+" sílabas · ritmo uniforme");if(devices.length)tags.push(devices.join(" · "));if(sameTheme)tags.push("tema: "+chosen[0].theme);
 var breakdown=[{label:"Versos",value:base},{label:"Rima y forma",value:rhymeBonus+formBonus},{label:"Ritmo",value:meterBonus},{label:"Recursos",value:deviceBonus+(d.focus==="devices"?devices.length*55:0)+(active.indexOf("imagen")>=0?devices.length*55:0)},{label:"Tema",value:themeBonus}];
 if(multiplier>1)breakdown.push({label:"Sinergias",value:"×"+multiplier.toFixed(2).replace(".",",")});
 var structured=!!(rhymeBonus||meterBonus||devices.length>=2||sameTheme),tier=score>=900?"LEGENDARIA":score>=650?"MAGISTRAL":score>=430?"POTENTE":score>=280?"SÓLIDA":"IMPROVISADA";
 return{name:name,score:score,tags:tags,breakdown:breakdown,structured:structured,pattern:pattern,meters:meters,allMeter:allMeter,meterValue:allMeter?meters[0]:0,sameRhyme:sameRhyme,rhymeKind:rhymeKind,devices:devices,sameTheme:sameTheme,formBonus:formBonus,tier:tier,n:n};
}

function contractMet(a){return currentChallenge().test(a);}
function contractDamage(a){return Math.round(a.score*currentChallenge().mult);}
function renderGame(){
 if(!run)return;
 var d=districts[run.districtIndex],a=analyze(run.selected),ch=currentChallenge(),met=run.selected.length>=2&&contractMet(a),remainingPct=Math.max(0,Math.round(run.rivalPrestige/run.maxPrestige*100));
 $("gameScreen").dataset.theme=d.focus;$("districtStep").textContent="DISTRITO "+(run.districtIndex+1)+" / "+districts.length;$("districtName").textContent=d.name;$("rivalRank").textContent=d.rank;$("rivalName").textContent=d.rival;$("rivalPortrait").textContent=d.portrait;$("rivalRule").textContent=d.rule;
 $("handsText").textContent=run.handsLeft;$("discardsText").textContent=run.discardsLeft;$("streakText").textContent="×"+run.streak;$("runScoreText").textContent=run.runScore.toLocaleString("es-ES");
 $("prestigeText").textContent=run.rivalPrestige.toLocaleString("es-ES")+" / "+run.maxPrestige.toLocaleString("es-ES");$("prestigeFill").style.width=remainingPct+"%";
 $("deckCount").textContent=run.cardPool.length;$("discardCount").textContent=run.discardPile.length;$("handSizeText").textContent=run.handSize;$("drawPileCount").textContent=run.deck.length;
 $("comboName").textContent=a.name;$("scorePreview").textContent=(met?contractDamage(a):a.score).toLocaleString("es-ES");$("comboTags").innerHTML=a.tags.map(function(t){return"<span>"+t+"</span>";}).join("");
 $("analysisTitle").textContent=run.selected.length?a.tier+" · "+a.name:"Busca una combinación";$("analysisText").textContent=run.selected.length?describeAnalysis(a):"El contrato manda. Una estrofa potente no sirve si no cumple el reto del turno.";
 $("analysisBreakdown").innerHTML=a.breakdown.map(function(row){return"<div><span>"+row.label+"</span><b>"+(typeof row.value==="number"?"+ "+row.value.toLocaleString("es-ES"):row.value)+"</b></div>";}).join("");
 $("challengeTitle").textContent=ch.title;$("challengeDesc").textContent=ch.desc;$("challengeMultiplier").textContent="×"+String(ch.mult).replace(".",",");
 $("challengeBanner").className="challengeBanner"+(run.selected.length>=2?(met?" met":" fail"):"");$("challengeState").textContent=run.selected.length<2?"PENDIENTE":met?"CUMPLIDO":"BLOQUEADO";
 $("codexTip").textContent=contractTip(a,met,d,ch);renderSlots();renderHand();renderActiveMuses();renderInspiration();renderRoute();
 var play=$("playBtn");play.classList.remove("validAttack","invalidAttack");
 if(run.selected.length<2){play.textContent="ELIGE VERSOS";play.disabled=true;}
 else if(met){play.textContent="⚔ ATACAR · "+("×"+String(ch.mult).replace(".",","));play.disabled=run.locked||run.handsLeft<=0;play.classList.add("validAttack");}
 else{play.textContent="✖ FORZAR JUGADA";play.disabled=run.locked||run.handsLeft<=0;play.classList.add("invalidAttack");}
 $("discardBtn").disabled=run.locked||!run.selected.length||run.discardsLeft<=0;
 $("shuffleHandBtn").disabled=run.locked||!run.hand.length||run.discardsLeft<=0;
 $("clearBtn").disabled=run.locked||!run.selected.length;
}
function contractTip(a,met,d,ch){
 if(!run.selected.length)return"Contrato: "+ch.desc+" Usa descartes antes de gastar una ronda.";
 if(!met)return"NO CUMPLE: si fuerzas esta jugada no atacarás y perderás "+(d.failPenalty)+" de Inspiración.";
 var dmg=contractDamage(a);if(dmg<d.threshold)return"CUMPLE, pero el impacto es bajo: el rival podría replicar después del ataque.";
 return"CUMPLE Y BLOQUEA: el contrato multiplica tu impacto y la réplica queda anulada.";
}
function describeAnalysis(a){var parts=[];if(a.pattern&&a.n===4)parts.push("Esquema "+a.pattern+".");if(a.allMeter)parts.push("Ritmo uniforme de "+a.meterValue+" sílabas.");if(a.devices.length)parts.push("Recursos: "+a.devices.join(", ")+".");if(!parts.length)parts.push("La selección todavía carece de una estructura fuerte.");return parts.join(" ");}

function renderInspiration(){$("inspirationHearts").innerHTML="";for(var i=0;i<run.maxInspiration;i+=1){var heart=document.createElement("i");heart.textContent="✦";if(i>=run.inspiration)heart.className="empty";$("inspirationHearts").appendChild(heart);}}
function renderRoute(){$("routePips").innerHTML="";for(var i=0;i<districts.length;i+=1){var p=document.createElement("i");if(i<run.districtIndex)p.className="done";else if(i===run.districtIndex)p.className="current";$("routePips").appendChild(p);}}
function renderSlots(){
 $("poemSlots").innerHTML="";
 for(var i=0;i<4;i+=1){var id=run.selected[i],c=id?effectiveCard(id):null,slot=document.createElement("div");slot.className="poemSlot"+(c?" filled":"");
  if(c){var text=document.createElement("span");text.textContent=(i+1)+". "+c.text;slot.appendChild(text);var controls=document.createElement("span");controls.className="slotNumber";
   var up=document.createElement("button");up.type="button";up.textContent="↑";up.disabled=i===0;up.addEventListener("click",function(cardId){return function(e){e.stopPropagation();moveSelected(cardId,-1);};}(id));
   var down=document.createElement("button");down.type="button";down.textContent="↓";down.disabled=i===run.selected.length-1;down.addEventListener("click",function(cardId){return function(e){e.stopPropagation();moveSelected(cardId,1);};}(id));
   var del=document.createElement("button");del.type="button";del.textContent="×";del.addEventListener("click",function(cardId){return function(e){e.stopPropagation();removeSelected(cardId);};}(id));
   controls.appendChild(up);controls.appendChild(down);controls.appendChild(del);slot.appendChild(controls);
  }else slot.textContent="Verso "+(i+1);$("poemSlots").appendChild(slot);
 }
}
function cardHTML(c){
 var fam=familyOf(c),device=c.devices.length?'<span class="device">'+c.devices[0]+"</span>":"";
 return'<span class="cardCorners"><b class="meterBadge">'+c.meter+'</b><b class="rhymeSeal">-'+c.rhyme+'</b></span><span class="verseText">'+c.text+'</span><span class="cardMeta"><span class="cardFamily">'+familyLabel(fam)+'</span>'+device+'<span class="theme">'+c.theme+'</span></span>'+(c.level?'<span class="cardLevel">'+stars(c.level)+'</span>':"");
}
function cardHelpsContract(c){
 var ch=currentChallenge();if(!ch||!run.selected.length)return false;
 var testIds=run.selected.indexOf(c.uid)>=0?run.selected.slice():run.selected.concat([c.uid]);if(testIds.length>4)return false;
 return ch.test(analyze(testIds));
}
function renderHand(){
 $("hand").innerHTML="";
 run.hand.forEach(function(id){var c=effectiveCard(id),b=document.createElement("button"),fam=familyOf(c);b.type="button";b.className="verseCard family-"+fam+(run.selected.indexOf(id)>=0?" selected":"")+(cardHelpsContract(c)?" cardSynergy":"");b.innerHTML=cardHTML(c);b.addEventListener("click",function(){toggleCard(id);});$("hand").appendChild(b);});
}
function renderActiveMuses(){$("activeMuses").innerHTML=run.muses.length?'<span class="eyebrow">MUSAS ACTIVAS</span>'+run.muses.map(function(id){var m=museById(id);return m?'<span>'+m.icon+" "+m.name+"</span>":"";}).join(""):"";}

function showBurst(kicker,title,big,tags,hit){
 if(comboTimer)clearTimeout(comboTimer);$("comboBurstKicker").textContent=kicker;$("comboBurstTitle").textContent=title;$("comboBurstDamage").textContent=big;$("comboBurstTags").textContent=tags||"";
 $("comboBurst").classList.remove("show");void $("comboBurst").offsetWidth;$("comboBurst").classList.add("show");
 if(hit){$("gameScreen").classList.remove("impact");void $("gameScreen").offsetWidth;$("gameScreen").classList.add("impact");$("rivalStage").classList.remove("hit");void $("rivalStage").offsetWidth;$("rivalStage").classList.add("hit");}
 comboTimer=setTimeout(function(){$("comboBurst").classList.remove("show");$("gameScreen").classList.remove("impact");$("rivalStage").classList.remove("hit");},1000);
}
function playSelection(){
 if(!run||run.locked||run.selected.length<2||run.handsLeft<=0)return;
 var d=districts[run.districtIndex],a=analyze(run.selected),ch=currentChallenge(),met=contractMet(a);
 run.locked=true;run.handsLeft-=1;run.stats.compositions+=1;
 if(!met){run.stats.failedContracts+=1;run.streak=0;run.inspiration=Math.max(0,run.inspiration-d.failPenalty);moveSelectedToDiscard();$("rivalSpeech").textContent=pick(d.taunts);$("playerPanel").classList.remove("hurt");void $("playerPanel").offsetWidth;$("playerPanel").classList.add("hurt");showBurst("CONTRATO FALLIDO",ch.title,"SIN ATAQUE","−"+d.failPenalty+" Inspiración",false);renderGame();bridgeCall("checkpoint","contract_failed");setTimeout(afterFailedTurn,900);return;}
 var damage=contractDamage(a);run.stats.contracts+=1;if(a.structured){run.stats.structured+=1;run.streak+=1;}else run.streak=0;run.bestStreak=Math.max(run.bestStreak,run.streak);run.stats.bestCombo=Math.max(run.stats.bestCombo,damage);run.runScore+=damage;run.rivalPrestige=Math.max(0,run.rivalPrestige-damage);run.firstPlay=false;moveSelectedToDiscard();renderGame();
 $("damageFloat").textContent="−"+damage.toLocaleString("es-ES");$("damageFloat").classList.remove("show");void $("damageFloat").offsetWidth;$("damageFloat").classList.add("show");showBurst(a.tier+" · CONTRATO CUMPLIDO",a.name,"−"+damage.toLocaleString("es-ES")+" PRESTIGIO",ch.title+" · "+(a.tags[0]||""),true);bridgeCall("checkpoint","contract_attack");
 setTimeout(function(){if(!run||run.finished)return;if(run.rivalPrestige<=0){run.locked=false;winDistrict();return;}rivalCounter(damage);},900);
}
function afterFailedTurn(){
 if(!run||run.finished)return;run.locked=false;if(run.inspiration<=0||run.handsLeft<=0){loseRun();return;}rollChallenge();renderGame();
}
function rivalCounter(damage){
 var d=districts[run.districtIndex],weak=damage<d.threshold;
 if(weak){run.inspiration=Math.max(0,run.inspiration-1);$("rivalSpeech").textContent="«Cumpliste el contrato, pero tu golpe dejó hueco para mi réplica.»";$("playerPanel").classList.remove("hurt");void $("playerPanel").offsetWidth;$("playerPanel").classList.add("hurt");showToast("RÉPLICA · El impacto fue insuficiente: −1 Inspiración.","bad");}
 else{$("rivalSpeech").textContent=d.blocked;showToast("RÉPLICA BLOQUEADA · Contrato e impacto superados.","ok");}
 run.locked=false;bridgeCall("checkpoint","rival_reply");if(run.inspiration<=0||run.handsLeft<=0){renderGame();setTimeout(loseRun,500);return;}rollChallenge();renderGame();
}
function discardSelection(){
 if(!run||run.locked||!run.selected.length||run.discardsLeft<=0)return;
 var n=run.selected.length;moveSelectedToDiscard();run.discardsLeft-=1;renderGame();
 showToast("DESCARTAR MESA · Cambias "+n+" pergamino"+(n===1?"":"s")+" y conservas la ronda.","");
 bridgeCall("checkpoint","discard_table");
}
function shuffleHand(){
 if(!run||run.locked||!run.hand.length||run.discardsLeft<=0)return;
 var n=run.hand.length;
 run.selected=[];
 run.hand.slice().forEach(function(id){run.discardPile.push(id);});
 run.hand=[];
 run.discardsLeft-=1;
 drawToHand();
 renderGame();
 showToast("BARAJAR MANO · Renuevas "+n+" pergamino"+(n===1?"":"s")+" y conservas la ronda.","");
 bridgeCall("checkpoint","shuffle_hand");
}

function winDistrict(){
 if(!run||run.finished)return;var d=districts[run.districtIndex];run.stats.districtsCleared+=1;career.districtsCleared+=1;career.bestCombo=Math.max(Number(career.bestCombo||0),run.stats.bestCombo);saveCareer();$("rivalSpeech").textContent="«El distrito reconoce tu victoria.»";showToast("MAESTRO VENCIDO · "+d.rival+" pierde todo su Prestigio.","ok");bridgeCall("checkpoint","district_cleared");
 if(run.districtIndex>=districts.length-1){run.won=true;setTimeout(finishRun,850);return;}
 run.districtIndex+=1;run.districtStarted=false;run.selected=[];run.awaitingEvent=true;setTimeout(function(){showEvent();},850);
}

function showEvent(){
 if(!run)return;run.awaitingEvent=true;run.locked=false;
 var choices=events.filter(function(e){return e.id!==run.lastEventId;}),ev=run.eventId?eventById(run.eventId):pick(choices.length?choices:events);run.eventId=ev.id;run.lastEventId=ev.id;show("eventScreen");
 $("eventIcon").textContent=ev.icon;$("eventTitle").textContent=ev.title;$("eventText").textContent=ev.text;$("eventChoices").className="eventChoices";$("eventChoices").innerHTML="";
 ev.choices.forEach(function(c){var b=document.createElement("button");b.type="button";b.className="eventChoice";b.innerHTML='<span class="eventChoiceIcon">'+c.icon+'</span><b>'+c.title+'</b><p>'+c.desc+'</p><small>'+c.reward+'</small>';b.addEventListener("click",function(){resolveEventAction(c.action);});$("eventChoices").appendChild(b);});
 renderEventSummary();
}
function renderEventSummary(){$("eventRunSummary").innerHTML='<span>✦ Inspiración '+run.inspiration+"/"+run.maxInspiration+'</span><span>▤ '+run.cardPool.length+' cartas</span><span>♻ +'+run.bonusDiscards+' descartes</span><span>☰ mano '+run.handSize+'</span>';}
function resolveEventAction(action){
 if(action==="heal2"){run.inspiration=Math.min(run.maxInspiration,run.inspiration+2);finishEvent("La fuente devuelve claridad a tu pluma.");return;}
 if(action==="discardPlus"){run.bonusDiscards+=1;finishEvent("A partir de ahora tendrás un descarte adicional en cada duelo.");return;}
 if(action==="handPlus"){run.handSize=Math.min(9,run.handSize+1);finishEvent("Tu mano permanente aumenta a "+run.handSize+" cartas.");return;}
 if(action==="maxInspiration"){run.maxInspiration+=1;run.inspiration=Math.min(run.maxInspiration,run.inspiration+1);finishEvent("Tu reserva máxima de Inspiración aumenta.");return;}
 if(action==="draft"||action==="draftRare"){showDraft(action==="draftRare");return;}
 if(action==="upgrade"||action==="remove"||action==="duplicate"){openDeckAction(action);return;}
}
function showDraft(rare){
 var pool=cards.slice();if(rare)pool=cards.filter(function(c){return c.meter===11||c.devices.indexOf("metáfora")>=0||c.devices.indexOf("sinestesia")>=0;});
 var offers=shuffle(pool).slice(0,3);$("eventTitle").textContent=rare?"Pergaminos selectos":"Elige un nuevo verso";$("eventText").textContent="La carta elegida entra permanentemente en tu mazo para el resto de la expedición.";$("eventChoices").className="eventChoices draftMode";$("eventChoices").innerHTML="";
 offers.forEach(function(base){var temp=Object.assign({},base,{uid:"preview",level:rare?1:0}),b=document.createElement("button");b.type="button";b.className="verseCard family-"+familyOf(temp);b.innerHTML=cardHTML(temp);b.addEventListener("click",function(){run.cardPool.push(makeInstance(base.id,rare?1:0));finishEvent("Has añadido «"+base.text+"» al mazo.");});$("eventChoices").appendChild(b);});
}
function finishEvent(message){
 run.awaitingEvent=false;run.eventId=null;bridgeCall("checkpoint","event_resolved");showToast(message||"Evento resuelto.","ok");setTimeout(function(){showMuseChoice("Elige una Musa","Una nueva inspiración te acompaña antes de "+districts[run.districtIndex].name+".");},350);
}

function openDeckAction(mode){
 deckView={mode:mode,from:"event"};show("deckScreen");renderDeckScreen();
}
function openDeckInspect(){deckView={mode:"inspect",from:"game"};show("deckScreen");renderDeckScreen();}
function renderDeckScreen(){
 var mode=deckView.mode,titles={inspect:"Tu mazo",upgrade:"Elige un verso para mejorar",remove:"Elige un verso para eliminar",duplicate:"Elige un verso para duplicar"},texts={inspect:"Estas son todas las cartas que pueden aparecer durante el duelo.",upgrade:"La carta gana +25 de valor base. Nivel máximo III.",remove:"La carta desaparece de toda la expedición. No puedes bajar de 14 cartas.",duplicate:"Añadirás una segunda copia con el mismo nivel."};
 $("deckScreenTitle").textContent=mode==="inspect"?"TU MAZO":"MODIFICAR MAZO";$("deckActionTitle").textContent=titles[mode];$("deckActionText").textContent=texts[mode];$("deckStats").innerHTML='<span>'+run.cardPool.length+' cartas</span><span>mano '+run.handSize+'</span><span>+'+run.bonusDiscards+' descartes</span>';$("deckGrid").innerHTML="";
 run.cardPool.slice().sort(function(a,b){var ca=effectiveCard(a.uid),cb=effectiveCard(b.uid);return ca.rhyme.localeCompare(cb.rhyme)||ca.meter-cb.meter;}).forEach(function(inst){
  var c=effectiveCard(inst.uid),b=document.createElement("button"),disabled=(mode==="upgrade"&&inst.level>=3)||(mode==="remove"&&run.cardPool.length<=14);b.type="button";b.className="verseCard family-"+familyOf(c)+(mode!=="inspect"&&!disabled?" actionable":"")+(disabled?" disabled":"");b.innerHTML=cardHTML(c);
  if(mode!=="inspect"&&!disabled)b.addEventListener("click",function(){applyDeckAction(mode,inst.uid);});$("deckGrid").appendChild(b);
 });
}
function applyDeckAction(mode,id){
 var inst=instanceByUid(id),c=effectiveCard(id);if(!inst||!c)return;
 if(mode==="upgrade"){inst.level=Math.min(3,inst.level+1);finishEvent("Has mejorado «"+c.text+"» al nivel "+roman(inst.level)+".");return;}
 if(mode==="remove"){run.cardPool=run.cardPool.filter(function(x){return x.uid!==id;});finishEvent("Has eliminado «"+c.text+"». Tu mazo es ahora más preciso.");return;}
 if(mode==="duplicate"){run.cardPool.push(makeInstance(inst.baseId,inst.level));finishEvent("Has duplicado «"+c.text+"».");}
}
function roman(n){return["I","II","III"][Math.max(0,n-1)]||"I";}
function backFromDeck(){if(deckView.from==="event"){showEvent();}else{show("gameScreen");renderGame();}}

function finishRun(){
 if(!run||run.finished)return;run.finished=true;run.locked=false;career.runs+=1;if(run.won)career.wins+=1;career.bestScore=Math.max(career.bestScore,run.runScore);career.bestStreak=Math.max(career.bestStreak,run.bestStreak);career.bestCombo=Math.max(Number(career.bestCombo||0),run.stats.bestCombo);saveCareer();resumeSave=null;
 $("finalScore").textContent=run.runScore.toLocaleString("es-ES");$("districtsText").textContent=run.stats.districtsCleared+"/"+districts.length;$("compositionsText").textContent=run.stats.compositions;$("bestStreakText").textContent=run.bestStreak;$("bestComboText").textContent=run.stats.bestCombo.toLocaleString("es-ES");
 if(run.won){$("resultKicker").textContent="VERSÓPOLIS CONQUISTADA";$("resultTitle").textContent="La ciudad corea tus versos";$("resultText").textContent="Has sobrevivido a contratos, eventos y cuatro maestros construyendo un mazo capaz de responder a lo inesperado.";}
 else{$("resultKicker").textContent="EXPEDICIÓN PERDIDA";$("resultTitle").textContent=run.inspiration<=0?"Tu inspiración se ha agotado":"El contrato te ha vencido";$("resultText").textContent="No basta con hacer una buena estrofa: el mazo debe poder encontrar la forma exigida antes de que se agoten rondas, descartes e Inspiración.";}
 show("resultScreen");renderCareer();bridgeCall("result",run.won?"finished":"defeat");
}
function loseRun(){if(!run||run.finished)return;run.won=false;finishRun();}
function showToast(text,kind){if(toastTimer)clearTimeout(toastTimer);$("toast").textContent=text;$("toast").className="toast"+(kind?" "+kind:"");toastTimer=setTimeout(function(){$("toast").classList.add("hidden");},2300);}

function snapshot(){return{version:4,run:run,career:career};}
function migrateRun(oldRun,version){
 if(!oldRun)return null;
 if(version===4&&oldRun.cardPool){oldRun.locked=false;if(!oldRun.discardPile)oldRun.discardPile=[];if(!oldRun.stats)oldRun.stats={compositions:0,structured:0,districtsCleared:0,bestCombo:0,contracts:0,failedContracts:0};if(oldRun.stats.failedContracts===undefined)oldRun.stats.failedContracts=0;if(oldRun.stats.contracts===undefined)oldRun.stats.contracts=0;return oldRun;}
 var r=Object.assign({},oldRun),d=districts[Math.min(Number(r.districtIndex||0),districts.length-1)];
 r.version=4;r.cardPool=startingBaseIds.map(function(id){return makeInstance(id,0);});r.handSize=7;r.bonusDiscards=0;r.deck=[];r.discardPile=[];r.hand=[];r.selected=[];r.maxInspiration=Number(r.maxInspiration||4);r.inspiration=Math.min(r.maxInspiration,Number(r.inspiration||r.maxInspiration));r.maxPrestige=Number(r.maxPrestige||d.prestige);r.rivalPrestige=Number(r.rivalPrestige===undefined?r.maxPrestige:r.rivalPrestige);r.challengeId=null;r.lastChallengeId=null;r.awaitingEvent=false;r.eventId=null;r.locked=false;
 if(!r.stats)r.stats={compositions:0,structured:0,districtsCleared:0,bestCombo:0};r.stats.contracts=Number(r.stats.contracts||0);r.stats.failedContracts=Number(r.stats.failedContracts||0);
 return r;
}
function restore(raw){
 try{
  var save=raw&&raw.run!==undefined?raw:raw&&raw.save?raw.save:raw;if(!save)return false;
  if(save.career){if(save.version===1||save.career.games!==undefined){career.runs=Math.max(career.runs,Number(save.career.games||0));career.bestScore=Math.max(career.bestScore,Number(save.career.bestScore||0));career.bestStreak=Math.max(career.bestStreak,Number(save.career.bestStreak||0));}else career=Object.assign(career,save.career);saveCareer();}
  if((save.version===2||save.version===3||save.version===4)&&save.run&&!save.run.finished){resumeSave=migrateRun(save.run,save.version);renderCareer();return true;}renderCareer();return!!save.career;
 }catch(err){return false;}
}
function continueRun(){
 if(!resumeSave)return;run=migrateRun(resumeSave,resumeSave.version||4);resumeSave=null;
 if(run.awaitingEvent){showEvent();}else if(run.awaitingMuse){showMuseChoice("Elige una Musa","Continúa tu expedición con una nueva inspiración.");}else{if(!run.challengeId)rollChallenge();if(!run.deck.length&&!run.hand.length)setupDistrict();else{show("gameScreen");renderGame();}}
 bridgeCall("sessionStarted");
}
function metrics(){
 var r=run||{},s=r.stats||{},attempts=Number(s.compositions||0),correct=Number(s.contracts||s.structured||0),accuracy=attempts?Math.round(correct/attempts*100):0,pct=0;
 if(r.finished&&r.won)pct=100;else if(r.districtIndex!==undefined){var max=Number(r.maxPrestige||districts[Math.min(r.districtIndex,districts.length-1)].prestige),rem=Number(r.rivalPrestige===undefined?max:r.rivalPrestige),part=max?Math.max(0,Math.min(1,1-rem/max)):0;pct=Math.round(((Number(r.districtIndex||0)+part)/districts.length)*100);}
 return{score:Number(r.runScore||0),attempts:attempts,correct:correct,errors:Number(s.failedContracts||0),accuracy:accuracy,percentage:pct,bestStreak:Number(r.bestStreak||0),round:Number(r.districtIndex||0)+1,games:Number(career.runs||0),careerBest:Number(career.bestScore||0),districtsCleared:Number(s.districtsCleared||0),bestCombo:Number(s.bestCombo||0),inspiration:Number(r.inspiration||0),rivalPrestige:Number(r.rivalPrestige||0),deckSize:Number(r.cardPool&&r.cardPool.length||0)};
}
function bridgeCall(name,arg){try{if(window.VersopolisBridge&&typeof window.VersopolisBridge[name]==="function")return window.VersopolisBridge[name](arg);}catch(err){}return null;}
function saveAndHome(){if(run&&!run.finished){run.locked=false;resumeSave=run;renderCareer();}if(window.VersopolisBridge&&window.VersopolisBridge.saveAndExit)window.VersopolisBridge.saveAndExit();else{show("homeScreen");renderCareer();}}

$("startBtn").addEventListener("click",newRun);$("continueBtn").addEventListener("click",continueRun);$("againBtn").addEventListener("click",newRun);$("homeBtn").addEventListener("click",function(){run=null;show("homeScreen");renderCareer();});
$("playBtn").addEventListener("click",playSelection);$("discardBtn").addEventListener("click",discardSelection);$("shuffleHandBtn").addEventListener("click",shuffleHand);$("clearBtn").addEventListener("click",clearSelection);$("exitBtn").addEventListener("click",saveAndHome);$("museExitBtn").addEventListener("click",saveAndHome);$("eventExitBtn").addEventListener("click",saveAndHome);$("openDeckBtn").addEventListener("click",openDeckInspect);$("deckBackBtn").addEventListener("click",backFromDeck);
$("helpBtn").addEventListener("click",function(){$("modal").classList.remove("hidden");});$("closeModal").addEventListener("click",function(){$("modal").classList.add("hidden");});$("modal").addEventListener("click",function(e){if(e.target===$("modal"))$("modal").classList.add("hidden");});
window.VersopolisGame={snapshot:snapshot,restore:restore,metrics:metrics,get run(){return run;},get career(){return career;}};
renderCareer();
})();
