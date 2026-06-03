/**
 * LenguArcade v0.1
 * Backend central para Google Apps Script + Google Sheets.
 * Un unico Sheet central para alumnos, juegos, progreso, eventos y evaluacion.
 */

const LA_CONFIG = {
  VERSION: '0.1.0',
  DB_NAME: 'LenguArcade_DB',
  SPREADSHEET_ID: '',
  STUDENT_DOMAIN: '@alumno.fomento.edu',
  SHEETS: {
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

const LA_HEADERS = {
  Clases: ['classCode','curso','linea','nombreVisible','activa','updatedAt'],
  Alumnos: ['studentId','nombre','apellidos','email','curso','linea','clase','avatar','activo','xpGeneral','nivelGeneral','plumas','fechaAlta','ultimaSesion'],
  Juegos: ['gameId','nombre','subtitulo','categoria','competencias','estado','orden','color','icono','url','descripcion','activo','updatedAt'],
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
  const file = page === 'profesor' || page === 'teacher' ? 'LenguArcade_Profesor' : 'LenguArcade_Alumno';
  return HtmlService.createHtmlOutputFromFile(file)
    .setTitle(page === 'profesor' ? 'LenguArcade - Profesor' : 'LenguArcade - Alumno')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setupLenguArcade() {
  try {
    ensureSheets_();
    seedClasses_();
    seedGames_();
    seedMissions_();
    seedDemoStudents_();
    seedDemoProgress_();
    return { ok:true, version:LA_CONFIG.VERSION, spreadsheetUrl:getDb_().getUrl(), counts:getCounts_(), message:'LenguArcade v0.1 listo.' };
  } catch (err) {
    logBackendError_('setupLenguArcade', err, {});
    throw err;
  }
}

function getInitialData() {
  ensureSheets_();
  return {
    ok:true,
    version:LA_CONFIG.VERSION,
    spreadsheetUrl:getDb_().getUrl(),
    classes: rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.CLASES)).filter(r => isTrue_(r.activa)),
    students: rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS)).filter(r => isTrue_(r.activo)),
    games: getActiveGames_(),
    missions: rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.MISIONES)).filter(r => isTrue_(r.isActive)),
    counts:getCounts_(),
    activeUserEmail:getActiveUserEmail_()
  };
}

function getStudentDashboard(identifier) {
  ensureSheets_();
  const student = findStudent_(identifier);
  if (!student) throw new Error('No he encontrado ese alumno. Revisa correo o studentId.');
  touchStudent_(student.studentId);
  const games = getActiveGames_();
  const progressRows = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO)).filter(r => String(r.studentId) === String(student.studentId)).map(normalizeProgressRow_);
  const byGame = {};
  progressRows.forEach(r => byGame[r.gameId] = r);
  const gameCards = games.map(g => {
    const p = byGame[g.gameId] || emptyProgressForGame_(student, g);
    return Object.assign({}, g, { progress:p, locked:String(g.estado).toLowerCase() === 'proximamente', buttonLabel:p.sessions > 0 ? 'Continuar' : 'Probar' });
  });
  return {
    ok:true,
    student:student,
    general:buildGeneralProgress_(student, progressRows, games),
    games:gameCards,
    events: rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.EVENTOS)).filter(e => String(e.studentId) === String(student.studentId)).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0,12),
    achievements: rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.LOGROS)).filter(a => String(a.studentId) === String(student.studentId)).slice(-10).reverse(),
    ranking: buildClassRanking_(student.clase, 8),
    missions: buildStudentMissions_(student, byGame),
    grade: calculateStudentGrade_(student.studentId, null)
  };
}

