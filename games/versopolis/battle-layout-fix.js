'use strict';

/* Versópolis · blindaje de layout de batalla (v1)
   Evita que el intercambio, el reto, la caja de respuesta y el feedback compartan espacio visual. */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    /* Estructura vertical inequívoca: ningún bloque comparte fila con el siguiente. */
    #battlePlay .battlelayout{
      display:flex!important;
      flex-direction:column!important;
      gap:12px!important;
      height:auto!important;
      min-height:0!important;
      overflow:visible!important;
      align-items:stretch!important;
    }
    #battlePlay .battlelayout>*{
      flex:0 0 auto!important;
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      min-width:0!important;
      min-height:0!important;
      margin:0!important;
    }

    /* Intercambio: bloque independiente y contenido. */
    #battlePlay .arenaStage{
      display:grid!important;
      grid-template-columns:108px minmax(0,1fr) 108px!important;
      gap:12px!important;
      align-items:stretch!important;
      position:relative!important;
      z-index:1!important;
      min-height:136px!important;
      max-height:none!important;
      overflow:hidden!important;
      isolation:isolate!important;
    }
    #battlePlay .combatant{
      min-height:136px!important;
      padding:9px!important;
      overflow:hidden!important;
      position:relative!important;
      z-index:1!important;
    }
    #battlePlay .combatant .bigavatar{
      font-size:44px!important;
      line-height:1!important;
      margin:0!important;
      max-width:100%!important;
    }
    #battlePlay .speech{
      min-height:136px!important;
      max-height:none!important;
      overflow:hidden!important;
      position:relative!important;
      z-index:1!important;
      justify-content:flex-start!important;
    }
    #battlePlay .speechbox{
      min-height:0!important;
      max-height:148px!important;
      overflow:auto!important;
      overscroll-behavior:contain!important;
      padding-right:6px!important;
    }

    /* Reto y respuesta: siempre debajo del intercambio. */
    #battlePlay .challengeDock{
      display:grid!important;
      grid-template-columns:minmax(0,1fr) 280px!important;
      gap:12px!important;
      align-items:start!important;
      position:relative!important;
      z-index:1!important;
      overflow:visible!important;
      clear:both!important;
    }
    #battlePlay .challengecard,
    #battlePlay .sidecard{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      min-width:0!important;
      min-height:0!important;
      height:auto!important;
      max-height:none!important;
      z-index:1!important;
    }
    #battlePlay .challengecard{overflow:visible!important}
    #battlePlay .sidecard{overflow:hidden!important}

    /* El multiplicador ya no forma parte de la batalla simple. */
    #battlePlay .challengeTop>.chip{display:none!important}

    /* La caja de escritura y el resultado nunca salen de su flujo. */
    #battlePlay .inputrow{
      position:relative!important;
      z-index:1!important;
      clear:both!important;
      min-width:0!important;
    }
    #battlePlay #battleInput{
      position:relative!important;
      z-index:1!important;
      min-width:0!important;
      width:100%!important;
      max-width:100%!important;
      overflow:auto!important;
    }
    #battlePlay #battleFeedback{
      position:relative!important;
      z-index:1!important;
      clear:both!important;
      display:block!important;
      width:100%!important;
      min-width:0!important;
      height:auto!important;
      overflow:visible!important;
      contain:none!important;
      margin-top:10px!important;
    }
    #battlePlay #battleFeedback:empty{display:none!important;margin:0!important}
    #battlePlay .simple-feedback,
    #battlePlay .damage-summary,
    #battlePlay .next-round-wrap{
      position:relative!important;
      inset:auto!important;
      transform:none!important;
      float:none!important;
      clear:both!important;
    }

    /* En altura baja priorizamos lectura: una sola columna y scroll de pantalla. */
    @media (max-width:1100px), (max-height:700px){
      #screen-battle{overflow:auto!important}
      #battlePlay .challengeDock{grid-template-columns:1fr!important}
      #battlePlay .sidecard{
        display:grid!important;
        grid-template-columns:repeat(2,minmax(0,1fr))!important;
        gap:10px!important;
      }
      #battlePlay .sidecard>.tiny{grid-column:1/-1!important}
    }

    @media (max-width:760px){
      #battlePlay .arenaStage{grid-template-columns:1fr!important;min-height:0!important}
      #battlePlay .combatant{display:none!important}
      #battlePlay .speech{min-height:120px!important}
      #battlePlay .sidecard{grid-template-columns:1fr!important}
      #battlePlay .inputrow{grid-template-columns:1fr!important}
      #battlePlay .submitbtn{width:100%!important}
    }

    /* Aviso de texto no reconocible. */
    .sanity-warning{
      margin-top:9px;padding:11px 12px;border-radius:14px;
      border:1px solid rgba(255,111,125,.55);
      background:rgba(255,111,125,.10);color:#ffe8ec;
      font-size:12px;line-height:1.45
    }
    .sanity-warning b{display:block;color:#fff;margin-bottom:3px;font-size:13px}
    .sanity-warning .hint{color:var(--muted);margin-top:4px}
    .challenge-input.sanity-invalid{
      border-color:rgba(255,111,125,.8)!important;
      box-shadow:0 0 0 3px rgba(255,111,125,.12)!important
    }
  `;
  document.head.appendChild(style);

  function normalizeBattleDom(){
    const play=document.getElementById('battlePlay');
    if(!play) return;

    /* Elimina restos que ya no tienen función en la batalla simplificada. */
    const reward=document.querySelector('#battlePlay .challengeTop > .chip');
    if(reward) reward.style.display='none';

    /* Si algún rerender del motor deja un botón de ronda duplicado, conserva solo el último. */
    const nextButtons=Array.from(document.querySelectorAll('#battlePlay #battleNextRound'));
    nextButtons.slice(0,-1).forEach(btn=>btn.closest('.next-round-wrap')?.remove() || btn.remove());

    /* Nunca permitimos estilos inline accidentales que saquen estos bloques del flujo. */
    ['.arenaStage','.challengeDock','.challengecard','.speech','#battleFeedback'].forEach(sel=>{
      const el=play.querySelector(sel);
      if(!el) return;
      el.style.position='relative';
      el.style.top='auto';
      el.style.left='auto';
      el.style.right='auto';
      el.style.bottom='auto';
      el.style.transform='none';
    });
  }

  normalizeBattleDom();
  const observer=new MutationObserver(()=>requestAnimationFrame(normalizeBattleDom));
  const play=document.getElementById('battlePlay');
  if(play) observer.observe(play,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
})();

/* Versópolis · filtro anti-ruido (v1)
   Antes de puntuar, exige que la respuesta parezca lenguaje natural reconocible.
   No usa un diccionario cerrado para permitir creatividad y vocabulario poco frecuente. */
(() => {
  const SHORT_OK=new Set('a al de del el la los las lo un una unos unas y e o u en con sin por para que se su sus mi mis tu tus me te le les nos os ya no si más mas muy tan como pero porque aunque cuando donde quien qué cómo cuál hay es son soy eres era fue ser estar voy va van ir ha han he hemos sobre bajo entre hacia desde hasta contra tras ante'.split(' '));
  const COMMON=new Set('agua aire amor amigo amiga amistad árbol arbol azul barrio beso boca bueno buena calle camino canción cancion casa cielo ciudad clase corazón corazon cuerpo día dia escuela fuego gente grande historia hombre idea instituto juego libro luz luna madrid mar miedo mundo música musica noche niño niña palabra paz persona puerta río rio risa rojo sombra sol sueño sueno tarde tiempo tierra verdad vida viento voz poema poeta verso rima ritmo silencio estrella cristal reloj tormenta dragón dragon biblioteca ceniza relámpago relampago espejo laberinto brújula brujula semilla puente llave horizonte feliz triste frío frio calor corre correr canta cantar habla hablar mira mirar grita gritar llora llorar ríe rie reir sueña suena soñar sonar piensa pensar siente sentir vuela volar cae caer nace nacer muere morir vive vivir brilla brillar rompe romper abre abrir cierra cerrar busca buscar encuentra encontrar guarda guardar'.split(' '));
  const BAD_KEYBOARD=/(?:asdf|qwer|zxcv|hjkl|jkl|lkj|kjh|hjk|ghj|fgh|cvb|vbn|bnm|poiuy|iuyt|ñlk|,mn|mn\.|\.jk)/i;
  const VOWEL=/[aeiouáéíóúü]/i;
  const CONSONANT_RUN=/[bcdfghjklmnñpqrstvwxyz]{5,}/i;
  const REPEAT_CHAR=/([a-záéíóúüñ])\1{3,}/i;
  const COMMON_ENDING=/(?:a|o|e|as|os|es|ar|er|ir|ando|iendo|ado|ada|ados|adas|ido|ida|idos|idas|ción|ciones|sión|siones|dad|dades|mente|al|ales|ico|ica|icos|icas|oso|osa|osos|osas|ante|antes|ente|entes|or|ores|ura|uras|aje|ajes|ía|ías|io|ios|ista|istas|ez|eza)$/i;

  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
  function tokens(text){return String(text||'').toLowerCase().match(/[a-záéíóúüñ]+/gi)||[];}
  function lineList(text){return String(text||'').split(/\n+/).map(s=>s.trim()).filter(Boolean);}

  function plausibleWord(raw){
    const w=norm(raw);
    if(!w) return false;
    if(SHORT_OK.has(w)||COMMON.has(w)) return true;
    if(w.length===1) return ['a','y','o','e'].includes(w);
    if(w.length>22||REPEAT_CHAR.test(w)||CONSONANT_RUN.test(w)||!VOWEL.test(w)) return false;
    const vowelCount=(w.match(/[aeiou]/g)||[]).length;
    const ratio=vowelCount/w.length;
    if(w.length>=4&&(ratio<.18||ratio>.78)) return false;
    if(/(?:jj|kk|ww|hhj|jhh|q[^u])/i.test(w)) return false;
    return w.length<=5||COMMON_ENDING.test(raw)||/^[a-zñ]{1,3}[aeiou][a-zñaeiou]{2,}$/i.test(w);
  }

  function analyzeText(text,expectedLines){
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

    return {ok:reasons.length===0,reasons:[...new Set(reasons)]};
  }

  function esc(s){return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));}

  function expectedBattleLines(){
    try{
      if(typeof battleChallenge==='function'&&typeof battle!=='undefined'&&battle){
        const ch=battleChallenge();
        return Number(ch&&ch.lines)||2;
      }
    }catch(e){}
    return 2;
  }

  function feedbackFor(input){
    if(input.id==='battleInput') return document.getElementById('battleFeedback');
    const host=input.closest('.modecard,.challengecard')||input.parentElement;
    return host&&host.querySelector('.challenge-feedback');
  }

  function showWarning(input,reasons,target){
    input.classList.add('sanity-invalid');
    if(target){
      target.innerHTML=`<div class="sanity-warning"><b>✋ Esa respuesta no cuenta todavía</b>${reasons.map(r=>`<div>• ${esc(r)}</div>`).join('')}<div class="hint">Escribe palabras y frases reconocibles. Después el juego comprobará rima, tema y demás condiciones.</div></div>`;
    }
    if(typeof toast==='function') toast('Ese texto no parece un verso reconocible. Reescríbelo.');
    input.focus();
  }

  function clearWarning(input,target){
    input.classList.remove('sanity-invalid');
    const warning=target&&target.querySelector('.sanity-warning');
    if(warning) warning.remove();
  }

  /* Captura antes de los onclick del juego. Si falla, el turno no se consume. */
  document.addEventListener('click',event=>{
    const btn=event.target.closest('#battleSubmit,[data-submit-challenge]');
    if(!btn) return;

    let input=null;
    let expected=1;
    if(btn.id==='battleSubmit'){
      input=document.getElementById('battleInput');
      expected=expectedBattleLines();
    }else{
      const inputId=btn.dataset.submitChallenge;
      input=inputId?document.getElementById(inputId):btn.closest('.modecard,.challengecard')?.querySelector('.challenge-input');
      expected=Math.max(1,lineList(input&&input.value).length||1);
    }
    if(!input) return;

    const verdict=analyzeText(input.value,expected);
    const target=feedbackFor(input);
    if(!verdict.ok){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      showWarning(input,verdict.reasons,target);
      return false;
    }
    clearWarning(input,target);
  },true);

  document.addEventListener('input',event=>{
    if(event.target&&event.target.classList&&event.target.classList.contains('challenge-input')){
      event.target.classList.remove('sanity-invalid');
    }
  });

  window.VersopolisSanity={analyze:analyzeText,plausibleWord};
})();
