/**
 * LenguArcade - autenticación Google, compatibilidad V03 y utilidades web.
 *
 * Arquitectura consolidada: la interfaz vive directamente en los HTML base;
 * este archivo contiene únicamente lógica de servidor.
 */
const LA_GOOGLE_AUTH_CONFIG = {
  STUDENT_DOMAIN: '@alumno.fomento.edu',
  TEACHER_DOMAIN: '@fomento.edu',
  TEACHER_ALLOWED_CONFIG_KEY: 'TEACHER_ALLOWED_EMAILS',
  TEACHER_PLAYER_CLASS: 'PROFES',
  GITHUB_PAGES_GAMES_BASE: 'https://raw.githack.com/pablogarciablancov/lenguarcade/main/games/'
};

function buildExternalRedirectHtmlOutput_(url, title) {
  const safeUrl = String(url || '').replace(/"/g, '%22');
  const safeTitle = String(title || 'LenguArcade').replace(/[&<>"']/g, function(ch) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];
  });
  return HtmlService.createHtmlOutput(
    '<!doctype html><html><head><base target="_top"><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + safeTitle + '</title>' +
    '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,Segoe UI,Arial,sans-serif;background:#0b1020;color:#f5f7ff}.box{max-width:520px;padding:28px;border-radius:24px;background:#17213d;box-shadow:0 18px 46px rgba(0,0,0,.34)}a{color:#7dd3fc}</style>' +
    '</head><body><div class="box"><h1>Cargando ' + safeTitle + '...</h1><p>Abriendo el juego desde GitHub/RawGithack.</p><p><a href="' + safeUrl + '">Abrir manualmente</a></p></div>' +
    '<script>window.top.location.href="' + safeUrl + '";<\/script></body></html>'
  )
    .setTitle(safeTitle)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getGithubGameUrl_(gameId) {
  const cleanGameId = String(gameId || '').replace(/^\/+|\/+$/g, '');
  return LA_GOOGLE_AUTH_CONFIG.GITHUB_PAGES_GAMES_BASE + cleanGameId + '/';
}

function normalizeDashboardGameUrlsForGithub_(dashboard) {
  if (!dashboard || !Array.isArray(dashboard.games)) return dashboard;
  dashboard.games = dashboard.games.map(function(game) {
    if (!game || String(game.gameId || '').toLowerCase() !== 'narratoria') return game;
    const copy = Object.assign({}, game);
    copy.url = getGithubGameUrl_('narratoria');
    copy.embedUrl = getGithubGameUrl_('narratoria');
    return copy;
  });
  return dashboard;
}

function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

function getCurrentGoogleAccount() {
  const email = getActiveUserEmail_();
  return {
    ok: true,
    email,
    studentDomain: LA_GOOGLE_AUTH_CONFIG.STUDENT_DOMAIN,
    teacherDomain: LA_GOOGLE_AUTH_CONFIG.TEACHER_DOMAIN,
    isStudent: isStudentGoogleEmail_(email),
    isTeacher: isTeacherGoogleEmail_(email)
  };
}

function loginWithGoogleAccount(mode) {
  const email = requireActiveGoogleEmail_();
  const cleanMode = String(mode || 'auto').toLowerCase();
  if (cleanMode === 'student' || cleanMode === 'alumno' || cleanMode === 'player') {
    if (isStudentGoogleEmail_(email)) return loginStudentWithGoogle();
    if (isTeacherGoogleEmail_(email)) return loginTeacherAsStudentWithGoogle();
    throw new Error('Para jugar debes usar una cuenta del colegio: @alumno.fomento.edu o @fomento.edu.');
  }
  if (cleanMode === 'teacher' || cleanMode === 'profesor' || cleanMode === 'profe') return loginTeacherWithGoogle();
  if (isStudentGoogleEmail_(email)) return loginStudentWithGoogle();
  if (isTeacherGoogleEmail_(email)) return loginTeacherWithGoogle();
  throw new Error('Usa una cuenta del colegio: @alumno.fomento.edu para alumnos o @fomento.edu para profesores.');
}

function loginStudentWithGoogle() {
  ensureSheets_();
  const email = requireActiveGoogleEmail_();
  if (!isStudentGoogleEmail_(email)) throw new Error('Para entrar como alumno debes usar tu cuenta @alumno.fomento.edu. Si eres profesor y quieres jugar, usa el botón "Entrar como profe-jugador".');
  const student = findStudentByEmail_(email);
  if (!student) throw new Error('No encuentro esta cuenta en la hoja Alumnos: ' + email + '. Revisa que el correo esté escrito igual en la hoja o importa/actualiza la lista de alumnos.');
  if (!isTrue_(student.activo)) throw new Error('Tu usuario aparece como inactivo. Habla con tu profesor.');
  touchStudent_(student.studentId);
  const token = createSession_('student', student.studentId);
  return {ok:true, role:'student', token, activeUserEmail:email, student:safeStudent_(student), dashboard:normalizeDashboardGameUrlsForGithub_(getStudentDashboardCore_(student.studentId))};
}

function loginTeacherAsStudentWithGoogle() {
  ensureSheets_();
  const email = requireActiveGoogleEmail_();
  if (!isTeacherGoogleEmail_(email)) throw new Error('Esta entrada es solo para profesores con cuenta @fomento.edu.');
  if (!isTeacherAllowed_(email)) throw new Error('Esta cuenta de profesor no está autorizada: ' + email + '. Añadela en Config > TEACHER_ALLOWED_EMAILS o deja ese campo vacío para permitir @fomento.edu.');
  const student = ensureTeacherPlayerStudent_(email);
  touchStudent_(student.studentId);
  const token = createSession_('student', student.studentId);
  return {ok:true, role:'student', teacherPlayer:true, token, activeUserEmail:email, student:safeStudent_(student), dashboard:normalizeDashboardGameUrlsForGithub_(getStudentDashboardCore_(student.studentId))};
}

function loginTeacherWithGoogle() {
  ensureSheets_();
  const email = requireActiveGoogleEmail_();
  if (!isTeacherGoogleEmail_(email)) throw new Error('Para entrar como profesor debes usar una cuenta @fomento.edu.');
  if (!isTeacherAllowed_(email)) throw new Error('Esta cuenta de profesor no está autorizada para ver el panel: ' + email + '. Añadela en Config > TEACHER_ALLOWED_EMAILS o deja ese campo vacío para permitir @fomento.edu.');
  const token = createSession_('teacher', email);
  return {ok:true, role:'teacher', token, email, version:LA_CONFIG.VERSION};
}

function ensureTeacherPlayerStudent_(email) {
  const clean = String(email || '').trim().toLowerCase();
  let student = findStudentByEmail_(clean);
  if (student) {
    if (!isTrue_(student.activo)) updateStudent_(student.studentId, { activo:true });
    return findStudentByEmail_(clean) || student;
  }
  ensureTeacherPlayerClass_();
  const local = clean.split('@')[0] || 'profesor';
  const readable = local.replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const studentId = 'profe_' + normalizeSlug_(local).slice(0, 80);
  const now = nowIso_();
  const row = {studentId, nombre:'Profe', apellidos:readable || clean, email:clean, pin:'', curso:'PROF', linea:'DOC', clase:LA_GOOGLE_AUTH_CONFIG.TEACHER_PLAYER_CLASS, avatar:'avatar_01', activo:true, xpGeneral:0, nivelGeneral:1, plumas:0, fechaAlta:now, ultimaSesion:now};
  appendObject_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS), row);
  if (typeof clearCacheV03_ === 'function') clearCacheV03_();
  return findStudentByEmail_(clean) || row;
}

