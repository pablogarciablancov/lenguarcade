'use strict';

/* Versópolis · ajuste de claridad y equilibrio de batalla (v1)
   Se carga después de app.js para no tocar el motor común del juego. */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    .battle-howto{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
    .battle-howto .step{border:1px solid var(--line);border-radius:16px;padding:12px;background:rgba(255,255,255,.045)}
    .battle-howto .step b{display:block;margin-bottom:4px;color:var(--gold)}
    .battle-howto .step span{font-size:12px;color:var(--muted);line-height:1.35}
    .turn-guide{border:1px solid rgba(84,225,255,.35);background:rgba(84,225,255,.08);border-radius:16px;padding:10px 12px;margin:9px 0 10px}
    .turn-guide strong{display:block;color:#c9f7ff;font-size:13px;margin-bottom:4px}
    .turn-guide span{font-size:12px;color:var(--muted);line-height:1.4}
    .damage-legend{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:7px}
    .damage-legend span{border:1px solid var(--line);border-radius:10px;padding:6px 7px;font-size:10px;text-align:center;background:rgba(255,255,255,.04)}
    .damage-summary{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
    .damage-card{border-radius:14px;padding:10px 12px;border:1px solid var(--line);background:rgba(255,255,255,.05)}
    .damage-card small{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.06em}
    .damage-card b{display:block;font-size:24px;margin-top:2px}
    .damage-card.player b{color:#79f2ff}.damage-card.rival b{color:#ff86df}
    .turn-result-title{font-weight:900;margin-top:10px;font-size:14px}
    .next-round-wrap{display:flex;justify-content:flex-end;margin-top:10px}
    .risk-help{font-size:11px;color:var(--muted);margin:0 0 7px}
    .risk.selected{outline:2px solid rgba(84,225,255,.72);box-shadow:0 0 0 3px rgba(84,225,255,.08)}
    @media(max-width:760px){.battle-howto{grid-template-columns:1fr}.damage-legend{grid-template-columns:1fr 1fr 1fr}}
  `;
  document.head.appendChild(style);

  const originalRenderBattle = renderBattle;
  const originalRenderBattleSetup = renderBattleSetup;
  const originalPrepareBattleTurn = prepareBattleTurn;

  function damageBand(score){
    if(score < 25) return {label:'Sin golpe', cls:'bad'};
    if(score < 40) return {label:'Roce', cls:''};
    if(score < 55) return {label:'Golpe', cls:''};
    if(score < 70) return {label:'Golpe fuerte', cls:'good'};
    if(score < 85) return {label:'Gran golpe', cls:'good'};
    return {label:'CRÍTICO', cls:'good'};
  }

  function playerDamage(score, multiplier, combo){
    if(score < 25) return 0;
    let base = 5 + (score - 25) * 0.43;
    if(score >= 70) base += 2;
    if(score >= 85) base += 4;
    base += Math.min(4, Math.max(0, combo - 1));
    return clamp(Math.round(base * multiplier), 0, 52);
  }

  function cpuDamage(score, rival, shield){
    const raw = 8 + rival.power * 7 + Math.random() * 4;
    const defence = score * 0.085 + (score >= 85 ? 2 : 0);
    let damage = clamp(Math.round(raw - defence), 4, 17);
    if(shield) damage = Math.max(2, Math.round(damage * .45));
    return damage;
  }

  function ensureSetupHelp(){
    const setup = document.querySelector('#battleSetup .card.panel');
    if(!setup || setup.querySelector('.battle-howto')) return;
    const help = document.createElement('div');
    help.className = 'battle-howto';
    help.innerHTML = `
      <div class="step"><b>1 · Mira el encargo</b><span>Escribe el número de versos indicado. Las condiciones activas aparecen justo encima del cuadro de escritura.</span></div>
      <div class="step"><b>2 · Elige el riesgo</b><span>Las cartas son opcionales: cuantas más actives, más reglas tendrás que cumplir, pero más daño podrás hacer.</span></div>
      <div class="step"><b>3 · Haz daño</b><span>Desde 25 puntos ya golpeas. Con 55+ haces un golpe fuerte; 70+ es un gran golpe y 85+ puede ser crítico.</span></div>`;
    setup.appendChild(help);
  }

  function ensureBattleGuides(){
    if(!battle) return;
    const card = document.querySelector('#battlePlay .challengecard');
    if(card && !card.querySelector('.turn-guide')){
      const guide = document.createElement('div');
      guide.className = 'turn-guide';
      guide.innerHTML = '<strong>🎯 QUÉ TIENES QUE HACER</strong><span id="turnGuideText"></span>';
      const risks = card.querySelector('#battleRiskCards');
      card.insertBefore(guide, risks);
      const riskHelp = document.createElement('div');
      riskHelp.className = 'risk-help';
      riskHelp.textContent = 'Pulsa las cartas para activarlas o desactivarlas. Una carta activa añade una condición y aumenta la recompensa.';
      card.insertBefore(riskHelp, risks);
    }
    const side = document.querySelector('#battlePlay .sidecard');
    if(side && !side.querySelector('.damage-help')){
      const box = document.createElement('div');
      box.className = 'damage-help';
      box.innerHTML = `<div class="eyebrow">Cómo funciona el daño</div>
        <div class="damage-legend"><span>0–24<br>0 daño</span><span>25–39<br>roce</span><span>40–54<br>golpe</span><span>55–69<br>fuerte</span><span>70–84<br>gran golpe</span><span>85–100<br>crítico</span></div>
        <div class="tiny" style="margin-top:6px">Tu puntuación depende sobre todo de cumplir las condiciones visibles. Un buen turno también reduce el daño del rival.</div>`;
      side.insertBefore(box, side.lastElementChild);
    }
  }

  function updateTurnGuide(){
    if(!battle) return;
    const guide = document.getElementById('turnGuideText');
    if(!guide) return;
    const ch = battleChallenge();
    const conditions = conditionText(ch);
    const optional = battle.selectedRisks.length;
    guide.innerHTML = `<b style="color:white">${escapeHTML(conditions.join(' · '))}</b><br>
      Cumple esas reglas y escribe con sentido sobre <b>${escapeHTML(TOPIC_LABELS[battle.topic] || battle.topic)}</b>. Has activado ${optional} carta${optional===1?'':'s'} de riesgo.`;
    const title = document.getElementById('battleChallengeTitle');
    if(title) title.textContent = `Escribe ${ch.lines} verso${ch.lines===1?'':'s'} y ataca`;
    const submit = document.getElementById('battleSubmit');
    if(submit && !submit.disabled) submit.textContent = 'Atacar con estos versos ⚡';
  }

  renderBattleSetup = function(){
    originalRenderBattleSetup();
    ensureSetupHelp();
    if(battle){ ensureBattleGuides(); updateTurnGuide(); }
  };

  renderBattle = function(){
    originalRenderBattle();
    ensureBattleGuides();
    updateTurnGuide();
  };

  function setBattleControlsLocked(locked){
    const input = document.getElementById('battleInput');
    const risks = document.getElementById('battleRiskCards');
    if(input) input.readOnly = locked;
    if(risks) risks.style.pointerEvents = locked ? 'none' : '';
    ['tacticShield','tacticDouble','tacticReroll'].forEach(id=>{
      const el=document.getElementById(id);
      if(el && locked) el.disabled=true;
    });
  }

  prepareBattleTurn = function(){
    originalPrepareBattleTurn();
    const submit = document.getElementById('battleSubmit');
    if(submit){ submit.disabled=false; submit.textContent='Atacar con estos versos ⚡'; }
    setBattleControlsLocked(false);
    renderBattle();
  };

  async function balancedSubmitBattle(){
    if(!battle) return;
    const input = document.getElementById('battleInput');
    const text = input.value.trim();
    if(!text){ toast('Escribe tu respuesta.'); return; }

    const submit = document.getElementById('battleSubmit');
    submit.disabled = true;
    submit.textContent = 'Analizando…';
    setBattleControlsLocked(true);

    const ch = battleChallenge();
    const result = validateChallenge(text, ch);
    const multiplier = battleMultiplier();
    const band = damageBand(result.overall);
    const damage = playerDamage(result.overall, multiplier, battle.combo);
    const scoreGain = Math.round(result.overall * multiplier);

    battle.score += scoreGain;
    battle.lastResult = result;
    if(result.overall >= 55) battle.combo++;
    else battle.combo = 0;
    state.stats.bestCombo = Math.max(state.stats.bestCombo, battle.combo);
    if(battle.combo >= 3) unlockAchievement('combo3');
    afterTurn(result.overall);

    battle.rivalFlow = clamp(battle.rivalFlow - damage, 0, 100);
    if(result.overall >= 92){
      state.anthology.unshift({id:uid('verse'),title:`Golpe memorable contra ${battle.rival.name}`,text,date:new Date().toISOString(),mode:'battle'});
      state.anthology = state.anthology.slice(0,30);
    }

    renderBattleScores(result);
    const feedback = document.getElementById('battleFeedback');
    feedback.innerHTML = feedbackHTML(result, ch) + `
      <div class="turn-result-title ${band.cls}">${band.label}: has hecho <b>${damage} de daño</b>.</div>
      <div class="damage-summary"><div class="damage-card player"><small>Tu ataque</small><b>−${damage}</b></div><div class="damage-card rival"><small>Respuesta rival</small><b id="cpuDamagePreview">…</b></div></div>`;

    document.getElementById('battleSpeech').textContent = `${state.profile.name||'Tú'}:\n${text}\n\n${damage ? `⚡ ${damage} de daño a ${battle.rival.name}.` : 'El verso no ha conectado: necesitas al menos 25 puntos.'}`;
    document.getElementById('battleSpeechMeta').innerHTML = `<span class="chip">Nota ${result.overall}/100</span><span class="chip">Ataque −${damage}</span><span class="chip">+${scoreGain} pts</span>`;
    renderBattle();

    let rivalDamage = 0;
    let reply = null;
    if(battle.rivalFlow > 0){
      document.getElementById('battleSpeech').textContent += `\n\n${battle.rival.name} está preparando su respuesta…`;
      reply = await rivalReply(text, ch, battle.rival, battle.topic);
      rivalDamage = cpuDamage(result.overall, battle.rival, battle.shield);
      battle.playerFlow = clamp(battle.playerFlow - rivalDamage, 0, 100);
      battle.shield = false;
      battle.log.push({player:text,cpu:reply.text,score:result.overall,playerDamage:damage,cpuDamage:rivalDamage});
      document.getElementById('battleSpeech').textContent = `${state.profile.name||'Tú'}:\n${text}\n\n${battle.rival.name}:\n${reply.text}`;
      document.getElementById('battleSpeechMeta').innerHTML = `<span class="chip">Tu nota ${result.overall}/100</span><span class="chip">Tú haces −${damage}</span><span class="chip">Rival hace −${rivalDamage}</span>`;
    } else {
      document.getElementById('battleSpeechMeta').innerHTML = `<span class="chip">Tu nota ${result.overall}/100</span><span class="chip">KO · −${damage}</span>`;
    }

    battle.double = false;
    const preview = document.getElementById('cpuDamagePreview');
    if(preview) preview.textContent = rivalDamage ? `−${rivalDamage}` : 'KO';
    saveState('battle_turn');
    renderBattle();

    /* Mantener el análisis visible: la ronda solo cambia cuando el jugador lo decide. */
    const next = document.createElement('div');
    next.className = 'next-round-wrap';
    const finished = battle.rivalFlow <= 0 || battle.playerFlow <= 0 || battle.round >= battle.maxRounds;
    next.innerHTML = `<button class="btn gold" id="battleNextRound">${finished?'Ver resultado':'Siguiente ronda →'}</button>`;
    feedback.appendChild(next);
    document.getElementById('battleNextRound').onclick = () => {
      if(!battle) return;
      if(finished){ finishBattle(); return; }
      battle.round++;
      prepareBattleTurn();
    };

    submit.textContent = 'Turno resuelto';
  }

  /* El rival ya no pega una cantidad casi fija. La calidad del turno actúa también como defensa. */
  document.getElementById('battleSubmit').onclick = balancedSubmitBattle;

  ensureSetupHelp();
  if(battle){ ensureBattleGuides(); updateTurnGuide(); }
})();
