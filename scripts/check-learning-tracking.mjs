import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const teacherBackend=readFileSync('supabase/functions/teacher-dashboard/index.ts','utf8');
const studentBackend=readFileSync('supabase/functions/student-dashboard/index.ts','utf8');
const teacherUi=readFileSync('apps-script/LenguArcade_Profesor.html','utf8');
const studentUi=readFileSync('apps-script/LenguArcade_Alumno.html','utf8');

assert.match(teacherBackend,/missionCompletionById/,'El panel docente debe calcular cumplimiento por misión');
assert.match(teacherBackend,/workshopOutcomes/,'El panel docente debe devolver objetivos de taller');
assert.match(teacherBackend,/completedStudents/,'El panel docente debe devolver quién ha completado cada objetivo');
assert.match(teacherBackend,/activityStartIso/,'El seguimiento debe abarcar la ventana real de misiones y talleres');

assert.doesNotMatch(studentBackend,/ranking:\s*\[\]/,'El ranking del alumno no puede seguir vacío');
assert.match(studentBackend,/rankingClassroomId/,'El ranking debe limitarse a la clase del alumno');
assert.match(studentBackend,/missionResults/,'El alumno debe recibir historial de resultados de misiones');
assert.match(studentBackend,/platformAchievementHistory/,'El alumno debe recibir el historial de logros generales');

for(const key of ['nombre','clase','xp','level','sessions','gamesPlayed','accuracy','grade']){
  assert.match(teacherUi,new RegExp('data-student-sort="'+key+'"'),'Debe poder ordenarse por '+key);
}
assert.match(teacherUi,/missionCompletionTracking/,'La interfaz docente debe mostrar cumplimiento de misiones');
assert.match(teacherUi,/workshopCompletionTracking/,'La interfaz docente debe mostrar cumplimiento de talleres');

assert.match(studentUi,/rankCard/,'La interfaz del alumno debe renderizar el ranking');
assert.match(studentUi,/missionHistoryStudent/,'La interfaz del alumno debe mostrar historial de misiones');
assert.match(studentUi,/generalAchievementsStudent/,'La interfaz del alumno debe mostrar logros generales');
assert.match(studentUi,/refreshSocialProgress/,'Ranking y misiones deben poder refrescarse sin recargar toda la web');

console.log('Learning tracking checks: OK');
