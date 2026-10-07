// Optional adapter: the local duel does not use this transport or state.
window.createConjugaOnline=function({$,state,TIERS,escapeHtml:esc,toast,renderAll,renderProfileHeader,log,sfx,request,commit,close}){
  let room=null,enabled=false,busy=false,poll=null,clock=null,offset=0,failures=0,resultKey='',inFlight=null,teacher=false,chooseClass=false;
  const messages={room_not_found:'No encuentro esa sala en tu clase. Revisa el código.',room_full:'La sala ya tiene dos jugadores.',
    not_your_turn:'Ahora le toca a tu compañero.',game_access_closed:'El profesor ha cerrado este juego.',
    student_required:'El duelo necesita un alumno; no admite dos profesores.',forbidden:'Tu perfil no tiene permiso para jugar en esta clase.',no_classroom:'Necesitas pertenecer a la clase de esta sala.',room_expired:'La sala ha caducado. Crea otra.',already_in_room:'Ya estás en otra sala. Sal de ella antes de unirte.',
    session_expired:'Tu sesión ha caducado. Vuelve a entrar en LenguArcade.',stale_turn:'El turno ya ha cambiado.',
    online_unavailable:'El duelo online aún no está disponible en este panel.',connection_timeout:'La conexión está tardando. Puedes volver a intentarlo.'};
  const active=()=>!!room;
  const mine=()=>room&&room.ownIndex===state.currentPlayer;
  function stop(){clearTimeout(poll);clearInterval(clock);poll=null;clock=null;}
  function lockChoices(){
    if(!room)return;
    const locked=busy||!mine()||room.state.phase!=='choose';
    document.querySelectorAll('#tierList button,#betList button').forEach(b=>b.disabled=locked);
  }
  function controls(){
    if(!room)return;
    lockChoices();const s=room.state,p=state.players[state.currentPlayer],can=mine()&&!busy&&s.phase==='question';
    $('revealBtn').disabled=busy||!mine()||s.phase!=='choose';
    $('answerInput').disabled=!can;$('submitBtn').disabled=!can;
    $('hintBtn').disabled=!can||s.hintUsed||p.chips<5;
    $('swapBtn').disabled=!can||p.swap<=0;$('insuranceBtn').disabled=!can||p.insurance<=0||s.insuranceActive;
    $('gameScreen').classList.toggle('onlineSpectator',!mine());
  }
  function schedule(){
    clearTimeout(poll);if(!room||room.state.phase==='finished')return;
    poll=setTimeout(async()=>{
      if(busy){schedule();return;}
      try{await send('get');failures=0;}catch(e){
        failures++;$('onlineNotice').textContent='Reconectando…';
        log('🌐 Conexión interrumpida. Intentando recuperar la partida…');
        if(['session_expired','room_expired','not_a_member','no_classroom'].includes(e.message)){
          stop();toast('Duelo pausado',messages[e.message]||'Vuelve a entrar en LenguArcade.');return;
        }
      }
      schedule();
    },Math.min(10000,1500*(1+failures)));
  }
  function timer(){
    clearInterval(clock);if(!room||room.state.phase!=='question')return;
    const tick=()=>{state.timeLeft=Math.max(0,(room.state.deadline-Date.now()-offset)/1000);
      $('timerFill').style.width=Math.min(100,state.timeLeft/state.timerSeconds*100)+'%';};
    tick();clock=setInterval(tick,200);
  }
  function lobby(){
    $('setupScreen').classList.add('hidden');$('gameScreen').classList.add('hidden');$('endScreen').classList.add('hidden');
    $('onlineLobby').classList.remove('hidden');$('onlineTeacherClass').classList.toggle('hidden',!chooseClass||!!room);$('onlineConnect').classList.toggle('hidden',!!room);$('onlineRoom').classList.toggle('hidden',!room);
    if(!room){$('onlineNotice').textContent='Usaremos las rondas y el banco elegidos en el menú. Tiempo mínimo: 20 segundos.';return;}
    $('onlineRoomCode').textContent=room.code;
    $('onlinePlayers').innerHTML=room.state.players.map((p,i)=>'<div class="onlinePlayer"><b>'+esc(p.name)+(i===room.ownIndex?' · Tú':'')+'</b><small>'+(p.ready?'✓ Listo':'Preparándose…')+'</small></div>').join('')+(room.state.players.length<2?'<div class="onlinePlayer">Esperando compañero…</div>':'');
    const ready=room.state.players[room.ownIndex].ready;
    $('onlineReady').disabled=busy||ready;$('onlineReady').textContent=ready?'Listo · esperando al compañero':'Estoy listo';
    $('onlineNotice').textContent='Código de sala · '+room.state.rounds+' rondas · '+room.state.timerSeconds+' segundos por respuesta';
  }
  function result(s){
    const r=s.result;
    $('feedback').className='feedback '+(r.ok?'ok':r.kind==='accent'?'near':'bad');
    const title=r.ok?'¡Correcto!':r.kind==='accent'?'Casi: revisa la tilde':r.kind==='timeout'?'Tiempo agotado':'No es esa forma';
    const badge=r.ok?'<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M12 7h16v9c0 8-16 8-16 0V7Zm0 3H6v5c0 5 6 5 6 5m16-10h6v5c0 5-6 5-6 5M20 23v8m-7 3h14" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>':'<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><circle cx="20" cy="20" r="15" stroke="currentColor" stroke-width="3"/><path d="M20 11v11m0 6v1" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
    $('feedback').innerHTML='<div class="resultBadge">'+badge+'</div><div class="resultCopy"><strong>'+title+'</strong><div class="resultAnswer">Forma correcta: <b>'+esc(r.answer)+'</b></div></div><div class="resultReward"><b>'+(r.delta>=0?'+':'−')+Math.abs(r.delta)+'</b><span>fichas</span></div><div class="resultDetails">'+(r.ok?'×'+String(r.mult).replace('.',',')+' · +'+r.xp+' XP de juego':r.insurance?'Seguro activo · pérdida reducida':'La próxima es tuya')+(r.rescue?' · Rescate: 40 fichas':'')+'</div>';
    const key=room.id+'_'+s.turnNo;
    if(resultKey!==key){resultKey=key;sfx(r.ok?'ok':'bad');}
  }
  function finished(s){
    stop();state.running=false;state.ended=true;
    $('onlineLobby').classList.add('hidden');$('gameScreen').classList.add('hidden');$('endScreen').classList.remove('hidden');
    const aborted=['abandoned','disconnected'].includes(s.reason);
    $('winnerTitle').textContent=aborted?'Duelo terminado':s.winner===-1?'Empate técnico':'¡'+s.players[s.winner].name+' gana!';
    $('winnerSubtitle').textContent=(s.reason==='disconnected'?'Un jugador no ha reconectado dentro de 90 segundos. ':aborted?'Se ha abandonado la sala. ':'')+'El servidor ha guardado el progreso de cada alumno. La XP de LenguArcade se calcula a partir de los aciertos.';
    $('resultsGrid').innerHTML=s.players.map((p,i)=>'<article class="resultCard '+(i===s.winner?'winner':'')+'"><div class="playerTop"><div class="playerName">'+esc(p.name)+'</div><b>'+p.chips+' fichas</b></div><div class="statGrid"><div class="stat"><b>'+p.correct+'</b><span>Aciertos</span></div><div class="stat"><b>'+p.errors+'</b><span>Errores</span></div><div class="stat"><b>'+p.maxStreak+'</b><span>Mejor racha</span></div><div class="stat"><b>+'+p.xpGain+'</b><span>XP de juego</span></div></div></article>').join('');
    $('unlocks').innerHTML=(s.players[room.ownIndex].newAchievements||[]).map(a=>'<div class="unlock"><div class="unlockIcon">'+esc(a.icon)+'</div><div><strong>'+esc(a.title)+'</strong><div>'+esc(a.desc)+'</div></div></div>').join('');
    if(!teacher)commit(s.players[room.ownIndex].save);renderProfileHeader();
  }
  function apply(next){
    if(!next)return;
    if(room&&room.id===next.id&&next.version<room.version)return;
    const prev=room,wasPhase=prev?.state.phase,wasTurn=prev?.state.turnNo;
    room=next;offset=next.serverNow-Date.now();const s=next.state;
    if(s.phase==='waiting'){lobby();return;}
    // Do not replace an in-progress answer or local risk selection on polling.
    const preserve=prev&&wasTurn===s.turnNo&&wasPhase===s.phase;
    const tier=state.selectedTier,bet=state.selectedBet;
    Object.assign(state,s,{running:s.phase!=='finished',ended:s.phase==='finished',matchId:room.id});
    if(preserve&&s.phase==='choose'&&mine()){state.selectedTier=tier;state.selectedBet=bet;}
    if(s.phase==='finished'){finished(s);return;}
    $('onlineLobby').classList.add('hidden');$('setupScreen').classList.add('hidden');$('endScreen').classList.add('hidden');$('gameScreen').classList.remove('hidden');
    renderAll();$('turnLabel').textContent=mine()?'Tu turno · online':'Turno de '+state.players[state.currentPlayer].name+' · online';
    const q=s.currentQuestion;
    $('preQuestionState').classList.toggle('hidden',s.phase!=='choose');$('questionState').classList.toggle('hidden',s.phase==='choose');
    $('feedback').className='feedback hidden';
    if(q){
      $('verbTitle').textContent=q.verbo.toUpperCase();
      $('metaRow').innerHTML=[q.modo,q.tiempo,q.persona,TIERS[s.selectedTier].label].map(v=>'<span class="metaTag">'+esc(v)+'</span>').join('');
      $('prompt').textContent=q.modo==='forma no personal'?'Escribe el '+q.tiempo+' de «'+q.verbo+'».':'Conjuga «'+q.verbo+'» en '+q.persona+', '+q.tiempo+' de '+q.modo+'.';
      if(!preserve||prev?.state.currentQuestion?.id!==q.id)$('answerInput').value='';
      $('statusLine').innerHTML='<span>Apuesta: '+s.selectedBet+'</span><span>×'+TIERS[s.selectedTier].mult+'</span>'+(s.insuranceActive?'<span>🛡️ Seguro activo</span>':'')+(s.hintUsed?'<span>Pista −25%</span>':'');
      $('timerWrap').classList.toggle('hidden',s.phase!=='question');
      if(s.phase==='result')result(s);
      if(s.hint&&(!prev?.state.hintUsed||prev?.state.currentQuestion?.id!==q.id))toast('Pista',s.hint);
    }
    controls();timer();log(mine()?'🌐 Tu turno. El resultado se comparte con tu compañero.':'👀 Observa el turno de <b>'+esc(state.players[state.currentPlayer].name)+'</b>.');
  }
  async function send(action,extra={}){
    const payload={action,roomId:room?.id,turnNo:room?.state.turnNo,questionId:room?.state.currentQuestion?.id||'',requestId:crypto.randomUUID(),...extra};
    if(inFlight)await inFlight.catch(()=>{});
    const pending=request(payload);inFlight=pending;
    try{const data=await pending;if(data?.room)apply(data.room);return data;}
    finally{if(inFlight===pending)inFlight=null;}
  }
  async function act(action,extra={}){
    if(busy||!room||(['reveal','answer','hint','swap','insurance'].includes(action)&&!mine()))return;
    busy=true;clearTimeout(poll);controls();
    try{await send(action,extra);failures=0;}
    catch(e){
      if(['state_changed','stale_turn','request_busy','wrong_phase'].includes(e.message)){try{await send('get');}catch(_){} }
      else toast('No se pudo completar',messages[e.message]||'Problema de conexión. Inténtalo de nuevo.');
    }finally{busy=false;if(room?.state.phase==='waiting')lobby();else controls();schedule();}
  }
  async function connect(action){
    if(busy)return;
    if(action==='create'&&chooseClass&&!$('onlineClassInput').value){$('onlineNotice').textContent='No tienes clases asignadas. Sincroniza tus cursos de Classroom.';return;}
    busy=true;
    $('onlineCreate').disabled=true;$('onlineJoin').disabled=true;$('onlineNotice').textContent='Conectando…';
    try{
      await send(action,{code:$('onlineCodeInput').value,classCode:teacher?$('onlineClassInput').value:undefined,options:{rounds:Number($('rounds').value),timerSeconds:Number($('timer').value),bankMode:$('bankMode').value}});
      schedule();
    }catch(e){$('onlineNotice').textContent=messages[e.message]||'No se pudo conectar. Vuelve a intentarlo.';}
    finally{busy=false;$('onlineCreate').disabled=false;$('onlineJoin').disabled=false;if(room?.state.phase==='waiting')lobby();}
  }
  async function back(){
    if(busy)return;
    if(room&&room.state.phase!=='finished'){await act('leave');if(room.state.phase!=='finished')return;}
    stop();room=null;$('gameScreen').classList.remove('onlineSpectator');state.players=[];state.running=false;state.ended=false;
    $('onlineLobby').classList.add('hidden');$('gameScreen').classList.add('hidden');$('endScreen').classList.add('hidden');$('setupScreen').classList.remove('hidden');renderProfileHeader();
  }
  async function leave(){
    if(room&&room.state.phase!=='finished')await act('leave');
    if(room?.state.phase==='finished')close();
  }
  $('onlineBtn').onclick=()=>{lobby();};$('onlineCreate').onclick=()=>connect('create');$('onlineJoin').onclick=()=>connect('join');
  $('onlineReady').onclick=()=>act('ready');$('onlineBack').onclick=back;
  window.addEventListener('online',()=>{failures=0;schedule();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  return {active,ownIndex:()=>room?.ownIndex||0,lockChoices,act,leave,back,
    configure:async (available,practice=false,selectClass=false)=>{
      teacher=practice;chooseClass=selectClass;
      if(enabled||!available)return;enabled=true;if(!chooseClass)$('onlineBtn').classList.remove('hidden');
      try{
        if(chooseClass){
          const context=await request({action:'context',requestId:crypto.randomUUID()});
          $('onlineTeacherClass').classList.remove('hidden');
          $('onlineClassInput').innerHTML=(context.classes||[]).map(c=>'<option value="'+esc(c.classCode)+'">'+esc(c.name)+'</option>').join('');
          $('onlineBtn').classList.remove('hidden');
          if(!context.classes?.length)$('onlineNotice').textContent='No tienes clases asignadas. Sincroniza tus cursos de Classroom.';
        }
        const data=await send('resume');if(data.room&&data.room.state.phase!=='finished')schedule();else if(data.room){room=null;state.players=[];$('endScreen').classList.add('hidden');$('setupScreen').classList.remove('hidden');}}catch(_){}
    }};
};
