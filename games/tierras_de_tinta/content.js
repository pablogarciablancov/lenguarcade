(function(){
"use strict";

var C = {
  version:"2026.09.19-v21",
  questionSpace:{
    total:3080,
    areas:{
      ortografia:640,
      acentuacion:420,
      morfologia:560,
      verbos:840,
      semantica:300,
      literatura:180,
      comprension:140
    }
  },
  heroes:[
    {
      id:"aldren",name:"Aldren",className:"Guardián",role:"Vanguardia",
      hp:145,speed:185,power:1.00,accent:"#78b8a5",cloth:"#334b50",hair:"#392d25",
      trait:"Resiste el frente y convierte el bloqueo en contraataque.",
      ability:"Onda de tinta",abilityText:"Expulsa una onda circular que derriba y daña a los enemigos cercanos.",
      passive:"Muralla escrita: tras esquivar, recibe un 35 % menos de daño durante 1,5 s."
    },
    {
      id:"mara",name:"Mara",className:"Exploradora",role:"Distancia",
      hp:108,speed:225,power:0.96,accent:"#d19b59",cloth:"#385b49",hair:"#7a4b2d",
      trait:"Controla la distancia, dispara en movimiento y castiga grupos separados.",
      ability:"Flecha de eco",abilityText:"Dispara tres proyectiles perforantes en abanico.",
      passive:"Paso ligero: la primera esquiva tras un desafío correcto se recarga al instante."
    },
    {
      id:"elio",name:"Elio",className:"Escriba arcano",role:"Área",
      hp:96,speed:202,power:1.12,accent:"#8e87d8",cloth:"#3e3763",hair:"#2a2022",
      trait:"Convierte signos y tinta en ataques de área de gran potencia.",
      ability:"Sello expansivo",abilityText:"Traza un sello que explota tras una breve demora.",
      passive:"Margen perfecto: una respuesta sin pista aumenta el daño un 20 % durante 12 s."
    },
    {
      id:"silas",name:"Silas",className:"Pícaro de la tinta",role:"Crítico",
      hp:102,speed:245,power:1.04,accent:"#c35f6a",cloth:"#40333c",hair:"#181719",
      trait:"Ataca rápido, atraviesa huecos y encadena golpes críticos.",
      ability:"Tajo de sombra",abilityText:"Se proyecta hacia el puntero y corta a todo lo que atraviesa.",
      passive:"Nota al margen: cada tercer ataque consecutivo tiene probabilidad crítica aumentada."
    },
    {
      id:"bruna",name:"Bruna",className:"Duelista",role:"Equilibrio",
      hp:118,speed:215,power:1.06,accent:"#d6bd71",cloth:"#46505e",hair:"#5b3525",
      trait:"Alterna fintas y estocadas; excelente para combatir jefes.",
      ability:"Réplica",abilityText:"Marca al enemigo más cercano y devuelve parte del daño recibido.",
      passive:"Ritmo de acero: alternar ataque y esquiva aumenta brevemente la velocidad."
    },
    {
      id:"nereo",name:"Nereo",className:"Cartógrafo rúnico",role:"Control",
      hp:112,speed:205,power:0.99,accent:"#55b6cb",cloth:"#2f4b59",hair:"#4b3e31",
      trait:"Domina el terreno con runas lentificadoras y proyectiles precisos.",
      ability:"Círculo de signos",abilityText:"Crea una zona que ralentiza y daña de forma periódica.",
      passive:"Lectura del terreno: recoge recursos desde un 25 % más lejos."
    }
  ],
  difficulties:[
    {id:"aprendiz",name:"Aprendiz",mult:0.85,enemyHp:0.82,enemyDamage:0.78,reward:0.85},
    {id:"guardian",name:"Guardián",mult:1,enemyHp:1,enemyDamage:1,reward:1},
    {id:"erudito",name:"Erudito",mult:1.25,enemyHp:1.22,enemyDamage:1.18,reward:1.25},
    {id:"abismo",name:"Abismo",mult:1.55,enemyHp:1.5,enemyDamage:1.38,reward:1.55}
  ],
  regions:[
    {
      id:"bosque",short:"Bosque",name:"Bosque de los Ecos",area:"Ortografía · vocabulario",
      description:"Senderos de tinta, raíces antiguas y criaturas que se alimentan de errores.",
      objective:"Derrota 20 criaturas y supera al Guardián de Corteza.",
      boss:"Guardián de Corteza",bossType:"tank",level:1,
      colors:["#173a32","#2b634f","#8c7443","#b9a66a"],ground:"#173229",accent:"#77c095",
      resources:{wood:2,ore:0,fragments:1},skills:["ortografia","semantica"]
    },
    {
      id:"minas",short:"Minas",name:"Minas de la Sílaba",area:"Acentuación · hiatos",
      description:"Galerías de cuarzo donde cada eco separa sílabas y despierta guardianes minerales.",
      objective:"Rompe los escudos minerales y vence a la Reina Cuarcita.",
      boss:"Reina Cuarcita",bossType:"shooter",level:2,
      colors:["#202b38","#485d6d","#6fb1b1","#d4e0c4"],ground:"#202b31",accent:"#70c4c1",
      resources:{wood:0,ore:2,fragments:1},skills:["acentuacion","ortografia"]
    },
    {
      id:"marisma",short:"Marisma",name:"Marisma de las Formas",area:"Morfología",
      description:"Aguas verdes, pasarelas quebradas y criaturas que cambian de categoría al atacar.",
      objective:"Purifica la marisma y derrota al Metamorfo Cenagoso.",
      boss:"Metamorfo Cenagoso",bossType:"summoner",level:3,
      colors:["#1d342c","#456747","#a0a85b","#6f513f"],ground:"#24392f",accent:"#a7b760",
      resources:{wood:1,ore:0,fragments:2},skills:["morfologia","semantica"]
    },
    {
      id:"ruinas",short:"Ruinas",name:"Ruinas del Tiempo",area:"Verbos",
      description:"Mecanismos detenidos y corredores que aceleran o ralentizan cada acción.",
      objective:"Recompón el reloj verbal y derrota al Cronista Roto.",
      boss:"Cronista Roto",bossType:"dasher",level:4,
      colors:["#352c3c","#63516e","#c58a63","#e0c686"],ground:"#30293a",accent:"#c49174",
      resources:{wood:0,ore:1,fragments:2},skills:["verbos","morfologia"]
    },
    {
      id:"acantilados",short:"Cumbres",name:"Acantilados de la Concordancia",area:"Concordancia · sintaxis",
      description:"Puentes suspendidos y ráfagas que castigan cualquier paso fuera de ritmo.",
      objective:"Cruza las cumbres y derrota al Vigía de Bronce.",
      boss:"Vigía de Bronce",bossType:"shooter",level:5,
      colors:["#253848","#547487","#b5c7c8","#c78b4e"],ground:"#2a3c46",accent:"#e0aa62",
      resources:{wood:1,ore:2,fragments:1},skills:["morfologia","comprension"]
    },
    {
      id:"biblioteca",short:"Archivo",name:"Biblioteca Sumergida",area:"Comprensión · literatura",
      description:"Salas inundadas conservan relatos enteros dentro de burbujas de tinta antigua.",
      objective:"Recupera los folios perdidos y vence al Leviatán de Pergamino.",
      boss:"Leviatán de Pergamino",bossType:"orbit",level:6,
      colors:["#163b43","#236f78","#77c6b9","#d6cc9d"],ground:"#15343b",accent:"#7bd4c2",
      resources:{wood:0,ore:0,fragments:3},skills:["comprension","literatura"]
    },
    {
      id:"abismo",short:"Abismo",name:"Fronteras del Abismo",area:"Dominio mixto",
      description:"La tinta se desborda sobre un territorio donde todas las reglas vuelven a ponerse a prueba.",
      objective:"Sobrevive a la Frontera y derrota al Señor del Borrón.",
      boss:"Señor del Borrón",bossType:"hybrid",level:7,
      colors:["#1b1828","#44304d","#8e4d6c","#d09a73"],ground:"#211b2b",accent:"#d06c86",
      resources:{wood:1,ore:1,fragments:3},skills:["ortografia","morfologia","verbos","semantica","literatura","comprension"]
    }
  ],
  weapons:[
    {id:"grafito",name:"Espada de grafito",family:"Espada",rarity:"Común",damage:23,cooldown:0.38,range:105,mode:"melee",desc:"Equilibrada · corte frontal",effect:"Cada cuarto golpe ensancha el arco de ataque."},
    {id:"martillo",name:"Martillo de margen",family:"Martillo",rarity:"Poco común",damage:42,cooldown:0.72,range:92,mode:"slam",desc:"Lento · impacto de área",effect:"Los golpes levantan una onda que empuja a los enemigos."},
    {id:"arco",name:"Arco de diéresis",family:"Arco",rarity:"Poco común",damage:19,cooldown:0.31,range:520,mode:"ranged",desc:"Rápido · larga distancia",effect:"Cada quinta flecha atraviesa hasta tres objetivos."},
    {id:"baston",name:"Bastón del lexema",family:"Bastón",rarity:"Raro",damage:28,cooldown:0.5,range:410,mode:"orb",desc:"Orbe · daño de área",effect:"El impacto genera una pequeña explosión de tinta."},
    {id:"dagas",name:"Dagas de inciso",family:"Dagas",rarity:"Raro",damage:14,cooldown:0.19,range:78,mode:"dual",desc:"Muy rápidas · crítico",effect:"Tres impactos seguidos aumentan el crítico."},
    {id:"escudo",name:"Broquel del punto",family:"Escudo",rarity:"Raro",damage:25,cooldown:0.52,range:86,mode:"shield",desc:"Defensivo · contraataque",effect:"Atacar justo tras esquivar duplica el empuje."},
    {id:"foco",name:"Foco de tinta viva",family:"Foco",rarity:"Épico",damage:18,cooldown:0.22,range:370,mode:"beam",desc:"Rayo · daño sostenido",effect:"Una respuesta correcta acelera el siguiente ataque."},
    {id:"mandoble",name:"Mandoble del capítulo",family:"Espada",rarity:"Épico",damage:48,cooldown:0.78,range:135,mode:"cleave",desc:"Gran arco · alto daño",effect:"Derrotar un enemigo extiende el siguiente golpe."},
    {id:"ballesta",name:"Ballesta de la glosa",family:"Ballesta",rarity:"Épico",damage:38,cooldown:0.66,range:600,mode:"pierce",desc:"Precisa · perforante",effect:"Los disparos atraviesan un objetivo adicional."},
    {id:"pluma",name:"Pluma del Abismo",family:"Foco",rarity:"Legendaria",damage:31,cooldown:0.34,range:460,mode:"ink",desc:"Tinta guiada · cadena",effect:"El proyectil salta a un segundo enemigo cercano."}
  ],
  orders:[
    {id:"clean3",title:"La tinta no miente",text:"Resuelve 3 desafíos sin usar pista.",target:3,type:"clean"},
    {id:"kills20",title:"Camino despejado",text:"Derrota 20 criaturas en una sola expedición.",target:20,type:"kills"},
    {id:"chests3",title:"Notas al margen",text:"Abre 3 cofres lingüísticos.",target:3,type:"chests"},
    {id:"boss",title:"Última palabra",text:"Derrota a un jefe regional.",target:1,type:"boss"}
  ],
  questionBanks:{
    ortografia:[
      {q:"Elige la forma correcta para completar: «No sé ___ vendrá mañana».",o:["si","sí","sí que","sì"],a:"si",h:"La conjunción condicional «si» se escribe sin tilde.",e:"«Si» introduce aquí una condición o una interrogación indirecta y no lleva tilde."},
      {q:"¿Qué opción está correctamente escrita?",o:["tubo una idea","tuvo una idea","tubo una idéa","tuvo una idéa"],a:"tuvo una idea",h:"El verbo «tener» se escribe con v.",e:"«Tuvo» es una forma del verbo tener; «tubo» es un sustantivo."},
      {q:"Completa: «Voy ___ estudiar después de cenar».",o:["ha","a","ah","há"],a:"a",h:"Delante de un infinitivo suele aparecer la preposición «a».",e:"La perífrasis «ir a + infinitivo» se construye con la preposición «a», sin h."},
      {q:"Elige la oración correcta.",o:["A ver si llegas.","Haber si llegas.","Aver si llegas.","Ha ver si llegas."],a:"A ver si llegas.",h:"La expresión significa «veamos».",e:"Se escribe «a ver» cuando equivale a «veamos»; «haber» es un verbo."},
      {q:"¿Qué palabra se escribe con h?",o:["echo","hecho","echar","ola"],a:"hecho",h:"Piensa en el participio del verbo hacer.",e:"«Hecho» es el participio de hacer y conserva la h; «echo» pertenece a echar."},
      {q:"¿Cuál es correcta?",o:["viaje","viage","biaje","biage"],a:"viaje",h:"Las palabras terminadas en -aje suelen escribirse con j.",e:"«Viaje» se escribe con v y j."},
      {q:"¿Cuál es correcta?",o:["protejer","proteger","protejerse","protejido"],a:"proteger",h:"Los verbos acabados en -ger se escriben con g, salvo tejer y crujir.",e:"«Proteger» se escribe con g en el infinitivo."},
      {q:"¿Cuál es la opción correcta?",o:["valla a casa","vaya a casa","baya a casa","balla a casa"],a:"vaya a casa",h:"Necesitas una forma del verbo ir.",e:"«Vaya» es una forma del verbo ir; «valla» es una cerca y «baya», un fruto."}
    ],
    acentuacion:[
      {q:"¿Qué palabra está correctamente acentuada?",o:["camion","camión","cámion","camíon"],a:"camión",h:"Es aguda y termina en -n.",e:"«Camión» es aguda terminada en -n, por eso lleva tilde."},
      {q:"¿Qué palabra contiene hiato?",o:["tierra","ciudad","país","puerta"],a:"país",h:"Una vocal cerrada tónica con tilde rompe el diptongo.",e:"En «pa-ís», la í tónica forma hiato con la a."},
      {q:"¿Cuál es esdrújula?",o:["pared","lápiz","música","reloj"],a:"música",h:"Cuenta desde la última sílaba.",e:"«Música» tiene la sílaba tónica en la antepenúltima; todas las esdrújulas llevan tilde."},
      {q:"¿Qué palabra es llana y lleva tilde?",o:["árbol","cantar","pared","reloj"],a:"árbol",h:"Las llanas llevan tilde cuando no terminan en vocal, -n o -s.",e:"«Árbol» es llana terminada en consonante distinta de n o s."},
      {q:"Elige la forma correcta.",o:["tambien","también","támbien","tambíen"],a:"también",h:"Es aguda terminada en -n.",e:"«También» es aguda terminada en -n y lleva tilde."},
      {q:"¿Cuál contiene diptongo?",o:["poeta","teatro","cielo","país"],a:"cielo",h:"Dos vocales permanecen en la misma sílaba.",e:"En «cie-lo», ie forma un diptongo."}
    ],
    morfologia:[
      {q:"En «aquellas montañas altas», ¿qué clase de palabra es «aquellas»?",o:["determinante","pronombre","adverbio","conjunción"],a:"determinante",h:"Acompaña al sustantivo «montañas».",e:"«Aquellas» determina al sustantivo y concuerda con él en género y número."},
      {q:"¿Qué palabra es un adverbio?",o:["rápido","rapidez","rápidamente","acelerar"],a:"rápidamente",h:"Muchos adverbios de modo terminan en -mente.",e:"«Rápidamente» es un adverbio de modo."},
      {q:"¿Qué palabra es una preposición?",o:["aunque","desde","porque","quizá"],a:"desde",h:"Introduce un término y expresa origen.",e:"«Desde» pertenece al inventario de las preposiciones."},
      {q:"¿Qué palabra es un pronombre?",o:["mi","mío","yo","este libro"],a:"yo",h:"Sustituye directamente al nombre del hablante.",e:"«Yo» es un pronombre personal."},
      {q:"En «casitas», ¿qué segmento es un sufijo diminutivo?",o:["cas-","-it-","-a","-s"],a:"-it-",h:"Es el segmento que añade el significado de tamaño pequeño.",e:"El sufijo diminutivo es «-it-»; «cas-» es el lexema."},
      {q:"¿Cuál es una palabra compuesta?",o:["panadero","sacapuntas","casita","tristeza"],a:"sacapuntas",h:"Está formada por dos lexemas.",e:"«Sacapuntas» combina dos bases léxicas: saca + puntas."},
      {q:"En «los árboles verdes», ¿qué palabras concuerdan en masculino plural?",o:["los y árboles","árboles y verdes","los, árboles y verdes","solo verdes"],a:"los, árboles y verdes",h:"Determinante, sustantivo y adjetivo forman el grupo nominal.",e:"Los tres elementos aparecen en masculino plural y mantienen la concordancia."}
    ],
    verbos:[
      {q:"En «cantábamos», ¿qué persona y número aparecen?",o:["1.ª singular","1.ª plural","2.ª plural","3.ª plural"],a:"1.ª plural",h:"La terminación -ábamos incluye al hablante y a otros.",e:"«Cantábamos» es primera persona del plural."},
      {q:"¿Qué forma es un infinitivo?",o:["cantando","cantado","cantar","canta"],a:"cantar",h:"El infinitivo termina en -ar, -er o -ir.",e:"«Cantar» es una forma no personal de infinitivo."},
      {q:"¿Qué forma es compuesta?",o:["canté","cantaba","he cantado","cantaré"],a:"he cantado",h:"Las formas compuestas usan el auxiliar haber y un participio.",e:"«He cantado» combina «he» (haber) y el participio «cantado»."},
      {q:"¿Qué oración está en subjuntivo?",o:["Vienes mañana.","Quizá vengas mañana.","Vendrás mañana.","Ven mañana."],a:"Quizá vengas mañana.",h:"El subjuntivo suele expresar posibilidad, deseo o duda.",e:"«Vengas» es presente de subjuntivo y aquí expresa posibilidad."},
      {q:"¿Cuál es un gerundio?",o:["vivir","vivido","viviendo","vive"],a:"viviendo",h:"Los gerundios suelen terminar en -ando o -iendo.",e:"«Viviendo» es el gerundio del verbo vivir."},
      {q:"En «habíamos salido», ¿qué tiempo aparece?",o:["pretérito perfecto compuesto","pretérito pluscuamperfecto","futuro perfecto","condicional compuesto"],a:"pretérito pluscuamperfecto",h:"Se forma con «habíamos» + participio.",e:"«Habíamos salido» es pretérito pluscuamperfecto de indicativo."},
      {q:"¿Qué forma pertenece al imperativo?",o:["corres","corre","correrás","corrías"],a:"corre",h:"Expresa una orden dirigida a tú.",e:"«Corre» puede funcionar como segunda persona singular del imperativo."}
    ],
    semantica:[
      {q:"¿Qué palabra es sinónima de «comenzar»?",o:["terminar","iniciar","detener","romper"],a:"iniciar",h:"Busca una palabra con significado equivalente.",e:"«Iniciar» y «comenzar» comparten significado en este contexto."},
      {q:"¿Qué palabra es antónima de «escaso»?",o:["raro","breve","abundante","pequeño"],a:"abundante",h:"Busca el significado opuesto.",e:"«Abundante» se opone a «escaso»."},
      {q:"¿Qué pareja pertenece a la misma familia léxica?",o:["mar-marino","mar-mesa","flor-luz","pan-sol"],a:"mar-marino",h:"Deben compartir lexema y relación de significado.",e:"«Mar» y «marino» comparten la base léxica mar-."},
      {q:"La palabra «banco» puede significar asiento o entidad financiera. Es un caso de…",o:["sinonimia","polisemia","antonimia","campo semántico"],a:"polisemia",h:"Una misma palabra presenta varios significados relacionados.",e:"«Banco» es una palabra polisémica porque posee varios significados."},
      {q:"¿Qué conjunto forma un campo semántico?",o:["mesa, silla, armario","pan, panadero, panadería","casa, casita, caserón","feliz, felicidad, felizmente"],a:"mesa, silla, armario",h:"Comparten ámbito de significado, no necesariamente lexema.",e:"Mesa, silla y armario pertenecen al campo semántico de los muebles."}
    ],
    literatura:[
      {q:"¿Qué rasgo caracteriza al narrador protagonista?",o:["Conoce todo lo que piensan todos","Cuenta hechos que él mismo vive","Nunca participa en la historia","Solo describe lugares"],a:"Cuenta hechos que él mismo vive",h:"Es personaje y narrador a la vez.",e:"El narrador protagonista participa en los acontecimientos y los cuenta desde su perspectiva."},
      {q:"¿Qué género suele organizarse en actos y escenas?",o:["lírico","dramático","narrativo","ensayístico"],a:"dramático",h:"Piensa en el teatro.",e:"Las obras dramáticas se estructuran habitualmente en actos y escenas."},
      {q:"En «sus ojos eran dos luceros» aparece una…",o:["metáfora","hipérbaton","onomatopeya","anáfora"],a:"metáfora",h:"Se identifica una realidad con otra sin usar «como».",e:"Se identifica «ojos» con «luceros», por eso es una metáfora."},
      {q:"¿Qué esquema corresponde a una rima consonante?",o:["casa-pasa","casa-rama","casa-mesa","casa-luna"],a:"casa-pasa",h:"Coinciden vocales y consonantes desde la última vocal tónica.",e:"En «casa» y «pasa» coinciden -asa, tanto vocales como consonantes."}
    ],
    comprension:[
      {q:"Si un personaje cierra la ventana, se pone el abrigo y mira cómo caen copos, ¿qué se puede inferir?",o:["Hace calor","Está nevando y hace frío","Va a nadar","Es verano"],a:"Está nevando y hace frío",h:"Une las pistas: abrigo, ventana y copos.",e:"Los indicios permiten inferir que nieva y la temperatura es baja."},
      {q:"¿Qué es la idea principal de un texto?",o:["El dato más curioso","El asunto central que organiza la información","La primera frase siempre","La opinión del lector"],a:"El asunto central que organiza la información",h:"Debe resumir lo esencial del conjunto.",e:"La idea principal expresa el contenido central alrededor del cual se organizan las demás ideas."},
      {q:"Para resumir bien un texto conviene…",o:["copiarlo entero","eliminar las ideas principales","seleccionar lo esencial y expresarlo con brevedad","añadir datos inventados"],a:"seleccionar lo esencial y expresarlo con brevedad",h:"Un resumen reduce sin deformar.",e:"Resumir consiste en conservar las ideas esenciales y expresarlas de manera breve y fiel."}
    ]
  }
};

window.TINTA_CONTENT=C;
})();