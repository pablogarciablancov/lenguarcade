export class Audio{
 constructor(){this.ctx=null;this.volume=.3;this.musicClock=0;this.music=true;}
 unlock(){if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);}this.master.gain.value=this.volume;this.ctx.resume().catch(()=>{});}
 setVolume(value){this.volume=value;if(this.master)this.master.gain.setTargetAtTime(value,this.ctx.currentTime,.1);}
 note(freq,duration=.2,type='sine',gain=.15,delay=0){if(!this.ctx||this.ctx.state!=='running')return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.1);}
 play(name){const sounds={jump:[260,390],land:[120],correct:[523,659],fall:[180,110,55],reveal:[440,660,880],win:[392,523,659,784],buy:[659,880]};(sounds[name]||[330]).forEach((v,i)=>this.note(v,name==='fall'?.5:.22,name==='land'?'triangle':'sine',.22,i*.09));}
 update(dt){if(!this.music||!this.ctx||this.ctx.state!=='running')return;this.musicClock-=dt;if(this.musicClock<=0){this.musicClock=3.2;const tones=[130.81,164.81,196,261.63];const n=tones[Math.floor(this.ctx.currentTime/3.2)%4];this.note(n,4,'sine',.08);this.note(n*2,3,'triangle',.024,.6);this.note(n*3,2,'sine',.025,1.2);}}
 dispose(){this.ctx?.close();}
}
