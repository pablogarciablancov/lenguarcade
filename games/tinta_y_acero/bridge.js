/* Isolated runner adapter: one in-flight write; completion requires host ACK. */
(()=>{'use strict';const p=new URLSearchParams(location.search),channel=p.get('channel')||'',embedded=p.get('la')==='1'||p.get('lenguarcade')==='1';if(!embedded||!channel)return;
let ready=false,inflight=null,queue=[],exitId='',timer;const sent=new Set();
function post(type,payload={}){let target=window;for(let i=0;i<5;i++){if(target.parent===target)break;target=target.parent;target.postMessage({namespace:'lenguarcade-game',gameId:'tinta_y_acero',channel,type,payload},'*');}}
function ancestor(s){let t=window;for(let i=0;i<5;i++){if(t.parent===t)break;t=t.parent;if(t===s)return true;}return false;}
function participant(result){const E=window.TintaGame,r=E.run,stats=result?.stats||r?.stats||{},correct=stats.correct||0,errors=stats.errors||0,metrics={correct,errors,attempts:correct+errors,accuracy:correct+errors?Math.round(correct/(correct+errors)*100):0,battles:stats.battles||0,uniqueWords:(result?.words||[...new Set(r?.words||[])]).length,mode:result?.mode||r?.mode||'menu',completed:!!result,won:!!result?.won,score:(stats.battles||0)*100,activeSeconds:stats.time||0};return {role:'primary',outcome:result?(result.won?'win':'finished'):'checkpoint',...metrics,metrics,achievements:[],save:E.snapshot()};}
function pump(){if(!ready||inflight||!queue.length)return;inflight=queue.shift();post(inflight.type,inflight.payload);window.TintaUI.status('Guardando en LenguArcade…');}
function add(event){if(event.type==='CHECKPOINT'&&queue.at(-1)?.type==='CHECKPOINT'&&queue.at(-1).payload.reason!=='exit')queue.pop();queue.push(event);pump();}
function checkpoint(reason='progress'){if(!ready)return '';const checkpointId='tinta_cp_'+crypto.randomUUID();add({type:'CHECKPOINT',payload:{checkpointId,matchId:TintaGame.run?.id||'tinta_profile',reason,players:[participant()]}});return checkpointId;}
function results(){if(!ready)return;for(const r of TintaGame.profile.outbox){if(sent.has(r.id))continue;sent.add(r.id);add({type:'RESULT',payload:{resultId:r.id,matchId:r.runId,outcome:r.won?'win':'finished',players:[participant(r)]}});}}
function ack(m){if(!inflight)return;const id=m.payload?.resultId||m.payload?.checkpointId,current=inflight.payload.resultId||inflight.payload.checkpointId;if(id!==current)return;if(inflight.type==='RESULT'){TintaGame.profile.outbox=TintaGame.profile.outbox.filter(r=>r.id!==id);TintaUI.persist();}inflight=null;TintaUI.status('Guardado confirmado por LenguArcade');if(id===exitId){exitId='';post('CLOSE_READY',{saved:true,checkpointId:id});}pump();}
window.addEventListener('message',event=>{const m=event.data;if(!ancestor(event.source)||m?.namespace!=='lenguarcade-host'||m.channel!==channel)return;
if(m.type==='INIT'&&!ready&&window.TintaUI){TintaUI.initialize(m.payload?.student||{},m.payload?.save);ready=true;post('INITIALIZED',{restored:!!m.payload?.save});results();}
if(m.type==='REQUEST_CHECKPOINT')checkpoint('host_request');
if(m.type==='REQUEST_EXIT'&&ready&&!exitId){TintaUI.persist();results();exitId=checkpoint('exit');post('REQUEST_EXIT');}
if(['SAVE_CONFIRMED','CHECKPOINT_CONFIRMED'].includes(m.type))ack(m);
if(['SAVE_FAILED','CHECKPOINT_FAILED'].includes(m.type)){TintaUI.status('Guardado central pendiente · se reintentará');}
});
window.addEventListener('tinta:change',()=>{if(!ready)return;clearTimeout(timer);timer=setTimeout(()=>checkpoint(),700);});window.addEventListener('tinta:start',()=>{post('SESSION_STARTED',{mode:TintaGame.run?.mode});checkpoint('start');});window.addEventListener('tinta:finish',results);
function announce(){if(!window.TintaUI)return;let b;try{b=JSON.parse(window.name||'null');}catch{}if(!ready&&b?.namespace==='lenguarcade-bootstrap'&&b.channel===channel&&b.gameId==='tinta_y_acero'){TintaUI.initialize(b.payload?.student||{},b.payload?.save);ready=true;window.name='';post('INITIALIZED',{restored:!!b.payload?.save});results();}if(!ready)post('READY',{version:1});}
window.addEventListener('tinta:ready',announce);setInterval(announce,1200);setInterval(()=>{if(inflight)post(inflight.type,inflight.payload);},15000);
})();
