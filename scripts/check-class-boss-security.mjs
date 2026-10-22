import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {stripTypeScriptTypes} from 'node:module';
const source=fs.readFileSync(new URL('../supabase/functions/save-progress/index.ts',import.meta.url),'utf8').replace(/^import[\s\S]*?from\s+["'][^"']+["'];\s*/gm,'');
let handler;let queried=false;
const context={Deno:{serve(fn){handler=fn}},Response,console,
 requireProfileSession:async()=>({admin:{from(){queried=true;throw Error('Unexpected data access')}},profileId:'test'}),
 jsonResponse:(body,status=200)=>new Response(JSON.stringify(body),{status})};
vm.runInNewContext(stripTypeScriptTypes(source),context);
for(const eventType of ['class_boss_reward','teacher_adjustment',' CLASS_BOSS_REWARD ']){
 const response=await handler(new Request('http://test/save-progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({gameId:'battlegrafia',eventType,progress:{xp:999999}})}));
 assert.equal(response.status,400);assert.equal((await response.json()).error,'reserved_event_type');
}
assert.equal(queried,false);
console.log('Save-progress refuses client-created podium rewards and manual adjustments before data access.');
