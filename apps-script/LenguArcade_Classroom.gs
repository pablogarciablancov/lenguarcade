/**
 * Diagnosticos privados para comprobar el acceso del propietario a Classroom.
 *
 * Estas funciones terminan en "_" para que no se puedan invocar desde
 * google.script.run ni desde las paginas publicas de LenguArcade.
 */

function autorizarClassroom() {
  const activeEmail = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  const ownerEmail = String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  if (!activeEmail || !ownerEmail || activeEmail !== ownerEmail) {
    throw new Error('Esta funcion solo puede ejecutarla el propietario desde el editor de Apps Script.');
  }
  const result = testClassroomAccess_();
  const checks = {
    classroomCourses:true,
    classroomStudents:[],
    classroomCourseWork:[],
    externalRequest:false
  };
  result.courses.forEach(course => {
    try {
      Classroom.Courses.Students.list(course.id, { pageSize:1 });
      checks.classroomStudents.push({ id:course.id, name:course.name, ok:true });
    } catch (error) {
      checks.classroomStudents.push({
        id:course.id,
        name:course.name,
        ok:false,
        error:String(error && error.message || error)
      });
    }
    try {
      Classroom.Courses.CourseWork.list(course.id, { pageSize:1 });
      checks.classroomCourseWork.push({ id:course.id, name:course.name, ok:true });
    } catch (error) {
      checks.classroomCourseWork.push({
        id:course.id,
        name:course.name,
        ok:false,
        error:String(error && error.message || error)
      });
    }
  });
  const health = UrlFetchApp.fetch(LA_SUPABASE_URL_ + '/auth/v1/health', {
    method:'get',
    headers:{ apikey:LA_SUPABASE_PUBLIC_KEY_ },
    muteHttpExceptions:true
  });
  checks.externalRequest = health.getResponseCode() >= 200 &&
    health.getResponseCode() < 500;
  const authorized = Object.assign({}, result, { checks:checks });
  console.log(JSON.stringify(authorized, null, 2));
  return authorized;
}

function testClassroomAccess_() {
  const response = Classroom.Courses.list({
    teacherId:'me',
    courseStates:['ACTIVE'],
    pageSize:10
  });
  const courses = response.courses || [];
  return {
    ok:true,
    activeCourses:courses.length,
    courses:courses.map(course => ({
      id:String(course.id || ''),
      name:String(course.name || ''),
      section:String(course.section || ''),
      courseState:String(course.courseState || ''),
      alternateLink:String(course.alternateLink || '')
    }))
  };
}

function previewClassroomRoster_(courseId) {
  const cleanCourseId = String(courseId || '').trim();
  if (!cleanCourseId) throw new Error('Indica el ID de un curso de Classroom.');

  const course = Classroom.Courses.get(cleanCourseId);
  const students = listAllClassroomStudents_(cleanCourseId);
  return {
    ok:true,
    course:{
      id:String(course.id || ''),
      name:String(course.name || ''),
      section:String(course.section || ''),
      courseState:String(course.courseState || '')
    },
    students:students.map(student => ({
      classroomUserId:String(student.userId || ''),
      firstName:String(student.profile && student.profile.name && student.profile.name.givenName || ''),
      lastName:String(student.profile && student.profile.name && student.profile.name.familyName || ''),
      email:String(student.profile && student.profile.emailAddress || '').trim().toLowerCase()
    }))
  };
}

function listAllClassroomStudents_(courseId) {
  const students = [];
  let pageToken = '';
  do {
    const options = { pageSize:100 };
    if (pageToken) options.pageToken = pageToken;
    const response = Classroom.Courses.Students.list(courseId, options);
    Array.prototype.push.apply(students, response.students || []);
    pageToken = String(response.nextPageToken || '');
  } while (pageToken);
  return students;
}

const LA_SUPABASE_URL_ = 'https://spqcztbuwcbmsengeluz.supabase.co';
const LA_SUPABASE_PUBLIC_KEY_ = 'sb_publishable_zScSYh0tbpXLcY_5iyzsqQ_wepkdqKe';

function callSupabaseClassroomBridge_(accessToken, payload) {
  const cleanToken = String(accessToken || '').trim();
  if (!cleanToken) throw new Error('La sesion del profesor no es valida.');
  const response = UrlFetchApp.fetch(LA_SUPABASE_URL_ + '/functions/v1/classroom-sync', {
    method:'post',
    contentType:'application/json',
    headers:{
      apikey:LA_SUPABASE_PUBLIC_KEY_,
      Authorization:'Bearer ' + cleanToken
    },
    payload:JSON.stringify(payload || {}),
    muteHttpExceptions:true
  });
  const text = response.getContentText();
  let data = {};
  try { data = JSON.parse(text || '{}'); } catch (error) {}
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error(data.error || 'Supabase no ha aceptado la sincronizacion.');
  }
  return data;
}

