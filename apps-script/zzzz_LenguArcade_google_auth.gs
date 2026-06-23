/**
 * LenguArcade - acceso con cuenta Google del colegio.
 *
 * - Alumnos: @alumno.fomento.edu
 * - Profesores: @fomento.edu
 *
 * Pantallas:
 * - /exec                 -> alumno original + login Google
 * - /exec?page=profesor   -> panel de profesor original
 * - /exec?page=alumno-google -> pantalla provisional Google, solo como respaldo
 * - /exec?page=profesor-google -> panel provisional Google, solo como respaldo
 * - /exec?legacy=1        -> alumno original sin parche Google
 */

const LA_GOOGLE_AUTH_CONFIG = {
  STUDENT_DOMAIN: '@alumno.fomento.edu',
  TEACHER_DOMAIN: '@fomento.edu',
  TEACHER_ALLOWED_CONFIG_KEY: 'TEACHER_ALLOWED_EMAILS',
  TEACHER_PLAYER_CLASS: 'PROFES'
};

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const page = String(params.page || params.p || 'alumno').toLowerCase();
  const legacy = String(params.legacy || '').trim() === '1';
  let file = 'LenguArcade_Alumno';
  let title = 'LenguArcade';
  let patchAlumnoGoogle = !legacy;

  if (legacy) {
    file = page === 'profesor' ? 'LenguArcade_Profesor' : 'LenguArcade_Alumno';
    title = page === 'profesor' ? 'LenguArcade - Profesor' : 'LenguArcade - Alumno';
    patchAlumnoGoogle = false;
  } else if (page === 'profesor' || page === 'profe' || page === 'teacher') {
    // Importante: el panel bueno es el original, con Supabase, Classroom y el diseño oscuro.
    file = 'LenguArcade_Profesor';
    title = 'LenguArcade - Profesor';
    patchAlumnoGoogle = false;
  } else if (page === 'alumno-google' || page === 'student-google') {
    // Respaldo: pantalla simple de Apps Script, no se usa como entrada principal.
    file = 'LenguArcade_Alumno_Google';
    title = 'LenguArcade - Alumno Google';
    patchAlumnoGoogle = false;
  } else if (page === 'profesor-google' || page === 'teacher-google') {
    // Respaldo: panel simple de Apps Script, no se usa como entrada principal.
    file = 'LenguArcade_Profesor_Google';
    title = 'LenguArcade - Profesor Google';
    patchAlumnoGoogle = false;
  } else if (page === 'narratoria') {
    file = 'Narratoria_Alumno';
    title = 'Narratoria';
    patchAlumnoGoogle = false;
  }

  return buildLenguArcadeHtmlOutput_(file, title, patchAlumnoGoogle);
}

