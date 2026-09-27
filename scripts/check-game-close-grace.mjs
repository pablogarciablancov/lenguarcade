import assert from 'node:assert/strict';
import fs from 'node:fs';

const alumno=fs.readFileSync(new URL('../apps-script/LenguArcade_Alumno.html',import.meta.url),'utf8');
const access=fs.readFileSync(new URL('../supabase/functions/student-access-state/index.ts',import.meta.url),'utf8');
const save=fs.readFileSync(new URL('../supabase/functions/save-progress/index.ts',import.meta.url),'utf8');
const shared=fs.readFileSync(new URL('../supabase/functions/_shared/lenguarcade.ts',import.meta.url),'utf8');

assert.match(alumno,/gameRunnerAccessClosing/,'Existe el aviso dentro del runner');
assert.match(alumno,/accessClosureDeadline=.*\+60000/,'La gracia dura un minuto desde el cierre');
assert.match(alumno,/accessFinalCheckpointPending=true/,'El cierre solicita un último checkpoint');
assert.match(alumno,/accessClosureCheckpoint:closureCheckpoint/,'El checkpoint final se marca de forma explícita');
assert.match(alumno,/accessFrozen=true/,'Los guardados quedan congelados tras el checkpoint final');
assert.match(alumno,/runner\.accessClosing&&!runner\.explicitExitRequested/,'CLOSE_READY no expulsa antes de terminar la gracia');
assert.match(alumno,/destroyGameRunner\(true\)/,'El portal puede cerrar el juego sin depender del iframe');
assert.match(alumno,/3000\*Math\.pow\(2,failures\)\):3000/,'El sondeo visible normal es de tres segundos');
assert.match(alumno,/laHandleActiveGameAccessChange/,'Los cambios de acceso alcanzan al juego activo');

assert.match(access,/select\("game_id,enabled,updated_at"\)/,'El estado ligero recibe el instante del cierre');
assert.match(access,/closedAt/,'El estado ligero devuelve closedAt');

assert.match(save,/accessClosureCheckpoint === true/,'El backend reconoce el checkpoint final');
assert.match(save,/Math\.abs\(serverClosedMs - requestedClosedMs\) <= 1500/,'El checkpoint debe corresponder al cierre real');
assert.match(save,/nowMs <= serverClosedMs \+ 60000/,'El permiso excepcional caduca al minuto');
assert.match(save,/game_access_closed/,'Los demás guardados siguen bloqueados');

assert.match(shared,/Access-Control-Max-Age.*600/,'El preflight CORS se cachea');

console.log('Cierre de juego correcto: último checkpoint, guardado congelado, minuto de gracia, salida segura y sondeo de 3 s.');
