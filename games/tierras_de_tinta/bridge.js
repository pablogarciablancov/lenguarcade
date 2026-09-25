(function(){
"use strict";
var GAME_ID="tierras_de_tinta",GAME_NS="lenguarcade-game",HOST_NS="lenguarcade-host";
var params=Object.fromEntries(new URLSearchParams(location.search||"").entries());
var embedded=String(params.lenguarcade||params.la||"")==="1";
var channel=String(params.channel||"");
var initialized=false,profile=null,lastSignature="",timer=null,exitRequested=false,exitCheckpointId="",exitTimer=null;
if(!embedded||!channel)return;
window.__LENGUARCADE_EMBEDDED=true;
function postToAncestors(message){var target=window;for(var depth=0;depth<5;depth+=1){try{if(!target.parent||target.parent===target)break;target=target.parent;target.postMessage(message,"*");}catch(err){break;}}}
function post(type,payload){postToAncestors({namespace:GAME_NS,channel:channel,gameId:GAME_ID,type:type,payload:payload||{}});}
function api(){return window.TierrasDeTinta||null;}
function metrics(){return api()&&api().metrics?api().metrics():{attempts:0,correct:0,errors:0,accuracy:0,percentage:0,level:1,xp:0};}
function participant(outcome){var m=metrics();return{role:"primary",outcome:outcome||"checkpoint",score:Number(m.xp||0)+Number(m.victories||0)*150+Number(m.bossesDefeated||0)*250,correct:Number(m.correct||0),errors:Number(m.errors||0),attempts:Number(m.attempts||0),accuracy:Number(m.accuracy||0),grade:Math.round(Number(m.accuracy||0))/10,percentage:Number(m.percentage||0),metrics:m,save:{version:1,gameId:GAME_ID,run:api()&&api().getState?api().getState():null}};}
function safeId(v){return String(v||"player").toLowerCase().replace(/[^a-z0-9_-]+/g,"_").slice(0,48)||"player";}
function matchId(){return"tierras_de_tinta_"+safeId(profile&&(profile.studentId||profile.email||profile.name));}
function checkpoint(reason){
  if(!initialized)return"";
  if(api()&&api().forceSave)api().forceSave(reason||"autosave");
  var m=metrics(),sig=[m.level,m.xp,m.victories,m.bossesDefeated,m.attempts,m.correct,m.mastery].join("|");
  if((reason||"autosave")==="autosave"&&sig===lastSignature)return"";
  lastSignature=sig;
  var id="tierras_checkpoint_"+Date.now()+"_"+Math.random().toString(36).slice(2);
  post("CHECKPOINT",{checkpointId:id,matchId:matchId(),reason:reason||"autosave",players:[participant("checkpoint")]});
  return id;
}
function finishExit(saved){if(!exitRequested)return;if(exitTimer){clearTimeout(exitTimer);exitTimer=null;}post("CLOSE_READY",{saved:saved!==false,checkpointId:exitCheckpointId,localFallback:saved===false});exitRequested=false;exitCheckpointId="";}
function saveAndExit(){if(exitRequested)return;exitRequested=true;exitCheckpointId=checkpoint("exit");if(!exitCheckpointId){finishExit(true);return;}exitTimer=setTimeout(function(){finishExit(false);},2500);}
function restore(save){try{var raw=save&&save.rawGameData&&save.rawGameData.save?save.rawGameData.save:(save&&save.rawGameData?save.rawGameData:(save&&save.save?save.save:save));return !!(api()&&api().restore&&api().restore(raw));}catch(err){return false;}}
window.addEventListener("message",function(event){
  var msg=event.data||{};if(msg.namespace!==HOST_NS||msg.channel!==channel)return;
  if(msg.type==="INIT"){profile=msg.payload&&msg.payload.student||{};var restored=restore(msg.payload&&msg.payload.save||null);initialized=true;post("INITIALIZED",{profileId:profile.studentId||profile.email||"",restored:restored});post("READY",{gameId:GAME_ID,version:1});if(!timer)timer=setInterval(function(){checkpoint("autosave");},15000);}
  if(msg.type==="REQUEST_CHECKPOINT")checkpoint("host_request");
  if(msg.type==="REQUEST_EXIT")saveAndExit();
  if(msg.type==="CHECKPOINT_CONFIRMED"&&exitRequested&&(!exitCheckpointId||msg.payload&&msg.payload.checkpointId===exitCheckpointId))finishExit(true);
  if(msg.type==="CHECKPOINT_FAILED"&&exitRequested&&(!exitCheckpointId||msg.payload&&msg.payload.checkpointId===exitCheckpointId))finishExit(false);
});
window.addEventListener("pagehide",function(){if(!exitRequested)checkpoint("pagehide");});
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden"&&!exitRequested)checkpoint("visibility_hidden");});
var readyTimer=setInterval(function(){if(initialized){clearInterval(readyTimer);return;}post("READY",{gameId:GAME_ID,version:1});},900);
post("READY",{gameId:GAME_ID,version:1});
})();
