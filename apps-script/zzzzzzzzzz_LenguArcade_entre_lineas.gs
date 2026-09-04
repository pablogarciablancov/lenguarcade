/**
 * LenguArcade · Entre Líneas
 * Integración reversible del juego de comprensión lectora con catálogo,
 * launcher embebido, progreso central y diagnóstico docente.
 */
var LA_ENTRE_LINEAS_GAME_ = {
  gameId:'entre_lineas',
  nombre:'Entre Líneas',
  subtitulo:'Agencia de Investigación Lectora',
  categoria:'Comprensión lectora',
  competencias:'comprension,inferencia,sintesis,analisis,coherencia,vocabulario',
  estado:'beta',
  orden:9,
  color:'#d7a942',
  icono:'🔎',
  url:'https://raw.githack.com/pablogarciablancov/lenguarcade/main/games/entre_lineas/',
  descripcion:'Investiga documentos, conecta pistas y demuestra tus hipótesis con evidencias.',
  banner:'entre_lineas',
  activo:true
};

if (typeof LA_GAME_INTEGRATIONS !== 'undefined') {
  LA_GAME_INTEGRATIONS.entre_lineas = {
    url:LA_ENTRE_LINEAS_GAME_.url,
    integration:'embedded'
  };
}

var LA_ENTRE_LINEAS_BASE_GET_ACTIVE_GAMES_ = getActiveGames_;
getActiveGames_ = function() {
  var games = LA_ENTRE_LINEAS_BASE_GET_ACTIVE_GAMES_().slice();
  if (!games.some(function(game) { return String(game.gameId || '').toLowerCase() === 'entre_lineas'; })) {
    games.push(Object.assign({}, LA_ENTRE_LINEAS_GAME_));
  }
  return games.sort(function(a,b) { return Number(a.orden || 0) - Number(b.orden || 0); });
};

var LA_ENTRE_LINEAS_BASE_FIND_GAME_ = findGame_;
findGame_ = function(gameId) {
  var found = LA_ENTRE_LINEAS_BASE_FIND_GAME_(gameId);
  if (found) return found;
  return String(gameId || '').toLowerCase() === 'entre_lineas'
    ? Object.assign({}, LA_ENTRE_LINEAS_GAME_)
    : null;
};

function getEntreLineasAlumnoPatch_() {
  return "\n<script>\n(function(){\n"+
    "if(window.__LA_ENTRE_LINEAS_STUDENT_PATCH__)return;window.__LA_ENTRE_LINEAS_STUDENT_PATCH__=true;\n"+
    "if(typeof LA_EMBEDDED_GAME_OVERRIDES==='object'){LA_EMBEDDED_GAME_OVERRIDES.entre_lineas={url:'"+LA_ENTRE_LINEAS_GAME_.url+"',integration:'embedded',estado:'beta',nombre:'Entre Líneas',subtitulo:'Agencia de Investigación Lectora',categoria:'Comprensión lectora',descripcion:'Investiga documentos, conecta pistas y demuestra tus hipótesis con evidencias.',icono:'🔎'};}\n"+
    "if(typeof buildCentralProgress==='function'){var base=buildCentralProgress;buildCentralProgress=function(result,gameRecord){\n"+
    "if(gameRecord&&gameRecord.gameId==='entre_lineas'){var old=gameRecord.progress||{},m=result.metrics||{};var correct=Math.max(0,Number(result.correct||0)),errors=Math.max(0,Number(result.errors||0));var attempts=Number(old.attempts||0)+correct+errors,successes=Number(old.successes||0)+correct,totalErrors=Number(old.errors||0)+errors;var accuracy=attempts?Math.round(successes/attempts*100):Number(old.accuracy||0);var percentage=Math.max(Number(old.percentage||0),Math.max(0,Math.min(100,Number(result.percentage||0))));var xpDelta=Math.min(500,Math.max(0,Number(result.xpGain||0)));var score=Math.max(0,Math.min(100,Number(m.taskScore||0)));return {xpDelta:xpDelta,plumasDelta:result.outcome==='solved'?Math.max(1,Math.min(8,Math.round(score/25))):0,percentage:percentage,accuracy:accuracy,attempts:attempts,successes:successes,errors:totalErrors,streak:Math.max(Number(old.streak||0),Number(m.keyConnections||0))};}\n"+
    "return base(result,gameRecord);};}\n"+
    "})();\n<\/script>";
}

