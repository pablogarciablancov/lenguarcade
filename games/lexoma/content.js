(() => {
'use strict';
const relics=[
 ['quevedo','Pluma de Quevedo','+30 por cada adjetivo.',70,'quill'],
 ['cervantes','Tintero de Cervantes','Las palabras de 7+ letras valen ×1,5.',80,'ink'],
 ['corona','Corona del Sintagma','Sintagmas nominales completos: ×1,5.',100,'crown'],
 ['cronista','Reloj del Cronista','+60 por cada verbo en pasado.',65,'clock'],
 ['brujula','Brújula del Adverbio','Cada adverbio eleva el combo en 0,2.',75,'compass'],
 ['martillo','Martillo Verbal','Duplica el valor del primer verbo.',80,'hammer'],
 ['concordia','Piedra de Concordia','Concordancia sin errores: +100.',100,'gem'],
 ['fantasma','Letra Fantasma','Añade dos comodines a la bolsa al comprarla.',60,'star'],
 ['enie','Ñ Primordial','Duplica el valor de las palabras con Ñ.',65,'rune'],
 ['tildes','Acuñador de Tildes','Una ficha de tilde extra cada dos frases.',60,'accent']
].map(([id,name,description,price,icon])=>({id,name,description,price,icon}));
const enemies=[
 {id:'devorador',name:'Devorador de Letras',title:'EL UMBRAL',hp:500,rounds:4,damage:18,reward:65,rule:'Solo dos descartes por ronda.',art:'devorador'},
 {id:'duende',name:'Duende de la Discordia',title:'BOSQUE DE CONCORDIA',hp:1000,rounds:4,damage:22,reward:85,rule:'Cada concordancia correcta añade 40 puntos.',art:'duende'},
 {id:'escriba',name:'Escriba Corrupto',title:'LA BIBLIOTECA',hp:1400,rounds:5,damage:25,reward:100,rule:'Cada ronda exige 40 puntos más para atacar.',art:'escriba'},
 {id:'elite',name:'Custodio del Tintero',title:'ENCUENTRO ÉLITE',hp:1700,rounds:5,damage:28,reward:115,rule:'Las frases con cuatro categorías reciben ×1,3.',art:'custodio'},
 {id:'morfax',name:'Morfax, el Devorador',title:'JEFE · LA FORJA PROHIBIDA',hp:2600,rounds:7,damage:32,reward:160,rule:'Tres fases: forja libre, categoría potenciada y diversidad.',art:'morfax'}
];
const achievements=[['first','Herrero aprendiz','Forja tu primera palabra.'],['agree','Eso concuerda','Activa diez concordancias.'],['phrases','Forjador','Construye veinte frases.'],['combo','Combo lingüístico','Alcanza combo ×5.'],['enie','Maestro de la Ñ','Usa cinco palabras distintas con Ñ.'],['5000','5.000','Obtén 5.000 puntos en una frase.'],['boss','Morfax derrotado','Completa la run.']].map(([id,title,description])=>({id:'lexoma_'+id,title,description,xpReward:25}));
window.LexomaContent={relics,enemies,achievements,route:['devorador','duende','shop','escriba','elite','morfax']};
})();
