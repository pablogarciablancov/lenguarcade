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
