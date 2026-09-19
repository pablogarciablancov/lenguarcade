(() => {
'use strict';
const C=window.WordPlayContent,LX=window.WordPlayLexicon||{additions:[],strict:{},blocked:[],rejectPatterns:[]};
const DICTIONARY_URLS=['./dictionary-es-50k.txt','https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt'];
const HUNSPELL_AFF='./hunspell/es_ES.aff',HUNSPELL_DIC='./hunspell/es_ES.dic';
const SAVE_KEY='lenguarcade.wordplay.run.v3',CAREER_KEY='lenguarcade.wordplay.career.v3',SETTINGS_KEY='lenguarcade.wordplay.settings.v1';
const LETTER_POOL=[['A',13],['E',13],['O',10],['S',8],['R',8],['N',7],['I',7],['L',6],['D',5],['T',5],['U',5],['C',4],['M',3],['P',3],['B',2],['G',2],['V',2],['H',2],['F',1.5],['Y',1.5],['Q',1],['J',1],['Ñ',.8],['X',.5],['Z',.5],['K',.12],['W',.12]];
const LETTER_VALUES={A:1,E:1,I:1,O:1,N:1,R:1,S:1,L:1,U:1,D:2,T:2,B:3,C:3,G:3,M:3,P:3,F:4,H:4,V:4,Y:4,Q:5,Ñ:5,J:7,X:7,Z:9,K:10,W:10};
const BOARD_RULES={
  minDistinct:9,
  minVowels:5,
  maxVowels:7,
  maxCopies:{A:3,E:3,I:3,O:3,U:2,S:2,R:2,N:2,L:2,D:2,T:2,C:2,M:2,P:2,B:2,G:2,V:2,H:2,F:2,Y:2,Q:1,J:1,Ñ:1,X:1,Z:1,K:1,W:1},
  quality:{
    normal:{total:30,len4:16,len5:7,len6:2},
    constraint:{total:14,len4:8,len5:3,len6:1},
    boss:{total:7,len4:4,len5:2,len6:1}
  },
  candidateBoards:8,
  replacementAttempts:5
};
const VOWELS=new Set(['A','E','I','O','U']),RARE=new Set(['J','Ñ','Q','X','Z','K','W']);
const ACCENTABLE={A:['A','Á'],E:['E','É'],I:['I','Í'],O:['O','Ó'],U:['U','Ú','Ü']};
const BLOCKED=new Set(['puta','puto','putas','putos','mierda','gilipollas','coño','joder','follar','follando','polla','pollas','cabrón','cabron','cabrones']);
for(const word of (LX.blocked||[]))BLOCKED.add(word);
const STRICT=new Map(Object.entries({cancion:'canción',camion:'camión',avion:'avión',accion:'acción',corazon:'corazón',rincon:'rincón',jardin:'jardín',lapiz:'lápiz',arbol:'árbol',musica:'música',rapido:'rápido',dificil:'difícil',facil:'fácil',filosofia:'filosofía',religion:'religión',gramatica:'gramática',ortografia:'ortografía',tecnologia:'tecnología',linguistica:'lingüística',pinguino:'pingüino',verguenza:'vergüenza',bilingue:'bilingüe',ciguena:'cigüeña',murcielago:'murciélago',dia:'día',despues:'después',aqui:'aquí',alli:'allí',tambien:'también'}));
for(const [wrong,right] of Object.entries(LX.strict||{}))STRICT.set(wrong,right);
const FALLBACK=`casa cosa paso peso piso mesa misa masa mapa mano mono mina luna lana lino loma lupa palo pelo pila polo pera puro para pero toro tiro tela tila tono tuna taza zona amor amigo amiga aula clase libro libros leer poema poemas verso versos rima rimas lengua palabra palabras letra letras frase frases texto textos juego juegos gato gata perro perra pez peces ave aves oso rana lobo vaca toro gallo gallina caballo yegua burro agua aire fuego tierra mar río lago sol luna nube nubes cielo campo bosque árbol hoja hojas flor flores roca arena isla costa playa monte valle camino caminos uno una dos tres cuatro cinco seis siete ocho nueve diez cien mil ser soy eres es somos sois son fui fue fueron era eran estar estoy estás está estamos están tener tengo tienes tiene tenemos tienen hacer hago haces hace hacemos hacen decir digo dices dice decimos dicen ir voy vas va vamos vais van venir vengo vienes viene vienen ver veo ves ve vemos ven dar doy das da damos dan saber sé sabes sabe sabemos saben querer quiero quieres quiere queremos quieren poder puedo puedes puede podemos pueden deber debo debes debe deben poner pongo pones pone ponen salir salgo sales sale salen canción camión avión acción corazón rincón jardín lápiz árbol música rápido rápida difícil fácil filosofía religión gramática ortografía tecnología lingüística pingüino vergüenza bilingüe cigüeña murciélago día días después aquí allí también español niño niña mañana señor señora año años sueño enseñar extraño otoño pequeño pequeña cariño caña piña montaña`;
const EXTRA_WORDS=(LX.additions||[]).join(' ');
const TARGETS=[85,160,270,420,610,840,1110,1470,1930,2510,3260,4200];
let dictionary=new Set(),accentMap=new Map(),wordIndex=[],hunspell=null,state=null,career=loadCareer(),settings=loadSettings();
const normalize=s=>String(s||'').trim().toLowerCase().normalize('NFC');
const strip=s=>normalize(s).replace(/ñ/g,'__enie__').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/__enie__/g,'ñ');
const vowel=c=>/[aeiouáéíóúü]/i.test(c);
const pick=(a,r=Math.random)=>a[Math.floor(r()*a.length)];
function loadCareer(){try{return Object.assign({bestScore:0,bestWord:'',games:0,wins:0,quickGames:0,dailyGames:0,words:{},cards:{},achievements:{},xp:0,bestPlay:0,bestCombo:1},JSON.parse(localStorage.getItem(CAREER_KEY)||'{}'));}catch{return{bestScore:0,bestWord:'',games:0,wins:0,quickGames:0,dailyGames:0,words:{},cards:{},achievements:{},xp:0,bestPlay:0,bestCombo:1};}}
function saveCareer(){localStorage.setItem(CAREER_KEY,JSON.stringify(career));}
function loadSettings(){try{return Object.assign({reduceMotion:false,sound:true,classroomMode:true},JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'));}catch{return{reduceMotion:false,sound:true,classroomMode:true};}}
function saveSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}
function seededValue(seed,index){let x=(Number(seed||1)+Math.imul((index|0)+1,0x6D2B79F5))>>>0;let t=x;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}
function daySeed(){const d=new Date();return Number(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`);}
function runRandom(){if(!state||state.mode!=='daily')return Math.random();if(!Number.isFinite(state.dailySeed))state.dailySeed=daySeed();if(!Number.isFinite(state.rngCounter))state.rngCounter=0;const value=seededValue(state.dailySeed,state.rngCounter);state.rngCounter+=1;return value;}
function weightedFrom(entries,r=Math.random){
  const total=entries.reduce((a,[,w])=>a+w,0);
  if(total<=0)return entries[0]?.[0]||'A';
  let n=r()*total;
  for(const[l,w]of entries){n-=w;if(n<=0)return l;}
  return entries.at(-1)?.[0]||'A';
}
function weighted(r=Math.random){return weightedFrom(LETTER_POOL,r);}
function tile(letter,r=Math.random){return{id:globalThis.crypto?.randomUUID?globalThis.crypto.randomUUID():`${Date.now()}_${Math.random()}`,letter:letter||weighted(r),kind:'normal',bonus:0,uses:0};}
function letterCounts(letters){
  const counts=new Map();
  for(const l of letters)counts.set(l,(counts.get(l)||0)+1);
  return counts;
}
function setupAllows(letter,setup=''){
  if(setup==='noCommon'&&(letter==='A'||letter==='E'))return false;
  return true;
}
function vowelBounds(setup=''){
  if(setup==='vowels')return[6,8];
  if(setup==='noCommon')return[4,7];
  return[BOARD_RULES.minVowels,BOARD_RULES.maxVowels];
}
function pickBalancedLetter(existing,r=Math.random,setup='',forceType=''){
  const letters=existing.map(x=>typeof x==='string'?x:x.letter);
  const counts=letterCounts(letters);
  const [minVowels,maxVowels]=vowelBounds(setup);
  const vowels=letters.filter(l=>VOWELS.has(l)).length;
  const remaining=Math.max(1,16-letters.length);
  let entries=LETTER_POOL.filter(([l])=>setupAllows(l,setup)&&(counts.get(l)||0)<(BOARD_RULES.maxCopies[l]||1));
  if(forceType==='vowel')entries=entries.filter(([l])=>VOWELS.has(l));
  if(forceType==='consonant')entries=entries.filter(([l])=>!VOWELS.has(l));
  if(!forceType){
    if(vowels>=maxVowels)entries=entries.filter(([l])=>!VOWELS.has(l));
    else if(vowels+remaining<=minVowels)entries=entries.filter(([l])=>VOWELS.has(l));
  }
  const needDistinct=Math.max(0,BOARD_RULES.minDistinct-counts.size);
  if(needDistinct>=remaining){
    const unseen=entries.filter(([l])=>!counts.has(l));
    if(unseen.length)entries=unseen;
  }
  if(!entries.length){
    entries=LETTER_POOL.filter(([l])=>setupAllows(l,setup)&&(forceType!=='vowel'||VOWELS.has(l))&&(forceType!=='consonant'||!VOWELS.has(l)));
  }
  const damped=entries.map(([l,w])=>[l,w/Math.pow(1+(counts.get(l)||0)*2.75,2)]);
  return weightedFrom(damped,r);
}
function rawBoard(r=Math.random,setup=''){
  const b=[];
  for(let i=0;i<16;i++)b.push(tile(pickBalancedLetter(b,r,setup),r));
  return b;
}
function wordFitsCounts(signature,counts){
  for(const [letter,needed] of signature)if((counts.get(letter)||0)<needed)return false;
  return true;
}
function qualityTarget(challengeId='none'){
  const kind=challenge(challengeId).kind||'normal';
  return BOARD_RULES.quality[kind]||BOARD_RULES.quality.normal;
}
function boardQuality(b,challengeId='none'){
  const counts=letterCounts(b.map(t=>t.letter));
  const target=qualityTarget(challengeId);
  const stats={total:0,len4:0,len5:0,len6:0,len7:0,score:0,meets:false};
  if(!wordIndex.length)return Object.assign(stats,{score:1,meets:true});
  for(const entry of wordIndex){
    if(challengeId!=='none'&&!challengeOK(challengeId,entry.word))continue;
    if(!wordFitsCounts(entry.signature,counts))continue;
    stats.total++;
    if(entry.length>=4)stats.len4++;
    if(entry.length>=5)stats.len5++;
    if(entry.length>=6)stats.len6++;
    if(entry.length>=7)stats.len7++;
  }
  stats.score=stats.total+stats.len4*1.5+stats.len5*3+stats.len6*6+stats.len7*10;
  stats.meets=stats.total>=target.total&&stats.len4>=target.len4&&stats.len5>=target.len5&&stats.len6>=target.len6;
  return stats;
}
function board(r=Math.random,setup='',challengeId='none'){
  if(wordIndex.length<500)return rawBoard(r,setup);
  let best=null,bestQ=null;
  for(let i=0;i<BOARD_RULES.candidateBoards;i++){
    const candidate=rawBoard(r,setup);
    const q=boardQuality(candidate,challengeId);
    if(!best||q.score>bestQ.score){best=candidate;bestQ=q;}
    if(q.meets)return candidate;
  }
  return best||rawBoard(r,setup);
}
function newState(mode='normal'){
  const daily=mode==='daily',quick=mode==='quick',dailySeedValue=daily?daySeed():null;
  let counter=0;
  const r=daily?()=>seededValue(dailySeedValue,counter++):Math.random;
  const cfg=modeConfig(mode);
  const challengeId=chooseChallenge(1,mode);
  const run={
    version:4,mode,round:1,roundScore:0,totalScore:0,
    target:quick?999999:roundTarget(1,challengeId,mode),
    playsLeft:cfg.startPlays,shufflesLeft:cfg.startRefreshes,rerollsLeft:1,
    board:board(r,'',challengeId),selected:[],modifiers:[],upgrades:[],reserveTiles:[],
    bonuses:{extraPlays:0,extraShuffles:0,roundSeed:0,nextRoundSeed:0,lengthMult:1,letterMult:1,careerXp:0,bossPlay:0,rareLuck:0},
    challenge:challengeId,specialRound:null,specialData:{},specialHistory:[],rescues:0,focusMutations:0,lastRescue:null,
    words:[],wordLog:[],usedWords:[],validStreak:0,maxStreak:0,invalidAttempts:0,
    longestWord:'',bestPlay:null,bestCombo:1,previousLength:0,roundWords:0,discoveredCards:[],
    goals:[
      {id:'long7',label:'Juega una palabra de 7+ letras',done:false},
      {id:'accent',label:'Usa correctamente una tilde',done:false},
      {id:'rare',label:'Utiliza una letra rara',done:false}
    ],
    completed:false,won:false,dailySeed:dailySeedValue,rngCounter:counter
  };
  run.specialRound=chooseSpecialRound(1,mode,r);
  if(run.specialRound)run.specialHistory.push(run.specialRound);
  run.specialData=makeSpecialData(run,r);
  return run;
}
function saveRun(){if(state&&!state.completed)localStorage.setItem(SAVE_KEY,JSON.stringify(state));}
function isBalancedBoard(b,setup=''){
  if(!Array.isArray(b)||b.length!==16)return false;
  const counts=letterCounts(b.map(t=>t.letter));
  const [minVowels,maxVowels]=vowelBounds(setup);
  const vowels=b.filter(t=>VOWELS.has(t.letter)).length;
  if(counts.size<BOARD_RULES.minDistinct||vowels<minVowels||vowels>maxVowels)return false;
  for(const [letter,count] of counts)if(!setupAllows(letter,setup)||count>(BOARD_RULES.maxCopies[letter]||1))return false;
  return true;
}
function repairLoadedBoard(run){
  if(!run||!Array.isArray(run.board))return run;
  const setup=challenge(run.challenge).setup||'';
  const balanced=isBalancedBoard(run.board,setup);
  const playable=wordIndex.length<500||boardPlayability(run.board,run).safe;
  if(balanced&&playable)return run;
  const previous=state;
  state=run;
  const upgrades=run.board.filter(t=>t&&t.kind&&t.kind!=='normal').map(t=>({kind:t.kind,bonus:t.bonus||0,uses:t.uses||0}));
  run.board=board(run.mode==='daily'?runRandom:Math.random,setup,run.challenge);
  upgrades.slice(0,run.board.length).forEach((u,i)=>Object.assign(run.board[i],u));
  ensureBoard();
  run.selected=[];
  state=previous;
  localStorage.setItem(SAVE_KEY,JSON.stringify(run));
  return run;
}
function loadRun(){try{
  const r=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
  if(!r||![3,4].includes(r.version)||r.completed)return null;
  r.version=4;
  if(r.mode==='daily'){if(!Number.isFinite(r.dailySeed))r.dailySeed=daySeed();if(!Number.isFinite(r.rngCounter))r.rngCounter=0;}
  if(typeof r.won!=='boolean')r.won=false;
  r.bonuses=Object.assign({extraPlays:0,extraShuffles:0,roundSeed:0,nextRoundSeed:0,lengthMult:1,letterMult:1,careerXp:0,bossPlay:0,rareLuck:0},r.bonuses||{});
  r.upgrades=Array.isArray(r.upgrades)?r.upgrades:[];
  r.reserveTiles=Array.isArray(r.reserveTiles)?r.reserveTiles:[];
  r.specialHistory=Array.isArray(r.specialHistory)?r.specialHistory:[];
  r.specialRound=r.specialRound||null;
  r.specialData=r.specialData||{};
  r.rescues=Number(r.rescues||0);r.focusMutations=Number(r.focusMutations||0);r.lastRescue=r.lastRescue||null;
  r.target=r.mode==='quick'?999999:roundTarget(r.round,r.challenge,r.mode);
  return repairLoadedBoard(r);
}catch{return null;}}
function clearRun(){localStorage.removeItem(SAVE_KEY);}
async function loadHunspell(){
  try{
    const TypoCtor=globalThis.Typo||window.Typo;
    if(typeof TypoCtor!=='function')throw new Error('typo-unavailable');
    const [affRes,dicRes]=await Promise.all([
      fetch(HUNSPELL_AFF,{cache:'force-cache'}),
      fetch(HUNSPELL_DIC,{cache:'force-cache'})
    ]);
    if(!affRes.ok||!dicRes.ok)throw new Error('hunspell-http');
    const [affData,dicData]=await Promise.all([affRes.text(),dicRes.text()]);
    hunspell=new TypoCtor('es_ES',affData,dicData,{});
    return !!hunspell?.loaded;
  }catch{
    hunspell=null;
    return false;
  }
}
async function loadDictionary(onStatus){
  dictionary=new Set((FALLBACK+' '+EXTRA_WORDS).split(/\s+/).map(normalize).filter(Boolean));
  rebuild();
  onStatus?.(`Diccionario esencial · ${dictionary.size.toLocaleString('es-ES')} palabras`);

  let sourceLabel='esencial';
  for(const url of DICTIONARY_URLS){
    try{
      const res=await fetch(url,{cache:'force-cache'});
      if(!res.ok)throw new Error('dictionary-http-'+res.status);
      const text=await res.text();
      for(const line of text.split(/\r?\n/)){
        const w=normalize(line.split(/\s+/)[0]);
        if(w&&/^[a-záéíóúüñ]+$/i.test(w)&&w.length>=2)dictionary.add(w);
      }
      for(const w of (LX.additions||[]))dictionary.add(normalize(w));
      rebuild();
      sourceLabel=url.startsWith('./')?'local':'ampliado';
      break;
    }catch{}
  }

  const morphReady=await loadHunspell();
  if(morphReady){
    onStatus?.(`Español completo · ${dictionary.size.toLocaleString('es-ES')} formas frecuentes + flexión y derivación`);
  }else{
    onStatus?.(`Diccionario ${sourceLabel} · ${dictionary.size.toLocaleString('es-ES')} palabras`);
  }
}
function rebuild(){
  accentMap=new Map();
  wordIndex=[];
  for(const w of dictionary){
    const k=strip(w);
    if(!accentMap.has(k))accentMap.set(k,[]);
    accentMap.get(k).push(w);
    if(w.length<3||w.length>10||STRICT.has(w)||BLOCKED.has(w)||(LX.rejectPatterns||[]).some(re=>re&&typeof re.test==='function'&&re.test(w)))continue;
    const letters=[...k.toUpperCase()];
    if(!letters.every(ch=>/^[A-ZÑ]$/.test(ch)))continue;
    const counts=letterCounts(letters);
    wordIndex.push({word:w,length:letters.length,signature:[...counts.entries()]});
  }
}
function validate(raw){
  const w=normalize(raw);
  if(w.length<4)return{ok:false,message:'Necesitas al menos 4 letras.'};
  if(BLOCKED.has(w)||(LX.rejectPatterns||[]).some(re=>re&&typeof re.test==='function'&&re.test(w)))return{ok:false,message:'Esa forma no está disponible en el modo escolar.'};
  const strict=STRICT.get(w);
  if(strict)return{ok:false,accent:true,message:`Casi: prueba con «${strict}».`};
  if(dictionary.has(w))return{ok:true,word:w,source:'frequency'};
  if(hunspell?.check?.(w))return{ok:true,word:w,source:'morphology'};

  const alt=(accentMap.get(strip(w))||[]).find(x=>/[áéíóúü]/.test(x));
  if(alt)return{ok:false,accent:true,message:`Casi: prueba con «${alt}».`};

  if(hunspell?.suggest){
    const suggestion=hunspell.suggest(w).find(x=>{
      const n=normalize(x);
      return strip(n)===strip(w)&&/[áéíóúü]/.test(n);
    });
    if(suggestion)return{ok:false,accent:true,message:`Casi: prueba con «${normalize(suggestion)}».`};
  }
  return{ok:false,message:`No encuentro «${w.toUpperCase()}» en el diccionario.`};
}
function challenge(id){return C.challenges.find(x=>x.id===id)||C.challenges[0];}
function challengeOK(id,w){const a=[...w],p=strip(w);switch(id){case'none':return true;case'min5':return a.length>=5;case'min6':return a.length>=6;case'vowel':return vowel(a[0]);case'consonant':return!vowel(a[0]);case'noA':return!p.includes('a');case'noE':return!p.includes('e');case'accent':return/[áéíóúü]/.test(w);case'ntilde':return w.includes('ñ');case'unique':return new Set(a).size===a.length;case'exact5':return a.length===5;case'exact6':return a.length===6;case'rare':return/[jñqxz]/i.test(w);case'endsS':return w.endsWith('s');case'twoVowels':return a.filter(vowel).length>=2;case'threeVowels':return a.filter(vowel).length>=3;case'longAccent':return a.length>=6&&/[áéíóúü]/.test(w);case'noCommon':return!/[aeáé]/.test(w);default:return true;}}
function modeConfig(mode=state?.mode||'normal'){
  if(mode==='daily')return C.modes.normal;
  return C.modes[mode]||C.modes.normal;
}
function totalRounds(mode=state?.mode||'normal'){return modeConfig(mode).rounds||12;}
function isSpecialRound(round,mode=state?.mode||'normal'){return modeConfig(mode).specialRounds.includes(Number(round));}
function specialRound(id){return C.specialRounds.find(x=>x.id===id)||null;}
function chooseSpecialRound(round,mode=state?.mode||'normal',r=Math.random){
  if(!isSpecialRound(round,mode))return null;
  const used=new Set(state?.specialHistory||[]);
  let pool=C.specialRounds.filter(x=>!used.has(x.id));
  if(!pool.length)pool=C.specialRounds.slice();
  return pick(pool,r)?.id||null;
}
function makeSpecialData(run,r=Math.random){
  const sr=specialRound(run.specialRound);
  const data={};
  if(!sr)return data;
  if(sr.effect==='firstLocked'){
    const common=new Set(['A','E','O','S','R','N','I','L','D','T','C','M','P','B','G','V','H','F','Y','U']);
    const candidates=run.board.filter(t=>common.has(t.letter));
    data.lockedLetter=(pick(candidates.length?candidates:run.board,r)?.letter||'R');
  }
  if(sr.effect==='topLocked')data.lockedIds=run.board.slice(0,4).map(t=>t.id);
  if(sr.effect==='highlighted')data.highlightedId=pick(run.board,r)?.id||null;
  return data;
}
function specialEffect(run=state){return specialRound(run?.specialRound)?.effect||'';}
function chooseChallenge(round,mode){
  if(mode==='quick'||isSpecialRound(round,mode))return'none';
  const constraints=C.challenges.filter(x=>x.kind==='constraint');
  if(round>=4&&round%3===0){
    const i=mode==='daily'?(daySeed()+round*5)%constraints.length:Math.floor(Math.random()*constraints.length);
    return constraints[i]?.id||'none';
  }
  return'none';
}
function roundTarget(round,challengeId,mode=state?.mode||'normal'){
  const cfg=modeConfig(mode);
  const base=cfg.targets[Math.max(0,Math.min(cfg.targets.length-1,Number(round||1)-1))]||cfg.targets.at(-1)||50;
  const mult=Number(challenge(challengeId).targetMult||1);
  return Math.max(20,Math.round(base*mult/5)*5);
}
function cond(id,ctx){const a=[...ctx.word],p=strip(ctx.word),v=a.filter(vowel).length,c=a.length-v,u=new Set(a).size,r=a.filter(x=>RARE.has(strip(x).toUpperCase())).length,special=(ctx.tiles||[]).filter(t=>t&&t.kind&&t.kind!=='normal'),vowels=a.filter(vowel).map(x=>strip(x));switch(id){case'always':return true;case'startsVowel':return vowel(a[0]);case'startsConsonant':return!vowel(a[0]);case'endsVowel':return vowel(a.at(-1));case'endsConsonant':return!vowel(a.at(-1));case'len3':return a.length===3;case'len5':return a.length===5;case'len6':return a.length===6;case'len7':return a.length===7;case'len8':return a.length===8;case'min7':return a.length>=7;case'accent':return/[áéíóúü]/.test(ctx.word);case'ntilde':return ctx.word.includes('ñ');case'noA':return!p.includes('a');case'noE':return!p.includes('e');case'noO':return!p.includes('o');case'rareLetter':return r>0;case'containsJ':return p.includes('j');case'containsZ':return p.includes('z');case'containsX':return p.includes('x');case'containsQ':return p.includes('q');case'doubleVowel':return/[aeiouáéíóúü]{2}/i.test(ctx.word);case'tripleConsonant':return/[^aeiouáéíóúü]{3}/i.test(ctx.word);case'longerThanPrev':return ctx.prev>0&&a.length>ctx.prev;case'shorterThanPrev':return ctx.prev>0&&a.length<ctx.prev;case'streak3':return ctx.streak>=3;case'streak5':return ctx.streak>=5;case'firstPlay':return ctx.roundWords===0;case'lastPlay':return ctx.playsLeft===1;case'evenLength':return a.length%2===0;case'oddLength':return a.length%2===1;case'twoA':return(p.match(/a/g)||[]).length>=2;case'twoE':return(p.match(/e/g)||[]).length>=2;case'threeVowels':return v>=3;case'fiveConsonants':return c>=5;case'allUnique':return u===a.length;case'palindrome':return a.length>=3&&ctx.word===[...ctx.word].reverse().join('');case'startsM':return p.startsWith('m');case'startsP':return p.startsWith('p');case'endsS':return p.endsWith('s');case'endsN':return p.endsWith('n');case'vowelEdges':return vowel(a[0])&&vowel(a.at(-1));case'sameEdges':return a.length>2&&a[0]===a.at(-1);case'sixUnique':return u>=6;case'max4':return a.length<=4;case'min10':return a.length>=10;case'perfectWord':return a.length>=8&&u===a.length;case'accentLong':return a.length>=7&&/[áéíóúü]/.test(ctx.word);case'twoRare':return r>=2;case'specialTile':return special.length>=1;case'twoSpecialTiles':return special.length>=2;case'bossRound':return ctx.challengeKind==='boss';case'accentAndRare':return/[áéíóúü]/.test(ctx.word)&&r>=1;case'fourVowels':return v>=4;case'crownTile':return special.some(t=>t.kind==='crown');case'min9':return a.length>=9;case'threeRare':return r>=3;case'uniqueVowels':return vowels.length>0&&new Set(vowels).size===vowels.length;default:return false;}}
function slotBonusAt(index){return Number(C.wordLengthSlots[index]||0);}
function lengthBonus(n){
  let total=0;
  for(let i=0;i<n;i++)total+=slotBonusAt(i);
  return Math.round(total*(state?.bonuses.lengthMult||1));
}
function tileScore(t){
  if(!t)return 0;
  if(['wild','mirror','bang','plus'].includes(t.kind))return 0;
  let v=(LETTER_VALUES[t.letter]||1)+(t.bonus||0)+(t.kind==='diamond'?(t.charge||0):0);
  if(t.kind==='crown')v+=25;
  return Math.round(v*(state?.bonuses.letterMult||1));
}
function score(word,tiles,preview=false){
  const sr=specialEffect();
  const specialsOff=sr==='specialsOff';
  let rawWordScore=0;
  let goldCount=0;
  let emeraldHits=0;
  const effects=[];
  const selectedIds=new Set(tiles.map(t=>t.id));
  tiles.forEach((t,i)=>{
    let value=tileScore(t);
    if(!specialsOff&&t?.kind==='mirror'&&i>0){value=tileScore(tiles[i-1]);effects.push('Espejo · copia la ficha izquierda');}
    if(!specialsOff&&t?.kind==='bang'){
      value=(state?.board||[]).filter(q=>!selectedIds.has(q.id)).reduce((sum,q)=>sum+tileScore(q),0);
      effects.push(`Exclamación +${value}`);
    }
    if(sr==='vowelsZero'&&vowel(word[i]||''))value=0;
    if(!specialsOff&&t?.kind==='emerald'){
      const hit=preview?false:boardRng()<.25;
      if(hit){value*=5;emeraldHits++;effects.push(`Esmeralda ×5`);}
      else if(preview)effects.push('Esmeralda · 25% ×5');
    }
    rawWordScore+=value;
    if(!specialsOff&&t?.kind==='gold')goldCount++;
  });
  let wordMultiplier=1;
  if(!specialsOff&&goldCount>=2){wordMultiplier*=goldCount;effects.push(`${goldCount} doradas · Word Score ×${goldCount}`);}
  const lastTile=tiles.at(-1);
  if(!specialsOff&&lastTile?.kind==='dot'){wordMultiplier*=2;effects.push('Punto final · Word Score ×2');}
  let wordScore=Math.round(rawWordScore*wordMultiplier);

  let bonusPoints=lengthBonus(tiles.length);
  if(bonusPoints)effects.push(`Longitud +${bonusPoints}`);
  let finalMultiplier=1;
  const ctx={word,tiles,prev:state.previousLength,streak:state.validStreak+(preview?1:0),roundWords:state.roundWords,playsLeft:state.playsLeft,challengeId:state.challenge,challengeKind:challenge(state.challenge).kind};
  for(const id of state.modifiers){
    const m=C.modifiers.find(x=>x.id===id);if(!m||!cond(m.condition,ctx))continue;
    if(m.effect==='flat')bonusPoints+=m.value;
    else if(m.effect==='mult')finalMultiplier*=m.value;
    else if(m.effect==='uniqueFlat')bonusPoints+=new Set([...word]).size*m.value;
    else if(m.effect==='repeatFlat')bonusPoints+=([...word].length-new Set([...word]).size)*m.value;
    else if(m.effect==='rareFlat')bonusPoints+=[...word].filter(x=>RARE.has(strip(x).toUpperCase())).length*m.value;
    else if(m.effect==='specialFlat')bonusPoints+=tiles.filter(t=>t&&t.kind&&t.kind!=='normal').length*m.value;
    effects.push(m.effect==='mult'?`${m.name} ×${m.value}`:`${m.name} +bonus`);
  }
  if(!specialsOff&&tiles.some(t=>t.kind==='volatile')){finalMultiplier*=1.35;effects.push('Explosiva · Final ×1,35');}
  let total=Math.round((wordScore+bonusPoints)*finalMultiplier);
  if(sr==='minSixZero'&&tiles.length<6){total=0;effects.push('Ronda especial · menos de 6 fichas = 0');}
  return{subtotal:wordScore+bonusPoints,multiplier:finalMultiplier,total,wordScore,bonusPoints,wordMultiplier,finalMultiplier,effects,emeraldHits,lengthBonus:lengthBonus(tiles.length)};
}
function reserveTemplateFromTile(t){
  return{kind:t.kind||'normal',letter:t.letter||null,bonus:t.bonus||0,charge:t.charge||0};
}
function addReserveTile(kind,count=1,letter=null,bonus=0){
  for(let i=0;i<count;i++)state.reserveTiles.push({kind,letter,bonus,charge:0});
}
function applyGift(r){
  switch(r.effect){
    case'extraPlay':state.bonuses.extraPlays+=r.value;break;
    case'extraShuffle':state.bonuses.extraShuffles+=r.value;break;
    case'reroll':state.rerollsLeft+=r.value;break;
    case'lengthMult':state.bonuses.lengthMult+=r.value;break;
    case'letterMult':state.bonuses.letterMult+=r.value;break;
    case'roundSeed':state.bonuses.roundSeed+=r.value;break;
    case'instantShuffle':state.shufflesLeft+=r.value;break;
    case'instantPlay':state.playsLeft+=r.value;break;
    case'nextRoundSeed':state.bonuses.nextRoundSeed+=r.value;break;
    case'careerXp':state.bonuses.careerXp+=r.value;break;
    case'bossPlay':state.bonuses.bossPlay+=r.value;break;
    case'rareLuck':state.bonuses.rareLuck+=r.value;break;
  }
}
function rewardWeight(rarity,luck=0){
  const normal={common:45,uncommon:35,rare:15,epic:4,legendary:1};
  const lucky={common:25,uncommon:25,rare:35,epic:12,legendary:3};
  const a=normal[rarity]||1,b=lucky[rarity]||1,t=Math.min(1,luck*.5);
  return a+(b-a)*t;
}
function rewards(){
  const luck=Math.max(0,Number(state.bonuses.rareLuck||0));
  const canMod=state.modifiers.length<6;
  const canUpgrade=state.upgrades.length<3;
  const all=[
    ...(canMod?C.modifiers.filter(x=>!state.modifiers.includes(x.id)):[]),
    ...(canUpgrade?C.upgrades:[]),
    ...C.gifts
  ];
  const bag=[];
  for(const x of all){
    const weight=Math.max(1,Math.round(rewardWeight(x.rarity,luck)));
    for(let i=0;i<weight;i++)bag.push(x);
  }
  const out=[];
  while(out.length<3&&bag.length){
    const x=pick(bag,state.mode==='daily'?runRandom:Math.random);
    if(x&&!out.some(y=>y.id===x.id))out.push(x);
  }
  return out;
}
function chooseReward(r){
  if(!r)return false;
  state.discoveredCards.push(r.id);
  career.cards[r.id]=(career.cards[r.id]||0)+1;
  if(r.type==='modifier'){
    if(state.modifiers.length>=6)return false;
    state.modifiers.push(r.id);
  }else if(r.type==='upgrade'){
    if(state.upgrades.length>=3)return false;
    state.upgrades.push({id:r.id,uses:r.uses});
  }else if(r.type==='bagTile'){
    addReserveTile(r.effect,r.count||1,null,0);
  }else if(r.type==='tile'){
    const pool=state.board.filter(x=>x.kind==='normal').length?state.board.filter(x=>x.kind==='normal'):state.board;
    const t=pick(pool,state.mode==='daily'?runRandom:Math.random);
    if(t)t.kind=r.effect;
  }else applyGift(r);
  saveCareer();saveRun();return true;
}
function sellModifier(id){
  const i=state.modifiers.indexOf(id);if(i<0)return false;
  const m=C.modifiers.find(x=>x.id===id);if(!m)return false;
  const value={common:1,uncommon:2,rare:3,epic:3,legendary:4}[m.rarity]||1;
  state.modifiers.splice(i,1);state.shufflesLeft+=value;saveRun();return value;
}
function skipReward(){state.shufflesLeft+=2;saveRun();return 2;}
function useUpgrade(id,tileId){
  const owned=state.upgrades.find(x=>x.id===id&&x.uses>0);if(!owned)return{ok:false,message:'Mejora agotada.'};
  const def=C.upgrades.find(x=>x.id===id);const t=state.board.find(x=>x.id===tileId);
  if(!def||!t)return{ok:false,message:'Selecciona una ficha válida.'};
  const rng=boardRng;
  switch(def.effect){
    case'holdRefresh':{
      const held={...t};
      for(const q of state.board)if(q.id!==t.id)returnTileToReserve(q);
      state.board=board(rng,currentSetup(),state.challenge);
      state.board[0]=held;ensureBoard();break;
    }
    case'swapVowel':Object.assign(t,retile(t,pick(['A','E','I','O','U'],rng)));break;
    case'swapConsonant':Object.assign(t,retile(t,pick(['D','L','N','R','S','T'],rng)));break;
    case'makeGold':t.kind='gold';break;
    case'makeEmerald':t.kind='emerald';break;
    case'makeDot':t.kind='dot';break;
    case'makeDiamond':t.kind='diamond';t.charge=0;break;
    case'makeWild':t.kind='wild';break;
    case'duplicate':state.reserveTiles.push(reserveTemplateFromTile(t));break;
    case'glass':state.reserveTiles.push({...reserveTemplateFromTile(t),kind:'glass'});break;
    case'destroyPlay':{const idx=state.board.findIndex(x=>x.id===t.id);state.board[idx]=freshReplacement(t);state.playsLeft++;break;}
    case'addScore':t.bonus=(t.bonus||0)+(def.value||0);break;
    case'randomScore':t.bonus=(t.bonus||0)+1+Math.floor(rng()*10);break;
    case'randomSpecial':t.kind=pick(['gold','diamond','emerald','dot','mirror','ink','volatile'],rng);if(t.kind==='diamond')t.charge=0;break;
    default:return{ok:false,message:'Esta mejora todavía no puede aplicarse.'};
  }
  owned.uses--;
  if(owned.uses<=0)state.upgrades=state.upgrades.filter(x=>x!==owned);
  const rescue=stabilizeBoard('mejora');saveRun();return{ok:true,message:`${def.name} aplicada.`,rescue};
}
function nextRound(){
  state.round++;
  if(state.round>totalRounds(state.mode))return false;
  const cfg=modeConfig(state.mode);
  state.challenge=chooseChallenge(state.round,state.mode);
  state.specialRound=chooseSpecialRound(state.round,state.mode,state.mode==='daily'?runRandom:Math.random);
  if(state.specialRound)state.specialHistory.push(state.specialRound);
  state.specialData=makeSpecialData(state,state.mode==='daily'?runRandom:Math.random);
  const seed=state.bonuses.roundSeed+state.bonuses.nextRoundSeed;
  state.roundScore=seed;
  state.totalScore+=seed;
  state.bonuses.nextRoundSeed=0;
  state.target=roundTarget(state.round,state.challenge,state.mode);
  state.playsLeft+=cfg.roundGain+state.bonuses.extraPlays;
  state.shufflesLeft+=state.bonuses.extraShuffles;
  state.roundWords=0;
  state.selected=[];
  stabilizeBoard('nueva ronda');
  saveRun();
  return true;
}
function boardRng(){return state.mode==='daily'?runRandom:Math.random}
function currentSetup(){return challenge(state.challenge).setup||''}
function retile(old,letter=null,context=null,forceType=''){
  const setup=currentSetup();
  const source=(context||state.board).filter(t=>t.id!==old.id);
  const chosen=letter||pickBalancedLetter(source,boardRng,setup,forceType);
  const n=tile(chosen,boardRng);
  Object.assign(n,{kind:old.kind,bonus:old.bonus,uses:old.uses});
  return n;
}
function duplicateIndex(preferVowel=null){
  const counts=letterCounts(state.board.map(t=>t.letter));
  let candidates=state.board.map((t,i)=>({t,i,count:counts.get(t.letter)||0}))
    .filter(x=>x.count>1&&(preferVowel===null||VOWELS.has(x.t.letter)===preferVowel))
    .sort((a,b)=>b.count-a.count);
  if(!candidates.length)candidates=state.board.map((t,i)=>({t,i,count:counts.get(t.letter)||0}))
    .filter(x=>preferVowel===null||VOWELS.has(x.t.letter)===preferVowel);
  return candidates[0]?.i??0;
}
function rebalanceBoard(){
  const setup=currentSetup();
  for(let guard=0;guard<48;guard++){
    const counts=letterCounts(state.board.map(t=>t.letter));
    const [minVowels,maxVowels]=vowelBounds(setup);
    const vowels=state.board.filter(t=>VOWELS.has(t.letter)).length;
    const disallowed=state.board.findIndex(t=>!setupAllows(t.letter,setup));
    if(disallowed>=0){state.board[disallowed]=retile(state.board[disallowed]);continue;}
    const excess=[...counts.entries()].find(([l,n])=>n>(BOARD_RULES.maxCopies[l]||1));
    if(excess){
      const idx=state.board.findLastIndex(t=>t.letter===excess[0]);
      state.board[idx]=retile(state.board[idx]);
      continue;
    }
    if(vowels<minVowels){
      const idx=duplicateIndex(false);
      state.board[idx]=retile(state.board[idx],null,null,'vowel');
      continue;
    }
    if(vowels>maxVowels){
      const idx=duplicateIndex(true);
      state.board[idx]=retile(state.board[idx],null,null,'consonant');
      continue;
    }
    if(counts.size<BOARD_RULES.minDistinct){
      const idx=duplicateIndex(null);
      const old=state.board[idx];
      const candidates=LETTER_POOL.filter(([l])=>setupAllows(l,setup)&&!counts.has(l)&&(counts.get(l)||0)<(BOARD_RULES.maxCopies[l]||1));
      if(candidates.length){
        state.board[idx]=retile(old,weightedFrom(candidates,boardRng));
        continue;
      }
    }
    break;
  }
}
function improvePlayability(indices=[]){
  if(wordIndex.length<500||!state?.board?.length)return;
  const initial=boardQuality(state.board,state.challenge);
  if(initial.meets)return;
  const mutable=[...new Set(indices)].filter(i=>i>=0&&i<state.board.length);
  while(mutable.length<3){
    const extra=state.board.findIndex((t,i)=>!mutable.includes(i)&&t.kind==='normal');
    if(extra<0)break;
    mutable.push(extra);
  }
  if(!mutable.length)return;
  let best=state.board.map(t=>({...t})),bestQ=initial;
  for(let attempt=0;attempt<BOARD_RULES.replacementAttempts;attempt++){
    for(const idx of mutable){
      const old=state.board[idx];
      state.board[idx]=retile(old);
    }
    rebalanceBoard();
    const q=boardQuality(state.board,state.challenge);
    if(q.score>bestQ.score){best=state.board.map(t=>({...t}));bestQ=q;}
    if(q.meets)break;
  }
  state.board=best;
}
function specialWordAllowed(word,run=state){
  const sr=specialRound(run?.specialRound),effect=sr?.effect||'';
  const len=[...word].length;
  if(effect==='maxTiles'&&len>4+Number(run?.roundWords||0))return false;
  if(effect==='firstLocked'){
    const locked=String(run?.specialData?.lockedLetter||'').toLowerCase();
    if(locked&&!strip(word).startsWith(strip(locked)))return false;
  }
  if(effect==='minSixZero'&&len<6)return false;
  return true;
}
function playabilityTiles(b,run=state){
  const effect=specialRound(run?.specialRound)?.effect||'';
  const locked=new Set(effect==='topLocked'&&Number(run?.roundWords||0)<4?(run?.specialData?.lockedIds||[]):[]);
  return b.filter(t=>!locked.has(t.id)&&!['wild','mirror','bang','plus'].includes(t.kind));
}
function boardPlayability(b=state?.board||[],run=state){
  const usable=playabilityTiles(b,run),counts=letterCounts(usable.map(t=>t.letter));
  const stats={total:0,len4:0,len5:0,len6:0,longest:0,safe:false,threshold:1};
  if(wordIndex.length<500)return Object.assign(stats,{safe:true,total:99,len4:99,len5:99,len6:99,longest:9});
  for(const entry of wordIndex){
    if(entry.length<4)continue;
    if(run?.challenge&&run.challenge!=='none'&&!challengeOK(run.challenge,entry.word))continue;
    if(!specialWordAllowed(entry.word,run))continue;
    if(!wordFitsCounts(entry.signature,counts))continue;
    stats.total++;stats.longest=Math.max(stats.longest,entry.length);
    if(entry.length>=4)stats.len4++;if(entry.length>=5)stats.len5++;if(entry.length>=6)stats.len6++;
  }
  const restrictive=!!run?.specialRound||challenge(run?.challenge).kind==='constraint';
  stats.threshold=restrictive?1:4;
  stats.safe=stats.total>=stats.threshold;
  return stats;
}
function cloneTraits(from,to){
  if(!from||!to)return to;
  to.kind=from.kind||'normal';to.bonus=Number(from.bonus||0);to.uses=Number(from.uses||0);to.charge=Number(from.charge||0);
  return to;
}
function remapSpecialIds(oldBoard,newBoard,run=state){
  if(!run?.specialData)return;
  if(Array.isArray(run.specialData.lockedIds)){
    const oldSet=new Set(run.specialData.lockedIds);
    run.specialData.lockedIds=oldBoard.map((t,i)=>oldSet.has(t.id)?newBoard[i]?.id:null).filter(Boolean);
  }
  if(run.specialData.highlightedId){
    const i=oldBoard.findIndex(t=>t.id===run.specialData.highlightedId);
    run.specialData.highlightedId=newBoard[i]?.id||newBoard[0]?.id||null;
  }
}
function rescueBoard(reason='atasco',force=false){
  if(!state?.board?.length||wordIndex.length<500)return{rescued:false,before:boardPlayability(state?.board||[],state)};
  const before=boardPlayability(state.board,state);
  if(!force&&before.safe)return{rescued:false,before,after:before};
  const oldBoard=state.board.map(t=>({...t}));
  let best=null,bestStats=null;
  const rng=boardRng;
  for(let attempt=0;attempt<18;attempt++){
    const candidate=board(rng,currentSetup(),state.challenge);
    candidate.forEach((t,i)=>cloneTraits(oldBoard[i],t));
    const tempRun={...state,board:candidate,specialData:{...(state.specialData||{})}};
    if(Array.isArray(state.specialData?.lockedIds)){
      const oldSet=new Set(state.specialData.lockedIds);
      tempRun.specialData.lockedIds=oldBoard.map((t,i)=>oldSet.has(t.id)?candidate[i]?.id:null).filter(Boolean);
    }
    if(state.specialData?.highlightedId){
      const hi=oldBoard.findIndex(t=>t.id===state.specialData.highlightedId);
      tempRun.specialData.highlightedId=candidate[hi]?.id||candidate[0]?.id||null;
    }
    if(specialRound(tempRun.specialRound)?.effect==='firstLocked'){
      const locked=tempRun.specialData?.lockedLetter;
      if(locked&&!candidate.some(t=>t.letter===locked)){
        const replaceable=candidate.find(t=>t.kind==='normal')||candidate[0];
        if(replaceable)replaceable.letter=locked;
      }
    }
    const stats=boardPlayability(candidate,tempRun);
    if(!best||stats.total>bestStats.total||(stats.total===bestStats.total&&stats.longest>bestStats.longest)){best=candidate;bestStats=stats;}
    if(stats.safe&&stats.total>=Math.max(stats.threshold,6)){best=candidate;bestStats=stats;break;}
  }
  if(!best)return{rescued:false,before,after:before};
  state.board=best;state.selected=[];
  remapSpecialIds(oldBoard,best,state);
  rebalanceBoard();
  const after=boardPlayability(state.board,state);
  state.rescues=Number(state.rescues||0)+1;
  state.lastRescue={reason,at:Date.now(),before:before.total,after:after.total};
  saveRun();
  return{rescued:true,before,after};
}
function stabilizeBoard(reason='auto'){
  ensureBoard();
  const stats=boardPlayability(state.board,state);
  if(!stats.safe)return rescueBoard(reason,true);
  return{rescued:false,before:stats,after:stats};
}
function ensureBoard(){
  const ch=challenge(state.challenge),setup=ch.setup||'';
  rebalanceBoard();
  if(setup==='ntilde'&&!state.board.some(t=>t.letter==='Ñ')){
    const i=duplicateIndex(null);
    state.board[i]=retile(state.board[i],'Ñ');
  }
  if(setup==='rare'&&!state.board.some(t=>RARE.has(t.letter))){
    const rarePool=LETTER_POOL.filter(([l])=>['J','Ñ','Q','X','Z'].includes(l));
    const i=duplicateIndex(null);
    state.board[i]=retile(state.board[i],weightedFrom(rarePool,boardRng));
  }
  rebalanceBoard();
}
function returnTileToReserve(t){
  if(!t)return;
  if(['glass','potion'].includes(t.kind))return;
  if(t.kind!=='normal'||(t.bonus||0)>0||(t.charge||0)>0)state.reserveTiles.push(reserveTemplateFromTile(t));
}
function freshReplacement(old=null){
  const chance=Math.min(.58,(state.reserveTiles.length||0)/Math.max(6,(state.reserveTiles.length||0)+4));
  if(state.reserveTiles.length&&boardRng()<chance){
    const i=Math.floor(boardRng()*state.reserveTiles.length);
    const tpl=state.reserveTiles.splice(i,1)[0];
    const letter=tpl.letter&&/^[A-ZÑ]$/.test(tpl.letter)?tpl.letter:pickBalancedLetter(state.board,boardRng,currentSetup());
    const n=tile(letter,boardRng);Object.assign(n,tpl,{letter});return n;
  }
  const source=old||{id:'none',kind:'normal',bonus:0,uses:0};
  const chosen=pickBalancedLetter(state.board.filter(t=>t.id!==source.id),boardRng,currentSetup());
  return tile(chosen,boardRng);
}
function injectReserveTiles(max=2){
  let inserted=0;
  while(state.reserveTiles.length&&inserted<max){
    if(inserted>0&&boardRng()>.55)break;
    const idxs=state.board.map((t,i)=>({t,i})).filter(x=>x.t.kind==='normal');
    if(!idxs.length)break;
    const slot=pick(idxs,boardRng);const tpl=state.reserveTiles.splice(Math.floor(boardRng()*state.reserveTiles.length),1)[0];
    const letter=tpl.letter&&/^[A-ZÑ]$/.test(tpl.letter)?tpl.letter:slot.t.letter;
    const n=tile(letter,boardRng);Object.assign(n,tpl,{letter});state.board[slot.i]=n;inserted++;
  }
}
function replace(ids){
  const changed=[];
  for(const id of ids){
    const idx=state.board.findIndex(t=>t.id===id);if(idx<0)continue;
    changed.push(idx);
    const old=state.board[idx];
    returnTileToReserve(old);
    state.board[idx]=freshReplacement(old);
  }
  ensureBoard();injectReserveTiles(Math.min(2,changed.length));improvePlayability(changed);ensureBoard();
  return stabilizeBoard('reposición');
}
function specialValidation(word,tiles){
  const effect=specialEffect();
  const bangIndex=tiles.findIndex(t=>t.kind==='bang');
  if(bangIndex>=0&&bangIndex!==tiles.length-1)return{ok:false,message:'La ficha Exclamación debe ser la última de la jugada.'};
  const plusCount=tiles.filter(t=>t.kind==='plus').length;
  if(plusCount>1)return{ok:false,message:'Solo puedes usar un Conector por jugada.'};
  if(plusCount===1){
    const i=tiles.findIndex(t=>t.kind==='plus');
    if(i<4||tiles.length-i-1<4)return{ok:false,message:'El Conector necesita una palabra de 4+ letras a cada lado.'};
  }
  if(effect==='maxTiles'){
    const max=4+state.roundWords;
    if(tiles.length>max)return{ok:false,message:`Ronda especial: máximo ${max} fichas ahora mismo.`};
  }
  if(effect==='firstLocked'){
    const letter=(state.specialData.lockedLetter||'').toLowerCase();
    if(letter&&!word.startsWith(letter))return{ok:false,message:`Ronda especial: la palabra debe empezar por ${letter.toUpperCase()}.`};
  }
  if(effect==='topLocked'&&state.roundWords<4){
    const locked=new Set(state.specialData.lockedIds||[]);
    if(tiles.some(t=>locked.has(t.id)))return{ok:false,message:'Ronda especial: la fila superior sigue bloqueada.'};
  }
  return{ok:true};
}
function play(word,tiles){
  const raw=String(word||'').toLowerCase();
  const lexical=raw.replace(/!/g,'');
  const parts=lexical.split('+');
  if(parts.some(p=>!p))return{ok:false,message:'El Conector debe unir dos palabras completas.'};
  const validated=[];
  for(const part of parts){const val=validate(part);if(!val.ok){state.invalidAttempts++;state.validStreak=0;saveRun();return val;}if(state.usedWords.includes(val.word))return{ok:false,message:'Ya has utilizado «'+val.word.toUpperCase()+'».'};validated.push(val.word);}
  if(validated.some(w=>!challengeOK(state.challenge,w)))return{ok:false,message:'Alguna palabra no cumple el reto: '+challenge(state.challenge).desc};
  const displayWord=validated.join('+')+(raw.endsWith('!')?'!':'');
  const sv=specialValidation(displayWord,tiles);if(!sv.ok)return sv;
  state.validStreak++;state.maxStreak=Math.max(state.maxStreak,state.validStreak);
  const sc=score(displayWord,tiles,false);const effect=specialEffect();const selectedIds=new Set(tiles.map(t=>t.id));
  for(const t of tiles){t.uses++;if(t.kind==='ink')t.bonus=(t.bonus||0)+1;}
  if(effect!=='specialsOff'){for(const t of state.board)if(t.kind==='diamond'&&!selectedIds.has(t.id))t.charge=(t.charge||0)+5;}
  let playCost=effect==='doublePlay'?2:1,penalty=0;
  if(effect==='highlighted'&&state.specialData.highlightedId&&!selectedIds.has(state.specialData.highlightedId))penalty=2;
  state.playsLeft-=playCost+penalty;
  for(const t of tiles)if(effect!=='specialsOff'&&t.kind==='potion')state.playsLeft+=Math.max(1,tileScore(t));
  state.roundScore+=sc.total;state.totalScore+=sc.total;state.previousLength=tiles.length;
  for(const valid of validated){state.words.push(valid);state.usedWords.push(valid);career.words[valid]=(career.words[valid]||0)+1;if(valid.length>(state.longestWord||'').length)state.longestWord=valid;if(valid.length>(career.bestWord||'').length)career.bestWord=valid;}
  state.roundWords++;state.wordLog.push({word:displayWord,score:sc.total,wordScore:sc.wordScore,bonusPoints:sc.bonusPoints,effects:sc.effects});
  if(!state.bestPlay||sc.total>state.bestPlay.score)state.bestPlay={word:displayWord,score:sc.total};state.bestCombo=Math.max(state.bestCombo,sc.multiplier);
  if(validated.some(w=>w.length>=7))state.goals[0].done=true;if(validated.some(w=>/[áéíóúü]/.test(w)))state.goals[1].done=true;if(tiles.some(t=>RARE.has(t.letter)))state.goals[2].done=true;
  const rescue=replace(tiles.map(t=>t.id));if(effect==='autoRefresh')refreshBoard(false,true);saveCareer();saveRun();return{ok:true,word:displayWord,words:validated,score:sc,playCost,penalty,rescue};
}
function refreshBoard(manual=true,free=false){
  const effect=specialEffect();
  if(manual&&!free){
    if(effect==='autoRefresh'){
      if(state.playsLeft<=0)return false;
      state.playsLeft--;
    }else{
      if(state.shufflesLeft<=0)return false;
      state.shufflesLeft--;
    }
  }
  for(const t of state.board)returnTileToReserve(t);
  state.board=board(state.mode==='daily'?runRandom:Math.random,currentSetup(),state.challenge);
  injectReserveTiles(3);ensureBoard();state.selected=[];stabilizeBoard('renovación');saveRun();return true;
}
function shuffle(){return refreshBoard(true,false);}

function classroomScramble(count=6){
  if(!state?.board?.length||state.mode==='daily')return{changed:0,rescue:null};
  const rng=boardRng;
  const locked=new Set(specialEffect()==='topLocked'&&state.roundWords<4?(state.specialData.lockedIds||[]):[]);
  let pool=state.board.map((t,i)=>({t,i})).filter(x=>!locked.has(x.t.id)&&x.t.kind==='normal');
  if(pool.length<count)pool=state.board.map((t,i)=>({t,i})).filter(x=>!locked.has(x.t.id));
  const chosen=[];
  while(pool.length&&chosen.length<Math.min(count,pool.length)){
    const i=Math.floor(rng()*pool.length);chosen.push(pool.splice(i,1)[0]);
  }
  for(const {t,i} of chosen)state.board[i]=retile(t);
  state.selected=[];state.focusMutations=Number(state.focusMutations||0)+1;
  const rescue=stabilizeBoard('tinta viva');saveRun();
  return{changed:chosen.length,rescue};
}
function metric(a){switch(a.metric){case'careerWords':return Object.values(career.words).reduce((s,n)=>s+n,0);case'bestPlay':return Math.max(career.bestPlay,state?.bestPlay?.score||0);case'runScore':return state?.totalScore||0;case'longest':return Math.max((career.bestWord||'').length,(state?.longestWord||'').length);case'ntilde':return state?.words.some(w=>w.includes('ñ'))?1:0;case'accent':return state?.words.some(w=>/[áéíóúü]/.test(w))?1:0;case'streak':return state?.maxStreak||0;case'rare':return state?.words.some(w=>/[jñqxzkw]/i.test(w))?1:0;case'wins':return career.wins;case'uniqueWords':return Object.keys(career.words).length;case'cards':return Object.keys(career.cards).length;case'combo':return Math.max(career.bestCombo,state?.bestCombo||1);case'quick':return career.quickGames;case'daily':return career.dailyGames;case'perfect':return state?.completed&&state?.won&&state.invalidAttempts===0?1:0;case'round':return state?.round||0;default:return 0;}}
function achievements(){const got=[];for(const a of C.achievements)if(!career.achievements[a.id]&&metric(a)>=a.value){career.achievements[a.id]=Date.now();career.xp+=25;got.push(a);}if(got.length)saveCareer();return got;}
function finish(won){state.won=!!won;state.completed=true;clearRun();career.games++;if(won&&state.mode!=='quick')career.wins++;if(state.mode==='quick')career.quickGames++;if(state.mode==='daily')career.dailyGames++;career.bestScore=Math.max(career.bestScore,state.totalScore);career.bestPlay=Math.max(career.bestPlay,state.bestPlay?.score||0);career.bestCombo=Math.max(career.bestCombo,state.bestCombo);let xp=Math.round(state.words.length*4+state.round*10+(won?80:0)+state.bonuses.careerXp);if(state.mode==='quick')xp=Math.round(xp*.7);career.xp+=xp;const got=achievements();saveCareer();return{xp,got};}
window.WordPlayEngine={C,LETTER_VALUES,VOWELS,ACCENTABLE,BOARD_RULES,boardQuality,boardPlayability,rescueBoard,stabilizeBoard,isBalancedBoard,repairLoadedBoard,get morphologyReady(){return !!hunspell?.loaded},get state(){return state},set state(v){state=v},get career(){return career},settings,saveSettings,saveRun,loadRun,clearRun,newState,loadDictionary,validate,challenge,chooseChallenge,modeConfig,totalRounds,isSpecialRound,specialRound,specialEffect,roundTarget,slotBonusAt,tileScore,score,rewards,chooseReward,sellModifier,skipReward,useUpgrade,nextRound,play,shuffle,classroomScramble,achievements,finish,strip,vowel,pick,daySeed,runRandom};
})();
