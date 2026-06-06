/**
 * LenguArcade v0.4.1 - parche acumulativo.
 * Este archivo añade funciones nuevas sin romper el backend v0.2.
 */

function setupLenguArcadeV03() {
  ensureSheets_();
  seedConfig_();
  seedClasses_();
  seedGames_();
  seedMissions_();
  seedDemoStudents_();
  migrateStudentPins_();
  upgradeCatalogV03_();
  clearCacheV03_();
  return { ok:true, version:'0.4.1', spreadsheetUrl:getDb_().getUrl(), counts:getCounts_(), message:'LenguArcade v0.4.