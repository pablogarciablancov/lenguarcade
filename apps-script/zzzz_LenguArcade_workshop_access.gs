/**
 * LenguArcade - Control de acceso del taller.
 *
 * Capa reversible y separada de los juegos: el profesor decide qué juegos
 * están disponibles por clase (o de forma general) y el alumno ve el estado
 * en el launcher. No modifica las mecánicas internas de ningún juego.
 */

var LA_WORKSHOP_ACCESS_CONFIG_ = {
  SHEET: 'AccesosJuegos',
  GLOBAL_SCOPE: '*',
  HEADERS: ['classCode','gameId','enabled','updatedAt','updatedBy']
};

function ensureWorkshopAccessSheet_() {
  var ss = getDb_();
  ensureSheetHeaders_(ss, LA_WORKSHOP_ACCESS_CONFIG_.SHEET, LA_WORKSHOP_ACCESS_CONFIG_.HEADERS);
  return ss.getSheetByName(LA_WORKSHOP_ACCESS_CONFIG_.SHEET);
}

function normalizeWorkshopScope_(classCode) {
  var scope = String(classCode || LA_WORKSHOP_ACCESS_CONFIG_.GLOBAL_SCOPE).trim();
  if (!scope || scope.toLowerCase() === 'all' || scope.toLowerCase() === 'todas') {
    return LA_WORKSHOP_ACCESS_CONFIG_.GLOBAL_SCOPE;
  }
  if (scope === LA_WORKSHOP_ACCESS_CONFIG_.GLOBAL_SCOPE) return scope;
  var exists = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.CLASES)).some(function(row) {
    return isTrue_(row.activa) && String(row.classCode) === scope;
  });
  if (!exists) throw new Error('Clase no reconocida: ' + scope);
  return scope;
}

function workshopBoolean_(value) {
  var text = String(value).trim().toUpperCase();
  return !(text === 'FALSE' || text === '0' || text === 'NO' || text === 'CERRADO');
}

function workshopAccessRows_() {
  return rowsToObjects_(ensureWorkshopAccessSheet_());
}

function workshopAccessMap_(rows, scope) {
  var map = {};
  (rows || []).forEach(function(row) {
    if (String(row.classCode) !== String(scope)) return;
    map[String(row.gameId)] = workshopBoolean_(row.enabled);
  });
  return map;
}

function resolveWorkshopGameAccess_(gameId, scope, rows) {
  var globalMap = workshopAccessMap_(rows, LA_WORKSHOP_ACCESS_CONFIG_.GLOBAL_SCOPE);
  var localMap = scope === LA_WORKSHOP_ACCESS_CONFIG_.GLOBAL_SCOPE ? globalMap : workshopAccessMap_(rows, scope);
  if (Object.prototype.hasOwnProperty.call(localMap, gameId)) {
    return {enabled:localMap[gameId], source:scope === LA_WORKSHOP_ACCESS_CONFIG_.GLOBAL_SCOPE ? 'general' : 'class'};
  }
  if (Object.prototype.hasOwnProperty.call(globalMap, gameId)) {
    return {enabled:globalMap[gameId], source:'general'};
  }
  return {enabled:true, source:'default'};
}

function requireWorkshopTeacher_() {
  var email = requireActiveGoogleEmail_();
  if (!isTeacherGoogleEmail_(email) || !isTeacherAllowed_(email)) {
    throw new Error('Esta acción requiere una cuenta de profesor autorizada @fomento.edu.');
  }
  return email;
}

function getWorkshopCatalog_() {
  return getActiveGames_().map(decorateGameIntegration_).map(function(game) {
    return {
      gameId:String(game.gameId || ''),
      nombre:String(game.nombre || game.gameId || 'Juego'),
      subtitulo:String(game.subtitulo || ''),
      categoria:String(game.categoria || ''),
      estado:String(game.estado || ''),
      icono:String(game.icono || '🎮'),
      color:String(game.color || '#7c4dff'),
      orden:Number(game.orden || 0)
    };
  });
}

function buildWorkshopAccessState_(scope) {
  var cleanScope = normalizeWorkshopScope_(scope);
  var rows = workshopAccessRows_();
  var games = getWorkshopCatalog_().map(function(game) {
    var resolved = resolveWorkshopGameAccess_(game.gameId, cleanScope, rows);
    return Object.assign({}, game, {
      enabled:resolved.enabled,
      accessSource:resolved.source
    });
  });
  return {
    ok:true,
    scope:cleanScope,
    games:games,
    available:games.filter(function(game){ return game.enabled; }).length,
    total:games.length,
    updatedAt:nowIso_()
  };
}

