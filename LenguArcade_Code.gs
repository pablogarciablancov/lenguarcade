/**
 * LenguArcade v0.1
 * Backend central para Google Apps Script + Google Sheets.
 *
 * Instalación rápida:
 * 1) Crea una hoja de cálculo llamada LenguArcade_DB.
 * 2) Extensiones > Apps Script.
 * 3) Pega este archivo como Code.gs.
 * 4) Crea dos archivos HTML: LenguArcade_Alumno y LenguArcade_Profesor.
 * 5) Ejecuta setupLenguArcade() una vez y autoriza.
 * 6) Implementa como aplicación web.
 */

const LA_CONFIG = {
  VERSION: '0.1.0',
  DB_NAME: 'LenguArcade_DB',
  // Si quieres fijar una hoja concreta, pega aquí su ID. Si lo dejas vacío, el script usa la hoja activa o crea una nueva.
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

const LA_HEADERS = {
  Config: ['key', 'value', 'updatedAt'],
  Clases: ['classCode', 'curso', 'linea', 'nombreVisible', 'activa', 'updatedAt'],
  Alumnos: ['studentId', 'nombre', 'apellidos', 'email', 'curso', 'linea', 'clase', 'avatar', 'activo', 'xpGeneral', 'nivelGeneral', 'plumas', 'fechaAlta', 'ultimaSesion'],
  Juegos: ['gameId', 'nombre', 'subtitulo', 'categoria', 'competencias', 'estado', 'orden', 'color', 'icono', 'url', 'descripcion', 'activo', 'updatedAt'],
  ProgresoJuegos: ['studentId', 'email', 'nombre', 'clase', 'gameId', 'gameName', 'xp', 'nivel', 'percentage', 'accuracy', 'attempts', 'successes', 'errors', 'streak', 'sessions', 'achievementsCount', 'missionsCompleted', 'plumas', 'lastActivity', 'rawJson', 'updatedAt'],
  Eventos: ['eventId', 'timestamp', 'studentId', 'email', 'nombre', 'clase', 'gameId', 'eventType', 'xpDelta', 'plumasDelta', 'accuracy', 'detailsJson'],
  Logros: ['achievementId', 'studentId', 'email', 'gameId', 'title', 'description', 'xpReward', 'unlockedAt'],
  Misiones: ['missionId', 'title', 'description', 'gameId', 'type', 'target', 'rewardXp', 'rewardPlumas', 'activeFrom', 'activeTo', 'isActive'],
  Evaluaciones: ['studentId', 'email', 'classCode', 'scope', 'gameId', 'score', 'breakdownJson', 'updatedAt'],
  Errores: ['timestamp', 'studentId', 'email', 'gameId', 'skill', 'errorType', 'count', 'detailsJson'],
  RawPayloads: ['timestamp', 'studentId', 'email', 'gameId', 'payloadJson'],
  BackendErrors: ['timestamp', 'where', 'message', 'stack', 'detailsJson']
};

function doGet(e) {
  const page = String((e && e.parameter && e.parameter.page) || 'alumno').toLowerCase();
  const file = page === 'profesor' || page === 'teacher' ? 'LenguArcade_Profesor' : 'LenguArcade_Alumno';
  return HtmlService
    .createHtmlOutputFromFile(file)
    .setTitle(page === 'profesor' ? 'LenguArcade · Panel del profesor' : 'LenguArcade · Alumno')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setupLenguArcade() {
  try {
    const ss = getDb_();
    ensureSheets_();
    seedConfig_();
    seedClasses_();
    seedGames_();
    seedMissions_();
    seedDemoStudents_();
    seedDemoProgress_();
    return {
      ok: true,
      version: LA_CONFIG.VERSION,
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl(),
      counts: getCounts_(),
      message: 'LenguArcade está inicializado y listo para probar.'
    };
  } catch (err) {
    logBackendError_('setupLenguArcade', err, {});
    throw err;
  }
}

function getInitialData() {
  ensureSheets_();
  return {
    ok: true,
    version: LA_CONFIG.VERSION,
    spreadsheetUrl: getDb_().getUrl(),
    classes: rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.CLASES)).filter(c => String(c.activa).toUpperCase() !== 'FALSE'),
    students: rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS)).filter(s => String(s.activo).toUpperCase() !== 'FALSE'),
    games: getActiveGames_(),
    missions: rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.MISIONES)).filter(m => String(m.isActive).toUpperCase() !== 'FALSE'),
    counts: getCounts_(),
    activeUserEmail: getActiveUserEmail_()
  };
}

function getStudentDashboard(identifier) {
  ensureSheets_();
  const student = findStudent_(identifier);
  if (!student) throw new Error('No he encontrado ese alumno. Revisa el correo o el studentId.');

  touchStudent_(student.studentId);

  const games = getActiveGames_();
  const progressRows = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO));
  const studentProgress = progressRows.filter(r => String(r.studentId) === String(student.studentId));
  const progressByGame = {};
  studentProgress.forEach(r => { progressByGame[r.gameId] = normalizeProgressRow_(r); });

  const gameCards = games.map(g => {
    const p = progressByGame[g.gameId] || emptyProgressForGame_(student, g);
    return Object.assign({}, g, {
      progress: p,
      buttonLabel: p.sessions > 0 ? 'Continuar' : (g.estado === 'proximamente' ? 'Próximamente' : 'Jugar'),
      locked: String(g.estado).toLowerCase() === 'proximamente' || String(g.activo).toUpperCase() === 'FALSE'
    });
  });

  const general = buildGeneralProgress_(student, studentProgress, games);
  const events = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.EVENTOS))
    .filter(e => String(e.studentId) === String(student.studentId))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 12);
  const achievements = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.LOGROS))
    .filter(a => String(a.studentId) === String(student.studentId))
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
    .slice(0, 10);
  const ranking = buildClassRanking_(student.clase, 8);
  const missions = buildStudentMissions_(student, progressByGame);
  const grade = calculateStudentGrade_(student.studentId, null);

  return {
    ok: true,
    student: student,
    general: general,
    games: gameCards,
    events: events,
    achievements: achievements,
    ranking: ranking,
    missions: missions,
    grade: grade
  };
}