function buildLenguArcadeHtmlOutput_(file, title, patchAlumnoGoogle) {
  let output = HtmlService.createHtmlOutputFromFile(file);
  if (patchAlumnoGoogle) {
    const patch = getAlumnoOriginalGoogleLoginPatch_();
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

/**
 * Devuelve la URL real /exec de la Web App.
 * Importante: en Apps Script la página se ejecuta dentro de un iframe de googleusercontent.
 * Cambiar window.location.search dentro del iframe puede romper la URL interna y dejar la pantalla en blanco.
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * Parche cliente para que la pantalla ORIGINAL de alumno conserve toda su plataforma
 * y cambie solo el método de entrada: Google del colegio en vez de correo + PIN.
 */
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
  function finishGoogleStudentLogin(result,message){
    if(!result||!result.token||!result.dashboard)throw new Error('El servidor no ha devuelto una sesión válida.');
    secureSessionVerified=true;
    token=result.token;
    currentDashboard=result.dashboard;
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
      secureSessionVerified=true;
      revealStudentApp();
    }else{
      mountGoogleStudentLogin();
    }
  }catch(error){
    console.error('No se pudo montar el login Google de LenguArcade.',error);
    authStatus(error.message||String(error));
  }
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

/**
 * mode:
 * - undefined / auto: alumno si @alumno, profesor si @fomento
 * - student: alumno real o profesor-jugador
 * - teacher: profesor
 */
function loginWithGoogleAccount(mode) {
  const email = requireActiveGoogleEmail_();
  const cleanMode = String(mode || 'auto').toLowerCase();

  if (cleanMode === 'student' || cleanMode === 'alumno' || cleanMode === 'player') {
    if (isStudentGoogleEmail_(email)) return loginStudentWithGoogle();
    if (isTeacherGoogleEmail_(email)) return loginTeacherAsStudentWithGoogle();
    throw new Error('Para jugar debes usar una cuenta del colegio: @alumno.fomento.edu o @fomento.edu.');
  }

  if (cleanMode === 'teacher' || cleanMode === 'profesor' || cleanMode === 'profe') {
    return loginTeacherWithGoogle();
  }

  if (isStudentGoogleEmail_(email)) return loginStudentWithGoogle();
  if (isTeacherGoogleEmail_(email)) return loginTeacherWithGoogle();
  throw new Error('Usa una cuenta del colegio: @alumno.fomento.edu para alumnos o @fomento.edu para profesores.');
}

function loginStudentWithGoogle() {
  ensureSheets_();
  const email = requireActiveGoogleEmail_();

  if (!isStudentGoogleEmail_(email)) {
    throw new Error('Para entrar como alumno debes usar tu cuenta @alumno.fomento.edu. Si eres profesor y quieres jugar, usa el botón "Entrar como profe-jugador".');
  }

  const student = findStudentByEmail_(email);
  if (!student) {
    throw new Error('No encuentro esta cuenta en la hoja Alumnos: ' + email + '. Revisa que el correo esté escrito igual en la hoja o importa/actualiza la lista de alumnos.');
  }
  if (!isTrue_(student.activo)) {
    throw new Error('Tu usuario aparece como inactivo. Habla con tu profesor.');
  }

  touchStudent_(student.studentId);
  const token = createSession_('student', student.studentId);
  return {
    ok: true,
    role: 'student',
    token,
    activeUserEmail: email,
    student: safeStudent_(student),
    dashboard: getStudentDashboardCore_(student.studentId)
  };
}

function loginTeacherAsStudentWithGoogle() {
  ensureSheets_();
  const email = requireActiveGoogleEmail_();

  if (!isTeacherGoogleEmail_(email)) {
    throw new Error('Esta entrada es solo para profesores con cuenta @fomento.edu.');
  }
  if (!isTeacherAllowed_(email)) {
    throw new Error('Esta cuenta de profesor no está autorizada: ' + email + '. Añádela en Config > TEACHER_ALLOWED_EMAILS o deja ese campo vacío para permitir @fomento.edu.');
  }

  const student = ensureTeacherPlayerStudent_(email);
  touchStudent_(student.studentId);
  const token = createSession_('student', student.studentId);
  return {
    ok: true,
    role: 'student',
    teacherPlayer: true,
    token,
    activeUserEmail: email,
    student: safeStudent_(student),
    dashboard: getStudentDashboardCore_(student.studentId)
  };
}

function loginTeacherWithGoogle() {
  ensureSheets_();
  const email = requireActiveGoogleEmail_();

  if (!isTeacherGoogleEmail_(email)) {
    throw new Error('Para entrar como profesor debes usar una cuenta @fomento.edu.');
  }
  if (!isTeacherAllowed_(email)) {
    throw new Error('Esta cuenta de profesor no está autorizada para ver el panel: ' + email + '. Añádela en Config > TEACHER_ALLOWED_EMAILS o deja ese campo vacío para permitir @fomento.edu.');
  }

  const token = createSession_('teacher', email);
  return {
    ok: true,
    role: 'teacher',
    token,
    email,
    version: LA_CONFIG.VERSION
  };
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
  const readable = local
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const studentId = 'profe_' + normalizeSlug_(local).slice(0, 80);
  const now = nowIso_();
  const row = {
    studentId,
    nombre:'Profe',
    apellidos:readable || clean,
    email:clean,
    pin:'',
    curso:'PROF',
    linea:'DOC',
    clase:LA_GOOGLE_AUTH_CONFIG.TEACHER_PLAYER_CLASS,
    avatar:'avatar_01',
    activo:true,
    xpGeneral:0,
    nivelGeneral:1,
    plumas:0,
    fechaAlta:now,
    ultimaSesion:now
  };
  appendObject_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS), row);
  if (typeof clearCacheV03_ === 'function') clearCacheV03_();
  return findStudentByEmail_(clean) || row;
}

function ensureTeacherPlayerClass_() {
  const classCode = LA_GOOGLE_AUTH_CONFIG.TEACHER_PLAYER_CLASS;
  const sheet = getSheet_(LA_CONFIG.SHEETS.CLASES);
  const exists = rowsToObjects_(sheet).some(row => String(row.classCode || '') === classCode);
  if (exists) return;
  appendObject_(sheet, {
    classCode,
    curso:'Profesores',
    linea:'Jugador',
    nombreVisible:'Profesores · modo jugador',
    activa:true,
    updatedAt:nowIso_()
  });
}

function requireActiveGoogleEmail_() {
  const email = getActiveUserEmail_();
  if (!email) {
    throw new Error('Google no ha devuelto la cuenta activa. Revisa el despliegue de Apps Script: la web app no debe tener acceso anónimo; debe pedir inicio de sesión con Google. Si sigue saliendo este error, despliega la app para usuarios de Google Workspace del colegio o cambia executeAs a USER_ACCESSING.');
  }
  return email;
}

function getActiveUserEmail_() {
  try {
    return String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  } catch (error) {
    return '';
  }
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

  const allowed = raw
    .split(/[\s,;]+/)
    .map(item => item.trim())
    .filter(Boolean);

  return allowed.indexOf(String(email || '').toLowerCase()) !== -1;
}

function loginStudentByIdOrEmail(loginValue, pin) {
  const value = String(loginValue || '').trim();
  if (!value) throw new Error('Falta el usuario.');

  if (value.indexOf('@') !== -1) return loginStudent(value, pin);

  const student = findStudentById_(value);
  if (!student) throw new Error('No encuentro ese alumno.');
  return loginStudent(student.email, pin);
}
