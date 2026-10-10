import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {platformMilestones,snapshotProgress} from '../supabase/functions/_shared/progression.js';

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

assert.match(teacherUi,/data-student-sort/,'La tabla de alumnos debe exponer controles de ordenación');
for(const key of ['nombre','clase','xp','level','sessions','gamesPlayed','accuracy','grade']){
  assert.match(teacherUi,new RegExp("'"+key+"'"),'Debe poder ordenarse por '+key);
}
assert.match(teacherUi,/missionCompletionTracking/,'La interfaz docente debe mostrar cumplimiento de misiones');
assert.match(teacherUi,/workshopCompletionTracking/,'La interfaz docente debe mostrar cumplimiento de talleres');
assert.match(teacherUi,/laShowTeacherScreen\\('taller'\\)/,'El botón de Misiones debe abrir la pantalla de Talleres');
assert.match(teacherUi,/laShowTeacherScreen\\('misiones'\\)/,'El botón del Taller debe abrir la pantalla de Misiones');

assert.match(studentUi,/rankCard/,'La interfaz del alumno debe renderizar el ranking');
assert.match(studentUi,/missionHistoryStudent/,'La interfaz del alumno debe mostrar historial de misiones');
assert.match(studentUi,/generalAchievementsStudent/,'La interfaz del alumno debe mostrar logros generales');
assert.match(studentUi,/refreshSocialProgress/,'Ranking y misiones deben poder refrescarse sin recargar toda la web');
assert.match(studentUi,/platform-achievement-viewport/,'La colección de logros debe tener scroll interno y no cortar el perfil');
assert.match(studentUi,/Ver colección completa/,'El ranking debe enlazar a la colección completa sin duplicar todos los logros');

const achievements=platformMilestones(50000,9,600,{
  sessions:100,gamesPlayed:10,accuracy:95,missionsCompleted:20,feathers:250,bestStreak:20
});
assert.ok(achievements.length>=30,'Debe haber una colección amplia de logros generales');
for(const id of ['sessions_1','games_6','accuracy_90','missions_10','feathers_100','streak_10']){
  assert.ok(achievements.some(item=>item.id===id),`Falta el logro general ${id}`);
}
assert.ok(achievements.filter(item=>item.unlocked).length>=20,'Los nuevos logros deben poder desbloquearse con métricas reales');

const maniacProgress=snapshotProgress('maniacgrafia',{stats:{totalWords:250,adventureWorld:1}},{},{percentage:0,xp:0},{metrics:{}},{});
assert.equal(maniacProgress.percentage,25,'Maniacgrafía debe derivar progreso de sus palabras correctas aunque no envíe metrics.percentage');
const maniacAdventure=snapshotProgress('maniacgrafia',{stats:{totalWords:0,adventureWorld:6}},{},{percentage:0,xp:0},{metrics:{}},{});
assert.ok(maniacAdventure.percentage>0,'Maniacgrafía debe reflejar el avance de aventura');
const maniacMonotonic=snapshotProgress('maniacgrafia',{stats:{totalWords:20,adventureWorld:1}},{},{percentage:55,xp:0},{metrics:{}},{});
assert.equal(maniacMonotonic.percentage,55,'El progreso de Maniacgrafía no debe retroceder');

console.log('Learning tracking checks: OK');
