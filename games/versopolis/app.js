(function(){
"use strict";

var STORAGE="lenguarcade.versopolis.v04";
var OLD_STORAGE3="lenguarcade.versopolis.v03";
var OLD_STORAGE2="lenguarcade.versopolis.v02";
var OLD_STORAGE1="lenguarcade.versopolis.v01";
var $=function(id){return document.getElementById(id);};
var run=null,career=loadCareer(),toastTimer=null,resumeSave=null,comboTimer=null,deckView={mode:"inspect",from:"game"};

var legacyDistricts=[
{name:"Puerta de la Rima",rival:"La Voz del Puente",portrait:"✒",rank:"DUELISTA",rule:"La rima hace más daño.",prestige:1050,hands:5,discards:2,focus:"rhyme",threshold:350,failPenalty:1,taunts:["«Sin contrato no hay poema que cruce mi puente.»","«Busca mejor entre tus pergaminos.»","«El eco correcto estaba en otra carta.»"],blocked:"«Has encontrado la llave de la rima.»"},
{name:"Plaza del Ritmo",rival:"El Maestro del Pulso",portrait:"♫",rank:"DUELISTA",rule:"La regularidad métrica multiplica el impacto.",prestige:1450,hands:5,discards:2,focus:"meter",threshold:420,failPenalty:1,taunts:["«Tu compás se ha quebrado.»","«La plaza oye cada sílaba.»","«No fuerces un verso que no encaja.»"],blocked:"«Ese pulso sí mantiene en pie la plaza.»"},
{name:"Jardines de la Imagen",rival:"La Dama de los Espejos",portrait:"✦",rank:"ÉLITE",rule:"Los recursos distintos abren grietas en sus espejos.",prestige:1800,hands:6,discards:2,focus:"devices",threshold:500,failPenalty:1,taunts:["«No veo la imagen que prometía tu contrato.»","«Tus palabras no han atravesado el espejo.»","«Un recurso aislado no basta.»"],blocked:"«Esa imagen no puedo reflejarla.»"},
{name:"Gran Anfiteatro",rival:"El Cronista Mayor",portrait:"♜",rank:"JEFE · FALLO = −2",rule:"Cambia el contrato en cada ronda y castiga los fallos.",prestige:2350,hands:7,discards:2,focus:"all",threshold:610,failPenalty:2,taunts:["«Versópolis no premia aproximaciones.»","«Contrato incumplido. El anfiteatro sentencia.»","«Aquí cada error cuesta el doble.»"],blocked:"«El anfiteatro reconoce la forma. Continúa.»"}
];
var districts=legacyDistricts;
var MAPS=[
 {id:"jardines",name:"Jardines de la Asonancia",focus:"Rima asonante",difficulty:"INICIACIÓN",boss:"La Dama del Eco",scene:"garden",places:["Sendero de luciérnagas","Fuente de las Vocales","Estanque de los Reflejos","Palacio del Eco"],rivals:["El Gorrión Mudo","Las Gemelas del Estanque","El Coleccionista de Ecos","La Dama del Eco"],weights:{asonante:9,asonanteAA:6,asonanteEA:6,asonanteAlterna:6,monorhyme:2,abab:2,abba:2,octo4:2,consonante:1},events:["fuenteVocales","invernadero","estanque","jardinero"]},
 {id:"fortaleza",name:"Fortaleza de la Consonancia",focus:"Rima consonante",difficulty:"INTERMEDIA",boss:"El Guardián del Sello",scene:"fortress",places:["Puente de Lacre","Sala de los Escribanos","Muralla de Palabras","Torre del Sello"],rivals:["El Falso Heraldo","El Escribano de Hierro","Los Hermanos del Sello","El Guardián del Sello"],weights:{consonante:16,consonanteABBA:8,consonanteABAB:8,monorhyme:4,abab:3,abba:3,aabb:3,octo4:1,hendeca4:1},events:["archivo","copista","mercado"]},
 {id:"teatro",name:"Teatro de las Estrofas",focus:"Esquemas y estrofas",difficulty:"AVANZADA",boss:"La Arquitecta del Verso",scene:"theater",places:["Vestíbulo de Pareados","Bastidores Cruzados","Escenario del Reverso","Gran Telón"],rivals:["El Tramoyista","La Actriz de los Cuatro Versos","El Director del Desorden","La Arquitecta del Verso"],weights:{aabb:7,abab:8,abba:8,fullform:8,monorhyme:4,consonante:2},events:["archivo","copista","mercado"]},
 {id:"torre",name:"Torre del Metro",focus:"Medida y ritmo",difficulty:"MAESTRÍA",boss:"El Maestro del Pulso",scene:"tower",places:["Escalera del Péndulo","Taller de Relojes","Sala del Autómata","Cúpula del Pulso"],rivals:["El Aprendiz del Péndulo","La Relojera","El Autómata Métrico","El Maestro del Pulso"],weights:{octo4:10,hendeca4:10,fullform:3,abab:2,abba:2},events:["fuente","copista","mercado"]}
];
var SPRITE_ASSETS={scenes:{garden:"./assets/art/scene-garden.webp",fortress:"./assets/art/scene-fortress.webp",theater:"./assets/art/scene-theater.webp",tower:"./assets/art/scene-tower.webp"},rivals:"./assets/art/enemy-{scene}-{stage}.webp?v=cartoon1",muses:"./assets/art/muse-{id}.webp"};
function museArt(id){return '<img class="museArt" src="'+SPRITE_ASSETS.muses.replace("{id}",id)+'" alt="">';}
function mapById(id){return MAPS.filter(function(m){return m.id===id;})[0]||null;}
function activeMap(){return run&&mapById(run.mapId);}
function mapDistricts(map){return map.rivals.map(function(rival,i){var old=legacyDistricts[i];return Object.assign({},old,{name:map.places[i],rival:rival,portrait:map.id.charAt(0).toUpperCase(),rank:i===3?"JEFE · FALLO = −2":i===2?"ÉLITE":"DUELISTA",focus:map.id==="torre"?"meter":map.id==="teatro"?"all":"rhyme",rule:map.focus+" · "+(i===3?"duelo final":"contratos especializados"),taunts:["«Revisa la forma exigida por el contrato.»","«Tu verso puede mejorar antes del próximo ataque.»"],blocked:"«El contrato encaja. Buen trabajo.»"});});}
function setActiveMap(id){var map=mapById(id);districts=map?mapDistricts(map):legacyDistricts;}

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
{id:"aa4",text:"Tiembla la tarde callada",meter:8,rhyme:"a-a",rhymeType:"asonante",theme:"noche",devices:["personificación"],value:43},
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
{id:"or4",text:"Trae la noche su claro rumor",meter:11,rhyme:"or",rhymeType:"consonante",theme:"noche",devices:["personificación"],value:50},
{id:"ino5",text:"Va la luz por el camino",meter:8,rhyme:"ino",rhymeType:"consonante",theme:"viaje",devices:["personificación"],value:42},
{id:"ino6",text:"Baila el viento del molino",meter:8,rhyme:"ino",rhymeType:"consonante",theme:"paisaje",devices:["personificación"],value:43},
{id:"ente5",text:"Va la lluvia de repente",meter:8,rhyme:"ente",rhymeType:"consonante",theme:"paisaje",devices:[],value:39},
{id:"ente6",text:"El sol se asoma de frente",meter:8,rhyme:"ente",rhymeType:"consonante",theme:"paisaje",devices:["personificación"],value:43},
{id:"ado5",text:"La noche sueña a mi lado",meter:8,rhyme:"ado",rhymeType:"consonante",theme:"noche",devices:["personificación"],value:43},
{id:"ado6",text:"Busca refugio el soldado",meter:8,rhyme:"ado",rhymeType:"consonante",theme:"aventura",devices:[],value:39},
{id:"ia5",text:"La luz vuelve cada día",meter:8,rhyme:"ía",rhymeType:"consonante",theme:"tiempo",devices:[],value:39},
{id:"ia6",text:"Suena el canto todavía",meter:8,rhyme:"ía",rhymeType:"consonante",theme:"tiempo",devices:["personificación"],value:43},
{id:"aa5",text:"Va por la orilla una barca",meter:8,rhyme:"a-a",rhymeType:"asonante",theme:"viaje",devices:[],value:40},
{id:"aa6",text:"Suena lejos la campana",meter:8,rhyme:"a-a",rhymeType:"asonante",theme:"ciudad",devices:["personificación"],value:43},
{id:"ea5",text:"Se duerme el bosque en la niebla",meter:8,rhyme:"e-a",rhymeType:"asonante",theme:"paisaje",devices:["personificación"],value:44},
{id:"ea6",text:"La voz se esconde en la cueva",meter:8,rhyme:"e-a",rhymeType:"asonante",theme:"ausencia",devices:["personificación"],value:44},
{id:"ana5",text:"Sobre el río despierta la mañana",meter:11,rhyme:"ana",rhymeType:"consonante",theme:"paisaje",devices:["personificación"],value:51},
{id:"ana6",text:"En el patio despierta la campana",meter:11,rhyme:"ana",rhymeType:"consonante",theme:"ciudad",devices:["personificación"],value:51},
{id:"ana7",text:"De noche la luz cruza la ventana",meter:11,rhyme:"ana",rhymeType:"consonante",theme:"noche",devices:["metáfora"],value:53},
{id:"ana8",text:"Yo guardo una canción para mañana",meter:11,rhyme:"ana",rhymeType:"consonante",theme:"tiempo",devices:[],value:49},
{id:"or5",text:"La vieja plaza cambia de color",meter:11,rhyme:"or",rhymeType:"consonante",theme:"ciudad",devices:["personificación"],value:51},
{id:"or6",text:"Los versos buscan siempre su valor",meter:11,rhyme:"or",rhymeType:"consonante",theme:"poesía",devices:["personificación"],value:51},
{id:"or7",text:"Un faro guarda todo su fulgor",meter:11,rhyme:"or",rhymeType:"consonante",theme:"viaje",devices:["personificación"],value:51},
{id:"or8",text:"Las calles guardan sueños de color",meter:11,rhyme:"or",rhymeType:"consonante",theme:"ciudad",devices:["personificación"],value:51}
];
cards.push(
 {id:"joker_eco",text:"Comodín del Eco",meter:null,rhyme:"libre",rhymeType:"comodín",theme:"poesía",devices:[],value:28,joker:true},
 {id:"joker_pulso",text:"Comodín del Pulso",meter:null,rhyme:"libre",rhymeType:"comodín",theme:"poesía",devices:[],value:28,joker:true}
);
cards=cards.concat(window.VersopolisVerseBank.build(window.VersopolisProsody));
var MAX_DECK_SIZE=54;
function starterDeck(){
 var groups=[['ino',8,'consonante'],['ente',8,'consonante'],['ado',8,'consonante'],['ía',8,'consonante'],['a-a',8,'asonante'],['e-a',8,'asonante'],['ana',11,'consonante'],['or',11,'consonante']],chosen=[];
 groups.forEach(function(g){var pool=cards.filter(function(c){return c.rhyme===g[0]&&c.meter===g[1]&&c.rhymeType===g[2];});chosen=chosen.concat(shuffle(pool).slice(0,3));});
 // Original image cards keep the resource challenges solvable; special cards
 // enter every new run, while legacy runs retain their exact inventory.
 ['ino2','ado3','ea4'].forEach(function(id){if(chosen.every(function(c){return c.id!==id;}))chosen.push(baseCard(id));});
 var specials=shuffle(cards.filter(function(c){return c.power&&!chosen.some(function(x){return x.id===c.id;});})).slice(0,3);chosen=chosen.concat(specials);
 chosen=chosen.concat(shuffle(cards.filter(function(c){return !c.joker&&!chosen.some(function(x){return x.id===c.id;});})).slice(0,49-chosen.length));
 return chosen.map(function(c){return c.id;}).concat(['joker_eco','joker_pulso']);
}
function powerBonus(c,a){
 if(!c.power)return 0;
 var eligible=c.power==='eco'&&a.repeated||c.power==='pulso'&&a.allMeter||c.power==='imagen'&&a.devices.length>=2||c.power==='constelacion'&&a.n===4&&['ABAB','ABBA','AABB'].indexOf(a.pattern)>=0;
 return eligible?window.VersopolisVerseBank.powers[c.power].bonus:0;
}
// Separación métrica revisada para las cartas del banco. El guion separa sílabas;
// el guion bajo une vocales por sinalefa. Las agudas suman una sílaba final.
var SCANS={
 ino1:"Cru-za la no-che_el ca-mi-no",ino2:"Guar-do mi voz en des-ti-no",ino3:"Can-ta des-pa-cio_el mo-li-no",ino4:"Bri-lla la luz del ve-ci-no",
 ente1:"Mi-ra la to-rre de fren-te",ente2:"Sue-na la fuen-te pre-sen-te",ente3:"Tiem-bla la voz del au-sen-te",ente4:"Ar-de la tar-de pa-cien-te",
 ado1:"Vuel-ve_el gue-rre-ro can-sa-do",ado2:"Que-da_el jar-dín a-pa-ga-do",ado3:"Co-rre_un ca-ba-llo do-ra-do",ado4:"Sue-ña_el cas-ti-llo_en-can-ta-do",
 ia1:"Vuel-ve la luz ca-da dí-a",ia2:"Can-ta la vie-ja_a-ba-dí-a",ia3:"Tiem-bla la voz to-da-ví-a",ia4:"Bri-lla la pie-dra som-brí-a",
 aa1:"Ba-jo la llu-via mi ca-sa",aa2:"Can-ta_el go-rrión en la ra-ma",aa3:"Guar-do la lu-na de pla-ta",aa4:"Tiem-bla la tar-de ca-lla-da",
 ea1:"Que-da mi car-ta_en la me-sa",ea2:"Si-go de no-che la sen-da",ea3:"Can-ta la fuen-te tan cer-ca",ea4:"Vuel-ve la mú-si-ca len-ta",
 ana1:"So-bre la pie-dra tiem-bla la ma-ña-na",ana2:"Can-ta la fuen-te jun-to_a la ven-ta-na",ana3:"Guar-da la no-che luz en la ven-ta-na",ana4:"Bus-ca la som-bra paz en la ma-ña-na",
 or1:"Cru-za la tar-de con len-to ru-mor",or2:"Guar-da la llu-via su_an-ti-guo tem-blor",or3:"Ti-ñe la bri-sa de co-bre la flor",or4:"Tra-e la no-che su cla-ro ru-mor",
 ino5:"Va la luz por el ca-mi-no",ino6:"Bai-la_el vien-to del mo-li-no",ente5:"Va la llu-via de re-pen-te",ente6:"El sol se_a-so-ma de fren-te",
 ado5:"La no-che sue-ña_a mi la-do",ado6:"Bus-ca re-fu-gio_el sol-da-do",ia5:"La luz vuel-ve ca-da dí-a",ia6:"Sue-na_el can-to to-da-ví-a",
 aa5:"Va por la_o-ri-lla_u-na bar-ca",aa6:"Sue-na le-jos la cam-pa-na",ea5:"Se duer-me_el bos-que_en la nie-bla",ea6:"La voz se_es-con-de_en la cue-va",
 ana5:"So-bre_el rí-o des-pier-ta la ma-ña-na",ana6:"En el pa-tio des-pier-ta la cam-pa-na",ana7:"De no-che la luz cru-za la ven-ta-na",ana8:"Yo guar-do_u-na can-ción pa-ra ma-ña-na",
 or5:"La vie-ja pla-za cam-bia de co-lor",or6:"Los ver-sos bus-can siem-pre su va-lor",or7:"Un fa-ro guar-da to-do su ful-gor",or8:"Las ca-lles guar-dan sue-ños de co-lor"
};

var startingBaseIds=cards.filter(function(c){return !c.generated&&["ea6","ana8","or8"].indexOf(c.id)<0;}).map(function(c){return c.id;});

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
{id:"fullform",title:"ESTROFA CON FORMA",desc:"Construye una forma reconocible de cuatro versos.",mult:1.58,min:3,test:function(a){return a.n===4&&a.formBonus>0;},can:function(list){return canTwoRhymePairs(list);}},
{id:"rescate",title:"VERSO LIBRE",desc:"Juega al menos dos versos para recuperar el compás.",mult:1.12,min:99,test:function(a){return a.n>=2;},can:function(list){return list.length>=2;}}
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
challenges.push(
 {id:"asonanteAA",title:"ECO A-A",desc:"Empareja dos versos con rima asonante A-A.",mult:1.38,min:0,test:function(a){return a.n>=2&&a.sameRhyme&&a.rhymeKind==="asonante"&&a.rhymes[0]==="a-a";},can:function(list){return list.filter(function(c){return c.rhymeType==="asonante"&&c.rhyme==="a-a";}).length>=2;}},
 {id:"asonanteEA",title:"ECO E-A",desc:"Empareja dos versos con rima asonante E-A.",mult:1.38,min:0,test:function(a){return a.n>=2&&a.sameRhyme&&a.rhymeKind==="asonante"&&a.rhymes[0]==="e-a";},can:function(list){return list.filter(function(c){return c.rhymeType==="asonante"&&c.rhyme==="e-a";}).length>=2;}},
 {id:"asonanteAlterna",title:"ONDAS ALTERNAS",desc:"Forma ABAB con dos familias asonantes.",mult:1.55,min:1,test:function(a){return a.n===4&&a.pattern==="ABAB"&&a.rhymeKind==="asonante";},can:function(list){return canTwoTypePairs(list,"asonante");}},
 {id:"consonanteABBA",title:"SELLO CRUZADO",desc:"Forma ABBA con dos terminaciones consonantes exactas.",mult:1.62,min:2,test:function(a){return a.n===4&&a.pattern==="ABBA"&&a.rhymeKind==="consonante";},can:function(list){return canTwoTypePairs(list,"consonante");}},
 {id:"consonanteABAB",title:"SELLO ALTERNO",desc:"Forma ABAB con dos terminaciones consonantes exactas.",mult:1.58,min:2,test:function(a){return a.n===4&&a.pattern==="ABAB"&&a.rhymeKind==="consonante";},can:function(list){return canTwoTypePairs(list,"consonante");}},
 {id:"regular",title:"COMPÁS REGULAR",desc:"Juega tres versos de igual medida.",mult:1.4,min:1,test:function(a){return a.n>=3&&a.allMeter;},can:function(list){return Math.max(list.filter(function(c){return c.meter===8;}).length,list.filter(function(c){return c.meter===11;}).length)>=3;}}
);
events.push(
 {id:"fuenteVocales",icon:"A",title:"Fuente de las Vocales",text:"Sus dos corrientes devuelven al poeta la claridad o una nueva voz.",choices:[{icon:"I",title:"Beber del manantial",desc:"Recuperas hasta dos puntos de Inspiración.",reward:"+2 Inspiración",action:"heal2"},{icon:"II",title:"Escuchar el eco",desc:"Añades un verso al mazo.",reward:"Nueva carta",action:"draft"},{icon:"III",title:"Recoger una gota",desc:"Aumenta tu Inspiración máxima.",reward:"+1 máximo",action:"maxInspiration"}]},
 {id:"invernadero",icon:"V",title:"Invernadero del Eco",text:"Las flores conservan cada terminación que han oído.",choices:[{icon:"I",title:"Sembrar un verso",desc:"Duplica una carta del mazo.",reward:"Copia permanente",action:"duplicate"},{icon:"II",title:"Podar una rama",desc:"Elimina una carta del mazo.",reward:"Mazo más preciso",action:"remove"},{icon:"III",title:"Cultivar el ritmo",desc:"Mejora una carta.",reward:"+25 valor",action:"upgrade"}]},
 {id:"estanque",icon:"E",title:"Estanque de los Reflejos",text:"El reflejo repite una forma y transforma otra.",choices:[{icon:"I",title:"Reflejar el verso",desc:"Duplica una carta.",reward:"Copia permanente",action:"duplicate"},{icon:"II",title:"Cambiar de corriente",desc:"Obtén un Cambio extra en cada duelo.",reward:"+1 Cambio",action:"discardPlus"},{icon:"III",title:"Mirar más hondo",desc:"Aumenta el tamaño de la mano.",reward:"+1 carta",action:"handPlus"}]},
 {id:"jardinero",icon:"J",title:"El Jardinero Nocturno",text:"Conoce las palabras que florecen al pronunciarlas dos veces.",choices:[{icon:"I",title:"Aceptar un injerto",desc:"Elige un verso nuevo.",reward:"Nueva carta",action:"draft"},{icon:"II",title:"Afinar la pluma",desc:"Mejora un verso.",reward:"+25 valor",action:"upgrade"},{icon:"III",title:"Descansar junto al agua",desc:"Recuperas Inspiración.",reward:"+2 Inspiración",action:"heal2"}]}
);
var ACHIEVEMENTS=[
 ["primera","Primera tinta","Cumple tu primer contrato","Primeros pasos",function(r){return r.stats.contracts>=1;}],
 ["maestro","Primer maestro","Vence tu primer duelo","Primeros pasos",function(r){return r.stats.districtsCleared>=1;}],
 ["sinFallos","Sin titubeos","Gana sin fallar contratos","Primeros pasos",function(r){return r.finished&&r.won&&!r.stats.failedContracts;}],
 ["ultima","Última gota","Gana con 1 de Inspiración","Primeros pasos",function(r){return r.finished&&r.won&&r.inspiration===1;}],
 ["eco","Eco en el agua","Construye un pareado asonante","Asonancia",function(r){return !!r.forms.asonante;}],
 ["jardinero","Jardinero de ecos","Cumple cinco contratos asonantes","Asonancia",function(r){return r.rhymeCounts.asonante>=5;}],
 ["vocales","Todo son vocales","Construye ABAB asonante","Asonancia",function(r){return !!r.forms.asonanteABAB;}],
 ["jardines","Señor de los Jardines","Conquista los Jardines","Asonancia",function(r){return r.finished&&r.won&&r.mapId==="jardines";}],
 ["sello","Sello perfecto","Construye un pareado consonante","Consonancia",function(r){return !!r.forms.consonante;}],
 ["letra","Ni una letra de más","Cumple cinco contratos consonantes","Consonancia",function(r){return r.rhymeCounts.consonante>=5;}],
 ["muralla","Muralla de palabras","Construye ABBA consonante","Consonancia",function(r){return !!r.forms.consonanteABBA;}],
 ["guardian","Guardián caído","Conquista la Fortaleza","Consonancia",function(r){return r.finished&&r.won&&r.mapId==="fortaleza";}],
 ["dos","Dos a dos","Forma AABB","Estrofas",function(r){return !!r.forms.AABB;}],
 ["cruce","Cruce perfecto","Forma ABAB","Estrofas",function(r){return !!r.forms.ABAB;}],
 ["regreso","El regreso","Forma ABBA","Estrofas",function(r){return !!r.forms.ABBA;}],
 ["redondilla","Redondilla","Compón una redondilla","Estrofas",function(r){return !!r.forms.REDONDILLA;}],
 ["cuarteta","Cuarteta","Compón una cuarteta","Estrofas",function(r){return !!r.forms.CUARTETA;}],
 ["arquitecto","Arquitecto del verso","Cumple cinco contratos de esquema","Estrofas",function(r){return r.rhymeCounts.esquema>=5;}],
 ["telon","Telón dorado","Conquista el Teatro","Estrofas",function(r){return r.finished&&r.won&&r.mapId==="teatro";}],
 ["ocho","Ocho pulsos","Juega cuatro versos octosílabos","Métrica",function(r){return !!r.forms.octo4;}],
 ["once","Once pulsos","Juega cuatro versos endecasílabos","Métrica",function(r){return !!r.forms.hendeca4;}],
 ["compas","A compás","Cumple cinco contratos métricos","Métrica",function(r){return r.rhymeCounts.metro>=5;}],
 ["oido","A oído","Cumple un contrato en el jefe sin escandir","Métrica",function(r){return !!r.forms.bossMeter;}],
 ["metronomo","Metrónomo humano","Gana la Torre sin usar Escandir","Métrica",function(r){return r.finished&&r.won&&r.mapId==="torre"&&!r.scans;}],
 ["torre","La Torre calla","Conquista la Torre","Métrica",function(r){return r.finished&&r.won&&r.mapId==="torre";}],
 ["poda","Poda necesaria","Elimina una carta","Mazo",function(r){return !!r.eventActions.remove;}],
 ["favorito","Verso favorito","Duplica una carta","Mazo",function(r){return !!r.eventActions.duplicate;}],
 ["dorada","Tinta dorada","Mejora una carta hasta nivel III","Mazo",function(r){return r.cardPool.some(function(c){return c.level>=3;});}],
 ["precision","Mazo de precisión","Elimina dos cartas del mazo","Mazo",function(r){return (r.eventActions.remove||0)>=2;}],
 ["comodin","As bajo la manga","Cumple un contrato usando un comodín","Mazo",function(r){return !!r.forms.comodin;}],
 ["improvisador","Improvisador","Gana con al menos tres Musas","Mazo",function(r){return r.finished&&r.won&&r.muses.length>=3;}],
 ["cuatro","Cuatro caminos","Conquista los cuatro mapas","Maestría",function(){return MAPS.every(function(m){return career.mapWins&&career.mapWins[m.id];});}],
 ["poeta","Poeta de Versópolis","Desbloquea 25 hazañas","Maestría",function(){return Object.keys(career.achievements||{}).length>=25;}]
];
var CODEX=[
 ["asonante","Rima asonante","Coinciden las vocales desde la última vocal tónica; las consonantes pueden variar."],
 ["consonante","Rima consonante","Coinciden vocales y consonantes desde la última vocal tónica."],
 ["pareado","Pareado","Dos versos que riman entre sí."],
 ["ABAB","Rima alterna","El primer verso rima con el tercero; el segundo, con el cuarto."],
 ["ABBA","Rima abrazada","El primer verso rima con el cuarto; los dos centrales riman entre sí."],
 ["AABB","Rima gemela","Dos parejas consecutivas de versos que riman."],
 ["REDONDILLA","Redondilla","Cuatro versos de arte menor con rima consonante abba."],
 ["CUARTETA","Cuarteta","Cuatro versos de arte menor con rima consonante abab."],
 ["CUARTETO","Cuarteto","Cuatro versos de arte mayor con rima consonante ABBA."],
 ["SERVENTESIO","Serventesio","Cuatro versos de arte mayor con rima consonante ABAB."],
 ["octo4","Octosílabo","Verso de ocho sílabas métricas. Considera sinalefas y el acento final."],
 ["hendeca4","Endecasílabo","Verso de once sílabas métricas. Considera sinalefas y el acento final."],
 ["metáfora","Metáfora","Una realidad se expresa mediante otra por una semejanza de sentido."],
 ["personificación","Personificación","Se atribuyen acciones o rasgos humanos a seres u objetos no humanos."],
 ["sinestesia","Sinestesia","Se cruzan sensaciones de sentidos distintos."],
 ["epíteto","Epíteto","Adjetivo que resalta una cualidad propia o expresiva del nombre."]
 ,["comodin","Comodín","Copia la rima, la medida y el tema de un verso real de la selección. No copia sus recursos literarios. Necesita al menos un verso real."]
];
var COSMETIC_REWARDS={jardines:"reverso:ondas de agua",guardian:"lacre:sello de cobre",telon:"marco:telón dorado",torre:"tinta:azul eléctrico",cuatro:"título:poeta de los cuatro caminos"};

function loadCareer(){
 var base={runs:0,wins:0,bestScore:0,bestStreak:0,districtsCleared:0,bestCombo:0,achievements:{},discoveries:{},mapWins:{},mapProgress:{},cosmetics:{}};
 try{
  var newer=JSON.parse(localStorage.getItem(STORAGE)||"null");if(newer)return Object.assign(base,newer);
  var old3=JSON.parse(localStorage.getItem(OLD_STORAGE3)||"null");if(old3)return Object.assign(base,old3);
  var old2=JSON.parse(localStorage.getItem(OLD_STORAGE2)||"null");if(old2)return Object.assign(base,old2);
  var old1=JSON.parse(localStorage.getItem(OLD_STORAGE1)||"null");if(old1){base.runs=Number(old1.games||0);base.bestScore=Number(old1.bestScore||0);base.bestStreak=Number(old1.bestStreak||0);}
 }catch(err){}
 return base;
}
function saveCareer(){try{localStorage.setItem(STORAGE,JSON.stringify(career));}catch(err){}}
function checkAchievements(){if(!run)return;career.achievements=career.achievements||{};career.cosmetics=career.cosmetics||{};var changed=false;ACHIEVEMENTS.forEach(function(a){if(!career.achievements[a[0]]&&a[4](run)){career.achievements[a[0]]=Date.now();if(COSMETIC_REWARDS[a[0]])career.cosmetics[COSMETIC_REWARDS[a[0]]]=true;changed=true;}});if(changed)saveCareer();}
function recordComposition(a){run.forms=run.forms||{};run.rhymeCounts=run.rhymeCounts||{};career.discoveries=career.discoveries||{};var form=a.name,scheme=a.pattern;
 if(a.jokerCount)run.forms.comodin=career.discoveries.comodin=true;
 [form,scheme].forEach(function(k){if(k)run.forms[k]=career.discoveries[k]=true;});
 if(a.rhymeKind!=="mixta"&&a.sameRhyme){run.forms[a.rhymeKind]=career.discoveries[a.rhymeKind]=true;}
 if(a.rhymeKind==="asonante"&&scheme==="ABAB")run.forms.asonanteABAB=true;
 if(a.rhymeKind==="consonante"&&scheme==="ABBA")run.forms.consonanteABBA=true;
 if(a.n===4&&a.allMeter){var key=a.meterValue===8?"octo4":a.meterValue===11?"hendeca4":"";if(key)run.forms[key]=career.discoveries[key]=true;}
 if(activeMap()&&activeMap().id==="torre"&&run.districtIndex===3&&["octo4","hendeca4","regular"].indexOf(run.challengeId)>=0)run.forms.bossMeter=true;
 a.devices.forEach(function(d){career.discoveries[d]=true;});
 var cid=run.challengeId;if(cid.indexOf("asonante")>=0)run.rhymeCounts.asonante=(run.rhymeCounts.asonante||0)+1;
 if(cid.indexOf("consonante")>=0)run.rhymeCounts.consonante=(run.rhymeCounts.consonante||0)+1;
 if(["abba","abab","aabb","fullform","consonanteABBA","consonanteABAB"].indexOf(cid)>=0)run.rhymeCounts.esquema=(run.rhymeCounts.esquema||0)+1;
 if(["octo4","hendeca4","regular"].indexOf(cid)>=0)run.rhymeCounts.metro=(run.rhymeCounts.metro||0)+1;
 saveCareer();}
function renderAchievements(){var grid=$("achievementGrid");grid.innerHTML="";career.achievements=career.achievements||{};$("achievementCount").textContent=Object.keys(career.achievements).length+" / "+ACHIEVEMENTS.length+" sellos conseguidos";ACHIEVEMENTS.forEach(function(a){var unlocked=!!career.achievements[a[0]],tile=document.createElement("article");tile.className="archiveTile"+(unlocked?" earned":"");tile.innerHTML='<span class="sealArt">'+(unlocked?"V":"?")+'</span><span class="tileGroup">'+a[3]+'</span><h3>'+a[1]+'</h3><p>'+a[2]+'</p>'+(COSMETIC_REWARDS[a[0]]?'<small>DESBLOQUEO · '+COSMETIC_REWARDS[a[0]]+'</small>':"");grid.appendChild(tile);});}
function renderCodex(){var grid=$("codexGrid");grid.innerHTML="";CODEX.forEach(function(c){var known=career.discoveries&&career.discoveries[c[0]],tile=document.createElement("article");tile.className="archiveTile"+(known?" earned":"");tile.innerHTML='<span class="sealArt">'+(known?"V":"?")+'</span><span class="tileGroup">'+(known?"DESCUBIERTO":"POR DESCUBRIR")+'</span><h3>'+(known?c[1]:"Página sellada")+'</h3><p>'+(known?c[2]:"Construye esta forma durante una expedición.")+'</p>';grid.appendChild(tile);});}
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
function familyOf(c){if(c.joker)return"wild";if(c.level>=3)return"master";if(c.meter===11)return"rhythm";if(c.rhymeType==="asonante")return"echo";if(c.devices.length)return"image";return"rhyme";}
function familyLabel(f){return{rhyme:"RIMA",echo:"ECO",rhythm:"RITMO",image:"IMAGEN",master:"MAESTRO",wild:"COMODÍN"}[f]||"VERSO";}
function stars(level){var s="";for(var i=0;i<level;i+=1)s+="★";return s;}
function show(name){finishCardDrag(true);["poemsScreen","writingScreen","homeScreen","atlasScreen","achievementsScreen","codexScreen","museScreen","eventScreen","deckScreen","gameScreen","resultScreen"].forEach(function(id){$(id).classList.toggle("hidden",id!==name);});}
function renderCareer(){
 $("careerLine").textContent=career.runs?"Mejor expedición: "+career.bestScore.toLocaleString("es-ES")+" · "+career.wins+" victorias · mejor impacto "+Number(career.bestCombo||0).toLocaleString("es-ES"):"Tu primera expedición te espera · 1720 versos por descubrir.";
 $("continueBtn").classList.toggle("hidden",!resumeSave);
}

function showAtlas(){renderAtlas();show("atlasScreen");}
function renderAtlas(){var grid=$("atlasGrid");grid.innerHTML="";MAPS.forEach(function(m,i){var b=document.createElement("button");b.type="button";b.className="atlasCard scene-"+m.scene;b.innerHTML='<span class="atlasOrdinal">RUTA '+String(i+1).padStart(2,"0")+'</span><span class="atlasLandmark"></span><span class="atlasTrail">'+m.places.map(function(place,j){return '<span><b>'+(j+1)+'</b>'+place+'</span>';}).join("")+'</span><span class="atlasInfo"><strong>'+m.name+'</strong><small>'+m.focus+' · '+m.difficulty+'</small><em>JEFE · '+m.boss+'</em><span>'+(career.mapWins&&career.mapWins[m.id]?"CONQUISTADO":"DISPONIBLE")+' · '+Number(career.mapProgress&&career.mapProgress[m.id]||0)+' / 4 duelos superados</span></span>';b.addEventListener("click",function(){newRun(m.id);});grid.appendChild(b);});}
function newRun(mapId){
 if(!mapById(mapId)){showAtlas();return;}
 setActiveMap(mapId);
 run={version:6,mapId:mapId,districtIndex:0,runScore:0,rivalPrestige:0,maxPrestige:0,inspiration:4,maxInspiration:4,handsLeft:0,discardsLeft:0,bonusDiscards:0,handSize:7,cardPool:starterDeck().map(function(id){return makeInstance(id,0);}),deck:[],discardPile:[],hand:[],selected:[],discardMode:false,discardSelected:[],muses:[],challengeId:null,lastChallengeId:null,awaitingMuse:true,awaitingEvent:false,eventId:null,districtStarted:false,finished:false,won:false,streak:0,bestStreak:0,firstPlay:true,locked:false,lastEventId:null,scans:0,usedScanInBoss:false,forms:{},rhymeCounts:{},eventActions:{},stats:{compositions:0,structured:0,districtsCleared:0,bestCombo:0,contracts:0,failedContracts:0},startedAt:Date.now()};
 resumeSave=null;showMuseChoice("Elige tu primera Musa","Prepara tu mazo para "+activeMap().name+".");bridgeCall("sessionStarted");
}
function showMuseChoice(title,subtitle){
 if(!run)return;run.awaitingMuse=true;run.locked=false;show("museScreen");
 $("museTitle").textContent=title||"Elige una Musa";$("museSubtitle").textContent=subtitle||"Añade una sinergia a tu expedición.";
 var available=muses.filter(function(m){return run.muses.indexOf(m.id)<0;}),choices=shuffle(available).slice(0,Math.min(3,available.length));
 $("museChoices").innerHTML="";
 choices.forEach(function(m){var b=document.createElement("button");b.type="button";b.className="museCard";b.innerHTML='<span class="museRarity">'+m.rarity+'</span>'+museArt(m.id)+'<h3>'+m.name+'</h3><p>'+m.desc+'</p><small>'+m.label+'</small>';b.addEventListener("click",function(){chooseMuse(m.id);});$("museChoices").appendChild(b);});
 renderOwnedMuses();
}
function renderOwnedMuses(){
 if(!run){$("ownedMuses").innerHTML="";return;}
 $("ownedMuses").innerHTML=run.muses.length?'<b>PODERES ACTIVOS</b>'+run.muses.map(function(id){var m=museById(id);return m?'<span>'+museArt(id)+m.name+"</span>":"";}).join(""):'<span>Aún no tienes Musas activas.</span>';
}
function chooseMuse(id){if(!run||run.muses.indexOf(id)>=0)return;run.muses.push(id);run.awaitingMuse=false;setupDistrict();bridgeCall("checkpoint","muse_choice");}

function setupDistrict(){
 var d=districts[run.districtIndex];
 run.maxPrestige=d.prestige;run.rivalPrestige=d.prestige;run.handsLeft=d.hands;run.discardsLeft=d.discards+Number(run.bonusDiscards||0);run.deck=shuffle(run.cardPool.map(function(x){return x.uid;}));run.discardPile=[];run.hand=[];run.selected=[];run.discardMode=false;run.discardSelected=[];run.districtStarted=true;run.firstPlay=true;run.locked=false;run.scanReveal=false;run.lastFeedback="";
 var firstJoker=run.deck.find(function(id){var c=effectiveCard(id);return c&&c.joker;});if(firstJoker){run.deck.splice(run.deck.indexOf(firstJoker),1);run.deck.unshift(firstJoker);}
 drawToHand();rollChallenge();show("gameScreen");$("rivalSpeech").textContent="«"+d.rival+" acepta el duelo.»";renderGame();
}
function drawToHand(){
 while(run.hand.length<run.handSize){
  if(!run.deck.length&&run.discardPile.length){run.deck=shuffle(run.discardPile);run.discardPile=[];showToast("El descarte vuelve al mazo.","");}
  if(!run.deck.length)break;
  var id=run.deck.shift();if(run.hand.indexOf(id)<0)run.hand.push(id);
 }
}
function animateDepartingCards(ids){
 if(!document.body)return;
 ids.forEach(function(id){var source=$("hand").querySelector('[data-card-id="'+id+'"]');if(!source)return;var rect=source.getBoundingClientRect(),ghost=source.cloneNode(true);ghost.classList.add("cardLeaving");ghost.style.cssText="position:fixed;pointer-events:none;z-index:900;left:"+rect.left+"px;top:"+rect.top+"px;width:"+rect.width+"px;height:"+rect.height+"px;";document.body.appendChild(ghost);setTimeout(function(){ghost.remove();},180);});
}
function moveSelectedToDiscard(){
 animateDepartingCards(run.selected);

 var played=run.selected.slice();played.forEach(function(id){var i=run.hand.indexOf(id);if(i>=0)run.hand.splice(i,1);run.discardPile.push(id);});run.selected=[];drawToHand();return played;
}

function canTwoRhymePairs(list){var counts={};list.forEach(function(c){counts[c.rhyme]=(counts[c.rhyme]||0)+1;});return Object.keys(counts).filter(function(k){return counts[k]>=2;}).length>=2;}
function canTwoTypePairs(list,type){return canTwoRhymePairs(list.filter(function(c){return c.rhymeType===type;}));}
function canRhymeType(list,type,count){var groups={};list.filter(function(c){return c.rhymeType===type;}).forEach(function(c){groups[c.rhyme]=(groups[c.rhyme]||0)+1;});return Object.keys(groups).some(function(k){return groups[k]>=count;});}
function maxGroup(list,key){var counts={},max=0;list.forEach(function(c){counts[c[key]]=(counts[c[key]]||0)+1;max=Math.max(max,counts[c[key]]);});return max;}
function distinctDevices(list){var d=[];list.forEach(function(c){c.devices.forEach(function(x){if(d.indexOf(x)<0)d.push(x);});});return d.length;}
function witnessFor(ch,list){
 var pool=shuffle(list.filter(function(c){return!c.joker;})),groups={},byMeter={8:[],11:[]},byTheme={};
 pool.forEach(function(c){var key=c.rhymeType+":"+c.rhyme;(groups[key]=groups[key]||[]).push(c);(byMeter[c.meter]=byMeter[c.meter]||[]).push(c);(byTheme[c.theme]=byTheme[c.theme]||[]).push(c);});
 function matchingPairs(type,rhyme){return Object.keys(groups).filter(function(key){return groups[key].length>=2&&(!type||key.indexOf(type+":")===0)&&(!rhyme||key===type+":"+rhyme);}).map(function(key){return groups[key];});}
 function twoPairs(type,pattern){var pairs=matchingPairs(type);if(pairs.length<2)return null;var a=pairs[0],b=pairs[1];return pattern==="AABB"?[a[0],a[1],b[0],b[1]]:pattern==="ABAB"?[a[0],b[0],a[1],b[1]]:[a[0],b[0],b[1],a[1]];}
 function three(key){var group=Object.keys(key).map(function(k){return key[k];}).filter(function(g){return g.length>=3;});return group.length?group[0].slice(0,3):null;}
 if(ch.id==="rescate")return pool.slice(0,2);
 if(ch.id==="abba"||ch.id==="consonanteABBA"||ch.id==="fullform")return twoPairs(ch.id==="consonanteABBA"?"consonante":null,"ABBA");
 if(ch.id==="abab"||ch.id==="consonanteABAB"||ch.id==="asonanteAlterna")return twoPairs(ch.id==="consonanteABAB"?"consonante":ch.id==="asonanteAlterna"?"asonante":null,"ABAB");
 if(ch.id==="aabb")return twoPairs(null,"AABB");
 if(ch.id==="octo4"||ch.id==="hendeca4"){var meterGroup=byMeter[ch.id==="octo4"?8:11];return meterGroup.length>=4?meterGroup.slice(0,4):null;}
 if(ch.id==="regular")return byMeter[8].length>=3?byMeter[8].slice(0,3):byMeter[11].length>=3?byMeter[11].slice(0,3):null;
 if(ch.id==="monorhyme")return three(groups);
 if(ch.id==="theme3")return three(byTheme);
 if(ch.id==="asonante"||ch.id==="consonante"||ch.id==="asonanteAA"||ch.id==="asonanteEA"){
  var type=ch.id.indexOf("asonante")===0?"asonante":"consonante",rhyme=ch.id==="asonanteAA"?"a-a":ch.id==="asonanteEA"?"e-a":null,pairs=matchingPairs(type,rhyme);return pairs.length?pairs[0].slice(0,2):null;
 }
 if(ch.id==="devices2")for(var i=0;i<pool.length;i+=1)for(var j=i+1;j<pool.length;j+=1)if(distinctDevices([pool[i],pool[j]])>=2)return[pool[i],pool[j]];
 return null;
}
function ensureWitnessInHand(witness){
 witness.forEach(function(c){if(run.hand.indexOf(c.uid)>=0)return;
  var source=run.deck.indexOf(c.uid)>=0?run.deck:run.discardPile,at=source.indexOf(c.uid);if(at<0)return;source.splice(at,1);
  var outgoing=run.hand.find(function(id){var card=effectiveCard(id);return card&&!card.joker&&!witness.some(function(w){return w.uid===id;});});
  if(!outgoing)outgoing=run.hand.find(function(id){return!witness.some(function(w){return w.uid===id;});});
  if(outgoing){run.hand.splice(run.hand.indexOf(outgoing),1);run.deck.splice(Math.floor(Math.random()*(run.deck.length+1)),0,outgoing);}run.hand.push(c.uid);
 });
}
function rollChallenge(){
 var pool=collectionCards(),eligible=challenges.filter(function(c){return c.min<=run.districtIndex&&c.id!==run.challengeId&&witnessFor(c,pool)?.length>=2;});
 if(!eligible.length)eligible=challenges.filter(function(c){return c.min<=run.districtIndex&&witnessFor(c,pool)?.length>=2;});
 var map=activeMap(),weights=map&&map.weights||{},weighted=[];(eligible.length?eligible:[challengeById("rescate")]).forEach(function(c){var w=map?Number(weights[c.id]||1):1;for(var i=0;i<w;i+=1)weighted.push(c);});
 var ch=pick(weighted),witness=witnessFor(ch,pool);run.lastChallengeId=run.challengeId;run.challengeId=ch.id;if(witness&&witness.length>=2)ensureWitnessInHand(witness);
}
function currentChallenge(){return challengeById(run&&run.challengeId)||challenges[0];}

// Selection is an ordered view of the hand: movement never transfers ownership.
function moveCard(id,destination,index){
 if(!run||run.locked||run.finished||run.discardMode||run.hand.indexOf(id)<0)return false;
 var from=run.selected.indexOf(id);
 if(destination==="hand"){
  if(from<0)return false;
  run.selected.splice(from,1);
 }else if(destination==="slot"){
  if(from<0&&run.selected.length>=4)return false;
  if(from>=0)run.selected.splice(from,1);
  run.selected.splice(Math.max(0,Math.min(index,run.selected.length)),0,id);
 }else return false;
 renderGame();return true;
}
function toggleCard(id){
 if(!run||run.locked||run.hand.indexOf(id)<0)return;
 if(run.discardMode){
  var di=run.discardSelected.indexOf(id);
  if(di>=0)run.discardSelected.splice(di,1);
  else if(run.discardSelected.length<5)run.discardSelected.push(id);
  else showToast("Puedes descartar un máximo de cinco cartas por Cambio.","bad");
  renderGame();return;
 }
 if(!moveCard(id,run.selected.indexOf(id)>=0?"hand":"slot",run.selected.length))showToast("El atril admite cuatro pergaminos como máximo.","bad");
}
function removeSelected(id){moveCard(id,"hand",0);}
function moveSelected(id,dir){
 if(!run)return;var i=run.selected.indexOf(id),j=i+dir;
 if(i>=0&&j>=0&&j<run.selected.length)moveCard(id,"slot",j);
}
var cardDrag=null,suppressCardClick=false;
function dragDestination(x,y){
 var el=document.elementFromPoint(x,y),slot=el&&el.closest(".poemSlot");
 if(slot&&$("poemSlots").contains(slot)&&run&&!run.locked&&!run.discardMode&&(run.selected.indexOf(cardDrag.id)>=0||run.selected.length<4))return slot;
 var hand=el&&el.closest("#hand");
 return hand&&run&&!run.locked&&!run.discardMode&&run.selected.indexOf(cardDrag.id)>=0?hand:null;
}
function finishCardDrag(cancelled){
 var drag=cardDrag;if(!drag)return;cardDrag=null;
 if(drag.active){
  suppressCardClick=true;setTimeout(function(){suppressCardClick=false;},400);
  var target=cancelled?null:drag.target;
  var moved=target&&moveCard(drag.id,target.id==="hand"?"hand":"slot",Number(target.dataset.slotIndex));
  if(moved){var placed=target.id==="hand"?$("hand").querySelector('[data-card-id="'+drag.id+'"]'):$("poemSlots").children[run.selected.indexOf(drag.id)];if(placed)placed.classList.add("cardPlaced");drag.ghost.remove();}
  else{drag.ghost.style.transition="transform 220ms ease, opacity 220ms ease";drag.ghost.style.transform="translate("+drag.rect.left+"px,"+drag.rect.top+"px)";drag.ghost.style.opacity="0";setTimeout(function(){drag.ghost.remove();},220);}
  drag.source.classList.remove("dragSource");$("gameScreen").classList.remove("draggingCards");
  $("poemSlots").querySelectorAll(".dropReady,.dropOver").forEach(function(el){el.classList.remove("dropReady","dropOver");});$("hand").classList.remove("dropReady","dropOver");
 }
 if($("gameScreen").hasPointerCapture&&$("gameScreen").hasPointerCapture(drag.pointerId))$("gameScreen").releasePointerCapture(drag.pointerId);
}
function setupCardDrag(){
 var surface=$("gameScreen");
 surface.addEventListener("pointerdown",function(e){
  suppressCardClick=false;
  if(e.button!==0||e.isPrimary===false||!run||run.locked||run.discardMode||cardDrag)return;
  var source=e.target.closest("[data-card-id]");
  if(!source||e.target.closest(".slotNumber"))return;
  cardDrag={id:source.dataset.cardId,source:source,pointerId:e.pointerId,x:e.clientX,y:e.clientY,rect:source.getBoundingClientRect(),active:false};
 });
 surface.addEventListener("pointermove",function(e){
  var drag=cardDrag;if(!drag||drag.pointerId!==e.pointerId)return;
  if(!drag.active&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<8)return;
  e.preventDefault();
  if(!drag.active){
   surface.setPointerCapture(e.pointerId);drag.active=true;drag.ghost=document.createElement("div");drag.ghost.className="verseCard family-"+familyOf(effectiveCard(drag.id))+" dragGhost";drag.ghost.innerHTML=cardHTML(effectiveCard(drag.id),true);drag.ghost.style.width=Math.max(210,drag.rect.width)+"px";drag.ghost.style.height=Math.max(190,drag.rect.height)+"px";drag.ghost.setAttribute("aria-hidden","true");document.body.appendChild(drag.ghost);drag.source.classList.add("dragSource");surface.classList.add("draggingCards");
   if(run.selected.indexOf(drag.id)>=0||run.selected.length<4)$("poemSlots").querySelectorAll(".poemSlot").forEach(function(el){el.classList.add("dropReady");});
   if(run.selected.indexOf(drag.id)>=0)$("hand").classList.add("dropReady");
  }
  drag.ghost.style.transform="translate("+(e.clientX-45)+"px,"+(e.clientY-45)+"px) rotate(2deg)";
  if(drag.target)drag.target.classList.remove("dropOver");drag.target=dragDestination(e.clientX,e.clientY);if(drag.target)drag.target.classList.add("dropOver");
  var handRect=$("hand").getBoundingClientRect();if(e.clientY>=handRect.top&&e.clientY<=handRect.bottom){if(e.clientX>handRect.right-48)$("hand").scrollLeft+=18;else if(e.clientX<handRect.left+48)$("hand").scrollLeft-=18;}
 });
 surface.addEventListener("pointerup",function(e){if(cardDrag&&cardDrag.pointerId===e.pointerId){if(cardDrag.active){e.preventDefault();cardDrag.target=dragDestination(e.clientX,e.clientY);}finishCardDrag(false);}});
 surface.addEventListener("pointercancel",function(){finishCardDrag(true);});
 surface.addEventListener("pointerleave",function(){if(cardDrag&&!cardDrag.active)finishCardDrag(true);});
 surface.addEventListener("keydown",function(e){if(e.key==="Escape")finishCardDrag(true);});
 surface.addEventListener("lostpointercapture",function(e){if(e.target===surface&&cardDrag&&cardDrag.pointerId===e.pointerId)finishCardDrag(true);});
 surface.addEventListener("click",function(e){if(suppressCardClick){suppressCardClick=false;e.preventDefault();e.stopImmediatePropagation();}},true);
 if(window.addEventListener)window.addEventListener("blur",function(){finishCardDrag(true);});
}
function clearSelection(){
 if(!run||run.locked)return;
 if(run.discardMode){run.discardMode=false;run.discardSelected=[];showToast("Descarte cancelado.","");renderGame();return;}
 run.selected=[];renderGame();
}
function canonicalPattern(values){var seen={},next=0,letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ";return values.map(function(v){if(seen[v]===undefined){seen[v]=letters[next]||"X";next+=1;}return seen[v];}).join("");}

function analyze(ids){
 var originals=ids.map(effectiveCard).filter(Boolean),jokers=originals.filter(function(c){return c.joker;}),anchors=originals.filter(function(c){return!c.joker;});
 if(!jokers.length)return analyzeResolved(originals,{});
 if(!anchors.length){var empty=analyzeResolved(originals,{});empty.noAnchor=true;empty.name="El comodín necesita un verso real";empty.score=0;empty.tags=[];return empty;}
 var best=null,ch=currentChallenge();
 function tryLinks(index,chosen,links){
  if(index===originals.length){var a=analyzeResolved(chosen,links),met=ch.test(a),bestMet=best&&!best.noAnchor&&ch.test(best);if(!best||met&&!bestMet||met===bestMet&&a.score>best.score)best=a;return;}
  var c=originals[index];if(!c.joker){tryLinks(index+1,chosen.concat([c]),links);return;}
  anchors.forEach(function(source){var copy=Object.assign({},c,{text:source.text,meter:source.meter,rhyme:source.rhyme,rhymeType:source.rhymeType,theme:source.theme,devices:[]}),next=Object.assign({},links);next[c.uid]=source.uid;tryLinks(index+1,chosen.concat([copy]),next);});
 }
 tryLinks(0,[],{});best.jokerCount=jokers.length;best.tags.push(jokers.length===1?"1 comodín imita otro verso":"2 comodines imitan otros versos");return best;
}
function analyzeResolved(chosen,links){
 var n=chosen.length;
 if(!n)return{name:"Elige de 2 a 4 versos",score:0,tags:[],breakdown:[],structured:false,pattern:"",tier:"",n:0,devices:[],formBonus:0,allMeter:false,meterValue:0,sameRhyme:false,rhymeKind:"",sameTheme:false,resolvedCards:[],jokerSources:links,jokerCount:0};
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
 var specialBonus=chosen.reduce(function(sum,c){return sum+powerBonus(c,{repeated:repeated.length>0,allMeter:allMeter,devices:devices,n:n,pattern:pattern});},0);
 var subtotal=base+rhymeBonus+formBonus+meterBonus+deviceBonus+themeBonus+specialBonus,multiplier=1,d=districts[run.districtIndex],active=run.muses;
 if(d.focus==="rhyme"&&rhymeBonus>0)multiplier*=1.25;if(d.focus==="meter"&&allMeter)multiplier*=1.28;if(d.focus==="devices")subtotal+=devices.length*55;if(d.focus==="all"&&formBonus>0)multiplier*=1.18;
 if(active.indexOf("eco")>=0&&rhymeBonus>0)multiplier*=1.30;if(active.indexOf("pulso")>=0&&allMeter)multiplier*=1.35;if(active.indexOf("imagen")>=0)subtotal+=devices.length*55;
 if(active.indexOf("arquitecta")>=0&&n===4&&(pattern==="ABAB"||pattern==="ABBA"||pattern==="AABB"))multiplier*=1.40;if(active.indexOf("duende")>=0&&run.firstPlay)multiplier*=1.50;if(active.indexOf("afinacion")>=0&&n===4&&allMeter)subtotal+=180;if(active.indexOf("coleccionista")>=0&&devices.length>=2)subtotal+=140;
 var score=Math.round(subtotal*multiplier),tags=[];
 if(repeated.length||sameRhyme)tags.push("Rima "+rhymeKind+(n===4?" · "+pattern:""));if(allMeter)tags.push(meters[0]+" sílabas · ritmo uniforme");if(devices.length)tags.push(devices.join(" · "));if(sameTheme)tags.push("tema: "+chosen[0].theme);
 if(specialBonus)tags.push("Lacres especiales +"+specialBonus);
 var breakdown=[{label:"Lacres especiales",value:specialBonus},{label:"Versos",value:base},{label:"Rima y forma",value:rhymeBonus+formBonus},{label:"Ritmo",value:meterBonus},{label:"Recursos",value:deviceBonus+(d.focus==="devices"?devices.length*55:0)+(active.indexOf("imagen")>=0?devices.length*55:0)},{label:"Tema",value:themeBonus}];
 if(multiplier>1)breakdown.push({label:"Sinergias",value:"×"+multiplier.toFixed(2).replace(".",",")});
 var structured=!!(rhymeBonus||meterBonus||devices.length>=2||sameTheme),tier=score>=900?"LEGENDARIA":score>=650?"MAGISTRAL":score>=430?"POTENTE":score>=280?"SÓLIDA":"IMPROVISADA";
 return{name:name,score:score,specialBonus:specialBonus,tags:tags,breakdown:breakdown,structured:structured,pattern:pattern,rhymes:rhymes,meters:meters,allMeter:allMeter,meterValue:allMeter?meters[0]:0,sameRhyme:sameRhyme,rhymeKind:rhymeKind,devices:devices,sameTheme:sameTheme,formBonus:formBonus,tier:tier,n:n,resolvedCards:chosen,jokerSources:links,jokerCount:0};
}

function contractMet(a){return!a.noAnchor&&currentChallenge().test(a);}
function contractDamage(a){return Math.round(a.score*currentChallenge().mult);}
function renderGame(){
 if(!run)return;
 var d=districts[run.districtIndex],a=analyze(run.selected),ch=currentChallenge(),met=run.selected.length>=2&&contractMet(a),remainingPct=Math.max(0,Math.round(run.rivalPrestige/run.maxPrestige*100)),map=activeMap(),hiddenHint=map&&run.districtIndex>=2;
 $("gameScreen").dataset.theme=d.focus;$("gameScreen").dataset.scene=map?map.scene:"legacy";$("gameScreen").dataset.boss=map&&run.districtIndex===3?"yes":"no";$("districtStep").textContent="DUELO "+(run.districtIndex+1)+" / "+districts.length;$("districtName").textContent=d.name;$("rivalRank").textContent=d.rank;$("rivalName").textContent=d.rival;$("rivalPortrait").textContent=map?"":d.portrait;$("rivalPortrait").style.backgroundImage=map?'url("'+SPRITE_ASSETS.rivals.replace("{scene}",map.scene).replace("{stage}",run.districtIndex)+'")':"";$("rivalRule").textContent=d.rule;$("rivalStage").title=d.rule;
 $("handsText").textContent=run.handsLeft;$("discardsText").textContent=run.discardsLeft;$("streakText").textContent="×"+run.streak;$("runScoreText").textContent=run.runScore.toLocaleString("es-ES");
 $("prestigeText").textContent=run.rivalPrestige.toLocaleString("es-ES")+" / "+run.maxPrestige.toLocaleString("es-ES");$("prestigeFill").style.width=remainingPct+"%";
 $("deckCount").textContent=run.cardPool.length;$("discardCount").textContent=run.discardPile.length;$("handSizeText").textContent=run.handSize;$("drawPileCount").textContent=run.deck.length;
 $("comboName").textContent=hiddenHint&&run.selected.length?"Tu lectura del poema":a.name;$("scorePreview").textContent=hiddenHint?"?":(met?contractDamage(a):a.score).toLocaleString("es-ES");$("comboTags").innerHTML=hiddenHint?"":a.tags.map(function(t){return"<span>"+t+"</span>";}).join("");
 $("analysisTitle").textContent=hiddenHint?"Analiza antes de jugar":run.selected.length?a.tier+" · "+a.name:"Busca una combinación";$("analysisText").textContent=run.lastFeedback||(!hiddenHint&&run.selected.length?describeAnalysis(a):"Lee los versos y decide si cumplen el contrato.");
 $("analysisBreakdown").innerHTML=hiddenHint?"":a.breakdown.map(function(row){return"<div><span>"+row.label+"</span><b>"+(typeof row.value==="number"?"+ "+row.value.toLocaleString("es-ES"):row.value)+"</b></div>";}).join("");
 $("challengeTitle").textContent=ch.title;$("challengeDesc").textContent=ch.desc;$("challengeMultiplier").textContent="×"+String(ch.mult).replace(".",",");
 $("challengeBanner").className="challengeBanner"+(hiddenHint?"":run.selected.length>=2?(met?" met":" fail"):"");$("challengeState").textContent=hiddenHint?"A TU JUICIO":run.selected.length<2?"PENDIENTE":met?"CUMPLIDO":"BLOQUEADO";
 $("codexTip").textContent=hiddenHint?"Solo al jugar sabrás si tu análisis fue correcto. Un fallo consume la ronda y la Inspiración.":contractTip(a,met,d,ch);$("scanBtn").classList.toggle("hidden",!map||map.id!=="torre"||run.districtIndex!==1);$("scanBtn").disabled=!!run.scanReveal;renderSlots();renderHand();renderActiveMuses();renderInspiration();renderRoute();renderChangeConsole();
 $("tablePoemsBtn").disabled=!!run.locked;
 var play=$("playBtn"),discardBtn=$("discardBtn"),shuffleBtn=$("shuffleHandBtn"),clearBtn=$("clearBtn");
 play.classList.remove("validAttack","invalidAttack");
 if(run.discardMode){
  play.textContent="MODO DESCARTE";play.disabled=true;
  discardBtn.textContent=run.discardSelected.length?"✓ DESCARTAR "+run.discardSelected.length+" · −1":"MARCA HASTA 5 CARTAS";
  discardBtn.disabled=run.locked||run.discardsLeft<=0||!run.discardSelected.length;
  shuffleBtn.disabled=true;
  clearBtn.textContent="✕ CANCELAR";clearBtn.disabled=false;
 }else{
  if(run.selected.length<2){play.textContent="ELIGE VERSOS";play.disabled=true;}
  else if(met||hiddenHint){play.textContent=hiddenHint?"JUGAR VERSOS":"ATACAR · "+("×"+String(ch.mult).replace(".",","));play.disabled=run.locked||run.handsLeft<=0;if(!hiddenHint)play.classList.add("validAttack");}
  else{play.textContent="✖ FORZAR JUGADA";play.disabled=run.locked||run.handsLeft<=0;play.classList.add("invalidAttack");}
  discardBtn.textContent="🗑 DESCARTAR · −1";discardBtn.disabled=run.locked||run.discardsLeft<=0||!run.hand.length;
  shuffleBtn.textContent="⟳ BARAJAR · −1";shuffleBtn.disabled=run.locked||!run.hand.length||run.discardsLeft<=0;
  clearBtn.textContent="↩ DEVOLVER";clearBtn.disabled=run.locked||!run.selected.length;
 }
}
function contractTip(a,met,d,ch){
 if(!run.selected.length)return"Contrato: "+ch.desc+" Usa descartes antes de gastar una ronda.";
 if(!met)return"NO CUMPLE: si fuerzas esta jugada no atacarás y perderás "+(d.failPenalty)+" de Inspiración.";
 var dmg=contractDamage(a);if(dmg<d.threshold)return"CUMPLE, pero el impacto es bajo: el rival podría replicar después del ataque.";
 return"CUMPLE Y BLOQUEA: el contrato multiplica tu impacto y la réplica queda anulada.";
}
function describeAnalysis(a){var parts=[];if(a.noAnchor)return"El comodín necesita al menos un verso real para copiar su rima, medida y tema.";if(a.pattern&&a.n===4)parts.push("Esquema "+a.pattern+".");if(a.allMeter)parts.push("Ritmo uniforme de "+a.meterValue+" sílabas.");if(a.devices.length)parts.push("Recursos: "+a.devices.join(", ")+".");if(a.jokerCount)parts.push("El comodín imita otro verso de tu selección.");if(!parts.length)parts.push("La selección todavía carece de una estructura fuerte.");return parts.join(" ");}
function scansionFeedback(ids,a){return ids.map(function(id,i){var original=effectiveCard(id),source=original.joker?effectiveCard(a.jokerSources[id]):original;if(!source)return (i+1)+". Comodín sin verso de referencia.";if(source.generated){var reading=source.reading;return (i+1)+". "+(original.joker?"Comodín → ":"")+source.text+" → "+source.meter+" sílabas ("+reading.synalephas+" sinalefas; ajuste final "+reading.last.adjustment+").";}var scan=SCANS[source.id],sinalefa=scan.indexOf("_")>=0?"sinalefa marcada con _":"sin sinalefa",final=source.id.indexOf("or")===0?"aguda +1":"llana +0";return (i+1)+". "+(original.joker?"Comodín → ":"")+scan+" → "+source.meter+" sílabas ("+sinalefa+", "+final+").";}).join("\n");}

function renderInspiration(){$("inspirationHearts").innerHTML="";for(var i=0;i<run.maxInspiration;i+=1){var heart=document.createElement("i");heart.textContent="✦";if(i>=run.inspiration)heart.className="empty";$("inspirationHearts").appendChild(heart);}}
function renderChangeConsole(){
 var tokens="";for(var i=0;i<run.discardsLeft;i+=1)tokens+='<i>◆</i>';
 $("changeTokens").innerHTML=tokens||'<i class="spent">×</i>';
 $("changeCountText").textContent=run.discardsLeft+" cambio"+(run.discardsLeft===1?"":"s")+" disponible"+(run.discardsLeft===1?"":"s");
 if(run.discardMode){$("handHintTitle").textContent="MODO DESCARTE";$("handHintText").textContent="Marca hasta 5 cartas de la mano y confirma. No gastas ronda.";}
 else{$("handHintTitle").textContent="CAMBIOS DISPONIBLES";$("handHintText").textContent="Descartar o barajar consume 1. No gasta ronda.";}
 $("changeConsole").classList.toggle("active",!!run.discardMode);
}
function renderRoute(){$("routePips").innerHTML="";for(var i=0;i<districts.length;i+=1){var p=document.createElement("i");if(i<run.districtIndex)p.className="done";else if(i===run.districtIndex)p.className="current";$("routePips").appendChild(p);}}
function renderSlots(){
 $("poemSlots").innerHTML="";
 var resolved=analyze(run.selected).resolvedCards||[],pattern=activeMap()&&activeMap().id==="teatro"?({abba:"ABBA",abab:"ABAB",aabb:"AABB",consonanteABBA:"ABBA",consonanteABAB:"ABAB"}[run.challengeId]||""):"";if(pattern&&resolved[0]&&resolved[0].meter<=8)pattern=pattern.toLowerCase();
 for(var i=0;i<4;i+=1){var id=run.selected[i],c=resolved[i],slot=document.createElement("div");slot.dataset.slotIndex=i;if(id)slot.dataset.cardId=id;slot.className="poemSlot"+(c?" filled":"")+(c&&c.joker?" jokerSlot":"");if(pattern){slot.dataset.guide=pattern[i];if(c){var previous=pattern.slice(0,i).indexOf(pattern[i]);if(previous>=0&&resolved[previous]&&resolved[previous].rhyme===c.rhyme)slot.classList.add("guideMatch");}}if(c&&resolved.slice(0,i).some(function(o){return o&&o.rhyme===c.rhyme&&o.rhymeType===c.rhymeType;}))slot.classList.add(c.rhymeType==="asonante"?"echoMatch":"sealMatch");
  if(c){var text=document.createElement("span");text.textContent=(i+1)+". "+(c.joker?"COMODÍN → ":"")+c.text;slot.appendChild(text);var controls=document.createElement("span");controls.className="slotNumber";
   var up=document.createElement("button");up.type="button";up.textContent="↑";up.setAttribute("aria-label","Subir verso");up.disabled=i===0;up.addEventListener("click",function(cardId){return function(e){e.stopPropagation();moveSelected(cardId,-1);};}(id));
   var down=document.createElement("button");down.type="button";down.textContent="↓";down.setAttribute("aria-label","Bajar verso");down.disabled=i===run.selected.length-1;down.addEventListener("click",function(cardId){return function(e){e.stopPropagation();moveSelected(cardId,1);};}(id));
   var del=document.createElement("button");del.type="button";del.textContent="×";del.setAttribute("aria-label","Devolver verso a la mano");del.addEventListener("click",function(cardId){return function(e){e.stopPropagation();removeSelected(cardId);};}(id));
   controls.appendChild(up);controls.appendChild(down);controls.appendChild(del);slot.appendChild(controls);
  }else slot.textContent="Verso "+(i+1);$("poemSlots").appendChild(slot);
 }
}
function cardHTML(c,combat){var html=plainCardHTML(c,combat),rarity=c.rarity||"common",power=c.power&&window.VersopolisVerseBank.powers[c.power];
 if(rarity!=="common")html='<span class="rarityRibbon '+rarity+'">'+({rare:'◆ RARA',epic:'✦ ÉPICA',legendary:'★ LEGENDARIA'}[rarity])+'</span>'+html;
 if(power)html+='<span class="powerRibbon" title="'+power.description+'">'+power.label+'</span>';
 return html;}
function plainCardHTML(c,combat){
 var fam=familyOf(c),device=c.devices.length?'<span class="device">'+c.devices[0]+"</span>":"";
 if(c.joker)return '<span class="cardCorners"><b class="meterBadge">★</b><b class="rhymeSeal">✦</b></span><span class="jokerBody"><img src="./assets/art/'+(c.id==="joker_eco"?"joker-eco":"joker-pulso")+'.webp" alt=""><strong>'+c.text+'</strong><small>Imita rima, medida y tema de otro verso elegido</small></span><span class="cardMeta"><span class="cardFamily">COMODÍN</span><span>VERSO LIBRE</span></span>'+(c.level?'<span class="cardLevel">'+stars(c.level)+'</span>':"");
 if(combat&&activeMap()){var phase=run.districtIndex;if(phase===3)return '<span class="verseText">'+c.text+'</span>';if(phase===2)return '<span class="verseText">'+c.text+'</span><span class="cardMeta"><span>'+c.rhymeType+'</span></span>';if(phase===1){return '<span class="cardCorners"><b class="meterBadge">'+(run.scanReveal?c.meter:"?")+'</b><b class="rhymeSeal">-'+c.rhyme+'</b></span><span class="verseText">'+c.text+'</span><span class="cardMeta"><span>'+c.rhymeType+'</span></span>';}}
 return'<span class="cardCorners"><b class="meterBadge">'+c.meter+'</b><b class="rhymeSeal">-'+c.rhyme+'</b></span><span class="verseText">'+c.text+'</span><span class="cardMeta"><span class="cardFamily">'+familyLabel(fam)+'</span>'+device+'<span class="theme">'+c.theme+'</span></span>'+(c.level?'<span class="cardLevel">'+stars(c.level)+'</span>':"");
}
function cardHelpsContract(c){
 var ch=currentChallenge();if(!ch||!run.selected.length)return false;
 var testIds=run.selected.indexOf(c.uid)>=0?run.selected.slice():run.selected.concat([c.uid]);if(testIds.length>4)return false;
 return contractMet(analyze(testIds));
}
var renderedHandIds=[];
function renderHand(){
 var handScroll=$("hand").scrollLeft||0;
 $("hand").innerHTML="";$("hand").classList.toggle("discardMode",!!run.discardMode);
 run.hand.forEach(function(id){
  var c=effectiveCard(id),b=document.createElement("button"),fam=familyOf(c),discardPick=run.discardMode&&run.discardSelected.indexOf(id)>=0;
  b.type="button";b.className="verseCard family-"+fam+(run.selected.indexOf(id)>=0&&!run.discardMode?" selected":"")+(run.districtIndex<2&&cardHelpsContract(c)&&!run.discardMode?" cardSynergy":"")+(discardPick?" discardPick":"");
  if(renderedHandIds.indexOf(id)<0)b.classList.add("cardDealt");b.dataset.rarity=c.rarity||"common";b.dataset.cardId=id;b.dataset.hints=run.districtIndex>=2&&!c.joker?"hidden":"shown";b.title=(c.joker||run.districtIndex>0?c.text:"Tema: "+c.theme+" · "+familyLabel(fam))+(c.power?" · "+window.VersopolisVerseBank.powers[c.power].description:"");b.setAttribute("aria-pressed",String(run.selected.indexOf(id)>=0||!!discardPick));b.innerHTML=cardHTML(c,true)+(discardPick?'<span class="discardStamp">DESCARTAR</span>':"");
  b.addEventListener("click",function(){toggleCard(id);});$("hand").appendChild(b);
 });
 renderedHandIds=run.hand.slice();$("hand").scrollLeft=handScroll;
}
function renderActiveMuses(){$("activeMuses").innerHTML=run.muses.length?'<span class="eyebrow">MUSAS ACTIVAS</span>'+run.muses.map(function(id){var m=museById(id);return m?'<span class="museUnit">'+museArt(id)+m.name+"</span>":"";}).join(""):"";}

function showBurst(kicker,title,big,tags,hit){
 if(comboTimer)clearTimeout(comboTimer);$("comboBurstKicker").textContent=kicker;$("comboBurstTitle").textContent=title;$("comboBurstDamage").textContent=big;$("comboBurstTags").textContent=tags||"";
 $("comboBurst").classList.remove("show");void $("comboBurst").offsetWidth;$("comboBurst").classList.add("show");
 if(hit){$("gameScreen").classList.remove("impact");void $("gameScreen").offsetWidth;$("gameScreen").classList.add("impact");$("gameScreen").classList.add("musePulse");$("rivalStage").classList.remove("hit");void $("rivalStage").offsetWidth;$("rivalStage").classList.add("hit");}
 comboTimer=setTimeout(function(){$("comboBurst").classList.remove("show");$("gameScreen").classList.remove("impact","musePulse");$("rivalStage").classList.remove("hit");},1000);
}
function playSelection(){
 if(!run||run.locked||run.selected.length<2||run.handsLeft<=0)return;
 var d=districts[run.districtIndex],a=analyze(run.selected),ch=currentChallenge(),met=contractMet(a);
 run.locked=true;run.handsLeft-=1;run.stats.compositions+=1;
 run.lastFeedback=(met?"Cumplido. ":"Contrato fallido. ")+describeAnalysis(a)+" Exigía: "+ch.desc+"\n"+scansionFeedback(run.selected,a);
 if(!met){run.stats.failedContracts+=1;run.streak=0;run.inspiration=Math.max(0,run.inspiration-d.failPenalty);moveSelectedToDiscard();$("rivalSpeech").textContent=pick(d.taunts);$("playerPanel").classList.remove("hurt");void $("playerPanel").offsetWidth;$("playerPanel").classList.add("hurt");showBurst("CONTRATO FALLIDO",ch.title,"SIN ATAQUE","−"+d.failPenalty+" Inspiración",false);renderGame();bridgeCall("checkpoint","contract_failed");setTimeout(afterFailedTurn,900);return;}
 var damage=contractDamage(a);window.VersopolisPoems.capture(a.resolvedCards.map(function(c){return c.text;}),{form:a.name,pattern:a.pattern,score:damage,map:activeMap()&&activeMap().name||"Versópolis",jokers:a.jokerCount});run.stats.contracts+=1;if(a.structured){run.stats.structured+=1;run.streak+=1;}else run.streak=0;run.bestStreak=Math.max(run.bestStreak,run.streak);run.stats.bestCombo=Math.max(run.stats.bestCombo,damage);run.runScore+=damage;run.rivalPrestige=Math.max(0,run.rivalPrestige-damage);run.firstPlay=false;moveSelectedToDiscard();renderGame();
 recordComposition(a);checkAchievements();
 $("damageFloat").textContent="−"+damage.toLocaleString("es-ES");$("damageFloat").classList.remove("show");void $("damageFloat").offsetWidth;$("damageFloat").classList.add("show");showBurst(a.tier+" · CONTRATO CUMPLIDO",a.name,"−"+damage.toLocaleString("es-ES")+" PRESTIGIO",ch.title+" · "+(a.tags[0]||""),true);bridgeCall("checkpoint","contract_attack");
 setTimeout(function(){if(!run||run.finished)return;if(run.rivalPrestige<=0){run.locked=false;winDistrict();return;}rivalCounter(damage);},900);
}
function afterFailedTurn(){
 if(!run||run.finished)return;run.locked=false;if(run.inspiration<=0||run.handsLeft<=0){loseRun();return;}run.scanReveal=false;rollChallenge();renderGame();
}
function rivalCounter(damage){
 var d=districts[run.districtIndex],weak=damage<d.threshold;
 if(weak){run.inspiration=Math.max(0,run.inspiration-1);$("rivalSpeech").textContent="«Cumpliste el contrato, pero tu golpe dejó hueco para mi réplica.»";$("playerPanel").classList.remove("hurt");void $("playerPanel").offsetWidth;$("playerPanel").classList.add("hurt");showToast("RÉPLICA · El impacto fue insuficiente: −1 Inspiración.","bad");}
 else{$("rivalSpeech").textContent=d.blocked;showToast("RÉPLICA BLOQUEADA · Contrato e impacto superados.","ok");}
 run.locked=false;bridgeCall("checkpoint","rival_reply");if(run.inspiration<=0||run.handsLeft<=0){renderGame();setTimeout(loseRun,500);return;}run.scanReveal=false;rollChallenge();renderGame();
}
function discardSelection(){
 if(!run||run.locked||run.discardsLeft<=0)return;
 if(!run.discardMode){
  run.selected=[];run.discardSelected=[];run.discardMode=true;renderGame();
  showToast("MODO DESCARTE · Marca hasta 5 cartas de la mano.","");
  return;
 }
 if(!run.discardSelected.length)return;
 var thrown=run.discardSelected.slice(),n=thrown.length;animateDepartingCards(thrown);
 thrown.forEach(function(id){var i=run.hand.indexOf(id);if(i>=0)run.hand.splice(i,1);run.discardPile.push(id);});
 run.discardSelected=[];run.discardMode=false;run.discardsLeft-=1;drawToHand();renderGame();
 showToast("DESCARTE · Cambias "+n+" carta"+(n===1?"":"s")+". Te quedan "+run.discardsLeft+" Cambios.","");
 bridgeCall("checkpoint","discard_cards");
}
function shuffleHand(){
 if(!run||run.locked||run.discardMode||!run.hand.length||run.discardsLeft<=0)return;
 var n=run.hand.length;
 run.selected=[];run.discardSelected=[];
 run.hand.slice().forEach(function(id){run.discardPile.push(id);});
 run.hand=[];
 run.discardsLeft-=1;
 drawToHand();
 renderGame();
 showToast("BARAJAR · Renuevas "+n+" cartas. Te quedan "+run.discardsLeft+" Cambios.","");
 bridgeCall("checkpoint","shuffle_hand");
}

function winDistrict(){
 if(!run||run.finished)return;var d=districts[run.districtIndex];run.stats.districtsCleared+=1;career.districtsCleared+=1;if(run.mapId){career.mapProgress=career.mapProgress||{};career.mapProgress[run.mapId]=Math.max(Number(career.mapProgress[run.mapId]||0),run.districtIndex+1);}career.bestCombo=Math.max(Number(career.bestCombo||0),run.stats.bestCombo);checkAchievements();saveCareer();$("rivalSpeech").textContent="«El distrito reconoce tu victoria.»";showToast("MAESTRO VENCIDO · "+d.rival+" pierde todo su Prestigio.","ok");bridgeCall("checkpoint","district_cleared");
 if(run.districtIndex>=districts.length-1){run.won=true;setTimeout(finishRun,850);return;}
 run.districtIndex+=1;run.districtStarted=false;run.selected=[];run.awaitingEvent=true;var anchors=[["Brilla la luna en el mar","Guarda mi voz el camino"],["Vuelve la luz cada día","Tiembla la tarde callada"],["Guarda la luna de plata","Brilla la luz del vecino"]][(run.districtIndex-1)%3];run.writingRound={a:anchors[0],b:anchors[1],draftA:"",draftB:"",done:false};setTimeout(function(){showEvent();},850);
}

function showWriting(){
 show("writingScreen");var w=run.writingRound;$("writingAnchorA").textContent="1 · "+w.a;$("writingAnchorB").textContent="2 · "+w.b;$("writingA").value=w.draftA||"";$("writingB").value=w.draftB||"";$("writingFeedback").textContent="8 sílabas · ABAB · no repitas las palabras finales";
}
function submitWriting(event){
 event.preventDefault();if(!run||!run.writingRound||run.writingRound.done)return;
 var w=run.writingRound,first=$("writingA").value.trim(),second=$("writingB").value.trim(),a=window.VersopolisProsody.evaluate(first,w.a),b=window.VersopolisProsody.evaluate(second,w.b);
 w.draftA=first;w.draftB=second;run.stats.compositions++;var ok=a.meterMatches&&a.rhymeMatches&&b.meterMatches&&b.rhymeMatches;
 $("writingFeedback").textContent="Verso 3: "+a.syllables+" sílabas · "+(a.rhymeMatches?"rima ✓":"revisa la rima A")+". Verso 4: "+b.syllables+" sílabas · "+(b.rhymeMatches?"rima ✓":"revisa la rima B")+".";
 if(ok){run.stats.contracts++;run.stats.structured++;run.runScore+=250;run.inspiration=Math.min(run.maxInspiration,run.inspiration+1);w.done=true;w.poem=[w.a,w.b,first,second];window.VersopolisPoems.capture(w.poem,{title:"Mi voz · estrofa ABAB",kind:"escrita",form:"ABAB",score:250,map:activeMap().name});saveCareer();showToast("ESTROFA SELLADA · +250 prestigio y +1 inspiración","ok");showEvent();}else{run.stats.failedContracts++;showToast("Revisa el cómputo y las palabras finales. Puedes volver a intentarlo.","bad");}
 bridgeCall("checkpoint","written_stanza");
}
$("writingForm").addEventListener("submit",submitWriting);
["writingA","writingB"].forEach(function(id){$(id).addEventListener("input",function(){if(!run?.writingRound)return;run.writingRound.draftA=$("writingA").value;run.writingRound.draftB=$("writingB").value;persist();});});
$("writingSkip").onclick=function(){if(run?.writingRound){run.writingRound.done=true;showEvent();bridgeCall("checkpoint","writing_skipped");}};
$("writingSave").onclick=saveAndHome;
function showEvent(){
 if(!run)return;if(run.writingRound&&!run.writingRound.done){showWriting();return;}run.awaitingEvent=true;run.locked=false;
 var map=activeMap(),choices=events.filter(function(e){return e.id!==run.lastEventId&&(!map||map.events.indexOf(e.id)>=0);}),ev=run.eventId?eventById(run.eventId):pick(choices.length?choices:events);run.eventId=ev.id;run.lastEventId=ev.id;show("eventScreen");
 $("eventIcon").textContent=ev.icon;$("eventTitle").textContent=ev.title;$("eventText").textContent=ev.text;$("eventChoices").className="eventChoices";$("eventChoices").innerHTML="";
 ev.choices.forEach(function(c){var b=document.createElement("button"),full=run.cardPool.length>=MAX_DECK_SIZE&&["draft","draftRare","duplicate"].indexOf(c.action)>=0;b.type="button";b.className="eventChoice";b.disabled=full;b.innerHTML='<span class="eventChoiceIcon"><img src="'+eventActionArt(c.action)+'" alt=""></span><b>'+c.title+'</b><p>'+(full?"Mazo completo: 54 cartas.":c.desc)+'</p><small>'+(full?"LÍMITE ALCANZADO":c.reward)+'</small>';b.addEventListener("click",function(){resolveEventAction(c.action);});$("eventChoices").appendChild(b);});
 renderEventSummary();
}
function eventActionArt(action){var name={heal2:"inspiration",maxInspiration:"inspiration",discardPlus:"change",draft:"deck",draftRare:"deck",duplicate:"deck",remove:"discard",upgrade:"quill",handPlus:"deck"}[action]||"event";return"./assets/art/hud-"+name+".webp";}
function renderEventSummary(){$("eventRunSummary").innerHTML='<span>✦ Inspiración '+run.inspiration+"/"+run.maxInspiration+'</span><span>▤ '+run.cardPool.length+'/'+MAX_DECK_SIZE+' cartas</span><span>♻ +'+run.bonusDiscards+' descartes</span><span>☰ mano '+run.handSize+'</span>';}
function recordEventAction(action){run.eventActions=run.eventActions||{};run.eventActions[action]=(run.eventActions[action]||0)+1;}
function resolveEventAction(action){
 if(run.cardPool.length>=MAX_DECK_SIZE&&["draft","draftRare","duplicate"].indexOf(action)>=0)return;
 if(["draft","draftRare","upgrade","remove","duplicate"].indexOf(action)<0)recordEventAction(action);
 if(action==="heal2"){run.inspiration=Math.min(run.maxInspiration,run.inspiration+2);finishEvent("La fuente devuelve claridad a tu pluma.");return;}
 if(action==="discardPlus"){run.bonusDiscards+=1;finishEvent("A partir de ahora tendrás un descarte adicional en cada duelo.");return;}
 if(action==="handPlus"){run.handSize=Math.min(9,run.handSize+1);finishEvent("Tu mano permanente aumenta a "+run.handSize+" cartas.");return;}
 if(action==="maxInspiration"){run.maxInspiration+=1;run.inspiration=Math.min(run.maxInspiration,run.inspiration+1);finishEvent("Tu reserva máxima de Inspiración aumenta.");return;}
 if(action==="draft"||action==="draftRare"){showDraft(action==="draftRare");return;}
 if(action==="upgrade"||action==="remove"||action==="duplicate"){openDeckAction(action);return;}
}
function showDraft(rare){
 if(run.cardPool.length>=MAX_DECK_SIZE)return;
 var pool=cards.filter(function(c){return!c.joker;});if(rare)pool=pool.filter(function(c){return !!c.power;});
 var offers=shuffle(pool).slice(0,3);$("eventTitle").textContent=rare?"Pergaminos selectos":"Elige un nuevo verso";$("eventText").textContent="La carta elegida entra permanentemente en tu mazo para el resto de la expedición.";$("eventChoices").className="eventChoices draftMode";$("eventChoices").innerHTML="";
 offers.forEach(function(base){var temp=Object.assign({},base,{uid:"preview",level:rare?1:0}),b=document.createElement("button");b.type="button";b.className="verseCard family-"+familyOf(temp);b.innerHTML=cardHTML(temp);b.addEventListener("click",function(){if(run.cardPool.length>=MAX_DECK_SIZE)return;recordEventAction(rare?"draftRare":"draft");run.cardPool.push(makeInstance(base.id,rare?1:0));finishEvent("Has añadido «"+base.text+"» al mazo.");});$("eventChoices").appendChild(b);});
}
function finishEvent(message){
 run.awaitingEvent=false;run.eventId=null;checkAchievements();bridgeCall("checkpoint","event_resolved");showToast(message||"Evento resuelto.","ok");setTimeout(function(){showMuseChoice("Elige una Musa","Una nueva inspiración te acompaña antes de "+districts[run.districtIndex].name+".");},350);
}

function openDeckAction(mode){
 deckView={mode:mode,from:"event"};show("deckScreen");renderDeckScreen();
}
function openDeckInspect(){deckView={mode:"inspect",from:"game"};show("deckScreen");renderDeckScreen();}
function renderDeckScreen(){
 var mode=deckView.mode,titles={inspect:"Tu mazo",upgrade:"Elige un verso para mejorar",remove:"Elige un verso para eliminar",duplicate:"Elige un verso para duplicar"},texts={inspect:"Estas son todas las cartas que pueden aparecer durante el duelo.",upgrade:"La carta gana +25 de valor base. Nivel máximo III.",remove:"La carta desaparece de toda la expedición. No puedes bajar de 14 cartas.",duplicate:"Añadirás una segunda copia con el mismo nivel."};
 $("deckScreenTitle").textContent=mode==="inspect"?"TU MAZO":"MODIFICAR MAZO";$("deckActionTitle").textContent=titles[mode];$("deckActionText").textContent=texts[mode];$("deckStats").innerHTML='<span>'+run.cardPool.length+'/'+MAX_DECK_SIZE+' cartas</span><span>mano '+run.handSize+'</span><span>+'+run.bonusDiscards+' descartes</span>';$("deckGrid").innerHTML="";
 run.cardPool.slice().sort(function(a,b){var ca=effectiveCard(a.uid),cb=effectiveCard(b.uid);return ca.rhyme.localeCompare(cb.rhyme)||ca.meter-cb.meter;}).forEach(function(inst){
  var c=effectiveCard(inst.uid),b=document.createElement("button"),disabled=(mode==="upgrade"&&inst.level>=3)||(mode==="remove"&&run.cardPool.length<=14)||(mode==="duplicate"&&run.cardPool.length>=MAX_DECK_SIZE);b.type="button";b.className="verseCard family-"+familyOf(c)+(mode!=="inspect"&&!disabled?" actionable":"")+(disabled?" disabled":"");b.innerHTML=cardHTML(c);
  if(mode!=="inspect"&&!disabled)b.addEventListener("click",function(){applyDeckAction(mode,inst.uid);});$("deckGrid").appendChild(b);
 });
}
function applyDeckAction(mode,id){
 var inst=instanceByUid(id),c=effectiveCard(id);if(!inst||!c)return;
 if(mode==="duplicate"&&run.cardPool.length>=MAX_DECK_SIZE)return;
 recordEventAction(mode);
 if(mode==="upgrade"){inst.level=Math.min(3,inst.level+1);finishEvent("Has mejorado «"+c.text+"» al nivel "+roman(inst.level)+".");return;}
 if(mode==="remove"){run.cardPool=run.cardPool.filter(function(x){return x.uid!==id;});finishEvent("Has eliminado «"+c.text+"». Tu mazo es ahora más preciso.");return;}
 if(mode==="duplicate"){run.cardPool.push(makeInstance(inst.baseId,inst.level));finishEvent("Has duplicado «"+c.text+"».");}
}
function roman(n){return["I","II","III"][Math.max(0,n-1)]||"I";}
function backFromDeck(){if(deckView.from==="event"){showEvent();}else{show("gameScreen");renderGame();}}

function finishRun(){
 if(!run||run.finished)return;run.finished=true;run.locked=false;career.runs+=1;if(run.won){career.wins+=1;if(run.mapId){career.mapWins=career.mapWins||{};career.mapWins[run.mapId]=true;}}career.bestScore=Math.max(career.bestScore,run.runScore);career.bestStreak=Math.max(career.bestStreak,run.bestStreak);career.bestCombo=Math.max(Number(career.bestCombo||0),run.stats.bestCombo);checkAchievements();saveCareer();resumeSave=null;
 $("finalScore").textContent=run.runScore.toLocaleString("es-ES");$("districtsText").textContent=run.stats.districtsCleared+"/"+districts.length;$("compositionsText").textContent=run.stats.compositions;$("bestStreakText").textContent=run.bestStreak;$("bestComboText").textContent=run.stats.bestCombo.toLocaleString("es-ES");
 if(run.won){$("resultKicker").textContent="VERSÓPOLIS CONQUISTADA";$("resultTitle").textContent="La ciudad corea tus versos";$("resultText").textContent="Has sobrevivido a contratos, eventos y cuatro maestros construyendo un mazo capaz de responder a lo inesperado.";}
 else{$("resultKicker").textContent="EXPEDICIÓN PERDIDA";$("resultTitle").textContent=run.inspiration<=0?"Tu inspiración se ha agotado":"El contrato te ha vencido";$("resultText").textContent="No basta con hacer una buena estrofa: el mazo debe poder encontrar la forma exigida antes de que se agoten rondas, descartes e Inspiración.";}
 show("resultScreen");renderCareer();bridgeCall("result",run.won?"finished":"defeat");
}
function loseRun(){if(!run||run.finished)return;run.won=false;finishRun();}
function showToast(text,kind){if(toastTimer)clearTimeout(toastTimer);$("toast").textContent=text;$("toast").className="toast"+(kind?" "+kind:"");toastTimer=setTimeout(function(){$("toast").classList.add("hidden");},2300);}

function persist(){try{localStorage.setItem(STORAGE+".run",JSON.stringify(snapshot()));}catch(err){}}
function setProfile(profile){STORAGE="lenguarcade.versopolis.v06."+String(profile.studentId||profile.id||profile.email||"guest").replace(/[^a-z0-9_-]/gi,"_");career={runs:0,wins:0,bestScore:0,bestStreak:0,districtsCleared:0,bestCombo:0,achievements:{},discoveries:{},mapWins:{},mapProgress:{},cosmetics:{}};run=null;resumeSave=null;try{career=Object.assign(career,JSON.parse(localStorage.getItem(STORAGE)||"{}"));restore(JSON.parse(localStorage.getItem(STORAGE+".run")||"null"));}catch(err){}renderCareer();}
function snapshot(){return{version:6,run:run||resumeSave,career:career};}
function migrateRun(oldRun,version){
 if(!oldRun)return null;
 if((version===4||version===5||version===6)&&oldRun.cardPool){oldRun.locked=false;oldRun.discardMode=false;oldRun.discardSelected=[];if(!oldRun.discardPile)oldRun.discardPile=[];if(!oldRun.stats)oldRun.stats={compositions:0,structured:0,districtsCleared:0,bestCombo:0,contracts:0,failedContracts:0};if(oldRun.stats.failedContracts===undefined)oldRun.stats.failedContracts=0;if(oldRun.stats.contracts===undefined)oldRun.stats.contracts=0;oldRun.forms=oldRun.forms||{};oldRun.rhymeCounts=oldRun.rhymeCounts||{};oldRun.eventActions=oldRun.eventActions||{};oldRun.scans=Number(oldRun.scans||0);if(version<6){["joker_eco","joker_pulso"].forEach(function(id){if(oldRun.cardPool.length>=MAX_DECK_SIZE||oldRun.cardPool.some(function(c){return c.baseId===id;}))return;var card=makeInstance(id,0);oldRun.cardPool.push(card);oldRun.deck=oldRun.deck||[];oldRun.deck.push(card.uid);});oldRun.selected=[];oldRun.challengeId=null;}oldRun.version=6;return oldRun;}
 var r=Object.assign({},oldRun),d=districts[Math.min(Number(r.districtIndex||0),districts.length-1)];
 r.version=6;r.cardPool=startingBaseIds.map(function(id){return makeInstance(id,0);});r.handSize=7;r.bonusDiscards=0;r.deck=[];r.discardPile=[];r.hand=[];r.selected=[];r.discardMode=false;r.discardSelected=[];r.maxInspiration=Number(r.maxInspiration||4);r.inspiration=Math.min(r.maxInspiration,Number(r.inspiration||r.maxInspiration));r.maxPrestige=Number(r.maxPrestige||d.prestige);r.rivalPrestige=Number(r.rivalPrestige===undefined?r.maxPrestige:r.rivalPrestige);r.challengeId=null;r.lastChallengeId=null;r.awaitingEvent=false;r.eventId=null;r.locked=false;
 if(!r.stats)r.stats={compositions:0,structured:0,districtsCleared:0,bestCombo:0};r.stats.contracts=Number(r.stats.contracts||0);r.stats.failedContracts=Number(r.stats.failedContracts||0);
 return r;
}
function restore(raw){
 try{
  var save=raw&&raw.run!==undefined?raw:raw&&raw.save?raw.save:raw;if(!save)return false;
  if(save.career){if(save.version===1||save.career.games!==undefined){career.runs=Math.max(career.runs,Number(save.career.games||0));career.bestScore=Math.max(career.bestScore,Number(save.career.bestScore||0));career.bestStreak=Math.max(career.bestStreak,Number(save.career.bestStreak||0));}else{var poems=window.VersopolisPoems?window.VersopolisPoems.merge(career.poems,save.career.poems):career.poems||save.career.poems||[];career=Object.assign(career,save.career,{poems:poems});}saveCareer();}
  if((save.version===2||save.version===3||save.version===4||save.version===5||save.version===6)&&save.run&&!save.run.finished){resumeSave=migrateRun(save.run,save.version);renderCareer();return true;}renderCareer();return!!save.career;
 }catch(err){return false;}
}
function continueRun(){
 if(!resumeSave)return;run=migrateRun(resumeSave,resumeSave.version||4);resumeSave=null;setActiveMap(run.mapId);
 if(run.awaitingEvent){showEvent();}else if(run.awaitingMuse){showMuseChoice("Elige una Musa","Continúa tu expedición con una nueva inspiración.");}else{if(!run.challengeId)rollChallenge();if(!run.deck.length&&!run.hand.length)setupDistrict();else{show("gameScreen");renderGame();}}
 bridgeCall("sessionStarted");
}
function metrics(){
 var r=run||resumeSave||{},s=r.stats||{},attempts=Number(s.compositions||0),correct=Number(s.contracts!==undefined?s.contracts:s.structured||0),accuracy=attempts?Math.round(correct/attempts*100):0,pct=0;
 if(r.finished&&r.won)pct=100;else if(r.districtIndex!==undefined){var max=Number(r.maxPrestige||districts[Math.min(r.districtIndex,districts.length-1)].prestige),rem=Number(r.rivalPrestige===undefined?max:r.rivalPrestige),part=max?Math.max(0,Math.min(1,1-rem/max)):0;pct=Math.round(((Number(r.districtIndex||0)+part)/districts.length)*100);}
 return{score:Number(r.runScore||0),attempts:attempts,correct:correct,errors:Number(s.failedContracts||0),accuracy:accuracy,percentage:pct,bestStreak:Number(r.bestStreak||0),round:Number(r.districtIndex||0)+1,games:Number(career.runs||0),careerBest:Number(career.bestScore||0),districtsCleared:Number(s.districtsCleared||0),bestCombo:Number(s.bestCombo||0),inspiration:Number(r.inspiration||0),rivalPrestige:Number(r.rivalPrestige||0),deckSize:Number(r.cardPool&&r.cardPool.length||0)};
}
function bridgeCall(name,arg){persist();try{if(window.VersopolisBridge&&typeof window.VersopolisBridge[name]==="function")return window.VersopolisBridge[name](arg);}catch(err){}return null;}
function saveAndHome(){if(run&&!run.finished){run.locked=false;resumeSave=run;renderCareer();}if(window.VersopolisBridge&&window.VersopolisBridge.saveAndExit)window.VersopolisBridge.saveAndExit();else{show("homeScreen");renderCareer();}}

$("startBtn").addEventListener("click",showAtlas);$("continueBtn").addEventListener("click",continueRun);$("againBtn").addEventListener("click",showAtlas);$("homeBtn").addEventListener("click",function(){run=null;show("homeScreen");renderCareer();});
$("atlasBackBtn").addEventListener("click",function(){show("homeScreen");});$("achievementsBtn").addEventListener("click",function(){renderAchievements();show("achievementsScreen");});$("achievementsBackBtn").addEventListener("click",function(){show("homeScreen");});$("codexBtn").addEventListener("click",function(){renderCodex();show("codexScreen");});$("codexBackBtn").addEventListener("click",function(){show("homeScreen");});$("scanBtn").addEventListener("click",function(){if(!run||!activeMap()||activeMap().id!=="torre"||run.districtIndex!==1||run.scanReveal)return;run.scanReveal=true;run.scans+=1;renderGame();bridgeCall("checkpoint","scan_meter");});
$("playBtn").addEventListener("click",playSelection);$("discardBtn").addEventListener("click",discardSelection);$("shuffleHandBtn").addEventListener("click",shuffleHand);$("clearBtn").addEventListener("click",clearSelection);$("exitBtn").addEventListener("click",saveAndHome);$("museExitBtn").addEventListener("click",saveAndHome);$("eventExitBtn").addEventListener("click",saveAndHome);$("openDeckBtn").addEventListener("click",openDeckInspect);$("deckBackBtn").addEventListener("click",backFromDeck);
$("helpBtn").addEventListener("click",function(){$("modal").classList.remove("hidden");});$("closeModal").addEventListener("click",function(){$("modal").classList.add("hidden");});$("modal").addEventListener("click",function(e){if(e.target===$("modal"))$("modal").classList.add("hidden");});
window.VersopolisGame={savePoems:function(){saveCareer();persist();},show:show,renderGame:renderGame,persist:persist,setProfile:setProfile,snapshot:snapshot,restore:restore,metrics:metrics,get run(){return run;},get career(){return career;}};
$("tableInfoBtn").addEventListener("click",function(){var open=$("gameScreen").classList.toggle("showTableInfo");this.setAttribute("aria-expanded",String(open));});
setupCardDrag();
renderCareer();
})();
