/**
 * LenguArcade - Gestión de clases y alumnado.
 *
 * Añade al panel del profesor acciones de archivo/restauración y borrado
 * definitivo. Supabase es la fuente principal; esta capa mantiene coherente
 * el respaldo histórico de Sheets cuando existe una fila equivalente.
 */

function requireRosterManagerTeacher_() {
  var email = requireActiveGoogleEmail_();
  if (!isTeacherGoogleEmail_(email) || !isTeacherAllowed_(email)) {
    throw new Error('Esta acción requiere una cuenta de profesor autorizada @fomento.edu.');
  }
  return email;
}

function rosterSheetData_(sheetName) {
  var sheet = getDb_().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 1) return null;
  var values = sheet.getDataRange().getValues();
  if (!values.length) return null;
  var headers = values[0].map(function(value){ return String(value || ''); });
  return {sheet:sheet, headers:headers, values:values};
}

function rosterRowObject_(headers, row) {
  var object = {};
  headers.forEach(function(header, index){ object[header] = row[index]; });
  return object;
}

function rosterUpdateRows_(sheetName, predicate, patch) {
  var data = rosterSheetData_(sheetName);
  if (!data) return 0;
  var changed = 0;
  for (var index = 1; index < data.values.length; index += 1) {
    var object = rosterRowObject_(data.headers, data.values[index]);
    if (!predicate(object)) continue;
    Object.keys(patch || {}).forEach(function(key) {
      var column = data.headers.indexOf(key);
      if (column >= 0) data.sheet.getRange(index + 1, column + 1).setValue(patch[key]);
    });
    changed += 1;
  }
  return changed;
}

function rosterDeleteRows_(sheetName, predicate) {
  var data = rosterSheetData_(sheetName);
  if (!data) return 0;
  var rows = [];
  for (var index = 1; index < data.values.length; index += 1) {
    if (predicate(rosterRowObject_(data.headers, data.values[index]))) rows.push(index + 1);
  }
  rows.sort(function(a,b){ return b-a; }).forEach(function(rowNumber){ data.sheet.deleteRow(rowNumber); });
  return rows.length;
}

