(() => {
'use strict';
const bonuses=[
['vocalista','Vocalista','Cada vocal activada añade +3 PUNTOS.','points','vowel'],
['consonante','Consonante','Cada consonante activada añade +2 PUNTOS.','points','consonant'],
['palabra_larga','Palabra larga','Las palabras de 5+ letras ganan +18 PUNTOS.','points','long'],
['palabra_corta','Palabra corta','Las palabras de 5 letras o menos duplican MULTIS.','multi','short'],
['cuatro','Cuatro','Con exactamente 4 letras: +4 MULTIS.','multi','four'],
['seis','Sexta marcha','Con 6 letras: +6 MULTIS.','multi','six'],
['ocho','Ocho','Con 8 letras: PUNTOS ×1,5.','points','eight'],
['variedad','Variedad','Cada letra distinta añade +1 MULTI.','multi','unique'],
['repeticion','Repetición','Cada letra repetida añade +4 PUNTOS.','points','repeat'],
['raras','Letras raras','J, Ñ, Q, X y Z añaden +10 PUNTOS cada una.','points','rare'],
['enie','Ñ primordial','Cada Ñ añade +10 PUNTOS y +2 MULTIS.','hybrid','enie'],
['acentos','Tinta acentuada','Cada vocal acentuada añade +10 PUNTOS.','points','accent'],
['mult','M.U.L.T.','Cada M, U, L o T añade +4 MULTIS.','multi','multLetters'],
['punto','P.U.N.T.O.','Cada P, U, N, T u O añade +7 PUNTOS.','points','pointLetters'],
['eco','Eco inicial','Si empiezas igual que la palabra anterior: +12 PUNTOS.','points','firstEcho'],
['gemelos','Gemelos','Si repites longitud: +6 MULTIS.','multi','twins'],
['yoyo','Yo-yo','Ganas MULTIS igual a la diferencia de longitud con la palabra anterior.','multi','yoyo'],
['ahorro','Ahorro','Añade a MULTIS el número de rerolls que conservas.','multi','saving'],
['stock','Stock','Añade a MULTIS el valor de la letra más barata que queda en tu mano.','multi','stock'],
['coccion','Cocción','Cada letra que dejas en la mano añade +2 PUNTOS.','points','cooking'],
['contra_cuerdas','Contra las cuerdas','Con 1 ENERGÍA: PUNTOS ×2 y MULTIS ×2.','hybrid','backwall'],
['bateria','Batería','Empiezas cada ronda con +1 ENERGÍA.','utility','battery'],
['papelera','Papelera','Al superar una ronda recibes +2 REROLLS adicionales.','utility','trashcan'],
['mas_eleccion','Más elección','Tu mano aumenta en +1 letra.','utility','hand'],
['modo_facil','Objetivo flexible','Los objetivos de ronda se reducen un 12%.','utility','targetDown'],
['impulso','Impulso','+5 MULTIS permanentes.','multi','boost'],
['base_fuerte','Base fuerte','+12 PUNTOS permanentes.','points','rawPoints'],
['objetivo','Objetivo','Cada ronda elige una longitud; acertarla duplica MULTIS.','multi','targetLength'],
['negrita','Negrita','Aumenta mucho la probabilidad de letras mejoradas de PUNTOS.','utility','boldDraw'],
['cursiva','Cursiva','Aumenta mucho la probabilidad de letras mejoradas de MULTIS.','utility','italicDraw'],
['subrayado','Subrayado','Aumenta la probabilidad de letras subrayadas: ×1,5 MULTIS por ficha.','utility','underlineDraw'],
['legendarias','Letras especiales','Aumenta la probabilidad de letras especiales al robar.','utility','specialDraw'],
['comodines','Comodines','Añade 3 comodines * a la bolsa.','utility','wildcards'],
['exclamacion','¡Sorpresa!','Añade 2 fichas ! especiales a la bolsa.','utility','bangs'],
['afortunada','Ficha afortunada','Cada ficha tiene un 12% de repetirse al puntuar.','hybrid','lucky'],
['triple','Triple','Cada tercera letra añade +3 PUNTOS y +1 MULTI.','hybrid','triple'],
['equilibrio_vocal','A ≥ B','Si hay tantas vocales como consonantes: +1 REROLL tras jugar.','utility','vowelBalance'],
['equilibrio_consonante','B ≥ A','Si hay tantas consonantes como vocales: +1 MULTI.','multi','consonantBalance'],
['cinco_vocales','Pentavocal','Usar 4 vocales distintas: PUNTOS ×2.','points','manyVowels'],
['muro_consonante','Muro consonante','4 consonantes o más: +10 MULTIS.','multi','manyConsonants'],
['sustantivo','Sustantivos','Si el léxico reconoce un sustantivo: +8 MULTIS.','multi','noun'],
['verbo','Verbos','Si el léxico reconoce un verbo: PUNTOS ×1,5.','points','verb'],
['adjetivo','Adjetivos','Si el léxico reconoce un adjetivo: +25 PUNTOS.','points','adj'],
['adverbio','Adverbios','Si el léxico reconoce un adverbio: +12 MULTIS.','multi','adv'],
['morfologia','Prisma morfológico','Cada categoría gramatical distinta usada en la ronda añade +3 MULTIS.','multi','categoryMix'],
['palindromo','Espejo','Los palíndromos triplican MULTIS.','multi','palindrome'],
['sin_repetir','Letras limpias','Sin letras repetidas: +12 PUNTOS.','points','noRepeat'],
['puerta_vocal','Puerta vocálica','Si empieza por vocal: +7 MULTIS.','multi','startsVowel'],
['final_s','Final en S','Si termina en S: +30 PUNTOS.','points','endsS'],
['cinco','Cinco exactas','Con 5 letras: +25 PUNTOS.','points','five'],
['siete','Siete exactas','Con 7 letras: +12 MULTIS.','multi','seven'],
['nueve','Nueve exactas','Con 9+ letras: PUNTOS ×2 y +10 MULTIS.','hybrid','nine'],
['tormenta','Tormenta de tinta','Cada ficha especial usada añade +8 PUNTOS y +2 MULTIS.','hybrid','specialUse'],
['ultima_chispa','Última chispa','La última ENERGÍA de una ronda gana +15 PUNTOS y +8 MULTIS.','hybrid','lastEnergy']
].map(([id,name,description,type,effect])=>({id,name,description,type,effect}));

const modes={
 easy:{id:'easy',name:'Fácil',rounds:7,energy:6,rerolls:4,wallet:10,targets:[80,140,220,330,470,650,880]},
 normal:{id:'normal',name:'Normal',rounds:10,energy:5,rerolls:3,wallet:8,targets:[100,180,290,430,610,850,1160,1540,2020,2640]},
 hard:{id:'hard',name:'Difícil',rounds:12,energy:4,rerolls:2,wallet:7,targets:[120,220,360,540,780,1080,1450,1920,2510,3260,4210,5400]},
 daily:{id:'daily',name:'Reto diario',rounds:10,energy:5,rerolls:3,wallet:8,targets:[110,190,300,450,640,890,1210,1600,2100,2750]}
};

const events=[
 {id:'mercader',name:'Mercader de recortes',icon:'↻',text:'Un mercader ofrece tinta de descarte para rehacer tu mano.',choices:[{id:'buy',label:'2 rerolls',cost:3,note:'Paga 3 monedas y gana 2 rerolls.'},{id:'leave',label:'Pasar',cost:0,note:'No ocurre nada.'}]},
 {id:'apuesta',name:'El escriba apuesta',icon:'⚔',text:'«La próxima ronda no la sacas ni de broma». Puedes subir la dificultad a cambio de una bolsa de monedas.',choices:[{id:'accept',label:'Aceptar apuesta',cost:0,note:'Próximo objetivo +25%. Si lo superas: +8 monedas.'},{id:'leave',label:'No apostar',cost:0,note:'Mantén el objetivo normal.'}]},
 {id:'bibliotecario',name:'Bibliotecario clandestino',icon:'✦',text:'Conoce una técnica prohibida para reforzar una de tus Cartas de Forja al azar.',choices:[{id:'accept',label:'Mejorar carta',cost:3,note:'Paga 3 monedas. Una carta activa mejorable sube 1 nivel.'},{id:'leave',label:'Pasar',cost:0,note:'Guarda tus monedas.'}]},
 {id:'caja',name:'Caja sin remitente',icon:'★',text:'Dentro vibra una ficha imposible de clasificar.',choices:[{id:'open',label:'Comprar comodín',cost:4,note:'Añade un comodín permanente a tu bolsa.'},{id:'leave',label:'No abrir',cost:0,note:'Probablemente sea lo sensato.'}]},
 {id:'musa',name:'Visita de la Musa',icon:'ϟ',text:'Te ofrece una chispa extra para la próxima ronda.',choices:[{id:'accept',label:'+1 Energía',cost:2,note:'Paga 2 monedas. La próxima ronda empieza con +1 Energía.'},{id:'leave',label:'Pasar',cost:0,note:'Conserva el monedero.'}]},
 {id:'fundicion',name:'Fundición de descarte',icon:'◌',text:'La fundición compra una letra de tu bolsa y la destruye para siempre.',choices:[{id:'sell',label:'Fundir letra',cost:0,note:'Se elimina una letra común al azar y recibes +4 monedas.'},{id:'leave',label:'Conservar bolsa',cost:0,note:'No alteres la distribución.'}]}
];
const achievements=[
 ['first','Primera chispa','Juega tu primera palabra.'],
 ['round5','A mitad de camino','Supera la ronda 5.'],
 ['win','Forja completa','Completa una run.'],
 ['long','Palabra mayor','Juega una palabra de 9+ letras.'],
 ['multi50','Multiplicador salvaje','Alcanza 50 MULTIS en una palabra.'],
 ['points100','Golpe pesado','Alcanza 100 PUNTOS antes de multiplicar.'],
 ['score5000','Fuera de escala','Haz 5.000 puntos en una palabra.'],
 ['reroll10','Reciclador','Usa 10 rerolls entre partidas.'],
 ['bonus10','Constructor','Descubre 10 bonus distintos.'],
 ['special','Alquimista','Juega una palabra con una ficha especial.']
].map(([id,title,description])=>({id:'lexoma_'+id,title,description,xpReward:25}));

window.LexomaContent={bonuses,modes,events,achievements};
})();