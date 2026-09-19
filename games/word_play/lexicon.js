(() => {
'use strict';
const additions = [
  'adjetivo','adjetivos','adverbio','adverbios','anáfora','anáforas','antónimo','antónimos',
  'asíndeton','campo','complemento','complementos','conjugación','conjugaciones','conjunción','conjunciones',
  'determinante','determinantes','diéresis','diptongo','diptongos','esdrújula','esdrújulas','fonema','fonemas',
  'gramatical','hipérbaton','hipérbole','hiato','hiatos','interjección','interjecciones','lexema','lexemas',
  'léxico','metáfora','metáforas','morfema','morfemas','morfología','narrador','narradores','onomatopeya',
  'oración','oraciones','ortográfico','ortográfica','parónimo','parónimos','perífrasis','polisíndeton',
  'predicado','predicados','preposición','preposiciones','pronombre','pronombres','semántica','sílaba','sílabas',
  'sintagma','sintagmas','sintaxis','sujeto','sujetos','sustantivo','sustantivos','sinónimo','sinónimos',
  'tilde','tildes','verbo','verbos','vocativo','vocativos','aguda','agudas','llana','llanas','sobresdrújula'
];
const strict = {
  cancion:'canción', canciones:'canciones', camion:'camión', camiones:'camiones', avion:'avión', aviones:'aviones',
  accion:'acción', acciones:'acciones', corazon:'corazón', corazones:'corazones', rincon:'rincón', jardin:'jardín',
  lapiz:'lápiz', arbol:'árbol', arboles:'árboles', musica:'música', musico:'músico', musicos:'músicos',
  rapido:'rápido', rapida:'rápida', rapidos:'rápidos', rapidas:'rápidas', dificil:'difícil', faciles:'fáciles',
  facil:'fácil', filosofia:'filosofía', religion:'religión', gramatica:'gramática', ortografia:'ortografía',
  tecnologia:'tecnología', linguistica:'lingüística', linguistico:'lingüístico',
  pinguino:'pingüino', pinguinos:'pingüinos', verguenza:'vergüenza', bilingue:'bilingüe', bilingues:'bilingües',
  ciguena:'cigüeña', ciguenas:'cigüeñas', murcielago:'murciélago', murcielagos:'murciélagos',
  dia:'día', dias:'días', despues:'después', aqui:'aquí', alli:'allí', tambien:'también', ademas:'además',
  jamas:'jamás', quiza:'quizá', quizas:'quizás', segun:'según', comun:'común', comunes:'comunes',
  ningun:'ningún', algun:'algún', numero:'número', numeros:'números', pagina:'página', paginas:'páginas',
  metodo:'método', metodos:'métodos', termino:'término', terminos:'términos', analisis:'análisis', sintesis:'síntesis',
  semantica:'semántica', morfologia:'morfología', metafora:'metáfora', metaforas:'metáforas', hiperbole:'hipérbole',
  anafora:'anáfora', anaforas:'anáforas', asindeton:'asíndeton', polisindeton:'polisíndeton',
  silaba:'sílaba', silabas:'sílabas', sinonimo:'sinónimo', sinonimos:'sinónimos', antonimo:'antónimo', antonimos:'antónimos',
  paronimo:'parónimo', paronimos:'parónimos', esdrujula:'esdrújula', esdrujulas:'esdrújulas',
  sobresdrujula:'sobresdrújula', conjugacion:'conjugación', conjugaciones:'conjugaciones',
  preposicion:'preposición', preposiciones:'preposiciones', conjuncion:'conjunción', conjunciones:'conjunciones',
  interjeccion:'interjección', interjecciones:'interjecciones', oracion:'oración', oraciones:'oraciones',
  perifrasis:'perífrasis', lexico:'léxico', fonetica:'fonética', poetica:'poética', poesia:'poesía'
};
const blocked = [
  'hostia','hostias','maricón','maricon','maricones','zorra','zorras','idiota','idiotas',
  'john','michael','mike','jack','james','peter','mary','sarah','tom','sam','charlie','george','henry','harry',
  'steve','mark','paul','chris','robert','richard','frank','bill','billy','jim','jimmy','jenny','jessica','linda',
  'nancy','kevin','brian','ryan','scott','tony','andy','nick','jason','eric','kate','katie','emily','emma','lucy',
  'lisa','julia','anna','yeah','yep','nope','okay','wow','omg','lol','sir','mister','miss'
];
const rejectPatterns = [
  /^(?:ja|je|ji|jo|ju){2,}$/i,
  /^(.)\1{2,}$/i,
  /^[bcdfghjklmnpqrstvwxyz]{6,}$/i,
  /^[aeiou]{4,}$/i
];
window.WordPlayLexicon={additions,strict,blocked,rejectPatterns,locale:'es-ES',version:2};
})();