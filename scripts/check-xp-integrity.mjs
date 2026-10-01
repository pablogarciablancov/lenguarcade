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

console.log('XP integrity checks: OK');
