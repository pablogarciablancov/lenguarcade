/*
 * LenguArcade GameBridge externo v3
 * --------------------------------
 * Pega este script dentro de cada juego externo, antes de </body>.
 * El juego puede seguir siendo su propio Apps Script /exec.
 *
 * Uso mínimo dentro del juego:
 *   LenguArcadeBridge.configure({ gameId: 'battlegrafia' });
 *   LenguArcadeBridge.onInit(ctx => { aplicarPartida(ctx.progress.save); });
 *   LenguArcadeBridge.save({ eventType:'SAVE_PROGRESS', xpDelta:20, progress:{ level:2, save:miGuardado } });
 */
(function(){
  const params = new URLSearchParams(location.search);
  let config = { gameId: params.get('lcGameId') || '', hubUrl: '', showStandaloneBanner: true };
  let context = null;
  let initCallbacks = [];
  let readySent = false;

  function insideHub(){ return window.parent && window.parent !== window; }
  function send(type, payload){
    if(!insideHub()) return false;
    window.parent.postMessage({ source:'lenguarcade-game', type, gameId: config.gameId, payload: payload || {} }, '*');
    return true;
  }
  function ready(){ if(readySent) return; readySent = true; send('GAME_READY', { url: location.href, title: document.title }); }
  function onMessage(event){
    const msg = event.data || {};
    if(!msg || msg.source !== 'lenguarcade-hub') return;
    if(msg.type === 'INIT_GAME'){
      context = { student: msg.student || {}, game: msg.game || {}, progress: msg.progress || {}, arcade: msg.arcade || {} };
      if(!config.gameId && msg.gameId) config.gameId = msg.gameId;
      initCallbacks.forEach(fn => { try{ fn(context); }catch(e){ console.error('[LenguArcadeBridge] onInit error', e); } });
      window.dispatchEvent(new CustomEvent('lenguarcade:init', { detail: context }));
    }
  }
  function standaloneBanner(){
    if(!config.showStandaloneBanner || insideHub()) return;
    if(document.getElementById('lenguarcade-standalone-banner')) return;
    const bar = document.createElement('div');
    bar.id = 'lenguarcade-standalone-banner';
    bar.style.cssText = 'position:fixed;z-index:2147483647;left:12px;right:12px;bottom:12px;background:#0f172a;color:#e0f2fe;border:1px solid rgba(34,211,238,.45);border-radius:14px;padding:10px 12px;font-family:system-ui,Segoe UI,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.35);font-weight:700;text-align:center';
    bar.innerHTML = 'LenguArcade: juego abierto fuera del arcade. Puedes jugar, pero el guardado común solo funciona entrando desde LenguArcade.' + (config.hubUrl ? ' <a style="color:#fbbf24" href="'+config.hubUrl+'">Ir a LenguArcade</a>' : '');
    document.body.appendChild(bar);
  }

  window.addEventListener('message', onMessage);
  window.addEventListener('load', function(){ setTimeout(ready, 100); setTimeout(standaloneBanner, 500); });

  window.LenguArcadeBridge = {
    configure(opts){ config = Object.assign(config, opts || {}); if(config.gameId) ready(); return this; },
    isInsideLenguArcade: insideHub,
    getContext(){ return context; },
    getStudent(){ return context && context.student ? context.student : null; },
    getInitialProgress(){ return context && context.progress ? context.progress : null; },
    onInit(fn){ if(typeof fn === 'function'){ initCallbacks.push(fn); if(context) fn(context); } return this; },
    requestLoad(){ return send('LOAD_PROGRESS', {}); },
    save(payload){ payload = payload || {}; if(!payload.progress) payload.progress = {}; return send('SAVE_PROGRESS', payload); },
    error(errorType, payload){ payload = payload || {}; payload.errorType = errorType; payload.eventType = payload.eventType || 'ERROR_REGISTERED'; return this.save(payload); },
    achievement(achievement, payload){ payload = payload || {}; payload.achievement = achievement; payload.eventType = payload.eventType || 'ACHIEVEMENT_UNLOCKED'; return this.save(payload); },
    saveLongText(payload){ return send('SAVE_LONG_TEXT', payload || {}); },
    close(){ return send('CLOSE_GAME', {}); }
  };
})();