function ensureTeacherPlayerClass_() {
  const classCode = LA_GOOGLE_AUTH_CONFIG.TEACHER_PLAYER_CLASS;
  const sheet = getSheet_(LA_CONFIG.SHEETS.CLASES);
  const exists = rowsToObjects_(sheet).some(row => String(row.classCode || '') === classCode);
  if (exists) return;
  appendObject_(sheet, {classCode, curso:'Profesores', linea:'Jugador', nombreVisible:'Profesores · modo jugador', activa:true, updatedAt:nowIso_()});
}

function requireActiveGoogleEmail_() {
  const email = getActiveUserEmail_();
  if (!email) throw new Error('Google no ha devuelto la cuenta activa. Revisa el despliegue de Apps Script: la web app no debe tener acceso anónimo; debe pedir inicio de sesión con Google.');
  return email;
}

function legacyPatchedGetActiveUserEmail_() {
  try { return String(Session.getActiveUser().getEmail() || '').trim().toLowerCase(); }
  catch (error) { return ''; }
}

function isStudentGoogleEmail_(email) {
  return String(email || '').toLowerCase().endsWith(LA_GOOGLE_AUTH_CONFIG.STUDENT_DOMAIN);
}

function isTeacherGoogleEmail_(email) {
  const clean = String(email || '').toLowerCase();
  return clean.endsWith(LA_GOOGLE_AUTH_CONFIG.TEACHER_DOMAIN) && !clean.endsWith(LA_GOOGLE_AUTH_CONFIG.STUDENT_DOMAIN);
}

