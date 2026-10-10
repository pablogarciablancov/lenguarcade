import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('supabase/functions/_shared/progression.js','utf8');
const progression=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const {snapshotProgress}=progression;

const old={xp:100,feathers:2,attempts:10,successes:8,errors:2,accuracy:80,percentage:5};
const priorBattle={stats_correct:8,stats_wrong:2,defeatedMonsters:['m1'],totalMonsters:20};
const nextBattle={stats_correct:9,stats_wrong:2,defeatedMonsters:['m1'],totalMonsters:20};
const battle=snapshotProgress('battlegrafia',nextBattle,priorBattle,old,{}, {},{checkpoint:true});
assert.equal(battle.xp,106,'Battlegrafía debe premiar el progreso real, no un checkpoint');
assert.equal(battle.attempts,11);
assert.equal(battle.successes,9);

const repeated=snapshotProgress('battlegrafia',nextBattle,nextBattle,old,{}, {},{checkpoint:true});
assert.equal(repeated.xp,100,'Repetir el mismo guardado debe dar 0 XP');
assert.equal(repeated.feathers,2,'Repetir el mismo guardado debe dar 0 plumas');

const defeated=snapshotProgress(
  'battlegrafia',
  {stats_correct:10,stats_wrong:2,defeatedMonsters:['m1','m2'],totalMonsters:20},
  nextBattle,
  old,{}, {},{checkpoint:true}
);
assert.ok(defeated.xp>100&&defeated.xp<=131,'Un avance real de Battlegrafía debe dar XP proporcional y acotado');

const genericRaw={metrics:{correct:9,errors:3,attempts:12,percentage:10}};
const genericPrior={metrics:{correct:8,errors:2,attempts:10,percentage:9}};
const generic=snapshotProgress('maniacgrafia',{}, {},old,genericRaw,genericPrior,{checkpoint:true});
assert.equal(generic.xp,106,'Los juegos genéricos deben premiar aciertos nuevos, no XP del cliente');
assert.equal(generic.attempts,12);

const genericRepeat=snapshotProgress('maniacgrafia',{}, {},old,genericRaw,genericRaw,{checkpoint:true});
assert.equal(genericRepeat.xp,100,'Un autosave genérico idéntico debe dar 0 XP');

const forged=snapshotProgress(
  'maniacgrafia',{}, {},old,
  {metrics:{correct:9999,errors:0,attempts:9999,percentage:100}},
  {metrics:{correct:0,errors:0,attempts:0,percentage:0}},
  {checkpoint:true}
);
assert.ok(forged.xp-old.xp<=150,'Un salto manipulado no puede superar el tope por checkpoint');

const rayuelaPrior={
  activeProjectId:'p1',
  projects:[{id:'p1',status:'draft',nodes:[{id:'a',type:'start',choices:[]}],objectiveRewards:[]}]
};
const rayuelaNext={
  activeProjectId:'p1',
  projects:[{id:'p1',status:'draft',nodes:[
    {id:'a',type:'start',choices:[{targetId:'b'}]},
    {id:'b',type:'ending',choices:[]}
  ],objectiveRewards:['o1']}]
};
const rayuela=snapshotProgress('rayuela',rayuelaNext,rayuelaPrior,old,{}, {},{checkpoint:true});
assert.ok(rayuela.xp>old.xp&&rayuela.xp-old.xp<150,'Rayuela debe premiar solo estructura nueva');

const entre=snapshotProgress(
  'entre_lineas',
  {profile:{cases:2}},
  {profile:{cases:1}},
  old,
  {metrics:{correct:9,errors:2,attempts:11,percentage:100}},
  {metrics:{correct:8,errors:2,attempts:10,percentage:80}},
  {checkpoint:false}
);
assert.equal(entre.xp,166,'Entre Líneas debe premiar un acierto y un caso realmente nuevo');


const {XP_REWARD_GUIDE,capProgressionAward}=progression;
const fixtures={
 battlegrafia:[{stats_correct:0,stats_wrong:0,defeatedMonsters:[],totalMonsters:20},{stats_correct:1,stats_wrong:0,defeatedMonsters:[],totalMonsters:20},{},{}],
 sopa_de_tinta:[{profile:{stats:{words:0,errors:0}}},{profile:{stats:{words:1,errors:0}}},{},{}],
 rayuela:[{activeProjectId:'p1',projects:[{id:'p1',status:'draft',nodes:[],objectiveRewards:[]}]},{activeProjectId:'p1',projects:[{id:'p1',status:'draft',nodes:[{id:'n1',choices:[]},{id:'n2',choices:[]}],objectiveRewards:[]}]},{},{}],
 entre_lineas:[{profile:{cases:0}},{profile:{cases:1}},{metrics:{correct:0,errors:0,attempts:0}},{metrics:{correct:1,errors:0,attempts:1}}],
 versopolis:[{run:{startedAt:'r1',stats:{compositions:0,contracts:0},runScore:0}},{run:{startedAt:'r1',stats:{compositions:1,contracts:1},runScore:0}},{},{}],
 lexaria:[{career:{metrics:{trainingAttempts:0,trainingCorrect:0},careerWins:0,duels:{}}},{career:{metrics:{trainingAttempts:1,trainingCorrect:1},careerWins:0,duels:{}}},{},{}],
 tierras_de_tinta:[{campaign:{stats:{asked:0,correct:0},victories:{}}},{campaign:{stats:{asked:1,correct:1},victories:{}}},{},{}],
};
const allOfficialGames=['battlegrafia','maniacgrafia','narratoria','versopolis','scrabble','conjuga_apuesta','verb_battle','rayuela','entre_lineas','tower_defense','word_play','tierras_de_tinta','lexaria','lexitrama','lexoma','sopa_de_tinta'];
for(const gameId of allOfficialGames){
 assert.ok(XP_REWARD_GUIDE[gameId],gameId+' debe explicar la regla de XP');
 const fixture=fixtures[gameId]||[{}, {},{metrics:{correct:0,errors:0,attempts:0,percentage:0}},{metrics:{correct:1,errors:0,attempts:1,percentage:10}}];
 const [prior,save,priorRaw,raw]=fixture;
 const result=snapshotProgress(gameId,save,prior,{},raw,priorRaw,{});
 assert.ok(result.xp>=6,gameId+' debe conceder XP por progreso válido');
}
assert.deepEqual(capProgressionAward(240,20,170,890,14,58),{
 awardedXp:10,awardedFeathers:1,pendingXp:230,pendingFeathers:19
},'La protección debe aplazar y no borrar el excedente');
assert.deepEqual(capProgressionAward(25,3,0,0,0,0),{
 awardedXp:25,awardedFeathers:3,pendingXp:0,pendingFeathers:0
},'Los premios dentro del límite se pagan completos');

