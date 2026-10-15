// One pedagogical bank for local play and server validation.
import '../../../games/lexitrama/content.js';
const C=globalThis.LexitramaContent;
export class RoomError extends Error {constructor(code,status=409){super(code);this.status=status;}}
const fail=(code,status)=>{throw new RoomError(code,status);};
export const makePlayer=p=>({profileId:p.id,name:p.name,profileRole:p.profileRole||'student',ready:false,correct:0,errors:0,score:0,longest:0});
export function createState(player,options={},now=Date.now()){
 const mission=C.missions.find(m=>m.id===options.mission)||C.missions[0];
 const pool=C.words.filter(w=>mission.test(w)&&w.word.length>=3&&w.word.length<=7);
 if(pool.length<6)fail('content_unavailable',400);
 // Six disjoint paths guarantee a solvable static grid, without revealing targets.
 const selected=[...pool];for(let i=selected.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[selected[i],selected[j]]=[selected[j],selected[i]];}
 const size=7,alphabet='AAAAEEEEIIIOOOUUNRRSSLLTDCMPBÑ';
 const board=Array.from({length:size**2},()=>alphabet[Math.floor(Math.random()*alphabet.length)]);
 let snake=board.map((_,i)=>Math.floor(i/size)*size+(Math.floor(i/size)%2?size-1-i%size:i%size));
 const rotate=Math.floor(Math.random()*4),mirror=Math.random()<.5;
 snake=snake.map(i=>{let r=Math.floor(i/size),c=i%size;if(mirror)c=size-1-c;for(let n=0;n<rotate;n++)[r,c]=[c,size-1-r];return r*size+c;});
 let cursor=0;for(const w of selected.slice(0,6)){for(const letter of w.word.toUpperCase())board[snake[cursor++]]=letter;}
 return {phase:'waiting',mission:mission.id,title:mission.title,explain:mission.explain,size,board,goal:6,minEach:2,duration:Number(options.duration)===300?300:180,found:[],players:[makePlayer(player)],lastSeen:{[player.id]:now},requests:[],createdAt:now};
}
export function advance(s,now=Date.now()){
 if(s.phase==='finished')return false;
 if(s.players.some(p=>now-(s.lastSeen[p.profileId]||s.createdAt)>90000)){s.phase='finished';s.reason='disconnected';s.won=false;return true;}
 if(s.phase==='playing'&&now>=s.deadline){s.phase='finished';s.reason='timeout';s.won=false;return true;}
 return false;
}
export function command(s,actor,action,body={},now=Date.now()){
 const index=s.players.findIndex(p=>p.profileId===actor);if(index<0)fail('not_a_member',403);
 const id=String(body.requestId||'');if(!id||id.length>80)fail('invalid_request',400);
 if(s.requests.includes(id))return;
 s.lastSeen[actor]=now;advance(s,now);
 const p=s.players[index];let response={};
 if(action==='leave'){if(s.phase!=='finished'){s.phase='finished';s.reason='abandoned';s.won=false;}}
 else if(s.phase==='finished')return {ended:true};
 else if(action==='ready'){
  if(s.phase!=='waiting')fail('wrong_phase');p.ready=true;
  if(s.players.length===2&&s.players.every(p=>p.ready)){s.phase='playing';s.startedAt=now;s.deadline=now+s.duration*1000;}
 }else if(action==='submit'){
  if(s.phase!=='playing')fail('wrong_phase');
  const path=body.path;
  if(!Array.isArray(path)||path.length<2||path.length>49||new Set(path).size!==path.length||path.some((n,k)=>!Number.isInteger(n)||n<0||n>=49||(k&&Math.max(Math.abs(Math.floor(n/7)-Math.floor(path[k-1]/7)),Math.abs(n%7-path[k-1]%7))!==1)))fail('invalid_path',400);
  const word=path.map(i=>s.board[i]).join('').toLowerCase(),w=C.byWord.get(word),mission=C.missions.find(m=>m.id===s.mission);
  if(s.found.some(f=>f.word===word)){response={ok:false,code:'already_found'};}
  else if(!w||!mission.test(w)){p.errors++;response={ok:false,code:w?'wrong_content':'unknown_word'};}
  else if(p.correct>=s.goal-s.minEach){response={ok:false,code:'partner_needed'};}
  else{
   p.correct++;p.longest=Math.max(p.longest,word.length);const points=word.length**2*4+w.difficulty*12+70;p.score+=points;
   s.found.push({word,path:[...path],player:index,points});response={ok:true,word,points};
   if(s.found.length>=s.goal&&s.players.every(p=>p.correct>=s.minEach)){s.phase='finished';s.reason='complete';s.won=true;}
  }
 }else fail('unknown_action',400);
 s.requests=[...s.requests.slice(-95),id];return response;
}
export function publicState(room,actor,now=Date.now()){
 const index=room.state.players.findIndex(p=>p.profileId===actor);if(index<0)fail('not_a_member',403);
 const s=room.state;
 return {id:room.id,code:room.code,version:room.version,ownIndex:index,serverNow:now,state:{...s,requests:undefined,lastSeen:undefined,players:s.players.map(p=>({...p,profileId:undefined})),peerRecent:s.players.map(p=>now-(s.lastSeen[p.profileId]||s.createdAt)<15000)}};
}
