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
  color:'#22d3ee',
  icono:'⌗',
  url:'https://raw.githack.com/pablogarciablancov/lenguarcade/main/games/rayuela/',
  descripcion:'Crea una aventura interactiva con decisiones, caminos alternativos, finales y secretos.',
  banner:'rayuela',
  activo:true
};

// Las instalaciones existentes pueden tener una hoja Juegos anterior a Rayuela.
// Se añade de forma virtual, sin ejecutar inicializadores ni tocar datos previos.
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

function getRayuelaTeacherPatch_() {
  return `
<style id="la-rayuela-teacher-style">
.rayuelaTeacherBox{margin-top:12px;padding:14px;border:1px solid rgba(34,211,238,.24);border-radius:18px;background:linear-gradient(135deg,rgba(34,211,238,.08),rgba(139,92,246,.08))}
.rayuelaTeacherHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.rayuelaTeacherHead strong{font-size:16px}
.rayuelaTeacherGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:10px}
.rayuelaTeacherMetric{padding:9px;border:1px solid var(--line);border-radius:12px;background:rgba(0,0,0,.13)}
.rayuelaTeacherMetric span{display:block;color:var(--muted);font-size:10px}.rayuelaTeacherMetric b{font-size:17px;overflow-wrap:anywhere}
.rayuelaTeacherActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.rayuelaTeacherActions button{margin:0!important}
.rayuelaDialog{width:min(1180px,97vw)!important;max-height:92vh!important}
.rayuelaReviewLayout{display:grid;grid-template-columns:minmax(0,1.2fr) 390px;gap:14px}
.rayuelaMapPane,.rayuelaRubricPane{border:1px solid var(--line);border-radius:18px;background:rgba(0,0,0,.12);overflow:hidden}
.rayuelaMapToolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px;border-bottom:1px solid var(--line)}
.rayuelaMapViewport{height:420px;overflow:auto;background:radial-gradient(circle at center,rgba(34,211,238,.04),transparent 44%),rgba(0,0,0,.14)}
.rayuelaMapStage{position:relative;min-width:720px;min-height:420px}
.rayuelaMapSvg{position:absolute;inset:0;overflow:visible;pointer-events:none}.rayuelaMapEdge{fill:none;stroke:rgba(148,163,184,.42);stroke-width:2}
.rayuelaMapNode{position:absolute;width:112px;min-height:64px;padding:7px;border:1px solid var(--line);border-top:4px solid var(--ray-color,#8b5cf6);border-radius:12px;background:rgba(20,30,52,.97);color:var(--text);text-align:left;box-shadow:0 8px 18px rgba(0,0,0,.2)}
.rayuelaMapNode:hover,.rayuelaMapNode.selected{border-color:#22d3ee}.rayuelaMapNode strong{display:block;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rayuelaMapNode small{display:block;color:var(--muted);font-size:8px;margin-top:3px}
.rayuelaNodeReview{padding:12px;border-top:1px solid var(--line)}.rayuelaNodeText{white-space:pre-wrap;max-height:150px;overflow:auto;padding:10px;border-radius:12px;background:rgba(255,255,255,.035);font:13px/1.5 Georgia,serif;margin:8px 0}
.rayuelaRubricPane{padding:13px;max-height:650px;overflow:auto}.rayuelaRubricTop{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}
.rayuelaRubricScore{font-size:24px;font-weight:950}.rayuelaCriterion{padding:10px;border:1px solid var(--line);border-radius:14px;background:rgba(255,255,255,.035);margin-bottom:8px}
.rayuelaCriterionTop{display:grid;grid-template-columns:minmax(0,1fr) 72px 72px auto;gap:6px;align-items:center}.rayuelaCriterion input,.rayuelaCriterion textarea,.rayuelaRubricPane textarea{width:100%;padding:8px;border:1px solid var(--line);border-radius:10px;background:rgba(0,0,0,.2);color:var(--text)}
.rayuelaCriterion textarea{min-height:52px;margin-top:7px;resize:vertical}.rayuelaRubricPane>textarea{min-height:92px;resize:vertical}
.rayuelaReviewBadge{display:inline-flex;padding:5px 8px;border-radius:999px;border:1px solid rgba(52,211,153,.22);background:rgba(52,211,153,.08);font-size:10px;color:#b9f6db;font-weight:850}
.rayuelaStatus{min-height:18px;color:var(--muted);font-size:11px;margin-top:8px}
@media(max-width:980px){.rayuelaReviewLayout{grid-template-columns:1fr}.rayuelaTeacherGrid{grid-template-columns:repeat(2,1fr)}.rayuelaMapViewport{height:360px}}
@media(max-width:620px){.rayuelaCriterionTop{grid-template-columns:1fr 65px}.rayuelaCriterionTop button{grid-column:1/-1}.rayuelaTeacherHead{flex-direction:column}}
</style>
<script>
(function(){
  if(window.__LA_RAYUELA_TEACHER_PATCH__)return;
  window.__LA_RAYUELA_TEACHER_PATCH__=true;
  var rayContext=null,rayCriteria=[],rayNodeComments=[],raySelectedNodeId='';

  function escR(value){return String(value==null?'':value).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function readRaw(row){try{return typeof row.rawJson==='string'?JSON.parse(row.rawJson||'{}'):(row.rawJson||{});}catch(e){return {};}}
  function extract(row){
    var raw=readRaw(row),save=raw.save||(raw.rawGameData&&raw.rawGameData.save)||{},metrics=raw.metrics||(raw.rawGameData&&raw.rawGameData.metrics)||{};
    return {raw:raw,save:save,project:save.project||save||{},metrics:metrics};
  }
  function evaluationFor(detail){
    return ((detail&&detail.evaluations)||[]).find(function(item){return String(item.gameId)==='rayuela'&&String(item.scope)==='game';})||null;
  }
  function defaultCriteria(){
    return [
      {id:'structure',label:'Estructura narrativa',weight:20,score:0,comment:''},
      {id:'branching',label:'Ramificación y consecuencias',weight:20,score:0,comment:''},
      {id:'writing',label:'Calidad de escritura',weight:20,score:0,comment:''},
      {id:'language',label:'Corrección lingüística',weight:20,score:0,comment:''},
      {id:'creativity',label:'Creatividad y elaboración',weight:20,score:0,comment:''}
    ];
  }
  function rayMetrics(context,row){
    var p=context.project||{},m=context.metrics||{},nodes=Array.isArray(p.nodes)?p.nodes:[];
    var choices=nodes.reduce(function(sum,n){return sum+(Array.isArray(n.choices)?n.choices.filter(function(c){return c.targetId;}).length:0);},0);
    var endings=nodes.filter(function(n){return n.type==='ending'||n.type==='secret';}).length;
    var wordCount=nodes.reduce(function(sum,n){return sum+String(n.text||'').trim().split(/\s+/).filter(Boolean).length;},0);
    return {
      nodes:Number(m.nodes||nodes.length||0),words:Number(m.words||wordCount||0),choices:Number(m.choices||choices||0),
      endings:Number(m.endings||endings||0),complexity:Number(m.complexity||m.stars||0),quality:Number(m.quality||row.accuracy||0),
      errors:Number(m.structuralErrors||0),status:String(p.status||'draft')
    };
  }
  function addRayuelaDetail(detail){
    var root=document.getElementById('studentDetailProgress');if(!root||!detail||!Array.isArray(detail.progress))return;
    var row=detail.progress.find(function(item){return String(item.gameId)==='rayuela';});
    var old=document.getElementById('rayuelaTeacherBox');if(old)old.remove();
    if(!row)return;
    var context=extract(row),m=rayMetrics(context,row);if(!m.nodes&&!row.sessions)return;
    var evaluation=evaluationFor(detail),data=[
      ['Escenas',m.nodes],['Palabras',m.words],['Decisiones',m.choices],['Finales',m.endings],['Complejidad',m.complexity+'/5'],
      ['Inspector',m.errors+' errores'],['Estado',m.status==='submitted'?'Entregado':'En proceso'],['XP',row.xp||0],['Sesiones',row.sessions||0],['Nota',evaluation?Number(evaluation.score).toFixed(1):'—']
    ];
    var box=document.createElement('div');box.id='rayuelaTeacherBox';box.className='rayuelaTeacherBox';
    box.innerHTML='<div class="rayuelaTeacherHead"><div><strong>⌗ Rayuela · proyecto narrativo</strong><div class="sub">Mapa, proceso de escritura y evaluación específica.</div></div>'+(m.status==='submitted'?'<span class="rayuelaReviewBadge">📬 Entregado</span>':'<span class="sub">Borrador activo</span>')+'</div><div class="rayuelaTeacherGrid">'+data.map(function(x){return '<div class="rayuelaTeacherMetric"><span>'+escR(x[0])+'</span><b>'+escR(x[1])+'</b></div>';}).join('')+'</div><div class="rayuelaTeacherActions"><button type="button" id="rayuelaOpenReview">🗺 Abrir mapa y evaluar</button></div>';
    root.parentNode.insertBefore(box,root.nextSibling);
    document.getElementById('rayuelaOpenReview').onclick=function(){openRayuelaReview(detail,row,context);};
  }

  function ensureModal(){
    if(document.getElementById('rayuelaTeacherModal'))return;
    var modal=document.createElement('div');modal.id='rayuelaTeacherModal';modal.className='modal';
    modal.innerHTML='<div class="dialog rayuelaDialog"><div class="dialogHead"><div><h2>⌗ Rayuela · mapa y evaluación</h2><div class="sub" id="rayuelaModalSub"></div></div><button type="button" class="closeX" id="rayuelaModalClose">Cerrar</button></div><div class="rayuelaReviewLayout"><section class="rayuelaMapPane"><div class="rayuelaMapToolbar"><strong>Mapa narrativo</strong><span class="sub" id="rayuelaMapStats"></span></div><div class="rayuelaMapViewport"><div class="rayuelaMapStage" id="rayuelaMapStage"></div></div><div class="rayuelaNodeReview" id="rayuelaNodeReview"><div class="sub">Selecciona una escena del mapa para leerla y dejar feedback concreto.</div></div></section><section class="rayuelaRubricPane"><div class="rayuelaRubricTop"><div><strong>Rúbrica</strong><div class="sub">Los pesos son editables.</div></div><div class="rayuelaRubricScore"><span id="rayuelaRubricScore">0.0</span>/10</div></div><div id="rayuelaCriteria"></div><button type="button" class="ghost" id="rayuelaAddCriterion">＋ Añadir criterio</button><label class="sub" style="display:block;margin:12px 0 5px">Comentario general</label><textarea id="rayuelaOverallComment" placeholder="Valoración global para el alumno..."></textarea><div class="rayuelaTeacherActions"><button type="button" id="rayuelaSaveEvaluation">💾 Guardar evaluación</button></div><div class="rayuelaStatus" id="rayuelaEvaluationStatus"></div></section></div></div>';
    document.body.appendChild(modal);
    document.getElementById('rayuelaModalClose').onclick=function(){modal.classList.remove('open');};
    document.getElementById('rayuelaAddCriterion').onclick=function(){
      if(rayCriteria.length>=12)return;rayCriteria.push({id:'custom_'+Date.now(),label:'Nuevo criterio',weight:10,score:0,comment:''});renderRubric();
    };
    document.getElementById('rayuelaSaveEvaluation').onclick=saveEvaluation;
  }
  function criterionScore(){
    var total=rayCriteria.reduce(function(s,c){return s+Math.max(0,Number(c.weight||0));},0);if(!total)return 0;
    return rayCriteria.reduce(function(s,c){return s+Math.max(0,Math.min(10,Number(c.score||0)))*Math.max(0,Number(c.weight||0));},0)/total;
  }
  function renderRubric(){
    var root=document.getElementById('rayuelaCriteria');if(!root)return;
    root.innerHTML=rayCriteria.map(function(c,index){return '<div class="rayuelaCriterion" data-criterion="'+index+'"><div class="rayuelaCriterionTop"><input data-field="label" value="'+escR(c.label)+'" aria-label="Criterio"><input data-field="weight" type="number" min="1" max="100" value="'+Number(c.weight||0)+'" title="Peso %"><input data-field="score" type="number" min="0" max="10" step=".1" value="'+Number(c.score||0)+'" title="Nota sobre 10"><button type="button" class="closeX" data-remove="'+index+'">✕</button></div><textarea data-field="comment" placeholder="Comentario sobre este criterio...">'+escR(c.comment||'')+'</textarea></div>';}).join('');
    root.querySelectorAll('[data-criterion]').forEach(function(row){
      var index=Number(row.dataset.criterion);
      row.querySelectorAll('[data-field]').forEach(function(input){input.oninput=function(){var field=input.dataset.field;rayCriteria[index][field]=(field==='weight'||field==='score')?Number(input.value||0):input.value;document.getElementById('rayuelaRubricScore').textContent=criterionScore().toFixed(1);};});
      row.querySelector('[data-remove]').onclick=function(){if(rayCriteria.length<=1)return;rayCriteria.splice(index,1);renderRubric();};
    });
    document.getElementById('rayuelaRubricScore').textContent=criterionScore().toFixed(1);
  }
  function nodeColor(type){return {start:'#22d3ee',story:'#8b5cf6',decision:'#c084fc',event:'#fb923c',item:'#34d399',condition:'#fbbf24',ending:'#fb7185',secret:'#fbbf24'}[type]||'#8b5cf6';}
  function renderMap(){
    var stage=document.getElementById('rayuelaMapStage'),p=rayContext.context.project||{},nodes=Array.isArray(p.nodes)?p.nodes:[];
    var rows=Math.max(9,Number(p.grid&&p.grid.rows||0),1+Math.max.apply(null,[0].concat(nodes.map(function(n){return Number(n.row||0);}))));
    var cols=Math.max(9,Number(p.grid&&p.grid.cols||0),1+Math.max.apply(null,[0].concat(nodes.map(function(n){return Number(n.col||0);}))));
    var cw=132,ch=92,w=cols*cw,h=rows*ch;stage.style.width=w+'px';stage.style.height=h+'px';
    var byId={};nodes.forEach(function(n){byId[n.id]=n;});
    var paths=[];nodes.forEach(function(n){(n.choices||[]).forEach(function(c){var t=byId[c.targetId];if(!t)return;var ax=Number(n.col||0)*cw+62,ay=Number(n.row||0)*ch+34,bx=Number(t.col||0)*cw+62,by=Number(t.row||0)*ch+34;paths.push('<path class="rayuelaMapEdge" d="M '+ax+' '+ay+' C '+((ax+bx)/2)+' '+ay+', '+((ax+bx)/2)+' '+by+', '+bx+' '+by+'"></path>');});});
    var html='<svg class="rayuelaMapSvg" width="'+w+'" height="'+h+'">'+paths.join('')+'</svg>'+nodes.map(function(n){return '<button type="button" class="rayuelaMapNode '+(n.id===raySelectedNodeId?'selected':'')+'" data-ray-node="'+escR(n.id)+'" style="left:'+(Number(n.col||0)*cw+7)+'px;top:'+(Number(n.row||0)*ch+8)+'px;--ray-color:'+nodeColor(n.type)+'"><strong>'+escR(n.title||'Escena')+'</strong><small>'+escR(n.type||'story')+' · '+String(n.text||'').trim().split(/\s+/).filter(Boolean).length+' palabras</small></button>';}).join('');
    stage.innerHTML=html;stage.querySelectorAll('[data-ray-node]').forEach(function(btn){btn.onclick=function(){raySelectedNodeId=btn.dataset.rayNode;renderMap();renderNodeReview();};});
  }
  function currentNodeComment(nodeId){return rayNodeComments.find(function(item){return item.nodeId===nodeId;})||null;}
  function renderNodeReview(){
    var root=document.getElementById('rayuelaNodeReview'),p=rayContext.context.project||{},nodes=Array.isArray(p.nodes)?p.nodes:[],node=nodes.find(function(n){return n.id===raySelectedNodeId;});
    if(!node){root.innerHTML='<div class="sub">Selecciona una escena del mapa para leerla y dejar feedback concreto.</div>';return;}
    var comment=currentNodeComment(node.id),reviewed=(p.reviewedTeacherComments||[]).indexOf(comment&&comment.id)!==-1;
    root.innerHTML='<div style="display:flex;justify-content:space-between;gap:8px"><strong>'+escR(node.title||'Escena')+'</strong>'+(reviewed?'<span class="rayuelaReviewBadge">✓ Revisado por el alumno</span>':'')+'</div><div class="rayuelaNodeText">'+escR(node.text||'(sin texto)')+'</div><label class="sub">Comentario en esta escena</label><textarea id="rayuelaNodeComment" style="width:100%;min-height:72px;margin-top:5px;padding:9px;border:1px solid var(--line);border-radius:10px;background:rgba(0,0,0,.2);color:var(--text)" placeholder="Ej.: Esta decisión conduce casi al mismo resultado...">'+escR(comment&&comment.comment||'')+'</textarea>';
    document.getElementById('rayuelaNodeComment').oninput=function(e){
      var existing=currentNodeComment(node.id);if(existing)existing.comment=e.target.value;
      else rayNodeComments.push({id:'node_comment_'+Date.now(),nodeId:node.id,comment:e.target.value});
    };
  }
  function openRayuelaReview(detail,row,context){
    ensureModal();var evaluation=evaluationFor(detail),breakdown=evaluation&&evaluation.breakdown||{};
    rayContext={detail:detail,row:row,context:context,evaluation:evaluation};
    rayCriteria=Array.isArray(breakdown.criteria)&&breakdown.criteria.length?JSON.parse(JSON.stringify(breakdown.criteria)):defaultCriteria();
    rayNodeComments=Array.isArray(breakdown.nodeComments)?JSON.parse(JSON.stringify(breakdown.nodeComments)):[];
    raySelectedNodeId=((context.project.nodes||[]).find(function(n){return n.type==='start';})||context.project.nodes&&context.project.nodes[0]||{}).id||'';
    document.getElementById('rayuelaModalSub').textContent=(detail.student&&detail.student.nombre||'Alumno')+' · '+(context.project.title||'Rayuela');
    var m=rayMetrics(context,row);document.getElementById('rayuelaMapStats').textContent=m.nodes+' escenas · '+m.words+' palabras · '+m.endings+' finales';
    document.getElementById('rayuelaOverallComment').value=String(breakdown.overallComment||'');
    document.getElementById('rayuelaEvaluationStatus').textContent=evaluation?'Última evaluación: '+(evaluation.updatedAt?formatDate(evaluation.updatedAt):'guardada'):'Aún no evaluada.';
    renderRubric();renderMap();renderNodeReview();document.getElementById('rayuelaTeacherModal').classList.add('open');
  }
  async function saveEvaluation(){
    if(!rayContext)return;var button=document.getElementById('rayuelaSaveEvaluation'),status=document.getElementById('rayuelaEvaluationStatus');button.disabled=true;status.textContent='Guardando evaluación...';
    try{
      var p=rayContext.context.project||{},submission=(p.submissions||[]).slice(-1)[0]||{};
      var payload={studentId:rayContext.detail.student.studentId,criteria:rayCriteria,overallComment:document.getElementById('rayuelaOverallComment').value,nodeComments:rayNodeComments,projectId:p.id||'',submissionId:submission.id||''};
      var result=await edge('teacher-rayuela-evaluation',payload);
      var list=rayContext.detail.evaluations||(rayContext.detail.evaluations=[]),existing=list.find(function(item){return item.gameId==='rayuela'&&item.scope==='game';});
      var value={scope:'game',gameId:'rayuela',score:result.score,breakdown:result.breakdown,updatedAt:result.updatedAt};
      if(existing)Object.assign(existing,value);else list.push(value);rayContext.evaluation=value;
      status.textContent='✓ Evaluación guardada · '+Number(result.score).toFixed(1)+'/10';addRayuelaDetail(rayContext.detail);
    }catch(error){status.textContent='No se pudo guardar: '+(error.message||error);}
    finally{button.disabled=false;}
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

// Se inyecta solo en el panel del profesor. El alumno usa la integración
// nativa de progreso del portal y evita capas duplicadas.
var LA_RAYUELA_BASE_BUILD_HTML_OUTPUT_ = buildLenguArcadeHtmlOutput_;
buildLenguArcadeHtmlOutput_ = function(file, title, patchAlumnoGoogle) {
  var output = LA_RAYUELA_BASE_BUILD_HTML_OUTPUT_(file, title, patchAlumnoGoogle);
  if (file !== 'LenguArcade_Profesor') return output;
  var content = output.getContent();
  var patch = getRayuelaTeacherPatch_();
  var html = content.indexOf('</body>') !== -1 ? content.replace('</body>', patch + '\n</body>') : content + patch;
  return HtmlService.createHtmlOutput(html).setTitle(title).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
};