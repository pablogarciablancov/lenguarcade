(() => {
'use strict';
const layer=document.createElement('div');
layer.className='wp-fx-layer';
document.body.appendChild(layer);
let lastFeedback='',lastRound='',lastBoss=false;
const game=()=>document.getElementById('gameScreen');
function reduce(){return !!window.WordPlayEngine?.settings?.reduceMotion||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches}
function spawn(className,text=''){
  if(reduce())return;
  const el=document.createElement('div');el.className=className;el.textContent=text;layer.appendChild(el);
  setTimeout(()=>el.remove(),1400);
}
function scoreWord(data={}){
  if(reduce()||!data)return;
  const seq=document.createElement('div');seq.className='wp-word-score-sequence';
  const title=document.createElement('div');title.className='wp-score-word';title.textContent=String(data.word||'').toUpperCase();seq.appendChild(title);
  const letters=document.createElement('div');letters.className='wp-score-letters';
  (data.tilePoints||[]).forEach((p,i)=>{
    const chip=document.createElement('span');chip.className='wp-score-letter';chip.style.setProperty('--i',i);
    const l=document.createElement('b');l.textContent=p.letter||'•';
    const v=document.createElement('em');v.textContent='+'+Number(p.value||0);
    chip.append(l,v);letters.appendChild(chip);
  });
  seq.appendChild(letters);
  const math=document.createElement('div');math.className='wp-score-math';
  const add=(label,value,cls='')=>{const x=document.createElement('span');if(cls)x.className=cls;const small=document.createElement('small');small.textContent=label;const strong=document.createElement('strong');strong.textContent=value;x.append(small,strong);math.appendChild(x);};
  add('WORD',String(Number(data.wordScore||0)));
  if(Number(data.bonusPoints||0))add('BONUS','+'+Number(data.bonusPoints||0),'bonus');
  if(Number(data.finalMultiplier||1)>1)add('MULT','×'+Number(data.finalMultiplier).toFixed(data.finalMultiplier%1?2:0),'mult');
  add('TOTAL','+'+Number(data.total||0),'total');
  if(Number(data.coins||0))add('MONEDAS','+'+Number(data.coins||0),'coins');
  seq.appendChild(math);layer.appendChild(seq);
  const lifetime=1550+Math.min(8,(data.tilePoints||[]).length)*70;
  setTimeout(()=>seq.remove(),lifetime);
}
function activations(data={}){
  if(reduce())return;
  const items=[];
  for(const m of data.modifiers||[])items.push({cls:'modifier',label:m.name,text:m.text||'ACTIVA'});
  for(const e of data.specialEvents||[])items.push({cls:'special '+(e.kind||''),label:e.label||'ESPECIAL',text:e.text||''});
  if(data.mission)items.push({cls:'mission',label:'MISIÓN COMPLETADA',text:'+'+Number(data.mission.reward||0)+' Monedas'});
  if(!items.length)return;
  const stack=document.createElement('div');stack.className='wp-activation-stack';
  items.slice(0,6).forEach((item,i)=>{
    const el=document.createElement('div');el.className='wp-activation '+item.cls;el.style.setProperty('--i',i);
    const strong=document.createElement('strong');strong.textContent=item.label;
    const span=document.createElement('span');span.textContent=item.text;
    el.append(strong,span);stack.appendChild(el);
  });
  layer.appendChild(stack);setTimeout(()=>stack.remove(),1800+items.length*90);
}
function hit(){
  const g=game();if(!g||reduce())return;
  g.classList.remove('wp-hit');void g.offsetWidth;g.classList.add('wp-hit');setTimeout(()=>g.classList.remove('wp-hit'),330);
}
function syncMotionClass(){document.documentElement.classList.toggle('reduce-motion',!!window.WordPlayEngine?.settings?.reduceMotion)}
function watchFeedback(){
  const feedback=document.getElementById('feedback');if(!feedback)return;
  const check=()=>{
    const text=feedback.textContent||'';if(!text||text===lastFeedback)return;lastFeedback=text;
    if(feedback.classList.contains('good')){
      const m=text.match(/\+(\d[\d.]*)\s+puntos/i);if(m)spawn('wp-score-pop',`+${m[1]}`);
      hit();
      const combo=Number(window.WordPlayEngine?.state?.bestCombo||1);
      if(combo>=1.5)spawn('wp-combo-callout',`COMBO ×${combo%1?combo.toFixed(2):combo}`);
    }
  };
  new MutationObserver(check).observe(feedback,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
}
function watchRound(){
  const round=document.getElementById('roundLabel'),boss=document.getElementById('bossBadge');if(!round||!boss)return;
  const check=()=>{
    const r=round.textContent||'',isBoss=!boss.classList.contains('hidden'),g=game();
    if(r&&lastRound&&r!==lastRound){spawn('wp-round-flash');if(isBoss&&g&&!reduce()){g.classList.add('wp-boss-enter');setTimeout(()=>g.classList.remove('wp-boss-enter'),650)}}
    lastRound=r;lastBoss=isBoss;
  };
  new MutationObserver(check).observe(round,{childList:true,subtree:true});
  new MutationObserver(check).observe(boss,{attributes:true,attributeFilter:['class']});
  check();
}
function watchBossLoot(){
  const reward=document.getElementById('rewardModal');if(!reward)return;
  let open=false;
  const check=()=>{
    const now=!reward.classList.contains('hidden')&&reward.classList.contains('boss-loot');
    if(now&&!open)spawn('wp-boss-clear','RONDA SUPERADA');
    open=now;
  };
  new MutationObserver(check).observe(reward,{attributes:true,attributeFilter:['class']});
}
function install(){
  syncMotionClass();watchFeedback();watchRound();watchBossLoot();
  const toggle=document.getElementById('reduceMotionToggle');
  toggle?.addEventListener('change',()=>setTimeout(syncMotionClass,0));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.WordPlayGameFeel={syncMotionClass,scoreWord,activations};
})();