window.LexitramaEngine = (() => {
  'use strict';
  const C=window.LexitramaContent;
  let state=null,career=null,storageKey='',ready=false;
  const freshCareer=()=>({version:1,xp:0,stars:{},records:{},achievements:{},discovered:{},mastery:{},dailyDates:{},stats:{words:0,longest:0,streak:0,wins:0,perfect:0,bosses:0,threeStars:0,daily:0,specials:0},active:null,updatedAt:0});
  const copy=o=>JSON.parse(JSON.stringify(o));
  function hash(text){let h=2166136261;for(const ch of String(text))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
  function random(){state.rng=(state.rng+0x6D2B79F5)>>>0;let t=state.rng;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
  function shuffled(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function neighbors(index,size=state.size){const r=Math.floor(index/size),c=index%size,out=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const nr=r+dr,nc=c+dc;if(nr>=0&&nr<size&&nc>=0&&nc<size)out.push(nr*size+nc);}return out;}
  function mission(){return C.missions.find(m=>m.id===state.mission);}
  function candidates(){return C.words.filter(w=>w.word.length<=state.size*state.size&&mission().test(w));}
  function tile(letter){return {letter,kind:'normal',hits:1,age:0,uid:++state.uid};}
  function randomTile(special=false){
    const alphabet='AAAAAAAEEEEEEEIIIIIOOOOOUUUNNNRRRSSSLLLTTDDCCMPBGVFHJÑZ';
    const t=tile(alphabet[Math.floor(random()*alphabet.length)]);
    if(special&&state.special&&random()<.1&&(state.board||[]).filter(x=>x.kind!=='normal').length<state.size){
      const kinds=['gold','wild','bomb',...(state.size>=5?['ice','sealed','corrupt']:[])];
      t.kind=kinds[Math.floor(random()*kinds.length)];t.hits=t.kind==='ice'?2:1;
    }
    return t;
  }
  function fits(t,ch){return t&&t.kind!=='sealed'&&(t.kind==='wild'||t.letter===ch.toUpperCase());}
  function route(word,board=state.board){
    const chars=[...word.toUpperCase()];let budget=30000;
    function walk(index,pos,path,seen){if(--budget<0||!fits(board[index],chars[pos]))return null;path.push(index);seen.add(index);if(pos===chars.length-1)return [...path];for(const next of neighbors(index))if(!seen.has(next)){const found=walk(next,pos+1,path,seen);if(found)return found;}seen.delete(index);path.pop();return null;}
    for(let i=0;i<board.length;i++){const result=walk(i,0,[],new Set());if(result)return result;}return null;
  }
  function snake(){const path=[];for(let r=0;r<state.size;r++)for(let j=0;j<state.size;j++)path.push(r*state.size+(r%2?state.size-1-j:j));return path;}
  function embed(word){
    // Serpientes rotadas/reflejadas: rutas simples, sin reutilizar ni abrir sellos.
    const n=state.size,possibilities=[];
    for(let rotate=0;rotate<4;rotate++)for(const mirror of [false,true]){
      const path=snake().map(i=>{let r=Math.floor(i/n),c=i%n;if(mirror)c=n-1-c;for(let k=0;k<rotate;k++)[r,c]=[c,n-1-r];return r*n+c;});
      if(random()<.5)path.reverse();
      for(let start=0;start<=path.length-word.length;start++){
        const segment=path.slice(start,start+word.length);
        if(segment.every(i=>state.board[i]?.kind!=='sealed'))possibilities.push(segment);
      }
    }
    if(!possibilities.length)return null;
    const used=possibilities[Math.floor(random()*possibilities.length)];
    [...word.toUpperCase()].forEach((ch,k)=>{
      const existing=state.board[used[k]];
      if(existing?.kind==='ice'||existing?.kind==='gold'||existing?.kind==='bomb'||existing?.kind==='corrupt')existing.letter=ch;
      else if(existing?.kind!=='wild'&&existing?.letter!==ch)state.board[used[k]]=tile(ch);
    });
    return used;
  }
  function available(){return candidates().filter(w=>!state.used.includes(w.word));}
  function ensureSolvable(){
    let pool=available();
    if(!pool.length){state.used=[];pool=candidates();state.cycle++;}
    for(const w of pool)if(route(w.word)){state.guaranteed=w.word;return false;}
    for(const w of shuffled(pool)){if(embed(w.word)){state.guaranteed=w.word;return true;}}
    throw new Error('Misión sin soluciones en este tamaño');
  }
  function generate(){
    state.board=Array.from({length:state.size**2},randomTile);
    const pool=shuffled(candidates());
    // Incrustar varias propuestas y verificar después la existencia de una solución real.
    for(const w of pool.slice(0,3))embed(w.word);
    decorate();ensureSolvable();
  }
  function decorate(){
    if(!state.special)return;
    const types=['gold','wild','bomb',...(state.size>=5?['ice','sealed','corrupt']:[])];
    for(const index of shuffled(state.board.map((_,i)=>i)).slice(0,Math.max(1,Math.floor(state.size/2)))){
      const t=state.board[index];t.kind=types[Math.floor(random()*types.length)];t.hits=t.kind==='ice'?2:1;
    }
  }
  function notify(){window.dispatchEvent(new CustomEvent('lexitrama:change'));}
  function persist(){if(!ready)return;career.active=state?copy(state):null;career.updatedAt=Date.now();try{localStorage.setItem(storageKey,JSON.stringify(career));}catch{} }
  function initialize(profile,remote,embedded=false){
    storageKey=`lenguarcade.lexitrama.v1.${embedded?'student.'+encodeURIComponent(profile.studentId||profile.email||'unknown'):'demo'}`;
    let local=null;try{local=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{}
    const raw=remote?.rawGameData?.save||remote?.rawGameData||remote?.save||remote;
    const incoming=raw?.career;
    // Caché aislada por alumno: recuperar cambios aún no confirmados si son más recientes.
    const localNewer=local?.version===1&&(!incoming||Number(local.updatedAt)>Number(incoming.updatedAt||0)+1000);
    career=Object.assign(freshCareer(),copy(localNewer?local:incoming?.version===1?incoming:freshCareer()));
    career.stats=Object.assign(freshCareer().stats,career.stats||{});
    const run=localNewer?career.active:(raw?.run||career.active);
    state=validRun(run)?copy(run):null;ready=true;persist();notify();return !!state;
  }
  function validRun(s){return !!(s&&s.version===1&&[3,4,5,7].includes(s.size)&&C.missions.some(m=>m.id===s.mission)&&Array.isArray(s.board)&&s.board.length===s.size**2&&s.board.every(t=>t&&typeof t.letter==='string'&&t.letter.length===1)&&Array.isArray(s.used)&&Number.isFinite(s.rng));}
  function create(options={}){
    if(!ready)throw new Error('Esperando perfil');
    if(state&&!state.completed)throw new Error('Guarda o termina la partida antes de empezar otra.');
    const level=C.levels.find(l=>l.id===options.levelId);const mode=level?'adventure':options.mode||'mastery';
    const seed=String(options.seed||Date.now());const boss=level?.boss;
    state={version:1,id:`lx_${Date.now()}_${Math.random().toString(36).slice(2)}`,mode,seed,rng:hash(seed),size:level?.size||options.size||5,mission:level?.mission||options.mission||'sustantivo',levelId:level?.id||null,world:level?.world||'bosque',goal:level?.goal||(mode==='daily'?8:6),moves:level?.moves||(mode==='hardcore'?12:9999),duration:mode==='timed'?Number(options.duration||180):0,remaining:mode==='timed'?Number(options.duration||180):0,elapsed:0,score:0,correct:0,errors:0,progress:0,streak:0,bestStreak:0,longest:0,used:[],log:[],uid:0,cycle:0,hints:0,reshuffles:0,ink:3,furia:0,special:level?.special??true,boss:boss?{name:boss,hp:80,maxHp:80,nextAttack:20,attacks:0,corruption:0}:null,third:level?.third||'precision',completed:false,won:false,revision:0,stars:0};
    generate();persist();notify();window.dispatchEvent(new CustomEvent('lexitrama:start'));return state;
  }
  function multiplier(){return state.furia>0?5:state.streak>=5?3:state.streak>=3?2:state.streak>=2?1.5:1;}
  function validatePath(path){return Array.isArray(path)&&path.length>=2&&new Set(path).size===path.length&&path.every((i,k)=>Number.isInteger(i)&&i>=0&&i<state.board.length&&state.board[i].kind!=='sealed'&&(!k||neighbors(path[k-1]).includes(i)));}
  function resolve(path){
    if(!validatePath(path))return null;
    const tiles=path.map(i=>state.board[i]);
    const matches=C.words.filter(w=>w.word.length===tiles.length&&[...w.word.toUpperCase()].every((ch,k)=>fits(tiles[k],ch)));
    return matches.find(w=>mission().test(w)&&!state.used.includes(w.word))||matches.find(w=>!state.used.includes(w.word))||matches[0]||null;
  }
  function collapse(indices){
    const old=copy(state.board),remove=new Set(indices),fall=[];
    for(let col=0;col<state.size;col++){
      const survivors=[];for(let row=state.size-1;row>=0;row--){const i=row*state.size+col;if(!remove.has(i))survivors.push({t:state.board[i],from:row});}
      for(let row=state.size-1;row>=0;row--){const item=survivors[state.size-1-row];state.board[row*state.size+col]=item?item.t:randomTile(true);fall[row*state.size+col]=item?item.from-row:-row-1;}
    }
    return {old,fall};
  }
  function submit(path){
    if(!ready||!state||state.completed)return {ok:false,message:'La partida ha terminado.'};
    if(!validatePath(path))return {ok:false,message:'Conecta al menos dos casillas vecinas sin repetirlas.'};
    state.moves--;state.revision++;
    const w=resolve(path);
    if(!w||state.used.includes(w.word)){
      state.errors++;state.streak=0;state.furia=0;state.score=Math.max(0,state.score-(state.mode==='hardcore'?40:10));
      const message=w?'Ya has utilizado esta palabra en este ciclo.': 'Esta combinación no está en el banco del juego. Revisa las letras y las tildes.';
      checkEnd();persist();notify();return {ok:false,message};
    }
    const goal=mission().test(w);state.correct++;state.streak++;state.bestStreak=Math.max(state.bestStreak,state.streak);state.longest=Math.max(state.longest,w.word.length);state.used.push(w.word);
    if(state.streak===8){state.furia=12;state.ink=Math.min(5,state.ink+1);}
    const selected=path.map(i=>state.board[i]);const gold=selected.some(t=>t.kind==='gold');const specialCount=selected.filter(t=>t.kind!=='normal').length;
    const points=Math.round((w.word.length**2*4+w.difficulty*12+(goal?70:0))*multiplier()*(gold?3:1));state.score+=points;
    if(goal){state.progress++;if(state.boss)state.boss.hp=Math.max(0,state.boss.hp-10);}
    const removal=new Set();
    for(const i of path){const t=state.board[i];if(t.kind==='ice'&&--t.hits>0){t.kind='ice';}else removal.add(i);if(t.kind==='bomb')for(const j of neighbors(i))removal.add(j);}
    if(goal)for(const t of state.board)if(t.kind==='sealed')t.kind='normal';
    for(const t of state.board)if(t.kind==='corrupt'){t.age++;if(t.age>=4){state.score=Math.max(0,state.score-20);t.kind='normal';}}
    const animation=collapse([...removal]);
    const rescued=ensureSolvable();
    state.log.unshift({word:w.word,goal,points,explain:goal?mission().explain:`Categoría: ${w.type}. Palabra válida, pero no cumple el objetivo.`});state.log=state.log.slice(0,40);
    career.discovered[w.word]=true;career.stats.words++;career.stats.longest=Math.max(career.stats.longest,state.longest);career.stats.streak=Math.max(career.stats.streak,state.bestStreak);career.stats.specials+=specialCount;career.xp+=4+(goal?3:0);if(goal)career.mastery[state.mission]=(career.mastery[state.mission]||0)+1;
    unlockAchievements();checkEnd();persist();notify();return {ok:true,word:w.word,goal,points,rescued,animation,message:goal?`${w.word} · +${points} · ${mission().explain}`:`${w.word} · +${points}. Palabra válida, pero no cumple el objetivo.`};
  }
  function unlockAchievements(){career.stats.threeStars=Object.values(career.stars).filter(n=>n===3).length;for(const a of C.achievements)if((a.key==='xp'?career.xp:career.stats[a.key])>=a.target&&!career.achievements[a.id])career.achievements[a.id]=true;}
  function accuracy(){return state?.correct+state?.errors?Math.round(state.correct/(state.correct+state.errors)*100):100;}
  function thirdMet(){return state.third==='reserve'?state.moves>=3:state.third==='long'?state.longest>=7:accuracy()>=95&&state.hints===0;}
  function finish(won,reason){
    if(state.completed)return;state.score=Math.max(0,state.score-20*state.board.filter(t=>t.kind==='corrupt').length);state.completed=true;state.won=!!won;state.reason=reason;state.stars=won?1+(accuracy()>=90?1:0)+(thirdMet()?1:0):0;
    if(won){career.stats.wins++;if(!state.errors)career.stats.perfect++;if(state.boss)career.stats.bosses++;if(state.levelId)career.stars[state.levelId]=Math.max(career.stars[state.levelId]||0,state.stars);career.xp+=30+state.stars*10;}
    if(state.mode==='daily'&&won&&!career.dailyDates[state.seed]){career.dailyDates[state.seed]=true;career.stats.daily++;}
    career.records[state.levelId||state.mode]=Math.max(career.records[state.levelId||state.mode]||0,state.score);unlockAchievements();persist();notify();window.dispatchEvent(new CustomEvent('lexitrama:finish'));
  }
  function checkEnd(){if(state.mode!=='infinite'&&state.mode!=='timed'&&state.progress>=state.goal)return finish(true,'Misión cumplida');if(state.moves<=0)return finish(false,'Sin movimientos');if((state.mode==='infinite'&&state.errors>=3)||(state.mode==='hardcore'&&state.errors>=2))return finish(false,'Sin vidas');if(state.boss?.corruption>=12)return finish(false,'El jefe ha corrompido el atlas');}
  function tick(seconds=1){
    if(!state||state.completed)return;state.elapsed+=seconds;state.furia=Math.max(0,state.furia-seconds);if(state.duration){state.remaining=Math.max(0,state.remaining-seconds);if(!state.remaining)return finish(state.progress>=state.goal,'Tiempo agotado');}
    if(state.boss){state.boss.nextAttack-=seconds;if(state.boss.nextAttack<=0){state.boss.nextAttack+=20;state.boss.attacks++;state.boss.corruption+=2;const i=Math.floor(random()*state.board.length);if(state.world==='forja'){state.board[i]=randomTile();}else{state.board[i].kind='corrupt';state.board[i].age=0;}ensureSolvable();checkEnd();state.revision++;persist();window.dispatchEvent(new CustomEvent('lexitrama:attack'));}}
  }
  function hint(){if(!state||state.completed||state.mode==='hardcore'||state.ink<=0)return null;state.ink--;state.hints++;ensureSolvable();const path=route(state.guaranteed);persist();return {word:state.guaranteed,path};}
  function reshuffle(){if(!state||state.completed||state.ink<=0)return false;state.ink--;state.reshuffles++;state.moves--;state.revision++;generate();checkEnd();persist();notify();return true;}
  function snapshot(){persist();return {version:1,gameId:'lexitrama',run:state?copy(state):null,career:copy(career)};}
  function isUnlocked(level){return level.unlock===0||!!career.stars[C.levels[level.unlock-1].id];}
  function abandon(){if(state&&!state.completed)finish(false,'Expedición terminada');}
  return {get state(){return state;},get career(){return career;},get ready(){return ready;},initialize,create,neighbors,route,resolve,submit,multiplier,mission,accuracy,thirdMet,tick,hint,reshuffle,persist,snapshot,isUnlocked,abandon,validRun};
})();
