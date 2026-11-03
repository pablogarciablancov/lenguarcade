// Protocolo del runner existente. Un solo guardado en vuelo y resultados idempotentes.
export class Bridge{
 constructor(game){this.game=game;const p=new URLSearchParams(location.search);this.embedded=p.get('lenguarcade')==='1'||p.get('la')==='1';this.channel=p.get('channel')||'';this.queue=[];this.inFlight=null;this.initialized=false;this.target=null;this.origin='*';this.exiting=false;this.exitId='';
 window.addEventListener('message',e=>this.receive(e));
 if(this.embedded){let b;try{b=JSON.parse(window.name||'null');}catch{}if(b?.namespace==='lenguarcade-bootstrap'&&b.channel===this.channel&&b.gameId==='ultimo_salto'){window.name='';this.initialize(b.payload||{});}
 this.readyTimer=setInterval(()=>{if(!this.initialized)this.post('READY',{version:1});},1500);this.post('READY',{version:1});
 }else{game.initialize({},null,false);this.initialized=true;}
 this.retryTimer=setInterval(()=>{if(this.inFlight&&Date.now()-this.inFlight.sent>15000)this.send();},5000);
 }
 ancestor(source){let w=window;for(let i=0;i<5;i++){if(w.parent===w)break;w=w.parent;if(source===w)return true;}return false;}
 post(type,payload={}){if(!this.embedded||!this.channel)return;const m={namespace:'lenguarcade-game',channel:this.channel,gameId:'ultimo_salto',type,payload};if(this.target){this.target.postMessage(m,this.origin);return;}let w=window;for(let i=0;i<5;i++){if(w.parent===w)break;w=w.parent;w.postMessage(m,'*');}}
 initialize(payload){if(this.initialized)return;this.game.initialize(payload.student||{},payload.save||null,true);this.initialized=true;clearInterval(this.readyTimer);this.post('INITIALIZED',{profileId:payload.student?.studentId||'',restored:!!payload.save});this.game.status('Perfil conectado');if(this.game.run?.done)this.result();}
 receive(e){const m=e.data;if(!this.embedded||!this.ancestor(e.source)||m?.namespace!=='lenguarcade-host'||m.channel!==this.channel)return;if(m.gameId&&m.gameId!=='ultimo_salto')return;this.target=e.source;this.origin=e.origin==='null'?'*':e.origin;
 if(m.type==='INIT')this.initialize(m.payload||{});if(!this.initialized)return;
 if(m.type==='REQUEST_CHECKPOINT')this.checkpoint('host_request');if(m.type==='REQUEST_EXIT')this.exit();
 const type=m.type==='SAVE_CONFIRMED'?'RESULT':m.type==='CHECKPOINT_CONFIRMED'?'CHECKPOINT':null;
 if(type&&this.inFlight?.type===type){const id=type==='RESULT'?m.payload?.resultId:m.payload?.checkpointId;if(id!==this.inFlight.id)return;this.inFlight=null;this.game.status('Guardado en LenguArcade');if(id===this.exitId)this.post('CLOSE_READY',{saved:true,checkpointId:id});this.pump();}
 if(m.type==='SAVE_FAILED'||m.type==='CHECKPOINT_FAILED')this.game.status('Guardado local · pulsa para reintentar');
 }
 player(result=false){const r=this.game.run,m={correct:r?.correct||0,errors:r?.errors||0,attempts:(r?.correct||0)+(r?.errors||0),accuracy:0,percentage:Object.keys(this.game.profile.stars).length/20*100,mode:'aventura',level:r?.level||0,completed:!!r?.won,time:Math.round(r?.elapsed||0),hints:r?.hints||0,stars:r?.award?.stars||0};m.accuracy=m.attempts?Math.round(m.correct/m.attempts*100):0;return {role:'primary',outcome:result?(r?.won?'victory':'finished'):'checkpoint',score:result?(r?.award?.xp||0):0,correct:result?m.correct:0,errors:result?m.errors:0,attempts:result?m.attempts:0,accuracy:m.accuracy,grade:m.accuracy/10,percentage:m.percentage,metrics:m,achievements:this.game.profile.achievements.map(id=>({id:'ultimo_salto_'+id,title:id,xpReward:0})),save:this.game.snapshot()};}
 enqueue(type,payload){if(!this.embedded||!this.initialized)return '';const id=type==='RESULT'?payload.resultId:payload.checkpointId;if(this.inFlight?.id===id||this.queue.some(e=>e.id===id))return id;
 if(type==='CHECKPOINT'&&payload.reason!=='exit'&&this.queue.at(-1)?.type==='CHECKPOINT'&&this.queue.at(-1).payload.reason!=='exit')this.queue.pop();this.queue.push({type,payload,id});this.pump();return id;}
 pump(){if(this.inFlight||!this.queue.length)return;this.inFlight=this.queue.shift();this.send();}
 send(){if(!this.inFlight)return;this.inFlight.sent=Date.now();this.post(this.inFlight.type,this.inFlight.payload);this.game.status('Sincronizando…');}
 checkpoint(reason='boundary'){if(!this.initialized)return '';this.game.persist();return this.enqueue('CHECKPOINT',{checkpointId:'ultimo_salto_cp_'+crypto.randomUUID(),matchId:this.game.run?.id||'ultimo_salto_profile',reason,players:[this.player()]});}
 result(){const r=this.game.run;if(!r?.done)return;this.enqueue('RESULT',{resultId:'ultimo_salto_result_'+r.id,matchId:r.id,outcome:r.won?'victory':'finished',players:[this.player(true)]});}
 session(){this.post('SESSION_STARTED',{mode:'aventura'});}
 exit(){if(this.exiting){this.send();return;}if(!this.embedded){this.game.home();return;}if(!this.initialized)return;this.exiting=true;this.game.freeze();this.exitId=this.checkpoint('exit');this.game.status('Guardando antes de salir…');}
 retry(){this.send();}
 dispose(){clearInterval(this.retryTimer);clearInterval(this.readyTimer);}
}
