(function(){
'use strict';
var activeId=null,returnScreen='homeScreen',picked=[],dirty=false,draftTimer=null;
var $=function(id){return document.getElementById(id);};
function escape(text){return String(text||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function hash(text){var h=2166136261;for(var i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return (h>>>0).toString(36);}
function normalize(poems){return (Array.isArray(poems)?poems:[]).filter(function(p){return p&&Array.isArray(p.verses);}).map(function(p){return Object.assign({},p,{id:p.id||'legacy_'+hash(String(p.date)+JSON.stringify(p.verses)),title:p.title||'Estrofa de mi viaje',date:Number(p.date||0),verses:p.verses.map(String),kind:p.kind||'escrita'});});}
function merge(local,remote){var byId={};normalize(local).concat(normalize(remote)).forEach(function(p){if(!byId[p.id]||Number(p.updatedAt||p.date)>=Number(byId[p.id].updatedAt||byId[p.id].date))byId[p.id]=p;});return Object.keys(byId).map(function(id){return byId[id];}).sort(function(a,b){return b.date-a.date;});}
function game(){return window.VersopolisGame;}
function poems(){var career=game().career;career.poems=normalize(career.poems);return career.poems;}
function commit(reason){game().savePoems();if(window.VersopolisBridge)window.VersopolisBridge.checkpoint(reason||'poem_saved');}
function capture(verses,meta){
 meta=meta||{};var item=Object.assign({id:'poem_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8),title:'Ecos · '+(meta.form||'mi composición'),date:Date.now(),updatedAt:Date.now(),kind:'cartas',verses:verses.slice(),score:0},meta);
 poems().unshift(item);commit('poem_collected');return item;
}
function current(){return poems().find(function(p){return p.id===activeId;});}
function status(text){$('poemStatus').textContent=text;}
function updateCount(){$('poemsCount').textContent=poems().length+' composiciones · tu antología personal';}
function renderList(){
 updateCount();var list=$('poemsList');list.innerHTML='';var filter=$('poemSearch').value.toLowerCase();
 poems().filter(function(p){return (p.title+' '+p.verses.join(' ')).toLowerCase().includes(filter);}).forEach(function(p){
 var row=document.createElement('div');row.className='poemEntry'+(p.id===activeId?' active':'');
 var check=document.createElement('input');check.type='checkbox';check.checked=picked.includes(p.id);check.setAttribute('aria-label','Reunir '+p.title);check.addEventListener('change',function(){picked=picked.filter(function(id){return id!==p.id;});if(check.checked)picked.push(p.id);$('assemblePoemsBtn').disabled=picked.length<2;});
 var b=document.createElement('button');b.type='button';b.innerHTML='<small>'+escape(p.kind==='cartas'?'ESTROFA DE COMBATE':p.kind==='poema'?'POEMA REUNIDO':'VOZ PROPIA')+(p.edited?' · EDITADO':'')+'</small><strong>'+escape(p.title)+'</strong><span>'+escape(p.verses.filter(Boolean)[0]||'Página en blanco')+'</span><em>'+p.verses.filter(Boolean).length+' versos · '+Number(p.score||0).toLocaleString('es-ES')+' pts</em>';
 b.addEventListener('click',function(){saveEditor(false);activeId=p.id;renderList();renderEditor();status('Puedes cambiar el título y los versos.');});row.append(check,b);list.appendChild(row);
 });
 if(!list.children.length){var empty=document.createElement('p');empty.className='poemEmpty';empty.textContent=poems().length?'No hay poemas que coincidan.':'Tus contratos cumplidos se guardarán aquí. También puedes abrir una página y escribir tu propio poema.';list.appendChild(empty);}
 $('assemblePoemsBtn').disabled=picked.length<2;
}
function renderEditor(){var p=current();$('poemEditor').classList.toggle('hidden',!p);$('poemWelcome').classList.toggle('hidden',!!p);if(!p)return;
 $('poemTitle').value=p.title;$('poemText').value=p.verses.join('\n');$('poemReadTitle').textContent=p.title;$('poemReadText').textContent=p.verses.join('\n');
 $('poemOrigin').textContent=(p.form||'Creación libre')+(p.map?' · '+p.map:'')+' · '+(p.date?new Date(p.date).toLocaleDateString('es-ES'):'archivo anterior')+(p.jokers?' · el comodín repite el verso de referencia':'')+(p.edited?' · texto editado; puntos del combate original':'');dirty=false;
}
function saveEditor(feedback){var p=current();if(!p||!dirty)return false;var title=$('poemTitle').value.trim()||'Poema sin título',text=$('poemText').value;
 if(title!==p.title||text!==p.verses.join('\n')){p.title=title.slice(0,80);p.verses=text.slice(0,8000).split('\n');p.updatedAt=Date.now();p.edited=true;commit('poem_edited');}
 dirty=false;renderList();renderEditor();if(feedback)status('Poema guardado. Editarlo no cambia la puntuación de la partida.');return true;
}
function open(){if(game().run&&game().run.locked)return;var visible=document.querySelector('.screen:not(.hidden)');returnScreen=visible?visible.id:'homeScreen';game().show('poemsScreen');activeId=poems()[0]?.id||null;picked=[];$('poemSearch').value='';renderList();renderEditor();status('Cada contrato cumplido deja una estrofa en tu colección.');}
function newPoem(){saveEditor(false);var p=capture([''],{title:'Mi nuevo poema',kind:'poema'});activeId=p.id;renderList();renderEditor();$('poemText').focus();}
function assemble(){saveEditor(false);var selection=picked.map(function(id){return poems().find(function(p){return p.id===id;});}).filter(Boolean);if(selection.length<2)return;var verses=[];selection.forEach(function(p,i){if(i)verses.push('');verses.push.apply(verses,p.verses);});
 var p=capture(verses,{title:'Poema de mi expedición',kind:'poema',sources:selection.map(function(p){return p.id;}),score:selection.reduce(function(s,p){return s+Number(p.score||0);},0)});picked=[];activeId=p.id;renderList();renderEditor();status('Estrofas reunidas en el orden en que las marcaste. Dale un título y hazlo tuyo.');}
function download(content,type,name){var url=URL.createObjectURL(new Blob([content],{type:type})),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
function exportPoem(format){saveEditor(false);var p=current();if(!p)return;var file=p.title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').slice(0,70)||'mi-poema';
 if(format==='txt')download(p.title+'\n\n'+p.verses.join('\n')+'\n','text/plain;charset=utf-8',file+'.txt');
 else download('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(p.title)+'</title><style>body{max-width:760px;margin:8vh auto;padding:28px;background:#faf3e4;color:#302239;font-family:Georgia,serif}h1{font-size:36px}pre{font:22px/1.8 Georgia,serif;white-space:pre-wrap}small{color:#6c5766}@media print{body{margin:0;background:white}}</style><h1>'+escape(p.title)+'</h1><pre>'+escape(p.verses.join('\n'))+'</pre><small>Mi antología · Versópolis</small></html>','text/html;charset=utf-8',file+'.html');status('Poema exportado.');
}
window.VersopolisPoems={capture:capture,merge:merge,normalize:normalize,open:open};
['poemsBtn','tablePoemsBtn','resultPoemsBtn'].forEach(function(id){$(id).addEventListener('click',open);});
$('poemsBackBtn').addEventListener('click',function(){saveEditor(false);game().show(returnScreen);if(returnScreen==='gameScreen')game().renderGame();});
$('newPoemBtn').addEventListener('click',newPoem);$('assemblePoemsBtn').addEventListener('click',assemble);$('poemSearch').addEventListener('input',renderList);
['poemTitle','poemText'].forEach(function(id){$(id).addEventListener('input',function(){var p=current();if(!p)return;dirty=true;p.title=$('poemTitle').value.trim().slice(0,80)||'Poema sin título';p.verses=$('poemText').value.slice(0,8000).split('\n');p.updatedAt=Date.now();p.edited=true;game().savePoems();$('poemReadTitle').textContent=p.title;$('poemReadText').textContent=p.verses.join('\n');status('Borrador guardado automáticamente.');if(draftTimer)clearTimeout(draftTimer);draftTimer=setTimeout(function(){commit('poem_edited');},800);});});
$('savePoemBtn').addEventListener('click',function(){saveEditor(true);status('Poema guardado.');});$('exportPoemTxtBtn').addEventListener('click',function(){exportPoem('txt');});$('exportPoemHtmlBtn').addEventListener('click',function(){exportPoem('html');});$('printPoemBtn').addEventListener('click',function(){saveEditor(false);window.print();});
$('exportAnthologyBtn').addEventListener('click',function(){saveEditor(false);download(poems().slice().reverse().map(function(p){return p.title+'\n\n'+p.verses.join('\n');}).join('\n\n────────────────────\n\n'),'text/plain;charset=utf-8','mi-antologia-versopolis.txt');status('Antología exportada.');});
window.addEventListener('pagehide',function(){saveEditor(false);});
})();
