window.WordPlayContent = (() => {
  const modifiers = [
    ['vocalista','Vocalista','common','Empieza por vocal','startsVowel','mult',1.5],
    ['consonante','Entrada fuerte','common','Empieza por consonante','startsConsonant','flat',12],
    ['punto_final','Punto final','common','La última letra es vocal','endsVowel','flat',14],
    ['cierre_duro','Cierre duro','common','Termina en consonante','endsConsonant','flat',12],
    ['cinco','Quinta esencia','common','Palabras de 5 letras','len5','flat',20],
    ['seis','Media docena','common','Palabras de 6 letras','len6','flat',28],
    ['siete','Siete magnífico','uncommon','Palabras de 7 letras','len7','flat',42],
    ['ocho','Octava mayor','rare','Palabras de 8 letras','len8','flat',58],
    ['larga','Largo recorrido','common','7 letras o más','min7','mult',1.3],
    ['mini','Precisión','common','Exactamente 4 letras','len4','flat',16],
    ['tilde','Acento agudo','uncommon','Contiene tilde o diéresis','accent','mult',1.55],
    ['ene','La letra española','rare','Contiene Ñ','ntilde','flat',45],
    ['sin_a','Sin A','uncommon','No contiene A','noA','mult',1.45],
    ['sin_e','Sin E','uncommon','No contiene E','noE','mult',1.4],
    ['sin_o','Sin O','uncommon','No contiene O','noO','mult',1.35],
    ['diversidad','Coleccionista','common','Cada letra distinta','always','uniqueFlat',2],
    ['repeticion','Eco léxico','uncommon','Por cada letra repetida','always','repeatFlat',8],
    ['raras','Cazador de rarezas','uncommon','J, Ñ, Q, X, Z, K o W','rareLetter','rareFlat',10],
    ['jota','J de jackpot','rare','Contiene J','containsJ','mult',1.7],
    ['zeta','Última letra','rare','Contiene Z','containsZ','mult',1.8],
    ['equis','Factor X','rare','Contiene X','containsX','flat',48],
    ['cu','Q de calidad','uncommon','Contiene Q','containsQ','flat',34],
    ['doble_vocal','Doble vocal','uncommon','Dos vocales seguidas','doubleVowel','flat',32],
    ['doble_consonante','Muro consonántico','uncommon','Tres consonantes seguidas','tripleConsonant','flat',38],
    ['escalera','Escalera','rare','Más larga que la anterior','longerThanPrev','mult',1.45],
    ['descenso','Contracorriente','uncommon','Más corta que la anterior','shorterThanPrev','flat',25],
    ['racha3','En racha','uncommon','3 aciertos seguidos o más','streak3','mult',1.3],
    ['racha5','Imparable','epic','5 aciertos seguidos o más','streak5','mult',1.65],
    ['primera','Primer golpe','common','Primera palabra de la ronda','firstPlay','flat',25],
    ['ultima','Último recurso','uncommon','Última jugada disponible','lastPlay','mult',1.5],
    ['par','Par perfecto','common','Longitud par','evenLength','flat',18],
    ['impar','Impar','common','Longitud impar','oddLength','flat',16],
    ['dos_a','A por partida doble','uncommon','Dos A o más','twoA','flat',28],
    ['dos_e','Energía E','uncommon','Dos E o más','twoE','flat',28],
    ['vocales3','Trío vocálico','rare','Tres vocales o más','threeVowels','mult',1.4],
    ['consonantes5','Fortaleza','rare','Cinco consonantes o más','fiveConsonants','mult',1.45],
    ['sin_repetir','Pieza única','rare','Ninguna letra repetida','allUnique','mult',1.5],
    ['palindromo','Espejo','legendary','Palíndromo de 3+ letras','palindrome','mult',3],
    ['inicio_m','M de maestro','common','Empieza por M','startsM','flat',18],
    ['inicio_p','P de palabra','common','Empieza por P','startsP','flat',18],
    ['final_s','Pluralista','common','Termina en S','endsS','flat',15],
    ['final_n','N final','common','Termina en N','endsN','flat',15],
    ['vocal_inicio_fin','Arco vocálico','rare','Empieza y termina por vocal','vowelEdges','mult',1.55],
    ['misma_punta','Simetría','epic','Misma letra al principio y al final','sameEdges','mult',1.8],
    ['alfabeto','Alfabético','epic','6+ letras distintas','sixUnique','flat',65],
    ['economia','Economía verbal','rare','4 letras o menos','max4','mult',1.7],
    ['decena','Decatlón','epic','10 letras o más','min10','mult',1.9],
    ['perfecta','Palabra perfecta','legendary','8+ letras y sin repetir letras','perfectWord','mult',2.2],
    ['acentuada_larga','Orfebrería','epic','7+ letras con tilde','accentLong','mult',1.85],
    ['rare_combo','Colección exótica','legendary','Dos letras raras o más','twoRare','mult',2.1],
    ['alquimista','Alquimista','rare','Cada ficha especial suma +16','specialTile','specialFlat',16],
    ['joyero','Joyero','epic','Dos fichas especiales o más','twoSpecialTiles','mult',1.65],
    ['cazajefes','Especialista','rare','Durante una ronda especial','specialRound','mult',1.35],
    ['ortografo','Ortógrafo','epic','Tilde y letra rara en la misma palabra','accentAndRare','mult',1.75],
    ['cuatro_vocales','Coro vocálico','rare','Cuatro vocales o más','fourVowels','mult',1.45],
    ['sello_real','Sello real','legendary','Usa una ficha corona','crownTile','mult',1.8],
    ['nueve','Todo o nada','epic','Palabras de 9 letras o más','min9','mult',1.75],
    ['triple_rara','Trinidad exótica','legendary','Tres letras raras o más','threeRare','mult',2.4],
    ['doble_especial','Doble carga','uncommon','Dos fichas especiales o más','twoSpecialTiles','flat',50],
    ['sin_vocal_repetida','Vocales limpias','rare','No repite ninguna vocal','uniqueVowels','mult',1.4]
  ].map(([id,name,rarity,desc,condition,effect,value])=>({id,name,rarity,desc,condition,effect,value,type:'modifier'}));

  const gifts = [
    {id:'extra_play',name:'Segundo intento',rarity:'common',desc:'+1 jugada permanente por ronda.',type:'gift',effect:'extraPlay',value:1},
    {id:'extra_shuffle',name:'Mano nueva',rarity:'common',desc:'+1 barajado permanente por ronda.',type:'gift',effect:'extraShuffle',value:1},
    {id:'reroll',name:'Cambio de planes',rarity:'common',desc:'+1 reroll de recompensas.',type:'gift',effect:'reroll',value:1},
    {id:'length_up',name:'Amante de lo largo',rarity:'rare',desc:'+25% a todas las bonificaciones de longitud.',type:'gift',effect:'lengthMult',value:.25},
    {id:'letters_up',name:'Tipografía premium',rarity:'rare',desc:'+20% al valor base de todas las letras.',type:'gift',effect:'letterMult',value:.2},
    {id:'start_bonus',name:'Salida lanzada',rarity:'uncommon',desc:'+30 puntos al empezar cada ronda.',type:'gift',effect:'roundSeed',value:30},
    {id:'gold_tile',name:'Ficha dorada',rarity:'uncommon',desc:'Convierte una ficha aleatoria en Dorada. Si juegas 2 o más Doradas juntas, multiplican el Word Score por su número.',type:'tile',effect:'gold'},
    {id:'diamond_tile',name:'Ficha diamante',rarity:'rare',desc:'Convierte una ficha aleatoria en Diamante. Gana +5 de valor cada vez que permanece sin jugar tras una palabra.',type:'tile',effect:'diamond'},
    {id:'echo_tile',name:'Ficha eco',rarity:'rare',desc:'Una ficha suma dos veces su valor.',type:'tile',effect:'echo'},
    {id:'ink_tile',name:'Ficha tinta',rarity:'uncommon',desc:'Gana +1 de valor cada vez que se usa.',type:'tile',effect:'ink'},
    {id:'crown_tile',name:'Ficha corona',rarity:'epic',desc:'Esta ficha añade +25 al jugarla.',type:'tile',effect:'crown'},
    {id:'volatile_tile',name:'Ficha explosiva',rarity:'epic',desc:'Si se usa, multiplica ×1,35 la palabra.',type:'tile',effect:'volatile'},
    {id:'heal_shuffle',name:'Reorganización',rarity:'common',desc:'Recupera 2 barajados inmediatamente.',type:'gift',effect:'instantShuffle',value:2},
    {id:'heal_play',name:'Prórroga',rarity:'rare',desc:'Gana 1 jugada extra ahora y en esta ronda.',type:'gift',effect:'instantPlay',value:1},
    {id:'score_seed',name:'Fondo de puntos',rarity:'uncommon',desc:'+60 puntos inmediatos en la siguiente ronda.',type:'gift',effect:'nextRoundSeed',value:60},
    {id:'lexical_xp',name:'Biblioteca privada',rarity:'rare',desc:'+40 XP léxico al terminar la partida.',type:'gift',effect:'careerXp',value:40},
    {id:'boss_play',name:'Salvoconducto',rarity:'rare',desc:'+1 jugada extra al empezar cada ronda especial.',type:'gift',effect:'bossPlay',value:1},
    {id:'rare_luck',name:'Ojo del coleccionista',rarity:'epic',desc:'Mejora las probabilidades de recompensas raras.',type:'gift',effect:'rareLuck',value:1},
    {id:'refresh_pack',name:'Bolsa de renovación',rarity:'common',desc:'+4 Renovaciones inmediatamente.',type:'gift',effect:'instantShuffle',value:4},
    {id:'gift_diamond',name:'Dos diamantes',rarity:'uncommon',desc:'Añade 2 Diamantes a la reserva. Cada Diamante gana +5 de valor cuando no lo usas en una palabra.',type:'bagTile',effect:'diamond',count:2},
    {id:'gift_dot',name:'Dos puntos',rarity:'uncommon',desc:'Añade 2 fichas Punto a la reserva. Si una ficha Punto cierra la palabra, duplica el Word Score.',type:'bagTile',effect:'dot',count:2},
    {id:'gift_emerald',name:'Dos esmeraldas',rarity:'uncommon',desc:'Añade 2 Esmeraldas a la reserva. Cada Esmeralda tiene un 25% de probabilidad de puntuar ×5.',type:'bagTile',effect:'emerald',count:2},
    {id:'gift_wild',name:'Dos comodines',rarity:'uncommon',desc:'Añade 2 Comodines a la reserva. Pueden representar cualquier letra, pero su valor propio es 0.',type:'bagTile',effect:'wild',count:2},
    {id:'gift_potion',name:'Poción de jugadas',rarity:'rare',desc:'Añade una Poción a la reserva. Al jugarla, su valor se convierte en Jugadas extra y después se rompe.',type:'bagTile',effect:'potion',count:1},
    {id:'gift_glass',name:'Cristales',rarity:'rare',desc:'Añade 2 Cristales a la reserva. Son copias temporales y se rompen al jugarlas.',type:'bagTile',effect:'glass',count:2},
    {id:'gift_mirror',name:'Espejos',rarity:'rare',desc:'Añade 2 Espejos a la reserva. Copian la letra y el valor de la ficha colocada a su izquierda.',type:'bagTile',effect:'mirror',count:2},
    {id:'gift_bang',name:'Exclamación',rarity:'rare',desc:'Añade una Exclamación a la reserva. Debe cerrar la jugada y vale la suma de las fichas que dejas en el tablero.',type:'bagTile',effect:'bang',count:1},
    {id:'gift_plus',name:'Conector',rarity:'legendary',desc:'Añade un Conector a la reserva. Permite unir y puntuar dos palabras válidas en una sola jugada.',type:'bagTile',effect:'plus',count:1}
  ];


  const upgrades = [
    {id:'up_hold',name:'Reserva una ficha',rarity:'common',desc:'Elige una ficha: se mantiene y renueva el resto del tablero.',type:'upgrade',effect:'holdRefresh',uses:3},
    {id:'up_vowel',name:'Cambio vocálico',rarity:'common',desc:'Cambia una ficha por una vocal nueva.',type:'upgrade',effect:'swapVowel',uses:4},
    {id:'up_consonant',name:'Cambio consonántico',rarity:'common',desc:'Cambia una ficha por una consonante común.',type:'upgrade',effect:'swapConsonant',uses:4},
    {id:'up_gold',name:'Baño de oro',rarity:'common',desc:'Convierte una ficha en Dorada. Con 2 o más Doradas en la misma palabra, el Word Score se multiplica por su número.',type:'upgrade',effect:'makeGold',uses:2},
    {id:'up_emerald',name:'Esmeralda',rarity:'common',desc:'Convierte una ficha en Esmeralda. Cada vez que la juegas tiene un 25% de probabilidad de puntuar ×5.',type:'upgrade',effect:'makeEmerald',uses:2},
    {id:'up_dot',name:'Punto rojo',rarity:'common',desc:'Convierte una ficha en Punto. Si esa ficha es la última de la palabra, duplica el Word Score.',type:'upgrade',effect:'makeDot',uses:3},
    {id:'up_duplicate',name:'Duplicador',rarity:'uncommon',desc:'Duplica una ficha y añade una copia a la reserva especial.',type:'upgrade',effect:'duplicate',uses:2},
    {id:'up_glass',name:'Copia de cristal',rarity:'uncommon',desc:'Crea una copia de cristal de la ficha. Se rompe al jugarla.',type:'upgrade',effect:'glass',uses:3},
    {id:'up_destroy_play',name:'Sacrificio',rarity:'uncommon',desc:'Destruye una ficha y gana 1 jugada.',type:'upgrade',effect:'destroyPlay',uses:2},
    {id:'up_diamond',name:'Diamante',rarity:'uncommon',desc:'Convierte una ficha en Diamante. Gana +5 de valor cada vez que termina una palabra sin haberlo jugado.',type:'upgrade',effect:'makeDiamond',uses:2},
    {id:'up_plus5',name:'Imprenta +5',rarity:'rare',desc:'Añade +5 permanentemente al valor de una ficha.',type:'upgrade',effect:'addScore',value:5,uses:2},
    {id:'up_random',name:'Tinta imprevisible',rarity:'rare',desc:'Añade entre +1 y +10 permanentemente a una ficha.',type:'upgrade',effect:'randomScore',uses:2},
    {id:'up_wild',name:'Comodín',rarity:'rare',desc:'Convierte una ficha en Comodín. Puede representar cualquier letra, aunque su valor propio es 0.',type:'upgrade',effect:'makeWild',uses:1},
    {id:'up_random_special',name:'Transmutación',rarity:'rare',desc:'Convierte una ficha en un tipo especial al azar.',type:'upgrade',effect:'randomSpecial',uses:2},
    {id:'up_plus10',name:'Imprenta +10',rarity:'legendary',desc:'Añade +10 permanentemente al valor de una ficha.',type:'upgrade',effect:'addScore',value:10,uses:2}
  ];

  const shopItems = [
    {id:'shop_play',name:'Jugada extra',desc:'+1 Jugada ahora mismo.',cost:4,effect:'play',amount:1,artKey:'art-play'},
    {id:'shop_refresh',name:'Renovación',desc:'+1 Renovación para cambiar el tablero.',cost:3,effect:'refresh',amount:1,artKey:'art-refresh'},
    {id:'shop_reroll',name:'Reroll',desc:'+1 cambio de opciones de recompensa.',cost:5,effect:'reroll',amount:1,artKey:'art-refresh'},
    {id:'shop_tinta',name:'Carga de Tinta Viva',desc:'+1 uso de Tinta Viva.',cost:6,effect:'tinta',amount:1,artKey:'art-transmute'},
    {id:'shop_letter',name:'Letra a la carta',desc:'Elige una letra y añádela a la reserva.',cost:5,effect:'letter',amount:1,artKey:'art-vowels'},
    {id:'shop_wild',name:'Comodín',desc:'Añade un Comodín a la reserva. Puede representar cualquier letra, pero vale 0 puntos.',cost:7,effect:'reserveTile',tileKind:'wild',amount:1,artKey:'art-wild'},
    {id:'shop_gold',name:'Ficha Dorada',desc:'Añade una Dorada a la reserva. Con 2 o más Doradas juntas, multiplican el Word Score.',cost:8,effect:'reserveTile',tileKind:'gold',amount:1,artKey:'art-gold'},
    {id:'shop_diamond',name:'Ficha Diamante',desc:'Añade un Diamante a la reserva. Gana +5 de valor cuando sobrevive a una palabra sin jugarse.',cost:10,effect:'reserveTile',tileKind:'diamond',amount:1,artKey:'art-diamond'},
    {id:'shop_upgrade',name:'Mejora misteriosa',desc:'Compra una Mejora aleatoria si tienes hueco.',cost:9,effect:'upgrade',amount:1,artKey:'art-transmute'}
  ];

  const specialRounds = [
    {id:'limit_tiles',title:'Palabra encogida',desc:'Empiezas pudiendo usar 6 fichas; el límite aumenta tras cada palabra.',effect:'maxTiles'},
    {id:'first_locked',title:'Primera letra sellada',desc:'Todas las palabras deben empezar por la letra indicada.',effect:'firstLocked'},
    {id:'specials_off',title:'Magia anulada',desc:'Las fichas especiales no activan sus poderes durante esta ronda.',effect:'specialsOff'},
    {id:'top_locked',title:'Fila congelada',desc:'Las cuatro fichas superiores quedan bloqueadas durante 4 palabras.',effect:'topLocked'},
    {id:'auto_refresh',title:'Tablero inestable',desc:'Tras cada palabra se renueva el tablero; renovar manualmente cuesta 1 jugada.',effect:'autoRefresh'},
    {id:'vowels_zero',title:'Silencio vocálico',desc:'Las vocales puntúan 0 en Word Score.',effect:'vowelsZero'},
    {id:'highlighted',title:'Ficha obligatoria',desc:'Debes usar la ficha destacada o perderás 2 jugadas extra.',effect:'highlighted'},
    {id:'double_play',title:'Palabras agotadoras',desc:'Cada palabra consume 2 jugadas.',effect:'doublePlay'},
    {id:'min_six_zero',title:'Solo palabras largas',desc:'Las palabras de menos de 6 fichas obtienen 0 puntos.',effect:'minSixZero'}
  ];

  const linguisticMissions = [
    {id:'mission_accent',name:'Acento preciso',desc:'Juega una palabra con tilde o diéresis.',condition:'accent',reward:2},
    {id:'mission_enye',name:'Marca española',desc:'Juega una palabra que contenga Ñ.',condition:'ntilde',reward:2},
    {id:'mission_des',name:'Prefijo en acción',desc:'Juega una palabra que empiece por des-.',condition:'prefixDes',reward:2},
    {id:'mission_mente',name:'Sufijo adverbial',desc:'Juega una palabra terminada en -mente.',condition:'suffixMente',reward:3},
    {id:'mission_unique7',name:'Variedad léxica',desc:'Juega una palabra de 7+ letras sin repetir ninguna.',condition:'longUnique',reward:3}
  ];

  const synergies = [
    {id:'syn_long',name:'Motor de palabras largas',desc:'Tu build premia especialmente la longitud.',members:['cinco','seis','siete','ocho','larga','nueve','decena','perfecta'],min:3},
    {id:'syn_accent',name:'Orfebrería ortográfica',desc:'Has combinado varias cartas de tildes y ortografía.',members:['tilde','acentuada_larga','ortografo'],min:2},
    {id:'syn_rare',name:'Colección exótica',desc:'Tu build gira alrededor de letras raras.',members:['raras','jota','zeta','equis','cu','rare_combo','triple_rara'],min:2},
    {id:'syn_vowels',name:'Coro vocálico',desc:'Varias cartas recompensan el juego con vocales.',members:['vocalista','vocales3','cuatro_vocales','sin_vocal_repetida','doble_vocal'],min:2},
    {id:'syn_streak',name:'Cadena de precisión',desc:'Escalera, rachas y cambios de longitud trabajan juntas.',members:['escalera','descenso','racha3','racha5'],min:2},
    {id:'syn_specials',name:'Alquimia de fichas',desc:'Tu build saca partido de fichas especiales.',members:['alquimista','joyero','doble_especial','sello_real'],min:2}
  ];

  const modes = {
    easy:{id:'easy',name:'Fácil',rounds:10,startPlays:10,startRefreshes:5,roundGain:4,specialRounds:[5,10],targets:[35,45,50,55,60,75,90,110,140,180]},
    normal:{id:'normal',name:'Normal',rounds:12,startPlays:10,startRefreshes:4,roundGain:4,specialRounds:[5,8,12],targets:[45,55,60,70,75,90,110,135,170,220,290,385]},
    hard:{id:'hard',name:'Difícil',rounds:12,startPlays:10,startRefreshes:3,roundGain:4,specialRounds:[5,8,12],targets:[50,65,70,80,95,120,155,205,280,395,570,830]},
    legendary:{id:'legendary',name:'Legendario',rounds:14,startPlays:8,startRefreshes:3,roundGain:3,specialRounds:[5,8,10,14],targets:[60,80,85,95,110,130,155,195,245,320,425,570,775,1060]},
    marathon:{id:'marathon',name:'Maratón',rounds:20,startPlays:12,startRefreshes:6,roundGain:4,specialRounds:[5,10,15,18,20],targets:[40,75,80,90,95,110,120,140,160,180,210,245,285,335,395,465,550,650,775,920]},
    quick:{id:'quick',name:'Rápida',rounds:1,startPlays:30,startRefreshes:6,roundGain:0,specialRounds:[],targets:[999999]}
  };

  const wordLengthSlots = [0,0,0,0,5,5,5,10,10,15,15,20];

  const specialTileTypes = {
    normal:{name:'Normal'},
    gold:{name:'Dorada',desc:'Con 2+ doradas, multiplica Word Score por su número.'},
    diamond:{name:'Diamante',desc:'Gana +5 si permanece sin jugar tras una palabra.'},
    emerald:{name:'Esmeralda',desc:'25% de probabilidad de puntuar ×5.'},
    dot:{name:'Punto',desc:'Si cierra la palabra, Word Score ×2.'},
    potion:{name:'Poción',desc:'Al jugarla, suma su valor a tus Jugadas y se rompe.'},
    glass:{name:'Cristal',desc:'Se rompe al jugarla.'},
    mirror:{name:'Espejo',desc:'Copia la letra y el valor de la ficha situada a su izquierda.'},
    bang:{name:'Exclamación',desc:'Debe cerrar la jugada y vale la suma de las fichas que dejas en el tablero.'},
    plus:{name:'Conector',desc:'Permite puntuar dos palabras válidas en una sola jugada.'},
    wild:{name:'Comodín',desc:'Puede representar cualquier letra y vale 0.'},
    ink:{name:'Tinta',desc:'Gana +1 de valor cada vez que se usa.'},
    crown:{name:'Corona',desc:'Añade +25 a su valor.'},
    volatile:{name:'Explosiva',desc:'Multiplica el Final Score ×1,35.'}
  };

  const challenges = [
    {id:'none',title:'Ronda abierta',desc:'Cualquier palabra válida puntúa.',kind:'normal',targetMult:1},
    {id:'min5',title:'Palabra larga',desc:'Solo cuentan palabras de 5 letras o más.',kind:'constraint',targetMult:.96},
    {id:'vowel',title:'Puerta vocálica',desc:'La palabra debe empezar por vocal.',kind:'constraint',targetMult:.96},
    {id:'consonant',title:'Golpe consonante',desc:'La palabra debe empezar por consonante.',kind:'constraint',targetMult:.96},
    {id:'noA',title:'La A prohibida',desc:'No puedes usar la letra A.',kind:'constraint',targetMult:.94},
    {id:'unique',title:'Sin repetir',desc:'No puedes repetir ninguna letra.',kind:'constraint',targetMult:.94},
    {id:'exact6c',title:'Seis exactas',desc:'Solo palabras de exactamente 6 letras.',kind:'constraint',targetMult:.92},
    {id:'endsS',title:'Final en S',desc:'La palabra debe terminar en S.',kind:'constraint',targetMult:.93},
    {id:'twoVowels',title:'Vocal doble',desc:'Debe contener al menos dos vocales.',kind:'constraint',targetMult:.96},

    {id:'min6',title:'El Devorasílabas',desc:'JEFE · Solo acepta palabras de 6 letras o más.',kind:'boss',targetMult:.84,rewardTier:'rare'},
    {id:'noE',title:'La Reina Ausente',desc:'JEFE · No puedes utilizar la letra E.',kind:'boss',targetMult:.88,rewardTier:'rare'},
    {id:'accent',title:'El Inquisidor de Tildes',desc:'JEFE · Toda palabra debe contener tilde o diéresis.',kind:'boss',targetMult:.78,rewardTier:'rare'},
    {id:'ntilde',title:'El Guardián de la Ñ',desc:'JEFE · Toda palabra debe contener Ñ. El tablero te concederá una.',kind:'boss',targetMult:.76,rewardTier:'epic',setup:'ntilde'},
    {id:'exact6',title:'El Hexámetro',desc:'JEFE · Solo acepta palabras de exactamente 6 letras.',kind:'boss',targetMult:.80,rewardTier:'rare'},
    {id:'rare',title:'El Coleccionista Imposible',desc:'JEFE · Debes usar J, Ñ, Q, X o Z.',kind:'boss',targetMult:.80,rewardTier:'epic',setup:'rare'},
    {id:'threeVowels',title:'La Hidra Vocálica',desc:'JEFE · Cada palabra necesita al menos tres vocales.',kind:'boss',targetMult:.84,rewardTier:'rare',setup:'vowels'},
    {id:'longAccent',title:'El Maestro Ortográfico',desc:'JEFE · 6+ letras y al menos una tilde.',kind:'boss',targetMult:.72,rewardTier:'epic',setup:'vowels'},
    {id:'noCommon',title:'El Vacío',desc:'JEFE · No puedes utilizar A ni E.',kind:'boss',targetMult:.76,rewardTier:'epic',setup:'noCommon'}
  ];

  const achievements = [
    ['first','Primera palabra','Juega tu primera palabra.','careerWords',1],
    ['hundred','Centenario','Consigue 100 puntos en una sola palabra.','bestPlay',100],
    ['three_hundred','Tricentenario','Consigue 300 puntos en una sola palabra.','bestPlay',300],
    ['thousand','Rompe el marcador','Supera 1000 puntos totales en una partida.','runScore',1000],
    ['five_thousand','Fuera de escala','Supera 5000 puntos en una partida.','runScore',5000],
    ['long8','Académico','Forma una palabra de 8 letras.','longest',8],
    ['long10','Diccionario andante','Forma una palabra de 10 letras.','longest',10],
    ['ntilde','Ñandú','Juega una palabra con Ñ.','ntilde',1],
    ['accent','Bien acentuado','Juega una palabra con tilde.','accent',1],
    ['streak5','Imparable','Encadena 5 palabras válidas.','streak',5],
    ['streak10','Sin fallo','Encadena 10 palabras válidas.','streak',10],
    ['rare','Coleccionista raro','Usa una letra de valor 7 o más.','rare',1],
    ['win','Primera victoria','Completa las 12 rondas.','wins',1],
    ['wins5','Veterano','Gana 5 partidas.','wins',5],
    ['words100','Lector','Descubre 100 palabras distintas.','uniqueWords',100],
    ['words500','Lexicógrafo','Descubre 500 palabras distintas.','uniqueWords',500],
    ['cards10','Constructor','Descubre 10 cartas distintas.','cards',10],
    ['cards30','Maestro de combos','Descubre 30 cartas distintas.','cards',30],
    ['combo2','Sinergia','Alcanza un multiplicador ×2.','combo',2],
    ['combo4','Reacción en cadena','Alcanza un multiplicador ×4.','combo',4],
    ['quick','Velocista','Termina una partida rápida.','quick',1],
    ['daily','Rutina léxica','Completa un reto del día.','daily',1],
    ['perfect','Perfecto','Termina una partida sin errores de palabra.','perfect',1],
    ['allround','Doce estaciones','Llega a la ronda 12.','round',12]
  ].map(([id,name,desc,metric,value])=>({id,name,desc,metric,value}));

  return {modifiers,gifts,upgrades,shopItems,specialRounds,linguisticMissions,synergies,modes,wordLengthSlots,specialTileTypes,challenges,achievements};
})();
