export const BUILDINGS = {
  guard: {name:'Cuartel', icon:'⚔', cost:24, rate:6.8, hp:55, damage:9, speed:27, color:'#70c1a7', detail:'Espadachines · frenan la horda'},
  bow: {name:'Atalaya', icon:'⌁', cost:34, rate:8.5, hp:27, damage:7, speed:29, range:145, color:'#f1c471', detail:'Arqueros · atacan desde lejos'},
  mage: {name:'Scriptorium', icon:'✧', cost:48, rate:11, hp:24, damage:13, speed:27, range:130, splash:32, color:'#b99aed', detail:'Magos · daño en grupo'}
};
export const LANES = [203,307,411];
export const WAVES = [
  {count:11, period:3.4, hp:28, speed:15},
  {count:16, period:2.9, hp:35, speed:18},
  {count:21, period:2.5, hp:40, speed:20},
  {count:26, period:2.25, hp:44, speed:21}
];
export const UPGRADES = [
  {id:'walls', title:'Piedra reforzada', detail:'+25 de vida a la muralla', apply:s=>{s.maxWall+=25;s.wall=Math.min(s.maxWall,s.wall+25);}},
  {id:'forge', title:'Forja del alba', detail:'+20 % de daño para los defensores', apply:s=>{s.damageMultiplier*=1.2;}},
  {id:'ink', title:'Tinteros llenos', detail:'+30 tinta y +2 por acierto', apply:s=>{s.ink+=30;s.bonusInk+=2;}},
  {id:'haste', title:'Campana de guardia', detail:'Los edificios reclutan un 18 % más rápido', apply:s=>{s.spawnMultiplier*=.82;}}
];

export function createState(){return {
  phase:'prep', wave:0, ink:70, wall:100, maxWall:100, buildings:[], allies:[], enemies:[], projectiles:[], particles:[],
  spawned:0, spawnClock:0, time:0, correct:0, errors:0, streak:0, damageMultiplier:1, spawnMultiplier:1, bonusInk:0,
  kills:0, seconds:0, lastEvent:'', upgrades:[]
};}
export function price(type,level=0){return level ? Math.round(BUILDINGS[type].cost*(.75+level*.5)) : BUILDINGS[type].cost;}
export function build(s,type,lane){if(s.phase==='won'||s.phase==='lost'||!BUILDINGS[type]||!Number.isInteger(lane)||lane<0||lane>=3)return false;
  const b=s.buildings.find(x=>x.type===type&&x.lane===lane),cost=price(type,b?.level||0);
  if(s.ink<cost)return false;s.ink-=cost;if(b)b.level++;else s.buildings.push({type,lane,level:1,clock:0});return true;}
export function repair(s){if(s.wall>=s.maxWall||s.ink<20||['won','lost'].includes(s.phase))return false;s.ink-=20;s.wall=Math.min(s.maxWall,s.wall+24);return true;}
export function startWave(s){if(s.phase!=='prep'||s.wave>=WAVES.length)return false;s.phase='battle';s.spawned=0;s.spawnClock=0;s.time=0;return true;}
export function answer(s,correct){if(['won','lost'].includes(s.phase))return 0;
  if(correct){s.correct++;s.streak++;const earned=12+s.bonusInk+Math.min(6,Math.floor(s.streak/3)*2);s.ink+=earned;return earned;}
  s.errors++;s.streak=0;return 0;
}
export function selectUpgrade(s,id){if(s.phase!=='upgrade')return false;const u=UPGRADES.find(x=>x.id===id);if(!u)return false;u.apply(s);s.upgrades.push(id);s.phase='prep';return true;}
function makeEnemy(s){const w=WAVES[s.wave],boss=s.wave===3&&s.spawned===w.count-1,lane=s.spawned%3;
  const fast=s.spawned%6===4,tank=s.spawned%8===7;
  return {x:960+((s.spawned%3)*20),lane,hp:(boss?330:tank?w.hp*2.1:w.hp),maxHp:(boss?330:tank?w.hp*2.1:w.hp),speed:boss?9:fast?w.speed*1.5:w.speed,damage:boss?9:tank?5:3,attack:0,boss,fast,tank,flash:0};}