function getTeacherDashboard(filters) {
  ensureSheets_();
  filters = filters || {};
  const classCode = filters.classCode || '';
  const gameId = filters.gameId || '';

  const students = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS))
    .filter(s => String(s.activo).toUpperCase() !== 'FALSE')
    .filter(s => !classCode || s.clase === classCode);
  const games = getActiveGames_();
  const progressRows = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO))
    .filter(p => !classCode || p.clase === classCode)
    .filter(p => !gameId || p.gameId === gameId)
    .map(normalizeProgressRow_);
  const events = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.EVENTOS))
    .filter(e => !classCode || e.clase === classCode)
    .filter(e => !gameId || e.gameId === gameId);
  const errors = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ERRORES))
    .filter(e => !classCode || String(findStudent_(e.studentId)?.clase || '') === classCode)
    .filter(e => !gameId || e.gameId === gameId);

  const todayKey = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const todayEvents = events.filter(e => String(e.timestamp).slice(0, 10) === todayKey);

  const studentSummaries = students.map(s => {
    const rows = progressRows.filter(p => p.studentId === s.studentId);
    const general = buildGeneralProgress_(s, rows, games);
    const grade = calculateStudentGrade_(s.studentId, gameId || null);
    const last = rows.map(r => r.lastActivity).filter(Boolean).sort().pop() || '';
    return {
      studentId: s.studentId,
      nombre: `${s.nombre} ${s.apellidos}`,
      email: s.email,
      clase: s.clase,
      xp: general.xp,
      level: general.level,
      percentage: general.percentage,
      accuracy: general.accuracy,
      sessions: general.sessions,
      gamesPlayed: general.gamesPlayed,
      lastActivity: last,
      grade: grade.score
    };
  }).sort((a, b) => b.xp - a.xp);

  const popularGames = games.map(g => {
    const sessions = progressRows.filter(p => p.gameId === g.gameId).reduce((acc, p) => acc + Number(p.sessions || 0), 0);
    return { gameId: g.gameId, nombre: g.nombre, icono: g.icono, color: g.color, sessions: sessions };
  }).sort((a, b) => b.sessions - a.sessions);
  const totalSessions = popularGames.reduce((acc, g) => acc + g.sessions, 0) || 1;
  popularGames.forEach(g => g.percent = Math.round((g.sessions / totalSessions) * 100));

  const errorSummary = summarizeErrors_(errors);
  const focus = studentSummaries[0] || null;
  const focusProgress = focus ? progressRows.filter(p => p.studentId === focus.studentId) : [];

  return {
    ok: true,
    filters: filters,
    summary: {
      studentsTotal: students.length,
      activeStudents: studentSummaries.filter(s => s.sessions > 0).length,
      sessionsToday: todayEvents.length,
      gamesAvailable: games.filter(g => String(g.estado).toLowerCase() !== 'proximamente').length,
      achievementsTotal: rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.LOGROS)).length,
      averageGrade: round1_(average_(studentSummaries.map(s => s.grade)))
    },
    students: studentSummaries,
    games: games,
    popularGames: popularGames,
    errorSummary: errorSummary,
    recommendations: buildRecommendations_(errorSummary, popularGames),
    focus: focus,
    focusProgress: focusProgress,
    classes: rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.CLASES)).filter(c => String(c.activa).toUpperCase() !== 'FALSE')
  };
}

