/* Shared-board adapter. The local expedition engine is paused and preserved. */
window.LexitramaCoop=(()=>{
 'use strict';
 const C=window.LexitramaContent,E=window.LexitramaEngine,$=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const errors={room_not_found:'No encuentro esa sala en tu clase.',invalid_code:'El código tiene ocho letras o números.',room_full:'Esa sala ya tiene dos jugadores.',already_in_room:'Ya perteneces a otra sala. Vuelve a entrar para recuperarla.',game_access_closed:'El profesor ha cerrado el juego.',no_classroom:'La sala debe pertenecer a tu clase.',session_expired:'Vuelve a entrar en LenguArcade para renovar tu sesión.',save_unavailable:'No se ha confirmado tu guardado. Pulsa Guardar y vuelve a intentarlo.',already_found:'Esa palabra ya la ha encontrado vuestro equipo.',partner_needed:'Tu parte está completa. Ahora necesita aportar tu compañero.',unknown_word:'No está en el banco. Revisa las letras y las tildes.',wrong_content:'Es una palabra del banco, pero no cumple este objetivo.',invalid_path:'Conecta solo en horizontal o vertical, sin repetir casillas.',state_changed:'La sala se está actualizando. Reintenta.',connection_timeout:'La conexión tarda. Tu selección se conserva; puedes reintentar.',student_required:'La pareja necesita al menos un alumno.'};
 let transport=Promise.resolve();
 let enabled=false,visible=false,room=null,busy=false,poll=null,clock=null,offset=0,path=[],dragging=false,pointer=null,viewKey='',notice='',classes=[],teacher=false,boot=null,seenSave='';
 const active=()=>!!room;
 const notify=()=>window.dispatchEvent(new CustomEvent('lexitrama:coop-change'));
 const tell=message=>{notice=message;if($('coopNotice'))$('coopNotice').textContent=message;};
 function stop(){clearTimeout(poll);clearInterval(clock);}
 function apply(data){
  const next=data?.room;if(!next)return;
  if(room?.id===next.id&&next.version<room.version)return;
  const oldPhase=room?.state.phase;room=next;offset=next.serverNow-Date.now();visible=true;
  if(data.save&&room.state.phase==='finished'&&seenSave!==room.id){seenSave=room.id;E.syncCoopCareer(data.save);}
  if(oldPhase!==room.state.phase&&room.state.phase==='finished')tell(room.state.won?'¡Trama compartida completada!':'Expedición terminada. Se conserva vuestra aportación.');
  notify();
 }
 function request(action,extra={}){const next=transport.then(()=>sendRequest(action,extra));transport=next.catch(()=>{});return next;}
 async function sendRequest(action,extra={}){
  const payload={action,roomId:room?.id,requestId:crypto.randomUUID(),...extra};
  // Network retries use the same requestId; a server-confirmed word cannot count twice.
  let last;
  for(let i=0;i<2;i++){
   try{const data=await window.LexitramaBridge.onlineRequest(payload);apply(data);return data;}
   catch(e){last=e;if(!['connection_timeout','state_changed','request_busy'].includes(e.message))throw e;}
  }
  throw last;
 }
 function schedule(){
  clearTimeout(poll);if(!room||room.state.phase==='finished')return;
  poll=setTimeout(async()=>{if(busy){schedule();return;}try{await request('get');}catch(e){tell(errors[e.message]||'Reconectando… Tu aportación confirmada se conserva.');}schedule();},1800);
 }
 async function act(action,extra={}){
  if(busy)return;busy=true;controls();
  try{
   const data=await request(action,extra);
   if(action==='submit'){
    if(data.result?.ok){path=[];tell('✓ '+data.result.word+' · +'+data.result.points+' puntos · '+room.state.explain);window.LexitramaAudio?.play('correct');}
    else tell(errors[data.result?.code]||'La palabra ya está registrada o la partida ha terminado.');
   }
   return data;
  }catch(e){tell(errors[e.message]||'No se pudo conectar. Reintenta.');throw e;}
  finally{busy=false;controls();selection();schedule();}
 }
 async function connect(action){
  if(busy)return;busy=true;tell('Confirmando tu progreso antes de conectar…');
  const code=$('coopCode')?.value||'',mission=$('coopMission')?.value||'sustantivo',duration=Number($('coopDuration')?.value||180),classCode=$('coopClass')?.value;
  try{await boot;await window.LexitramaBridge.flush();await request(action,{code,classCode,options:{mission,duration}});tell('Comparte el código y confirma cuando estéis preparados.');schedule();}
  catch(e){tell(errors[e.message]||'No se pudo abrir la sala. Reintenta.');}
  finally{busy=false;controls();}
 }
 function controls(){
  document.querySelectorAll('[data-coop]').forEach(b=>b.disabled=busy);
  if(!room)return;
  const s=room.state,p=s.players[room.ownIndex];
  if($('coopReady'))$('coopReady').disabled=busy||p.ready;
  if($('coopSubmit'))$('coopSubmit').disabled=busy||s.phase!=='playing'||p.correct>=s.goal-s.minEach;
 }
 function selection(){
  if(!$('coopBoard')||!room)return;
  document.querySelectorAll('[data-coop-tile]').forEach(el=>el.classList.toggle('selected',path.includes(Number(el.dataset.coopTile))));
  $('coopWord').textContent=path.map(i=>room.state.board[i]).join('')||'Traza una palabra';
 }
 function add(i){
  if(busy||room?.state.phase!=='playing')return;
  if(path.at(-1)===i)return;
  if(path.length>1&&path.at(-2)===i)path.pop();
  else if(!path.includes(i)&&(!path.length||(Math.abs(Math.floor(i/7)-Math.floor(path.at(-1)/7))+Math.abs(i%7-path.at(-1)%7))===1))path.push(i);
  selection();
 }
 function submit(){if(path.length>=2)act('submit',{path:[...path]}).catch(()=>{});}
 function tick(){
  if(!$('coopClock')||!room)return;
  const seconds=Math.max(0,Math.ceil((room.state.deadline-Date.now()-offset)/1000));
  $('coopClock').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
 }
 function render(){
  document.body.dataset.screen='coop';
  const s=room?.state,key=room?room.id+':'+s.phase:'connect';
  if(viewKey!==key||!$('coopRoot')){
   viewKey=key;path=[];
   let html='';
   if(!room){
    html=`<div class="coop-connect"><div><div class="eyebrow">Dos exploradores · un mismo Atlas</div><h1>Tejed<br>juntos.</h1><p class="sub">Encontrad seis palabras en una trama compartida. Cada uno debe aportar al menos dos. Las letras permanecen fijas y las palabras se marcan para ambos.</p><p class="sub">La XP individual se registra al terminar o abandonar la sala, según las palabras de cada uno.</p></div><div class="panel coop-form"><label>Contenido<select id="coopMission">${C.missions.filter(m=>C.words.filter(w=>m.test(w)&&w.word.length>=3&&w.word.length<=7).length>=6).map(m=>`<option value="${m.id}">${esc(m.title)}</option>`).join('')}</select></label><label>Tiempo<select id="coopDuration"><option value="180">3 minutos</option><option value="300">5 minutos</option></select></label>${teacher?`<label>Clase<select id="coopClass">${classes.map(c=>`<option value="${esc(c.classCode)}">${esc(c.name)}</option>`).join('')}</select></label>`:''}<button class="primary" data-coop="create">Crear sala</button><div class="coop-join"><input id="coopCode" aria-label="Código de sala" maxlength="8" placeholder="Código de sala"><button data-coop="join">Unirse</button></div></div></div>`;
   }else if(s.phase==='waiting'){
    html=`<div class="coop-wait"><div class="eyebrow">Compartid este código</div><h1 id="coopRoomCode">${esc(room.code)}</h1><h2>${esc(s.title)}</h2><p>${s.duration/60} minutos · 6 palabras · mínimo 2 por persona</p><div id="coopPlayers"></div><button id="coopReady" class="primary" data-coop="ready">Estoy listo</button></div>`;
   }else if(s.phase==='finished'){
    const reason={complete:'Habéis completado el objetivo entre los dos.',timeout:'Se ha agotado el tiempo.',abandoned:'Un jugador ha salido de la sala.',disconnected:'Un jugador no ha vuelto a conectarse en 90 segundos.'};
    html=`<div class="coop-end"><div class="eyebrow">${s.won?'¡Equipo conseguido!':'Cada palabra cuenta'}</div><h1>${s.won?'¡Trama compartida!':'Fin de expedición'}</h1><p>${reason[s.reason]||'Expedición terminada'}</p><div id="coopPlayers"></div><div id="coopFound"></div><p class="sub">Cada alumno conserva su aportación. La XP de LenguArcade depende de sus propias palabras y de los límites comunes de la plataforma.</p><button class="primary" data-coop="again">Otra expedición compartida</button></div>`;
   }else{
    html=`<div class="coop-hud"><div><div class="eyebrow">Atlas compartido</div><h2>${esc(s.title)}</h2><p id="coopProgress"></p></div><strong id="coopClock"></strong></div><div class="coop-play"><div class="coop-board-column"><div class="coop-board-space"><div id="coopBoard" class="coop-board" role="group" aria-label="Tablero compartido de siete por siete">${s.board.map((letter,i)=>`<button data-coop-tile="${i}" aria-label="${letter}, fila ${Math.floor(i/7)+1}, columna ${i%7+1}">${letter}</button>`).join('')}</div></div><div class="coop-wordbar"><strong id="coopWord" role="status">Traza una palabra</strong><button data-coop="clear">Borrar</button><button id="coopSubmit" data-coop="submit" class="primary">Validar</button></div></div><aside class="coop-side"><div id="coopPlayers"></div><h3>Palabras del equipo</h3><div id="coopFound"></div><p class="sub">Conectad letras vecinas solo en horizontal y vertical. Las letras pueden formar parte de varias palabras distintas.</p></aside></div>`;
   }
   $('view').innerHTML=`<section id="coopRoot" class="coop-root"><div class="coop-title"><span>LEXITRAMA · COOPERATIVO</span><button data-coop="back" class="quiet">${room&&s.phase!=='finished'?'Salir de la sala':'Menú'}</button></div>${html}<p id="coopNotice" class="coop-notice" role="status" aria-live="polite"></p></section>`;
   $('coopRoot').onclick=e=>{const b=e.target.closest('[data-coop]');if(!b||b.disabled)return;const action=b.dataset.coop;
    if(['create','join'].includes(action))connect(action);
    else if(action==='ready')act('ready').catch(()=>{});
    else if(action==='submit')submit();
    else if(action==='clear'){path=[];selection();}
    else if(action==='back')exit().then(()=>{visible=false;notify();}).catch(()=>{});
    else if(action==='again'){room=null;viewKey='';notice='Uno crea la sala nueva y comparte el código con su compañero.';render();}
   };
   const board=$('coopBoard');if(board){
    board.onpointerdown=e=>{if(e.button!==0&&e.pointerType==='mouse')return;const t=e.target.closest('[data-coop-tile]');if(!t)return;e.preventDefault();dragging=true;pointer=e.pointerId;path=[];board.setPointerCapture(pointer);add(Number(t.dataset.coopTile));};
    board.onpointermove=e=>{if(!dragging||e.pointerId!==pointer)return;e.preventDefault();const t=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-coop-tile]');if(t)add(Number(t.dataset.coopTile));};
    board.onpointerup=e=>{if(e.pointerId!==pointer)return;dragging=false;if(board.hasPointerCapture(pointer))board.releasePointerCapture(pointer);submit();};
    board.onpointercancel=()=>{dragging=false;path=[];selection();};board.onlostpointercapture=()=>{dragging=false;};
    board.onkeydown=e=>{if(e.key===' '){e.preventDefault();add(Number(e.target.dataset.coopTile));}else if(e.key==='Enter'){e.preventDefault();submit();}else if(e.key==='Escape'){path=[];selection();}};
   }
  }
  if(room){
   const s=room.state;
   if($('coopProgress'))$('coopProgress').textContent=`${s.found.length} / ${s.goal} palabras · mínimo ${s.minEach} por persona`;
   if($('coopPlayers'))$('coopPlayers').innerHTML=s.players.map((p,i)=>`<div class="coop-player player-${i}"><b>${esc(p.name)}${i===room.ownIndex?' · Tú':''}</b><span>${s.phase==='waiting'?(p.ready?'✓ Listo':'Preparándose…'):`${p.correct} palabras · ${p.score} puntos`}</span>${s.phase==='playing'&&!s.peerRecent?.[i]?'<small>Sin respuesta reciente · puede reconectar</small>':''}</div>`).join('')+(s.players.length<2?'<p>Esperando al compañero…</p>':'');
   if($('coopReady'))$('coopReady').textContent=s.players[room.ownIndex].ready?'Listo · esperando':'Estoy listo';
   if($('coopFound'))$('coopFound').innerHTML=s.found.map(w=>`<p class="player-${w.player}"><b>${esc(w.word)}</b><small>${esc(s.players[w.player].name)} · +${w.points}</small></p>`).join('')||'<p class="sub">Aquí aparecerán vuestros hallazgos.</p>';
   document.querySelectorAll('[data-coop-tile]').forEach(t=>{const i=Number(t.dataset.coopTile);t.classList.toggle('found-0',s.found.some(w=>w.player===0&&w.path.includes(i)));t.classList.toggle('found-1',s.found.some(w=>w.player===1&&w.path.includes(i)));});
  }
  $('coopNotice').textContent=notice;controls();selection();clearInterval(clock);if(s?.phase==='playing'){tick();clock=setInterval(tick,250);}
 }
 async function exit(){
  if(busy)throw Error('busy');
  if(room&&room.state.phase!=='finished')await act('leave');
  stop();room=null;viewKey='';path=[];
 }
 function configure(payload){
  if(enabled||!payload.onlineMultiplayer)return;enabled=true;teacher=payload.teacherPractice===true;notify();
  boot=(async()=>{try{
    if(teacher){const ctx=await window.LexitramaBridge.onlineRequest({action:'context',requestId:crypto.randomUUID()});classes=ctx.classes||[];}
    await window.LexitramaBridge.flush();const data=await window.LexitramaBridge.onlineRequest({action:'resume',requestId:crypto.randomUUID()});
    if(data.room&&data.room.state.phase!=='finished'){apply(data);schedule();}
    else if(data.save)E.syncCoopCareer(data.save);
   }catch(e){tell(errors[e.message]||'No se pudo recuperar una sala anterior. Puedes reintentar al entrar.');}})();
 }
 window.addEventListener('online',()=>{if(room)refresh();});
 window.addEventListener('visibilitychange',()=>{if(!document.hidden&&room)refresh();});
 function refresh(){if(!room||busy)return;act('get').catch(()=>{});}
 return {get enabled(){return enabled;},get visible(){return visible;},active,configure,open(){if(!enabled)return;visible=true;viewKey='';render();},hide(){visible=false;viewKey='';},render,exit,refresh};
})();
