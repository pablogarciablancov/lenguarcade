/* Original generated atlases. CSS isolates every cell; no neighbouring frame can bleed. */
(function(){
'use strict';
const heroes=['guardaplumas','forjaverbos','tildamante','sombrografo'];
const names=['Lía','Bran','Ada','Noa'];
function sprite(sheet,index,cls='',label=''){
 const columns={heroes:4,enemies:6,items:5}[sheet],rows={heroes:2,enemies:4,items:4}[sheet];
 const x=index%columns,y=Math.floor(index/columns);
 const enemyRows=[[0,272],[276,240],[516,244],[764,260]];
 const crop=sheet==='enemies'?enemyRows[y]:null;
 const sy=crop?crop[0]/(1024-crop[1])*100:y/(rows-1)*100;
 const bsy=crop?1024/crop[1]*100:rows*100;
 return `<span class="sprite ${sheet} ${cls}" style="--sx:${x/(columns-1)*100}%;--sy:${sy}%;--bsy:${bsy}%" ${label?`role="img" aria-label="${label}"`:'aria-hidden="true"'}></span>`;
}
function enemyIndex(e){return e.boss?18+Number(e.id.replace('boss','')):Number(e.id.replace('enemy',''));}
function hero(id,cls='',pose=0){const i=Math.max(0,heroes.indexOf(id));return sprite('heroes',i+pose*4,cls,names[i]);}
function enemy(e,cls=''){return sprite('enemies',enemyIndex(e),cls,e.name);}
function world(region,cls=''){return `<div class="world-art ${cls}" style="--region:${[0,48,100][region]}%" aria-hidden="true"></div>`;}
const effectItems={fire:0,ice:1,storm:2,poison:3,shield:4,damage:5,energy:6,chain:7,accent:8,retain:9};
function item(effect,cls=''){return sprite('items',effectItems[effect]??10,cls);}
function node(type,region){const indexes={battle:region*6,elite:region*6+3,boss:18+region,merchant:21,rest:23,event:21,treasure:22,challenge:6};return sprite('enemies',indexes[type]??0,'node-art');}
function stage(r){return `${world(r.region)}<div class="stage-vignette"></div><div class="ground-light"></div><div class="actor actor-hero" data-hero="${r.hero}">${hero(r.hero,'idle-sprite')}</div><div class="actor actor-enemy ${r.enemy.boss?'boss-actor':''} ${r.enemy.stun?'stunned':''}" style="--phase:${r.enemy.phase||1}">${enemy(r.enemy,'idle-sprite')}</div><div class="motes" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>`;}
function feedback(action,p={}){
 const stage=document.querySelector('.stage');if(!stage)return;
 stage.classList.add('casting',action);
 const heroSprite=stage.querySelector('.actor-hero .sprite');
 if(['attack','special'].includes(action)&&heroSprite)heroSprite.style.setProperty('--sy','100%');
 const fx=document.createElement('div');fx.className='combat-fx '+action;
 if(action==='enemy'){fx.innerHTML=`<span class="enemy-strike"></span><b class="incoming-number">${p.incoming?'−'+p.incoming:p.blocked?'BLOQUEADO':p.intent==='shield'?'BARRERA':p.intent==='heal'?'CURACIÓN':'SIN DAÑO'}</b>${p.damage?`<b class="damage-number">−${p.damage} · efectos / contraataque</b>`:''}`;}else fx.innerHTML=`<span class="spell-slash"></span><b class="damage-number">${action==='defend'?'ESCUDO':p.damage?'−'+p.damage:'PODER'}</b>${p.incoming?`<b class="incoming-number">−${p.incoming}</b>`:''}`;
 stage.append(fx);
 setTimeout(()=>{if(!stage.isConnected)return;fx.remove();stage.classList.remove('casting',action);if(heroSprite)heroSprite.style.setProperty('--sy','0%');},850);
}
window.InkArt={sprite,hero,enemy,item,node,world,stage,feedback,names,heroes};
})();
