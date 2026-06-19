/**
 * LenguArcade v0.2
 * Backend central para Google Apps Script + Google Sheets.
 * Cambios principales:
 * - carga inicial ligera
 * - login de alumno por PIN
 * - login de profesor por clave
 * - migracion segura de columnas sin borrar datos
 */

const LA_CONFIG = {
  VERSION: '0.2.0',
  DB_NAME: 'LenguArcade_DB',
  SPREADSHEET_ID: '',
  STUDENT_DOMAIN: '@alumno.fomento.edu',
  SHEETS: {
    CONFIG: 'Config',
    CLASES: 'Clases',
    ALUMNOS: 'Alumnos',
    JUEGOS: 'Juegos',
    PROGRESO: 'ProgresoJuegos',
    EVENTOS: 'Eventos',
    LOGROS: 'Logros',
    MISIONES: 'Misiones',
    EVALUACIONES: 'Evaluaciones',
    ERRORES: 'Errores',
    RAW: 'RawPayloads',
    BACKEND_ERRORS: 'BackendErrors'
  }
};

const LA_GAME_INTEGRATIONS = {
  maniacgrafia: {
    url: 'https://script.google.com/macros/s/AKfycbxgtB6NP9zVvkkEZjodyGhSQbZmFifeFdMf8uDr0QsXoWsp_AxZdb7OFxtS5vKM-VruPw/exec?view=alumno',
    integration: 'embedded'
  },
  scrabble: {
    url: 'https://script.google.com/macros/s/AKfycbxcVJ1I8jFuhbwjjPPzGFcCdku_LDnXKeZEmnpNYwYo9beCEyNHN8ElzWnXxxjyJFJb/exec',
    integration: 'embedded'
  },
  narratoria: {
    url: 'https://script.google.com/macros/s/AKfycbyYW1m5zkvLc87XHUqCqNZpY59ZVA6wv6GyxqB_g7u19tRbE22eYZINSV7BHZLkbLpa/exec?page=narratoria',
    integration: 'embedded'
  }
};

const LA_HEADERS = {
  Config: ['key','value','updatedAt'],
  Clases: ['classCode','curso','linea','nombreVisible','activa','updatedAt'],
  Alumnos: ['studentId','nombre','apellidos','email','pin','curso','linea','clase','avatar','activo','xpGeneral','nivelGeneral','plumas','fechaAlta','ultimaSesion'],
  Juegos: ['gameId','nombre','subtitulo','categoria','competencias','estado','orden','color','icono','url','descripcion','banner','activo','updatedAt'],
  ProgresoJuegos: ['studentId','email','nombre','clase','gameId','gameName','xp','nivel','percentage','accuracy','attempts','successes','errors','streak','sessions','achievementsCount','missionsCompleted','plumas','lastActivity','rawJson','updatedAt'],
  Eventos: ['eventId','timestamp','studentId','email','nombre','clase','gameId','eventType','xpDelta','plumasDelta','accuracy','detailsJson'],
  Logros: ['achievementId','studentId','email','gameId','title','description','xpReward','unlockedAt'],
  Misiones: ['missionId','title','description','gameId','type','target','rewardXp','rewardPlumas','activeFrom','activeTo','isActive'],
  Evaluaciones: ['studentId','email','classCode','scope','gameId','score','breakdownJson','updatedAt'],
  Errores: ['timestamp','studentId','email','gameId','skill','errorType','count','detailsJson'],
  RawPayloads: ['timestamp','studentId','email','gameId','payloadJson'],
  BackendErrors: ['timestamp','where','message','stack','detailsJson']
};

function doGet(e) {
  const page = String((e && e.parameter && e.parameter.page) || 'alumno').toLowerCase();
  const file = page === 'profesor' || page === 'teacher'
    ? 'LenguArcade_Profesor'
    : page === 'narratoria'
      ? 'Narratoria_Alumno'
      : 'LenguArcade_Alumno';
  const title = page === 'profesor' || page === 'teacher'
    ? 'LenguArcade - Profesor'
    : page === 'narratoria'
      ? 'Narratoria'
      : 'LenguArcade - Alumno';
  return HtmlService.createHtmlOutputFromFile(file)
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setupLenguArcade_() {
  try {
    ensureSheets_();
    seedConfig_();
    seedClasses_();
    seedGames_();
    seedMissions_();
    seedDemoStudents_();
    migrateStudentPins_();
    seedDemoProgress_();
    return { ok:true, version:LA_CONFIG.VERSION, spreadsheetUrl:getDb_().getUrl(), counts:getCounts_(), message:'LenguArcade v0.2 listo.' };
  } catch (err) {
    logBackendError_('setupLenguArcade', err, {});
    throw err;
  }
}

function getPublicMeta() {
  ensureSheets_();
  return {
    ok:true,
    version:LA_CONFIG.VERSION,
    classes: rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.CLASES)).filter(r => isTrue_(r.activa)),
    games: getActiveGames_(),
    activeUserEmail:getActiveUserEmail_()
  };
}

function getStudentsByClass(classCode) {
  throw new Error('La lista pública de alumnos no está disponible.');
}

function loginStudent(email, pin) {
  const cleanEmail = normalizeStudentLoginEmail_(email);
  const cleanPin = String(pin || '').trim();
  const throttle = getStudentLoginThrottle_(cleanEmail);
  if (throttle.blockedUntil > Date.now()) {
    throw new Error('Demasiados intentos. Espera unos minutos antes de volver a probar.');
  }

  const student = findStudentByEmail_(cleanEmail);
  const activeUserEmail = String(getActiveUserEmail_() || '').trim().toLowerCase();
  const activeSchoolAccount = activeUserEmail.endsWith(LA_CONFIG.STUDENT_DOMAIN);
  const accountMatches = !activeSchoolAccount || activeUserEmail === cleanEmail;
  const valid = student &&
    isTrue_(student.activo) &&
    /^\d{4,8}$/.test(cleanPin) &&
    String(student.pin || '') === cleanPin &&
    accountMatches;

  if (!valid) {
    registerStudentLoginFailure_(cleanEmail, throttle);
    Utilities.sleep(300);
    throw new Error('Correo o PIN incorrectos.');
  }

  clearStudentLoginFailures_(cleanEmail);
  const token = createSession_('student', student.studentId);
  return { ok:true, token:token, student:safeStudent_(student), dashboard:getStudentDashboardCore_(student.studentId) };
}

