import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const base = process.argv[2] || path.resolve('games/word_play');
const read = file => fs.readFileSync(path.join(base, file), 'utf8');
const index = read('index.html');
const css = read('styles.css');
const responsive = read('responsive.css');
const arcade = read('arcade.css');
const lexicon = read('lexicon.js');
const gameFeel = read('game-feel.js');
const dictionary = read('dictionary-es-50k.txt');
const notices = read('THIRD_PARTY_NOTICES.md');
const typo = read('vendor/typo.js');
const hunspellAff = read('hunspell/es_ES.aff');
const hunspellDic = read('hunspell/es_ES.dic');
const typoLicense = read('vendor/TYPO_LICENSE.txt');
const rlaLicense = read('hunspell/RLA_ES_LICENSE.md');
const content = read('content.js');
const engine = read('engine.js');
const app = read('app.js');
const layout = read('layout.js');
const bridge = read('bridge.js');
const sound = read('sound.js');

for (const required of [
  'id="board"','id="wordBuilder"','id="scoreBreakdown"','id="upgradeList"','id="difficultyModal"','id="skipRewardBtn"','id="classroomModeToggle"','id="classroomBadge"','id="rewardChoices"','id="collectionModal"','id="dailyGameBtn"',
  './content.js','./lexicon.js','./vendor/typo.js','./engine.js','./bridge.js','./app.js','./layout.js','./sound.js','./game-feel.js','./styles.css','./responsive.css','./arcade.css'
]) if (!index.includes(required)) throw new Error(`Falta ${required} en index.html`);

if(!index.includes('20260919-value-colors-v1'))throw new Error('Los assets de Word Play no llevan la versión de color por valor actual');
if(!app.includes('dictionaryReady')||!app.includes('launchButtons'))throw new Error('La partida puede arrancar antes de cargar el diccionario');

for (const required of ['100dvh','overflow:hidden','.board','.reward-card','.collection-body','.boss-badge']) {
  if (!css.replaceAll(' ', '').includes(required.replaceAll(' ', ''))) throw new Error(`Falta ${required} en styles.css`);
}
for (const required of ['--tile-size','--board-gap','grid-template-columns:repeat(4,var(--tile-size))','max-height:100dvh','max-height:850px','max-width:820px']) {
  if (!responsive.replaceAll(' ', '').includes(required.replaceAll(' ', ''))) throw new Error(`Falta ${required} en responsive.css`);
}

for (const required of ['.wp-fx-layer','.wp-score-pop','.word-slot','.score-breakdown','.difficulty-grid','.upgrade-card','.tile.emerald','.tile.dot','.tile.mirror','.tile.bang','.tile.plus','.tile.normal.value-1','.tile.normal.value-4','.tile.normal.value-9','.word-slot.normal.value-3','.classroom-badge','.classroom-toggle','user-select:none','.reward-card.rarity-legendary','.board::before','.tile.gold']) {
  if (!arcade.includes(required)) throw new Error(`Falta ${required} en arcade.css`);
}
for (const required of ['WordPlayLexicon','additions','strict','blocked','rejectPatterns','es-ES']) {
  if (!lexicon.includes(required)) throw new Error(`Falta ${required} en lexicon.js`);
}
for (const required of ['WordPlayGameFeel','MutationObserver','wp-score-pop','wp-combo-callout']) {
  if (!gameFeel.includes(required)) throw new Error(`Falta ${required} en game-feel.js`);
}
const localWords=dictionary.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
if(localWords.length<45000)throw new Error(`Diccionario local demasiado pequeño: ${localWords.length}`);
if(!localWords.includes('palabra')||!localWords.includes('español'))throw new Error('El diccionario local no contiene vocabulario básico esperado');
if(!/CC BY-SA 4\.0/i.test(notices)||!/FrequencyWords/i.test(notices))throw new Error('Falta atribución del léxico local');
if(!/RLA-ES/i.test(notices)||!/Typo\.js/i.test(notices))throw new Error('Faltan avisos de terceros de la capa morfológica');
if(!/Copyright \(c\) 2011, Christopher Finke/i.test(typoLicense))throw new Error('Falta licencia de Typo.js');
if(!/GPL versión 3/i.test(rlaLicense)||!/MPL versión 1\.1/i.test(rlaLicense))throw new Error('Falta licencia RLA-ES');
if(!hunspellAff.includes('SET UTF-8')||!hunspellAff.includes('PFX ')||!hunspellAff.includes('SFX '))throw new Error('es_ES.aff no parece un diccionario Hunspell válido');
if(!hunspellDic.startsWith('58221'))throw new Error('es_ES.dic no parece el diccionario esperado');
if(!typo.includes('Typo = function')||!typo.includes('_parseAFF'))throw new Error('Typo.js no está completo');

