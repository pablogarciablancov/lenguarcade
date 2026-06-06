/**
 * LenguArcade v0.4.1 - parche estable.
 * Mantiene los nombres V03 que usan los HTML y añade detalle completo de alumno para profesor.
 */

function setupLenguArcadeV03() {
  ensureSheets_();
  seedConfig_();
  seedClasses_();
  seedGames_();
  seedMissions_();
  seedDemoStudents_();
  migrateStudentPins_();
  upgradeCatalogV041_();
  clearCacheV041_();
  return { ok:true, version:'0.4.1', spreadsheetUrl:getDb_().getUrl(), counts:getCounts_(),