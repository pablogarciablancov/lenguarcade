(function(root){
'use strict';
const districts=[['narrativa','El Archivo Narrativo','#ffc57b'],['morfologia','El Taller de Palabras','#87e9c1'],['verbos','La Torre Verbal','#b7a0ff'],['sintaxis','La Estación Sintáctica','#79d9ff'],['literatura','La Galería Literaria','#ff9fc9'],['semantica','El Mercado Semántico','#ffe184'],['ortografia','El Laboratorio Ortográfico','#9ab8ff']].map(([id,name,color])=>({id,name,color}));
const groups={
narrativa:`Narrador|Voz que cuenta los hechos de una historia.
Personaje|Ser que participa en los hechos de una narración.
Protagonista|Personaje central de una historia.
Antagonista|Personaje que se opone al protagonista.
Espacio|Lugar o lugares donde sucede una historia.
Tiempo|Dimensión narrativa que sitúa cuándo ocurren los hechos y cuánto duran.
Trama|Organización de los acontecimientos de una historia.
Desenlace|Parte final que resuelve el conflicto narrativo.
Nudo|Parte de la narración en la que se desarrolla el conflicto.
Inicio|Primera parte de una narración, antes del nudo.
Omnisciente|Narrador que conoce incluso los pensamientos de todos los personajes.
Testigo|Narrador personaje que observa los hechos sin ser el protagonista.
Diálogo|Intercambio de palabras entre personajes.
Monólogo|Discurso de un personaje que habla consigo mismo o sin interlocutor.
Descripción|Representación verbal de las características de alguien o algo.
Retrato|Descripción que combina los rasgos físicos y psicológicos de una persona.
Prosopografía|Descripción de los rasgos físicos de una persona.
Etopeya|Descripción del carácter y las cualidades morales de una persona.
Analepsis|Salto narrativo hacia hechos anteriores al momento del relato.
Prolepsis|Anticipación narrativa de acontecimientos futuros.
Conflicto|Problema o enfrentamiento que impulsa la acción narrativa.
Episodio|Parte de una narración que contiene una acción relativamente autónoma.`,
morfologia:`Lexema|Parte de una palabra que aporta su significado léxico básico.
Morfema|Unidad mínima con significado léxico o gramatical.
Prefijo|Afijo que se coloca delante de la base de una palabra.
Sufijo|Afijo que se coloca detrás de la base de una palabra.
Interfijo|Segmento entre la base y un sufijo, como «ec» en «panecito».
Desinencia|Terminación verbal que expresa información gramatical.
Derivación|Formación de palabras mediante afijos añadidos a una base.
Composición|Formación de palabras uniendo dos o más bases léxicas.
Parasíntesis|Formación como «enrojecer», con prefijo y sufijo añadidos conjuntamente.
Flexión|Variación de una palabra para expresar información gramatical sin crear un nuevo lexema.
Género|Propiedad gramatical que distingue, por ejemplo, masculino y femenino.
Número|Propiedad gramatical que distingue singular y plural.
Sustantivo|Clase de palabras que designa seres, objetos, ideas o realidades.
Adjetivo|Clase de palabras que expresa propiedades del sustantivo.
Pronombre|Clase de palabras que puede referirse a entidades sin nombrarlas mediante un sustantivo.
Determinante|Palabra como «este» en «este libro», que delimita la referencia del sustantivo.
Adverbio|Palabra invariable que modifica un verbo, un adjetivo u otro adverbio.
Preposición|Palabra invariable como «desde» que introduce un término y establece una relación.
Conjunción|Palabra invariable como «y» u «o» que une palabras u oraciones.
Interjección|Palabra como «ay» que puede expresar por sí sola una reacción.
Artículo|Determinante como «el», «la», «un» o «una».
Diminutivo|Sufijo apreciativo como «ito» en «gatito».
Aumentativo|Sufijo apreciativo como «azo» en «perrazo».
Sigla|Palabra formada con iniciales, como «ESO».`,
verbos:`Verbo|Clase de palabras que se conjuga y puede expresar acciones, procesos o estados.
Infinitivo|Forma no personal del verbo terminada en «ar», «er» o «ir».
Gerundio|Forma no personal presente en «estoy leyendo».
Participio|Forma no personal presente en «he cantado».
Indicativo|Modo verbal de «canto», «canté» y «cantaré».
Subjuntivo|Modo verbal de «ojalá venga» y «quizá llueva».
Imperativo|Modo verbal de la orden «ven».
Persona|Rasgo verbal que distingue al hablante, al destinatario y a los demás.
Presente|Tiempo verbal de la forma «estudio».
Pretérito|Nombre general de los tiempos verbales que sitúan hechos en el pasado.
Futuro|Tiempo verbal de la forma «estudiaré».
Condicional|Tiempo verbal simple de «estudiaría».
Imperfecto|Pretérito simple de indicativo de la forma «cantaba».
Perfectivo|Valor aspectual que presenta una situación como acabada.
Aspecto|Información verbal sobre cómo se presenta el desarrollo o la terminación de una situación.
Conjugación|Conjunto ordenado de las formas de un verbo.
Regular|Verbo que mantiene la raíz y sigue el modelo de su conjugación.
Irregular|Verbo que presenta cambios respecto al modelo de su conjugación.
Auxiliar|Verbo que ayuda a construir tiempos compuestos o perífrasis.
Copulativo|Verbo como «ser», «estar» o «parecer» cuando enlaza sujeto y atributo.
Transit ivo|Verbo que puede construirse con complemento directo; escribe su nombre sin espacios.
Intransitivo|Verbo que en una construcción no lleva complemento directo.
Pronominal|Verbo como «arrepentirse», que se conjuga con pronombre átono.
Perífrasis|Construcción verbal como «tener que estudiar», que funciona como un solo núcleo.`,
sintaxis:`Sujeto|Función de «María» en «María canta»; concuerda con el verbo.
Predicado|Función de «compró un libro» en «María compró un libro».
Núcleo|Palabra central de un grupo sintáctico.
Sintagma|Grupo de palabras organizado alrededor de un núcleo; también se llama grupo sintáctico.
Atributo|Función de «feliz» en «Ana está feliz».
Aposición|Función de «mi vecino» en «Luis, mi vecino, vino ayer».
Vocativo|Palabra o grupo que llama al destinatario: «Pablo» en «Pablo, ven».
Oración|Unidad sintáctica con una relación predicativa, normalmente articulada por un verbo.
Enunciado|Unidad comunicativa con sentido completo en una situación.
Nominal|Tipo de grupo sintáctico cuyo núcleo es un sustantivo.
Adjetival|Tipo de grupo sintáctico cuyo núcleo es un adjetivo.
Adverbial|Tipo de grupo sintáctico cuyo núcleo es un adverbio.
Verbal|Tipo de grupo sintáctico cuyo núcleo es un verbo.
Elipsis|Omisión de un elemento que se recupera por el contexto.
Nexo|Elemento que enlaza unidades sintácticas.
Coordinación|Relación que une unidades sin que una dependa sintácticamente de la otra.
Subordinación|Relación en la que una oración depende de otra unidad.
Yuxtaposición|Unión de oraciones sin nexo explícito.
Impersonal|Oración sin sujeto, como «Llueve».
Pasiva|Voz de «El libro fue leído por Ana».
Activa|Voz de «Ana leyó el libro».
Predicativo|Complemento que modifica al verbo y a la vez al sujeto o al complemento directo: «cansado» en «Luis llegó cansado».`,
literatura:`Metáfora|Figura que identifica una realidad con otra por semejanza, sin un nexo comparativo.
Símil|Comparación literaria explícita: «Tus ojos brillan como estrellas».
Hipérbole|Exageración expresiva: «Te lo he dicho un millón de veces».
Anáfora|Repetición de palabras al comienzo de varios versos o enunciados.
Epífora|Repetición de palabras al final de varios versos o enunciados.
Aliteración|Repetición expresiva de sonidos semejantes.
Antítesis|Contraposición de ideas o palabras de significado opuesto.
Paradoja|Idea aparentemente contradictoria que encierra un sentido.
Oxímoron|Combinación de palabras contradictorias: «silencio atronador».
Metonimia|Designación de algo mediante otra realidad relacionada: «leer a Cervantes».
Hipérbaton|Alteración expresiva del orden habitual de las palabras.
Polisíndeton|Repetición expresiva de conjunciones.
Asíndeton|Supresión expresiva de conjunciones en una enumeración.
Verso|Unidad de un poema que ocupa una línea y puede estar sujeta a medida y ritmo.
Estrofa|Agrupación de versos dentro de un poema.
Rima|Coincidencia de sonidos al final de los versos desde la última vocal tónica.
Asonante|Rima que repite solo las vocales desde la última vocal tónica.
Consonante|Rima que repite vocales y consonantes desde la última vocal tónica.
Sinalefa|Unión métrica de la vocal final de una palabra y la inicial de la siguiente.
Soneto|Poema de catorce versos, tradicionalmente dos cuartetos y dos tercetos.
Romance|Composición de versos octosílabos con rima asonante en los pares.
Lírica|Género literario que expresa sentimientos y subjetividad.
Drama|Género literario concebido para representarse mediante la acción de personajes.
Elegía|Composición poética que expresa dolor por una pérdida.`,
semantica:`Sinónimo|Palabra de significado igual o semejante al de otra.
Antónimo|Palabra de significado opuesto al de otra.
Polisemia|Existencia de varios significados relacionados en una misma palabra.
Homonimia|Relación entre palabras distintas que coinciden en su forma.
Hiperónimo|Palabra de significado general que engloba otras, como «animal» respecto a «perro».
Hipónimo|Palabra incluida en el significado de otra más general, como «perro» respecto a «animal».
Monosemia|Existencia de un único significado en una palabra.
Denotación|Significado básico y compartido de una expresión.
Connotación|Asociaciones o valores que una expresión sugiere además de su significado básico.
Eufemismo|Expresión suave que sustituye otra considerada desagradable o tabú.
Tabú|Palabra o realidad cuya mención directa se evita por razones sociales.
Semántica|Disciplina que estudia el significado lingüístico.
Significante|Forma perceptible de un signo lingüístico.
Significado|Contenido asociado a un signo lingüístico.
Homófono|Palabra que suena igual que otra aunque se escriba de manera diferente.
Homógrafo|Palabra que se escribe igual que otra de distinto origen o significado.
Literal|Sentido de una expresión ajustado a su significado directo.
Figurado|Sentido de una expresión que se aparta del significado literal.
Neologismo|Palabra o acepción de creación reciente.
Arcaísmo|Palabra o uso lingüístico anticuado.
Préstamo|Palabra incorporada de otra lengua.
Locución|Grupo estable de palabras que funciona como una unidad léxica.`,
ortografia:`Aguda|Palabra cuya sílaba tónica es la última.
Llana|Palabra cuya sílaba tónica es la penúltima.
Esdrújula|Palabra cuya sílaba tónica es la antepenúltima.
Sobresdrújula|Palabra cuya sílaba tónica está antes de la antepenúltima.
Diptongo|Secuencia de dos vocales que pertenecen a una misma sílaba.
Triptongo|Secuencia de tres vocales que pertenecen a una misma sílaba.
Hiato|Secuencia de vocales que pertenecen a sílabas diferentes.
Tilde|Signo gráfico que marca el acento según las reglas de escritura.
Diacrítica|Tipo de tilde que distingue «tú» de «tu».
Tónica|Sílaba sobre la que recae el acento de una palabra.
Átona|Sílaba que no recibe el acento de una palabra.
Diéresis|Signo sobre la «u» de «pingüino» que indica que se pronuncia.
Mayúscula|Tipo de letra que se usa al comienzo de una oración y en nombres propios.
Coma|Signo que, entre otros usos, separa elementos de una enumeración.
Punto|Signo que cierra un enunciado y puede separar párrafos.
Interrogación|Nombre del signo de apertura «¿» y del de cierre «?».
Exclamación|Nombre del signo de apertura «¡» y del de cierre «!».
Comillas|Signos que pueden delimitar una cita textual.
Paréntesis|Signos que encierran una aclaración incidental.
Guion|Signo corto que aparece en «teórico-práctico».
Raya|Signo largo que introduce intervenciones en un diálogo escrito.
Ortografía|Conjunto de normas que regulan la escritura de una lengua.`
};
const concepts=Object.entries(groups).flatMap(([category,lines])=>lines.split('\n').map((line,i)=>{let [term,clue]=line.split('|');if(term==='Transit ivo'){term='Transitivo';clue='Verbo que puede construirse con complemento directo.';}return {id:category+'_'+i,term,gridTerm:term.toLocaleUpperCase('es').replace(/\s+/g,''),clue,explanation:term+': '+clue,category,subcategory:category==='literatura'?(i<13?'figuras_literarias':'metrica_generos'):category==='morfologia'?(i>=12?'clases_palabras':'formacion_palabras'):category,difficulty:i<10?1:i<18?2:3,course:'ESO',tags:[category]};}));
const difficulties=[{name:'Fácil',size:9,count:5,reverse:false},{name:'Normal',size:11,count:7,reverse:false},{name:'Difícil',size:13,count:9,reverse:true},{name:'Experto',size:14,count:11,reverse:true}];
root.TintaContent={districts,concepts,difficulties};
})(typeof window==='undefined'?globalThis:window);
