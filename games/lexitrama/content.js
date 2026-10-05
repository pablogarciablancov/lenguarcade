/* Lexitrama: banco pedagógico propio. Flexiones generadas solo de verbos regulares. */
window.LexitramaContent = (() => {
  'use strict';
  const words = new Map();
  function add(word, type, extra = {}) {
    word = word.normalize('NFC').toLowerCase();
    const old = words.get(word);
    if (old) {
      old.tags = [...new Set([...old.tags, ...(extra.tags || [])])];
      old.semanticFields = [...new Set([...old.semanticFields, ...(extra.semanticFields || [])])];
      old.types = [...new Set([...(old.types || [old.type]), type])];
      if (extra.family && !old.family) old.family = extra.family;
      for (const key of ['conjugation','mood','tense','person','number']) if (old[key] == null && extra[key] != null) old[key] = extra[key];
      return;
    }
    words.set(word, { word, lemma: word, type, family: null, semanticFields: [], tags: [], difficulty: word.length > 8 ? 3 : word.length > 5 ? 2 : 1, ...extra });
  }
  const fields = {
    mar: 'mar ola playa arena barco vela puerto faro isla coral espuma costa ancla pesca pez remo timón gaviota océano marea buzo sal orilla alga concha',
    bosque: 'bosque árbol hoja rama raíz tronco pino roble encina musgo seta flor fruto semilla nido ardilla lobo zorro ciervo monte río lago hierba sendero tierra',
    ciudad: 'ciudad calle plaza puente casa edificio torre parque tienda colegio barrio mercado acera avenida semáforo tráfico metro autobús tren estación teatro museo hospital biblioteca',
    escuela: 'aula libro cuaderno lápiz goma regla tinta página texto palabra letra sílaba verbo cuento novela poema verso rima lectura mapa dibujo examen recreo mochila',
    cielo: 'sol luna estrella planeta cometa nube lluvia nieve viento trueno rayo tormenta brisa arcoíris cielo aire luz sombra aurora noche día tarde mañana horizonte',
    comida: 'pan leche queso arroz sopa carne fruta huevo sal azúcar harina miel manzana pera uva fresa cereza naranja limón melón sandía tomate patata aceite',
    animales: 'gato perro caballo vaca oveja cabra conejo gallina pato águila búho paloma gorrión cigüeña león tigre oso elefante jirafa mono tortuga rana delfín ballena pingüino'
  };
  // Campos relacionados, no listas exclusivas: una palabra puede encajar en varios.
  const fieldExtensions = {
    bosque: 'seto arbusto matorral arboleda arbolito pinar robledal encinar hayedo alameda abeto haya abedul castaño nogal olmo fresno aliso sauce chopo ciprés tejo acebo enebro cedro eucalipto avellano laurel madroño alcornoque bambú helecho liquen hongo sotobosque maleza zarza espino brezo retama romero tomillo ortiga trébol jara enredadera hiedra corteza ramaje follaje hojarasca savia resina piña bellota castaña nuez baya polen brote yema espora tocón leña madera leñador guarda guardabosque fauna flora vegetación insecto hormiga abeja avispa mariposa escarabajo mosquito grillo saltamontes araña oruga gusano lombriz serpiente culebra lagarto lagartija rana sapo caracol babosa topo ratón erizo liebre conejo jabalí oso lince tejón nutria castor corzo gamo búho lechuza pájaro gorrión cuervo águila halcón petirrojo picapinos arroyo riachuelo ribera manantial charca laguna cascada humus barro suelo piedra roca montaña valle colina ladera claro sombra cueva madriguera huella senda camino vereda parque reserva naturaleza ecosistema hábitat refugio lluvia agua brisa viento',
    mar: 'agua bahía golfo cabo península estrecho acantilado arrecife islote archipiélago atolón ensenada estuario ría desembocadura duna oleaje marejada pleamar bajamar rompiente brisa salitre salinidad profundidad superficie horizonte costa litoral embarcación navío nave velero yate lancha bote balsa canoa kayak buque ferry transatlántico crucero petrolero carguero pesquero submarino cubierta casco quilla proa popa babor estribor mástil aparejo cuerda cabo red arpón flotador chaleco salvavidas boya baliza muelle espigón astillero marinero marino capitán tripulante tripulación pescador navegante navegación náufrago naufragio travesía crucero buceo submarinista escafandra aleta pulpo calamar sepia medusa tiburón ballena delfín foca morsa tortuga gamba langosta cangrejo mejillón ostra almeja berberecho caracola molusco crustáceo sardina atún bacalao merluza salmón lubina dorada raya caballito pingüino pelícano plancton perla coral tentáculo branquia escama banco cardumen sirena tesoro tormenta temporal espuma océano sal',
    ciudad: 'pueblo urbe municipio ayuntamiento alcalde vecino peatón semáforo farola portal ventana balcón tejado escalera ascensor aparcamiento garaje carretera rotonda carril bicicleta coche taxi tranvía autobús estación aeropuerto policía bombero ambulancia farmacia clínica banco oficina cine restaurante cafetería panadería carnicería frutería zapatería librería papelería quiosco fuente estatua monumento catedral iglesia palacio castillo muralla jardín teatro museo concierto estadio piscina gimnasio polideportivo',
    escuela: 'escuela colegio instituto profesor profesora alumno alumna estudiante maestro maestra clase lección asignatura tarea ejercicio deber pizarra tiza rotulador bolígrafo estuche cartulina papel tijera pegamento folio carpeta pupitre mesa silla diccionario enciclopedia biblioteca laboratorio ordenador pantalla teclado ratón matemáticas lengua gramática ortografía geografía ciencia filosofía historia religión música pintura deporte patio comedor tutor tutoría director directora educación enseñanza aprendizaje conocimiento acento tilde oración sustantivo adjetivo pronombre lectura escritor escritora',
    cielo: 'firmamento astro satélite galaxia universo espacio nebulosa meteorito constelación eclipse órbita amanecer atardecer ocaso alba crepúsculo anochecer niebla neblina granizo llovizna chubasco aguacero borrasca anticiclón huracán tornado vendaval relámpago nubarrón rocío escarcha helada arcoíris atmósfera oxígeno ozono temperatura clima calor frío arco luz sombra horizonte',
    comida: 'alimento comida bebida desayuno almuerzo merienda cena plato vaso taza cuchara tenedor cuchillo mantel cocina cocinero cocinera receta horno sartén olla cazuela ensalada verdura legumbre cereal trigo avena cebada centeno maíz pasta macarrón espagueti garbanzo lenteja judía alubia guisante haba zanahoria cebolla ajo puerro pepino calabaza calabacín pimiento lechuga espinaca coliflor brócoli champiñón seta plátano kiwi piña mango melocotón albaricoque ciruela mandarina pomelo aguacate sandía nuez almendra avellana cacahuete pistacho yogur nata mantequilla chocolate cacao café té zumo agua vinagre sal pimienta orégano canela perejil pollo pavo cerdo ternera jamón chorizo salchicha pescado pulpo calamar sardina atún merluza panecillo tostada galleta bizcocho tarta pastel helado caramelo tortilla paella hamburguesa pizza bocadillo',
    animales: 'ardilla lobo zorro ciervo corzo gamo jabalí oso lince tejón nutria castor topo ratón erizo liebre conejo perro cachorro potro burro asno mula toro buey ternero cordero cerdo jabalí camello dromedario rinoceronte hipopótamo cebra gacela antílope búfalo chimpancé gorila orangután lémur ardilla koala canguro panda murciélago lechuza pájaro cuervo águila halcón buitre petirrojo picapinos golondrina vencejo gaviota pelícano pingüino loro tucán avestruz flamenco pavo cisne oca ganso serpiente culebra cobra cocodrilo caimán lagarto lagartija iguana camaleón rana sapo salamandra tritón pez tiburón sardina atún salmón raya pulpo calamar medusa foca morsa caracol babosa lombriz gusano insecto hormiga abeja avispa mariposa escarabajo mosquito mosca grillo saltamontes araña oruga langosta cangrejo gamba molusco mejillón ostra almeja'
  };
  for (const field of Object.keys(fields)) fields[field] += ' ' + fieldExtensions[field];
  for (const [field, list] of Object.entries(fields)) for (const word of list.split(' ')) add(word, 'sustantivo', { semanticFields: [field] });
  for (const w of 'amistad guerra valor respeto paz alegría tristeza miedo amor esperanza libertad verdad justicia paciencia esfuerzo bondad belleza silencio ruido tiempo vida historia memoria idea sueño salud fuerza'.split(' ')) add(w, 'sustantivo');
  const pairs = [
    ['alto','bajo'],['grande','pequeño'],['largo','corto'],['ancho','estrecho'],['rápido','lento'],['fácil','difícil'],['claro','oscuro'],['limpio','sucio'],['nuevo','viejo'],['duro','blando'],['fuerte','débil'],['rico','pobre'],['feliz','triste'],['frío','caliente'],['dulce','amargo'],['lleno','vacío'],['abierto','cerrado'],['cercano','lejano'],['valiente','cobarde'],['útil','inútil'],['justo','injusto'],['visible','invisible'],['posible','imposible'],['legal','ilegal'],['paciente','impaciente']
  ];
  for (const [a,b] of pairs) { add(a,'adjetivo',{antonym:b}); add(b,'adjetivo',{antonym:a}); }
  for (const [a,b] of [['bello','hermoso'],['alegre','contento'],['veloz','rápido'],['enorme','gigante'],['tranquilo','sereno'],['amable','cordial']]) {
    add(a,'adjetivo',{synonym:b}); add(b,'adjetivo',{synonym:a}); words.get(a).synonym=b; words.get(b).synonym=a;
  }
  for (const w of 'yo tú él ella nosotros nosotras vosotros vosotras ellos ellas alguien nadie algo nada quien quienes'.split(' ')) add(w,'pronombre');
  for (const w of 'mi mis tu tus su sus este esta estos estas ese esa esos esas aquel aquella aquellos aquellas un una unos unas cada'.split(' ')) add(w,'determinante');
  for (const w of 'ayer hoy mañana aquí allí cerca lejos pronto tarde siempre nunca también tampoco bien mal despacio'.split(' ')) add(w,'adverbio');
  const families = {
    pan: ['panadero','panadería','panecillo'], flor: ['florero','florista','florecer'], libro: ['librero','librería'], mar: ['marino','marinero','marítimo'], casa: ['casita','caserío','casero'], árbol: ['arboleda','arbolito'], papel: ['papel','papelera','papelería'], zapato: ['zapato','zapatero','zapatería'], reloj: ['reloj','relojero','relojería']
  };
  for (const [family,list] of Object.entries(families)) {
    if (words.has(family)) words.get(family).family=family;
    for (const word of list) add(word, word==='florecer'?'verbo':word==='marino'||word==='marítimo'||word==='casero'?'adjetivo':'sustantivo', { family, tags: word===family?[]:['sufijación'] });
  }
  for (const [w,base] of [['inútil','útil'],['injusto','justo'],['invisible','visible'],['imposible','posible'],['ilegal','legal'],['impaciente','paciente'],['desleal','leal'],['desigual','igual'],['releer','leer'],['rehacer','hacer'],['submarino','marino'],['prehistoria','historia']]) {
    add(w, /er$/.test(w)?'verbo':w==='prehistoria'?'sustantivo':'adjetivo',{family:base,tags:['prefijación']});
    const entry=words.get(w); entry.family=base; entry.tags=[...new Set([...entry.tags,'prefijación'])];
  }
  const mark=(tag,list)=>{for(const w of list.split(' ')) { if(!words.has(w))add(w,'sustantivo'); words.get(w).tags.push(tag); }};
  mark('hiato','raíz río día océano marea poeta poesía país baúl maíz teatro aéreo vacío sandía alegría panadería librería papelería zapatería relojería caserío');
  words.get('aéreo').type='adjetivo';
  mark('diptongo','tierra cielo viento nieve cuento puente ciudad huevo ruido fuego aire reina peine causa pausa viaje diario agua');
  mark('aguda','raíz timón estación hospital arroz limón melón amor valor libertad verdad salud país baúl maíz reloj');
  mark('llana','árbol lápiz fácil difícil débil útil inútil azúcar casa libro escuela bosque playa barco alto bajo');
  mark('esdrújula','rápido sílaba página océano semáforo tráfico águila música teléfono brújula gramática mágico pájaro número ejército');
  words.get('búho').tags.push('llana','hiato'); words.get('mágico').type='adjetivo';
  const regular = ['cantar','saltar','bailar','hablar','mirar','estudiar','caminar','dibujar','escuchar','comprar','trabajar','nadar','viajar','amar','temer','comer','beber','vender','correr','aprender','vivir','partir','subir','abrir','escribir'];
  const endings={ ar:{presente:['o','as','a','amos','áis','an'],imperfecto:['aba','abas','aba','ábamos','abais','aban']}, er:{presente:['o','es','e','emos','éis','en'],imperfecto:['ía','ías','ía','íamos','íais','ían']}, ir:{presente:['o','es','e','imos','ís','en'],imperfecto:['ía','ías','ía','íamos','íais','ían']} };
  const future=['é','ás','á','emos','éis','án'];
  for(const lemma of regular) {
    const ending=lemma.slice(-2),stem=lemma.slice(0,-2),conjugation={ar:1,er:2,ir:3}[ending];
    add(lemma,'verbo',{lemma,conjugation,mood:'infinitivo',tags:['infinitivo','aguda']});
    for(const tense of ['presente','imperfecto','futuro']) for(let p=0;p<6;p++) {
      const word=tense==='futuro'?lemma+future[p]:stem+endings[ending][tense][p];
      const tags=[tense,'indicativo'];
      if(tense==='imperfecto'&&ending!=='ar')tags.push('hiato');
      if(tense==='imperfecto'&&p===3)tags.push('esdrújula');
      if(tense==='futuro'&&p!==3)tags.push('aguda');
      if(tense==='presente'&&p===4)tags.push('aguda');
      const extra={lemma,conjugation,tense:tense==='imperfecto'?'pretérito imperfecto':tense,mood:'indicativo',person:p%3+1,number:p<3?'singular':'plural',tags};
      // Las formas compartidas (yo/él) conservan todas las lecturas posibles.
      if(words.has(word)&&words.get(word).type==='verbo') {const e=words.get(word); (e.analyses ||= [{person:e.person,number:e.number,tense:e.tense}]).push({person:extra.person,number:extra.number,tense:extra.tense});}
      else add(word,'verbo',extra);
    }
  }
  // Flexión nominal: no se inventan plurales de palabras invariables ni se
  // conservan tildes que deben cambiar. Las formas acentuadas se declaran.
  const accentedPlurals = Object.fromEntries('examen:exámenes joven:jóvenes país:países baúl:baúles maíz:maíces árbol:árboles raíz:raíces río:ríos timón:timones océano:océanos lápiz:lápices sílaba:sílabas página:páginas águila:águilas búho:búhos ratón:ratones jabalí:jabalíes pájaro:pájaros césped:céspedes hábitat:hábitats bambú:bambúes capitán:capitanes náufrago:náufragos mástil:mástiles atún:atunes salmón:salmones pelícano:pelícanos pingüino:pingüinos relámpago:relámpagos órbita:órbitas satélite:satélites galería:galerías café:cafés té:tés limón:limones melón:melones plátano:plátanos melocotón:melocotones albaricoque:albaricoques brócoli:brócolis champiñón:champiñones macarrón:macarrones jamón:jamones antílope:antílopes búfalo:búfalos lémur:lémures tucán:tucanes semáforo:semáforos bolígrafo:bolígrafos estación:estaciones educación:educaciones oración:oraciones canción:canciones avión:aviones lección:lecciones corazón:corazones'.split(' ').map(pair=>pair.split(':')));
  for (const entry of [...words.values()]) {
    if (!entry.types?.includes('sustantivo') && entry.type !== 'sustantivo') continue;
    const word = entry.word;
    const plural = accentedPlurals[word] || (!/[áéíóú]/.test(word) ?
      /[aeiou]$/.test(word) ? word + 's' : /z$/.test(word) ? word.slice(0,-1) + 'ces' : /[lrdj]$/.test(word) ? word + 'es' : null : null);
    if (plural) add(plural, 'sustantivo', {lemma:entry.lemma, number:'plural', semanticFields:[...entry.semanticFields], family:entry.family, tags:entry.tags.filter(tag=>!['aguda','llana','esdrújula','hiato','diptongo'].includes(tag))});
  }
  // Las misiones ortográficas usan la misma ficha que las semánticas.
  // Núcleos vocálicos: u muda en que/qui/gue/gui, h intercalada e hiatos
  // de vocales fuertes o í/ú; las palabras monosílabas no son agudas/llanas.
  function spellingTags(word) {
    const spelling = word.replace(/([gq])u(?=[eéií])/g,'$1').replace(/y$/,'Y');
    const vowels = [...spelling].map((letter,index)=>({letter,index})).filter(v=>/[aeiouáéíóúüY]/.test(v.letter));
    const groups=[]; let hiatus=false;
    const strong = v=>/[aeoáéó]/.test(v);
    const accentedWeak = v=>/[íú]/.test(v);
    for (const vowel of vowels) {
      const group=groups.at(-1),previous=group?.at(-1);
      const adjacent=previous && /^h*$/.test(spelling.slice(previous.index+1,vowel.index));
      const split=adjacent && (accentedWeak(previous.letter)||accentedWeak(vowel.letter)||(strong(previous.letter)&&strong(vowel.letter))||previous.letter===vowel.letter);
      if (split) hiatus=true;
      if (adjacent && !split) group.push(vowel); else groups.push([vowel]);
    }
    const tags=[];
    if(hiatus)tags.push('hiato');
    if(groups.some(group=>group.length===2))tags.push('diptongo');
    if(groups.length>1){
      let stress=groups.findIndex(group=>group.some(v=>/[áéíóú]/.test(v.letter)));
      if(stress<0)stress=groups.length-(/[aeiouáéíóúü]$|[aeiouáéíóúü][ns]$/.test(word)?2:1);
      const distance=groups.length-stress;
      if(distance<=3)tags.push(['aguda','llana','esdrújula'][distance-1]);
    }
    return tags;
  }
  for(const entry of words.values()) entry.tags=[...new Set([...entry.tags.filter(tag=>!['aguda','llana','esdrújula','hiato','diptongo'].includes(tag)),...spellingTags(entry.word)])];
  const all=[...words.values()];
  const missions=[
    {id:'mar',title:'Encuentra palabras del mar',test:w=>w.semanticFields.includes('mar'),explain:'Pertenece al campo semántico del mar.'},
    {id:'bosque',title:'Encuentra palabras del bosque',test:w=>w.semanticFields.includes('bosque'),explain:'Pertenece al campo semántico del bosque.'},
    {id:'familia',title:'Encuentra palabras de la familia de «pan»',test:w=>w.family==='pan',explain:'Comparte raíz y significado con pan.'},
    {id:'antonimos',title:'Encuentra antónimos de «alto» o «rápido»',test:w=>['bajo','lento'].includes(w.word),explain:'Bajo se opone a alto; lento, a rápido.'},
    {id:'sinonimos',title:'Encuentra sinónimos de «bello» o «alegre»',test:w=>['hermoso','contento'].includes(w.word),explain:'Hermoso equivale a bello; contento, a alegre.'},
    {id:'sufijos',title:'Encuentra palabras formadas por sufijación',test:w=>w.tags.includes('sufijación'),explain:'Se forma añadiendo un sufijo a una base léxica.'},
    {id:'prefijos',title:'Encuentra palabras con prefijo',test:w=>w.tags.includes('prefijación'),explain:'Un prefijo modifica el significado de la base.'},
    ...['sustantivo','adjetivo','verbo','pronombre','determinante'].map(type=>({id:type,title:`Encuentra ${type==='verbo'?'verbos':type+'s'}`,test:w=>w.type===type||w.types?.includes(type),explain:`Su categoría en el banco es ${type}.`})),
    ...['hiato','diptongo','aguda','llana','esdrújula'].map(tag=>({id:tag,title:tag==='hiato'||tag==='diptongo'?`Encuentra palabras con ${tag}`:`Encuentra palabras ${tag}s`,test:w=>w.tags.includes(tag),explain:tag==='hiato'?'Dos vocales contiguas pertenecen a sílabas distintas.':tag==='diptongo'?'Dos vocales contiguas pertenecen a una misma sílaba.':`La acentuación de esta palabra es ${tag}.`})),
    {id:'h',title:'Encuentra palabras con h',test:w=>w.word.includes('h'),explain:'La h se conserva en la forma escrita.'},
    {id:'bv',title:'Encuentra palabras con b o v',test:w=>/[bv]/.test(w.word),explain:'Fíjate en la grafía correcta: b y v no son intercambiables.'},
    {id:'gj',title:'Encuentra palabras con g o j',test:w=>/[gj]/.test(w.word),explain:'Conserva la grafía de g o j.'},
    ...['presente','imperfecto','futuro'].map(tag=>({id:tag,title:`Encuentra verbos en ${tag==='imperfecto'?'pretérito imperfecto':tag}`,test:w=>(w.type==='verbo'||w.types?.includes('verbo'))&&w.tags.includes(tag),explain:tag==='imperfecto'?'El imperfecto de indicativo presenta acciones pasadas en desarrollo o habituales.':`Es una forma de ${tag} de indicativo.`})),
    {id:'plural',title:'Encuentra verbos en plural',test:w=>(w.type==='verbo'||w.types?.includes('verbo'))&&w.number==='plural',explain:'La forma verbal corresponde a nosotros, vosotros o ellos.'},
    {id:'primera',title:'Encuentra verbos de primera conjugación',test:w=>(w.type==='verbo'||w.types?.includes('verbo'))&&w.conjugation===1,explain:'Su infinitivo termina en -ar.'}
  ];
  const worlds=[
    {id:'bosque',name:'Bosque Léxico',color:'#72dfaa',subtitle:'El significado abre caminos',missions:['mar','bosque','familia','sinonimos','antonimos'],boss:'La Sombra Léxica',bossMission:'bosque'},
    {id:'forja',name:'Forja Morfológica',color:'#ffa96a',subtitle:'La raíz de cada palabra',missions:['sufijos','prefijos','familia','sustantivo','adjetivo'],boss:'El Borrador',bossMission:'sufijos'},
    {id:'ciudad',name:'Ciudad Gramatical',color:'#73beff',subtitle:'Cada palabra tiene su lugar',missions:['sustantivo','adjetivo','verbo','pronombre','determinante'],boss:'El Devorapalabras',bossMission:'verbo'},
    {id:'pantano',name:'Pantano Ortográfico',color:'#c3a0ff',subtitle:'La tilde ilumina el camino',missions:['h','bv','gj','diptongo','hiato'],boss:'Guardián del Hiato',bossMission:'hiato'},
    {id:'templo',name:'Templo Verbal',color:'#f6d77e',subtitle:'Domina los tiempos',missions:['presente','imperfecto','futuro','plural','primera'],boss:'El Cronófago',bossMission:'imperfecto'}
  ];
  const levels=worlds.flatMap((world,wi)=>[...world.missions,world.bossMission].map((mission,i)=>({id:`${world.id}_${i+1}`,world:world.id,index:i,mission,size:i===5?7:i===0?3:i<3?4:5,goal:i===5?8:i<2?3:5,moves:i===5?22:12+i*2,boss:i===5?world.boss:null,unlock:wi*6+i,special:i>=1,third:i===5?'precision':i<2?'reserve':'long'})));
  const achievements=[];
  const metric=(key,title,thresholds)=>thresholds.forEach(n=>achievements.push({id:`${key}_${n}`,name:`${title} ${n}`,description:`Alcanza ${n} en ${title.toLowerCase()}.`,key,target:n}));
  metric('words','Palabras tejidas',[1,10,50,100,250,500,1000]); metric('longest','Gran palabra',[6,8,10,12]); metric('streak','Racha impecable',[3,5,8,12]); metric('wins','Atlas recorrido',[1,5,10,20,30]); metric('perfect','Precisión perfecta',[1,5,10]); metric('bosses','Cazajefes',[1,3,5]); metric('threeStars','Tres estrellas',[1,5,10,20]); metric('daily','Tejedor diario',[1,7,30]); metric('specials','Alquimista',[1,20,100]); metric('xp','Experiencia',[100,1000,5000]);
  return {words:all,byWord:words,missions,worlds,levels,achievements,ranks:['Aprendiz','Rastreador','Tejedor','Lexista','Maestro','Gran Lexarca']};
})();