function loginGameOpponent(primaryToken, email, pin, gameId) {
  const primaryStudentId = requireSession_(primaryToken, 'student');
  const cleanEmail = normalizeStudentLoginEmail_(email);
  const cleanPin = String(pin || '').trim();
  const throttle = getStudentLoginThrottle_(cleanEmail);
  if (throttle.blockedUntil > Date.now()) {
    throw new Error('Demasiados intentos. Espera unos minutos antes de volver a probar.');
  }
  const student = findStudentByEmail_(cleanEmail);
  const valid = student &&
    isTrue_(student.activo) &&
    String(student.studentId) !== String(primaryStudentId) &&
    /^\d{4,8}$/.test(cleanPin) &&
    String(student.pin || '') === cleanPin;
  if (!valid) {
    registerStudentLoginFailure_(cleanEmail, throttle);
    Utilities.sleep(300);
    throw new Error('Correo o PIN incorrectos, o el contrincante coincide con el jugador principal.');
  }
  const game = findGame_(gameId);
  if (!game) throw new Error('Juego no reconocido.');
  clearStudentLoginFailures_(cleanEmail);
  const opponentToken = createSession_('student', student.studentId);
  return {
    ok:true,
    token:opponentToken,
    student:safeStudent_(student),
    game:getStudentGameRecord_(student, game)
  };
}

function loginTeacher(password) {
  ensureSheets_();
  const expected = getConfigValue_('TEACHER_PASSWORD');
  if (!expected) throw new Error('No hay una clave de profesor configurada.');
  if (String(password || '') !== String(expected)) throw new Error('Clave de profesor incorrecta.');
  return { ok:true, token:createSession_('teacher', 'teacher'), version:LA_CONFIG.VERSION };
}

function getStudentDashboardByToken(token) {
  const studentId = requireSession_(token, 'student');
  return getStudentDashboardCore_(studentId);
}

function verifyStudentSession(token) {
  return { ok:true, studentId:requireSession_(token, 'student') };
}

function getStudentDashboard_(identifier) {
  ensureSheets_();
  const student = findStudent_(identifier);
  if (!student) throw new Error('No he encontrado ese alumno.');
  return getStudentDashboardCore_(student.studentId);
}

function getTeacherDashboard(filters, token) {
  requireSession_(token, 'teacher');
  return getTeacherDashboardCore_(filters || {});
}

function getTeacherStudentDetail(studentId, token) {
  requireSession_(token, 'teacher');
  const students = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS));
  const student = students.find(row => String(row.studentId) === String(studentId));
  if (!student) throw new Error('Alumno no encontrado.');

  const games = getActiveGames_().map(decorateGameIntegration_);
  const progressRows = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO))
    .filter(row => String(row.studentId) === String(student.studentId))
    .map(normalizeProgressRow_);
  const progressByGame = {};
  progressRows.forEach(row => progressByGame[row.gameId] = row);
  const progress = games.map(game => {
    const row = progressByGame[game.gameId] || emptyProgressForGame_(student, game);
    return {
      gameId:game.gameId,
      gameName:game.nombre || row.gameName || game.gameId,
      icono:game.icono || '',
      color:game.color || '',
      xp:Number(row.xp || 0),
      nivel:Number(row.nivel || 1),
      percentage:Number(row.percentage || 0),
      accuracy:Number(row.accuracy || 0),
      attempts:Number(row.attempts || 0),
      successes:Number(row.successes || 0),
      errors:Number(row.errors || 0),
      streak:Number(row.streak || 0),
      sessions:Number(row.sessions || 0),
      achievementsCount:Number(row.achievementsCount || 0),
      missionsCompleted:Number(row.missionsCompleted || 0),
      plumas:Number(row.plumas || 0),
      lastActivity:row.lastActivity || ''
    };
  });
  const events = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.EVENTOS))
    .filter(row => String(row.studentId) === String(student.studentId))
    .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20)
    .map(row => ({
      timestamp:row.timestamp,
      gameId:row.gameId,
      eventType:row.eventType,
      xpDelta:Number(row.xpDelta || 0),
      plumasDelta:Number(row.plumasDelta || 0),
      accuracy:Number(row.accuracy || 0)
    }));
  const achievements = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.LOGROS))
    .filter(row => String(row.studentId) === String(student.studentId))
    .sort((a,b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
    .slice(0, 20)
    .map(row => ({
      achievementId:row.achievementId,
      gameId:row.gameId,
      title:row.title,
      description:row.description,
      xpReward:Number(row.xpReward || 0),
      unlockedAt:row.unlockedAt
    }));
  const errors = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ERRORES))
    .filter(row => String(row.studentId) === String(student.studentId))
    .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20)
    .map(row => ({
      timestamp:row.timestamp,
      gameId:row.gameId,
      skill:row.skill,
      errorType:row.errorType,
      count:Number(row.count || 1)
    }));
  const general = buildGeneralProgress_(student, progressRows, games);
  const lastActivity = [
    student.ultimaSesion,
    events.length ? events[0].timestamp : '',
    ...progressRows.map(row => row.lastActivity)
  ].filter(Boolean).sort().pop() || '';

  return {
    ok:true,
    student:{
      studentId:student.studentId,
      nombre:student.nombre + ' ' + student.apellidos,
      email:student.email,
      clase:student.clase,
      pin:student.pin || ''
    },
    general:general,
    grade:calculateGradeFromRowsV03_(progressRows, false),
    lastActivity:lastActivity,
    progress:progress,
    events:events,
    achievements:achievements,
    errors:errors
  };
}

