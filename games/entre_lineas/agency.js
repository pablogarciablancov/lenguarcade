/* Additive agency mode. The original case, profile and host protocol stay in the engine. */
AGENCY_CASES.forEach(c=>{BUILTIN_CASES[c.id]=c;cases[c.id]=c});
const oldStartCase=startCase,oldRenderCase=renderCase,oldOpenDocument=openDocument,oldOpenSolve=openSolve,oldSubmitSolve=submitSolve,oldRequestHint=requestHint;
const escapeText=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const center=document.querySelector('.center');
center.insertAdjacentHTML('afterbegin','<section id="suspectBoard" aria-label="Personas de la investigación"></section>');
document.querySelector('.hero h1').innerHTML='ENTRE <span>LÍNEAS</span>';
document.querySelector('.hero-grid').insertAdjacentHTML('beforebegin','<div class="agency-heading"><span>ARCHIVO DE CASOS</span><small>Lee. Contrasta. Demuestra.</small></div><div id="agencyCases"></div>');
function renderAgencyCases(){document.getElementById('agencyCases').innerHTML=AGENCY_CASES.filter(c=>!c.tutorial).map((c,i)=>{const s=loadState(c.id);return `<button class="folder" onclick="startCase('${c.id}')"><span class="folder-number">0${i+1} / ${escapeText(c.place)}</span><strong>${escapeText(c.title)}</strong><span>${escapeText(c.difficulty)} · 6 personas · 5–8 min</span><b>${s?.completed?(profile.history.some(h=>h.caseId===c.id&&h.success)?'RESUELTO · Volver a investigar':'REABRIR EXPEDIENTE'):s?'CONTINUAR INVESTIGACIÓN':'ABRIR EXPEDIENTE'} ↗</b></button>`}).join('')}
const oldRefreshHeader=refreshHeader;
refreshHeader=function(){oldRefreshHeader();renderAgencyCases()};
function portrait(i){const colors=['#bd7e65','#76968b','#c1a06b','#839bb1','#af8194','#93946c'];return `<svg viewBox="0 0 120 110" aria-hidden="true"><path fill="${colors[i%6]}" opacity=".22" d="M0 0h120v110H0z"/><circle cx="92" cy="25" r="32" fill="${colors[i%6]}" opacity=".25"/><path d="M18 110q4-35 42-35t42 35" fill="${colors[i%6]}"/><path d="m44 80 16 20 16-20" fill="#e9debe"/><path d="M40 37q0-23 21-23t20 23v20q-3 23-21 23T40 57" fill="#dec2a0"/><path d="M36 43q-5-31 24-33 30 1 25 36L73 30 40 42" fill="#252e31"/><path d="M50 51h4m14 0h4M56 66q5 3 10 0" stroke="#343337" stroke-width="3" stroke-linecap="round"/>${i%2===0?'<path d="M31 29h57l8 9H25zM43 16h33l6 16H38z" fill="#334247"/>':'<path d="M43 50h15v10H43zm20 0h15v10H63zM58 54h5" fill="none" stroke="#3b4140" stroke-width="2"/>'}</svg>`}
function renderSuspects(){const c=cases[state.caseId],root=document.getElementById('suspectBoard');if(!c.agency){root.innerHTML='';return}root.innerHTML=`<div class="board-caption"><span>${escapeText(c.place)} / ${escapeText(c.title)}</span><button class="btn small" onclick="openSolve()">Presentar informe ↗</button></div><div class="suspect-grid">${c.people.map((p,i)=>`<article class="suspect ${state.selectedPerson===p.id?'person-active':''}"><button class="portrait" onclick="selectPerson('${p.id}')">${portrait(i)}<strong>${p.name}</strong><small>${p.role}</small><span>${state.witnessAsked[p.id]?.length?'DECLARACIÓN LEÍDA':'INTERROGAR'}</span></button><label class="person-label">Tu hipótesis<select aria-label="Hipótesis sobre ${p.name}" onchange="markPerson('${p.id}',this.value)">${['Pendiente','Sospechoso','Descartado'].map(v=>`<option ${state.personMarks?.[p.id]===v?'selected':''}>${v}</option>`).join('')}</select></label></article>`).join('')}</div>`}
startCase=function(id){if(integrated&&!bridgeInitialized){oldStartCase(id);return}const previous=loadState(id);currentTab='docs';oldStartCase(id);if(cases[id]?.agency){state.agencySolved=!!previous?.agencySolved;state.replay=state.agencySolved;saveState();}document.body.classList.toggle('agency-mode',!!cases[id]?.agency);document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab==='docs'));renderSuspects()};
renderCase=function(){oldRenderCase();renderSuspects();if(cases[state.caseId].agency){const c=cases[state.caseId];document.getElementById('objectiveBox').textContent=c.objective;document.querySelector('.selection-tip').textContent='Lee cada fuente y archiva sus pruebas.'}};
function markPerson(id,value){state.personMarks=state.personMarks||{};state.personMarks[id]=value;saveState()}
function selectPerson(id){const p=cases[state.caseId].people.find(p=>p.id===id);state.selectedPerson=id;state.witnessAsked[id]=[0];saveState();renderSuspects();document.getElementById('docTitle').textContent='Declaración · '+p.name;document.getElementById('paper').innerHTML=`<div class="eyebrow">TESTIMONIO / ${p.role}</div><h2>${p.name}</h2><p>«${escapeText(p.initial)}»</p><p class="witness-note">Una declaración debe contrastarse con otras fuentes. Mentir o equivocarse no demuestra por sí solo la responsabilidad.</p>`;currentDoc=null}
openDocument=function(id){oldOpenDocument(id);if(!cases[state.caseId].agency)return;const clue=cases[state.caseId].clues.find(x=>x.doc===id);if(clue)document.getElementById('paper').insertAdjacentHTML('beforeend',`<button class="btn primary" onclick="collectAgencyClue('${clue.id}')">${state.found.includes(clue.id)?'✓ Archivada':'Archivar como prueba'}</button>`)};
function collectAgencyClue(id){if(state.completed)return;if(!state.found.includes(id)){state.found.push(id);saveState();renderCase();openDocument(currentDoc);toast('Prueba archivada. Contrástala antes de acusar.')}}
// Do not reveal which sources are relevant before the final explanation.
const oldRenderEvidence=renderEvidence;
renderEvidence=function(){oldRenderEvidence();if(cases[state.caseId]?.agency)document.querySelectorAll('.evidence').forEach(el=>{el.classList.remove('false');el.querySelector('.type').textContent='FUENTE ARCHIVADA'})};
openSolve=function(){const c=cases[state.caseId];if(!c.agency)return oldOpenSolve();if(state.completed){toast('Este expediente está cerrado. Vuelve a abrirlo desde la agencia.');return}const options=state.found.map(id=>`<option value="${id}">${escapeText(c.docs.find(d=>d.id===c.clues.find(x=>x.id===id).doc).title)}</option>`).join('');showModal(`<div class="eyebrow">INFORME FINAL</div><h2>¿Qué puedes demostrar?</h2><p>Elige a la persona responsable y dos fuentes independientes que sostengan tu conclusión. Dispones de tres intentos.</p><label>Responsable<select id="solveWho" class="field"><option value="">Selecciona…</option>${c.people.map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</select></label><label>Primera prueba<select id="solveP1" class="field"><option value="">Selecciona…</option>${options}</select></label><label>Segunda prueba<select id="solveP2" class="field"><option value="">Selecciona…</option>${options}</select></label>`,submitSolve,'Entregar informe')};
submitSolve=function(){const c=cases[state.caseId];if(!c.agency)return oldSubmitSolve();if(state.completed)return;const who=document.getElementById('solveWho').value,p1=document.getElementById('solveP1').value,p2=document.getElementById('solveP2').value;if(!who||!p1||!p2||p1===p2){toast('Aporta una persona y dos pruebas diferentes.');return}state.finalAttempts++;const success=who===c.solution.responsible&&[p1,p2].every(p=>state.found.includes(p)&&c.solution.proofs.includes(p));if(success||state.finalAttempts>=3){if(success)state.agencySolved=true;finishCase(success,{who,p1,p2,confidence:'mid'});if(!success)document.querySelector('.result-hero').insertAdjacentHTML('beforeend',`<p>${escapeText(c.solution.what)}</p>`)}else{saveState();closeModal();toast(`La acusación no está demostrada. Revisa las dos fuentes. Quedan ${3-state.finalAttempts} intentos.`)}};
requestHint=function(){if(!cases[state.caseId].agency)return oldRequestHint();state.hints++;saveState();toast('Compara los registros originales: ¿qué cambió, en qué intervalo y quién pudo hacerlo?')};
const oldCreateConnection=createConnection;
createConnection=function(){if(state.completed)return;const [a,b]=selectedEvidence,rel=document.getElementById('relationSelect').value;if(state.connections.some(x=>((x.a===a&&x.b===b)||(x.a===b&&x.b===a))&&x.rel===rel)){toast('Esta relación ya está anotada.');return}oldCreateConnection()};
const oldShowHome=showHome;showHome=function(){oldShowHome();renderAgencyCases()};