function getTeacherDashboard(filters) {
  ensureSheets_();
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
    return { studentId:s.studentId, nombre:s.nombre + ' ' + s.apellidos, email:s.email, clase:s.clase, xp:general.xp, level:general.level, percentage:general.percentage, accuracy:general.accuracy, sessions:general.sessions, gamesPlayed:general.gamesPlayed, lastActivity:last, grade:grade.score };
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
    filters:filters,
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

function saveProgress(payload) {
  ensureSheets_();
  try {
    payload = payload || {};
    if (!payload.studentId && !payload.email && !payload.studentEmail) throw new Error('saveProgress necesita studentId o email.');
    if (!payload.gameId) throw new Error('saveProgress necesita gameId.');
    const student = findStudent_(payload.studentId || payload.email || payload.studentEmail);
    if (!student) throw new Error('Alumno no encontrado.');
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
    const record = {
      studentId:student.studentId,
      email:student.email,
      nombre:student.nombre + ' ' + student.apellidos,
      clase:student.clase,
      gameId:game.gameId,
      gameName:game.nombre,
      xp:newXp,
      nivel:Number(progress.level || progress.nivel || Math.floor(newXp / 250) + 1),
      percentage:clamp_(Number(progress.percentage || progress.percent || old.percentage || 0), 0, 100),
      accuracy:clamp_(Number(progress.accuracy || old.accuracy || 0), 0, 100),
      attempts:Number(progress.attempts || old.attempts || 0),
      successes:Number(progress.successes || old.successes || 0),
      errors:Number(progress.errors || old.errors || 0),
      streak:Number(progress.streak || old.streak || 0),
      sessions:Number(old.sessions || 0) + 1,
      achievementsCount:Number((payload.achievements || []).length || old.achievementsCount || 0),
      missionsCompleted:Number(progress.missionsCompleted || old.missionsCompleted || 0),
      plumas:newPlumas,
      lastActivity:now,
      rawJson:JSON.stringify(payload.rawGameData || payload),
      updatedAt:now
    };
    upsertByKeys_(sheet, ['studentId','gameId'], record);
    appendObject_(getSheet_(LA_CONFIG.SHEETS.EVENTOS), { eventId:Utilities.getUuid(), timestamp:now, studentId:student.studentId, email:student.email, nombre:record.nombre, clase:student.clase, gameId:game.gameId, eventType:payload.eventType || 'progress_saved', xpDelta:xpDelta, plumasDelta:plumasDelta, accuracy:record.accuracy, detailsJson:JSON.stringify(payload.details || {}) });
    appendObject_(getSheet_(LA_CONFIG.SHEETS.RAW), { timestamp:now, studentId:student.studentId, email:student.email, gameId:game.gameId, payloadJson:JSON.stringify(payload) });
    (payload.achievements || []).forEach(a => appendObject_(getSheet_(LA_CONFIG.SHEETS.LOGROS), { achievementId:typeof a === 'string' ? a : (a.id || a.achievementId || Utilities.getUuid()), studentId:student.studentId, email:student.email, gameId:game.gameId, title:typeof a === 'string' ? a : (a.title || a.name || 'Logro'), description:typeof a === 'string' ? '' : (a.description || ''), xpReward:typeof a === 'string' ? 0 : Number(a.xpReward || 0), unlockedAt:now }));
    if (payload.errors && payload.errors.length) {
      payload.errors.forEach(er => appendObject_(getSheet_(LA_CONFIG.SHEETS.ERRORES), { timestamp:now, studentId:student.studentId, email:student.email, gameId:game.gameId, skill:er.skill || '', errorType:er.type || er.errorType || '', count:Number(er.count || 1), detailsJson:JSON.stringify(er) }));
    }
    recalculateStudentGeneral_(student.studentId);
    const grade = calculateStudentGrade_(student.studentId, game.gameId);
    return { ok:true, message:'Progreso guardado', record:record, grade:grade, general:findStudent_(student.studentId) };
  } catch (err) {
    logBackendError_('saveProgress', err, payload);
    throw err;
  }
}

function calculateStudentGrade(studentId, gameId) {
  ensureSheets_();
  return calculateStudentGrade_(studentId, gameId || null);
}

function getDb_() {
  if (LA_CONFIG.SPREADSHEET_ID) return SpreadsheetApp.openById(LA_CONFIG.SPREADSHEET_ID);
  const props = PropertiesService.getScriptProperties();
  const saved = props.getProperty('LA_SPREADSHEET_ID');
  if (saved) return SpreadsheetApp.openById(saved);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) { props.setProperty('LA_SPREADSHEET_ID', active.getId()); return active; }
  const ss = SpreadsheetApp.create(LA_CONFIG.DB_NAME);
  props.setProperty('LA_SPREADSHEET_ID', ss.getId());
  return ss;
}