function saveProgress(payload) {
  ensureSheets_();
  try {
    payload = payload || {};
    const sessionStudentId = requireSession_(payload.sessionToken, 'student');
    payload.studentId = payload.studentId || sessionStudentId;
    if (String(payload.studentId) !== String(sessionStudentId)) throw new Error('La sesion no corresponde a ese alumno.');
    if (!payload.gameId) throw new Error('saveProgress necesita gameId.');
    const student = findStudent_(payload.studentId || payload.email || payload.studentEmail);
    if (!student) throw new Error('Alumno no encontrado.');
    const resultId = String(payload.resultId || '').trim().slice(0, 180);
    if (resultId) {
      const previousEvent = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.EVENTOS)).find(event =>
        String(event.eventId) === resultId && String(event.studentId) === String(student.studentId)
      );
      if (previousEvent) {
        return { ok:true, duplicate:true, message:'Resultado ya guardado', dashboard:getStudentDashboardCore_(student.studentId) };
      }
    }
    const game = findGame_(payload.gameId) || { gameId:payload.gameId, nombre:payload.gameId };
    const progress = payload.progress || {};
    const now = nowIso_();
    const sheet = getSheet_(LA_CONFIG.SHEETS.PROGRESO);
    const rows = rowsToObjects_(sheet);
    const idx = rows.findIndex(r => String(r.studentId) === String(student.studentId) && String(r.gameId) === String(game.gameId));
    const old = idx >= 0 ? normalizeProgressRow_(rows[idx]) : emptyProgressForGame_(student, game);
    const newXp = Number(progress.xp != null ? progress.xp : old.xp + Number(progress.xpDelta || 0));
    const xpDelta = Math.max(0, newXp - Number(old.xp || 0));
    const newPlumas = Number(progress.plumas != null ? progress.plumas : old.plumas + Number(progress.plumasDelta || 0));
    const plumasDelta = Math.max(0, newPlumas - Number(old.plumas || 0));
    const achievementSheet = getSheet_(LA_CONFIG.SHEETS.LOGROS);
    const existingAchievementIds = {};
    rowsToObjects_(achievementSheet)
      .filter(a => String(a.studentId) === String(student.studentId) && String(a.gameId) === String(game.gameId))
      .forEach(a => {
        const id = String(a.achievementId || '');
        if (id) existingAchievementIds[id] = true;
      });
    const newAchievements = (payload.achievements || []).filter(a => {
      const id = String(typeof a === 'string' ? a : (a.id || a.achievementId || ''));
      if (!id || existingAchievementIds[id]) return false;
      existingAchievementIds[id] = true;
      return true;
    });
    const record = {
      studentId:student.studentId, email:student.email, nombre:student.nombre + ' ' + student.apellidos, clase:student.clase,
      gameId:game.gameId, gameName:game.nombre, xp:newXp,
      nivel:Number(progress.level || progress.nivel || Math.floor(newXp / 250) + 1),
      percentage:clamp_(Number(progress.percentage || progress.percent || old.percentage || 0), 0, 100),
      accuracy:clamp_(Number(progress.accuracy || old.accuracy || 0), 0, 100),
      attempts:Number(progress.attempts || old.attempts || 0), successes:Number(progress.successes || old.successes || 0), errors:Number(progress.errors || old.errors || 0),
      streak:Number(progress.streak || old.streak || 0), sessions:Number(old.sessions || 0) + 1,
      achievementsCount:Object.keys(existingAchievementIds).length, missionsCompleted:Number(progress.missionsCompleted || old.missionsCompleted || 0),
      plumas:newPlumas, lastActivity:now, rawJson:JSON.stringify(payload.rawGameData || payload), updatedAt:now
    };
    upsertByKeys_(sheet, ['studentId','gameId'], record);
    appendObject_(getSheet_(LA_CONFIG.SHEETS.EVENTOS), { eventId:resultId || Utilities.getUuid(), timestamp:now, studentId:student.studentId, email:student.email, nombre:record.nombre, clase:student.clase, gameId:game.gameId, eventType:payload.eventType || 'progress_saved', xpDelta:xpDelta, plumasDelta:plumasDelta, accuracy:record.accuracy, detailsJson:JSON.stringify(payload.details || {}) });
    appendObject_(getSheet_(LA_CONFIG.SHEETS.RAW), { timestamp:now, studentId:student.studentId, email:student.email, gameId:game.gameId, payloadJson:JSON.stringify(payload) });
    newAchievements.forEach(a => appendObject_(achievementSheet, { achievementId:typeof a === 'string' ? a : (a.id || a.achievementId || Utilities.getUuid()), studentId:student.studentId, email:student.email, gameId:game.gameId, title:typeof a === 'string' ? a : (a.title || a.name || 'Logro'), description:typeof a === 'string' ? '' : (a.description || ''), xpReward:typeof a === 'string' ? 0 : Number(a.xpReward || 0), unlockedAt:now }));
    if (payload.errors && payload.errors.length) payload.errors.forEach(er => appendObject_(getSheet_(LA_CONFIG.SHEETS.ERRORES), { timestamp:now, studentId:student.studentId, email:student.email, gameId:game.gameId, skill:er.skill || '', errorType:er.type || er.errorType || '', count:Number(er.count || 1), detailsJson:JSON.stringify(er) }));
    recalculateStudentGeneral_(student.studentId);
    return { ok:true, message:'Progreso guardado', record:record, dashboard:getStudentDashboardCore_(student.studentId) };
  } catch (err) {
    logBackendError_('saveProgress', err, payload);
    throw err;
  }
}

