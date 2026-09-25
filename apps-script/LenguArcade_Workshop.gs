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

function ensureWorkshopSheets_() {
  var ss = getDb_();
  ensureSheetHeaders_(ss, LA_WORKSHOP_ACCESS_CONFIG_.SHEET, LA_WORKSHOP_ACCESS_CONFIG_.HEADERS);
  ensureSheetHeaders_(ss, LA_WORKSHOP_SESSION_CONFIG_.SHEET, LA_WORKSHOP_SESSION_CONFIG_.HEADERS);
  ensureSheetHeaders_(ss, LA_WORKSHOP_PLAN_CONFIG_.SHEET, LA_WORKSHOP_PLAN_CONFIG_.HEADERS);
  return ss;
}

function normalizeWorkshopScope_(classCode) {
  var scope = String(classCode || LA_WORKSHOP_ACCESS_CONFIG_.GLOBAL_SCOPE).trim();
  if (!scope || scope.toLowerCase() === 'all' || scope.toLowerCase() === 'todas') {
    return LA_WORKSHOP_ACCESS_CONFIG_.GLOBAL_SCOPE;
  }
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
  ensureWorkshopSheets_();
  return buildWorkshopAccessState_(classCode);
}

function setWorkshopGameAccess(classCode, gameId, enabled) {
  var teacherEmail = requireWorkshopTeacher_();
  ensureWorkshopSheets_();
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
  ensureWorkshopSheets_();
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
  ensureWorkshopSheets_();
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
    'homeEnabled','homeStart','homeEnd','gameIds','planId','updatedAt','updatedBy'
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
  if (value == null || value === '') return '';
  var tz = (Session.getScriptTimeZone && Session.getScriptTimeZone()) || 'Europe/Madrid';

  // Google Sheets devuelve las celdas de fecha como objetos Date.
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, tz, "yyyy-MM-dd'T'HH:mm");
  }

  var text = String(value || '').trim();
  if (!text) return '';

  // Formato canónico que usa el editor HTML datetime-local.
  var match = text.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  if (match) return match[1] + 'T' + match[2];

  // Compatibilidad con valores antiguos serializados como texto de Date.
  var legacyText = text.replace(/\s+\([^)]*\)\s*$/, '');
  var parsed = new Date(legacyText);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, tz, "yyyy-MM-dd'T'HH:mm");
  }

  throw new Error('Fecha u hora no válida: ' + text);
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
    planId:String(row.planId || ''),
    mode:mode,
    active:classroomOpen || homeActive,
    nowLocal:nowLocal,
    updatedAt:String(row.updatedAt || '')
  };
}

function getWorkshopSessionAdmin(classCode) {
  requireWorkshopTeacher_();
  ensureWorkshopSheets_();
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
    planId:'',
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
  ensureWorkshopSheets_();
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
    planId:String(payload.planId || ''),
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
  ensureWorkshopSheets_();
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
    planId:String(existing.planId || ''),
    updatedAt:nowIso_(),
    updatedBy:teacherEmail
  });
  SpreadsheetApp.flush();
  return getWorkshopSessionAdmin(cleanClass);
}


var LA_WORKSHOP_PLAN_CONFIG_ = {
  SHEET: 'TallerPlanes',
  HEADERS: [
    'planId','classCode','classCodes','title','message','targetXp','plannedAt',
    'homeEnabled','homeStart','homeEnd','gameIds','usedAt','usedByClass',
    'createdAt','updatedAt','updatedBy'
  ]
};

function ensureWorkshopPlanSheet_() {
  var ss = getDb_();
  ensureSheetHeaders_(ss, LA_WORKSHOP_PLAN_CONFIG_.SHEET, LA_WORKSHOP_PLAN_CONFIG_.HEADERS);
  return ss.getSheetByName(LA_WORKSHOP_PLAN_CONFIG_.SHEET);
}

function workshopPlanRows_() {
  return rowsToObjects_(ensureWorkshopPlanSheet_());
}

function workshopPlanCleanId_(value) {
  return String(value || '').trim().replace(/[^A-Za-z0-9_-]/g, '').slice(0, 120);
}

