/**
 * LenguArcade · Rayuela
 * Adaptador reversible del editor de aventuras.
 * Reutiliza usuarios, XP, guardado, panel docente y controles de taller.
 */
var LA_RAYUELA_GAME_ = {
  gameId:'rayuela',
  nombre:'Rayuela',
  subtitulo:'Tu historia. Tus decisiones.',
  categoria:'Escritura',
  competencias:'narracion,creatividad,redaccion,coherencia,planificacion',
  estado:'beta',
  orden:8,
  color:'#55d8ff',
  icono:'🧭',
  url:'https://raw.githack.com/pablogarciablancov/lenguarcade/main/games/rayuela/',
  descripcion:'Crea una aventura interactiva con decisiones, caminos alternativos, finales y secretos.',
  banner:'rayuela',
  activo:true
};

LA_GAME_INTEGRATIONS.rayuela = {
  url:LA_RAYUELA_GAME_.url,
  integration:'embedded',
  estado:'beta',
  nombre:LA_RAYUELA_GAME_.nombre,
  subtitulo:LA_RAYUELA_GAME_.subtitulo,
  categoria:LA_RAYUELA_GAME_.categoria,
  descripcion:LA_RAYUELA_GAME_.descripcion,
  icono:LA_RAYUELA_GAME_.icono,
  color:LA_RAYUELA_GAME_.color
};

// Las instalaciones existentes pueden tener una hoja Juegos anterior a Rayuela.
// La añadimos de forma virtual sin ejecutar inicializadores destructivos.
var LA_RAYUELA_BASE_GET_ACTIVE_GAMES_ = getActiveGames_;
getActiveGames_ = function() {
  var games = LA_RAYUELA_BASE_GET_ACTIVE_GAMES_().slice();
  var exists = games.some(function(game) {
    return String(game.gameId || '').toLowerCase() === 'rayuela';
  });
  if (!exists) games.push(Object.assign({}, LA_RAYUELA_GAME_));
  return games.sort(function(a,b) {
    return Number(a.orden || 0) - Number(b.orden || 0);
  });
};

var LA_RAYUELA_BASE_FIND_GAME_ = findGame_;
findGame_ = function(gameId) {
  if (String(gameId || '').toLowerCase() === 'rayuela') {
    return LA_RAYUELA_BASE_FIND_GAME_(gameId) || Object.assign({}, LA_RAYUELA_GAME_);
  }
  return LA_RAYUELA_BASE_FIND_GAME_(gameId);
};

function getRayuelaStudentPatch_() {
  return `
<script>
(function(){
  if(window.__LA_RAYUELA_PROGRESS_PATCH__)return;
  window.__LA_RAYUELA_PROGRESS_PATCH__=true;
  function num(value,fallback){var n=Number(value);return Number.isFinite(n)?n:(fallback||0);}
  function install(){
    if(typeof buildCentralProgress!=='function'){setTimeout(install,80);return;}
    var base=buildCentralProgress;
    buildCentralProgress=function(result,gameRecord){
      if(gameRecord&&String(gameRecord.gameId||'').toLowerCase()==='rayuela'){
        var old=gameRecord.progress||{};
        var save=result&&result.save&&typeof result.save==='object'?result.save:{};
        var metrics=result&&result.metrics&&typeof result.metrics==='object'?result.metrics:(save.metrics||{});
        var nodes=Math.max(0,num(metrics.nodes,result&&result.correct));
        var choices=Math.max(0,num(metrics.choices,0));
        var structuralErrors=Math.max(0,num(metrics.structuralErrors,result&&result.errors));
        if(!structuralErrors&&result&&Array.isArray(result.issues))structuralErrors=result.issues.length;
        var attempts=Math.max(num(old.attempts,0),Math.max(1,nodes+choices));
        var successes=Math.max(num(old.successes,0),Math.max(0,attempts-structuralErrors));
        var currentXp=Math.max(0,num(save.xp,num(result&&result.xpGain,num(result&&result.score,0))));
        var oldXp=Math.max(0,num(old.xp,0));
        var complexity=Math.max(0,num(metrics.complexity,num(metrics.stars,0)));
        var pct=Math.max(num(old.percentage,0),num(result&&result.percentage,0),Math.min(100,complexity*20));
        return {
          xpDelta:Math.min(600,Math.max(0,currentXp-oldXp)),
          plumasDelta:String(result&&result.outcome||'')==='submitted'?5:0,
          percentage:Math.max(0,Math.min(100,pct)),
          accuracy:attempts?Math.max(0,Math.min(100,Math.round(successes/attempts*100))):100,
          attempts:attempts,
          successes:successes,
          errors:Math.max(num(old.errors,0),structuralErrors),
          streak:Math.max(num(old.streak,0),num(metrics.endings,0))
        };
      }
      return base(result,gameRecord);
    };
  }
  install();
})();
</script>`;
}