function saveGameCheckpoint(payload) {
  ensureSheets_();
  payload = payload || {};
  const sessionStudentId = requireSession_(payload.sessionToken, 'student');
  if (payload.studentId && String(payload.studentId) !== String(sessionStudentId)) throw new Error('La sesion no corresponde a ese alumno.');
  if (!payload.gameId) throw new Error('saveGameCheckpoint necesita gameId.');
  const student = findStudent_(sessionStudentId);
  if (!student) throw new Error('Alumno no encontrado.');
  const game = findGame_(payload.gameId) || { gameId:payload.gameId, nombre:payload.gameId };
  const sheet = getSheet_(LA_CONFIG.SHEETS.PROGRESO);
  const rows = rowsToObjects_(sheet);
  const idx = rows.findIndex(r => String(r.studentId) === String(student.studentId) && String(r.gameId) === String(game.gameId));
  const old = idx >= 0 ? normalizeProgressRow_(rows[idx]) : emptyProgressForGame_(student, game);
  const now = nowIso_();
  const achievementSheet = getSheet_(LA_CONFIG.SHEETS.LOGROS);
  const existingAchievementIds = {};
  rowsToObjects_(achievementSheet)
    .filter(achievement => String(achievement.studentId) === String(student.studentId) && String(achievement.gameId) === String(game.gameId))
    .forEach(achievement => {
      const id = String(achievement.achievementId || '');
      if (id) existingAchievementIds[id] = true;
    });
  (payload.achievements || []).forEach(achievement => {
    const id = String(typeof achievement === 'string' ? achievement : (achievement.id || achievement.achievementId || ''));
    if (!id || existingAchievementIds[id]) return;
    existingAchievementIds[id] = true;
    appendObject_(achievementSheet, {
      achievementId:id,
      studentId:student.studentId,
      email:student.email,
      gameId:game.gameId,
      title:typeof achievement === 'string' ? achievement : (achievement.title || achievement.name || 'Logro'),
      description:typeof achievement === 'string' ? '' : (achievement.description || ''),
      xpReward:typeof achievement === 'string' ? 0 : Number(achievement.xpReward || 0),
      unlockedAt:now
    });
  });
  const record = Object.assign({}, old, {
    studentId:student.studentId,
    email:student.email,
    nombre:student.nombre + ' ' + student.apellidos,
    clase:student.clase,
    gameId:game.gameId,
    gameName:game.nombre,
    achievementsCount:Object.keys(existingAchievementIds).length,
    lastActivity:now,
    rawJson:JSON.stringify(payload.rawGameData || payload),
    updatedAt:now
  });
  upsertByKeys_(sheet, ['studentId','gameId'], record);
  return { ok:true, saved:true, updatedAt:now };
}

function calculateStudentGradeForTeacher_(studentId, gameId) {
  ensureSheets_();
  return calculateStudentGrade_(studentId, gameId || null);
}

function getStudentDashboardCore_(studentId) {
  const students = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS));
  const student = students.find(s => String(s.studentId) === String(studentId));
  if (!student) throw new Error('Alumno no encontrado.');
  const games = getActiveGames_().map(decorateGameIntegration_);
  const progressRows = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO)).filter(r => String(r.studentId) === String(student.studentId)).map(normalizeProgressRow_);
  const events = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.EVENTOS));
  const achievements = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.LOGROS));
  const byGame = {};
  progressRows.forEach(r => byGame[r.gameId] = r);
  const gameCards = games.map(g => {
    const p = byGame[g.gameId] || emptyProgressForGame_(student, g);
    return Object.assign({}, g, { progress:p, locked:String(g.estado).toLowerCase() === 'proximamente', buttonLabel:p.sessions > 0 ? 'Continuar' : 'Jugar' });
  });
  return {
    ok:true,
    student:safeStudent_(student),
    general:buildGeneralProgress_(student, progressRows, games),
    games:gameCards,
    events:events.filter(e => String(e.studentId) === String(student.studentId)).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0,8),
    achievements:achievements.filter(a => String(a.studentId) === String(student.studentId)).slice(-6).reverse(),
    ranking:buildClassRankingFromStudents_(students, student.clase, 5),
    missions: buildStudentMissions_(student, byGame),
    grade:calculateGradeFromRowsV03_(progressRows, false)
  };
}

function getStudentGameRecord_(student, game) {
  const progress = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO))
    .find(row => String(row.studentId) === String(student.studentId) && String(row.gameId) === String(game.gameId));
  const normalized = progress ? normalizeProgressRow_(progress) : emptyProgressForGame_(student, game);
  return Object.assign({}, decorateGameIntegration_(game), {
    progress:normalized,
    locked:String(game.estado).toLowerCase() === 'proximamente',
    buttonLabel:normalized.sessions > 0 ? 'Continuar' : 'Jugar'
  });
}