function saveProgress(payload) {
  ensureSheets_();
  try {
    payload = payload || {};
    if (!payload.studentId && !payload.email && !payload.studentEmail) throw new Error('saveProgress necesita studentId o email.');
    if (!payload.gameId) throw new Error('saveProgress necesita gameId.');

    const student = findStudent_(payload.studentId || payload.email || payload.studentEmail);
    if (!student) throw new Error('Alumno no encontrado para saveProgress.');

    const game = findGame_(payload.gameId) || { gameId: payload.gameId, nombre: payload.gameId };
    const progress = payload.progress || {};
    const now = nowIso_();
    const progresoSheet = getSheet_(LA_CONFIG.SHEETS.PROGRESO);
    const rows = rowsToObjects_(progresoSheet);
    const rowIndex = rows.findIndex(r => String(r.studentId) === String(student.studentId) && String(r.gameId) === String(game.gameId));
    const existing = rowIndex >= 0 ? normalizeProgressRow_(rows[rowIndex]) : emptyProgressForGame_(student, game);

    const xpDelta = Number(payload.xpDelta || progress.xpDelta || 0);
    const newXp = Number(progress.xp !== undefined ? progress.xp : (existing.xp + xpDelta));
    const newSessions = Number(progress.sessions !== undefined ? progress.sessions : existing.sessions + 1);
    const achievements = Array.isArray(payload.achievements) ? payload.achievements : [];
    const missions = Array.isArray(payload.missions) ? payload.missions : [];
    const plumasDelta = Number(payload.plumasDelta || progress.plumasDelta || Math.max(0, Math.floor(xpDelta / 10)));

    const updated = {
      studentId: student.studentId,
      email: student.email,
      nombre: `${student.nombre} ${student.apellidos}`,
      clase: student.clase,
      gameId: game.gameId,
      gameName: game.nombre,
      xp: newXp,
      nivel: Number(progress.level || progress.nivel || levelFromXp_(newXp)),
      percentage: clamp_(Number(progress.percentage !== undefined ? progress.percentage : existing.percentage), 0, 100),
      accuracy: clamp_(Number(progress.accuracy !== undefined ? progress.accuracy : existing.accuracy), 0, 100),
      attempts: Number(progress.attempts !== undefined ? progress.attempts : existing.attempts),
      successes: Number(progress.successes !== undefined ? progress.successes : existing.successes),
      errors: Number(progress.errors !== undefined ? progress.errors : existing.errors),
      streak: Number(progress.streak !== undefined ? progress.streak : existing.streak),
      sessions: newSessions,
      achievementsCount: Math.max(Number(existing.achievementsCount || 0), Number(progress.achievementsCount || 0)) + achievements.length,
      missionsCompleted: Math.max(Number(existing.missionsCompleted || 0), Number(progress.missionsCompleted || 0)) + missions.filter(m => m.completed).length,
      plumas: Number(existing.plumas || 0) + plumasDelta,
      lastActivity: now,
      rawJson: safeStringify_(payload.rawGameData || payload.raw || progress.raw || {}),
      updatedAt: now
    };

    upsertObjectRow_(progresoSheet, updated, ['studentId', 'gameId']);
    appendObjectRow_(getSheet_(LA_CONFIG.SHEETS.EVENTOS), {
      eventId: uuid_(),
      timestamp: now,
      studentId: student.studentId,
      email: student.email,
      nombre: `${student.nombre} ${student.apellidos}`,
      clase: student.clase,
      gameId: game.gameId,
      eventType: payload.eventType || 'progress_saved',
      xpDelta: xpDelta,
      plumasDelta: plumasDelta,
      accuracy: updated.accuracy,
      detailsJson: safeStringify_(payload.details || payload)
    });
    appendObjectRow_(getSheet_(LA_CONFIG.SHEETS.RAW), {
      timestamp: now,
      studentId: student.studentId,
      email: student.email,
      gameId: game.gameId,
      payloadJson: safeStringify_(payload)
    });

    achievements.forEach(a => unlockAchievement_(student, game.gameId, a));
    if (payload.errorsBySkill) saveErrors_(student, game.gameId, payload.errorsBySkill);

    updateStudentGeneral_(student.studentId);
    const grade = calculateStudentGrade_(student.studentId, game.gameId);
    return { ok: true, updated: updated, grade: grade };
  } catch (err) {
    logBackendError_('saveProgress', err, payload);
    throw err;
  }
}

function recordDiagnosticPing(identifier, role) {
  ensureSheets_();
  const now = nowIso_();
  let student = findStudent_(identifier);
  if (!student) {
    const all = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS));
    student = all[0];
  }
  if (student) {
    appendObjectRow_(getSheet_(LA_CONFIG.SHEETS.EVENTOS), {
      eventId: uuid_(),
      timestamp: now,
      studentId: student.studentId,
      email: student.email,
      nombre: `${student.nombre} ${student.apellidos}`,
      clase: student.clase,
      gameId: 'lenguarcade',
      eventType: `diagnostic_ping_${role || 'unknown'}`,
      xpDelta: 0,
      plumasDelta: 0,
      accuracy: '',
      detailsJson: safeStringify_({ role: role || '', user: getActiveUserEmail_(), version: LA_CONFIG.VERSION })
    });
  }
  return { ok: true, timestamp: now, counts: getCounts_(), activeUserEmail: getActiveUserEmail_(), spreadsheetUrl: getDb_().getUrl() };
}

function calculateStudentGrade(identifier, gameId) {
  const student = findStudent_(identifier);
  if (!student) throw new Error('Alumno no encontrado.');
  return calculateStudentGrade_(student.studentId, gameId || null);
}

function calculateGameGrade(identifier, gameId) {
  return calculateStudentGrade(identifier, gameId);
}

function calculateClassSummary(classCode) {
  return getTeacherDashboard({ classCode: classCode || '' }).summary;
}

// --------------------------------------------------------------------------------------
// Seed inicial
// --------------------------------------------------------------------------------------

function seedConfig_() {
  const sheet = getSheet_(LA_CONFIG.SHEETS.CONFIG);
  const entries = [
    { key: 'version', value: LA_CONFIG.VERSION, updatedAt: nowIso_() },
    { key: 'xpPerLevel', value: '750', updatedAt: nowIso_() },
    { key: 'currencyName', value: 'Plumas', updatedAt: nowIso_() },
    { key: 'theme', value: 'arcade-neon', updatedAt: nowIso_() }
  ];
  entries.forEach(e => upsertObjectRow_(sheet, e, ['key']));
}

function seedClasses_() {
  const sheet = getSheet_(LA_CONFIG.SHEETS.CLASES);
  const rows = [];
  ['1ESO', '2ESO', '3ESO', '4ESO'].forEach(curso => {
    ['A', 'B'].forEach(linea => {
      rows.push({ classCode: `${curso} ${linea}`, curso: curso, linea: linea, nombreVisible: `${curso.replace('ESO', 'º ESO')} ${linea}`, activa: true, updatedAt: nowIso_() });
    });
  });
  rows.forEach(r => upsertObjectRow_(sheet, r, ['classCode']));
}

