// Convert a classroom grid without changing the pupils' prose or its spelling.
const arrows = /[⬅➡⬆⬇←→↑↓]/gu;
const directions = {'⬅':[0,-1],'←':[0,-1],'➡':[0,1],'→':[0,1],'⬆':[-1,0],'↑':[-1,0],'⬇':[1,0],'↓':[1,0]};
const tidy = s => String(s || '').replace(/\uFE0F/g,'').trim();
const words = s => /[\p{L}\p{N}]/u.test(s);
const key = s => tidy(s).normalize('NFC').toLocaleLowerCase('es').replace(/[^\p{L}\p{N}]/gu,'');
function label(value) {
  let s=tidy(value).replace(/^[\s.,:;¿?]+|[\s.,:;¿?]+$/g,'').replace(/^(?:o\s+|y\s+)?(?:si quieres(?: que)?\s+|que prefieres\s*[:,]?\s*|qué prefieres\s*[:,]?\s*)/i,'');
  const lines=s.split(/\n+/).map(tidy).filter(Boolean);
  if(lines.length>1)s=lines.at(-1);
  // Introductory prose and the first option often share the same spreadsheet line.
  const cue=/(?:\b(?:decides|eliges|prefieres)\s+|\bsi quieres(?: que)?\s+|\bqué (?:haces|decides)\s*[:?,]?\s*)/ig;
  const cues=[...s.matchAll(cue)];if(cues.length)s=s.slice(cues.at(-1).index+cues.at(-1)[0].length);
  const sentences=s.split(/(?<=[.!?])\s+/);if(sentences.length>1&&sentences.at(-1).length>3)s=sentences.at(-1);
  s=s.replace(/^(?:o\s+|y\s+)/i,'').trim();
  return s ? s[0].toLocaleUpperCase('es')+s.slice(1) : 'Continuar';
}
export function convertGrid({id,title,values,startCell,overrides={}}) {
  const nodes=[],issues=[],pending=new Map();
  for(let r=1;r<10;r++)for(let c=1;c<10;c++){
    const original=tidy(values[r]?.[c]);if(!original)continue;
    const cell=String.fromCharCode(65+c)+(r+1),marks=[...original.matchAll(arrows)];
    let choices=[];
    const leading=original.slice(0,marks[0]?.index??original.length);
    const trailing=marks.length?original.slice(marks.at(-1).index+1):'';
    // Prefer the previous nonempty line for suffix arrows, even when the arrow
    // is on a line of its own. Looking ahead there steals the following option.
    const prefix=words(trailing)&&(!words(leading)||!leading.split('\n').at(-1).trim());
    for(let i=0;i<marks.length;i++){
      const m=marks[i],[dr,dc]=directions[m[0]],targetR=r+dr,targetC=c+dc;
      if(!tidy(values[targetR]?.[targetC])||targetR<1||targetR>9||targetC<1||targetC>9){
        issues.push({cell,arrow:m[0],reason:'unfinished_path'});
        pending.set(`n_${targetR-1}_${targetC-1}`,{id:`n_${targetR-1}_${targetC-1}`,row:Math.max(0,targetR-1),col:Math.max(0,targetC-1),type:'story',title:'Camino pendiente',text:'Los autores todavía no han escrito esta parte de la historia. Puedes volver al inicio y descubrir otro camino.',choices:[]});
      }
      const before=original.slice(i?marks[i-1].index+1:0,m.index),after=original.slice(m.index+1,marks[i+1]?.index??original.length);
      const chunk=prefix?after:before;
      const text=overrides[cell]?.[i]||(marks.length===1?'Continuar':label(chunk));
      if(!choices.some(ch=>ch.targetId===`n_${targetR-1}_${targetC-1}`))choices.push({id:'choice_'+choices.length,text,targetId:`n_${targetR-1}_${targetC-1}`});
    }
    if(choices.length>1&&(new Set(choices.map(ch=>key(ch.text))).size!==choices.length||choices.some(ch=>key(ch.text)==='continuar'))){
      issues.push({cell,reason:'ambiguous_choice_labels',message:'Revisa los textos y asigna una opción distinta a cada destino mediante overrides.'});
    }
    const type=cell===startCell?'start':choices.length?(choices.length>1?'decision':'story'):'ending';
    nodes.push({id:`n_${r-1}_${c-1}`,row:r-1,col:c-1,type,title:type==='start'?'Inicio':type==='ending'?'Final':'',text:original.replace(arrows,'').replace(/\uFE0F/g,'').trim(),choices,endingType:'neutral'});
  }
  for(const n of pending.values())if(!nodes.some(x=>x.id===n.id))nodes.push(n);
  const project={schema:'rayuela-project-v1',id:'sheets_'+id,title,genre:'Aventura',grid:{rows:9,cols:9},nodes,variables:{}};
  const ids=new Set(nodes.map(n=>n.id));for(const n of nodes)for(const ch of n.choices)if(!ids.has(ch.targetId))issues.push({cell:n.id,reason:'missing_target'});
  const start=nodes.find(n=>n.type==='start');if(!start)issues.push({reason:'missing_start'});
  const reached=new Set();function visit(id){if(reached.has(id))return;reached.add(id);nodes.find(n=>n.id===id)?.choices.forEach(c=>visit(c.targetId));}if(start)visit(start.id);
  if(!nodes.some(n=>n.type==='ending'&&reached.has(n.id)))issues.push({reason:'no_reachable_ending'});
  return {project,issues,reachable:reached.size};
}