function isTeacherAllowed_(email) {
  if (!isTeacherGoogleEmail_(email)) return false;
  const raw = String(getConfigValue_(LA_GOOGLE_AUTH_CONFIG.TEACHER_ALLOWED_CONFIG_KEY) || '').trim().toLowerCase();
  if (!raw) return true;
  return raw.split(/[\s,;]+/).map(item => item.trim()).filter(Boolean).indexOf(String(email || '').toLowerCase()) !== -1;
}

function loginStudentByIdOrEmail(loginValue, pin) {
  const value = String(loginValue || '').trim();
  if (!value) throw new Error('Falta el usuario.');
  if (value.indexOf('@') !== -1) return loginStudent(value, pin);
  const student = findStudentById_(value);
  if (!student) throw new Error('No encuentro ese alumno.');
  return loginStudent(student.email, pin);
}

// -----------------------------------------------------------------------------
// Funciones V03 antes ubicadas en zz_LenguArcade_v0_3_patch.gs
// -----------------------------------------------------------------------------

const LA_AVATAR_OPTIONS = {
  character:['avatar-01','avatar-02','avatar-03','avatar-04','avatar-05','avatar-06','avatar-07','avatar-08','avatar-09','avatar-10','avatar-11','avatar-12','avatar-13','avatar-14','avatar-15','avatar-16'],
  background:['mountains','castle','volcano','forest','snow','coast','desert','moon-city','arcade','library','sky-islands','autumn-village']
};

const LA_AVATAR_DEFAULT = {version:2, character:'avatar-01', background:'mountains'};

function setupLenguArcadeV03_() {
  ensureSheets_();
  seedConfig_();
  seedClasses_();
  seedGames_();
  seedMissions_();
  seedDemoStudents_();
  migrateStudentPins_();
  upgradeCatalogV03_();
  clearCacheV03_();
  return { ok:true, version:'0.3.0', spreadsheetUrl:getDb_().getUrl(), counts:getCounts_(), message:'LenguArcade v0.3 listo.' };
}

function getPublicMetaV03() {
  return cachedJsonV03_('public_meta_v04', function(){
    return {ok:true, version:'0.4.0', classes:rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.CLASES)).filter(c => isTrue_(c.activa)), games:getActiveGames_().map(decorateGameIntegration_), activeUserEmail:getActiveUserEmail_()};
  }, 300);
}

function getStudentsByClassV03(classCode) {
  throw new Error('La lista pública de alumnos no está disponible.');
}

function changeStudentPinV03(token, oldPin, newPin) {
  ensureSheets_();
  const studentId = requireSession_(token, 'student');
  const student = findStudent_(studentId);
  if (!student) throw new Error('Alumno no encontrado.');
  if (String(student.pin || '') !== String(oldPin || '')) throw new Error('El PIN actual no es correcto.');
  const clean = String(newPin || '').trim();
  if (!/^\d{4,8}$/.test(clean)) throw new Error('El nuevo PIN debe tener entre 4 y 8 números.');
  updateStudent_(studentId, { pin:clean });
  clearCacheV03_();
  return { ok:true, message:'PIN actualizado correctamente.' };
}

