'use strict';

/* Versópolis · filtro de texto reconocible
   Bloquea ataques con ruido de teclado o texto que no parece lenguaje natural
   antes de que entre en el motor de puntuación. No usa un diccionario cerrado
   para no penalizar creatividad, nombres propios o vocabulario poco frecuente. */
(() => {
  const STYLE_ID='versopolis-sanity-style';
  if(!document.getElementById(STYLE_ID)){
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .sanity-warning{margin-top:9px;padding:11px 12px;border-radius:14px;border:1px solid rgba(255,111,125,.55);background:rgba(255,111,125,.10);color:#ffe8ec;font-size:12px;line-height:1.45}
      .sanity-warning b{display:block;color:#fff;margin-bottom:3px;font-size:13px}
      .sanity-warning .hint{color:var(--muted);margin-top:4px}
      .challenge-input.sanity-invalid{border-color:rgba(255,111,125,.8)!important;box-shadow:0 0 0 3px rgba(255,111,125,.12)!important}
    `;
    document.head.appendChild(style);
  }

  const SHORT_OK=new Set('a al de del el la los las lo un una unos unas y e o u en con sin por para que se su sus mi mis tu tus me te le les nos os ya no si más mas muy tan como pero porque aunque cuando donde quien qué cómo cuál hay es son soy eres era fue ser estar voy va van ir ha han he hemos sobre bajo entre hacia desde hasta contra tras ante'.split(' '));
  const COMMON=new Set('agua aire amor amigo amiga amistad árbol arbol azul barrio beso boca bueno buena calle camino canción cancion casa cielo ciudad clase corazón corazon cuerpo día dia escuela fuego gente grande historia hombre idea instituto juego libro luz luna Madrid mar miedo mundo música musica noche niño niña palabra paz persona puerta río rio risa rojo sombra sol sueño sueno tarde tiempo tierra verdad vida viento voz poema poeta verso rima ritmo silencio estrella cristal reloj tormenta dragón dragon biblioteca ceniza relámpago relampago espejo laberinto brújula brujula semilla puente llave horizonte feliz triste frío frio calor corre correr canta cantar habla hablar mira mirar grita gritar llora llorar ríe rie reir sueña suena soñar sonar piensa pensar siente sentir vuela volar cae caer nace nacer muere morir vive vivir brilla brillar rompe romper abre abrir cierra cerrar busca buscar encuentra encontrar guarda guardar'.split(' '));
  const BAD_KEYBOARD=/(?:asdf|qwer|zxcv|hjkl|jkl|lkj|kjh|hjk|ghj|fgh|cvb|vbn|bnm|poiuy|iuyt|ñlk|,mn|mn\.|\.jk)/i;
  const LETTER=/[a-záéíóúüñ]/i;
  const VOWEL=/[aeiouáéíóúü]/i;
  const CONSONANT_RUN=/[bcdfghjklmnñpqrstvwxyz]{5,}/i;
  const REPEAT_CHAR=/([a-záéíóúüñ])\1{3,}/i;
  const COMMON_ENDING=/(?:a|o|e|as|os|es|ar|er|ir|ando|iendo|ado|ada|ados|adas|ido|ida|idos|idas|ción|ciones|sión|siones|dad|dades|mente|al|ales|ico|ica|icos|icas|oso|osa|osos|osas|ante|antes|ente|entes|or|ores|ura|uras|aje|ajes|ía|ías|io|ios|ista|istas|ez|eza)$/i;

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
  function tokens(text){return (String(text||'').toLowerCase().match(/[a-záéíóúüñ]+/gi)||[]);}
  function lineList(text){return String(text||'').split(/\n+/).map(s=>s.trim()).filter(Boolean);}

  function plausibleWord(raw){
    const w=norm(raw);
    if(!w) return false;
    if(SHORT_OK.has(w)||COMMON.has(w)) return true;
    if(w.length===1) return w==='a'||w==='y'||w==='o'||w==='e';
    if(w.length>22||REPEAT_CHAR.test(w)||CONSONANT_RUN.test(w)) return false;
    if(!VOWEL.test(w)) return false;
    const vowelCount=(w.match(/[aeiou]/g)||[]).length;
    const ratio=vowelCount/w.length;
    if(w.length>=4&&(ratio<.18||ratio>.78)) return false;
    if(/^[^aeiou]*[jkqwx][^aeiou]{2,}/i.test(w)) return false;
    if(/(?:jj|kk|ww|yy|hhj|jhh|q[^u])/i.test(w)) return false;
    return w.length<=5 || COMMON_ENDING.test(w) || /^[a-zñ]{1,3}[aeiou][a-zñaeiou]{2,}$/i.test(w);
  }

  function analyze(text,expectedLines){
    const raw=String(text||'').trim();
    const ws=tokens(raw);
    const lines=lineList(raw);
    const reasons=[];
    if(!raw) return {ok:false,reasons:['No has escrito ningún verso.']};

    const letters=(raw.match(/[a-záéíóúüñ]/gi)||[]).length;
    const nonSpace=raw.replace(/\s/g,'').length||1;
    const symbolRatio=Math.max(0,(nonSpace-letters)/nonSpace);
    const oneLetter=ws.filter(w=>w.length===1&&!['a','y','o','e'].includes(norm(w))).length;
    const noVowel=ws.filter(w=>w.length>1&&!VOWEL.test(w)).length;
    const plausible=ws.filter(plausibleWord).length;
    const plausibleRatio=ws.length?plausible/ws.length:0;

    if(BAD_KEYBOARD.test(raw)) reasons.push('Hay secuencias que parecen teclas pulsadas al azar.');
    if(symbolRatio>.22) reasons.push('Hay demasiados signos o caracteres no lingüísticos.');
    if(ws.length<Math.max(3,(Number(expectedLines)||1)*2)) reasons.push('Necesitas desarrollar un poco más los versos.');
    if(ws.length&&noVowel/ws.length>.28) reasons.push('Hay demasiadas palabras sin vocales reconocibles.');
    if(ws.length&&oneLetter/ws.length>.22) reasons.push('Hay demasiadas letras sueltas en lugar de palabras.');
    if(ws.some(w=>CONSONANT_RUN.test(norm(w)))) reasons.push('Aparecen grupos de consonantes que no parecen palabras españolas.');
    if(ws.length>=4&&plausibleRatio<.58) reasons.push('La mayor parte del texto no parece formada por palabras reconocibles.');

    const meaningfulLines=lines.filter(line=>tokens(line).filter(w=>w.length>1||SHORT_OK.has(norm(w))).length>=2).length;
    if(expectedLines&&lines.length>=expectedLines&&meaningfulLines<Math.ceil(expectedLines*.75)) reasons.push('Alguno de los versos no contiene suficientes palabras reconocibles.');

    return {ok:reasons.length===0,reasons:[...new Set(reasons)],stats:{words:ws.length,plausibleRatio,noVowel,symbolRatio}};
  }

  function expectedBattleLines(){
    try{
      if(typeof battleChallenge==='function'&&typeof battle!=='undefined'&&battle){
        const ch=battleChallenge();
        return Number(ch&&ch.lines)||2;
      }
    }catch(e){}
    return 2;
  }

  function showWarning(input,reasons,feedback){
    input.classList.add('sanity-invalid');
    const target=feedback||document.getElementById('battleFeedback');
    if(target){
      target.innerHTML=`<div class="sanity-warning"><b>✋ Ese ataque no cuenta todavía</b>${reasons.map(r=>`<div>• ${String(r).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}</div>`).join('')}<div class="hint">Escribe palabras y frases reconocibles. Después el juego comprobará rima, tema y demás condiciones.</div></div>`;
    }
    if(typeof toast==='function') toast('Ese texto no parece un verso reconocible. Reescríbelo.');
    input.focus();
  }

  function clearWarning(input,feedback){
    input.classList.remove('sanity-invalid');
    const target=feedback||document.getElementById('battleFeedback');
    const warning=target&&target.querySelector('.sanity-warning');
    if(warning) warning.remove();
  }

  /* Captura el clic antes del onclick de la batalla. Si es ruido, no consume turno,
     no hace daño y el rival tampoco responde. */
  document.addEventListener('click',event=>{
    const btn=event.target.closest('#battleSubmit');
    if(!btn) return;
    const input=document.getElementById('battleInput');
    if(!input) return;
    const verdict=analyze(input.value,expectedBattleLines());
    if(!verdict.ok){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      showWarning(input,verdict.reasons,document.getElementById('battleFeedback'));
      return false;
    }
    clearWarning(input,document.getElementById('battleFeedback'));
  },true);

  /* Al empezar a escribir de nuevo desaparece el borde rojo; se volverá a validar al atacar. */
  document.addEventListener('input',event=>{
    if(event.target&&event.target.id==='battleInput') event.target.classList.remove('sanity-invalid');
  });

  /* Expuesto solo para pruebas del checker/consola. */
  window.VersopolisSanity={analyze,plausibleWord};
})();
