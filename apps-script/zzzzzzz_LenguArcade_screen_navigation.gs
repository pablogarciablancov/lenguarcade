/**
 * LenguArcade - Navegación por pantallas y logout moderno.
 *
 * Capa final de interfaz:
 * - al salir como alumno vuelve siempre al acceso Google actual;
 * - alumno y profesor muestran una única sección del menú cada vez;
 * - no altera datos, progreso, autenticación de servidor ni mecánicas de juegos.
 */

function getLenguArcadeScreenNavigationPatch_() {
  return `
<style id="la-screen-navigation-style">
@keyframes laScreenIn{from{opacity:.35;transform:translateY(5px)}to{opacity:1;transform:none}}

/* Alumno: una pantalla por opción de menú. */
body.la-screen-nav #inicio,
body.la-screen-nav #juegos,
body.la-screen-nav #misiones,
body.la-screen-nav #ranking,
body.la-screen-nav #perfil{display:none!important}
body.la-screen-nav #inicio.la-screen-active{display:grid!important;animation:laScreenIn .16s ease}
body.la-screen-nav #juegos.la-screen-active,
body.la-screen-nav #misiones.la-screen-active,
body.la-screen-nav #ranking.la-screen-active,
body.la-screen-nav #perfil.la-screen-active{display:block!important;animation:laScreenIn .16s ease}
body.la-screen-nav .layout{display:none!important}
body.la-screen-nav[data-la-screen="juegos"] .layout,
body.la-screen-nav[data-la-screen="misiones"] .layout,
body.la-screen-nav[data-la-screen="ranking"] .layout{display:block!important}
body.la-screen-nav[data-la-screen="juegos"] .sidePanels{display:none!important}
body.la-screen-nav[data-la-screen="misiones"] .sidePanels,
body.la-screen-nav[data-la-screen="ranking"] .sidePanels{display:block!important}
body.la-screen-nav[data-la-screen="misiones"] .sidePanels,
body.la-screen-nav[data-la-screen="ranking"] .sidePanels{width:100%;max-width:none}
body.la-screen-nav[data-la-screen="perfil"] #perfil{margin-top:0}

/* Profesor: una pantalla por opción de menú. */
body.la-teacher-screen-nav #resumen,
body.la-teacher-screen-nav #alumnos,
body.la-teacher-screen-nav #juegos,
body.la-teacher-screen-nav #errores,
body.la-teacher-screen-nav #classroom,
body.la-teacher-screen-nav #taller{display:none!important}
body.la-teacher-screen-nav #resumen.la-screen-active,
body.la-teacher-screen-nav #alumnos.la-screen-active,
body.la-teacher-screen-nav #juegos.la-screen-active,
body.la-teacher-screen-nav #errores.la-screen-active,
body.la-teacher-screen-nav #classroom.la-screen-active,
body.la-teacher-screen-nav #taller.la-screen-active{display:block!important;animation:laScreenIn .16s ease}
body.la-teacher-screen-nav #appContent>.layout,
body.la-teacher-screen-nav #appContent>.cols{display:none!important}
body.la-teacher-screen-nav[data-la-screen="alumnos"] #appContent>.layout,
body.la-teacher-screen-nav[data-la-screen="juegos"] #appContent>.layout{display:block!important}
body.la-teacher-screen-nav[data-la-screen="resumen"] #appContent>[data-la-summary-extra="1"]{display:grid!important}
body.la-teacher-screen-nav[data-la-screen="errores"] #appContent>[data-la-tools-group="1"],
body.la-teacher-screen-nav[data-la-screen="classroom"] #appContent>[data-la-tools-group="1"]{display:block!important}
body.la-teacher-screen-nav #appContent>.layout>.card,
body.la-teacher-screen-nav #appContent>[data-la-tools-group="1"]>.card{width:100%;max-width:none}

@media(max-width:1160px){
  body.la-screen-nav .main,
  body.la-teacher-screen-nav .main{overflow:visible}
}
</style>
<script>
(function(){
  if(window.__LA_SCREEN_NAVIGATION_PATCH__)return;
  window.__LA_SCREEN_NAVIGATION_PATCH__=true;

  function activateMenuButton(target){
    var nav=document.querySelector('.nav');
    if(!nav)return;
    [].slice.call(nav.querySelectorAll('button[data-target]')).forEach(function(button){
      button.classList.toggle('active',String(button.dataset.target||'')===String(target||''));
    });
  }

  function installNavCapture(showPage){
    var nav=document.querySelector('.nav');
    if(!nav||nav.dataset.laScreenNavigation==='1')return;
    nav.dataset.laScreenNavigation='1';
    nav.addEventListener('click',function(event){
      var button=event.target&&event.target.closest?event.target.closest('button[data-target]'):null;
      if(!button||!nav.contains(button))return;
      event.preventDefault();
      event.stopImmediatePropagation();
      showPage(button.dataset.target);
    },true);
  }

  function installStudentNavigation(){
    if(!document.getElementById('inicio')||!document.getElementById('games'))return false;
    var allowed=['inicio','juegos','misiones','ranking','perfil'];
    document.body.classList.add('la-screen-nav');

    window.laShowStudentScreen=function(target){
      target=allowed.indexOf(String(target||''))!==-1?String(target):'inicio';
      document.body.setAttribute('data-la-screen',target);
      allowed.forEach(function(id){
        var element=document.getElementById(id);
        if(element)element.classList.toggle('la-screen-active',id===target);
      });
      activateMenuButton(target);
      try{localStorage.setItem('LA_STUDENT_SCREEN',target);}catch(error){}
      var main=document.querySelector('.main');
      if(main&&typeof main.scrollTo==='function')main.scrollTo({top:0,behavior:'auto'});
      window.scrollTo(0,0);
    };

    installNavCapture(window.laShowStudentScreen);

    var baseReveal=(typeof window.revealStudentApp==='function')?window.revealStudentApp:null;
    if(baseReveal&&!baseReveal.__laScreenPatched){
      var patchedReveal=function(){
        var result=baseReveal.apply(this,arguments);
        var target='inicio';
        try{target=localStorage.getItem('LA_STUDENT_SCREEN')||'inicio';}catch(error){}
        window.laShowStudentScreen(target);
        return result;
      };
      patchedReveal.__laScreenPatched=true;
      window.revealStudentApp=patchedReveal;
      try{revealStudentApp=patchedReveal;}catch(error){}
    }

    var baseLogout=(typeof window.secureStudentLogout==='function')?window.secureStudentLogout:(typeof secureStudentLogout==='function'?secureStudentLogout:null);
    if(baseLogout&&!baseLogout.__laGoogleLogoutPatched){
      var patchedLogout=function(){
        var result=baseLogout.apply(this,arguments);
        try{localStorage.setItem('LA_STUDENT_SCREEN','inicio');}catch(error){}
        window.laShowStudentScreen('inicio');
        setTimeout(function(){
          try{
            if(typeof window.mountGoogleStudentLogin==='function'){
              window.mountGoogleStudentLogin();
              var status=document.querySelector('#loginCard [data-google-auth-status]');
              if(status)status.textContent='Sesión cerrada. Entra de nuevo con tu cuenta Google del colegio.';
            }
          }catch(error){console.warn('No se pudo reconstruir el acceso Google tras salir.',error);}
        },0);
        return result;
      };
      patchedLogout.__laGoogleLogoutPatched=true;
      window.secureStudentLogout=patchedLogout;
      try{secureStudentLogout=patchedLogout;}catch(error){}
      try{logout=patchedLogout;}catch(error){}
      var logoutButton=document.getElementById('logoutBtn');
      if(logoutButton)logoutButton.onclick=patchedLogout;
    }

    window.laShowStudentScreen('inicio');
    return true;
  }

  function markTeacherGroups(){
    var app=document.getElementById('appContent');
    if(!app)return;
    var cols=[];
    [].slice.call(app.children).forEach(function(child){
      if(child.classList&&child.classList.contains('cols'))cols.push(child);
    });
    if(cols[0])cols[0].setAttribute('data-la-summary-extra','1');
    if(cols[1])cols[1].setAttribute('data-la-tools-group','1');
  }

  function installTeacherNavigation(){
    if(!document.getElementById('appContent')||document.getElementById('inicio'))return false;
    var allowed=['resumen','taller','alumnos','juegos','errores','classroom'];
    document.body.classList.add('la-teacher-screen-nav');
    markTeacherGroups();

    window.laShowTeacherScreen=function(target){
      target=allowed.indexOf(String(target||''))!==-1?String(target):'resumen';
      if(target==='taller'&&!document.getElementById('taller'))target='resumen';
      document.body.setAttribute('data-la-screen',target);
      allowed.forEach(function(id){
        var element=document.getElementById(id);
        if(element)element.classList.toggle('la-screen-active',id===target);
      });
      markTeacherGroups();
      activateMenuButton(target);
      try{localStorage.setItem('LA_TEACHER_SCREEN',target);}catch(error){}
      var main=document.querySelector('.main');
      if(main&&typeof main.scrollTo==='function')main.scrollTo({top:0,behavior:'auto'});
      window.scrollTo(0,0);
    };

    installNavCapture(window.laShowTeacherScreen);
    var target='resumen';
    try{target=localStorage.getItem('LA_TEACHER_SCREEN')||'resumen';}catch(error){}
    window.laShowTeacherScreen(target);

    var app=document.getElementById('appContent');
    if(app&&typeof MutationObserver!=='undefined'){
      var observer=new MutationObserver(function(){
        markTeacherGroups();
        var current=document.body.getAttribute('data-la-screen')||'resumen';
        if(current==='taller'&&document.getElementById('taller'))window.laShowTeacherScreen('taller');
      });
      observer.observe(app,{childList:true});
    }
    return true;
  }

  if(!installStudentNavigation())installTeacherNavigation();
})();
</script>`;
}

// Capa final: se carga después del taller y del guard de sesión.
var LA_SCREEN_NAVIGATION_BASE_BUILD_HTML_OUTPUT_ = buildLenguArcadeHtmlOutput_;
buildLenguArcadeHtmlOutput_ = function(file, title, patchAlumnoGoogle) {
  var output = LA_SCREEN_NAVIGATION_BASE_BUILD_HTML_OUTPUT_(file, title, patchAlumnoGoogle);
  if (file !== 'LenguArcade_Alumno' && file !== 'LenguArcade_Profesor') return output;
  var content = output.getContent();
  var patch = getLenguArcadeScreenNavigationPatch_();
  var html = content.indexOf('</body>') !== -1
    ? content.replace('</body>', patch + '\n</body>')
    : content + patch;
  return HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
};
