import {TIERS,IRREGULAR,checkAnswer,hintFor,makePlayer,rules} from './rules.js';

export class RoomError extends Error {
  constructor(code,status=409){super(code);this.status=status;}
}
const fail=(code,status)=>{throw new RoomError(code,status);};
export function createState(player,options={},now=Date.now()){
  return {phase:'waiting',rounds:[5,8,10].includes(Number(options.rounds))?Number(options.rounds):8,
    timerSeconds:[20,30,45].includes(Number(options.timerSeconds))?Number(options.timerSeconds):30,
    bankMode:options.bankMode==='course'?'course':'complete',turnNo:0,currentPlayer:0,
    selectedTier:'basic',selectedBet:10,currentQuestion:null,questionOpen:false,
    used:[],usedAnswers:[],recentVerbs:[],insuranceActive:false,hintUsed:false,
    players:[{...makePlayer(player.name,0,player.save,'primary'),profileId:player.id,profileRole:player.profileRole||'student',baseSave:structuredClone(player.save),ready:false}],
    newUnlocks:[],lastSeen:{[player.id]:now},requests:[],createdAt:now};
}
function api(s){
  // Sets are used only inside the preserved question picker, never stored as JSON.
  const work={...s,used:new Set(s.used),usedAnswers:new Set(s.usedAnswers)};
  return {work,...rules(work)};
}
function question(s,now){
  const a=api(s);s.currentQuestion=a.pickQuestion(s.selectedTier);
  if(!s.currentQuestion)fail('no_questions');
  s.used=[...a.work.used];s.usedAnswers=[...a.work.usedAnswers];
  s.questionOpen=true;s.phase='question';s.insuranceActive=false;s.hintUsed=false;
  s.deadline=now+s.timerSeconds*1000;s.openedAt=now;
}
function finish(s,reason){
  if(s.phase==='finished')return;
  s.phase='finished';s.questionOpen=false;s.reason=reason;
  const a=api(s),abandoned=reason==='abandoned'||reason==='disconnected';
  s.winner=abandoned?-1:s.players[0].chips===s.players[1].chips?-1:s.players[0].chips>s.players[1].chips?0:1;
  s.players.forEach((p,i)=>{
    if(!abandoned){
      p.save.lifetime.games++;
      if(s.winner===-1)p.save.lifetime.draws++;else if(i===s.winner)p.save.lifetime.wins++;else p.save.lifetime.losses++;
      a.addXp(p,i===s.winner?35:s.winner===-1?18:8);
      if(i===s.winner){a.unlock(p,'first_win');a.unlock(p,p.rescues?'rescue_win':'no_rescue');}
      if(p.errors===0&&s.rounds>=5)a.unlock(p,'perfect5');
      if(p.save.lifetime.games>=5)a.unlock(p,'games5');
      if(p.save.lifetime.games>=20)a.unlock(p,'games20');
      if(p.save.lifetime.wins>=5)a.unlock(p,'wins5');
    }
    if(p.save.xp>=1000)a.unlock(p,'level5');
    if(p.save.xp>=2250)a.unlock(p,'level10');
  });
}
function resolve(s,user,timeout,now){
  const p=s.players[s.currentPlayer],q=s.currentQuestion,bet=s.selectedBet,allIn=bet===p.chips;
  const result=timeout?{ok:false,kind:'timeout'}:checkAnswer(q,user),a=api(s);
  let xp=2,delta,mult=0;
  p.save.lifetime.attempts++;
  if(result.ok){
    mult=TIERS[s.selectedTier].mult*(Math.floor(s.turnNo/2+1)%4===0?1.5:1)*(s.hintUsed?.75:1);
    delta=Math.max(1,Math.round(bet*mult));p.chips+=delta;p.correct++;p.streak++;
    p.maxStreak=Math.max(p.maxStreak,p.streak);p.save.lifetime.correct++;
    p.save.lifetime.maxStreak=Math.max(p.save.lifetime.maxStreak,p.streak);
    p.save.best.streak=Math.max(p.save.best.streak,p.streak);p.save.best.chips=Math.max(p.save.best.chips,p.chips);
    for(const [condition,key] of [[q.modo==='subjuntivo','subjCorrect'],[q.modo==='imperativo','imperativeCorrect'],[IRREGULAR.has(q.verbo),'irregularCorrect'],[s.selectedTier==='expert','expertCorrect']]){
      if(condition){p[key]++;p.save.lifetime[key]++;}
    }
    if(bet>=50)p.bigBetWins++;if(allIn)p.allInWins++;
    xp=8+({basic:0,medium:4,advanced:8,expert:12}[s.selectedTier])+Math.min(10,Math.floor(bet/10))+Math.min(15,Math.max(0,p.streak-1)*3);
  }else{
    delta=-(s.insuranceActive?Math.ceil(bet/2):bet);p.chips=Math.max(0,p.chips+delta);
    p.errors++;p.streak=0;p.save.lifetime.errors++;
    if(result.kind==='accent'){p.accentErrors++;p.save.lifetime.accentErrors++;}
  }
  a.addXp(p,xp);a.evaluateLiveAchievements(p,bet,allIn);
  s.result={...result,delta,xp,mult,answer:q.respuesta,insurance:s.insuranceActive,hint:s.hintUsed};
  s.phase='result';s.questionOpen=false;s.advanceAt=now+2800;
  if(p.chips<=0){if(!p.rescues){p.rescues=1;p.save.lifetime.rescues++;p.chips=40;s.result.rescue=true;}else s.bankrupt=true;}
}
export function advance(s,now=Date.now()){
  if(s.players.length<2)return false;
  if(s.phase==='finished')return false;
  if(s.players.some(p=>now-(s.lastSeen[p.profileId]||s.createdAt)>90000)){finish(s,'disconnected');return true;}
  if(s.phase==='question'&&now>=s.deadline){resolve(s,'',true,now);return true;}
  if(s.phase==='result'&&now>=s.advanceAt){
    if(s.bankrupt){finish(s,'bankrupt');return true;}
    s.turnNo++;
    if(s.turnNo>=s.rounds*2){finish(s,'complete');return true;}
    s.currentPlayer=s.turnNo%2;s.selectedTier='basic';s.selectedBet=Math.min(10,s.players[s.currentPlayer].chips);
    s.currentQuestion=null;s.phase='choose';s.result=null;s.insuranceActive=false;s.hintUsed=false;
    s.chooseDeadline=now+60000;return true;
  }
  if(s.phase==='choose'&&now>=s.chooseDeadline){
    // A connected but inactive player cannot block the classroom indefinitely.
    s.selectedTier='basic';s.selectedBet=Math.min(10,s.players[s.currentPlayer].chips);question(s,now);return true;
  }
  return false;
}
export function command(s,actor,action,payload={},now=Date.now()){
  const i=s.players.findIndex(p=>p.profileId===actor);
  if(i<0)fail('not_a_member',403);
  const id=String(payload.requestId||'');
  if(!id||id.length>80)fail('invalid_request',400);
  if(s.requests.includes(id))return s;
  s.lastSeen[actor]=now;
  advance(s,now);
  const p=s.players[i];
  if(action==='leave'){finish(s,'abandoned');}
  else if(action==='ready'){
    if(s.phase!=='waiting')fail('already_started');p.ready=true;
    if(s.players.length===2&&s.players.every(x=>x.ready)){s.phase='choose';s.chooseDeadline=now+60000;}
  }else{
    if(s.phase==='finished')fail('match_finished');
    if(i!==s.currentPlayer)fail('not_your_turn',403);
    if(action==='reveal'){
      if(s.phase!=='choose')fail('wrong_phase');
      const tier=String(payload.tier),bet=Number(payload.bet);
      if(!Object.hasOwn(TIERS,tier)||![10,20,30,50,p.chips].includes(bet)||bet<=0||bet>p.chips)fail('invalid_bet',400);
      s.selectedTier=tier;s.selectedBet=bet;question(s,now);
    }else{
      if(s.phase!=='question')fail('wrong_phase');
      if(action==='answer')resolve(s,String(payload.answer||'').slice(0,160),false,now);
      else if(action==='hint'){
        if(s.hintUsed||p.chips<5)fail('hint_unavailable');p.chips-=5;s.hintUsed=true;
      }else if(action==='insurance'){
        if(p.insurance<=0||s.insuranceActive)fail('insurance_unavailable');p.insurance--;s.insuranceActive=true;
      }else if(action==='swap'){
        if(p.swap<=0)fail('swap_unavailable');p.swap--;question(s,now);
      }else fail('unknown_action',400);
    }
  }
  s.requests=[...s.requests.slice(-63),id];return s;
}
export function publicState(room,actor,now=Date.now()){
  const s=room.state,index=s.players.findIndex(p=>p.profileId===actor);
  if(index<0)fail('not_a_member',403);
  const q=s.currentQuestion;
  return {id:room.id,code:room.code,version:room.version,serverNow:now,ownIndex:index,
    state:{...s,used:undefined,usedAnswers:undefined,recentVerbs:undefined,requests:undefined,lastSeen:undefined,
      players:s.players.map((p,i)=>({...p,baseSave:undefined,save:i===index?p.save:{xp:p.save.xp,achievements:[]}})),
      currentQuestion:q?{id:q.id,verbo:q.verbo,modo:q.modo,tiempo:q.tiempo,persona:q.persona}:null,
      newUnlocks:s.newUnlocks.filter(x=>x.player===s.players[index].name),
      hint:s.hintUsed&&index===s.currentPlayer&&q?hintFor(q):null}};
}
