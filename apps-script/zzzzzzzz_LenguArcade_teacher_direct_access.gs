/**
 * LenguArcade - Acceso directo al panel del profesor.
 *
 * Evita una segunda confirmación innecesaria:
 * - al abrir ?page=profesor intenta validar automáticamente la cuenta Google activa;
 * - oculta desde <head> el login docente para evitar cualquier parpadeo visual;
 * - si la cuenta está autorizada, entra directamente al panel;
 * - si la validación falla, conserva la pantalla de acceso docente como respaldo;
 * - el botón Salir del panel vuelve a la pantalla general de LenguArcade.
 */

function getLenguArcadeTeacherDirectAccessHeadPatch_() {
  return `
<script>document.documentElement.classList.add('la-teacher-direct-pending');<\/script>
<style id="la-teacher-direct-head-style">
html.la-teacher-direct-pending #loginCard{display:none!important}
html.la-teacher-direct-pending body:before{
  content:'Abriendo panel del profesor…';
  position:fixed;inset:0;z-index:1000;
  display:grid;place-items:center;
  padding:24px;
  background:radial-gradient(circle at 72% 18%,rgba(0,212,255,.16),transparent 30%),radial-gradient(circle at 18% 85%,rgba(124,77,255,.22),transparent 36%),#070b19;
  color:#f5f7ff;
  font:800 17px/1.4 Roboto,Inter,system-ui,Segoe UI,Arial,sans-serif;
  letter-spacing:.1px;
}
html.la-teacher-direct-pending body:after{
  content:'';
  position:fixed;z-index:1001;
  left:50%;top:calc(50% + 38px);
  width:150px;height:6px;
  transform:translateX(-50%);
  border-radius:999px;
  background:linear-gradient(90deg,#00d4ff,#7c4dff,#ff5c8a);
  animation:laTeacherDirectPulse .8s ease-in-out infinite alternate;
}
@keyframes laTeacherDirectPulse{from{opacity:.35;transform:translateX(-50%) scaleX(.55)}to{opacity:1;transform:translateX(-50%) scaleX(1)}}
html.la-teacher-direct-fallback #loginCard{display:block!important}
</style>`;
}

function getLenguArcadeTeacherDirectAccessPatch_() {
  return `
<script>
(function(){
  if(window.__LA_TEACHER_DIRECT_ACCESS_PATCH__)return;
  window.__LA_TEACHER_DIRECT_ACCESS_PATCH__=true;

  if(!document.getElementById('appContent') || document.getElementById('inicio')){
    document.documentElement.classList.remove('la-teacher-direct-pending');
    return;
  }

  var AUTO_KEY='LA_TEACHER_DIRECT_AUTO_ATTEMPT_V1';

  function finishPending(){
    document.documentElement.classList.remove('la-teacher-direct-pending');
  }

  function showFallback(message){
    document.documentElement.classList.add('la-teacher-direct-fallback');
    finishPending();
    var loginCard=document.getElementById('loginCard');
    if(loginCard)loginCard.classList.remove('hidden');
    var status=document.getElementById('loginStatus');
    if(status&&message)status.textContent=message;
  }

  function callApps(name,args){
    if(typeof appsCall==='function')return appsCall(name,args||[]);
    return new Promise(function(resolve,reject){
      google.script.run.withSuccessHandler(resolve).withFailureHandler(reject)[name].apply(null,args||[]);
    });
  }

  async function goToGeneralAccess(){
    try{
      var url=await callApps('getWebAppUrl',[]);
      window.top.location.replace(url);
    }catch(error){
      var href=String(window.location.href||'');
      window.top.location.replace(href.split('?')[0]);
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
    if(!loginCard || !app){finishPending();return;}
    if(!app.classList.contains('hidden')){
      finishPending();
      return;
    }

    try{
      if(sessionStorage.getItem(AUTO_KEY)==='1'){
        showFallback('No se ha podido completar el acceso automático. Pulsa para volver a intentarlo.');
        return;
      }
      sessionStorage.setItem(AUTO_KEY,'1');
    }catch(error){}

    var loginFunction=(typeof loginTeacher==='function')?loginTeacher:null;
    if(!loginFunction){
      showFallback('No se ha podido iniciar automáticamente el panel.');
      return;
    }

    loginCard.classList.add('hidden');
    try{
      await loginFunction();
      var entered=!app.classList.contains('hidden');
      if(entered){
        try{sessionStorage.removeItem(AUTO_KEY);}catch(error){}
        document.documentElement.classList.remove('la-teacher-direct-fallback');
        finishPending();
        if(typeof window.laShowTeacherScreen==='function')window.laShowTeacherScreen('resumen');
      }else{
        showFallback('No se ha podido validar automáticamente tu cuenta de profesor.');
      }
    }catch(error){
      showFallback(error.message||String(error));
    }finally{
      if(typeof hideLoader==='function')hideLoader();
    }
  }

  installTeacherLogout();

  // El HTML ya llega visualmente bloqueado desde <head>, así que podemos dejar
  // que el boot original recupere una sesión guardada sin enseñar el login.
  var hasStoredSession=false;
  try{hasStoredSession=!!localStorage.getItem('LA_TEACHER_SUPABASE_SESSION');}catch(error){}
  setTimeout(function(){
    installTeacherLogout();
    var app=document.getElementById('appContent');
    if(app && !app.classList.contains('hidden')){
      try{sessionStorage.removeItem(AUTO_KEY);}catch(error){}
      finishPending();
      return;
    }
    autoEnterTeacher();
  },hasStoredSession?550:0);
})();
</script>`;
}

var LA_TEACHER_DIRECT_ACCESS_BASE_BUILD_HTML_OUTPUT_ = buildLenguArcadeHtmlOutput_;
buildLenguArcadeHtmlOutput_ = function(file, title, patchAlumnoGoogle) {
  var output = LA_TEACHER_DIRECT_ACCESS_BASE_BUILD_HTML_OUTPUT_(file, title, patchAlumnoGoogle);
  if (file !== 'LenguArcade_Profesor') return output;
  var content = output.getContent();
  var headPatch = getLenguArcadeTeacherDirectAccessHeadPatch_();
  var bodyPatch = getLenguArcadeTeacherDirectAccessPatch_();
  var html = content;
  if (html.indexOf('</head>') !== -1) html = html.replace('</head>', headPatch + '\n</head>');
  else html = headPatch + html;
  if (html.indexOf('</body>') !== -1) html = html.replace('</body>', bodyPatch + '\n</body>');
  else html += bodyPatch;
  return HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
};
