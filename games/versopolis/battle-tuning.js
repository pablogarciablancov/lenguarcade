'use strict';

/* Versópolis · batalla simple + estabilidad visual (v3)
   La Plaza del Flow debe entenderse en segundos y ningún panel debe invadir a otro. */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    #battleRiskCards,.risk-help,#battleMultiplier{display:none!important}
    #battlePlay .sidecard>div:first-child{display:none!important}

    /* --- Batalla simple --- */
    .turn-guide{border:2px solid rgba(84,225,255,.48);background:rgba(84,225,255,.09);border-radius:18px;padding:13px 15px;margin:8px 0 11px;position:relative;z-index:1}
    .turn-guide strong{display:block;color:#c9f7ff;font-size:12px;letter-spacing:.08em;margin-bottom:5px}
    .turn-guide .main-task{font-size:18px;line-height:1.35;font-weight:900;color:#fff;overflow-wrap:anywhere}
    .turn-guide .sub-task{font-size:11px;color:var(--muted);margin-top:5px;line-height:1.35}
    .battle-simple-help{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:13px}
    .battle-simple-help .step{border:1px solid var(--line);border-radius:15px;padding:11px 12px;background:rgba(255,255,255,.045)}
    .battle-simple-help b{display:block;color:var(--gold);margin-bottom:3px}
    .battle-simple-help span{font-size:12px;color:var(--muted);line-height:1.35}
    .simple-damage{border:1px solid rgba(255,209,102,.32);background:rgba(255,209,102,.07);border-radius:14px;padding:10px 12px;margin-top:10px}
    .simple-damage b{color:var(--gold)}
    .simple-damage .formula{font-size:15px;font-weight:900;color:#fff;margin:3px 0}
    .damage-summary{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;position:relative;z-index:1}
    .damage-card{border-radius:14px;padding:10px 12px;border:1px solid var(--line);background:rgba(255,255,255,.05);min-width:0}
    .damage-card small{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.06em}
    .damage-card b{display:block;font-size:25px;margin-top:2px}
    .damage-card.player b{color:#79f2ff}.damage-card.rival b{color:#ff86df}
    .simple-feedback{border:1px solid var(--line);background:rgba(255,255,255,.045);border-radius:14px;padding:10px 12px;margin-top:9px;font-size:12px;line-height:1.5;overflow-wrap:anywhere;position:relative;z-index:1}
    .simple-feedback.good{border-color:rgba(88,227,139,.45)}
    .simple-feedback.bad{border-color:rgba(255,107,122,.5)}
    .next-round-wrap{display:flex;justify-content:flex-end;margin-top:10px;position:relative;z-index:2}

    /* --- FIX GENERAL DE SOLAPES --- */
    html,body{overflow:hidden!important}
    .app,.content,.screen,.section,#battlePlay,.battlelayout,.arenaStage,.challengeDock,.challengecard,.sidecard,.speech,.fighterbox,.modewrap,.modecard,.sidepanel{min-width:0;min-height:0}

    /* La pantalla puede desplazarse internamente: nunca forzamos a la batalla a caber aplastando paneles. */
    #screen-battle{overflow:auto!important;overscroll-behavior:contain}
    #battlePlay{height:auto!important;min-height:100%!important;overflow:visible!important;padding-bottom:18px}
    .battlelayout{height:auto!important;min-height:100%!important;grid-template-rows:auto auto auto!important;align-content:start;overflow:visible!important}
    .arenaStage{overflow:visible!important;align-items:stretch}
    .challengeDock{align-items:start;overflow:visible!important}
    .challengecard,.sidecard,.speech,.fighterbox,.combatant{position:relative;z-index:1;isolation:isolate}
    .challengecard,.sidecard{overflow:hidden}
    #battleFeedback,.challenge-feedback{position:relative!important;z-index:2!important;display:block;clear:both;overflow:visible!important;contain:layout paint}
    #battleFeedback:empty,.challenge-feedback:empty{display:none}
    .speechbox,.poem,.challenge-input,textarea{overflow-wrap:anywhere;word-break:break-word}
    .speechbox{max-height:220px;overflow:auto;padding-right:4px;overscroll-behavior:contain}
    .sidecard{max-height:none!important}
    .results{position:relative;z-index:1}

    /* Los paneles de otros modos tampoco se pisan al crecer el feedback. */
    .modewrap{align-items:start}
    .modecard,.sidepanel{overflow:hidden}
    .modecard .challenge-feedback{margin-top:8px}

    /* --- MODALES: SIEMPRE UNO SOLO Y POR ENCIMA DEL JUEGO --- */
    .modal{position:fixed!important;inset:0!important;z-index:3000!important;padding:18px!important;overflow:auto!important;align-items:center!important;justify-content:center!important;background:rgba(3,2,10,.82)!important;backdrop-filter:blur(8px)}
    .modal.open{display:flex!important}
    .modal .dialog{position:relative!important;z-index:3001!important;width:min(620px,calc(100vw - 28px))!important;max-height:min(760px,calc(100dvh - 36px))!important;overflow:auto!important;margin:auto!important;overscroll-behavior:contain}
    body.modal-open .content{pointer-events:none}
    body.modal-open .modal.open{pointer-events:auto}
    .toast{z-index:3100!important;max-width:min(420px,calc(100vw - 24px));overflow-wrap:anywhere}

    /* En pantallas medianas la zona inferior pasa a una columna antes de que empiece a comprimirse. */
    @media(max-width:1080px), (max-height:760px){
      .challengeDock{grid-template-columns:1fr!important}
      .sidecard{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px!important}
      .sidecard>.tiny{grid-column:1/-1}
      .arenaStage{grid-template-columns:120px minmax(0,1fr) 120px!important}
      .combatant .bigavatar{font-size:54px!important}
    }
    @media(max-width:760px){
      .battle-simple-help{grid-template-columns:1fr}
      .turn-guide .main-task{font-size:16px}
      .arenaStage{grid-template-columns:1fr!important}
      .combatant{display:none!important}
      .sidecard{grid-template-columns:1fr!important}
      .damage-summary{grid-template-columns:1fr 1fr}
      .fighterrow{grid-template-columns:1fr!important}
      .inputrow{grid-template-columns:1fr!important}
      .submitbtn{width:100%}
      .modal{padding:8px!important;align-items:flex-start!important}
      .modal .dialog{width:100%!important;max-height:calc(100dvh - 16px)!important}
    }
  `;
  document.head.appendChild(style);

  const originalRenderBattle = renderBattle;
  const originalRenderBattleSetup = renderBattleSetup;
  const originalStartBattle = startBattle;

  function resetChallenge(ch){
    ch.rhyme='free'; ch.rhymeA=null; ch.rhymeB=null; ch.scheme=ch.lines===4?'ABAB':'AA';
    ch.requiredWords=[]; ch.forbiddenWords=[]; ch.meter=null; ch.figure=null; ch.customPrompt='';
    return ch;
  }

  function makeSimpleChallenge(){
    const d=Number(battle.difficulty||1);
    const lines=(d===3 && battle.round>=4)?4:2;
    const ch=resetChallenge(generateBaseChallenge({difficulty:1,topic:battle.topic,category:'none',lines}));

    if(d===1){
      if(battle.round%2===1){
        ch.requiredWords=[pick(REQUIRED_WORDS)];
      }else{
        ch.rhyme='assonant';
        ch.rhymeA=pick(RHYMES);
      }
    }else{
      ch.rhyme='consonant';
      ch.rhymeA=pick(RHYMES);
      if(lines===4){
        do{ ch.rhymeB=pick(RHYMES); }while(ch.rhymeB===ch.rhymeA);
      }
      if(d>=2 && battle.round>=3) ch.requiredWords=[pick(REQUIRED_WORDS)];
      if(d===3 && battle.round>=5) ch.figure=pick(['simile','metaphor','personification','hyperbole']);
    }
    return ch;
  }

  function taskSentence(ch){
    const bits=[];
    bits.push(`Escribe ${ch.lines} verso${ch.lines===1?'':'s'} sobre ${String(TOPIC_LABELS[ch.topic]||ch.topic).toLowerCase()}.`);
    if(ch.rhyme&&ch.rhyme!=='free'){
      if(ch.lines===4 && ch.rhymeB){
        bits.push(`Rima ${ch.scheme}: A ${ch.rhymeA.label} y B ${ch.rhymeB.label}.`);
      }else{
        bits.push(`Haz que terminen con rima ${ch.rhyme==='consonant'?'consonante':'asonante'} ${ch.rhymeA.label}.`);
      }
    }
    if(ch.requiredWords?.length) bits.push(`Incluye «${ch.requiredWords.join('» y «')}».`);
    if(ch.figure) bits.push(`Usa una ${FIGURES[ch.figure]}.`);
    return bits.join(' ');
  }

  function battleScore(result){
    const topic=Math.max(50,result.coherence||0);
    const expression=Math.max(50,result.expression||0);
    return clamp(Math.round((result.conditions||0)*.80 + topic*.10 + expression*.10),0,100);
  }

  function playerDamage(score){
    if(score<30) return 0;
    return clamp(Math.round(score/3),0,34);
  }

  function cpuDamage(score,rival,shield){
    let damage=Math.round(12 - score/12 + rival.power*2);
    damage=clamp(damage,3,12);
    if(shield) damage=Math.max(2,Math.round(damage*.45));
    return damage;
  }

  function ensureSimpleSetup(){
    const format=document.getElementById('battleScenario');
    if(format){ format.value='free'; const field=format.closest('.field'); if(field) field.style.display='none'; }
    const diff=document.getElementById('battleDifficulty');
    if(diff){
      const labels={1:'Fácil',2:'Normal',3:'Difícil'};
      Array.from(diff.options).forEach(o=>{ if(labels[o.value]) o.textContent=labels[o.value]; });
    }
    const setup=document.querySelector('#battleSetup .card.panel');
    if(!setup) return;
    const old=setup.querySelector('.battle-howto'); if(old) old.remove();
    if(!setup.querySelector('.battle-simple-help')){
      const help=document.createElement('div');
      help.className='battle-simple-help';
      help.innerHTML=`<div class="step"><b>1 · Lee y escribe</b><span>Cada turno te pedirá una cosa concreta: por ejemplo, dos versos que rimen o que incluyan una palabra.</span></div><div class="step"><b>2 · Ataca</b><span>El juego puntúa de 0 a 100. Tu daño es aproximadamente esa nota dividida entre 3. Un buen verso también reduce el golpe del rival.</span></div>`;
      setup.appendChild(help);
    }
    const technical=Array.from(setup.querySelectorAll('p.tiny')).find(p=>p.textContent.includes('endpoint'));
    if(technical) technical.style.display='none';
  }

  function ensureSimpleBattle(){
    if(!battle) return;
    const card=document.querySelector('#battlePlay .challengecard');
    if(card && !card.querySelector('.turn-guide')){
      const guide=document.createElement('div');
      guide.className='turn-guide';
      guide.innerHTML='<strong>🎯 TU RETO</strong><div class="main-task" id="turnGuideText"></div><div class="sub-task">Eso es todo. Escribe tus versos y pulsa ATACAR.</div>';
      const risks=card.querySelector('#battleRiskCards');
      card.insertBefore(guide,risks);
    }
    const side=document.querySelector('#battlePlay .sidecard');
    if(side && !side.querySelector('.simple-damage')){
      const box=document.createElement('div');
      box.className='simple-damage';
      box.innerHTML='<div class="eyebrow">Daño</div><div class="formula">NOTA ÷ 3 ≈ DAÑO</div><div class="tiny">90 puntos ≈ 30 de daño. Si cumples bien el reto, el rival también te hará menos daño.</div>';
      side.appendChild(box);
    }
  }

  function updateSimpleGuide(){
    if(!battle) return;
    const ch=battleChallenge();
    const guide=document.getElementById('turnGuideText');
    if(guide) guide.textContent=taskSentence(ch);
    const title=document.getElementById('battleChallengeTitle');
    if(title) title.textContent='Escribe y ataca';
    const submit=document.getElementById('battleSubmit');
    if(submit && !submit.disabled) submit.textContent='ATACAR ⚡';
  }

  battleMultiplier=function(){ return 1; };
  battleChallenge=function(){ return cloneChallenge(battle.baseChallenge); };

  prepareBattleTurn=function(){
    if(!battle) return;
    battle.baseChallenge=makeSimpleChallenge();
    battle.riskOptions=[];
    battle.selectedRisks=[];
    battle.double=false;
    const input=document.getElementById('battleInput');
    if(input){ input.value=''; input.readOnly=false; }
    const fb=document.getElementById('battleFeedback'); if(fb) fb.innerHTML='';
    const staleNext=document.getElementById('battleNextRound'); if(staleNext) staleNext.remove();
    const meta=document.getElementById('battleSpeechMeta'); if(meta) meta.innerHTML='';
    const submit=document.getElementById('battleSubmit');
    if(submit){ submit.disabled=false; submit.textContent='ATACAR ⚡'; }
    originalRenderBattle();
    ensureSimpleBattle();
    updateSimpleGuide();
  };

  startBattle=function(){
    const scenario=document.getElementById('battleScenario'); if(scenario) scenario.value='free';
    originalStartBattle();
    if(battle){ battle.maxRounds=5; battle.tactics={shield:0,double:0,reroll:0}; }
    renderBattleSetup();
  };

  renderBattleSetup=function(){
    originalRenderBattleSetup();
    ensureSimpleSetup();
    if(battle){ ensureSimpleBattle(); updateSimpleGuide(); }
  };

  renderBattleScores=function(r){
    const score=battleScore(r);
    document.getElementById('battleScores').innerHTML=`<div class="scorechip"><small>Reglas</small><b>${r.conditions}</b></div><div class="scorechip"><small>Tema</small><b>${r.coherence}</b></div><div class="scorechip"><small>Expresión</small><b>${r.expression}</b></div><div class="scorechip"><small>Nota</small><b>${score}</b></div>`;
  };

  renderBattle=function(){
    originalRenderBattle();
    ensureSimpleBattle();
    updateSimpleGuide();
  };

  function lockTurn(locked){
    const input=document.getElementById('battleInput'); if(input) input.readOnly=locked;
  }

  async function simpleSubmitBattle(){
    if(!battle) return;
    const input=document.getElementById('battleInput');
    const text=input.value.trim();
    if(!text){ toast('Escribe tus versos antes de atacar.'); return; }
    const submit=document.getElementById('battleSubmit');
    submit.disabled=true; submit.textContent='Analizando…'; lockTurn(true);

    const ch=battleChallenge();
    const raw=validateChallenge(text,ch);
    const score=battleScore(raw);
    const damage=playerDamage(score);
    battle.score+=score;
    battle.lastResult={...raw,overall:score};
    if(score>=70) battle.combo++; else battle.combo=0;
    state.stats.bestCombo=Math.max(state.stats.bestCombo,battle.combo);
    if(battle.combo>=3) unlockAchievement('combo3');
    afterTurn(score);
    battle.rivalFlow=clamp(battle.rivalFlow-damage,0,100);

    renderBattleScores(raw);
    const feedback=document.getElementById('battleFeedback');
    const oldNext=document.getElementById('battleNextRound'); if(oldNext) oldNext.remove();
    const good=score>=60;
    feedback.innerHTML=`<div class="simple-feedback ${good?'good':'bad'}"><b>Nota: ${score}/100</b><br>${raw.details.map(escapeHTML).join(' · ')}<br><span class="tiny">Lo que más pesa es cumplir exactamente el reto que ves arriba.</span></div><div class="damage-summary"><div class="damage-card player"><small>Tu daño</small><b>−${damage}</b></div><div class="damage-card rival"><small>Daño rival</small><b id="cpuDamagePreview">…</b></div></div>`;

    let rivalDamage=0;
    if(battle.rivalFlow>0){
      document.getElementById('battleSpeech').textContent=`${state.profile.name||'Tú'}:\n${text}\n\n${battle.rival.name} responde…`;
      const reply=await rivalReply(text,ch,battle.rival,battle.topic);
      rivalDamage=cpuDamage(score,battle.rival,false);
      battle.playerFlow=clamp(battle.playerFlow-rivalDamage,0,100);
      battle.log.push({player:text,cpu:reply.text,score,playerDamage:damage,cpuDamage:rivalDamage});
      document.getElementById('battleSpeech').textContent=`${state.profile.name||'Tú'}:\n${text}\n\n${battle.rival.name}:\n${reply.text}`;
    }
    document.getElementById('battleSpeechMeta').innerHTML=`<span class="chip">Nota ${score}/100</span><span class="chip">Tú −${damage}</span><span class="chip">Rival −${rivalDamage}</span>`;
    const preview=document.getElementById('cpuDamagePreview'); if(preview) preview.textContent=rivalDamage?`−${rivalDamage}`:'KO';
    saveState('battle_turn');
    originalRenderBattle(); ensureSimpleBattle(); updateSimpleGuide();

    const next=document.createElement('div');
    next.className='next-round-wrap';
    const finished=battle.rivalFlow<=0||battle.playerFlow<=0||battle.round>=battle.maxRounds;
    next.innerHTML=`<button class="btn gold" id="battleNextRound">${finished?'Ver resultado':'SIGUIENTE RONDA →'}</button>`;
    feedback.appendChild(next);
    document.getElementById('battleNextRound').onclick=()=>{
      if(finished){ finishBattle(); return; }
      battle.round++; prepareBattleTurn();
    };
    submit.textContent='Turno resuelto';
  }

  /* Garantiza que no puedan coexistir dos ventanas emergentes. */
  function syncModalState(){
    const opened=Array.from(document.querySelectorAll('.modal.open'));
    if(opened.length>1){
      const keep=opened[opened.length-1];
      opened.forEach(modal=>{ if(modal!==keep) modal.classList.remove('open'); });
    }
    document.body.classList.toggle('modal-open',document.querySelector('.modal.open')!==null);
  }

  const modalObserver=new MutationObserver(mutations=>{
    let changed=false;
    mutations.forEach(m=>{ if(m.type==='attributes'&&m.attributeName==='class'&&m.target.classList.contains('modal')) changed=true; });
    if(changed) requestAnimationFrame(syncModalState);
  });
  document.querySelectorAll('.modal').forEach(modal=>{
    modalObserver.observe(modal,{attributes:true,attributeFilter:['class']});
    modal.addEventListener('click',event=>{
      if(event.target===modal){ modal.classList.remove('open'); syncModalState(); }
    });
  });
  document.querySelectorAll('[data-close-modal]').forEach(btn=>{
    btn.addEventListener('click',()=>requestAnimationFrame(syncModalState));
  });

  document.getElementById('startBattleBtn').onclick=()=>startBattle();
  document.getElementById('battleSubmit').onclick=simpleSubmitBattle;
  ensureSimpleSetup();
  syncModalState();
})();