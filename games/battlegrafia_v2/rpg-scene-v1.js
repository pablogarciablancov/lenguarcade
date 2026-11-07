/* Original, code-drawn pixel scenery. One active canvas; stopped on close. */
(function(){
'use strict';
let raf=0, previous=null, canvas=null, options=null, start=0,travel=null;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const palettes={guerrero:['#a84b45','#e69a66','#ebd5a5'],mago:['#526dc4','#8fb7ee','#e2bb6f'],explorador:['#458c73','#9acb86','#d5b682']};
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h)}
function hero(c,x,y,id='guerrero',dir='down',frame=0,scale=1){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);const p=palettes[id]||palettes.guerrero;
 c.fillStyle='#091a29aa';c.beginPath();c.ellipse(0,1,8,3,0,0,7);c.fill();
 const step=frame%4===1?2:frame%4===3?-2:0;
 rect(c,-5,-8,4,8+step,'#293d4d');rect(c,1,-8,4,8-step,'#293d4d');
 rect(c,-6,-2+step,5,3,'#d6b77a');rect(c,1,-2-step,5,3,'#d6b77a');
 rect(c,-7,-18,14,12,p[0]);rect(c,-5,-17,10,9,p[1]);rect(c,-6,-8,12,3,'#604f44');rect(c,-1,-8,3,3,p[2]);
 rect(c,-10,-17+step,4,9,p[0]);rect(c,7,-17-step,4,9,p[0]);
 if(dir!=='up'){rect(c,-5,-26,10,10,'#e8b88c');rect(c,dir==='left'?-5:dir==='right'?3:-3,-22,2,2,'#23313d');if(dir==='down')rect(c,2,-22,2,2,'#23313d')}
 else rect(c,-5,-26,10,10,'#60493d');
 rect(c,-6,-28,12,5,id==='mago'?'#526dc4':id==='explorador'?'#3a6b59':'#8c9ca4');
 if(id==='mago'){rect(c,-4,-32,8,5,p[0]);rect(c,-1,-35,3,5,p[1]);rect(c,10,-27,2,26,'#ad7c48');rect(c,8,-31,6,6,'#8cf4ed')}
 if(id==='guerrero'){rect(c,9,-20,2,18,'#c4dfdf');rect(c,6,-6,8,2,'#f2cf7a');rect(c,-10,-15,6,10,'#b68e53');rect(c,-9,-14,4,7,'#4c6d87')}
 if(id==='explorador'){rect(c,10,-23,2,21,'#d2ab67');rect(c,12,-20,2,15,'#9a7448')}
 c.restore();
}
function tree(c,x,y,n=0){rect(c,x-4,y-25,8,32,'#614737');rect(c,x-2,y-21,3,26,'#94704a');
 [[-22,-44,44,13],[-29,-34,58,17],[-25,-20,50,14],[-18,-12,36,8]].forEach((r,i)=>rect(c,x+r[0],y+r[1],r[2],r[3],['#153f3d','#20584a','#2b7053','#204d43'][i]));
 rect(c,x-18,y-34,18,4,'#45885e');rect(c,x+2,y-24,18,4,'#397b58');rect(c,x-13,y-45,20,3,'#60915b');}
