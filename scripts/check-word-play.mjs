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
const rewardArt = read('assets/reward-art.svg');

for (const required of [
  'id="board"','id="wordBuilder"','id="scoreBreakdown"','id="upgradeList"','id="difficultyModal"','id="skipRewardBtn"','id="classroomModeToggle"','id="coinWallet"','id="coinValue"','id="shopBtn"','id="shopModal"','id="shopGrid"','id="letterGrid"','id="missionChip"','id="buildSummary"','id="inkWallet"','id="inkValue"','id="tintaVivaBtn"','id="tintaCharges"','id="rewardChoices"','id="collectionModal"','id="dailyGameBtn"',
  './content.js','./lexicon.js','./vendor/typo.js','./engine.js','./bridge.js','./app.js','./layout.js','./sound.js','./game-feel.js','./styles.css','./responsive.css','./arcade.css'
]) if (!index.includes(required)) throw new Error(`Falta ${required} en index.html`);

if(!index.includes('20260920-fast-bridge-v1'))throw new Error('Los assets de Word Play no llevan la versión del bridge rápido');
if(!app.includes('dictionaryReady')||!app.includes('launchButtons'))throw new Error('La partida puede arrancar antes de cargar el diccionario');
if(app.includes("visibilitychange"))throw new Error('Cambiar de pestaña no debe activar Tinta Viva automáticamente');
if(!/function applyUpgrade[\s\S]*const upgradeId=activeUpgrade[\s\S]*activeUpgrade=null[\s\S]*render\(\)/.test(app))throw new Error('Aplicar una Mejora debe desarmar el modo de selección tras una sola ficha');
if(!app.includes('sanitizeSelection'))throw new Error('La UI no sanea selecciones cuyos IDs ya no existen en el tablero');
if(app.includes("if(E.career.games===0)howTo(true)"))throw new Error('La primera partida sigue abriendo el tutorial modal en vez del tutorial contextual');

for (const required of ['100dvh','overflow:hidden','.board','.reward-card','.collection-body','.boss-badge']) {
  if (!css.replaceAll(' ', '').includes(required.replaceAll(' ', ''))) throw new Error(`Falta ${required} en styles.css`);
}
if(!arcade.replaceAll(' ','').includes('.tile::after{content:none!important}'))throw new Error('El valor de la ficha sigue usando la burbuja/pseudo-elemento antiguo');
for (const required of ['--tile-size','--board-gap','grid-template-columns:repeat(4,var(--tile-size))','max-height:100dvh','max-height:850px','max-width:820px']) {
  if (!responsive.replaceAll(' ', '').includes(required.replaceAll(' ', ''))) throw new Error(`Falta ${required} en responsive.css`);
}

for (const required of ['.wp-fx-layer','.wp-score-pop','.word-slot','.score-breakdown','.difficulty-grid','.upgrade-card','.tile.emerald','.tile.dot','.tile.mirror','.tile.bang','.tile.plus','.tile.normal.value-1','.tile.normal.value-4','.tile.normal.value-9','.word-slot.normal.value-3','.economy-hud','.coin-wallet','.shop-btn','.shop-grid','.shop-card','.letter-grid','.tile-points','.hover-tooltip','.hover-tooltip.visible','.mission-chip','.synergy-strip','.tile-state','.shop-card.on-sale','.sale-badge','.wp-activation-stack','.coach-mark','.build-summary','.wp-word-score-sequence','.wp-score-letter','.ink-power','.ink-wallet','.tinta-viva-btn','.reward-art','.reward-art-image','.reward-card-body','.rarity-gem','.card-corner','.classroom-toggle','user-select:none','.reward-card.rarity-legendary','.board::before','.tile.gold']) {
  if (!arcade.includes(required)) throw new Error(`Falta ${required} en arcade.css`);
}
for (const required of ['WordPlayLexicon','additions','strict','blocked','rejectPatterns','es-ES']) {
  if (!lexicon.includes(required)) throw new Error(`Falta ${required} en lexicon.js`);
}
for (const required of ['WordPlayGameFeel','MutationObserver','wp-score-pop','wp-combo-callout','scoreWord','activations','wp-word-score-sequence','wp-score-letter','wp-activation-stack']) {
  if (!gameFeel.includes(required)) throw new Error(`Falta ${required} en game-feel.js`);
}

