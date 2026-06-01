/******************************************************
 * LenguArcade v3.0 — Hub Orquestador
 * ----------------------------------------------------
 * Arquitectura:
 * - LenguArcade es el HUB central: login, perfil, XP, plumas,
 *   progreso global, panel del profesor y launcher de juegos.
 * - Cada juego puede seguir siendo su propio Apps Script /exec.
 * - La comunicación juego ↔ Hub se hace por iframe + postMessage.
 * - El Hub guarda todo en este Google Sheets central.
 ******************************************************/

const LENGUARCADE = {
  APP_NAME: 'LenguArcade',
  VERSION: '3.0.0-hub-orquestador',

  // Cambia esta clave antes de usarlo con alumnos.
  TEACHER_KEY: 'CAMBIA_ESTA_CLAVE_PROFE',

  SESSION_SECONDS: 21600, // 6 horas

  SHEETS: {
    STUDENTS: 'Students',
    GAMES: 'Games',
    PROGRESS: 'GameProgress',
    EVENTS: 'Events',
    ACHIEVEMENTS: 'Achievements',
    CONFIG: 'TeacherConfig',
    TEXTS: 'LongTexts'
  },

  HEADERS: {
    Students: ['email','name','classGroup','passwordSalt','passwordHash','role','createdAt','lastLogin','level','xp','plumes','totalAchievements','active','avatar'],
    Games: ['gameId','title','subtitle','category','status','launchMode','url','enabled','order','accent','icon','description','coverStyle'],
    GameProgress: ['email','gameId','status','level','progressPercent','bestScore','playCount','timePlayedSeconds','statsJson','saveJson','updatedAt'],
    Events: ['timestamp','email','gameId','eventType','xpDelta','plumesDelta','errorType','payloadJson'],
    Achievements: ['email','achievementId','gameId','title','description','xpReward','unlockedAt'],
    TeacherConfig: ['key','value'],
    LongTexts: ['id','email','gameId','type','title','phase','textJson','updatedAt']
  },

  DEFAULT_GAMES: [
    { gameId:'battlegrafia', title:'Battlegrafía', subtitle:'La aventura de las palabras', category:'RPG de Lengua', status:'Buque insignia', launchMode:'external', url:'', enabled:true, order:1, accent:'#22c55e', icon:'⚔️', description:'Aventura RPG con mundos, monstruos, héroes, cartas y progreso completo.', coverStyle:'fantasy' },
    { gameId:'maniacgrafia', title:'Maniacgrafía', subtitle:'Atrapa las palabras', category:'Ortografía', status:'Activo', launchMode:'external', url:'', enabled:true, order:2, accent:'#f59e0b', icon:'⚡', description:'Ortografía a toda velocidad con efectos, monedas, aventura y logros.', coverStyle:'storm' },
    { gameId:'palabras_en_juego', title:'Palabras en juego', subtitle:'Construye, suma, aprende', category:'Léxico', status:'Activo', launchMode:'external', url:'', enabled:true, order:3, accent:'#10b981', icon:'🔤', description:'Tablero de letras, estrategia, puntuación y vocabulario.', coverStyle:'tiles' },
    { gameId:'narratoria', title:'Narratoria', subtitle:'Escribe. Crea. Cuenta.', category:'Escritura creativa', status:'Activo', launchMode:'external', url:'', enabled:true, order:4, accent:'#38bdf8', icon:'📖', description:'Historias por fases, cartas narrativas, objetivos y evaluación.', coverStyle:'book' },
    { gameId:'versopolis', title:'Versópolis', subtitle:'La ciudad de la poesía', category:'Poesía', status:'Beta / en mejora', launchMode:'external', url:'', enabled:true, order:5, accent:'#a855f7', icon:'🪶', description:'Métrica, rima, figuras literarias y creación poética.', coverStyle:'poetry' },
    { gameId:'verbopolis', title:'Verbópolis', subtitle:'Conjuga y avanza', category:'Verbos', status:'Próximamente', launchMode:'external', url:'', enabled:true, order:6, accent:'#14b8a6', icon:'⏳', description:'Persona, número, tiempo, modo, conjugación y análisis verbal.', coverStyle:'time' },
    { gameId:'sintax_invaders', title:'Sintax Invaders', subtitle:'Defiende la oración', category:'Sintaxis', status:'Próximamente', launchMode:'external', url:'', enabled:true, order:7, accent:'#ec4899', icon:'👾', description:'Sujeto, predicado, complementos y análisis sintáctico arcade.', coverStyle:'space' },
    { gameId:'literatron', title:'Literatrón', subtitle:'Robot de literatura', category:'Literatura', status:'Próximamente', launchMode:'external', url:'', enabled:true, order:8, accent:'#f97316', icon:'🤖', description:'Autores, obras, épocas, textos y movimientos literarios.', coverStyle:'robot' }
  ]
};

