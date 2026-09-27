(function(){
"use strict";
var GAME_ID="tierras_de_tinta";
var GAME_NS="lenguarcade-game";
var HOST_NS="lenguarcade-host";
var SOURCE_URL="https://tierras-de-la-tinta.pgarciab.chatgpt.site";
var params=Object.fromEntries(new URLSearchParams(location.search||"").entries());
var embedded=String(params.lenguarcade||params.la||"")==="1";
var channel=String(params.channel||"");
var initialized=false;
var frameLoaded=false;
var sessionStarted=false;
var readyTimer=null;
var frame=document.getElementById("gameFrame");
var loading=document.getElementById("loading");

function postToAncestors(message){
  var target=window;
  for(var depth=0;depth<5;depth+=1){
    try{
      if(!target.parent||target.parent===target)break;
      target=target.parent;
      target.postMessage(message,"*");
    }catch(error){break;}
  }
}
function post(type,payload){
  if(!embedded||!channel)return;
  postToAncestors({namespace:GAME_NS,channel:channel,gameId:GAME_ID,type:type,payload:payload||{}});
}
function ready(){post("READY",{gameId:GAME_ID,version:"site-source-30-proxy",sourceUrl:SOURCE_URL});}
function maybeStartSession(){
  if(!initialized||!frameLoaded||sessionStarted)return;
  sessionStarted=true;
  post("SESSION_STARTED",{mode:"site_source_30",proxy:true,sourceUrl:SOURCE_URL});
}
if(frame){
  frame.addEventListener("load",function(){
    frameLoaded=true;
    if(loading)loading.classList.add("hidden");
    maybeStartSession();
  });
}
if(!embedded||!channel){
  if(loading)setTimeout(function(){loading.classList.add("hidden");},1200);
  return;
}
window.__LENGUARCADE_EMBEDDED=true;
window.addEventListener("message",function(event){
  var msg=event.data||{};
  if(msg.namespace!==HOST_NS||msg.channel!==channel)return;
  if(msg.type==="INIT"){
    initialized=true;
    post("INITIALIZED",{
      restored:false,
      proxy:true,
      sourceVersion:30,
      sourceUrl:SOURCE_URL,
      saveMode:"site_local_storage"
    });
    maybeStartSession();
  }
  if(msg.type==="REQUEST_EXIT"){
    post("CLOSE_READY",{
      saved:false,
      localFallback:true,
      proxy:true,
      sourceVersion:30,
      reason:"El Site avanzado mantiene su propio guardado local; el adaptador no puede forzar un checkpoint central."
    });
  }
});
window.addEventListener("pagehide",function(){
  if(sessionStarted)post("PROXY_HIDDEN",{sourceVersion:30});
});
readyTimer=setInterval(function(){
  if(initialized){clearInterval(readyTimer);readyTimer=null;return;}
  ready();
},900);
ready();
})();