for (const required of ['art-generic','art-long','art-vowels','art-accent','art-enye','art-rare','art-gold','art-emerald','art-diamond','art-dot','art-duplicate','art-destroy','art-refresh','art-play','art-wild','art-mirror','art-potion','art-glass','art-plus','art-bang','art-score','art-xp','art-transmute']) {
  if (!rewardArt.includes(`id="${required}"`)) throw new Error(`Falta ilustración SVG ${required}`);
}
if ((rewardArt.match(/<symbol /g)||[]).length < 20) throw new Error('El atlas de recompensas tiene muy pocas ilustraciones');
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
for (const required of ['DICTIONARY_URLS','./dictionary-es-50k.txt','LETTER_POOL','validate','score','rewards','localStorage','achievements','dailySeed','rngCounter','runRandom','state?.won','roundTarget','BOARD_RULES','pickBalancedLetter','rebalanceBoard','boardQuality','wordIndex','candidateBoards','repairLoadedBoard','improvePlayability','HUNSPELL_AFF','HUNSPELL_DIC','loadHunspell','morphologyReady','modeConfig','totalRounds','specialRound','specialEffect','slotBonusAt','useUpgrade','sellModifier','skipReward','refreshBoard','anchorWordCandidates','anchoredBoard','boardPlayability','rescueBoard','stabilizeBoard','classroomScramble','buyTintaViva','useTintaViva','shopItem','shopOffers','shopStatus','buyShopItem','generateShopStock','missionMatches','pickLinguisticMission','coinRewardForPlay','tilePoints','triggeredModifiers','specialEvents']) {
  if (!engine.includes(required)) throw new Error(`Falta ${required} en engine.js`);
}
for (const required of ['renderCareer','renderBoard','renderUpgrades','valueClass','wordScorePreview','difficultyModal','openReward','skipReward','collection','wordLog','classroomMode','tintaBtn','buyTintaViva','useTintaViva','rewardArt','rewardArtSvg','rewardAccent','reward-art.svg','rarity-gem','openShop','renderShop','buyFromShop','buyShopLetter','tile-points','scoreWord','copy','initTooltips','installStaticTips','specialHelp','tileTip','data-tip','Rerolls de recompensa','activeSynergies','buildProfile','showCoach','missionChip','gold-ready','shopOffers','sale-badge']) {
  if (!app.includes(required)) throw new Error(`Falta ${required} en app.js`);
}
for (const required of ["const GAME_ID='word_play'","post('READY'","post('INITIALIZED'","post('CHECKPOINT'","post('RESULT'",'SESSION_STARTED','lenguarcade-bootstrap','REQUEST_EXIT','CHECKPOINT_CONFIRMED','CHECKPOINT_FAILED','CLOSE_READY','saveAndExit','AUTOSAVE_MS=30000','[3,4].includes(Number(run.version))']) {
  if (!bridge.includes(required)) throw new Error(`Falta bridge: ${required}`);
}
if(!/function readBootstrap\(\)[\s\S]*window\.name[\s\S]*initialize\(bootstrap,'bootstrap'\)/.test(bridge))throw new Error('Word Play no usa el contexto bootstrap para restaurar sin esperar al handshake');
if(!/function saveAndExit\(\)[\s\S]*checkpoint\('exit'\)[\s\S]*EXIT_FALLBACK_MS/.test(bridge))throw new Error('La salida no fuerza un checkpoint inmediato con fallback');
if(!app.includes('WordPlayBridge.saveAndExit'))throw new Error('Guardar y salir no usa el bridge al estar embebido');
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
if (!Array.isArray(C.shopItems)||C.shopItems.length < 9) throw new Error('La tienda tiene pocos artículos');
if(!Array.isArray(C.linguisticMissions)||C.linguisticMissions.length<5)throw new Error('Faltan misiones lingüísticas opcionales');
if(!Array.isArray(C.synergies)||C.synergies.length<5)throw new Error('Faltan sinergias de build');
const precision=C.modifiers.find(x=>x.id==='mini');
if(!precision||precision.condition!=='len4'||!/4 letras/.test(precision.desc))throw new Error('Precisión sigue siendo una carta muerta de 3 letras');
const specialist=C.modifiers.find(x=>x.id==='cazajefes');
if(!specialist||specialist.condition!=='specialRound'||!/ronda especial/i.test(specialist.desc))throw new Error('Cazajefes no se ha migrado al loop de rondas especiales');
const pass=C.gifts.find(x=>x.id==='boss_play');
if(!pass||!/ronda especial/i.test(pass.desc))throw new Error('Salvoconducto sigue apuntando a rondas jefe antiguas');
if(!C.specialTileTypes.echo||!/Duplica/i.test(C.specialTileTypes.echo.desc))throw new Error('Ficha Eco sigue sin definición funcional');

