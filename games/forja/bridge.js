/* Protocolo común READY / INIT / CHECKPOINT / RESULT / CLOSE_READY. */
(() => {
'use strict';
const p=new URLSearchParams(location.search),channel=p.get('channel')||'',embedded=(p.get('lenguarcade')||p.get('la'))==='1';
let initialized=!embedded,signature='',pending=null,exitId='',exitTimer=null,lastResult='',profile={},hostWindow=null;
function post(type,payload={}){if(!embedded||!channel)return;const message={namespace:'lenguarcade-game',gameId:'lexoma',channel,type,payload};if(hostWindow){hostWindow.postMessage(message,'*');return;}let target=window;for(let i=0;i<5;i++){try{if(target.parent===target)break;target=target.parent;target.postMessage(message,'*');}catch{break;}}}
function participant(outcome){const E=window.LexomaEngine,m=E.metrics();return{role:'primary',outcome,...m,grade:m.accuracy/10,metrics:m,achievements:E.achievements,save:E.snapshot()};}
function matchId(){return window.LexomaEngine.run?.id||'lexoma_'+String(profile.studentId||profile.email||'guest');}
function checkpoint(reason='autosave'){
 if(!initialized||!window.LexomaEngine.run)return'';
 const raw=window.LexomaEngine.snapshot();delete raw.run.updatedAt;const sig=JSON.stringify(raw);
 if(reason==='autosave'&&(sig===signature||(pending&&Date.now()-pending.at<20000)))return'';
 const id='lexoma_checkpoint_'+Date.now()+'_'+Math.random().toString(36).slice(2);pending={id,sig,at:Date.now()};
 post('CHECKPOINT',{checkpointId:id,matchId:matchId(),reason,players:[participant('checkpoint')]});return id;
}
function result(){const r=window.LexomaEngine.run;if(!initialized||!r?.finished||lastResult===r.id)return;lastResult=r.id;post('RESULT',{resultId:r.resultId,matchId:matchId(),outcome:r.status==='victory'?'victory':'defeat',players:[participant(r.status==='victory'?'victory':'defeat')]});}
function closeReady(saved){if(!exitId)return;clearTimeout(exitTimer);post('CLOSE_READY',{saved,localFallback:!saved,checkpointId:exitId});exitId='';}
function saveAndExit(){window.LexomaEngine.save();if(!embedded)return;if(exitId)return;exitId=checkpoint('exit');if(!exitId){post('CLOSE_READY',{saved:true});return;}exitTimer=setTimeout(()=>closeReady(false),3500);}
function initialize(payload){if(initialized){post('INITIALIZED',{});return;}profile=payload.student||{};window.LexomaEngine.setProfile(profile);const save=payload.save;const raw=save?.rawGameData?.save||save?.rawGameData||save?.save||save;let restored=false;
 if(raw?.gameId==='lexoma'&&(!window.LexomaEngine.run||Number(raw.run?.updatedAt||0)>=Number(window.LexomaEngine.run.updatedAt||0)))restored=window.LexomaEngine.restore(raw);
 initialized=true;post('INITIALIZED',{restored,profileId:profile.studentId||profile.email||''});window.dispatchEvent(new Event('lexoma:change'));}
window.addEventListener('message',e=>{const m=e.data||{};if(m.namespace!=='lenguarcade-host'||m.channel!==channel)return;if(hostWindow&&e.source!==hostWindow)return;
 if(m.type==='INIT'){hostWindow=e.source;initialize(m.payload||{});}
 if(m.type==='REQUEST_CHECKPOINT')checkpoint('host_request');
 if(m.type==='REQUEST_EXIT')saveAndExit();
 if(m.type==='CHECKPOINT_CONFIRMED'){if(pending?.id===m.payload?.checkpointId){signature=pending.sig;pending=null;}if(exitId===m.payload?.checkpointId)closeReady(true);}
 if(m.type==='CHECKPOINT_FAILED'){pending=null;signature='';if(exitId===m.payload?.checkpointId)closeReady(false);}
 if(m.type==='SAVE_FAILED')lastResult='';
});
try{const b=JSON.parse(window.name||'null');if(embedded&&b?.namespace==='lenguarcade-bootstrap'&&b.channel===channel&&b.gameId==='lexoma'){window.name='';initialize(b.payload||{});}}catch{}
window.addEventListener('pagehide',()=>checkpoint('pagehide'));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')checkpoint('visibility_hidden');});
setInterval(()=>{if(embedded&&!initialized)post('READY',{version:1});else if(embedded){checkpoint();result();}},12000);
if(embedded){post('READY',{version:1});const t=setInterval(()=>{if(initialized){clearInterval(t);return;}post('READY',{version:1});},900);}
window.LexomaBridge={checkpoint,result,saveAndExit,start(){lastResult='';post('SESSION_STARTED',{mode:'adventure'});},get initialized(){return initialized;},get embedded(){return embedded;}};
})();