function getTeacherDashboardCore_(filters) {
  filters = filters || {};
  const classCode = filters.classCode || '';
  const gameId = filters.gameId || '';
  const students = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS)).filter(s => isTrue_(s.activo)).filter(s => !classCode || s.clase === classCode);
  const games = getActiveGames_();
  const progressRows = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO)).map(normalizeProgressRow_).filter(p => !classCode || p.clase === classCode).filter(p => !gameId || p.gameId === gameId);
  const events = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.EVENTOS)).filter(e => !classCode || e.clase === classCode).filter(e => !gameId || e.gameId === gameId);
  const errors = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ERRORES)).filter(e => !gameId || e.gameId === gameId);
  const studentSummaries = students.map(s => {
    const rows = progressRows.filter(p => p.studentId === s.studentId);
    const general = buildGeneralProgress_(s, rows, games);
    const grade = calculateStudentGrade_(s.studentId, gameId || null);
    const last = rows.map(r => r.lastActivity).filter(Boolean).sort().pop() || '';
    return { studentId:s.studentId, nombre:s.nombre + ' ' + s.apellidos, email:s.email, pin:s.pin, clase:s.clase, xp:general.xp, level:general.level, percentage:general.percentage, accuracy:general.accuracy, sessions:general.sessions, gamesPlayed:general.gamesPlayed, lastActivity:last, grade:grade.score };
  }).sort((a,b) => b.xp - a.xp);
  const popularGames = games.map(g => {
    const sessions = progressRows.filter(p => p.gameId === g.gameId).reduce((a,p) => a + Number(p.sessions || 0), 0);
    return { gameId:g.gameId, nombre:g.nombre, icono:g.icono, color:g.color, sessions:sessions };
  }).sort((a,b) => b.sessions - a.sessions);
  const totalSessions = popularGames.reduce((a,g) => a + g.sessions, 0) || 1;
  popularGames.forEach(g => g.percent = Math.round((g.sessions / totalSessions) * 100));
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const errorSummary = summarizeErrors_(errors);
  return {
    ok:true,
    summary:{ studentsTotal:students.length, activeStudents:studentSummaries.filter(s => s.sessions > 0).length, sessionsToday:events.filter(e => String(e.timestamp).slice(0,10) === today).length, gamesAvailable:games.filter(g => String(g.estado).toLowerCase() !== 'proximamente').length, achievementsTotal:rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.LOGROS)).length, averageGrade:round1_(average_(studentSummaries.map(s => s.grade))) },
    students:studentSummaries,
    games:games,
    popularGames:popularGames,
    errorSummary:errorSummary,
    recommendations:buildRecommendations_(errorSummary, popularGames),
    focus:studentSummaries[0] || null,
    focusProgress:studentSummaries[0] ? progressRows.filter(p => p.studentId === studentSummaries[0].studentId) : [],
    classes:rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.CLASES)).filter(c => isTrue_(c.activa))
  };
}

var LA_DB_INSTANCE_ = null;

function getDb_() {
  if (LA_DB_INSTANCE_) return LA_DB_INSTANCE_;
  if (LA_CONFIG.SPREADSHEET_ID) {
    LA_DB_INSTANCE_ = SpreadsheetApp.openById(LA_CONFIG.SPREADSHEET_ID);
    return LA_DB_INSTANCE_;
  }
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty('LA_SPREADSHEET_ID');
  if (saved) {
    LA_DB_INSTANCE_ = SpreadsheetApp.openById(saved);
    return LA_DB_INSTANCE_;
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty('LA_SPREADSHEET_ID', active.getId());
    LA_DB_INSTANCE_ = active;
    return LA_DB_INSTANCE_;
  }
  const ss = SpreadsheetApp.create(LA_CONFIG.DB_NAME);
  props.setProperty('LA_SPREADSHEET_ID', ss.getId());
  LA_DB_INSTANCE_ = ss;
  return LA_DB_INSTANCE_;
}

function ensureSheets_() {
  const ss = getDb_();
  Object.keys(LA_CONFIG.SHEETS).forEach(key => ensureSheetHeaders_(ss, LA_CONFIG.SHEETS[key], LA_HEADERS[LA_CONFIG.SHEETS[key]]));
}

function ensureSheetHeaders_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) { sh.appendRow(headers); return; }
  const existing = sh.getRange(1,1,1,Math.max(1, sh.getLastColumn())).getValues()[0].filter(String);
  if (!existing.length) { sh.getRange(1,1,1,headers.length).setValues([headers]); return; }
  const missing = headers.filter(h => existing.indexOf(h) < 0);
  if (missing.length) sh.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
}

function getSheet_(name) { return getDb_().getSheetByName(name); }
function rowsToObjects_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(1,1,sheet.getLastRow(),sheet.getLastColumn()).getValues();
  const headers = values.shift();
  return values.filter(r => r.some(v => v !== '')).map(r => { const obj = {}; headers.forEach((h,i) => obj[h] = r[i]); return obj; });
}
function appendObject_(sheet, obj) { const headers = getHeaders_(sheet); sheet.appendRow(headers.map(h => obj[h] != null ? obj[h] : '')); }
function getHeaders_(sheet) { return sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].filter(String); }
function upsertByKeys_(sheet, keys, obj) {
  const headers = getHeaders_(sheet);
  const rows = rowsToObjects_(sheet);
  const index = rows.findIndex(r => keys.every(k => String(r[k]) === String(obj[k])));
  const values = headers.map(h => obj[h] != null ? obj[h] : '');
  if (index >= 0) sheet.getRange(index + 2, 1, 1, headers.length).setValues([values]); else sheet.appendRow(values);
}
function updateStudent_(studentId, fields) {
  const sheet = getSheet_(LA_CONFIG.SHEETS.ALUMNOS);
  const headers = getHeaders_(sheet);
  const rows = rowsToObjects_(sheet);
  const idx = rows.findIndex(r => String(r.studentId) === String(studentId));
  if (idx < 0) return;
  const merged = Object.assign({}, rows[idx], fields);
  sheet.getRange(idx + 2, 1, 1, headers.length).setValues([headers.map(h => merged[h] != null ? merged[h] : '')]);
}

function seedConfig_() { if (!getConfigValue_('TEACHER_PASSWORD')) setConfigValue_('TEACHER_PASSWORD', Utilities.getUuid().replace(/-/g, '').slice(0, 16)); }
function getConfigValue_(key) { const r = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.CONFIG)).find(x => String(x.key) === String(key)); return r ? r.value : ''; }
function setConfigValue_(key, value) { upsertByKeys_(getSheet_(LA_CONFIG.SHEETS.CONFIG), ['key'], { key:key, value:value, updatedAt:nowIso_() }); }