function getRayuelaTeacherPatch_() {
  return `
<style>
.rayuelaTeacherBox{margin-top:12px;padding:14px;border:1px solid rgba(85,216,255,.25);border-radius:16px;background:linear-gradient(135deg,rgba(85,216,255,.08),rgba(167,139,250,.08))}
.rayuelaTeacherGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:10px}
.rayuelaTeacherMetric{padding:9px;border:1px solid var(--line);border-radius:12px;background:rgba(0,0,0,.13)}
.rayuelaTeacherMetric span{display:block;color:var(--muted);font-size:10px}.rayuelaTeacherMetric b{font-size:18px}
@media(max-width:760px){.rayuelaTeacherGrid{grid-template-columns:repeat(2,1fr)}}
</style>
<script>
(function(){
  if(window.__LA_RAYUELA_TEACHER_PATCH__)return;
  window.__LA_RAYUELA_TEACHER_PATCH__=true;
  function escapeR(value){return String(value==null?'':value).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function readRaw(row){try{return typeof row.rawJson==='string'?JSON.parse(row.rawJson||'{}'):(row.rawJson||{});}catch(e){return {};}}
  function addRayuelaDetail(detail){
    var root=document.getElementById('studentDetailProgress');
    if(!root||!detail||!Array.isArray(detail.progress))return;
    var row=detail.progress.find(function(item){return String(item.gameId)==='rayuela';});
    var previous=document.getElementById('rayuelaTeacherBox');if(previous)previous.remove();
    if(!row)return;
    var raw=readRaw(row),save=raw.save||(raw.rawGameData&&raw.rawGameData.save)||{};
    var metrics=save.metrics||raw.metrics||(raw.rawGameData&&raw.rawGameData.metrics)||{};
    var project=save.project||save||{};
    if(!metrics.nodes&&!metrics.words&&!row.sessions)return;
    var status=project.status||save.status||'borrador';
    var data=[
      ['Escenas',metrics.nodes||0],['Palabras',metrics.words||0],['Decisiones',metrics.choices||0],
      ['Finales',metrics.endings||0],['Complejidad',(metrics.complexity||metrics.stars||0)+'/5'],
      ['Errores estruct.',metrics.structuralErrors||0],['Estado',status],['XP Rayuela',project.xp||save.xp||row.xp||0],
      ['Sesiones',row.sessions||0],['Última actividad',row.lastActivity?formatDate(row.lastActivity):'—']
    ];
    var box=document.createElement('div');box.id='rayuelaTeacherBox';box.className='rayuelaTeacherBox';
    box.innerHTML='<strong>🧭 Rayuela · proyecto narrativo</strong><div class="sub">Resumen estructural del último borrador guardado. La calificación final sigue siendo decisión del profesor.</div><div class="rayuelaTeacherGrid">'+data.map(function(x){return '<div class="rayuelaTeacherMetric"><span>'+escapeR(x[0])+'</span><b>'+escapeR(x[1])+'</b></div>';}).join('')+'</div>';
    root.parentNode.insertBefore(box,root.nextSibling);
  }
  function install(){
    if(typeof renderStudentDetail!=='function'){setTimeout(install,100);return;}
    var base=renderStudentDetail;
    renderStudentDetail=function(detail){var value=base(detail);setTimeout(function(){addRayuelaDetail(detail);},0);return value;};
  }
  install();
})();
</script>`;
}

// Este archivo se carga después de los adaptadores de taller/sesiones.
var LA_RAYUELA_BASE_BUILD_HTML_OUTPUT_ = buildLenguArcadeHtmlOutput_;
buildLenguArcadeHtmlOutput_ = function(file, title, patchAlumnoGoogle) {
  var output = LA_RAYUELA_BASE_BUILD_HTML_OUTPUT_(file, title, patchAlumnoGoogle);
  if (file !== 'LenguArcade_Alumno' && file !== 'LenguArcade_Profesor') return output;
  var content = output.getContent();
  var patch = file === 'LenguArcade_Alumno' ? getRayuelaStudentPatch_() : getRayuelaTeacherPatch_();
  var html = content.indexOf('</body>') !== -1 ? content.replace('</body>', patch + '\n</body>') : content + patch;
  return HtmlService.createHtmlOutput(html).setTitle(title).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
};