function seedGames_() {
  const sheet = getSheet_(LA_CONFIG.SHEETS.JUEGOS);
  const rows = [
    { gameId: 'battlegrafia', nombre: 'Battlegrafía', subtitulo: 'La aventura de las palabras', categoria: 'RPG de Lengua', competencias: 'ortografia,morfologia,sintaxis,verbos', estado: 'proximamente', orden: 1, color: '#facc15', icono: '⚔️', url: '', descripcion: 'RPG principal del universo LenguArcade. Integración avanzada pendiente.', activo: true, updatedAt: nowIso_() },
    { gameId: 'maniacgrafia', nombre: 'Maniacgrafía', subtitulo: 'Atrapa las palabras', categoria: 'Ortografía', competencias: 'ortografia,acentuacion,bv,gj', estado: 'beta', orden: 2, color: '#f59e0b', icono: '⚡', url: '', descripcion: 'Juego rápido de ortografía y palabras trampa.', activo: true, updatedAt: nowIso_() },
    { gameId: 'narratoria', nombre: 'Narratoria', subtitulo: 'Escribe, crea, cuenta', categoria: 'Escritura creativa', competencias: 'escritura,narracion,creatividad,coherencia', estado: 'beta', orden: 3, color: '#38bdf8', icono: '📖', url: '', descripcion: 'Juego de cartas narrativas para crear historias por fases.', activo: true, updatedAt: nowIso_() },
    { gameId: 'versopolis', nombre: 'Versópolis', subtitulo: 'La ciudad de la poesía', categoria: 'Poesía', competencias: 'poesia,metrica,rima,creatividad,literatura', estado: 'beta', orden: 4, color: '#a855f7', icono: '🪶', url: '', descripcion: 'Aventura de escritura poética y travesías literarias.', activo: true, updatedAt: nowIso_() },
    { gameId: 'scrabble', nombre: 'Scrabble', subtitulo: 'Construye, suma, aprende', categoria: 'Léxico', competencias: 'lexico,vocabulario,estrategia,ortografia', estado: 'activo', orden: 5, color: '#22c55e', icono: '🔤', url: '', descripcion: 'Juego de palabras por equipos o jugadores.', activo: true, updatedAt: nowIso_() },
    { gameId: 'conjuga_apuesta', nombre: 'Conjuga y Apuesta', subtitulo: 'Riesgo verbal', categoria: 'Verbos', competencias: 'verbos,conjugacion,morfologia', estado: 'activo', orden: 6, color: '#fb7185', icono: '🎲', url: '', descripcion: 'Duelo de conjugación con apuestas y puntuación.', activo: true, updatedAt: nowIso_() },
    { gameId: 'jeopardy_verbos', nombre: 'Jeopardy de Verbos', subtitulo: 'Batalla de conjugación', categoria: 'Verbos por equipos', competencias: 'verbos,conjugacion,estrategia', estado: 'activo', orden: 7, color: '#60a5fa', icono: '🕹️', url: '', descripcion: 'Batalla por equipos estilo Jeopardy RPG.', activo: true, updatedAt: nowIso_() }
  ];
  rows.forEach(r => upsertObjectRow_(sheet, r, ['gameId']));
}

function seedMissions_() {
  const sheet = getSheet_(LA_CONFIG.SHEETS.MISIONES);
  const rows = [
    { missionId: 'daily_maniac_10', title: 'Corrige 10 palabras', description: 'Completa 10 intentos en Maniacgrafía.', gameId: 'maniacgrafia', type: 'attempts', target: 10, rewardXp: 50, rewardPlumas: 5, activeFrom: '', activeTo: '', isActive: true },
    { missionId: 'daily_verso_1', title: 'Escribe 1 poema', description: 'Avanza en Versópolis escribiendo un poema.', gameId: 'versopolis', type: 'creative_output', target: 1, rewardXp: 80, rewardPlumas: 8, activeFrom: '', activeTo: '', isActive: true },
    { missionId: 'daily_narratoria_phase', title: 'Completa una fase narrativa', description: 'Termina una fase de una historia en Narratoria.', gameId: 'narratoria', type: 'phase_completed', target: 1, rewardXp: 70, rewardPlumas: 7, activeFrom: '', activeTo: '', isActive: true },
    { missionId: 'weekly_variety_3', title: 'Explorador de LenguArcade', description: 'Juega a 3 juegos distintos esta semana.', gameId: 'lenguarcade', type: 'variety', target: 3, rewardXp: 120, rewardPlumas: 12, activeFrom: '', activeTo: '', isActive: true }
  ];
  rows.forEach(r => upsertObjectRow_(sheet, r, ['missionId']));
}

