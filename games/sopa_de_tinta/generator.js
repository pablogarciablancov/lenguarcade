(function(root){
'use strict';
function rng(seed){let a=2166136261;for(const ch of String(seed))a=Math.imul(a^ch.charCodeAt(0),16777619);return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
const dirs=[[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]];
function path(a,b,n){const dr=b[0]-a[0],dc=b[1]-a[1];if(dr!==0&&dc!==0&&Math.abs(dr)!==Math.abs(dc))return [];const len=Math.max(Math.abs(dr),Math.abs(dc))+1;return Array.from({length:len},(_,i)=>[a[0]+Math.sign(dr)*i,a[1]+Math.sign(dc)*i]).filter(([r,c])=>r>=0&&c>=0&&r<n&&c<n);}
function generate({seed,size,count,reverse=false,category='all',mastery={},hard=false}){
const random=rng(seed),pool=root.TintaContent.concepts.filter(c=>c.gridTerm.length<=size&&(category==='all'||c.category===category)&&(!hard||c.difficulty>=2));
if(pool.length<count)throw Error('No hay suficientes conceptos para este tablero.');
const chosen=pool.map(c=>{const m=mastery[c.id]||{};const weight=(1+Math.min(2,(m.help||0)/(1+(m.clean||0))))/(1+Math.min(4,m.clean||0)*.2);return {c,key:Math.pow(random(),1/weight)};}).sort((a,b)=>b.key-a.key).slice(0,count).map(x=>x.c);
for(let retry=0;retry<80;retry++){
const grid=Array.from({length:size},()=>Array(size).fill('')),words=[];
for(const concept of [...chosen].sort((a,b)=>b.gridTerm.length-a.gridTerm.length)){
const options=[];
for(let r=0;r<size;r++)for(let c=0;c<size;c++)for(let d=0;d<(reverse?8:4);d++){
const [dr,dc]=dirs[d],cells=Array.from({length:concept.gridTerm.length},(_,i)=>[r+i*dr,c+i*dc]);
if(cells.some(([y,x],i)=>y<0||x<0||y>=size||x>=size||(grid[y][x]&&grid[y][x]!==concept.gridTerm[i])))continue;
options.push({cells,d,rank:random()+cells.filter(([y,x])=>grid[y][x]).length*.3});
}
if(!options.length)break;
const best=options.sort((a,b)=>b.rank-a.rank)[0];best.cells.forEach(([y,x],i)=>grid[y][x]=concept.gridTerm[i]);words.push({id:concept.id,cells:best.cells,direction:best.d,found:false,hints:0});
}
if(words.length!==count)continue;
const alphabet='ABCDEFGHIJKLMNÑOPQRSTUVWXYZÁÉÍÓÚÜ';grid.forEach(row=>row.forEach((v,i)=>{if(!v)row[i]=alphabet[Math.floor(random()*alphabet.length)];}));
return {grid,words:chosen.map(c=>words.find(w=>w.id===c.id)),seed};
}
throw Error('No se pudo distribuir el tablero; prueba otro nivel.');
}
function match(grid,cells,words){const text=cells.map(([r,c])=>grid[r]?.[c]||'').join('');return words.find(w=>!w.found&&root.TintaContent.concepts.find(c=>c.id===w.id).gridTerm===text)||null;}
root.TintaGenerator={rng,path,generate,match,dirs};
})(typeof window==='undefined'?globalThis:window);
