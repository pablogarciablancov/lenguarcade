/**
 * LenguArcade - Sesiones del taller y acceso supervisado fuera del aula.
 *
 * Extiende el control de acceso existente sin tocar los juegos:
 * - una sesión por clase con título, mensaje, objetivo y selección de juegos;
 * - apertura/cierre manual para la media hora de clase;
 * - ventana opcional de acceso en casa (tardes/fines de semana);
 * - los juegos nuevos aparecen automáticamente al activarse en el catálogo.
 */

var LA_WORKSHOP_SESSION_CONFIG_ = {
  SHEET: 'TallerSesiones',
  HEADERS: [
    'classCode','title','message','targetXp','published','classroomOpen',
    'homeEnabled','homeStart','homeEnd','gameIds','updatedAt','updatedBy'
  ]
};

function ensureWorkshopSessionSheet_() {
  var ss = getDb_();
  ensureSheetHeaders_(ss, LA_WORKSHOP_SESSION_CONFIG_.SHEET, LA_WORKSHOP_SESSION_CONFIG_.HEADERS);
  return ss.getSheetByName(LA_WORKSHOP_SESSION_CONFIG_.SHEET);
}

function workshopSessionRows_() {
  return rowsToObjects_(ensureWorkshopSessionSheet_());
}

function workshopSessionCleanClass_(classCode) {
  var scope = normalizeWorkshopScope_(classCode);
  if (scope === LA_WORKSHOP_ACCESS_CONFIG_.GLOBAL_SCOPE) {
    throw new Error('Elige una clase concreta para preparar su sesión.');
  }
  return scope;
}

function workshopSessionBool_(value) {
  if (value === true) return true;
  var text = String(value == null ? '' : value).trim().toUpperCase();
  return text === 'TRUE' || text === '1' || text === 'SI' || text === 'SÍ' || text === 'YES' || text === 'ABIERTO';
}

function workshopSessionGameIds_(value) {
  if (Array.isArray(value)) {
    return value.map(function(id){ return String(id || '').trim(); }).filter(Boolean);
  }
  var text = String(value || '').trim();
  if (!text) return [];
  try {
    var parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map(function(id){ return String(id || '').trim(); }).filter(Boolean);
    }
  } catch (error) {}
  return text.split(',').map(function(id){ return String(id || '').trim(); }).filter(Boolean);
}

function workshopSessionLocalNow_() {
  var tz = (Session.getScriptTimeZone && Session.getScriptTimeZone()) || 'Europe/Madrid';
  return Utilities.formatDate(new Date(), tz, "yyyy-MM-dd'T'HH:mm");
}

function workshopSessionNormalizeLocalDateTime_(value) {
  var text = String(value || '').trim();
  if (!text) return '';
  var match = text.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!match) throw new Error('Fecha u hora no válida: ' + text);
  return match[1] + 'T' + match[2];
}

function workshopSessionFind_(classCode) {
  var cleanClass = String(classCode || '').trim();
  return workshopSessionRows_().find(function(row) {
    return String(row.classCode || '') === cleanClass;
  }) || null;
}

function workshopSessionPublic_(row) {
  if (!row) return null;
  var ids = workshopSessionGameIds_(row.gameIds);
  var nowLocal = workshopSessionLocalNow_();
  var published = workshopSessionBool_(row.published);
  var classroomOpen = published && workshopSessionBool_(row.classroomOpen);
  var homeEnabled = published && workshopSessionBool_(row.homeEnabled);
  var homeStart = workshopSessionNormalizeLocalDateTime_(row.homeStart || '');
  var homeEnd = workshopSessionNormalizeLocalDateTime_(row.homeEnd || '');
  var homeActive = !!(homeEnabled && homeStart && homeEnd && nowLocal >= homeStart && nowLocal <= homeEnd);
  var mode = classroomOpen ? 'classroom' : (homeActive ? 'home' : 'closed');

  return {
    classCode:String(row.classCode || ''),
    title:String(row.title || 'Sesión LenguArcade'),
    message:String(row.message || ''),
    targetXp:Math.max(0, Number(row.targetXp || 0)),
    published:published,
    classroomOpen:classroomOpen,
    homeEnabled:homeEnabled,
    homeStart:homeStart,
    homeEnd:homeEnd,
    homeActive:homeActive,
    gameIds:ids,
    mode:mode,
    active:classroomOpen || homeActive,
    nowLocal:nowLocal,
    updatedAt:String(row.updatedAt || '')
  };
}

