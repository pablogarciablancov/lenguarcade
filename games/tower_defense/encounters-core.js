/* Tactical enemy rules, independent of rendering and frame timing. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GuardianEncounters=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const types={
  runner:{base:'fast',name:'Corredor de Pergamino',category:'verbos',badge:'VER',hpFactor:.95,speedFactor:1,shieldLayers:1,color:'#f5b35f',firstWave:3,role:'Acelera durante 2,5 s al cruzar cada bifurcación. En mapas sin ramificaciones mantiene su velocidad normal.',counter:'Ralentízalo o coloca al guardián después de la bifurcación.',signal:'Flechas ámbar durante la carrera.'},
  protector:{base:'armored',name:'Protector del Códice',category:'lexico',badge:'SEM',hpFactor:.8,speedFactor:.95,shieldLayers:2,color:'#7be2ed',firstWave:5,role:'Reduce un 35 % el daño recibido por otros monstruos sin escudo en un radio de 46 pasos. No se protege a sí mismo; varias auras no se acumulan.',counter:'Rompe sus dos capas y derrótalo para desactivar su aura.',signal:'Aura cian y un rombo sobre los aliados protegidos.'},
  devourer:{base:'swarm',name:'Devoratinta',category:'ortografia',badge:'ORT',hpFactor:1.8,speedFactor:.9,shieldLayers:1,color:'#c89bf5',firstWave:6,role:'Si llega a la biblioteca, roba hasta 18 de tinta, además de quitar vida.',counter:'Intercéptalo con el guardián antes de que alcance la biblioteca.',signal:'Un tintero violeta y el aviso «−18 tinta».'}
 };
 const replacements={2:[['fast','runner',2]],4:[['basic','protector',1]],5:[['fast','devourer',2]],6:[['swarm','runner',2]],7:[['armored','protector',1],['fast','devourer',2]],8:[['basic','runner',2],['armored','protector',1]],9:[['swarm','runner',2],['swarm','devourer',1],['swarm','protector',1]]};
 function waves(original){return original.map((groups,index)=>{const out=groups.map(g=>({...g}));for(const [from,to,n]of replacements[index]||[]){const g=out.find(g=>g.t===from);if(!g||g.n<n)continue;g.n-=n;out.push({t:to,n,gap:g.gap});}return out.filter(g=>g.n>0);});}
 function forks(routes){const nodes=new Map();for(const route of routes||[])for(let i=0;i<route.points.length-1;i++){const p=route.points[i],next=route.points[i+1],key=p.x+','+p.y;if(!nodes.has(key))nodes.set(key,new Set());nodes.get(key).add(next.x+','+next.y);}return new Set([...nodes].filter(([,out])=>out.size>1).map(([key])=>key));}
 function protectedBy(enemy,enemies){if(!enemy.alive||enemy.shieldActive)return null;return enemies.find(e=>e!==enemy&&e.type==='protector'&&e.alive&&Math.hypot(e.x-enemy.x,e.y-enemy.y)<=46)||null;}
 function stolen(ink){return Math.min(18,Math.max(0,Math.floor(Number(ink)||0)));}
 return {types,waves,forks,protectedBy,stolen};
});
