import assert from 'node:assert/strict';
import {createState,makePlayer,command,advance,publicState} from '../supabase/functions/lexitrama-online/engine.js';
const C=globalThis.LexitramaContent;
export const A='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
export function route(board,word){
 const chars=[...word.toUpperCase()];
 function walk(i,k,path){if(board[i]!==chars[k]||path.includes(i))return null;path=[...path,i];if(k===chars.length-1)return path;for(let j=0;j<board.length;j++)if((Math.abs(Math.floor(i/7)-Math.floor(j/7))+Math.abs(i%7-j%7))===1){const r=walk(j,k+1,path);if(r)return r;}return null;}
 for(let i=0;i<board.length;i++){const r=walk(i,0,[]);if(r)return r;}return null;
}
export function solutions(s){const m=C.missions.find(m=>m.id===s.mission);return C.words.filter(w=>m.test(w)&&w.word.length>=3&&w.word.length<=7).map(w=>({word:w.word,path:route(s.board,w.word)})).filter(w=>w.path);}
export function pair(now=100000,mission='sustantivo'){
 const s=createState({id:A,name:'Ana'},{mission},now);s.players.push(makePlayer({id:B,name:'Bruno'}));s.lastSeen[B]=now;return s;
}
let n=0;const cmd=(s,actor,action,body={},now=100000)=>command(s,actor,action,{requestId:'test'+(++n),...body},now);
for(const m of C.missions){const eligible=C.words.filter(w=>m.test(w)&&w.word.length>=3&&w.word.length<=7);if(eligible.length<6)continue;for(let seed=0;seed<3;seed++){const s=pair(100000,m.id);assert.ok(solutions(s).length>=6,m.id);}}
let s=pair();assert.throws(()=>cmd(s,'other','ready'),/not_a_member/);cmd(s,A,'ready');assert.equal(s.phase,'waiting');cmd(s,B,'ready');assert.equal(s.phase,'playing');
assert.equal(s.deadline,280000);assert.throws(()=>cmd(s,A,'submit',{path:[0,8]}),/invalid_path/);assert.throws(()=>cmd(s,A,'submit',{path:[6,7]}),/invalid_path/);const paths=solutions(s);assert.throws(()=>cmd(s,A,'submit',{path:[0,48]}),/invalid_path/);assert.throws(()=>cmd(s,A,'submit',{path:[0,0]}),/invalid_path/);
const payload={path:paths[0].path,requestId:'same-request'};command(s,A,'submit',payload,100010);command(s,A,'submit',payload,100010);assert.equal(s.found.length,1);
assert.equal(cmd(s,B,'submit',{path:paths[0].path}).code,'already_found');assert.equal(s.players[1].errors,0);
for(let i=1;i<4;i++)cmd(s,A,'submit',{path:paths[i].path});
assert.equal(cmd(s,A,'submit',{path:paths[4].path}).code,'partner_needed');assert.equal(s.found.length,4);
for(let i=4;i<6;i++)cmd(s,B,'submit',{path:paths[i].path});assert.equal(s.phase,'finished');assert.equal(s.won,true);assert.equal(s.players[0].correct,4);assert.equal(s.players[1].correct,2);
assert.ok(s.found.every(f=>f.player===0||f.player===1));
const pub=publicState({id:'room',code:'ABC23456',version:10,state:s},A);assert.equal(pub.state.requests,undefined);assert.equal(pub.state.lastSeen,undefined);assert.equal(pub.state.players[1].profileId,undefined);
const frozen=structuredClone(s);advance(s,99999999);assert.deepEqual(s,frozen);
s=pair();cmd(s,A,'ready');cmd(s,B,'ready');s.lastSeen[A]=s.lastSeen[B]=280001;advance(s,280001);assert.equal(s.reason,'timeout');
s=pair();cmd(s,A,'ready');cmd(s,B,'ready');s.lastSeen[A]=191001;advance(s,191001);assert.equal(s.reason,'disconnected');
s=pair();cmd(s,A,'leave');assert.equal(s.reason,'abandoned');
console.log('Lexitrama coop: banco canónico, seis soluciones por contenido, rutas, duplicados, aportación 4+2, privacidad, tiempo, desconexión y cierre correctos.');

await import('./check-lexitrama-online-access.mjs');