function ensureSheets_() {
  const ss = getDb_();
  Object.keys(LA_CONFIG.SHEETS).forEach(key => {
    const name = LA_CONFIG.SHEETS[key];
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const headers = LA_HEADERS[name];
    if (headers && sh.getLastRow() === 0) sh.appendRow(headers);
    if (headers && sh.getLastRow() > 0 && sh.getRange(1,1).getValue() !== headers[0]) {
      sh.clear();
      sh.appendRow(headers);
    }
  });
}

function getSheet_(name) { return getDb_().getSheetByName(name); }
function rowsToObjects_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(1,1,sheet.getLastRow(),sheet.getLastColumn()).getValues();
  const headers = values.shift();
  return values.filter(r => r.some(v => v !== '')).map(r => {
    const obj = {};
    headers.forEach((h,i) => obj[h] = r[i]);
    return obj;
  });
}
function appendObject_(sheet, obj) {
  const headers = LA_HEADERS[sheet.getName()] || sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(headers.map(h => obj[h] != null ? obj[h] : ''));
}
function upsertByKeys_(sheet, keys, obj) {
  const headers = LA_HEADERS[sheet.getName()];
  const rows = rowsToObjects_(sheet);
  const index = rows.findIndex(r => keys.every(k => String(r[k]) === String(obj[k])));
  const values = headers.map(h => obj[h] != null ? obj[h] : '');
  if (index >= 0) sheet.getRange(index + 2, 1, 1, headers.length).setValues([values]);
  else sheet.appendRow(values);
}
function updateStudent_(studentId, fields) {
  const sheet = getSheet_(LA_CONFIG.SHEETS.ALUMNOS);
  const rows = rowsToObjects_(sheet);
  const idx = rows.findIndex(r => String(r.studentId) === String(studentId));
  if (idx < 0) return;
  const merged = Object.assign({}, rows[idx], fields);
  const headers = LA_HEADERS.Alumnos;
  sheet.getRange(idx + 2, 1, 1, headers.length).setValues([headers.map(h => merged[h] != null ? merged[h] : '')]);
}