const upEmerald=C.upgrades.find(x=>x.id==='up_emerald');
const upDot=C.upgrades.find(x=>x.id==='up_dot');
const upGold=C.upgrades.find(x=>x.id==='up_gold');
const upDiamond=C.upgrades.find(x=>x.id==='up_diamond');
if(!upEmerald||!/25%/.test(upEmerald.desc)||!/×5/.test(upEmerald.desc))throw new Error('La carta Esmeralda no explica su efecto');
if(!upDot||!/duplica el Word Score/i.test(upDot.desc))throw new Error('La carta Punto no explica su efecto');
if(!upGold||!/Word Score/i.test(upGold.desc)||!/2 o más Doradas/i.test(upGold.desc))throw new Error('La carta Dorada no explica su efecto');
if(!upDiamond||!/\+5/.test(upDiamond.desc))throw new Error('La carta Diamante no explica su efecto');

if (C.specialRounds.length < 9) throw new Error(`Solo hay ${C.specialRounds.length} rondas especiales`);
if (Object.keys(C.modes||{}).length < 6) throw new Error('Faltan dificultades/modos');
if (C.achievements.length < 20) throw new Error(`Solo hay ${C.achievements.length} logros`);
for (const list of [C.modifiers,C.gifts,C.upgrades,C.shopItems,C.specialRounds,C.linguisticMissions,C.synergies,C.challenges,C.achievements]) {
  const ids = list.map(x => x.id);
  if (new Set(ids).size !== ids.length) throw new Error('Hay IDs duplicados en content.js');
}
if(JSON.stringify(C.wordLengthSlots)!==JSON.stringify([0,0,0,0,5,5,5,10,10,15,15,20]))throw new Error('La escalera de bonus por longitud no coincide con el diseño');
if(C.challenges.some(x=>x.id==='exact5'&&x.kind==='constraint'))throw new Error('No puede existir una ronda activa que impida palabras de 6+ letras');
if(!C.challenges.some(x=>x.id==='exact6c'))throw new Error('Falta el reto de seis letras exactas');
const shrink=C.specialRounds.find(x=>x.id==='limit_tiles');
if(!shrink||!/6 fichas/.test(shrink.desc))throw new Error('Palabra encogida debe empezar permitiendo 6 fichas');

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
if(normalStart.ink!==0||normalStart.tintaCharges!==1)throw new Error('La run debe empezar con 0 Tinta y 1 carga de Tinta Viva');
if(normalStart.coins!==4)throw new Error('La run debe empezar con 4 Monedas');
if(!Array.isArray(normalStart.shopStock)||normalStart.shopStock.length!==5)throw new Error('La tienda inicial no tiene 5 artículos');
if(new Set(normalStart.shopStock.map(x=>x.id)).size!==5)throw new Error('La tienda inicial repite artículos');
if(normalStart.shopStock.filter(x=>x.discount===25).length!==1)throw new Error('La tienda inicial debe tener exactamente una oferta');
if(normalStart.mission&&!C.linguisticMissions.some(x=>x.id===normalStart.mission.id))throw new Error('La misión inicial no pertenece al catálogo');
const legendaryStart=E.newState('legendary');
if(legendaryStart.playsLeft!==8||legendaryStart.shufflesLeft!==3||legendaryStart.target!==60)throw new Error('Recursos/objetivo inicial de Legendario incorrectos');

