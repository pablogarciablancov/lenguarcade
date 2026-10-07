import {corsHeaders,jsonResponse,requireProfileSession} from '../_shared/lenguarcade.ts';
import {studentGameAccess,workshopModeFor} from '../_shared/student-access.ts';
import {createState,command,advance,publicState,RoomError} from './engine.js';
import {makePlayer,normalizeSave} from './rules.js';

const GAME='conjuga_apuesta';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function access(admin:any,profileId:string){
  const [g,a,e]=await Promise.all([
    admin.from('games').select('id,status,url,integration,active').eq('id',GAME).single(),
    admin.from('profile_game_access').select('enabled').eq('profile_id',profileId).eq('game_id',GAME).maybeSingle(),
    admin.from('classroom_enrollments').select('classroom_id').eq('profile_id',profileId).eq('active',true),
  ]);
  for(const r of [g,a,e])if(r.error)throw r.error;
  const classes=(e.data||[]).map((x:any)=>x.classroom_id);
  let workshop=null;
  if(classes.length){
    const r=await admin.from('workshop_sessions').select('*').in('classroom_id',classes).eq('published',true).limit(1);
    if(r.error)throw r.error;workshop=r.data?.[0]||null;
  }
  const mode=workshopModeFor(workshop),selected=new Set<string>(workshop?.game_ids||[]);
  const allowed=g.data.active&& !studentGameAccess(g.data,new Map([[GAME,a.data?.enabled!==false]]),workshop,selected,mode==='classroom'||mode==='home').locked;
  return {allowed,classes};
}
async function player(admin:any,id:string){
  const [p,save]=await Promise.all([
    admin.from('profiles').select('first_name,last_name').eq('id',id).single(),
    admin.from('game_saves').select('save_data').eq('profile_id',id).eq('game_id',GAME).eq('slot','main').maybeSingle(),
  ]);
  if(p.error)throw p.error;if(save.error)throw save.error;
  return {id,name:[p.data.first_name,p.data.last_name].filter(Boolean).join(' ')||'Alumno',save:normalizeSave(save.data?.save_data)};
}
async function load(admin:any,id:string){
  const r=await admin.from('multiplayer_rooms').select('*').eq('id',id).eq('game_id',GAME).maybeSingle();
  if(r.error)throw r.error;if(!r.data)throw new RoomError('room_not_found',404);return r.data;
}
async function commit(admin:any,room:any){
  const r=await admin.rpc('commit_conjuga_online_room',{p_id:room.id,p_version:room.version,p_guest:room.guest_profile_id,p_state:room.state});
  if(r.error){if(r.error.message?.includes('already_in_room'))throw new RoomError('already_in_room');throw r.error;}
  if(!r.data)throw new RoomError('state_changed',409);
  return r.data;
}
Deno.serve(async(request:Request)=>{
  if(request.method==='OPTIONS')return new Response('ok',{headers:corsHeaders});
  if(request.method!=='POST')return jsonResponse({ok:false,error:'method_not_allowed'},405);
  try{
    const {admin,profileId,organizationId}=await requireProfileSession(request,{gatewayVerifiedJwt:true});
    const body=await request.json(),action=String(body.action||''),now=Date.now();
    if(!['create','join','resume','get','ready','reveal','answer','hint','swap','insurance','leave'].includes(action))throw new RoomError('unknown_action',400);
    const allowed=await access(admin,profileId);
    if(!allowed.allowed&& !['get','resume','leave'].includes(action))throw new RoomError('game_access_closed',403);
    if(action==='create'){
      if(!allowed.classes.length)throw new RoomError('no_classroom',403);
      const existing=await admin.from('multiplayer_rooms').select('*').eq('game_id',GAME)
        .or(`host_profile_id.eq.${profileId},guest_profile_id.eq.${profileId}`).gt('expires_at',new Date(now).toISOString()).neq('state->>phase','finished').limit(1);
      if(existing.error)throw existing.error;
      if(existing.data?.[0])return jsonResponse({ok:true,room:publicState(existing.data[0],profileId)});
      const p=await player(admin,profileId);
      for(let attempt=0;attempt<3;attempt++){
        const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=crypto.getRandomValues(new Uint8Array(8));
        const code=Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');
        const r=await admin.rpc('create_conjuga_online_room',{p_profile:profileId,p_org:organizationId,p_class:allowed.classes[0],p_code:code,p_state:createState(p,body.options,now)});
        if(!r.error)return jsonResponse({ok:true,room:publicState(r.data,profileId)});
        if(r.error.code!=='23505')throw r.error;
      }
      throw new RoomError('room_unavailable',503);
    }
    let room;
    if(action==='resume'){
      const r=await admin.from('multiplayer_rooms').select('*').eq('game_id',GAME)
        .or(`host_profile_id.eq.${profileId},guest_profile_id.eq.${profileId}`).gt('expires_at',new Date(now).toISOString()).order('created_at',{ascending:false}).limit(1);
      if(r.error)throw r.error;room=r.data?.[0];
      if(!room)return jsonResponse({ok:true,room:null});
    }else if(action==='join'){
      const code=String(body.code||'').trim().toUpperCase();
      if(!/^[A-Z2-9]{8}$/.test(code))throw new RoomError('invalid_code',400);
      const r=await admin.from('multiplayer_rooms').select('*').eq('code',code).eq('game_id',GAME).gt('expires_at',new Date(now).toISOString()).maybeSingle();
      if(r.error)throw r.error;room=r.data;
      if(!room||room.organization_id!==organizationId||!allowed.classes.includes(room.classroom_id))throw new RoomError('room_not_found',404);
      if(room.host_profile_id!==profileId&&room.guest_profile_id!==profileId){
        if(room.guest_profile_id||room.state.phase!=='waiting')throw new RoomError('room_full');
        // The host must still have access; joining never bypasses teacher controls.
        if(!(await access(admin,room.host_profile_id)).allowed)throw new RoomError('game_access_closed',403);
        const p=await player(admin,profileId);room.guest_profile_id=profileId;
        room.state.players.push({...makePlayer(p.name,1,p.save,'opponent'),profileId,baseSave:structuredClone(p.save),ready:false});
        room.state.lastSeen[profileId]=now;room=await commit(admin,room);
      }
    }else{
      if(!UUID.test(String(body.roomId||'')))throw new RoomError('invalid_room',400);
      room=await load(admin,body.roomId);
    }
    if(room.organization_id!==organizationId||![room.host_profile_id,room.guest_profile_id].includes(profileId))throw new RoomError('not_a_member',403);
    if(Date.parse(room.expires_at)<=now)throw new RoomError('room_expired',410);
    if(!allowed.classes.includes(room.classroom_id))throw new RoomError('no_classroom',403);
    let changed=false;
    if(room.state.phase!=='finished'&&now-(room.state.lastSeen[profileId]||0)>10000){room.state.lastSeen[profileId]=now;changed=true;}
    if(!allowed.allowed&&room.state.phase!=='finished'){
      command(room.state,profileId,'leave',{requestId:crypto.randomUUID()},now);changed=true;
    }else if(!['get','resume','join'].includes(action)){
      if(!['ready','leave'].includes(action)&& (Number(body.turnNo)!==room.state.turnNo||String(body.questionId||'')!==String(room.state.currentQuestion?.id||'')))throw new RoomError('stale_turn');
      command(room.state,profileId,action,body,now);changed=true;
    }else changed=advance(room.state,now)||changed;
    if(changed)room=await commit(admin,room);
    return jsonResponse({ok:true,room:publicState(room,profileId,now)});
  }catch(error){
    if(error instanceof Response)return error;
    if(error instanceof RoomError)return jsonResponse({ok:false,error:error.message},error.status);
    console.error('conjuga-online failed',error);return jsonResponse({ok:false,error:'room_unavailable'},503);
  }
});