function chest(c,x,y,open=false){rect(c,x-12,y-13,24,15,'#4b3031');rect(c,x-11,y-12,22,12,'#ba7f43');rect(c,x-11,y-12,22,3,'#edc778');rect(c,x-9,y-10,3,10,'#e2b869');rect(c,x+6,y-10,3,10,'#e2b869');rect(c,x-2,y-7,4,5,'#ffe6a0');if(open){rect(c,x-11,y-19,22,5,'#d9aa61');rect(c,x-7,y-11,14,4,'#ffeaa0')}}
function fire(c,x,y,t){rect(c,x-12,y,24,3,'#654b38');rect(c,x-7,y-8,14,8,'#c85c35');rect(c,x-4,y-15-Math.floor(t%3),8,12,'#ffc561');rect(c,x-2,y-10,4,10,'#fff1a9')}
function portal(c,x,y){rect(c,x-18,y-28,36,30,'#777e86');rect(c,x-12,y-23,24,25,'#152b3a');rect(c,x-8,y-20,16,20,'#44668c');rect(c,x-5,y-15,10,15,'#87b2c4');rect(c,x-20,y,40,4,'#a1a49a')}
function monster(c,x,y,boss=false,t=0){c.save();c.translate(x,y+Math.sin(t*2)*2);const a=boss?1.7:1;c.scale(a,a);rect(c,-16,-18,32,18,'#403c68');rect(c,-20,-14,40,10,'#655486');rect(c,-13,-26,26,13,'#8c78a1');rect(c,-11,-29,5,5,'#d8c9b9');rect(c,7,-29,5,5,'#d8c9b9');rect(c,-9,-21,5,3,'#ffd282');rect(c,5,-21,5,3,'#ffd282');rect(c,-4,-12,8,3,'#e3b8aa');if(boss){rect(c,-36,-25,17,19,'#695980');rect(c,19,-25,17,19,'#695980');rect(c,-32,-30,5,10,'#a99bba');rect(c,27,-30,5,10,'#a99bba')}c.restore()}
function terrain(c,map){
 rect(c,0,0,640,360,map==='cripta'?'#303d49':'#436951');
 for(let i=0;i<700;i++){const x=(i*137+23)%640,y=(i*73+19)%360;rect(c,x,y,2+(i%3),1,map==='cripta'?(i%2?'#3d4a53':'#26343f'):(i%3?'#52795a':'#345c4b'))}
}
function distant(c,t,crypt=false){
 rect(c,0,0,640,360,crypt?'#202f42':'#1b3d4b');
 if(crypt){for(let x=0;x<640;x+=64){rect(c,x,0,3,230,'#3b4659');rect(c,x+5,0,45,215,'#29384c');rect(c,x+9,20,33,180,'#243145')}rect(c,0,230,640,130,'#3e4754');for(let y=250;y<360;y+=26)rect(c,0,y,640,2,'#303b49')}
 else{rect(c,0,0,640,100,'#254c5b');for(let i=0;i<12;i++){let x=i*61-20;rect(c,x,65-(i%3)*20,70,110,'#315761');rect(c,x+10,45-(i%3)*20,40,30,'#315761')}for(let i=0;i<11;i++)tree(c,i*66-8,210+(i%3)*10);rect(c,0,251,640,109,'#3c6653');rect(c,0,267,640,93,'#63785b');for(let i=0;i<80;i++)rect(c,(i*83)%640,272+(i*23)%85,9,2,i%2?'#738965':'#526b54')}
 // pools of light and drifting motes
 const glow=c.createRadialGradient(400,100,0,400,100,280);glow.addColorStop(0,crypt?'#c69b6224':'#ffe6a02e');glow.addColorStop(1,'#ffffff00');c.fillStyle=glow;c.fillRect(0,0,640,360);
 for(let i=0;i<22;i++){const x=(i*79+Math.sin(t*.3+i)*10)%640,y=(i*43-t*(2+i%3)+720)%360;rect(c,x,y,1,1,'#dbe9ad88')}
}
function nodeIcon(c,x,y,type,t){if(type==='rest')fire(c,x,y,t);else if(type==='chest'||type==='treasure')chest(c,x,y);else if(type==='boss')monster(c,x,y,true,t);else if(type==='guardia'||type==='espectro'){portal(c,x,y);monster(c,x,y,false,t)}else monster(c,x,y,false,t)}
function paint(now){
 if(!canvas||!canvas.isConnected)return;
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;const o=options,t=reduced()?0:(now-start)/1000;
 c.clearRect(0,0,640,360);
 if(o.type==='world'){
  terrain(c,o.map);const rows=o.layout,tw=64,th=46;
  for(let y=0;y<7;y++)for(let x=0;x<10;x++){const code=rows[y][x],cx=x*tw+32,cy=y*th+35,key=o.map+':'+x+':'+y;
   if(code!=='T'&&code!=='#'){rect(c,x*tw,y*th+12,tw,th,o.map==='cripta'?'#4b525b':'#9b9265');for(let j=0;j<4;j++)rect(c,x*tw+(j*17+x*9)%60,y*th+21+(j*7)%30,5,2,o.map==='cripta'?'#59616a':'#b1a675')}
   if(code==='#'){rect(c,x*tw,y*th+12,tw,th,'#242e3c');for(let j=0;j<3;j++){rect(c,x*tw+1,y*th+12+j*13,61,11,'#515966');rect(c,x*tw+4+(j%2)*22,y*th+14+j*13,29,3,'#69707b')}}
   if(code==='T')tree(c,cx,cy+10,x+y);
   if(code==='C')chest(c,cx,cy+5,!!o.cleared[key]);if(code==='D'||code==='P')portal(c,cx,cy+6);
   if(code==='V'){rect(c,cx-25,cy-16,50,28,'#c1a273');rect(c,cx-29,cy-25,58,13,'#644b43');rect(c,cx-21,cy-32,42,9,'#895c4a');rect(c,cx-7,cy-10,14,22,'#3a4641');rect(c,cx+12,cy-10,7,8,'#ffda8a')}
   if(code==='N')hero(c,cx,cy+8,'mago','down',0,1.1);
   if((code==='E'||code==='B')&&!o.cleared[key])monster(c,cx,cy+8,code==='B',t);
  }
  const dest={x:o.x*64+32,y:o.y*46+43};let pos=dest;
  if(previous?.map===o.map&&now-previous.at<170&&!reduced()){const p=Math.min(1,(now-previous.at)/170);pos={x:previous.x+(dest.x-previous.x)*p,y:previous.y+(dest.y-previous.y)*p}}
  hero(c,pos.x,pos.y,o.hero,o.dir||'down',pos===dest?0:Math.floor(t*18),1.2);
  // foreground foliage frames the world without revealing tile borders
  for(let i=0;i<9;i++)tree(c,i*86-10,366,i);
 }else{
  distant(c,t,o.crypt);
  if(o.type==='route'){
   const points=o.stages.map((s,i)=>s.map((n,j)=>({x:78+i*118,y:s.length===1?170:j?235:110,n})));
   c.lineWidth=3;
   for(let i=1;i<points.length;i++)for(const a of points[i-1])for(const b of points[i]){c.strokeStyle=i<=o.stage?'#e0c782':'#7b91827a';c.setLineDash(i<=o.stage?[]:[4,5]);c.beginPath();c.moveTo(a.x,a.y);c.bezierCurveTo(a.x+55,a.y,b.x-55,b.y,b.x,b.y);c.stroke()}c.setLineDash([]);
   points.forEach((p,i)=>p.forEach(({x,y,n})=>{c.fillStyle=i===o.stage?'#c6a256':'#384d4c';c.beginPath();c.ellipse(x,y+7,27,12,0,0,7);c.fill();nodeIcon(c,x,y,n.id,t)}));
   const step=Math.min(o.stage,4),last=step>0?o.stages[step-1].findIndex(n=>n.id===o.path[step-1]):0;let hx=step?78+(step-1)*118:40,hy=step?(last?235:110)+12:186;
   if(travel){const p=reduced()?1:Math.min(1,(now-travel.time)/440),tx=78+travel.stage*118,ty=o.stages[travel.stage].length===1?170:travel.index?235:110;hx+=(tx-hx)*p;hy+=(ty+12-hy)*p}
   hero(c,hx,hy,o.hero,'right',travel?Math.floor(t*15):0,1.1);
   rect(c,0,325,640,35,'#142e35aa');
  }else if(o.type==='battle'){
   const fx=o.fx,elapsed=fx?(now-fx.time):9999;
   const attack=fx&&elapsed<500&&fx.damage>0, counter=fx&&elapsed>=650&&elapsed<1050&&fx.counter>0;
   const hx=175+(attack&&fx.action==='attack'?Math.sin(elapsed/500*Math.PI)*52:0),ex=470;
   hero(c,hx,273,o.hero,'right',0,3.1);

   // enemy silhouettes are scaled large, original pixel art rather than remote sprites
   c.save();c.translate(ex+(attack?Math.sin(elapsed*.1)*4:0),265);c.scale(o.enemy==='draco'?2:2.5,2.5);monster(c,0,0,o.enemy==='draco',t);c.restore();
   if(fx&&elapsed<600){
    if(fx.action==='guard'){c.strokeStyle='#8cdfff';c.lineWidth=4;c.beginPath();c.ellipse(hx,226,38,57,0,0,7);c.stroke()}
    if(fx.action==='spell'&&fx.damage){const px=hx+(ex-hx)*Math.min(1,elapsed/350);c.shadowColor='#91eafa';c.shadowBlur=18;rect(c,px,205,18,10,'#d8ffff');c.shadowBlur=0}
    if(fx.action==='attack'&&fx.damage){c.strokeStyle='#fff2bb';c.lineWidth=4;c.beginPath();c.moveTo(ex-35,190);c.lineTo(ex+35,245);c.stroke()}
    if(fx.action==='potion'){for(let j=0;j<8;j++)rect(c,hx-28+j*8,245-elapsed*.08+(j%3)*5,3,5,'#98edb0')}
    if(fx.damage){c.font='bold 21px monospace';c.fillStyle='#ffebae';c.fillText('-'+fx.damage,ex-15,180-elapsed*.04)}
   }
   if(counter){c.fillStyle='#fc7e6e';c.font='bold 21px monospace';c.fillText('-'+fx.counter,hx,178-(elapsed-650)*.04);rect(c,0,0,640,360,'#cf54441b')}
  }else{hero(c,320,267,o.hero||'guerrero','down',0,3);fire(c,385,274,t)}
 }
 if(!reduced())raf=requestAnimationFrame(paint);
}
function stop(){cancelAnimationFrame(raf);raf=0;canvas=null;options=null;travel=null}
window.BG2PixelScene={travel(stage,index){travel={stage,index,time:performance.now()};if(reduced()&&canvas)paint(performance.now())},mount(el,o){travel=null;const old=options;if(old?.type==='world'&&o.type==='world'&&old.map===o.map&&(old.x!==o.x||old.y!==o.y))previous={map:old.map,x:old.x*64+32,y:old.y*46+43,at:performance.now()};else previous=null;cancelAnimationFrame(raf);canvas=el;options=o;start=performance.now();if(canvas){canvas.width=640;canvas.height=360;paint(start)}},stop};
})();
