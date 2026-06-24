/**
 * Parche mínimo para Battlegrafía dentro de LenguArcade.
 *
 * Objetivo:
 * - No tocar la web original del alumno.
 * - No tocar Narratoria ni otros juegos.
 * - Mantener el puente embebido de LenguArcade, pero reforzar el perfil que recibe Battlegrafía.
 *
 * Motivo:
 * Battlegrafía puede esperar nombres de campo distintos según la versión
 * del juego/adaptador: student, profile, user, name, fullName, classCode, etc.
 * Con el login Google/profe-jugador el perfil existe, pero si el juego no reconoce
 * esos campos puede caer en un perfil genérico.
 */

const __LA_BUILD_HTML_OUTPUT_WITH_GOOGLE_LOGIN__ = buildLenguArcadeHtmlOutput_;

buildLenguArcadeHtmlOutput_ = function(file, title, patchAlumnoGoogle) {
  let output = __LA_BUILD_HTML_OUTPUT_WITH_GOOGLE_LOGIN__(file, title, patchAlumnoGoogle);
  if (file !== 'LenguArcade_Alumno' || !patchAlumnoGoogle) return output;

  const content = output.getContent();
  const patch = getBattlegrafiaLenguArcadeProfilePatch_();
  return HtmlService.createHtmlOutput(
    content.indexOf('</body>') !== -1
      ? content.replace('</body>', patch + '\n</body>')
      : content + patch
  )
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
};

function getBattlegrafiaLenguArcadeProfilePatch_() {
  return `
<script>
(function(){
  if(window.__LA_BATTLEGRAFIA_PROFILE_PATCH__) return;
  window.__LA_BATTLEGRAFIA_PROFILE_PATCH__ = true;

  function cleanText(value){
    return String(value == null ? '' : value).trim();
  }

  function isBattlegrafiaGame(game){
    return String(game && game.gameId || '').toLowerCase() === 'battlegrafia';
  }

  function getProfileSource(explicit){
    return explicit ||
      (window.currentDashboard && window.currentDashboard.student) ||
      (typeof currentDashboard !== 'undefined' && currentDashboard && currentDashboard.student) ||
      {};
  }

  function buildLenguArcadeProfile(explicitStudent){
    const source = getProfileSource(explicitStudent);
    const nombre = cleanText(source.nombre || source.firstName || source.given_name || source.givenName);
    const apellidos = cleanText(source.apellidos || source.lastName || source.family_name || source.familyName);
    const email = cleanText(source.email || source.mail || source.userEmail).toLowerCase();
    const localPart = email ? email.split('@')[0] : '';
    const explicitName = cleanText(source.name || source.fullName || source.displayName || source.playerName);
    const fullName = cleanText(explicitName || [nombre, apellidos].filter(Boolean).join(' ') || localPart || 'Jugador');
    const studentId = cleanText(source.studentId || source.student_id || source.id || source.profileId || localPart || '');
    const clase = cleanText(source.clase || source.classCode || source.className || source.group || source.course || '');
    const isTeacherPlayer = !!(
      source.teacherPlayer ||
      source.isTeacherPlayer ||
      clase === 'PROFES' ||
      (email && /@fomento\.edu$/i.test(email) && !/@alumno\.fomento\.edu$/i.test(email))
    );

    return Object.assign({}, source, {
      schema: 'lenguarcade-profile-v1',
      source: 'LenguArcade',
      role: isTeacherPlayer ? 'teacher-player' : (source.role || 'student'),
      teacherPlayer: isTeacherPlayer,
      isTeacherPlayer: isTeacherPlayer,
      studentId: studentId,
      student_id: studentId,
      profileId: studentId,
      id: studentId,
      email: email,
      mail: email,
      userEmail: email,
      nombre: nombre || fullName,
      apellidos: apellidos,
      name: fullName,
      fullName: fullName,
      displayName: fullName,
      playerName: fullName,
      username: localPart,
      clase: clase,
      classCode: clase,
      className: clase,
      group: clase,
      course: source.curso || source.course || clase
    });
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
      if(!next.save.studentId) next.save.studentId = profile.studentId;
      if(!next.save.profileId) next.save.profileId = profile.profileId;
      if(!next.save.email) next.save.email = profile.email;
      if(!next.save.playerName) next.save.playerName = profile.playerName;
      if(!next.save.name) next.save.name = profile.playerName;
      if(!next.save.clase) next.save.clase = profile.clase;
      if(!next.save.classCode) next.save.classCode = profile.classCode;
    }

    return next;
  }

  function addBattlegrafiaProfileToUrl(runner){
    try{
      if(!runner || !isBattlegrafiaGame(runner.game) || !runner.url) return runner;
      const profile = buildLenguArcadeProfile();
      const url = new URL(runner.url);
      url.searchParams.set('laProfile', '1');
      url.searchParams.set('studentId', profile.studentId || '');
      url.searchParams.set('profileId', profile.profileId || '');
      url.searchParams.set('studentName', profile.playerName || '');
      url.searchParams.set('playerName', profile.playerName || '');
      url.searchParams.set('studentEmail', profile.email || '');
      url.searchParams.set('classCode', profile.classCode || '');
      url.searchParams.set('teacherPlayer', profile.isTeacherPlayer ? '1' : '0');
      runner.url = url.toString();
    }catch(error){
      console.warn('No se pudo añadir el perfil de LenguArcade a la URL de Battlegrafía.', error);
    }
    return runner;
  }

  function installPatch(){
    if(typeof sendToActiveGame === 'function' && !sendToActiveGame.__battlegrafiaProfilePatched){
      const originalSendToActiveGame = sendToActiveGame;
      const patchedSendToActiveGame = function(type, payload){
        let nextPayload = payload || {};
        try{
          const runner = (typeof activeGameRunner !== 'undefined') ? activeGameRunner : null;
          if(type === 'INIT' && runner && isBattlegrafiaGame(runner.game)){
            nextPayload = enrichInitPayload(nextPayload);
          }
        }catch(error){
          console.warn('No se pudo normalizar el perfil para Battlegrafía.', error);
        }
        return originalSendToActiveGame(type, nextPayload);
      };
      patchedSendToActiveGame.__battlegrafiaProfilePatched = true;
      sendToActiveGame = patchedSendToActiveGame;
      window.sendToActiveGame = patchedSendToActiveGame;
    }

    if(typeof prepareEmbeddedGame === 'function' && !prepareEmbeddedGame.__battlegrafiaProfilePatched){
      const originalPrepareEmbeddedGame = prepareEmbeddedGame;
      const patchedPrepareEmbeddedGame = function(game){
        const runner = originalPrepareEmbeddedGame(game);
        return addBattlegrafiaProfileToUrl(runner);
      };
      patchedPrepareEmbeddedGame.__battlegrafiaProfilePatched = true;
      prepareEmbeddedGame = patchedPrepareEmbeddedGame;
      window.prepareEmbeddedGame = patchedPrepareEmbeddedGame;
    }
  }

  installPatch();
  setTimeout(installPatch, 0);
  setTimeout(installPatch, 250);
})();
</script>`;
}