function doGet(e) {
  setupIfNeeded_();
  const params = e && e.parameter ? e.parameter : {};
  const view = String(params.view || 'alumno').toLowerCase();
  const file = view === 'profesor' || view === 'teacher' || view === 'profe' ? 'Profesor' : 'Alumno';
  const template = HtmlService.createTemplateFromFile(file);
  template.appName = LENGUARCADE.APP_NAME;
  template.version = LENGUARCADE.VERSION;
  template.appUrl = safeServiceUrl_();
  return template.evaluate()
    .setTitle(file === 'Profesor' ? 'LenguArcade · Panel del profesor' : 'LenguArcade')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function setupLenguArcade() {
  ensureSheets_();
  seedDefaultGames_();
  seedTeacherConfig_();
  return { ok:true, message:'LenguArcade v3 inicializado correctamente.' };
}

function setupIfNeeded_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(LENGUARCADE.SHEETS.STUDENTS)) setupLenguArcade();
}

// =====================================================
// API ALUMNO
// =====================================================

function loginOrRegister(payload) {
  setupIfNeeded_();
  payload = payload || {};
  const email = normalizeEmail_(payload.email);
  const password = String(payload.password || '');
  const password2 = String(payload.password2 || '');
  const mode = String(payload.mode || 'login');
  const name = cleanText_(payload.name || '');
  const classGroup = cleanText_(payload.classGroup || '');

  if (!email || email.indexOf('@') === -1) throw new Error('Escribe un correo válido del colegio.');
  if (!password || password.length < 4) throw new Error('La clave debe tener al menos 4 caracteres.');

  const sheet = getSheet_(LENGUARCADE.SHEETS.STUDENTS);
  const students = getObjects_(sheet);
  const existing = students.find(r => normalizeEmail_(r.email) === email);

  if (!existing) {
    if (mode !== 'register') return { ok:false, needRegister:true, message:'Este correo todavía no existe. Crea tu clave la primera vez.' };
    if (!name) throw new Error('Escribe tu nombre.');
    if (!classGroup) throw new Error('Escribe tu clase.');
    if (password !== password2) throw new Error('Las claves no coinciden. Repítelas antes de crear la cuenta.');
    const salt = randomId_(18);
    const hash = hashPassword_(password, salt);
    const now = nowIso_();
    appendObject_(sheet, {
      email, name, classGroup, passwordSalt:salt, passwordHash:hash, role:'student',
      createdAt:now, lastLogin:now, level:1, xp:0, plumes:0, totalAchievements:0, active:true, avatar:pickAvatar_(email)
    });
    const token = createSession_(email, 'student');
    return { ok:true, sessionToken:token, student:getStudentPublic_(email), home:getStudentHome(token), firstLogin:true };
  }

  const expected = hashPassword_(password, existing.passwordSalt || '');
  if (expected !== String(existing.passwordHash || '')) throw new Error('Correo o clave incorrectos.');
  updateStudentFields_(email, { lastLogin: nowIso_(), active:true });
  const token = createSession_(email, 'student');
  return { ok:true, sessionToken:token, student:getStudentPublic_(email), home:getStudentHome(token), firstLogin:false };
}

function getStudentHome(sessionToken) {
  setupIfNeeded_();
  const session = requireSession_(sessionToken, 'student');
  const email = session.email;
  const student = getStudentPublic_(email);
  const games = getEnabledGames_();
  const progresses = getProgressByEmail_(email);
  const achievements = getAchievementsByEmail_(email).slice(-8).reverse();
  const events = getEventsByEmail_(email).slice(-12).reverse();
  const ranking = getClassRanking_(student.classGroup, 8);
  const missions = buildMissions_(email, games, progresses);
  return { ok:true, appName:LENGUARCADE.APP_NAME, version:LENGUARCADE.VERSION, appUrl:safeServiceUrl_(), student, games, progresses, achievements, events, ranking, missions, serverTime:nowIso_() };
}

