(() => {
'use strict';
const GAME_ID='word_play',GAME_NS='lenguarcade-game',HOST_NS='lenguarcade-host';
const AUTOSAVE_MS=30000,EXIT_FALLBACK_MS=2500;
const params=Object.fromEntries(new URLSearchParams(location.search||'').entries());
const embedded=String(params.lenguarcade||params.la||'')==='1';
const channel=String(params.channel||'');
let initialized=false,profile=null,lastSignature='',lastCompleted=false,sessionStarted=false,checkpointTimer=null;
let exitRequested=false,exitCheckpointId='',exitFallbackTimer=null;
if(!embedded||!channel)return;
window.__LENGUARCADE_EMBEDDED=true;

function postToAncestors(message){
  let target=window;
  for(let depth=0;depth<5;depth+=1){
    try{
      if(!target.parent||target.parent===target)break;
      target=target.parent;
      target.postMessage(message,'*');
    }catch{break;}
  }
}
function post(type,payload={}){postToAncestors({namespace:GAME_NS,channel,gameId:GAME_ID,type,payload});}
function safeId(v){return String(v||'player').toLowerCase().replace(/[^a-z0-9_-]+/g,'_').slice(0,48)||'player';}
function state(){return window.WordPlayEngine?.state||null;}
function career(){return window.WordPlayEngine?.career||{};}
function achievements(){
  const c=career(),catalog=window.WordPlayContent?.achievements||[];
  return Object.keys(c.achievements||{}).map(id=>{
    const a=catalog.find(x=>x.id===id)||{};
    return{id,title:a.name||id,description:a.desc||'',xpReward:25};
  });
}
function metrics(s){
  const correct=Number(s?.words?.length||0),errors=Number(s?.invalidAttempts||0),attempts=correct+errors;
  const accuracy=attempts?Math.round(correct/attempts*100):0;
  const totalRounds=window.WordPlayEngine?.totalRounds?.(s?.mode)||12;
  const percentage=s?.mode==='quick'
    ?Math.min(100,Math.round(correct/10*100))
    :Math.min(100,Math.round((Number(s?.round||1)-1+(s?.completed?1:0))/Math.max(1,totalRounds)*100));
  return{correct,errors,attempts,accuracy,grade:Math.round(accuracy)/10,score:Number(s?.totalScore||0),percentage,maxCombo:Number(s?.bestCombo||1),round:Number(s?.round||1),words:correct,longestWord:String(s?.longestWord||''),mode:String(s?.mode||'normal')};
}
function participant(outcome='checkpoint'){
  const s=state()||{},m=metrics(s);
  return{role:'primary',outcome,score:m.score,correct:m.correct,errors:m.errors,attempts:m.attempts,accuracy:m.accuracy,grade:m.grade,percentage:m.percentage,maxCombo:m.maxCombo,achievements:achievements(),metrics:m,save:{version:2,gameId:GAME_ID,run:s,career:career()}};
}
function matchId(){return`word_play_${safeId(profile&&(profile.studentId||profile.email))}`;}
function mergeObjectMax(target={},incoming={}){
  for(const [key,value] of Object.entries(incoming||{})){
    if(typeof value==='number')target[key]=Math.max(Number(target[key]||0),value);
    else if(target[key]==null)target[key]=value;
  }
  return target;
}
function mergeCareer(incoming){
  if(!incoming||typeof incoming!=='object'||!window.WordPlayEngine?.career)return false;
  const local=window.WordPlayEngine.career;
  for(const key of ['bestScore','games','wins','quickGames','dailyGames','xp','bestPlay','bestCombo']){
    local[key]=Math.max(Number(local[key]||0),Number(incoming[key]||0));
  }
  if(String(incoming.bestWord||'').length>String(local.bestWord||'').length)local.bestWord=incoming.bestWord;
  local.words=mergeObjectMax(local.words||{},incoming.words||{});
  local.cards=mergeObjectMax(local.cards||{},incoming.cards||{});
  local.achievements=Object.assign({},incoming.achievements||{},local.achievements||{});
  try{localStorage.setItem('lenguarcade.wordplay.career.v3',JSON.stringify(local));}catch{}
  return true;
}
function restoreIncoming(save){
  try{
    const raw=save?.rawGameData?.save||save?.rawGameData||save?.save||save;
    const run=raw?.run||raw?.state||null;
    mergeCareer(raw?.career);
    if(run&&[3,4].includes(Number(run.version))&&!run.completed&&window.WordPlayEngine){
      window.WordPlayEngine.state=run;
      window.WordPlayEngine.saveRun();
      const migrated=window.WordPlayEngine.loadRun();
      if(migrated)window.WordPlayEngine.state=migrated;
      return !!migrated;
    }
  }catch(error){console.warn('Word Play: no se pudo restaurar la partida de LenguArcade.',error);}
  return false;
}
function initialize(payload={},source='message'){
  if(initialized)return;
  profile=payload?.student||{};
  const restored=restoreIncoming(payload?.save||null);
  initialized=true;
  post('INITIALIZED',{profileId:profile.studentId||profile.email||'',restored,source});
  post('READY',{gameId:GAME_ID,version:2});
  if(!checkpointTimer)poll();
}
function readBootstrap(){
  try{
    if(!window.name)return null;
    const boot=JSON.parse(window.name);
    if(boot?.namespace!=='lenguarcade-bootstrap'||boot?.channel!==channel||boot?.gameId!==GAME_ID)return null;
    window.name='';
    return boot.payload||null;
  }catch{return null;}
}
function markStarted(){
  if(sessionStarted)return;
  const s=state();if(!s)return;
  sessionStarted=true;
  post('SESSION_STARTED',{mode:s.mode||'normal'});
}
function checkpoint(reason='autosave'){
  const s=state();
  if(!initialized||!s||s.completed)return'';
  const signature=[s.mode,s.round,s.totalScore,s.playsLeft,s.words?.length,s.rngCounter,s.coins,s.ink].join('|');
  if(reason==='autosave'&&signature===lastSignature)return'';
  lastSignature=signature;
  const checkpointId=`word_play_checkpoint_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  post('CHECKPOINT',{checkpointId,matchId:matchId(),reason,players:[participant('checkpoint')]});
  return checkpointId;
}
function result(){
  const s=state();
  if(!initialized||!s||!s.completed||lastCompleted)return;
  lastCompleted=true;
  post('RESULT',{resultId:`word_play_result_${Date.now()}_${Math.random().toString(36).slice(2)}`,matchId:matchId(),outcome:s.won?'win':'finished',players:[participant(s.won?'win':'finished')]});
}
function finishExit(saved=true){
  if(!exitRequested)return;
  if(exitFallbackTimer){clearTimeout(exitFallbackTimer);exitFallbackTimer=null;}
  post('CLOSE_READY',{saved,checkpointId:exitCheckpointId,localFallback:!saved});
  exitRequested=false;
  exitCheckpointId='';
}
function saveAndExit(){
  if(exitRequested)return;
  const s=state();
  try{window.WordPlayEngine?.saveRun?.();}catch{}
  exitRequested=true;
  if(!s||s.completed){
    if(s?.completed)result();
    finishExit(true);
    return;
  }
  exitCheckpointId=checkpoint('exit');
  if(!exitCheckpointId){finishExit(true);return;}
  exitFallbackTimer=setTimeout(()=>finishExit(false),EXIT_FALLBACK_MS);
}
function poll(){
  const s=state();
  if(s){
    markStarted();
    if(s.completed)result();
    else checkpoint('autosave');
  }
  checkpointTimer=setTimeout(poll,AUTOSAVE_MS);
}
window.addEventListener('message',event=>{
  const msg=event.data||{};
  if(msg.namespace!==HOST_NS||msg.channel!==channel)return;
  if(msg.type==='INIT')initialize(msg.payload||{},'message');
  if(msg.type==='REQUEST_CHECKPOINT')checkpoint('host_request');
  if(msg.type==='REQUEST_EXIT')saveAndExit();
  if(msg.type==='CHECKPOINT_CONFIRMED'&&exitRequested&&(!exitCheckpointId||msg.payload?.checkpointId===exitCheckpointId))finishExit(true);
  if(msg.type==='CHECKPOINT_FAILED'&&exitRequested&&(!exitCheckpointId||msg.payload?.checkpointId===exitCheckpointId))finishExit(false);
});
window.addEventListener('pagehide',()=>{if(!exitRequested)checkpoint('pagehide');});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&!exitRequested)checkpoint('visibility_hidden');});

const bootstrap=readBootstrap();
if(bootstrap)initialize(bootstrap,'bootstrap');
const readyTimer=setInterval(()=>{
  if(initialized){clearInterval(readyTimer);return;}
  post('READY',{gameId:GAME_ID,version:2});
},900);
post('READY',{gameId:GAME_ID,version:2});
window.WordPlayBridge={checkpoint,result,saveAndExit,get initialized(){return initialized;}};
})();
