(function(root){
'use strict';
const C=root.TintaContent;
const achievements=[
['primer_sorbo','Primer sorbo','Encuentra tu primer concepto.','words',1],
['diez','Una ronda más','Encuentra 10 conceptos.','words',10],['cincuenta','Café para todos','Encuentra 50 conceptos.','words',50],['cien','Diccionario vivo','Encuentra 100 conceptos.','words',100],['enciclopedia','Enciclopedia','Encuentra 500 conceptos.','words',500],['mil','Mil palabras','Encuentra 1000 conceptos.','words',1000],
['lince','Ojo de lince','Completa una sopa sin pistas.','noHints',1],['perfecto','Café perfecto','Completa una sopa sin errores ni pistas.','perfects',1],['perfectos5','Barista preciso','Consigue cinco sopas perfectas.','perfects',5],['perfectos20','Sin una gota fuera','Consigue veinte sopas perfectas.','perfects',20],
['racha5','En racha','Alcanza una racha de 5 conceptos.','bestCombo',5],['racha10','Imparable','Alcanza una racha de 10 conceptos.','bestCombo',10],
['veloz','Contrarreloj','Completa una sopa en menos de 60 segundos.','fast',1],['diagonales','Entre líneas','Encuentra 100 palabras diagonales.','diagonal',100],['reves','Del revés','Encuentra 50 palabras invertidas.','reverse',50],['horizontal','Horizonte','Encuentra 50 palabras horizontales.','horizontal',50],['vertical','Escalador','Encuentra 50 palabras verticales.','vertical',50],
['partidas10','Cliente habitual','Completa 10 sopas.','wins',10],['partidas50','La mesa de siempre','Completa 50 sopas.','wins',50],['diario','Pedido del día','Completa un desafío diario.','dailyWins',1],['diarios7','Siete desayunos','Completa siete desafíos diarios diferentes.','dailyWins',7],
['relax','Sobremesa','Completa tres partidas relax.','relaxWins',3],['reloj','Hora del café','Completa tres contrarrelojes.','timedWins',3],['maestria','Paladar experto','Completa tres partidas de maestría.','masterWins',3],['punta','Hora punta','Supera una Hora Punta.','bossWins',1],['solo','Café solo','Supera una Hora Punta sin errores.','cleanBoss',1],
['nivel5','Buscapalabras','Llega al nivel 5.','level',5],['nivel10','Rastreador','Llega al nivel 10.','level',10],['misiones','Encargos cumplidos','Completa diez misiones.','missions',10],['coleccion','Mi rincón','Compra tres decoraciones.','purchases',3],
...C.districts.map((d,i)=>['distrito_'+d.id,['Maestro narrador','Taller completo','Verbo vivo','Vías sintácticas','Galería abierta','Sentido completo','Escritura impecable'][i],'Supera los cuatro niveles de '+d.name+'.','district_'+d.id,4])
].map(([id,name,desc,stat,target],i)=>({id,name,desc,stat,target,icon:i%6}));
const cosmetics=[{id:'cafe',name:'Café de medianoche',cost:0,kind:'theme'},{id:'aurora',name:'Salón aurora',cost:100,kind:'theme'},{id:'biblioteca',name:'Biblioteca dorada',cost:180,kind:'theme'},{id:'menta',name:'Tinta de menta',cost:80,kind:'trace'},{id:'rosa',name:'Tinta de frambuesa',cost:80,kind:'trace'},{id:'oro',name:'Marco del lexicógrafo',cost:220,kind:'frame'},{id:'taza',name:'Taza de porcelana',cost:120,kind:'cup'}];
function fresh(){return {version:1,updatedAt:0,xp:0,ink:0,hintTokens:8,achievements:{},adventure:{},mastery:{},records:{},daily:{},owned:['cafe'],equipped:{theme:'cafe'},stats:{},settings:{sound:true,music:false,reduced:false,contrast:false},streak:0,lastDay:'',missions:null};}
function level(p){return 1+Math.floor(Math.sqrt(p.xp/100));}
function add(p,key,n=1){p.stats[key]=(p.stats[key]||0)+n;}
function day(){return new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Madrid'});}
function missions(p){const today=day();if(p.missions?.day!==today)p.missions={day:today,base:{...p.stats},claimed:[],items:[{id:'words',name:'Encuentra 20 conceptos',target:20},{id:'diagonal',name:'Encuentra 5 diagonales',target:5},{id:'noHints',name:'Completa 2 sopas sin pistas',target:2}]};return p.missions;}
function claim(p,id){const m=missions(p),item=m.items.find(x=>x.id===id);if(!item||m.claimed.includes(id)||(p.stats[id]||0)-(m.base[id]||0)<item.target)return false;m.claimed.push(id);p.xp+=60;p.ink+=15;add(p,'missions');return true;}
function unlock(p){const found=[];for(const a of achievements){const value=a.stat==='level'?level(p):a.stat.startsWith('district_')?Object.keys(p.adventure[a.stat.slice(9)]||{}).length:p.stats[a.stat]||0;if(value>=a.target&&!p.achievements[a.id]){p.achievements[a.id]=day();p.xp+=20;found.push(a);}}return found;}
function score(concept,run,word){const factor=1+Math.min(5,Math.max(0,run.combo-1))*.2;const speed=run.mode==='relax'?0:Math.max(0,60-Math.floor((run.elapsed-run.lastFound)/2));return Math.round((100+concept.gridTerm.length*10+concept.difficulty*35+speed)*factor*Math.pow(.7,word.hints)*(run.mode==='timed'?1.4:1));}
function finish(p,run,won){if(run.settled)return run.reward;run.done=true;run.won=won;run.settled=true;const before=level(p);add(p,'played');let bonus=0;
if(won){add(p,'wins');if(!run.hints)add(p,'noHints');if(!run.errors&&!run.hints){add(p,'perfects');bonus=400;}if(run.elapsed<60)add(p,'fast');if(run.mode==='relax')add(p,'relaxWins');if(run.mode==='timed')add(p,'timedWins');if(run.mode==='master')add(p,'masterWins');if(run.mode==='boss'){add(p,'bossWins');if(!run.errors)add(p,'cleanBoss');bonus+=500;}
if(run.mode==='daily'&&!p.daily[run.day])add(p,'dailyWins');
if(run.mode==='adventure'||run.mode==='boss'){p.adventure[run.category]||={};p.adventure[run.category][run.stage]=Math.max(p.adventure[run.category][run.stage]||0,run.errors===0&&run.hints===0?3:run.errors<=2?2:1);}
const today=day();if(p.lastDay!==today){const yesterday=new Date(Date.now()-86400000).toLocaleDateString('en-CA',{timeZone:'Europe/Madrid'});p.streak=p.lastDay===yesterday?p.streak+1:1;p.lastDay=today;}
p.hintTokens+=2;
}
run.score+=bonus;const xp=run.words.filter(w=>w.found).length*15+(won?80:0)+(run.mode==='boss'&&won?120:0),ink=won?12+run.words.length*2:0;p.xp+=xp;p.ink+=ink;add(p,'totalScore',run.score);p.stats.bestCombo=Math.max(p.stats.bestCombo||0,run.bestCombo);
const key=run.mode+':'+run.category+':'+run.difficulty;const record=p.records[key]||{};const isRecord=won&&run.score>(record.score||0);if(won)p.records[key]={score:Math.max(run.score,record.score||0),time:Math.min(run.elapsed,record.time??Infinity)};
if(run.mode==='daily'){const best=p.daily[run.day];if(won&&(!best||run.score>best.score))p.daily[run.day]={score:run.score,time:run.elapsed,errors:run.errors,hints:run.hints};}
for(const w of run.words)if(!w.found){const m=p.mastery[w.id]||={clean:0,help:0};m.help++;}
run.reward={xp,ink,bonus,isRecord,stars:won?(run.errors===0&&run.hints===0?3:run.errors<=2?2:1):0,levelUp:level(p)>before};return run.reward;
}
root.TintaProgress={fresh,level,add,day,missions,claim,unlock,score,finish,achievements,cosmetics};
})(typeof window==='undefined'?globalThis:window);
