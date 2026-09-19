(() => {
'use strict';
const GAME_ID='lexaria',GAME_NS='lenguarcade-game',HOST_NS='lenguarcade-host';
const params=Object.fromEntries(new URLSearchParams(location.search||'').entries());
const embedded=String(params.lenguarcade||params.la||'')==='1';
const channel=String(params.channel||'');
let initialized=false,profile=null,lastSignature='',lastResult=false,sessionStarted=false,timer=null;
if(!embedded||!channel)return;
window.__LENGUARCADE_EMBEDDED=true;
function postToAncestors(message){
  let target=window;
  for(let depth=0;depth<5;depth++){
    try{if(!target.parent||target.parent===target)break;target=target.parent;target.postMessage(message,'*');}catch{break;}
  }
}
function post(type,payload){postToAncestors({namespace:GAME_NS,channel,gameId:GAME_ID,type,payload:payload||{}});}
function safeId(v){return String(v||'player').toLowerCase().replace(/[^a-z0-9_-]+/g,'_').slice(0,48)||'player';}
function metrics(){
  const m=window.LexariaGame?.metrics?.()||{};
  const correct=Number(m.trainingCorrect||0),attempts=Number(m.trainingAttempts||0);
  const accuracy=attempts?Math.round(correct/attempts*100):0;
  const percentage=Math.min(100,Math.round(Number(m.wins||0)/10*100));
  return Object.assign({},m,{correct,attempts,errors:Math.max(0,attempts-correct),accuracy,percentage,score:Number(m.wins||0)*100+correct*12+Number(m.day||0)*5});
}
function achievements(){return window.LexariaGame?.achievements?.()||[];}
function savePackage(){
  return {version:1,gameId:GAME_ID,run:window.LexariaGame?.run||null,career:window.LexariaGame?.career||null};
}
function participant(outcome){
  const m=metrics();
  return {role:'primary',outcome:outcome||'checkpoint',score:m.score,correct:m.correct,errors:m.errors,attempts:m.attempts,accuracy:m.accuracy,grade:Math.round(m.accuracy)/10,percentage:m.percentage,achievements:achievements(),metrics:m,save:savePackage()};
}
function matchId(){return 'lexaria_'+safeId(profile&&(profile.studentId||profile.email||profile.name));}
function checkpoint(reason){
  if(!initialized)return;
  const m=metrics(),r=window.LexariaGame?.run;
  const sig=[r?.id,m.day,m.wins,m.lives,m.trainingCorrect,m.discovered,m.xp].join('|');
  if((reason||'autosave')==='autosave'&&sig===lastSignature)return;
  lastSignature=sig;
  post('CHECKPOINT',{checkpointId:'lexaria_checkpoint_'+Date.now()+'_'+Math.random().toString(36).slice(2),matchId:matchId(),reason:reason||'autosave',players:[participant('checkpoint')]});
}
function result(outcome){
  if(!initialized||lastResult)return;
  lastResult=true;
  post('RESULT',{resultId:'lexaria_result_'+Date.now()+'_'+Math.random().toString(36).slice(2),matchId:matchId(),outcome:outcome||'finished',players:[participant(outcome||'finished')]});
}
function restoreIncoming(save){
  try{
    const raw=save?.rawGameData?.save||save?.rawGameData||save?.save||save;
    if(!raw)return false;
    window.LexariaGame?.restore?.(raw);
    return !!raw.run;
  }catch{return false;}
}
function session(){
  if(sessionStarted)return;
  sessionStarted=true;post('SESSION_STARTED',{mode:'league'});
}
function poll(){checkpoint('autosave');timer=setTimeout(poll,12000);}
window.addEventListener('message',event=>{
  const msg=event.data||{};
  if(msg.namespace!==HOST_NS||msg.channel!==channel)return;
  if(msg.type==='INIT'){
    profile=msg.payload?.student||{};
    const restored=restoreIncoming(msg.payload?.save||null);
    initialized=true;
    post('INITIALIZED',{profileId:profile.studentId||profile.email||'',restored});
    post('READY',{gameId:GAME_ID,version:1});
    if(!timer)poll();
  }
  if(msg.type==='REQUEST_CHECKPOINT')checkpoint('host_request');
  if(msg.type==='OPPONENTS'){
    window.LexariaGame?.setStudentOpponents?.(msg.payload?.opponents||[]);
  }
});
window.addEventListener('pagehide',()=>checkpoint('pagehide'));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')checkpoint('visibility_hidden');});
const readyTimer=setInterval(()=>{if(initialized){clearInterval(readyTimer);return;}post('READY',{gameId:GAME_ID,version:1});},900);
post('READY',{gameId:GAME_ID,version:1});
function requestOpponents(){
  if(!initialized)return;
  post('REQUEST_OPPONENTS',{mode:'student_async',limit:8});
}
function publishSquad(squad){
  if(!initialized||!squad)return;
  post('PUBLISH_SQUAD',{mode:'student_async',squad});
  checkpoint('publish_squad');
}
window.LexariaBridge={checkpoint,result,sessionStarted:session,requestOpponents,publishSquad};
})();