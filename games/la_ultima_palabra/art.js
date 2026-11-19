import {BUILDINGS,WAVES,FIELD,buildingAt} from './core.js?v=2';

// The battlefield and six original painted units are self-contained game assets.
// Every atlas cell has generous transparent margins, so adjacent sprites never bleed.
const field=new Image(),atlas=new Image();field.src='assets/battlefield.webp';atlas.src='assets/units.webp';
const columns={guard:0,bow:1,mage:2,ghoul:3,brute:4,boss:5};
const colors={guard:'#5dd2c4',bow:'#c7e2a7',mage:'#b9d9f3'};
function box(c,x,y,w,h,fill,stroke=null,line=2){c.fillStyle=fill;c.fillRect(x,y,w,h);if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.strokeRect(x,y,w,h);}}
function path(c,points,fill,stroke='#242532',line=3){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
function oval(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
function wall(c,t){
  // Painterly fortification sits over the clean play field, left of the armies.
  c.save();c.shadowColor='#24251ca0';c.shadowBlur=14;c.shadowOffsetX=8;c.shadowOffsetY=13;
  path(c,[[0,120],[178,120],[178,540],[0,540]],'#506470');c.restore();
  const brick=['#71848a','#9aa6a3','#657c83','#819295'];
  for(let y=132,row=0;y<540;y+=27,row++){for(let x=-16+(row%2)*24;x<178;x+=48){box(c,x,y,46,25,brick[(row+Math.floor(x/48)+16)%4],'#344653',1);box(c,x+4,y+5,13,2,'#bdc1b1');}}
  box(c,0,118,186,13,'#c1c6ba','#3c5260',3);
  for(let x=0;x<188;x+=30)box(c,x,100,19,27,'#8e9fa4','#344957',3);
  tower(c,8,66);tower(c,123,67);
  // Arched gate and illuminated library emblem.
  oval(c,93,367,46,79,'#25313a');box(c,47,364,92,176,'#27353f','#c5aa72',5);
  box(c,57,368,72,172,'#314250','#17252f',4);box(c,91,371,3,165,'#c8aa6c');
  box(c,73,426,6,7,'#f5d984','#463c36',1);box(c,108,426,6,7,'#f5d984','#463c36',1);
  path(c,[[67,160],[120,160],[120,210],[94,229],[67,210]],'#1f6475','#edc878',4);
  path(c,[[75,170],[112,170],[112,204],[94,218],[75,204]],'#24576a','#263945',2);
  box(c,91,181,6,27,'#f5db91');box(c,80,190,29,5,'#f5db91');
  for(let i=0;i<9;i++){const x=14+i*17;box(c,x,248,10,4,'#c8b77f');}
  // A tiny banner drifting above the castle.
  box(c,91,69,4,38,'#e4c27b');path(c,[[94,71],[129,74],[120,87],[94,84]],'#3f8190','#e6ca83',2);
  for(let i=0;i<3;i++)oval(c,195+i*10,394,4,3,'#695348');
}
function tower(c,x,y){
  c.save();c.shadowColor='#1a2b32a0';c.shadowBlur=7;c.shadowOffsetX=4;
  box(c,x,y+29,54,151,'#70858a','#263a49',5);c.restore();
  for(let r=0;r<6;r++){box(c,x+6,y+39+r*23,41,2,'#b7b8a6');box(c,x+20+(r%2)*16,y+40+r*23,2,19,'#3e5b65');}
  path(c,[[x-8,y+32],[x+26,y-5],[x+65,y+32]],'#255471','#1c3545',5);
  path(c,[[x-3,y+27],[x+26,y+1],[x+59,y+27]],'#397895',null);
  box(c,x+19,y+70,16,31,'#273c4b','#c2ad77',4);box(c,x+24,y+76,6,15,'#ffcc78');
  for(let k=0;k<3;k++)box(c,x+k*19,y+23,14,14,'#9eada9','#334b56',3);
}
function building(c,b,t){
  const x=b.x-19,y=b.y-61;
  oval(c,x+19,y+59,31,10,'#352c2566');
  path(c,[[x-5,y+9],[x+18,y-9],[x+44,y+10],[x+42,y+58],[x-3,y+58]],b.type==='mage'?'#81809b':'#7b8885','#2e3c42',4);
  box(c,x+3,y+15,32,39,b.type==='guard'?'#a29a81':b.type==='bow'?'#8b6b51':'#777aa0','#31353c',3);
  path(c,[[x-7,y+15],[x+18,y-14],[x+48,y+15]],b.type==='guard'?'#326375':b.type==='bow'?'#b46f42':'#595b8b','#30343d',5);
  for(let i=0;i<4;i++)c.beginPath(),c.moveTo(x+i*9,y+7),c.lineTo(x+16+i*9,y-8),c.strokeStyle='#e5ba77',c.lineWidth=2,c.stroke();
  box(c,x+12,y+29,14,25,'#253c48','#dab578',2);
  const icon=b.type==='guard'?'⚔':b.type==='bow'?'⌁':'✧';c.font='bold 19px Georgia';c.textAlign='center';c.fillStyle='#f9dc97';c.fillText(icon,x+19,y+49);
  if(b.type==='mage'){oval(c,x+19,y-19,7+Math.sin(t*3)*2,7,'#a7fcde');oval(c,x+19,y-19,3,4,'#fff');}
  box(c,x-2,y+62,40,6,'#2a363a','#e1c28b',1);
  const fraction=Math.min(1,b.clock/(BUILDINGS[b.type].rate/(1+(b.level-1)*.23)));box(c,x,y+64,36*fraction,3,'#93d9b3');
  for(let i=0;i<Math.min(b.level,4);i++)oval(c,x+5+i*9,y+55,2,2,'#f7d792');
}
function unit(c,x,y,kind,t,flash=0,scale=1,shadow=1){
  const index=columns[kind],col=index%3,row=Math.floor(index/3);
  const bob=Math.sin(t*5+x*.15)*2;
  c.save();oval(c,x,y+1,26*scale*shadow,6*scale*shadow,'#29241e75');
  c.translate(Math.round(x),Math.round(y+bob));
  c.rotate(Math.sin(t*4+x)*.025);
  const size=78*scale;
  if(atlas.complete&&atlas.naturalWidth){c.drawImage(atlas,col*512,row*512,512,512,-size/2,-size,size,size);}
  else {box(c,-11*scale,-34*scale,22*scale,34*scale,kind==='ghoul'?'#694669':kind==='brute'?'#65445a':'#347789','#26272b',2);oval(c,0,-30*scale,8*scale,8*scale,'#f4dfbd');}
  if(flash>0){c.globalCompositeOperation='source-atop';c.globalAlpha=.55;box(c,-size/2,-size,size,size,'#fff7e7');}
  c.restore();
}
function squad(c,entity,t,enemy=false){
  const kind=entity.boss?'boss':enemy?(entity.tank?'brute':'ghoul'):entity.type;
  const y=entity.y,x=entity.x;
  if(entity.boss){unit(c,x,y,kind,t,entity.flash,1.65);return;}
  const size=entity.tank?1.13:1;
  // Each simulation unit represents a little squad; the tactical rules remain unchanged.
  unit(c,x+(enemy?25:-25),y-16,kind,t+.7,entity.flash,size*.68,.8);
  unit(c,x+(enemy?25:-25),y+14,kind,t+1.3,entity.flash,size*.73,.82);
  unit(c,x,y,kind,t,entity.flash,size);
}
function projectile(c,p){const f=1-p.life/.24,x=p.x+(p.tx-p.x)*f,y=p.y+(p.ty-p.y)*f;
  c.save();c.shadowBlur=15;c.shadowColor=p.kind==='mage'?'#69f6df':'#ffdd99';oval(c,x,y,p.kind==='mage'?11:7,p.kind==='mage'?7:3,p.kind==='mage'?'#77f9d8':'#fff1ba');oval(c,x-5,y,3,2,'#fff');c.restore();}
export function drawScene(c,state,t,placement=null){
  c.clearRect(0,0,960,540);c.imageSmoothingEnabled=true;
  if(field.complete&&field.naturalWidth)c.drawImage(field,0,0,960,540);
  else {box(c,0,0,960,540,'#6c7442');box(c,0,164,960,350,'#9b784c');}
  // Free movement takes place across the entire visible battleground.
  c.fillStyle='#1c251b23';c.fillRect(175,0,26,540);
  wall(c,t);
  for(const b of state.buildings)building(c,b,t);
  const actors=[...state.allies.map(a=>({a,enemy:false})),...state.enemies.map(a=>({a,enemy:true}))].sort((a,b)=>a.a.y-b.a.y||a.a.x-b.a.x);
  for(const {a,enemy} of actors){squad(c,a,t,enemy);if(enemy&&a.hp<a.maxHp){const y=a.y-(a.boss?102:58);box(c,a.x-23,y,46,5,'#332e38','#2a292b',1);box(c,a.x-21,y+1,42*a.hp/a.maxHp,3,'#ca5a75');}}
  for(const p of state.projectiles)projectile(c,p);
  for(const p of state.particles){oval(c,p.x,p.y-28,13*(p.life/.6),5*(p.life/.6),p.color);}
  if(placement&&['prep','battle'].includes(state.phase)){
    const {x,y,type}=placement,existing=buildingAt(state,x,y),valid=existing?existing.type===type:x>=FIELD.minX&&x<=FIELD.maxX&&y>=FIELD.minY&&y<=FIELD.maxY&&state.buildings.length<16;
    c.save();c.setLineDash([8,5]);c.lineWidth=3;c.strokeStyle=valid?'#c8f6b6':'#ef8c83';c.beginPath();c.arc(x,y,35,0,Math.PI*2);c.stroke();c.setLineDash([]);
    oval(c,x,y,24,8,valid?'#78f0b477':'#ec796e77');c.restore();
  }
  if(state.phase==='battle'){
    box(c,780,17,166,33,'#1a3341de','#b7ab78',3);box(c,791,28,143,8,'#18232b');box(c,791,28,143*state.spawned/WAVES[state.wave].count,8,'#f3cb75');
    c.font='bold 12px system-ui';c.fillStyle='#fff3cc';c.textAlign='left';c.fillText('LA HORDA',791,23);
  }
}
