import assert from "node:assert/strict";
import {
  mondayOf, madridDate, fleetWeeklySnapshots, fleetAwardsForWeek, FLEET_START,
} from "../supabase/functions/_shared/fleet-weekly.js";

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
console.log("Flota semanal: 250 XP/punto, topes, constancia, lunes, Madrid e IDs estables OK");
