/* Contextual language questions for ESO. Every distractor is authored; no random misspellings/fillers. */
(function(root){
  'use strict';
  function catalog(){
    const C={ortografia:[],verbos:[],lexico:[]};let serial=0;
    function add(cat,sub,display,answer,options,explain,level=2,prompt='Completa la frase con la opción adecuada.'){C[cat].push({id:'eso_'+(++serial),cat,sub,display,prompt,answer,options:[...new Set([answer,...options])],explain,level,label:({diacriticas:'Tilde diacrítica',homofonos:'Palabras en contexto',acentuacion:'Acentuación',puntuacion:'Puntuación',conjugacion:'Forma verbal',analisis:'Análisis verbal',uso:'Uso de los verbos',contexto:'Significado en contexto',relaciones:'Relaciones léxicas',precision:'Precisión léxica'})[sub]||sub});}
    const contrasts=[
      ['tú','tu',['___ sabes lo que ocurrió.','Ayer lo resolviste ___ sin ayuda.','Me gustaría que ___ participaras.'],['He encontrado ___ cuaderno.','¿Me prestas ___ calculadora?','No he leído ___ mensaje.'],'Tú es pronombre personal; tu acompaña a un sustantivo como posesivo.'],
      ['él','el',['He quedado con ___ en la biblioteca.','Nadie lo explicó mejor que ___.','No creo que ___ lo supiera.'],['Dejé ___ libro en casa.','Mañana comienza ___ torneo.','No he encontrado ___ estuche.'],'Él es pronombre personal; el es un artículo.'],
      ['mí','mi',['Ese regalo es para ___.','Lo hicieron sin contar conmigo: no se acordaron de ___.','Se sentó detrás de ___.'],['___ equipo empieza mañana.','No encuentro ___ mochila.','He perdido ___ entrada.'],'Mí es pronombre; mi es un posesivo.'],
      ['sí','si',['Respondió que ___ quería venir.','Lo hizo por ___ mismo.','Ahora ___ entiendo la explicación.'],['___ terminas, avísame.','No sé ___ habrá entrenamiento.','Pregunta ___ queda alguna plaza.'],'Sí lleva tilde como afirmación o pronombre; si no la lleva como conjunción.'],
      ['dé','de',['Espero que me ___ otra oportunidad.','Dile que te ___ una copia.','No quiero que le ___ vergüenza preguntar.'],['El libro ___ Ana está aquí.','Llegó después ___ comer.','Se acordó ___ nuestro consejo.'],'Dé es una forma del verbo dar; de es una preposición.'],
      ['sé','se',['Ya ___ por qué ha ocurrido.','No ___ dónde guardé la llave.','Por favor, ___ prudente.'],['Ana ___ ha marchado.','El problema ___ resolvió ayer.','Mi hermano ___ quedó en casa.'],'Sé es una forma de saber o ser; se es un pronombre.'],
      ['té','te',['He preparado un ___ con limón.','¿Prefieres café o ___?','Mi abuelo toma ___ por la tarde.'],['Ya ___ dije la respuesta.','No ___ olvides del libro.','¿Quién ___ ha llamado?'],'Té nombra la bebida; te es un pronombre.'],
      ['más','mas',['Necesito ___ tiempo para terminar.','Hoy hay ___ gente que ayer.','Quedan dos plazas ___ en el equipo.'],['Quiso entrar, ___ la puerta estaba cerrada.','Lo intentó, ___ no pudo conseguirlo.','Me invitó, ___ tuve que rechazarlo.'],'Más indica cantidad; mas, sin tilde, equivale a pero.']
    ];
    for(const [a,b,yes,no,why] of contrasts){for(const s of yes)add('ortografia','diacriticas',s,a,[b],why,1);for(const s of no)add('ortografia','diacriticas',s,b,[a],why,1);}
    const homophones=[
      ['Vamos ___ si queda alguna entrada.','a ver',['haber','a haber','a ber'],'A ver combina la preposición a y el infinitivo ver; aquí significa comprobar.'],
      ['Tiene que ___ una solución.','haber',['a ver','a haber','a ber'],'Tras tiene que aparece el infinitivo haber, con el sentido de existir.'],
      ['___ terminado el trabajo esta mañana.','He',['E','Eh'],'He es la forma de haber que acompaña al participio terminado.'],
      ['Ya he ___ los deberes.','hecho',['echo'],'Hecho es el participio de hacer; echo es una forma de echar.'],
      ['Siempre ___ sal a la sopa antes de probarla.','echo',['hecho'],'Echo procede de echar y se escribe sin h.'],
      ['No sé ___ has cambiado de opinión.','por qué',['porque','porqué','por que'],'Es una interrogativa indirecta: pregunta por la causa y se escribe por qué.'],
      ['No fui al entrenamiento ___ estaba enfermo.','porque',['por qué','porqué','por que'],'Porque introduce la causa de no haber ido.'],
      ['Nadie explicó el ___ de aquella decisión.','porqué',['por qué','porque','por que'],'Porqué es un sustantivo que significa motivo; aquí lo acompaña el artículo el.'],
      ['Espero que ___ suficiente tiempo para acabar.','haya',['halla','aya','allá'],'Haya es una forma de haber; halla pertenece al verbo hallar.'],
      ['El explorador ___ una salida entre las rocas.','halla',['haya','aya','allá'],'Halla es una forma de hallar, que significa encontrar.'],
      ['Espero que mañana ___ al entrenamiento.','vaya',['valla','baya'],'Vaya es una forma del verbo ir; valla nombra una cerca.'],
      ['El balón pasó por encima de la ___.','valla',['vaya','baya'],'Valla es el sustantivo que designa una cerca.'],
      ['Al oír el golpe, el vaso se ___ al suelo.','cayó',['calló','cayo','callo'],'Cayó es el pasado de caer; calló pertenece a callar.'],
      ['Cuando comenzó la explicación, todo el grupo se ___.','calló',['cayó','callo','cayo'],'Calló es el pasado de callar.'],
      ['Me dijo que vendría; ___, no apareció.','sin embargo',['por tanto','por eso','en consecuencia'],'Sin embargo expresa oposición entre lo anunciado y lo que sucedió.'],
      ['No quiero este libro, ___ aquel.','sino',['si no'],'Sino contrapone una alternativa afirmativa a otra negada.'],
      ['___ encuentras el archivo, vuelve a buscarlo.','Si no',['Sino'],'Si no combina una condición con una negación: si no lo encuentras.'],
      ['¿___ has guardado las llaves?','Dónde',['Donde'],'Dónde introduce una pregunta directa y lleva tilde.'],
      ['No recuerdo ___ guardé las llaves.','dónde',['donde'],'Dónde lleva tilde también en preguntas indirectas.'],
      ['Volvimos al lugar ___ nos conocimos.','donde',['dónde'],'Donde es un relativo que remite a lugar; no expresa una pregunta.'],
      ['No sé ___ llegará el autobús.','cuándo',['cuando'],'Cuándo es interrogativo, aunque la pregunta sea indirecta.'],
      ['Te llamaré ___ llegue a casa.','cuando',['cuándo'],'Cuando introduce una circunstancia temporal, sin valor interrogativo.'],
      ['___ no ha llegado el profesor.','Aún',['Aun'],'Aún equivale a todavía y lleva tilde.'],
      ['___ los más rápidos llegaron tarde.','Aun',['Aún'],'Aun equivale a incluso y no lleva tilde.'],
      ['¿___ te has gastado en el libro?','Cuánto',['Cuanto'],'Cuánto es interrogativo y lleva tilde.'],
      ['No entiendo ___ estás hablando.','de qué',['de que'],'De qué introduce aquí una interrogativa indirecta.'],
      ['Estoy seguro ___ llegará a tiempo.','de que',['que'],'El adjetivo seguro requiere de: estar seguro de algo.'],
      ['Pienso ___ tienes razón.','que',['de que'],'Pensar algo no exige de: pienso que, sin dequeísmo.'],
    ];
    for(const [s,a,o,e] of homophones)add('ortografia','homofonos',s,a,o,e,s.includes('seguro')||s.includes('Pienso')?3:2);
    const accents=[
      ['raíz',['raiz','ráiz'],'La vocal cerrada tónica í forma un hiato con la vocal abierta y lleva tilde.'],
      ['país',['pais','páis'],'La í tónica forma hiato con la a: pa-ís.'],
      ['oír',['oir','óir'],'La í tónica forma hiato con la o.'],
      ['reúne',['reune','réune'],'La ú tónica rompe el diptongo y forma hiato.'],
      ['prohíbe',['prohibe','próhibe'],'La h intercalada no impide el hiato entre o e í.'],
      ['búho',['buho','buhó'],'La h intercalada no impide el hiato; búho es llana y lleva tilde en la ú.'],
      ['vehículo',['vehiculo','véhiculo'],'La í tónica forma hiato con la e; vehículo es esdrújula.'],
      ['actúa',['actua','áctua'],'La ú tónica forma hiato con la a.'],
      ['continúa',['continua','contínua'],'Como forma de continuar con el acento en nú, continúa lleva tilde por el hiato.'],
      ['incluido',['incluído','íncluido'],'Dos vocales cerradas distintas se consideran diptongo a efectos de acentuación: incluido no lleva tilde.'],
      ['construido',['construído','cónstruido'],'Construido no necesita tilde; ui se considera diptongo a efectos de acentuación.'],
      ['fue',['fué'],'Fue es monosílabo y no lleva tilde.'],
      ['dio',['dió'],'Dio es monosílabo y no lleva tilde.'],
      ['vio',['vió'],'Vio es monosílabo y no lleva tilde.'],
      ['examen',['exámen','éxamen'],'Examen es llana terminada en n: no lleva tilde.'],
      ['exámenes',['examenes','exámenés'],'Exámenes es esdrújula y lleva tilde.'],
      ['imagen',['imágen','ímagen'],'Imagen es llana terminada en n y no lleva tilde.'],
      ['imágenes',['imagenes','imágénes'],'Imágenes es esdrújula.'],
      ['fácilmente',['facilmente','facílmente'],'Los adverbios en -mente conservan la tilde del adjetivo: fácil → fácilmente.'],
      ['rápidamente',['rapidamente','rapidámente'],'Rápidamente conserva la tilde del adjetivo rápida.'],
      ['dímelo',['dimelo','dimélo'],'Al añadir los pronombres, dímelo es esdrújula y lleva tilde.'],
      ['dámelo',['damelo','damélo'],'Dámelo es esdrújula y lleva tilde.']
    ];
    const sentence={raíz:'La ___ del árbol levantó la acera.',país:'Cada ___ presentó una propuesta.',oír:'No consigo ___ lo que dices.',reúne:'El equipo se ___ los viernes.',prohíbe:'La norma ___ correr por el pasillo.',búho:'Un ___ anidaba en la torre.',vehículo:'El ___ se detuvo ante la verja.',actúa:'La compañía ___ mañana en el teatro.',continúa:'El profesor ___ explicando la actividad.',incluido:'El material está ___ en el precio.',construido:'Han ___ un puente nuevo.',fue:'Ayer Ana ___ al museo.',dio:'El tutor nos ___ otra oportunidad.',vio:'Nadie ___ quién abrió la puerta.',examen:'El ___ será el martes.',exámenes:'Esta semana tenemos dos ___.',imagen:'La ___ del cartel está borrosa.',imágenes:'Selecciona dos ___ para tu trabajo.',fácilmente:'Resolvió el acertijo ___.',rápidamente:'El mensajero llegó ___.',dímelo:'Si sabes qué ha ocurrido, ___.',dámelo:'Si ya no necesitas el libro, ___.'};
    for(const [a,o,e] of accents)add('ortografia','acentuacion',sentence[a],a,o,e,2);
    const punctuation=[
      ['Quieres llamar a Laura para que venga.','Laura, ven un momento.',['Laura ven, un momento.','Laura ven un, momento.'],'Laura es un vocativo y se separa del resto con una coma.'],
      ['Elige la oración que no separa el sujeto y su verbo con coma.','Los alumnos de segundo prepararon el debate.',['Los alumnos de segundo, prepararon el debate.','Los alumnos, de segundo prepararon el debate.'],'No se coloca coma entre un sujeto y su verbo, aunque el sujeto sea largo.'],
      ['Elige la enumeración puntuada correctamente.','Trae el cuaderno, el libro y el estuche.',['Trae, el cuaderno el libro y el estuche.','Trae el cuaderno el libro, y el estuche.'],'Las comas separan elementos de la enumeración; no se coloca una coma tras el verbo trae.'],
      ['Introduce una cita literal después de dijo.','Ana dijo: «Mañana volveré».',['Ana dijo, «Mañana volveré».','Ana dijo; «Mañana volveré».'],'Los dos puntos introducen la cita directa anunciada por dijo.'],
      ['Señala la pregunta directa bien escrita.','¿Por qué no has venido?',['¿Porque no has venido?','Por qué no has venido?'],'La pregunta directa necesita ambos signos; por qué es interrogativo.'],
      ['Elige la oración que presenta sin embargo como conector entre pausas.','Sin embargo, nadie protestó.',['Sin, embargo nadie protestó.','Sin embargo nadie, protestó.'],'La coma se coloca tras el conector completo sin embargo.'],
      ['Quieres decir que NO deseas más comida.','No, gracias.',['No gracias.','No; ¿gracias?'],'La coma separa la respuesta negativa de la fórmula gracias.'],
      ['Quieres pedir a los chicos que coman, no comértelos.','Vamos a comer, chicos.',['Vamos a comer chicos.','Vamos, a comer chicos.'],'Chicos es un vocativo; la coma evita que se interprete como lo que vamos a comer.'],
      ['Elige la oración donde Lucía es un inciso explicativo.','Mi hermana, Lucía, estudia Medicina.',['Mi hermana, Lucía estudia Medicina.','Mi hermana Lucía, estudia Medicina.'],'El inciso se encierra entre dos comas; no se deja una sola que separe sujeto y verbo.'],
      ['Quieres referirte solo a los alumnos que han terminado.','Los alumnos que han terminado pueden salir.',['Los alumnos, que han terminado, pueden salir.','Los alumnos que han terminado, pueden salir.'],'Sin comas, que han terminado limita el grupo de alumnos al que se permite salir.'],
      ['Quieres afirmar que todos esos alumnos habían terminado.','Los alumnos, que habían terminado, salieron.',['Los alumnos que habían terminado salieron.','Los alumnos que habían terminado, salieron.'],'La relativa explicativa entre comas añade un dato sobre todo el grupo.'],
      ['Elige la opción con puntos suspensivos bien usados.','Trajo lápices, rotuladores, papeles…',['Trajo lápices, rotuladores, papeles….','Trajo lápices, rotuladores, papeles..'],'Los puntos suspensivos son tres y no se añade otro punto para cerrar el enunciado.']
    ];
    for(const [s,a,o,e] of punctuation)add('ortografia','puntuacion',s,a,o,e,s.includes('solo a')||s.includes('todos esos')?3:2,'Elige la opción que cumple la intención indicada.');
    const verbUse=[
      ['Ayer ___ un problema con la conexión.','hubo',['hubieron','habían'],'Haber con sentido de existir es impersonal y se usa en singular.'],
      ['En la reunión ___ muchas personas.','había',['habían','habíamos'],'Cuando haber significa existir, el grupo muchas personas no es sujeto: había se mantiene en singular.'],
      ['El próximo viernes ___ dos pruebas.','habrá',['habrán','habríamos'],'Haber impersonal se usa en singular también en futuro.'],
      ['Ayer nosotros ___ por el casco antiguo.','anduvimos',['andamos','andemos','andaremos'],'El pretérito perfecto simple de andar usa la raíz anduv-.'],
      ['El conductor ___ con cuidado durante todo el viaje de ayer.','condujo',['condució','condujió'],'Conducir forma el pretérito con conduj- y la tercera persona termina en -o, sin tilde.'],
      ['Cuando me lo preguntaron, yo ___ la verdad.','dije',['decí','dijí'],'El pretérito perfecto simple de decir es irregular: yo dije.'],
      ['Al terminar la carrera, nosotros ___ fuerzas para celebrar.','tuvimos',['tenimos','tuvímos'],'El pretérito de tener usa tuv-; tuvimos es llana y no lleva tilde.'],
      ['No creo que Marta ___ la respuesta todavía.','sepa',['sabe','sabrá'],'No creo que introduce aquí una subordinada con presente de subjuntivo.'],
      ['Ojalá mañana ___ buen tiempo.','haga',['hace','hará'],'Ojalá expresa deseo y selecciona subjuntivo: haga.'],
      ['Si tuviera tiempo, ___ más.','leería',['leeré','leyera'],'La condición con imperfecto de subjuntivo se combina aquí con condicional: leería.'],
      ['Me pidió que ___ un poco más.','esperara',['esperaré','espero'],'Una petición referida al pasado se construye aquí con imperfecto de subjuntivo.'],
      ['Antes de que empiece el partido, nosotros ya ___ cenado.','habremos',['habíamos','hemos'],'El futuro compuesto sitúa la cena como terminada antes de otro hecho futuro.'],
      ['Cuando llegué, Ana ya se ___ marchado.','había',['ha','habrá'],'El pluscuamperfecto expresa una acción anterior a otra pasada.'],
      ['Elige la forma adecuada para dar una orden afirmativa a vosotros: ___ la puerta.','Cerrad',['Cerrar','Cerráis'],'El imperativo afirmativo de vosotros termina en -d: cerrad.'],
      ['Elige la forma adecuada para una orden negativa a vosotros: no ___ tarde.','lleguéis',['llegad','llegar'],'Las órdenes negativas se construyen con presente de subjuntivo.'],
      ['Ya hemos ___ la puerta.','abierto',['abrido','abrimos'],'El participio de abrir es irregular: abierto.'],
      ['¿Has ___ el final de la película?','visto',['vido','viste'],'El participio de ver es visto.'],
      ['El equipo ha ___ el récord.','roto',['rompido','rompió'],'El participio de romper es roto.'],
      ['Ya he ___ el libro en su sitio.','puesto',['ponido','puse'],'El participio de poner es puesto.'],
      ['Ella ha ___ toda la verdad.','dicho',['decido','dijo'],'El participio de decir es dicho.'],
      ['El grupo ha ___ a tiempo.','vuelto',['volvido','volvió'],'El participio de volver es vuelto.']
    ];
    for(const [s,a,o,e] of verbUse)add('verbos','uso',s,a,o,e,s.includes('Si tuviera')||s.includes('habremos')||s.includes('Antes de que')||s.includes('Ojalá')||s.includes('No creo')||s.includes('Me pidió')?3:2,s.includes('Antes de que')?'Selecciona el futuro compuesto de indicativo.':'Completa la frase con la opción adecuada.');
    const persons=['yo','tú','él','nosotros','vosotros','ellos'];
    const paradigms=[
      ['tener','pretérito perfecto simple de indicativo',['tuve','tuviste','tuvo','tuvimos','tuvisteis','tuvieron'],2],
      ['estar','pretérito perfecto simple de indicativo',['estuve','estuviste','estuvo','estuvimos','estuvisteis','estuvieron'],2],
      ['andar','pretérito perfecto simple de indicativo',['anduve','anduviste','anduvo','anduvimos','anduvisteis','anduvieron'],2],
      ['hacer','pretérito perfecto simple de indicativo',['hice','hiciste','hizo','hicimos','hicisteis','hicieron'],2],
      ['decir','pretérito perfecto simple de indicativo',['dije','dijiste','dijo','dijimos','dijisteis','dijeron'],2],
      ['conducir','pretérito perfecto simple de indicativo',['conduje','condujiste','condujo','condujimos','condujisteis','condujeron'],2],
      ['venir','pretérito perfecto simple de indicativo',['vine','viniste','vino','vinimos','vinisteis','vinieron'],2],
      ['saber','pretérito perfecto simple de indicativo',['supe','supiste','supo','supimos','supisteis','supieron'],2],
      ['caber','pretérito perfecto simple de indicativo',['cupe','cupiste','cupo','cupimos','cupisteis','cupieron'],3],
      ['satisfacer','pretérito perfecto simple de indicativo',['satisfice','satisficiste','satisfizo','satisficimos','satisficisteis','satisficieron'],3],
      ['tener','condicional simple de indicativo',['tendría','tendrías','tendría','tendríamos','tendríais','tendrían'],2],
      ['poner','futuro simple de indicativo',['pondré','pondrás','pondrá','pondremos','pondréis','pondrán'],2],
      ['salir','futuro simple de indicativo',['saldré','saldrás','saldrá','saldremos','saldréis','saldrán'],2],
      ['saber','presente de subjuntivo',['sepa','sepas','sepa','sepamos','sepáis','sepan'],3],
      ['haber','presente de subjuntivo',['haya','hayas','haya','hayamos','hayáis','hayan'],3],
      ['ir','presente de subjuntivo',['vaya','vayas','vaya','vayamos','vayáis','vayan'],3],
      ['ser','presente de subjuntivo',['sea','seas','sea','seamos','seáis','sean'],3],
      ['estar','presente de subjuntivo',['esté','estés','esté','estemos','estéis','estén'],3]
    ];
    for(const [inf,tense,forms,level] of paradigms)for(let i=0;i<6;i++){
      const a=forms[i],other=forms.filter(x=>x!==a).slice(0,3);
      add('verbos','conjugacion',`${persons[i]} · ${inf}`,a,other,`La forma de ${inf} en ${tense}, para ${persons[i]}, es ${a}.`,level,`Escribe mentalmente la forma del ${tense} y selecciónala.`);
    }
    const analyses=[
      ['habíamos leído','1.ª persona plural · pluscuamperfecto de indicativo',['1.ª persona plural · perfecto compuesto de indicativo','1.ª persona plural · condicional compuesto'],'Habíamos + participio forma el pluscuamperfecto de indicativo.'],
      ['habréis terminado','2.ª persona plural · futuro compuesto de indicativo',['2.ª persona plural · condicional compuesto','2.ª persona plural · perfecto compuesto de indicativo'],'Habréis es futuro de haber; con participio forma el futuro compuesto.'],
      ['habríamos ido','1.ª persona plural · condicional compuesto',['1.ª persona plural · futuro compuesto de indicativo','1.ª persona plural · pluscuamperfecto de indicativo'],'Habríamos + participio forma el condicional compuesto.'],
      ['hayan escrito','3.ª persona plural · perfecto compuesto de subjuntivo',['3.ª persona plural · perfecto compuesto de indicativo','3.ª persona plural · pluscuamperfecto de subjuntivo'],'Hayan es presente de subjuntivo de haber; con participio forma el perfecto compuesto de subjuntivo.'],
      ['hubiéramos sabido','1.ª persona plural · pluscuamperfecto de subjuntivo',['1.ª persona plural · pluscuamperfecto de indicativo','1.ª persona plural · condicional compuesto'],'Hubiéramos + participio forma el pluscuamperfecto de subjuntivo.'],
      ['estuvisteis','2.ª persona plural · pretérito perfecto simple de indicativo',['2.ª persona plural · imperfecto de indicativo','2.ª persona plural · presente de subjuntivo'],'La raíz estuv- y la terminación -isteis identifican el pretérito perfecto simple.'],
      ['tendríais','2.ª persona plural · condicional simple',['2.ª persona plural · futuro simple','2.ª persona plural · imperfecto de indicativo'],'Tendríais es condicional simple de tener.'],
      ['leyéramos','1.ª persona plural · imperfecto de subjuntivo',['1.ª persona plural · imperfecto de indicativo','1.ª persona plural · perfecto simple de indicativo'],'Leyéramos pertenece al imperfecto de subjuntivo; leíamos sería indicativo.'],
      ['habéis visto','2.ª persona plural · perfecto compuesto de indicativo',['2.ª persona plural · pluscuamperfecto de indicativo','2.ª persona plural · futuro compuesto de indicativo'],'Habéis + participio forma el perfecto compuesto de indicativo.'],
      ['condujeron','3.ª persona plural · perfecto simple de indicativo',['3.ª persona plural · imperfecto de subjuntivo','3.ª persona plural · futuro simple de indicativo'],'Condujeron expresa una acción terminada y pertenece al pretérito perfecto simple.']
    ];
    for(const [s,a,o,e] of analyses)add('verbos','analisis',s,a,o,e,s.includes('hayan')||s.includes('hubiéramos')||s.includes('leyéramos')?3:2,'Identifica persona, número, tiempo y modo.');
    const semantics=[
      ['La noticia le produjo una profunda consternación.','abatimiento',['indiferencia','entusiasmo','confianza'],'Consternación expresa una fuerte aflicción o abatimiento.'],
      ['Su respuesta fue ambigua: podía entenderse de dos maneras.','equívoca',['rotunda','irrelevante','precisa'],'Ambiguo es aquello que admite distintas interpretaciones.'],
      ['El testigo ofreció un relato verosímil.','creíble',['verdadero necesariamente','imposible','incompleto'],'Verosímil significa que parece verdadero; no garantiza que lo sea.'],
      ['Su actitud fue hostil durante toda la conversación.','enemistosa',['hospitalaria','indecisa','distraída'],'Hostil expresa oposición o enemistad.'],
      ['El equipo mostró una tenacidad admirable.','perseverancia',['arrogancia','impaciencia','apatía'],'Tenacidad es firmeza y constancia para alcanzar un propósito.'],
      ['La profesora hizo una observación pertinente.','adecuada al asunto',['muy larga','inoportuna','difícil de oír'],'Pertinente es lo que viene a propósito del asunto tratado.'],
      ['La explicación resultó superflua: ya lo sabíamos.','innecesaria',['esencial','equivocada','breve'],'Superfluo significa innecesario, que está de más.'],
      ['El acuerdo fue unánime.','todos estuvieron de acuerdo',['la mayoría aceptó','nadie pudo votar','solo decidió una persona'],'Unánime exige coincidencia de todos, no solo de la mayoría.'],
      ['La situación era precaria.','inestable y poco segura',['cómoda y estable','antigua y conocida','imposible de describir'],'Precario designa algo poco estable o con escasos medios.'],
      ['Mostró una actitud escéptica ante el anuncio.','dudaba de lo anunciado',['lo aceptaba sin dudas','se sentía eufórico','estaba completamente de acuerdo'],'Escéptico es quien duda o no acepta algo con facilidad.'],
      ['El director decidió posponer la reunión.','aplazar',['adelantar','suspender para siempre','confirmar'],'Posponer significa dejar para un momento posterior.'],
      ['Se propuso mitigar las consecuencias del error.','reducir',['agravar','ocultar completamente','provocar'],'Mitigar significa moderar o disminuir la intensidad.'],
      ['Su intervención fue concisa.','breve y precisa',['extensa y detallada','confusa','contradictoria'],'Conciso combina brevedad y precisión.'],
      ['La diferencia entre ambos textos es sutil.','difícil de percibir',['enorme','inexistente','ofensiva'],'Sutil designa aquí una diferencia fina o poco evidente.'],
      ['El relato evoca recuerdos de la infancia.','trae a la memoria',['borra','inventa necesariamente','contradice'],'Evocar significa traer algo a la memoria o a la imaginación.'],
      ['Su conducta fue imprudente.','actuó sin suficiente cautela',['actuó con generosidad','actuó con excesivo cuidado','actuó con paciencia'],'Imprudente es quien no actúa con la cautela necesaria.'],
      ['El éxito fue efímero.','duró poco tiempo',['duró para siempre','fue falso','fue inesperado'],'Efímero significa de corta duración.'],
      ['Sus intereses eran divergentes.','se dirigían en sentidos diferentes',['coincidían por completo','eran secretos','eran antiguos'],'Divergente expresa separación o diferencia de dirección.'],
      ['La respuesta fue tajante.','terminante',['dubitativa','silenciosa','ambigua'],'Tajante expresa una postura firme y concluyente.'],
      ['El nuevo dato corrobora la hipótesis.','la refuerza',['la refuta','la oculta','la sustituye'],'Corroborar significa dar mayor fuerza a una afirmación con nuevos datos.']
    ];
    for(const [s,a,o,e] of semantics)add('lexico','contexto',s,a,o,e,2,'Selecciona el significado adecuado en este contexto.');
    const relations=[
      ['Vehículo respecto a bicicleta es un…','hiperónimo',['hipónimo','sinónimo','antónimo'],'Vehículo es la categoría más amplia en la que se incluye bicicleta.'],
      ['Bicicleta respecto a vehículo es un…','hipónimo',['hiperónimo','sinónimo','antónimo'],'Bicicleta es un tipo concreto de vehículo.'],
      ['Rosa, clavel y tulipán comparten el hiperónimo…','flor',['jardín','pétalo','árbol'],'Una rosa, un clavel y un tulipán son tipos de flor.'],
      ['Comprar y vender expresan una relación de…','antonimia recíproca',['sinonimia','hiperonimia','identidad de significado'],'La misma transacción se contempla desde dos participantes: uno compra y otro vende.'],
      ['Vivo y muerto expresan una oposición…','complementaria',['gradual','recíproca','sinonímica'],'En el sentido biológico de estos adjetivos, la oposición no admite un término intermedio.'],
      ['Frío y caliente expresan una oposición…','gradual',['complementaria','recíproca','sinonímica'],'Entre ambos extremos caben grados como templado.'],
      ['Ratón puede nombrar un animal y un dispositivo informático. Es un caso de…','polisemia',['antonimia','hiponimia','sinonimia'],'Una palabra tiene varios significados relacionados; el dispositivo recibe su nombre por semejanza.'],
      ['El periódico publicó una información: «el periódico» designa aquí…','el medio de comunicación',['solo el papel utilizado','un intervalo de tiempo','una cualidad del periodista'],'El contexto permite reconocer a qué significado de periódico se refiere el enunciado.'],
      ['Pan, panadero y panadería pertenecen a…','la misma familia léxica',['un campo semántico de profesiones','una serie de antónimos','una lista de sinónimos'],'Comparten la raíz pan-; una familia léxica agrupa palabras por su raíz.'],
      ['Silla, mesa y armario pertenecen al mismo…','campo semántico',['grupo de sinónimos','grupo de antónimos','conjunto de formas verbales'],'Se relacionan por su significado: son muebles.'],
      ['Al decir «tiene un corazón de piedra», se emplea…','una metáfora',['una definición literal','una enumeración','una instrucción'],'Se atribuye figuradamente la dureza de la piedra a los sentimientos de alguien.'],
      ['En «bebió un vaso», vaso designa el contenido mediante…','metonimia',['antonimia','hiponimia','una comparación explícita'],'Se menciona el recipiente para referirse a lo que contiene.'],
      ['En «Juan es un lince para las matemáticas», lince significa…','una persona muy perspicaz',['un animal que estudia','una persona distraída','un profesor de zoología'],'Lince se usa en sentido figurado para destacar la agudeza de alguien.'],
      ['En «la falda de la montaña», falda significa…','la parte baja de la montaña',['una prenda colgada en un árbol','la cima de la montaña','una grieta de la roca'],'El contexto activa un significado de falda relacionado por semejanza con la prenda.'],
      ['La palabra banco en «se sentó en el banco del parque» designa…','un asiento',['una entidad financiera','un grupo de peces','un conjunto de datos'],'El complemento del parque y el verbo sentarse seleccionan el significado de asiento.'],
      ['¿Qué palabra es el antónimo contextual de provisional?','definitivo',['temporal','precario','momentáneo'],'Lo provisional se adopta temporalmente; lo definitivo se establece con intención de permanecer.'],
      ['¿Qué palabra es el antónimo contextual de explícito?','implícito',['claro','expreso','manifiesto'],'Lo explícito se expresa directamente; lo implícito se sobreentiende.'],
      ['¿Qué palabra es el antónimo contextual de escaso?','abundante',['insuficiente','limitado','exiguo'],'Abundante se opone a escaso por la cantidad.'],
      ['¿Qué palabra es el antónimo contextual de coherente?','contradictorio',['congruente','consecuente','razonado'],'Un discurso contradictorio no mantiene la coherencia de sus ideas.'],
      ['¿Qué palabra es el antónimo contextual de tolerante?','intransigente',['respetuoso','comprensivo','flexible'],'Intransigente describe a quien no admite otras posiciones o concesiones.']
    ];
    for(const [s,a,o,e] of relations)add('lexico','relaciones',s,a,o,e,a.includes('recíproca')||a.includes('complementaria')||a.includes('gradual')||a.includes('metonimia')?3:2,'Resuelve la relación de significado.');
    // Additional authored contexts let spaced review revisit the rule without repeating the sentence.
    const reinforcement=[
      ['ortografia','homofonos','Esta semana ___ leído dos novelas.','he',['e','eh'],'He es una forma de haber; acompaña al participio leído.'],
      ['ortografia','homofonos','Había entrenado mucho; ___, perdió la final.','sin embargo',['por tanto','por eso','en consecuencia'],'Sin embargo expresa oposición entre lo esperado y lo ocurrido.'],
      ['ortografia','homofonos','No sabemos ___ cuesta la entrada.','cuánto',['cuanto'],'Cuánto lleva tilde en una pregunta indirecta sobre una cantidad.'],
      ['ortografia','homofonos','¿___ trata ese documental?','De qué',['De que'],'De qué introduce una interrogativa y qué lleva tilde.'],
      ['ortografia','puntuacion','Elige la enumeración sin comas indebidas.','Guardó mapas, cartas y fotografías.',['Guardó, mapas cartas y fotografías.','Guardó mapas cartas, y fotografías.'],'Las comas separan elementos de la enumeración; no separan el verbo de su complemento.'],
      ['ortografia','puntuacion','Introduce las palabras literales de Luis después de respondió.','Luis respondió: «Estoy listo».',['Luis respondió, «Estoy listo».','Luis respondió; «Estoy listo».'],'Los dos puntos introducen una cita literal anunciada por respondió.'],
      ['ortografia','puntuacion','Señala la pregunta directa con todos sus signos.','¿Cuándo empieza la función?',['Cuándo empieza la función?','¿Cuándo empieza la función.'],'Las preguntas directas necesitan los dos signos de interrogación.'],
      ['ortografia','puntuacion','Elige la oración que separa el conector por tanto mediante pausas.','Por tanto, debemos revisar los datos.',['Por, tanto debemos revisar los datos.','Por tanto debemos, revisar los datos.'],'La coma se coloca tras el conector completo por tanto.'],
      ['ortografia','puntuacion','Quieres rechazar amablemente el ofrecimiento de un asiento.','No, gracias; prefiero quedarme de pie.',['No gracias; prefiero quedarme de pie.','No; ¿gracias? Prefiero quedarme de pie.'],'La coma separa la respuesta negativa de la fórmula de cortesía gracias.'],
      ['ortografia','puntuacion','Elige la frase con puntos suspensivos bien escritos.','Podemos visitar Toledo, Ávila, Segovia…',['Podemos visitar Toledo, Ávila, Segovia….','Podemos visitar Toledo, Ávila, Segovia..'],'Los puntos suspensivos son tres; no se añade un cuarto para cerrar la oración.'],
      ['ortografia','puntuacion','Quieres afirmar que todos esos corredores habían entrenado.','Los corredores, que habían entrenado, terminaron la carrera.',['Los corredores que habían entrenado terminaron la carrera.','Los corredores, que habían entrenado terminaron la carrera.'],'La relativa explicativa entre comas se refiere a todos los corredores.',3],
      ['verbos','analisis','habían salido','3.ª persona plural · pluscuamperfecto de indicativo',['3.ª persona plural · perfecto compuesto de indicativo','3.ª persona plural · condicional compuesto'],'Habían es imperfecto de haber; con participio forma el pluscuamperfecto de indicativo.'],
      ['verbos','analisis','habré llegado','1.ª persona singular · futuro compuesto de indicativo',['1.ª persona singular · futuro simple de indicativo','1.ª persona singular · condicional compuesto'],'Habré es futuro de haber; con participio forma el futuro compuesto de indicativo.'],
      ['verbos','analisis','habrías venido','2.ª persona singular · condicional compuesto',['2.ª persona singular · condicional simple','2.ª persona singular · pluscuamperfecto de indicativo'],'Habrías es condicional de haber; con participio forma el condicional compuesto.'],
      ['verbos','analisis','saldríamos','1.ª persona plural · condicional simple',['1.ª persona plural · futuro simple de indicativo','1.ª persona plural · imperfecto de indicativo'],'La terminación -ríamos identifica aquí el condicional simple.'],
      ['verbos','analisis','hemos aprendido','1.ª persona plural · perfecto compuesto de indicativo',['1.ª persona plural · pluscuamperfecto de indicativo','1.ª persona plural · perfecto compuesto de subjuntivo'],'Hemos es presente de haber; con participio forma el perfecto compuesto de indicativo.'],
      ['verbos','analisis','hayamos resuelto','1.ª persona plural · perfecto compuesto de subjuntivo',['1.ª persona plural · perfecto compuesto de indicativo','1.ª persona plural · pluscuamperfecto de subjuntivo'],'Hayamos es presente de subjuntivo de haber; con participio forma el perfecto compuesto de subjuntivo.',3],
      ['verbos','analisis','hubieras llegado','2.ª persona singular · pluscuamperfecto de subjuntivo',['2.ª persona singular · pluscuamperfecto de indicativo','2.ª persona singular · condicional compuesto'],'Hubieras es imperfecto de subjuntivo de haber; con participio forma el pluscuamperfecto de subjuntivo.',3],
      ['verbos','analisis','cantáramos','1.ª persona plural · imperfecto de subjuntivo',['1.ª persona plural · imperfecto de indicativo','1.ª persona plural · perfecto simple de indicativo'],'Cantáramos pertenece al imperfecto de subjuntivo; cantábamos sería indicativo.',3],
      ['lexico','relaciones','La palabra hoja designa una parte de una planta y una lámina de papel. Es un caso de…','polisemia',['sinonimia','antonimia','paronimia'],'La polisemia reúne varios significados relacionados de una misma palabra.'],
      ['lexico','relaciones','En «sus palabras eran puñales», se emplea…','una metáfora',['una enumeración','una metonimia','una personificación'],'La metáfora identifica las palabras con puñales por el daño que pueden causar.'],
      ['lexico','relaciones','En «escuchamos a Mozart» para referirse a su música, aparece…','una metonimia',['una metáfora','una personificación','una hipérbole'],'La metonimia designa la obra mediante el nombre de su autor.',3]
    ];
    for(const [cat,sub,display,answer,options,explain,level=2]of reinforcement)add(cat,sub,display,answer,options,explain,level,sub==='analisis'?'Identifica persona, número, tiempo y modo.':sub==='puntuacion'?'Elige la opción que cumple la intención indicada.':sub==='relaciones'?'Resuelve la relación de significado.':'Completa la frase con la opción adecuada.');
    return C;
  }
  root.GuardianLessons={catalog};if(typeof module!=='undefined')module.exports=root.GuardianLessons;
})(typeof globalThis!=='undefined'?globalThis:this);
