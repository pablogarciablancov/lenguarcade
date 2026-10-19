/* Pure rules shared by the game and its checks. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GuardianStrategy=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const branches={
    corrector:[
      {id:'rafaga',name:'Ráfaga arcana',cost:70,description:'Reduce un 40 % el tiempo entre disparos; pierde un 20 % de daño y un 10 % de alcance.',multipliers:{fireRate:.6,damage:.8,range:.9}},
      {id:'pulso',name:'Pulso de poder',cost:70,description:'Un 65 % más de daño; tarda un 35 % más entre disparos.',multipliers:{damage:1.65,fireRate:1.35}}
    ],
    tildador:[
      {id:'vigia',name:'Ojo del archivo',cost:90,description:'Un 30 % más de alcance; pierde un 15 % de daño.',multipliers:{range:1.3,damage:.85}},
      {id:'sentencia',name:'Sentencia rúnica',cost:90,description:'Un 55 % más de daño; pierde un 18 % de alcance y tarda un 15 % más entre disparos.',multipliers:{damage:1.55,range:.82,fireRate:1.15}}
    ],
    gramatico:[
      {id:'expansion',name:'Tinta expansiva',cost:100,description:'Un 50 % más de radio de explosión; pierde un 25 % de daño.',multipliers:{splash:1.5,damage:.75}},
      {id:'concentracion',name:'Sello concentrado',cost:100,description:'Un 60 % más de daño; reduce a la mitad el radio de explosión.',multipliers:{damage:1.6,splash:.5}}
    ],
    sintactico:[
      {id:'atadura',name:'Atadura del tiempo',cost:110,description:'Reduce la velocidad del objetivo al 38 %, durante 0,9 s, con escudo o sin él; pierde un 20 % de daño y debilita menos.',multipliers:{damage:.8},values:{slow:.38,weaken:1.1}},
      {id:'fractura',name:'Marca de fragilidad',cost:110,description:'Tras romper el escudo con Lengua, el objetivo recibe un 65 % más de daño durante 2,6 s; ralentiza menos (al 85 %).',values:{weaken:1.65,slow:.85}}
    ]
  };
  function option(type,id){return (branches[type]||[]).find(o=>o.id===id)||null;}
  function stats(base,type,id){const out={...base},o=option(type,id);if(!o)return out;for(const [key,value] of Object.entries(o.multipliers||{}))if(Number.isFinite(out[key]))out[key]*=value;return Object.assign(out,o.values||{});}
  function canChoose(tower,id,ink){const o=option(tower?.type,id);return !!o&&tower.level>=2&&!tower.specialization&&Number.isFinite(ink)&&ink>=o.cost;}
  function wave(groups,types){const counts=new Map();for(const g of groups||[])if(types[g.t])counts.set(g.t,(counts.get(g.t)||0)+g.n);const enemies=[...counts].map(([type,count])=>({type,count,...types[type]}));return {enemies,total:enemies.reduce((n,e)=>n+e.count,0),layers:enemies.reduce((n,e)=>n+e.count*(e.shieldLayers||1),0)};}
  return {branches,option,stats,canChoose,wave};
});
