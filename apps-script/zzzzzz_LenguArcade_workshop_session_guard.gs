/**
 * LenguArcade - Guard final de acceso.
 *
 * La sesión del taller puede añadir bloqueos, pero nunca debe reactivar en la
 * interfaz un juego que el profesor haya cerrado manualmente en AccesosJuegos.
 */

function getWorkshopSessionGuardClientPatch_() {
  return `
<script>
(function(){
  if(window.__LA_WORKSHOP_SESSION_GUARD__)return;
  window.__LA_WORKSHOP_SESSION_GUARD__=true;
  if(!document.getElementById('games')||typeof renderGames!=='function')return;

  function enforceManualLocks(){
    [].slice.call(document.querySelectorAll('#games .game.locked')).forEach(function(card){
      var button=card.querySelector('.play');
      var chip=card.querySelector('.chip');
      if(button){button.disabled=true;button.textContent='No disponible';}
      if(chip)chip.textContent='🔒 Cerrado por el profesor';
    });
  }

  var baseRenderGames=renderGames;
  renderGames=function(games){
    var result=baseRenderGames(games);
    setTimeout(enforceManualLocks,0);
    return result;
  };
  setTimeout(enforceManualLocks,700);
})();
</script>`;
}

var LA_WORKSHOP_SESSION_GUARD_BASE_BUILD_HTML_OUTPUT_ = buildLenguArcadeHtmlOutput_;
buildLenguArcadeHtmlOutput_ = function(file, title, patchAlumnoGoogle) {
  var output = LA_WORKSHOP_SESSION_GUARD_BASE_BUILD_HTML_OUTPUT_(file, title, patchAlumnoGoogle);
  if (file !== 'LenguArcade_Alumno') return output;
  var content = output.getContent();
  var patch = getWorkshopSessionGuardClientPatch_();
  var html = content.indexOf('</body>') !== -1
    ? content.replace('</body>', patch + '\n</body>')
    : content + patch;
  return HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
};
