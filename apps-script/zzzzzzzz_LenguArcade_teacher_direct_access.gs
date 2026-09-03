/**
 * LenguArcade - Acceso directo al panel del profesor.
 *
 * Evita una segunda confirmación innecesaria:
 * - al abrir ?page=profesor intenta validar automáticamente la cuenta Google activa;
 * - si la cuenta está autorizada, entra directamente al panel;
 * - si la validación falla, conserva la pantalla de acceso docente como respaldo;
 * - el botón Salir del panel vuelve a la pantalla general de LenguArcade.
 */

function getLenguArcadeTeacherDirectAccessPatch_() {
  return `
<script>
(function(){
  if(window.__LA_TEACHER_DIRECT_ACCESS_PATCH__)return;
  window.__LA_TEACHER_DIRECT_ACCESS_PATCH__=true;

  if(!document.getElementById('appContent') || document.getElementById('inicio'))return;

  var AUTO_KEY='LA_TEACHER_DIRECT_AUTO_ATTEMPT_V1';

  function callApps(name,args){
    if(typeof appsCall==='function')return appsCall(name,args||[]);
    return new Promise(function(resolve,reject){
      google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[name].apply(null,args||[]);
    });
  }

  async function goToGeneralAccess(){
    try{
      var url=await callApps('getWebAppUrl',[]);
      window.top.location.href=url;
    }catch(error){
      var href=String(window.location.href||'');
      window.top.location.href=href.split('?')[0];
    }
  }

  function installTeacherLogout(){
    var button=document.getElementById('logoutBtn');
    if(!button || button.dataset.laDirectLogout==='1')return;
    button.dataset.laDirectLogout='1';
    var originalLogout=(typeof logout==='function')?logout:null;
    button.onclick=function(){
      try{sessionStorage.removeItem(AUTO_KEY);}catch(error){}
      try{
        if(originalLogout)originalLogout();
        else{
          try{localStorage.removeItem('LA_TEACHER_SUPABASE_SESSION');}catch(error){}
        }
      }catch(error){console.warn('No se pudo cerrar completamente la sesión del profesor.',error);}
      goToGeneralAccess();
    };
  }

  async function autoEnterTeacher(){
    var loginCard=document.getElementById('loginCard');
    var app=document.getElementById('appContent');
    if(!loginCard || !app)return;
    if(!app.classList.contains('hidden'))return;

    try{
      if(sessionStorage.getItem(AUTO_KEY)==='1')return;
      sessionStorage.setItem(AUTO_KEY,'1');
    }catch(error){}

    var loginFunction=(typeof loginTeacher==='function')?loginTeacher:null;
    if(!loginFunction)return;

    loginCard.classList.add('hidden');
    try{
      if(typeof showLoader==='function')showLoader('Entrando al panel del profesor...');
      await loginFunction();
      var entered=!app.classList.contains('hidden');
      if(entered){
        try{sessionStorage.removeItem(AUTO_KEY);}catch(error){}
        if(typeof window.laShowTeacherScreen==='function')window.laShowTeacherScreen('resumen');
      }else{
        loginCard.classList.remove('hidden');
      }
    }catch(error){
      loginCard.classList.remove('hidden');
      var status=document.getElementById('loginStatus');
      if(status)status.textContent=error.message||String(error);
    }finally{
      if(typeof hideLoader==='function')hideLoader();
    }
  }

  installTeacherLogout();

  // El script original ya ha iniciado su boot cuando llega esta capa.
  // Si existe una sesión guardada le damos un instante para recuperarla;
  // si no existe, validamos inmediatamente la cuenta Google activa.
  var hasStoredSession=false;
  try{hasStoredSession=!!localStorage.getItem('LA_TEACHER_SUPABASE_SESSION');}catch(error){}
  setTimeout(function(){
    installTeacherLogout();
    var app=document.getElementById('appContent');
    if(app && app.classList.contains('hidden'))autoEnterTeacher();
  },hasStoredSession?550:0);
})();
</script>`;
}

var LA_TEACHER_DIRECT_ACCESS_BASE_BUILD_HTML_OUTPUT_ = buildLenguArcadeHtmlOutput_;
buildLenguArcadeHtmlOutput_ = function(file, title, patchAlumnoGoogle) {
  var output = LA_TEACHER_DIRECT_ACCESS_BASE_BUILD_HTML_OUTPUT_(file, title, patchAlumnoGoogle);
  if (file !== 'LenguArcade_Profesor') return output;
  var content = output.getContent();
  var patch = getLenguArcadeTeacherDirectAccessPatch_();
  var html = content.indexOf('</body>') !== -1
    ? content.replace('</body>', patch + '\n</body>')
    : content + patch;
  return HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
};