function seedClasses_() {
  const sh = getSheet_(LA_CONFIG.SHEETS.CLASES);
  if (sh.getLastRow() > 1) return;
  ['1ESO','2ESO','3ESO','4ESO'].forEach(curso => ['A','B'].forEach(linea => appendObject_(sh, { classCode:curso + '_' + linea, curso:curso, linea:linea, nombreVisible:curso.replace('ESO','º ESO') + ' ' + linea, activa:true, updatedAt:nowIso_() })));
}
function seedGames_() {
  const sh = getSheet_(LA_CONFIG.SHEETS.JUEGOS);
  if (sh.getLastRow() > 1) return;
  const games = [
    ['maniacgrafia','Maniacgrafia','Ortografia rapida','Ortografia','ortografia,acentuacion','beta',1,'#22d3ee','⚡','','Corrige, detecta y mejora tu precision ortografica.',true],
    ['versopolis','Versopolis','Poesia y travesias literarias','Escritura','poesia,literatura,creatividad','beta',2,'#a78bfa','✒️','','Crea poemas y completa desafios poeticos.',true],
    ['narratoria','Narratoria','Historias por fases','Escritura','narracion,creatividad,redaccion','beta',3,'#f59e0b','📚','','Construye relatos con cartas, fases y objetivos.',true],
    ['scrabble','Scrabble','Juego de palabras','Lexico','lexico,vocabulario,estrategia','aula',4,'#34d399','🔤','','Forma palabras y compite por equipos.',true],
    ['conjuga_apuesta','Conjuga y Apuesta','Verbos 1 contra 1','Verbos','verbos,morfologia','aula',5,'#fb7185','🎲','','Apuesta puntos conjugando formas verbales.',true],
    ['verb_battle','Verb Battle','Jeopardy verbal RPG','Verbos','verbos,morfologia,equipos','aula',6,'#60a5fa','⚔️','','Batalla por equipos con preguntas de conjugacion.',true],
    ['battlegrafia','Battlegrafia','RPG de Lengua','RPG','ortografia,gramatica,verbos','proximamente',7,'#ef4444','🐉','','Integracion avanzada pendiente.',true]
  ];
  games.forEach(g => appendObject_(sh, { gameId:g[0], nombre:g[1], subtitulo:g[2], categoria:g[3], competencias:g[4], estado:g[5], orden:g[6], color:g[7], icono:g[8], url:g[9], descripcion:g[10], activo:g[11], updatedAt:nowIso_() }));
}
function seedMissions_() {
  const sh = getSheet_(LA_CONFIG.SHEETS.MISIONES);
  if (sh.getLastRow() > 1) return;
  [
    ['mision_primera_partida','Primer aterrizaje','Guarda tu primer progreso en cualquier juego.','general','sessions',1,50,5],
    ['mision_explorador','Explorador de LenguArcade','Prueba tres juegos distintos.','general','variety',3,100,10],
    ['mision_precision','Cazador de errores','Supera el 80% de precision en un juego.','general','accuracy',80,80,8]
  ].forEach(m => appendObject_(sh, { missionId:m[0], title:m[1], description:m[2], gameId:m[3], type:m[4], target:m[5], rewardXp:m[6], rewardPlumas:m[7], activeFrom:'', activeTo:'', isActive:true }));
}
function seedDemoStudents_() {
  const sh = getSheet_(LA_CONFIG.SHEETS.ALUMNOS);
  if (sh.getLastRow() > 1) return;
  const names = ['Alvaro','Bruno','Carlos','Diego','Enrique','Fernando','Gonzalo','Hector','Ignacio','Javier','Lucas','Marcos','Nicolas','Oscar','Pablo','Rafael','Santiago','Tomas','Victor','Adrian','Mateo','Daniel','Mario','Leo','Hugo','Izan','Jaime','Rodrigo','Samuel','Yago'];
  const surnames = ['Garcia Martin','Lopez Sanz','Perez Alonso','Sanchez Ruiz','Martinez Gil','Fernandez Cano','Gomez Vidal','Diaz Moreno','Hernandez Rubio','Jimenez Torres','Moreno Serrano','Alvarez Vega','Romero Ortega','Navarro Molina','Dominguez Nieto','Ramos Castro','Vazquez Herrero','Iglesias Leon','Blanco Pascual','Mendez Prieto','Soto Marin','Crespo Arias','Fuentes Calvo','Reyes Lara','Cabrera Pardo','Soler Roman','Pastor Rios','Campos Navas','Carrasco Bueno','Velasco Santos'];
  rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.CLASES)).forEach(cls => {
    for (let i=0; i<30; i++) {
      const nombre = names[i];
      const apellidos = surnames[(i + String(cls.classCode).length) % surnames.length];
      const slug = normalizeSlug_(nombre + '.' + apellidos.replace(/ /g,'.'));
      appendObject_(sh, { studentId:cls.classCode + '_' + normalizeSlug_(nombre + '_' + apellidos), nombre:nombre, apellidos:apellidos, email:slug + LA_CONFIG.STUDENT_DOMAIN, curso:cls.curso, linea:cls.linea, clase:cls.classCode, avatar:'avatar_' + String((i % 12) + 1).padStart(2,'0'), activo:true, xpGeneral:0, nivelGeneral:1, plumas:0, fechaAlta:nowIso_(), ultimaSesion:'' });
    }
  });
}
function seedDemoProgress_() {
  const sh = getSheet_(LA_CONFIG.SHEETS.PROGRESO);
  if (sh.getLastRow() > 1) return;
  const students = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS)).slice(0,40);
  const games = getActiveGames_().filter(g => String(g.estado).toLowerCase() !== 'proximamente').slice(0,4);
  students.forEach((s, idx) => {
    games.forEach((g, gi) => {
      if ((idx + gi) % 3 === 0) return;
      const xp = 60 + ((idx * 37 + gi * 80) % 520);
      const attempts = 8 + ((idx + gi) % 20);
      const successes = Math.max(1, Math.round(attempts * (0.55 + ((idx + gi) % 4) * 0.1)));
      appendObject_(sh, { studentId:s.studentId, email:s.email, nombre:s.nombre + ' ' + s.apellidos, clase:s.clase, gameId:g.gameId, gameName:g.nombre, xp:xp, nivel:Math.floor(xp / 250) + 1, percentage:Math.min(100, Math.round(xp / 8)), accuracy:Math.round((successes / attempts) * 100), attempts:attempts, successes:successes, errors:attempts-successes, streak:(idx + gi) % 9, sessions:1 + ((idx + gi) % 5), achievementsCount:(idx + gi) % 4, missionsCompleted:(idx + gi) % 3, plumas:Math.floor(xp / 50), lastActivity:nowIso_(), rawJson:'{}', updatedAt:nowIso_() });
    });
    recalculateStudentGeneral_(s.studentId);
  });
}

