export const BUILDINGS={
  guard:{name:'Cuartel',icon:'⚔',cost:24,rate:6.8,hp:55,damage:9,speed:33,color:'#70c1a7',detail:'Espadachines · frenan la horda'},
  bow:{name:'Atalaya',icon:'⌁',cost:34,rate:8.5,hp:27,damage:7,speed:34,range:155,color:'#f1c471',detail:'Arqueros · atacan desde lejos'},
  mage:{name:'Scriptorium',icon:'✧',cost:48,rate:11,hp:24,damage:13,speed:33,range:142,splash:44,color:'#b99aed',detail:'Magos · daño en grupo'}
};
export const WAVES=[{count:11,period:3.4,hp:28,speed:16},{count:16,period:2.9,hp:35,speed:19},{count:21,period:2.5,hp:40,speed:21},{count:26,period:2.25,hp:44,speed:22}];
export const UPGRADES=[
  {id:'walls',title:'Piedra reforzada',detail:'+25 de vida a la muralla',apply:s=>{s.maxWall+=25;s.wall=Math.min(s.maxWall,s.wall+25);}},
  {id:'forge',title:'Forja del alba',detail:'+20 % de daño para los defensores',apply:s=>{s.damageMultiplier*=1.2;}},
  {id:'ink',title:'Tinteros llenos',detail:'+30 tinta y +2 por acierto',apply:s=>{s.ink+=30;s.bonusInk+=2;}},
  {id:'haste',title:'Campana de guardia',detail:'Recluta un 18 % más rápido',apply:s=>{s.spawnMultiplier*=.82;}}
];
export const FIELD={minX:215,maxX:700,minY:157,maxY:474};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function createState(){return {phase:'prep',wave:0,ink:70,wall:100,maxWall:100,buildings:[],allies:[],enemies:[],projectiles:[],particles:[],spawned:0,spawnClock:0,time:0,correct:0,errors:0,streak:0,damageMultiplier:1,spawnMultiplier:1,bonusInk:0,repairBonus:0,kills:0,seconds:0,lastEvent:'',upgrades:[]};}
export function price(type,level=0){return level?Math.round(BUILDINGS[type].cost*(.75+level*.5)):BUILDINGS[type].cost;}
export function buildingAt(s,x,y){return s.buildings.find(b=>dist(b,{x,y})<34);}
export function build(s,type,x,y){if(!['prep','battle'].includes(s.phase)||!BUILDINGS[type]||!Number.isFinite(x)||!Number.isFinite(y))return false;
  const existing=buildingAt(s,x,y);if(existing&&existing.type!==type)return false;
  if(!existing&&(x<FIELD.minX||x>FIELD.maxX||y<FIELD.minY||y>FIELD.maxY||s.buildings.length>=16))return false;
  const cost=price(type,existing?.level||0);if(s.ink<cost)return false;s.ink-=cost;
  if(existing)existing.level++;else s.buildings.push({type,x:Math.round(x),y:Math.round(y),level:1,clock:0});return true;}
export function repair(s){if(s.wall>=s.maxWall||s.ink<20||['won','lost'].includes(s.phase))return false;s.ink-=20;s.wall=Math.min(s.maxWall,s.wall+24+(s.repairBonus||0));return true;}
export function startWave(s){if(s.phase!=='prep'||s.wave>=WAVES.length)return false;s.phase='battle';s.spawned=0;s.spawnClock=0;s.time=0;return true;}
export function answer(s,correct){if(['won','lost'].includes(s.phase))return 0;if(correct){s.correct++;s.streak++;const earned=12+s.bonusInk+Math.min(6,Math.floor(s.streak/3)*2);s.ink+=earned;return earned;}s.errors++;s.streak=0;return 0;}
export function selectUpgrade(s,id){if(s.phase!=='upgrade')return false;const u=UPGRADES.find(x=>x.id===id);if(!u)return false;u.apply(s);s.upgrades.push(id);s.phase='prep';return true;}
function makeEnemy(s){const w=WAVES[s.wave],boss=s.wave===3&&s.spawned===w.count-1,fast=s.spawned%6===4,tank=s.spawned%8===7;
  const hp=boss?330:tank?w.hp*2.1:w.hp;
  return {x:980+(s.spawned%3)*20,y:171+((s.spawned*137+s.wave*73)%275),hp,maxHp:hp,speed:boss?10:fast?w.speed*1.5:w.speed,damage:boss?9:tank?5:3,attack:0,boss,fast,tank,flash:0};}