function workshopPlanClassCodes_(value, fallbackClassCode) {
  var result = [];
  if (Array.isArray(value)) {
    result = value;
  } else {
    var text = String(value || '').trim();
    if (text) {
      try {
        var parsed = JSON.parse(text);
        if (Array.isArray(parsed)) result = parsed;
        else result = text.split(',');
      } catch (error) {
        result = text.split(',');
      }
    }
  }
  if (!result.length && fallbackClassCode) result = [fallbackClassCode];
  var seen = {};
  return result.map(function(code){ return String(code || '').trim(); }).filter(function(code) {
    if (!code || code === LA_WORKSHOP_ACCESS_CONFIG_.GLOBAL_SCOPE || seen[code]) return false;
    seen[code] = true;
    return true;
  }).slice(0, 40);
}

function workshopPlanUsedMap_(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  var text = String(value || '').trim();
  if (!text) return {};
  try {
    var parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    return {};
  }
}

function workshopPlanPublic_(row, activeSession, viewerClassCode) {
  if (!row) return null;
  var planId = workshopPlanCleanId_(row.planId);
  var active = !!(activeSession && activeSession.published && String(activeSession.planId || '') === planId);
  var classCodes = workshopPlanClassCodes_(row.classCodes, row.classCode);
  var usedMap = workshopPlanUsedMap_(row.usedByClass);
  var viewerClass = String(viewerClassCode || '').trim();
  var viewerUsedAt = viewerClass ? String(usedMap[viewerClass] || '') : '';
  if (!viewerUsedAt && viewerClass && !Object.keys(usedMap).length && String(row.classCode || '') === viewerClass) {
    viewerUsedAt = String(row.usedAt || '');
  }
  return {
    planId:planId,
    classCode:String(row.classCode || classCodes[0] || ''),
    classCodes:classCodes,
    title:String(row.title || 'Sesión del taller'),
    message:String(row.message || ''),
    targetXp:Math.max(0, Number(row.targetXp || 0)),
    plannedAt:workshopSessionNormalizeLocalDateTime_(row.plannedAt || ''),
    homeEnabled:workshopSessionBool_(row.homeEnabled),
    homeStart:workshopSessionNormalizeLocalDateTime_(row.homeStart || ''),
    homeEnd:workshopSessionNormalizeLocalDateTime_(row.homeEnd || ''),
    gameIds:workshopSessionGameIds_(row.gameIds),
    usedAt:viewerUsedAt,
    usedByClass:usedMap,
    createdAt:String(row.createdAt || ''),
    updatedAt:String(row.updatedAt || ''),
    active:active
  };
}

function workshopPlannerCatalogIds_() {
  var result = {};
  getWorkshopCatalog_().forEach(function(game){ result[String(game.gameId)] = true; });
  return result;
}

function workshopPlanValidatePayload_(payload) {
  payload = payload || {};
  var catalogIds = workshopPlannerCatalogIds_();
  var gameIds = workshopSessionGameIds_(payload.gameIds).filter(function(id){ return catalogIds[id]; });
  if (!gameIds.length) throw new Error('Selecciona al menos un juego para esta sesión.');

  var plannedAt = workshopSessionNormalizeLocalDateTime_(payload.plannedAt || '');
  var homeEnabled = !!payload.homeEnabled;
  var homeStart = workshopSessionNormalizeLocalDateTime_(payload.homeStart || '');
  var homeEnd = workshopSessionNormalizeLocalDateTime_(payload.homeEnd || '');
  if (homeEnabled && (!homeStart || !homeEnd)) {
    throw new Error('Para permitir el acceso en casa, indica una fecha y hora de inicio y de fin.');
  }
  if (homeEnabled && homeEnd <= homeStart) {
    throw new Error('La hora de fin del acceso en casa debe ser posterior a la de inicio.');
  }

  return {
    title:String(payload.title || '').trim() || 'Sesión del taller',
    message:String(payload.message || '').trim(),
    targetXp:Math.max(0, Math.round(Number(payload.targetXp || 0))),
    plannedAt:plannedAt,
    homeEnabled:homeEnabled,
    homeStart:homeStart,
    homeEnd:homeEnd,
    gameIds:gameIds,
    classCodes:workshopPlanClassCodes_(payload.classCodes, '')
  };
}

function workshopPlanFind_(classCode, planId) {
  var cleanClass = workshopSessionCleanClass_(classCode);
  var cleanId = workshopPlanCleanId_(planId);
  return workshopPlanRows_().find(function(row) {
    return workshopPlanCleanId_(row.planId) === cleanId &&
      workshopPlanClassCodes_(row.classCodes, row.classCode).indexOf(cleanClass) !== -1;
  }) || null;
}

