import {corsHeaders,jsonResponse,requireProfileSession} from '../_shared/lenguarcade.ts';
import {access,isTeacher,classroomForCreate,canPair} from './access.js';
import {createRoom,joinRoom,view,submit,ArenaError} from './arena.mjs';
const GAME='tinta_y_acero';
Deno.serve(async(request:Request)=>{
 if(request.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
 if(request.method!=='POST')return jsonResponse({error:'method_not_allowed'},405);
 try{
 const {admin,profileId,organizationId}=await requireProfileSession(request,{gatewayVerifiedJwt:true});
 const text=await request.text();if(text.length>8192)throw new ArenaError('Petición demasiado grande.',413);
 const body=JSON.parse(text),op=String(body.action||'');if(!['context','create','join','get','submit','leave'].includes(op))throw new ArenaError('Acción desconocida.');
 const allowed=await access(admin,profileId);
 if(op==='context')return jsonResponse({classes:allowed.classrooms.map(c=>({classCode:c.id,name:c.name})),teacher:isTeacher(allowed.role)});
 if(!allowed.allowed)throw new ArenaError('El profesor ha cerrado el acceso al juego.',403);
 const self=await admin.from('profiles').select('first_name,last_name').eq('id',profileId).single();if(self.error)throw self.error;
 const name=[self.data.first_name,self.data.last_name].filter(Boolean).join(' ').slice(0,24)||'Escriba';
 const response=(r:any)=>({room:{code:r.code,...view(r.state,profileId),state:{phase:r.state.status==='battle'?'playing':r.state.status}}});
 if(op==='create'){
 const classroom=classroomForCreate(allowed,body);if(!classroom)throw new ArenaError('Selecciona una clase válida.',403);
 const state=createRoom(body.mode,name,body.hero,profileId,crypto.randomUUID());
 for(let i=0;i<4;i++){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',code=Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>alphabet[n%32]).join('');
 const r=await admin.from('multiplayer_rooms').insert({game_id:GAME,organization_id:organizationId,classroom_id:classroom,host_profile_id:profileId,code,state,expires_at:new Date(Date.now()+86400000).toISOString()}).select('*').single();if(!r.error)return jsonResponse(response(r.data));if(r.error.code!=='23505')throw r.error;}
 throw new ArenaError('No se pudo crear la sala.',409);}
 const code=String(body.code||'').trim().toUpperCase();if(!/^[A-Z2-9]{8}$/.test(code))throw new ArenaError('Código no válido.');
 for(let retry=0;retry<5;retry++){
 const found=await admin.from('multiplayer_rooms').select('*').eq('game_id',GAME).eq('code',code).maybeSingle();if(found.error)throw found.error;const r=found.data;
 if(!r||r.organization_id!==organizationId||!allowed.classes.includes(r.classroom_id))throw new ArenaError('Sala no encontrada en tu clase.',404);
 if(Date.parse(r.expires_at)<Date.now())throw new ArenaError('Esta sala ha caducado.',410);
 if(op==='join'&&r.host_profile_id!==profileId&&r.guest_profile_id!==profileId){
 const host=await access(admin,r.host_profile_id);if(!host.allowed||!host.classes.includes(r.classroom_id)||!canPair(host.role,allowed.role))throw new ArenaError('No puedes entrar en esta sala.',403);
 joinRoom(r.state,name,body.hero,profileId);r.guest_profile_id=profileId;
 }else{
 if(![r.host_profile_id,r.guest_profile_id].includes(profileId))throw new ArenaError('No perteneces a esta sala.',403);
 if(op==='get'||op==='join')return jsonResponse(response(r));
 if(op==='submit')submit(r.state,profileId,{...body,action:body.move});
 else if(op==='leave'&&r.state.status!=='finished'){r.state.status='finished';r.state.winner=r.state.mode==='coop'?'boss':1-r.state.players.findIndex((p:any)=>p.token===profileId);r.state.log=['Un escriba se ha retirado.'];}
 }
 const saved=await admin.from('multiplayer_rooms').update({state:r.state,guest_profile_id:r.guest_profile_id,version:r.version+1}).eq('id',r.id).eq('game_id',GAME).eq('version',r.version).select('*').maybeSingle();if(saved.error)throw saved.error;if(saved.data)return jsonResponse(response(saved.data));
 }
 throw new ArenaError('La sala está actualizándose. Reintenta.',409);
 }catch(e){return jsonResponse({error:e instanceof ArenaError?e.message:'No se pudo procesar la sala.'},e instanceof ArenaError?e.status:500);}
});
