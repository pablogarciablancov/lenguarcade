/* Adaptador aislado del protocolo actual del runner de LenguArcade. */
(() => {
  'use strict';
  const E=window.LexitramaEngine,C=window.LexitramaContent;
  const params=new URLSearchParams(location.search);
  const embedded=params.get('lenguarcade')==='1'||params.get('la')==='1';
  const channel=params.get('channel')||'';
  let initialized=false,profile={},exitCheckpoint='',changeTimer=null,inFlight=null;
  const outbox=[],confirmedResults=new Set();
  function post(type,payload={}) {
    if(!embedded||!channel)return;
    let target=window;
    for(let i=0;i<5;i++){
      if(target.parent===target)break;
      target=target.parent;
      target.postMessage({namespace:'lenguarcade-game',channel,gameId:'lexitrama',type,payload},'*');
    }
  }
  function status(text){window.dispatchEvent(new CustomEvent('lexitrama:save-status',{detail:text}));}
  function participant(outcome='checkpoint') {
    const s=E.state,correct=s?.correct||0,errors=s?.errors||0;
    const accuracy=correct+errors?Math.round(correct/(correct+errors)*100):0;
    const metrics={score:s?.score||0,correct,errors,attempts:correct+errors,accuracy,grade:accuracy/10,percentage:Math.round(Object.keys(E.career?.stars||{}).length/C.levels.length*100),maxCombo:s?E.multiplier():1,mode:s?.mode||'menu',stars:s?.stars||0,words:correct,longestWord:s?.longest||0,content:s?.mission||'',completed:!!s?.completed,won:!!s?.won};
    const achievements=C.achievements.filter(a=>E.career?.achievements[a.id]).map(a=>({id:`lexitrama_${a.id}`,title:a.name,description:a.description,xpReward:25}));
    return {role:'primary',outcome,...metrics,metrics,achievements,save:E.snapshot()};
  }
  function pump(){
    if(!initialized||inFlight||!outbox.length)return;
    inFlight=outbox.shift();inFlight.failed=false;
    status(inFlight.type==='RESULT'?'Guardando resultado…':'Guardando en LenguArcade…');
    post(inFlight.type,inFlight.payload);
  }
  function queue(event){
    // Una única escritura en vuelo evita que un resultado antiguo pise el siguiente tablero.
    // Las instantáneas de resultados y salida nunca se descartan; autosaves consecutivos se compactan.
    const tail=outbox.at(-1);
    if(event.type==='CHECKPOINT'&&tail?.type==='CHECKPOINT'&&tail.payload.reason!=='exit'&&event.payload.reason!=='exit')outbox.pop();
    outbox.push(event);pump();
  }
  function checkpoint(reason='autosave') {
    if(!initialized)return '';
    const checkpointId=`lexitrama_cp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    queue({type:'CHECKPOINT',payload:{checkpointId,matchId:E.state?.id||'lexitrama_profile',reason,players:[participant()]}});
    return checkpointId;
  }
  function result(){
    const s=E.state;if(!initialized||!s?.completed)return;
    const id=`${s.id}_result`;
    if(confirmedResults.has(id)||inFlight?.payload.resultId===id||outbox.some(e=>e.payload.resultId===id))return;
    queue({type:'RESULT',payload:{resultId:id,matchId:s.id,outcome:s.won?'win':'finished',players:[participant(s.won?'win':'finished')]}});
  }
  function initialize(payload={}){
    if(initialized)return;
    profile=payload.student||{};
    const restored=E.initialize(profile,payload.save||null,true);initialized=true;
    post('INITIALIZED',{profileId:profile.studentId||profile.email||'',restored});
    status('Perfil conectado · guardado central');
  }
  function saveAndExit(){
    E.persist();
    if(!embedded){window.dispatchEvent(new CustomEvent('lexitrama:menu'));return;}
    if(!initialized){status('Esperando conexión con LenguArcade.');return;}
    if(exitCheckpoint)return;
    clearTimeout(changeTimer);
    exitCheckpoint=checkpoint('exit');
    post('REQUEST_EXIT');
    // CLOSE_READY se envía únicamente tras la confirmación real del host.
  }
  function ancestor(source){let p=window;for(let i=0;i<5;i++){if(p.parent===p)break;p=p.parent;if(source===p)return true;}return false;}
  function confirmed(id,type){
    if(inFlight?.type!==type||id!==(type==='RESULT'?inFlight.payload.resultId:inFlight.payload.checkpointId))return;
    if(type==='RESULT')confirmedResults.add(id);
    inFlight=null;status('Progreso guardado en LenguArcade.');
    if(exitCheckpoint===id){exitCheckpoint='';post('CLOSE_READY',{saved:true,checkpointId:id});}
    pump();
  }
  function failed(id,type){
    if(inFlight?.type!==type||(id&&id!==(type==='RESULT'?inFlight.payload.resultId:inFlight.payload.checkpointId)))return;
    inFlight.failed=true;
    status('No se pudo guardar en LenguArcade. Pulsa Guardar para reintentar.');
  }
  function retry(){
    if(inFlight){inFlight.failed=false;post(inFlight.type,inFlight.payload);status('Reintentando guardado…');}
    else{checkpoint('manual');result();}
  }
  window.addEventListener('message',event=>{
    const m=event.data||{};
    if(!embedded||!ancestor(event.source)||m.namespace!=='lenguarcade-host'||m.channel!==channel)return;
    if(m.type==='INIT')initialize(m.payload);
    if(m.type==='REQUEST_CHECKPOINT')checkpoint('host_request');
    if(m.type==='REQUEST_EXIT'){
      if(inFlight?.failed)retry();
      saveAndExit();
    }
    if(m.type==='CHECKPOINT_CONFIRMED')confirmed(m.payload?.checkpointId,'CHECKPOINT');
    if(m.type==='CHECKPOINT_FAILED')failed(m.payload?.checkpointId,'CHECKPOINT');
    if(m.type==='SAVE_CONFIRMED')confirmed(m.payload?.resultId,'RESULT');
    if(m.type==='SAVE_FAILED')failed(null,'RESULT');
  });
  window.addEventListener('lexitrama:start',()=>{post('SESSION_STARTED',{mode:E.state.mode});checkpoint('start');});
  window.addEventListener('lexitrama:change',()=>{
    if(!initialized||exitCheckpoint)return;
    clearTimeout(changeTimer);changeTimer=setTimeout(()=>checkpoint('progress'),700);
  });
  window.addEventListener('lexitrama:finish',result);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&!exitCheckpoint)checkpoint('visibility_hidden');});
  window.addEventListener('pagehide',()=>{E.persist();if(!exitCheckpoint)checkpoint('pagehide');});
  if(embedded){
    let bootstrap=null;
    try{const b=JSON.parse(window.name||'null');if(b?.namespace==='lenguarcade-bootstrap'&&b.channel===channel&&b.gameId==='lexitrama'){bootstrap=b.payload;window.name='';}}catch{}
    if(bootstrap)initialize(bootstrap);
    post('READY',{version:1});
    const timer=setInterval(()=>{if(initialized)clearInterval(timer);else post('READY',{version:1});},900);
    setInterval(()=>{if(initialized&&E.state&&!E.state.completed&&!exitCheckpoint)checkpoint('autosave');},30000);
  }else{
    E.initialize({},null,false);status('Prueba local · progreso guardado en este navegador');
  }
  window.LexitramaBridge={embedded,checkpoint,result,retry,saveAndExit,get initialized(){return initialized;},get profile(){return profile;},get exiting(){return !!exitCheckpoint;}};
})();
