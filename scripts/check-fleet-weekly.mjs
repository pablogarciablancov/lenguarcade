import assert from "node:assert/strict";
import {
  mondayOf, madridDate, fleetWeeklySnapshots, fleetAwardsForWeek, FLEET_START,
} from "../supabase/functions/_shared/fleet-weekly.js";

import {isFleetTeacherPilot} from "../supabase/functions/_shared/fleet-weekly-delivery.js";

const snapshots=(rows,today="2026-11-06")=>fleetWeeklySnapshots(
  rows.map(([local_day,xp])=>({local_day,xp})),today
);
assert.equal(FLEET_START,"2026-11-02");
assert.equal(mondayOf("2026-11-02"),"2026-11-02");
assert.equal(mondayOf("2026-11-08"),"2026-11-02");
assert.equal(mondayOf("2026-11-09"),"2026-11-09");
assert.equal(madridDate(new Date("2026-11-01T23:30:00Z")),"2026-11-02");
assert.equal(madridDate(new Date("2026-10-25T01:30:00Z")),"2026-10-25");
const week=snapshots([["2026-11-05",300],["2026-11-06",200]])[0];
assert.equal(week.xpPoints,2);
assert.equal(week.bonusPoints,1);
assert.equal(week.earnedPoints,3);
assert.equal(week.xpReserved,0);
assert.equal(week.activeDays,2);
const capped=snapshots([["2026-11-02",1250],["2026-11-03",1000]])[0];
assert.equal(capped.xpPoints,6);
assert.equal(capped.bonusPoints,1);
assert.equal(capped.earnedPoints,7);
assert.equal(capped.xpReserved,0);
const sameDay=snapshots([["2026-11-02",900]])[0];
assert.equal(sameDay.xpPoints,3);
assert.equal(sameDay.bonusPoints,0);
assert.equal(sameDay.xpReserved,150);
const noReset=snapshots([["2026-11-05",200],["2026-11-09",100]],"2026-11-09");
assert.equal(noReset[0].xpReserved,200);
assert.equal(noReset[1].xpReserved,100);
assert.equal(noReset[1].xpPoints,0);
assert.equal(noReset[1].activeDays,1);
const noAccidentalBonus=snapshots([["2026-11-05",200],["2026-11-06",0]])[0];
assert.equal(noAccidentalBonus.activeDays,1);
assert.equal(noAccidentalBonus.bonusPoints,0);
const ids=fleetAwardsForWeek("perfil-1",capped);
assert.equal(ids.length,7);
assert.equal(new Set(ids.map(award=>award.award_id)).size,7);
assert.equal(ids.at(-1).award_key,"CONSTANCIA");
assert.equal(ids[0].award_id, "LA:WEEK:2026-11-02:perfil-1:XP:1");
assert.equal(fleetAwardsForWeek("perfil-1",week).length,3);
assert.deepEqual(fleetAwardsForWeek("perfil-1",week),fleetAwardsForWeek("perfil-1",week));
assert.equal(snapshots([["2026-10-30",10000]])[0].earnedPoints,0);

const migration=await import("node:fs").then(fs=>fs.readFileSync("supabase/migrations/20261112171647_fleet_all_game_xp_including_rayuela.sql","utf8"));
assert.match(migration,/join public\.games g on g\.id=e\.game_id/);
assert.match(migration,/e\.game_id <> 'lenguarcade_admin'/);
assert.match(migration,/e\.event_type <> 'teacher_adjustment'/);
assert.doesNotMatch(migration,/rayuela_ending_reward.*(?:<>|not in|not like)/);
assert.doesNotMatch(migration,/class_boss_reward.*(?:<>|not in|not like)/);
// La XP de cualquier juego se suma por fecha; los límites se aplican al total diario.
const fromAllGames=snapshots([["2026-11-12",650]],"2026-11-12").at(-1);
assert.equal(fromAllGames.xpEarned,650);
assert.equal(fromAllGames.xpPoints,2);
const bonusCarry=snapshots([["2026-11-05",1300],["2026-11-06",800]],"2026-11-06").at(-1);
assert.equal(bonusCarry.xpPoints,6);
assert.equal(bonusCarry.bonusPoints,1);


const receiverHelper=(await import("node:fs")).readFileSync("integrations/flota-las-tablas/validar-puntos-lenguarcade.gs","utf8");
const validateAward=new Function(receiverHelper+";return validarPuntosPremioLenguArcade_;")();
const validProfile="11111111-1111-4111-8111-111111111111";
const weeklyId="LA:WEEK:2026-11-09:"+validProfile+":XP:1";
const workshopId="LA:"+"a".repeat(64);
assert.equal(validateAward(validProfile,weeklyId,1),true);
assert.equal(validateAward(validProfile,weeklyId,5),false);
assert.equal(validateAward("22222222-2222-4222-8222-222222222222",weeklyId,1),false);
assert.equal(validateAward(validProfile,"LA:WEEK:2026-11-09:"+validProfile+":XP:7",1),false);
assert.equal(validateAward(validProfile,"LA:WEEK:2026-11-09:"+validProfile+":CONSTANCIA",1),true);
assert.equal(validateAward(validProfile,workshopId,5),true);
assert.equal(validateAward(validProfile,workshopId,1),false);

const pilot={role:"teacher",source:"google",active:true,email:"pgarciab@fomento.edu"};
assert.equal(isFleetTeacherPilot(pilot),true);
assert.equal(isFleetTeacherPilot({...pilot,email:"otro@fomento.edu"}),false);
assert.equal(isFleetTeacherPilot({...pilot,role:"student"}),false);
assert.equal(isFleetTeacherPilot({...pilot,source:"test"}),false);
assert.equal(isFleetTeacherPilot({...pilot,active:false}),false);
assert.equal(isFleetTeacherPilot({...pilot,email:"pgarciab@gmail.com"}),false);
// Ejemplo de su semana real: 234 XP todavía no alcanzan un punto.
const pilotWeek=snapshots([["2026-11-12",234]],"2026-11-12").at(-1);
assert.equal(pilotWeek.xpPoints,0);
assert.equal(snapshots([["2026-11-12",252]],"2026-11-12").at(-1).xpPoints,1);
const dashboardSource=(await import("node:fs")).readFileSync("supabase/functions/student-dashboard/index.ts","utf8");
assert.match(dashboardSource,/enrolledStudent \|\| isFleetTeacherPilot\(profile\)/);

console.log("Flota semanal: 250 XP/punto, topes, constancia, lunes, Madrid, todos los juegos e IDs estables OK");
