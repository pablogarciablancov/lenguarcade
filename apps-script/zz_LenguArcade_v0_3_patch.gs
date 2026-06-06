/** LenguArcade v0.4.1 - parche estable. Mantiene nombres V03 usados por los HTML. */

function setupLenguArcadeV03(){ensureSheets_();seedConfig_();seedClasses_();seedGames_();seedMissions_();seedDemoStudents_();migrateStudentPins_();upgradeCatalogV03_();clearCacheV03_();return{ok:true,version:'0.4.1',spreadsheetUrl:getDb_().getUrl(),counts:getCounts_(),message:'LenguArcade v0.4.1 listo.'};}

function getPublicMetaV03(){ensureSheets_();return cachedJsonV03_('public_meta_v041',function(){return{ok:true,version:'0.4.1',classes:rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.CLASES)).filter(c=>isTrue_(c.activa)),games:getActiveGames_(),activeUserEmail:getActiveUserEmail_()};},300);}

function getStudentsByClassV03(classCode){ensureSheets_();return cachedJsonV03_('students_v041_'+String(classCode||'all'),function(){return rowsToObjects_(getSheet_(LA_CONFIG.SHEETS.ALUMNOS)).filter(s=>isTrue_(s.activo)&&String(s.clase)===String(classCode)).map(safeStudent_);},300);}