function getWorkshopPlannerAdmin(classCode) {
  requireWorkshopTeacher_();
  ensureWorkshopSheets_();
  var cleanClass = workshopSessionCleanClass_(classCode);
  var activeSession = workshopSessionPublic_(workshopSessionFind_(cleanClass));
  var plans = workshopPlanRows_()
    .filter(function(row){ return workshopPlanClassCodes_(row.classCodes, row.classCode).indexOf(cleanClass) !== -1; })
    .map(function(row){ return workshopPlanPublic_(row, activeSession, cleanClass); })
    .sort(function(a,b) {
      if (a.active !== b.active) return a.active ? -1 : 1;
      if (!!a.plannedAt !== !!b.plannedAt) return a.plannedAt ? -1 : 1;
      if (a.plannedAt && b.plannedAt && a.plannedAt !== b.plannedAt) return a.plannedAt < b.plannedAt ? -1 : 1;
      return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });
  return {
    ok:true,
    classCode:cleanClass,
    plans:plans,
    activeSession:activeSession,
    catalog:getWorkshopCatalog_()
  };
}

function saveWorkshopPlan(classCode, payload) {
  var teacherEmail = requireWorkshopTeacher_();
  ensureWorkshopSheets_();
  var cleanClass = workshopSessionCleanClass_(classCode);
  var clean = workshopPlanValidatePayload_(payload);
  var planId = workshopPlanCleanId_(payload && payload.planId) || ('plan_' + Utilities.getUuid().replace(/-/g, '').slice(0, 20));
  var existing = workshopPlanFind_(cleanClass, planId);
  var now = nowIso_();
  var selectedClasses = clean.classCodes.length ? clean.classCodes : (existing ? workshopPlanClassCodes_(existing.classCodes, existing.classCode) : [cleanClass]);
  if (!selectedClasses.length) selectedClasses = [cleanClass];
  var primaryClass = selectedClasses[0] || cleanClass;
  var usedMap = existing ? workshopPlanUsedMap_(existing.usedByClass) : {};
  

  upsertByKeys_(ensureWorkshopPlanSheet_(), ['planId'], {
    planId:planId,
    classCode:primaryClass,
    classCodes:JSON.stringify(selectedClasses),
    title:clean.title,
    message:clean.message,
    targetXp:clean.targetXp,
    plannedAt:clean.plannedAt,
    homeEnabled:clean.homeEnabled,
    homeStart:clean.homeStart,
    homeEnd:clean.homeEnd,
    gameIds:JSON.stringify(clean.gameIds),
    usedAt:existing ? String(existing.usedAt || '') : '',
    usedByClass:JSON.stringify(usedMap),
    createdAt:existing ? String(existing.createdAt || now) : now,
    updatedAt:now,
    updatedBy:teacherEmail
  });
  SpreadsheetApp.flush();
  var result = getWorkshopPlannerAdmin(cleanClass);
  result.savedPlanId = planId;
  return result;
}

function saveWorkshopPlanFast(classCode, payload) {
  var teacherEmail = requireWorkshopTeacher_();
  ensureWorkshopSheets_();
  var cleanClass = workshopSessionCleanClass_(classCode);
  var clean = workshopPlanValidatePayload_(payload);
  var planId = workshopPlanCleanId_(payload && payload.planId) || ('plan_' + Utilities.getUuid().replace(/-/g, '').slice(0, 20));
  var existing = workshopPlanFind_(cleanClass, planId);
  var now = nowIso_();
  var selectedClasses = clean.classCodes.length ? clean.classCodes : (existing ? workshopPlanClassCodes_(existing.classCodes, existing.classCode) : [cleanClass]);
  if (!selectedClasses.length) selectedClasses = [cleanClass];
  var primaryClass = selectedClasses[0] || cleanClass;
  var usedMap = existing ? workshopPlanUsedMap_(existing.usedByClass) : {};
  
  var record = {
    planId:planId,
    classCode:primaryClass,
    classCodes:JSON.stringify(selectedClasses),
    title:clean.title,
    message:clean.message,
    targetXp:clean.targetXp,
    plannedAt:clean.plannedAt,
    homeEnabled:clean.homeEnabled,
    homeStart:clean.homeStart,
    homeEnd:clean.homeEnd,
    gameIds:JSON.stringify(clean.gameIds),
    usedAt:existing ? String(existing.usedAt || '') : '',
    usedByClass:JSON.stringify(usedMap),
    createdAt:existing ? String(existing.createdAt || now) : now,
    updatedAt:now,
    updatedBy:teacherEmail
  };
  upsertByKeys_(ensureWorkshopPlanSheet_(), ['planId'], record);
  SpreadsheetApp.flush();
  return {
    ok:true,
    classCode:cleanClass,
    savedPlanId:planId,
    plan:workshopPlanPublic_(record, workshopSessionPublic_(workshopSessionFind_(cleanClass)), cleanClass)
  };
}

