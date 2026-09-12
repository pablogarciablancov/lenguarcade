(() => {
'use strict';
const GAME_ID='word_play',GAME_NS='lenguarcade-game',HOST_NS='lenguarcade-host';
const params=Object.fromEntries(new URLSearchParams(location.search||'').entries());
const embedded=String(params.lenguarcade||params.la||'')==='1';
const channel=String(params.channel||'');
let initialized=false,profile=null,lastSignature='',lastCompleted=false,sessionStarted=false,checkpointTimer=null;
if(!embedded||!channel)return;
window.__LENGUARCADE_EMBEDDED=true;
function postToAncestors(message){let target=window;for(let depth=0;depth<5;depth+=1){try{if(!target.parent||target.parent===target)break;target=target.parent;target.postMessage(message,'*');}catch{break;}}}
function post(type,payload={}){postToAncestors({namespace:GAME_NS,channel,gameId:GAME_ID,type,payload});}
function safeId(v){return String(v||'player').toLowerCase().replace(/[^a-z0-9_-]+/g,'_').slice(0,48)||'player';}
function state(){return window.WordPlayEngine?.state||null;}
function career(){return window.WordPlayEngine?.career||{};}
function achievements(){const c=career(),catalog=window.WordPlayContent?.achievements||[];return Object.keys(c.achievements||{}).map(id=>{const a=catalog.find(x=>x.id===id)||{};return{id,title:a.name||id,description:a.desc||'',xpReward:25};});}
function metrics(s){const correct=Number(s?.words?.length||0),errors=Number(s?.invalidAttempts||0),attempts=correct+errors,accuracy=attempts?Math.round(correct/attempts*100):0,percentage=s?.mode==='quick'?Math.min(100,Math.round(correct/10*100)):Math.min(100,Math.round((Number(s?.round||1)-1+(s?.completed?1:0))/12*100));return{correct,errors,attempts,accuracy,grade:Math.round(accuracy)/10,score:Number(s?.totalScore||0),percentage,maxCombo:Number(s?.bestCombo||1),round:Number(s?.round||1),words:correct,longestWord:String(s?.longestWord||''),mode:String(s?.mode||'normal')};}
function participant(outcome='checkpoint'){const s=state()||{},m=metrics(s);return{role:'primary',outcome,score:m.score,correct:m.correct,errors:m.errors,attempts:m.attempts,accuracy:m.accuracy,grade:m.grade,percentage:m.percentage,maxCombo:m.maxCombo,achievements:achievements(),metrics:m,save:{version:1,gameId:GAME_ID,run:s,career:career()}};}
function matchId(){return`word_play_${safeId(profile&&(profile.studentId||profile.email))}`;}
function checkpoint(reason='autosave'){const s=state();if(!initialized||!s||s.completed)return;const signature=[s.mode,s.round,s.totalScore,s.playsLeft,s.words?.length,s.rngCounter].join('|');if(reason==='autosave'&&signature===lastSignature)return;lastSignature=signature;post('CHECKPOINT',{checkpointId:`word_play_checkpoint_${Date.now()}_${Math.random().toString(36).slice(2)}`,matchId:matchId(),reason,players:[participant('checkpoint')]});}
function result(){const s=state();if(!initialized||!s||!s.completed||lastCompleted)return;lastCompleted=true;post('RESULT',{resultId:`word_play_result_${Date.now()}_${Math.random().toString(36).slice(2)}`,matchId:matchId(),outcome:s.won?'win':'finished',players:[participant(s.won?'win':'finished')]});}
function restoreIncoming(save){try{const raw=save?.rawGameData?.save||save?.rawGameData||save?.save||save;const run=raw?.run||raw?.state||null;if(run&&run.version===3&&!run.completed&&window.WordPlayEngine){window.WordPlayEngine.state=run;window.WordPlayEngine.saveRun();return true;}}catch{}return false;}
function markStarted(){if(sessionStarted)return;const s=state();if(!s)return;sessionStarted=true;post('SESSION_STARTED',{mode:s.mode||'normal'});}
function poll(){const s=state();if(s){markStarted();if(s.completed)result();else checkpoint('autosave');}checkpointTimer=setTimeout(poll,12000);}
window.addEventListener('message',event=>{const msg=event.data||{};if(msg.namespace!==HOST_NS||msg.channel!==channel)return;if(msg.type==='INIT'){profile=msg.payload?.student||{};const restored=restoreIncoming(msg.payload?.save||null);initialized=true;post('INITIALIZED',{profileId:profile.studentId||profile.email||'',restored});post('READY',{gameId:GAME_ID,version:1});if(!checkpointTimer)poll();}if(msg.type==='REQUEST_CHECKPOINT')checkpoint('host_request');});
window.addEventListener('pagehide',()=>checkpoint('pagehide'));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')checkpoint('visibility_hidden');});
const readyTimer=setInterval(()=>{if(initialized){clearInterval(readyTimer);return;}post('READY',{gameId:GAME_ID,version:1});},900);
post('READY',{gameId:GAME_ID,version:1});
window.WordPlayBridge={checkpoint,result};
})();