function listClassroomCoursesForSync(accessToken) {
  callSupabaseClassroomBridge_(accessToken, { action:'verify' });
  const response = Classroom.Courses.list({
    teacherId:'me',
    courseStates:['ACTIVE'],
    pageSize:100
  });
  return {
    ok:true,
    courses:(response.courses || []).map(course => ({
      id:String(course.id || ''),
      name:String(course.name || ''),
      section:String(course.section || ''),
      alternateLink:String(course.alternateLink || '')
    }))
  };
}

function syncClassroomRoster(accessToken, selectedCourseIds) {
  callSupabaseClassroomBridge_(accessToken, { action:'verify' });
  const selected = {};
  (selectedCourseIds || []).forEach(id => selected[String(id || '')] = true);
  if (!Object.keys(selected).length) {
    throw new Error('Selecciona al menos un curso de Classroom.');
  }
  const response = Classroom.Courses.list({
    teacherId:'me',
    courseStates:['ACTIVE'],
    pageSize:100
  });
  const skippedCourses = [];
  const courses = [];
  (response.courses || []).filter(course => selected[String(course.id || '')]).forEach(course => {
    try {
      courses.push({
        id:String(course.id || ''),
        name:String(course.name || ''),
        section:String(course.section || ''),
        courseState:String(course.courseState || ''),
        alternateLink:String(course.alternateLink || ''),
        students:listAllClassroomStudents_(course.id).map(student => ({
          classroomUserId:String(student.userId || ''),
          firstName:String(student.profile && student.profile.name && student.profile.name.givenName || ''),
          lastName:String(student.profile && student.profile.name && student.profile.name.familyName || ''),
          email:String(student.profile && student.profile.emailAddress || '').trim().toLowerCase()
        }))
      });
    } catch (error) {
      skippedCourses.push({
        id:String(course.id || ''),
        name:String(course.name || ''),
        error:String(error && error.message || error)
      });
    }
  });
  const synced = callSupabaseClassroomBridge_(accessToken, {
    action:'sync',
    snapshot:{
      generatedAt:new Date().toISOString(),
      teacherEmail:Session.getEffectiveUser().getEmail(),
      courses:courses
    }
  });
  synced.skippedCourses = skippedCourses;
  return synced;
}

function syncClassroomGradesAsDraft(accessToken) {
  callSupabaseClassroomBridge_(accessToken, { action:'verify' });
  const exportData = callSupabaseClassroomBridge_(accessToken, { action:'grade-export' });
  const results = [];
  (exportData.courses || []).forEach(course => {
    const courseId = String(course.classroomCourseId || '');
    if (!courseId) return;
    const title = 'LenguArcade - Progreso general';
    const courseWork = findOrCreateLenguArcadeCourseWork_(courseId, title);
    const submissions = listAllClassroomSubmissions_(courseId, courseWork.id);
    const submissionByUser = {};
    submissions.forEach(submission => {
      submissionByUser[String(submission.userId || '')] = submission;
    });
    let updated = 0;
    (course.students || []).forEach(student => {
      const submission = submissionByUser[String(student.classroomUserId || '')];
      if (!submission) return;
      Classroom.Courses.CourseWork.StudentSubmissions.patch(
        { draftGrade:Number(student.score || 0) },
        courseId,
        courseWork.id,
        submission.id,
        { updateMask:'draftGrade' }
      );
      updated += 1;
    });
    results.push({
      courseId:courseId,
      courseName:course.name,
      courseWorkId:String(courseWork.id || ''),
      updated:updated
    });
  });
  return { ok:true, courses:results, updated:results.reduce((sum, row) => sum + row.updated, 0) };
}

function findOrCreateLenguArcadeCourseWork_(courseId, title) {
  const marker = '[LenguArcade sync v1]';
  let pageToken = '';
  do {
    const options = { pageSize:100 };
    if (pageToken) options.pageToken = pageToken;
    const response = Classroom.Courses.CourseWork.list(courseId, options);
    const found = (response.courseWork || []).find(item =>
      String(item.title || '') === title &&
      String(item.description || '').indexOf(marker) === 0
    );
    if (found) return found;
    pageToken = String(response.nextPageToken || '');
  } while (pageToken);
  return Classroom.Courses.CourseWork.create({
    title:title,
    description:marker + '\nCalificacion global calculada a partir del progreso registrado en LenguArcade.',
    workType:'ASSIGNMENT',
    state:'PUBLISHED',
    maxPoints:10
  }, courseId);
}

function listAllClassroomSubmissions_(courseId, courseWorkId) {
  const submissions = [];
  let pageToken = '';
  do {
    const options = { pageSize:100 };
    if (pageToken) options.pageToken = pageToken;
    const response = Classroom.Courses.CourseWork.StudentSubmissions.list(
      courseId,
      courseWorkId,
      options
    );
    Array.prototype.push.apply(submissions, response.studentSubmissions || []);
    pageToken = String(response.nextPageToken || '');
  } while (pageToken);
  return submissions;
}