function getGameLaunchData(payload) {
  setupIfNeeded_();
  payload = payload || {};
  const session = requireSession_(payload.sessionToken, 'student');
  const email = session.email;
  const gameId = cleanGameId_(payload.gameId);
  if (!gameId) throw new Error('Falta gameId.');
  const game = getGameById_(gameId);
  if (!game) throw new Error('Juego no encontrado: ' + gameId);
  const progress = getProgress_(email, gameId) || emptyProgress_(email, gameId);
  const student = getStudentPublic_(email);
  appendEvent_({ email, gameId, eventType:'GAME_LAUNCHED', xpDelta:0, plumesDelta:0, errorType:'', payloadJson: JSON.stringify({ title: game.title }) });
  return { ok:true, student, game, progress, arcade:{ appName:LENGUARCADE.APP_NAME, appUrl:safeServiceUrl_(), version:LENGUARCADE.VERSION } };
}

function loadGameProgress(payload) {
  setupIfNeeded_();
  payload = payload || {};
  const session = requireSession_(payload.sessionToken, 'student');
  const gameId = cleanGameId_(payload.gameId);
  const progress = getProgress_(session.email, gameId) || emptyProgress_(session.email, gameId);
  return { ok:true, progress };
}

function saveGameProgressFast(payload) {
  setupIfNeeded_();
  payload = payload || {};
  const session = requireSession_(payload.sessionToken, 'student');
  const email = session.email;
  const gameId = cleanGameId_(payload.gameId || (payload.progress && payload.progress.gameId));
  if (!gameId) throw new Error('Falta gameId para guardar.');

  const eventType = cleanText_(payload.eventType || 'SAVE_PROGRESS');
  const xpDelta = clampNumber_(payload.xpDelta, 0, 1000);
  const plumesDelta = clampNumber_(payload.plumesDelta, 0, 500);
  const errorType = cleanText_(payload.errorType || '');
  const progress = payload.progress || {};

  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);
  try {
    const updatedStudent = addStudentRewards_(email, xpDelta, plumesDelta);
    const updatedProgress = upsertProgress_(email, gameId, progress);
    appendEvent_({
      email, gameId, eventType, xpDelta, plumesDelta, errorType,
      payloadJson: JSON.stringify({ progressSummary: compactProgress_(progress), raw: payload.payload || null })
    });
    if (payload.achievement) unlockAchievementInternal_(email, gameId, payload.achievement);
    return { ok:true, student:updatedStudent, progress:updatedProgress, savedAt:nowIso_() };
  } finally {
    lock.releaseLock();
  }
}

function saveLongText(payload) {
  setupIfNeeded_();
  payload = payload || {};
  const session = requireSession_(payload.sessionToken, 'student');
  const gameId = cleanGameId_(payload.gameId);
  if (!gameId) throw new Error('Falta gameId.');
  const id = cleanText_(payload.id || payload.storyId || payload.poemId || randomId_(12));
  const row = {
    id, email:session.email, gameId,
    type:cleanText_(payload.type || 'text'),
    title:cleanText_(payload.title || 'Sin título'),
    phase:cleanText_(payload.phase || ''),
    textJson:JSON.stringify(payload.text || payload.textJson || payload),
    updatedAt:nowIso_()
  };
  const sheet = getSheet_(LENGUARCADE.SHEETS.TEXTS);
  const objects = getObjects_(sheet);
  const existing = objects.find(r => String(r.id) === id && normalizeEmail_(r.email) === session.email && String(r.gameId) === gameId);
  if (existing) updateRow_(sheet, existing._row, row); else appendObject_(sheet, row);
  appendEvent_({ email:session.email, gameId, eventType:'LONG_TEXT_SAVED', xpDelta:0, plumesDelta:0, errorType:'', payloadJson:JSON.stringify({ id, type:row.type, title:row.title }) });
  return { ok:true, id, savedAt:row.updatedAt };
}

// =====================================================
// API PROFESOR
// =====================================================

function teacherLogin(payload) {
  setupIfNeeded_();
  payload = payload || {};
  const key = String(payload.key || '');
  if (key !== LENGUARCADE.TEACHER_KEY) throw new Error('Clave de profesor incorrecta.');
  const token = createSession_('teacher@lenguarcade.local', 'teacher');
  return { ok:true, teacherToken:token, dashboard:getTeacherDashboard({ teacherToken:token }) };
}

