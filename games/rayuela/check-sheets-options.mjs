import assert from 'node:assert/strict';
import {convertGrid} from './sheets-converter.mjs';
import sceneText from './scene-text.js';
function scene(text,overrides){
  const values=Array.from({length:10},()=>Array(10).fill(''));
  values[5][5]=text;values[5][4]='Final italiano';values[5][6]='Final español';
  const result=convertGrid({id:'test',title:'Prueba',values,startCell:'F6',overrides});
  return {...result,node:result.project.nodes.find(n=>n.type==='start')};
}
for(const text of ['Te vas a la liga italiana\n⬅\n\nO te vas a la liga española\n➡','Te vas a la liga italiana⬅ O te vas a la liga española➡']){
  const r=scene(text);assert.deepEqual(r.node.choices.map(c=>c.text),['Te vas a la liga italiana','Te vas a la liga española']);
  assert.deepEqual(r.node.choices.map(c=>c.targetId),['n_4_3','n_4_5']);assert.equal(r.issues.length,0);
  assert(r.node.text.includes('italiana')&&r.node.text.includes('española'),'conserva la prosa original');
  assert.equal(sceneText(r.node.text,r.node.choices),'','la tarjeta sin narración muestra solo las dos opciones distintas');
}
const prefix=scene('Elige tu liga.\n⬅Liga italiana\n➡Liga española');
assert.deepEqual(prefix.node.choices.map(c=>c.text),['Liga italiana','Liga española']);
const separate=scene('Ves el salto.\nSaltas\n⬅Lo esquivas\n➡');
assert.deepEqual(separate.node.choices.map(c=>c.text),['Saltas','Lo esquivas']);
const unclear=scene('⬅Una narración sin dos opciones explícitas.➡');
assert(unclear.issues.some(i=>i.reason==='ambiguous_choice_labels'),'exige revisión si las flechas rodean una narración');
const fixed=scene('⬅Una narración sin dos opciones explícitas.➡',{F6:['Pedir ayuda','Salir solo']});
assert.equal(fixed.issues.length,0);assert.deepEqual(fixed.node.choices.map(c=>c.text),['Pedir ayuda','Salir solo']);
assert(scene('Una opción⬅Una opción➡').issues.some(i=>i.reason==='ambiguous_choice_labels'));
console.log('Rayuela: opciones antes/después de flechas, saltos de línea, destinos y revisión de ambigüedades correctos.');
