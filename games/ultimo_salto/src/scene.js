import {zoneFor} from './expedition.js';
import * as T from '../vendor/three.module.js';
import {Character} from './character.js';
import {Materials} from './materials.js';
import {Environment} from './environment.js';
import {rng} from './generator.js';
const spacing=2.65;
export class TempleScene{
 constructor(container,callbacks={}){
 this.container=container;this.callbacks=callbacks;this.scene=new T.Scene();this.scene.fog=new T.FogExp2(0x4b777c,.013);
 this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.needsUpdate=true;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.03;container.appendChild(this.renderer.domElement);
 this.camera=new T.PerspectiveCamera(40,1,.1,260);this.camera.position.set(9,19,22);this.focus=new T.Vector3();this.targetFocus=new T.Vector3();this.baseCamera=new T.Vector3(9,19,22);
 this.scene.add(new T.HemisphereLight(0xc2e2df,0x354f47,1.35));this.sun=new T.DirectionalLight(0xffdb9e,4.3);this.sun.position.set(-16,23,-10);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-23,right:23,top:23,bottom:-23,near:1,far:80});this.sun.shadow.normalBias=.035;this.sun.shadow.bias=-.00015;this.scene.add(this.sun);
 const rim=new T.DirectionalLight(0x8de1e6,1.35);rim.position.set(8,8,14);this.scene.add(rim);
 this.art=new Materials();this.boxGeo=this.art.geometry;this.debris=[];this.effects=[];this.tiles=[];this.interact=[];this.time=0;this.paused=false;this.motion=true;this.landTime=0;this.shake=0;this.quality='high';
 this.sky();this.environment=new Environment(this.scene,this.art);this.zoneGroups=new Map();this.boardGroup=new T.Group();this.scene.add(this.boardGroup);this.character=new Character(this.scene);this.playerPos=new T.Vector3(0,.06,10);this.character.update(0,this.playerPos,0);
 this.raycaster=new T.Raycaster();this.pointer=new T.Vector2();this.hover=null;this.onPointer=e=>{const cell=this.pick(e);if(cell)this.callbacks.hover?.(cell);};this.onClick=e=>{const cell=this.pick(e);if(cell)this.callbacks.choose?.(cell);};this.renderer.domElement.addEventListener('pointermove',this.onPointer);this.renderer.domElement.addEventListener('pointerup',this.onClick);
 this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);this.onLost=e=>{e.preventDefault();this.contextLost=true;this.callbacks.lost?.();};this.onRestored=()=>{this.contextLost=false;this.renderer.shadowMap.needsUpdate=true;this.callbacks.restored?.();};this.renderer.domElement.addEventListener('webglcontextlost',this.onLost);this.renderer.domElement.addEventListener('webglcontextrestored',this.onRestored);
 this.resize();this.last=performance.now();this.loop=this.loop.bind(this);this.frame=requestAnimationFrame(this.loop);
 }
 sky(){const geo=new T.SphereGeometry(180,24,12);const mat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{zoneTint:{value:new T.Color(0xffffff)}},vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform vec3 zoneTint;varying vec3 p;void main(){vec3 d=normalize(p);float h=clamp(d.y*.8+.3,0.,1.);vec3 col=mix(vec3(.12,.33,.4),vec3(.13,.3,.38),h);float sun=pow(max(0.,dot(d,normalize(vec3(-.55,.26,-.8)))),5.);col=mix(col,vec3(.91,.68,.37),sun*.7);col+=vec3(.45,.22,.08)*pow(max(0.,dot(d,normalize(vec3(-.55,.26,-.8)))),100.);gl_FragColor=vec4(col*zoneTint,1.);}`});this.skyMesh=new T.Mesh(geo,mat);this.scene.add(this.skyMesh);
 const random=rng(44),vertices=[];for(let i=0;i<170;i++)vertices.push((random()-.5)*55,random()*12,(random()-.5)*55);const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(vertices,3));this.dust=new T.Points(pg,new T.PointsMaterial({map:this.art.glow,color:0xffdca0,size:.1,transparent:true,opacity:.6,depthWrite:false,blending:T.AdditiveBlending}));this.scene.add(this.dust);}
 material(color,extra={}){return this.art.get(color,extra);}
 position(cell){return new T.Vector3((cell.c-(this.board.cols-1)/2)*spacing,0,(cell.r-(this.board.rows-1)/2)*spacing);}
 label(text){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const c=canvas.getContext('2d');c.textAlign='center';c.textBaseline='middle';c.font='bold 190px Georgia';c.lineJoin='round';c.lineWidth=5;c.strokeStyle='#e7d8af';c.strokeText(text,512,129,970);c.fillStyle='#263e35';c.fillText(text,512,128,970);const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;const mat=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});const label=new T.Mesh(new T.PlaneGeometry(2.15,.98),mat);label.rotation.x=-Math.PI/2;label.userData.ownedGeometry=true;label.userData.ownedMaterial=true;label.userData.ownedTexture=true;return label;}
 rune(parent,x,y,z,size=.35,color=0x78dbc4){const points=[new T.Vector3(-size*.5,0,-size*.5),new T.Vector3(0,0,size*.5),new T.Vector3(size*.5,0,-size*.5),new T.Vector3(-size*.5,0,0),new T.Vector3(size*.5,0,0)];const geo=new T.BufferGeometry().setFromPoints(points);const line=new T.Line(geo,new T.LineBasicMaterial({color,transparent:true,opacity:.8}));line.position.set(x,y,z);line.userData.ownedGeometry=true;line.userData.ownedMaterial=true;parent.add(line);return line;}
 goal(group,final){const m=this.art;
 for(const x of [-1,1]){m.stoneBlock(group,x,1,0,.35,2.1,.55,0xd6c699);m.stoneBlock(group,x,.16,0,.62,.22,.75,0xc3b991);m.metal(group,x,1.75,.3,.4,.12,.06);}
 for(let i=0;i<9;i++){const a=i/9*Math.PI+.02,b=(i+1)/9*Math.PI-.02,s=new T.Shape();s.absarc(0,2.1,1.24,a,b,false);s.absarc(0,2.1,.93,b,a,true);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:.48,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,steps:1});geo.translate(0,0,-.24);const block=new T.Mesh(geo,m.get(i%2?0xd2be94:0xabc0a0));block.castShadow=true;group.add(block);block.userData.ownedGeometry=true;}
 const portal=new T.Mesh(new T.PlaneGeometry(1.73,2.5),new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0},strength:{value:final?1:.75}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 v;uniform float time;uniform float strength;void main(){vec2 p=v-.5;float r=length(p*vec2(1.,.7));float edge=smoothstep(.55,.2,r);float swirl=.5+.5*sin(atan(p.y,p.x)*4.-time*1.8+r*18.);float veins=pow(swirl,7.);vec3 col=mix(vec3(.06,.46,.41),vec3(.55,1.,.83),veins);gl_FragColor=vec4(col,edge*(.13+veins*.35)*strength);}`}));portal.position.set(0,1.5,.03);portal.userData.ownedGeometry=true;portal.userData.ownedMaterial=true;group.add(portal);this.portal=portal;
 this.art.glowSprite(group,new T.Vector3(0,1.7,0),0x5bffe1,4.3,final?.32:.21);
 const halo=new T.Mesh(new T.TorusGeometry(final?1.9:1.55,.035,8,64),m.get(0xcca959,{metalness:.6,emissive:0x8c5d23,emissiveIntensity:.25}));halo.position.set(0,1.8,-.35);halo.userData.ownedGeometry=true;group.add(halo);this.halo=halo;
 for(let k=0;k<12;k++){const a=k/12*Math.PI*2;const jewel=new T.Mesh(new T.OctahedronGeometry(.07),new T.MeshBasicMaterial({color:0x8cfbe0}));jewel.position.set(Math.cos(a)*(final?1.9:1.55),1.8+Math.sin(a)*(final?1.9:1.55),-.35);jewel.userData.ownedGeometry=true;jewel.userData.ownedMaterial=true;group.add(jewel);}
 }
 clearBoard(){this.boardGroup.traverse(o=>{if(o.userData.ownedTexture)o.material.map.dispose();if(o.userData.ownedMaterial)o.material.dispose();if(o.userData.ownedGeometry)o.geometry.dispose();});this.boardGroup.clear();this.tiles=[];this.interact=[];this.portal=null;this.halo=null;for(const d of this.debris)this.scene.remove(d.mesh);this.debris=[];for(const e of this.effects){this.scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();}this.effects=[];}
 setZone(zone) {
  this.zone=zone;
  this.scene.fog.color.setHex(zone.fog);
  this.sun.color.setHex(zone.sun);
  const skyColors={temple:0xffffff,grove:0xb6e9b5,crystal:0xb0b5ff,forge:0xff9f80};
  this.skyMesh.material.uniforms.zoneTint.value.setHex(skyColors[zone.id]);
  if(zone.id!=='temple'&&!this.zoneGroups.has(zone.id)){
   const group=new T.Group();
   this.scene.add(group);
   this.zoneGroups.set(zone.id,group);
   for(const side of [-1,1]){
    const x=side*12;
    for(const z of [-8,-2,5]){
     this.art.stoneBlock(group,x,-1.55,z,2.3,.55,2.4,zone.stone);
     if(zone.id==='grove'){
      this.art.mesh(group,this.art.unitCylinder,this.art.get(0x66502d),x,-.35,z,.24,2,.24);
      for(let i=0;i<4;i++){
       this.art.mesh(group,this.art.unitSphere,this.art.get(i%2?0x609346:0x417546),x+(i-1.5)*.38,.85+i*.22,z,.74,.63,.74);
      }
      for(let i=0;i<3;i++)this.art.mesh(group,this.art.unitSphere,this.art.get(0xefac78),x-.6+i*.6,-1.18,z+.75,.19,.14,.19);
     }else if(zone.id==='crystal'){
      for(let i=0;i<4;i++){
       const crystal=this.art.mesh(group,this.art.unitSphere,this.art.get(0x7888fa,{emissive:0x3639b5,emissiveIntensity:.55}),x+(i-1.5)*.43,-.46+i*.19,z,.27,.65+i*.21,.29);
       crystal.rotation.z=(i-1.5)*.25;
      }
      this.art.glowSprite(group,new T.Vector3(x,.1,z),0x858cff,2.2,.32);
     }else{
      for(let i=0;i<3;i++)this.art.stoneBlock(group,x,-1.22+i*.48,z,1.35-i*.24,.35,1.35-i*.24,0x443638,i*.21);
      this.art.mesh(group,this.art.unitSphere,this.art.get(0xff752d,{emissive:0xff5b14,emissiveIntensity:1.1}),x,.16,z,.43,.35,.43);
      this.art.glowSprite(group,new T.Vector3(x,.3,z),0xff713d,3.1,.45);
     }
    }
   }
  }
  for(const [id,group] of this.zoneGroups)group.visible=id===zone.id;
  this.renderer.shadowMap.needsUpdate=true;
 }
 load(board,current=board.start){this.clearBoard();this.board=board;this.jump=null;this.falling=null;this.setZone(zoneFor(board.level));
 const random=rng(312),cells=[...board.tiles,{...board.start,word:'SALIDA',safe:true,special:'start'},{...board.goal,word:'UMBRAL',safe:true,special:'goal'}];
 for(const cell of cells){const group=new T.Group(),p=this.position(cell);group.position.copy(p);this.boardGroup.add(group);
 const base=this.art.stoneBlock(group,0,-.37,0,2.32,.75,2.32,0xbeb99a);base.rotation.y=(random()-.5)*.055;
 const top=this.art.stoneBlock(group,0,.005,0,2.34,.12,2.34,this.zone.stone);top.rotation.y=base.rotation.y;
 this.art.stoneBlock(group,.02,-.88,.02,1.96,.37,1.96,0x7d8b74,base.rotation.y+.01);
 const bottom=this.art.mesh(group,this.art.unitSphere,this.art.get(0x61796e),0,-1.35,0,.87,.48,.92);bottom.rotation.y=cell.r+cell.c;
 // Cercles gravés et coins de bronze sur chaque dalle.
 const ring=new T.Mesh(new T.RingGeometry(.86,.93,64),new T.MeshBasicMaterial({color:0x637b68,transparent:true,opacity:.5,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.09;ring.userData.ownedGeometry=true;ring.userData.ownedMaterial=true;group.add(ring);
 const selectRing=new T.Mesh(new T.RingGeometry(.98,1.09,64),new T.MeshBasicMaterial({color:0x94f8d8,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}));selectRing.rotation.x=-Math.PI/2;selectRing.position.y=.1;selectRing.userData.ownedGeometry=true;selectRing.userData.ownedMaterial=true;group.add(selectRing);
 for(const x of [-1,1]){this.art.metal(group,x*.94,.1,-.93,.23,.025,.035);this.art.metal(group,x*.94,.1,.93,.23,.025,.035);}
 this.rune(group,0,.105,-.65,.24,0x8d9e79);this.rune(group,0,.105,.68,.22,0x9da879);
 const label=this.label(cell.word);label.position.set(0,.125,.05);group.add(label);
 // Petites racines, herbes et éclats: jamais sur la zone du mot.
 if(!cell.special){for(let k=0;k<3;k++){const a=random()*Math.PI*2;const leaf=this.art.mesh(group,this.art.unitSphere,this.art.get(k%2?0x668856:0x85945b),Math.cos(a)*1.1,-.01,Math.sin(a)*1.1,.11,.055,.18);leaf.rotation.y=a;}if((cell.r+cell.c)%4===0){for(let j=0;j<3;j++)this.art.stoneBlock(group,.92,-.6-j*.22,-.92,.06,.25,.06,0x53724f);}}
 const shadow=new T.Mesh(new T.PlaneGeometry(3.5,3.5),new T.MeshBasicMaterial({map:this.art.glow,color:0x173b3b,opacity:.26,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-1.9;shadow.userData.ownedGeometry=true;shadow.userData.ownedMaterial=true;group.add(shadow);
 const tile={...cell,group,ring:selectRing,engraving:ring,base,top,label,original:p.clone()};base.userData.cell=tile;top.userData.cell=tile;this.tiles.push(tile);this.interact.push(base,top);
 if(cell.special==='goal')this.goal(group,board.final);
 }
 this.playerPos.copy(this.position(current));this.playerPos.y=.16;this.character.setState('spawn');this.focus.set(0,0,0);this.targetFocus.set(0,0,0);this.intro=1.2;this.renderer.shadowMap.needsUpdate=true;this.resize();}
 resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.resizePending=true;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();const depth=this.board?(this.board.rows+2)*spacing:20;const width=this.board?this.board.cols*spacing:12;const factor=Math.max(1,depth/20,width/(10*this.camera.aspect));this.baseCamera.set(8.5*factor,17.5*factor,20*factor);}
 pick(e){if(!this.board||this.jump||this.falling)return null;const r=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);return this.raycaster.intersectObjects(this.interact,false)[0]?.object.userData.cell||null;}
 mark(current,visited,revealed,selected,boot=false){
  for(const tile of this.tiles){
   const key=`${tile.r},${tile.c}`;
   const distance=Math.abs(tile.r-current.r)+Math.abs(tile.c-current.c);
   const wasVisited=visited.includes(key);
   const isRevealed=revealed.includes(key);
   const reachable=tile.special!=='start'&&(distance===1||(boot&&distance===2));
   const highlighted=reachable&&selected?.r===tile.r&&selected?.c===tile.c;
   tile.ring.material.opacity=highlighted?1:reachable?.95:isRevealed?.8:0;
   tile.ring.material.color.setHex(highlighted?0xe0ffff:reachable?0x19e6f5:tile.safe?0x7dffd0:0xff8257);
   tile.engraving.material.color.setHex(wasVisited?0xfbc346:0x637b68);
   tile.engraving.material.opacity=wasVisited?1:.5;
   tile.top.material=this.art.get(isRevealed?(tile.safe?0x9ebc91:0xc99878):wasVisited?0xd3ad65:this.zone.stone);
  }
 }
 jumpTo(cell,callback,boost=false){if(this.jump||this.falling)return false;const to=this.position(cell);to.y=.16;if(to.x!==this.playerPos.x)this.character.facing=to.x>this.playerPos.x?1:-1;this.character.setState('jump');this.jump={from:this.playerPos.clone(),to,elapsed:0,duration:boost?.72:.59,callback,boost,trail:0};return true;}
 collapse(cell,callback){const tile=this.tiles.find(t=>t.r===cell.r&&t.c===cell.c);if(!tile){callback();return;}this.character.setState('balance');const crackGeo=new T.BufferGeometry().setFromPoints([new T.Vector3(-.9,.16,-.8),new T.Vector3(-.25,.16,-.3),new T.Vector3(-.4,.16,.1),new T.Vector3(.3,.16,.4),new T.Vector3(.9,.16,.9)]),crack=new T.Line(crackGeo,new T.LineBasicMaterial({color:0x513d29}));crack.userData.ownedGeometry=true;crack.userData.ownedMaterial=true;tile.group.add(crack);this.falling={tile,time:0,callback,broken:false};}
 burst(pos,color=0xb6f6d8,count=18,dust=false){const random=rng(Math.floor(this.time*1000));for(let i=0;i<count;i++){const geo=dust?new T.PlaneGeometry(.25+random()*.35,.25+random()*.35):new T.OctahedronGeometry(.025+random()*.04);const mat=dust?new T.MeshBasicMaterial({map:this.art.glow,color,transparent:true,opacity:.5,depthWrite:false,side:T.DoubleSide}):new T.MeshBasicMaterial({color,transparent:true,blending:T.AdditiveBlending,depthWrite:false});const mesh=new T.Mesh(geo,mat);mesh.position.copy(pos);mesh.position.y+=dust?.12:.35;if(dust)mesh.quaternion.copy(this.camera.quaternion);this.scene.add(mesh);this.effects.push({mesh,age:0,life:.6+random()*.5,v:new T.Vector3((random()-.5)*2.3,random()*1.7+.3,(random()-.5)*2.3),dust});}}
 reveal(cell){this.character.setState('cast');this.burst(this.position(cell),0xffd89b,28);}
 setQuality(quality){this.quality=quality;this.renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='low'?1:1.5));this.renderer.shadowMap.enabled=quality!=='low';this.renderer.shadowMap.needsUpdate=true;this.environment.group.traverse(o=>{if(o.material?.uniforms?.time&&o.geometry?.type==='PlaneGeometry'&&o.geometry.parameters.width>100)o.visible=quality!=='low';});this.resize();}
 loop(now){this.frame=requestAnimationFrame(this.loop);const dt=Math.min((now-this.last)/1000,.25);this.last=now;if(document.hidden||this.contextLost)return;if(this.paused&&this.wasPaused&&!this.resizePending)return;this.wasPaused=this.paused;this.resizePending=false;if(!this.paused){this.time+=dt;this.callbacks.tick?.(dt);
 if(this.jump){const j=this.jump;j.elapsed+=dt;const t=Math.min(1,j.elapsed/j.duration);const u=t;const ease=u*u*(3-2*u);this.playerPos.lerpVectors(j.from,j.to,ease);this.playerPos.y+=Math.sin(u*Math.PI)*(j.boost?2.5:1.95);j.trail+=dt;if(j.trail>.07&&u>.1&&u<.9){j.trail=0;this.burst(this.playerPos,0x7fdcc4,this.quality==='low'?1:2);}if(t===1){this.playerPos.copy(j.to);this.jump=null;this.character.setState('land');this.landTime=.22;this.burst(this.playerPos,0xdfc59d,12,true);j.callback();}}
 if(this.falling){this.renderer.shadowMap.needsUpdate=true;const f=this.falling;f.time+=dt;const t=f.time;if(t<.6){f.tile.group.rotation.z=Math.sin(t*65)*.026;f.tile.group.position.y=-t*.12;}else{if(!f.broken){f.broken=true;this.character.setState('fall');this.shake=.2;for(let n=0;n<15;n++){const mesh=new T.Mesh(this.art.geometry,this.art.get(n%2?0xb8b291:0x8c947c));mesh.scale.set(.35+n%3*.09,.22+n%2*.13,.35);mesh.position.copy(f.tile.original);mesh.position.x+=(n%3-1)*.65;mesh.position.z+=(Math.floor(n/3)%3-1)*.65;this.scene.add(mesh);this.debris.push({mesh,v:new T.Vector3(Math.sin(n)*2,1+Math.cos(n),Math.cos(n)*2),age:0});}f.tile.group.visible=false;this.burst(f.tile.original,0xe1cca8,32,true);}this.playerPos.y=.16-(t-.6)*(t-.6)*13;}if(t>1.65){this.falling=null;f.callback();}}
 for(const d of this.debris){d.age+=dt;d.v.y-=dt*12;d.mesh.position.addScaledVector(d.v,dt);d.mesh.rotation.x+=dt*2;d.mesh.rotation.z+=dt;}
 for(let i=this.effects.length-1;i>=0;i--){const e=this.effects[i];e.age+=dt;e.v.y-=dt*(e.dust?.6:2);e.mesh.position.addScaledVector(e.v,dt);e.mesh.material.opacity=(e.dust?.5:1)*(1-e.age/e.life);if(e.dust)e.mesh.scale.setScalar(1+e.age*1.8);if(e.age>=e.life){this.scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();this.effects.splice(i,1);}}
 this.character.update(dt,this.playerPos,.1,this.jump?this.jump.elapsed/this.jump.duration:undefined);if((this.character.state==='land'&&this.character.clock>=.18)||(['cast','spawn'].includes(this.character.state)&&this.character.clock>.65))this.character.setState('idle');this.environment.update(this.time);if(this.portal)this.portal.material.uniforms.time.value=this.time;if(this.halo)this.halo.rotation.z=this.time*.08;this.dust.rotation.y=this.time*.004;this.landTime=Math.max(0,this.landTime-dt);this.shake=Math.max(0,this.shake-dt*.55);
 }
 if(this.board){this.intro=Math.max(0,(this.intro||0)-dt);this.targetFocus.set(this.playerPos.x*.08,0,this.playerPos.z*.1);if(this.falling&&this.motion)this.targetFocus.y=Math.max(-2,this.playerPos.y*.12);this.focus.lerp(this.targetFocus,1-Math.exp(-dt*3));const zoom=1+(this.motion?this.intro*.1:0),desired=this.baseCamera.clone().multiplyScalar(zoom).add(this.focus);if(this.motion&&this.shake){desired.x+=Math.sin(this.time*70)*this.shake;desired.y+=Math.sin(this.time*91)*this.shake;}this.camera.position.lerp(desired,1-Math.exp(-dt*4));this.camera.lookAt(this.focus);}
 this.renderer.render(this.scene,this.camera);}
 dispose(){cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.clearBoard();this.character.dispose();this.environment.dispose();for(const group of this.zoneGroups.values()){group.traverse(node=>{if(node.userData.ownedMaterial)node.material.dispose();});this.scene.remove(group);}this.skyMesh.geometry.dispose();this.skyMesh.material.dispose();this.dust.geometry.dispose();this.dust.material.dispose();this.art.dispose();this.renderer.dispose();this.renderer.domElement.remove();}
}
