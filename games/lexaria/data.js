window.LexariaData = (() => {
'use strict';

const TYPES = {
  ortografia: { id:'ortografia', name:'Ortografía', icon:'Á', color:'#ff7aa8' },
  verbos: { id:'verbos', name:'Verbos', icon:'V', color:'#65adff' },
  lexico: { id:'lexico', name:'Léxico', icon:'L', color:'#6be3a7' },
  morfologia: { id:'morfologia', name:'Morfología', icon:'M', color:'#ffd45f' },
  sintaxis: { id:'sintaxis', name:'Sintaxis', icon:'S', color:'#bd8cff' },
  literatura: { id:'literatura', name:'Literatura', icon:'✦', color:'#ff9b67' }
};

const RARITIES = {
  common: { name:'Común', weight:[72,60,48,36,25,18], price:3 },
  uncommon: { name:'Infrecuente', weight:[24,29,34,36,34,28], price:4 },
  rare: { name:'Raro', weight:[4,10,16,22,27,30], price:5 },
  epic: { name:'Épico', weight:[0,1,2,5,11,17], price:6 },
  legendary: { name:'Legendario', weight:[0,0,0,1,3,7], price:7 }
};

const creatures = [
  {id:'brontilde',name:'Brontilde',emoji:'Á',types:['ortografia'],rarity:'common',hp:116,damage:24,cooldown:3.4,ability:{name:'Tilde sísmica',text:'Inflige daño y aplica Quemadura de tinta.',kind:'damageBurn',power:22,status:2}},
  {id:'vocalux',name:'Vocalux',emoji:'◉',types:['ortografia'],rarity:'common',hp:96,damage:19,cooldown:2.7,ability:{name:'Vocal abierta',text:'Golpea rápido; si tiene escudo, golpea dos veces.',kind:'doubleIfShield',power:17}},
  {id:'silabris',name:'Silabris',emoji:'◈',types:['ortografia','morfologia'],rarity:'uncommon',hp:128,damage:18,cooldown:4.2,ability:{name:'Separación silábica',text:'Da escudo a todo el equipo y acelera a un aliado.',kind:'teamShieldHaste',power:28,status:10}},
  {id:'dierix',name:'Diérix',emoji:'Ü',types:['ortografia'],rarity:'rare',hp:90,damage:28,cooldown:3.8,ability:{name:'Diéresis prismática',text:'Daño alto que aumenta con cada lanzamiento.',kind:'rampingDamage',power:31}},
  {id:'puntaluz',name:'Puntaluz',emoji:'¿',types:['ortografia','sintaxis'],rarity:'uncommon',hp:118,damage:20,cooldown:3.6,ability:{name:'Puntuación exacta',text:'Cura y protege al equipo.',kind:'healShield',power:31,status:18}},

  {id:'flexion',name:'Flexión',emoji:'⚡',types:['verbos'],rarity:'common',hp:104,damage:22,cooldown:2.9,ability:{name:'Cambio de persona',text:'Ataca y reduce su propio enfriamiento.',kind:'selfHasteHit',power:20,status:12}},
  {id:'conjuro',name:'Conjuro',emoji:'✺',types:['verbos','literatura'],rarity:'uncommon',hp:100,damage:25,cooldown:3.5,ability:{name:'Conjugación encadenada',text:'Lanza dos golpes; el segundo aplica Descarga.',kind:'doubleShock',power:16,status:2}},
  {id:'tempora',name:'Tempora',emoji:'⌛',types:['verbos'],rarity:'rare',hp:112,damage:21,cooldown:4.7,ability:{name:'Salto temporal',text:'Acelera a todos los aliados durante unos segundos.',kind:'teamHaste',power:0,status:18}},
  {id:'subjuntor',name:'Subjuntor',emoji:'☾',types:['verbos','sintaxis'],rarity:'epic',hp:145,damage:29,cooldown:5.4,ability:{name:'Hipótesis imposible',text:'Gran golpe; si el rival está afectado por estados, se multiplica.',kind:'statusPunish',power:44}},
  {id:'gerundra',name:'Gerundra',emoji:'➿',types:['verbos'],rarity:'uncommon',hp:126,damage:16,cooldown:3.1,ability:{name:'Acción continua',text:'Aplica Veneno gramatical de forma acumulativa.',kind:'poison',power:12,status:4}},

  {id:'lexifin',name:'Lexifin',emoji:'✦',types:['lexico'],rarity:'common',hp:92,damage:24,cooldown:3.0,ability:{name:'Palabra precisa',text:'Golpe crítico periódico.',kind:'crit',power:27,status:35}},
  {id:'sinonix',name:'Sinonix',emoji:'≈',types:['lexico'],rarity:'uncommon',hp:110,damage:17,cooldown:3.9,ability:{name:'Doble sentido',text:'Copia parte del último escudo o cura obtenidos.',kind:'echoSupport',power:24}},
  {id:'antonara',name:'Antonara',emoji:'⇄',types:['lexico'],rarity:'uncommon',hp:106,damage:23,cooldown:3.7,ability:{name:'Contraste',text:'Hace más daño cuanto menos vida tenga tu equipo.',kind:'missingHpDamage',power:21}},
  {id:'polisemo',name:'Polisemo',emoji:'◇',types:['lexico','literatura'],rarity:'rare',hp:132,damage:22,cooldown:4.5,ability:{name:'Muchos significados',text:'El efecto cambia entre daño, escudo y curación.',kind:'cycleEffect',power:34}},
  {id:'diccionox',name:'Diccionox',emoji:'▣',types:['lexico'],rarity:'epic',hp:178,damage:18,cooldown:5.3,ability:{name:'Entrada magistral',text:'Al inicio aumenta la vida máxima y después cura.',kind:'maxHpHeal',power:40,status:80}},

  {id:'morfex',name:'Morfex',emoji:'⬡',types:['morfologia'],rarity:'common',hp:122,damage:20,cooldown:3.5,ability:{name:'Raíz y morfemas',text:'Gana escudo y convierte parte en daño.',kind:'shieldStrike',power:20,status:22}},
  {id:'prefijin',name:'Prefijín',emoji:'↦',types:['morfologia'],rarity:'common',hp:88,damage:18,cooldown:2.6,ability:{name:'Antes que nadie',text:'Lanza una habilidad gratuita al empezar.',kind:'startCast',power:16}},
  {id:'sufijara',name:'Sufijara',emoji:'↤',types:['morfologia'],rarity:'uncommon',hp:102,damage:17,cooldown:3.0,ability:{name:'Final productivo',text:'Cada lanzamiento aumenta el daño de todos los aliados.',kind:'teamRamp',power:8}},
  {id:'determik',name:'Determik',emoji:'◆',types:['morfologia','sintaxis'],rarity:'rare',hp:156,damage:15,cooldown:4.1,ability:{name:'Determinación',text:'Protege al equipo y reduce el daño recibido.',kind:'teamGuard',power:36,status:5}},
  {id:'pronomina',name:'Pronómina',emoji:'◎',types:['morfologia'],rarity:'epic',hp:120,damage:24,cooldown:4.4,ability:{name:'Sustitución',text:'Imita la habilidad base de un aliado aleatorio.',kind:'copyAlly',power:0}},

  {id:'sintax',name:'Sintax',emoji:'⌘',types:['sintaxis'],rarity:'common',hp:130,damage:18,cooldown:3.8,ability:{name:'Orden lógico',text:'Da escudo extra a los aliados adyacentes.',kind:'adjacentShield',power:24}},
  {id:'nexora',name:'Nexora',emoji:'∞',types:['sintaxis'],rarity:'uncommon',hp:101,damage:22,cooldown:3.2,ability:{name:'Nexo coordinante',text:'Conecta dos lanzamientos con una Descarga.',kind:'shock',power:20,status:3}},
  {id:'concordia',name:'Concordia',emoji:'♢',types:['sintaxis','morfologia'],rarity:'rare',hp:142,damage:18,cooldown:4.0,ability:{name:'Concordancia',text:'Cura más por cada tipo compartido en el equipo.',kind:'typeHeal',power:24}},
  {id:'subordron',name:'Subordrón',emoji:'⌁',types:['sintaxis'],rarity:'epic',hp:134,damage:35,cooldown:5.1,ability:{name:'Subordinada sustantiva',text:'Ataque lento y enorme que silencia un lanzamiento enemigo.',kind:'heavySilence',power:58,status:1}},
  {id:'oracionix',name:'Oraciónix',emoji:'¶',types:['sintaxis'],rarity:'legendary',hp:190,damage:30,cooldown:5.6,ability:{name:'Periodo perfecto',text:'Daño, escudo y curación a la vez.',kind:'trinity',power:42,status:28}},

  {id:'metafora',name:'Metáfora',emoji:'☄',types:['literatura'],rarity:'common',hp:94,damage:26,cooldown:3.2,ability:{name:'Imagen inesperada',text:'Golpe con posibilidad de duplicar el daño.',kind:'crit',power:28,status:45}},
  {id:'versalia',name:'Versalia',emoji:'♫',types:['literatura'],rarity:'uncommon',hp:105,damage:19,cooldown:2.8,ability:{name:'Ritmo métrico',text:'Acelera a sus vecinos en el tablero.',kind:'adjacentHaste',power:0,status:16}},
  {id:'narragon',name:'Narragón',emoji:'♜',types:['literatura'],rarity:'rare',hp:168,damage:20,cooldown:4.6,ability:{name:'Giro narrativo',text:'Cuando el equipo baja de la mitad, cura una gran cantidad.',kind:'clutchHeal',power:58}},
  {id:'retorix',name:'Retórix',emoji:'✹',types:['literatura','lexico'],rarity:'epic',hp:128,damage:27,cooldown:4.2,ability:{name:'Figura retórica',text:'Aplica al azar Quemadura, Veneno o Descarga.',kind:'randomStatus',power:23,status:4}},
  {id:'caligrifo',name:'Caligrifo',emoji:'✒',types:['literatura','ortografia'],rarity:'legendary',hp:162,damage:31,cooldown:4.7,ability:{name:'Manuscrito total',text:'Cada tipo diferente del equipo potencia esta habilidad.',kind:'diversityBlast',power:28}}
];

const trainers = [
  {id:'filologa',name:'Vera la Filóloga',emoji:'🧭',class:'EQUILIBRIO',powerName:'Revisión completa',power:'Cada día obtienes 1 cambio de mercado gratuito y +1 sesión de entrenamiento.',effect:'balanced'},
  {id:'corrector',name:'Álex el Corrector',emoji:'🖍️',class:'ORTOGRAFÍA',powerName:'Lápiz rojo',power:'Los Lexarios de Ortografía ganan +18% de vida y daño. El primer entrenamiento correcto del día devuelve la sesión.',effect:'ortho'},
  {id:'verbologa',name:'Iria Verbóloga',emoji:'⏱️',class:'VERBOS',powerName:'Tiempo compuesto',power:'Los Lexarios de Verbos lanzan habilidades un 15% más rápido. En los días pares recibes +2 Tinta.',effect:'verbs'},
  {id:'lexicografo',name:'Leo el Lexicógrafo',emoji:'📖',class:'COLECCIÓN',powerName:'Palabra nueva',power:'La primera criatura nueva que descubres cada día cuesta 1 Tinta menos y da +1 sesión.',effect:'lexicon'},
  {id:'estratega',name:'Mara la Estratega',emoji:'♟️',class:'FORMACIÓN',powerName:'Orden de batalla',power:'Los aliados adyacentes reciben +7% de daño y escudo por cada vecino.',effect:'adjacency'},
  {id:'mercader',name:'Nico el Mercader',emoji:'🪙',class:'ECONOMÍA',powerName:'Margen editorial',power:'Los Recursos cuestan 1 menos y los cambios de mercado cuestan 2 en vez de 3.',effect:'economy'},
  {id:'maestra',name:'Clara la Maestra',emoji:'🎓',class:'ENTRENAMIENTO',powerName:'Clase magistral',power:'Empiezas con 5 sesiones al día. Los aciertos perfectos otorgan el doble de mejora permanente.',effect:'teacher'},
  {id:'archivero',name:'Rui el Archivero',emoji:'🗂️',class:'RELIQUIAS',powerName:'Fondo reservado',power:'En cada segunda fusión puedes elegir entre 4 reliquias en lugar de 3.',effect:'relics'}
];

const relics = [
  {id:'pluma_azul',name:'Pluma azul',icon:'🪶',rarity:'common',text:'+8% al daño de todo el equipo.',effect:'teamDamage',value:.08},
  {id:'papel_grueso',name:'Papel grueso',icon:'📜',rarity:'common',text:'+10% a la vida máxima del equipo.',effect:'teamHp',value:.10},
  {id:'marcapaginas',name:'Marcapáginas',icon:'🔖',rarity:'common',text:'Todos lanzan habilidades un 5% más rápido.',effect:'teamSpeed',value:.05},
  {id:'diccionario',name:'Diccionario de bolsillo',icon:'📕',rarity:'uncommon',text:'Los equipos con 4 tipos distintos hacen +15% de daño.',effect:'diversityDamage',value:.15},
  {id:'tintero',name:'Tintero inagotable',icon:'🫙',rarity:'uncommon',text:'+2 Tinta al empezar cada día.',effect:'dailyGold',value:2},
  {id:'regla',name:'Regla tipográfica',icon:'📏',rarity:'uncommon',text:'Los aliados de la fila trasera obtienen +24 de escudo al empezar.',effect:'backShield',value:24},
  {id:'sello',name:'Sello editorial',icon:'🔰',rarity:'rare',text:'Los Lexarios de nivel 2 o superior hacen +20% de daño.',effect:'leveledDamage',value:.20},
  {id:'abaco',name:'Ábaco de sílabas',icon:'🧮',rarity:'rare',text:'Cada 5 lanzamientos aliados, cura un 4% de la vida máxima.',effect:'castHeal',value:.04},
  {id:'goma',name:'Goma imposible',icon:'🧽',rarity:'rare',text:'Una vez por combate evita un golpe que bajaría de 25% de vida.',effect:'fatalGuard',value:.25},
  {id:'lupa',name:'Lupa semántica',icon:'🔎',rarity:'epic',text:'La primera habilidad de cada combate se lanza dos veces.',effect:'firstMulticast',value:1},
  {id:'enciclopedia',name:'Enciclopedia mínima',icon:'📚',rarity:'epic',text:'+4% de daño, vida y velocidad por cada tipo diferente del equipo.',effect:'diversityAll',value:.04},
  {id:'folio_dorado',name:'Folio dorado',icon:'🟨',rarity:'epic',text:'Las variantes cromáticas duplican sus mejoras de entrenamiento.',effect:'chromaticTraining',value:2},
  {id:'rubrica',name:'Rúbrica legendaria',icon:'🏆',rarity:'legendary',text:'Con 6 Lexarios distintos: +30% de vida máxima.',effect:'fullTeamHp',value:.30},
  {id:'manuscrito',name:'Manuscrito perdido',icon:'📜',rarity:'legendary',text:'Tras 20 s, tus habilidades hacen +50% de daño.',effect:'lateDamage',value:.50},
  {id:'campana',name:'Campana de clase',icon:'🔔',rarity:'legendary',text:'Al empezar: todos avanzan un 35% de su primer enfriamiento.',effect:'startHaste',value:.35}
];

const resources = [
  {id:'cuaderno',name:'Cuaderno de ejercicios',icon:'📓',price:3,text:'+2 sesiones de entrenamiento hoy.',effect:'training',value:2},
  {id:'tinta',name:'Tinta fresca',icon:'🫗',price:2,text:'+5 Tinta inmediatamente.',effect:'gold',value:5},
  {id:'vale',name:'Vale de biblioteca',icon:'🎟️',price:3,text:'El próximo Lexario cuesta 2 menos.',effect:'discount',value:2},
  {id:'fichas',name:'Fichas de repaso',icon:'🗃️',price:3,text:'El próximo entrenamiento correcto suma +2 mejoras.',effect:'trainingBonus',value:2},
  {id:'indice',name:'Índice de rarezas',icon:'📑',price:4,text:'El próximo mercado mejora la rareza de sus ofertas.',effect:'rarityBoost',value:1},
  {id:'borrador',name:'Borrador editorial',icon:'🧹',price:2,text:'Obtienes 2 cambios de mercado gratuitos.',effect:'freeReroll',value:2},
  {id:'merito',name:'Sello de mérito',icon:'⭐',price:4,text:'El Lexario seleccionado gana +1 mejora permanente.',effect:'selectedTraining',value:1},
  {id:'relectura',name:'Relectura',icon:'🔁',price:3,text:'Recupera 1 sesión y devuelve 1 Tinta si aciertas el próximo entrenamiento.',effect:'retest',value:1},
  {id:'antologia',name:'Antología',icon:'📔',price:4,text:'Todos los Lexarios de Literatura ganan +1 mejora.',effect:'typeTraining',value:1,type:'literatura'},
  {id:'manual',name:'Manual de estilo',icon:'📘',price:5,text:'El Lexario seleccionado gana +2 mejoras.',effect:'selectedTraining',value:2}
];

const achievements = [
  {id:'first_buy',name:'Primera captura',icon:'◈',desc:'Recluta tu primer Lexario.',metric:'buys',value:1},
  {id:'first_train',name:'Aprender fortalece',icon:'🎓',desc:'Completa un entrenamiento correcto.',metric:'trainingCorrect',value:1},
  {id:'perfect_five',name:'Cinco sin fallo',icon:'✓',desc:'Encadena 5 entrenamientos correctos.',metric:'trainingStreak',value:5},
  {id:'merge_two',name:'Edición revisada',icon:'Ⅱ',desc:'Fusiona un Lexario hasta nivel 2.',metric:'maxLevel',value:2},
  {id:'merge_three',name:'Edición definitiva',icon:'Ⅲ',desc:'Consigue un Lexario de nivel 3.',metric:'maxLevel',value:3},
  {id:'first_win',name:'Primer encuentro',icon:'⚔',desc:'Gana tu primer combate.',metric:'careerWins',value:1},
  {id:'run_five',name:'Media liga',icon:'⑤',desc:'Consigue 5 victorias en una liga.',metric:'runWins',value:5},
  {id:'champion',name:'Campeón de Lexaria',icon:'🏆',desc:'Completa una liga con 10 victorias.',metric:'championships',value:1},
  {id:'flawless',name:'Sin tachones',icon:'✒',desc:'Gana una liga sin perder vidas.',metric:'flawless',value:1},
  {id:'chromatic',name:'Tinta iridiscente',icon:'🌈',desc:'Encuentra una variante cromática.',metric:'chromatics',value:1},
  {id:'collector10',name:'Coleccionista',icon:'▦',desc:'Descubre 10 Lexarios distintos.',metric:'discovered',value:10},
  {id:'collector30',name:'Lexipedia completa',icon:'📚',desc:'Descubre los 30 Lexarios.',metric:'discovered',value:30},
  {id:'all_types',name:'Equipo interdisciplinar',icon:'✺',desc:'Combate con los 6 tipos a la vez.',metric:'typesInTeam',value:6},
  {id:'relics5',name:'Mesa de estudio',icon:'🔰',desc:'Reúne 5 reliquias en una liga.',metric:'relics',value:5},
  {id:'training20',name:'Horas de biblioteca',icon:'📖',desc:'Acumula 20 entrenamientos correctos.',metric:'trainingCorrect',value:20},
  {id:'training100',name:'Catedrático',icon:'🎓',desc:'Acumula 100 entrenamientos correctos.',metric:'trainingCorrect',value:100},
  {id:'big_hit',name:'Argumento demoledor',icon:'💥',desc:'Haz 150 o más de daño con una habilidad.',metric:'biggestHit',value:150},
  {id:'shield200',name:'Bien fundamentado',icon:'🛡',desc:'Alcanza 200 de escudo compartido.',metric:'maxShield',value:200},
  {id:'day12',name:'Maratón editorial',icon:'⌛',desc:'Llega al día 12 en una liga.',metric:'maxDay',value:12},
  {id:'rank6',name:'Mercado de élite',icon:'◆',desc:'Alcanza rango de mercado 6.',metric:'maxRank',value:6}
];

const orthoContexts = [
  ['Completa: «Tiene que ___ una solución».','haber',['haber','a ver','haver','aver'],'En esta perífrasis se usa el infinitivo «haber».'],
  ['Completa: «Vamos ___ qué ocurre».','a ver',['a ver','haber','aver','haver'],'«A ver» equivale aquí a «veamos».'],
  ['Completa: «Ojalá ___ todo bien».','vaya',['vaya','valla','baya','balla'],'«Vaya» es una forma del verbo ir.'],
  ['Completa: «La ___ rodea el jardín».','valla',['valla','vaya','baya','balla'],'Una «valla» es una cerca.'],
  ['Completa: «He ___ todos los ejercicios».','hecho',['hecho','echo','e echo','he echo'],'El participio de hacer es «hecho».'],
  ['Completa: «Yo ___ azúcar al café».','echo',['echo','hecho','he echo','ecco'],'«Echo» es una forma del verbo echar.'],
  ['Completa: «El agua pasa por un ___».','tubo',['tubo','tuvo','tubó','tuvó'],'«Tubo» es el conducto; «tuvo» es del verbo tener.'],
  ['Completa: «Ayer ___ mucha suerte».','tuvo',['tuvo','tubo','tubó','tuvó'],'«Tuvo» es la tercera persona del pretérito de tener.'],
  ['Completa: «Voy a ___ un vídeo».','grabar',['grabar','gravar','grabarh','grabarv'],'«Grabar» significa registrar sonido o imagen.'],
  ['Completa: «El impuesto puede ___ el producto».','gravar',['gravar','grabar','grabár','gravár'],'«Gravar» significa imponer una carga o tributo.'],
  ['Completa: «No quiso ___ el secreto».','revelar',['revelar','rebelar','revelár','rebelár'],'«Revelar» significa descubrir o dar a conocer.'],
  ['Completa: «Decidieron ___ contra la orden».','rebelarse',['rebelarse','revelarse','rebelárse','revelárse'],'«Rebelarse» significa sublevarse u oponerse.'],
  ['Completa: «Caminamos ___ la plaza».','hasta',['hasta','asta','hastá','astha'],'«Hasta» es la preposición que marca el término de un recorrido.'],
  ['Completa: «El toro tenía un ___ rota».','asta',['asta','hasta','astha','hástа'],'«Asta» puede designar el cuerno de un animal.']
];
const accents = [
  ['camión','aguda'],['café','aguda'],['pared','aguda'],['reloj','aguda'],['árbol','llana'],
  ['lápiz','llana'],['casa','llana'],['fácil','llana'],['música','esdrújula'],['pájaro','esdrújula'],
  ['teléfono','esdrújula'],['brújula','esdrújula'],['rápidamente','sobresdrújula']
];
const orthoCorrect = [
  ['¿Cuál está bien escrita?',['excepción','exepción','eccepción','exceción'],0,'«Excepción» se escribe con xc y c.'],
  ['¿Cuál está bien escrita?',['conduje','conduge','condúje','condujé'],0,'El pretérito de conducir forma «conduje».'],
  ['¿Cuál está bien escrita?',['vergüenza','verguenza','vergüensa','berguenza'],0,'La diéresis hace sonar la u en «güe».'],
  ['¿Cuál está bien escrita?',['ahí','hay','ay','aí'],0,'«Ahí» es un adverbio de lugar.'],
  ['¿Cuál está bien escrita?',['hervir','ervir','herbir','ervír'],0,'«Hervir» lleva h y v.'],
  ['¿Cuál está bien escrita?',['extraordinario','estraordinario','extrahordinario','extrahordinario'],0,'«Extraordinario» mantiene el prefijo extra-.']
];

const verbForms = [
  {inf:'hablar',forms:{'presente yo':'hablo','presente tú':'hablas','presente él':'habla','presente nosotros':'hablamos','pretérito yo':'hablé','pretérito él':'habló','imperfecto yo':'hablaba','futuro yo':'hablaré','condicional yo':'hablaría','subjuntivo yo':'hable'}},
  {inf:'comer',forms:{'presente yo':'como','presente tú':'comes','presente él':'come','presente nosotros':'comemos','pretérito yo':'comí','pretérito él':'comió','imperfecto yo':'comía','futuro yo':'comeré','condicional yo':'comería','subjuntivo yo':'coma'}},
  {inf:'vivir',forms:{'presente yo':'vivo','presente tú':'vives','presente él':'vive','presente nosotros':'vivimos','pretérito yo':'viví','pretérito él':'vivió','imperfecto yo':'vivía','futuro yo':'viviré','condicional yo':'viviría','subjuntivo yo':'viva'}},
  {inf:'ser',forms:{'presente yo':'soy','presente tú':'eres','presente él':'es','presente nosotros':'somos','pretérito yo':'fui','pretérito él':'fue','imperfecto yo':'era','futuro yo':'seré','condicional yo':'sería','subjuntivo yo':'sea'}},
  {inf:'estar',forms:{'presente yo':'estoy','presente tú':'estás','presente él':'está','presente nosotros':'estamos','pretérito yo':'estuve','pretérito él':'estuvo','imperfecto yo':'estaba','futuro yo':'estaré','condicional yo':'estaría','subjuntivo yo':'esté'}},
  {inf:'tener',forms:{'presente yo':'tengo','presente tú':'tienes','presente él':'tiene','presente nosotros':'tenemos','pretérito yo':'tuve','pretérito él':'tuvo','imperfecto yo':'tenía','futuro yo':'tendré','condicional yo':'tendría','subjuntivo yo':'tenga'}},
  {inf:'hacer',forms:{'presente yo':'hago','presente tú':'haces','presente él':'hace','presente nosotros':'hacemos','pretérito yo':'hice','pretérito él':'hizo','imperfecto yo':'hacía','futuro yo':'haré','condicional yo':'haría','subjuntivo yo':'haga'}},
  {inf:'poder',forms:{'presente yo':'puedo','presente tú':'puedes','presente él':'puede','presente nosotros':'podemos','pretérito yo':'pude','pretérito él':'pudo','imperfecto yo':'podía','futuro yo':'podré','condicional yo':'podría','subjuntivo yo':'pueda'}},
  {inf:'venir',forms:{'presente yo':'vengo','presente tú':'vienes','presente él':'viene','presente nosotros':'venimos','pretérito yo':'vine','pretérito él':'vino','imperfecto yo':'venía','futuro yo':'vendré','condicional yo':'vendría','subjuntivo yo':'venga'}},
  {inf:'decir',forms:{'presente yo':'digo','presente tú':'dices','presente él':'dice','presente nosotros':'decimos','pretérito yo':'dije','pretérito él':'dijo','imperfecto yo':'decía','futuro yo':'diré','condicional yo':'diría','subjuntivo yo':'diga'}}
];

const morphology = [
  ['mesa','sustantivo'],['feliz','adjetivo'],['correr','verbo'],['rápidamente','adverbio'],['aquella','determinante'],
  ['nosotros','pronombre'],['desde','preposición'],['aunque','conjunción'],['bosque','sustantivo'],['enorme','adjetivo'],
  ['ayer','adverbio'],['saltaron','verbo'],['mis','determinante'],['ella','pronombre'],['contra','preposición'],['porque','conjunción']
];
const synonymPairs = [
  ['alegre','contento'],['rápido','veloz'],['bonito','hermoso'],['enorme','gigantesco'],['comenzar','empezar'],
  ['terminar','acabar'],['valiente','intrépido'],['enfadado','irritado'],['escaso','insuficiente'],['calmado','sereno'],
  ['hablar','conversar'],['mirar','observar'],['ayudar','auxiliar'],['elegir','escoger'],['ocultar','esconder']
];
const antonymPairs = [
  ['claro','oscuro'],['subir','bajar'],['generoso','tacaño'],['ancho','estrecho'],['valiente','cobarde'],
  ['aceptar','rechazar'],['ruidoso','silencioso'],['cercano','lejano'],['vacío','lleno'],['duro','blando'],
  ['recordar','olvidar'],['encender','apagar']
];
const syntaxQuestions = [
  ['En «La gata duerme sobre el sofá», ¿cuál es el sujeto?',['La gata','duerme','sobre el sofá','el sofá'],0,'El sujeto es «La gata».'],
  ['En «Llegaron tarde mis amigos», ¿cuál es el sujeto?',['tarde','Llegaron','mis amigos','No hay sujeto'],2,'El sujeto pospuesto es «mis amigos».'],
  ['En «Mañana iremos al museo», el sujeto está…',['expreso','omitido','en el predicado nominal','en «mañana»'],1,'El sujeto se omite y se recupera por la forma verbal: nosotros.'],
  ['¿Qué palabra funciona como núcleo del predicado en «El perro ladra mucho»?',['perro','mucho','ladra','El'],2,'El verbo «ladra» es el núcleo del predicado.'],
  ['En «Mi hermano es médico», el predicado es…',['verbal','nominal','adverbial','sin núcleo'],1,'Con «ser» como verbo copulativo y atributo, es predicado nominal.'],
  ['¿Qué nexo expresa causa?',['porque','aunque','pero','o'],0,'«Porque» introduce normalmente una causa.'],
  ['¿Qué nexo expresa oposición?',['y','pero','ni','porque'],1,'«Pero» es una conjunción adversativa.'],
  ['¿Cuál contiene una enumeración correcta?',['Trajo pan, leche, fruta y agua.','Trajo, pan leche fruta y agua.','Trajo pan leche, fruta y agua','Trajo: pan leche fruta y agua'],0,'Los elementos de una enumeración se separan con comas.']
];
const literatureQuestions = [
  ['«Tus ojos son dos luceros» es…',['metáfora','hipérbole','anáfora','onomatopeya'],0,'Identifica una realidad con otra sin nexo comparativo.'],
  ['«Corre como el viento» es…',['comparación','metáfora','personificación','anáfora'],0,'Aparece el nexo comparativo «como».'],
  ['«El viento susurraba entre los árboles» contiene…',['personificación','hipérbaton','elipsis','antítesis'],0,'Se atribuye al viento una acción humana.'],
  ['«Te lo he dicho un millón de veces» es…',['hipérbole','metonimia','símil','epíteto'],0,'Es una exageración intencionada.'],
  ['«Temprano levantó la muerte el vuelo, / temprano madrugó la madrugada…» ejemplifica…',['anáfora','onomatopeya','paradoja','asíndeton'],0,'Se repite «temprano» al comienzo.'],
  ['¿Cuál es un género narrativo?',['novela','elegía','oda','soneto'],0,'La novela pertenece al género narrativo.'],
  ['Un soneto clásico tiene normalmente…',['14 versos','8 versos','10 versos','20 versos'],0,'El soneto clásico consta de 14 versos.'],
  ['¿Qué narrador conoce pensamientos y sentimientos de todos los personajes?',['omnisciente','testigo','protagonista','objetivo'],0,'El narrador omnisciente conoce interioridad y hechos.']
];

function xmur3(str){
  let h=1779033703^String(str).length;
  for(let i=0;i<String(str).length;i++){h=Math.imul(h^String(str).charCodeAt(i),3432918353);h=h<<13|h>>>19;}
  return function(){h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return (h^h>>>16)>>>0;};
}
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function seeded(seed){const h=xmur3(String(seed));return mulberry32(h());}
function pick(arr,rng=Math.random){return arr[Math.floor(rng()*arr.length)];}
function shuffle(arr,rng=Math.random){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function choices(correct,pool,rng){
  const others=shuffle(pool.filter(x=>x!==correct),rng).slice(0,3);
  const answers=shuffle([correct].concat(others),rng);
  return {answers,correct:answers.indexOf(correct)};
}
function qOrthography(rng){
  const mode=Math.floor(rng()*3);
  if(mode===0){
    const q=pick(orthoContexts,rng);
    const zipped=q[2].map((x,i)=>({x,i}));
    const random=shuffle(zipped,rng);
    return {category:'ortografia',prompt:q[0],answers:random.map(v=>v.x),correct:random.findIndex(v=>v.x===q[1]),explanation:q[3]};
  }
  if(mode===1){
    const item=pick(accents,rng);
    const ch=choices(item[1],['aguda','llana','esdrújula','sobresdrújula'],rng);
    return {category:'ortografia',prompt:'¿Cómo se clasifica la palabra «'+item[0]+'» según su sílaba tónica?',answers:ch.answers,correct:ch.correct,explanation:'«'+item[0]+'» es una palabra '+item[1]+'.'};
  }
  const q=pick(orthoCorrect,rng);
  const zipped=q[1].map((x,i)=>({x,i}));
  const randomized=shuffle(zipped,rng);
  return {category:'ortografia',prompt:q[0],answers:randomized.map(v=>v.x),correct:randomized.findIndex(v=>v.i===q[2]),explanation:q[3]};
}
function qVerbs(rng){
  const v=pick(verbForms,rng), keys=Object.keys(v.forms), key=pick(keys,rng), correct=v.forms[key];
  const pool=[];
  verbForms.forEach(x=>Object.values(x.forms).forEach(f=>pool.push(f)));
  const ch=choices(correct,pool,rng);
  return {category:'verbos',prompt:'Conjuga «'+v.inf+'» en '+key+'.',answers:ch.answers,correct:ch.correct,explanation:'La forma correcta es «'+correct+'».'};
}
function qMorphology(rng){
  const item=pick(morphology,rng);
  const categories=['sustantivo','adjetivo','verbo','adverbio','determinante','pronombre','preposición','conjunción'];
  const ch=choices(item[1],categories,rng);
  return {category:'morfologia',prompt:'¿Qué clase de palabra es «'+item[0]+'»?',answers:ch.answers,correct:ch.correct,explanation:'«'+item[0]+'» funciona aquí como '+item[1]+'.'};
}
function qLexicon(rng){
  const isSyn=rng()<.55, source=isSyn?synonymPairs:antonymPairs, item=pick(source,rng), correct=item[1];
  const pool=source.map(x=>x[1]).concat((isSyn?antonymPairs:synonymPairs).map(x=>x[1]));
  const ch=choices(correct,pool,rng);
  return {category:'lexico',prompt:'¿Cuál es un '+(isSyn?'sinónimo':'antónimo')+' adecuado de «'+item[0]+'»?',answers:ch.answers,correct:ch.correct,explanation:'«'+correct+'» es un '+(isSyn?'sinónimo':'antónimo')+' de «'+item[0]+'».'};
}
function qStatic(arr,category,rng){
  const q=pick(arr,rng), zipped=q[1].map((x,i)=>({x,i})), random=shuffle(zipped,rng);
  return {category,prompt:q[0],answers:random.map(v=>v.x),correct:random.findIndex(v=>v.i===q[2]),explanation:q[3]};
}
function question(category,seed){
  const rng=seed===undefined?Math.random:seeded(seed);
  if(category==='ortografia')return qOrthography(rng);
  if(category==='verbos')return qVerbs(rng);
  if(category==='morfologia')return qMorphology(rng);
  if(category==='lexico')return qLexicon(rng);
  if(category==='sintaxis')return qStatic(syntaxQuestions,'sintaxis',rng);
  if(category==='literatura')return qStatic(literatureQuestions,'literatura',rng);
  return question(pick(Object.keys(TYPES),rng),seed===undefined?undefined:String(seed)+'x');
}

function creature(id){return creatures.find(x=>x.id===id)||null;}
function trainer(id){return trainers.find(x=>x.id===id)||null;}
function relic(id){return relics.find(x=>x.id===id)||null;}
function resource(id){return resources.find(x=>x.id===id)||null;}
function rarityPrice(rarity){return RARITIES[rarity]?.price||3;}

return {
  TYPES,RARITIES,creatures,trainers,relics,resources,achievements,
  creature,trainer,relic,resource,rarityPrice,question,seeded,pick,shuffle
};
})();