function getTeacherDashboard(payload) {
  setupIfNeeded_();
  payload = payload || {};
  requireSession_(payload.teacherToken, 'teacher');
  const filters = payload.filters || {};
  const students = getObjects_(getSheet_(LENGUARCADE.SHEETS.STUDENTS)).filter(r => String(r.role || 'student') === 'student');
  const games = getObjects_(getSheet_(LENGUARCADE.SHEETS.GAMES)).sort((a,b)=>Number(a.order||0)-Number(b.order||0));
  let progress = getObjects_(getSheet_(LENGUARCADE.SHEETS.PROGRESS));
  let events = getObjects_(getSheet_(LENGUARCADE.SHEETS.EVENTS));
  const achievements = getObjects_(getSheet_(LENGUARCADE.SHEETS.ACHIEVEMENTS));

  if (filters.classGroup) {
    const emails = new Set(students.filter(s => String(s.classGroup) === String(filters.classGroup)).map(s => normalizeEmail_(s.email)));
    progress = progress.filter(p => emails.has(normalizeEmail_(p.email)));
    events = events.filter(e => emails.has(normalizeEmail_(e.email)));
  }
  if (filters.gameId) {
    progress = progress.filter(p => String(p.gameId) === String(filters.gameId));
    events = events.filter(e => String(e.gameId) === String(filters.gameId));
  }
  if (filters.email) {
    const em = normalizeEmail_(filters.email);
    progress = progress.filter(p => normalizeEmail_(p.email) === em);
    events = events.filter(e => normalizeEmail_(e.email) === em);
  }

  const today = nowIso_().slice(0,10);
  const todayEvents = events.filter(e => String(e.timestamp || '').slice(0,10) === today);
  const gamePopularity = summarizeGamePopularity_(events, games);
  const errorSummary = summarizeErrors_(events);
  const table = progress.map(p => {
    const st = students.find(s => normalizeEmail_(s.email) === normalizeEmail_(p.email)) || {};
    const gm = games.find(g => String(g.gameId) === String(p.gameId)) || {};
    return {
      email: p.email,
      name: st.name || p.email,
      classGroup: st.classGroup || '',
      gameId: p.gameId,
      gameTitle: gm.title || p.gameId,
      status: p.status || 'started',
      level: Number(p.level || 1),
      progressPercent: Number(p.progressPercent || 0),
      bestScore: Number(p.bestScore || 0),
      playCount: Number(p.playCount || 0),
      updatedAt: p.updatedAt || ''
    };
  }).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0,250);

  const focusEmail = normalizeEmail_(filters.email || (students[0] && students[0].email) || '');
  const focusStudent = focusEmail ? buildStudentFocus_(focusEmail, students, games, progress, events) : null;
  const classGroups = Array.from(new Set(students.map(s => String(s.classGroup || '')).filter(Boolean))).sort();

  return {
    ok:true,
    summary:{
      activeStudents: students.filter(s => String(s.active) !== 'false').length,
      eventsToday: todayEvents.length,
      gamesAvailable: games.filter(g => String(g.enabled) !== 'false').length,
      achievementsUnlocked: achievements.length
    },
    classGroups, games, students:students.map(s => getStudentPublicFromRow_(s)), table,
    gamePopularity, errorSummary, focusStudent,
    recommendations: buildRecommendations_(errorSummary),
    serverTime: nowIso_()
  };
}

function updateGameConfig(payload) {
  setupIfNeeded_();
  payload = payload || {};
  requireSession_(payload.teacherToken, 'teacher');
  const gameId = cleanGameId_(payload.gameId);
  if (!gameId) throw new Error('Falta gameId.');
  const sheet = getSheet_(LENGUARCADE.SHEETS.GAMES);
  const games = getObjects_(sheet);
  const existing = games.find(g => String(g.gameId) === gameId);
  const patch = {
    gameId,
    title: cleanText_(payload.title || (existing && existing.title) || gameId),
    subtitle: cleanText_(payload.subtitle || (existing && existing.subtitle) || ''),
    category: cleanText_(payload.category || (existing && existing.category) || ''),
    status: cleanText_(payload.status || (existing && existing.status) || 'Activo'),
    launchMode: cleanText_(payload.launchMode || 'external'),
    url: String(payload.url || '').trim(),
    enabled: payload.enabled === false ? false : String(payload.enabled || 'true') !== 'false',
    order: Number(payload.order || (existing && existing.order) || 99),
    accent: cleanText_(payload.accent || (existing && existing.accent) || '#6366f1'),
    icon: cleanText_(payload.icon || (existing && existing.icon) || '🎮'),
    description: cleanText_(payload.description || (existing && existing.description) || ''),
    coverStyle: cleanText_(payload.coverStyle || (existing && existing.coverStyle) || 'default')
  };
  if (existing) updateRow_(sheet, existing._row, patch); else appendObject_(sheet, patch);
  return { ok:true, game:patch };
}