for (const required of ['computeTileSize','ResizeObserver','MutationObserver','visualViewport','--tile-size','--board-gap']) {
  if (!layout.includes(required)) throw new Error(`Falta ${required} en layout.js`);
}
for (const required of ['DICTIONARY_URLS','./dictionary-es-50k.txt','LETTER_POOL','validate','score','rewards','localStorage','achievements','dailySeed','rngCounter','runRandom','state?.won','roundTarget','BOARD_RULES','pickBalancedLetter','rebalanceBoard','boardQuality','wordIndex','candidateBoards','repairLoadedBoard','improvePlayability','HUNSPELL_AFF','HUNSPELL_DIC','loadHunspell','morphologyReady','modeConfig','totalRounds','specialRound','specialEffect','slotBonusAt','useUpgrade','sellModifier','skipReward','refreshBoard','boardPlayability','rescueBoard','stabilizeBoard','classroomScramble']) {
  if (!engine.includes(required)) throw new Error(`Falta ${required} en engine.js`);
}
for (const required of ['renderCareer','renderBoard','renderUpgrades','valueClass','wordScorePreview','difficultyModal','openReward','skipReward','collection','wordLog','classroomMode','visibilitychange','copy','classroomScramble']) {
  if (!app.includes(required)) throw new Error(`Falta ${required} en app.js`);
}
for (const required of ["const GAME_ID='word_play'","post('READY'","post('INITIALIZED'","post('CHECKPOINT'","post('RESULT'",'SESSION_STARTED']) {
  if (!bridge.includes(required)) throw new Error(`Falta bridge: ${required}`);
}
for (const required of ['AudioContext','Oscillator','WordPlaySound','MutationObserver']) {
  if (!sound.includes(required)) throw new Error(`Falta sonido: ${required}`);
}

const sandbox = { window: {} };
vm.createContext(sandbox);
new vm.Script(content, { filename: 'content.js' }).runInContext(sandbox);
new vm.Script(lexicon, { filename: 'lexicon.js' }).runInContext(sandbox);
const C = sandbox.window.WordPlayContent;
const LX = sandbox.window.WordPlayLexicon;
if (!C) throw new Error('content.js no expone WordPlayContent');
if (!LX||LX.locale!=='es-ES'||!LX.strict?.ortografia) throw new Error('lexicon.js no expone la capa española esperada');
if (C.modifiers.length < 60) throw new Error(`Solo hay ${C.modifiers.length} modificadores`);
if (C.gifts.length < 25) throw new Error(`Solo hay ${C.gifts.length} obsequios/recursos`);
if (C.upgrades.length < 15) throw new Error(`Solo hay ${C.upgrades.length} mejoras activas`);
if (C.specialRounds.length < 9) throw new Error(`Solo hay ${C.specialRounds.length} rondas especiales`);
if (Object.keys(C.modes||{}).length < 6) throw new Error('Faltan dificultades/modos');
if (C.achievements.length < 20) throw new Error(`Solo hay ${C.achievements.length} logros`);
for (const list of [C.modifiers,C.gifts,C.upgrades,C.specialRounds,C.challenges,C.achievements]) {
  const ids = list.map(x => x.id);
  if (new Set(ids).size !== ids.length) throw new Error('Hay IDs duplicados en content.js');
}
if(JSON.stringify(C.wordLengthSlots)!==JSON.stringify([0,0,0,0,5,5,5,10,10,15,15,20]))throw new Error('La escalera de bonus por longitud no coincide con el diseño');
for(const kind of ['gold','diamond','emerald','dot','potion','glass','mirror','bang','plus','wild']){
  if(!C.specialTileTypes[kind])throw new Error(`Falta ficha especial ${kind}`);
}

