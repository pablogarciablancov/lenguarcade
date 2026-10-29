(function(root){
'use strict';
const C=root.InkContent;
const clone=x=>JSON.parse(JSON.stringify(x));
const base=w=>w.normalize('NFC').toLowerCase().replace(/[áéíóúü]/g,c=>({'á':'a','é':'e','í':'i','ó':'o','ú':'u','ü':'u'}[c]));
const clean=w=>String(w).normalize('NFC').toLowerCase();
const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0||1;};
const makeProfile=()=>({version:1,revision:0,updated:0,coins:0,cards:C.cards.slice(0,10).map(c=>c.id),deck:C.cards.slice(0,4).map(c=>c.id),cosmetics:[],look:'default',stats:{},words:{},achievements:[],relics:[],wonClasses:[],days:[],daily:[],settings:{reduced:false,sound:false,level:1,text:1},run:null,outbox:[]});
const bag='aaaáeéeiiíoóouuurnnstlcdbmgphvfyqñzj'.replace(/[áéíóú]/g,c=>base(c));
const card=id=>C.cards.find(c=>c.id===id),relic=id=>C.relics.find(c=>c.id===id);
class Game{
 constructor(bank=[]){this.bank=new Set(bank.map(clean));for(const w of Object.keys(C.lexicon))this.bank.add(w);this.profile=makeProfile();this.error='';}
 rand(){const r=this.profile.run;r.rng=(Math.imul(r.rng,1664525)+1013904223)>>>0;return r.rng/4294967296;}
 pick(a){return a[Math.floor(this.rand()*a.length)];}
 shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(this.rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
 get run(){return this.profile.run;}
 get hero(){return C.classes.find(c=>c.id===this.run?.hero)||C.classes[0];}
 stat(k,n=1){if(this.run?.mode==='training')return;this.profile.stats[k]=(this.profile.stats[k]||0)+n;}
 check(w){w=clean(w);return /^[a-záéíóúüñ]{2,9}$/.test(w)&&this.bank.has(w);}
 analysis(w){return C.lexicon[clean(w)]||{word:clean(w),categories:[],features:[]};}
 match(w,board=this.run?.board||[]){const need=[...base(w)],used=[]; // tiles can include QU / CH, each used once
 function solve(left,ids){if(!left.length)return ids;for(let i=0;i<board.length;i++){if(ids.includes(i))continue;const s=base(board[i].char);if(left.join('').startsWith(s)){const found=solve(left.slice(s.length),[...ids,i]);if(found)return found;}}return null;}
 // A word is an ordered selection of non-adjacent tiles. Search tile choices, including digraphs.
 return solve(need,used);
 }
 solutions(board=this.run?.board||[],filter=()=>true){return Object.keys(C.lexicon).filter(w=>w.length>=2&&w.length<=9&&filter(this.analysis(w))&&this.match(w,board));}
 start(hero='guardaplumas',mode='adventure',length='short',seed=Date.now(),date=new Date().toISOString().slice(0,10)){
 if(this.run&&!this.run.done)throw Error('Termina o retira la expedición activa antes de iniciar otra.');
 if(!C.classes.some(c=>c.id===hero))throw Error('Clase desconocida.');
 if(mode==='daily'){hero='guardaplumas';length='short';seed=hash('tinta-v1:'+date);}
 if(!['adventure','daily','training','tutorial'].includes(mode))throw Error('Modo desconocido.');
 const h=C.classes.find(c=>c.id===hero),training=mode==='training';
 this.profile.run={id:uid(),rng:hash(seed),seed:String(seed),hero,mode,length,date,depth:0,region:0,phase:'map',hp:h.hp,maxHp:h.hp,gold:35,energy:0,shield:0,poison:0,curse:0,rerolls:3,potions:2,relics:[],deck:mode==='daily'?C.cards.slice(0,4).map(c=>c.id):[...this.profile.deck],nodes:[],board:[],words:[],discovered:[],log:[],history:[],stats:{correct:0,errors:0,battles:0,damage:0,combos:0,time:0},done:false,tutorial:mode==='tutorial'?0:null,training};
 if(!training){this.stat('runs');if(!this.profile.days.includes(date))this.profile.days.push(date);}
 this.nextNodes();this.achieve();return this.run;
 }
 nextNodes(){const r=this.run;const boss=(r.depth+1)%5===0;r.nodes=boss?[{id:uid(),type:'boss'}]:[0,1].map((_,i)=>({id:uid(),type:r.depth===0?(i?'challenge':'battle'):this.pick(['battle','battle','elite','merchant','rest','event','treasure','challenge'])}));r.phase='map';}
 enter(index){const r=this.run;if(r.done||r.phase!=='map'||!r.nodes[index])return false;
 const node=r.nodes[index];r.history.push({depth:r.depth,type:node.type,index});r.node=node;r.depth++;r.region=Math.min(2,Math.floor((r.depth-1)/5));r.log=[];
 if(['battle','elite','boss','challenge'].includes(node.type)){this.beginBattle(node.type);return true;}
 r.phase=node.type;
 if(node.type==='merchant'){r.stock=[...this.shuffle([...C.cards]).slice(0,3).map(c=>({id:c.id,type:'card',price:c.price})),...this.shuffle(C.relics.filter(c=>!r.relics.includes(c.id))).slice(0,2).map(c=>({id:c.id,type:'relic',price:c.price})),{id:'potion',type:'potion',price:18},{id:'heal',type:'heal',price:22},{id:'cleanse',type:'cleanse',price:20},{id:'upgrade',type:'upgrade',price:32},{id:'replace',type:'replace',price:16}];}
 if(node.type==='event'){r.event=clone(this.pick(C.events));this.stat('events');}
 if(node.type==='treasure')r.treasure=this.pick(C.relics.filter(x=>!r.relics.includes(x.id)))?.id;
 this.note(C.regions[r.region].story);return true;
 }
 beginBattle(type){const r=this.run;let enemy=type==='boss'?C.bosses[r.region]:this.pick(C.enemies.filter(e=>e.region===r.region));r.enemy={...clone(enemy),maxHp:enemy.hp,hp:enemy.hp,shield:0,fire:0,ice:0,storm:0,poison:0,weakness:0,stun:0,phase:1};if(type==='elite'){r.enemy.hp=Math.round(r.enemy.hp*1.45);r.enemy.maxHp=r.enemy.hp;r.enemy.damage+=3;}
 if(r.mode==='training'&&this.profile.settings.level===1){r.enemy.hp=Math.ceil(r.enemy.hp*.7);r.enemy.maxHp=r.enemy.hp;r.enemy.damage=Math.max(3,r.enemy.damage-2);}
 r.phase='battle';r.turn=1;r.shield=0;r.counter=0;r.battleDamage=0;r.battleWords=[];r.silence=0;r.chain=0;r.goal=null;r.reward=null;r.board=this.newBoard();
 if(type==='challenge'){const options=['noun','verb','adj','adv'].filter(cat=>this.solutions(r.board,a=>a.categories.includes(cat)).length);if(options.length)r.goal={category:this.pick(options),done:false};}
 if(r.mode==='tutorial'&&r.tutorial===0){r.board=[...'cantarsol'].map((char,i)=>({id:'tutorial'+i,char,card:null}));}
 r.intent=this.intent();this.note(r.enemy.tell);}
 newBoard(){const r=this.run;let board=[];const pool=r.deck.map(card).filter(Boolean),available=bag+pool.map(c=>c.char).join('');
 const possible=Object.keys(C.lexicon).filter(w=>{const a=[...available];for(const ch of base(w)){const i=a.indexOf(ch);if(i<0)return false;a.splice(i,1);}return w.length>=3&&w.length<=7;});
 const target=this.pick(possible.length?possible:['sol']);const letters=[...base(target)];while(letters.length<9)letters.push(this.pick([...available]));
 // A draw is a letter from the base bag or an equipped special letter. Only matching letters inherit card effects.
 board=this.shuffle(letters).map(char=>{const same=pool.filter(c=>c.char===char);return {id:uid(),char,card:same.length&&this.rand()<.65?this.pick(same).id:null};});
 return board;
 }
 refill(used,retain){const r=this.run;const keep=r.board.filter((_,i)=>!used.includes(i)||retain.includes(i));const fresh=this.newBoard();while(keep.length<9)keep.push(fresh.pop());r.board=keep;
 if(!this.solutions().length){r.board=this.newBoard();this.note('El tintero recompone las letras: vuelve a haber palabras disponibles.');}}
 preview(word,action='attack',category){const r=this.run,w=clean(word),a=this.analysis(w);const indices=this.match(w);if(!this.check(w))return {ok:false,message:'No consta esta escritura en el diccionario. Revisa también las tildes.'};if(!indices)return {ok:false,message:'No tienes todas las fichas necesarias.'};
 const cat=a.categories.includes(category)?category:a.categories[0];
 let damage=[...w].reduce((sum,c)=>sum+(/[ñjxz]/.test(c)?3:/[qvfyh]/.test(c)?2:1),0)+2,shield=0,energy=1;
 const fx={fire:0,ice:0,storm:0,poison:0,weakness:0},notes=[],retain=[];const accent=/[áéíóú]/.test(w),isNew=r.mode==='daily'?!r.words.includes(w):!this.profile.words[w],changed=r.battleWords.at(-1)!==w;
 if(cat==='noun'){shield+=4;notes.push('Sustantivo: +4 escudo');}if(cat==='verb'){energy++;notes.push('Verbo: +1 energía');}if(cat==='adj'){fx.weakness+=2;notes.push('Adjetivo: debilidad 2');}if(cat==='adv'){fx.ice++;notes.push('Adverbio: reduce el próximo ataque');}
 if(accent){damage+=2;notes.push('Tilde correcta: +2 daño');}
 if(a.element){fx[a.element]+=2;notes.push('Afinidad: '+a.element);}
 if(r.hero==='guardaplumas'&&cat==='noun')shield+=3;
 if(r.hero==='forjaverbos'&&cat==='verb'){damage+=3;energy++;}
 if(r.hero==='tildamante'&&accent){damage+=4;energy++;}
 if(r.hero==='sombrografo'&&a.features?.some(f=>['prefix','suffix'].includes(f))){damage+=5;fx.weakness+=2;}
 const apply=(effect,n)=>{switch(effect){case 'damage':damage+=n;break;case 'shield':shield+=n;break;case 'energy':energy+=n;break;case 'fire':case 'ice':case 'poison':case 'storm':fx[effect]+=n;break;case 'accent':if(accent)damage+=n;break;case 'chain':if(changed)damage+=n;break;}};
 for(const i of indices){const c=card(r.board[i].card);if(c){apply(c.effect,c.amount);notes.push(c.name);if(c.effect==='retain')retain.push(i);}}
 let heal=0;
 for(const id of r.relics){const x=relic(id);if(!x)continue;const n=x.amount;switch(x.effect){case 'longShield':if(w.length>=6)shield+=n;break;case 'newWord':if(isNew)damage+=n;break;case 'verb':if(cat==='verb')damage+=n;break;case 'retain':if(indices.length)retain.push(indices[0]);break;case 'short':if(w.length<=4)damage+=n;break;case 'hiato':case 'prefix':case 'suffix':if(a.features?.includes(x.effect))damage+=n;break;case 'adv':if(cat==='adv')energy+=n;break;case 'adj':if(cat==='adj')fx.weakness+=n;break;case 'noun':if(cat==='noun')shield+=n;break;case 'fireAccent':if(accent)fx.fire+=n;break;case 'healNew':if(isNew)heal+=n;break;case 'defend':if(action==='defend')shield+=n;break;case 'iceAccent':if(accent)fx.ice+=n;break;case 'stormVerb':if(cat==='verb')fx.storm+=n;break;case 'enye':if(w.includes('ñ'))damage+=n;break;case 'first':if(r.turn===1)damage+=n;break;case 'last':if(r.hp<r.maxHp/3)damage+=n;break;default:apply(x.effect,n);}}
 const repeats=r.battleWords.filter(x=>x===w).length;if(repeats){damage=Math.max(1,Math.floor(damage/(1+repeats)));energy=Math.max(0,energy-repeats);notes.push('Eco: daño ÷'+(repeats+1));}
 const e=r.enemy;if(e.kind==='short'&&w.length>=6)damage=Math.floor(damage*.6);if(e.kind==='accent'&&accent)damage+=5;
 if(cat===e.weak){damage+=4;notes.push('Debilidad enemiga: +4');}
 if(action==='defend'){shield+=damage+4;damage=0;fx.fire=0;fx.poison=0;fx.storm=0;notes.push('Guardia: solo escudo; sin daño directo ni contraataque');}
 damage=action==='defend'?0:Math.min(65,Math.max(1,damage-(e.armor||0)));shield=Math.min(45,shield,Math.max(0,65-r.shield));energy=Math.min(5,energy);Object.keys(fx).forEach(k=>fx[k]=Math.min(8,fx[k]));
 return {ok:true,word:w,category:cat,analysis:a,damage,shield,energy,fx,notes,indices,retain,heal,accent,isNew,action};
 }
 play(word,action='attack',category,defer=false){const r=this.run;if(!r||r.phase!=='battle'||r.done||r.pendingTurn)return {ok:false,message:'No hay combate activo.'};if(!['attack','defend'].includes(action))return {ok:false,message:'Acción desconocida.'};
 const p=this.preview(word,action,category);if(!p.ok){r.stats.errors++;return p;}
 r.log=[];r.stats.correct++;r.words.push(p.word);r.battleWords.push(p.word);r.chain=r.battleWords.length>1&&r.battleWords.at(-2)===p.word?1:r.chain+1;
 if(r.mode!=='training'){this.profile.words[p.word]=(this.profile.words[p.word]||0)+1;this.stat('accents',p.accent?1:0);this.stat('esdrujulas',p.analysis.features?.includes('esdrujula')?1:0);this.stat('hiatos',p.analysis.features?.includes('hiato')?1:0);this.stat('prefixes',p.analysis.features?.includes('prefix')?1:0);this.stat('suffixes',p.analysis.features?.includes('suffix')?1:0);this.stat('enye',p.word.includes('ñ')?1:0);this.stat(({noun:'nouns',verb:'verbs',adj:'adjs',adv:'advs'})[p.category]||'other');this.profile.stats.chain=Math.max(this.profile.stats.chain||0,r.chain);}
 if(p.isNew&&!r.discovered.includes(p.word))r.discovered.push(p.word);
 r.shield=Math.min(65,r.shield+p.shield);r.energy=Math.min(10,r.energy+p.energy);r.hp=Math.min(r.maxHp,r.hp+p.heal);
 if(action==='defend')r.counter=0;
 for(const [k,n] of Object.entries(p.fx))r.enemy[k]=Math.min(12,(r.enemy[k]||0)+n);
 this.hit(p.damage);this.note(p.word.toUpperCase()+': '+p.damage+' de daño · '+p.shield+' escudo · '+p.energy+' energía.');for(const n of p.notes)this.note(n);
 if(r.goal&&!r.goal.done&&p.category===r.goal.category){r.goal.done=true;this.note('Desafío cumplido: +15 oro al vencer.');}
 if(p.damage>0&&r.enemy.kind==='thorns')this.hurt(2);if(r.enemy.kind==='echo'&&r.battleWords.slice(0,-1).includes(p.word))this.hurt(5);
 this.refill(p.indices,p.retain);
 if(r.mode==='tutorial'&&r.tutorial===0){r.tutorial=1;this.note('Ahora usa Defender para frenar su intención.');}else if(r.mode==='tutorial'&&r.tutorial===1&&action==='defend'){r.tutorial=2;this.note('Carga 6 de energía y usa tu habilidad especial.');}
 this.afterPlayer(defer);this.achieve();return p;
 }
 hit(n){const e=this.run.enemy;const absorbed=Math.min(e.shield,n);e.shield-=absorbed;e.hp=Math.max(0,e.hp-n+absorbed);}
 hurt(n){const r=this.run;const absorbed=Math.min(r.shield,n);r.shield-=absorbed;const lost=Math.min(r.hp,Math.max(0,n-absorbed));r.hp-=lost;r.battleDamage+=lost;r.stats.damage+=lost;return lost;}
 intent(){const r=this.run,e=r.enemy;const k=e.kind,cycle=r.turn%3;
 if(cycle===0&&k==='shield')return {type:'shield',damage:0,text:'Barrera: 12 de escudo'};
 if(cycle===0&&k==='heal')return {type:'heal',damage:0,text:'Recomposición: recupera 12 de vida'};
 const damage=e.damage+e.phase-1+(k==='storm'&&cycle===0?5:0);
 return {type:'attack',damage,text:damage+' de daño'+(cycle===0?' · '+e.tell:'')};
 }
 afterPlayer(defer){const r=this.run;if(r.hp<=0){this.finish(false);return;}if(r.enemy.hp<=0){this.victory();return;}if(defer)r.pendingTurn=true;else this.resolveTurn();}
 resolvePendingTurn(){if(!this.run?.pendingTurn)return false;this.run.pendingTurn=false;this.resolveTurn();this.achieve();return true;}
 resolveTurn(){const r=this.run,e=r.enemy;
 if(e.fire&&e.ice){this.hit(7);e.fire=Math.max(0,e.fire-1);e.ice=Math.max(0,e.ice-1);r.stats.combos++;this.stat('combos');this.note('Choque térmico: 7 de daño adicional.');}
 if(e.poison&&e.storm){this.hit(5);e.storm=Math.max(0,e.storm-1);r.stats.combos++;this.stat('combos');this.note('Tinta conductora: 5 de daño adicional.');}
 if(e.fire||e.poison||e.storm){const dot=e.fire+e.poison+e.storm;this.hit(Math.min(15,dot));this.note('Estados: '+Math.min(15,dot)+' de daño.');e.fire=Math.max(0,e.fire-1);e.poison=Math.max(0,e.poison-1);e.storm=Math.max(0,e.storm-1);}
 if(r.hp<=0){this.finish(false);return;}if(e.hp<=0){this.victory();return;}
 if(e.boss){const phase=e.hp<=e.maxHp/3?3:e.hp<=e.maxHp*2/3?2:1;if(phase>e.phase){e.phase=phase;e.damage+=2;e.weak=['noun','verb','adj','adv'][phase%4];e.shield+=phase*3;this.note('FASE '+phase+': cambia su debilidad y prepara una barrera.');}}
 if(e.stun>0){e.stun--;this.note('Enemigo aturdido: pierde su acción.');}else if(r.intent.type==='shield'){e.shield=Math.min(30,e.shield+12);this.note('El enemigo levanta una barrera.');}else if(r.intent.type==='heal'){e.hp=Math.min(e.maxHp,e.hp+12);this.note('El enemigo recupera 12 de vida.');}else{
 const n=Math.max(0,r.intent.damage-e.ice*3-e.weakness);const blocked=Math.min(r.shield,n),taken=this.hurt(n);this.note('Ataque enemigo: '+blocked+' absorbidos por el escudo · '+taken+' de daño a vida.');
 if(n>0&&taken===0&&r.counter){this.hit(r.counter);this.stat('counters');this.note('Contraataque: '+r.counter+' de daño.');}
 if(r.turn%3===0){switch(e.kind){case 'vowels':{const i=r.board.findIndex(t=>/[aeiou]/.test(t.char));if(i>=0)r.board[i].char=this.pick([...'rstnl']);break;}case 'erase':r.board.splice(0,2);while(r.board.length<9)r.board.push({id:uid(),char:this.pick([...'aeiours']),card:null});break;case 'scramble':this.shuffle(r.board);break;case 'energy':r.energy=Math.max(0,r.energy-3);break;case 'poison':r.poison=Math.min(4,r.poison+2);break;case 'stun':r.silence=2;break;case 'category':e.weak=this.pick(['noun','verb','adj','adv']);break;}}
 }
 if(r.poison){this.hurt(r.poison);r.poison--;this.note('Tu veneno pierde intensidad.');}
 e.ice=Math.max(0,e.ice-1);e.weakness=Math.max(0,e.weakness-1);r.counter=0;r.silence=Math.max(0,r.silence-1);
 if(!this.solutions().length){r.board=this.newBoard();this.note('El tintero rescata una jugada disponible.');}
 if(r.hp<=0){this.finish(false);return;}if(e.hp<=0){this.victory();return;}
 r.turn++;r.intent=this.intent();
 }
 special(defer=false){const r=this.run;if(r?.phase!=='battle'||r.done||r.pendingTurn||r.energy<6||r.silence)return false;r.energy-=6;r.log=[];
 switch(r.hero){case 'guardaplumas':r.shield=Math.min(65,r.shield+16);r.counter=8+r.relics.map(relic).filter(x=>x?.effect==='counter').reduce((n,x)=>n+x.amount,0);this.note('Bastión: +16 de escudo, contraataque preparado.');break;case 'forjaverbos':this.hit(22);r.enemy.fire=Math.min(12,r.enemy.fire+2);this.note('Estocada de tinta: 22 de daño.');break;case 'tildamante':this.hit(16);r.enemy.ice=Math.min(12,r.enemy.ice+2);r.enemy.storm=Math.min(12,r.enemy.storm+2);this.note('Tormenta de acentos: 16 de daño.');break;case 'sombrografo':r.enemy.stun=1;r.enemy.poison=Math.min(12,r.enemy.poison+3);this.note('Paso de sombra: aturdimiento y veneno.');break;}
 if(r.mode==='tutorial')r.tutorial=3;this.afterPlayer(defer);this.achieve();return true;}
 reroll(){const r=this.run;if(r?.phase!=='battle'||r.pendingTurn||!r.rerolls)return false;r.rerolls--;r.board=this.newBoard();this.note('Nuevas letras. Cambios restantes: '+r.rerolls);return true;}
 potion(){const r=this.run;if(!r||r.done||r.phase!=='battle'||r.pendingTurn||r.potions<=0||r.hp===r.maxHp)return false;r.potions--;r.hp=Math.min(r.maxHp,r.hp+30);this.note('Poción: recuperas hasta 30 de vida.');return true;}
 victory(){const r=this.run;if(r.phase!=='battle')return;r.phase='reward';r.stats.battles++;const e=r.enemy;r.gold+=22+(e.boss?30:0)+(r.goal?.done?15:0)+r.relics.map(relic).filter(x=>x.effect==='gold').reduce((s,x)=>s+x.amount,0);r.rerolls=Math.min(5,r.rerolls+1);this.stat('battles');if(!r.battleDamage)this.stat('perfect');if(r.hp<=10)this.stat('lastWin');if(r.battleWords.at(-1)?.length<=3)this.stat('shortWin');if(e.boss){this.stat(e.id);if(new Set(r.battleWords).size===r.battleWords.length)this.stat('noRepeatBoss');}
 r.hp=Math.min(r.maxHp,r.hp+r.relics.map(relic).filter(x=>x.effect==='heal').reduce((s,x)=>s+x.amount,0));
 r.reward=this.shuffle([...C.cards]).slice(0,3).map(c=>c.id);this.note('Victoria. Elige una carta para esta expedición.');this.achieve();}
 takeReward(id){const r=this.run;if(r?.phase!=='reward'||(id!==null&&!r.reward.includes(id)))return false;if(id){if(r.deck.length<18)r.deck.push(id);else{r.deck.shift();r.deck.push(id);}if(r.mode!=='training'&&!this.profile.cards.includes(id))this.profile.cards.push(id);}
 r.reward=null;if(r.depth>=(r.length==='long'?15:5))this.finish(true);else this.nextNodes();this.achieve();return true;}
 leave(){if(!this.run||!['merchant','event','rest','treasure'].includes(this.run.phase))return false;this.nextNodes();return true;}
 rest(choice){const r=this.run;if(r?.phase!=='rest')return false;if(choice==='heal')r.hp=Math.min(r.maxHp,r.hp+35);else if(choice==='energy'){r.energy=Math.min(10,r.energy+4);r.rerolls=Math.min(5,r.rerolls+1);}else return false;this.nextNodes();return true;}
 gainRelic(id){const r=this.run;if(!relic(id)||r.relics.includes(id)||r.relics.length>=8)return false;r.relics.push(id);if(r.mode!=='training'&&!this.profile.relics.includes(id))this.profile.relics.push(id);return true;}
 treasure(){const r=this.run;if(r?.phase!=='treasure')return false;this.gainRelic(r.treasure);r.gold+=15;this.nextNodes();this.achieve();return true;}
 price(item){return Math.ceil(item.price*(this.run.relics.includes('relic28')?.9:1));}
 buy(id){const r=this.run;if(r?.phase!=='merchant')return false;const item=r.stock.find(x=>x.id===id&&!x.sold);if(!item||r.gold<this.price(item))return false;
 if(item.type==='relic'&&(r.relics.length>=8||r.relics.includes(id)))return false;
 if(item.type==='card'&&r.deck.length>=18)return false;
 if(item.type==='heal'&&r.hp===r.maxHp)return false;
 if(item.type==='cleanse'&&r.poison===0&&r.curse===0)return false;
 const upIndex=r.deck.findIndex(x=>card(x)?.tier<3),replaceIndex=r.deck.findIndex(x=>card(x)?.effect==='retain');
 if(item.type==='upgrade'&&upIndex<0)return false;
 r.gold-=this.price(item);item.sold=true;
 if(item.type==='card'){r.deck.push(id);if(r.mode!=='training'&&!this.profile.cards.includes(id))this.profile.cards.push(id);}
 if(item.type==='relic')this.gainRelic(id);
 if(item.type==='potion')r.potions++;
 if(item.type==='heal')r.hp=Math.min(r.maxHp,r.hp+40);
 if(item.type==='cleanse'){r.poison=0;r.curse=0;}
 if(item.type==='upgrade'){const old=card(r.deck[upIndex]);r.deck[upIndex]=old.id.slice(0,-1)+(old.tier+1);}
 if(item.type==='replace'){const i=replaceIndex>=0?replaceIndex:0;r.deck[i]=this.pick(C.cards.filter(c=>c.tier===0)).id;}
 this.stat('purchases');this.achieve();return true;}
 eventChoice(i){const r=this.run;if(r?.phase!=='event'||!r.event.options[i])return false;const fx=r.event.options[i].effect;if(fx==='payHeal'&&r.gold<20)return false;
 if(fx==='heal')r.hp=Math.min(r.maxHp,r.hp+25);if(fx==='gold')r.gold+=30;if(fx==='hurtGold'){r.hp=Math.max(1,r.hp-10);r.gold+=45;}if(fx==='payHeal'){r.gold-=20;r.hp=Math.min(r.maxHp,r.hp+45);}if(fx==='energy')r.energy=Math.min(10,r.energy+3);if(fx==='card'){const c=this.pick(C.cards);if(r.deck.length<18)r.deck.push(c.id);if(r.mode!=='training'&&!this.profile.cards.includes(c.id))this.profile.cards.push(c.id);}if(fx==='potion')r.potions++;if(fx==='relic'||fx==='hurtRelic'){if(fx==='hurtRelic')r.hp=Math.max(1,r.hp-15);this.gainRelic(this.pick(C.relics.filter(x=>!r.relics.includes(x.id))).id);}r.event=null;this.nextNodes();this.achieve();return true;}
 finish(won){const r=this.run;if(!r||r.done)return false;r.done=true;r.phase='end';r.won=won;let coins=0;if(r.mode!=='training'){
 if(won){this.stat('wins');if(!this.profile.wonClasses.includes(r.hero))this.profile.wonClasses.push(r.hero);}
 if(r.mode==='daily'){if(won&&!this.profile.daily.includes(r.date)){this.profile.daily.push(r.date);this.stat('daily');coins=10;}}else coins=Math.min(18,r.stats.battles*2+(won?5:0));
 this.profile.coins+=coins;this.achieve();this.profile.outbox.push({id:'tinta_y_acero_result_'+(r.mode==='daily'?'daily_'+r.date:r.id),runId:r.id,won,mode:r.mode,stats:clone(r.stats),words:[...new Set(r.words)],region:r.region,depth:r.depth});this.profile.outbox=this.profile.outbox.slice(-50);}
 r.earned=coins;return true;}
 retire(){return this.finish(false);}
 achieve(){const p=this.profile;if(this.run?.mode==='training')return [];const stats={...p.stats,unique:Object.keys(p.words).length,cards:p.cards.length,relics:p.relics.length,classes:p.wonClasses.length,days:p.days.length};const news=[];for(const a of C.achievements)if(!p.achievements.includes(a.id)&&(stats[a.stat]||0)>=a.target){p.achievements.push(a.id);p.coins+=a.reward;news.push(a.name);}if(news.length&&this.run)this.note('Logro: '+news.join(' · '));return news;}
 buyCosmetic(id){const p=this.profile,c=C.cosmetics.find(x=>x.id===id);if(!c||p.cosmetics.includes(id)||p.coins<c.price)return false;p.coins-=c.price;p.cosmetics.push(id);return true;}
 setDeck(ids){if(this.run&&!this.run.done)return false;if(!Array.isArray(ids)||ids.length<4||ids.length>12||new Set(ids).size!==ids.length||ids.some(id=>!this.profile.cards.includes(id)||!card(id))||ids.filter(id=>card(id).tier===3).length>2)return false;this.profile.deck=[...ids];return true;}
 note(t){this.run.log.push(t);this.run.log=this.run.log.slice(-12);}
 snapshot(){return clone(this.profile);}
 restore(raw){try{let p=raw;for(let i=0;i<4;i++){if(p?.version===1)break;p=p?.save||p?.rawGameData?.save||p?.rawGameData||p?.profile;}if(!p||p.version!==1||JSON.stringify(p).length>4e6)return false;
 const d=makeProfile();for(const k of Object.keys(d))if(!(k in p))return false;
 if(!Number.isSafeInteger(p.coins)||p.coins<0||p.coins>1e7||!Number.isSafeInteger(p.revision)||!Number.isFinite(p.updated))return false;
 for(const k of ['cards','deck','cosmetics','achievements','relics','wonClasses','days','daily','outbox'])if(!Array.isArray(p[k]))return false;
 if(!p.words||typeof p.words!=='object'||Array.isArray(p.words)||!p.stats||!p.settings)return false;
 if(p.cards.some(id=>!card(id))||p.deck.some(id=>!card(id)||!p.cards.includes(id))||p.deck.length<4||p.deck.length>12||new Set(p.deck).size!==p.deck.length)return false;
 if(p.run){const r=p.run;if(typeof r.id!=='string'||!C.classes.some(c=>c.id===r.hero)||!['adventure','training','daily','tutorial'].includes(r.mode)||!['map','battle','reward','merchant','event','rest','treasure','end'].includes(r.phase))return false;
 for(const k of ['hp','maxHp','energy','shield','gold','rng','depth','region','rerolls','potions'])if(!Number.isFinite(r[k])||r[k]<0)return false;
 if(r.hp>r.maxHp||r.maxHp>1000||r.depth>15||r.region>2||r.gold>1e6)return false;
 for(const k of ['board','deck','relics','nodes','words','battleWords','log','history'])if(k in r&&!Array.isArray(r[k]))return false;
 if(!r.stats||!Array.isArray(r.board)||r.board.length>9||r.board.some(t=>!t||!/^([a-zñ]|qu|ch)$/.test(t.char)||t.card&&!card(t.card)))return false;
 if(['battle','reward'].includes(r.phase)&&(!r.enemy||!Number.isFinite(r.enemy.hp)||r.enemy.hp<0||!r.intent))return false;
 if(r.deck.some(id=>!card(id))||r.relics.some(id=>!relic(id)))return false;}
 this.profile=clone(p);return true;}catch{return false;}}
}
root.InkEngine={Game,base,clean,hash,clone,makeProfile};
})(typeof window==='undefined'?globalThis:window);