// Guided onboarding advances only after real actions; progress is derived from saved state.
document.getElementById('agencyCases').insertAdjacentHTML('beforebegin','<section id="academyEntry"></section>');
center.insertAdjacentHTML('afterbegin','<section id="academyGuide" aria-label="Guía de aprendizaje" aria-live="polite" hidden></section>');
function academyStage(){
 if(!state||!cases[state.caseId]?.tutorial)return -1;
 if(state.completed)return 6;
 if(!state.witnessAsked.p0?.length)return 0;
 if(!state.found.includes('c0'))return 1;
 if(!state.found.includes('c1'))return 2;
 if(state.personMarks?.p1!=='Sospechoso')return 3;
 if(!state.connections.some(x=>isKeyConnection(x.a,x.b,x.rel)))return 4;
 return 5;
}
const academySteps=[
 ['Escucha antes de sospechar','Pulsa el retrato de Ada y lee su declaración. Ver un libro rojo no identifica un ejemplar concreto.','Interrogar a Ada'],
 ['Archiva tu primera prueba','Abre la fotografía, lee la etiqueta B-17 y pulsa «Archivar como prueba» al pie del documento.','Abrir fotografía'],
 ['Busca una fuente independiente','Abre el recibo y archívalo. Comprueba que habla del mismo libro y de la misma persona.','Abrir recibo'],
 ['Formula una hipótesis','En la tarjeta de Nora, cambia «Pendiente» a «Sospechoso». Es una hipótesis provisional, no una acusación.','Ver a Nora'],
 ['Relaciona las dos pruebas','En el tablero de la derecha, selecciona las dos pruebas. Elige «confirma» y pulsa «Crear conexión». Ambas fuentes encajan.','Localizar las pruebas'],
 ['Presenta lo que puedes demostrar','Pulsa «Presentar informe». Elige quién trasladó el libro y las dos pruebas que has contrastado.','Preparar informe'],
 ['Ya sabes investigar','Has escuchado, archivado, contrastado y justificado. Ahora puedes investigar un expediente sin guía.','Volver a la agencia']
];
function renderAcademy(){
 const saved=loadState('agency_tutorial');
 document.getElementById('academyEntry').innerHTML=`<div><span class="eyebrow">ACADEMIA / CASO 00</span><h2>¿Tu primera investigación?</h2><p>Aprende jugando con «El libro viajero»: tres personas, dos pruebas y una guía paso a paso.</p></div><button class="btn primary" onclick="startCase('agency_tutorial')">${saved?.agencySolved?'Repetir aprendizaje':saved&&!saved.completed?'Continuar aprendizaje':'Aprender a jugar'} →</button><small>Opcional · unos 3 minutos · puedes ir directamente a cualquier expediente</small>`;
 const guide=document.getElementById('academyGuide'),stage=academyStage();guide.hidden=stage<0;document.body.classList.toggle('academy-mode',stage>=0);
 if(stage<0)return;
 const [title,text,action]=academySteps[stage];
 guide.innerHTML=`<div class="academy-step">${stage===6?'INICIACIÓN COMPLETADA':`PASO ${stage+1} DE 6`}</div><div><strong>${title}</strong><p>${text}</p></div><button class="btn small primary" onclick="academyAction()">${action} →</button><button class="btn small ghost" onclick="showHome()">Salir de la guía</button>`;
}
function academyAction(){
 switch(academyStage()){
 case 0:selectPerson('p0');break;
 case 1:openDocument('d1');break;
 case 2:openDocument('d2');break;
 case 3:selectPerson('p1');break;
 case 4:document.getElementById('relationSelect').focus();document.getElementById('evidenceList').scrollIntoView({block:'nearest',behavior:'smooth'});break;
 case 5:openSolve();break;
 case 6:showHome();break;
 }
}
for(const name of ['startCase','selectPerson','openDocument','collectAgencyClue','markPerson','createConnection','refreshHeader']){
 const original=window[name];window[name]=function(...args){const result=original(...args);renderAcademy();return result};
}
const academyOldHome=showHome;showHome=function(){academyOldHome();document.getElementById('academyGuide').hidden=true;document.body.classList.remove('academy-mode')};
const academyOldSolve=openSolve;openSolve=function(){if(cases[state.caseId]?.tutorial&&academyStage()<5){toast('Completa primero los pasos de la nota dorada. Te ayudarán a justificar la solución.');return}academyOldSolve()};
const academyOldSubmit=submitSolve;submitSolve=function(){
 if(cases[state.caseId]?.tutorial){
  const who=document.getElementById('solveWho').value,p1=document.getElementById('solveP1').value,p2=document.getElementById('solveP2').value;
  if(who!=='p1'||p1===p2||![p1,p2].every(p=>state.found.includes(p))){toast('Revisa la fotografía y el recibo: identifica la etiqueta B-17 y quién entrega el libro. Elige las dos fuentes distintas. Puedes intentarlo sin penalización.');return}
 }
 academyOldSubmit();renderAcademy();
};
renderAcademy();
