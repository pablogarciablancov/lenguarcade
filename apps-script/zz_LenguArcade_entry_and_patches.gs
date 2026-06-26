/**
 * LenguArcade - entrada, login Google, parches de integración y funciones V03.
 *
 * Archivo único para evitar acumular varios zz/zzzz en Apps Script.
 *
 * Pantallas:
 * - /exec                -> alumno original + login Google
 * - /exec?page=profesor  -> panel de profesor original
 * - /exec?legacy=1       -> alumno original sin parche Google
 *
 * Google:
 * - Alumnos: @alumno.fomento.edu
 * - Profesores: @fomento.edu
 *
 * Juegos:
 * - Los juegos viven en GitHub Pages y se abren desde el catálogo de LenguArcade.
 */
const LA_GOOGLE_AUTH_CONFIG = {
  STUDENT_DOMAIN: '@alumno.fomento.edu',
  TEACHER_DOMAIN: '@fomento.edu',
  TEACHER_ALLOWED_CONFIG_KEY: 'TEACHER_ALLOWED_EMAILS',
  TEACHER_PLAYER_CLASS: 'PROFES',
  GITHUB_PAGES_GAMES_BASE: 'https://pablogarciablancov.github.io/lenguarcade/games/'
};

function legacyPatchedDoGet_(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const page = String(params.page || params.p || 'alumno').toLowerCase();
  const legacy = String(params.legacy || '').trim() === '1';

  if (page === 'narratoria') {
    return buildExternalRedirectHtmlOutput_(getGithubGameUrl_('narratoria'), 'Narratoria');
  }

  let file = 'LenguArcade_Alumno';
  let title = 'LenguArcade';
  let patchAlumnoGoogle = !legacy;

  if (legacy) {
    file = page === 'profesor' ? 'LenguArcade_Profesor' : 'LenguArcade_Alumno';
    title = page === 'profesor' ? 'LenguArcade - Profesor' : 'LenguArcade - Alumno';
    patchAlumnoGoogle = false;
  } else if (page === 'profesor' || page === 'profe' || page === 'teacher') {
    file = 'LenguArcade_Profesor';
    title = 'LenguArcade - Profesor';
    patchAlumnoGoogle = false;
  }

  return buildLenguArcadeHtmlOutput_(file, title, patchAlumnoGoogle);
}

