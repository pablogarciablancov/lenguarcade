/**
 * LenguArcade v0.3 - parche acumulativo.
 * Este archivo añade funciones nuevas sin romper el backend v0.2.
 */

const LA_AVATAR_OPTIONS = {
  character:[
    'avatar-01','avatar-02','avatar-03','avatar-04',
    'avatar-05','avatar-06','avatar-07','avatar-08',
    'avatar-09','avatar-10','avatar-11','avatar-12',
    'avatar-13','avatar-14','avatar-15','avatar-16'
  ],
  background:[
    'mountains','castle','volcano','forest','snow','coast',
    'desert','moon-city','arcade','library','sky-islands','autumn-village'
  ]
};

const LA_AVATAR_DEFAULT = {
  version:2,
  character:'avatar-01',
  background:'mountains'
};

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
    return {
      ok:true,
      version:'0.4.0',
      classes: rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.CLASES)).filter(c => isTrue_(c.activa)),
      games: getActiveGames_().map(decorateGameIntegration_),
      activeUserEmail:getActiveUserEmail_()
    };
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
  return {
    ok:true,
    avatar:clean,
    message:'Avatar actualizado correctamente.',
    dashboard:getStudentDashboardCore_(studentId)
  };
}

function normalizeStudentAvatar_(avatarConfig) {
  let input = avatarConfig;
  if (typeof input === 'string') {
    const raw = input.trim();
    if (raw.charAt(0) === '{') {
      try { input = JSON.parse(raw); } catch (err) { throw new Error('Configuración de avatar no válida.'); }
    } else if (/^avatar_\d{2}$/.test(raw)) {
      const index = Math.min(16, Math.max(1, Number(raw.slice(-2))));
      input = {
        character:'avatar-' + String(index).padStart(2, '0'),
        background:'mountains'
      };
    }
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Configuración de avatar no válida.');
  if (!input.character) {
    const fingerprint = JSON.stringify(input);
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) hash = ((hash * 31) + fingerprint.charCodeAt(i)) >>> 0;
    const legacyBackgrounds = {
      meadow:'mountains',
      mountains:'mountains',
      sunset:'volcano',
      library:'library',
      arcade:'arcade',
      moon:'moon-city'
    };
    input = {
      character:'avatar-' + String((hash % 16) + 1).padStart(2, '0'),
      background:legacyBackgrounds[input.background] || 'mountains'
    };
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
  const students = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS))
    .filter(s => isTrue_(s.activo))
    .filter(s => !classCode || s.clase === classCode);
  const games = getActiveGames_();
  const allProgress = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.PROGRESO))
    .map(normalizeProgressRow_)
    .filter(p => !classCode || p.clase === classCode)
    .filter(p => !gameId || p.gameId === gameId);
  const progressByStudent = groupByV03_(allProgress, 'studentId');
  const events = rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.EVENTOS))
    .filter(e => !classCode || e.clase === classCode)
    .filter(e => !gameId || e.gameId === gameId);
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
  [
    {gameId:'battlegrafia',nombre:'Battlegrafía',subtitulo:'La aventura de las palabras',categoria:'RPG',competencias:'ortografía,gramática,verbos',estado:'próximamente',orden:1,color:'#f59e0b',icono:'🐉',descripcion:'RPG de Lengua. Integración avanzada pendiente.',banner:'dragon',activo:true,updatedAt:now},
    {gameId:'maniacgrafia',nombre:'Maniacgrafía',subtitulo:'Atrapa las palabras',categoria:'Ortografía',competencias:'ortografía,acentuación',estado:'beta',orden:2,color:'#d946ef',icono:'⚡',descripcion:'Corrige palabras trampa y mejora tu precisión.',banner:'neon',activo:true,updatedAt:now},
    {gameId:'narratoria',nombre:'Narratoria',subtitulo:'Escribe. Crea. Cuenta.',categoria:'Escritura',competencias:'narración,creatividad,redacción',estado:'beta',orden:3,color:'#f59e0b',icono:'📚',descripcion:'Construye relatos con cartas, fases y objetivos.',banner:'paper',activo:true,updatedAt:now},
    {gameId:'versopolis',nombre:'Versópolis',subtitulo:'La ciudad de la poesía',categoria:'Poesía',competencias:'poesía,literatura,creatividad',estado:'beta',orden:4,color:'#8b5cf6',icono:'✒️',descripcion:'Crea poemas y completa travesías poéticas.',banner:'city',activo:true,updatedAt:now},
    {gameId:'scrabble',nombre:'Scrabble',subtitulo:'Palabras en juego',categoria:'Léxico',competencias:'léxico,vocabulario,estrategia',estado:'aula',orden:5,color:'#34d399',icono:'🔤',descripcion:'Forma palabras y compite por equipos.',banner:'board',activo:true,updatedAt:now},
    {gameId:'conjuga_apuesta',nombre:'Conjuga y apuesta',subtitulo:'Verbos 1 contra 1',categoria:'Verbos',competencias:'verbos,morfología',estado:'aula',orden:6,color:'#fb7185',icono:'🎲',descripcion:'Apuesta puntos conjugando formas verbales.',banner:'dice',activo:true,updatedAt:now},
    {gameId:'verb_battle',nombre:'Batalla verbal',subtitulo:'Jeopardy verbal RPG',categoria:'Verbos',competencias:'verbos,morfología,equipos',estado:'aula',orden:7,color:'#60a5fa',icono:'⚔️',descripcion:'Batalla por equipos con preguntas de conjugación.',banner:'battle',activo:true,updatedAt:now}
  ].forEach(g => upsertByKeys_(sh, ['gameId'], g));
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
    CacheService.getScriptCache().removeAll(['public_meta_v03','students_v03_1ESO_A','students_v03_1ESO_B','students_v03_2ESO_A','students_v03_2ESO_B','students_v03_3ESO_A','students_v03_3ESO_B','students_v03_4ESO_A','students_v03_4ESO_B']);
  } catch(e) {}
}