function seedDemoStudents_() {
  const sheet = getSheet_(LA_CONFIG.SHEETS.ALUMNOS);
  if (sheet.getLastRow() > 1) return;

  const names = ['Álvaro', 'Lucía', 'Marcos', 'Claudia', 'Sara', 'Diego', 'Carla', 'Iker', 'Sofía', 'Hugo', 'Paula', 'Mario', 'Vega', 'Nicolás', 'Jimena', 'Pablo', 'Martina', 'Jaime', 'Noa', 'Mateo', 'Valeria', 'Iván', 'Aitana', 'Leo', 'Inés', 'Daniel', 'Celia', 'Jorge', 'Elena', 'Adrián'];
  const surn1 = ['Martín', 'García', 'López', 'Sánchez', 'Fernández', 'Muñoz', 'Romero', 'Díaz', 'Hernández', 'Ruiz', 'Moreno', 'Álvarez', 'Jiménez', 'Gil', 'Núñez', 'Serrano', 'Ortega', 'Molina', 'Castro', 'Vargas', 'Navarro', 'Iglesias', 'Cano', 'Ramos', 'Prieto', 'Rey', 'Campos', 'Vidal', 'Pastor', 'Santos'];
  const surn2 = ['Santos', 'Rey', 'Campos', 'Vidal', 'Pastor', 'Núñez', 'Serrano', 'Ortega', 'Molina', 'Castro', 'Vargas', 'Navarro', 'Iglesias', 'Cano', 'Ramos', 'Martín', 'García', 'López', 'Sánchez', 'Fernández', 'Muñoz', 'Romero', 'Díaz', 'Hernández', 'Ruiz', 'Moreno', 'Álvarez', 'Jiménez', 'Gil', 'Prieto'];
  const rows = [];
  ['1ESO', '2ESO', '3ESO', '4ESO'].forEach((curso, ci) => {
    ['A', 'B'].forEach((linea, li) => {
      for (let i = 0; i < 30; i++) {
        const idx = (i + ci * 7 + li * 3) % names.length;
        const nombre = names[idx];
        const ap1 = surn1[(i + ci * 5 + li) % surn1.length];
        const ap2 = surn2[(i + ci * 4 + li * 2) % surn2.length];
        const classCode = `${curso} ${linea}`;
        const num = String(i + 1).padStart(2, '0');
        const email = `${slug_(nombre)}.${slug_(ap1)}.${slug_(ap2)}.${curso.toLowerCase()}.${linea.toLowerCase()}.${num}${LA_CONFIG.STUDENT_DOMAIN}`;
        rows.push({
          studentId: `${curso}_${linea}_${num}`,
          nombre: nombre,
          apellidos: `${ap1} ${ap2}`,
          email: email,
          curso: curso,
          linea: linea,
          clase: classCode,
          avatar: `avatar_${String(((i + ci + li) % 12) + 1).padStart(2, '0')}`,
          activo: true,
          xpGeneral: 0,
          nivelGeneral: 1,
          plumas: 0,
          fechaAlta: nowIso_(),
          ultimaSesion: ''
        });
      }
    });
  });
  appendObjects_(sheet, rows);
}

function seedDemoProgress_() {
  const progressSheet = getSheet_(LA_CONFIG.SHEETS.PROGRESO);
  if (progressSheet.getLastRow() > 1) return;
  const students = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS));
  const games = getActiveGames_().filter(g => g.gameId !== 'battlegrafia');
  const rows = [];
  const events = [];
  const achievements = [];
  const errors = [];
  const now = new Date();

  students.forEach((s, idx) => {
    games.forEach((g, gi) => {
      if ((idx + gi) % 4 === 0) return;
      const sessions = ((idx + gi) % 7) + 1;
      const xp = sessions * (45 + ((idx + gi) % 6) * 20);
      const attempts = sessions * (6 + ((idx + gi) % 8));
      const accuracy = 58 + ((idx * 7 + gi * 11) % 39);
      const successes = Math.round(attempts * accuracy / 100);
      const err = Math.max(0, attempts - successes);
      const last = new Date(now.getTime() - ((idx + gi) % 8) * 24 * 60 * 60 * 1000 - gi * 45 * 60 * 1000);
      const percentage = Math.min(100, Math.round((xp / 1200) * 100));
      const achCount = Math.floor(xp / 250);
      rows.push({
        studentId: s.studentId,
        email: s.email,
        nombre: `${s.nombre} ${s.apellidos}`,
        clase: s.clase,
        gameId: g.gameId,
        gameName: g.nombre,
        xp: xp,
        nivel: levelFromXp_(xp),
        percentage: percentage,
        accuracy: accuracy,
        attempts: attempts,
        successes: successes,
        errors: err,
        streak: (idx + gi) % 11,
        sessions: sessions,
        achievementsCount: achCount,
        missionsCompleted: Math.floor(sessions / 3),
        plumas: Math.floor(xp / 10),
        lastActivity: last.toISOString(),
        rawJson: safeStringify_({ demo: true }),
        updatedAt: nowIso_()
      });
      events.push({
        eventId: uuid_(),
        timestamp: last.toISOString(),
        studentId: s.studentId,
        email: s.email,
        nombre: `${s.nombre} ${s.apellidos}`,
        clase: s.clase,
        gameId: g.gameId,
        eventType: 'demo_session',
        xpDelta: Math.round(xp / sessions),
        plumasDelta: Math.floor(Math.round(xp / sessions) / 10),
        accuracy: accuracy,
        detailsJson: safeStringify_({ sessions: sessions, demo: true })
      });
      if (achCount > 0 && (idx + gi) % 3 === 0) {
        achievements.push({ achievementId: uuid_(), studentId: s.studentId, email: s.email, gameId: g.gameId, title: `Logro ${g.nombre}`, description: `Primer avance destacado en ${g.nombre}.`, xpReward: 25, unlockedAt: last.toISOString() });
      }
      if (err > 0 && (idx + gi) % 5 === 0) {
        const skill = ['Acentuación', 'b/v', 'Concordancia', 'Puntuación', 'Verbos'][((idx + gi) % 5)];
        errors.push({ timestamp: last.toISOString(), studentId: s.studentId, email: s.email, gameId: g.gameId, skill: skill, errorType: skill, count: Math.max(1, Math.floor(err / 2)), detailsJson: safeStringify_({ demo: true }) });
      }
    });
  });
  appendObjects_(progressSheet, rows);
  appendObjects_(getSheet_(LA_CONFIG.SHEETS.EVENTOS), events);
  appendObjects_(getSheet_(LA_CONFIG.SHEETS.LOGROS), achievements);
  appendObjects_(getSheet_(LA_CONFIG.SHEETS.ERRORES), errors);

  students.forEach(s => updateStudentGeneral_(s.studentId));
}