// Sintaxis de todos los módulos.
for (const [name, code] of [['lexicon.js',lexicon],['vendor/typo.js',typo],['engine.js',engine],['app.js',app],['layout.js',layout],['bridge.js',bridge],['sound.js',sound],['game-feel.js',gameFeel]]) {
  new vm.Script(code, { filename:name });
}

// Prueba funcional del motor sin navegador.
const store = new Map();
let uuid = 0;
const runtime = {
  window:{WordPlayContent:C,WordPlayLexicon:LX},
  localStorage:{
    getItem:key=>store.has(key)?store.get(key):null,
    setItem:(key,value)=>store.set(key,String(value)),
    removeItem:key=>store.delete(key)
  },
  crypto:{randomUUID:()=>`test-${++uuid}`},
  fetch:async url=>({
    ok:true,status:200,
    text:async()=>url.includes('dictionary-es-50k')?dictionary:
      url.includes('es_ES.aff')?hunspellAff:
      url.includes('es_ES.dic')?hunspellDic:
      'palabra 1\nespañol 1\n'
  }),
  Intl,Date,Math,Set,Map,JSON,Object,Array,String,Number,RegExp,console,
  setTimeout,clearTimeout
};
runtime.globalThis=runtime;
vm.createContext(runtime);
new vm.Script(typo,{filename:'vendor/typo.js'}).runInContext(runtime);
new vm.Script(engine,{filename:'engine.js'}).runInContext(runtime);
const E=runtime.window.WordPlayEngine;
if(!E)throw new Error('engine.js no expone WordPlayEngine');
if(E.settings.classroomMode!==true)throw new Error('Tinta Viva debe estar activa por defecto');
await E.loadDictionary();
if(!E.morphologyReady)throw new Error('La capa Hunspell no queda cargada');
for(const word of ['cantábamos','condujeron','hubiésemos','deshacer','ilegalmente','pequeñísima']){
  const result=E.validate(word);
  if(!result.ok)throw new Error(`La morfología española rechaza «${word}»: ${result.message}`);
}
const malformed=E.validate('cantabamos');
if(malformed.ok)throw new Error('La morfología acepta «cantabamos» sin tilde');

const accentCheck=E.validate('ortografia');
if(accentCheck.ok||!accentCheck.accent||!String(accentCheck.message).includes('ortografía'))throw new Error('La capa ortográfica no corrige ortografia → ortografía');

if(E.validate('john').ok)throw new Error('El filtro escolar acepta un nombre propio extranjero frecuente');
if(E.validate('jajaja').ok)throw new Error('El filtro escolar acepta ruido de chat');
if(E.validate('casa').ok!==true)throw new Error('Una palabra válida de 4 letras debe aceptarse');
if(E.validate('sol').ok)throw new Error('Las palabras de 3 letras deben rechazarse en el nuevo loop');
if(E.slotBonusAt(0)!==0||E.slotBonusAt(3)!==0||E.slotBonusAt(4)!==5||E.slotBonusAt(7)!==10||E.slotBonusAt(9)!==15)throw new Error('Bonus de ranuras incorrectos');
if(E.totalRounds('normal')!==12||E.totalRounds('legendary')!==14||E.totalRounds('marathon')!==20)throw new Error('Número de rondas incorrecto por modo');
if(!E.isSpecialRound(5,'normal')||!E.isSpecialRound(14,'legendary')||E.isSpecialRound(4,'normal'))throw new Error('Calendario de rondas especiales incorrecto');
const normalStart=E.newState('normal');
if(normalStart.playsLeft!==10||normalStart.shufflesLeft!==4)throw new Error('Recursos iniciales de Normal incorrectos');
const legendaryStart=E.newState('legendary');
if(legendaryStart.playsLeft!==8||legendaryStart.shufflesLeft!==3||legendaryStart.target!==60)throw new Error('Recursos/objetivo inicial de Legendario incorrectos');

