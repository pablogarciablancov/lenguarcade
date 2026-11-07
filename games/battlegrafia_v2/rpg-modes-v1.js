(function battlegrafiaRpgModesV1() {
  'use strict';
  if (window.BG2RPGModesV1) return;
  const $=id=>document.getElementById(id);
  const ASSET='https://cdn.jsdelivr.net/gh/pablogarciablancov/BATTLEGRAFIA-FINAL@main/img/';
  const HEROES={
    guerrero:{name:'Guerrero',sprite:'guerrero',maxHp:110,attack:3,maxMana:6,desc:'Más vida y golpes contundentes.'},
    mago:{name:'Mago',sprite:'mago',maxHp:88,attack:1,maxMana:10,desc:'Domina los conjuros de tinta.'},
    explorador:{name:'Explorador',sprite:'ninja',maxHp:96,attack:2,maxMana:8,desc:'Un equilibrio entre velocidad y resistencia.'}
  };
  const ENEMIES={
    tilde:{name:'Esdrulia',file:'esdrulia.webp',hp:65,attack:12,type:'acentuación',xp:18,gold:16},
    sombra:{name:'Lexikon',file:'lexikon.webp',hp:70,attack:11,type:'léxico',xp:18,gold:15},
    espectro:{name:'Espectro agudo',file:'sprite_espectro_agudo.webp',hp:80,attack:14,type:'acentuación',xp:23,gold:20},
    draco:{name:'Diacritik',file:'diacritik.webp',hp:135,attack:16,type:'ortografía',xp:50,gold:45},
    duende:{name:'Puntor',file:'puntor.webp',hp:65,attack:12,type:'puntuación',xp:18,gold:16},
    guardia:{name:'Oxiton',file:'oxiton.webp',hp:93,attack:15,type:'gramática',xp:26,gold:25}
  };
  const QUESTIONS=[
    ['Tildes','¿Qué palabra está correctamente acentuada?',['camion','camión','cámion'],1,'Camión es aguda terminada en -n y lleva tilde.'],
    ['Tildes','¿Cuál es una palabra esdrújula?',['brújula','reloj','papel'],0,'Brújula es esdrújula: la sílaba tónica es la antepenúltima.'],
    ['Tildes','Completa: «A mí ___ gusta leer».',['me','mé','mè'],0,'Me es un pronombre átono y no lleva tilde.'],
    ['Tildes','¿Cuál lleva tilde diacrítica?',['tu (posesivo)','tú (pronombre)','ti (pronombre)'],1,'Tú, pronombre personal, lleva tilde para diferenciarse de tu.'],
    ['Tildes','Elige la escritura correcta.',['arbol','árbol','arból'],1,'Árbol es llana terminada en consonante distinta de -n o -s.'],
    ['Tildes','¿Qué afirmación sobre «café» es correcta?',['Es llana','Es aguda terminada en vocal','Es esdrújula'],1,'Café es aguda y termina en vocal: lleva tilde.'],
    ['Ortografía','¿Qué oración está bien escrita?',['Voy haber una película.','Voy a ver una película.','Voy ha ver una película.'],1,'A ver expresa intención de mirar; haber es un verbo diferente.'],
    ['Ortografía','¿Cuál es la forma correcta?',['tubo (de tener)','tuvo (de tener)','tubo (de tuvo)'],1,'Tuvo es la tercera persona de tener en pretérito perfecto simple.'],
    ['Ortografía','Completa: «___ mucha gente en la plaza».',['Hav ia','Había','Abía'],1,'Había procede del verbo haber y empieza por h.'],
    ['Ortografía','¿Qué palabra está bien escrita?',['excepción','escepción','exepción'],0,'Excepción se escribe con x y con c.'],
    ['Ortografía','¿Qué opción utiliza correctamente «porque»?',['¿Porque vienes?','No fui porque estaba enfermo.','No sé porque vino.'],1,'Porque introduce una causa o explicación.'],
    ['Ortografía','Elige la oración correcta.',['He hecho los deberes.','He echo los deberes.','E hecho los deberes.'],0,'He es de haber y hecho es el participio de hacer.'],
    ['Gramática','En «El gato duerme», ¿qué palabra es un sustantivo?',['El','gato','duerme'],1,'Gato nombra un ser; es un sustantivo.'],
    ['Gramática','¿Qué palabra funciona como adjetivo?',['rápido en «un tren rápido»','corre en «corre rápido»','el en «el tren»'],0,'Rápido modifica al nombre tren y funciona como adjetivo.'],
    ['Gramática','¿Cuál de estas palabras es un determinante?',['ella','aquellos','correr'],1,'Aquellos puede acompañar al nombre y determinarlo.'],
    ['Gramática','¿Cuál de estas formas es infinitivo?',['cantando','canté','cantar'],2,'El infinitivo es una forma no personal del verbo: cantar.'],
    ['Gramática','En «Nosotros estudiamos», ¿cuál es el pronombre?',['Nosotros','estudiamos','ninguno'],0,'Nosotros es un pronombre personal.'],
    ['Gramática','¿Cuál de estas palabras es una preposición?',['desde','muy','pero'],0,'Desde es una preposición. Muy es adverbio y pero conjunción.'],
    ['Literatura','¿Qué subgénero narrativo suele dejar una enseñanza moral?',['fábula','epopeya','leyenda'],0,'La fábula normalmente concluye con una moraleja.'],
    ['Literatura','¿Cuál es un subgénero teatral?',['elegía','tragedia','oda'],1,'La tragedia es un subgénero teatral.'],
    ['Literatura','«Tus ojos son dos luceros» es un ejemplo de...',['metáfora','onomatopeya','polisíndeton'],0,'La metáfora identifica un elemento real con otro figurado.'],
    ['Literatura','«Te lo he dicho mil veces» es...',['hipérbole','antítesis','aliteración'],0,'La hipérbole exagera deliberadamente una realidad.'],
    ['Literatura','¿Qué figura repite palabras al inicio de versos?',['anáfora','metonimia','hipérbaton'],0,'La anáfora consiste en repetir una o varias palabras al comienzo.'],
    ['Literatura','¿Qué subgénero lírico expresa dolor o lamento?',['elegía','comedia','mito'],0,'La elegía expresa habitualmente tristeza o dolor ante una pérdida.'],
    ['Literatura','«El viento susurró» contiene...',['personificación','enumeración','asíndeton'],0,'Atribuir al viento una acción humana es personificación.'],
    ['Ortografía','¿Qué secuencia está escrita correctamente?',['vaca, ventana, vuelo','baca, bentana, buelo','vaca, bentana, buelo'],0,'Vaca, ventana y vuelo respetan las grafías correctas.'],
    ['Tildes','¿Qué palabra no necesita tilde?',['joven','fácil','lápiz'],0,'Joven es llana terminada en -n.'],
    ['Gramática','En «La niña canta», ¿cuál es el verbo?',['La','niña','canta'],2,'Canta expresa la acción y es la forma verbal.'],
    ['Literatura','¿Cuál es un subgénero narrativo tradicional?',['cantar de gesta','drama','canción'],0,'El cantar de gesta es un relato épico en verso.']
  ].map((q,i)=>({id:i,category:q[0],prompt:q[1],options:q[2],answer:q[3],why:q[4]}));
  const MAPS={
    bosque:[
      'TTTTTTTTTT',
      'T..C..E..T',
      'T.TTT..T.T',
      'T.N..E...T',
      'T..V...T.T',
      'T....D...T',
      'TTTTTTTTTT'
    ],
    cripta:[
      '##########',
      '#...#...B#',
      '#.#.E.#..#',
      '#..C...#.#',
      '#.....E..#',
      '#..P.....#',
      '##########'
    ]
  };
  const EXPEDITION=[
    [
      {id:'tilde',label:'Sendero de las tildes',icon:'🌲',desc:'Un esbirro guarda la vereda. Combate directo.',enemy:'tilde'},
      {id:'sombra',label:'Cueva de las palabras',icon:'🕯️',desc:'Un Lexikon acecha entre las rocas.',enemy:'sombra'}
    ],
    [
      {id:'chest',label:'Cofre del cronista',icon:'🎁',desc:'Encuentra monedas y una poción.',event:'chest'},
      {id:'duende',label:'Cruce sombrío',icon:'⚔️',desc:'Más experiencia a cambio de un combate.',enemy:'duende'}
    ],
    [
      {id:'rest',label:'Hoguera del refugio',icon:'🔥',desc:'Restaura vida y energía mágica.',event:'rest'},
      {id:'espectro',label:'Ruinas encantadas',icon:'👻',desc:'Enfrenta a un enemigo más poderoso.',enemy:'espectro'}
    ],
    [
      {id:'treasure',label:'Alijo de un explorador',icon:'💎',desc:'Recompensa segura antes del jefe final.',event:'treasure'},
      {id:'guardia',label:'Guardianes del umbral',icon:'🛡️',desc:'Combate de élite con mayor recompensa.',enemy:'guardia'}
    ],
    [
      {id:'boss',label:'El dragón de la tilde',icon:'🐉',desc:'Derrota a Diacritik y completa la expedición.',enemy:'draco'}
    ]
  ];
  let state=null;
  let currentStorage=null;
  let opened=false;
  let activeMode='expedition';
  let battle=null;
  let note='Elige tu próximo destino.';
  const sessionKey='bg2_rpg_extra_v1_session';
  const hash=s=>{let n=2166136261;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619)}return (n>>>0).toString(36)};
  function storageInfo(){
    const embedded=!!window.__LENGUARCADE_EMBEDDED || (window.parent!==window && new URLSearchParams(location.search).get('lenguarcade')==='1');
    const verified=!!window.__LENGUARCADE_PROFILE_READY && !!window.__LENGUARCADE_PROFILE_KEY;
    if(verified)return {store:localStorage,key:'bg2_rpg_extra_v1_user_'+hash(String(window.__LENGUARCADE_PROFILE_KEY))};
    // Sin un perfil verificado no se reutiliza almacenamiento entre alumnos.
    if(embedded)return {store:null,key:null};
    return {store:sessionStorage,key:sessionKey};
  }
  function fresh(){
    return {
      version:1,
      hero:null,
      inventory:{potions:2,relics:[]},
      mastery:{},recent:[],
      expedition:{stage:0,completed:0,path:[]},
      adventure:{map:'bosque',x:3,y:4,cleared:{},npc:false,boss:false},
      totalBattles:0
    };
  }
  function load(){
    currentStorage=storageInfo();
    try{
      const raw=currentStorage.store?JSON.parse(currentStorage.store.getItem(currentStorage.key)||'null'):null;
      state=raw && raw.version===1 && raw.expedition && raw.adventure && raw.inventory && raw.mastery && Array.isArray(raw.recent) ? raw : fresh();
    }catch(e){state=fresh()}
    if(!state.expedition.path)state.expedition.path=[];
    if(!Array.isArray(state.inventory.relics))state.inventory.relics=[];
    if(!state.adventure.cleared)state.adventure.cleared={};
    battle=null;
  }
  function save(){
    if(!state||!currentStorage?.store)return;
    try{currentStorage.store.setItem(currentStorage.key,JSON.stringify(state))}catch(e){console.warn('[Battlegrafía RPG] No se pudo guardar el prototipo:',e)}
    refreshCards();
  }
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
  const heroImg=()=>ASSET+'heros/sprite_hero_'+(HEROES[state?.hero?.classId]?.sprite||'mago')+'.webp';
  const enemyImg=enemy=>ASSET+'monsters/'+ENEMIES[enemy].file;
  const health=(value,max,cls='')=>`<div class="x-bar ${cls}"><i style="width:${Math.max(0,Math.min(100,Math.round(value/Math.max(1,max)*100)))}%"></i></div>`;
  function addCss(){
    if($('bg2-extra-css'))return;
    const el=document.createElement('link');el.id='bg2-extra-css';el.rel='stylesheet';el.href='./rpg-modes-v1.css?v=2';document.head.appendChild(el);
  }
  function root(){
    let node=$('bg2-extra-root');
    if(node)return node;
    node=document.createElement('section');
    node.id='bg2-extra-root';
    node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');node.setAttribute('aria-label','Nuevos modos RPG de Battlegrafía');
    node.innerHTML=`<div class="x-top"><div><div class="x-sub">BATTLEGRAFÍA · NUEVAS CRÓNICAS</div><div class="x-brand">LAS CRÓNICAS DE LA TINTA</div></div><div class="x-row"><button class="x-btn" data-x="go-modes">MODOS</button><button class="x-btn danger" data-x="close" aria-label="Cerrar y volver a Battlegrafía">✕ SALIR</button></div></div><main class="x-main" id="bg2-extra-content"></main><div class="x-bottom"><span>PROTOTIPO JUGABLE · SIN RECOMPENSAS OFICIALES</span><span id="bg2-extra-saving">Progreso independiente</span></div>`;
    document.body.appendChild(node);
    node.addEventListener('click',handleClick);
    return node;
  }
  let encounter=null;
  let facing='down', movingUntil=0, resolving=false, sceneTimer=0;
  const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas=()=>'<canvas class="x-scene" id="bg2-pixel-scene" aria-label="Escenario pixel art"></canvas>';
  function hud(){
    const h=state.hero;
    return `<header class="x-hud"><div class="x-portrait">${HEROES[h.classId].name.slice(0,1)}</div><div class="x-vitals"><strong>${escape(h.name)} <small>NV. ${h.level}</small></strong><label>PV ${h.hp}/${h.maxHp}${health(h.hp,h.maxHp)}</label><label>PM ${h.mana}/${h.maxMana}${health(h.mana,h.maxMana,'x-mp')}</label></div><div class="x-loot"><b>${h.gold} ORO</b><span>${state.inventory.potions} POCIONES</span><small title="${escape(state.inventory.relics.join(' · '))}">${state.inventory.relics.length} RELIQUIAS · ${h.xp} EXP</small></div></header>`;
  }
  function classSelect(){
    return `<div class="x-screen x-selection">${canvas()}<div class="x-title"><small>LAS CRÓNICAS DE LA TINTA</small><h2>Elige a tu héroe</h2><p>Un mismo destino. Tres maneras de escribirlo.</p></div><div class="x-class-list">${Object.entries(HEROES).map(([id,h])=>`<button class="x-class" data-x="class" data-value="${id}"><span class="x-class-sigil ${id}"></span><strong>${h.name}</strong><small>${h.desc}</small><span>${h.maxHp} PV · ${h.maxMana} PM</span></button>`).join('')}</div></div>`;
  }
  function modes(){
    return `<div class="x-screen x-menu">${canvas()}${hud()}<div class="x-title"><small>BATTLEGRAFÍA RPG</small><h2>Las crónicas de la tinta</h2><p>Dos caminos. Un solo héroe.</p></div><nav class="x-destinations"><button data-x="mode" data-value="expedition"><small>I · CINCO ETAPAS</small><strong>Expediciones</strong><span>Elige tu ruta hacia el dragón</span></button><button data-x="mode" data-value="adventure"><small>II · EXPLORACIÓN</small><strong>Reinos de la Tinta</strong><span>El bosque esconde un antiguo secreto</span></button></nav></div>`;
  }
  function expedition(){
    const e=state.expedition,complete=e.stage>=EXPEDITION.length;
    return `<div class="x-screen x-route">${canvas()}${hud()}<div class="x-location"><small>EXPEDICIONES · ${complete?'COMPLETADA':'ETAPA '+(e.stage+1)+' / 5'}</small><h2>El sendero del cronista</h2></div><div class="x-route-nodes">${EXPEDITION.map((stage,i)=>stage.map((n,j)=>`<button style="left:${(78+i*118)/6.4}%;top:${(stage.length===1?170:j?235:110)/3.6}%" class="x-node ${i===e.stage?'available':i<e.stage&&e.path[i]===n.id?'visited':'locked'}" data-x="choice" data-value="${j}" ${i!==e.stage?'disabled':''} title="${escape(n.desc)}" aria-label="${escape(n.label)}"><span>${escape(n.label)}</span><small>${n.enemy?'COMBATE':'ENCUENTRO'}</small></button>`).join('')).join('')}</div>${complete?'<div class="x-victory"><small>EL REINO RECUERDA TU NOMBRE</small><h2>Expedición completada</h2><button class="x-btn gold" data-x="restart-expedition">NUEVA EXPEDICIÓN</button></div>':''}<div class="x-dialogue"><small>CRÓNICA</small><p>${escape(note)}</p></div></div>`;
  }
  function adventure(){
    const a=state.adventure;
    return `<div class="x-screen x-exploration">${canvas()}${hud()}<div class="x-location"><small>REINOS DE LA TINTA</small><h2>${a.map==='bosque'?'El bosque de las tildes':'La cripta del dragón'}</h2><span>${a.boss?'El reino está a salvo':a.npc?'Encuentra al dragón en la cripta':'Busca al cronista'}</span></div><div class="x-world-controls" role="group" aria-label="Mapa interactivo">${MAPS[a.map].map((row,y)=>Array.from(row).map((code,x)=>`<button data-x="tile" data-xcoord="${x}" data-ycoord="${y}" ${['T','#'].includes(code)?'disabled':''} aria-label="${({N:'Cronista',C:'Cofre',E:'Enemigo',D:'Entrada a la cripta',P:'Salida al bosque',B:'Dragón',V:'Refugio'})[code]||'Camino'} ${x},${y}"></button>`).join('')).join('')}</div><div class="x-pad"><button class="x-btn" data-x="move" data-value="up" aria-label="Arriba">↑</button><button class="x-btn" data-x="move" data-value="left" aria-label="Izquierda">←</button><button class="x-btn" data-x="move" data-value="down" aria-label="Abajo">↓</button><button class="x-btn" data-x="move" data-value="right" aria-label="Derecha">→</button></div><div class="x-dialogue"><small>${a.npc&&note.startsWith('Cronista')?'EL CRONISTA':'CRÓNICA · WASD / FLECHAS'}</small><p>${escape(note)}</p></div></div>`;
  }
  function chooseQuestion(){
    const recent=new Set(state.recent);
    const available=QUESTIONS.filter(q=>!recent.has(q.id));
    const pool=available.length?available:QUESTIONS;
    const weight=q=>{
      const v=state.mastery[q.category]||{correct:0,wrong:0};
      const focus={acentuación:['Tildes'],léxico:['Gramática','Literatura'],ortografía:['Ortografía','Tildes'],puntuación:['Ortografía'],gramática:['Gramática']};
      const related=(focus[ENEMIES[battle?.enemyId]?.type]||[]);
      return (related.includes(q.category)?2.5:1)+Math.min(4,v.wrong/(v.correct+1));
    };
    const total=pool.reduce((n,q)=>n+weight(q),0);
    let r=Math.random()*total;
    const question=pool.find(q=>(r-=weight(q))<=0)||pool[pool.length-1];
    state.recent.push(question.id);
    if(state.recent.length>12)state.recent.shift();
    return question;
  }
  function startBattle(enemyId,context){
    const t=ENEMIES[enemyId];
    if(!t)return;
    battle={enemyId,enemyHp:t.hp,enemyMax:t.hp,context,action:null,question:null,feedback:null,result:null};
    note='¡'+t.name+' te corta el paso!';
    render();
  }
  function battleView(){
    const t=ENEMIES[battle.enemyId],h=state.hero,q=battle.question,f=battle.feedback;
    return `<div class="x-screen x-combat">${canvas()}${hud()}<div class="x-enemy-hud"><small>${escape(t.type).toUpperCase()}</small><strong>${escape(t.name)}</strong><span>${battle.enemyHp} / ${battle.enemyMax} PV</span>${health(battle.enemyHp,battle.enemyMax,'x-enemy')}</div><section class="x-command" aria-live="polite">${resolving?'<div class="x-resolving">La tinta cobra vida…</div>':f?`<div class="x-result"><small>${battle.result==='win'?'VICTORIA':battle.result==='lose'?'DERROTA':'CRÓNICA DEL TURNO'}</small><p>${escape(f)}</p><button class="x-btn gold" data-x="next">${battle.result?'CONTINUAR':'SIGUIENTE TURNO'} →</button></div>`:q?`<div class="x-rune"><small>${escape(q.category)} · ${battle.action==='spell'?'CONJURO':battle.action==='guard'?'BARRERA':'ATAQUE'}</small><h3>${escape(q.prompt)}</h3><div class="x-answers">${q.options.map((v,i)=>`<button class="x-btn" data-x="answer" data-value="${i}"><b>${String.fromCharCode(65+i)}</b> ${escape(v)}</button>`).join('')}</div></div>`:`<div class="x-actions">${[['attack','ATACAR','Golpe de acero'],['guard','DEFENDER','Escudo · +2 PM'],['spell','HECHIZO','3 PM'],['potion','POCIÓN',state.inventory.potions+' disponibles']].map(([id,label,desc])=>`<button class="x-btn" data-x="combat-action" data-value="${id}" ${id==='spell'&&h.mana<3||id==='potion'&&(state.inventory.potions<1||h.hp>=h.maxHp)?'disabled':''}><i class="x-action-icon ${id}"></i><strong>${label}</strong><small>${desc}</small></button>`).join('')}</div>`}</section></div>`;
  }
  function animateTurn(damage,counter){
    battle.fx={damage,counter,action:battle.action,time:performance.now()};
    resolving=true;render();
    clearTimeout(sceneTimer);
    sceneTimer=setTimeout(()=>{resolving=false;if(opened)render()},reducedMotion()?40:1150);
  }
  function applyAction(action){
    if(!battle||battle.feedback||battle.question)return;
    const h=state.hero;
    if(action==='spell'&&h.mana<3)return;
    if(action==='potion'){
      if(state.inventory.potions<1||h.hp>=h.maxHp)return;
      state.inventory.potions--;
      const heal=Math.min(34,h.maxHp-h.hp);
      h.hp+=heal;
      battle.action='potion';
      const counter=retaliation(0);
      battle.feedback=`Recuperas ${heal} PV con una poción. ${battle.result==='lose'?'La criatura te ha derrotado.':'El enemigo aprovecha tu turno para atacar.'}`;
      save();animateTurn(0,counter);return;
    }
    battle.action=action;
    battle.question=chooseQuestion();
    save();render();
  }
  function retaliation(shield){
    const enemy=ENEMIES[battle.enemyId];
    const damage=Math.max(0,enemy.attack+Math.floor(Math.random()*5)-shield);
    const h=state.hero;
    h.hp=Math.max(0,h.hp-damage);
    if(h.hp===0)battle.result='lose';
    return damage;
  }
  function answer(index){
    if(!battle?.question||battle.feedback)return;
    const q=battle.question;
    if(!Number.isInteger(index)||index<0||index>=q.options.length)return;
    const correct=q.answer===index;
    const record=state.mastery[q.category]||(state.mastery[q.category]={correct:0,wrong:0});
    record[correct?'correct':'wrong']++;
    const h=state.hero;
    let dmg=0,shield=0,extra='';
    if(correct){
      if(battle.action==='attack')dmg=18+h.attack*3+h.level*2;
      if(battle.action==='spell'){h.mana-=3;dmg=31+h.attack*2+h.level*2+(state.inventory.relics.includes('Pluma rúnica')?8:0)}
      if(battle.action==='guard'){shield=19+h.level*2+(state.inventory.relics.includes('Broche protector')?6:0);h.mana=Math.min(h.maxMana,h.mana+2)}
    }else if(battle.action==='spell'){h.mana=Math.max(0,h.mana-1)}
    battle.enemyHp=Math.max(0,battle.enemyHp-dmg);
    if(battle.enemyHp===0)battle.result='win';
    let counter=0;
    if(!battle.result)counter=retaliation(shield);
    extra=correct?(battle.action==='guard'?`Tu escudo bloquea ${Math.min(shield,ENEMIES[battle.enemyId].attack+4)} de daño. Recuperas energía.`:`Tu habilidad inflige ${dmg} PV de daño.`):'La habilidad no llega a activarse.';
    battle.feedback=`${correct?'¡Correcto!':'Respuesta incorrecta.'} ${q.why} ${extra} ${counter?'Recibes '+counter+' PV de daño.':'No recibes daño este turno.'}`;
    battle.question=null;
    save();animateTurn(dmg,counter);
  }
  function finishBattle(){
    if(!battle?.feedback)return;
    if(!battle.result){battle.feedback=null;battle.action=null;render();return}
    const won=battle.result==='win',t=ENEMIES[battle.enemyId],context=battle.context;
    if(won){
      gain(t.xp,t.gold);
      state.totalBattles++;
      if(context.kind==='expedition'){
        state.expedition.stage=Math.min(EXPEDITION.length,state.expedition.stage+1);
        if(state.expedition.stage===EXPEDITION.length){
          state.expedition.completed++;
          note='¡Has liberado la guarida y completado una expedición!';
        }else note=`¡${t.name} derrotado! Has conseguido ${t.xp} XP y ${t.gold} monedas del prototipo.`;
      }else{
        state.adventure.cleared[context.id]=true;
        if(context.boss){state.adventure.boss=true;note='¡Diacritik ha sido derrotado! La cripta vuelve a estar en paz.'}
        else note=`Has derrotado a ${t.name} y el camino queda despejado.`;
      }
    }else{
      state.hero.hp=state.hero.maxHp;
      state.hero.mana=state.hero.maxMana;
      if(context.kind==='expedition'){state.expedition.stage=0;state.expedition.path=[];note='La expedición ha terminado. Descansas y puedes intentarla de nuevo.'}
      else{state.adventure.map='bosque';state.adventure.x=3;state.adventure.y=4;note='Has regresado al refugio. Conservas el progreso conseguido.'}
    }
    battle=null;save();render();
  }
  function gain(xp,gold){
    const h=state.hero;
    h.gold+=gold;h.xp+=xp;
    while(h.xp>=h.level*65&&h.level<30){
      h.xp-=h.level*65;h.level++;
      h.maxHp+=8;h.hp=Math.min(h.maxHp,h.hp+18);h.maxMana+=1;h.mana=Math.min(h.maxMana,h.mana+2);
    }
  }
  function chooseRoute(i){
    if(resolving||battle||state.expedition.stage>=EXPEDITION.length)return;
    const chosen=EXPEDITION[state.expedition.stage]?.[i];if(!chosen)return;
    resolving=true;
    window.BG2PixelScene?.travel(state.expedition.stage,i);
    sceneTimer=setTimeout(()=>{resolving=false;if(opened)chooseRouteNow(i)},reducedMotion()?0:450);
  }
  function chooseRouteNow(i){
    if(battle||state.expedition.stage>=EXPEDITION.length)return;
    const option=EXPEDITION[state.expedition.stage]?.[i];
    if(!option)return;
    state.expedition.path.push(option.id);
    if(option.enemy){startBattle(option.enemy,{kind:'expedition'});save();return}
    if(option.event==='chest'){state.inventory.potions++;gain(0,22);note='Encuentras una poción y 22 monedas.'}
    if(option.event==='rest'){state.hero.hp=Math.min(state.hero.maxHp,state.hero.hp+40);state.hero.mana=state.hero.maxMana;note='La hoguera restaura 40 PV y toda tu energía.'}
    if(option.event==='treasure'){
      gain(10,28);
      if(!state.inventory.relics.includes('Pluma rúnica'))state.inventory.relics.push('Pluma rúnica');
      note='Consigues 28 monedas, 10 XP y la Pluma rúnica: tus hechizos infligen 8 PV adicionales.';
    }
    state.expedition.stage++;
    encounter=option.event;
    save();render();
  }
  function startExpeditionAgain(){
    if(state.expedition.stage<EXPEDITION.length)return;
    state.expedition.stage=0;state.expedition.path=[];
    state.hero.hp=state.hero.maxHp;state.hero.mana=state.hero.maxMana;
    note='Una nueva expedición comienza.';
    save();render();
  }
  function move(dx,dy){
    if(battle||activeMode!=='adventure'||performance.now()<movingUntil)return;
    facing=dy<0?'up':dy>0?'down':dx<0?'left':'right';
    movingUntil=performance.now()+160;
    const a=state.adventure,nx=a.x+dx,ny=a.y+dy;
    const from={map:a.map,x:a.x,y:a.y};
    const row=MAPS[a.map][ny],code=row?.[nx];
    if(!code||code==='T'||code==='#'){note='Un obstáculo impide el paso.';render();return}
    a.x=nx;a.y=ny;
    const id=a.map+':'+nx+':'+ny;
    if(code==='N'){a.npc=true;note='Cronista: «Los conocimientos son tu mejor arma. Busca la cripta en el sur y salva el bosque».'}
    else if(code==='V'){a.map='bosque';a.x=3;a.y=4;state.hero.hp=state.hero.maxHp;state.hero.mana=state.hero.maxMana;note='Descansas en el refugio y recuperas toda la vida.'}
    else if(code==='D'){a.map='cripta';a.x=3;a.y=5;note='Has entrado en la cripta. ¡Cuidado con los guardianes!'}
    else if(code==='P'){a.map='bosque';a.x=5;a.y=5;note='Regresas al bosque con tus hallazgos.'}
    else if(code==='C'&&!a.cleared[id]){
      a.cleared[id]=true;state.inventory.potions++;gain(0,18);
      if(a.map==='cripta'&&!state.inventory.relics.includes('Broche protector'))state.inventory.relics.push('Broche protector');
      note=a.map==='cripta'?'¡Broche protector obtenido! Tus defensas bloquean 6 PV más.':'¡Cofre encontrado! Una poción y 18 monedas.';
    }
    else if(code==='E'&&!a.cleared[id]){startBattle(a.map==='cripta'?'guardia':'tilde',{kind:'adventure',id,from});save();return}
    else if(code==='B'&&!a.cleared[id]){startBattle('draco',{kind:'adventure',id,boss:true,from});save();return}
    else note=a.map==='cripta'?'Los muros guardan antiguas palabras olvidadas.':'Las hojas susurran historias del reino.';
    save();render();
  }
  function moveTo(x,y){
    const a=state.adventure;
    const dist=Math.abs(x-a.x)+Math.abs(y-a.y);
    if(dist!==1){note='Selecciona una casilla contigua o utiliza las flechas.';render();return}
    move(x-a.x,y-a.y);
  }
  function render(){
    if(!opened||!state)return;
    const view=$('bg2-extra-content');if(!view)return;
    view.innerHTML=!state.hero?classSelect():battle?battleView():activeMode==='expedition'?expedition():activeMode==='adventure'?adventure():modes();
    if(encounter){
      view.querySelector('.x-screen')?.insertAdjacentHTML('beforeend',`<section class="x-encounter"><small>${encounter==='rest'?'EL REFUGIO DEL CRONISTA':'BOTÍN RECUPERADO'}</small><h2>${encounter==='rest'?'Junto a la hoguera':'Un tesoro recuperado'}</h2><p>${escape(note)}</p><button class="x-btn gold" data-x="dismiss-encounter">CONTINUAR →</button></section>`);
    }
    const scene=$('bg2-pixel-scene');
    window.BG2PixelScene?.mount(scene,battle?{type:'battle',hero:state.hero.classId,enemy:battle.enemyId,crypt:activeMode==='adventure'&&state.adventure.map==='cripta',fx:battle.fx}:activeMode==='adventure'&&state.hero?{type:'world',hero:state.hero.classId,...state.adventure,layout:MAPS[state.adventure.map],dir:facing}:activeMode==='expedition'&&state.hero?{type:'route',hero:state.hero.classId,stages:EXPEDITION,...state.expedition}:{type:'menu',hero:state.hero?.classId});
    const label=$('bg2-extra-saving');
    if(label)label.textContent=!currentStorage?.store?'Perfil aún no disponible: sin guardar':currentStorage.store===localStorage?'Guardado local por perfil (sin sincronizar)':'Guardado temporal de esta pestaña';
  }
  function retreat(){
    clearTimeout(sceneTimer);resolving=false;encounter=null;
    if(!battle)return;
    if(battle.context.kind==='expedition')state.expedition.path.pop();
    if(battle.context.kind==='adventure'){
      const from=battle.context.from;
      if(from){state.adventure.map=from.map;state.adventure.x=from.x;state.adventure.y=from.y}
      else{state.adventure.map='bosque';state.adventure.x=3;state.adventure.y=4}
    }
    clearTimeout(sceneTimer);resolving=false;
    battle=null;note='Te has retirado del combate sin recibir recompensas.';
    save();
  }
  function handleClick(event){
    const button=event.target.closest('[data-x]');
    if(!button)return;
    const action=button.dataset.x,value=button.dataset.value;
    if(resolving&&action!=='close'&&action!=='go-modes')return;
    if(action==='close')return close();
    if(action==='dismiss-encounter'){encounter=null;render();return}
    if(action==='go-modes'){retreat();activeMode='menu';note='Elige un modo para continuar.';render();return}
    if(action==='class'&&HEROES[value]&&!state.hero){
      const h=HEROES[value];const p=window.player||window.BG?.player||{};
      state.hero={classId:value,name:String(p.name||'Aventurero').slice(0,30),level:1,xp:0,gold:0,attack:h.attack,maxHp:h.maxHp,hp:h.maxHp,maxMana:h.maxMana,mana:h.maxMana};
      note='Tu héroe está preparado. ¡Comienza la aventura!';save();render();return;
    }
    if(!state?.hero)return;
    if(action==='mode'&&['expedition','adventure'].includes(value)){retreat();activeMode=value;note=value==='expedition'?'Decide tu ruta para empezar.':'¡Explora el reino!';render();return}
    if(action==='choice'){chooseRoute(Number(value));return}
    if(action==='combat-action'){applyAction(value);return}
    if(action==='answer'){answer(Number(value));return}
    if(action==='next'){finishBattle();return}
    if(action==='restart-expedition'){startExpeditionAgain();return}
    if(action==='move'){const dirs={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};if(dirs[value])move(...dirs[value]);return}
    if(action==='tile'){moveTo(Number(button.dataset.xcoord),Number(button.dataset.ycoord));return}
  }
  function open(mode='menu'){
    load();encounter=null;
    const modal=root();
    opened=true;
    activeMode=['expedition','adventure'].includes(mode)?mode:'menu';
    note='El conocimiento será tu mejor arma.';
    modal.classList.add('open');
    render();
  }
  function close(){
    if(!opened)return;
    clearTimeout(sceneTimer);resolving=false;window.BG2PixelScene?.stop();
    retreat();save();opened=false;
    $('bg2-extra-root')?.classList.remove('open');
    $('bg2-mode-archive')?.classList.remove('open');
  }
  function refreshCards(){
    for(const mode of ['expedition','adventure']){
      const el=$('bg2-extra-status-'+mode);
      if(el&&state){
        el.textContent=mode==='expedition'?`${state.expedition.completed} completadas · Etapa ${Math.min(state.expedition.stage+1,5)}/5`:state.adventure.boss?'Dragón derrotado':'Exploración disponible';
      }
    }
  }
  function appendModeCards(){
    const grid=$('bg2-mode-archive-grid');
    if(!grid||grid.querySelector('[data-bg2-extra-launch]'))return;
    for(const [mode,label,emoji,desc] of [
      ['expedition','EXPEDICIONES','⚔️','Rutas alternativas, combates por turnos y jefe final.'],
      ['adventure','REINOS DE LA TINTA','🗺️','Explora un mapa, encuentra secretos y supera una mazmorra.']
    ]){
      const card=document.createElement('article');
      card.className='bg2-extra-mode-card';
      card.innerHTML=`<small>NUEVO MODO RPG · PROTOTIPO</small><h3>${emoji} ${label}</h3><p>${desc}</p><small id="bg2-extra-status-${mode}">Progreso independiente</small><button type="button" data-bg2-extra-launch="${mode}">JUGAR</button>`;
      grid.appendChild(card);
    }
    if(!grid.dataset.bg2ExtraBound){
      grid.dataset.bg2ExtraBound='1';
      grid.addEventListener('click',event=>{
        const button=event.target.closest('[data-bg2-extra-launch]');
        if(button)open(button.dataset.bg2ExtraLaunch);
      });
    }
  }
  let archiveObserved=false;
  function watchArchive(){
    const grid=$('bg2-mode-archive-grid');
    if(!grid||archiveObserved)return false;
    archiveObserved=true;
    const observer=new MutationObserver(()=>{
      if(!grid.querySelector('[data-bg2-extra-launch]'))requestAnimationFrame(appendModeCards);
    });
    observer.observe(grid,{childList:true});
    appendModeCards();
    return true;
  }
  function mountHubButton(){
    const hub=$('bg2-rpg-hub');
    const nav=hub?.querySelector('.bg2-rpg-menu');
    if(!nav||hub.querySelector('[data-bg2-extra-hub]'))return false;
    const b=document.createElement('button');
    b.type='button';b.className='bg2-rpg-action bg2-extra-hub-button';
    b.dataset.bg2ExtraHub='1';
    b.innerHTML='<span class="bg2-cursor">⚔</span><span><b>NUEVOS MODOS RPG</b><small>Expediciones y Reinos de la Tinta · prototipo jugable</small></span>';
    b.addEventListener('click',()=>open('menu'));
    nav.insertBefore(b,nav.children[1]||null);
    return true;
  }
  function onKey(event){
    if(!opened)return;
    if(event.key==='Escape'){event.preventDefault();close();return}
    if(battle||activeMode!=='adventure'||!state?.hero)return;
    const dirs={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],W:[0,-1],s:[0,1],S:[0,1],a:[-1,0],A:[-1,0],d:[1,0],D:[1,0]};
    if(dirs[event.key]){event.preventDefault();move(...dirs[event.key])}
  }
  function boot(){
    addCss();root();
    document.addEventListener('keydown',onKey);
    mountHubButton();
    watchArchive();
    // El archivo de partidas se crea al pulsar «PARTIDAS»; observar solo esa interacción.
    document.addEventListener('click',event=>{
      if(event.target.closest('[data-action="games"]'))requestAnimationFrame(watchArchive);
    },true);
    setTimeout(mountHubButton,450);
  }
  window.BG2RPGModesV1={open,close,questionCount:QUESTIONS.length,modeIds:['expedition','adventure']};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();