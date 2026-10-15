import {corsHeaders,jsonResponse,requireProfileSession} from '../_shared/lenguarcade.ts';
import {access,isTeacher,classroomForCreate,canPair} from './access.js';
import {createState,command,advance,publicState,RoomError,makePlayer} from './engine.js';

const GAME='lexitrama';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
async function player(admin:any,id:string,role:string){
 const r=await admin.from('profiles').select('first_name,last_name').eq('id',id).single();if(r.error)throw r.error;
 return {id,profileRole:role,name:[r.data.first_name,r.data.last_name].filter(Boolean).join(' ')||'Jugador'};
}
async function load(admin:any,id:string){
  const r=await admin.from('multiplayer_rooms').select('*').eq('id',id).eq('game_id',GAME).maybeSingle();
  if(r.error)throw r.error;if(!r.data)throw new RoomError('room_not_found',404);return r.data;
}
async function commit(admin:any,room:any){
  const r=await admin.rpc('commit_lexitrama_online_room',{p_id:room.id,p_version:room.version,p_guest:room.guest_profile_id,p_state:room.state});
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
    if(!['context','create','join','resume','get','ready','submit','leave'].includes(action))throw new RoomError('unknown_action',400);
    const allowed=await access(admin,profileId);
    if(action==='context'){
      if(!isTeacher(allowed.role))throw new RoomError('forbidden',403);
      const self=await player(admin,profileId,allowed.role);
      return jsonResponse({ok:true,player:{id:self.id,name:self.name},classes:allowed.classrooms.map(c=>({classCode:c.id,name:c.name}))});
    }
    if(!allowed.allowed&& !['get','resume','leave'].includes(action))throw new RoomError('game_access_closed',403);
    if(action==='create'){
      const classroomId=classroomForCreate(allowed,body);
      if(!classroomId)throw new RoomError('no_classroom',403);
      const existing=await admin.from('multiplayer_rooms').select('*').eq('game_id',GAME)
        .or(`host_profile_id.eq.${profileId},guest_profile_id.eq.${profileId}`).gt('expires_at',new Date(now).toISOString()).neq('state->>phase','finished').limit(1);
      if(existing.error)throw existing.error;
      if(existing.data?.[0]){
        if(existing.data[0].organization_id!==organizationId||!allowed.classes.includes(existing.data[0].classroom_id))throw new RoomError('no_classroom',403);
        return jsonResponse({ok:true,room:publicState(existing.data[0],profileId)});
      }
      const p=await player(admin,profileId,allowed.role);
      for(let attempt=0;attempt<3;attempt++){
        const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=crypto.getRandomValues(new Uint8Array(8));
        const code=Array.from(bytes,b=>alphabet[b%alphabet.length]).join('');
        const r=await admin.rpc('create_lexitrama_online_room',{p_profile:profileId,p_org:organizationId,p_class:classroomId,p_code:code,p_state:createState(p,body.options,now)});
        if(!r.error){
          if(r.data.organization_id!==organizationId||!allowed.classes.includes(r.data.classroom_id))throw new RoomError('no_classroom',403);
          return jsonResponse({ok:true,room:publicState(r.data,profileId)});
        }
        if(r.error.code!=='23505')throw r.error;
      }
      throw new RoomError('room_unavailable',503);
    }
    let room;
    if(action==='resume'){
      const r=await admin.from('multiplayer_rooms').select('*').eq('game_id',GAME)
        .or(`host_profile_id.eq.${profileId},guest_profile_id.eq.${profileId}`).order('created_at',{ascending:false}).limit(1);
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
        const hostAccess=await access(admin,room.host_profile_id);
        if(!hostAccess.allowed||!hostAccess.classes.includes(room.classroom_id))throw new RoomError('game_access_closed',403);
        if(!canPair(hostAccess.role,allowed.role))throw new RoomError('student_required',403);
        const p=await player(admin,profileId,allowed.role);room.guest_profile_id=profileId;
        room.state.players.push(makePlayer(p));
        room.state.lastSeen[profileId]=now;room=await commit(admin,room);
      }
    }else{
      if(!UUID.test(String(body.roomId||'')))throw new RoomError('invalid_room',400);
      room=await load(admin,body.roomId);
    }
    if(room.organization_id!==organizationId||![room.host_profile_id,room.guest_profile_id].includes(profileId))throw new RoomError('not_a_member',403);
    const expired=Date.parse(room.expires_at)<=now;
    if(expired&&!['get','resume','leave'].includes(action))throw new RoomError('room_expired',410);
    if(!allowed.classes.includes(room.classroom_id))throw new RoomError('no_classroom',403);
    let changed=false,result=null;
    if(room.state.phase!=='finished'&&now-(room.state.lastSeen[profileId]||0)>10000){room.state.lastSeen[profileId]=now;changed=true;}
    if((!allowed.allowed||expired)&&room.state.phase!=='finished'){
      command(room.state,profileId,'leave',{requestId:crypto.randomUUID()},now);changed=true;
    }else if(!['get','resume','join'].includes(action)){
      result=command(room.state,profileId,action,body,now);changed=true;
    }else changed=advance(room.state,now)||changed;
    if(changed){
      for(let attempt=0;attempt<4;attempt++){
        try{room=await commit(admin,room);break;}
        catch(e){
          if(!(e instanceof RoomError)||e.message!=='state_changed'||attempt===3)throw e;
          room=await load(admin,room.id);
          if(room.state.phase!=='finished'){
            if(!allowed.allowed||expired)command(room.state,profileId,'leave',{requestId:body.requestId||crypto.randomUUID()},now);
            else if(['get','resume','join'].includes(action)){room.state.lastSeen[profileId]=now;advance(room.state,now);}
            else result=command(room.state,profileId,action,body,now);
          }
        }
      }
    }
    let save=null;
    if(room.state.phase==='finished'&&!isTeacher(allowed.role)){
      const r=await admin.from('game_saves').select('save_data').eq('profile_id',profileId).eq('game_id',GAME).eq('slot','main').maybeSingle();if(r.error)throw r.error;save=r.data?.save_data||null;
    }
    return jsonResponse({ok:true,room:publicState(room,profileId,now),result,save});
  }catch(error){
    if(error instanceof Response)return error;
    if(error instanceof RoomError)return jsonResponse({ok:false,error:error.message},error.status);
    console.error('lexitrama-online failed',error);return jsonResponse({ok:false,error:'room_unavailable'},503);
  }
});