function getWorkshopSessionAdmin(classCode) {
  requireWorkshopTeacher_();
  ensureSheets_();
  var cleanClass = workshopSessionCleanClass_(classCode);
  var row = workshopSessionFind_(cleanClass);
  var session = workshopSessionPublic_(row) || {
    classCode:cleanClass,
    title:'',
    message:'',
    targetXp:0,
    published:false,
    classroomOpen:false,
    homeEnabled:false,
    homeStart:'',
    homeEnd:'',
    homeActive:false,
    gameIds:[],
    mode:'closed',
    active:false,
    nowLocal:workshopSessionLocalNow_(),
    updatedAt:''
  };
  session.catalog = getWorkshopCatalog_();
  return {ok:true, session:session};
}

function saveWorkshopSession(classCode, payload) {
  var teacherEmail = requireWorkshopTeacher_();
  ensureSheets_();
  var cleanClass = workshopSessionCleanClass_(classCode);
  payload = payload || {};

  var catalogIds = {};
  getWorkshopCatalog_().forEach(function(game){ catalogIds[String(game.gameId)] = true; });
  var ids = workshopSessionGameIds_(payload.gameIds).filter(function(id){ return catalogIds[id]; });
  if (!ids.length) throw new Error('Selecciona al menos un juego para la misión.');

  var homeEnabled = !!payload.homeEnabled;
  var homeStart = workshopSessionNormalizeLocalDateTime_(payload.homeStart || '');
  var homeEnd = workshopSessionNormalizeLocalDateTime_(payload.homeEnd || '');
  if (homeEnabled && (!homeStart || !homeEnd)) {
    throw new Error('Para permitir el acceso en casa, indica una fecha y hora de inicio y de fin.');
  }
  if (homeEnabled && homeEnd <= homeStart) {
    throw new Error('La hora de fin del acceso en casa debe ser posterior a la de inicio.');
  }

  var existing = workshopSessionFind_(cleanClass);
  var published = Object.prototype.hasOwnProperty.call(payload, 'published')
    ? !!payload.published
    : true;
  var classroomOpen = Object.prototype.hasOwnProperty.call(payload, 'classroomOpen')
    ? !!payload.classroomOpen
    : (existing ? workshopSessionBool_(existing.classroomOpen) : false);

  upsertByKeys_(ensureWorkshopSessionSheet_(), ['classCode'], {
    classCode:cleanClass,
    title:String(payload.title || '').trim() || 'Sesión LenguArcade',
    message:String(payload.message || '').trim(),
    targetXp:Math.max(0, Math.round(Number(payload.targetXp || 0))),
    published:published,
    classroomOpen:classroomOpen,
    homeEnabled:homeEnabled,
    homeStart:homeStart,
    homeEnd:homeEnd,
    gameIds:JSON.stringify(ids),
    updatedAt:nowIso_(),
    updatedBy:teacherEmail
  });
  SpreadsheetApp.flush();
  return getWorkshopSessionAdmin(cleanClass);
}

function setWorkshopClassroomSessionOpen(classCode, open, payload) {
  payload = payload || {};
  payload.published = true;
  payload.classroomOpen = !!open;
  return saveWorkshopSession(classCode, payload);
}

function retireWorkshopSession(classCode) {
  var teacherEmail = requireWorkshopTeacher_();
  ensureSheets_();
  var cleanClass = workshopSessionCleanClass_(classCode);
  var existing = workshopSessionFind_(cleanClass);
  if (!existing) return getWorkshopSessionAdmin(cleanClass);

  upsertByKeys_(ensureWorkshopSessionSheet_(), ['classCode'], {
    classCode:cleanClass,
    title:String(existing.title || 'Sesión LenguArcade'),
    message:String(existing.message || ''),
    targetXp:Number(existing.targetXp || 0),
    published:false,
    classroomOpen:false,
    homeEnabled:false,
    homeStart:String(existing.homeStart || ''),
    homeEnd:String(existing.homeEnd || ''),
    gameIds:String(existing.gameIds || '[]'),
    updatedAt:nowIso_(),
    updatedBy:teacherEmail
  });
  SpreadsheetApp.flush();
  return getWorkshopSessionAdmin(cleanClass);
}