E.state=E.newState('normal');
E.state.modifiers=[];
const mk=(letter,kind='normal',extra={})=>Object.assign({id:'t-'+letter+'-'+Math.random(),letter,kind,bonus:0,uses:0},extra);
let sc=E.score('casa',[mk('C'),mk('A'),mk('S'),mk('A')],true);
if(sc.wordScore!==6||sc.bonusPoints!==0||sc.total!==6)throw new Error(`Score base de 4 letras incorrecto: ${JSON.stringify(sc)}`);
sc=E.score('casas',[mk('C'),mk('A'),mk('S'),mk('A'),mk('S')],true);
if(sc.wordScore!==7||sc.bonusPoints!==5||sc.total!==12)throw new Error(`Bonus de quinta ficha incorrecto: ${JSON.stringify(sc)}`);
sc=E.score('casa',[mk('C','gold'),mk('A','gold'),mk('S'),mk('A')],true);
if(sc.wordScore!==12)throw new Error('Dos doradas no multiplican Word Score ×2');
sc=E.score('casa',[mk('C'),mk('A'),mk('S'),mk('A','dot')],true);
if(sc.wordScore!==12)throw new Error('Punto final no duplica Word Score');

E.state=E.newState('normal');
const targetId=E.state.board[0].id;
E.state.upgrades=[{id:'up_plus5',uses:1}];
const beforeBonus=E.state.board[0].bonus||0;
const upgraded=E.useUpgrade('up_plus5',targetId);
if(!upgraded.ok||E.state.board.find(t=>t.id===targetId)?.bonus!==beforeBonus+5||E.state.upgrades.length!==0)throw new Error('Upgrade +5 no consume uso o no modifica ficha');
const beforeRefresh=E.state.shufflesLeft;
if(E.skipReward()!==2||E.state.shufflesLeft!==beforeRefresh+2)throw new Error('Pasar recompensa no concede +2 renovaciones');

E.state=E.newState('normal');
const nightmare=['X','U','I','Ñ','B','W','I','Z','T','U','Y','J','V','K','M','I'];
E.state.board.forEach((t,i)=>t.letter=nightmare[i]);
E.state.shufflesLeft=0;
const deadStats=E.boardPlayability(E.state.board,E.state);
if(deadStats.safe)throw new Error(`El tablero de atasco de producción se considera seguro: ${JSON.stringify(deadStats)}`);
const playsBeforeRescue=E.state.playsLeft,refreshBeforeRescue=E.state.shufflesLeft;
const rescued=E.rescueBoard('test de atasco',true);
if(!rescued.rescued||!rescued.after.safe)throw new Error(`El rescate automático no recupera un tablero muerto: ${JSON.stringify(rescued)}`);
if(E.state.playsLeft!==playsBeforeRescue||E.state.shufflesLeft!==refreshBeforeRescue)throw new Error('El rescate automático consume Jugadas o Renovaciones');
if(E.state.selected.length)throw new Error('El rescate automático deja una selección antigua');

E.state=E.newState('normal');
E.state.selected=[{id:E.state.board[0].id,char:E.state.board[0].letter}];
const classroomPlays=E.state.playsLeft,classroomRefreshes=E.state.shufflesLeft;
const classroom=E.classroomScramble(6);
if(classroom.changed!==6)throw new Error(`Tinta Viva no muta 6 fichas: ${classroom.changed}`);
if(E.state.selected.length)throw new Error('Tinta Viva no limpia la palabra seleccionada');
if(E.state.playsLeft!==classroomPlays||E.state.shufflesLeft!==classroomRefreshes)throw new Error('Tinta Viva consume recursos de juego');
if(!E.boardPlayability(E.state.board,E.state).safe)throw new Error('Tinta Viva puede dejar el tablero atascado');

