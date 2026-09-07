(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  function loadCss(){
    if($('bg2-clean-battle-css')) return;
    const link=document.createElement('link');
    link.id='bg2-clean-battle-css';
    link.rel='stylesheet';
    link.href='./battle-clean-v2.css?v=20260907-rpg15';
    document.head.appendChild(link);
  }

  function isVisible(node){
    if(!node) return false;
    const style=getComputedStyle(node);
    return style.display!=='none' && style.visibility!=='hidden';
  }

  function updateBattleState(){
    const shell=document.querySelector('.game-shell');
    const battle=$('battle-screen');
    const start=$('start-screen');
    const active=!!(shell && battle && isVisible(shell) && isVisible(battle) && !isVisible(start));
    document.body.classList.toggle('bg2-in-battle',active);

    if(active){
      const answer=$('answer');
      if(answer && document.activeElement===document.body){
        setTimeout(()=>{ try{ answer.focus({preventScroll:true}); }catch(error){} },80);
      }
    }
  }

  function cleanLabels(){
    const speech=document.querySelector('#battle-screen .speech-label');
    if(speech) speech.textContent='CORRIGE ESTE DESAFÍO';

    const inputTitle=$('input-panel')?.querySelector('.box-title');
    if(inputTitle) inputTitle.textContent='Escribe tu corrección';

    const logTitle=$('log-panel')?.querySelector('.log-title');
    if(logTitle) logTitle.textContent='ÚLTIMO RESULTADO';

    const answer=$('answer');
    if(answer){
      answer.placeholder='Reescribe la frase completa, ya corregida…';
      answer.setAttribute('autocomplete','off');
      answer.setAttribute('spellcheck','false');
    }

    const attack=$('attack-btn');
    if(attack && !attack.dataset.cleanBattle){
      attack.dataset.cleanBattle='1';
      attack.textContent='CORREGIR Y ATACAR';
    }

    const use=$('use-item-btn');
    if(use) use.textContent='USAR';

    const navInventory=$('nav-inventory');
    if(navInventory) navInventory.textContent='Mochila';

    const navHome=$('nav-home');
    if(navHome) navHome.textContent='Menú';
  }

  function removeBattleNoise(){
    const strip=$('bg2-world-strip');
    if(strip){
      strip.setAttribute('aria-hidden','true');
      strip.dataset.battleHidden='1';
    }
  }

  function observe(){
    const battle=$('battle-screen');
    const shell=document.querySelector('.game-shell');
    const start=$('start-screen');

    const observer=new MutationObserver(()=>{
      updateBattleState();
      cleanLabels();
      removeBattleNoise();
    });

    [battle,shell,start].filter(Boolean).forEach(node=>{
      observer.observe(node,{attributes:true,attributeFilter:['style','class']});
    });

    const monster=$('monster-name');
    if(monster){
      new MutationObserver(()=>{
        cleanLabels();
        removeBattleNoise();
      }).observe(monster,{childList:true,subtree:true,characterData:true});
    }
  }

  function boot(){
    loadCss();
    document.body.classList.add('bg2-battle-clean');
    cleanLabels();
    removeBattleNoise();
    updateBattleState();
    observe();

    window.addEventListener('resize',updateBattleState,{passive:true});
    setTimeout(updateBattleState,120);
    setTimeout(updateBattleState,500);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();