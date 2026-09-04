/**
 * LenguArcade - Gestión de clases y alumnado.
 *
 * Añade al panel del profesor acciones de archivo/restauración y borrado
 * definitivo. Supabase es la fuente principal; esta capa mantiene coherente
 * el respaldo histórico de Sheets cuando existe una fila equivalente.
 */

function requireRosterManagerTeacher_() {
  var email = requireActiveGoogleEmail_();
  if (!isTeacherGoogleEmail_(email) || !isTeacherAllowed_(email)) {
    throw new Error('Esta acción requiere una cuenta de profesor autorizada @fomento.edu.');
  }
  return email;
}

function rosterSheetData_(sheetName) {
  var sheet = getDb_().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 1) return null;
  var values = sheet.getDataRange().getValues();
  if (!values.length) return null;
  var headers = values[0].map(function(value){ return String(value || ''); });
  return {sheet:sheet, headers:headers, values:values};
}

function rosterRowObject_(headers, row) {
  var object = {};
  headers.forEach(function(header, index){ object[header] = row[index]; });
  return object;
}

function rosterEnsureStudentArchiveColumns_() {
  var sheet = getDb_().getSheetByName(LA_CONFIG.SHEETS.ALUMNOS);
  if (!sheet) return;
  var lastColumn = Math.max(1, sheet.getLastColumn());
  var headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function(value){ return String(value || ''); });
  ['archivoMotivo','archivoClase','archivadoAt'].forEach(function(header) {
    if (headers.indexOf(header) !== -1) return;
    headers.push(header);
    sheet.getRange(1, headers.length).setValue(header);
  });
}

function rosterUpdateRows_(sheetName, predicate, patch) {
  var data = rosterSheetData_(sheetName);
  if (!data) return 0;
  var changed = 0;
  for (var index = 1; index < data.values.length; index += 1) {
    var object = rosterRowObject_(data.headers, data.values[index]);
    if (!predicate(object)) continue;
    Object.keys(patch || {}).forEach(function(key) {
      var column = data.headers.indexOf(key);
      if (column >= 0) data.sheet.getRange(index + 1, column + 1).setValue(patch[key]);
    });
    changed += 1;
  }
  return changed;
}

function rosterDeleteRows_(sheetName, predicate) {
  var data = rosterSheetData_(sheetName);
  if (!data) return 0;
  var rows = [];
  for (var index = 1; index < data.values.length; index += 1) {
    if (predicate(rosterRowObject_(data.headers, data.values[index]))) rows.push(index + 1);
  }
  rows.sort(function(a,b){ return b-a; }).forEach(function(rowNumber){ data.sheet.deleteRow(rowNumber); });
  return rows.length;
}

