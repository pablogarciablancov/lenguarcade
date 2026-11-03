import * as T from '../vendor/three.module.js';
import {SPRITES_URL,radialTexture} from './materials.js';
export const STATES=['idle','walk','jump','land','balance','fall','hurt','victory','cast','spawn'];
// Atlas original: ocho columnas, cuatro secuencias. Los estados no cíclicos usan keyframes finales.
const footAnchors = [
 [[.624,.036],[.552,.036],[.577,.036],[.547,.036],[.545,.036],[.557,.036],[.552,.036],[.543,.036]],
 Array(8).fill([.55,.041]),
 [[.592,.05],[.507,.05],[.55,.036],[.57,.036],[.57,.06],[.55,.041],[.5,.045],[.428,.045]],
 [[.615,.045],[.532,.045],[.532,.045],[.491,.045],[.45,.045],[.471,.045],[.464,.045],[.468,.045]]
];
export class Character{
 constructor(scene,color='#38b6ad'){
 this.texture=new T.TextureLoader().load(SPRITES_URL,()=>{this.loaded=true;this.blendTexture.needsUpdate=true;});this.texture.magFilter=T.NearestFilter;this.texture.minFilter=T.NearestFilter;this.texture.generateMipmaps=false;this.texture.colorSpace=T.SRGBColorSpace;this.texture.repeat.set(1/8,1/4);
 this.material=new T.SpriteMaterial({map:this.texture,transparent:true,depthWrite:false,alphaTest:.02});this.capeTint={value:new T.Color(color)};this.material.onBeforeCompile=shader=>{shader.uniforms.capeTint=this.capeTint;shader.fragmentShader='uniform vec3 capeTint;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
 vec3 originalColor=diffuseColor.rgb;
 float mask=smoothstep(.025,.16,originalColor.g-originalColor.r)*smoothstep(.015,.12,originalColor.b-originalColor.r);
 float luminance=dot(originalColor,vec3(.2126,.7152,.0722));
 vec3 recolored=capeTint*luminance/max(.02,dot(capeTint,vec3(.2126,.7152,.0722)));
 diffuseColor.rgb=mix(originalColor,recolored,mask*.9);`);};this.sprite=new T.Sprite(this.material);this.sprite.scale.set(2.9,2.9,1);this.sprite.center.set(.63,.025);scene.add(this.sprite);this.state='idle';this.facing=1;this.clock=0;this.loaded=false;
 this.blendTexture=this.texture.clone();
 this.blendMaterial=this.material.clone();
 this.blendMaterial.map=this.blendTexture;
 this.blendMaterial.onBeforeCompile=this.material.onBeforeCompile;
 this.blendSprite=new T.Sprite(this.blendMaterial);
 this.blendSprite.renderOrder=1;
 scene.add(this.blendSprite);
 this.softTexture=radialTexture();this.shadow=new T.Mesh(new T.PlaneGeometry(1.6,1.05),new T.MeshBasicMaterial({map:this.softTexture,color:0x102c2c,transparent:true,opacity:.72,depthWrite:false}));this.shadow.rotation.x=-Math.PI/2;scene.add(this.shadow);
 this.lanternGlow=new T.Sprite(new T.SpriteMaterial({map:this.softTexture,color:0xffbc60,transparent:true,opacity:.23,blending:T.AdditiveBlending,depthWrite:false}));this.lanternGlow.scale.set(1.8,1.8,1);scene.add(this.lanternGlow);this.lantern=new T.PointLight(0xffb24e,2.4,4,2);scene.add(this.lantern);this.skinColor=color;
 }
 setState(state){if(this.state!==state){this.state=state;this.clock=0;}}
 setColor(color){this.skinColor=color;this.capeTint.value.set(color);}
 pose(sprite,texture,row,frame,pos,scale,rotation){
  const [x,y]=footAnchors[row][frame];
  texture.repeat.x=this.facing/8;
  texture.offset.set((this.facing>0?frame:frame+1)/8,1-(row+1)/4);
  sprite.center.set(this.facing>0?x:1-x,y);
  sprite.position.copy(pos);
  sprite.material.rotation=rotation;
  sprite.scale.set(2.9*scale,2.9*scale,1);
 }
 update(dt,pos,ground,jumpProgress){this.clock+=dt;let row=0,frame=0,rotation=0,scale=1,nextRow=0,nextFrame=0,blend=0;
 if(this.state==='idle'){frame=Math.floor(this.clock*6)%8;}
 else if(this.state==='walk'){row=1;frame=Math.floor(this.clock*12)%8;}
 else if(this.state==='jump'){
  row=nextRow=2;
  const pose=Math.min(7,(jumpProgress??0)*7);
  frame=Math.floor(pose);
  nextFrame=Math.min(7,frame+1);
  blend=pose-frame;
 }
 else if(this.state==='land'){
  row=2;
  frame=7;
  blend=Math.min(1,this.clock/.18);
 }
 else if(['victory','cast'].includes(this.state)){row=3;frame=this.state==='cast'?Math.min(5,Math.floor(this.clock*10)):Math.min(7,Math.floor(this.clock*9));}
 else if(this.state==='balance'){row=2;frame=5;rotation=Math.sin(this.clock*27)*.12;}
 else if(this.state==='fall'){row=2;frame=5;rotation=this.facing*Math.min(.7,this.clock*.7);scale=Math.max(.55,1-this.clock*.15);}
 else if(this.state==='hurt'){row=2;frame=7;this.material.opacity=Math.floor(this.clock*16)%2?.45:1;}
 else if(this.state==='spawn'){row=3;frame=1;this.material.opacity=Math.min(1,this.clock*3);}
 if(!['hurt','spawn'].includes(this.state))this.material.opacity=1;
 this.pose(this.sprite,this.texture,row,frame,pos,scale,rotation);
 this.blendSprite.visible=blend>0;
 if(blend>0){
  this.pose(this.blendSprite,this.blendTexture,nextRow,nextFrame,pos,scale,rotation);
  this.material.opacity=1-blend;
  this.blendMaterial.opacity=blend;
 }
 this.shadow.position.set(pos.x,ground+.055,pos.z);const s=Math.max(.35,1-Math.max(0,pos.y-ground)*.14);this.shadow.scale.setScalar(s);this.shadow.material.opacity=.7*s;
 this.lantern.position.set(pos.x+this.facing*.4,pos.y+.9,pos.z+.1);this.lanternGlow.position.copy(this.lantern.position);this.lanternGlow.material.opacity=.16+Math.sin(this.clock*8)*.035;
 }
 dispose(){this.blendTexture.dispose();this.blendMaterial.dispose();this.texture.dispose();this.material.dispose();this.softTexture.dispose();this.shadow.geometry.dispose();this.shadow.material.dispose();this.lanternGlow.material.dispose();for(const o of [this.sprite,this.blendSprite,this.shadow,this.lantern,this.lanternGlow])o.parent?.remove(o);}
}