function resetStudentPassword(payload) {
  setupIfNeeded_();
  payload = payload || {};
  requireSession_(payload.teacherToken, 'teacher');
  const email = normalizeEmail_(payload.email);
  const newPassword = String(payload.newPassword || '');
  if (!email || !newPassword || newPassword.length < 4) throw new Error('Falta correo o clave nueva válida.');
  const salt = randomId_(18);
  const hash = hashPassword_(newPassword, salt);
  updateStudentFields_(email, { passwordSalt:salt, passwordHash:hash });
  return { ok:true };
}

// =====================================================
// HELPERS DATOS
// =====================================================

function ensureSheets_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(LENGUARCADE.HEADERS).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    const headers = LENGUARCADE.HEADERS[name];
    const first = sheet.getRange(1,1,1,headers.length).getValues()[0];
    const needsHeaders = first.join('') === '' || first[0] !== headers[0];
    if (needsHeaders) {
      sheet.clear();
      sheet.getRange(1,1,1,headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  });
}

function seedDefaultGames_() {
  const sheet = getSheet_(LENGUARCADE.SHEETS.GAMES);
  const existing = getObjects_(sheet);
  LENGUARCADE.DEFAULT_GAMES.forEach(game => {
    const found = existing.find(g => String(g.gameId) === game.gameId);
    if (!found) appendObject_(sheet, game);
  });
}

function seedTeacherConfig_() {
  const sheet = getSheet_(LENGUARCADE.SHEETS.CONFIG);
  const existing = getObjects_(sheet);
  if (!existing.find(r => String(r.key) === 'seasonName')) appendObject_(sheet, { key:'seasonName', value:'Temporada 1 · La invasión de las palabras' });
}

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('No existe la hoja: ' + name + '. Ejecuta setupLenguArcade.');
  return sheet;
}

function getObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  const out = [];
  for (let i=1; i<values.length; i++) {
    const row = values[i];
    if (row.join('') === '') continue;
    const obj = { _row: i+1 };
    headers.forEach((h, idx) => obj[h] = row[idx]);
    out.push(obj);
  }
  return out;
}

function appendObject_(sheet, obj) {
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
  const row = headers.map(h => obj[h] !== undefined ? obj[h] : '');
  sheet.appendRow(row);
}

function updateRow_(sheet, rowNumber, obj) {
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(String);
  const current = sheet.getRange(rowNumber,1,1,headers.length).getValues()[0];
  const row = headers.map((h, i) => obj[h] !== undefined ? obj[h] : current[i]);
  sheet.getRange(rowNumber,1,1,headers.length).setValues([row]);
}

function getEnabledGames_() {
  return getObjects_(getSheet_(LENGUARCADE.SHEETS.GAMES))
    .filter(g => String(g.enabled) !== 'false')
    .sort((a,b)=>Number(a.order||0)-Number(b.order||0));
}

function getGameById_(gameId) {
  return getObjects_(getSheet_(LENGUARCADE.SHEETS.GAMES)).find(g => String(g.gameId) === String(gameId));
}

function getProgressByEmail_(email) {
  return getObjects_(getSheet_(LENGUARCADE.SHEETS.PROGRESS)).filter(p => normalizeEmail_(p.email) === normalizeEmail_(email)).map(parseProgressRow_);
}

function getProgress_(email, gameId) {
  const row = getObjects_(getSheet_(LENGUARCADE.SHEETS.PROGRESS)).find(p => normalizeEmail_(p.email) === normalizeEmail_(email) && String(p.gameId) === String(gameId));
  return row ? parseProgressRow_(row) : null;
}

