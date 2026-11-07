import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const dir=path.dirname(fileURLToPath(import.meta.url));
const source=fs.readFileSync(path.join(dir,'rpg-modes-v1.js'),'utf8');
const css=fs.readFileSync(path.join(dir,'rpg-modes-v1.css'),'utf8');
const index=fs.readFileSync(path.join(dir,'index.html'),'utf8');
new vm.Script(source,{filename:'rpg-modes-v1.js'});

const sandbox={
  window:{},
  document:{readyState:'loading',addEventListener(){}}
};
vm.runInNewContext(source,sandbox,{filename:'rpg-modes-v1.js'});
const api=sandbox.window.BG2RPGModesV1;
assert.deepEqual(Array.from(api.modeIds),['expedition','adventure']);
assert.ok(api.questionCount>=24,'El prototipo debe ofrecer variedad suficiente');

function literal(regex,label){
  const found=source.match(regex);
  assert.ok(found,'Falta la definición de '+label);
  return vm.runInNewContext('('+found[1]+')');
}

const questions=literal(/const QUESTIONS=(\[[\s\S]*?\])\.map\(\(q,i\)=>/,'preguntas');
assert.equal(questions.length,api.questionCount);
for(const [i,q] of questions.entries()){
  assert.equal(q.length,5,'Pregunta '+i+' mal formada');
  assert.ok(q[1].length>10,'Enunciado demasiado corto '+i);
  assert.ok(q[2].length>=3,'Pocas opciones '+i);
  assert.ok(Number.isInteger(q[3])&&q[3]>=0&&q[3]<q[2].length,'Respuesta fuera de rango '+i);
  assert.ok(q[4].length>15,'Falta explicación en '+i);
}
const categories=new Set(questions.map(q=>q[0]));
assert.ok(categories.size>=4,'Debe haber variedad entre áreas lingüísticas');

const maps=literal(/const MAPS=(\{[\s\S]*?\});\s*const EXPEDITION=/,'mapas');
for(const [name,rows] of Object.entries(maps)){
  assert.equal(rows.length,7,name+' debe tener siete filas');
  rows.forEach(row=>assert.equal(row.length,10,name+' debe tener diez columnas'));
}
function reachable(map,start,end){
  const queue=[start],seen=new Set();
  while(queue.length){
    const [x,y]=queue.shift(),key=x+','+y;
    if(seen.has(key))continue;
    seen.add(key);
    if(x===end[0]&&y===end[1])return true;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,t=map[ny]?.[nx];
      if(t&&t!=='T'&&t!=='#')queue.push([nx,ny]);
    }
  }
  return false;
}
assert.ok(reachable(maps.bosque,[3,4],[5,5]),'La entrada a la cripta es inaccesible');
assert.ok(reachable(maps.bosque,[3,4],[2,3]),'El cronista es inaccesible');
assert.ok(reachable(maps.cripta,[3,5],[8,1]),'El jefe de la cripta es inaccesible');

const expedition=literal(/const EXPEDITION=(\[[\s\S]*?\]);\s*let state=/,'expedición');
assert.equal(expedition.length,5);
assert.ok(expedition.at(-1).some(e=>e.enemy==='draco'),'La expedición debe terminar con un jefe');
assert.ok(expedition.slice(0,4).some(stage=>stage.length>1),'Deben existir decisiones de ruta');

assert.ok(index.includes('./rpg-modes-v1.js?v=1'),'El módulo debe estar cargado en la Battlegrafía oficial');
assert.ok(css.includes('#bg2-extra-root'),'Falta la capa visual aislada');
assert.ok(!source.includes("setItem('bg_modeId'"),'No tocar el modo oficial');
assert.ok(!source.includes('battlegrafia_v2_save_slots_v1_'),'No tocar ranuras oficiales');

console.log('Battlegrafía RPG: 2 modos, '+questions.length+' preguntas y mapas conectados. Smoke OK.');