E.state=E.newState('normal');
E.state.modifiers=[];
const mk=(letter,kind='normal',extra={})=>Object.assign({id:'t-'+letter+'-'+Math.random(),letter,kind,bonus:0,uses:0},extra);
let sc=E.score('casa',[mk('C'),mk('A'),mk('S'),mk('A')],true);
if(sc.wordScore!==6||sc.bonusPoints!==0||sc.total!==6)throw new Error(`Score base de 4 letras incorrecto: ${JSON.stringify(sc)}`);
if(!Array.isArray(sc.tilePoints)||sc.tilePoints.map(x=>x.value).join(',')!=='3,1,1,1')throw new Error(`El desglose por ficha es incorrecto: ${JSON.stringify(sc.tilePoints)}`);
sc=E.score('casas',[mk('C'),mk('A'),mk('S'),mk('A'),mk('S')],true);
if(sc.wordScore!==7||sc.bonusPoints!==5||sc.total!==12)throw new Error(`Bonus de quinta ficha incorrecto: ${JSON.stringify(sc)}`);
sc=E.score('casa',[mk('C','gold'),mk('A','gold'),mk('S'),mk('A')],true);
if(sc.wordScore!==12)throw new Error('Dos doradas no multiplican Word Score ×2');
sc=E.score('casa',[mk('C'),mk('A'),mk('S'),mk('A','dot')],true);
if(sc.wordScore!==12)throw new Error('Punto final no duplica Word Score');
sc=E.score('casa',[mk('C','echo'),mk('A'),mk('S'),mk('A')],true);
if(sc.wordScore!==9||!sc.specialEvents.some(x=>x.kind==='echo'))throw new Error('Ficha Eco no duplica su valor o no informa activación');
E.state.modifiers=['mini'];
sc=E.score('casa',[mk('C'),mk('A'),mk('S'),mk('A')],true);
if(!sc.triggeredModifiers.some(x=>x.id==='mini'))throw new Error('Las activaciones de Modificadores no se exponen al feedback visual');
E.state.modifiers=[];


E.state=E.newState('normal');
const targetId=E.state.board[0].id;
E.state.upgrades=[{id:'up_plus5',uses:1}];
const beforeBonus=E.state.board[0].bonus||0;
const upgraded=E.useUpgrade('up_plus5',targetId);
if(!upgraded.ok||E.state.board.find(t=>t.id===targetId)?.bonus!==beforeBonus+5||E.state.upgrades.length!==0)throw new Error('Upgrade +5 no consume uso o no modifica ficha');
const beforeRefresh=E.state.shufflesLeft;
if(E.skipReward()!==2||E.state.shufflesLeft!==beforeRefresh+2)throw new Error('Pasar recompensa no concede +2 renovaciones');

function wordTiles(run,word){
  const needed=[...E.strip(word).toUpperCase()];
  const used=new Set(),tiles=[];
  for(const letter of needed){
    const t=run.board.find(x=>!used.has(x.id)&&x.letter===letter);
    if(!t)return null;
    used.add(t.id);tiles.push(t);
  }
  return tiles;
}
function findPlayableFromBoard(run,exclude=new Set(),minLen=4){
  for(const w of localWords.slice(0,E.PLAYABILITY_COMMON_LIMIT)){
    if(exclude.has(w))continue;
    const n=E.strip(w);
    if([...n].length<minLen||[...n].length>10)continue;
    if(!E.validate(w).ok)continue;
    const tiles=wordTiles(run,w);
    if(tiles)return{word:w,tiles};
  }
  return null;
}


// Economía de tienda, stock rotatorio y Monedas.
E.state=E.newState('normal');
let offers=E.shopOffers();
if(offers.length!==5||offers.filter(x=>x.discount===25).length!==1)throw new Error('shopOffers no expone 5 artículos con una oferta');
const sale=offers.find(x=>x.discount===25);
if(!sale||sale.price>=sale.item.cost)throw new Error('La oferta no reduce realmente el precio');

E.state.coins=20;
E.state.shopStock=[
  {id:'shop_play',price:4,discount:0,sold:false},
  {id:'shop_refresh',price:2,discount:25,sold:false},
  {id:'shop_reroll',price:5,discount:0,sold:false},
  {id:'shop_letter',price:5,discount:0,sold:false},
  {id:'shop_upgrade',price:9,discount:0,sold:false}
];
const playsShop=E.state.playsLeft;
const buyPlay=E.buyShopItem('shop_play');
if(!buyPlay.ok||E.state.playsLeft!==playsShop+1||E.state.coins!==16||E.state.coinsSpent!==4)throw new Error('Comprar Jugada extra no aplica coste/efecto correctamente');
if(E.buyShopItem('shop_play').ok)throw new Error('Se puede comprar dos veces el mismo artículo en una ronda');
const refreshShop=E.state.shufflesLeft;
const buyRefresh=E.buyShopItem('shop_refresh');
if(!buyRefresh.ok||E.state.shufflesLeft!==refreshShop+1||E.state.coins!==14||buyRefresh.price!==2)throw new Error('La oferta de Renovación no aplica precio rebajado');

