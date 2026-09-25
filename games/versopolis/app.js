(function(){
"use strict";
var STORAGE="lenguarcade.versopolis.v01";
var $=function(id){return document.getElementById(id);};
var challenges=[
{skill:"RIMA",district:"Puerta de la Rima",rival:"La Voz del Puente",prompt:"¿Qué verso completa mejor una rima consonante con «camino»?",context:"«Cruzo la tarde buscando mi camino…»",options:["y guardo cada sueño en mi destino.","mientras la lluvia moja la ciudad.","porque la noche canta lentamente.","sin preguntar qué queda detrás."],answer:0,explain:"«Camino / destino» comparten vocales y consonantes desde la sílaba tónica: -ino."},
{skill:"MÉTRICA",district:"Plaza del Ritmo",rival:"El Maestro del Pulso",prompt:"¿Cuántas sílabas métricas tiene «La luna duerme en el mar»?",context:"Cuenta teniendo en cuenta la sinalefa cuando corresponda.",options:["6","7","8","9"],answer:1,explain:"La / lu-na / duer-me_en / el / mar = 7 sílabas métricas por la sinalefa «me_en»."},
{skill:"RECURSOS",district:"Galería de las Imágenes",rival:"La Pintora de Metáforas",prompt:"¿Qué recurso aparece en «Tus ojos son dos faros en la niebla»?",context:"No aparece un nexo comparativo como «como».",options:["Hipérbole","Metáfora","Anáfora","Personificación"],answer:1,explain:"Identifica directamente los ojos con «dos faros»: es una metáfora."},
{skill:"RIMA",district:"Puente de los Ecos",rival:"El Eco Carmesí",prompt:"¿Qué pareja presenta rima asonante?",context:"Solo deben coincidir las vocales desde la última sílaba tónica.",options:["casa / rama","canción / balcón","vida / herida","suerte / verte"],answer:0,explain:"«Casa / rama» comparten las vocales a-a, pero no todas las consonantes."},
{skill:"MÉTRICA",district:"Torre del Compás",rival:"La Guardiana del Once",prompt:"Si un verso termina en palabra aguda, ¿qué ocurre al medirlo?",context:"Regla básica del cómputo silábico castellano.",options:["Se resta una sílaba","Se suma una sílaba","No cambia nunca","Se cuentan dos sinalefas"],answer:1,explain:"Cuando el verso termina en palabra aguda, se suma una sílaba al cómputo."},
{skill:"RECURSOS",district:"Jardines de la Voz",rival:"El Jardinero Imposible",prompt:"¿Dónde hay personificación?",context:"Busca algo no humano realizando una acción humana.",options:["El viento susurró mi nombre.","Era rápido como un rayo.","Tengo un millón de deberes.","Tus manos son nieve."],answer:0,explain:"El viento recibe una acción humana —susurrar un nombre—, por eso hay personificación."},
{skill:"ESTROFA",district:"Archivo de las Formas",rival:"La Archivera",prompt:"¿Cómo llamamos a una estrofa de cuatro versos de arte menor con rima consonante abab?",context:"Una forma tradicional muy habitual.",options:["Redondilla","Cuarteto","Serventesio","Cuarteta"],answer:3,explain:"La cuarteta tiene cuatro versos de arte menor y rima consonante abab."},
{skill:"VOZ",district:"Anfiteatro de Versópolis",rival:"El Campeón del Mirador",prompt:"¿Qué opción crea una anáfora?",context:"La repetición debe aparecer al comienzo de varios versos.",options:["Quiero la noche, quiero la aurora, quiero tu voz.","La noche cae lentamente sobre el río.","Tu voz, campana de cristal.","Corrí tanto que atravesé el mundo."],answer:0,explain:"La repetición inicial de «quiero» crea una anáfora."}
];
var run=null,career=loadCareer();
function loadCareer(){try{return Object.assign({games:0,bestScore:0,totalCorrect:0,totalAttempts:0,bestStreak:0},JSON.parse(localStorage.getItem(STORAGE)||"{}"));}catch(err){return{games:0,bestScore:0,totalCorrect:0,totalAttempts:0,bestStreak:0};}}
function saveCareer(){try{localStorage.setItem(STORAGE,JSON.stringify(career));}catch(err){}}
function show(name){["homeScreen","gameScreen","resultScreen"].forEach(function(id){$(id).classList.toggle("hidden",id!==name);});}
function renderCareer(){$("careerLine").textContent=career.games?"Mejor puntuación: "+career.bestScore+" · "+career.games+" batallas completadas":"Tu primera batalla te espera.";}
function start(){run={index:0,score:0,streak:0,bestStreak:0,correct:0,attempts:0,answered:false,startedAt:Date.now(),finished:false};show("gameScreen");renderRound();window.VersopolisBridge&&window.VersopolisBridge.sessionStarted&&window.VersopolisBridge.sessionStarted();}
function renderRound(){
 var q=challenges[run.index];run.answered=false;
 $("roundText").textContent=(run.index+1)+" / "+challenges.length;$("scoreText").textContent=run.score;$("streakText").textContent="×"+run.streak;
 $("trackFill").style.width=Math.round(run.index/challenges.length*100)+"%";$("districtName").textContent=q.district;$("skillTag").textContent=q.skill;$("rivalName").textContent=q.rival;$("prompt").textContent=q.prompt;$("context").textContent=q.context;
 $("feedback").className="feedback hidden";$("feedback").textContent="";$("nextBtn").classList.add("hidden");
 $("options").innerHTML="";
 q.options.forEach(function(option,i){var b=document.createElement("button");b.type="button";b.className="answer";b.textContent=option;b.addEventListener("click",function(){answer(i,b);});$("options").appendChild(b);});
}
function answer(index,button){
 if(run.answered)return;run.answered=true;run.attempts+=1;var q=challenges[run.index],correct=index===q.answer;
 var buttons=[].slice.call(document.querySelectorAll(".answer"));buttons.forEach(function(b){b.disabled=true;});buttons[q.answer].classList.add("correct");
 if(correct){run.correct+=1;run.streak+=1;run.bestStreak=Math.max(run.bestStreak,run.streak);run.score+=100+Math.min(5,run.streak)*25;$("feedback").className="feedback ok";$("feedback").textContent="Acierto. "+q.explain;}
 else{button.classList.add("wrong");run.streak=0;$("feedback").className="feedback bad";$("feedback").textContent="No exactamente. "+q.explain;}
 $("scoreText").textContent=run.score;$("streakText").textContent="×"+run.streak;$("nextBtn").classList.remove("hidden");
 window.VersopolisBridge&&window.VersopolisBridge.checkpoint&&window.VersopolisBridge.checkpoint("round_answer");
}
function next(){if(!run||!run.answered)return;if(run.index>=challenges.length-1){finish();return;}run.index+=1;renderRound();}
function finish(){
 run.finished=true;$("trackFill").style.width="100%";var acc=Math.round(run.correct/run.attempts*100);
 career.games+=1;career.bestScore=Math.max(career.bestScore,run.score);career.totalCorrect+=run.correct;career.totalAttempts+=run.attempts;career.bestStreak=Math.max(career.bestStreak,run.bestStreak);saveCareer();
 $("finalScore").textContent=run.score;$("correctText").textContent=run.correct+"/"+challenges.length;$("accuracyText").textContent=acc+"%";$("bestStreakText").textContent=run.bestStreak;
 $("resultTitle").textContent=acc>=88?"La ciudad corea tus versos":acc>=63?"Versópolis te abre sus puertas":"La ciudad te invita a otra ronda";
 $("resultText").textContent=acc>=88?"Has dominado rima, ritmo y recursos expresivos en esta batalla.":acc>=63?"Buen duelo. Repite la batalla para consolidar los recursos que aún se resisten.":"Cada explicación te acerca al ritmo de la ciudad. Vuelve a intentarlo y mejora tu racha.";
 show("resultScreen");renderCareer();window.VersopolisBridge&&window.VersopolisBridge.result&&window.VersopolisBridge.result("finished");
}
function snapshot(){return{version:1,run:run,career:career};}
function restore(raw){try{var save=raw&&raw.run!==undefined?raw:raw&&raw.save?raw.save:raw;if(!save)return false;if(save.career)career=Object.assign(career,save.career);saveCareer();if(save.run&&!save.run.finished){run=save.run;show("gameScreen");renderRound();return true;}renderCareer();return !!save.career;}catch(err){return false;}}
function metrics(){var r=run||{};var attempts=Number(r.attempts||0),correct=Number(r.correct||0),accuracy=attempts?Math.round(correct/attempts*100):0;return{score:Number(r.score||0),attempts:attempts,correct:correct,errors:Math.max(0,attempts-correct),accuracy:accuracy,percentage:r.finished?100:Math.round(Number(r.index||0)/challenges.length*100),bestStreak:Number(r.bestStreak||0),round:Number(r.index||0)+1,games:Number(career.games||0),careerBest:Number(career.bestScore||0)};}
$("startBtn").addEventListener("click",start);$("againBtn").addEventListener("click",start);$("nextBtn").addEventListener("click",next);$("homeBtn").addEventListener("click",function(){show("homeScreen");renderCareer();});$("helpBtn").addEventListener("click",function(){$("modal").classList.remove("hidden");});$("closeModal").addEventListener("click",function(){$("modal").classList.add("hidden");});$("exitBtn").addEventListener("click",function(){window.VersopolisBridge&&window.VersopolisBridge.saveAndExit?window.VersopolisBridge.saveAndExit():show("homeScreen");});
window.VersopolisGame={snapshot:snapshot,restore:restore,metrics:metrics,get run(){return run;},get career(){return career;}};
renderCareer();
})();