E.state=E.newState('normal');
E.state.challenge='ntilde';
E.state.shufflesLeft=1;
E.shuffle();
if(!E.state.board.some(t=>t.letter==='Ñ'))throw new Error('La regla lingüística de Ñ no garantiza una Ñ al renovar');
function assertBalancedBoard(board,label='tablero',minVowels=E.BOARD_RULES.minVowels,maxVowels=E.BOARD_RULES.maxVowels){
  if(!Array.isArray(board)||board.length!==16)throw new Error(`${label}: debe tener 16 fichas`);
  const counts=new Map();
  for(const t of board)counts.set(t.letter,(counts.get(t.letter)||0)+1);
  const distinct=counts.size;
  const vowels=board.filter(t=>E.VOWELS.has(t.letter)).length;
  if(distinct<E.BOARD_RULES.minDistinct)throw new Error(`${label}: solo ${distinct} letras distintas`);
  if(vowels<minVowels||vowels>maxVowels)throw new Error(`${label}: ${vowels} vocales fuera de rango`);
  for(const [letter,count] of counts){
    const max=E.BOARD_RULES.maxCopies[letter]||1;
    if(count>max)throw new Error(`${label}: ${count} copias de ${letter}, máximo ${max}`);
  }
}
for(let i=0;i<160;i++){
  const sample=E.newState('normal');
  assertBalancedBoard(sample.board,`tablero inicial ${i}`);
}
E.state=E.newState('normal');
for(let i=0;i<40;i++){
  E.state.shufflesLeft=1;
  if(!E.shuffle())throw new Error('No se pudo probar un barajado equilibrado');
  assertBalancedBoard(E.state.board,`barajado ${i}`);
}
E.state=E.newState('normal');
E.state.challenge='ntilde';
E.state.shufflesLeft=1;
E.shuffle();
assertBalancedBoard(E.state.board,'jefe Ñ');
if(!E.state.board.some(t=>t.letter==='Ñ'))throw new Error('El jefe de la Ñ perdió la Ñ con el nuevo balanceador');

const normalQuality=E.boardQuality(E.newState('normal').board,'none');
if(!normalQuality.meets)throw new Error(`El generador crea un tablero equilibrado pero poco jugable: ${JSON.stringify(normalQuality)}`);

for(let i=0;i<24;i++){
  const sample=E.newState('normal');
  assertBalancedBoard(sample.board,`tablero jugable ${i}`);
  const q=E.boardQuality(sample.board,'none');
  if(!q.meets)throw new Error(`tablero jugable ${i}: no alcanza mínimos ${JSON.stringify(q)}`);
}

const legacy=E.newState('normal');
const badLetters=['Y','A','A','A','C','A','A','A','A','A','A','F','B','E','A','A'];
legacy.board.forEach((t,i)=>t.letter=badLetters[i]);
const repaired=E.repairLoadedBoard(legacy);
assertBalancedBoard(repaired.board,'partida antigua reparada');
const repairedQuality=E.boardQuality(repaired.board,repaired.challenge);
if(!repairedQuality.meets)throw new Error('La reparación de una partida antigua no mejora su jugabilidad');

const daily1=E.newState('daily');
const letters1=daily1.board.map(t=>t.letter).join('');
E.state=daily1;
E.shuffle();
const shuffled1=daily1.board.map(t=>t.letter).join('');
const cursor1=daily1.rngCounter;
const daily2=E.newState('daily');
const letters2=daily2.board.map(t=>t.letter).join('');
E.state=daily2;
E.shuffle();
const shuffled2=daily2.board.map(t=>t.letter).join('');
if(letters1!==letters2||shuffled1!==shuffled2||cursor1!==daily2.rngCounter)throw new Error('El reto diario no es determinista');

E.state=E.newState('normal');
E.state.invalidAttempts=0;
const loss=E.finish(false);
if(loss.got.some(a=>a.id==='perfect')||E.career.achievements.perfect)throw new Error('El logro Perfecto se concede al perder');

// Fórmula pura de layout: 4×4 debe caber siempre dentro del espacio entregado.
function layoutSize(w,h,g=7,max=112){const bw=(Math.max(0,w)-g*3)/4,bh=(Math.max(0,h)-g*3)/4;return Math.max(30,Math.floor(Math.min(max,bw,bh)));}
for(const [w,h] of [[700,430],[520,360],[390,250],[900,500]]){
  const s=layoutSize(w,h);if(s*4+21>w+1||s*4+21>h+1)throw new Error(`El tablero puede desbordar ${w}×${h}`);
}

console.log(`Word Play: OK · ${C.modifiers.length} modificadores · ${C.gifts.length} recompensas · ${C.challenges.length} desafíos · ${C.achievements.length} logros · responsive/color/core-loop/slots/upgrades/special-rounds/special-tiles/deadlock-rescue/tinta-viva/morphology-esES/bridge/audio/daily OK`);
