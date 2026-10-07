import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createState,command,advance,publicState,RoomError} from '../supabase/functions/conjuga-online/engine.js';
import {normalizeSave,makePlayer,checkAnswer,bankSize} from '../supabase/functions/conjuga-online/rules.js';
const A='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
let now=100000,id=0;
const cmd=(s,actor,action,extra={})=>command(s,actor,action,{requestId:'req'+(++id),...extra},now);
function match(){
  const s=createState({id:A,name:'Alumno A',save:normalizeSave(null)},{rounds:5,timerSeconds:20},now);
  const save=normalizeSave(null);s.players.push({...makePlayer('Alumno B',1,save,'opponent'),profileId:B,baseSave:structuredClone(save),ready:false});s.lastSeen[B]=now;
  cmd(s,A,'ready');assert.equal(s.phase,'waiting');cmd(s,B,'ready');assert.equal(s.phase,'choose');return s;
}
assert.equal(bankSize,4288);
let s=match();assert.throws(()=>cmd(s,B,'reveal',{tier:'basic',bet:10}),/not_your_turn/);
assert.throws(()=>cmd(s,A,'reveal',{tier:'forged',bet:10}),/invalid_bet/);
assert.throws(()=>cmd(s,A,'reveal',{tier:'expert',bet:100000}),/invalid_bet/);
cmd(s,A,'reveal',{tier:'expert',bet:50});assert.equal(s.phase,'question');
const pub=publicState({id:'room',code:'ABCDEFGH',version:1,state:s},B,now);
assert.equal(pub.state.currentQuestion.respuesta,undefined);assert.equal(pub.state.players[0].save.lifetime,undefined);assert.equal(pub.state.players[0].baseSave,undefined);assert.equal(pub.state.used,undefined);
assert.throws(()=>publicState({state:s},'stranger'),/not_a_member/);
const before=s.players[0].chips;cmd(s,A,'insurance');cmd(s,A,'hint');assert.equal(s.players[0].chips,before-5);
const solution=s.currentQuestion.respuesta;
command(s,A,'answer',{requestId:'unique',answer:solution},now);const after=structuredClone(s);
command(s,A,'answer',{requestId:'unique',answer:solution},now);assert.deepEqual(s,after);assert.equal(s.result.ok,true);assert.equal(s.players[0].correct,1);
assert.equal(s.result.delta,Math.round(50*2.1*.75));
now+=2801;advance(s,now);assert.equal(s.currentPlayer,1);assert.equal(s.phase,'choose');
cmd(s,B,'reveal',{tier:'basic',bet:100});cmd(s,B,'insurance');cmd(s,B,'answer',{answer:'respuesta falsa'});
assert.equal(s.result.delta,-50);assert.equal(s.players[1].chips,50);
now+=2801;advance(s,now);cmd(s,A,'reveal',{tier:'basic',bet:10});
now=s.deadline;advance(s,now);assert.equal(s.result.kind,'timeout');assert.equal(s.players[0].errors,1);
// Tilde errors stay errors; canonical alternatives remain accepted.
assert.equal(checkAnswer({respuesta:'yo canté',persona:'1ª singular',modo:'indicativo',verbo:'cantar',tiempo:'pretérito perfecto simple'},'cante').kind,'accent');
assert.equal(checkAnswer({respuesta:'yo canté',persona:'1ª singular',modo:'indicativo',verbo:'cantar',tiempo:'pretérito perfecto simple'},'canté').ok,true);
assert.equal(checkAnswer({respuesta:'frito',persona:'—',modo:'forma no personal',verbo:'freír',tiempo:'participio'},'freído').ok,true);
s=match();cmd(s,A,'reveal',{tier:'basic',bet:100});cmd(s,A,'answer',{answer:'mal'});assert.equal(s.players[0].chips,40);assert.equal(s.players[0].rescues,1);
now+=2801;advance(s,now);cmd(s,B,'reveal',{tier:'basic',bet:10});cmd(s,B,'answer',{answer:s.currentQuestion.respuesta});now+=2801;advance(s,now);
cmd(s,A,'reveal',{tier:'basic',bet:40});cmd(s,A,'answer',{answer:'mal'});now+=2801;advance(s,now);assert.equal(s.phase,'finished');assert.equal(s.reason,'bankrupt');
s=match();now+=91000;s.lastSeen[A]=now;advance(s,now);assert.equal(s.reason,'disconnected');assert.equal(s.players[0].save.lifetime.games,0);
s=match();for(let t=0;t<10;t++){
  const actor=s.players[s.currentPlayer].profileId;s.lastSeen[A]=s.lastSeen[B]=now;
  cmd(s,actor,'reveal',{tier:'basic',bet:10});cmd(s,actor,'answer',{answer:s.currentQuestion.respuesta});now+=2801;advance(s,now);
}
assert.equal(s.phase,'finished');assert.equal(s.reason,'complete');assert.equal(s.players[0].correct,5);assert.equal(s.players[1].correct,5);assert.equal(s.players[0].save.lifetime.games,1);
const frozen=structuredClone(s);advance(s,now+100000);assert.deepEqual(s,frozen);
for(const file of ['games/conjuga_apuesta/online.js','supabase/functions/conjuga-online/engine.js','supabase/functions/conjuga-online/rules.js'])assert.ok(fs.readFileSync(file,'utf8').length>500);
new Function(fs.readFileSync('games/conjuga_apuesta/online.js','utf8'));
const host=fs.readFileSync('apps-script/LenguArcade_Alumno.html','utf8');assert.ok(host.includes("callSupabaseFunction('conjuga-online',payload,token)"));
const sql=fs.readFileSync(fs.readdirSync('supabase/migrations').filter(n=>n.endsWith('_conjuga_apuesta_online.sql')).map(n=>'supabase/migrations/'+n)[0],'utf8');assert.ok(sql.includes('security invoker'));assert.ok(sql.includes('from public,anon,authenticated'));
console.log('Duelo online: turnos, apuestas, acierto, tildes, seguro, pista, timeout, rescate, duplicados, desconexión, final y privacidad correctos.');
await import('./check-conjuga-online-access.mjs');