function rosterSameText_(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

function rosterStudentPredicate_(reference) {
  var studentId = String(reference.studentId || '').trim();
  var email = String(reference.email || '').trim().toLowerCase();
  return function(row) {
    if (studentId && rosterSameText_(row.studentId, studentId)) return true;
    if (email && rosterSameText_(row.email, email)) return true;
    return false;
  };
}

function rosterClassPredicate_(reference) {
  var classCode = String(reference.classCode || '').trim();
  var className = String(reference.className || '').trim();
  var section = String(reference.section || '').trim();
  return function(row) {
    return (classCode && (rosterSameText_(row.classCode, classCode) || rosterSameText_(row.clase, classCode))) ||
      (className && (rosterSameText_(row.nombreVisible, className) || rosterSameText_(row.clase, className))) ||
      (section && rosterSameText_(row.nombreVisible, section));
  };
}

function rosterDeleteStudentReferences_(reference) {
  var predicate = rosterStudentPredicate_(reference);
  var sheets = [
    LA_CONFIG.SHEETS.PROGRESO,
    LA_CONFIG.SHEETS.EVENTOS,
    LA_CONFIG.SHEETS.LOGROS,
    LA_CONFIG.SHEETS.EVALUACIONES,
    LA_CONFIG.SHEETS.ERRORES,
    LA_CONFIG.SHEETS.RAW
  ];
  var deleted = 0;
  sheets.forEach(function(sheetName){ deleted += rosterDeleteRows_(sheetName, predicate); });
  deleted += rosterDeleteRows_(LA_CONFIG.SHEETS.ALUMNOS, predicate);
  return deleted;
}

function applyRosterBackupAction(action, payload) {
  requireRosterManagerTeacher_();
  ensureSheets_();
  var cleanAction = String(action || '').trim();
  var reference = payload && typeof payload === 'object' ? payload : {};
  var changed = 0;

  if (cleanAction === 'archiveStudent' || cleanAction === 'restoreStudent') {
    changed = rosterUpdateRows_(
      LA_CONFIG.SHEETS.ALUMNOS,
      rosterStudentPredicate_(reference),
      {activo:cleanAction === 'restoreStudent'}
    );
  } else if (cleanAction === 'deleteStudent') {
    changed = rosterDeleteStudentReferences_(reference);
  } else if (cleanAction === 'archiveClass' || cleanAction === 'restoreClass') {
    var active = cleanAction === 'restoreClass';
    var classPredicate = rosterClassPredicate_(reference);
    changed += rosterUpdateRows_(LA_CONFIG.SHEETS.CLASES, classPredicate, {activa:active});
    changed += rosterUpdateRows_(LA_CONFIG.SHEETS.ALUMNOS, function(row){
      return classPredicate({
        classCode:row.clase,
        clase:row.clase,
        nombreVisible:row.clase
      });
    }, {activo:active});
  } else if (cleanAction === 'deleteClass') {
    var deleteClassPredicate = rosterClassPredicate_(reference);
    var studentsData = rosterSheetData_(LA_CONFIG.SHEETS.ALUMNOS);
    var studentRefs = [];
    if (studentsData) {
      for (var index = 1; index < studentsData.values.length; index += 1) {
        var row = rosterRowObject_(studentsData.headers, studentsData.values[index]);
        if (deleteClassPredicate({classCode:row.clase, clase:row.clase, nombreVisible:row.clase})) {
          studentRefs.push({studentId:row.studentId, email:row.email});
        }
      }
    }
    studentRefs.forEach(function(student){ changed += rosterDeleteStudentReferences_(student); });
    changed += rosterDeleteRows_(LA_CONFIG.SHEETS.CLASES, deleteClassPredicate);
    if (typeof LA_WORKSHOP_ACCESS_CONFIG_ !== 'undefined') {
      changed += rosterDeleteRows_(LA_WORKSHOP_ACCESS_CONFIG_.SHEET, function(row){
        return reference.classCode && rosterSameText_(row.classCode, reference.classCode);
      });
    }
  } else {
    throw new Error('Acción de gestión no reconocida.');
  }

  SpreadsheetApp.flush();
  try {
    if (typeof clearCacheV03_ === 'function') clearCacheV03_();
    CacheService.getScriptCache().remove('public_meta_v04');
  } catch (error) {}

  return {ok:true, action:cleanAction, backupRowsChanged:changed};
}

function getRosterManagementTeacherPatch_() {
  return `
<style id="la-roster-management-style">
.rosterHead{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}
.rosterSummary{display:flex;gap:8px;flex-wrap:wrap}
.rosterPill{padding:7px 10px;border:1px solid var(--line);border-radius:999px;background:rgba(124,77,255,.08);font-size:12px;font-weight:800}
.rosterToolbar{display:grid;grid-template-columns:minmax(220px,1.5fr) minmax(170px,.8fr) auto;gap:10px;margin:16px 0}
.rosterGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.rosterCard{border:1px solid var(--line);border-radius:16px;padding:14px;background:rgba(0,0,0,.12)}
body.light .rosterCard{background:rgba(255,255,255,.72)}
.rosterCardTop{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.rosterBadge{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:11px;font-weight:900;background:rgba(54,211,153,.12);color:#78e8bd}
.rosterBadge.archived{background:rgba(255,184,77,.13);color:#ffd08a}
.rosterActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}
.rosterActions button{width:auto;padding:8px 10px;font-size:12px}
.rosterDanger{background:rgba(255,88,113,.12)!important;border:1px solid rgba(255,88,113,.35)!important;color:#ff9aaa!important;box-shadow:none!important}
.rosterTableWrap{overflow:auto;margin-top:12px}
.rosterTableWrap table{min-width:880px}
.rosterTableWrap td:last-child{white-space:nowrap}
.rosterEmpty{padding:18px;border:1px dashed var(--line);border-radius:14px;color:var(--muted);text-align:center}
@media(max-width:900px){.rosterGrid{grid-template-columns:1fr}.rosterToolbar{grid-template-columns:1fr}}
</style>
<script>
(function(){
  if(window.__LA_ROSTER_MANAGEMENT_PATCH__)return;
  window.__LA_ROSTER_MANAGEMENT_PATCH__=true;
  var rosterState={classes:[],students:[],summary:{}};

  function rEsc(value){return String(value==null?'':value).replace(/[&<>"]/g,function(char){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char];});}
  function classLabel(row){return [row.name,row.section].filter(Boolean).join(' · ');}
  function membershipLabel(row){return [row.name,row.section].filter(Boolean).join(' · ');}
  function rosterStatus(text){var el=document.getElementById('rosterStatus');if(el)el.textContent=text||'';}
  function actionName(action){
    return ({archiveStudent:'Archivar alumno',restoreStudent:'Restaurar alumno',deleteStudent:'Eliminar alumno',archiveClass:'Archivar clase',restoreClass:'Restaurar clase',deleteClass:'Eliminar clase'})[action]||action;
  }
  function isDelete(action){return action==='deleteStudent'||action==='deleteClass';}

  function renderSummary(){
    var s=rosterState.summary||{};
    var el=document.getElementById('rosterSummary');
    if(!el)return;
    el.innerHTML='<span class="rosterPill">🏫 '+Number(s.activeClasses||0)+' clases activas</span>'+
      '<span class="rosterPill">📦 '+Number(s.archivedClasses||0)+' archivadas</span>'+
      '<span class="rosterPill">👤 '+Number(s.activeStudents||0)+' alumnos activos</span>'+
      '<span class="rosterPill">🗄️ '+Number(s.archivedStudents||0)+' archivados</span>';
  }

  function renderClasses(){
    var target=document.getElementById('rosterClasses');
    if(!target)return;
    var rows=rosterState.classes||[];
    target.innerHTML=rows.length?rows.map(function(row){
      var archived=!row.active;
      return '<article class="rosterCard"><div class="rosterCardTop"><div><strong>'+rEsc(classLabel(row)||'Clase')+'</strong><div class="sub">'+Number(row.studentCount||0)+' alumnos'+(row.lastSyncedAt?' · última sincronización '+rEsc(formatDate(row.lastSyncedAt)):'')+'</div></div><span class="rosterBadge '+(archived?'archived':'')+'">'+(archived?'Archivada':'Activa')+'</span></div><div class="rosterActions">'+
        (archived?'<button type="button" class="ghost" data-roster-action="restoreClass" data-roster-id="'+rEsc(row.id)+'">Restaurar</button>':'<button type="button" class="ghost" data-roster-action="archiveClass" data-roster-id="'+rEsc(row.id)+'">Archivar</button>')+
        '<button type="button" class="rosterDanger" data-roster-action="deleteClass" data-roster-id="'+rEsc(row.id)+'">Eliminar definitivamente…</button></div></article>';
    }).join(''):'<div class="rosterEmpty">No hay clases registradas.</div>';
    bindRosterButtons(target);
  }

  function filteredStudents(){
    var query=String((document.getElementById('rosterSearch')||{}).value||'').trim().toLowerCase();
    var classId=String((document.getElementById('rosterClassFilter')||{}).value||'');
    var status=String((document.getElementById('rosterStatusFilter')||{}).value||'all');
    return (rosterState.students||[]).filter(function(row){
      var text=(row.name+' '+row.email+' '+(row.classes||[]).map(membershipLabel).join(' ')).toLowerCase();
      if(query&&text.indexOf(query)===-1)return false;
      if(classId&&!(row.classes||[]).some(function(item){return item.id===classId;}))return false;
      if(status==='active'&&!row.active)return false;
      if(status==='archived'&&row.active)return false;
      return true;
    });
  }

  function renderStudents(){
    var target=document.getElementById('rosterStudentsBody');
    if(!target)return;
    var rows=filteredStudents();
    target.innerHTML=rows.length?rows.map(function(row){
      var memberships=(row.classes||[]).map(membershipLabel).filter(Boolean).join('<br>')||'Sin clase';
      return '<tr><td><strong>'+rEsc(row.name||'Alumno')+'</strong><br><span class="sub">'+rEsc(row.email)+'</span></td><td>'+memberships+'</td><td><span class="rosterBadge '+(!row.active?'archived':'')+'">'+(row.active?'Activo':'Archivado')+'</span></td><td>'+rEsc(row.source||'')+'</td><td><div class="rosterActions" style="margin-top:0">'+
        (row.active?'<button type="button" class="ghost" data-roster-action="archiveStudent" data-roster-id="'+rEsc(row.id)+'">Archivar</button>':'<button type="button" class="ghost" data-roster-action="restoreStudent" data-roster-id="'+rEsc(row.id)+'">Restaurar</button>')+
        '<button type="button" class="rosterDanger" data-roster-action="deleteStudent" data-roster-id="'+rEsc(row.id)+'">Eliminar…</button></div></td></tr>';
    }).join(''):'<tr><td colspan="5"><div class="rosterEmpty">No hay alumnos que coincidan con el filtro.</div></td></tr>';
    bindRosterButtons(target);
  }

  function renderFilters(){
    var select=document.getElementById('rosterClassFilter');
    if(!select)return;
    var selected=select.value;
    select.innerHTML='<option value="">Todas las clases</option>'+(rosterState.classes||[]).map(function(row){
      return '<option value="'+rEsc(row.id)+'">'+rEsc(classLabel(row))+(row.active?'':' · archivada')+'</option>';
    }).join('');
    if([].some.call(select.options,function(option){return option.value===selected;}))select.value=selected;
  }

  function renderRoster(){
    renderSummary();renderFilters();renderClasses();renderStudents();
  }

  function backupPayload(action,target){
    if(action.indexOf('Student')!==-1){
      return {studentId:target.id,email:target.email,name:target.name};
    }
    return {classCode:target.classCode,id:target.id,className:target.name,section:target.section};
  }

  async function performRosterAction(action,targetId){
    var student=action.indexOf('Student')!==-1?(rosterState.students||[]).find(function(row){return row.id===targetId;}):null;
    var classroom=action.indexOf('Class')!==-1?(rosterState.classes||[]).find(function(row){return row.id===targetId;}):null;
    var target=student||classroom;
    if(!target)return;
    var label=student?(student.name||student.email):classLabel(classroom);
    var confirmText='';
    if(isDelete(action)){
      var warning=action==='deleteClass'
        ?'Vas a eliminar definitivamente la clase «'+label+'». También se borrarán los alumnos que solo pertenezcan a esa clase. Los alumnos presentes en otra clase se conservarán.\n\nEscribe ELIMINAR para continuar.'
        :'Vas a eliminar definitivamente a «'+label+'» y todo su progreso, logros, partidas y evaluaciones.\n\nEscribe ELIMINAR para continuar.';
      confirmText=window.prompt(warning,'');
      if(confirmText!=='ELIMINAR')return;
    }else{
      var message=action.indexOf('archive')===0
        ?'¿Archivar «'+label+'»? Desaparecerá del panel activo, pero sus datos se conservarán y podrás restaurarlo.'
        :'¿Restaurar «'+label+'»? Volverá a aparecer como activo.';
      if(!window.confirm(message))return;
    }

    setBusy(true,actionName(action)+'…');
    try{
      var result=await edge('teacher-roster-management',{action:action,targetId:targetId,confirmText:confirmText});
      try{
        await appsCall('applyRosterBackupAction',[action,backupPayload(action,target)]);
      }catch(backupError){
        console.warn('La acción principal se completó, pero el respaldo de Sheets no pudo actualizarse.',backupError);
      }
      await loadRosterState(false);
      await loadTeacher(true);
      var extra=result.deletedStudents?(' · '+result.deletedStudents+' alumnos eliminados'):result.archivedStudents?(' · '+result.archivedStudents+' alumnos archivados'):'';
      setStatus(actionName(action)+' completado'+extra+'.');
    }catch(error){
      setStatus('No se pudo completar la acción: '+(error.message||error));
    }finally{
      setBusy(false);
    }
  }

  function bindRosterButtons(root){
    root.querySelectorAll('[data-roster-action]').forEach(function(button){
      button.onclick=function(){performRosterAction(button.dataset.rosterAction,button.dataset.rosterId);};
    });
  }

  async function loadRosterState(showMessage){
    if(showMessage)rosterStatus('Cargando clases y alumnado…');
    try{
      rosterState=await edge('teacher-roster-management',{action:'list'});
      renderRoster();
      rosterStatus('Los elementos archivados conservan sus datos y pueden restaurarse.');
    }catch(error){
      rosterStatus('No se pudo cargar la gestión: '+(error.message||error));
    }
  }

  function installRosterManagement(){
    var app=document.getElementById('appContent');
    if(!app||document.getElementById('gestion'))return;
    var section=document.createElement('section');
    section.id='gestion';section.className='card';
    section.innerHTML='<div class="rosterHead"><div><h2>Gestión de clases y alumnado</h2><div class="sub">Archiva para limpiar el curso sin perder datos. Usa la eliminación definitiva solo cuando quieras borrar también el historial.</div></div><div class="rosterSummary" id="rosterSummary"></div></div>'+
      '<div class="status" id="rosterStatus">Abre esta sección para cargar los datos.</div>'+
      '<h3 style="margin-top:18px">Clases</h3><div class="rosterGrid" id="rosterClasses"></div>'+
      '<h3 style="margin-top:22px">Alumnos</h3><div class="rosterToolbar"><input id="rosterSearch" type="search" placeholder="Buscar por nombre o correo"><select id="rosterClassFilter"><option value="">Todas las clases</option></select><select id="rosterStatusFilter"><option value="all">Activos y archivados</option><option value="active">Solo activos</option><option value="archived">Solo archivados</option></select></div>'+
      '<div class="rosterTableWrap"><table><thead><tr><th>Alumno</th><th>Clase</th><th>Estado</th><th>Origen</th><th>Acciones</th></tr></thead><tbody id="rosterStudentsBody"><tr><td colspan="5"><div class="rosterEmpty">Pulsa Gestión para cargar el listado.</div></td></tr></tbody></table></div>';
    var classroom=document.getElementById('classroom');
    if(classroom&&classroom.parentNode)classroom.parentNode.insertBefore(section,classroom);
    else app.appendChild(section);

    var nav=document.querySelector('.nav');
    if(nav&&!nav.querySelector('[data-roster-nav]')){
      var button=document.createElement('button');button.type='button';button.textContent='Gestión';button.dataset.rosterNav='1';
      button.onclick=function(){
        document.querySelectorAll('.nav button').forEach(function(item){item.classList.remove('active');});
        button.classList.add('active');section.scrollIntoView({block:'start',behavior:'smooth'});loadRosterState(true);
      };
      nav.appendChild(button);
    }
    document.getElementById('rosterSearch').addEventListener('input',renderStudents);
    document.getElementById('rosterClassFilter').addEventListener('change',renderStudents);
    document.getElementById('rosterStatusFilter').addEventListener('change',renderStudents);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installRosterManagement);
  else installRosterManagement();
})();
<\/script>`;
}

var LA_ROSTER_MANAGEMENT_BASE_BUILD_HTML_OUTPUT_ = buildLenguArcadeHtmlOutput_;
buildLenguArcadeHtmlOutput_ = function(file, title, patchAlumnoGoogle) {
  var output = LA_ROSTER_MANAGEMENT_BASE_BUILD_HTML_OUTPUT_(file, title, patchAlumnoGoogle);
  if (file !== 'LenguArcade_Profesor') return output;
  var content = output.getContent();
  var patch = getRosterManagementTeacherPatch_();
  var html = content.indexOf('</body>') !== -1 ? content.replace('</body>', patch + '\n</body>') : content + patch;
  return HtmlService.createHtmlOutput(html)
    .setTitle(title)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
};
