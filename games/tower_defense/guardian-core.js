/* Guardian combat rules; shared by browser and deterministic gameplay checks. */
(function(root){
  'use strict';
  const TYPES={
    custodio:{name:'Custodio del Tomo',role:'Bloquea hasta 2 enemigos',cost:0,hp:180,damage:18,range:30,rate:1.05,color:'#7db8ff',block:2},
    arquera:{name:'Arquera de los Márgenes',role:'Flechas rápidas de largo alcance',cost:90,hp:90,damage:13,range:94,rate:.65,color:'#91df87'},
    mago:{name:'Mago del Tintero',role:'Descargas de tinta en un área',cost:150,hp:85,damage:23,range:72,rate:1.65,color:'#c6a0ff',splash:25},
    vigia:{name:'Vigía de las Páginas',role:'Su farol ralentiza a los monstruos',cost:120,hp:120,damage:11,range:65,rate:1.1,color:'#8de9e2',slow:.58}
  };
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function roster(raw){
    const owned=[...new Set(['custodio',...(Array.isArray(raw?.owned)?raw.owned:[]).filter(id=>TYPES[id])])];
    return {coins:Math.max(0,Math.floor(Number(raw?.coins)||0)),owned,selected:owned.includes(raw?.selected)?raw.selected:'custodio'};
  }
  function recruit(state,id){
    const cfg=TYPES[id];if(!cfg||state.owned.includes(id)||state.coins<cfg.cost)return false;
    state.coins-=cfg.cost;state.owned.push(id);state.selected=id;return true;
  }
  function pathPoint(p,path,width=540,height=320){
    let best=null;
    for(let i=0;i<path.length-1;i++){
      const a=path[i],b=path[i+1],dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;
      const t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0;
      const q={x:a.x+t*dx,y:a.y+t*dy,index:i+t};
      if(q.x<12||q.x>width-12||q.y<18||q.y>height-10)continue;
      const d=distance(p,q);if(!best||d<best.distance)best={...q,distance:d};
    }
    return best&&best.distance<=15?best:null;
  }
  class Fighter{
    constructor(id,p){this.id=TYPES[id]?id:'custodio';this.cfg=TYPES[this.id];this.x=p.x;this.y=p.y;this.hp=this.cfg.hp;this.cooldown=0;this.moveCooldown=0;this.recovery=0;this.hit=0;this.attack=0;this.age=0;this.facing=1;this.target=null;}
    blocked(enemies){return this.cfg.block&&!this.recovery?enemies.filter(e=>e.alive&&distance(e,this)<=18).sort((a,b)=>b.progressScore()-a.progressScore()).slice(0,this.cfg.block):[];}
    shieldTarget(enemies){return this.recovery?null:enemies.filter(e=>e.alive&&e.shieldActive&&distance(e,this)<=this.cfg.range).sort((a,b)=>b.progressScore()-a.progressScore())[0]||null;}
    update(dt,enemies,now,shot){
      this.age+=dt;this.moveCooldown=Math.max(0,this.moveCooldown-dt);this.attack=Math.max(0,this.attack-dt);this.hit=Math.max(0,this.hit-dt);
      if(this.recovery){this.recovery=Math.max(0,this.recovery-dt);if(!this.recovery)this.hp=this.cfg.hp;return;}
      const attackers=enemies.filter(e=>e.alive&&distance(e,this)<=19).slice(0,3);
      if(attackers.length){this.hp-=dt*attackers.reduce((n,e)=>n+4*(e.cfg?.dmg||1),0);this.hit=.15;}
      if(this.hp<=0){this.hp=0;this.recovery=12;this.target=null;return;}
      this.cooldown-=dt;if(this.cooldown>0)return;
      const candidates=enemies.filter(e=>e.alive&&distance(e,this)<=this.cfg.range).sort((a,b)=>Number(a.shieldActive)-Number(b.shieldActive)||b.progressScore()-a.progressScore());
      const target=candidates[0];this.target=target||null;if(!target)return;
      this.facing=target.x<this.x?-1:1;this.attack=.4;this.cooldown=this.cfg.rate;
      shot?.(this,target);
      if(this.cfg.slow){target.slowFactor=Math.min(target.slowFactor,this.cfg.slow);target.slowUntil=Math.max(target.slowUntil,now+1800);}
      if(target.shieldActive)return;
      const victims=this.cfg.splash?enemies.filter(e=>e.alive&&!e.shieldActive&&distance(e,target)<=this.cfg.splash):[target];
      for(const e of victims)e.takeDamage(this.cfg.damage,null);
    }
    snapshot(){return {id:this.id,x:this.x,y:this.y,hp:this.hp,recovery:this.recovery,moveCooldown:this.moveCooldown};}
  }
  root.GuardianCore={TYPES,distance,roster,recruit,pathPoint,Fighter};
  if(typeof module!=='undefined')module.exports=root.GuardianCore;
})(typeof globalThis!=='undefined'?globalThis:this);