// --------------------------------------------------------------------------------------
// Evaluación y resúmenes
// --------------------------------------------------------------------------------------

function calculateStudentGrade_(studentId, gameId) {
  const progressRows = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO))
    .filter(p => String(p.studentId) === String(studentId))
    .filter(p => !gameId || String(p.gameId) === String(gameId))
    .map(normalizeProgressRow_);

  if (!progressRows.length) {
    return { score: 0, label: 'Sin datos suficientes', breakdown: { progress: 0, accuracy: 0, missions: 0, constancy: 0, variety: 0, achievements: 0 } };
  }

  const games = getActiveGames_().filter(g => String(g.estado).toLowerCase() !== 'proximamente');
  const progressScore = average_(progressRows.map(p => clamp_(p.percentage, 0, 100)));
  const accuracyScore = average_(progressRows.map(p => clamp_(p.accuracy, 0, 100)));
  const missionsScore = clamp_(average_(progressRows.map(p => Math.min(100, p.missionsCompleted * 25))), 0, 100);
  const constancyScore = clamp_(average_(progressRows.map(p => Math.min(100, p.sessions * 12))), 0, 100);
  const varietyScore = gameId ? 100 : clamp_((new Set(progressRows.filter(p => p.sessions > 0).map(p => p.gameId)).size / Math.max(1, games.length)) * 100, 0, 100);
  const achievementsScore = clamp_(average_(progressRows.map(p => Math.min(100, p.achievementsCount * 20))), 0, 100);

  const weighted = progressScore * 0.25 + accuracyScore * 0.25 + missionsScore * 0.20 + constancyScore * 0.15 + varietyScore * 0.10 + achievementsScore * 0.05;
  const score = round1_(weighted / 10);
  const result = {
    score: score,
    label: score >= 9 ? 'Excelente' : score >= 7 ? 'Buen progreso' : score >= 5 ? 'En camino' : 'Necesita impulso',
    breakdown: {
      progress: round1_(progressScore),
      accuracy: round1_(accuracyScore),
      missions: round1_(missionsScore),
      constancy: round1_(constancyScore),
      variety: round1_(varietyScore),
      achievements: round1_(achievementsScore)
    }
  };

  const student = findStudent_(studentId);
  if (student) {
    upsertObjectRow_(getSheet_(LA_CONFIG.SHEETS.EVALUACIONES), {
      studentId: student.studentId,
      email: student.email,
      classCode: student.clase,
      scope: gameId ? 'game' : 'general',
      gameId: gameId || 'general',
      score: result.score,
      breakdownJson: safeStringify_(result.breakdown),
      updatedAt: nowIso_()
    }, ['studentId', 'scope', 'gameId']);
  }
  return result;
}

function buildGeneralProgress_(student, progressRows, games) {
  progressRows = (progressRows || []).map(normalizeProgressRow_);
  const xp = progressRows.reduce((acc, p) => acc + Number(p.xp || 0), 0);
  const plumas = progressRows.reduce((acc, p) => acc + Number(p.plumas || 0), 0);
  const sessions = progressRows.reduce((acc, p) => acc + Number(p.sessions || 0), 0);
  const accuracy = progressRows.length ? round1_(average_(progressRows.map(p => Number(p.accuracy || 0)))) : 0;
  const activeGames = games.filter(g => String(g.estado).toLowerCase() !== 'proximamente').length || 1;
  const gamesPlayed = new Set(progressRows.filter(p => p.sessions > 0).map(p => p.gameId)).size;
  const level = levelFromXp_(xp);
  const currentLevelBase = (level - 1) * 750;
  const nextLevelBase = level * 750;
  return {
    xp: xp,
    level: level,
    plumas: plumas,
    sessions: sessions,
    accuracy: accuracy,
    gamesPlayed: gamesPlayed,
    percentage: clamp_(Math.round((gamesPlayed / activeGames) * 100), 0, 100),
    levelProgress: clamp_(Math.round(((xp - currentLevelBase) / Math.max(1, nextLevelBase - currentLevelBase)) * 100), 0, 100),
    xpToNext: Math.max(0, nextLevelBase - xp),
    title: level >= 10 ? 'Maestro de palabras' : level >= 6 ? 'Explorador verbal' : level >= 3 ? 'Aprendiz arcade' : 'Recluta de letras'
  };
}

function buildClassRanking_(classCode, limit) {
  const students = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS)).filter(s => s.clase === classCode);
  const games = getActiveGames_();
  const progressRows = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO)).map(normalizeProgressRow_);
  return students.map(s => {
    const general = buildGeneralProgress_(s, progressRows.filter(p => p.studentId === s.studentId), games);
    return { studentId: s.studentId, nombre: `${s.nombre} ${String(s.apellidos).split(' ')[0]}`, xp: general.xp, level: general.level };
  }).sort((a, b) => b.xp - a.xp).slice(0, limit || 10);
}