function getWorkshopAccessAdmin(classCode) {
  requireWorkshopTeacher_();
  ensureSheets_();
  var state = buildWorkshopAccessState_(classCode);
  state.classes = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.CLASES))
    .filter(function(row){ return isTrue_(row.activa); })
    .map(function(row){ return {classCode:String(row.classCode), nombreVisible:String(row.nombreVisible || row.classCode)}; });
  return state;
}

function setWorkshopGameAccess(classCode, gameId, enabled) {
  var teacherEmail = requireWorkshopTeacher_();
  ensureSheets_();
  var scope = normalizeWorkshopScope_(classCode);
  var cleanGameId = String(gameId || '').trim();
  if (!cleanGameId || !findGame_(cleanGameId)) throw new Error('Juego no reconocido.');
  upsertByKeys_(ensureWorkshopAccessSheet_(), ['classCode','gameId'], {
    classCode:scope,
    gameId:cleanGameId,
    enabled:!!enabled,
    updatedAt:nowIso_(),
    updatedBy:teacherEmail
  });
  SpreadsheetApp.flush();
  return buildWorkshopAccessState_(scope);
}

function setWorkshopAllGamesAccess(classCode, enabled) {
  var teacherEmail = requireWorkshopTeacher_();
  ensureSheets_();
  var scope = normalizeWorkshopScope_(classCode);
  var sheet = ensureWorkshopAccessSheet_();
  var now = nowIso_();
  getActiveGames_().forEach(function(game) {
    upsertByKeys_(sheet, ['classCode','gameId'], {
      classCode:scope,
      gameId:String(game.gameId),
      enabled:!!enabled,
      updatedAt:now,
      updatedBy:teacherEmail
    });
  });
  SpreadsheetApp.flush();
  return buildWorkshopAccessState_(scope);
}

function getWorkshopAccessForCurrentUser() {
  ensureSheets_();
  var email = requireActiveGoogleEmail_();
  var student = null;
  if (isStudentGoogleEmail_(email)) {
    student = findStudentByEmail_(email);
    if (!student || !isTrue_(student.activo)) throw new Error('No encuentro un perfil de alumno activo para esta cuenta.');
  } else if (isTeacherGoogleEmail_(email) && isTeacherAllowed_(email)) {
    student = findStudentByEmail_(email) || ensureTeacherPlayerStudent_(email);
  } else {
    throw new Error('Usa una cuenta del colegio para consultar el taller.');
  }
  var state = buildWorkshopAccessState_(String(student.clase || LA_WORKSHOP_ACCESS_CONFIG_.GLOBAL_SCOPE));
  state.classCode = String(student.clase || '');
  state.studentId = String(student.studentId || '');
  return state;
}