function parseProgressRow_(p) {
  return {
    email: p.email,
    gameId: p.gameId,
    status: p.status || 'not_started',
    level: Number(p.level || 1),
    progressPercent: Number(p.progressPercent || 0),
    bestScore: Number(p.bestScore || 0),
    playCount: Number(p.playCount || 0),
    timePlayedSeconds: Number(p.timePlayedSeconds || 0),
    stats: safeJson_(p.statsJson, {}),
    save: safeJson_(p.saveJson, {}),
    updatedAt: p.updatedAt || ''
  };
}

function emptyProgress_(email, gameId) {
  return { email, gameId, status:'not_started', level:1, progressPercent:0, bestScore:0, playCount:0, timePlayedSeconds:0, stats:{}, save:{}, updatedAt:'' };
}

function upsertProgress_(email, gameId, progress) {
  const sheet = getSheet_(LENGUARCADE.SHEETS.PROGRESS);
  const rows = getObjects_(sheet);
  const existing = rows.find(p => normalizeEmail_(p.email) === normalizeEmail_(email) && String(p.gameId) === String(gameId));
  const old = existing ? parseProgressRow_(existing) : emptyProgress_(email, gameId);
  const stats = Object.assign({}, old.stats || {}, progress.stats || {});
  const save = progress.save !== undefined ? progress.save : (old.save || {});
  const patch = {
    email, gameId,
    status: cleanText_(progress.status || old.status || 'in_progress'),
    level: Number(progress.level !== undefined ? progress.level : old.level || 1),
    progressPercent: clampNumber_(progress.progressPercent !== undefined ? progress.progressPercent : old.progressPercent || 0, 0, 100),
    bestScore: Math.max(Number(old.bestScore || 0), Number(progress.bestScore || 0)),
    playCount: Number(old.playCount || 0) + Number(progress.playIncrement || 0),
    timePlayedSeconds: Number(old.timePlayedSeconds || 0) + Number(progress.timePlayedSeconds || 0),
    statsJson: JSON.stringify(stats),
    saveJson: JSON.stringify(save),
    updatedAt: nowIso_()
  };
  if (existing) updateRow_(sheet, existing._row, patch); else appendObject_(sheet, patch);
  return parseProgressRow_(patch);
}

function getStudentPublic_(email) {
  const row = getObjects_(getSheet_(LENGUARCADE.SHEETS.STUDENTS)).find(s => normalizeEmail_(s.email) === normalizeEmail_(email));
  if (!row) throw new Error('Alumno no encontrado.');
  return getStudentPublicFromRow_(row);
}

function getStudentPublicFromRow_(row) {
  return {
    email: normalizeEmail_(row.email),
    name: row.name || row.email,
    classGroup: row.classGroup || '',
    level: Number(row.level || 1),
    xp: Number(row.xp || 0),
    plumes: Number(row.plumes || 0),
    totalAchievements: Number(row.totalAchievements || 0),
    avatar: row.avatar || '🧑‍🎓',
    lastLogin: row.lastLogin || ''
  };
}

function updateStudentFields_(email, fields) {
  const sheet = getSheet_(LENGUARCADE.SHEETS.STUDENTS);
  const rows = getObjects_(sheet);
  const row = rows.find(s => normalizeEmail_(s.email) === normalizeEmail_(email));
  if (!row) throw new Error('Alumno no encontrado: ' + email);
  updateRow_(sheet, row._row, fields);
}

function addStudentRewards_(email, xpDelta, plumesDelta) {
  const sheet = getSheet_(LENGUARCADE.SHEETS.STUDENTS);
  const rows = getObjects_(sheet);
  const row = rows.find(s => normalizeEmail_(s.email) === normalizeEmail_(email));
  if (!row) throw new Error('Alumno no encontrado: ' + email);
  const xp = Number(row.xp || 0) + Number(xpDelta || 0);
  const plumes = Number(row.plumes || 0) + Number(plumesDelta || 0);
  const level = levelFromXp_(xp);
  updateRow_(sheet, row._row, { xp, plumes, level, lastLogin: nowIso_() });
  return Object.assign(getStudentPublicFromRow_(row), { xp, plumes, level });
}

