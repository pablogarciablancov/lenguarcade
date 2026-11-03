import * as T from '../vendor/three.module.js';
// Recursos del propio juego; sin CDN. Se incrustan también en la edición autónoma.
export const STONE_URL='assets/stone-v2.webp';
export const SPRITES_URL='assets/explorer-v2.webp';
export function radialTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,1,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.18,'rgba(255,255,255,.7)');g.addColorStop(.5,'rgba(255,255,255,.16)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new T.CanvasTexture(c);}
export function stoneGeometry(){const s=new T.Shape(),points=[[-.42,-.5],[.34,-.5],[.5,-.37],[.49,.31],[.38,.5],[-.33,.48],[-.5,.32],[-.49,-.34]];s.moveTo(...points[0]);for(const p of points.slice(1))s.lineTo(...p);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:.88,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.045,bevelThickness:.055,curveSegments:1});g.rotateX(-Math.PI/2);g.translate(0,-.44,0);return g;}
export class Materials{
 constructor(){this.cache=new Map();this.textures=[];this.glow=radialTexture();this.textures.push(this.glow);this.stone=new T.TextureLoader().load(STONE_URL);this.stone.colorSpace=T.SRGBColorSpace;this.stone.wrapS=this.stone.wrapT=T.RepeatWrapping;this.stone.anisotropy=4;this.stone.repeat.set(.7,.7);this.textures.push(this.stone);this.geometry=stoneGeometry();this.unitBox=new T.BoxGeometry(1,1,1);this.unitCylinder=new T.CylinderGeometry(1,1,1,16);this.unitSphere=new T.IcosahedronGeometry(1,1);}
 get(color,extra={}){const key=color+JSON.stringify(extra);if(!this.cache.has(key)){const metal=extra.metalness>0.3;this.cache.set(key,new T.MeshStandardMaterial({color,roughness:metal?.46:.94,map:metal?null:this.stone,...extra}));}return this.cache.get(key);}
 mesh(parent,geo,material,x,y,z,sx=1,sy=1,sz=1){const m=new T.Mesh(geo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 stoneBlock(parent,x,y,z,w,h,d,color=0xc8c0a1,rot=0){const m=this.mesh(parent,this.geometry,this.get(color),x,y,z,w,h,d);m.rotation.y=rot;return m;}
 metal(parent,x,y,z,w,h,d,color=0xb69961){return this.mesh(parent,this.unitBox,this.get(color,{metalness:.7,roughness:.38}),x,y,z,w,h,d);}
 glowSprite(parent,pos,color,size,opacity=.5){const m=new T.SpriteMaterial({map:this.glow,color,transparent:true,opacity,blending:T.AdditiveBlending,depthWrite:false});const s=new T.Sprite(m);s.position.copy(pos);s.scale.setScalar(size);s.userData.ownedMaterial=true;parent.add(s);return s;}
 dispose(){for(const m of this.cache.values())m.dispose();for(const t of this.textures)t.dispose();for(const g of [this.geometry,this.unitBox,this.unitCylinder,this.unitSphere])g.dispose();}
}