function getWorkshopAccessClientPatch_() {
  return `
<style id="la-workshop-access-style">
.workshopAccessSummary{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border:1px solid var(--line);border-radius:999px;background:rgba(54,211,153,.08);color:#c8f7e5;font-size:12px;font-weight:800}
body.light .workshopAccessSummary{color:#176b4a;background:rgba(54,211,153,.12)}
.game.locked{filter:saturate(.28);opacity:.62}
.game.locked .play{background:rgba(255,255,255,.12);color:#d8deef;box-shadow:none}
.workshopPanelHead{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:16px}
.workshopPanelHead h2{margin-bottom:5px}
.workshopToolbar{display:grid;grid-template-columns:minmax(220px,1fr) auto auto;gap:10px;align-items:end;margin-bottom:16px}
.workshopToolbar .field{min-width:0}
.workshopGameGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.workshopGameRow{display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px;border:1px solid var(--line);border-radius:18px;background:rgba(0,0,0,.14)}
body.light .workshopGameRow{background:rgba(94,53,177,.04)}
.workshopGameRow.isClosed{opacity:.67;filter:saturate(.55)}
.workshopGameIcon{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;font-size:25px;background:linear-gradient(135deg,rgba(0,212,255,.18),rgba(124,77,255,.2));border:1px solid var(--line)}
.workshopGameInfo{min-width:0}.workshopGameInfo strong{display:block;font-size:14px}.workshopGameInfo span{display:block;margin-top:3px;color:var(--muted);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.workshopToggle{width:112px!important;margin:0!important;padding:10px 12px!important;box-shadow:none!important}
.workshopToggle.isOpen{background:linear-gradient(135deg,#1fa66f,#36d399)!important}.workshopToggle.isClosed{background:linear-gradient(135deg,#586174,#30384a)!important}
.workshopStatus{min-height:20px;margin-top:12px}.workshopCount{white-space:nowrap;color:var(--muted);font-size:12px}
@media(max-width:900px){.workshopToolbar{grid-template-columns:1fr 1fr}.workshopToolbar .field{grid-column:1/-1}.workshopGameGrid{grid-template-columns:1fr}}
@media(max-width:620px){.workshopToolbar{grid-template-columns:1fr}.workshopToolbar .field{grid-column:auto}.workshopGameRow{grid-template-columns:42px minmax(0,1fr)}.workshopGameIcon{width:42px;height:42px}.workshopToggle{grid-column:1/-1;width:100%!important}}
</style>
<script>
(function(){
  if(window.__LA_WORKSHOP_ACCESS_PATCH__)return;
  window.__LA_WORKSHOP_ACCESS_PATCH__=true;
  var ACCESS_CACHE_KEY='LA_WORKSHOP_ACCESS_CACHE_V1';
  var workshopStudentAccess=null;
  var workshopTeacherState=null;
  var workshopTeacherMounted=false;
  var workshopRefreshTimer=null;

  function workshopCall(name,args){
    return new Promise(function(resolve,reject){
      google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[name].apply(null,args||[]);
    });
  }
  function workshopEsc(value){
    return String(value==null?'':value).replace(/[&<>\"]/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char];});
  }
  function readWorkshopCache(){
    try{var value=JSON.parse(localStorage.getItem(ACCESS_CACHE_KEY)||'null');return value&&value.games?value:null;}catch(error){return null;}
  }
  function saveWorkshopCache(value){
    try{localStorage.setItem(ACCESS_CACHE_KEY,JSON.stringify(value));}catch(error){}
  }
  function accessForGame(gameId){
    if(!workshopStudentAccess||!Array.isArray(workshopStudentAccess.games))return null;
    return workshopStudentAccess.games.find(function(game){return String(game.gameId)===String(gameId);})||null;
  }
  function decorateWorkshopGames(games){
    return (games||[]).map(function(game){
      var access=accessForGame(game.gameId);
      if(!access)return game;
      var copy=Object.assign({},game);
      copy.workshopEnabled=!!access.enabled;
      copy.workshopAccessSource=access.accessSource||'';
      copy.catalogEstado=copy.catalogEstado||copy.estado;
      if(access.enabled){
        copy.estado='✅ Disponible hoy';
      }else{
        copy.locked=true;
        copy.estado='🔒 Cerrado hoy';
        copy.buttonLabel='No disponible hoy';
      }
      return copy;
    });
  }
  function updateStudentWorkshopHeader(){
    var section=document.getElementById('juegos');
    if(!section||!workshopStudentAccess)return;
    var head=section.querySelector('.head');
    var title=head&&head.querySelector('h2');
    var sub=head&&head.querySelector('.sub');
    if(title)title.textContent='Juegos del taller';
    if(sub)sub.textContent=String(workshopStudentAccess.available||0)+' de '+String(workshopStudentAccess.total||0)+' disponibles para tu clase';
    var existing=document.getElementById('workshopAccessSummary');
    if(!existing&&head){
      existing=document.createElement('span');existing.id='workshopAccessSummary';existing.className='workshopAccessSummary';head.appendChild(existing);
    }
    if(existing)existing.textContent='🎮 '+String(workshopStudentAccess.available||0)+' abiertos';
  }
  function rerenderStudentGames(){
    try{
      if(typeof currentDashboard!=='undefined'&&currentDashboard&&Array.isArray(currentDashboard.games)&&typeof renderGames==='function')renderGames(currentDashboard.games);
    }catch(error){console.warn('No se pudo refrescar el catálogo del taller.',error);}
    updateStudentWorkshopHeader();
  }
  async function refreshStudentWorkshopAccess(silent){
    try{
      var result=await workshopCall('getWorkshopAccessForCurrentUser',[]);
      var changed=JSON.stringify(workshopStudentAccess&&workshopStudentAccess.games||[])!==JSON.stringify(result&&result.games||[]);
      workshopStudentAccess=result;
      saveWorkshopCache(result);
      if(changed||!silent)rerenderStudentGames();
    }catch(error){
      if(!silent)console.warn('No se pudo consultar el acceso del taller.',error);
    }
  }
  function installStudentWorkshop(){
    if(!document.getElementById('games')||typeof renderGames!=='function'||typeof openGame!=='function')return false;
    workshopStudentAccess=readWorkshopCache();
    var baseRenderGames=renderGames;
    renderGames=function(games){
      var result=baseRenderGames(decorateWorkshopGames(games));
      updateStudentWorkshopHeader();
      return result;
    };
    var baseOpenGame=openGame;
    openGame=function(gameId){
      var access=accessForGame(gameId);
      if(access&&access.enabled===false){
        var game=null;
        try{game=(currentDashboard&&currentDashboard.games||[]).find(function(item){return item.gameId===gameId;});}catch(error){}
        var title=document.getElementById('gameModalTitle');
        var text=document.getElementById('gameModalText');
        if(title)title.textContent=(game&&game.nombre)||'Juego cerrado';
        if(text)text.textContent='Este juego no está disponible en el taller de hoy. El profesor lo abrirá cuando toque.';
        var modal=document.getElementById('gameModal');if(modal)modal.classList.add('open');
        return;
      }
      return baseOpenGame(gameId);
    };
    if(workshopStudentAccess)rerenderStudentGames();
    setTimeout(function(){refreshStudentWorkshopAccess(false);},350);
    workshopRefreshTimer=setInterval(function(){
      try{if(typeof currentDashboard!=='undefined'&&currentDashboard)refreshStudentWorkshopAccess(true);}catch(error){}
    },30000);
    return true;
  }

  function teacherScope(){
    var select=document.getElementById('workshopClassSelect');
    return select?select.value:'*';
  }
  function teacherGameLabel(game){
    if(game.accessSource==='class')return 'Regla propia de esta clase';
    if(game.accessSource==='general')return teacherScope()==='*'?'Regla general':'Hereda la regla general';
    return 'Disponible por defecto';
  }
  function renderTeacherWorkshopState(state){
    workshopTeacherState=state;
    var select=document.getElementById('workshopClassSelect');
    if(!select)return;
    var selected=state.scope||'*';
    var options='<option value="*">Todas las clases · regla general</option>'+(state.classes||[]).map(function(row){return '<option value="'+workshopEsc(row.classCode)+'">'+workshopEsc(row.nombreVisible)+'</option>';}).join('');
    select.innerHTML=options;
    if([].slice.call(select.options).some(function(option){return option.value===selected;}))select.value=selected;else select.value='*';
    localStorage.setItem('LA_WORKSHOP_SCOPE',select.value);
    var grid=document.getElementById('workshopGameGrid');
    grid.innerHTML=(state.games||[]).map(function(game){
      var open=!!game.enabled;
      return '<div class="workshopGameRow '+(open?'':'isClosed')+'" data-workshop-game="'+workshopEsc(game.gameId)+'">'+
        '<div class="workshopGameIcon">'+workshopEsc(game.icono||'🎮')+'</div>'+
        '<div class="workshopGameInfo"><strong>'+workshopEsc(game.nombre)+'</strong><span>'+workshopEsc(teacherGameLabel(game))+'</span></div>'+
        '<button type="button" class="workshopToggle '+(open?'isOpen':'isClosed')+'" data-workshop-toggle="'+workshopEsc(game.gameId)+'" data-enabled="'+(open?'1':'0')+'">'+(open?'✓ Abierto':'🔒 Cerrado')+'</button>'+
      '</div>';
    }).join('')||'<div class="sub">No hay juegos activos en el catálogo.</div>';
    [].slice.call(grid.querySelectorAll('[data-workshop-toggle]')).forEach(function(button){
      button.onclick=function(){setTeacherGameAccess(button.dataset.workshopToggle,button.dataset.enabled!=='1',button);};
    });
    var count=document.getElementById('workshopCount');
    if(count)count.textContent=String(state.available||0)+' de '+String(state.total||0)+' abiertos';
    var status=document.getElementById('workshopStatus');
    if(status)status.textContent='Cambios guardados · los alumnos actualizan el estado automáticamente.';
  }
  async function loadTeacherWorkshopState(scope,showLoading){
    var status=document.getElementById('workshopStatus');
    if(showLoading&&status)status.textContent='Cargando accesos...';
    try{
      var result=await workshopCall('getWorkshopAccessAdmin',[scope||'*']);
      renderTeacherWorkshopState(result);
    }catch(error){
      if(status)status.textContent='No se pudo cargar el control del taller: '+(error.message||error);
    }
  }
  async function setTeacherGameAccess(gameId,enabled,button){
    var status=document.getElementById('workshopStatus');
    if(button)button.disabled=true;
    if(status)status.textContent='Guardando cambio...';
    try{
      var result=await workshopCall('setWorkshopGameAccess',[teacherScope(),gameId,!!enabled]);
      result.classes=(workshopTeacherState&&workshopTeacherState.classes)||[];
      renderTeacherWorkshopState(result);
    }catch(error){
      if(status)status.textContent='No se pudo guardar: '+(error.message||error);
      if(button)button.disabled=false;
    }
  }
  async function setTeacherAllAccess(enabled){
    var status=document.getElementById('workshopStatus');
    var buttons=[document.getElementById('workshopOpenAll'),document.getElementById('workshopCloseAll')];
    buttons.forEach(function(button){if(button)button.disabled=true;});
    if(status)status.textContent=enabled?'Abriendo todos los juegos...':'Cerrando todos los juegos...';
    try{
      var result=await workshopCall('setWorkshopAllGamesAccess',[teacherScope(),!!enabled]);
      result.classes=(workshopTeacherState&&workshopTeacherState.classes)||[];
      renderTeacherWorkshopState(result);
    }catch(error){
      if(status)status.textContent='No se pudo guardar: '+(error.message||error);
    }finally{
      buttons.forEach(function(button){if(button)button.disabled=false;});
    }
  }
  function mountTeacherWorkshop(){
    if(workshopTeacherMounted||!document.getElementById('appContent'))return;
    workshopTeacherMounted=true;
    var nav=document.querySelector('.nav');
    if(nav&&!nav.querySelector('[data-target="taller"]')){
      var button=document.createElement('button');button.type='button';button.dataset.target='taller';button.textContent='🎛️ Taller';
      var gamesButton=nav.querySelector('[data-target="juegos"]');nav.insertBefore(button,gamesButton||null);
      button.onclick=function(){document.getElementById('taller').scrollIntoView({block:'start'});document.querySelectorAll('.nav button').forEach(function(item){item.classList.remove('active');});button.classList.add('active');};
    }
    var resumen=document.getElementById('resumen');
    if(resumen&&!document.getElementById('taller')){
      resumen.insertAdjacentHTML('afterend','<section id="taller" class="card"><div class="workshopPanelHead"><div><h2>Control del taller</h2><div class="sub">Abre solo las aplicaciones que quieras usar en la sesión. Puedes aplicar una regla general o cambiarla para una clase concreta.</div></div><div class="workshopCount" id="workshopCount"></div></div><div class="workshopToolbar"><div class="field"><label>Aplicar a</label><select id="workshopClassSelect"><option value="*">Todas las clases · regla general</option></select></div><button type="button" id="workshopOpenAll">✓ Abrir todos</button><button type="button" class="dangerAction" id="workshopCloseAll">🔒 Cerrar todos</button></div><div class="workshopGameGrid" id="workshopGameGrid"><div class="sub">Cargando catálogo...</div></div><div class="status workshopStatus" id="workshopStatus"></div></section>');
      document.getElementById('workshopClassSelect').onchange=function(){loadTeacherWorkshopState(this.value,true);};
      document.getElementById('workshopOpenAll').onclick=function(){setTeacherAllAccess(true);};
      document.getElementById('workshopCloseAll').onclick=function(){setTeacherAllAccess(false);};
    }
  }
  function installTeacherWorkshop(){
    if(!document.getElementById('appContent')||typeof renderTeacher!=='function')return false;
    mountTeacherWorkshop();
    var baseRenderTeacher=renderTeacher;
    renderTeacher=function(data){
      var result=baseRenderTeacher(data);
      mountTeacherWorkshop();
      if(!workshopTeacherState){
        var remembered=localStorage.getItem('LA_WORKSHOP_SCOPE')||'*';
        setTimeout(function(){loadTeacherWorkshopState(remembered,false);},0);
      }
      return result;
    };
    if(typeof currentTeacher!=='undefined'&&currentTeacher){
      var remembered=localStorage.getItem('LA_WORKSHOP_SCOPE')||'*';
      loadTeacherWorkshopState(remembered,false);
    }
    return true;
  }

  if(!installStudentWorkshop())installTeacherWorkshop();
})();
</script>`;
}

// Adaptador común: se carga después del constructor original y añade el parche
// del taller tanto a la vista de alumno como a la de profesor.
var LA_WORKSHOP_ORIGINAL_BUILD_HTML_OUTPUT_ = buildLenguArcadeHtmlOutput_;
buildLenguArcadeHtmlOutput_ = function(file, title, patchAlumnoGoogle) {
  var output = LA_WORKSHOP_ORIGINAL_BUILD_HTML_OUTPUT_(file, title, patchAlumnoGoogle);
  if (file !== 'LenguArcade_Alumno' && file !== 'LenguArcade_Profesor') return output;
  var content = output.getContent();
  var patch = getWorkshopAccessClientPatch_();
  var html = content.indexOf('</body>') !== -1 ? content.replace('</body>', patch + '\n</body>') : content + patch;
  return HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
};