function getWorkshopSessionForCurrentUser() {
  ensureSheets_();
  var email = requireActiveGoogleEmail_();
  var student = null;

  if (isStudentGoogleEmail_(email)) {
    student = findStudentByEmail_(email);
    if (!student || !isTrue_(student.activo)) {
      throw new Error('No encuentro un perfil de alumno activo para esta cuenta.');
    }
  } else if (isTeacherGoogleEmail_(email) && isTeacherAllowed_(email)) {
    student = findStudentByEmail_(email) || ensureTeacherPlayerStudent_(email);
  } else {
    throw new Error('Usa una cuenta del colegio para consultar la sesión.');
  }

  var classCode = String(student.clase || '').trim();
  var row = classCode ? workshopSessionFind_(classCode) : null;
  return {
    ok:true,
    classCode:classCode,
    session:workshopSessionPublic_(row)
  };
}

function getWorkshopSessionClientPatch_() {
  return `
<style id="la-workshop-session-style">
.workshopSessionEditor{margin:0 0 18px;padding:16px;border:1px solid var(--line);border-radius:20px;background:linear-gradient(135deg,rgba(0,212,255,.06),rgba(124,77,255,.08))}
.workshopSessionTop{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:14px}.workshopSessionTop h3{margin:0 0 4px;font-size:18px}
.workshopSessionState{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;border-radius:999px;border:1px solid var(--line);font-size:11px;font-weight:900;white-space:nowrap}
.workshopSessionState.open{background:rgba(54,211,153,.12);color:#aef0d4}.workshopSessionState.home{background:rgba(0,212,255,.10);color:#b8f2ff}.workshopSessionState.closed{background:rgba(255,255,255,.06);color:var(--muted)}
body.light .workshopSessionState.open{color:#176b4a}body.light .workshopSessionState.home{color:#0d6580}
.workshopSessionForm{display:grid;grid-template-columns:1fr 160px;gap:10px}.workshopSessionForm .wide{grid-column:1/-1}.workshopSessionForm textarea{width:100%;min-height:74px;resize:vertical;padding:12px 13px;border-radius:14px;border:1px solid var(--line);background:rgba(0,0,0,.22);color:var(--text)}body.light .workshopSessionForm textarea{background:#fff}
.workshopSessionHome{grid-column:1/-1;padding:12px;border:1px dashed var(--line);border-radius:16px}.workshopSessionHomeHead{display:flex;justify-content:space-between;gap:12px;align-items:center}.workshopSessionHomeHead label{display:flex;align-items:center;gap:7px;font-weight:800}.workshopSessionHomeHead input{width:auto}
.workshopSessionHomeTimes{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.workshopGamePicker{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.workshopPick{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:rgba(0,0,0,.10);cursor:pointer}.workshopPick input{width:18px;height:18px}.workshopPick span{min-width:0}.workshopPick strong{display:block;font-size:13px}.workshopPick small{display:block;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.workshopSessionActions{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px;margin-top:2px}.workshopSessionActions button{margin:0!important}.workshopSessionHelp{grid-column:1/-1;color:var(--muted);font-size:11px;line-height:1.45}
.studentMissionCard{margin:0 0 16px;padding:16px;border:1px solid var(--line);border-radius:22px;background:linear-gradient(135deg,rgba(124,77,255,.16),rgba(0,212,255,.10));box-shadow:0 12px 34px rgba(0,0,0,.12)}
.studentMissionHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.studentMissionHead h2{margin:0 0 5px;font-size:20px}.studentMissionBadge{display:inline-flex;padding:7px 10px;border-radius:999px;font-size:11px;font-weight:900;border:1px solid var(--line);white-space:nowrap}.studentMissionBadge.open{background:rgba(54,211,153,.14)}.studentMissionBadge.home{background:rgba(0,212,255,.14)}.studentMissionBadge.closed{background:rgba(255,255,255,.07);color:var(--muted)}
.studentMissionMessage{margin-top:10px;line-height:1.5}.studentMissionMeta{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.studentMissionMeta span{padding:6px 9px;border-radius:999px;border:1px solid var(--line);font-size:11px;color:var(--muted)}
.game.sessionLocked{filter:saturate(.2);opacity:.56}.game.sessionLocked .play{background:rgba(255,255,255,.10)!important;color:#d8deef!important;box-shadow:none!important}
@media(max-width:760px){.workshopSessionForm{grid-template-columns:1fr}.workshopSessionForm .wide,.workshopSessionHome,.workshopGamePicker,.workshopSessionActions,.workshopSessionHelp{grid-column:auto}.workshopGamePicker,.workshopSessionHomeTimes{grid-template-columns:1fr}.studentMissionHead,.workshopSessionTop{flex-direction:column}}
</style>
<script>
(function(){
  if(window.__LA_WORKSHOP_SESSION_PATCH__)return;
  window.__LA_WORKSHOP_SESSION_PATCH__=true;

  var workshopSessionState=null;
  var teacherSessionBusy=false;

  function sessionCall(name,args){return new Promise(function(resolve,reject){google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[name].apply(null,args||[]);});}
  function sessionEsc(value){return String(value==null?'':value).replace(/[&<>\"]/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[char];});}
  function sessionModeLabel(session){if(!session||!session.published)return 'Sin sesión publicada';if(session.mode==='classroom')return '🟢 Abierta en clase';if(session.mode==='home')return '🏠 Abierta en casa';if(session.homeEnabled&&session.homeStart&&session.homeEnd)return '⏱️ Cerrada · casa programada';return '🔒 Sesión cerrada';}
  function sessionModeClass(session){if(session&&session.mode==='classroom')return 'open';if(session&&session.mode==='home')return 'home';return 'closed';}
  function sessionSelected(gameId){var s=workshopSessionState&&workshopSessionState.session;if(!s||!s.published)return null;return Array.isArray(s.gameIds)&&s.gameIds.indexOf(String(gameId))!==-1;}
  function sessionAllowsGame(gameId){var s=workshopSessionState&&workshopSessionState.session;if(!s||!s.published)return null;return !!(s.active&&sessionSelected(gameId));}
  function missionWindowText(s){if(!s||!s.homeEnabled||!s.homeStart||!s.homeEnd)return '';return s.homeStart.replace('T',' ')+' → '+s.homeEnd.replace('T',' ');}

  function renderStudentMission(){
    var section=document.getElementById('juegos');if(!section)return;
    var existing=document.getElementById('studentMissionCard');var s=workshopSessionState&&workshopSessionState.session;
    if(!s||!s.published){if(existing)existing.remove();return;}
    if(!existing){existing=document.createElement('div');existing.id='studentMissionCard';existing.className='studentMissionCard';section.insertBefore(existing,section.firstChild);}
    var meta=[];if(s.targetXp>0)meta.push('<span>🎯 Objetivo: '+sessionEsc(s.targetXp)+' XP</span>');if(s.gameIds&&s.gameIds.length)meta.push('<span>🎮 '+sessionEsc(s.gameIds.length)+' juegos</span>');if(s.homeEnabled)meta.push('<span>🏠 '+sessionEsc(missionWindowText(s))+'</span>');
    existing.innerHTML='<div class="studentMissionHead"><div><div class="sub">MISIÓN ACTUAL</div><h2>'+sessionEsc(s.title||'Sesión LenguArcade')+'</h2></div><span class="studentMissionBadge '+sessionModeClass(s)+'">'+sessionEsc(sessionModeLabel(s))+'</span></div>'+(s.message?'<div class="studentMissionMessage">'+sessionEsc(s.message)+'</div>':'')+'<div class="studentMissionMeta">'+meta.join('')+'</div>';
  }

  function applyStudentSessionToCards(){
    var s=workshopSessionState&&workshopSessionState.session;renderStudentMission();if(!s||!s.published)return;
    var games=(typeof currentDashboard!=='undefined'&&currentDashboard&&currentDashboard.games)||[];
    var cards=[].slice.call(document.querySelectorAll('#games .game'));
    cards.forEach(function(card,index){
      var game=games[index];if(!game)return;var allowed=sessionAllowsGame(game.gameId);var button=card.querySelector('.play');var chip=card.querySelector('.chip');
      card.classList.toggle('sessionLocked',allowed===false);
      if(allowed===false){if(button){button.disabled=true;button.textContent='No disponible';}if(chip)chip.textContent=s.active?'🔒 Fuera de la misión':'🔒 Sesión cerrada';}
      else if(allowed===true){if(button&&!game.locked)button.disabled=false;if(chip&&!game.locked)chip.textContent=s.mode==='home'?'🏠 Disponible en casa':'✅ Disponible en la sesión';}
    });
  }

  async function refreshStudentSession(silent){
    try{var result=await sessionCall('getWorkshopSessionForCurrentUser',[]);var before=JSON.stringify(workshopSessionState&&workshopSessionState.session||null);var after=JSON.stringify(result&&result.session||null);workshopSessionState=result;if(before!==after||!silent){if(typeof currentDashboard!=='undefined'&&currentDashboard&&typeof renderGames==='function')renderGames(currentDashboard.games);applyStudentSessionToCards();}}
    catch(error){if(!silent)console.warn('No se pudo consultar la sesión del taller.',error);}
  }

  function installStudentSession(){
    if(!document.getElementById('games')||typeof renderGames!=='function'||typeof openGame!=='function')return false;
    var baseRenderGames=renderGames;renderGames=function(games){var result=baseRenderGames(games);setTimeout(applyStudentSessionToCards,0);return result;};
    var baseOpenGame=openGame;openGame=function(gameId){var allowed=sessionAllowsGame(gameId);if(allowed===false){var s=workshopSessionState&&workshopSessionState.session;var title=document.getElementById('gameModalTitle');var text=document.getElementById('gameModalText');if(title)title.textContent=s&&s.title?s.title:'Sesión cerrada';if(text)text.textContent=s&&s.active?'Este juego no forma parte de la misión que el profesor ha abierto.':'LenguArcade está cerrado ahora mismo para esta clase. Podrás entrar cuando el profesor abra la sesión o durante un horario de casa autorizado.';var modal=document.getElementById('gameModal');if(modal)modal.classList.add('open');return;}return baseOpenGame(gameId);};
    setTimeout(function(){refreshStudentSession(false);},500);setInterval(function(){refreshStudentSession(true);},30000);return true;
  }

  function teacherCurrentClass(){var select=document.getElementById('workshopClassSelect');var value=select?String(select.value||''):'';return value==='*'?'':value;}
  function teacherSessionPayload(){var editor=document.getElementById('workshopSessionEditor');return {title:(document.getElementById('workshopSessionTitle')||{}).value||'',message:(document.getElementById('workshopSessionMessage')||{}).value||'',targetXp:Number((document.getElementById('workshopSessionXp')||{}).value||0),homeEnabled:!!((document.getElementById('workshopHomeEnabled')||{}).checked),homeStart:(document.getElementById('workshopHomeStart')||{}).value||'',homeEnd:(document.getElementById('workshopHomeEnd')||{}).value||'',gameIds:editor?[].slice.call(editor.querySelectorAll('[data-session-game]:checked')).map(function(input){return input.value;}):[]};}
  function setTeacherSessionStatus(text,isError){var status=document.getElementById('workshopSessionStatus');if(status){status.textContent=text||'';status.style.color=isError?'#ff9b9b':'';}}
  function setTeacherSessionBusy(busy){teacherSessionBusy=!!busy;var editor=document.getElementById('workshopSessionEditor');if(!editor)return;[].slice.call(editor.querySelectorAll('button')).forEach(function(button){button.disabled=!!busy;});}

  function renderTeacherSession(result){
    var s=result&&result.session;if(!s)return;
    document.getElementById('workshopSessionTitle').value=s.title||'';document.getElementById('workshopSessionMessage').value=s.message||'';document.getElementById('workshopSessionXp').value=Number(s.targetXp||0);document.getElementById('workshopHomeEnabled').checked=!!s.homeEnabled;document.getElementById('workshopHomeStart').value=s.homeStart||'';document.getElementById('workshopHomeEnd').value=s.homeEnd||'';
    var state=document.getElementById('workshopSessionState');state.className='workshopSessionState '+sessionModeClass(s);state.textContent=sessionModeLabel(s);
    var selected={};(s.gameIds||[]).forEach(function(id){selected[String(id)]=true;});var picker=document.getElementById('workshopSessionGames');picker.innerHTML=(s.catalog||[]).map(function(game){return '<label class="workshopPick"><input type="checkbox" data-session-game value="'+sessionEsc(game.gameId)+'" '+(selected[String(game.gameId)]?'checked':'')+'><span><strong>'+sessionEsc((game.icono||'🎮')+' '+game.nombre)+'</strong><small>'+sessionEsc(game.categoria||game.subtitulo||'Juego LenguArcade')+'</small></span></label>';}).join('')||'<div class="sub">No hay juegos activos todavía.</div>';
    setTeacherSessionBusy(false);document.getElementById('workshopSessionClose').disabled=!s.classroomOpen;document.getElementById('workshopSessionRetire').disabled=!s.published;setTeacherSessionStatus(s.updatedAt?'Guardado · '+s.updatedAt:'Prepara la sesión y guárdala.');
  }

  async function loadTeacherSession(){var classCode=teacherCurrentClass();var editor=document.getElementById('workshopSessionEditor');if(!editor)return;if(!classCode){setTeacherSessionStatus('Elige una clase concreta arriba para preparar su sesión.');var state=document.getElementById('workshopSessionState');state.className='workshopSessionState closed';state.textContent='Selecciona una clase';return;}setTeacherSessionStatus('Cargando sesión...');try{renderTeacherSession(await sessionCall('getWorkshopSessionAdmin',[classCode]));}catch(error){setTeacherSessionStatus('No se pudo cargar la sesión: '+(error.message||error),true);}}
  async function saveTeacherSession(mode){if(teacherSessionBusy)return;var classCode=teacherCurrentClass();if(!classCode){setTeacherSessionStatus('Elige una clase concreta.',true);return;}var payload=teacherSessionPayload();if(!payload.gameIds.length){setTeacherSessionStatus('Selecciona al menos un juego para la misión.',true);return;}setTeacherSessionBusy(true);setTeacherSessionStatus(mode==='open'?'Abriendo la sesión en clase...':'Guardando sesión...');try{var result=mode==='open'?await sessionCall('setWorkshopClassroomSessionOpen',[classCode,true,payload]):await sessionCall('saveWorkshopSession',[classCode,payload]);renderTeacherSession(result);}catch(error){setTeacherSessionBusy(false);setTeacherSessionStatus('No se pudo guardar: '+(error.message||error),true);}}
  async function closeTeacherSession(){if(teacherSessionBusy)return;var classCode=teacherCurrentClass();if(!classCode)return;setTeacherSessionBusy(true);setTeacherSessionStatus('Cerrando la sesión en clase...');try{renderTeacherSession(await sessionCall('setWorkshopClassroomSessionOpen',[classCode,false,teacherSessionPayload()]));}catch(error){setTeacherSessionBusy(false);setTeacherSessionStatus('No se pudo cerrar: '+(error.message||error),true);}}
  async function retireTeacherSession(){if(teacherSessionBusy)return;var classCode=teacherCurrentClass();if(!classCode)return;setTeacherSessionBusy(true);setTeacherSessionStatus('Retirando sesión...');try{renderTeacherSession(await sessionCall('retireWorkshopSession',[classCode]));}catch(error){setTeacherSessionBusy(false);setTeacherSessionStatus('No se pudo retirar: '+(error.message||error),true);}}

  function mountTeacherSession(){
    var taller=document.getElementById('taller');if(!taller||document.getElementById('workshopSessionEditor'))return false;var grid=taller.querySelector('.workshopGameGrid');var editor=document.createElement('div');editor.id='workshopSessionEditor';editor.className='workshopSessionEditor';
    editor.innerHTML='<div class="workshopSessionTop"><div><h3>🎯 Sesión del taller</h3><div class="sub">En clase la abres y cierras tú. En casa solo funciona durante el horario que autorices.</div></div><span id="workshopSessionState" class="workshopSessionState closed">Selecciona una clase</span></div><div class="workshopSessionForm"><div class="field"><label>Título de la misión</label><input id="workshopSessionTitle" type="text" maxlength="80" placeholder="Ej.: Cazadores de tildes"></div><div class="field"><label>Objetivo XP</label><input id="workshopSessionXp" type="number" min="0" step="25" value="0"></div><div class="field wide"><label>Mensaje para los alumnos</label><textarea id="workshopSessionMessage" maxlength="400" placeholder="Qué tienen que hacer hoy, qué pueden elegir o qué reto deben superar."></textarea></div><div class="workshopSessionHome"><div class="workshopSessionHomeHead"><div><strong>🏠 Acceso supervisado en casa</strong><div class="sub">Para tardes, fines de semana o tareas concretas.</div></div><label><input id="workshopHomeEnabled" type="checkbox"> Permitir</label></div><div class="workshopSessionHomeTimes"><div class="field"><label>Desde</label><input id="workshopHomeStart" type="datetime-local"></div><div class="field"><label>Hasta</label><input id="workshopHomeEnd" type="datetime-local"></div></div></div><div class="wide"><label>Juegos de esta misión</label></div><div id="workshopSessionGames" class="workshopGamePicker"><div class="sub">Elige una clase para cargar el catálogo.</div></div><div class="workshopSessionActions"><button type="button" id="workshopSessionSave">💾 Guardar sesión</button><button type="button" id="workshopSessionOpen">▶ Abrir en clase</button><button type="button" id="workshopSessionClose">⏹ Cerrar en clase</button><button type="button" class="dangerAction" id="workshopSessionRetire">Retirar sesión</button></div><div class="workshopSessionHelp">La sesión añade una capa de supervisión al control manual de juegos de abajo. Si está publicada pero cerrada, sus juegos no se pueden abrir. El acceso en casa se activa y caduca automáticamente. Los juegos nuevos aparecerán aquí en cuanto se activen en el catálogo de LenguArcade.</div><div class="status workshopStatus" id="workshopSessionStatus"></div></div>';
    if(grid)taller.insertBefore(editor,grid);else taller.appendChild(editor);document.getElementById('workshopSessionSave').onclick=function(){saveTeacherSession('save');};document.getElementById('workshopSessionOpen').onclick=function(){saveTeacherSession('open');};document.getElementById('workshopSessionClose').onclick=closeTeacherSession;document.getElementById('workshopSessionRetire').onclick=retireTeacherSession;var select=document.getElementById('workshopClassSelect');if(select)select.addEventListener('change',function(){setTimeout(loadTeacherSession,0);});setTimeout(loadTeacherSession,0);return true;
  }
  function installTeacherSession(){var attempts=0;var timer=setInterval(function(){attempts++;if(mountTeacherSession()||attempts>30)clearInterval(timer);},150);return true;}

  if(!installStudentSession())installTeacherSession();
})();
</script>`;
}

// Segunda capa de inyección: se carga después del control de acceso y añade
// la sesión semanal y el permiso temporal de casa.
var LA_WORKSHOP_SESSION_BASE_BUILD_HTML_OUTPUT_ = buildLenguArcadeHtmlOutput_;
buildLenguArcadeHtmlOutput_ = function(file, title, patchAlumnoGoogle) {
  var output = LA_WORKSHOP_SESSION_BASE_BUILD_HTML_OUTPUT_(file, title, patchAlumnoGoogle);
  if (file !== 'LenguArcade_Alumno' && file !== 'LenguArcade_Profesor') return output;
  var content = output.getContent();
  var patch = getWorkshopSessionClientPatch_();
  var html = content.indexOf('</body>') !== -1
    ? content.replace('</body>', patch + '\n</body>')
    : content + patch;
  return HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
};
