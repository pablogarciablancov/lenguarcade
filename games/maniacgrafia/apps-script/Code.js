/*******************************************************
 * MANIACGRAFÍA · BACKEND GOOGLE SHEETS
 *
 * Cómo usarlo:
 * 1) Crea una hoja de cálculo nueva en Google Sheets.
 * 2) Extensiones > Apps Script.
 * 3) Borra el contenido de Code.gs y pega este archivo completo.
 * 4) Implementar > Nueva implementación > Aplicación web.
 * 5) Ejecutar como: tú.
 * 6) Quién tiene acceso: cualquiera con el enlace, o usuarios de tu dominio.
 * 7) Opción A: abre la URL /exec directamente o incrústala en Sites como URL.
 *    Opción B: si pegas el HTML en Sites, pega la URL /exec una sola vez en la constante del HTML.
 *******************************************************/

const SPREADSHEET_ID = ''; // Opcional. Si el script está ligado a un Sheets, déjalo vacío.
const SHEET_NAME = 'Maniacgrafia_Progreso';
const TEACHER_TOKEN_SHA256 = 'd01ef363f4e92ea0cc6548e7640b5ac92afe6b5b718d949e6e2ec195403ffc02';

const HEADERS = [
  'profileId',
  'studentName',
  'classGroup',
  'updatedAt',
  'adventureWorld',
  'adventureCompleted',
  'coins',
  'totalWords',
  'gamesPlayed',
  'maxCombo',
  'bestMode',
  'bestScore',
  'achievementsCount',
  'items',
  'progressJson',
  'studentCode'
];

function doGet(e) {
  const params = (e && e.parameter) || {};
  const view = params.view || params.page || '';
  const action = params.action || 'ping';

  try {
    // Opcional: si creas archivos HTML en este mismo Apps Script llamados Alumno y Profesor,
    // podrás abrir /exec?view=alumno o /exec?view=profesor sin pegar la URL dentro del HTML.
    if (view === 'alumno') {
      return HtmlService.createHtmlOutputFromFile('Alumno')
        .setTitle('Maniacgrafía')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }
    if (view === 'profesor') {
      return HtmlService.createHtmlOutputFromFile('Profesor')
        .setTitle('Panel del profesor · Maniacgrafía')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    if (action === 'ping') {
      return output_({ ok: true, app: 'Maniacgrafía', message: 'Backend activo' }, params.callback);
    }

    if (action === 'load') {
      const profileId = sanitizeProfileId_(params.profileId || '');
      const data = loadProgress_(profileId);
      return output_({ ok: true, found: !!data, data: data }, params.callback);
    }

    if (action === 'list') {
      requireTeacherToken_(params.token);
      return output_({ ok: true, rows: listProgress_() }, params.callback);
    }

    // Fallback para entornos donde POST no funcione. Normalmente no hace falta.
    if (action === 'save' && params.payload) {
      const data = JSON.parse(params.payload);
      saveProgress_(data);
      return output_({ ok: true, saved: true }, params.callback);
    }

    return output_({ ok: false, error: 'Acción no reconocida: ' + action }, params.callback);
  } catch (err) {
    return output_({ ok: false, error: String(err && err.message ? err.message : err) }, params.callback);
  }
}

function doPost(e) {
  try {
    const body = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const data = JSON.parse(body);
    saveProgress_(data);
    return output_({ ok: true, saved: true });
  } catch (err) {
    return output_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function requireTeacherToken_(token) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(token || ''),
    Utilities.Charset.UTF_8
  ).map(byte => ('0' + ((byte < 0 ? byte + 256 : byte).toString(16))).slice(-2)).join('');
  if (digest !== TEACHER_TOKEN_SHA256) throw new Error('Clave de profesor incorrecta.');
}

function getSpreadsheet_() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim()) return SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('No hay Spreadsheet activo. Liga este Apps Script a una hoja o rellena SPREADSHEET_ID.');
  return ss;
}

function getSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  const lastCol = Math.max(sheet.getLastColumn(), HEADERS.length);
  let firstRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  const isEmpty = firstRow.join('').trim() === '';

  if (isEmpty || firstRow[0] !== HEADERS[0]) {
    sheet.clear();
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
    return sheet;
  }

  // Añade cabeceras nuevas al final sin borrar datos antiguos.
  const existing = firstRow.filter(Boolean);
  const missing = HEADERS.filter(h => !existing.includes(h));
  if (missing.length) {
    sheet.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
    sheet.autoResizeColumns(1, existing.length + missing.length);
  }
  return sheet;
}

function saveProgress_(data) {
  if (!data || !data.profile) throw new Error('Faltan datos de perfil.');

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    const profileId = sanitizeProfileId_(data.profile.id || '');
    if (!profileId) throw new Error('profileId vacío.');

    const summary = data.summary || {};
    const stats = data.stats || {};
    const inv = data.inv || {};
    const unlockedIds = data.unlockedAchIds || [];
    const best = getBest_(stats.bestScores || {}, summary.bestMode, summary.bestScore);

    const row = [
      profileId,
      safeText_(data.profile.name || summary.studentName || stats.playerName || 'Jugador'),
      safeText_(data.profile.classGroup || summary.classGroup || stats.classGroup || 'Sin clase'),
      new Date(),
      Number(summary.adventureWorld || stats.adventureWorld || 1),
      Boolean(summary.adventureCompleted || stats.adventureCompleted),
      Number(summary.coins || stats.coins || 0),
      Number(summary.totalWords || stats.totalWords || 0),
      Number(summary.gamesPlayed || stats.gamesPlayed || 0),
      Number(summary.maxCombo || stats.maxCombo || 0),
      best.bestMode,
      Number(best.bestScore || 0),
      Array.isArray(unlockedIds) ? unlockedIds.length : Number(summary.achievementsCount || 0),
      JSON.stringify(inv),
      JSON.stringify(data),
      safeText_(data.profile.studentCode || summary.studentCode || stats.studentCode || '')
    ];

    const existingRow = findProfileRow_(sheet, profileId);
    if (existingRow > 0) {
      sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
  } finally {
    lock.releaseLock();
  }
}

function loadProgress_(profileId) {
  profileId = sanitizeProfileId_(profileId || '');
  if (!profileId) return null;
  const sheet = getSheet_();
  const rowNum = findProfileRow_(sheet, profileId);
  if (rowNum <= 0) return null;
  const progressJson = sheet.getRange(rowNum, HEADERS.indexOf('progressJson') + 1).getValue();
  if (!progressJson) return null;
  try {
    return JSON.parse(progressJson);
  } catch (err) {
    throw new Error('El progreso de ' + profileId + ' está corrupto: ' + err.message);
  }
}

function listProgress_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  const rows = values.map(row => {
    const obj = {};
    HEADERS.forEach((h, i) => obj[h] = row[i]);
    obj.updatedAt = obj.updatedAt instanceof Date ? obj.updatedAt.toISOString() : obj.updatedAt;
    try {
      const parsed = obj.progressJson ? JSON.parse(obj.progressJson) : null;
      obj.summary = parsed ? parsed.summary || {} : {};
      obj.bestScores = parsed && parsed.stats ? parsed.stats.bestScores || {} : {};
      obj.unlockedAchIds = parsed ? parsed.unlockedAchIds || [] : [];
    } catch (e) {
      obj.summary = {};
      obj.bestScores = {};
      obj.unlockedAchIds = [];
    }
    return obj;
  });

  rows.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  return rows;
}

function findProfileRow_(sheet, profileId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === profileId) return i + 2;
  }
  return -1;
}

function getBest_(scores, fallbackMode, fallbackScore) {
  let bestMode = fallbackMode || '—';
  let bestScore = Number(fallbackScore || 0);
  Object.keys(scores || {}).forEach(mode => {
    const score = Number(scores[mode] || 0);
    if (score > bestScore) {
      bestScore = score;
      bestMode = mode;
    }
  });
  return { bestMode, bestScore };
}

function sanitizeProfileId_(text) {
  return String(text || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_').slice(0, 90);
}

function safeText_(text) {
  return String(text || '').trim().slice(0, 120);
}

function output_(obj, callback) {
  const json = JSON.stringify(obj);
  if (callback) {
    const safeCallback = String(callback).replace(/[^a-zA-Z0-9_.$]/g, '');
    return ContentService
      .createTextOutput(safeCallback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