const edge=readFileSync('supabase/functions/save-progress/index.ts','utf8');
assert.match(edge,/const newXp = oldXp;/,'El backend no debe aceptar XP absoluto del cliente');
assert.match(edge,/xpReward:0,/,'Los logros reportados por cliente no deben acuñar XP');
assert.match(edge,/180 - minuteXp/,'Debe existir un límite de XP por minuto');
assert.match(edge,/900 - tenMinuteXp/,'Debe existir un límite de XP por diez minutos');
assert.match(edge,/serverAuthoritative:true/,'Los eventos deben registrar la protección de integridad');
assert.doesNotMatch(edge,/oldXp \+ xpDelta/,'No debe quedar la ruta genérica antigua que sumaba XP del cliente');

const legacy=readFileSync('apps-script/LenguArcade_Code.gs','utf8');
const legacyProgression=readFileSync('apps-script/LenguArcade_Progression.gs','utf8');
assert.equal(legacy.includes('calculateAuthoritativeProgress_(game.gameId, payload, old)'),true,'La copia legacy también debe recalcular recompensas');
assert.equal(legacy.includes('old.xp + Number(progress.xpDelta'),false,'Apps Script no debe sumar XP enviado por el cliente');
assert.match(legacyProgression,/function calculateAuthoritativeProgress_/,'Debe existir el cálculo autoritativo de respaldo');

const {runInNewContext}=await import('node:vm');
const legacyContext={};runInNewContext(legacyProgression,legacyContext);
const sopaPrior={profile:{stats:{words:8,errors:2},adventure:{}}};
const sopaNext={profile:{xp:1000000,stats:{words:10,errors:3},adventure:{narrativa:{0:3}}}};
const sopa=snapshotProgress('sopa_de_tinta',sopaNext,sopaPrior,old,{metrics:{percentage:100}}, {},{checkpoint:true});
assert.equal(sopa.xp,112);assert.equal(sopa.attempts,13);assert.equal(sopa.successes,10);
assert.equal(sopa.percentage,5,'La primera aventura no debe dar un 100 %, ni reducir el porcentaje anterior');
const first=snapshotProgress('sopa_de_tinta',sopaNext,sopaPrior,{...old,percentage:0}, {}, {},{checkpoint:true});
assert.ok(Math.abs(first.percentage-100/28)<1e-10);
const replay=snapshotProgress('sopa_de_tinta',sopaNext,sopaNext,sopa,{}, {},{checkpoint:false});
assert.deepEqual(replay,sopa,'El resultado posterior al checkpoint no duplica progreso ni XP');
const reset=snapshotProgress('sopa_de_tinta',{profile:{stats:{words:1,errors:0}}},sopaNext,sopa,{}, {},{checkpoint:true});
assert.equal(reset.xp,sopa.xp,'Reiniciar totales no concede XP');
const relax=snapshotProgress('sopa_de_tinta',{profile:{stats:{words:8},adventure:{}}},{},{},{metrics:{percentage:100}}, {},{checkpoint:false});
assert.equal(relax.percentage,0,'Una sopa relax no completa la aventura');
const all={};for(const id of ['narrativa','morfologia','verbos','sintaxis','literatura','semantica','ortografia'])all[id]={0:1,1:1,2:1,3:1,999:1};
assert.equal(snapshotProgress('sopa_de_tinta',{profile:{adventure:all}},{},{},{},{},{}).percentage,100);
const fallback=legacyContext.calculateAuthoritativeProgress_('sopa_de_tinta',{checkpoint:true,rawGameData:{save:sopaNext}},{...old,plumas:old.feathers,rawJson:JSON.stringify({save:sopaPrior})});
for(const field of ['xp','attempts','successes','errors','percentage','accuracy'])assert.equal(fallback[field],sopa[field],'Paridad Apps Script/Supabase: '+field);
assert.equal(fallback.plumas,sopa.feathers);
console.log('XP integrity checks: OK');
