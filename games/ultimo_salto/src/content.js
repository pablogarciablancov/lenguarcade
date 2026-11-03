// Banco de acentuación. El orden conserva los tableros guardados.
const groups = [
 ['aguda',false,'reloj|papel|animal|color|pared|motor|salud|cantar|abril|feliz|metal|tambor'],
 ['aguda',true,'canción|balcón|café|compás|ratón|jardín|sofá|menú|bebé|colibrí|capitán|corazón'],
 ['llana',false,'mesa|libro|casa|bosque|nube|tarde|luna|barco|ventana|camino|palabra|montaña'],
 ['llana',true,'árbol|lápiz|césped|mármol|cárcel|túnel|azúcar|fácil|difícil|débil|útil|ángel'],
 ['esdrújula',true,'médico|pájaro|brújula|teléfono|música|sábado|lámpara|número|plátano|cámara|página|rápido'],
 ['aguda',true,'país|baúl|raíz|maíz|oír|reír|freír|laúd'],
 ['llana',true,'poesía|río|frío|grúa|búho|día|tío|sandía|alegría|vacío'],
 ['llana',false,'teatro|poeta|caoba|toalla|aldea|canoa|pelea|azotea'],
 ['llana',false,'cielo|fuerte|puerta|tierra|aire|causa|ciudadano|cuento|ruido|cuidado|fuego|viaje'],
 ['aguda',false,'ciudad|cuidar|triunfar|cambiar|bailar|peinar'],
 ['aguda',true,'después|también|adiós|avión|camión|acción']
];
export const WORDS=groups.flatMap(([stress,accent,list])=>list.split('|').map(text=>({text,stress,accent})));
// Conceptos g2-sustantivo, g2-adjetivo y g3-verbo del banco curricular de 2.º ESO.
const grammar = {
 sustantivo:'mochila|bicicleta|tortuga|hospital|espejo|semilla|carpeta|paraguas|mariposa|castillo|recreo|teclado|cuchara|botella|puente|estadio|zapato|pelota|cuaderno|biblioteca|elefante|patinete|brújula|guitarra|cascada|isla|tormenta|castaña|regadera|maleta',
 adjetivo:'enorme|pequeño|redonda|estrecho|luminoso|oscura|blando|rugosa|verdosa|anaranjada|cómodo|estrecha|pegajoso|elegante|silenciosa|amable|veloz|perezosa|frágil|salado|ácida|tibio|fresca|suave|helada|tímido|alargada|espacioso|curiosa|inmenso',
 verbo:'saltar|dibujar|leer|escribir|dormir|masticar|encender|mirar|buscar|construir|aprender|escuchar|respirar|caminar|correr|nadar|cocinar|abrir|cerrar|barrer|beber|lavar|gritar|dudar|reír|esconder|subir|bajar|recoger|descansar'
};
const grammarWords = Object.entries(grammar).flatMap(([category,list]) =>
 list.split('|').map(text=>({text,category}))
);
export const wordsFor = rule => rule.category ? grammarWords : WORDS;
export const RULES=[
 {id:'sustantivo',category:'sustantivo',name:'Nombres de las ruinas',instruction:'Pisa solo sustantivos.',hint:'Nombran seres, objetos, lugares o ideas.',test:w=>w.category==='sustantivo',examples:['mochila','tortuga','hospital'],counter:'saltar'},
 {id:'verbo',category:'verbo',name:'Piedras en acción',instruction:'Pisa solo verbos en infinitivo.',hint:'Se pueden conjugar. Los de este tablero terminan en -ar, -er o -ir.',test:w=>w.category==='verbo',examples:['saltar','leer','dormir'],counter:'mochila'},
 {id:'adjetivo',category:'adjetivo',name:'El sello de las cualidades',instruction:'Pisa solo adjetivos.',hint:'Expresan cómo es un ser, un objeto o un lugar.',test:w=>w.category==='adjetivo',examples:['enorme','redonda','verdosa'],counter:'leer'},
 {id:'aguda',name:'El último latido',instruction:'Pisa solo palabras agudas.',hint:'Su sílaba tónica es la última.',test:w=>w.stress==='aguda',examples:['reloj','papel','café'],counter:'mesa'},
 {id:'llana',name:'El equilibrio',instruction:'Pisa solo palabras llanas.',hint:'Su sílaba tónica es la penúltima.',test:w=>w.stress==='llana',examples:['mesa','árbol','libro'],counter:'reloj'},
 {id:'esdrujula',name:'Ecos de piedra',instruction:'Pisa solo palabras esdrújulas.',hint:'Su sílaba tónica es la antepenúltima.',test:w=>w.stress==='esdrújula',examples:['médico','pájaro','brújula'],counter:'café'},
 {id:'tilde',name:'La marca antigua',instruction:'Pisa solo palabras que llevan tilde.',hint:'Busca un acento gráfico: á, é, í, ó, ú.',test:w=>w.accent,examples:['árbol','café','música'],counter:'reloj'},
 {id:'sin_tilde',name:'Piedra desnuda',instruction:'Pisa solo palabras que se escriben sin tilde.',hint:'Distingue acento prosódico y tilde: todas tienen sílaba tónica.',test:w=>!w.accent,examples:['mesa','reloj','cielo'],counter:'país'},
 {id:'aguda_tilde',name:'El sello del umbral',instruction:'Pisa agudas que llevan tilde.',hint:'Han de cumplirse las dos condiciones: aguda y con tilde.',test:w=>w.stress==='aguda'&&w.accent,examples:['café','canción','país'],counter:'árbol'},
 {id:'llana_sin',name:'La senda silenciosa',instruction:'Pisa llanas que se escriben sin tilde.',hint:'Han de ser llanas y no llevar acento gráfico.',test:w=>w.stress==='llana'&&!w.accent,examples:['mesa','cielo','teatro'],counter:'árbol'}
];
const order=['aguda','llana','esdrujula','tilde','sin_tilde','sustantivo','verbo','aguda_tilde','llana_sin','sustantivo','verbo','aguda','llana','esdrujula','aguda_tilde','adjetivo','verbo','llana_sin','tilde','sustantivo'];
export const LEVELS=order.map((rule,i)=>({id:i+1,rule,rows:i<3?4:i<9?5:6,cols:i<3?4:5,hidden:i>=9,title:[
 'El primer salto','Entre columnas','El eco de las ruinas','El sello dorado','Piedras sin marca','Las fuentes gemelas','El puente de las voces','La puerta del acento','El jardín dormido','La inscripción borrada','El vínculo secreto','Los últimos latidos','La balanza oculta','El tercer eco','El juramento','El río suspendido','Los arcos del viento','El silencio de piedra','La constelación','El corazón del templo'][i],final:i===19}));
export const ruleFor=id=>RULES.find(r=>r.id===id);
export function explain(word,rule){
 const w=typeof word==='string'?wordsFor(rule).find(entry=>entry.text===word):word;
 if(rule.category){
  const label=w.category==='verbo'?'verbo en infinitivo':w.category;
  return `«${w.text}» es un ${label}. ${rule.instruction}`;
 }
 return `«${w.text}» es ${w.stress} y se escribe ${w.accent?'con':'sin'} tilde. ${rule.instruction}`;
}
export const FINAL_RULES = ['sustantivo','aguda_tilde','adjetivo'];
export const REPLACED_LEVELS = [6,7,10,11,16,17];
export const ACHIEVEMENTS=[{id:'first',name:'Un salto de fe',desc:'Completa tu primer templo.'},{id:'perfect',name:'Ni una grieta',desc:'Consigue tres estrellas en un templo.'},{id:'deduction',name:'Lector de runas',desc:'Supera una regla oculta sin pistas.'},{id:'half',name:'Explorador de las alturas',desc:'Completa diez templos.'},{id:'temple',name:'Guardián de las palabras',desc:'Completa los veinte templos.'}];
