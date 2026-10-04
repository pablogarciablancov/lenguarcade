(() => {
'use strict';
const L=window.LexomaLanguage,C=window.LexomaContent;
const clone=o=>JSON.parse(JSON.stringify(o));
let run=null,career=freshCareer(),storageKey='lexoma.v1.guest';
function freshCareer(){return{games:0,wins:0,bestScore:0,bestPlay:0,bestCombo:1,words:0,phrases:0,concordances:0,errors:0,enieWords:[],achievements:[]};}
function random(){run.rng=(Math.imul(run.rng,1664525)+1013904223)>>>0;return run.rng/4294967296;}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function bag(){return [...'AAAAAAAAAAEEEEEEEEEEEEIIIIIIIOOOOOOOOOUUUUUBBCCCDDDDDFFGGHHJLLLMMMMNNNNÑPPQRRRRRRSSSSSSTTTTTTVXYZ', '*','*','´','´'];}
function enemy(){return C.enemies.find(x=>x.id===C.route[run?.node]);}
function phase(){const e=enemy();return e?.id==='morfax'?(run.enemyHp>e.hp*2/3?1:run.enemyHp>e.hp/3?2:3):0;}
function tile(char){return{id:++run.tileId,char};}
function replenish(){while(run.hand.length<10){if(!run.bag.length){if(!run.discard.length)break;run.bag=shuffle(run.discard.splice(0));}run.hand.push(tile(run.bag.pop()));}}
function start(seed=Date.now()){
 run={version:1,id:'lexoma_'+Date.now()+'_'+seed,rng:Number(seed)>>>0,tileId:0,status:'combat',node:0,integrity:100,ink:0,combo:1,bestCombo:1,score:0,bag:[],discard:[],hand:[],selection:[],phrase:[],relics:['quevedo'],round:1,discards:2,rerolls:2,rewardChoices:[],rewardClaimed:false,enemyHp:500,words:0,phrases:0,errors:0,concordances:0,previousStructures:[],last:null,shopStock:[],purchases:[],finished:false,resultId:null,updatedAt:Date.now()};
 run.bag=shuffle(bag());
 // Primer robo didáctico; las fichas se extraen de la bolsa real, no se duplican.
 const intro=[...'ELMAGOCOR'];intro.push('E');
 for(const c of intro){const i=run.bag.indexOf(c);run.bag.splice(i,1);run.hand.push(tile(c));}
 // Las dos reposiciones después de EL permiten completar CORRE.
 for(const c of ['E','R']){const i=run.bag.indexOf(c);run.bag.splice(i,1);run.bag.push(c);}
 career.games++;save();return run;
}
function allowed(){return run&&run.status==='combat'&&!run.finished;}
function clear(){if(!allowed())return;run.selection=[];save();}
function select(id,assigned){if(!allowed())return;const t=run.hand.find(x=>x.id===id);if(!t)return;const old=run.selection.findIndex(x=>x.id===id);if(old>=0){run.selection.splice(old,1);save();return;}
 if(t.char==='*'&&!/^[A-ZÑÁÉÍÓÚÜ]$/u.test(assigned||''))return;
 run.selection.push({id,char:t.char==='*'?assigned:t.char});save();}
function draft(){let text='';for(const t of run?.selection||[]){if(t.char==='´'){const i=text.length-1;if(i<0||!'AEIOU'.includes(text[i]))return null;text=text.slice(0,i)+'ÁÉÍÓÚ'['AEIOU'.indexOf(text[i])];}else text+=t.char;}return text;}
function forge(analysisIndex=0){if(!allowed())return{ok:false};const w=draft();const analyses=L.lookup(w||'');
 if(!analyses.length){run.errors++;career.errors++;save();return{ok:false,message:w===null?'La tilde va después de una vocal sin acentuar.':'Esta forma no está en el léxico del taller. Comprueba la escritura o prueba otra palabra.'};}
 if(run.phrase.length>=12)return{ok:false,message:'La frase admite doce cartas. Finaliza o retira una.'};
 const analysis=analyses[analysisIndex];if(!analysis)return{ok:false,message:'Elige una interpretación válida.'};
 const used=run.selection.map(x=>x.id);const consumed=run.hand.filter(x=>used.includes(x.id));
 run.hand=run.hand.filter(x=>!used.includes(x.id));run.discard.push(...consumed.map(x=>x.char));run.phrase.push({...analysis,base:L.value(analysis.word),uid:run.tileId+':'+run.words,tiles:consumed.map(x=>x.char)});run.selection=[];run.words++;career.words++;
 if(analysis.word.includes('ñ')&&!career.enieWords.includes(analysis.word))career.enieWords.push(analysis.word);
 replenish();unlock();save();return{ok:true,word:analysis.word};
}
function discard(){if(!allowed())return{ok:false};if(run.discards<=0)return{ok:false,message:'Sin descartes. Puedes cerrar esta ronda y renovar la mano.'};const ids=run.selection.length?run.selection.map(x=>x.id):run.hand.map(x=>x.id);const removed=run.hand.filter(x=>ids.includes(x.id));run.hand=run.hand.filter(x=>!ids.includes(x.id));run.discard.push(...removed.map(x=>x.char));run.selection=[];run.discards--;replenish();save();return{ok:true};}
function edit(index,action){if(!allowed()||!run.phrase[index])return;
 if(action==='remove')run.phrase.splice(index,1); // Retirar no devuelve letras: ya están en el ciclo de bolsa.
 else {const j=index+(action==='left'?-1:1);if(j>=0&&j<run.phrase.length)[run.phrase[index],run.phrase[j]]=[run.phrase[j],run.phrase[index]];}
 save();}
function calculate(words=run?.phrase||[]){
 const a=L.analyze(words),steps=[];let points=0,multiplier=1;
 if(!a.valid)return{...a,total:0,points:0,multiplier:1,steps,combo:run?.combo||1};
 function plus(label,n){if(n){points+=n;steps.push({label,value:n,op:'+',kind:'points'});}}
 function times(label,n){if(n&&n!==1){multiplier*=n;steps.push({label,value:n,op:'×',kind:'mult'});}}
 const has=id=>run.relics.includes(id),counts=category=>words.filter(w=>w.category===category);
 const vowelCount=w=>(w.word.match(/[aeiouáéíóúü]/gi)||[]).length;
 plus('Valor de las palabras',words.reduce((sum,w)=>sum+(w.base||L.value(w.word)),0));
 if(a.sentence)plus('Oración reconocida',100);else plus('Construcción nominal',20);
 plus('Concordancia',a.concordances*30);
 plus('Adverbios',counts('adv').length*20);
 if(a.structures.includes('SN enriquecido'))times('SN enriquecido',1.2);
 if(has('quevedo'))plus('Pluma de Quevedo',counts('adj').length*30);
 if(has('cervantes'))plus('Tintero de Cervantes',words.filter(w=>w.word.length>=7).reduce((n,w)=>n+w.base*.5,0));
 if(has('cronista'))plus('Reloj del Cronista',counts('verb').filter(w=>['pretérito','imperfecto'].includes(w.tense)).length*60);
 if(has('martillo'))plus('Martillo Verbal',counts('verb')[0]?.base||0);
 if(has('concordia')&&a.concordances)plus('Piedra de Concordia',100);
 if(has('enie'))plus('Ñ Primordial',words.filter(w=>w.word.includes('ñ')).reduce((n,w)=>n+w.base,0));
 if(has('corona')&&a.structures.includes('Sintagma nominal'))times('Corona del Sintagma',1.5);
 if(has('lexicografo'))plus('Ojo del Lexicógrafo',words.reduce((n,w)=>n+w.word.length*12,0));
 if(has('trinidad')&&words.length===3)plus('Regla de Tres',150);
 if(has('arquitecto')&&words.length>=4)times('Plano del Arquitecto',1.35);
 if(has('vocalista'))plus('Coro de Vocales',words.filter(w=>vowelCount(w)>=3).length*45);
 if(has('raras'))plus('Caja de Letras Raras',words.filter(w=>/[jñqxz]/i.test(w.word)).length*90);
 if(has('verbal')&&counts('verb').length>=2)times('Yunque Verbal',1.45);
 if(has('nominal'))plus('Sello Nominal',counts('noun').length>=2?120:0);
 if(has('perfecta')&&a.sentence&&a.concordances)times('Gramática Perfecta',1.25);
 if(has('larga'))plus('Pergamino Extenso',words.filter(w=>w.word.length>=8).length*100);
 if(has('diversidad')&&a.categoryCount>=4)times('Prisma Gramatical',1.4);
 if(has('minimalista')&&words.length===2)times('Golpe Breve',1.5);
 if(has('acentos'))plus('Tinta Acentuada',words.filter(w=>/[áéíóú]/i.test(w.word)).length*80);
 if(enemy()?.id==='duende')plus('Duende: concordancia',a.concordances*40);
 const novel=a.structures.filter(s=>!run.previousStructures.includes(s)).length;
 const combo=Math.min(5,Math.round((run.combo+(novel?0.2*novel:0)+(has('brujula')?0.2*counts('adv').length:0))*10)/10);
 times('Combo',combo);
 if(enemy()?.id==='elite'&&a.categoryCount>=4)times('Diversidad · élite',1.3);
 if(phase()===2){const cat=run.bossCategory||'adj';plus('Morfax: categoría potenciada',counts(cat).length*100);}
 if(phase()===3&&a.categoryCount>=3)times('Morfax: tres categorías',1.5);
 const total=Math.round(points*multiplier);
 if(enemy()?.id==='escriba'&&total<run.round*40)return{...a,valid:false,total:0,points,multiplier,steps:[],errors:[`El Escriba exige al menos ${run.round*40} puntos esta ronda.`],combo:run.combo};
 return{...a,total,points:Math.round(points),multiplier:Math.round(multiplier*100)/100,steps,combo};
}
function rewardOptions(){
 const available=C.relics.filter(r=>!run.relics.includes(r.id)).map(r=>r.id);
 return shuffle(available).slice(0,3);
}
function chooseReward(id){
 if(run?.status!=='reward'||run.rewardClaimed||!run.rewardChoices?.includes(id))return{ok:false};
 if(!run.relics.includes(id))run.relics.push(id);
 run.rewardClaimed=true;run.rewardChoices=[];save();return{ok:true};
}
function rerollReward(){
 if(run?.status!=='reward'||run.rewardClaimed||Number(run.rerolls||0)<=0)return{ok:false};
 run.rerolls--;run.rewardChoices=rewardOptions();save();return{ok:true};
}
function skipReward(){
 if(run?.status!=='reward'||run.rewardClaimed)return{ok:false};
 run.ink+=25;run.rewardClaimed=true;run.rewardChoices=[];save();return{ok:true};
}
function finish(){if(!allowed())return{ok:false};const result=calculate();if(!result.valid){run.errors++;career.errors++;save();return{ok:false,message:result.errors[0]};}
 run.last={...result,text:run.phrase.map(w=>w.word).join(' ')};run.score+=result.total;career.bestScore=Math.max(career.bestScore,run.score);run.enemyHp=Math.max(0,run.enemyHp-result.total);run.combo=result.combo;run.bestCombo=Math.max(run.bestCombo,run.combo);run.previousStructures=result.structures;run.concordances+=result.concordances;run.phrases++;career.phrases++;career.concordances+=result.concordances;career.bestPlay=Math.max(career.bestPlay,result.total);career.bestCombo=Math.max(career.bestCombo,run.combo);
 run.phrase=[];run.selection=[];
 if(run.relics.includes('tildes')&&run.phrases%2===0)run.bag.push('´');
 if(run.enemyHp<=0){
  const defeated=enemy();run.ink+=defeated.reward;
  if(defeated.id==='morfax')end(true);
  else{
   run.status='reward';run.rerolls=Math.min(5,Number(run.rerolls||0)+1);
   run.rewardChoices=rewardOptions();run.rewardClaimed=run.rewardChoices.length===0;
   if(run.rewardClaimed)run.ink+=25;
  }
 }
 else advanceRound();
 unlock();save();return{ok:true,result};
}
function advanceRound(){run.round++;run.discards=enemy().id==='devorador'?2:3;if(run.round>enemy().rounds){run.integrity=Math.max(0,run.integrity-enemy().damage);run.round=1;run.combo=1;run.previousStructures=[];if(run.integrity===0)end(false);}}
function pass(){if(!allowed())return;run.discard.push(...run.hand.map(x=>x.char));run.hand=[];run.selection=[];run.phrase=[];run.combo=1;run.last={text:'Ronda cerrada',total:0,steps:[],structures:[]};advanceRound();replenish();save();}
function end(won){run.status=won?'victory':'defeat';run.finished=true;run.resultId=run.id+'_result';if(won)career.wins++;career.bestScore=Math.max(career.bestScore,run.score);unlock();}
function next(){if(!run||!['reward','shop'].includes(run.status))return;if(run.status==='reward'&&!run.rewardClaimed)return;run.node++;run.last=null;run.phrase=[];run.selection=[];run.rewardChoices=[];run.rewardClaimed=false;
 if(C.route[run.node]==='shop'){run.status='shop';run.shopStock=shuffle(C.relics.filter(r=>!run.relics.includes(r.id)).map(r=>r.id)).slice(0,4);run.purchases=[];}
 else{const e=enemy();if(!e)return;run.status='combat';run.enemyHp=e.hp;run.round=1;run.discards=e.id==='devorador'?2:3;run.bossCategory=['noun','verb','adj','adv'][Math.floor(random()*4)];}
 save();}
function purchase(kind,value){if(run?.status!=='shop')return{ok:false};const relic=C.relics.find(r=>r.id===value);const price=kind==='relic'?relic?.price:({letter:20,wild:40,accent:25,remove:25})[kind];
 if(!price||run.ink<price)return{ok:false,message:'No tienes Tinta suficiente.'};
 if(kind==='relic'&&(!run.shopStock.includes(value)||run.relics.includes(value)))return{ok:false,message:'Esta reliquia ya no está disponible.'};
 if(kind==='letter'&&!/^[A-ZÑ]$/u.test(value||''))return{ok:false,message:'Elige una letra.'};
 if(kind==='remove'&&!run.bag.includes(value))return{ok:false,message:'Esa ficha no está en la bolsa de robo.'};
 run.ink-=price;
 if(kind==='relic'){run.relics.push(value);if(value==='fantasma')run.bag.push('*','*');}
 if(kind==='letter')run.bag.push(value);
 if(kind==='wild')run.bag.push('*');if(kind==='accent')run.bag.push('´');
 if(kind==='remove')run.bag.splice(run.bag.indexOf(value),1);
 save();return{ok:true};}
function unlock(){const conditions=[career.words>=1,career.concordances>=10,career.phrases>=20,career.bestCombo>=5,career.enieWords.length>=5,career.bestPlay>=5000,career.wins>=1];C.achievements.forEach((a,i)=>{if(conditions[i]&&!career.achievements.includes(a.id))career.achievements.push(a.id);});}
function snapshot(){return{version:1,gameId:'lexoma',run:clone(run),career:clone(career)};}
function save(){if(run)run.updatedAt=Date.now();try{localStorage.setItem(storageKey,JSON.stringify(snapshot()));window.LexomaEngine.storageOK=true;}catch{window.LexomaEngine.storageOK=false;}window.dispatchEvent(new Event('lexoma:change'));}
function validSave(raw){return raw?.gameId==='lexoma'&&raw.version===1&&(!raw.run||(raw.run.version===1&&Array.isArray(raw.run.bag)&&Array.isArray(raw.run.hand)&&Array.isArray(raw.run.phrase)&&Array.isArray(raw.run.selection)&&Array.isArray(raw.run.relics)&&Number.isFinite(raw.run.rng)&&Number.isFinite(raw.run.integrity)&&C.route[raw.run.node]));}
function restore(raw){if(!validSave(raw))return false;run=clone(raw.run);run.rerolls=Number.isFinite(run.rerolls)?run.rerolls:2;run.rewardChoices=Array.isArray(run.rewardChoices)?run.rewardChoices:[];run.rewardClaimed=!!run.rewardClaimed;const incoming={...freshCareer(),...clone(raw.career||{})};for(const key of ['games','wins','bestScore','bestPlay','bestCombo','words','phrases','concordances','errors'])incoming[key]=Math.max(Number(incoming[key]||0),Number(career[key]||0));incoming.enieWords=[...new Set([...(career.enieWords||[]),...(incoming.enieWords||[])])];incoming.achievements=[...new Set([...(career.achievements||[]),...(incoming.achievements||[])])];career=incoming;unlock();save();return true;}
function load(){run=null;career=freshCareer();try{const raw=JSON.parse(localStorage.getItem(storageKey)||'null');if(validSave(raw)){run=raw.run;run.rerolls=Number.isFinite(run.rerolls)?run.rerolls:2;run.rewardChoices=Array.isArray(run.rewardChoices)?run.rewardChoices:[];run.rewardClaimed=!!run.rewardClaimed;career={...freshCareer(),...raw.career};}}catch{}window.dispatchEvent(new Event('lexoma:change'));}
function setProfile(profile){storageKey='lexoma.v1.'+encodeURIComponent(String(profile.studentId||profile.id||profile.email||'guest'));load();}
function metrics(){const correct=run?.phrases||0,errors=run?.errors||0;return{score:run?.score||0,correct,errors,attempts:correct+errors,accuracy:correct+errors?Math.round(correct/(correct+errors)*100):0,percentage:run?.status==='victory'?100:Math.round((run?.node||0)/C.route.length*100),maxCombo:run?.bestCombo||1,words:run?.words||0,concordances:run?.concordances||0};}
window.LexomaEngine={start,select,clear,draft,forge,discard,edit,calculate,finish,pass,next,purchase,chooseReward,rerollReward,skipReward,enemy,phase,snapshot,restore,setProfile,save,metrics,storageOK:true,get run(){return run;},get career(){return career;},get achievements(){return C.achievements.filter(a=>career.achievements.includes(a.id));}};
load();
})();