function seedClasses_() {
  const sh = getSheet_(LA_CONFIG.SHEETS.CLASES);
  if (sh.getLastRow() > 1) return;
  ['1ESO','2ESO','3ESO','4ESO'].forEach(curso => ['A','B'].forEach(linea => appendObject_(sh, { classCode:curso + '_' + linea, curso:curso, linea:linea, nombreVisible:curso.replace('ESO','º ESO') + ' ' + linea, activa:true, updatedAt:nowIso_() })));
}
function seedGames_() {
  const sh = getSheet_(LA_CONFIG.SHEETS.JUEGOS);
  if (sh.getLastRow() > 1) return;
  const games = [
    ['battlegrafia','Battlegrafia','La aventura de las palabras','RPG','ortografia,gramatica,verbos','proximamente',1,'#f59e0b','🐉','','RPG de Lengua. Integracion avanzada pendiente.','dragon'],
    ['maniacgrafia','Maniacgrafia','Atrapa las palabras','Ortografia','ortografia,acentuacion','beta',2,'#d946ef','⚡','','Corrige palabras trampa y mejora tu precision.','neon'],
    ['narratoria','Narratoria','Escribe. Crea. Cuenta.','Escritura','narracion,creatividad,redaccion','beta',3,'#f59e0b','📚','','Construye relatos con cartas, fases y objetivos.','paper'],
    ['versopolis','Versopolis','La ciudad de la poesia','Poesia','poesia,literatura,creatividad','beta',4,'#8b5cf6','✒️','','Crea poemas y completa travesias poeticas.','city'],
    ['scrabble','Scrabble','Palabras en juego','Lexico','lexico,vocabulario,estrategia','aula',5,'#34d399','🔤','','Forma palabras y compite por equipos.','board'],
    ['conjuga_apuesta','Conjuga y Apuesta','Verbos 1 contra 1','Verbos','verbos,morfologia','aula',6,'#fb7185','🎲','','Apuesta puntos conjugando formas verbales.','dice'],
    ['verb_battle','Verb Battle','Jeopardy verbal RPG','Verbos','verbos,morfologia,equipos','aula',7,'#60a5fa','⚔️','','Batalla por equipos con preguntas de conjugacion.','battle']
  ];
  games.forEach(g => appendObject_(sh, { gameId:g[0], nombre:g[1], subtitulo:g[2], categoria:g[3], competencias:g[4], estado:g[5], orden:g[6], color:g[7], icono:g[8], url:g[9], descripcion:g[10], banner:g[11], activo:true, updatedAt:nowIso_() }));
}
function seedMissions_() { const sh = getSheet_(LA_CONFIG.SHEETS.MISIONES); if (sh.getLastRow() > 1) return; [['mision_primera_partida','Primer aterrizaje','Guarda tu primer progreso en cualquier juego.','general','sessions',1,50,5],['mision_explorador','Explorador de LenguArcade','Prueba tres juegos distintos.','general','variety',3,100,10],['mision_precision','Cazador de errores','Supera el 80% de precision en un juego.','general','accuracy',80,80,8]].forEach(m => appendObject_(sh, { missionId:m[0], title:m[1], description:m[2], gameId:m[3], type:m[4], target:m[5], rewardXp:m[6], rewardPlumas:m[7], activeFrom:'', activeTo:'', isActive:true })); }
function seedDemoStudents_() {
  const sh = getSheet_(LA_CONFIG.SHEETS.ALUMNOS);
  if (sh.getLastRow() > 1) return;
  const names = ['Alvaro','Bruno','Carlos','Diego','Enrique','Fernando','Gonzalo','Hector','Ignacio','Javier','Lucas','Marcos','Nicolas','Oscar','Pablo','Rafael','Santiago','Tomas','Victor','Adrian','Mateo','Daniel','Mario','Leo','Hugo','Izan','Jaime','Rodrigo','Samuel','Yago'];
  const surnames = ['Garcia Martin','Lopez Sanz','Perez Alonso','Sanchez Ruiz','Martinez Gil','Fernandez Cano','Gomez Vidal','Diaz Moreno','Hernandez Rubio','Jimenez Torres','Moreno Serrano','Alvarez Vega','Romero Ortega','Navarro Molina','Dominguez Nieto','Ramos Castro','Vazquez Herrero','Iglesias Leon','Blanco Pascual','Mendez Prieto','Soto Marin','Crespo Arias','Fuentes Calvo','Reyes Lara','Cabrera Pardo','Soler Roman','Pastor Rios','Campos Navas','Carrasco Bueno','Velasco Santos'];
  let n = 1001;
  rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.CLASES)).forEach(cls => { for (let i=0; i<30; i++) { const nombre = names[i]; const apellidos = surnames[(i + String(cls.classCode).length) % surnames.length]; const slug = normalizeSlug_(nombre + '.' + apellidos.replace(/ /g,'.')); appendObject_(sh, { studentId:cls.classCode + '_' + normalizeSlug_(nombre + '_' + apellidos), nombre:nombre, apellidos:apellidos, email:slug + LA_CONFIG.STUDENT_DOMAIN, pin:String(n++), curso:cls.curso, linea:cls.linea, clase:cls.classCode, avatar:'avatar_' + String((i % 12) + 1).padStart(2,'0'), activo:true, xpGeneral:0, nivelGeneral:1, plumas:0, fechaAlta:nowIso_(), ultimaSesion:'' }); } });
}
function migrateStudentPins_() { const sh = getSheet_(LA_CONFIG.SHEETS.ALUMNOS); const rows = rowsToObjects_(sh); rows.forEach((s,i) => { if (!s.pin) updateStudent_(s.studentId, { pin:String(1001 + i) }); }); }
function seedDemoProgress_() {
  const sh = getSheet_(LA_CONFIG.SHEETS.PROGRESO); if (sh.getLastRow() > 1) return;
  const students = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS)).slice(0,36); const games = getActiveGames_().filter(g => String(g.estado).toLowerCase() !== 'proximamente').slice(0,4);
  students.forEach((s, idx) => { games.forEach((g, gi) => { if ((idx + gi) % 3 === 0) return; const xp = 60 + ((idx * 37 + gi * 80) % 520); const attempts = 8 + ((idx + gi) % 20); const successes = Math.max(1, Math.round(attempts * (0.55 + ((idx + gi) % 4) * 0.1))); appendObject_(sh, { studentId:s.studentId, email:s.email, nombre:s.nombre + ' ' + s.apellidos, clase:s.clase, gameId:g.gameId, gameName:g.nombre, xp:xp, nivel:Math.floor(xp / 250) + 1, percentage:Math.min(100, Math.round(xp / 8)), accuracy:Math.round((successes / attempts) * 100), attempts:attempts, successes:successes, errors:attempts-successes, streak:(idx + gi) % 9, sessions:1 + ((idx + gi) % 5), achievementsCount:(idx + gi) % 4, missionsCompleted:(idx + gi) % 3, plumas:Math.floor(xp / 50), lastActivity:nowIso_(), rawJson:'{}', updatedAt:nowIso_() }); }); recalculateStudentGeneral_(s.studentId); });
}

