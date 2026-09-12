(() => {
  'use strict';

  const root = document.getElementById('app');
  if (!root || root.dataset.ready === '1') return;
  root.dataset.ready = '1';

  const DICTIONARY_URL = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2016/es/es_50k.txt';
  const SAVE_KEY = 'lenguarcade_word_play_save_v1';
  const CAREER_KEY = 'lenguarcade_word_play_career_v1';
  const SETTINGS_KEY = 'lenguarcade_word_play_settings_v1';
  const ACCENTABLE = { A: ['A', 'Á'], E: ['E', 'É'], I: ['I', 'Í'], O: ['O', 'Ó'], U: ['U', 'Ú', 'Ü'] };
  const LETTER_VALUES = { A:1,E:1,I:1,O:1,N:1,R:1,S:1,L:1,U:1,D:2,T:2,B:3,C:3,G:3,M:3,P:3,F:4,H:4,V:4,Y:4,Q:5,Ñ:5,J:7,X:7,Z:9,K:10,W:10 };
  const LETTER_POOL = [
    ['A',13],['E',13],['O',10],['S',8],['R',8],['N',7],['I',7],['L',6],['D',5],['T',5],['U',5],
    ['C',4],['M',3],['P',3],['B',2],['G',2],['V',2],['H',2],['F',1.5],['Y',1.5],['Q',1],['J',1],['Ñ',.8],['X',.5],['Z',.5],['K',.12],['W',.12]
  ];
  const VOWELS = new Set(['A','E','I','O','U']);
  const BLOCKED = new Set(['puta','puto','putas','putos','mierda','gilipollas','coño','joder','follar','follando','polla','pollas','cabrón','cabron','cabrones']);
  const STRICT_ACCENTS = new Map(Object.entries({
    cancion:'canción', canciones:'canciones', camion:'camión', camiones:'camiones', avion:'avión', aviones:'aviones', accion:'acción', acciones:'acciones',
    corazon:'corazón', rincon:'rincón', jardin:'jardín', lapiz:'lápiz', arbol:'árbol', musica:'música', rapido:'rápido', rapida:'rápida', rapidos:'rápidos', rapidas:'rápidas',
    dificil:'difícil', faciles:'fáciles', facil:'fácil', filosofia:'filosofía', religion:'religión', gramatica:'gramática', ortografia:'ortografía', tecnologia:'tecnología',
    linguistica:'lingüística', linguistico:'lingüístico', pinguino:'pingüino', pinguinos:'pingüinos', verguenza:'vergüenza', bilingue:'bilingüe', ciguena:'cigüeña',
    murcielago:'murciélago', dia:'día', dias:'días', despues:'después', aqui:'aquí', alli:'allí', tambien:'también'
  }));
  const FALLBACK_WORDS = `
    casa cosa paso peso piso puso mesa misa masa mapa mano mono mina luna lana lino loma lupa palo pelo pila polo pera puro para pero poro toro tiro tela tila tono tuna taza zona
    amor amigo amiga amigos amigas aula clase libro libros leer leo lees lee poema poemas verso versos rima rimas lengua palabra palabras letra letras frase frases texto textos juego juegos
    gato gata gatos gatas perro perra perros perras pez peces ave aves oso osa osos rana ranas lobo loba lobos vaca toro gallo gallina caballo yegua burro
    agua aire fuego tierra mar río rio lago sol luna nube nubes cielo campo bosque árbol arbol hoja hojas flor flores roca arena isla costa playa monte valle camino caminos
    uno una unos unas dos tres cuatro cinco seis siete ocho nueve diez cien mil primero primera segundo segunda tercero tercera
    ser soy eres es somos sois son fui fue fueron era eran estar estoy estás estas está esta estamos están estan tener tengo tienes tiene tenemos tienen hacer hago haces hace hacemos hacen
    decir digo dices dice decimos dicen ir voy vas va vamos vais van venir vengo vienes viene vienen ver veo ves ve vemos ven dar doy das da damos dan saber sé se sabes sabe sabemos saben
    querer quiero quieres quiere queremos quieren poder puedo puedes puede podemos pueden deber debo debes debe deben poner pongo pones pone ponen salir salgo sales sale salen
    comer como comes come comen beber bebo bebes bebe beben vivir vivo vives vive viven amar amo amas ama aman cantar canto cantas canta cantan jugar juego juegas juega juegan
    estudiar estudio estudias estudia estudian aprender aprendo aprendes aprende aprenden pensar pienso piensas piensa piensan escribir escribo escribes escribe escriben
    rápido rapida rápida rapido rápidos rápidas lento lenta bueno buena buenos buenas malo mala grande grandes pequeño pequeña pequeños pequeñas nuevo nueva viejo vieja feliz felices triste tristes
    mejor mejores peor peores alto alta bajo baja claro clara oscuro oscura fuerte fuertes fácil facil difícil dificil posible imposible
    mañana tarde noche día dia días dias semana mes año años tiempo hora horas momento momentos siempre nunca ahora antes después despues pronto
    aquí aqui allí alli ahí ahi cerca lejos dentro fuera arriba abajo delante detrás detras entre sobre bajo con sin para por desde hasta hacia
    quién quien qué que cómo como cuándo cuando dónde donde cuál cual porque aunque mientras si no sí muy más mas menos también tambien tampoco ya aún aun
    canción cancion música musica corazón corazon camión camion avión avion acción accion razón razon rincón rincon jardín jardin lápiz lapiz útil util fácil facil difícil dificil árbol arbol
    niño niña niños niñas señor señora hombre mujer persona personas gente familia padre madre hermano hermana hijo hija abuelo abuela profesor profesora alumno alumna colegio escuela
    madrid españa español española españoles castellano segovia ciudad pueblo calle plaza parque iglesia historia filosofía filosofia religión religion literatura gramática gramatica ortografía ortografia
    verdad belleza justicia libertad amistad respeto valor valores idea ideas pregunta preguntas respuesta respuestas pensar pensamiento memoria razón razonamiento ciencia arte cine tecnología tecnologia
    extraordinario extraordinaria murciélago murcielago lingüística linguistica pingüino pinguino vergüenza verguenza bilingüe bilingue cigüeña cigueña
  `.trim().split(/\s+/).map(w => w.toLowerCase().normalize('NFC'));

  const targets = [90, 180, 310, 480, 720, 1020, 1400, 1900, 2500, 3300, 4300, 5600];
  const quickTargets = [999999];
  const challenges = [
    { id:'none', name:'Sin condición especial', desc:'Cualquier palabra válida puntúa.', validate: () => true },
    { id:'long', name:'Palabra larga', desc:'Solo puntúan palabras de 5 letras o más.', validate: w => w.length >= 5 },
    { id:'vowel', name:'Empieza por vocal', desc:'La palabra debe empezar por vocal.', validate: w => /^[aeiouáéíóúü]/i.test(w) },
    { id:'no-a', name:'Sin A', desc:'La palabra no puede contener la letra A.', validate: w => !/[aá]/i.test(w) },
    { id:'tilde', name:'Acento', desc:'La palabra debe contener al menos una tilde.', validate: w => /[áéíóú]/i.test(w) },
    { id:'distinct', name:'Sin repetir', desc:'No puedes repetir letras dentro de la palabra.', validate: w => {
      const letters = stripAccents(w).split(''); return new Set(letters).size === letters.length;
    } }
  ];

  const modifiers = [
    {id:'vocalista',name:'Vocalista',rarity:'COMÚN',type:'MODIFICADOR',desc:'×1,5 si la palabra empieza por vocal.',score:(ctx)=> /^[aeiouáéíóúü]/i.test(ctx.word)?{mult:1.5,label:'Vocalista ×1,5'}:null},
    {id:'final_feliz',name:'Final feliz',rarity:'COMÚN',type:'MODIFICADOR',desc:'+12 si termina en vocal.',score:(ctx)=> /[aeiouáéíóúü]$/i.test(ctx.word)?{flat:12,label:'Final feliz +12'}:null},
    {id:'siete',name:'Siete magnífico',rarity:'RARO',type:'MODIFICADOR',desc:'+45 con palabras de exactamente 7 letras.',score:(ctx)=>ctx.word.length===7?{flat:45,label:'Siete magnífico +45'}:null},
    {id:'ocho',name:'Octava maravilla',rarity:'RARO',type:'MODIFICADOR',desc:'×2 con palabras de 8 o más letras.',score:(ctx)=>ctx.word.length>=8?{mult:2,label:'Octava maravilla ×2'}:null},
    {id:'ene',name:'Orgullo de la Ñ',rarity:'ÉPICO',type:'MODIFICADOR',desc:'+30 por cada Ñ utilizada.',score:(ctx)=>{const n=(ctx.word.match(/ñ/gi)||[]).length;return n?{flat:n*30,label:`Ñ española +${n*30}`}:null}},
    {id:'sin_a',name:'Ruta alternativa',rarity:'COMÚN',type:'MODIFICADOR',desc:'×1,6 si no usas A.',score:(ctx)=>!/[aá]/i.test(ctx.word)?{mult:1.6,label:'Ruta alternativa ×1,6'}:null},
    {id:'con_a',name:'A de ataque',rarity:'COMÚN',type:'MODIFICADOR',desc:'+8 por cada A.',score:(ctx)=>{const n=(stripAccents(ctx.word).match(/a/g)||[]).length;return n?{flat:n*8,label:`A de ataque +${n*8}`}:null}},
    {id:'tilde_maestra',name:'Acento maestro',rarity:'RARO',type:'MODIFICADOR',desc:'+25 si la palabra contiene una tilde.',score:(ctx)=>/[áéíóú]/i.test(ctx.word)?{flat:25,label:'Acento maestro +25'}:null},
    {id:'variedad',name:'Coleccionista',rarity:'COMÚN',type:'MODIFICADOR',desc:'+3 por cada letra diferente.',score:(ctx)=>{const n=new Set(stripAccents(ctx.word)).size;return {flat:n*3,label:`Coleccionista +${n*3}`}}},
    {id:'dobles',name:'Efecto eco',rarity:'RARO',type:'MODIFICADOR',desc:'+10 por cada letra repetida.',score:(ctx)=>{const a=stripAccents(ctx.word).split('');const d=a.length-new Set(a).size;return d?{flat:d*10,label:`Efecto eco +${d*10}`}:null}},
    {id:'cinco',name:'Cinco exactas',rarity:'COMÚN',type:'MODIFICADOR',desc:'+24 si la palabra tiene exactamente 5 letras.',score:(ctx)=>ctx.word.length===5?{flat:24,label:'Cinco exactas +24'}:null},
    {id:'larga',name:'Larguísima',rarity:'ÉPICO',type:'MODIFICADOR',desc:'×2,5 con palabras de 9 o más letras.',score:(ctx)=>ctx.word.length>=9?{mult:2.5,label:'Larguísima ×2,5'}:null},
    {id:'consonante',name:'Entrada dura',rarity:'COMÚN',type:'MODIFICADOR',desc:'+15 si empieza por consonante.',score:(ctx)=>!/^[aeiouáéíóúü]/i.test(ctx.word)?{flat:15,label:'Entrada dura +15'}:null},
    {id:'termina_s',name:'Pluralizador',rarity:'COMÚN',type:'MODIFICADOR',desc:'+20 si termina en S.',score:(ctx)=>/s$/i.test(ctx.word)?{flat:20,label:'Pluralizador +20'}:null},
    {id:'qjxz',name:'Letras salvajes',rarity:'RARO',type:'MODIFICADOR',desc:'+18 por cada J, Q, X o Z.',score:(ctx)=>{const n=(stripAccents(ctx.word).match(/[jqxz]/g)||[]).length;return n?{flat:n*18,label:`Letras salvajes +${n*18}`}:null}},
    {id:'creciente',name:'Escalera',rarity:'RARO',type:'MODIFICADOR',desc:'×1,5 si la palabra es más larga que la anterior.',score:(ctx)=>ctx.prevLength&&ctx.word.length>ctx.prevLength?{mult:1.5,label:'Escalera ×1,5'}:null},
    {id:'corta',name:'Minimalismo',rarity:'RARO',type:'MODIFICADOR',desc:'×1,8 con palabras de exactamente 3 letras.',score:(ctx)=>ctx.word.length===3?{mult:1.8,label:'Minimalismo ×1,8'}:null},
    {id:'pares',name:'Número par',rarity:'COMÚN',type:'MODIFICADOR',desc:'+18 si la longitud es par.',score:(ctx)=>ctx.word.length%2===0?{flat:18,label:'Número par +18'}:null},
    {id:'impares',name:'Número impar',rarity:'COMÚN',type:'MODIFICADOR',desc:'+18 si la longitud es impar.',score:(ctx)=>ctx.word.length%2===1?{flat:18,label:'Número impar +18'}:null},
    {id:'vocales3',name:'Trío vocálico',rarity:'RARO',type:'MODIFICADOR',desc:'+35 si contiene al menos 3 vocales.',score:(ctx)=>{const n=(ctx.word.match(/[aeiouáéíóúü]/gi)||[]).length;return n>=3?{flat:35,label:'Trío vocálico +35'}:null}},
    {id:'sin_e',name:'Sin la reina',rarity:'RARO',type:'MODIFICADOR',desc:'×1,7 si no contiene E.',score:(ctx)=>!/[eé]/i.test(ctx.word)?{mult:1.7,label:'Sin la reina ×1,7'}:null},
    {id:'primera_ultima',name:'Círculo',rarity:'ÉPICO',type:'MODIFICADOR',desc:'×2 si empieza y termina con la misma letra.',score:(ctx)=>{const s=stripAccents(ctx.word);return s.length>2&&s[0]===s[s.length-1]?{mult:2,label:'Círculo ×2'}:null}},
    {id:'racha',name:'Racha limpia',rarity:'ÉPICO',type:'MODIFICADOR',desc:'+12 por cada palabra válida consecutiva de la ronda.',score:(ctx)=>ctx.validStreak>1?{flat:ctx.validStreak*12,label:`Racha limpia +${ctx.validStreak*12}`}:null},
    {id:'primera_r',name:'R de récord',rarity:'COMÚN',type:'MODIFICADOR',desc:'+22 si empieza por R.',score:(ctx)=>/^r/i.test(ctx.word)?{flat:22,label:'R de récord +22'}:null}
  ];

  const upgrades = [
    {id:'gold',name:'Ficha dorada',rarity:'RARO',type:'MEJORA DE FICHA',desc:'Convierte una ficha aleatoria del tablero en dorada: su valor base se duplica.',apply:(s)=>upgradeRandomTile(s,'gold')},
    {id:'diamond',name:'Ficha diamante',rarity:'ÉPICO',type:'MEJORA DE FICHA',desc:'Convierte una ficha aleatoria en diamante: su valor base se triplica.',apply:(s)=>upgradeRandomTile(s,'diamond')},
    {id:'echo_tile',name:'Ficha eco',rarity:'RARO',type:'MEJORA DE FICHA',desc:'Una ficha aleatoria puntuará dos veces cuando la uses.',apply:(s)=>upgradeRandomTile(s,'echo')},
    {id:'ink_tile',name:'Ficha de tinta',rarity:'RARO',type:'MEJORA DE FICHA',desc:'Una ficha gana +1 permanente cada vez que se utiliza.',apply:(s)=>upgradeRandomTile(s,'ink')}
  ];

  const gifts = [
    {id:'extra_play',name:'Otra oportunidad',rarity:'RARO',type:'REGALO',desc:'+1 jugada en cada ronda desde ahora.',apply:(s)=>{s.bonuses.extraPlays=(s.bonuses.extraPlays||0)+1;s.playsLeft+=1;}},
    {id:'extra_shuffle',name:'Barajador experto',rarity:'COMÚN',type:'REGALO',desc:'+1 barajado en cada ronda desde ahora.',apply:(s)=>{s.bonuses.extraShuffles=(s.bonuses.extraShuffles||0)+1;s.shufflesLeft+=1;}},
    {id:'score_seed',name:'Ventaja inicial',rarity:'COMÚN',type:'REGALO',desc:'Empieza cada nueva ronda con 30 puntos.',apply:(s)=>{s.bonuses.roundSeed=(s.bonuses.roundSeed||0)+30;}},
    {id:'length_boost',name:'Diccionario grueso',rarity:'RARO',type:'REGALO',desc:'Las bonificaciones por longitud valen un 25 % más.',apply:(s)=>{s.bonuses.lengthMult=(s.bonuses.lengthMult||1)*1.25;}},
    {id:'letter_boost',name:'Tinta concentrada',rarity:'RARO',type:'REGALO',desc:'El valor base de todas las letras aumenta un 20 %.',apply:(s)=>{s.bonuses.letterMult=(s.bonuses.letterMult||1)*1.2;}}
  ];

  const allRewards = [...modifiers, ...upgrades, ...gifts];

  let dictionary = new Set(FALLBACK_WORDS);
  let accentMap = buildAccentMap(dictionary);
  let dictionaryReady = false;
  let state = null;
  let career = loadJSON(CAREER_KEY, {bestScore:0,bestWord:'',gamesPlayed:0,uniqueWords:[]});
  let settings = loadJSON(SETTINGS_KEY, {reduceMotion:false,sound:true});

  const $ = (id) => document.getElementById(id);
  const ui = Object.fromEntries([
    'menuScreen','gameScreen','continueBtn','newGameBtn','quickGameBtn','howToBtn','dictionaryStatus','bestScore','bestWord','gamesPlayed','uniqueWords',
    'modeLabel','roundLabel','challengeLabel','roundScore','targetScore','roundProgress','playsLeft','shufflesLeft','modifierCount','modifierList','wordHint','previewScore',
    'wordBuilder','undoBtn','clearBtn','submitBtn','board','shuffleBtn','feedback','totalScore','wordsPlayed','runBestWord','bestCombo','lastPlayCard','helpBtn','pauseBtn',
    'modalBackdrop','rewardModal','rewardChoices','infoModal','infoTitle','infoBody','closeInfoBtn','pauseModal','reduceMotionToggle','soundToggle','resumeBtn','saveExitBtn','abandonBtn',
    'endModal','endEyebrow','endTitle','endStats','playAgainBtn','endMenuBtn'
  ].map(id => [id, $(id)]));

  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }
  function stripAccents(value) {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ü/g,'u').normalize('NFC');
  }
  function normalizeWord(value) {
    return value.toLowerCase().trim().normalize('NFC').replace(/[^a-záéíóúüñ]/g,'');
  }
  function buildAccentMap(words) {
    const map = new Map();
    for (const word of words) {
      const plain = stripAccents(word);
      if (!map.has(plain)) map.set(plain, []);
      const arr = map.get(plain);
      if (arr.length < 8 && !arr.includes(word)) arr.push(word);
    }
    return map;
  }
  function formatNumber(n) { return Math.round(n).toLocaleString('es-ES'); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffleArray(arr) {
    for (let i=arr.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
    return arr;
  }
  function weightedLetter() {
    const total = LETTER_POOL.reduce((a,[,w])=>a+w,0);
    let r = Math.random()*total;
    for (const [letter, weight] of LETTER_POOL) { r -= weight; if (r <= 0) return letter; }
    return 'A';
  }
  function newTile(letter = weightedLetter()) {
    return { id: globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}_${Math.random()}`, letter, kind:'normal', bonus:0, uses:0 };
  }
  function createBoard() {
    const board = Array.from({length:16},()=>newTile());
    let vowels = board.filter(t=>VOWELS.has(t.letter)).length;
    while (vowels < 5) {
      const idx = board.findIndex(t=>!VOWELS.has(t.letter));
      if (idx < 0) break;
      board[idx] = newTile(pick(['A','E','I','O','U'])); vowels++;
    }
    return board;
  }
  function defaultState(mode='normal') {
    const isQuick = mode === 'quick';
    return {
      version:1, mode, round:1, roundScore:0, totalScore:0,
      target: isQuick ? quickTargets[0] : targets[0],
      playsLeft: isQuick ? 10 : 5,
      shufflesLeft: isQuick ? 3 : 2,
      board:createBoard(), selected:[], modifiers:[], bonuses:{extraPlays:0,extraShuffles:0,roundSeed:0,lengthMult:1,letterMult:1},
      challenge:'none', words:[], usedWords:[], validStreak:0, invalidAttempts:0, longestWord:'', bestPlay:null, bestCombo:1, previousLength:0,
      startedAt:Date.now(), completed:false
    };
  }

  async function loadDictionary() {
    setDictionaryStatus('Cargando 50.000 palabras…');
    try {
      const response = await fetch(DICTIONARY_URL, {cache:'force-cache'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const words = new Set(FALLBACK_WORDS);
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        const raw = line.trim().split(/\s+/)[0];
        if (!raw) continue;
        const word = normalizeWord(raw);
        if (word.length < 3 || word.length > 18) continue;
        if (!/^[a-záéíóúüñ]+$/i.test(word)) continue;
        if (BLOCKED.has(word)) continue;
        words.add(word);
      }
      dictionary = words;
      accentMap = buildAccentMap(words);
      dictionaryReady = true;
      setDictionaryStatus(`${formatNumber(words.size)} palabras listas`);
    } catch (error) {
      dictionaryReady = false;
      setDictionaryStatus(`Modo básico · ${formatNumber(dictionary.size)} palabras`);
      console.warn('Word Play: no se pudo cargar el diccionario ampliado.', error);
    }
  }

  function setDictionaryStatus(text) { ui.dictionaryStatus.textContent = text; }
  function validateWord(word) {
    const w = normalizeWord(word);
    if (w.length < 3) return {ok:false,kind:'length',message:'Necesitas al menos 3 letras.'};
    if (BLOCKED.has(w)) return {ok:false,kind:'blocked',message:'Esa palabra no está disponible en el modo escolar.'};
    const strictAccent = STRICT_ACCENTS.get(w);
    if (strictAccent) return {ok:false,kind:'accent',suggestion:strictAccent,message:`Casi: prueba con «${strictAccent}».`};
    if (dictionary.has(w)) return {ok:true,word:w};
    const alternatives = accentMap.get(stripAccents(w)) || [];
    const accented = alternatives.find(x => /[áéíóúü]/.test(x));
    if (accented && stripAccents(accented) === stripAccents(w)) {
      return {ok:false,kind:'accent',suggestion:accented,message:`Casi: prueba con «${accented}».`};
    }
    return {ok:false,kind:'unknown',message:`No encuentro «${w.toUpperCase()}» en el diccionario.`};
  }

  function currentWord() { return state.selected.map(s=>s.char).join('').toLowerCase(); }
  function lengthBonus(length) {
    const table = {3:0,4:2,5:6,6:12,7:22,8:36,9:54,10:76,11:102,12:132};
    const base = table[length] ?? (length > 12 ? 132 + (length-12)*36 : 0);
    return Math.round(base * (state?.bonuses?.lengthMult || 1));
  }
  function tileBaseScore(tile) {
    let base = LETTER_VALUES[tile.letter] || 1;
    base += tile.bonus || 0;
    if (tile.kind === 'gold') base *= 2;
    if (tile.kind === 'diamond') base *= 3;
    if (tile.kind === 'echo') base *= 2;
    return Math.round(base * (state?.bonuses?.letterMult || 1));
  }
  function calculateScore(word, tiles, includeModifiers=true, preview=false) {
    let letters = tiles.reduce((sum,t)=>sum+tileBaseScore(t),0);
    let bonus = lengthBonus(word.length);
    let subtotal = letters + bonus;
    let multiplier = 1;
    const effects = [];
    if (bonus) effects.push(`Longitud +${bonus}`);
    if (includeModifiers) {
      const ctx = {word, tiles, prevLength:state.previousLength, validStreak:state.validStreak + (preview ? 1 : 0)};
      for (const id of state.modifiers) {
        const mod = modifiers.find(m=>m.id===id);
        if (!mod?.score) continue;
        const result = mod.score(ctx);
        if (!result) continue;
        if (result.flat) subtotal += result.flat;
        if (result.mult) multiplier *= result.mult;
        effects.push(result.label);
      }
    }
    const total = Math.max(0, Math.round(subtotal * multiplier));
    return {letters, bonus, subtotal, multiplier, total, effects};
  }

  function selectTile(tileId) {
    const tile = state.board.find(t=>t.id===tileId);
    if (!tile || state.selected.some(s=>s.id===tileId)) return;
    state.selected.push({id:tile.id,char:tile.letter});
    render();
  }
  function cycleSelected(index) {
    const item = state.selected[index];
    if (!item) return;
    const base = stripAccents(item.char).toUpperCase();
    const cycle = ACCENTABLE[base];
    if (!cycle) return;
    const current = cycle.indexOf(item.char.toUpperCase());
    item.char = cycle[(current + 1) % cycle.length];
    renderWord();
  }
  function undoSelection() { if (state.selected.length) { state.selected.pop(); render(); } }
  function clearSelection() { state.selected = []; render(); }

  function currentChallenge() { return challenges.find(c=>c.id===state.challenge) || challenges[0]; }
  function submitWord() {
    if (!state || state.playsLeft <= 0) return;
    const word = currentWord();
    const validation = validateWord(word);
    if (!validation.ok) {
      state.invalidAttempts += 1;
      state.validStreak = 0;
      showFeedback(validation.message, validation.kind === 'accent' ? 'warn' : 'bad');
      shakeWord();
      saveRun();
      return;
    }
    if (state.usedWords.includes(validation.word)) {
      state.validStreak = 0;
      showFeedback('Ya has utilizado esa palabra en esta partida.', 'warn');
      return;
    }
    const challenge = currentChallenge();
    if (!challenge.validate(validation.word)) {
      state.validStreak = 0;
      showFeedback(`No cumple el reto: ${challenge.desc}`, 'warn');
      return;
    }
    const tiles = state.selected.map(s=>state.board.find(t=>t.id===s.id)).filter(Boolean);
    state.validStreak += 1;
    const scoring = calculateScore(validation.word, tiles, true);
    applyTileUsage(tiles);
    state.roundScore += scoring.total;
    state.totalScore += scoring.total;
    state.playsLeft -= 1;
    state.previousLength = validation.word.length;
    state.words.push(validation.word);
    state.usedWords.push(validation.word);
    if (validation.word.length > state.longestWord.length) state.longestWord = validation.word;
    if (!state.bestPlay || scoring.total > state.bestPlay.score) state.bestPlay = {word:validation.word,score:scoring.total};
    if (scoring.multiplier > state.bestCombo) state.bestCombo = scoring.multiplier;
    state.selected = [];
    replaceUsedTiles(tiles.map(t=>t.id));
    showFeedback(`${validation.word.toUpperCase()} · +${formatNumber(scoring.total)} puntos`, 'good');
    renderLastPlay(validation.word, scoring);
    updateCareerWord(validation.word);
    saveRun();
    render();

    if (state.mode === 'quick') {
      if (state.playsLeft <= 0) setTimeout(()=>finishRun(true), 350);
      return;
    }
    if (state.roundScore >= state.target) {
      setTimeout(openReward, 380);
    } else if (state.playsLeft <= 0) {
      setTimeout(()=>finishRun(false), 380);
    }
  }

  function applyTileUsage(tiles) {
    for (const tile of tiles) {
      tile.uses = (tile.uses || 0) + 1;
      if (tile.kind === 'ink') tile.bonus = (tile.bonus || 0) + 1;
    }
  }
  function replaceUsedTiles(ids) {
    state.board = state.board.map(tile => {
      if (!ids.includes(tile.id)) return tile;
      const replacement = newTile();
      if (tile.kind !== 'normal') {
        replacement.kind = tile.kind;
        replacement.bonus = tile.bonus || 0;
        replacement.uses = tile.uses || 0;
      }
      return replacement;
    });
    ensurePlayableBoard();
  }
  function ensurePlayableBoard() {
    let vowels = state.board.filter(t=>VOWELS.has(t.letter)).length;
    if (vowels < 3) {
      for (let i=0;i<state.board.length && vowels<4;i++) {
        if (!VOWELS.has(state.board[i].letter)) { state.board[i] = newTile(pick(['A','E','I','O','U'])); vowels++; }
      }
    }
  }
  function shuffleBoard() {
    if (!state || state.shufflesLeft <= 0) return;
    const preservedUpgrades = state.board.filter(t=>t.kind!=='normal').map(t=>({kind:t.kind,bonus:t.bonus,uses:t.uses||0}));
    state.board = createBoard();
    preservedUpgrades.forEach((up,i)=>{ if(state.board[i]) {state.board[i].kind=up.kind;state.board[i].bonus=up.bonus;state.board[i].uses=up.uses;} });
    state.selected = [];
    state.shufflesLeft -= 1;
    showFeedback('Fichas renovadas.', 'good');
    saveRun(); render();
  }

  function chooseRoundChallenge(round) {
    if (round % 3 !== 0) return 'none';
    return pick(challenges.filter(c=>c.id!=='none')).id;
  }
  function startNextRound() {
    state.round += 1;
    if (state.round > targets.length) { finishRun(true); return; }
    state.roundScore = state.bonuses.roundSeed || 0;
    state.target = targets[state.round - 1];
    state.playsLeft = 5 + (state.bonuses.extraPlays || 0);
    state.shufflesLeft = 2 + (state.bonuses.extraShuffles || 0);
    state.challenge = chooseRoundChallenge(state.round);
    state.selected = [];
    state.validStreak = 0;
    const persistentUpgrades = state.board.filter(t=>t.kind!=='normal').map(t=>({kind:t.kind,bonus:t.bonus||0,uses:t.uses||0}));
    state.board = createBoard();
    persistentUpgrades.forEach((up,i)=>{
      if (!state.board[i]) return;
      state.board[i].kind = up.kind;
      state.board[i].bonus = up.bonus;
      state.board[i].uses = up.uses;
    });
    saveRun();
    closeModals();
    render();
    showFeedback(state.challenge === 'none' ? 'Nueva ronda. Busca tu mejor palabra.' : `Reto: ${currentChallenge().desc}`, 'good');
  }

  function rewardPool() {
    const owned = new Set(state.modifiers);
    const pool = allRewards.filter(r => !(r.type==='MODIFICADOR' && owned.has(r.id)));
    return shuffleArray([...pool]).slice(0,3);
  }
  function openReward() {
    const options = rewardPool();
    ui.rewardChoices.innerHTML = '';
    options.forEach(reward => {
      const btn = document.createElement('button');
      btn.className = 'reward-card'; btn.type = 'button';
      btn.innerHTML = `<span class="rarity">${reward.rarity}</span><h3>${reward.name}</h3><p>${reward.desc}</p><span class="type">${reward.type}</span>`;
      btn.addEventListener('click',()=>chooseReward(reward));
      ui.rewardChoices.appendChild(btn);
    });
    showModal(ui.rewardModal);
  }
  function chooseReward(reward) {
    if (reward.type === 'MODIFICADOR') state.modifiers.push(reward.id);
    else reward.apply?.(state);
    startNextRound();
  }
  function upgradeRandomTile(s, kind) {
    const candidates = s.board.filter(t=>t.kind==='normal');
    const tile = pick(candidates.length ? candidates : s.board);
    if (tile) tile.kind = kind;
  }

  function updateCareerWord(word) {
    const set = new Set(career.uniqueWords || []); set.add(word); career.uniqueWords = Array.from(set).slice(-3000);
    if (!career.bestWord || word.length > career.bestWord.length) career.bestWord = word;
    saveJSON(CAREER_KEY, career); renderCareer();
  }
  function finishRun(victory) {
    if (!state || state.completed) return;
    state.completed = true;
    career.gamesPlayed = (career.gamesPlayed || 0) + 1;
    career.bestScore = Math.max(career.bestScore || 0, state.totalScore);
    if (state.longestWord && (!career.bestWord || state.longestWord.length > career.bestWord.length)) career.bestWord = state.longestWord;
    saveJSON(CAREER_KEY, career);
    localStorage.removeItem(SAVE_KEY);
    ui.endEyebrow.textContent = victory ? 'PARTIDA COMPLETADA' : `HAS LLEGADO A LA RONDA ${state.round}`;
    ui.endTitle.textContent = victory ? '¡Victoria!' : 'Tu partida';
    ui.endStats.innerHTML = `
      <article><span>Puntuación total</span><strong>${formatNumber(state.totalScore)}</strong></article>
      <article><span>Ronda alcanzada</span><strong>${state.mode==='quick'?'Rápida':`${state.round} / ${targets.length}`}</strong></article>
      <article><span>Palabras creadas</span><strong>${state.words.length}</strong></article>
      <article><span>Palabra más larga</span><strong>${state.longestWord || '—'}</strong></article>
      <article><span>Mejor jugada</span><strong>${state.bestPlay ? `${state.bestPlay.word} · ${formatNumber(state.bestPlay.score)}` : '—'}</strong></article>
      <article><span>Intentos no válidos</span><strong>${state.invalidAttempts}</strong></article>`;
    renderCareer(); showModal(ui.endModal);
  }

  function saveRun() { if (state && !state.completed) saveJSON(SAVE_KEY, state); }
  function resumeSaved() {
    const saved = loadJSON(SAVE_KEY, null);
    if (!saved || saved.completed) return;
    state = saved;
    showGame(); render();
  }
  function startGame(mode='normal') {
    state = defaultState(mode);
    saveRun(); showGame(); render();
    showFeedback(mode==='quick' ? 'Tienes 10 jugadas. Consigue la mayor puntuación posible.' : 'Ronda 1: alcanza el objetivo antes de quedarte sin jugadas.', 'good');
  }
  function showGame() { ui.menuScreen.classList.add('hidden'); ui.gameScreen.classList.remove('hidden'); closeModals(); }
  function showMenu() { ui.gameScreen.classList.add('hidden'); ui.menuScreen.classList.remove('hidden'); closeModals(); renderCareer(); refreshContinue(); }

  function render() {
    if (!state) return;
    const challenge = currentChallenge();
    ui.modeLabel.textContent = state.mode==='quick' ? 'MODO RÁPIDO' : 'MODO NORMAL';
    ui.roundLabel.textContent = state.mode==='quick' ? '10 JUGADAS' : `RONDA ${state.round}`;
    ui.challengeLabel.textContent = state.mode==='quick' ? 'Consigue la máxima puntuación' : challenge.name;
    ui.roundScore.textContent = formatNumber(state.roundScore);
    ui.targetScore.textContent = state.mode==='quick' ? '∞' : formatNumber(state.target);
    ui.roundProgress.style.width = state.mode==='quick' ? '0%' : `${Math.min(100,(state.roundScore/state.target)*100)}%`;
    ui.playsLeft.textContent = state.playsLeft;
    ui.shufflesLeft.textContent = state.shufflesLeft;
    ui.totalScore.textContent = formatNumber(state.totalScore);
    ui.wordsPlayed.textContent = state.words.length;
    ui.runBestWord.textContent = state.bestPlay?.word || '—';
    ui.bestCombo.textContent = `×${Number(state.bestCombo).toLocaleString('es-ES',{maximumFractionDigits:2})}`;
    ui.shuffleBtn.disabled = state.shufflesLeft <= 0;
    renderBoard(); renderWord(); renderModifiers();
  }
  function renderBoard() {
    ui.board.innerHTML='';
    for (const tile of state.board) {
      const btn=document.createElement('button'); btn.type='button'; btn.className=`tile ${tile.kind}`;
      btn.textContent=tile.letter; btn.dataset.value=tileBaseScore(tile); btn.dataset.bonus=tile.bonus || 0;
      btn.setAttribute('aria-label',`${tile.letter}, ${tileBaseScore(tile)} puntos`);
      if (state.selected.some(s=>s.id===tile.id)) btn.classList.add('selected');
      btn.addEventListener('click',()=>selectTile(tile.id));
      ui.board.appendChild(btn);
    }
  }
  function renderWord() {
    ui.wordBuilder.innerHTML='';
    state.selected.forEach((item,index)=>{
      const tile=state.board.find(t=>t.id===item.id); const btn=document.createElement('button'); btn.type='button';
      const base=stripAccents(item.char).toUpperCase(); btn.className=`word-chip ${ACCENTABLE[base]?'vowel':''}`;
      btn.innerHTML=`${item.char.toUpperCase()}<small>${tile ? tileBaseScore(tile) : 0}</small>`;
      btn.title=ACCENTABLE[base]?'Pulsa para cambiar tilde/diéresis':'Pulsa para quitar esta letra';
      btn.addEventListener('click',()=>{ if(ACCENTABLE[base]) cycleSelected(index); else {state.selected.splice(index,1);render();} });
      ui.wordBuilder.appendChild(btn);
    });
    const word=currentWord();
    const tiles=state.selected.map(s=>state.board.find(t=>t.id===s.id)).filter(Boolean);
    const preview=word ? calculateScore(word,tiles,true,true).total : 0;
    ui.previewScore.textContent=`${formatNumber(preview)} pts`;
    ui.wordHint.textContent=word ? word.toUpperCase() : 'Selecciona fichas para formar una palabra';
    ui.submitBtn.disabled=state.selected.length<3 || state.playsLeft<=0;
    ui.undoBtn.disabled=!state.selected.length; ui.clearBtn.disabled=!state.selected.length;
  }
  function renderModifiers() {
    ui.modifierCount.textContent=state.modifiers.length;
    if (!state.modifiers.length) { ui.modifierList.className='modifier-list empty-list'; ui.modifierList.innerHTML='<p>Aún no tienes mejoras.</p>'; return; }
    ui.modifierList.className='modifier-list'; ui.modifierList.innerHTML='';
    state.modifiers.forEach(id=>{ const mod=modifiers.find(m=>m.id===id); if(!mod)return; const card=document.createElement('article'); card.className='modifier-card'; card.innerHTML=`<strong>${mod.name}</strong><span>${mod.desc}</span>`; ui.modifierList.appendChild(card); });
  }
  function renderLastPlay(word, scoring) {
    ui.lastPlayCard.className='last-play-card';
    ui.lastPlayCard.innerHTML=`<div class="played-word">${word.toUpperCase()}</div><div class="played-score">+${formatNumber(scoring.total)} puntos</div><div class="effect-list"><span>Letras: ${formatNumber(scoring.letters)}</span>${scoring.effects.map(e=>`<span>${e}</span>`).join('')}${scoring.multiplier>1?`<span>Multiplicador final ×${scoring.multiplier.toLocaleString('es-ES',{maximumFractionDigits:2})}</span>`:''}</div>`;
  }
  function renderCareer() {
    ui.bestScore.textContent=formatNumber(career.bestScore||0); ui.bestWord.textContent=career.bestWord||'—'; ui.gamesPlayed.textContent=career.gamesPlayed||0; ui.uniqueWords.textContent=(career.uniqueWords||[]).length;
  }
  function refreshContinue() { const saved=loadJSON(SAVE_KEY,null); ui.continueBtn.classList.toggle('hidden',!saved||saved.completed); }
  function showFeedback(message,type='') { ui.feedback.className=`feedback ${type}`.trim(); ui.feedback.textContent=message; }
  function shakeWord() {
    if (settings.reduceMotion) return;
    ui.wordBuilder.animate([{transform:'translateX(0)'},{transform:'translateX(-7px)'},{transform:'translateX(7px)'},{transform:'translateX(0)'}],{duration:220});
  }

  function showModal(modal) { closeModals(); ui.modalBackdrop.classList.remove('hidden'); ui.modalBackdrop.setAttribute('aria-hidden','false'); modal.classList.remove('hidden'); }
  function closeModals() { ui.modalBackdrop.classList.add('hidden'); ui.modalBackdrop.setAttribute('aria-hidden','true'); [ui.rewardModal,ui.infoModal,ui.pauseModal,ui.endModal].forEach(m=>m.classList.add('hidden')); }
  function openHowTo() {
    ui.infoTitle.textContent='Cómo se juega';
    ui.infoBody.innerHTML=`<ol><li>Selecciona fichas hasta formar una palabra de al menos tres letras.</li><li>Las vocales seleccionadas se pueden pulsar para añadir tilde o diéresis.</li><li>Cada letra y la longitud de la palabra aportan puntos.</li><li>Supera el objetivo antes de gastar tus jugadas.</li><li>Tras cada ronda elige una mejora. Las combinaciones entre ellas son la clave para disparar la puntuación.</li></ol><p><strong>Consejo:</strong> no siempre gana la palabra más larga. Construye una estrategia alrededor de tus cartas.</p>`;
    showModal(ui.infoModal);
  }
  function openPause() { ui.reduceMotionToggle.checked=!!settings.reduceMotion; ui.soundToggle.checked=settings.sound!==false; showModal(ui.pauseModal); }

  function handleKeyboard(event) {
    if (!state || ui.gameScreen.classList.contains('hidden') || !ui.modalBackdrop.classList.contains('hidden')) return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (event.key==='Backspace') { event.preventDefault(); undoSelection(); return; }
    if (event.key==='Escape') { openPause(); return; }
    if (event.key==='Enter') { if(!ui.submitBtn.disabled) submitWord(); return; }
    const key=event.key.toUpperCase();
    if (/^[A-ZÑ]$/.test(key)) {
      const tile=state.board.find(t=>t.letter===key&&!state.selected.some(s=>s.id===t.id)); if(tile) selectTile(tile.id);
    }
  }

  ui.newGameBtn.addEventListener('click',()=>startGame('normal'));
  ui.quickGameBtn.addEventListener('click',()=>startGame('quick'));
  ui.continueBtn.addEventListener('click',resumeSaved);
  ui.howToBtn.addEventListener('click',openHowTo); ui.helpBtn.addEventListener('click',openHowTo);
  ui.undoBtn.addEventListener('click',undoSelection); ui.clearBtn.addEventListener('click',clearSelection); ui.submitBtn.addEventListener('click',submitWord); ui.shuffleBtn.addEventListener('click',shuffleBoard);
  ui.pauseBtn.addEventListener('click',openPause); ui.closeInfoBtn.addEventListener('click',closeModals); ui.resumeBtn.addEventListener('click',closeModals);
  ui.saveExitBtn.addEventListener('click',()=>{saveRun();showMenu();});
  ui.abandonBtn.addEventListener('click',()=>{localStorage.removeItem(SAVE_KEY);state=null;showMenu();});
  ui.reduceMotionToggle.addEventListener('change',()=>{settings.reduceMotion=ui.reduceMotionToggle.checked;saveJSON(SETTINGS_KEY,settings);});
  ui.soundToggle.addEventListener('change',()=>{settings.sound=ui.soundToggle.checked;saveJSON(SETTINGS_KEY,settings);});
  ui.playAgainBtn.addEventListener('click',()=>startGame(state?.mode||'normal')); ui.endMenuBtn.addEventListener('click',()=>{state=null;showMenu();});
  document.addEventListener('keydown',handleKeyboard);

  renderCareer(); refreshContinue(); loadDictionary();
})();