function buildStudentMissions_(student, progressByGame) {
  const missions = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.MISIONES)).filter(m => String(m.isActive).toUpperCase() !== 'FALSE');
  return missions.map(m => {
    let progress = 0;
    if (m.gameId === 'lenguarcade' && m.type === 'variety') {
      progress = new Set(Object.values(progressByGame || {}).filter(p => p.sessions > 0).map(p => p.gameId)).size;
    } else {
      const p = (progressByGame || {})[m.gameId] || {};
      if (m.type === 'attempts') progress = Number(p.attempts || 0);
      else if (m.type === 'creative_output') progress = Number(p.sessions || 0);
      else if (m.type === 'phase_completed') progress = Number(p.missionsCompleted || 0);
      else progress = Number(p.sessions || 0);
    }
    const target = Number(m.target || 1);
    return Object.assign({}, m, { progress: Math.min(progress, target), target: target, completed: progress >= target, percentage: clamp_(Math.round((progress / target) * 100), 0, 100) });
  });
}

function summarizeErrors_(errors) {
  const map = {};
  errors.forEach(e => {
    const key = e.errorType || e.skill || 'Sin clasificar';
    map[key] = (map[key] || 0) + Number(e.count || 1);
  });
  const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
  return Object.keys(map).map(k => ({ name: k, count: map[k], percent: Math.round((map[k] / total) * 100) })).sort((a, b) => b.count - a.count).slice(0, 8);
}

function buildRecommendations_(errorSummary, popularGames) {
  const recs = [];
  if (errorSummary[0]) recs.push({ icon: '🎯', title: `Reforzar ${errorSummary[0].name}`, text: 'Proponer una misión breve de práctica específica.' });
  if (errorSummary[1]) recs.push({ icon: '🧩', title: `Detectado también: ${errorSummary[1].name}`, text: 'Crear reto de repaso con feedback inmediato.' });
  const popular = popularGames[0];
  if (popular) recs.push({ icon: '🕹️', title: `${popular.nombre} está funcionando`, text: 'Aprovecharlo como actividad de entrada o cierre.' });
  recs.push({ icon: '🪶', title: 'Variedad semanal', text: 'Invitar a los alumnos a jugar al menos a 3 juegos distintos.' });
  return recs;
}

// --------------------------------------------------------------------------------------
// Utilidades de base de datos
// --------------------------------------------------------------------------------------

function getDb_() {
  const props = PropertiesService.getScriptProperties();
  if (LA_CONFIG.SPREADSHEET_ID) return SpreadsheetApp.openById(LA_CONFIG.SPREADSHEET_ID);
  const storedId = props.getProperty('LENGUARCADE_DB_ID');
  if (storedId) {
    try { return SpreadsheetApp.openById(storedId); } catch (e) { props.deleteProperty('LENGUARCADE_DB_ID'); }
  }
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty('LENGUARCADE_DB_ID', active.getId());
    return active;
  }
  const created = SpreadsheetApp.create(LA_CONFIG.DB_NAME);
  props.setProperty('LENGUARCADE_DB_ID', created.getId());
  return created;
}

function ensureSheets_() {
  const ss = getDb_();
  Object.keys(LA_CONFIG.SHEETS).forEach(key => {
    const name = LA_CONFIG.SHEETS[key];
    const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    ensureHeader_(sheet, LA_HEADERS[name]);
  });
}

function getSheet_(name) {
  const ss = getDb_();
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  ensureHeader_(sheet, LA_HEADERS[name]);
  return sheet;
}

function ensureHeader_(sheet, headers) {
  if (!headers || !headers.length) return;
  const lastCol = Math.max(sheet.getLastColumn(), headers.length);
  const current = sheet.getRange(1, 1, 1, lastCol).getValues()[0].slice(0, headers.length);
  const needs = current.some((v, i) => String(v) !== String(headers[i]));
  if (needs) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#111827').setFontColor('#ffffff');
    sheet.autoResizeColumns(1, headers.length);
  }
}

function rowsToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(row => row.some(v => v !== '')).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function appendObjectRow_(sheet, obj) {
  appendObjects_(sheet, [obj]);
}

function appendObjects_(sheet, objects) {
  if (!objects || !objects.length) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const values = objects.map(obj => headers.map(h => obj[h] !== undefined ? obj[h] : ''));
  sheet.getRange(sheet.getLastRow() + 1, 1, values.length, headers.length).setValues(values);
}

function upsertObjectRow_(sheet, obj, keyFields) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const values = sheet.getDataRange().getValues();
  let rowNum = -1;
  for (let r = 1; r < values.length; r++) {
    const matches = keyFields.every(k => String(values[r][headers.indexOf(k)]) === String(obj[k]));
    if (matches) { rowNum = r + 1; break; }
  }
  const row = headers.map(h => obj[h] !== undefined ? obj[h] : '');
  if (rowNum > 0) sheet.getRange(rowNum, 1, 1, headers.length).setValues([row]);
  else sheet.appendRow(row);
}

function getCounts_() {
  ensureSheets_();
  const out = {};
  Object.keys(LA_CONFIG.SHEETS).forEach(key => {
    const name = LA_CONFIG.SHEETS[key];
    out[name] = Math.max(0, getSheet_(name).getLastRow() - 1);
  });
  return out;
}

// --------------------------------------------------------------------------------------
// Búsquedas y normalización
// --------------------------------------------------------------------------------------

function getActiveGames_() {
  return rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.JUEGOS))
    .filter(g => String(g.activo).toUpperCase() !== 'FALSE')
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}