E.state.coins=0;
E.state.shopStock=[{id:'shop_diamond',price:10,discount:0,sold:false}];
const noMoneyBefore=E.state.coins;
const noMoney=E.buyShopItem('shop_diamond');
if(noMoney.ok||E.state.coins!==noMoneyBefore)throw new Error('La tienda permite comprar sin Monedas');

E.state=E.newState('normal');
E.state.coins=5;
E.state.shopStock=[{id:'shop_letter',price:5,discount:0,sold:false}];
const reserveBefore=E.state.reserveTiles.length;
const buyLetter=E.buyShopItem('shop_letter',{letter:'Ñ'});
if(!buyLetter.ok||E.state.coins!==0||E.state.reserveTiles.length!==reserveBefore+1)throw new Error('Letra a la carta no se compra correctamente');
const boughtLetter=E.state.reserveTiles.at(-1);
if(boughtLetter.kind!=='normal'||boughtLetter.letter!=='Ñ')throw new Error('La letra elegida no llega correctamente a la reserva');

E.state=E.newState('normal');
E.state.coins=30;
E.state.shopStock=[{id:'shop_upgrade',price:9,discount:0,sold:false}];
E.state.upgrades=C.upgrades.slice(0,3).map(u=>({id:u.id,uses:u.uses}));
const fullUpgrade=E.buyShopItem('shop_upgrade');
if(fullUpgrade.ok)throw new Error('La tienda permite una cuarta Mejora');

E.state=E.newState('normal');
const stockRound=E.state.shopStock.map(x=>x.id).join(',');
E.state.round=4;
const playsBeforeSpecial=E.state.playsLeft;
E.state.bonuses.bossPlay=1;
if(!E.nextRound()||E.state.round!==5||!E.state.specialRound)throw new Error('No se pudo entrar en una ronda especial para probar Salvoconducto');
if(E.state.playsLeft!==playsBeforeSpecial+E.modeConfig('normal').roundGain+1)throw new Error('Salvoconducto no concede +1 Jugada en ronda especial');
if(E.state.shopRound!==5||E.state.shopStock.length!==5)throw new Error('La tienda no renueva stock al cambiar de ronda');
if(E.state.shopStock.some(x=>x.sold))throw new Error('El stock nuevo hereda artículos vendidos');

E.state=E.newState('normal');
const economyPlayable=findPlayableFromBoard(E.state,new Set(),4);
if(!economyPlayable)throw new Error('No hay palabra para probar economía');
const coinsBeforeWord=E.state.coins;
const economyPlayed=E.play(economyPlayable.word,economyPlayable.tiles);
if(!economyPlayed.ok||economyPlayed.coinGain<1||economyPlayed.coinGain>7)throw new Error('Una palabra válida no concede Monedas correctamente');
if(E.state.coins!==coinsBeforeWord+economyPlayed.coinGain)throw new Error('Las Monedas de palabra no se contabilizan en la run');

E.state=E.newState('normal');
E.state.specialRound=null;
const normalCoins=E.state.coins;
E.nextRound();
if(E.state.coins!==normalCoins+2||E.state.lastCoinGain!==2)throw new Error('Superar ronda normal no da +2 Monedas');
E.state=E.newState('normal');
E.state.specialRound='limit_tiles';
const specialCoins=E.state.coins;
E.nextRound();
if(E.state.coins!==specialCoins+4||E.state.lastCoinGain!==4)throw new Error('Superar ronda especial no da +4 Monedas');

// Misiones lingüísticas: la misión asignada siempre debe ser compatible con el tablero.
let missionRun=null,missionPlayable=null;
for(let i=0;i<20&&!missionPlayable;i++){
  const run=E.newState('normal');
  if(!run.mission)continue;
  for(const w of localWords.slice(0,E.PLAYABILITY_COMMON_LIMIT)){
    if(!E.missionMatches(run.mission,w))continue;
    const tiles=wordTiles(run,w);
    if(tiles&&E.validate(w).ok){missionRun=run;missionPlayable={word:w,tiles};break;}
  }
}
if(!missionRun||!missionPlayable)throw new Error('No se genera ninguna misión lingüística compatible con su tablero');
E.state=missionRun;
const missionCoins=E.state.coins;
const missionPlayed=E.play(missionPlayable.word,missionPlayable.tiles);
if(!missionPlayed.ok||!missionPlayed.missionCompleted||missionPlayed.missionGain<=0)throw new Error('Completar una misión lingüística no concede recompensa');
if(E.state.coins!==missionCoins+missionPlayed.coinGain||!E.state.missionDone||E.state.missionHistory.length!==1)throw new Error('La misión lingüística no actualiza estado/economía correctamente');