function rangedShot(s,ally,target){s.projectiles.push({x:ally.x+7,y:LANES[ally.lane]-17,tx:target.x,ty:LANES[target.lane]-15,life:.24,damage:ally.damage,kind:ally.type,enemy:target,lane:ally.lane,splash:ally.type==='mage'?32:0});}
function hitEnemy(s,e,amount){e.hp-=amount;e.flash=.12;if(e.hp<=0){s.kills++;s.ink+=e.boss?20:2;s.particles.push({x:e.x,y:LANES[e.lane],life:.6,color:e.boss?'#e7a2f9':'#b783bd'});}}
export function step(s,dt){if(s.phase!=='battle'||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.1);s.seconds+=dt;s.time+=dt;
  const w=WAVES[s.wave];s.spawnClock+=dt;
  while(s.spawned<w.count&&s.spawnClock>=(s.spawned===0?1.4:w.period)){
    s.spawnClock-=(s.spawned===0?1.4:w.period);s.enemies.push(makeEnemy(s));s.spawned++;
  }
  for(const b of s.buildings){b.clock+=dt;const rate=BUILDINGS[b.type].rate*s.spawnMultiplier/(1+(b.level-1)*.23);
    if(b.clock>=rate&&s.allies.length<90){b.clock%=rate;const c=BUILDINGS[b.type];s.allies.push({type:b.type,lane:b.lane,x:258,hp:c.hp,maxHp:c.hp,damage:c.damage*s.damageMultiplier*(1+(b.level-1)*.25),speed:c.speed,attack:0,flash:0});}
  }
  for(const a of s.allies){a.flash=Math.max(0,a.flash-dt);a.attack=Math.max(0,a.attack-dt);
    const targets=s.enemies.filter(e=>e.hp>0&&e.lane===a.lane&&e.x>=a.x-12);
    const e=targets.reduce((best,x)=>!best||x.x<best.x?x:best,null);
    const range=BUILDINGS[a.type].range||19;
    if(e&&e.x-a.x<=range){if(a.attack<=0){a.attack=a.type==='guard'?.85:a.type==='bow'?1.35:1.7;if(a.type==='guard')hitEnemy(s,e,a.damage);else rangedShot(s,a,e);}}
    else a.x=Math.min(892,a.x+a.speed*dt);
  }
  for(const e of s.enemies){if(e.hp<=0)continue;e.flash=Math.max(0,e.flash-dt);e.attack=Math.max(0,e.attack-dt);
    const block=s.allies.filter(a=>a.hp>0&&a.lane===e.lane&&Math.abs(a.x-e.x)<19).sort((a,b)=>b.x-a.x)[0];
    if(block){if(e.attack<=0){e.attack=e.boss?.85:1.25;block.hp-=e.damage;block.flash=.16;}}
    else e.x-=e.speed*dt;
    if(e.x<209){s.wall=Math.max(0,s.wall-(e.boss?24:e.tank?8:5));e.hp=0;s.particles.push({x:205,y:LANES[e.lane],life:.7,color:'#fcbb74'});}
  }
  for(const p of s.projectiles){p.life-=dt;if(p.life<=0){const e=p.enemy;if(e.hp>0){hitEnemy(s,e,p.damage);if(p.splash)for(const other of s.enemies){if(other!==e&&other.hp>0&&other.lane===p.lane&&Math.abs(other.x-e.x)<p.splash)hitEnemy(s,other,p.damage*.55);}}}}
  s.projectiles=s.projectiles.filter(p=>p.life>0);s.enemies=s.enemies.filter(e=>e.hp>0);s.allies=s.allies.filter(a=>a.hp>0);for(const p of s.particles)p.life-=dt;s.particles=s.particles.filter(p=>p.life>0);
  if(s.wall<=0){s.phase='lost';s.lastEvent='La muralla ha caído';return;}
  if(s.spawned===w.count&&s.enemies.length===0){s.wave++;s.lastEvent=`Oleada ${s.wave} superada`;if(s.wave===WAVES.length){s.phase='won';return;}
    s.ink+=28;s.allies=[];s.projectiles=[];s.phase='upgrade';}
}