function appendEvent_(evt) {
  const sheet = getSheet_(LENGUARCADE.SHEETS.EVENTS);
  appendObject_(sheet, {
    timestamp: nowIso_(),
    email: normalizeEmail_(evt.email),
    gameId: evt.gameId || '',
    eventType: evt.eventType || 'EVENT',
    xpDelta: Number(evt.xpDelta || 0),
    plumesDelta: Number(evt.plumesDelta || 0),
    errorType: evt.errorType || '',
    payloadJson: evt.payloadJson || '{}'
  });
}

function getEventsByEmail_(email) {
  return getObjects_(getSheet_(LENGUARCADE.SHEETS.EVENTS)).filter(e => normalizeEmail_(e.email) === normalizeEmail_(email));
}

function getAchievementsByEmail_(email) {
  return getObjects_(getSheet_(LENGUARCADE.SHEETS.ACHIEVEMENTS)).filter(a => normalizeEmail_(a.email) === normalizeEmail_(email));
}

function unlockAchievementInternal_(email, gameId, ach) {
  ach = ach || {};
  const id = cleanText_(ach.id || ach.achievementId || randomId_(8));
  const sheet = getSheet_(LENGUARCADE.SHEETS.ACHIEVEMENTS);
  const rows = getObjects_(sheet);
  const exists = rows.find(a => normalizeEmail_(a.email) === normalizeEmail_(email) && String(a.achievementId) === id);
  if (exists) return;
  appendObject_(sheet, {
    email, achievementId:id, gameId,
    title: cleanText_(ach.title || 'Logro desbloqueado'),
    description: cleanText_(ach.description || ''),
    xpReward: Number(ach.xpReward || 0),
    unlockedAt: nowIso_()
  });
  const student = getStudentPublic_(email);
  updateStudentFields_(email, { totalAchievements: Number(student.totalAchievements || 0) + 1 });
}

// =====================================================
// RESÚMENES Y RECOMENDACIONES
// =====================================================

function getClassRanking_(classGroup, limit) {
  const rows = getObjects_(getSheet_(LENGUARCADE.SHEETS.STUDENTS))
    .filter(s => !classGroup || String(s.classGroup) === String(classGroup))
    .sort((a,b)=>Number(b.xp||0)-Number(a.xp||0))
    .slice(0, limit || 10);
  return rows.map(getStudentPublicFromRow_);
}

function buildMissions_(email, games, progresses) {
  const map = {};
  progresses.forEach(p => map[p.gameId] = p);
  const m1 = map.battlegrafia || {};
  const m2 = map.maniacgrafia || {};
  const m3 = map.versopolis || {};
  return [
    { id:'daily_battle', title:'Completa 1 avance en Battlegrafía', gameId:'battlegrafia', goal:1, current:m1.playCount ? 1 : 0, xp:50, tag:'RPG' },
    { id:'daily_words', title:'Guarda una partida en Maniacgrafía', gameId:'maniacgrafia', goal:1, current:m2.playCount ? 1 : 0, xp:30, tag:'Ortografía' },
    { id:'daily_poem', title:'Crea o mejora un poema en Versópolis', gameId:'versopolis', goal:1, current:m3.playCount ? 1 : 0, xp:30, tag:'Beta' }
  ];
}

function summarizeGamePopularity_(events, games) {
  const counts = {};
  events.forEach(e => { if (e.gameId) counts[e.gameId] = (counts[e.gameId] || 0) + 1; });
  const total = Object.values(counts).reduce((a,b)=>a+b,0) || 1;
  return Object.keys(counts).map(id => {
    const g = games.find(x => String(x.gameId) === id) || {};
    return { gameId:id, title:g.title || id, icon:g.icon || '🎮', accent:g.accent || '#6366f1', count:counts[id], percent:Math.round(counts[id]*100/total) };
  }).sort((a,b)=>b.count-a.count).slice(0,8);
}

function summarizeErrors_(events) {
  const counts = {};
  events.forEach(e => {
    const key = cleanText_(e.errorType || '');
    if (key) counts[key] = (counts[key] || 0) + 1;
  });
  return Object.keys(counts).map(k => ({ errorType:k, count:counts[k] })).sort((a,b)=>b.count-a.count).slice(0,10);
}

