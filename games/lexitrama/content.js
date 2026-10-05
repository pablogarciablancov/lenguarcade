/* Lexitrama: banco pedagógico propio. Flexiones generadas solo de verbos regulares. */
window.LexitramaContent = (() => {
  'use strict';
  const words = new Map();
  function add(word, type, extra = {}) {
    word = word.normalize('NFC').toLowerCase();
    const old = words.get(word);
    if (old) { old.tags = [...new Set([...old.tags, ...(extra.tags || [])])]; return; }
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
  for (const [field, list] of Object.entries(fields)) for (const word of list.split(' ')) add(word, 'sustantivo', { semanticFields: [field] });
  for (const w of 'amistad valor respeto paz alegría tristeza miedo amor esperanza libertad verdad justicia paciencia esfuerzo bondad belleza silencio ruido tiempo vida historia memoria idea sueño salud fuerza'.split(' ')) add(w, 'sustantivo');
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
  const all=[...words.values()];
  const missions=[
    {id:'mar',title:'Encuentra palabras del mar',test:w=>w.semanticFields.includes('mar'),explain:'Pertenece al campo semántico del mar.'},
    {id:'bosque',title:'Encuentra palabras del bosque',test:w=>w.semanticFields.includes('bosque'),explain:'Pertenece al campo semántico del bosque.'},
    {id:'familia',title:'Encuentra palabras de la familia de «pan»',test:w=>w.family==='pan',explain:'Comparte raíz y significado con pan.'},
    {id:'antonimos',title:'Encuentra antónimos de «alto» o «rápido»',test:w=>['bajo','lento'].includes(w.word),explain:'Bajo se opone a alto; lento, a rápido.'},
    {id:'sinonimos',title:'Encuentra sinónimos de «bello» o «alegre»',test:w=>['hermoso','contento'].includes(w.word),explain:'Hermoso equivale a bello; contento, a alegre.'},
    {id:'sufijos',title:'Encuentra palabras formadas por sufijación',test:w=>w.tags.includes('sufijación'),explain:'Se forma añadiendo un sufijo a una base léxica.'},
    {id:'prefijos',title:'Encuentra palabras con prefijo',test:w=>w.tags.includes('prefijación'),explain:'Un prefijo modifica el significado de la base.'},
    ...['sustantivo','adjetivo','verbo','pronombre','determinante'].map(type=>({id:type,title:`Encuentra ${type==='verbo'?'verbos':type+'s'}`,test:w=>w.type===type,explain:`Su categoría en el banco es ${type}.`})),
    ...['hiato','diptongo','aguda','llana','esdrújula'].map(tag=>({id:tag,title:tag==='hiato'||tag==='diptongo'?`Encuentra palabras con ${tag}`:`Encuentra palabras ${tag}s`,test:w=>w.tags.includes(tag),explain:tag==='hiato'?'Dos vocales contiguas pertenecen a sílabas distintas.':tag==='diptongo'?'Dos vocales contiguas pertenecen a una misma sílaba.':`La acentuación de esta palabra es ${tag}.`})),
    {id:'h',title:'Encuentra palabras con h',test:w=>w.word.includes('h'),explain:'La h se conserva en la forma escrita.'},
    {id:'bv',title:'Encuentra palabras con b o v',test:w=>/[bv]/.test(w.word),explain:'Fíjate en la grafía correcta: b y v no son intercambiables.'},
    {id:'gj',title:'Encuentra palabras con g o j',test:w=>/[gj]/.test(w.word),explain:'Conserva la grafía de g o j.'},
    ...['presente','imperfecto','futuro'].map(tag=>({id:tag,title:`Encuentra verbos en ${tag==='imperfecto'?'pretérito imperfecto':tag}`,test:w=>w.type==='verbo'&&w.tags.includes(tag),explain:tag==='imperfecto'?'El imperfecto de indicativo presenta acciones pasadas en desarrollo o habituales.':`Es una forma de ${tag} de indicativo.`})),
    {id:'plural',title:'Encuentra verbos en plural',test:w=>w.type==='verbo'&&w.number==='plural',explain:'La forma verbal corresponde a nosotros, vosotros o ellos.'},
    {id:'primera',title:'Encuentra verbos de primera conjugación',test:w=>w.type==='verbo'&&w.conjugation===1,explain:'Su infinitivo termina en -ar.'}
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
