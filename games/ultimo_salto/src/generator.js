import {wordsFor,ruleFor} from './content.js';
export function rng(seed){let s=seed>>>0;return ()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export function adjacent(a,b,distance=1){return Math.abs(a.r-b.r)+Math.abs(a.c-b.c)===distance;}
export function boardLayout(level, seed, legacy = false) {
 const rows = level.rows + (legacy ? 0 : 2);
 const cols = level.cols + (legacy ? 0 : 3);
 const middle = Math.floor(cols / 2);
 const shapes = ['Rombo', 'Reloj de arena', 'Escalera', 'Puente'];
 const shape = legacy ? 'Rectángulo' : shapes[((seed ^ (seed >>> 16)) >>> 0) % shapes.length];
 const spans = Array.from({length: rows}, (_, row) => {
  const progress = row / (rows - 1);
  if (shape === 'Rombo') {
   const radius = 1 + Math.round((1 - Math.abs(2 * progress - 1)) * (middle - 1));
   return [middle - radius, Math.min(cols - 1, middle + radius)];
  }
  if (shape === 'Reloj de arena') {
   const inset = Math.round((1 - Math.abs(2 * progress - 1)) * (middle - 1));
   return [inset, cols - 1 - inset];
  }
  if (shape === 'Escalera') {
   const left = Math.round(progress * 3);
   return [left, left + cols - 4];
  }
  if (shape === 'Puente') return row % 3 === 1 ? [1, cols - 2] : [0, cols - 1];
  return [0, cols - 1];
 });
 return {rows, cols, spans, shape, middle};
}
export function generate(level,seed,legacy=false){
 const random=rng(seed),rule=ruleFor(level.rule),{rows,cols,spans,shape,middle}=boardLayout(level,seed,legacy);
 const route=new Set(),start={r:rows,c:middle},goal={r:-1,c:middle};
 let c=start.c;
 // Cada tramo horizontal termina en una columna compartida con la fila siguiente.
 for(let r=rows-1;r>=0;r--){route.add(`${r},${c}`);const [left,right]=spans[r];const [nextLeft,nextRight]=spans[r-1]||[left,right];const next=Math.max(Math.max(left,nextLeft),Math.min(Math.min(right,nextRight),c+(random()<.5?-1:1)));for(let x=Math.min(c,next);x<=Math.max(c,next);x++)route.add(`${r},${x}`);c=next;}
 for(let x=Math.min(c,goal.c);x<=Math.max(c,goal.c);x++)route.add(`0,${x}`);
 const words=wordsFor(rule);
 const pools=[words.filter(w=>!rule.test(w)),words.filter(rule.test)];
 const used=new Set();
 function pick(safe){const pool=pools[+safe];let choices=pool.filter(w=>!used.has(w.text));if(!choices.length)choices=pool;const w=choices[Math.floor(random()*choices.length)];used.add(w.text);return w.text;}
 const tiles=[];
 for(let r=0;r<rows;r++)for(let c=spans[r][0];c<=spans[r][1];c++){const safe=route.has(`${r},${c}`)||random()<.15;tiles.push({r,c,word:pick(safe),safe});}
 const board={seed,rows,cols,shape,start,goal,tiles,level:level.id,final:!!level.final};
 if(!solve(board).length)throw Error('Tablero sin solución');
 return board;
}
export function solve(board){const {start,goal,tiles}=board,q=[[start]],visited=new Set();while(q.length){const path=q.shift(),p=path.at(-1),key=`${p.r},${p.c}`;if(visited.has(key))continue;visited.add(key);if(adjacent(p,goal))return [...path,goal];for(const tile of tiles)if(tile.safe&&!visited.has(`${tile.r},${tile.c}`)&&adjacent(p,tile))q.push([...path,tile]);}return [];}
