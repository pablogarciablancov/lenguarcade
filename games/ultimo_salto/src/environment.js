import * as T from '../vendor/three.module.js';
import {rng} from './generator.js';
export class Environment{
 constructor(scene,materials){this.scene=scene;this.m=materials;this.group=new T.Group();scene.add(this.group);this.animated=[];this.lights=[];this.unique=[];this.random=rng(23072);this.build();this.batch();this.mergeSculptures();}
 rockIsland(x,y,z,w,d,seed=1){const random=rng(seed),g=new T.Group();g.position.set(x,y,z);this.group.add(g);this.m.stoneBlock(g,0,0,0,w,.65,d,0xb8b39a,.025);
 for(let i=0;i<5;i++){const r=1-i*.14,h=1.2+i*.4;const geo=new T.CylinderGeometry(w*.48*r,w*.3*r,h,7,1);geo.rotateY(i*.7);const mesh=new T.Mesh(geo,this.m.get(i<2?0x7b8170:0x4d655d));mesh.position.set((random()-.5)*w*.15,-.8-i*1.1,(random()-.5)*d*.2);mesh.scale.z=d/w;mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);this.unique.push(geo);}
 for(let i=0;i<8;i++)this.m.stoneBlock(g,(random()-.5)*w,-random()*.25,(random()-.5)*d,.3+random()*.4,.2,.4,0x6b8760,random()*6);
 return g;}
 column(g,x,y,z,h=7,r=.55,broken=false){const m=this.m;
 for(const [dy,rr,hh] of [[.12,r*1.65,.24],[.38,r*1.4,.25],[.62,r*1.1,.2],[h-.3,r*1.2,.22],[h,r*1.6,.32]])m.mesh(g,m.unitCylinder,m.get(0xc5bd9b),x,y+dy,z,rr,hh,rr);
 const profile=[];for(let j=0;j<=18;j++){const t=j/18;profile.push(new T.Vector2(r*(1-.15*t+.035*Math.sin(t*Math.PI)),.7+t*(h-1.2)));}
 const geo=new T.LatheGeometry(profile,24);this.unique.push(geo);const shaft=new T.Mesh(geo,m.get(0xbab69b));shaft.position.set(x,y,z);shaft.castShadow=true;shaft.receiveShadow=true;g.add(shaft);
 // Estrías reales a lo largo de la columna y collar de bronce oxidado.
 for(let k=0;k<8;k++){const a=k/8*Math.PI*2;m.mesh(g,m.unitCylinder,m.get(0xa1a88d),x+Math.cos(a)*r*.95,y+h/2,z+Math.sin(a)*r*.95,.045,h-1.5,.045);}
 m.mesh(g,m.unitCylinder,m.get(0x7d9c88,{metalness:.38}),x,y+h*.68,z,r*1.015,.13,r*1.015);
 if(broken){for(let i=0;i<3;i++)m.stoneBlock(g,x+(i-1)*.22,y+h+.15,z+Math.sin(i)*.15,.35,.25,.4,0xc6bea0,i);}
 }
 arch(x,y,z,radius=2.1,height=6,scale=1,broken=false,rotation=0){const g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(scale);g.rotation.y=rotation;this.group.add(g);const m=this.m;
 this.column(g,-radius,0,0,height,.46);this.column(g,radius,0,0,broken?height*.59:height,.46,broken);
 const n=13;
 for(let i=0;i<n;i++){if(broken&&i<5)continue;const a=i/n*Math.PI+.018,b=(i+1)/n*Math.PI-.018,s=new T.Shape();s.absarc(0,height,radius+.35,a,b,false);s.absarc(0,height,radius-.18,b,a,true);s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:.7,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:1,steps:1});geo.translate(0,0,-.35);this.unique.push(geo);const mesh=new T.Mesh(geo,m.get(i%3===0?0xd4c6a2:0xb8b99f));mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);}
 if(!broken){m.stoneBlock(g,0,height+radius+.5,0,radius*2+1,.35,1.1,0xccbc92);for(let j=-2;j<=2;j++)m.metal(g,j*.55,height+radius+.53,.58,.15,.12,.03,0xd8b66e);}
 this.ivy(g,-radius-.23,height+.3,0,Math.min(height,5));if(broken)this.ivy(g,radius,height*.6,0,3.5);return g;
 }
 ivy(parent,x,y,z,length=4){const m=this.m,random=this.random;
 for(let i=0;i<Math.ceil(length*6);i++){const t=i/6,px=x+Math.sin(t*1.9)*.14,pz=z+Math.cos(t*2)*.1;
 m.mesh(parent,m.unitCylinder,m.get(0x3c5844),px,y-t,pz,.026,.24,.026);
 for(const side of [-1,1]){const leaf=m.mesh(parent,m.unitSphere,m.get(i%3?0x4e774c:0x759064),px+side*.15,y-t+.03,pz+.11,.17,.04,.085);leaf.rotation.z=side*.5;leaf.rotation.x=t*.7;}
 }}
 tree(x,y,z,scale=1){const m=this.m,g=new T.Group();g.position.set(x,y,z);g.scale.setScalar(scale);this.group.add(g);const trunk=m.mesh(g,m.unitCylinder,m.get(0x665e43),0,1.2,0,.14,2.4,.14);trunk.rotation.z=.11;
 for(let i=0;i<7;i++){const a=i*2.4,r=i%3*.35;const b=m.mesh(g,m.unitCylinder,m.get(0x665e43),Math.cos(a)*r*.5,1.7+i*.08,Math.sin(a)*r*.5,.06,1.2,.06);b.rotation.z=Math.cos(a)*.8;b.rotation.x=Math.sin(a)*.6;const leaf=m.mesh(g,m.unitSphere,m.get(i%2?0x496649:0x6a8056),Math.cos(a)*r,2.2+i*.12,Math.sin(a)*r,.7,.5,.65);leaf.rotation.y=a;}
 }
 brazier(x,y,z){const m=this.m,g=this.group;m.mesh(g,m.unitCylinder,m.get(0x87734d,{metalness:.5}),x,y+.8,z,.15,1.6,.15);m.mesh(g,m.unitCylinder,m.get(0xaf8d50,{metalness:.7}),x,y+1.6,z,.4,.15,.4);
 const flame=new T.Mesh(new T.SphereGeometry(.17,8,8),new T.MeshBasicMaterial({color:0xffdda3}));flame.scale.set(.8,2.4,.8);flame.position.set(x,y+1.95,z);g.add(flame);this.unique.push(flame.geometry);flame.userData.ownedMaterial=true;
 const glow=m.glowSprite(g,new T.Vector3(x,y+1.9,z),0xffb557,2.3,.47);const light=new T.PointLight(0xffa34d,12,9,2);light.position.copy(flame.position);g.add(light);this.lights.push(light);this.animated.push({flame,glow,light});
 }
 waterfall(x,y,z,length=13,width=.5){const geo=new T.PlaneGeometry(width,length),material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0},tint:{value:new T.Color(0x8fd8ce)}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;uniform float time;uniform vec3 tint;void main(){float edge=sin(v.x*3.14159);float streak=.6+.4*sin(v.x*62.+sin(v.y*17.-time*3.));float foam=pow(max(0.,sin(v.y*90.+time*9.)),9.);float alpha=edge*edge*(.2+streak*.22+foam*.2)*smoothstep(0.,.14,v.y);gl_FragColor=vec4(tint,alpha);}'});const mesh=new T.Mesh(geo,material);mesh.position.set(x,y-length/2,z);this.group.add(mesh);this.animated.push({water:material});this.unique.push(geo);mesh.userData.ownedMaterial=true;}
 build(){const m=this.m;
 this.rockIsland(-15,-1,-5,8,7,5);this.arch(-15,-.55,-5,2.3,6.3,.78,false,.12);this.tree(-17,-.4,-2,.95);
 this.rockIsland(16,-.7,-10,9,9,8);this.arch(16,-.25,-11,2.2,7,.83,false,-.12);this.tree(19,-.3,-7,1.2);
 this.rockIsland(-14,-1.8,9,6,5,18);this.arch(-14,-1.35,9,1.8,4.5,1,true,.35);this.ivy(this.group,-12,0,10,5);this.waterfall(-11.5,-1.9,9.8,15,.8);
 this.rockIsland(14,-1.7,8,6,7,22);this.tree(14,-1.2,9,1.5);this.column(this.group,12,-1.2,7,4,.4,true);this.waterfall(12.2,-2,10.9,17,.7);
 // Santuario monumental al fondo, con contrafuertes y cúpula de bronce.
 this.rockIsland(0,-3,-24,17,11,31);this.arch(0,-2.5,-23,3.3,8,.8,false,0);
 for(const x of [-7,7]){m.stoneBlock(this.group,x,2,-24,2.5,9,3,0x9da78f);for(let i=0;i<4;i++)m.stoneBlock(this.group,x,6.8+i*.32,-24,3-i*.35,.35,3.5-i*.4,0xbdb896);}
 const domeGeo=new T.SphereGeometry(2.8,24,12,0,Math.PI*2,0,Math.PI/2);this.unique.push(domeGeo);const dome=new T.Mesh(domeGeo,m.get(0x759b8c,{metalness:.52,roughness:.5}));dome.position.set(0,12,-24);this.group.add(dome);m.mesh(this.group,m.unitCylinder,m.get(0xa99768,{metalness:.6}),0,12,-24,3,.35,3);m.mesh(this.group,m.unitCylinder,m.get(0xc9bb89,{metalness:.6}),0,15,-24,.09,1.6,.09);
 for(let i=0;i<9;i++)m.stoneBlock(this.group,-14+i*.25,-1.4+i*.22,2-i*.5,2.5,.24,1.1,0xc1b69a,-.2);
 const random=this.random;
 for(let i=0;i<19;i++){const angle=random()*Math.PI*2,r=30+random()*42;const x=Math.cos(angle)*r,z=Math.sin(angle)*r,y=-8-random()*13;this.rockIsland(x,y,z,4+random()*6,4+random()*5,50+i);if(i%2===0)this.arch(x,y+.5,z,1.5,4+random()*3,.7,!!(i%3),angle);}
 for(const [x,z] of [[-11,7.8],[11,-9],[-11,-12],[11,9.5]]){this.rockIsland(x,-.55,z,1.55,1.55,Math.round((x+20)*13));this.brazier(x,-.15,z);}
 // Niebla volumétrica estilizada, con ruido animado y profundidad real.
 for(const y of [-6,-13]){const geo=new T.PlaneGeometry(180,180),mat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 v;uniform float time;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 a=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(a),h(a+vec2(1,0)),f.x),mix(h(a+vec2(0,1)),h(a+1.),f.x),f.y);}void main(){vec2 p=v*15.+vec2(time*.014,-time*.009);float a=n(p)*.6+n(p*2.1)*.3+n(p*4.3)*.1;gl_FragColor=vec4(.25,.51,.55,smoothstep(.25,.9,a)*.33);}`});const plane=new T.Mesh(geo,mat);plane.rotation.x=-Math.PI/2;plane.position.y=y;this.group.add(plane);plane.userData.ownedMaterial=true;this.unique.push(geo);this.animated.push({water:mat});}
 }
 batch(){this.group.updateMatrixWorld(true);const batches=new Map(),remove=[];this.group.traverse(o=>{if(!o.isMesh||![this.m.geometry,this.m.unitBox,this.m.unitCylinder,this.m.unitSphere].includes(o.geometry))return;const key=o.geometry.uuid+o.material.uuid;if(!batches.has(key))batches.set(key,{geo:o.geometry,mat:o.material,matrices:[]});batches.get(key).matrices.push(o.matrixWorld.clone());remove.push(o);});for(const o of remove)o.parent.remove(o);for(const b of batches.values()){const mesh=new T.InstancedMesh(b.geo,b.mat,b.matrices.length);b.matrices.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.castShadow=true;mesh.receiveShadow=true;this.group.add(mesh);}}
 mergeSculptures(){
 this.group.updateMatrixWorld(true);const groups=new Map(),remove=[];
 this.group.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||!o.material.isMeshStandardMaterial)return;let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(!g.attributes.normal)g.computeVertexNormals();if(!g.attributes.uv)g.setAttribute('uv',new T.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));const key=o.material.uuid;if(!groups.has(key))groups.set(key,{material:o.material,parts:[]});groups.get(key).parts.push(g);remove.push(o);});
 for(const o of remove)o.parent.remove(o);
 for(const b of groups.values()){const g=new T.BufferGeometry();for(const [name,size] of [['position',3],['normal',3],['uv',2]]){const length=b.parts.reduce((n,p)=>n+p.attributes[name].array.length,0),values=new Float32Array(length);let offset=0;for(const p of b.parts){values.set(p.attributes[name].array,offset);offset+=p.attributes[name].array.length;}g.setAttribute(name,new T.BufferAttribute(values,size));}g.computeBoundingSphere();const mesh=new T.Mesh(g,b.material);mesh.castShadow=true;mesh.receiveShadow=true;this.group.add(mesh);this.unique.push(g);for(const p of b.parts)p.dispose();}
 }
 update(time){for(const a of this.animated){if(a.water)a.water.uniforms.time.value=time;else{a.flame.scale.y=2.3+Math.sin(time*9+a.flame.position.x)*.25;a.flame.rotation.z=Math.sin(time*5)*.1;a.light.intensity=11+Math.sin(time*13+a.light.position.x);a.glow.material.opacity=.4+Math.sin(time*7)*.04;}}}
 dispose(){this.group.traverse(o=>{if(o.userData.ownedMaterial)o.material.dispose();});for(const g of this.unique)g.dispose();this.scene.remove(this.group);}
}