function getEntreLineasTeacherPatch_() {
  return "\n<style>"+
    ".elTeacherBox{margin-top:14px;padding:16px;border:1px solid rgba(215,169,66,.3);border-radius:18px;background:linear-gradient(135deg,rgba(215,169,66,.08),rgba(102,167,217,.07))}"+
    ".elTeacherGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.elMetric{padding:9px;border:1px solid var(--line);border-radius:12px;background:rgba(0,0,0,.13)}.elMetric span{display:block;color:var(--muted);font-size:10px}.elMetric b{font-size:17px}.elSkills{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}.elSkill{padding:8px 10px;border-radius:10px;background:rgba(0,0,0,.12)}.elSkill small{display:block;color:var(--muted)}@media(max-width:800px){.elTeacherGrid,.elSkills{grid-template-columns:repeat(2,1fr)}}"+
    "</style><script>(function(){if(window.__LA_ENTRE_LINEAS_TEACHER_PATCH__)return;window.__LA_ENTRE_LINEAS_TEACHER_PATCH__=true;"+
    "function readRaw(row){try{return typeof row.rawJson==='string'?JSON.parse(row.rawJson||'{}'):(row.rawJson||{});}catch(e){return {};}}"+
    "function escEL(v){return String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}"+
    "function renderEL(detail){var root=document.getElementById('studentDetailProgress');if(!root)return;var old=document.getElementById('elTeacherBox');if(old)old.remove();var row=(detail.progress||[]).find(function(x){return String(x.gameId)==='entre_lineas';});if(!row)return;var raw=readRaw(row),m=raw.metrics||(raw.rawGameData&&raw.rawGameData.metrics)||{},save=raw.save||(raw.rawGameData&&raw.rawGameData.save)||{},skills=m.skills||(save.profile&&save.profile.skills)||{};if(!Number(row.sessions||0)&&!m.caseId)return;var labels={observation:'Observación',inference:'Inferencia',connection:'Conexión',context:'Contexto',synthesis:'Síntesis',analysis:'Análisis'};var vals=Object.keys(labels).map(function(k){return [k,Number(skills[k]||0)];});var low=vals.slice().sort(function(a,b){return a[1]-b[1];})[0];var metrics=[['Expediente',m.caseId||'—'],['Pistas relevantes',(m.cluesImportant||0)+'/'+(m.cluesTotal||0)],['Conexiones clave',m.keyConnections||0],['Pruebas',Math.round(Number(m.taskScore||0))+'%'],['Ayudas',m.hints||0],['Intentos finales',m.finalAttempts||0],['Notas',m.notesLength||0],['XP',row.xp||0]];var box=document.createElement('section');box.id='elTeacherBox';box.className='elTeacherBox';box.innerHTML='<strong>🔎 Entre Líneas · diagnóstico lector</strong><div class="sub">Última investigación y perfil de comprensión acumulado.</div><div class="elTeacherGrid">'+metrics.map(function(x){return '<div class="elMetric"><span>'+escEL(x[0])+'</span><b>'+escEL(x[1])+'</b></div>';}).join('')+'</div><div class="elSkills">'+vals.map(function(x){return '<div class="elSkill"><small>'+labels[x[0]]+'</small><b>'+Math.round(x[1])+'</b></div>';}).join('')+'</div><div class="sub" style="margin-top:10px">'+(low&&low[1]>0?'Área que conviene reforzar: '+labels[low[0]]+'.':'Completa más expedientes para obtener un diagnóstico estable.')+'</div>';root.parentNode.insertBefore(box,root.nextSibling);}"+
    "function install(){if(typeof renderStudentDetail!=='function'){setTimeout(install,100);return;}var base=renderStudentDetail;renderStudentDetail=function(detail){var v=base(detail);setTimeout(function(){renderEL(detail||{});},0);return v;};}install();})();<\/script>";
}

var LA_ENTRE_LINEAS_BASE_BUILD_HTML_OUTPUT_ = buildLenguArcadeHtmlOutput_;
buildLenguArcadeHtmlOutput_ = function(file, title, patchAlumnoGoogle) {
  var output = LA_ENTRE_LINEAS_BASE_BUILD_HTML_OUTPUT_(file, title, patchAlumnoGoogle);
  if (file !== 'LenguArcade_Alumno' && file !== 'LenguArcade_Profesor') return output;
  var content = output.getContent();
  var patch = file === 'LenguArcade_Alumno' ? getEntreLineasAlumnoPatch_() : getEntreLineasTeacherPatch_();
  var html = content.indexOf('</body>') !== -1 ? content.replace('</body>', patch + '\n</body>') : content + patch;
  return HtmlService.createHtmlOutput(html).setTitle(title).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
};
