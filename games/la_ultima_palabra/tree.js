export const BRANCHES=[
  {id:'fortress',title:'FORTALEZA',icon:'🛡',nodes:[
    {id:'wall1',title:'Muralla de piedra',cost:20,icon:'▣',desc:'Comienzas con 20 puntos más de muralla.',apply:s=>{s.wall+=20;s.maxWall+=20;}},
    {id:'wall2',title:'Bastión resistente',cost:35,icon:'♜',desc:'Comienzas con otros 25 puntos de muralla.',apply:s=>{s.wall+=25;s.maxWall+=25;}},
    {id:'repair',title:'Taller de albañiles',cost:55,icon:'⚒',desc:'La reparación restaura 30 puntos en vez de 24.',apply:s=>{s.repairBonus=6;}},
    {id:'bulwark',title:'Escudo del reino',cost:80,icon:'♛',desc:'Comienzas con 35 puntos más de muralla.',apply:s=>{s.wall+=35;s.maxWall+=35;}}
  ]},
  {id:'army',title:'EJÉRCITO',icon:'⚔',nodes:[
    {id:'damage1',title:'Acero afilado',cost:20,icon:'⚔',desc:'Tus defensores hacen un 8 % más de daño.',apply:s=>{s.damageMultiplier*=1.08;}},
    {id:'speed1',title:'Cuerno de llamada',cost:35,icon:'♫',desc:'Los edificios reclutan un 10 % más rápido.',apply:s=>{s.spawnMultiplier*=.9;}},
    {id:'damage2',title:'Forja maestra',cost:55,icon:'✦',desc:'Tus defensores hacen otro 12 % más de daño.',apply:s=>{s.damageMultiplier*=1.12;}},
    {id:'speed2',title:'Leva heroica',cost:80,icon:'♞',desc:'Los edificios reclutan otro 12 % más rápido.',apply:s=>{s.spawnMultiplier*=.88;}}
  ]},
  {id:'ink',title:'TINTEROS',icon:'✒',nodes:[
    {id:'start1',title:'Reserva de tinta',cost:20,icon:'◈',desc:'Comienzas con 20 puntos más de tinta.',apply:s=>{s.ink+=20;}},
    {id:'earn1',title:'Pluma diligente',cost:35,icon:'✎',desc:'Cada acierto aporta 2 puntos más de tinta.',apply:s=>{s.bonusInk+=2;}},
    {id:'start2',title:'Arca de escribas',cost:55,icon:'▤',desc:'Comienzas con otros 25 puntos de tinta.',apply:s=>{s.ink+=25;}},
    {id:'earn2',title:'Tinta eterna',cost:80,icon:'✧',desc:'Cada acierto aporta otros 2 puntos de tinta.',apply:s=>{s.bonusInk+=2;}}
  ]}
];
export function earnedSeals(state){return Math.min(20,Math.floor(state.correct/2))+state.wave*10+(state.phase==='won'?20:0);}
export function canBuy(profile,branch,index){const node=branch.nodes[index],owned=profile.tree||{};return !owned[node.id]&&(!index||owned[branch.nodes[index-1].id])&&(profile.seals||0)>=node.cost;}
export function buySkill(profile,id){for(const branch of BRANCHES){const index=branch.nodes.findIndex(n=>n.id===id);if(index<0)continue;if(!canBuy(profile,branch,index))return false;profile.seals-=branch.nodes[index].cost;(profile.tree||={})[id]=true;return true;}return false;}
export function applySkills(state,profile){for(const branch of BRANCHES)for(const node of branch.nodes)if(profile.tree?.[node.id])node.apply(state);}
