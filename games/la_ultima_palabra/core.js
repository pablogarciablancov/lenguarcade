export const BUILDINGS={
  guard:{name:'Cuartel',icon:'⚔',cost:24,rate:6.8,hp:55,damage:9,speed:33,color:'#70c1a7',detail:'Espadachines · frenan la horda'},
  bow:{name:'Atalaya',icon:'⌁',cost:34,rate:8.5,hp:27,damage:7,speed:34,range:155,color:'#f1c471',detail:'Arqueros · atacan desde lejos'},
  mage:{name:'Scriptorium',icon:'✧',cost:48,rate:11,hp:24,damage:13,speed:33,range:142,splash:44,color:'#b99aed',detail:'Magos · daño en grupo'}
};
export const WAVES=[{count:20,period:2.15,hp:43,speed:34},{count:28,period:1.9,hp:57,speed:39},{count:40,period:1.55,hp:86,speed:45},{count:50,period:1.4,hp:106,speed:50}];
// Every specialist has a readable counter. Damage multipliers are applied to
// actual combat, including arrows and the mage's splash attack.
export const WEAKNESSES={hound:{bow:1.75,guard:.8,mage:.9},shield:{mage:1.9,bow:.55,guard:.9},warlock:{guard:1.85,mage:.6,bow:1},brute:{mage:1.35,bow:.8,guard:1}};
export const damageAgainst=(kind,defender)=>WEAKNESSES[kind]?.[defender]||1;
export const UPGRADES=[
  {id:'walls',title:'Piedra reforzada',detail:'+25 de vida a la muralla',apply:s=>{s.maxWall+=25;s.wall=Math.min(s.maxWall,s.wall+25);}},
  {id:'forge',title:'Forja del alba',detail:'+20 % de daño para los defensores',apply:s=>{s.damageMultiplier*=1.2;}},
  {id:'ink',title:'Tinteros llenos',detail:'+3 tinta por cada respuesta acertada',apply:s=>{s.bonusInk+=3;}},
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
function makeEnemy(s){const w=WAVES[s.wave],i=s.spawned,boss=s.wave===3&&i===w.count-1;
  const kind=boss?'boss':i%11===9&&s.wave>0?'warlock':i%8===7?'shield':i%7===5?'brute':i%4===3?'hound':'ghoul';
  const hp=Math.round(w.hp*({boss:11,warlock:1.15,shield:2.3,brute:2.1,hound:.78,ghoul:1}[kind]));
  const speed=w.speed*({boss:.58,warlock:.85,shield:.72,brute:.7,hound:1.8,ghoul:1}[kind]);
  return {kind,x:935+(i%3)*18,y:171+((i*137+s.wave*73)%275),hp,maxHp:hp,speed,damage:({boss:18,shield:14,brute:15,hound:9,warlock:9,ghoul:10}[kind]),attack:0,boss,fast:kind==='hound',tank:kind==='shield'||kind==='brute',flash:0};}
function hitEnemy(s,e,amount,source='guard'){e.hp-=amount*damageAgainst(e.kind,source);e.flash=.12;if(e.hp<=0){s.kills++;s.particles.push({x:e.x,y:e.y,life:.6,color:e.boss?'#e7a2f9':'#b783bd'});}}
function shot(s,a,e){s.projectiles.push({x:a.x+8,y:a.y-23,tx:e.x,ty:e.y-27,life:.24,damage:a.damage,kind:a.type,enemy:e,splash:a.type==='mage'?44:0});}
export function step(s,dt){if(s.phase!=='battle'||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.1);s.seconds+=dt;s.time+=dt;
  const w=WAVES[s.wave];s.spawnClock+=dt;
  while(s.spawned<w.count&&s.spawnClock>=(s.spawned===0?1.4:w.period)){s.spawnClock-=(s.spawned===0?1.4:w.period);s.enemies.push(makeEnemy(s));s.spawned++;}
  for(const b of s.buildings){b.clock+=dt;const rate=BUILDINGS[b.type].rate*s.spawnMultiplier/(1+(b.level-1)*.23);
    if(b.clock>=rate&&s.allies.length<90){b.clock%=rate;const cfg=BUILDINGS[b.type];s.allies.push({type:b.type,x:b.x+38,y:b.y+8,hp:cfg.hp,maxHp:cfg.hp,damage:cfg.damage*s.damageMultiplier*(1+(b.level-1)*.25),speed:cfg.speed,attack:0,flash:0});}}
  for(const a of s.allies){a.flash=Math.max(0,a.flash-dt);a.attack=Math.max(0,a.attack-dt);
    const e=s.enemies.filter(x=>x.hp>0).reduce((best,x)=>!best||dist(a,x)<dist(a,best)?x:best,null);
    const range=BUILDINGS[a.type].range||23;if(e){const d=dist(a,e);if(d<=range){if(a.attack<=0){a.attack=a.type==='guard'?.85:a.type==='bow'?1.35:1.7;if(a.type==='guard')hitEnemy(s,e,a.damage,a.type);else shot(s,a,e);}}
      else{a.x+=((e.x-a.x)/d)*a.speed*dt;a.y+=((e.y-a.y)/d)*a.speed*dt;}}
  }
  for(const e of s.enemies){if(e.hp<=0)continue;e.flash=Math.max(0,e.flash-dt);e.attack=Math.max(0,e.attack-dt);
    if(e.kind==='warlock')for(const other of s.enemies){if(other.hp>0&&other!==e&&dist(other,e)<95)other.hp=Math.min(other.maxHp,other.hp+2.2*dt);}
    const reach=e.kind==='warlock'?100:21;
    const block=s.allies.filter(a=>a.hp>0&&dist(a,e)<reach).sort((a,b)=>dist(a,e)-dist(b,e))[0];
    if(block){if(e.attack<=0){e.attack=e.boss?.85:e.kind==='warlock'?1.6:1.15;block.hp-=e.damage;block.flash=.16;}}
    else e.x-=e.speed*dt;
    if(e.x<191){s.wall=Math.max(0,s.wall-({boss:30,shield:12,brute:12,hound:8,warlock:7,ghoul:6}[e.kind]||5));e.hp=0;s.particles.push({x:193,y:e.y,life:.7,color:'#fcbb74'});}}
  for(const p of s.projectiles){p.life-=dt;if(p.life<=0&&p.enemy.hp>0){hitEnemy(s,p.enemy,p.damage,p.kind);if(p.splash)for(const other of s.enemies){if(other!==p.enemy&&other.hp>0&&dist(other,p.enemy)<p.splash)hitEnemy(s,other,p.damage*.55,p.kind);}}}
  s.projectiles=s.projectiles.filter(p=>p.life>0);s.enemies=s.enemies.filter(e=>e.hp>0);s.allies=s.allies.filter(a=>a.hp>0);for(const p of s.particles)p.life-=dt;s.particles=s.particles.filter(p=>p.life>0);
  if(s.wall<=0){s.phase='lost';s.lastEvent='La muralla ha caído';return;}
  if(s.spawned===w.count&&s.enemies.length===0){s.wave++;s.lastEvent=`Oleada ${s.wave} superada`;if(s.wave===WAVES.length){s.phase='won';return;}
    s.allies=[];s.projectiles=[];s.phase='upgrade';}
}
