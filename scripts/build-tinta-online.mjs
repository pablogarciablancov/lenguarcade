import fs from 'node:fs';
const base='games/tinta_y_acero/';
const code=['content.js','engine.js'].map(f=>fs.readFileSync(base+f,'utf8')).join('\n');
const output='const scope={crypto:globalThis.crypto};\n(function(globalThis,window){'+code+'\n})(scope,undefined);\nexport const {Game}=scope.InkEngine;\nexport const content=scope.InkContent;\nexport const bank='+JSON.stringify(fs.readFileSync(base+'words.txt','utf8').split(/\s+/))+';\n';
fs.writeFileSync('supabase/functions/tinta-online/game.mjs',output);