function saveAndActivateWorkshopPlan(classCode, payload, openNow) {
  var teacherEmail = requireWorkshopTeacher_();
  ensureWorkshopSheets_();
  var cleanClass = workshopSessionCleanClass_(classCode);
  var clean = workshopPlanValidatePayload_(payload);
  var planId = workshopPlanCleanId_(payload && payload.planId) || ('plan_' + Utilities.getUuid().replace(/-/g, '').slice(0, 20));
  var existing = workshopPlanFind_(cleanClass, planId);
  var now = nowIso_();
  var selectedClasses = clean.classCodes.length ? clean.classCodes : (existing ? workshopPlanClassCodes_(existing.classCodes, existing.classCode) : [cleanClass]);
  if (!selectedClasses.length) selectedClasses = [cleanClass];
  var primaryClass = selectedClasses[0] || cleanClass;
  var usedMap = existing ? workshopPlanUsedMap_(existing.usedByClass) : {};
  usedMap[cleanClass] = now;
  var planRecord = {
    planId:planId,
    classCode:primaryClass,
    classCodes:JSON.stringify(selectedClasses),
    title:clean.title,
    message:clean.message,
    targetXp:clean.targetXp,
    plannedAt:clean.plannedAt,
    homeEnabled:clean.homeEnabled,
    homeStart:clean.homeStart,
    homeEnd:clean.homeEnd,
    gameIds:JSON.stringify(clean.gameIds),
    usedAt:now,
    usedByClass:JSON.stringify(usedMap),
    createdAt:existing ? String(existing.createdAt || now) : now,
    updatedAt:now,
    updatedBy:teacherEmail
  };

  upsertByKeys_(ensureWorkshopPlanSheet_(), ['planId'], planRecord);
  applyWorkshopPlanAccess_(cleanClass, clean.gameIds, teacherEmail);
  upsertByKeys_(ensureWorkshopSessionSheet_(), ['classCode'], {
    classCode:cleanClass,
    title:clean.title,
    message:clean.message,
    targetXp:clean.targetXp,
    published:true,
    classroomOpen:!!openNow,
    homeEnabled:clean.homeEnabled,
    homeStart:clean.homeStart,
    homeEnd:clean.homeEnd,
    gameIds:JSON.stringify(clean.gameIds),
    planId:planId,
    updatedAt:now,
    updatedBy:teacherEmail
  });
  SpreadsheetApp.flush();

  var result = getWorkshopPlannerAdmin(cleanClass);
  result.savedPlanId = planId;
  return result;
}

function deleteWorkshopPlan(classCode, planId) {
  requireWorkshopTeacher_();
  ensureWorkshopSheets_();
  var cleanClass = workshopSessionCleanClass_(classCode);
  var cleanId = workshopPlanCleanId_(planId);
  if (!cleanId) throw new Error('Sesión preparada no reconocida.');
  var activeElsewhere = workshopSessionRows_().some(function(row) {
    return workshopSessionBool_(row.published) && workshopPlanCleanId_(row.planId) === cleanId;
  });
  if (activeElsewhere) {
    throw new Error('Retira primero este taller de las clases en las que esté activo.');
  }
  var sheet = ensureWorkshopPlanSheet_();
  var rows = rowsToObjects_(sheet);
  var index = rows.findIndex(function(row) {
    return workshopPlanCleanId_(row.planId) === cleanId &&
      workshopPlanClassCodes_(row.classCodes, row.classCode).indexOf(cleanClass) !== -1;
  });
  if (index < 0) throw new Error('La sesión preparada ya no existe.');
  sheet.deleteRow(index + 2);
  SpreadsheetApp.flush();
  return getWorkshopPlannerAdmin(cleanClass);
}