function hitEnemy(s,e,amount){e.hp-=amount;e.flash=.12;if(e.hp<=0){s.kills++;s.ink+=e.boss?20:2;s.particles.push({x:e.x,y:e.y,life:.6,color:e.boss?'#e7a2f9':'#b783bd'});}}
function shot(s,a,e){s.projectiles.push({x:a.x+8,y:a.y-23,tx:e.x,ty:e.y-27,life:.24,damage:a.damage,kind:a.type,enemy:e,splash:a.type==='mage'?44:0});}
export function step(s,dt){if(s.phase!=='battle'||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.1);s.seconds+=dt;s.time+=dt;
  const w=WAVES[s.wave];s.spawnClock+=dt;
  while(s.spawned<w.count&&s.spawnClock>=(s.spawned===0?1.4:w.period)){s.spawnClock-=(s.spawned===0?1.4:w.period);s.enemies.push(makeEnemy(s));s.spawned++;}
  for(const b of s.buildings){b.clock+=dt;const rate=BUILDINGS[b.type].rate*s.spawnMultiplier/(1+(b.level-1)*.23);
    if(b.clock>=rate&&s.allies.length<90){b.clock%=rate;const cfg=BUILDINGS[b.type];s.allies.push({type:b.type,x:b.x+38,y:b.y+8,hp:cfg.hp,maxHp:cfg.hp,damage:cfg.damage*s.damageMultiplier*(1+(b.level-1)*.25),speed:cfg.speed,attack:0,flash:0});}}
  for(const a of s.allies){a.flash=Math.max(0,a.flash-dt);a.attack=Math.max(0,a.attack-dt);
    const e=s.enemies.filter(x=>x.hp>0).reduce((best,x)=>!best||dist(a,x)<dist(a,best)?x:best,null);
    const range=BUILDINGS[a.type].range||23;if(e){const d=dist(a,e);if(d<=range){if(a.attack<=0){a.attack=a.type==='guard'?.85:a.type==='bow'?1.35:1.7;if(a.type==='guard')hitEnemy(s,e,a.damage);else shot(s,a,e);}}
      else{a.x+=((e.x-a.x)/d)*a.speed*dt;a.y+=((e.y-a.y)/d)*a.speed*dt;}}
  }
  for(const e of s.enemies){if(e.hp<=0)continue;e.flash=Math.max(0,e.flash-dt);e.attack=Math.max(0,e.attack-dt);
    const block=s.allies.filter(a=>a.hp>0&&dist(a,e)<21).sort((a,b)=>dist(a,e)-dist(b,e))[0];
    if(block){if(e.attack<=0){e.attack=e.boss?.85:1.25;block.hp-=e.damage;block.flash=.16;}}
    else e.x-=e.speed*dt;
    if(e.x<191){s.wall=Math.max(0,s.wall-(e.boss?24:e.tank?8:5));e.hp=0;s.particles.push({x:193,y:e.y,life:.7,color:'#fcbb74'});}}
  for(const p of s.projectiles){p.life-=dt;if(p.life<=0&&p.enemy.hp>0){hitEnemy(s,p.enemy,p.damage);if(p.splash)for(const other of s.enemies){if(other!==p.enemy&&other.hp>0&&dist(other,p.enemy)<p.splash)hitEnemy(s,other,p.damage*.55);}}}
  s.projectiles=s.projectiles.filter(p=>p.life>0);s.enemies=s.enemies.filter(e=>e.hp>0);s.allies=s.allies.filter(a=>a.hp>0);for(const p of s.particles)p.life-=dt;s.particles=s.particles.filter(p=>p.life>0);
  if(s.wall<=0){s.phase='lost';s.lastEvent='La muralla ha caído';return;}
  if(s.spawned===w.count&&s.enemies.length===0){s.wave++;s.lastEvent=`Oleada ${s.wave} superada`;if(s.wave===WAVES.length){s.phase='won';return;}
    s.ink+=28;s.allies=[];s.projectiles=[];s.phase='upgrade';}
}
