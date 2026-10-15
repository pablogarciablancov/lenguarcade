const fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib'),assert=require('node:assert/strict'),path=require('node:path');
const dir=__dirname,html=zlib.gunzipSync(Buffer.from([1,2,3,4].map(i=>fs.readFileSync(path.join(dir,`payload-${i}.b64`),'utf8').trim()).join(''),'base64')).toString();
const nodes=new Map(),storage=new Map(),messages=[];
function node(id){if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',dataset:{},classList:{add(){},remove(){},toggle(){}},insertAdjacentHTML(){},querySelector(){return node('nested')},querySelectorAll(){return []}});return nodes.get(id)}
const sandbox={console,URLSearchParams,location:{search:''},setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{getElementById:node,querySelector:node,querySelectorAll:()=>[],documentElement:node('html'),body:node('body')},window:{addEventListener(){},scrollTo(){},getSelection(){return null}}};
vm.createContext(sandbox);const run=s=>vm.runInContext(s,sandbox);
for(const [,attrs,body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)){if(!attrs.includes('src='))run(body)}
run(fs.readFileSync(path.join(dir,'agency-cases.js'),'utf8'));run(fs.readFileSync(path.join(dir,'agency.js'),'utf8'));
for(const id of run('AGENCY_CASES.map(c=>c.id)')){
 run(`startCase('${id}');collectAgencyClue('c0');collectAgencyClue('c1');markPerson('p1','Sospechoso');saveState();state=null;startCase('${id}')`);
 assert.equal(run("state.found.length"),2);assert.equal(run("state.personMarks.p1"),'Sospechoso');
 run("openSolve();document.getElementById('solveWho').value=cases[state.caseId].solution.responsible;document.getElementById('solveP1').value='c0';document.getElementById('solveP2').value='c0';submitSolve()");assert.equal(run('state.finalAttempts'),0);
 run("document.getElementById('solveP2').value='c1';document.getElementById('solveWho').value='invalid';submitSolve()");assert.equal(run('state.completed'),false);
 run("document.getElementById('solveWho').value=cases[state.caseId].solution.responsible;submitSolve()");assert.equal(run('state.completed'),true);assert.equal(run('state.agencySolved'),true);
 const xp=run('profile.xp');assert.ok(xp>0);
 run(`startCase('${id}');collectAgencyClue('c0');collectAgencyClue('c1');openSolve();document.getElementById('solveWho').value=cases[state.caseId].solution.responsible;document.getElementById('solveP1').value='c0';document.getElementById('solveP2').value='c1';submitSolve()`);assert.equal(run('profile.xp'),xp);
}
run("startCase('case001')");assert.equal(run('cases[state.caseId].title'),'El aula vacía');
run("integrated=true;bridgeChannel='test';bridgeInitialized=true;bridgeHostWindow={postMessage:m=>console.log(m.type)};sendBridgeResult(true,0,{})");
console.log('✓ Three cases: restore, marks, proof validation, wrong accusation, resolution, replay XP, original case and RESULT bridge.');
