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
function install(){
  syncMotionClass();watchFeedback();watchRound();
  const toggle=document.getElementById('reduceMotionToggle');
  toggle?.addEventListener('change',()=>setTimeout(syncMotionClass,0));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.WordPlayGameFeel={syncMotionClass};
})();