function findGame_(gameId) {
  return rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.JUEGOS)).find(g => String(g.gameId) === String(gameId));
}

function findStudent_(identifier) {
  if (!identifier) return null;
  const id = String(identifier).trim().toLowerCase();
  const students = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS));
  return students.find(s => String(s.studentId).toLowerCase() === id || String(s.email).toLowerCase() === id) || null;
}

function touchStudent_(studentId) {
  const sheet = getSheet_(LA_CONFIG.SHEETS.ALUMNOS);
  const rows = rowsToObjects_(sheet);
  const student = rows.find(r => r.studentId === studentId);
  if (!student) return;
  student.ultimaSesion = nowIso_();
  upsertObjectRow_(sheet, student, ['studentId']);
}

function updateStudentGeneral_(studentId) {
  const sheet = getSheet_(LA_CONFIG.SHEETS.ALUMNOS);
  const student = findStudent_(studentId);
  if (!student) return;
  const games = getActiveGames_();
  const progressRows = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO)).filter(p => p.studentId === studentId);
  const general = buildGeneralProgress_(student, progressRows, games);
  student.xpGeneral = general.xp;
  student.nivelGeneral = general.level;
  student.plumas = general.plumas;
  student.ultimaSesion = nowIso_();
  upsertObjectRow_(sheet, student, ['studentId']);
}

function normalizeProgressRow_(r) {
  return {
    studentId: String(r.studentId || ''),
    email: String(r.email || ''),
    nombre: String(r.nombre || ''),
    clase: String(r.clase || ''),
    gameId: String(r.gameId || ''),
    gameName: String(r.gameName || ''),
    xp: Number(r.xp || 0),
    nivel: Number(r.nivel || 1),
    percentage: Number(r.percentage || 0),
    accuracy: Number(r.accuracy || 0),
    attempts: Number(r.attempts || 0),
    successes: Number(r.successes || 0),
    errors: Number(r.errors || 0),
    streak: Number(r.streak || 0),
    sessions: Number(r.sessions || 0),
    achievementsCount: Number(r.achievementsCount || 0),
    missionsCompleted: Number(r.missionsCompleted || 0),
    plumas: Number(r.plumas || 0),
    lastActivity: String(r.lastActivity || ''),
    rawJson: String(r.rawJson || ''),
    updatedAt: String(r.updatedAt || '')
  };
}

function emptyProgressForGame_(student, game) {
  return {
    studentId: student.studentId,
    email: student.email,
    nombre: `${student.nombre} ${student.apellidos}`,
    clase: student.clase,
    gameId: game.gameId,
    gameName: game.nombre,
    xp: 0,
    nivel: 1,
    percentage: 0,
    accuracy: 0,
    attempts: 0,
    successes: 0,
    errors: 0,
    streak: 0,
    sessions: 0,
    achievementsCount: 0,
    missionsCompleted: 0,
    plumas: 0,
    lastActivity: '',
    rawJson: '',
    updatedAt: ''
  };
}

function unlockAchievement_(student, gameId, achievement) {
  const title = typeof achievement === 'string' ? achievement : (achievement.title || achievement.id || 'Logro desbloqueado');
  const description = typeof achievement === 'string' ? '' : (achievement.description || '');
  appendObjectRow_(getSheet_(LA_CONFIG.SHEETS.LOGROS), {
    achievementId: typeof achievement === 'object' && achievement.id ? achievement.id : uuid_(),
    studentId: student.studentId,
    email: student.email,
    gameId: gameId,
    title: title,
    description: description,
    xpReward: typeof achievement === 'object' ? Number(achievement.xpReward || 0) : 0,
    unlockedAt: nowIso_()
  });
}

function saveErrors_(student, gameId, errorsBySkill) {
  Object.keys(errorsBySkill || {}).forEach(skill => {
    appendObjectRow_(getSheet_(LA_CONFIG.SHEETS.ERRORES), {
      timestamp: nowIso_(),
      studentId: student.studentId,
      email: student.email,
      gameId: gameId,
      skill: skill,
      errorType: skill,
      count: Number(errorsBySkill[skill] || 1),
      detailsJson: safeStringify_({ source: 'saveProgress' })
    });
  });
}

// --------------------------------------------------------------------------------------
// Helpers generales
// --------------------------------------------------------------------------------------

function levelFromXp_(xp) {
  return Math.max(1, Math.floor(Number(xp || 0) / 750) + 1);
}

function clamp_(n, min, max) {
  n = Number(n || 0);
  return Math.max(min, Math.min(max, n));
}

function average_(arr) {
  arr = (arr || []).map(Number).filter(n => !isNaN(n));
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function round1_(n) {
  return Math.round(Number(n || 0) * 10) / 10;
}

function nowIso_() {
  return new Date().toISOString();
}

function uuid_() {
  return Utilities.getUuid();
}

function safeStringify_(obj) {
  try { return JSON.stringify(obj || {}); } catch (e) { return JSON.stringify({ error: 'No se pudo serializar' }); }
}

function slug_(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');
}

function getActiveUserEmail_() {
  try { return Session.getActiveUser().getEmail() || ''; } catch (e) { return ''; }
}

function logBackendError_(where, err, details) {
  try {
    appendObjectRow_(getSheet_(LA_CONFIG.SHEETS.BACKEND_ERRORS), {
      timestamp: nowIso_(),
      where: where,
      message: err && err.message ? err.message : String(err),
      stack: err && err.stack ? err.stack : '',
      detailsJson: safeStringify_(details || {})
    });
  } catch (e) {
    console.error(e);
  }
}
