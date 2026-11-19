// Respuestas y explicaciones revisadas para 2.º ESO. Las opciones incorrectas son plausibles, no erratas absurdas.
export const QUESTIONS = [
  {topic:'ORTOGRAFÍA',prompt:'Completa: «Todavía no ___ terminado el trabajo».',choices:['he','eh','e','ha'],answer:0,why:'«He» es una forma del verbo haber: he terminado.'},
  {topic:'ORTOGRAFÍA',prompt:'¿Qué oración está escrita correctamente?',choices:['A ver si llegamos a tiempo.','Haber si llegamos a tiempo.','A haber si llegamos a tiempo.','Haver si llegamos a tiempo.'],answer:0,why:'«A ver» expresa expectación; «haber» es un verbo.'},
  {topic:'ORTOGRAFÍA',prompt:'Completa: «No sé ___ dejó el cuaderno».',choices:['dónde','donde','adónde','a donde'],answer:0,why:'En una pregunta indirecta, «dónde» lleva tilde.'},
  {topic:'ORTOGRAFÍA',prompt:'Completa: «Dijo que ___ volvería mañana».',choices:['sí','si','se','sé'],answer:0,why:'«Sí» de afirmación lleva tilde diacrítica.'},
  {topic:'ORTOGRAFÍA',prompt:'¿Qué palabra necesita tilde?',choices:['examen','jovenes','imagen','origen'],answer:1,why:'«Jóvenes» es esdrújula y todas las esdrújulas llevan tilde.'},
  {topic:'ORTOGRAFÍA',prompt:'Completa: «No entiendo ___ te enfadas».',choices:['por qué','porque','porqué','por que'],answer:0,why:'«Por qué» introduce una pregunta indirecta.'},
  {topic:'ORTOGRAFÍA',prompt:'Completa: «El héroe se echó ___ el suelo».',choices:['sobre','sobré','sóbre','sobres'],answer:0,why:'«Sobre» es una preposición y no lleva tilde.'},
  {topic:'ORTOGRAFÍA',prompt:'¿Cuál es la forma correcta?',choices:['Tuvieron que huir.','Tubieron que huir.','Tuvieron que uir.','Tubieron que uir.'],answer:0,why:'«Tuvieron» procede de tener y «huir» se escribe con h.'},
  {topic:'MORFOLOGÍA',prompt:'¿Qué parte indica número y persona en «cantábamos»?',choices:['La desinencia','El lexema','El prefijo','El sufijo apreciativo'],answer:0,why:'La desinencia es un morfema verbal que expresa persona, número, tiempo y modo.'},
  {topic:'MORFOLOGÍA',prompt:'En «deshacer», ¿qué aporta «des-»?',choices:['Negación o inversión','Número plural','Tiempo pasado','Género femenino'],answer:0,why:'«Des-» es un prefijo que invierte o niega el significado.'},
  {topic:'MORFOLOGÍA',prompt:'¿Cuál es el lexema de «panadero»?',choices:['pan-','-ero','panader-','-adero'],answer:0,why:'«Pan-» aporta el significado básico de la familia de palabras.'},
  {topic:'MORFOLOGÍA',prompt:'«Casitas» contiene un sufijo…',choices:['diminutivo','aumentativo','verbal','de negación'],answer:0,why:'«-ita-» añade un matiz diminutivo.'},
  {topic:'MORFOLOGÍA',prompt:'¿Cuál contiene un prefijo?',choices:['releer','librería','montañas','cantaban'],answer:0,why:'«Re-» se añade delante de leer para expresar repetición.'},
  {topic:'MORFOLOGÍA',prompt:'En «niñas», ¿qué indica «-s»?',choices:['Número plural','Tiempo presente','Persona verbal','Aumentativo'],answer:0,why:'«-s» es un morfema flexivo de número.'},
  {topic:'VERBOS',prompt:'«Habíamos llegado» está en…',choices:['pretérito pluscuamperfecto','pretérito perfecto simple','futuro compuesto','presente'],answer:0,why:'«Habíamos» + participio forma el pretérito pluscuamperfecto.'},
  {topic:'VERBOS',prompt:'¿Qué forma verbal expresa una orden?',choices:['Ven aquí.','Vendrías aquí.','Vienes aquí.','Venías aquí.'],answer:0,why:'«Ven» es una forma del modo imperativo.'},
  {topic:'VERBOS',prompt:'En «Si pudiera, iría», «pudiera» está en…',choices:['subjuntivo','indicativo','imperativo','infinitivo'],answer:0,why:'«Pudiera» expresa una situación hipotética y está en subjuntivo.'},
  {topic:'VERBOS',prompt:'¿Cuál es una forma no personal del verbo?',choices:['corriendo','corremos','corrieron','correrás'],answer:0,why:'El gerundio «corriendo» no expresa persona ni número.'},
  {topic:'VERBOS',prompt:'«Escribieron» corresponde a…',choices:['3.ª persona plural','1.ª persona plural','2.ª persona singular','3.ª persona singular'],answer:0,why:'«Ellos o ellas escribieron» es tercera persona del plural.'},
  {topic:'VERBOS',prompt:'¿Cuál es el infinitivo de «condujimos»?',choices:['conducir','condujar','conducido','conduciendo'],answer:0,why:'«Condujimos» pertenece al verbo conducir.'},
  {topic:'ORTOGRAFÍA',prompt:'Escribe la palabra que falta: «___ mucho viento ayer».',typed:'Hizo',why:'«Hizo» es una forma del verbo hacer, con h y z.'},
  {topic:'ORTOGRAFÍA',prompt:'Escribe la palabra que falta: «El ___ cruzó el río».',typed:'héroe',why:'«Héroe» lleva h inicial y tilde: es esdrújula.'},
  {topic:'VERBOS',prompt:'Escribe el infinitivo de «anduvieron».',typed:'andar',why:'«Anduvieron» es una forma irregular del verbo andar.'},
  {topic:'MORFOLOGÍA',prompt:'Escribe el lexema de «florecer» (sin guion).',typed:'flor',why:'El lexema «flor» aparece en flor, florero y florecer.'}
];
export function freshDeck(previous=-1){const ids=QUESTIONS.map((_,i)=>i).filter(i=>i!==previous);for(let i=ids.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}return ids;}
export function checkAnswer(question,value){if(question.typed)return String(value).trim().normalize('NFC').toLocaleLowerCase('es')===question.typed.toLocaleLowerCase('es');return Number(value)===question.answer;}
