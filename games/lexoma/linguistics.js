/* Léxico morfológico local: solo las formas documentadas reciben análisis. */
(() => {
'use strict';
const lexicon=new Map();
const categories={det:['Determinante','◆','#e9c263'],noun:['Sustantivo','▣','#70c9f6'],adj:['Adjetivo','✧','#c59af2'],pron:['Pronombre','◈','#f59caa'],verb:['Verbo','ϟ','#f59762'],adv:['Adverbio','➶','#75d6b1'],prep:['Preposición','⌁','#9baef5'],conj:['Conjunción','∞','#ec91d4']};
function add(word,category,features={}){const key=word.toLowerCase().normalize('NFC');const analysis={word:key,lemma:features.lemma||key,category,...features};const list=lexicon.get(key)||[];if(!list.some(x=>JSON.stringify(x)===JSON.stringify(analysis)))list.push(analysis);lexicon.set(key,list);}
for(const [gender,singular,plural] of [['m','el un este ese aquel','los unos estos esos aquellos'],['f','la una esta esa aquella','las unas estas esas aquellas']]){
 singular.split(' ').forEach(w=>add(w,'det',{gender,number:'s'}));plural.split(' ').forEach(w=>add(w,'det',{gender,number:'p'}));
}
for(const [number,words] of [['s','mi tu su'],['p','mis tus sus']])words.split(' ').forEach(w=>add(w,'det',{number,gender:'any'}));
for(const [word,gender,number] of [['nuestro','m','s'],['nuestra','f','s'],['nuestros','m','p'],['nuestras','f','p'],['vuestro','m','s'],['vuestra','f','s'],['vuestros','m','p'],['vuestras','f','p']])add(word,'det',{gender,number});
const nouns={m:'mago gato perro libro bosque camino niño año sueño fuego juego río pájaro jardín dragón corazón sol mar árbol papel rey lápiz reloj tren pan pez ratón león balón castillo duende monstruo caballo alumno profesor amigo hermano padre mundo viento tiempo día hombre héroe guerrero robot ninja tintero',f:'maga gata perra niña luna casa mesa tinta palabra frase torre pluma escuela puerta ventana luz flor voz canción raíz ciudad mujer reina mano noche tarde madre amiga hermana alumna profesora bruja espada corona bolsa letra tilde historia biblioteca montaña aventura estrella agua'};
const pluralExceptions={robot:'robots',rey:'reyes',lápiz:'lápices',luz:'luces',pez:'peces',voz:'voces',raíz:'raíces',dragón:'dragones',corazón:'corazones',jardín:'jardines',ratón:'ratones',león:'leones',balón:'balones',canción:'canciones'};
for(const [gender,words] of Object.entries(nouns))for(const w of words.split(' ')){add(w,'noun',{gender,number:'s',stressedA:w==='agua'});const p=pluralExceptions[w]||w+(/[aeiouáéíóú]$/.test(w)?'s':'es');add(p,'noun',{lemma:w,gender,number:'p'});}
for(const base of 'rojo negro blanco oscuro pequeño alto bajo bueno malo bonito rápido lento antiguo nuevo viejo sabio mágico encantado cansado contento silencioso luminoso fuerte grande verde azul feliz joven triste dulce valiente brillante enorme suave inteligente'.split(' ')){
 const variable=base.endsWith('o');for(const gender of variable?['m','f']:['any']){const w=gender==='f'?base.slice(0,-1)+'a':base;add(w,'adj',{lemma:base,gender,number:'s'});if(!w.endsWith('z'))add(w==='joven'?'jóvenes':w+(/[aeiou]$/.test(w)?'s':'es'),'adj',{lemma:base,gender,number:'p'});if(w.endsWith('z'))add(w.slice(0,-1)+'ces','adj',{lemma:base,gender,number:'p'});}
}
for(const [words,person,number,gender] of [['yo',1,'s','any'],['tú',2,'s','any'],['él',3,'s','m'],['ella',3,'s','f'],['nosotros',1,'p','m'],['nosotras',1,'p','f'],['vosotros',2,'p','m'],['vosotras',2,'p','f'],['ellos',3,'p','m'],['ellas',3,'p','f']])add(words,'pron',{person,number,gender,subject:true});
for(const w of 'me te se nos os lo la los las le les'.split(' '))add(w,'pron',{subject:false});
for(const w of 'bien mal aquí allí ayer hoy mañana siempre nunca pronto lejos cerca muy bastante lentamente rápidamente tranquilamente alegremente ahora después antes también no'.split(' '))add(w,'adv');
add('mañana','noun',{gender:'f',number:'s'});
for(const w of 'a ante bajo con contra de desde durante en entre hacia hasta mediante para por según sin sobre tras'.split(' '))add(w,'prep');
for(const w of 'y e o u pero aunque porque si'.split(' '))add(w,'conj');
const endings={ar:{presente:['o','as','a','amos','áis','an'],imperfecto:['aba','abas','aba','ábamos','abais','aban'],pretérito:['é','aste','ó','amos','asteis','aron']},er:{presente:['o','es','e','emos','éis','en'],imperfecto:['ía','ías','ía','íamos','íais','ían'],pretérito:['í','iste','ió','imos','isteis','ieron']},ir:{presente:['o','es','e','imos','ís','en'],imperfecto:['ía','ías','ía','íamos','íais','ían'],pretérito:['í','iste','ió','imos','isteis','ieron']}};
const regular='talar amar cantar saltar mirar caminar cruzar jugar hablar soñar pintar estudiar ayudar nadar bailar viajar comprar formar ganar volar buscar tocar leer correr comer beber aprender vender temer comprender responder vivir escribir subir abrir recibir compartir partir';
// Cambios ortográficos y de raíz se registran explícitamente; no se inventan formas.
const irregularPresent={jugar:['juego','juegas','juega','jugamos','jugáis','juegan'],soñar:['sueño','sueñas','sueña','soñamos','soñáis','sueñan'],volar:['vuelo','vuelas','vuela','volamos','voláis','vuelan']};
for(const lemma of regular.split(' ')){
 const ending=lemma.slice(-2),root=lemma.slice(0,-2);add(lemma,'verb',{lemma,finite:false});
 for(const [tense,suffixes] of Object.entries(endings[ending]))suffixes.forEach((suffix,i)=>{
 let word=root+suffix;
 if(tense==='presente'&&irregularPresent[lemma])word=irregularPresent[lemma][i];
 if(tense==='pretérito'&&i===0){if(lemma.endsWith('car'))word=root.slice(0,-1)+'qué';if(lemma.endsWith('gar'))word=root+'ué';if(lemma.endsWith('zar'))word=root.slice(0,-1)+'cé';}
 if(lemma==='leer'&&tense==='pretérito')word=['leí','leíste','leyó','leímos','leísteis','leyeron'][i];
 add(word,'verb',{lemma,finite:true,tense,person:i%3+1,number:i<3?'s':'p'});
 });
 ['é','ás','á','emos','éis','án'].forEach((suffix,i)=>add(lemma+suffix,'verb',{lemma,finite:true,tense:'futuro',person:i%3+1,number:i<3?'s':'p'}));
}
for(const [lemma,tenses] of Object.entries({ser:{presente:'soy eres es somos sois son',imperfecto:'era eras era éramos erais eran',pretérito:'fui fuiste fue fuimos fuisteis fueron'},estar:{presente:'estoy estás está estamos estáis están',imperfecto:'estaba estabas estaba estábamos estabais estaban'},tener:{presente:'tengo tienes tiene tenemos tenéis tienen'},ir:{presente:'voy vas va vamos vais van',pretérito:'fui fuiste fue fuimos fuisteis fueron'},hacer:{presente:'hago haces hace hacemos hacéis hacen'}}))for(const [tense,words] of Object.entries(tenses))words.split(' ').forEach((w,i)=>add(w,'verb',{lemma,finite:true,tense,person:i%3+1,number:i<3?'s':'p',copular:['ser','estar'].includes(lemma)}));
const lookup=word=>lexicon.get(String(word).trim().toLowerCase().normalize('NFC'))||[];
function compatible(a,b){if(a.category==='det'&&b.stressedA&&b.number==='s'){if(['el','un'].includes(a.word))return a.number===b.number;if(['la','una'].includes(a.word))return false;}return ['gender','number'].every(k=>!a[k]||!b[k]||a[k]==='any'||b[k]==='any'||a[k]===b[k]);}
function analyze(words){
 const structures=[],errors=[];let concordances=0;const spans=[];
 const error=t=>{if(!errors.includes(t))errors.push(t);};
 function nominal(start){
  let i=start,det=null;const adjectives=[];
  if(words[i]?.category==='det')det=words[i++];
  while(words[i]?.category==='adj')adjectives.push(words[i++]);
  const core=words[i];if(!core||!['noun','pron'].includes(core.category)||core.category==='pron'&&!core.subject)return null;i++;
  while(words[i]?.category==='adj')adjectives.push(words[i++]);
  if(core.category==='pron'&&(det||adjectives.length)){error('Este pronombre personal no admite ese determinante o adjetivo.');}
  if(det){if(compatible(det,core))concordances++;else error(`«${det.word} ${core.word}»: revisa género y número.`);}
  for(const adj of adjectives){if(compatible(core,adj))concordances++;else error(`«${core.word} ${adj.word}»: revisa género y número.`);}
  if(core.category==='noun'){structures.push('Sintagma nominal');if(det&&adjectives.length)structures.push('SN enriquecido');spans.push([start,i]);}
  return {start,end:i,core,det,adjectives};
 }
 if(!words.length)return{valid:false,errors:['Añade palabras a la frase.'],structures:[],concordances:0,spans:[]};
 const subject=nominal(0);let i=subject?.end||0,verb=words[i];let sentence=false;
 if(verb?.category==='verb'&&verb.finite){
  i++;sentence=true;
  if(subject){const person=subject.core.category==='pron'?subject.core.person:3;if(verb.person!==person||verb.number!==subject.core.number)error('El sujeto y el verbo deben concordar en persona y número.');else structures.push('Sujeto + verbo');}
  else structures.push('Sujeto omitido + verbo');
  if(verb.copular){
   if(words[i]?.category==='adj'){const adj=words[i++];if(subject&&!compatible(subject.core,adj))error('El atributo debe concordar con el sujeto.');else{structures.push('Oración copulativa');if(subject)concordances++;}}
   else{const attribute=nominal(i);if(attribute){i=attribute.end;if(subject&&subject.core.number!==attribute.core.number)error('El atributo nominal debe concordar en número con el sujeto en estas construcciones sencillas.');structures.push('Oración copulativa');}else error('Añade un atributo: «es sabio», «es un mago».');}
  }
  let bareComplements=0;while(i<words.length){
   if(words[i].category==='adv'){structures.push('Verbo + adverbio');i++;continue;}
   if(words[i].category==='prep'){const p=words[i++];const n=nominal(i);if(!n){error(`Completa el complemento introducido por «${p.word}».`);break;}i=n.end;structures.push('Complemento preposicional');continue;}
   const n=nominal(i);if(n){if(++bareComplements>1){error('Usa una sola construcción nominal detrás del verbo; introduce las demás con preposición.');break;}i=n.end;structures.push('Sujeto + verbo + complemento');continue;}
   error('Esta combinación queda fuera de las estructuras sencillas del taller. Reordena o retira las cartas sobrantes.');break;
  }
 }else if(subject&&i===words.length){structures.push('Construcción nominal');}
 else error('Construye un sintagma nominal o una oración con un verbo conjugado.');
 // No se afirma identificar CD/CI ni adecuación semántica en este parser de patrones.
 return {valid:errors.length===0,errors,structures:[...new Set(structures)],concordances,spans,sentence,categoryCount:new Set(words.map(w=>w.category)).size};
}
const value=word=>[...word].reduce((n,c)=>n+('ñxz'.includes(c)?12:'jqk'.includes(c)?10:'áéíóú'.includes(c)?7:4),0)+word.length*3;
window.LexomaLanguage={lexicon,categories,lookup,analyze,value,compatible};
})();