function updateStudentAvatar(token, avatarConfig) {
  ensureSheets_();
  const studentId = requireSession_(token, 'student');
  if (!findStudent_(studentId)) throw new Error('Alumno no encontrado.');
  const clean = normalizeStudentAvatar_(avatarConfig);
  updateStudent_(studentId, { avatar:JSON.stringify(clean) });
  clearCacheV03_();
  return {ok:true, avatar:clean, message:'Avatar actualizado correctamente.', dashboard:getStudentDashboardCore_(studentId)};
}

function normalizeStudentAvatar_(avatarConfig) {
  let input = avatarConfig;
  if (typeof input === 'string') {
    const raw = input.trim();
    if (raw.charAt(0) === '{') {
      try { input = JSON.parse(raw); } catch (err) { throw new Error('Configuración de avatar no válida.'); }
    } else if (/^avatar_\d{2}$/.test(raw)) {
      const index = Math.min(16, Math.max(1, Number(raw.slice(-2))));
      input = {character:'avatar-' + String(index).padStart(2, '0'), background:'mountains'};
    }
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Configuración de avatar no válida.');
  if (!input.character) {
    const fingerprint = JSON.stringify(input);
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) hash = ((hash * 31) + fingerprint.charCodeAt(i)) >>> 0;
    const legacyBackgrounds = {meadow:'mountains', mountains:'mountains', sunset:'volcano', library:'library', arcade:'arcade', moon:'moon-city'};
    input = {character:'avatar-' + String((hash % 16) + 1).padStart(2, '0'), background:legacyBackgrounds[input.background] || 'mountains'};
  }
  const clean = { version:2 };
  Object.keys(LA_AVATAR_OPTIONS).forEach(function(key) {
    const value = String(input[key] || LA_AVATAR_DEFAULT[key]);
    if (LA_AVATAR_OPTIONS[key].indexOf(value) < 0) throw new Error('Opción de avatar no válida: ' + key);
    clean[key] = value;
  });
  return clean;
}

function getTeacherDashboardV03(filters, token) {
  requireSession_(token, 'teacher');
  ensureSheets_();
  filters = filters || {};
  const classCode = filters.classCode || '';
  const gameId = filters.gameId || '';
  const students = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS)).filter(s => isTrue_(s.activo)).filter(s => !classCode || s.clase === classCode);
  const games = getActiveGames_();
  const allProgress = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO)).map(normalizeProgressRow_).filter(p => !classCode || p.clase === classCode).filter(p => !gameId || p.gameId === gameId);
  const progressByStudent = groupByV03_(allProgress, 'studentId');
  const events = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.EVENTOS)).filter(e => !classCode || e.clase === classCode).filter(e => !gameId || e.gameId === gameId);
  const errors = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ERRORES)).filter(e => !gameId || e.gameId === gameId);
  const studentSummaries = students.map(s => {
    const rows = progressByStudent[s.studentId] || [];
    const general = buildGeneralProgress_(s, rows, games);
    const grade = calculateGradeFromRowsV03_(rows, !!gameId);
    const last = rows.map(r => r.lastActivity).filter(Boolean).sort().pop() || '';
    return { studentId:s.studentId, nombre:s.nombre + ' ' + s.apellidos, email:s.email, pin:s.pin, clase:s.clase, xp:general.xp, level:general.level, percentage:general.percentage, accuracy:general.accuracy, sessions:general.sessions, gamesPlayed:general.gamesPlayed, lastActivity:last, grade:grade.score };
  }).sort((a,b) => b.xp - a.xp);
  const popularGames = games.map(g => {
    const sessions = allProgress.filter(p => p.gameId === g.gameId).reduce((a,p) => a + Number(p.sessions || 0), 0);
    return { gameId:g.gameId, nombre:g.nombre, icono:g.icono, color:g.color, sessions:sessions };
  }).sort((a,b) => b.sessions - a.sessions);
  const totalSessions = popularGames.reduce((a,g) => a + g.sessions, 0) || 1;
  popularGames.forEach(g => g.percent = Math.round((g.sessions / totalSessions) * 100));
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const errorSummary = summarizeErrors_(errors);
  const focus = studentSummaries[0] || null;
  return {
    ok:true,
    summary:{ studentsTotal:students.length, activeStudents:studentSummaries.filter(s => s.sessions > 0).length, sessionsToday:events.filter(e => String(e.timestamp).slice(0,10) === today).length, gamesAvailable:games.filter(g => String(g.estado).toLowerCase() !== 'próximamente').length, achievementsTotal:rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.LOGROS)).length, averageGrade:round1_(average_(studentSummaries.map(s => s.grade))) },
    students:studentSummaries,
    games:games,
    popularGames:popularGames,
    errorSummary:errorSummary,
    recommendations:buildRecommendationsV03_(errorSummary),
    focus:focus,
    focusProgress:focus ? (progressByStudent[focus.studentId] || []) : [],
    classes:rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.CLASES)).filter(c => isTrue_(c.activa))
  };
}

