/* Definiciones de Wikcionario, independientes de la validación y la puntuación. */
(() => {
'use strict';
const cache=new Map(),pending=new Map(),storageKey='forja.definitions.v1';
try { for(const [word,value] of JSON.parse(localStorage.getItem(storageKey)||'[]'))if(value?.text&&value?.url?.startsWith('https://es.wiktionary.org/wiki/'))cache.set(word,value); } catch {}
function extract(html){
 const doc=new DOMParser().parseFromString(html,'text/html');
 let spanish=false;
 for(const node of doc.querySelectorAll('h2,dt')){
  if(node.tagName==='H2'){spanish=node.id==='Español'||!!node.querySelector('#es');continue;}
  if(!spanish||!/^\d+\b/.test(node.textContent.trim()))continue;
  const dd=node.nextElementSibling;if(dd?.tagName!=='DD')continue;
  const copy=dd.cloneNode(true);copy.querySelectorAll('sup,dl,ul,ol,script,style').forEach(el=>el.remove());
  const text=copy.textContent.replace(/\s+/g,' ').trim();
  if(text)return text.length>260?text.slice(0,257).replace(/\s+\S*$/,'')+'…':text;
 }
 return null;
}
async function lookup(raw){
 const word=String(raw||'').toLowerCase().normalize('NFC');
 if(!/^[a-záéíóúüñ]+$/u.test(word))return null;
 if(cache.has(word))return cache.get(word);
 if(pending.has(word))return pending.get(word);
 const task=(async()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4500);
  try{
   const params=new URLSearchParams({action:'parse',page:word,prop:'text',format:'json',origin:'*',redirects:'1',maxlag:'5'});
   const response=await fetch('https://es.wiktionary.org/w/api.php?'+params,{signal:controller.signal,credentials:'omit'});
   if(!response.ok)return null;
   const data=await response.json(),text=extract(data.parse?.text?.['*']||'');if(!text)return null;
   const value={text,url:'https://es.wiktionary.org/wiki/'+encodeURIComponent(data.parse.title||word)};
   cache.set(word,value);if(cache.size>200)cache.delete(cache.keys().next().value);
   try{localStorage.setItem(storageKey,JSON.stringify([...cache]));}catch{}
   return value;
  }catch{return null;}finally{clearTimeout(timer);pending.delete(word);}
 })();pending.set(word,task);return task;
}
window.ForjaDefinitions={lookup,extract};
})();
