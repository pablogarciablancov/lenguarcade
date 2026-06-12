/**
 * Diagnosticos privados para comprobar el acceso del propietario a Classroom.
 *
 * Estas funciones terminan en "_" para que no se puedan invocar desde
 * google.script.run ni desde las paginas publicas de LenguArcade.
 */

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
