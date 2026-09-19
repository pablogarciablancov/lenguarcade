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
  'id="board"','id="wordBuilder"','id="rewardChoices"','id="collectionModal"','id="dailyGameBtn"',
  './content.js','./lexicon.js','./vendor/typo.js','./engine.js','./bridge.js','./app.js','./layout.js','./sound.js','./game-feel.js','./styles.css','./responsive.css','./arcade.css'
]) if (!index.includes(required)) throw new Error(`Falta ${required} en index.html`);

if(!index.includes('20260919-morphology-v1'))throw new Error('Los assets de Word Play no llevan la versión morfológica actual');
if(!app.includes('dictionaryReady')||!app.includes('launchButtons'))throw new Error('La partida puede arrancar antes de cargar el diccionario');

for (const required of ['100dvh','overflow:hidden','.board','.reward-card','.collection-body','.boss-badge']) {
  if (!css.replaceAll(' ', '').includes(required.replaceAll(' ', ''))) throw new Error(`Falta ${required} en styles.css`);
}
for (const required of ['--tile-size','--board-gap','grid-template-columns:repeat(4,var(--tile-size))','max-height:100dvh','max-height:850px','max-width:820px']) {
  if (!responsive.replaceAll(' ', '').includes(required.replaceAll(' ', ''))) throw new Error(`Falta ${required} en responsive.css`);
}

for (const required of ['.wp-fx-layer','.wp-score-pop','.wp-boss-clear','.reward-modal.boss-loot','.reward-card.rarity-legendary','.game-screen[data-challenge-kind="boss"]','.board::before','.tile.gold']) {
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
for (const required of ['DICTIONARY_URLS','./dictionary-es-50k.txt','LETTER_POOL','validate','score','rewards','localStorage','achievements','dailySeed','rngCounter','runRandom','state?.won','roundTarget','rewardTier','bossPlay','rareLuck','specialFlat','BOARD_RULES','pickBalancedLetter','rebalanceBoard','boardQuality','wordIndex','candidateBoards','repairLoadedBoard','improvePlayability','HUNSPELL_AFF','HUNSPELL_DIC','loadHunspell','morphologyReady']) {
  if (!engine.includes(required)) throw new Error(`Falta ${required} en engine.js`);
}
for (const required of ['renderCareer','renderBoard','openReward','collection','wordLog']) {
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
if (C.gifts.length < 18) throw new Error(`Solo hay ${C.gifts.length} recompensas`);
if (C.challenges.length < 18) throw new Error(`Solo hay ${C.challenges.length} desafíos`);
if (C.achievements.length < 20) throw new Error(`Solo hay ${C.achievements.length} logros`);
for (const list of [C.modifiers,C.gifts,C.challenges,C.achievements]) {
  const ids = list.map(x => x.id);
  if (new Set(ids).size !== ids.length) throw new Error('Hay IDs duplicados en content.js');
}

const bosses=C.challenges.filter(x=>x.kind==='boss');
if(bosses.length<8)throw new Error(`Hay pocos jefes lingüísticos: ${bosses.length}`);
if(bosses.some(x=>!(x.targetMult>0&&x.targetMult<1)||!x.rewardTier))throw new Error('Todos los jefes deben ajustar objetivo y definir botín');
if(!C.modifiers.some(x=>x.id==='cazajefes')||!C.gifts.some(x=>x.id==='boss_play'))throw new Error('Faltan sinergias específicas de jefe');

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
const bossId=E.chooseChallenge(3,'normal');
if(E.challenge(bossId).kind!=='boss')throw new Error('La ronda 3 no genera un jefe');
const constraintId=E.chooseChallenge(4,'normal');
if(!['none','constraint'].includes(E.challenge(constraintId).kind))throw new Error('Las rondas intermedias generan un tipo de reto inválido');
if(!(E.roundTarget(3,bossId)>0&&E.roundTarget(3,bossId)<300))throw new Error('El objetivo de jefe no aplica su multiplicador');
E.state=E.newState('normal');
E.state.challenge='ntilde';
E.shuffle();
if(!E.state.board.some(t=>t.letter==='Ñ'))throw new Error('El jefe de la Ñ no garantiza una Ñ tras barajar');
const bossRewards=E.rewards();
const rarityRank={common:0,uncommon:1,rare:2,epic:3,legendary:4};
if(!bossRewards.some(x=>(rarityRank[x.rarity]||0)>=3))throw new Error('El Guardián de la Ñ no garantiza botín épico');

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

console.log(`Word Play: OK · ${C.modifiers.length} modificadores · ${C.gifts.length} recompensas · ${C.challenges.length} desafíos · ${C.achievements.length} logros · responsive/arcade/lexicon/bosses/synergies/balanced-board/playability/cache-migration/morphology-esES/bridge/audio/daily OK`);
