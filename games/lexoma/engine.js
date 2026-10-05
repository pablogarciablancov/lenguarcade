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
const SERVICE_COSTS={remove:4,bold:4,italic:4,gold:7};
let run=null,career=freshCareer(),storageKey='lexoma.v2.guest',dictionary=new Set(),dictionaryAliases=new Map(),dictionaryReady=false;

function freshCareer(){return{games:0,wins:0,bestScore:0,bestPlay:0,bestPoints:0,bestMulti:1,words:0,phrases:0,concordances:0,errors:0,rerollsUsed:0,bonusesSeen:[],achievements:[]};}
function strip(s){return String(s||'').normalize('NFD').replace(/[\u0300\u0301]/g,'').normalize('NFC');}
function key(s){return String(s||'').toLowerCase().normalize('NFC');}
function random(){run.rng=(Math.imul(run.rng,1664525)+1013904223)>>>0;return run.rng/4294967296;}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function has(id){return !!run?.bonuses?.includes(id);}
function cardLevel(id){return Math.max(1,Math.min(3,Number(run?.cardLevels?.[id]||1)));}
function mode(){return C.modes[run?.mode]||C.modes.normal;}
function baseBag(){return [...'AAAAAAAAAAAAEEEEEEEEEEEEEEIIIIIIIIIOOOOOOOOOOOUUUUUBBBBCCCCDDDDDFFFFGGGGHHHHJJLLLMMMMNNNNNNNNÑÑPPPPQQRRRRRRRRSSSSSSSSTTTTTTTVVVXXYYZZ'];}
function letterValue(c){const u=strip(c).toUpperCase();return LETTER_VALUES[u]||0;}
function tile(char,style='normal'){return{id:++run.tileId,char,style,bonusPoints:0,bonusMulti:0};}
function bonus(id){return C.bonuses.find(x=>x.id===id);}
function totalRounds(){return mode().rounds;}
function roundEnergy(){return mode().energy+(has('bateria')?cardLevel('bateria'):0);}
function targetForRound(round=run.round){
 const cfg=mode();let target=cfg.targets[Math.min(round-1,cfg.targets.length-1)]||Math.round(cfg.targets.at(-1)*Math.pow(1.32,round-cfg.targets.length));
 if(has('modo_facil'))target=Math.round(target*(1-(.12+.05*(cardLevel('modo_facil')-1))));
 return target;
}
function drawStyle(char){
 if(char==='*'||char==='!')return char==='*'?'wild':'bang';
 const specialChance=.035+(has('legendarias')?.07+.035*(cardLevel('legendarias')-1):0);
 if(random()<specialChance)return random()<.55?'gold':'wild';
 const improvedChance=.06+(has('negrita')?.08+.04*(cardLevel('negrita')-1):0)+(has('cursiva')?.08+.04*(cardLevel('cursiva')-1):0)+(has('subrayado')?.07+.035*(cardLevel('subrayado')-1):0);
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
 if(predicate&&idx<0)return null;
 if(idx<0)idx=run.bag.length-1;
 return run.bag.splice(idx,1)[0];
}
function drawOne(preferVowel=false,avoid=new Set()){
 const predicate=c=>{
  if(!c)return false;const upper=String(c).toUpperCase();
  if(avoid.has(strip(upper)))return false;
  if(preferVowel)return VOWELS.includes(upper)||upper==='*';
  return true;
 };
 let item=pullBagItem(predicate);if(item==null)return null;
 const char=itemChar(item),style=typeof item==='string'?drawStyle(char):(item.style||'normal');
 return tile(char,style);
}
function replenish(){
 while(run.hand.length<run.maxHand){
  const counts={};for(const t of run.hand){const c=strip(String(t.char).toUpperCase());counts[c]=(counts[c]||0)+1;}
  const avoid=new Set(Object.entries(counts).filter(([,n])=>n>=2).map(([c])=>c));
  const vowelCount=run.hand.filter(t=>VOWELS.includes(String(t.char).toUpperCase())||t.style==='wild'||t.char==='*').length;
  const needVowel=vowelCount<2;
  let t=drawOne(needVowel,avoid);if(!t&&avoid.size)t=drawOne(needVowel,new Set());if(!t&&needVowel)t=drawOne(false,avoid);if(!t)t=drawOne(false,new Set());if(!t)break;run.hand.push(t);
 }
}
function syncHandLimit(){
 run.maxHand=7+(has('mas_eleccion')?cardLevel('mas_eleccion'):0);
 while(run.hand.length>run.maxHand){const t=run.hand.pop();run.discard.push({char:t.char,style:t.style});}
 replenish();
}
function daySeed(){const d=new Date();return Number(String(d.getFullYear())+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0'))>>>0;}
function cardPrice(id,starter=false){
 const b=bonus(id);if(!b)return 99;
 let p=b.type==='hybrid'?7:b.type==='utility'?6:5;
 if(['palabra_corta','impulso','nueve','bateria','mas_eleccion','modo_facil','legendarias','comodines','exclamacion'].includes(id))p+=1;
 return Math.max(3,p-(starter?1:0));
}
function upgradePrice(id){return cardLevel(id)>=3?null:5+(cardLevel(id)-1)*3;}
function offerIds(starter=false){
 const source=starter?STARTER_POOL:C.bonuses.map(b=>b.id);
 return shuffle(source.filter(id=>!run.bonuses.includes(id))).slice(0,3);
}
function pickEvent(){
 if(!C.events?.length||random()>.72)return null;
 return C.events[Math.floor(random()*C.events.length)].id;
}
function generateShop(origin='round'){
 const starter=origin==='starter',ids=offerIds(starter);
 run.status='shop';run.shop={
  origin,
  cards:ids.map(id=>({id,price:cardPrice(id,starter)})),
  refreshCost:2,
  refreshes:0,
  eventId:starter?null:pickEvent(),
  eventResolved:false,
  eventResult:''
 };
 run.bonusChoices=ids;
}
function newRun(modeId='normal',seed=null){
 const cfg=C.modes[modeId]||C.modes.normal,seedValue=seed==null?(modeId==='daily'?daySeed():Date.now()):seed;
 run={version:2,id:'forja_'+Date.now()+'_'+seedValue,mode:modeId,rng:Number(seedValue)>>>0,tileId:0,status:'shop',round:1,roundScore:0,totalScore:0,target:cfg.targets[0],energy:cfg.energy,rerolls:cfg.rerolls,coins:cfg.wallet??8,maxHand:7,bag:[],discard:[],hand:[],selected:[],rerollSelection:[],bonuses:[],cardLevels:{},bonusChoices:[],shop:null,previousWord:'',previousLength:0,targetLength:4,words:[],wordLog:[],errors:0,categorySeenRound:[],efficiencyReward:0,lastIncome:null,nextTargetFactor:1,nextBounty:0,nextEnergyBonus:0,activeBounty:0,finished:false,resultId:null,updatedAt:Date.now()};
 run.bag=shuffle(baseBag());run.targetLength=4+Math.floor(random()*5);replenish();generateShop('starter');career.games++;save();return run;
}
function allowed(){return run&&run.status==='play'&&!run.finished;}
function tileChar(sel){const t=run.hand.find(x=>x.id===sel.id);return sel.char||t?.char||'';}
function draft(){return (run?.selected||[]).map(tileChar).join('');}
function selectedTiles(){return (run?.selected||[]).map(s=>run.hand.find(t=>t.id===s.id)).filter(Boolean);}
function select(id,assigned=null){
 if(!allowed())return;const t=run.hand.find(x=>x.id===id);if(!t)return;run.rerollSelection=[];
 const i=run.selected.findIndex(x=>x.id===id);if(i>=0){run.selected.splice(i,1);save();return;}
 if(run.selected.length>=9)return;
 if(t.style==='wild'||t.char==='*'){if(!/^[A-ZÑÁÉÍÓÚÜ]$/u.test(assigned||''))return;run.selected.push({id,char:assigned.toUpperCase()});}
 else if(t.style==='bang'||t.char==='!'){if(run.selected.some(x=>tileChar(x)==='!'))return;run.selected.push({id,char:'!'});}
 else run.selected.push({id,char:t.char});save();
}
function cycleAccent(id){if(!allowed())return;const s=run.selected.find(x=>x.id===id);if(!s)return;const c=String(s.char||tileChar(s)).toUpperCase();if(ACCENTS[c]){s.char=ACCENTS[c];save();}}
function clear(){if(!allowed())return;run.selected=[];save();}
function toggleReroll(id){
 if(!allowed()||run.selected.some(x=>x.id===id))return;
 const i=run.rerollSelection.indexOf(id);if(i>=0)run.rerollSelection.splice(i,1);else if(run.rerollSelection.length<3)run.rerollSelection.push(id);save();
}
function rerollLetters(){
 if(!allowed()||run.rerolls<=0||!run.rerollSelection.length)return{ok:false,message:'Selecciona entre 1 y 3 letras para cambiar.'};
 const ids=new Set(run.rerollSelection),removed=run.hand.filter(t=>ids.has(t.id));run.hand=run.hand.filter(t=>!ids.has(t.id));
 run.discard.push(...removed.map(t=>({char:t.char,style:t.style})));run.rerolls--;career.rerollsUsed++;run.rerollSelection=[];replenish();unlock();save();return{ok:true,count:removed.length};
}
async function loadDictionary(onStatus){
 dictionaryReady=false;onStatus?.('Cargando diccionario…');
 // Carga independiente: un fallo de la lista compartida no anula el banco de Forja.
 const sources=await Promise.allSettled(['../word_play/dictionary-es-50k.txt','dictionary-es-extra.txt?v=20261005'].map(async url=>{
  const res=await fetch(url,{cache:'force-cache'});if(!res.ok)throw new Error('HTTP '+res.status);return res.text();
 }));
 dictionary=new Set([...L.lexicon.keys()].map(key));
 for(const source of sources)if(source.status==='fulfilled')for(const raw of source.value.split(/\r?\n/)){
  const word=key(raw.trim());if(/^[a-záéíóúüñ]{2,}$/u.test(word))dictionary.add(word);
 }
 // Alias solo de acentos: Ñ y Ü conservan su identidad. Lookup O(1) por jugada.
 dictionaryAliases=new Map();for(const word of dictionary)if(!dictionaryAliases.has(strip(word)))dictionaryAliases.set(strip(word),word);
 dictionaryReady=true;const loaded=sources.some(s=>s.status==='fulfilled');
 onStatus?.(dictionary.size.toLocaleString('es-ES')+(loaded?' palabras disponibles':' palabras locales'));
 return loaded;
}
function validate(raw){
 const display=String(raw||'').toUpperCase(),lexical=display.replace(/!/g,'');if(lexical.length<2)return{ok:false,message:'Forma una palabra de al menos 2 letras.'};
 if(display.includes('!')&&!display.endsWith('!'))return{ok:false,message:'La exclamación especial solo puede cerrar la palabra.'};
 const w=key(lexical),alias=dictionaryAliases.get(strip(w));
 const canonical=L.lookup(w).length?w:L.lookup(alias).length?alias:dictionary.has(w)?w:alias;
 if(!canonical)return{ok:false,message:'«'+lexical+'» no está en el diccionario de Forja.'};
 return{ok:true,word:canonical,display,analysis:L.lookup(canonical)[0]||null};
}
function tileContribution(t,char){
 let points=t.style==='wild'?0:letterValue(char||t.char),multi=0;
 if(t.style==='bold')points+=2;if(t.style==='italic')multi+=1;if(t.style==='underline')multi+=.5;if(t.style==='gold'){points+=5;multi+=2;}if(t.style==='bang'){points+=10;multi+=3;}
 return{points,multi};
}
function score(raw,preview=true){
 const val=validate(raw);if(!val.ok)return{valid:false,points:0,multis:1,total:0,effects:[],analysis:null};
 const tiles=selectedTiles(),letters=val.word.toUpperCase(),chars=[...letters],effects=[];
 let points=chars.length*2,multis=1+Math.floor(chars.length/3),pointsFactor=1,multiFactor=1;
 effects.push('Longitud +'+(chars.length*2)+' P');if(Math.floor(chars.length/3)>0)effects.push('Longitud +'+Math.floor(chars.length/3)+' M');
 tiles.forEach((t,i)=>{const c=t.style==='bang'?'!':chars[Math.min(i,chars.length-1)]||t.char,q=tileContribution(t,c);points+=q.points;multis+=q.multi;});
 const vowels=chars.filter(c=>VOWELS.includes(c)).length,consonants=chars.length-vowels,unique=new Set(chars.map(strip)).size,repeats=chars.length-unique,rare=chars.filter(c=>RARE.includes(c.toUpperCase())||c.toUpperCase()==='Ñ').length;
 const accents=chars.filter(c=>/[ÁÉÍÓÚ]/.test(c)).length,specials=tiles.filter(t=>['gold','wild','bang'].includes(t.style)).length,analysis=val.analysis,category=analysis?.category||null,left=run.hand.filter(t=>!run.selected.some(s=>s.id===t.id));
 const addP=(label,n)=>{if(n){points+=n;effects.push(label+' +'+Math.round(n)+' P');}},addM=(label,n)=>{if(n){multis+=n;effects.push(label+' +'+Number(n.toFixed?.(1)||n)+' M');}},mulP=(label,n)=>{if(n!==1){pointsFactor*=n;effects.push(label+' ×'+Number(n.toFixed(2))+' P');}},mulM=(label,n)=>{if(n!==1){multiFactor*=n;effects.push(label+' ×'+Number(n.toFixed(2))+' M');}};
 for(const id of run.bonuses){
  const e=bonus(id)?.effect,lvl=cardLevel(id),scale=1+.35*(lvl-1);
  const P=(l,n)=>addP(l,n*scale),M=(l,n)=>addM(l,n*scale),XP=(l,n)=>mulP(l,1+(n-1)*scale),XM=(l,n)=>mulM(l,1+(n-1)*scale);
  if(e==='vowel')P('Vocalista',vowels*3);
  if(e==='consonant')P('Consonante',consonants*2);
  if(e==='long'&&chars.length>=5)P('Palabra larga',18);
  if(e==='short'&&chars.length<=5)XM('Palabra corta',2);
  if(e==='four'&&chars.length===4)M('Cuatro',4);
  if(e==='six'&&chars.length===6)M('Sexta marcha',6);
  if(e==='eight'&&chars.length===8)XP('Ocho',1.5);
  if(e==='unique')M('Variedad',unique);
  if(e==='repeat')P('Repetición',repeats*4);
  if(e==='rare')P('Raras',rare*10);
  if(e==='enie'){const n=chars.filter(c=>c.toUpperCase()==='Ñ').length;P('Ñ primordial',n*10);M('Ñ primordial',n*2);}
  if(e==='accent')P('Tinta acentuada',accents*10);
  if(e==='multLetters')M('M.U.L.T.',chars.filter(c=>'MULT'.includes(strip(c))).length*4);
  if(e==='pointLetters')P('P.U.N.T.O.',chars.filter(c=>'PUNTO'.includes(strip(c))).length*7);
  if(e==='firstEcho'&&run.previousWord&&strip(run.previousWord[0])===strip(chars[0]))P('Eco inicial',12);
  if(e==='twins'&&run.previousLength===chars.length)M('Gemelos',6);
  if(e==='yoyo'&&run.previousLength)M('Yo-yo',Math.abs(run.previousLength-chars.length));
  if(e==='saving')M('Ahorro',run.rerolls);
  if(e==='stock'&&left.length)M('Stock',Math.min(...left.map(t=>letterValue(t.char)||1)));
  if(e==='cooking')P('Cocción',left.length*2);
  if(e==='backwall'&&run.energy===1){XP('Contra las cuerdas',2);XM('Contra las cuerdas',2);}
  if(e==='boost')M('Impulso',5);
  if(e==='rawPoints')P('Base fuerte',12);
  if(e==='targetLength'&&chars.length===run.targetLength)XM('Objetivo '+run.targetLength,2);
  if(e==='consonantBalance'&&consonants>=vowels)M('B ≥ A',1);
  if(e==='manyVowels'&&new Set(chars.filter(c=>VOWELS.includes(c)).map(strip)).size>=4)XP('Pentavocal',2);
  if(e==='manyConsonants'&&consonants>=4)M('Muro consonante',10);
  if(e==='noun'&&category==='noun')M('Sustantivos',8);
  if(e==='verb'&&category==='verb')XP('Verbos',1.5);
  if(e==='adj'&&category==='adj')P('Adjetivos',25);
  if(e==='adv'&&category==='adv')M('Adverbios',12);
  if(e==='categoryMix'){const cats=new Set(run.categorySeenRound);if(category)cats.add(category);M('Prisma morfológico',cats.size*3);}
  if(e==='palindrome'&&chars.length>=3&&strip(chars.join(''))===strip([...chars].reverse().join('')))XM('Espejo',3);
  if(e==='noRepeat'&&unique===chars.length)P('Letras limpias',12);
  if(e==='startsVowel'&&VOWELS.includes(chars[0]))M('Puerta vocálica',7);
  if(e==='endsS'&&strip(chars.at(-1))==='S')P('Final en S',30);
  if(e==='five'&&chars.length===5)P('Cinco exactas',25);
  if(e==='seven'&&chars.length===7)M('Siete exactas',12);
  if(e==='nine'&&chars.length>=9){XP('Nueve exactas',2);M('Nueve exactas',10);}
  if(e==='specialUse'){P('Tormenta',specials*8);M('Tormenta',specials*2);}
  if(e==='lastEnergy'&&run.energy===1){P('Última chispa',15);M('Última chispa',8);}
  if(e==='triple'){const n=Math.floor(chars.length/3);P('Triple',n*3);M('Triple',n);}
 }
 if(has('afortunada')&&!preview){const chance=.12+.05*(cardLevel('afortunada')-1);tiles.forEach((t,i)=>{if(random()<chance){const q=tileContribution(t,chars[i]||t.char);points+=q.points;multis+=q.multi;effects.push('Ficha afortunada ↻');}});}
 points=Math.max(0,Math.round(points*pointsFactor));multis=Math.max(1,Math.round(multis*multiFactor*10)/10);
 return{valid:true,word:val.word,display:val.display,points,multis,total:Math.round(points*multis),effects,analysis,tileDetails:tiles.map((t,i)=>({...t,playedChar:chars[i]||t.char,...tileContribution(t,chars[i]||t.char)}))};
}
function earnRoundIncome(){
 const base=3,energy=Math.max(0,run.energy),interest=Math.min(4,Math.floor(run.coins/5)),bounty=Math.max(0,run.activeBounty||0),total=base+energy+interest+bounty;
 run.coins+=total;run.lastIncome={base,energy,interest,bounty,total};run.activeBounty=0;return run.lastIncome;
}
function roundWon(){
 const efficient=run.energy>=2?1:0,trash=has('papelera')?1+cardLevel('papelera'):0;
 run.efficiencyReward=efficient;run.rerolls+=1+trash+efficient;earnRoundIncome();
 if(!run.endless&&run.round>=totalRounds()){end(true);return;}
 generateShop('round');
}
function play(){
 if(!allowed())return{ok:false,message:'La ronda no está activa.'};const raw=draft(),valid=validate(raw);if(!valid.ok){run.errors++;career.errors++;save();return valid;}
 const sc=score(raw,false),used=new Set(run.selected.map(s=>s.id)),usedTiles=run.hand.filter(t=>used.has(t.id));
 run.hand=run.hand.filter(t=>!used.has(t.id));run.discard.push(...usedTiles.map(t=>({char:t.char,style:t.style})));
 run.energy--;run.roundScore+=sc.total;run.totalScore+=sc.total;run.previousWord=sc.word;run.previousLength=sc.word.length;run.words.push(sc.word);run.wordLog.push({word:sc.display,points:sc.points,multis:sc.multis,total:sc.total,effects:sc.effects,round:run.round});
 if(sc.analysis?.category&&!run.categorySeenRound.includes(sc.analysis.category))run.categorySeenRound.push(sc.analysis.category);
 if(has('equilibrio_vocal')){const chars=[...sc.word.toUpperCase()],v=chars.filter(c=>VOWELS.includes(c)).length;if(v>=chars.length-v)run.rerolls++;}
 career.words++;career.phrases=career.words;career.bestPlay=Math.max(career.bestPlay,sc.total);career.bestPoints=Math.max(career.bestPoints,sc.points);career.bestMulti=Math.max(career.bestMulti,sc.multis);career.bestScore=Math.max(career.bestScore,run.totalScore);
 run.selected=[];run.rerollSelection=[];replenish();unlock();if(run.roundScore>=run.target)roundWon();else if(run.energy<=0)end(false);save();return{ok:true,score:sc,roundWon:run.status==='shop'||run.status==='victory'};
}
function removeBonusImmediate(id){delete run.cardLevels[id];syncHandLimit();}
function applyBonusImmediate(id){
 run.cardLevels[id]=run.cardLevels[id]||1;
 if(id==='comodines')run.bag.push('*','*','*');
 if(id==='exclamacion')run.bag.push('!','!');
 syncHandLimit();
}
function buyCard(id,replaceId=null){
 if(run?.status!=='shop')return{ok:false,message:'No estás en la tienda.'};
 const offer=run.shop?.cards?.find(x=>x.id===id);if(!offer)return{ok:false,message:'Esa carta ya no está en venta.'};
 if(run.coins<offer.price)return{ok:false,message:'No tienes monedas suficientes.'};
 if(run.bonuses.length>=MAX_BONUSES&&!replaceId)return{ok:false,needsReplace:true,price:offer.price};
 if(replaceId){
  const idx=run.bonuses.indexOf(replaceId);if(idx<0)return{ok:false,message:'La carta a sustituir ya no está activa.'};
  removeBonusImmediate(replaceId);run.bonuses.splice(idx,1);
 }
 run.coins-=offer.price;run.bonuses.push(id);run.cardLevels[id]=1;career.bonusesSeen=[...new Set([...(career.bonusesSeen||[]),id])];applyBonusImmediate(id);
 run.shop.cards=run.shop.cards.filter(x=>x.id!==id);run.bonusChoices=run.shop.cards.map(x=>x.id);unlock();save();return{ok:true,price:offer.price,replaced:replaceId||null};
}
function refreshShop(){
 if(run?.status!=='shop')return{ok:false,message:'No estás en la tienda.'};
 const cost=run.shop.refreshCost||2;if(run.coins<cost)return{ok:false,message:'No tienes monedas suficientes.'};
 run.coins-=cost;run.shop.refreshes=(run.shop.refreshes||0)+1;run.shop.refreshCost=Math.min(6,cost+1);
 const ids=offerIds(run.shop.origin==='starter');run.shop.cards=ids.map(id=>({id,price:cardPrice(id,run.shop.origin==='starter')}));run.bonusChoices=ids;save();return{ok:true,cost};
}
function upgradeCardInternal(id){
 if(!has(id)||cardLevel(id)>=3)return false;run.cardLevels[id]=cardLevel(id)+1;
 if(id==='comodines')run.bag.push('*');
 if(id==='exclamacion')run.bag.push('!');
 syncHandLimit();return true;
}
function upgradeCard(id){
 if(run?.status!=='shop'||!has(id))return{ok:false,message:'Esa carta no está activa.'};
 const cost=upgradePrice(id);if(cost==null)return{ok:false,message:'La carta ya está al nivel máximo.'};if(run.coins<cost)return{ok:false,message:'No tienes monedas suficientes.'};
 run.coins-=cost;upgradeCardInternal(id);save();return{ok:true,cost,level:cardLevel(id)};
}
function inventory(){
 const counts={};for(const zone of [run?.bag||[],run?.discard||[],run?.hand||[]])for(const item of zone){const c=String(itemChar(item)).toUpperCase();if(!/^[A-ZÑÁÉÍÓÚÜ]$/u.test(c))continue;counts[c]=(counts[c]||0)+1;}
 return Object.entries(counts).map(([char,count])=>({char,count,value:letterValue(char)})).sort((a,b)=>a.char.localeCompare(b.char,'es'));
}
function removeOneFromZone(zone,char){
 const i=zone.findIndex(x=>String(itemChar(x)).toUpperCase()===char);if(i<0)return null;return zone.splice(i,1)[0];
}
function removeLetterInternal(char){
 char=String(char||'').toUpperCase();let removed=removeOneFromZone(run.bag,char)||removeOneFromZone(run.discard,char)||removeOneFromZone(run.hand,char);if(!removed)return false;replenish();return true;
}
function removeLetter(char){
 if(run?.status!=='shop')return{ok:false,message:'Solo puedes depurar la bolsa en la tienda.'};
 const inv=inventory(),entry=inv.find(x=>x.char===String(char).toUpperCase());if(!entry)return{ok:false,message:'Esa letra ya no está en tu bolsa.'};
 const total=inv.reduce((n,x)=>n+x.count,0);if(total<=60)return{ok:false,message:'La bolsa ya está demasiado reducida.'};
 if(run.coins<SERVICE_COSTS.remove)return{ok:false,message:'No tienes monedas suficientes.'};
 run.coins-=SERVICE_COSTS.remove;removeLetterInternal(entry.char);save();return{ok:true,cost:SERVICE_COSTS.remove,char:entry.char};
}
function engraveTile(id,style){
 if(run?.status!=='shop')return{ok:false,message:'Solo puedes grabar fichas en la tienda.'};
 const t=run.hand.find(x=>x.id===Number(id));if(!t||['wild','bang'].includes(t.style))return{ok:false,message:'Esa ficha no se puede grabar.'};
 const cost=SERVICE_COSTS[style];if(!cost)return{ok:false,message:'Grabado desconocido.'};if(run.coins<cost)return{ok:false,message:'No tienes monedas suficientes.'};
 run.coins-=cost;t.style=style;save();return{ok:true,cost,style};
}
function randomUpgradeableCard(){return shuffle(run.bonuses.filter(id=>cardLevel(id)<3)).at(0)||null;}
function randomCommonLetter(){
 const choices=inventory().filter(x=>x.value<=3&&x.count>0);if(!choices.length)return null;
 const weighted=[];for(const x of choices)for(let i=0;i<x.count;i++)weighted.push(x.char);return weighted[Math.floor(random()*weighted.length)]||null;
}
function resolveEvent(choiceId){
 if(run?.status!=='shop'||!run.shop?.eventId||run.shop.eventResolved)return{ok:false,message:'No hay evento pendiente.'};
 const event=C.events.find(x=>x.id===run.shop.eventId);if(!event)return{ok:false,message:'Evento desconocido.'};
 const choice=event.choices.find(x=>x.id===choiceId);if(!choice)return{ok:false,message:'Opción inválida.'};
 const pay=Number(choice.cost||0);if(run.coins<pay)return{ok:false,message:'No tienes monedas suficientes.'};
 let result='Has dejado pasar el evento.';
 if(choiceId!=='leave'){
  if(event.id==='mercader'&&choiceId==='buy'){run.coins-=pay;run.rerolls+=2;result='+2 rerolls.';}
  else if(event.id==='apuesta'&&choiceId==='accept'){run.nextTargetFactor=Math.max(run.nextTargetFactor,1.25);run.nextBounty+=8;result='Próxima ronda: objetivo +25% · recompensa +8 monedas.';}
  else if(event.id==='bibliotecario'&&choiceId==='accept'){const id=randomUpgradeableCard();if(!id)return{ok:false,message:'No tienes ninguna carta que pueda mejorar.'};run.coins-=pay;upgradeCardInternal(id);result=(bonus(id)?.name||'Una carta')+' sube a nivel '+cardLevel(id)+'.';}
  else if(event.id==='caja'&&choiceId==='open'){run.coins-=pay;run.bag.push('*');result='Añadido un comodín permanente.';}
  else if(event.id==='musa'&&choiceId==='accept'){run.coins-=pay;run.nextEnergyBonus+=1;result='La próxima ronda empieza con +1 Energía.';}
  else if(event.id==='fundicion'&&choiceId==='sell'){const char=randomCommonLetter();if(!char)return{ok:false,message:'No hay una letra adecuada para fundir.'};removeLetterInternal(char);run.coins+=4;result='Fundida '+char+' · +4 monedas.';}
 }
 run.shop.eventResolved=true;run.shop.eventResult=result;save();return{ok:true,result};
}
function leaveShop(){
 if(run?.status!=='shop')return{ok:false,message:'No estás en la tienda.'};
 const origin=run.shop?.origin||'round';run.shop=null;run.bonusChoices=[];
 if(origin==='starter'){
  run.status='play';run.energy=roundEnergy()+run.nextEnergyBonus;run.nextEnergyBonus=0;run.target=Math.round(targetForRound(1)*run.nextTargetFactor);run.activeBounty=run.nextBounty;run.nextTargetFactor=1;run.nextBounty=0;run.lastIncome=null;
 }else advanceRound();
 save();return{ok:true};
}
function advanceRound(){
 run.round++;run.roundScore=0;run.target=Math.round(targetForRound(run.round)*run.nextTargetFactor);run.status='play';run.energy=roundEnergy()+run.nextEnergyBonus;run.activeBounty=run.nextBounty;run.nextTargetFactor=1;run.nextBounty=0;run.nextEnergyBonus=0;run.categorySeenRound=[];run.targetLength=4+Math.floor(random()*5);run.selected=[];run.rerollSelection=[];run.efficiencyReward=0;run.lastIncome=null;replenish();
}
function end(won){run.status=won?'victory':'defeat';run.finished=true;run.shop=null;run.resultId=run.id+'_result';if(won)career.wins++;career.bestScore=Math.max(career.bestScore,run.totalScore);unlock();save();}
function continueEndless(){
 if(!run?.finished||run.status!=='victory')return false;
 run.endless=true;run.finished=false;run.status='play';run.round++;run.roundScore=0;run.target=Math.round((run.target||mode().targets.at(-1))*1.35);run.energy=roundEnergy();run.rerolls+=1;run.categorySeenRound=[];run.resultId=null;run.shop=null;replenish();save();return true;
}
function unlock(){
 const log=run?.wordLog||[],cond=[career.words>=1,(run?.round||0)>=5,career.wins>=1,log.some(x=>String(x.word).replace(/!/g,'').length>=9),career.bestMulti>=50,career.bestPoints>=100,career.bestPlay>=5000,career.rerollsUsed>=10,(career.bonusesSeen||[]).length>=10,log.some(x=>x.effects?.some(e=>/Tormenta|afortunada/.test(e))||false)];
 C.achievements.forEach((a,i)=>{if(cond[i]&&!career.achievements.includes(a.id))career.achievements.push(a.id);});
}
function normalizeRun(){
 if(!run)return;
 run.maxHand=Number.isFinite(run.maxHand)?run.maxHand:7;run.bonuses=Array.isArray(run.bonuses)?run.bonuses.slice(0,MAX_BONUSES):[];run.cardLevels=run.cardLevels&&typeof run.cardLevels==='object'?run.cardLevels:{};for(const id of run.bonuses)run.cardLevels[id]=cardLevel(id);
 run.bonusChoices=Array.isArray(run.bonusChoices)?run.bonusChoices:[];run.rerollSelection=Array.isArray(run.rerollSelection)?run.rerollSelection:[];run.categorySeenRound=Array.isArray(run.categorySeenRound)?run.categorySeenRound:[];run.efficiencyReward=Number(run.efficiencyReward||0);
 run.coins=Number.isFinite(run.coins)?run.coins:(mode().wallet??8);run.endless=!!run.endless;run.nextTargetFactor=Number(run.nextTargetFactor||1);run.nextBounty=Number(run.nextBounty||0);run.nextEnergyBonus=Number(run.nextEnergyBonus||0);run.activeBounty=Number(run.activeBounty||0);run.lastIncome=run.lastIncome||null;
 if(run.status==='starter'||run.status==='reward'){
  const origin=run.status==='starter'?'starter':'round',ids=run.bonusChoices.length?run.bonusChoices:offerIds(origin==='starter');
  run.status='shop';run.shop={origin,cards:ids.map(id=>({id,price:cardPrice(id,origin==='starter')})),refreshCost:2,refreshes:0,eventId:null,eventResolved:false,eventResult:''};
 }
 if(run.status==='shop'&&!run.shop){run.shop={origin:run.round===1&&!run.words.length?'starter':'round',cards:offerIds(false).map(id=>({id,price:cardPrice(id,false)})),refreshCost:2,refreshes:0,eventId:null,eventResolved:false,eventResult:''};}
 syncHandLimit();
}
function snapshot(){return{version:2,gameId:'lexoma',run:clone(run),career:clone(career)};}
function save(){if(run)run.updatedAt=Date.now();try{localStorage.setItem(storageKey,JSON.stringify(snapshot()));window.LexomaEngine.storageOK=true;}catch{window.LexomaEngine.storageOK=false;}window.dispatchEvent(new Event('lexoma:change'));}
function validSave(raw){return raw?.gameId==='lexoma'&&raw.version===2&&(!raw.run||(raw.run.version===2&&Array.isArray(raw.run.hand)&&Array.isArray(raw.run.bag)&&Array.isArray(raw.run.bonuses)));}
function restore(raw){if(!validSave(raw))return false;run=clone(raw.run);career={...freshCareer(),...clone(raw.career||{})};career.bonusesSeen=Array.isArray(career.bonusesSeen)?career.bonusesSeen:[];career.achievements=Array.isArray(career.achievements)?career.achievements:[];normalizeRun();unlock();save();return true;}
function load(){run=null;career=freshCareer();try{const raw=JSON.parse(localStorage.getItem(storageKey)||'null');if(validSave(raw)){run=raw.run;career={...freshCareer(),...raw.career};normalizeRun();}}catch{}window.dispatchEvent(new Event('lexoma:change'));}
function setProfile(profile){storageKey='lexoma.v2.'+encodeURIComponent(String(profile.studentId||profile.id||profile.email||'guest'));load();}
function metrics(){const correct=run?.words?.length||0,errors=run?.errors||0;return{score:run?.totalScore||0,correct,errors,attempts:correct+errors,accuracy:correct+errors?Math.round(correct/(correct+errors)*100):0,percentage:run?.status==='victory'?100:Math.min(99,Math.round(((run?.round||1)-1)/Math.max(1,totalRounds())*100)),maxCombo:career.bestMulti||1,words:correct,concordances:0};}

window.LexomaEngine={
 newRun,start:newRun,select,cycleAccent,clear,toggleReroll,rerollLetters,draft,score,play,
 buyCard,chooseBonus:buyCard,refreshShop,leaveShop,upgradeCard,upgradePrice,removeLetter,inventory,engraveTile,resolveEvent,
 continueEndless,loadDictionary,validate,letterValue,cardLevel,cardPrice,snapshot,restore,setProfile,save,metrics,totalRounds,targetForRound,roundEnergy,maxBonuses:MAX_BONUSES,serviceCosts:SERVICE_COSTS,storageOK:true,
 get dictionaryReady(){return dictionaryReady;},get run(){return run;},get career(){return career;},get achievements(){return C.achievements.filter(a=>career.achievements.includes(a.id));}
};
load();
})();