function applyWorkshopPlanAccess_(classCode, gameIds, teacherEmail) {
  var cleanClass = workshopSessionCleanClass_(classCode);
  var selected = {};
  workshopSessionGameIds_(gameIds).forEach(function(id){ selected[String(id)] = true; });
  var sheet = ensureWorkshopAccessSheet_();
  var headers = getHeaders_(sheet);
  var rows = rowsToObjects_(sheet);
  var byKey = {};
  rows.forEach(function(row, index) {
    byKey[String(row.classCode || '') + '|' + String(row.gameId || '')] = index;
  });
  var now = nowIso_();

  getWorkshopCatalog_().forEach(function(game) {
    var gameId = String(game.gameId || '');
    var record = {
      classCode:cleanClass,
      gameId:gameId,
      enabled:!!selected[gameId],
      updatedAt:now,
      updatedBy:teacherEmail
    };
    var key = cleanClass + '|' + gameId;
    if (Object.prototype.hasOwnProperty.call(byKey, key)) {
      rows[byKey[key]] = Object.assign({}, rows[byKey[key]], record);
    } else {
      byKey[key] = rows.length;
      rows.push(record);
    }
  });

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows.map(function(row) {
      return headers.map(function(header){ return row[header] != null ? row[header] : ''; });
    }));
  }
  var extra = sheet.getLastRow() - 1 - rows.length;
  if (extra > 0) sheet.getRange(rows.length + 2, 1, extra, headers.length).clearContent();
}

function activateWorkshopPlan(classCode, planId, openNow) {
  var teacherEmail = requireWorkshopTeacher_();
  ensureWorkshopSheets_();
  var cleanClass = workshopSessionCleanClass_(classCode);
  var row = workshopPlanFind_(cleanClass, planId);
  if (!row) throw new Error('La sesión preparada ya no existe.');
  var plan = workshopPlanPublic_(row, null, cleanClass);
  var now = nowIso_();
  var usedMap = workshopPlanUsedMap_(row.usedByClass);
  usedMap[cleanClass] = now;

  applyWorkshopPlanAccess_(cleanClass, plan.gameIds, teacherEmail);

  upsertByKeys_(ensureWorkshopSessionSheet_(), ['classCode'], {
    classCode:cleanClass,
    title:plan.title,
    message:plan.message,
    targetXp:plan.targetXp,
    published:true,
    classroomOpen:!!openNow,
    homeEnabled:plan.homeEnabled,
    homeStart:plan.homeStart,
    homeEnd:plan.homeEnd,
    gameIds:JSON.stringify(plan.gameIds),
    planId:plan.planId,
    updatedAt:now,
    updatedBy:teacherEmail
  });

  upsertByKeys_(ensureWorkshopPlanSheet_(), ['planId'], {
    planId:plan.planId,
    classCode:String(row.classCode || plan.classCodes[0] || cleanClass),
    classCodes:JSON.stringify(plan.classCodes&&plan.classCodes.length?plan.classCodes:[cleanClass]),
    title:plan.title,
    message:plan.message,
    targetXp:plan.targetXp,
    plannedAt:plan.plannedAt,
    homeEnabled:plan.homeEnabled,
    homeStart:plan.homeStart,
    homeEnd:plan.homeEnd,
    gameIds:JSON.stringify(plan.gameIds),
    usedAt:now,
    usedByClass:JSON.stringify(usedMap),
    createdAt:String(row.createdAt || now),
    updatedAt:now,
    updatedBy:teacherEmail
  });

  SpreadsheetApp.flush();
  return getWorkshopPlannerAdmin(cleanClass);
}

function closeWorkshopPlannerSession(classCode) {
  requireWorkshopTeacher_();
  ensureWorkshopSheets_();
  var cleanClass = workshopSessionCleanClass_(classCode);
  var existing = workshopSessionFind_(cleanClass);
  if (!existing) return getWorkshopPlannerAdmin(cleanClass);
  setWorkshopClassroomSessionOpen(cleanClass, false, {
    title:String(existing.title || ''),
    message:String(existing.message || ''),
    targetXp:Number(existing.targetXp || 0),
    homeEnabled:workshopSessionBool_(existing.homeEnabled),
    homeStart:String(existing.homeStart || ''),
    homeEnd:String(existing.homeEnd || ''),
    gameIds:workshopSessionGameIds_(existing.gameIds),
    planId:String(existing.planId || '')
  });
  return getWorkshopPlannerAdmin(cleanClass);
}

function retireWorkshopPlannerSession(classCode) {
  var teacherEmail = requireWorkshopTeacher_();
  ensureWorkshopSheets_();
  var cleanClass = workshopSessionCleanClass_(classCode);
  retireWorkshopSession(cleanClass);
  applyWorkshopPlanAccess_(cleanClass, [], teacherEmail);
  SpreadsheetApp.flush();
  return getWorkshopPlannerAdmin(cleanClass);
}

function getWorkshopSessionForCurrentUser() {
  ensureWorkshopSheets_();
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
