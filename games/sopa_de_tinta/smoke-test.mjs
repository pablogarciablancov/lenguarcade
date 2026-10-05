import assert from 'node:assert/strict';
import './content.js';import './generator.js';import './progression.js';
const {TintaContent:C,TintaGenerator:G,TintaProgress:P}=globalThis;
assert.equal(C.concepts.length,160);assert.equal(new Set(C.concepts.map(c=>c.id)).size,160);assert.equal(P.achievements.length,37);
for(const category of ['all',...C.districts.map(d=>d.id)])for(let difficulty=0;difficulty<4;difficulty++)for(let i=0;i<20;i++){
 const d=C.difficulties[difficulty],options={seed:category+':'+difficulty+':'+i,size:d.size,count:d.count,category,reverse:d.reverse},board=G.generate(options);
 assert.equal(board.words.length,d.count);assert.deepEqual(G.generate(options),board);
 for(const w of board.words){const c=C.concepts.find(c=>c.id===w.id);assert.equal(w.cells.map(([r,x])=>board.grid[r][x]).join(''),c.gridTerm);assert.equal(G.match(board.grid,w.cells,board.words)?.id,w.id);}
}
for(const d of G.dirs){const end=[4+d[0]*3,4+d[1]*3];assert.equal(G.path([4,4],end,9).length,4);}
assert.equal(G.path([1,1],[2,4],9).length,0);
const p=P.fresh(),board=G.generate({seed:'finish',size:11,count:7});board.words.forEach(w=>w.found=true);const run={...board,mode:'adventure',category:'narrativa',stage:0,elapsed:50,score:1000,errors:0,hints:0,bestCombo:7};P.finish(p,run,true);const snapshot=JSON.stringify(p);P.finish(p,run,true);assert.equal(JSON.stringify(p),snapshot);assert.equal(p.adventure.narrativa[0],3);assert.equal(p.stats.perfects,1);assert(P.unlock(p).length>0);assert.equal(P.unlock(p).length,0);P.missions(p);p.stats.words=20;assert(P.claim(p,'words'));assert(!P.claim(p,'words'));
const hard=G.generate({seed:'master',size:14,count:11,reverse:true,hard:true});assert(hard.words.every(w=>C.concepts.find(c=>c.id===w.id).difficulty>=2));
console.log('OK: 640 tableros, determinismo, ocho direcciones, banco, logros, misiones y liquidación idempotente.');
