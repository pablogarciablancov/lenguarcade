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
function loadSettings(){try{return Object.assign({reduceMotion:false,sound:true},JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}'));}catch{return{reduceMotion:false,sound:true};}}
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
  const challengeId=chooseChallenge(1,mode);
  return{
    version:3,mode,round:1,roundScore:0,totalScore:0,
    target:quick?999999:roundTarget(1,challengeId),
    playsLeft:quick?10:5,shufflesLeft:quick?3:2,rerollsLeft:1,
    board:board(r,'',challengeId),selected:[],modifiers:[],
    bonuses:{extraPlays:0,extraShuffles:0,roundSeed:0,nextRoundSeed:0,lengthMult:1,letterMult:1,careerXp:0,bossPlay:0,rareLuck:0},
    challenge:challengeId,words:[],wordLog:[],usedWords:[],validStreak:0,maxStreak:0,invalidAttempts:0,
    longestWord:'',bestPlay:null,bestCombo:1,previousLength:0,roundWords:0,discoveredCards:[],
    goals:[
      {id:'long7',label:'Juega una palabra de 7+ letras',done:false},
      {id:'accent',label:'Usa correctamente una tilde',done:false},
      {id:'rare',label:'Utiliza una letra rara',done:false}
    ],
    completed:false,won:false,dailySeed:dailySeedValue,rngCounter:counter
  };
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
  const playable=wordIndex.length<500||boardQuality(run.board,run.challenge).meets;
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
function loadRun(){try{const r=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(!r||r.version!==3||r.completed)return null;if(r.mode==='daily'){if(!Number.isFinite(r.dailySeed))r.dailySeed=daySeed();if(!Number.isFinite(r.rngCounter))r.rngCounter=0;}if(typeof r.won!=='boolean')r.won=false;r.bonuses=Object.assign({extraPlays:0,extraShuffles:0,roundSeed:0,nextRoundSeed:0,lengthMult:1,letterMult:1,careerXp:0,bossPlay:0,rareLuck:0},r.bonuses||{});r.target=r.mode==='quick'?999999:roundTarget(r.round,r.challenge);return repairLoadedBoard(r);}catch{return null;}}
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
  if(w.length<3)return{ok:false,message:'Necesitas al menos 3 letras.'};
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
function chooseChallenge(round,mode){
  if(mode==='quick')return'none';
  const bosses=C.challenges.filter(x=>x.kind==='boss');
  const constraints=C.challenges.filter(x=>x.kind==='constraint');
  if(round%3===0){
    const i=mode==='daily'?(daySeed()+round*7)%bosses.length:Math.floor(Math.random()*bosses.length);
    return bosses[i]?.id||'none';
  }
  if(round>=4&&round%2===0){
    const i=mode==='daily'?(daySeed()+round*5)%constraints.length:Math.floor(Math.random()*constraints.length);
    return constraints[i]?.id||'none';
  }
  return'none';
}
function roundTarget(round,challengeId){
  const base=TARGETS[Math.max(0,Math.min(TARGETS.length-1,Number(round||1)-1))]||TARGETS[0];
  const mult=Number(challenge(challengeId).targetMult||1);
  return Math.max(50,Math.round(base*mult/5)*5);
}
function cond(id,ctx){const a=[...ctx.word],p=strip(ctx.word),v=a.filter(vowel).length,c=a.length-v,u=new Set(a).size,r=a.filter(x=>RARE.has(strip(x).toUpperCase())).length,special=(ctx.tiles||[]).filter(t=>t&&t.kind&&t.kind!=='normal'),vowels=a.filter(vowel).map(x=>strip(x));switch(id){case'always':return true;case'startsVowel':return vowel(a[0]);case'startsConsonant':return!vowel(a[0]);case'endsVowel':return vowel(a.at(-1));case'endsConsonant':return!vowel(a.at(-1));case'len3':return a.length===3;case'len5':return a.length===5;case'len6':return a.length===6;case'len7':return a.length===7;case'len8':return a.length===8;case'min7':return a.length>=7;case'accent':return/[áéíóúü]/.test(ctx.word);case'ntilde':return ctx.word.includes('ñ');case'noA':return!p.includes('a');case'noE':return!p.includes('e');case'noO':return!p.includes('o');case'rareLetter':return r>0;case'containsJ':return p.includes('j');case'containsZ':return p.includes('z');case'containsX':return p.includes('x');case'containsQ':return p.includes('q');case'doubleVowel':return/[aeiouáéíóúü]{2}/i.test(ctx.word);case'tripleConsonant':return/[^aeiouáéíóúü]{3}/i.test(ctx.word);case'longerThanPrev':return ctx.prev>0&&a.length>ctx.prev;case'shorterThanPrev':return ctx.prev>0&&a.length<ctx.prev;case'streak3':return ctx.streak>=3;case'streak5':return ctx.streak>=5;case'firstPlay':return ctx.roundWords===0;case'lastPlay':return ctx.playsLeft===1;case'evenLength':return a.length%2===0;case'oddLength':return a.length%2===1;case'twoA':return(p.match(/a/g)||[]).length>=2;case'twoE':return(p.match(/e/g)||[]).length>=2;case'threeVowels':return v>=3;case'fiveConsonants':return c>=5;case'allUnique':return u===a.length;case'palindrome':return a.length>=3&&ctx.word===[...ctx.word].reverse().join('');case'startsM':return p.startsWith('m');case'startsP':return p.startsWith('p');case'endsS':return p.endsWith('s');case'endsN':return p.endsWith('n');case'vowelEdges':return vowel(a[0])&&vowel(a.at(-1));case'sameEdges':return a.length>2&&a[0]===a.at(-1);case'sixUnique':return u>=6;case'max4':return a.length<=4;case'min10':return a.length>=10;case'perfectWord':return a.length>=8&&u===a.length;case'accentLong':return a.length>=7&&/[áéíóúü]/.test(ctx.word);case'twoRare':return r>=2;case'specialTile':return special.length>=1;case'twoSpecialTiles':return special.length>=2;case'bossRound':return ctx.challengeKind==='boss';case'accentAndRare':return/[áéíóúü]/.test(ctx.word)&&r>=1;case'fourVowels':return v>=4;case'crownTile':return special.some(t=>t.kind==='crown');case'min9':return a.length>=9;case'threeRare':return r>=3;case'uniqueVowels':return vowels.length>0&&new Set(vowels).size===vowels.length;default:return false;}}
function lengthBonus(n){const t={3:0,4:2,5:6,6:12,7:22,8:36,9:54,10:76,11:102,12:132};return Math.round((t[n]??(n>12?132+(n-12)*36:0))*(state?.bonuses.lengthMult||1));}
function tileScore(t){let v=(LETTER_VALUES[t.letter]||1)+(t.bonus||0);if(t.kind==='gold')v*=2;if(t.kind==='diamond')v*=3;if(t.kind==='echo')v*=2;if(t.kind==='crown')v+=25;return Math.round(v*(state?.bonuses.letterMult||1));}
function score(word,tiles,preview=false){let subtotal=tiles.reduce((s,t)=>s+tileScore(t),0)+lengthBonus([...word].length),mult=1;const effects=[];if(lengthBonus([...word].length))effects.push(`Longitud +${lengthBonus([...word].length)}`);const ctx={word,tiles,prev:state.previousLength,streak:state.validStreak+(preview?1:0),roundWords:state.roundWords,playsLeft:state.playsLeft,challengeId:state.challenge,challengeKind:challenge(state.challenge).kind};for(const id of state.modifiers){const m=C.modifiers.find(x=>x.id===id);if(!m||!cond(m.condition,ctx))continue;if(m.effect==='flat')subtotal+=m.value;else if(m.effect==='mult')mult*=m.value;else if(m.effect==='uniqueFlat')subtotal+=new Set([...word]).size*m.value;else if(m.effect==='repeatFlat')subtotal+=([...word].length-new Set([...word]).size)*m.value;else if(m.effect==='rareFlat')subtotal+=[...word].filter(x=>RARE.has(strip(x).toUpperCase())).length*m.value;else if(m.effect==='specialFlat')subtotal+=tiles.filter(t=>t&&t.kind&&t.kind!=='normal').length*m.value;effects.push(m.effect==='mult'?`${m.name} ×${m.value}`:`${m.name} +bonus`);}if(tiles.some(t=>t.kind==='volatile')){mult*=1.35;effects.push('Ficha explosiva ×1,35');}return{subtotal,multiplier:mult,total:Math.round(subtotal*mult),effects};}
function applyGift(r){switch(r.effect){case'extraPlay':state.bonuses.extraPlays+=r.value;break;case'extraShuffle':state.bonuses.extraShuffles+=r.value;break;case'reroll':state.rerollsLeft+=r.value;break;case'lengthMult':state.bonuses.lengthMult+=r.value;break;case'letterMult':state.bonuses.letterMult+=r.value;break;case'roundSeed':state.bonuses.roundSeed+=r.value;break;case'instantShuffle':state.shufflesLeft+=r.value;break;case'instantPlay':state.playsLeft+=r.value;break;case'nextRoundSeed':state.bonuses.nextRoundSeed+=r.value;break;case'careerXp':state.bonuses.careerXp+=r.value;break;case'bossPlay':state.bonuses.bossPlay+=r.value;break;case'rareLuck':state.bonuses.rareLuck+=r.value;break;}}
function rewards(){
  const luck=Math.max(0,Number(state.bonuses.rareLuck||0));
  const weight={
    common:Math.max(3,8-luck*2),
    uncommon:5+luck,
    rare:3+luck*1.4,
    epic:1.5+luck*.9,
    legendary:.5+luck*.35
  };
  const all=[...C.modifiers,...C.gifts].filter(x=>!(x.type==='modifier'&&state.modifiers.includes(x.id)));
  const bag=[];
  for(const x of all)for(let i=0;i<Math.max(1,Math.round(weight[x.rarity]||1));i++)bag.push(x);
  const out=[];
  const ch=challenge(state.challenge);
  if(ch.kind==='boss'){
    const rank={common:0,uncommon:1,rare:2,epic:3,legendary:4};
    const min=rank[ch.rewardTier||'rare']??2;
    const premium=all.filter(x=>(rank[x.rarity]??0)>=min);
    if(premium.length)out.push(pick(premium,state.mode==='daily'?runRandom:Math.random));
  }
  while(out.length<3&&bag.length){
    const x=pick(bag,state.mode==='daily'?runRandom:Math.random);
    if(!out.some(y=>y.id===x.id))out.push(x);
  }
  return out;
}
function chooseReward(r){state.discoveredCards.push(r.id);career.cards[r.id]=(career.cards[r.id]||0)+1;if(r.type==='modifier')state.modifiers.push(r.id);else if(r.type==='tile'){const pool=state.board.filter(x=>x.kind==='normal').length?state.board.filter(x=>x.kind==='normal'):state.board;const t=pick(pool,state.mode==='daily'?runRandom:Math.random);t.kind=r.effect;}else applyGift(r);saveCareer();saveRun();}
function nextRound(){
  state.round++;
  if(state.round>12)return false;
  state.challenge=chooseChallenge(state.round,state.mode);
  const ch=challenge(state.challenge);
  state.roundScore=state.bonuses.roundSeed+state.bonuses.nextRoundSeed;
  state.totalScore+=state.roundScore;
  state.bonuses.nextRoundSeed=0;
  state.target=roundTarget(state.round,state.challenge);
  state.playsLeft=5+state.bonuses.extraPlays+(ch.kind==='boss'?Number(state.bonuses.bossPlay||0):0);
  state.shufflesLeft=2+state.bonuses.extraShuffles;
  state.roundWords=0;
  state.selected=[];
  ensureBoard();
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
function replace(ids){
  const changed=[];
  for(const id of ids){
    const idx=state.board.findIndex(t=>t.id===id);
    if(idx<0)continue;
    changed.push(idx);
    state.board[idx]=retile(state.board[idx]);
  }
  ensureBoard();
  improvePlayability(changed);
  ensureBoard();
}
function play(word,tiles){const val=validate(word);if(!val.ok){state.invalidAttempts++;state.validStreak=0;saveRun();return val;}if(state.usedWords.includes(val.word))return{ok:false,message:'Ya has utilizado esa palabra.'};if(!challengeOK(state.challenge,val.word))return{ok:false,message:`No cumple el reto: ${challenge(state.challenge).desc}`};state.validStreak++;state.maxStreak=Math.max(state.maxStreak,state.validStreak);const sc=score(val.word,tiles,false);for(const t of tiles){t.uses++;if(t.kind==='ink')t.bonus++;}state.roundScore+=sc.total;state.totalScore+=sc.total;state.playsLeft--;state.previousLength=[...val.word].length;state.words.push(val.word);state.usedWords.push(val.word);state.roundWords++;state.wordLog.push({word:val.word,score:sc.total,effects:sc.effects});if(val.word.length>state.longestWord.length)state.longestWord=val.word;if(!state.bestPlay||sc.total>state.bestPlay.score)state.bestPlay={word:val.word,score:sc.total};state.bestCombo=Math.max(state.bestCombo,sc.multiplier);if([...val.word].length>=7)state.goals[0].done=true;if(/[áéíóúü]/.test(val.word))state.goals[1].done=true;if(tiles.some(t=>RARE.has(t.letter)))state.goals[2].done=true;career.words[val.word]=(career.words[val.word]||0)+1;if(val.word.length>(career.bestWord||'').length)career.bestWord=val.word;replace(tiles.map(t=>t.id));saveCareer();saveRun();return{ok:true,word:val.word,score:sc};}
function shuffle(){if(state.shufflesLeft<=0)return false;const upgrades=state.board.filter(t=>t.kind!=='normal').map(t=>({kind:t.kind,bonus:t.bonus,uses:t.uses}));state.board=board(state.mode==='daily'?runRandom:Math.random,currentSetup(),state.challenge);upgrades.forEach((u,i)=>Object.assign(state.board[i],u));ensureBoard();state.shufflesLeft--;state.selected=[];saveRun();return true;}
function metric(a){switch(a.metric){case'careerWords':return Object.values(career.words).reduce((s,n)=>s+n,0);case'bestPlay':return Math.max(career.bestPlay,state?.bestPlay?.score||0);case'runScore':return state?.totalScore||0;case'longest':return Math.max((career.bestWord||'').length,(state?.longestWord||'').length);case'ntilde':return state?.words.some(w=>w.includes('ñ'))?1:0;case'accent':return state?.words.some(w=>/[áéíóúü]/.test(w))?1:0;case'streak':return state?.maxStreak||0;case'rare':return state?.words.some(w=>/[jñqxzkw]/i.test(w))?1:0;case'wins':return career.wins;case'uniqueWords':return Object.keys(career.words).length;case'cards':return Object.keys(career.cards).length;case'combo':return Math.max(career.bestCombo,state?.bestCombo||1);case'quick':return career.quickGames;case'daily':return career.dailyGames;case'perfect':return state?.completed&&state?.won&&state.invalidAttempts===0?1:0;case'round':return state?.round||0;default:return 0;}}
function achievements(){const got=[];for(const a of C.achievements)if(!career.achievements[a.id]&&metric(a)>=a.value){career.achievements[a.id]=Date.now();career.xp+=25;got.push(a);}if(got.length)saveCareer();return got;}
function finish(won){state.won=!!won;state.completed=true;clearRun();career.games++;if(won&&state.mode!=='quick')career.wins++;if(state.mode==='quick')career.quickGames++;if(state.mode==='daily')career.dailyGames++;career.bestScore=Math.max(career.bestScore,state.totalScore);career.bestPlay=Math.max(career.bestPlay,state.bestPlay?.score||0);career.bestCombo=Math.max(career.bestCombo,state.bestCombo);let xp=Math.round(state.words.length*4+state.round*10+(won?80:0)+state.bonuses.careerXp);if(state.mode==='quick')xp=Math.round(xp*.7);career.xp+=xp;const got=achievements();saveCareer();return{xp,got};}
window.WordPlayEngine={C,LETTER_VALUES,VOWELS,ACCENTABLE,BOARD_RULES,boardQuality,isBalancedBoard,repairLoadedBoard,get morphologyReady(){return !!hunspell?.loaded},get state(){return state},set state(v){state=v},get career(){return career},settings,saveSettings,saveRun,loadRun,clearRun,newState,loadDictionary,validate,challenge,chooseChallenge,roundTarget,tileScore,score,rewards,chooseReward,nextRound,play,shuffle,achievements,finish,strip,vowel,pick,daySeed,runRandom};
})();