// Regresión reportada: usar una carta sobre una letra no puede dejar el juego en estado de "aplicar mejora".
E.state=E.newState('normal');
E.state.upgrades=[{id:'up_plus5',uses:2}];
E.state.selected=[{id:E.state.board[1].id,char:E.state.board[1].letter}];
const upgradeTarget=E.state.board[0].id;
const upgradeResult=E.useUpgrade('up_plus5',upgradeTarget);
if(!upgradeResult.ok)throw new Error('No se pudo aplicar la mejora de regresión');
if(E.state.selected.length)throw new Error('La selección queda sucia después de aplicar una Mejora');
const remainingUpgrade=E.state.upgrades.find(x=>x.id==='up_plus5');
if(!remainingUpgrade||remainingUpgrade.uses!==1)throw new Error('Una Mejora multiuso no conserva correctamente su uso restante');

const beforeWords=E.state.words.length;
const firstPlayable=findPlayableFromBoard(E.state,new Set(),4);
if(!firstPlayable)throw new Error('No hay una palabra jugable tras aplicar una Mejora');
E.state.selected=firstPlayable.tiles.map((t,i)=>({id:t.id,char:[...E.strip(firstPlayable.word).toUpperCase()][i]}));
const firstPlayed=E.play(firstPlayable.word,firstPlayable.tiles);
if(!firstPlayed.ok)throw new Error(`La primera palabra después de una Mejora falla: ${firstPlayed.message}`);
if(E.state.selected.length)throw new Error('JUGAR PALABRA no limpia la palabra seleccionada después de una jugada válida');
if(E.state.words.length!==beforeWords+1)throw new Error('La primera palabra tras una Mejora no se contabiliza');

const secondPlayable=findPlayableFromBoard(E.state,new Set(E.state.usedWords),4);
if(!secondPlayable)throw new Error('No hay segunda palabra jugable tras la reposición');
E.state.selected=secondPlayable.tiles.map((t,i)=>({id:t.id,char:[...E.strip(secondPlayable.word).toUpperCase()][i]}));
const secondPlayed=E.play(secondPlayable.word,secondPlayable.tiles);
if(!secondPlayed.ok)throw new Error(`La segunda palabra después de una Mejora falla: ${secondPlayed.message}`);
if(E.state.selected.length)throw new Error('La segunda jugada deja la palabra antigua en pantalla/estado');
if(E.state.words.length!==beforeWords+2)throw new Error('Las nuevas palabras dejan de contabilizarse después de usar una Mejora');

// Todas las Mejoras que apuntan a ficha deben mantener tablero y selección coherentes.
for(const u of C.upgrades){
  E.state=E.newState('normal');
  E.state.upgrades=[{id:u.id,uses:u.uses}];
  E.state.selected=[{id:E.state.board[1].id,char:E.state.board[1].letter}];
  const target=E.state.board.find(t=>t.kind==='normal')||E.state.board[0];
  const result=E.useUpgrade(u.id,target.id);
  if(!result.ok)throw new Error(`La Mejora ${u.id} falla al aplicarse: ${result.message}`);
  if(E.state.selected.length)throw new Error(`La Mejora ${u.id} deja selección residual`);
  if(E.state.board.length!==16)throw new Error(`La Mejora ${u.id} rompe el tamaño del tablero`);
  const q=E.boardPlayability(E.state.board,E.state);
  if(!q.safe||q.len6<1)throw new Error(`La Mejora ${u.id} deja un tablero no jugable: ${JSON.stringify(q)}`);
}

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
const use1=E.useTintaViva(6);
if(!use1.ok||use1.changed!==6)throw new Error('Una carga de Tinta Viva no muta 6 fichas');
if(E.state.tintaCharges!==0)throw new Error('Usar Tinta Viva no consume una carga');
if(E.state.selected.length)throw new Error('Tinta Viva no limpia la palabra seleccionada');
if(E.state.playsLeft!==classroomPlays||E.state.shufflesLeft!==classroomRefreshes)throw new Error('Tinta Viva consume Jugadas o Renovaciones');
if(!E.boardPlayability(E.state.board,E.state).safe)throw new Error('Tinta Viva puede dejar el tablero atascado');
const useEmpty=E.useTintaViva(6);
if(useEmpty.ok)throw new Error('Tinta Viva puede usarse sin cargas');

