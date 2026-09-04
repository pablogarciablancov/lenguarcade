/**
 * LenguArcade - taller: acceso a juegos, sesiones semanales y permisos temporales.
 * Lógica de servidor consolidada; la interfaz está integrada en los HTML base.
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