function getActiveGames_() { return rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.JUEGOS)).filter(g => isTrue_(g.activo)).sort((a,b) => Number(a.orden || 0) - Number(b.orden || 0)); }
function findStudent_(identifier) { const id = String(identifier || '').toLowerCase(); return rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS)).find(s => String(s.studentId).toLowerCase() === id || String(s.email).toLowerCase() === id); }
function findGame_(gameId) { return rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.JUEGOS)).find(g => String(g.gameId) === String(gameId)); }
function touchStudent_(studentId) { updateStudent_(studentId, { ultimaSesion:nowIso_() }); }
function recalculateStudentGeneral_(studentId) { const rows = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO)).filter(r => String(r.studentId) === String(studentId)).map(normalizeProgressRow_); const xp = rows.reduce((a,r) => a + Number(r.xp || 0), 0); const plumas = rows.reduce((a,r) => a + Number(r.plumas || 0), 0); updateStudent_(studentId, { xpGeneral:xp, nivelGeneral:Math.floor(xp / 500) + 1, plumas:plumas, ultimaSesion:nowIso_() }); }
function buildGeneralProgress_(student, progressRows, games) { const xp = progressRows.reduce((a,r) => a + Number(r.xp || 0), 0); const attempts = progressRows.reduce((a,r) => a + Number(r.attempts || 0), 0); const successes = progressRows.reduce((a,r) => a + Number(r.successes || 0), 0); const sessions = progressRows.reduce((a,r) => a + Number(r.sessions || 0), 0); return { xp:xp, level:Math.floor(xp / 500) + 1, nextLevelXp:(Math.floor(xp / 500) + 1) * 500, levelProgress:Math.round((xp % 500) / 5), plumas:progressRows.reduce((a,r) => a + Number(r.plumas || 0), 0), percentage:Math.round(average_(progressRows.map(r => Number(r.percentage || 0))) || 0), accuracy:attempts ? Math.round((successes / attempts) * 100) : 0, sessions:sessions, gamesPlayed:progressRows.filter(r => Number(r.sessions || 0) > 0).length, totalGames:games.filter(g => String(g.estado).toLowerCase() !== 'proximamente').length } }
function emptyProgressForGame_(student, game) { return { studentId:student.studentId, email:student.email, nombre:student.nombre + ' ' + student.apellidos, clase:student.clase, gameId:game.gameId, gameName:game.nombre, xp:0, nivel:1, percentage:0, accuracy:0, attempts:0, successes:0, errors:0, streak:0, sessions:0, achievementsCount:0, missionsCompleted:0, plumas:0, lastActivity:'', rawJson:'{}', updatedAt:'' }; }
function normalizeProgressRow_(r) { ['xp','nivel','percentage','accuracy','attempts','successes','errors','streak','sessions','achievementsCount','missionsCompleted','plumas'].forEach(k => r[k] = Number(r[k] || 0)); return r; }
function buildClassRanking_(classCode, limit) { const students = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS)).filter(s => s.clase === classCode).map(s => ({ studentId:s.studentId, nombre:s.nombre + ' ' + s.apellidos, xp:Number(s.xpGeneral || 0), level:Number(s.nivelGeneral || 1), plumas:Number(s.plumas || 0) })).sort((a,b) => b.xp - a.xp); return students.slice(0, limit || 10); }
function buildStudentMissions_(student, byGame) { const progress = Object.values(byGame); const sessions = progress.reduce((a,p) => a + Number(p.sessions || 0), 0); const variety = progress.filter(p => Number(p.sessions || 0) > 0).length; const acc = progress.reduce((m,p) => Math.max(m, Number(p.accuracy || 0)), 0); return [ {title:'Primer aterrizaje', progress:Math.min(sessions,1), target:1, completed:sessions>=1}, {title:'Explorador de LenguArcade', progress:Math.min(variety,3), target:3, completed:variety>=3}, {title:'Cazador de errores', progress:Math.min(acc,80), target:80, completed:acc>=80} ]; }
function calculateStudentGrade_(studentId, gameId) { const rows = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO)).filter(r => String(r.studentId) === String(studentId)).filter(r => !gameId || r.gameId === gameId).map(normalizeProgressRow_); if (!rows.length) return { score:0, breakdown:{ progreso:0, dominio:0, misiones:0, constancia:0, variedad:0, logros:0 } }; const xpScore = clamp_(average_(rows.map(r => Math.min(10, Number(r.xp || 0) / 80))),0,10); const accuracyScore = clamp_((average_(rows.map(r => r.accuracy)) || 0) / 10,0,10); const missionScore = clamp_(average_(rows.map(r => Number(r.missionsCompleted || 0))) * 2.5,0,10); const constancyScore = clamp_(average_(rows.map(r => Number(r.sessions || 0))) * 2,0,10); const varietyScore = gameId ? 10 : clamp_(rows.filter(r => Number(r.sessions || 0)>0).length * 1.7,0,10); const achievementScore = clamp_(average_(rows.map(r => Number(r.achievementsCount || 0))) * 2.5,0,10); const score = round1_(xpScore*.25 + accuracyScore*.25 + missionScore*.20 + constancyScore*.15 + varietyScore*.10 + achievementScore*.05); return { score:score, breakdown:{ progreso:round1_(xpScore), dominio:round1_(accuracyScore), misiones:round1_(missionScore), constancia:round1_(constancyScore), variedad:round1_(varietyScore), logros:round1_(achievementScore) } }; }
function summarizeErrors_(errors) { const map = {}; errors.forEach(e => { const k = (e.skill || 'general') + ' - ' + (e.errorType || 'error'); map[k] = (map[k] || 0) + Number(e.count || 1); }); return Object.keys(map).map(k => ({ label:k, count:map[k] })).sort((a,b) => b.count - a.count).slice(0,8); }
function buildRecommendations_(errorSummary, popularGames) { const rec = []; if (errorSummary.length) rec.push('Refuerzo sugerido: ' + errorSummary[0].label + '.'); if (popularGames.length && popularGames[0].sessions === 0) rec.push('Aun no hay sesiones reales. Prueba el boton de simulacion del panel alumno.'); else rec.push('Revisa alumnos con 0 sesiones y proponles una mision corta.'); rec.push('Para evaluar, combina progreso, precision, misiones y constancia.'); return rec; }
function getCounts_() { const o = {}; Object.keys(LA_CONFIG.SHEETS).forEach(k => { const sh = getSheet_(LA_CONFIG.SHEETS[k]); o[LA_CONFIG.SHEETS[k]] = Math.max(0, sh.getLastRow() - 1); }); return o; }
function getActiveUserEmail_() { try { return Session.getActiveUser().getEmail() || ''; } catch(e) { return ''; } }
function nowIso_() { return new Date().toISOString(); }
function isTrue_(v) { return String(v).toUpperCase() !== 'FALSE' && String(v) !== '0'; }
function average_(arr) { arr = arr.filter(v => v !== '' && !isNaN(Number(v))); return arr.length ? arr.reduce((a,b) => a + Number(b),0) / arr.length : 0; }
function round1_(n) { return Math.round(Number(n || 0) * 10) / 10; }
function clamp_(n,min,max) { return Math.max(min, Math.min(max, n)); }
function normalizeSlug_(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ñ/g,'n').replace(/[^a-z0-9._-]+/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,''); }
function logBackendError_(where, err, details) { try { appendObject_(getSheet_(LA_CONFIG.SHEETS.BACKEND_ERRORS), { timestamp:nowIso_(), where:where, message:err && err.message ? err.message : String(err), stack:err && err.stack ? err.stack : '', detailsJson:JSON.stringify(details || {}) }); } catch(e) {} }
