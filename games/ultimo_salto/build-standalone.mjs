// Crea una edición autónoma sin CDN, servidor, importaciones ni conexión.
import fs from 'node:fs';
import path from 'node:path';
const root=path.dirname(new URL(import.meta.url).pathname);
const modules=['vendor/three.module.js','src/content.js','src/generator.js','src/expedition.js','src/progress.js','src/materials.js','src/environment.js','src/character.js','src/audio.js','src/scene.js','src/bridge.js','src/main.js'];
const name=p=>p.endsWith('three.module.js')?'three':path.basename(p,'.js');
let bundle='const __modules={};\n';
for(const file of modules){let text=fs.readFileSync(path.join(root,file),'utf8'),exports=[];
 text=text.replace(/import \* as (\w+) from ['"]([^'"]+)['"];?/g,(_,v,p)=>`const ${v}=__modules.${name(p)};`);
 text=text.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g,(_,v,p)=>`const {${v}}=__modules.${name(p)};`);
 text=text.replace(/export (const|let|var|function|class) (\w+)/g,(_,kind,id)=>{exports.push(id);return `${kind} ${id}`;});
 text=text.replace(/export\s*\{([^}]+)\};?/g,(_,list)=>{exports.push(...list.split(',').map(t=>{const parts=t.trim().split(/\s+as\s+/);return parts.length===2?parts[1]+': '+parts[0]:parts[0];}));return '';});
 bundle+=`__modules.${name(file)}=(()=>{\n${text}\nreturn {${exports.join(',')}};})();\n`;
}
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');html=html.replace('<link rel="stylesheet" href="style.css">',`<style>${fs.readFileSync(path.join(root,'style.css'),'utf8')}</style>`);
const cover='data:image/webp;base64,'+fs.readFileSync(path.join(root,'assets/cover.webp')).toString('base64');bundle=bundle.replace('assets/cover.webp',cover);
for(const asset of ['stone-v2.webp','explorer-v2.webp'])bundle=bundle.replace('assets/'+asset,'data:image/webp;base64,'+fs.readFileSync(path.join(root,'assets',asset)).toString('base64'));
html=html.replace('<script type="module" src="src/main.js"></script>',()=>'<script>'+bundle.replace(/<\/script/gi,'<\\/script')+'</script>');
const target=process.argv[2]||path.join(root,'Ultimo_Salto.html');fs.writeFileSync(target,html);console.log('Edición autónoma: '+target);