function buildLenguArcadeHtmlOutput_(file, title, patchAlumnoGoogle) {
  let output = HtmlService.createHtmlOutputFromFile(file);
  if (patchAlumnoGoogle) {
    const patch = getAlumnoOriginalGoogleLoginPatch_() + '\n' + getBattlegrafiaLenguArcadeProfilePatch_();
    const content = output.getContent();
    output = HtmlService.createHtmlOutput(
      content.indexOf('</body>') !== -1
        ? content.replace('</body>', patch + '\n</body>')
        : content + patch
    );
  }
  return output
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

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
    '</head><body><div class="box"><h1>Cargando ' + safeTitle + '...</h1><p>Abriendo el juego desde GitHub Pages.</p><p><a href="' + safeUrl + '">Abrir manualmente</a></p></div>' +
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

function getAlumnoOriginalGoogleLoginPatch_() {
  return `
<script>
(function(){
  function q(id){return document.getElementById(id);}
  function baseCall(fn,args){
    const runner=(typeof studentCallServerBase==='function')?studentCallServerBase:callServer;
    return runner(fn,args||[]);
  }
  function authStatus(message){
    const status=document.querySelector('#loginCard [data-google-auth-status]')||q('status');
    if(status)status.textContent=message;
  }
  function disable(selector,value){
    const button=document.querySelector('#loginCard '+selector);
    if(button)button.disabled=!!value;
  }
  async function goToProfesorPanel(){
    try{
      authStatus('Abriendo panel del profesor...');
      const url=await baseCall('getWebAppUrl');
      window.top.location.href=url+'?page=profesor';
    }catch(error){
      authStatus('No se ha podido abrir el panel: '+(error.message||error));
    }
  }
  function normalizeNarratoriaUrl(dashboard){
    if(!dashboard||!Array.isArray(dashboard.games))return dashboard;
    dashboard.games=dashboard.games.map(function(game){
      if(!game||String(game.gameId||'').toLowerCase()!=='narratoria')return game;
      const copy=Object.assign({},game);
      copy.url='https://pablogarciablancov.github.io/lenguarcade/games/narratoria/';
      copy.embedUrl=copy.url;
      return copy;
    });
    return dashboard;
  }
  function finishGoogleStudentLogin(result,message){
    if(!result||!result.token||!result.dashboard)throw new Error('El servidor no ha devuelto una sesión válida.');
    secureSessionVerified=true;
    token=result.token;
    currentDashboard=normalizeNarratoriaUrl(result.dashboard);
    try{supabaseBackend=false;}catch(error){}
    try{legacySessionToken=token;}catch(error){}
    localStorage.setItem('LA_STUDENT_TOKEN',token);
    try{localStorage.setItem(LA_LEGACY_SESSION_KEY,token);}catch(error){}
    try{localStorage.removeItem(LA_SUPABASE_SESSION_KEY);}catch(error){}
    saveCache('LA_DASHBOARD_CACHE',currentDashboard);
    renderDashboard(currentDashboard);
    revealStudentApp();
    setStatus(message||'Sesión iniciada con Google.');
  }
  window.secureStudentLogin=async function(){
    if(busy)return;
    busy=true;
    disable('[data-google-student-login]',true);
    authStatus('Comprobando tu cuenta de Google del colegio...');
    try{
      const result=await baseCall('loginWithGoogleAccount',['student']);
      finishGoogleStudentLogin(result,'Sesión iniciada con Google del colegio.');
    }catch(error){
      authStatus(error.message||'No se ha podido iniciar sesión con Google.');
    }finally{
      busy=false;
      disable('[data-google-student-login]',false);
    }
  };
  window.secureTeacherLogin=async function(){
    if(busy)return;
    busy=true;
    disable('[data-google-teacher-player-login]',true);
    authStatus('Creando o recuperando tu perfil de profe-jugador...');
    try{
      const result=await baseCall('loginTeacherAsStudentWithGoogle');
      finishGoogleStudentLogin(result,'Modo profe-jugador activado.');
    }catch(error){
      authStatus(error.message||'No se ha podido entrar como profe-jugador.');
    }finally{
      busy=false;
      disable('[data-google-teacher-player-login]',false);
    }
  };
  window.mountGoogleStudentLogin=function(){
    const card=q('loginCard');
    if(!card)return;
    document.body.classList.add('authPending');
    card.classList.remove('hidden');
    card.innerHTML=
      '<div class="authShell">'+
        '<section class="authWelcome">'+
          '<div class="authWelcomeLogo" aria-hidden="true"></div>'+
          '<h1><span class="grad">LenguArcade</span></h1>'+
          '<p>Tu universo de juegos de Lengua. Entra con la cuenta Google del colegio para guardar tu progreso, tus logros y tu personaje.</p>'+
        '</section>'+
        '<section class="authForm" aria-labelledby="googleLoginTitle">'+
          '<div class="sub">ACCESO DE ALUMNOS</div>'+
          '<h2 id="googleLoginTitle">Entra en tu cuenta</h2>'+
          '<p class="sub">Usa tu cuenta institucional de Google. No tienes que elegir clase, alumno ni PIN.</p>'+
          '<span class="authDomain">@alumno.fomento.edu</span>'+
          '<button type="button" data-google-student-login>Entrar con Google del colegio</button>'+
          '<div class="teacherAccess">'+
            '<button type="button" class="teacherToggle" data-teacher-toggle>Soy profesor</button>'+
            '<div class="teacherPanel" data-teacher-panel>'+
              '<p>Como profesor puedes abrir el panel docente o entrar como jugador con tu propio progreso dentro de LenguArcade.</p>'+
              '<button type="button" data-google-teacher-player-login>Entrar como profe-jugador</button>'+
              '<button type="button" class="teacherToggle" data-open-teacher-panel style="margin-top:10px">Abrir panel del profesor</button>'+
            '</div>'+
          '</div>'+
          '<div class="status authStatus" id="status" data-google-auth-status>Elige cómo quieres entrar.</div>'+
          '<span id="version" hidden></span>'+
          '<div class="authSecurity"><span>✓</span><span>La sesión se valida con la cuenta Google activa del colegio. Los alumnos entran con @alumno.fomento.edu y los profesores con @fomento.edu.</span></div>'+
        '</section>'+
      '</div>';
    const studentButton=card.querySelector('[data-google-student-login]');
    const teacherToggle=card.querySelector('[data-teacher-toggle]');
    const teacherPanel=card.querySelector('[data-teacher-panel]');
    const teacherPlayerButton=card.querySelector('[data-google-teacher-player-login]');
    const teacherPanelButton=card.querySelector('[data-open-teacher-panel]');
    if(studentButton)studentButton.onclick=window.secureStudentLogin;
    if(teacherToggle&&teacherPanel)teacherToggle.onclick=function(){teacherPanel.classList.toggle('open');};
    if(teacherPlayerButton)teacherPlayerButton.onclick=window.secureTeacherLogin;
    if(teacherPanelButton)teacherPanelButton.onclick=goToProfesorPanel;
  };
  try{
    if(token&&currentDashboard){
      currentDashboard=normalizeNarratoriaUrl(currentDashboard);
      secureSessionVerified=true;
      revealStudentApp();
    }else{
      mountGoogleStudentLogin();
    }
  }catch(error){
    console.error('No se pudo montar el login Google de LenguArcade',error);
    authStatus(error.message||String(error));
  }
})();
</script>`;
}

function getBattlegrafiaLenguArcadeProfilePatch_() {
  return `
<script>
(function(){
  if(window.__LA_BATTLEGRAFIA_PROFILE_PATCH__) return;
  window.__LA_BATTLEGRAFIA_PROFILE_PATCH__ = true;
  function cleanText(value){return String(value == null ? '' : value).trim();}
  function isBattlegrafiaGame(game){return String(game && game.gameId || '').toLowerCase() === 'battlegrafia';}
  function getProfileSource(explicit){return explicit || (window.currentDashboard && window.currentDashboard.student) || (typeof currentDashboard !== 'undefined' && currentDashboard && currentDashboard.student) || {};}
  function buildLenguArcadeProfile(explicitStudent){
    const source = getProfileSource(explicitStudent);
    const nombre = cleanText(source.nombre || source.firstName || source.givenName);
    const apellidos = cleanText(source.apellidos || source.lastName || source.familyName);
    const email = cleanText(source.email || source.mail || source.userEmail).toLowerCase();
    const localPart = email ? email.split('@')[0] : '';
    const explicitName = cleanText(source.name || source.fullName || source.displayName || source.playerName);
    const fullName = cleanText(explicitName || [nombre, apellidos].filter(Boolean).join(' ') || localPart || 'Jugador');
    const studentId = cleanText(source.studentId || source.student_id || source.id || source.profileId || localPart || '');
    const clase = cleanText(source.clase || source.classCode || source.className || source.group || source.course || '');
    const isTeacherPlayer = !!(source.teacherPlayer || source.isTeacherPlayer || clase === 'PROFES' || (email && /@fomento\\.edu$/i.test(email) && !/@alumno\\.fomento\\.edu$/i.test(email)));
    return Object.assign({}, source, {schema:'lenguarcade-profile-v1', source:'LenguArcade', role:isTeacherPlayer?'teacher-player':(source.role||'student'), teacherPlayer:isTeacherPlayer, isTeacherPlayer:isTeacherPlayer, studentId:studentId, student_id:studentId, profileId:studentId, id:studentId, email:email, mail:email, userEmail:email, nombre:nombre||fullName, apellidos:apellidos, name:fullName, fullName:fullName, displayName:fullName, playerName:fullName, username:localPart, clase:clase, classCode:clase, className:clase, group:clase, course:source.curso || source.course || clase});
  }
  function enrichInitPayload(payload){
    const next = Object.assign({}, payload || {});
    const profile = buildLenguArcadeProfile(next.student || next.profile || next.user);
    next.student = Object.assign({}, profile, next.student || {});
    next.profile = Object.assign({}, profile, next.profile || {});
    next.user = Object.assign({}, profile, next.user || {});
    next.player = Object.assign({}, profile, next.player || {});
    next.lenguarcadeProfile = profile;
    if(next.save && typeof next.save === 'object'){
      next.save.__lenguarcadeProfile = profile;
      next.save.lenguarcadeProfile = profile;
      ['studentId','profileId','email','playerName','name','clase','classCode'].forEach(function(k){ if(!next.save[k]) next.save[k] = profile[k] || profile.playerName || profile.clase || ''; });
    }
    return next;
  }
  function addBattlegrafiaProfileToUrl(runner){
    try{
      if(!runner || !isBattlegrafiaGame(runner.game) || !runner.url) return runner;
      const profile = buildLenguArcadeProfile();
      const url = new URL(runner.url);
      url.searchParams.set('laProfile','1');
      url.searchParams.set('studentId',profile.studentId||'');
      url.searchParams.set('profileId',profile.profileId||'');
      url.searchParams.set('studentName',profile.playerName||'');
      url.searchParams.set('playerName',profile.playerName||'');
      url.searchParams.set('studentEmail',profile.email||'');
      url.searchParams.set('classCode',profile.classCode||'');
      url.searchParams.set('teacherPlayer',profile.isTeacherPlayer?'1':'0');
      runner.url = url.toString();
    }catch(error){console.warn('No se pudo añadir el perfil de LenguArcade a la URL de Battlegrafía.', error);}
    return runner;
  }
  function installPatch(){
    if(typeof sendToActiveGame === 'function' && !sendToActiveGame.__battlegrafiaProfilePatched){
      const originalSendToActiveGame = sendToActiveGame;
      const patchedSendToActiveGame = function(type,payload){
        let nextPayload = payload || {};
        try{const runner=(typeof activeGameRunner!=='undefined')?activeGameRunner:null; if(type==='INIT' && runner && isBattlegrafiaGame(runner.game)) nextPayload=enrichInitPayload(nextPayload);}catch(error){console.warn('No se pudo normalizar el perfil para Battlegrafía.', error);}
        return originalSendToActiveGame(type,nextPayload);
      };
      patchedSendToActiveGame.__battlegrafiaProfilePatched = true;
      sendToActiveGame = patchedSendToActiveGame;
      window.sendToActiveGame = patchedSendToActiveGame;
    }
    if(typeof prepareEmbeddedGame === 'function' && !prepareEmbeddedGame.__battlegrafiaProfilePatched){
      const originalPrepareEmbeddedGame = prepareEmbeddedGame;
      const patchedPrepareEmbeddedGame = function(game){return addBattlegrafiaProfileToUrl(originalPrepareEmbeddedGame(game));};
      patchedPrepareEmbeddedGame.__battlegrafiaProfilePatched = true;
      prepareEmbeddedGame = patchedPrepareEmbeddedGame;
      window.prepareEmbeddedGame = patchedPrepareEmbeddedGame;
    }
  }
  installPatch(); setTimeout(installPatch,0); setTimeout(installPatch,250);
})();
</script>`;
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
    CacheService.getScriptCache().removeAll(['public_meta_v03','public_meta_v04','students_v03_1ESO_A','students_v03_1ESO_B','students_v03_2ESO_A','students_v03_2ESO_B','students_v03_3ESO_A','students_v03_3ESO_B','students_v03_4ESO_A','students_v03_4ESO_B']);
  } catch(e) {}
}
