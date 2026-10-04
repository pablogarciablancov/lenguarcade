(() => {
'use strict';
const L=window.LexomaLanguage,C=window.LexomaContent;
const clone=o=>JSON.parse(JSON.stringify(o));
const ACCENTS={A:'Á',E:'É',I:'Í',O:'Ó',U:'Ú',Á:'A',É:'E',Í:'I',Ó:'O',Ú:'U'};
const VOWELS='AEIOUÁÉÍÓÚÜ';
const RARE='JÑQXZ';
const LETTER_VALUES={A:1,E:1,I:1,L:1,N:1,O:1,R:1,S:1,T:1,U:1,D:2,G:2,B:3,C:3,M:3,P:3,F:4,H:4,V:4,Y:4,Q:5,J:8,Ñ:8,X:8,Z:10,Ü:2};
const MAX_BONUSES=5;
const STARTER_POOL=['vocalista','consonante','palabra_larga','variedad','raras','mult','punto','cinco','sin_repetir','puerta_vocal','final_s','sustantivo','verbo'];
let run=null,career=freshCareer(),storageKey='lexoma.v2.guest',dictionary=new Set(),dictionaryReady=false;

function freshCareer(){return{games:0,wins:0,bestScore:0,bestPlay:0,bestPoints:0,bestMulti:1,words:0,phrases:0,concordances:0,errors:0,rerollsUsed:0,bonusesSeen:[],achievements:[]};}
function strip(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').normalize('NFC');}
function key(s){return String(s||'').toLowerCase().normalize('NFC');}
function random(){run.rng=(Math.imul(run.rng,1664525)+1013904223)>>>0;return run.rng/4294967296;}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function has(id){return !!run?.bonuses?.includes(id);}
function mode(){return C.modes[run?.mode]||C.modes.normal;}
function baseBag(){return [...'AAAAAAAAAAAAEEEEEEEEEEEEEEIIIIIIIIIOOOOOOOOOOOUUUUUBBBBCCCCDDDDDFFFFGGGGHHHHJJLLLMMMMNNNNNNNNÑÑPPPPQQRRRRRRRRSSSSSSSSTTTTTTTVVVXXYYZZ'];}
function letterValue(c){const u=strip(c).toUpperCase();return LETTER_VALUES[u]||0;}
function tile(char,style='normal'){return{id:++run.tileId,char,style,bonusPoints:0,bonusMulti:0};}
function bonus(id){return C.bonuses.find(x=>x.id===id);}
function totalRounds(){return mode().rounds;}
function roundEnergy(){return mode().energy+(has('bateria')?1:0);}
function targetForRound(round=run.round){
 const cfg=mode();let target=cfg.targets[Math.min(round-1,cfg.targets.length-1)]||Math.round(cfg.targets.at(-1)*Math.pow(1.32,round-cfg.targets.length));
 if(has('modo_facil'))target=Math.round(target*.88);
 return target;
}
function drawStyle(char){
 if(char==='*'||char==='!')return char==='*'?'wild':'bang';
 const specialChance=has('legendarias')?.14:.035;
 if(random()<specialChance)return random()<.55?'gold':'wild';
 const improvedChance=.06+(has('negrita')?.12:0)+(has('cursiva')?.12:0)+(has('subrayado')?.10:0);
 if(random()<improvedChance){
  const pool=['bold','italic','underline'];
  if(has('negrita'))pool.push('bold','bold');
  if(has('cursiva'))pool.push('italic','italic');
  if(has('subrayado'))pool.push('underline','underline');
  return pool[Math.floor(random()*pool.length)];
 }
 return 'normal';
}
function itemChar(item){return typeof item==='string'?item:item?.char||'';}
function pullBagItem(predicate){
 if(!run.bag.length){if(!run.discard.length)return null;run.bag=shuffle(run.discard.splice(0));}
 let idx=-1;
 if(predicate){for(let i=run.bag.length-1;i>=0;i--){if(predicate(itemChar(run.bag[i]))){idx=i;break;}}}
 if(idx<0)idx=run.bag.length-1;
 return run.bag.splice(idx,1)[0];
}
function drawOne(preferVowel=false,avoid=new Set()){
 const predicate=c=>{
  if(!c)return false;
  const upper=String(c).toUpperCase();
  if(avoid.has(strip(upper)))return false;
  if(preferVowel)return VOWELS.includes(upper)||upper==='*';
  return true;
 };
 let item=pullBagItem(predicate);
 if(item==null)return null;
 const char=itemChar(item),style=typeof item==='string'?drawStyle(char):(item.style||'normal');
 return tile(char,style);
}
function replenish(){
 while(run.hand.length<run.maxHand){
  const counts={};for(const t of run.hand){const c=strip(String(t.char).toUpperCase());counts[c]=(counts[c]||0)+1;}
  const avoid=new Set(Object.entries(counts).filter(([,n])=>n>=2).map(([c])=>c));
  const vowelCount=run.hand.filter(t=>VOWELS.includes(String(t.char).toUpperCase())||t.style==='wild'||t.char==='*').length;
  const needVowel=vowelCount<2;
  let t=drawOne(needVowel,avoid);
  if(!t&&avoid.size)t=drawOne(needVowel,new Set());
  if(!t&&needVowel)t=drawOne(false,avoid);
  if(!t)t=drawOne(false,new Set());
  if(!t)break;
  run.hand.push(t);
 }
}
function daySeed(){const d=new Date();return Number(String(d.getFullYear())+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0'))>>>0;}
function starterOptions(){
 const pool=STARTER_POOL.filter(id=>!run.bonuses.includes(id));return shuffle(pool).slice(0,3);
}
function rewardOptions(){
 const pool=C.bonuses.filter(b=>!run.bonuses.includes(b.id)).map(b=>b.id);return shuffle(pool).slice(0,3);
}
function newRun(modeId='normal',seed=null){
 const cfg=C.modes[modeId]||C.modes.normal;const seedValue=seed==null?(modeId==='daily'?daySeed():Date.now()):seed;
 run={version:2,id:'forja_'+Date.now()+'_'+seedValue,mode:modeId,rng:Number(seedValue)>>>0,tileId:0,status:'starter',round:1,roundScore:0,totalScore:0,target:cfg.targets[0],energy:cfg.energy,rerolls:cfg.rerolls,maxHand:7,bag:[],discard:[],hand:[],selected:[],rerollSelection:[],bonuses:[],bonusChoices:[],previousWord:'',previousLength:0,targetLength:4,words:[],wordLog:[],errors:0,categorySeenRound:[],efficiencyReward:0,finished:false,resultId:null,updatedAt:Date.now()};
 run.bag=shuffle(baseBag());run.targetLength=4+Math.floor(random()*5);replenish();run.bonusChoices=starterOptions();career.games++;save();return run;
}
function allowed(){return run&&run.status==='play'&&!run.finished;}
function tileChar(sel){const t=run.hand.find(x=>x.id===sel.id);return sel.char||t?.char||'';}
function draft(){return (run?.selected||[]).map(tileChar).join('');}
function selectedTiles(){return (run?.selected||[]).map(s=>run.hand.find(t=>t.id===s.id)).filter(Boolean);}
function select(id,assigned=null){
 if(!allowed())return;const t=run.hand.find(x=>x.id===id);if(!t)return;
 run.rerollSelection=[];
 const i=run.selected.findIndex(x=>x.id===id);if(i>=0){run.selected.splice(i,1);save();return;}
 if(run.selected.length>=9)return;
 if(t.style==='wild'||t.char==='*'){if(!/^[A-ZÑÁÉÍÓÚÜ]$/u.test(assigned||''))return;run.selected.push({id,char:assigned.toUpperCase()});}
 else if(t.style==='bang'||t.char==='!'){if(run.selected.some(x=>tileChar(x)==='!'))return;run.selected.push({id,char:'!'});}
 else run.selected.push({id,char:t.char});
 save();
}
function cycleAccent(id){
 if(!allowed())return;const s=run.selected.find(x=>x.id===id);if(!s)return;const c=String(s.char||tileChar(s)).toUpperCase();if(ACCENTS[c]){s.char=ACCENTS[c];save();}
}
function clear(){if(!allowed())return;run.selected=[];save();}
function toggleReroll(id){
 if(!allowed()||run.selected.some(x=>x.id===id))return;
 const i=run.rerollSelection.indexOf(id);if(i>=0)run.rerollSelection.splice(i,1);
 else if(run.rerollSelection.length<3)run.rerollSelection.push(id);
 save();
}
function rerollLetters(){
 if(!allowed()||run.rerolls<=0||!run.rerollSelection.length)return{ok:false,message:'Selecciona entre 1 y 3 letras para cambiar.'};
 const ids=new Set(run.rerollSelection),removed=run.hand.filter(t=>ids.has(t.id));run.hand=run.hand.filter(t=>!ids.has(t.id));
 run.discard.push(...removed.map(t=>({char:t.char,style:t.style})));run.rerolls--;career.rerollsUsed++;run.rerollSelection=[];replenish();unlock();save();return{ok:true,count:removed.length};
}
async function loadDictionary(onStatus){
 try{
  onStatus?.('Cargando diccionario…');
  const res=await fetch('../word_play/dictionary-es-50k.txt',{cache:'force-cache'});if(!res.ok)throw new Error('HTTP '+res.status);
  const text=await res.text();dictionary=new Set(text.split(/\r?\n/).map(x=>key(x.trim())).filter(Boolean));
  for(const w of L.lexicon.keys())dictionary.add(key(w));
  dictionaryReady=true;onStatus?.(dictionary.size.toLocaleString('es-ES')+' palabras disponibles');return true;
 }catch{
  dictionary=new Set([...L.lexicon.keys()].map(key));dictionaryReady=true;onStatus?.(dictionary.size.toLocaleString('es-ES')+' palabras locales');return false;
 }
}
function validate(raw){
 const display=String(raw||'').toUpperCase();const lexical=display.replace(/!/g,'');if(lexical.length<2)return{ok:false,message:'Forma una palabra de al menos 2 letras.'};
 if(display.includes('!')&&!display.endsWith('!'))return{ok:false,message:'La exclamación especial solo puede cerrar la palabra.'};
 const w=key(lexical),plain=strip(w);
 const exact=dictionary.has(w)||L.lookup(w).length>0;
 if(!exact){
   if(dictionary.has(plain))return{ok:true,word:plain,display,analysis:L.lookup(plain)[0]||null};
   return{ok:false,message:'«'+lexical+'» no está en el diccionario de Forja.'};
 }
 return{ok:true,word:w,display,analysis:L.lookup(w)[0]||null};
}
function tileContribution(t,char){
 let points=t.style==='wild'?0:letterValue(char||t.char),multi=0;
 if(t.style==='bold')points+=2;
 if(t.style==='italic')multi+=1;
 if(t.style==='underline')multi+=.5;
 if(t.style==='gold'){points+=5;multi+=2;}
 if(t.style==='bang'){points+=10;multi+=3;}
 return{points,multi};
}
function score(raw,preview=true){
 const val=validate(raw);if(!val.ok)return{valid:false,points:0,multis:1,total:0,effects:[],analysis:null};
 const tiles=selectedTiles(),letters=val.word.toUpperCase(),chars=[...letters],effects=[];
 let points=chars.length*2,multis=1+Math.floor(chars.length/3),pointsFactor=1,multiFactor=1;
 effects.push('Longitud +'+(chars.length*2)+' P');
 if(Math.floor(chars.length/3)>0)effects.push('Longitud +'+Math.floor(chars.length/3)+' M');
 tiles.forEach((t,i)=>{const c=t.style==='bang'?'!':chars[Math.min(i,chars.length-1)]||t.char;const q=tileContribution(t,c);points+=q.points;multis+=q.multi;});
 const vowels=chars.filter(c=>VOWELS.includes(c)).length,consonants=chars.length-vowels;
 const unique=new Set(chars.map(strip)).size,repeats=chars.length-unique,rare=chars.filter(c=>RARE.includes(c.toUpperCase())||c.toUpperCase()==='Ñ').length;
 const accents=chars.filter(c=>/[ÁÉÍÓÚ]/.test(c)).length,specials=tiles.filter(t=>['gold','wild','bang'].includes(t.style)).length;
 const analysis=val.analysis,category=analysis?.category||null;
 const left=run.hand.filter(t=>!run.selected.some(s=>s.id===t.id));
 const addP=(label,n)=>{if(n){points+=n;effects.push(label+' +'+Math.round(n)+' P');}};
 const addM=(label,n)=>{if(n){multis+=n;effects.push(label+' +'+Number(n.toFixed?.(1)||n)+' M');}};
 const mulP=(label,n)=>{if(n!==1){pointsFactor*=n;effects.push(label+' ×'+n+' P');}};
 const mulM=(label,n)=>{if(n!==1){multiFactor*=n;effects.push(label+' ×'+n+' M');}};
 for(const id of run.bonuses){
  const e=bonus(id)?.effect;
  if(e==='vowel')addP('Vocalista',vowels*3);
  if(e==='consonant')addP('Consonante',consonants*2);
  if(e==='long'&&chars.length>=5)addP('Palabra larga',18);
  if(e==='short'&&chars.length<=5)mulM('Palabra corta',2);
  if(e==='four'&&chars.length===4)addM('Cuatro',4);
  if(e==='six'&&chars.length===6)addM('Sexta marcha',6);
  if(e==='eight'&&chars.length===8)mulP('Ocho',1.5);
  if(e==='unique')addM('Variedad',unique);
  if(e==='repeat')addP('Repetición',repeats*4);
  if(e==='rare')addP('Raras',rare*10);
  if(e==='enie'){const n=chars.filter(c=>c.toUpperCase()==='Ñ').length;addP('Ñ primordial',n*10);addM('Ñ primordial',n*2);}
  if(e==='accent')addP('Tinta acentuada',accents*10);
  if(e==='multLetters')addM('M.U.L.T.',chars.filter(c=>'MULT'.includes(strip(c))).length*4);
  if(e==='pointLetters')addP('P.U.N.T.O.',chars.filter(c=>'PUNTO'.includes(strip(c))).length*7);
  if(e==='firstEcho'&&run.previousWord&&strip(run.previousWord[0])===strip(chars[0]))addP('Eco inicial',12);
  if(e==='twins'&&run.previousLength===chars.length)addM('Gemelos',6);
  if(e==='yoyo'&&run.previousLength)addM('Yo-yo',Math.abs(run.previousLength-chars.length));
  if(e==='saving')addM('Ahorro',run.rerolls);
  if(e==='stock'&&left.length)addM('Stock',Math.min(...left.map(t=>letterValue(t.char)||1)));
  if(e==='cooking')addP('Cocción',left.length*2);
  if(e==='backwall'&&run.energy===1){mulP('Contra las cuerdas',2);mulM('Contra las cuerdas',2);}
  if(e==='boost')addM('Impulso',5);
  if(e==='rawPoints')addP('Base fuerte',12);
  if(e==='targetLength'&&chars.length===run.targetLength)mulM('Objetivo '+run.targetLength,2);
  if(e==='consonantBalance'&&consonants>=vowels)addM('B ≥ A',1);
  if(e==='manyVowels'&&new Set(chars.filter(c=>VOWELS.includes(c)).map(strip)).size>=4)mulP('Pentavocal',2);
  if(e==='manyConsonants'&&consonants>=4)addM('Muro consonante',10);
  if(e==='noun'&&category==='noun')addM('Sustantivos',8);
  if(e==='verb'&&category==='verb')mulP('Verbos',1.5);
  if(e==='adj'&&category==='adj')addP('Adjetivos',25);
  if(e==='adv'&&category==='adv')addM('Adverbios',12);
  if(e==='categoryMix'){const cats=new Set(run.categorySeenRound);if(category)cats.add(category);addM('Prisma morfológico',cats.size*3);}
  if(e==='palindrome'&&chars.length>=3&&strip(chars.join(''))===strip([...chars].reverse().join('')))mulM('Espejo',3);
  if(e==='noRepeat'&&unique===chars.length)addP('Letras limpias',12);
  if(e==='startsVowel'&&VOWELS.includes(chars[0]))addM('Puerta vocálica',7);
  if(e==='endsS'&&strip(chars.at(-1))==='S')addP('Final en S',30);
  if(e==='five'&&chars.length===5)addP('Cinco exactas',25);
  if(e==='seven'&&chars.length===7)addM('Siete exactas',12);
  if(e==='nine'&&chars.length>=9){mulP('Nueve exactas',2);addM('Nueve exactas',10);}
  if(e==='specialUse'){addP('Tormenta',specials*8);addM('Tormenta',specials*2);}
  if(e==='lastEnergy'&&run.energy===1){addP('Última chispa',15);addM('Última chispa',8);}
  if(e==='triple'){const n=Math.floor(chars.length/3);addP('Triple',n*3);addM('Triple',n);}
 }
 if(has('afortunada')&&!preview){
  tiles.forEach((t,i)=>{if(random()<.12){const q=tileContribution(t,chars[i]||t.char);points+=q.points;multis+=q.multi;effects.push('Ficha afortunada ↻');}});
 }
 points=Math.max(0,Math.round(points*pointsFactor));multis=Math.max(1,Math.round(multis*multiFactor*10)/10);
 return{valid:true,word:val.word,display:val.display,points,multis,total:Math.round(points*multis),effects,analysis,tileDetails:tiles.map((t,i)=>({...t,playedChar:chars[i]||t.char,...tileContribution(t,chars[i]||t.char)}))};
}
function roundWon(){
 const efficient=run.energy>=2?1:0,trash=has('papelera')?2:0;
 run.efficiencyReward=efficient;run.rerolls+=1+trash+efficient;
 if(run.round>=totalRounds()){end(true);return;}
 run.status='reward';run.bonusChoices=rewardOptions();if(!run.bonusChoices.length)advanceRound();
}
function play(){
 if(!allowed())return{ok:false,message:'La ronda no está activa.'};const raw=draft(),valid=validate(raw);if(!valid.ok){run.errors++;career.errors++;save();return valid;}
 const sc=score(raw,false),used=new Set(run.selected.map(s=>s.id)),usedTiles=run.hand.filter(t=>used.has(t.id));
 run.hand=run.hand.filter(t=>!used.has(t.id));run.discard.push(...usedTiles.map(t=>({char:t.char,style:t.style})));
 run.energy--;run.roundScore+=sc.total;run.totalScore+=sc.total;run.previousWord=sc.word;run.previousLength=sc.word.length;
 run.words.push(sc.word);run.wordLog.push({word:sc.display,points:sc.points,multis:sc.multis,total:sc.total,effects:sc.effects,round:run.round});
 if(sc.analysis?.category&&!run.categorySeenRound.includes(sc.analysis.category))run.categorySeenRound.push(sc.analysis.category);
 if(has('equilibrio_vocal')){const chars=[...sc.word.toUpperCase()],v=chars.filter(c=>VOWELS.includes(c)).length;if(v>=chars.length-v)run.rerolls++;}
 career.words++;career.phrases=career.words;career.bestPlay=Math.max(career.bestPlay,sc.total);career.bestPoints=Math.max(career.bestPoints,sc.points);career.bestMulti=Math.max(career.bestMulti,sc.multis);career.bestScore=Math.max(career.bestScore,run.totalScore);
 run.selected=[];run.rerollSelection=[];replenish();unlock();
 if(run.roundScore>=run.target)roundWon();else if(run.energy<=0)end(false);
 save();return{ok:true,score:sc,roundWon:run.status==='reward'||run.status==='victory'};
}
function removeBonusImmediate(id){
 if(id==='mas_eleccion'){run.maxHand=Math.max(7,run.maxHand-1);while(run.hand.length>run.maxHand){const t=run.hand.pop();run.discard.push({char:t.char,style:t.style});}}
}
function applyBonusImmediate(id){
 if(id==='mas_eleccion'){run.maxHand++;replenish();}
 if(id==='comodines')run.bag.push('*','*','*');
 if(id==='exclamacion')run.bag.push('!','!');
}
function chooseBonus(id,replaceId=null){
 if(!run||!['starter','reward'].includes(run.status)||!run.bonusChoices.includes(id))return{ok:false};
 if(run.bonuses.length>=MAX_BONUSES&&!replaceId)return{ok:false,needsReplace:true};
 if(replaceId){
  const idx=run.bonuses.indexOf(replaceId);if(idx<0)return{ok:false,message:'La carta a sustituir ya no está activa.'};
  removeBonusImmediate(replaceId);run.bonuses.splice(idx,1);
 }
 run.bonuses.push(id);career.bonusesSeen=[...new Set([...(career.bonusesSeen||[]),id])];applyBonusImmediate(id);
 const wasStarter=run.status==='starter';run.bonusChoices=[];
 if(wasStarter){run.status='play';run.energy=roundEnergy();run.target=targetForRound(1);}
 else advanceRound();
 unlock();save();return{ok:true,replaced:replaceId||null};
}
function rerollBonuses(){
 if(run?.status!=='reward'||run.rerolls<=0)return{ok:false,message:'No quedan rerolls.'};
 run.rerolls--;career.rerollsUsed++;run.bonusChoices=rewardOptions();unlock();save();return{ok:true};
}
function advanceRound(){
 run.round++;run.roundScore=0;run.target=targetForRound(run.round);run.status='play';run.energy=roundEnergy();run.categorySeenRound=[];run.targetLength=4+Math.floor(random()*5);run.selected=[];run.rerollSelection=[];run.efficiencyReward=0;replenish();
}
function end(won){run.status=won?'victory':'defeat';run.finished=true;run.resultId=run.id+'_result';if(won)career.wins++;career.bestScore=Math.max(career.bestScore,run.totalScore);unlock();save();}
function continueEndless(){
 if(!run?.finished||run.status!=='victory')return false;run.finished=false;run.status='play';run.round++;run.roundScore=0;run.target=Math.round((run.target||mode().targets.at(-1))*1.35);run.energy=roundEnergy();run.rerolls+=1;run.categorySeenRound=[];run.resultId=null;replenish();save();return true;
}
function unlock(){
 const log=run?.wordLog||[];
 const cond=[career.words>=1,(run?.round||0)>=5,career.wins>=1,log.some(x=>String(x.word).replace(/!/g,'').length>=9),career.bestMulti>=50,career.bestPoints>=100,career.bestPlay>=5000,career.rerollsUsed>=10,(career.bonusesSeen||[]).length>=10,log.some(x=>x.effects?.some(e=>/Tormenta|afortunada/.test(e))||false)];
 C.achievements.forEach((a,i)=>{if(cond[i]&&!career.achievements.includes(a.id))career.achievements.push(a.id);});
}
function normalizeRun(){
 if(!run)return;
 run.maxHand=Number.isFinite(run.maxHand)?run.maxHand:7;
 run.bonuses=Array.isArray(run.bonuses)?run.bonuses.slice(0,MAX_BONUSES):[];
 run.bonusChoices=Array.isArray(run.bonusChoices)?run.bonusChoices:[];
 run.rerollSelection=Array.isArray(run.rerollSelection)?run.rerollSelection:[];
 run.categorySeenRound=Array.isArray(run.categorySeenRound)?run.categorySeenRound:[];
 run.efficiencyReward=Number(run.efficiencyReward||0);
}
function snapshot(){return{version:2,gameId:'lexoma',run:clone(run),career:clone(career)};}
function save(){if(run)run.updatedAt=Date.now();try{localStorage.setItem(storageKey,JSON.stringify(snapshot()));window.LexomaEngine.storageOK=true;}catch{window.LexomaEngine.storageOK=false;}window.dispatchEvent(new Event('lexoma:change'));}
function validSave(raw){return raw?.gameId==='lexoma'&&raw.version===2&&(!raw.run||(raw.run.version===2&&Array.isArray(raw.run.hand)&&Array.isArray(raw.run.bag)&&Array.isArray(raw.run.bonuses)));}
function restore(raw){if(!validSave(raw))return false;run=clone(raw.run);normalizeRun();career={...freshCareer(),...clone(raw.career||{})};career.bonusesSeen=Array.isArray(career.bonusesSeen)?career.bonusesSeen:[];career.achievements=Array.isArray(career.achievements)?career.achievements:[];unlock();save();return true;}
function load(){run=null;career=freshCareer();try{const raw=JSON.parse(localStorage.getItem(storageKey)||'null');if(validSave(raw)){run=raw.run;normalizeRun();career={...freshCareer(),...raw.career};}}catch{}window.dispatchEvent(new Event('lexoma:change'));}
function setProfile(profile){storageKey='lexoma.v2.'+encodeURIComponent(String(profile.studentId||profile.id||profile.email||'guest'));load();}
function metrics(){const correct=run?.words?.length||0,errors=run?.errors||0;return{score:run?.totalScore||0,correct,errors,attempts:correct+errors,accuracy:correct+errors?Math.round(correct/(correct+errors)*100):0,percentage:run?.status==='victory'?100:Math.min(99,Math.round(((run?.round||1)-1)/Math.max(1,totalRounds())*100)),maxCombo:career.bestMulti||1,words:correct,concordances:0};}

window.LexomaEngine={newRun,start:newRun,select,cycleAccent,clear,toggleReroll,rerollLetters,draft,score,play,chooseBonus,rerollBonuses,continueEndless,loadDictionary,validate,letterValue,snapshot,restore,setProfile,save,metrics,totalRounds,targetForRound,roundEnergy,maxBonuses:MAX_BONUSES,storageOK:true,get dictionaryReady(){return dictionaryReady;},get run(){return run;},get career(){return career;},get achievements(){return C.achievements.filter(a=>career.achievements.includes(a.id));}};
load();
})();