E.state.ink=2;
if(E.buyTintaViva(3).ok)throw new Error('Se puede comprar Tinta Viva sin suficiente Tinta');
E.state.ink=3;
const bought=E.buyTintaViva(3);
if(!bought.ok||E.state.ink!==0||E.state.tintaCharges!==1)throw new Error('Compra de carga de Tinta Viva incorrecta');

E.state=E.newState('normal');
E.state.specialRound=null;
const ink0=E.state.ink;
if(!E.nextRound())throw new Error('No se pudo avanzar una ronda normal para probar Tinta');
if(E.state.ink!==ink0+1||E.state.lastInkGain!==1)throw new Error('Superar una ronda normal no concede +1 Tinta');
E.state=E.newState('normal');
E.state.specialRound='limit_tiles';
const ink1=E.state.ink;
if(!E.nextRound())throw new Error('No se pudo avanzar una ronda especial para probar Tinta');
if(E.state.ink!==ink1+2||E.state.lastInkGain!==2)throw new Error('Superar una ronda especial no concede +2 Tintas');

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

function assertLongWord(run,label,min=1){
  const q=E.boardPlayability(run.board,run);
  if(q.len6<min||!q.safe)throw new Error(`${label}: no garantiza ${min} palabra(s) de 6+ letras · ${JSON.stringify(q)}`);
}
for(let i=0;i<60;i++){
  const run=E.newState('normal');
  assertLongWord(run,`inicio normal ${i}`);
}

E.state=E.newState('normal');
E.state.shufflesLeft=12;
for(let i=0;i<10;i++){
  if(!E.shuffle())throw new Error('No se pudo renovar para probar ancla larga');
  assertLongWord(E.state,`renovación ${i}`);
}

E.state=E.newState('normal');
const anchorPlayable=findPlayableFromBoard(E.state,new Set(),6);
if(!anchorPlayable)throw new Error('El tablero anclado no contiene ninguna palabra jugable de 6+');
const played=E.play(anchorPlayable.word,anchorPlayable.tiles);
if(!played.ok)throw new Error(`No se pudo jugar una palabra de 6+ del tablero: ${played.message}`);
assertLongWord(E.state,'reposición tras jugar palabra');

E.state=E.newState('normal');
const tinta=E.useTintaViva(6);
if(!tinta.ok)throw new Error('No se pudo usar Tinta Viva en prueba 6+');
assertLongWord(E.state,'Tinta Viva');

E.state=E.newState('normal');
E.state.challenge='exact6c';
E.state.specialRound=null;
E.stabilizeBoard('prueba exacta 6');
assertLongWord(E.state,'reto seis exactas');

E.state=E.newState('normal');
E.state.specialRound='min_six_zero';
E.state.specialData={};
E.stabilizeBoard('prueba ronda larga');
assertLongWord(E.state,'ronda Solo palabras largas',2);

E.state=E.newState('normal');
E.state.specialRound='top_locked';
E.state.specialData={lockedIds:E.state.board.slice(0,4).map(t=>t.id)};
E.stabilizeBoard('prueba fila congelada');
assertLongWord(E.state,'fila congelada');

E.state=E.newState('normal');
E.state.specialRound='first_locked';
E.state.specialData={lockedLetter:'R'};
E.stabilizeBoard('prueba primera letra');
assertLongWord(E.state,'primera letra sellada');

E.state=E.newState('normal');
E.state.specialRound='limit_tiles';
E.state.specialData={};
E.stabilizeBoard('prueba límite');
assertLongWord(E.state,'palabra encogida');

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

console.log(`Word Play: OK · ${C.modifiers.length} modificadores · ${C.gifts.length} recompensas · ${C.challenges.length} desafíos · ${C.achievements.length} logros · responsive/color/core-loop/slots/upgrades/special-rounds/special-tiles/deadlock-rescue/tinta-economy/reward-art/anchor-6plus/upgrade-state-regression/shop-rotation/synergies/linguistic-missions/context-coach/special-activations/build-summary/score-animation/tooltips-special-help/classroom-copy-guard/morphology-esES/fast-bootstrap/fast-exit/bridge/audio/daily OK`);
