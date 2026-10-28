import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {stripTypeScriptTypes} from 'node:module';
const model=await import('../supabase/functions/rayuela-gallery/model.js');
const {cleanProject,validatePath,scores,summary}=model;
const draft={id:'source',title:'Aventura',nodes:[{id:'start',type:'start',text:'Inicio',row:4,col:4,choices:[{text:'Seguir',targetId:'end'}]},{id:'end',type:'ending',text:'Final',row:4,col:5,choices:[]}]};
const snapshot=cleanProject({...draft,xp:999,source:{url:'private'},teacherFeedback:{secret:'private'}});
assert.equal(snapshot.xp,0);assert.equal(snapshot.source,undefined);assert.equal(snapshot.teacherFeedback,undefined);
assert(validatePath(snapshot,['start','end']));
assert.throws(()=>validatePath(snapshot,['start']));assert.throws(()=>validatePath(snapshot,['end']));assert.throws(()=>validatePath(snapshot,['start','end','start']));
assert.throws(()=>scores({creativity:5,story:6,decisions:4}));assert.throws(()=>scores({creativity:'5',story:3,decisions:4}));
assert.deepEqual(scores({creativity:5,story:3,decisions:4}),{creativity:5,story:3,decisions:4,fun:null,ending:null,rubric_version:1});
assert.throws(()=>cleanProject({...draft,nodes:[draft.nodes[0],draft.nodes[0]]}));
assert.throws(()=>cleanProject({...draft,nodes:[{...draft.nodes[0],choices:[{targetId:'missing'}]},draft.nodes[1]]}));
const locked=structuredClone(snapshot);locked.nodes[1].requireItem='llave';assert.throws(()=>validatePath(locked,['start','end']));locked.nodes[0].giveItem='LLAVE';assert(validatePath(locked,['start','end']));
locked.nodes[0].choices[0].conditionVar='puntos';locked.nodes[0].choices[0].conditionValue=2;locked.nodes[0].choices[0].conditionOp='>=';assert.throws(()=>validatePath(locked,['start','end']));locked.nodes[0].variable='puntos';locked.nodes[0].variableDelta=2;assert(validatePath(locked,['start','end']));
assert.equal(summary({id:'s',author_ids:['author']},[{story_id:'s',profile_id:'author',creativity:5,story:5,decisions:5},{story_id:'s',profile_id:'peer',creativity:3,story:3,decisions:3}]).average,6);
// Exercise the real handler with an in-memory database adapter: no production writes.
const db={classroom_teachers:[{classroom_id:'A',profile_id:'teacher'}],classroom_enrollments:[{classroom_id:'A',profile_id:'author',active:true,profiles:{active:true,first_name:'Autor'}},{classroom_id:'A',profile_id:'peer',active:true,profiles:{active:true,first_name:'Lector'}},{classroom_id:'B',profile_id:'outsider',active:true}],classrooms:[{id:'A',organization_id:'org',active:true,name:'Clase A'},{id:'B',organization_id:'other',active:true,name:'Clase B'}],games:[{id:'rayuela',active:true}],profile_game_access:[],workshop_sessions:[],rayuela_gallery_stories:[],rayuela_gallery_reads:[],rayuela_gallery_ratings:[],rayuela_gallery_endings:[]};
function admin(){return {async rpc(name,args){assert.equal(name,'record_rayuela_ending');let r=db.rayuela_gallery_endings.find(r=>r.story_id===args.p_story_id&&r.profile_id===args.p_profile_id&&r.node_id===args.p_node_id);const duplicate=!!r;const story=db.rayuela_gallery_stories.find(s=>s.id===args.p_story_id);const awardedXp=duplicate||args.p_profile_id==='teacher'||story.author_ids.includes(args.p_profile_id)?0:(story.project.nodes.find(n=>n.id===args.p_node_id).endingType==='perfect'?80:20);if(!r)db.rayuela_gallery_endings.push({story_id:args.p_story_id,profile_id:args.p_profile_id,node_id:args.p_node_id,xp_awarded:awardedXp});return {data:{awardedXp,totalXp:db.rayuela_gallery_endings.filter(r=>r.profile_id===args.p_profile_id).reduce((s,r)=>s+r.xp_awarded,0),endingCount:db.rayuela_gallery_endings.filter(r=>r.profile_id===args.p_profile_id&&r.story_id===args.p_story_id).length,duplicate},error:null};},from(table){let filters=[],mode='read',values,opts={},single=false;const q={select(){return q;},eq(k,v){filters.push(r=>r[k]===v);return q;},match(o){for(const [k,v] of Object.entries(o))q.eq(k,v);return q;},in(k,v){filters.push(r=>v.includes(r[k]));return q;},order(){return q;},limit(){return q;},single(){single=true;return q;},maybeSingle(){single=true;return q;},upsert(v,o){mode='upsert';values=v;opts=o;return q;},update(v){mode='update';values=v;return q;},then(resolve,reject){try{let rows=db[table].filter(r=>filters.every(f=>f(r)));if(mode==='upsert'){for(const v of Array.isArray(values)?values:[values]){let row=db[table].find(r=>opts.onConflict.split(',').every(k=>r[k]===v[k]));if(row){if(!opts.ignoreDuplicates)Object.assign(row,v);}else db[table].push({id:'story-'+db[table].length,created_at:'2026',...v});}rows=[];}if(mode==='update')rows.forEach(r=>Object.assign(r,values));return Promise.resolve({data:structuredClone(single?(rows[0]||null):rows),error:null}).then(resolve,reject);}catch(e){return Promise.reject(e).then(resolve,reject);}}};return q;}};}
let source=fs.readFileSync(new URL('../supabase/functions/rayuela-gallery/index.ts',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export async function handle','async function handle');
const sandbox={...model,studentGameAccess:()=>({locked:false}),workshopModeFor:()=>'',Deno:{serve(){}},crypto:globalThis.crypto,Response,console};
vm.createContext(sandbox);vm.runInContext(stripTypeScriptTypes(source),sandbox);const call=(role,id,body,org='org')=>sandbox.handle(admin(),id,org,role,body);
await assert.rejects(call('student','peer',{action:'import',projects:[draft]}));
await call('teacher','teacher',{action:'import',projects:[draft]});const id=db.rayuela_gallery_stories[0].id;
await call('teacher','teacher',{action:'import',projects:[draft]});assert.equal(db.rayuela_gallery_stories.length,1);
await assert.rejects(call('student','peer',{action:'get',storyId:id}));
await assert.rejects(call('teacher','teacher',{action:'update',storyId:id,published:true,authorIds:[]}));
await assert.rejects(call('teacher','teacher',{action:'update',storyId:id,published:true,authorIds:['outsider']}));
await call('teacher','teacher',{action:'update',storyId:id,published:true,authorIds:['author']});
await assert.rejects(call('student','outsider',{action:'get',classroomId:'A',storyId:id},'other'));
await assert.rejects(call('student','author',{action:'rate',storyId:id,creativity:5,story:5,decisions:5}));
await assert.rejects(call('student','peer',{action:'rate',storyId:id,creativity:5,story:5,decisions:5}));
await assert.rejects(call('student','peer',{action:'complete',storyId:id,path:['start']}));
const discovery=await call('student','peer',{action:'complete',storyId:id,path:['start','end']});assert.equal(discovery.awardedXp,20);const again=await call('student','peer',{action:'complete',storyId:id,path:['start','end']});assert.equal(again.awardedXp,0);assert.equal((await call('student','peer',{action:'get',storyId:id})).project.discoveredEndings[0],'end');
await call('student','peer',{action:'rate',storyId:id,creativity:5,story:4,decisions:3});
await call('student','peer',{action:'rate',storyId:id,creativity:3,story:3,decisions:3});assert.equal(db.rayuela_gallery_ratings.length,1);
let listing=await call('student','peer',{action:'list'});assert.equal(listing.stories.length,1);assert.equal(listing.stories[0].authorIds,undefined);assert.equal(listing.stories[0].votes,undefined);assert.equal(listing.stories[0].project,undefined);assert.equal(listing.stories[0].myRating.creativity,6);
let teacher=await call('teacher','teacher',{action:'list'});assert.equal(teacher.stories[0].summary.average,6);
await call('teacher','teacher',{action:'update',storyId:id,published:false,authorIds:['author']});assert.equal((await call('student','peer',{action:'list'})).stories.length,0);
await call('teacher','teacher',{action:'update',storyId:id,published:true,authorIds:['peer']});assert.equal((await call('teacher','teacher',{action:'list'})).stories[0].summary.count,0);
const sql=fs.readFileSync(new URL('../supabase/migrations/20261022091142_rayuela_class_gallery.sql',import.meta.url),'utf8');assert.equal((sql.match(/enable row level security/g)||[]).length,3);assert(sql.includes('from anon, authenticated'));assert(sql.includes('primary key(story_id,profile_id)'));
console.log('Galería Rayuela OK: importación idempotente, privacidad, aislamiento de clases, publicación, autores, recorrido completo, voto único, corrección y retirada.');

const ballot={rubricVersion:2,fun:10,creativity:8,story:7,decisions:9,ending:6,spelling:1};
const modern=scores(ballot);assert.equal(modern.rubric_version,2);assert.equal(modern.spelling,undefined);
for(const key of model.ratingKeys){for(const value of [0,11,2.5,'5',null,undefined])assert.throws(()=>scores({...ballot,[key]:value}));}
await call('student','peer',{action:'complete',storyId:id,path:['start','end']});
await assert.rejects(call('student','peer',{action:'rate',storyId:id,...ballot})); // now an author
await call('teacher','teacher',{action:'update',storyId:id,authorIds:['author'],published:true,orthography:{mistakes:[{nodeId:'start',original:'avion',correction:'avión',reason:'Tilde'}]}});
await call('student','peer',{action:'rate',storyId:id,...ballot,profileId:'author'});
const latest=await call('teacher','teacher',{action:'list'});assert.equal(latest.stories[0].summary.average,8);assert.equal(latest.stories[0].spelling.score,9.8);
assert.equal(db.rayuela_gallery_ratings.length,1);assert.equal(db.rayuela_gallery_ratings[0].profile_id,'peer');
assert.equal(model.orthographyReview({mistakes:[]}).score,10);
assert.equal(model.orthographyReview({mistakes:Array.from({length:60},()=>({original:'avion',correction:'avión'}))}).score,0);
const {convertGrid}=await import('../games/rayuela/sheets-converter.mjs');
const grid=[];grid[5]=[];grid[5][5]='Estás en un bar. Aceptas la copa➡ Rechazas la copa⬆';grid[5][6]='Fin.';grid[4]=[];grid[4][5]='Otro final.';
const converted=convertGrid({id:'test',title:'Prueba',values:grid,startCell:'F6'});assert.equal(converted.issues.length,0);
assert.deepEqual(converted.project.nodes.find(n=>n.type==='start').choices.map(c=>c.text),['Aceptas la copa','Rechazas la copa']);
assert(converted.project.nodes.every(n=>!/[⬅➡⬆⬇]/u.test(n.text)));
// CRLF checkout must compile the exact same handler as Linux.
assert.doesNotThrow(()=>new vm.Script(stripTypeScriptTypes(fs.readFileSync(new URL('../supabase/functions/rayuela-gallery/index.ts',import.meta.url),'utf8').replace(/\r?\n/g,'\r\n').replace(/^import .*;\r?\n/gm,'').replace('export async function handle','async function handle'))));

// Discoveries are durable per profile/story/node, with the server deciding the payout.
const published=db.rayuela_gallery_stories.find(s=>s.id===id);
published.author_ids=['author'];
published.project.nodes.push({...published.project.nodes[1],id:'best',title:'De vuelta en casa',endingType:'perfect'});
published.project.nodes[0].choices.push({text:'Buscar otra salida',targetId:'best'});
const best=await call('student','peer',{action:'complete',storyId:id,path:['start','best']});
assert.equal(best.awardedXp,80);assert.equal(best.totalXp,100);assert.equal(best.endingCount,2);
assert.equal((await call('student','peer',{action:'complete',storyId:id,path:['start','best']})).awardedXp,0);
assert.equal((await call('student','author',{action:'complete',storyId:id,path:['start','best']})).awardedXp,0);
assert.equal((await call('teacher','teacher',{action:'complete',storyId:id,path:['start','best']})).awardedXp,0);
const restoredEndings=(await call('student','peer',{action:'get',storyId:id})).project.discoveredEndings;
assert.equal(restoredEndings.length,2);assert(restoredEndings.includes('end')&&restoredEndings.includes('best'));
console.log('Finales Rayuela: 20/80 XP, repetición sin premio, autor/profesor sin XP y colección persistente correctos.');
