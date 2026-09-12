(() => {
'use strict';
let raf=0,lastSize=0;
const px=value=>Number.parseFloat(value)||0;
function computeTileSize(availableWidth,availableHeight,gap=7,max=112){
  const byWidth=(Math.max(0,availableWidth)-gap*3)/4;
  const byHeight=(Math.max(0,availableHeight)-gap*3)/4;
  return Math.max(30,Math.floor(Math.min(max,byWidth,byHeight)));
}
function fitBoard(){
  const game=document.getElementById('gameScreen');
  const panel=document.querySelector('.play-panel');
  const board=document.getElementById('board');
  const challenge=document.getElementById('challengeBanner');
  const wordZone=document.querySelector('.word-zone');
  const footer=document.querySelector('.board-footer');
  if(!game||!panel||!board||game.classList.contains('hidden'))return;
  const cs=getComputedStyle(panel);
  const padX=px(cs.paddingLeft)+px(cs.paddingRight);
  const padY=px(cs.paddingTop)+px(cs.paddingBottom);
  const rowGap=px(cs.rowGap||cs.gap)||0;
  const occupied=(challenge?.getBoundingClientRect().height||0)+(wordZone?.getBoundingClientRect().height||0)+(footer?.getBoundingClientRect().height||0)+rowGap*3;
  const availableWidth=Math.max(0,panel.clientWidth-padX-2);
  const availableHeight=Math.max(0,panel.clientHeight-padY-occupied-2);
  let gap=availableHeight<300?4:availableHeight<420?5:7;
  let size=computeTileSize(availableWidth,availableHeight,gap,112);
  if(availableWidth<430)gap=Math.min(gap,5);
  size=computeTileSize(availableWidth,availableHeight,gap,112);
  board.style.setProperty('--board-gap',`${gap}px`);
  board.style.setProperty('--tile-size',`${size}px`);
  board.classList.toggle('compact-board',size<62);
  lastSize=size;
}
function requestFit(){cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{fitBoard();requestAnimationFrame(fitBoard);});}
function install(){
  const panel=document.querySelector('.play-panel');
  const game=document.getElementById('gameScreen');
  const board=document.getElementById('board');
  if(!panel||!game||!board)return;
  if('ResizeObserver'in window){const ro=new ResizeObserver(requestFit);[panel,game,board,document.querySelector('.word-zone'),document.getElementById('challengeBanner'),document.querySelector('.board-footer')].filter(Boolean).forEach(el=>ro.observe(el));}
  const mo=new MutationObserver(requestFit);
  mo.observe(game,{attributes:true,attributeFilter:['class'],subtree:false});
  mo.observe(board,{childList:true,subtree:false});
  const wordZone=document.querySelector('.word-zone');if(wordZone)mo.observe(wordZone,{childList:true,subtree:true,characterData:true});
  window.addEventListener('resize',requestFit,{passive:true});
  window.addEventListener('orientationchange',requestFit,{passive:true});
  window.visualViewport?.addEventListener('resize',requestFit,{passive:true});
  document.fonts?.ready?.then(requestFit).catch(()=>{});
  requestFit();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
window.WordPlayLayout={fitBoard:requestFit,computeTileSize,get tileSize(){return lastSize;}};
})();
