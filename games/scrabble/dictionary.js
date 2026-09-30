(() => {
'use strict';
const normalize=w=>String(w).toLowerCase().replace(/[áéíóúü]/g,c=>({'á':'a','é':'e','í':'i','ó':'o','ú':'u','ü':'u'}[c]));
let words=new Set(),hunspell=null,error=null;
const ready=Promise.all([
 fetch('../word_play/dictionary-es-50k.txt').then(r=>{if(!r.ok)throw Error('Banco no disponible');return r.text();}),
 fetch('../word_play/hunspell/es_ES.aff').then(r=>{if(!r.ok)throw Error('Reglas no disponibles');return r.text();}),
 fetch('../word_play/hunspell/es_ES.dic').then(r=>{if(!r.ok)throw Error('Diccionario no disponible');return r.text();})
]).then(([bank,aff,dic])=>{
 words=new Set(bank.split(/\s+/).filter(w=>/^[a-záéíóúüñ]+$/i.test(w)).map(normalize));
 // Preserve Ñ: Scrabble omits accent marks, but Ñ is a separate tile.
 dic.split(/\r?\n/).slice(1).forEach(line=>{const w=line.split('/')[0];if(/^[a-záéíóúüñ]+$/i.test(w))words.add(normalize(w));});
 hunspell=new Typo('es_ES',aff,dic,{platform:'any'});
}).catch(e=>{error=e;});
window.ScrabbleDictionary={ready,normalize,check:w=>words.has(normalize(w))||!!hunspell?.check(String(w).toLowerCase()),get error(){return error;},get size(){return words.size;}};
})();