function rosterSameText_(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

function rosterStudentPredicate_(reference) {
  var studentId = String(reference.studentId || '').trim();
  var email = String(reference.email || '').trim().toLowerCase();
  return function(row) {
    if (studentId && rosterSameText_(row.studentId, studentId)) return true;
    if (email && rosterSameText_(row.email, email)) return true;
    return false;
  };
}

function rosterClassPredicate_(reference) {
  var classCode = String(reference.classCode || '').trim();
  var className = String(reference.className || '').trim();
  var section = String(reference.section || '').trim();
  return function(row) {
    return (classCode && (rosterSameText_(row.classCode, classCode) || rosterSameText_(row.clase, classCode))) ||
      (className && (rosterSameText_(row.nombreVisible, className) || rosterSameText_(row.clase, className))) ||
      (section && rosterSameText_(row.nombreVisible, section));
  };
}

function rosterDeleteStudentReferences_(reference) {
  var predicate = rosterStudentPredicate_(reference);
  var sheets = [
    LA_CONFIG.SHEETS.PROGRESO,
    LA_CONFIG.SHEETS.EVENTOS,
    LA_CONFIG.SHEETS.LOGROS,
    LA_CONFIG.SHEETS.EVALUACIONES,
    LA_CONFIG.SHEETS.ERRORES,
    LA_CONFIG.SHEETS.RAW
  ];
  var deleted = 0;
  sheets.forEach(function(sheetName){ deleted += rosterDeleteRows_(sheetName, predicate); });
  deleted += rosterDeleteRows_(LA_CONFIG.SHEETS.ALUMNOS, predicate);
  return deleted;
}

function applyRosterBackupAction(action, payload) {
  requireRosterManagerTeacher_();
  ensureSheets_();
  rosterEnsureStudentArchiveColumns_();
  var cleanAction = String(action || '').trim();
  var reference = payload && typeof payload === 'object' ? payload : {};
  var changed = 0;
  var archiveKey = String(reference.classCode || reference.className || reference.section || '').trim();

  if (cleanAction === 'archiveStudent') {
    changed = rosterUpdateRows_(
      LA_CONFIG.SHEETS.ALUMNOS,
      rosterStudentPredicate_(reference),
      {activo:false, archivoMotivo:'manual', archivoClase:'', archivadoAt:nowIso_()}
    );
  } else if (cleanAction === 'restoreStudent') {
    changed = rosterUpdateRows_(
      LA_CONFIG.SHEETS.ALUMNOS,
      rosterStudentPredicate_(reference),
      {activo:true, archivoMotivo:'', archivoClase:'', archivadoAt:''}
    );
  } else if (cleanAction === 'deleteStudent') {
    changed = rosterDeleteStudentReferences_(reference);
  } else if (cleanAction === 'archiveClass') {
    var archiveClassPredicate = rosterClassPredicate_(reference);
    changed += rosterUpdateRows_(LA_CONFIG.SHEETS.CLASES, archiveClassPredicate, {activa:false});
    changed += rosterUpdateRows_(LA_CONFIG.SHEETS.ALUMNOS, function(row){
      if (!isTrue_(row.activo)) return false;
      return archiveClassPredicate({
        classCode:row.clase,
        clase:row.clase,
        nombreVisible:row.clase
      });
    }, {activo:false, archivoMotivo:'class', archivoClase:archiveKey, archivadoAt:nowIso_()});
  } else if (cleanAction === 'restoreClass') {
    var restoreClassPredicate = rosterClassPredicate_(reference);
    changed += rosterUpdateRows_(LA_CONFIG.SHEETS.CLASES, restoreClassPredicate, {activa:true});
    changed += rosterUpdateRows_(LA_CONFIG.SHEETS.ALUMNOS, function(row){
      if (!rosterSameText_(row.archivoMotivo, 'class')) return false;
      if (archiveKey && !rosterSameText_(row.archivoClase, archiveKey)) return false;
      return restoreClassPredicate({
        classCode:row.clase,
        clase:row.clase,
        nombreVisible:row.clase
      });
    }, {activo:true, archivoMotivo:'', archivoClase:'', archivadoAt:''});
  } else if (cleanAction === 'deleteClass') {
    var deleteClassPredicate = rosterClassPredicate_(reference);
    var studentsData = rosterSheetData_(LA_CONFIG.SHEETS.ALUMNOS);
    var studentRefs = [];
    if (studentsData) {
      for (var index = 1; index < studentsData.values.length; index += 1) {
        var row = rosterRowObject_(studentsData.headers, studentsData.values[index]);
        if (deleteClassPredicate({classCode:row.clase, clase:row.clase, nombreVisible:row.clase})) {
          studentRefs.push({studentId:row.studentId, email:row.email});
        }
      }
    }
    studentRefs.forEach(function(student){ changed += rosterDeleteStudentReferences_(student); });
    changed += rosterDeleteRows_(LA_CONFIG.SHEETS.CLASES, deleteClassPredicate);
    if (typeof LA_WORKSHOP_ACCESS_CONFIG_ !== 'undefined') {
      changed += rosterDeleteRows_(LA_WORKSHOP_ACCESS_CONFIG_.SHEET, function(row){
        return reference.classCode && rosterSameText_(row.classCode, reference.classCode);
      });
    }
  } else {
    throw new Error('Acción de gestión no reconocida.');
  }

  SpreadsheetApp.flush();
  try {
    if (typeof clearCacheV03_ === 'function') clearCacheV03_();
    CacheService.getScriptCache().remove('public_meta_v04');
  } catch (error) {}

  return {ok:true, action:cleanAction, backupRowsChanged:changed};
}
