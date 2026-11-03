import {awardExpedition} from './expedition.js';
export function fresh(){return {version:1,stars:{},challenges:{},coins:0,runes:3,items:{eye:2,amulet:1,boots:1},skins:['teal'],skin:'teal',achievements:[],records:{},xp:0,completedRuns:[],settings:{volume:.3,quality:'high',motion:true}};}
export function normalize(raw){const p=fresh();if(!raw||raw.version!==1)return p;for(const k of ['stars','challenges','items','records','settings'])p[k]={...p[k],...(raw[k]||{})};for(const k of ['coins','runes','xp'])p[k]=Math.max(0,Number(raw[k])||0);p.skins=Array.isArray(raw.skins)?raw.skins:['teal'];p.skin=p.skins.includes(raw.skin)?raw.skin:'teal';p.achievements=Array.isArray(raw.achievements)?raw.achievements:[];p.completedRuns=Array.isArray(raw.completedRuns)?raw.completedRuns.slice(-100):[];return p;}
export function reward(profile,run){
 if(profile.completedRuns.includes(run.id))return {stars:profile.stars[run.level]||1,coins:0,xp:0};
 const stars=run.errors===0&&run.hints===0?3:run.errors<=1&&run.hints<=2?2:1;
 const previous=profile.stars[run.level]||0,improvement=Math.max(0,stars-previous);
 // La recompensa permanente depende de primera victoria y mejoras; repetir no genera XP ilimitada.
 const expedition=awardExpedition(profile,run);
 const xp=(previous?0:30+run.level*2)+improvement*5,coins=(previous?0:18)+improvement*6+expedition.bonusCoins;
 profile.stars[run.level]=Math.max(previous,stars);profile.xp+=xp;profile.coins+=coins;
 if(improvement)profile.runes+=1;
 const old=profile.records[run.level];if(!old||run.elapsed<old.time)profile.records[run.level]={time:Math.round(run.elapsed),errors:run.errors};
 const add=id=>{if(!profile.achievements.includes(id))profile.achievements.push(id);};
 add('first');if(stars===3)add('perfect');if(run.level>=10&&!run.hints)add('deduction');if(Object.keys(profile.stars).length>=10)add('half');if(Object.keys(profile.stars).length>=20)add('temple');
 profile.completedRuns.push(run.id);profile.completedRuns=profile.completedRuns.slice(-100);return {stars,xp,coins,...expedition};
}
export const SHOP=[{id:'eye',name:'Ojo del sabio',cost:18,desc:'Comprueba una piedra cercana. Cuenta como ayuda.'},{id:'amulet',name:'Amuleto del regreso',cost:30,desc:'Evita perder una vida al caer. El error sí cuenta.'},{id:'rune',name:'Runa de la verdad',cost:20,desc:'Revela una pista sobre la regla.'},{id:'boots',name:'Botas del explorador',cost:24,desc:'Salta sobre una piedra hasta otra a dos pasos. Un uso.'},{id:'ember',name:'Capa del alba',cost:45,desc:'Atuendo ámbar con estela dorada.'},{id:'violet',name:'Capa del crepúsculo',cost:45,desc:'Atuendo violeta con estela de cristal.'}];
export function buy(p,id){const item=SHOP.find(i=>i.id===id);if(!item||p.coins<item.cost||p.skins.includes(id))return false;p.coins-=item.cost;if(id==='rune')p.runes++;else if(['ember','violet'].includes(id)){p.skins.push(id);p.skin=id;}else p.items[id]=(p.items[id]||0)+1;return true;}