function buildStudentFocus_(email, students, games, progress, events) {
  const st = students.find(s => normalizeEmail_(s.email) === email);
  if (!st) return null;
  const rows = progress.filter(p => normalizeEmail_(p.email) === email).map(p => {
    const g = games.find(x => String(x.gameId) === String(p.gameId)) || {};
    return { gameId:p.gameId, title:g.title || p.gameId, icon:g.icon || '🎮', accent:g.accent || '#6366f1', progressPercent:Number(p.progressPercent||0), level:Number(p.level||1), status:p.status||'', updatedAt:p.updatedAt||'' };
  });
  return { student:getStudentPublicFromRow_(st), games:rows, recentEvents:events.filter(e => normalizeEmail_(e.email) === email).slice(-8).reverse() };
}

function buildRecommendations_(errorSummary) {
  if (!errorSummary || !errorSummary.length) return [
    'Usa el panel durante una semana para detectar patrones reales.',
    'Empieza conectando Maniacgrafía y Battlegrafía: darán datos muy útiles.',
    'Activa misiones semanales para dirigir la práctica sin perder el tono arcade.'
  ];
  return errorSummary.slice(0,4).map(e => {
    const t = String(e.errorType).toLowerCase();
    if (t.indexOf('acent') >= 0 || t.indexOf('tilde') >= 0) return 'Reforzar acentuación con mini-retos de hiatos, diptongos y tildes diacríticas.';
    if (t.indexOf('b') >= 0 || t.indexOf('v') >= 0) return 'Practicar b/v en contexto: no solo palabra suelta, también frase breve.';
    if (t.indexOf('sujeto') >= 0 || t.indexOf('predicado') >= 0) return 'Repasar sujeto y predicado con Sintax Invaders o análisis por colores.';
    if (t.indexOf('coma') >= 0 || t.indexOf('puntu') >= 0) return 'Trabajar puntuación en diálogos y enumeraciones desde Narratoria.';
    return 'Revisar el bloque: ' + e.errorType + ' con una actividad breve de recuperación.';
  });
}

function compactProgress_(progress) {
  return {
    status: progress.status || '',
    level: progress.level || '',
    progressPercent: progress.progressPercent || 0,
    bestScore: progress.bestScore || 0,
    stats: progress.stats || {}
  };
}

// =====================================================
// SESIONES, SEGURIDAD Y UTILIDADES
// =====================================================

function createSession_(email, role) {
  const token = randomId_(32);
  CacheService.getScriptCache().put('sess:' + token, JSON.stringify({ email:normalizeEmail_(email), role:role || 'student', createdAt:nowIso_() }), LENGUARCADE.SESSION_SECONDS);
  return token;
}

function requireSession_(token, expectedRole) {
  if (!token) throw new Error('Sesión no encontrada. Vuelve a entrar.');
  const raw = CacheService.getScriptCache().get('sess:' + token);
  if (!raw) throw new Error('La sesión ha caducado. Vuelve a entrar.');
  const session = JSON.parse(raw);
  if (expectedRole && session.role !== expectedRole) throw new Error('No tienes permiso para esta acción.');
  return session;
}

function hashPassword_(password, salt) {
  const text = String(salt || '') + '::' + String(password || '');
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + ((b < 0 ? b + 256 : b).toString(16))).slice(-2)).join('');
}

function randomId_(len) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i=0; i<(len || 12); i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

function normalizeEmail_(email) { return String(email || '').trim().toLowerCase(); }
function cleanText_(s) { return String(s === undefined || s === null ? '' : s).trim(); }
function cleanGameId_(s) { return String(s || '').trim().toLowerCase().replace(/[^a-z0-9_\-]/g, ''); }
function nowIso_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss"); }
function safeJson_(value, fallback) { try { return value ? JSON.parse(String(value)) : fallback; } catch(e) { return fallback; } }
function clampNumber_(value, min, max) { const n = Number(value || 0); return Math.max(min, Math.min(max, isNaN(n) ? min : n)); }
function levelFromXp_(xp) { return Math.max(1, Math.floor(Math.sqrt(Number(xp || 0) / 100)) + 1); }
function pickAvatar_(email) { const avatars = ['🧙','🧑‍🚀','🦸','🧝','🧑‍🎓','🕵️','🤺','🧠','📚','🪶']; const sum = String(email).split('').reduce((a,c)=>a+c.charCodeAt(0),0); return avatars[sum % avatars.length]; }
function safeServiceUrl_() { try { return ScriptApp.getService().getUrl(); } catch(e) { return ''; } }