function upgradeCatalogV03_() {
  const sh = getSheet_(LA_CONFIG.SHEETS.JUEGOS);
  const now = nowIso_();
  LA_OFFICIAL_GAMES.forEach(game => upsertByKeys_(sh, ['gameId'], Object.assign({}, game, {updatedAt:now})));
}
function calculateGradeFromRowsV03_(rows, singleGame) {
  rows = (rows || []).map(normalizeProgressRow_);
  if (!rows.length) return { score:0, breakdown:{ progreso:0, dominio:0, misiones:0, constancia:0, variedad:0, logros:0 } };
  const xpScore = clamp_(average_(rows.map(r => Math.min(10, Number(r.xp || 0) / 80))),0,10);
  const accuracyScore = clamp_((average_(rows.map(r => r.accuracy)) || 0) / 10,0,10);
  const missionScore = clamp_(average_(rows.map(r => Number(r.missionsCompleted || 0))) * 2.5,0,10);
  const constancyScore = clamp_(average_(rows.map(r => Number(r.sessions || 0))) * 2,0,10);
  const varietyScore = singleGame ? 10 : clamp_(rows.filter(r => Number(r.sessions || 0)>0).length * 1.7,0,10);
  const achievementScore = clamp_(average_(rows.map(r => Number(r.achievementsCount || 0))) * 2.5,0,10);
  return { score:round1_(xpScore*.25 + accuracyScore*.25 + missionScore*.20 + constancyScore*.15 + varietyScore*.10 + achievementScore*.05), breakdown:{ progreso:round1_(xpScore), dominio:round1_(accuracyScore), misiones:round1_(missionScore), constancia:round1_(constancyScore), variedad:round1_(varietyScore), logros:round1_(achievementScore) } };
}

function buildRecommendationsV03_(errorSummary) {
  const rec = [];
  if (errorSummary.length) rec.push('Refuerzo sugerido: ' + errorSummary[0].label + '.');
  rec.push('Revisa los alumnos con 0 sesiones y asígnales una misión corta.');
  rec.push('Para evaluar, combina progreso, precisión, misiones y constancia.');
  return rec;
}

function groupByV03_(rows, key) {
  const map = {};
  rows.forEach(r => { const k = r[key]; if (!map[k]) map[k] = []; map[k].push(r); });
  return map;
}

function cachedJsonV03_(key, builder, seconds) {
  const cache = CacheService.getScriptCache();
  const raw = cache.get(key);
  if (raw) return JSON.parse(raw);
  const value = builder();
  cache.put(key, JSON.stringify(value), seconds || 300);
  return value;
}

function clearCacheV03_() {
  try {
    CacheService.getScriptCache().removeAll(['public_meta_v03','public_meta_v04','students_v03_1ESO_A','students_v03_1ESO_B','students_v03_2ESO_A','students_v03_2ESO_B','students_v03_3ESO_A','students_v03_3ESO_B','students_v03_4ESO_A','students_v03_4ESO_B']);
  } catch(e) {}
}