function createSession_(type, id) { const token = Utilities.getUuid(); CacheService.getScriptCache().put('LA_SESSION_' + token, JSON.stringify({ type:type, id:id, created:nowIso_() }), 21600); return token; }
function requireSession_(token, expectedType) { if (!token) throw new Error('Sesion no iniciada.'); const raw = CacheService.getScriptCache().get('LA_SESSION_' + token); if (!raw) throw new Error('Sesion caducada. Vuelve a entrar.'); const s = JSON.parse(raw); if (s.type !== expectedType) throw new Error('Sesion no valida.'); return s.id; }
function safeStudent_(s) { return { studentId:s.studentId, nombre:s.nombre, apellidos:s.apellidos, email:s.email, clase:s.clase, curso:s.curso, linea:s.linea, avatar:s.avatar, xpGeneral:Number(s.xpGeneral || 0), nivelGeneral:Number(s.nivelGeneral || 1), plumas:Number(s.plumas || 0), ultimaSesion:s.ultimaSesion || '' }; }
function publicStudent_(s) { return { studentId:s.studentId, nombre:s.nombre, apellidos:s.apellidos, clase:s.clase, avatar:s.avatar }; }
function getActiveGames_() { return rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.JUEGOS)).filter(g => isTrue_(g.activo)).sort((a,b) => Number(a.orden || 0) - Number(b.orden || 0)); }
function decorateGameIntegration_(game) {
  const integration = LA_GAME_INTEGRATIONS[String(game.gameId || '').toLowerCase()];
  return integration ? Object.assign({}, game, integration) : game;
}
function findStudent_(identifier) { const id = String(identifier || '').toLowerCase(); return rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS)).find(s => String(s.studentId).toLowerCase() === id || String(s.email).toLowerCase() === id); }
function findStudentByEmail_(email) { const clean = String(email || '').trim().toLowerCase(); return rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS)).find(s => String(s.email || '').trim().toLowerCase() === clean); }
function normalizeStudentLoginEmail_(email) {
  const clean = String(email || '').trim().toLowerCase();
  const escapedDomain = LA_CONFIG.STUDENT_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp('^[^@\\s]+' + escapedDomain + '$').test(clean)) throw new Error('Introduce tu correo completo @alumno.fomento.edu.');
  return clean;
}
function studentLoginThrottleKey_(email) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email, Utilities.Charset.UTF_8);
  return 'LA_LOGIN_' + Utilities.base64EncodeWebSafe(digest).slice(0, 42);
}
function getStudentLoginThrottle_(email) {
  const raw = CacheService.getScriptCache().get(studentLoginThrottleKey_(email));
  if (!raw) return { count:0, blockedUntil:0 };
  try { return JSON.parse(raw); } catch (err) { return { count:0, blockedUntil:0 }; }
}
function registerStudentLoginFailure_(email, previous) {
  const state = previous || { count:0, blockedUntil:0 };
  state.count = Number(state.count || 0) + 1;
  if (state.count >= 5) state.blockedUntil = Date.now() + 15 * 60 * 1000;
  CacheService.getScriptCache().put(studentLoginThrottleKey_(email), JSON.stringify(state), 900);
}
function clearStudentLoginFailures_(email) { CacheService.getScriptCache().remove(studentLoginThrottleKey_(email)); }
function findGame_(gameId) { return rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.JUEGOS)).find(g => String(g.gameId) === String(gameId)); }
function touchStudent_(studentId) { updateStudent_(studentId, { ultimaSesion:nowIso_() }); }
function recalculateStudentGeneral_(studentId) { const rows = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO)).filter(r => String(r.studentId) === String(studentId)).map(normalizeProgressRow_); const xp = rows.reduce((a,r) => a + Number(r.xp || 0), 0); const plumas = rows.reduce((a,r) => a + Number(r.plumas || 0), 0); updateStudent_(studentId, { xpGeneral:xp, nivelGeneral:Math.floor(xp / 500) + 1, plumas:plumas, ultimaSesion:nowIso_() }); }
function buildGeneralProgress_(student, progressRows, games) { const xp = progressRows.reduce((a,r) => a + Number(r.xp || 0), 0); const attempts = progressRows.reduce((a,r) => a + Number(r.attempts || 0), 0); const successes = progressRows.reduce((a,r) => a + Number(r.successes || 0), 0); const sessions = progressRows.reduce((a,r) => a + Number(r.sessions || 0), 0); return { xp:xp, level:Math.floor(xp / 500) + 1, nextLevelXp:(Math.floor(xp / 500) + 1) * 500, levelProgress:Math.round((xp % 500) / 5), plumas:progressRows.reduce((a,r) => a + Number(r.plumas || 0), 0), percentage:Math.round(average_(progressRows.map(r => Number(r.percentage || 0))) || 0), accuracy:attempts ? Math.round((successes / attempts) * 100) : 0, sessions:sessions, gamesPlayed:progressRows.filter(r => Number(r.sessions || 0) > 0).length, totalGames:games.filter(g => String(g.estado).toLowerCase() !== 'proximamente').length }; }
function emptyProgressForGame_(student, game) { return { studentId:student.studentId, email:student.email, nombre:student.nombre + ' ' + student.apellidos, clase:student.clase, gameId:game.gameId, gameName:game.nombre, xp:0, nivel:1, percentage:0, accuracy:0, attempts:0, successes:0, errors:0, streak:0, sessions:0, achievementsCount:0, missionsCompleted:0, plumas:0, lastActivity:'', rawJson:'{}', updatedAt:'' }; }
function normalizeProgressRow_(r) { ['xp','nivel','percentage','accuracy','attempts','successes','errors','streak','sessions','achievementsCount','missionsCompleted','plumas'].forEach(k => r[k] = Number(r[k] || 0)); return r; }
function buildClassRanking_(classCode, limit) { return rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS)).filter(s => s.clase === classCode).map(s => ({ studentId:s.studentId, nombre:s.nombre + ' ' + s.apellidos, xp:Number(s.xpGeneral || 0), level:Number(s.nivelGeneral || 1), plumas:Number(s.plumas || 0) })).sort((a,b) => b.xp - a.xp).slice(0, limit || 10); }
function buildClassRankingFromStudents_(students, classCode, limit) { return (students || []).filter(s => s.clase === classCode).map(s => ({ studentId:s.studentId, nombre:s.nombre + ' ' + s.apellidos, xp:Number(s.xpGeneral || 0), level:Number(s.nivelGeneral || 1), plumas:Number(s.plumas || 0) })).sort((a,b) => b.xp - a.xp).slice(0, limit || 10); }
function buildStudentMissions_(student, byGame) { const progress = Object.values(byGame); const sessions = progress.reduce((a,p) => a + Number(p.sessions || 0), 0); const variety = progress.filter(p => Number(p.sessions || 0) > 0).length; const acc = progress.reduce((m,p) => Math.max(m, Number(p.accuracy || 0)), 0); return [ {title:'Primer aterrizaje', progress:Math.min(sessions,1), target:1, completed:sessions>=1}, {title:'Explorador de LenguArcade', progress:Math.min(variety,3), target:3, completed:variety>=3}, {title:'Cazador de errores', progress:Math.min(acc,80), target:80, completed:acc>=80} ]; }
function calculateStudentGrade_(studentId, gameId) { const rows = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO)).filter(r => String(r.studentId) === String(studentId)).filter(r => !gameId || r.gameId === gameId).map(normalizeProgressRow_); if (!rows.length) return { score:0, breakdown:{ progreso:0, dominio:0, misiones:0, constancia:0, variedad:0, logros:0 } }; const xpScore = clamp_(average_(rows.map(r => Math.min(10, Number(r.xp || 0) / 80))),0,10); const accuracyScore = clamp_((average_(rows.map(r => r.accuracy)) || 0) / 10,0,10); const missionScore = clamp_(average_(rows.map(r => Number(r.missionsCompleted || 0))) * 2.5,0,10); const constancyScore = clamp_(average_(rows.map(r => Number(r.sessions || 0))) * 2,0,10); const varietyScore = gameId ? 10 : clamp_(rows.filter(r => Number(r.sessions || 0)>0).length * 1.7,0,10); const achievementScore = clamp_(average_(rows.map(r => Number(r.achievementsCount || 0))) * 2.5,0,10); return { score:round1_(xpScore*.25 + accuracyScore*.25 + missionScore*.20 + constancyScore*.15 + varietyScore*.10 + achievementScore*.05), breakdown:{ progreso:round1_(xpScore), dominio:round1_(accuracyScore), misiones:round1_(missionScore), constancia:round1_(constancyScore), variedad:round1_(varietyScore), logros:round1_(achievementScore) } }; }
function summarizeErrors_(errors) { const map = {}; errors.forEach(e => { const k = (e.skill || 'general') + ' - ' + (e.errorType || 'error'); map[k] = (map[k] || 0) + Number(e.count || 1); }); return Object.keys(map).map(k => ({ label:k, count:map[k] })).sort((a,b) => b.count - a.count).slice(0,8); }
function buildRecommendations_(errorSummary, popularGames) { const rec = []; if (errorSummary.length) rec.push('Refuerzo sugerido: ' + errorSummary[0].label + '.'); rec.push('Revisa alumnos con 0 sesiones y proponles una mision corta.'); rec.push('Para evaluar, combina progreso, precision, misiones y constancia.'); return rec; }
function getCounts_() { const o = {}; Object.keys(LA_CONFIG.SHEETS).forEach(k => { const sh = getSheet_(LA_CONFIG.SHEETS[k]); o[LA_CONFIG.SHEETS[k]] = Math.max(0, sh.getLastRow() - 1); }); return o; }
function getActiveUserEmail_() { try { return Session.getActiveUser().getEmail() || ''; } catch(e) { return ''; } }
function nowIso_() { return new Date().toISOString(); }
function isTrue_(v) { return String(v).toUpperCase() !== 'FALSE' && String(v) !== '0'; }
function average_(arr) { arr = arr.filter(v => v !== '' && !isNaN(Number(v))); return arr.length ? arr.reduce((a,b) => a + Number(b),0) / arr.length : 0; }
function round1_(n) { return Math.round(Number(n || 0) * 10) / 10; }
function clamp_(n,min,max) { return Math.max(min, Math.min(max, n)); }
function normalizeSlug_(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ñ/g,'n').replace(/[^a-z0-9._-]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,''); }
function logBackendError_(where, err, details) { try { appendObject_(getSheet_(LA_CONFIG.SHEETS.BACKEND_ERRORS), { timestamp:nowIso_(), where:where, message:err && err.message ? err.message : String(err), stack:err && err.stack ? err.stack : '', detailsJson:JSON.stringify(details || {}) }); } catch(e) {} }
