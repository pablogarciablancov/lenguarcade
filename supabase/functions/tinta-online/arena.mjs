import {Game,content,bank} from './game.mjs';
const shared=new Game(bank).bank;
export class ArenaError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const fail=(s,status=400)=>{throw new ArenaError(s,status)};
const copy=x=>JSON.parse(JSON.stringify(x));
function game(hero,seed,duel){if(!content.classes.some(c=>c.id===hero))fail('Clase desconocida.');const e=new Game();e.bank=shared;e.start(hero,'training','short',seed);e.enter(0);const r=e.run;r.hp=r.maxHp=duel?100:e.hero.hp;r.energy=0;r.shield=0;r.board=e.newBoard();r.enemy={...copy(content.bosses[0]),hp:100000,maxHp:100000,shield:0,fire:0,ice:0,storm:0,poison:0,weakness:0,stun:0,phase:1,kind:'arena',weak:duel?null:'verb'};return e;}
function restore(p){const e=new Game();e.bank=shared;e.profile=copy(p.game);return e;}
export function createRoom(mode,name,hero,token,seed){if(!['coop','duel'].includes(mode))fail('Modo desconocido.');const e=game(hero,seed,mode==='duel');return {mode,status:'waiting',round:1,seed,players:[{token,name,hero,game:e.snapshot(),ready:false}],boss:{...copy(content.bosses[0]),hp:240,maxHp:240,shield:0,fire:0,ice:0,storm:0,poison:0,weakness:0,stun:0,phase:1},log:['Sala creada. Esperando al segundo escriba.'],history:[],winner:null};}
export function joinRoom(room,name,hero,token){if(room.status!=='waiting'||room.players.length!==1)fail('Esta sala ya está completa.',409);room.players.push({token,name,hero,game:game(hero,room.seed,room.mode==='duel').snapshot(),ready:false});room.status='battle';room.log=['Dos escribas reunidos. Elegid vuestra primera acción.'];return room;}
export function view(room,token){const me=room.players.findIndex(p=>p.token===token);if(me<0)fail('No tienes acceso a esta sala.',403);return {...room,seed:undefined,players:room.players.map((p,i)=>{const visible=i!==me&&p.ready&&p.before?p.before:p.game;return ({name:p.name,hero:p.hero,ready:p.ready,hp:visible.run.hp,maxHp:visible.run.maxHp,shield:visible.run.shield,energy:visible.run.energy,...(i===me?{board:p.game.run.board}:{} )});}),me,history:room.history.slice(-6)};}
export function submit(room,token,input){const i=room.players.findIndex(p=>p.token===token);if(i<0)fail('Jugador desconocido.',403);if(room.status!=='battle')fail('La sala no está en combate.',409);const player=room.players[i];if(input.round!==room.round)fail('El turno ya ha cambiado. Actualiza la sala.',409);if(player.ready)return room;if(!['attack','defend','special','pass'].includes(input.action))fail('Acción desconocida.');
 const e=restore(player),r=e.run;let result={damage:0,shield:0,fx:{},word:''};const before=r.enemy.hp,oldShield=r.shield;const ally=room.mode==='coop'&&input.target==='ally';if(ally)r.shield=0;
 if(input.action==='pass'){r.energy=Math.min(10,r.energy+1);r.shield=Math.min(65,r.shield+3);result.shield=r.shield-(ally?0:oldShield);}
 else if(input.action==='special'){if(!e.special(true))fail('Habilidad no disponible.');result.damage=before-r.enemy.hp;result.shield=r.shield-(ally?0:oldShield);}
 else {const w=String(input.word||'').normalize('NFC').toLowerCase();if(w.length>9)fail('Palabra demasiado larga.');result=e.play(w,input.action,undefined,true);if(!result.ok)fail(result.message);result.damage=before-r.enemy.hp;}
 if(ally)r.shield=oldShield;player.before=copy(player.game);r.pendingTurn=false;
 const fx={};for(const k of ['fire','ice','storm','poison','weakness','stun']){fx[k]=r.enemy[k]||0;r.enemy[k]=0;}
 r.enemy.hp=100000;player.game=e.snapshot();player.ready=true;player.order={action:input.action,word:result.word||'',damage:result.damage||0,shield:result.shield||0,fx,target:input.target==='ally'?'ally':'self',counter:r.counter||0};
 if(room.players.every(p=>p.ready))resolve(room);return room;}
