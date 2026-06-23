/**
 * LenguArcade - acceso con cuenta Google del colegio.
 *
 * - Alumnos: @alumno.fomento.edu
 * - Profesores: @fomento.edu
 *
 * Las pantallas antiguas siguen disponibles con ?legacy=1.
 */

const LA_GOOGLE_AUTH_CONFIG = {
  STUDENT_DOMAIN: '@alumno.fomento.edu',
  TEACHER_DOMAIN: '@fomento.edu',
  TEACHER_ALLOWED_CONFIG_KEY: 'TEACHER_ALLOWED_EMAILS'
};

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const page = String(params.page || params.p || 'alumno').toLowerCase();
  const legacy = String(params.legacy || '').trim() === '1';
  let file = 'LenguArcade_Alumno_Google';
  let title = 'LenguArcade';

  if (legacy) {
    file = page === 'profesor' ? 'LenguArcade_Profesor' : 'LenguArcade_Alumno';
    title = page === 'profesor' ? 'LenguArcade - Profesor' : 'LenguArcade - Alumno';
  } else if (page === 'profesor' || page === 'profe' || page === 'teacher') {
    file = 'LenguArcade_Profesor_Google';
    title = 'LenguArcade - Profesor';
  }

  return HtmlService
    .createHtmlOutputFromFile(file)
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

function loginWithGoogleAccount() {
  const email = requireActiveGoogleEmail_();
  if (isStudentGoogleEmail_(email)) return loginStudentWithGoogle();
  if (isTeacherGoogleEmail_(email)) return loginTeacherWithGoogle();
  throw new Error('Usa una cuenta del colegio: @alumno.fomento.edu para alumnos o @fomento.edu para profesores.');
}

function loginStudentWithGoogle() {
  ensureSheets_();
  const email = requireActiveGoogleEmail_();

  if (!isStudentGoogleEmail_(email)) {
    throw new Error('Para entrar como alumno debes usar tu cuenta @alumno.fomento.edu.');
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
