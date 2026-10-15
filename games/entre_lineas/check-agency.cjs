const fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib'),assert=require('node:assert/strict'),path=require('node:path');
const dir=__dirname,html=zlib.gunzipSync(Buffer.from([1,2,3,4].map(i=>fs.readFileSync(path.join(dir,`payload-${i}.b64`),'utf8').trim()).join(''),'base64')).toString();
const nodes=new Map(),storage=new Map(),messages=[];
function node(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',dataset:{},classList:{add(){},remove(){},toggle(){}},insertAdjacentHTML(){},querySelector(){return node('nested')},querySelectorAll(){return []}});return nodes.get(id)}
const sandbox={console,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{getElementById:node,querySelector:node,querySelectorAll:()=>[],documentElement:node('html'),body:node('body')},window:{addEventListener(){},scrollTo(){},getSelection(){return null}}};
Object.assign(sandbox,sandbox.window);sandbox.window=sandbox;vm.createContext(sandbox);const run=s=>vm.runInContext(s,sandbox);
for(const [,attrs,body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){if(!attrs.includes('src='))run(body)}
run(fs.readFileSync(path.join(dir,'agency-cases.js'),'utf8'));run(fs.readFileSync(path.join(dir,'agency.js'),'utf8'));
for(const id of run('AGENCY_CASES.filter(c=>!c.tutorial).map(c=>c.id)')){
 run(`startCase('${id}');collectAgencyClue('c0');collectAgencyClue('c1');markPerson('p1','Sospechoso');saveState();state=null;startCase('${id}')`);
 assert.equal(run("state.found.length"),2);assert.equal(run("state.personMarks.p1"),'Sospechoso');
 run("openSolve();document.getElementById('solveWho').value=cases[state.caseId].solution.responsible;document.getElementById('solveP1').value='c0';document.getElementById('solveP2').value='c0';submitSolve()");assert.equal(run('state.finalAttempts'),0);
 run("document.getElementById('solveP2').value='c1';document.getElementById('solveWho').value='invalid';submitSolve()");assert.equal(run('state.completed'),false);
 run("document.getElementById('solveWho').value=cases[state.caseId].solution.responsible;submitSolve()");assert.equal(run('state.completed'),true);assert.equal(run('state.agencySolved'),true);
 const xp=run('profile.xp');assert.ok(xp>0);
 run(`startCase('${id}');collectAgencyClue('c0');collectAgencyClue('c1');openSolve();document.getElementById('solveWho').value=cases[state.caseId].solution.responsible;document.getElementById('solveP1').value='c0';document.getElementById('solveP2').value='c1';submitSolve()`);assert.equal(run('profile.xp'),xp);
}
run("startCase('agency_tutorial')");assert.equal(run('academyStage()'),0);
run('openSolve()');assert.equal(run('state.finalAttempts'),0);
run("selectPerson('p0')");assert.equal(run('academyStage()'),1);
run("openDocument('d1');collectAgencyClue('c0')");assert.equal(run('academyStage()'),2);
run("openDocument('d2');collectAgencyClue('c1')");assert.equal(run('academyStage()'),3);
run("markPerson('p1','Sospechoso');saveState();state=null;startCase('agency_tutorial')");assert.equal(run('academyStage()'),4);
run("selectedEvidence=['c0','c1'];document.getElementById('relationSelect').value='confirma';createConnection()");assert.equal(run('academyStage()'),5);
run("openSolve();document.getElementById('solveWho').value='p2';submitSolve()");assert.equal(run('state.finalAttempts'),0);
run("document.getElementById('solveWho').value='p1';document.getElementById('solveP1').value='c0';document.getElementById('solveP2').value='c1';submitSolve()");assert.equal(run('academyStage()'),6);
const tutorialXP=run('profile.xp');
run("startCase('agency_tutorial');selectPerson('p0');openDocument('d1');collectAgencyClue('c0');openDocument('d2');collectAgencyClue('c1');markPerson('p1','Sospechoso');selectedEvidence=['c0','c1'];document.getElementById('relationSelect').value='confirma';createConnection();openSolve();document.getElementById('solveWho').value='p1';document.getElementById('solveP1').value='c0';document.getElementById('solveP2').value='c1';submitSolve()");assert.equal(run('profile.xp'),tutorialXP);
run("startCase('case001')");assert.equal(run('cases[state.caseId].title'),'El aula vacía');
run("integrated=true;bridgeChannel='test';bridgeInitialized=true;bridgeHostWindow={postMessage:m=>console.log(m.type)};sendBridgeResult(true,0,{})");
console.log('✓ Three cases: restore, marks, proof validation, wrong accusation, resolution, replay XP, original case and RESULT bridge.');

run("integrated=false;state=null");
run(fs.readFileSync(path.join(dir,'trophy.js'),'utf8'));
run("startCase('agency_trophy')");assert.equal(run('state.trophy.brunoAdmission'),false);
run('trophyWarehouse()');assert.equal(run('state.trophy.warehouse'),false);
run("trophyTalk('celia');trophyConfront('bruno','celia')");assert.equal(run('state.trophy.brunoAdmission'),true);
run("trophyInspect('photo');trophyConfront('bruno','photo')");assert.equal(run('state.trophy.timing'),true);
run("trophyInspect('label');trophyConfront('nora','label')");assert.equal(run('state.trophy.noraAdmission'),true);
run("saveState();state=null;startCase('agency_trophy')");assert.equal(run('state.trophy.timing && state.trophy.noraAdmission'),true);
run("trophyConfront('celia','photo')");assert.equal(run('state.completed'),false);
run("trophyInspect('receipt');trophyInspect('dispatch');trophyWarehouse()");assert.equal(run('state.trophy.warehouse'),true);
run('trophyOpenBox(12)');assert.equal(run('state.trophy.recovered'),false);
run('trophyOpenBox(28)');assert.equal(run('state.trophy.recovered'),true);
run('trophyReconstruct();trophySubmit()');assert.equal(run('state.completed'),false);
run("['move','box','trip'].forEach((v,i)=>document.getElementById('trophyEvent'+i).value=v);['bruno','nora','transport'].forEach((v,i)=>document.getElementById('trophyProof'+i).value=v);trophySubmit()");assert.equal(run('state.completed'),true);
const trophyXP=run('profile.xp');
run("startCase('agency_trophy');trophyTalk('celia');trophyConfront('bruno','celia');trophyInspect('photo');trophyConfront('bruno','photo');trophyInspect('label');trophyConfront('nora','label');trophyInspect('receipt');trophyInspect('dispatch');trophyWarehouse();trophyOpenBox(28);trophyReconstruct();trophySubmit()");assert.equal(run('profile.xp'),trophyXP);
run("startCase('agency_manuscrito')");assert.equal(run('state.caseId'),'agency_manuscrito');
console.log('✓ Interactive trophy: confrontations, unlocks, restoration, warehouse, reconstruction, replay XP and return to existing cases.');