function hurt(r,n){const absorbed=Math.min(r.shield,n);r.shield-=absorbed;r.hp=Math.max(0,r.hp-(n-absorbed));return {absorbed,lost:n-absorbed};}
function resolve(room){const ps=room.players,rs=ps.map(p=>p.game.run),orders=ps.map(p=>p.order),log=[];const frame=(label,actor)=>({label,actor,players:rs.map(r=>({hp:r.hp,maxHp:r.maxHp,shield:r.shield,energy:r.energy})),boss:copy(room.boss)});room.timeline=[frame('DEFENSAS PREPARADAS','none')];for(let i=0;i<2;i++){const o=orders[i];log.push(`${ps[i].name}: ${o.action==='defend'?'defiende':o.action==='special'?'habilidad':o.action==='pass'?'concentra energía':'ataca'}${o.word?' con '+o.word.toUpperCase():''}.`);if(room.mode==='coop'&&o.target==='ally'&&o.shield){rs[1-i].shield=Math.min(65,rs[1-i].shield+o.shield);log.push(`${ps[i].name} protege a ${ps[1-i].name}.`);}}
 if(room.mode==='duel'){
 const first=(room.round-1)%2;for(const i of [first,1-first]){if(rs[i].hp<=0)continue;const o=orders[i],other=rs[1-i];let dmg=o.damage;for(const k of ['fire','storm','poison'])dmg+=o.fx[k]||0;dmg=Math.max(0,dmg-(orders[1-i].fx.ice||0)*3-(orders[1-i].fx.weakness||0));if(orders[1-i].fx.stun)dmg=Math.floor(dmg/2);const hit=hurt(other,Math.min(65,dmg));log.push(`${ps[i].name}: ${hit.lost} daño, ${hit.absorbed} bloqueado.`);if(dmg>0&&!hit.lost&&orders[1-i].counter)hurt(rs[i],orders[1-i].counter);room.timeline.push(frame('ACCIÓN DE '+ps[i].name,i));}
 if(rs.some(r=>r.hp<=0)){room.status='finished';room.winner=rs.every(r=>r.hp<=0)?'draw':rs[0].hp>0?0:1;}
 }else{
 const b=room.boss;for(const o of orders){b.hp=Math.max(0,b.hp-o.damage);for(const [k,n]of Object.entries(o.fx))b[k]=Math.min(12,(b[k]||0)+n);}
 let dot=Math.min(15,b.fire+b.poison+b.storm);if(b.fire&&b.ice){dot+=7;log.push('¡Choque térmico compartido!');}if(b.poison&&b.storm){dot+=5;log.push('¡Tinta conductora compartida!');}b.hp=Math.max(0,b.hp-dot);if(dot)log.push(`Estados combinados: ${dot} daño.`);
 room.timeline.push(frame('ATAQUE DEL EQUIPO','team'));if(b.hp<=0){room.status='finished';room.winner='team';}else{const aoe=room.round%3===0,targets=aoe?[0,1]:[(room.round-1)%2];const phase=b.hp<=80?3:b.hp<=160?2:1;b.phase=phase;const damage=Math.max(0,(aoe?12:16)+2*(phase-1)-b.ice*3-b.weakness);
 if(b.stun)log.push('El jefe pierde su acción por aturdimiento.');else for(const i of targets){const h=hurt(rs[i],damage);log.push(`Jefe → ${ps[i].name}: ${h.lost} daño, ${h.absorbed} bloqueado.`);if(damage&&!h.lost&&orders[i].counter)b.hp=Math.max(0,b.hp-orders[i].counter);}
 if(b.hp<=0){room.status='finished';room.winner='team';}else if(rs.some(r=>r.hp<=0)){room.status='finished';room.winner='boss';}}
 room.timeline.push(frame('RESPUESTA DEL JEFE','boss'));for(const k of ['fire','ice','storm','poison','weakness','stun'])b[k]=Math.max(0,b[k]-1);
 }
 room.log=log;room.history.push({round:room.round,log});room.history=room.history.slice(-12);room.round++;
 for(let i=0;i<2;i++){ps[i].ready=false;delete ps[i].order;delete ps[i].before;rs[i].counter=0;rs[i].turn=room.round;rs[i].enemy.hp=100000;}
}
export function validateName(v){const s=String(v||'').trim().replace(/[<>]/g,'').slice(0,24);if(s.length<2)fail('Escribe un alias de al menos dos letras.');return s;}
