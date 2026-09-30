import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('apps-script/LenguArcade_Alumno.html','utf8');
const start=source.indexOf('async function persistGameCheckpoint('),listener=source.indexOf("window.addEventListener('message',event=>{",start),end=source.indexOf('\nconst openGameWithoutIntegration=',listener);
const nodes=new Map(),timers=[],requests=[],messages=[],closes=[];
const runner={game:{gameId:'test'},channel:'qa',initialized:false};
let rejectSave=false;
const box={activeGameRunner:runner,currentDashboard:{},GAME_BRIDGE_NAMESPACE:'lenguarcade-game',processedGameResults:new Set(),window:{addEventListener(type,fn){box.listener=fn}},
 $:id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',classList:{add(){},remove(){}}});return nodes.get(id)},
 getGameParticipantContext:()=>({sessionToken:'qa',isPrimary:true,role:'primary',game:{}}),buildEvaluableSnapshot:()=>({}),runnerSessionAlreadyCounted:()=>true,buildCentralProgress:()=>({}),markRunnerSessionCounted(){},applySavedGameRecordToDashboard(){},installGameBootstrapContext(){},createGameChannel:()=> 'qa',
 callServer:async(fn,[payload])=>{requests.push(payload);if(rejectSave)throw Error('offline');return {}},sendToActiveGame:(type,payload)=>messages.push({type,payload}),postToGameWindow:(...args)=>messages.push({type:args[2]}),buildGameInitPayload:()=>({}),pulseGameInitHandshake(){},stopGameInitHandshake(){},destroyGameRunner:()=>closes.push(true),setTimeout:fn=>{timers.push(fn);return 1},clearTimeout(){},Date,console};
vm.createContext(box);vm.runInContext(source.slice(start,end),box);
function cp(id){return {checkpointId:id,players:[{role:'primary',save:{id}}]}}
const first=box.persistGameCheckpoint(cp('first'));const queued=box.persistGameCheckpoint(cp('exit'));assert.equal(runner.checkpointQueue.length,1);await first;await queued;while(timers.length)timers.shift()();await new Promise(resolve=>setImmediate(resolve));
assert.deepEqual(requests.map(p=>p.checkpointId),['first','exit']);assert.deepEqual(messages.filter(m=>m.type==='CHECKPOINT_CONFIRMED').map(m=>m.payload.checkpointId),['first','exit']);
rejectSave=true;runner.closeRequested=true;runner.explicitExitRequested=true;await box.persistGameCheckpoint(cp('failed'));assert.equal(runner.failedCheckpoint.checkpointId,'failed');assert.equal(closes.length,0,'A failed save must not close the game');
rejectSave=false;await box.persistGameCheckpoint(runner.failedCheckpoint);assert.equal(runner.failedCheckpoint,null);while(timers.length)timers.shift()();assert.equal(closes.length,1);
const gameWindow={};runner.gameWindow=gameWindow;box.listener({source:gameWindow,data:{namespace:'lenguarcade-game',channel:'qa',gameId:'test',type:'INITIALIZED'}});const connected=nodes.get('gameRunnerStatus').textContent;box.listener({source:gameWindow,data:{namespace:'lenguarcade-game',channel:'qa',gameId:'test',type:'READY'}});assert.equal(nodes.get('gameRunnerStatus').textContent,connected,'Late READY must not regress connection state');
console.log('Runner: late READY, serialized checkpoints, failure/retry and confirmed exit OK.');
