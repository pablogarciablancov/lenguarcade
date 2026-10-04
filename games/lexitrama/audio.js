window.LexitramaAudio=(()=>{
  let ctx=null;let muted=false,volume=.18;
  function play(type){if(muted)return;try{ctx ||= new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume();const notes={correct:[440,660],error:[160,110],combo:[520,780,1040],win:[440,554,660,880],lose:[220,165,110],attack:[90,70],special:[700,950]}[type]||[440];notes.forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type==='attack'?'sawtooth':'sine';o.frequency.value=f;g.gain.setValueAtTime(0,ctx.currentTime+i*.09);g.gain.linearRampToValueAtTime(volume,ctx.currentTime+i*.09+.01);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+i*.09+.15);o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime+i*.09);o.stop(ctx.currentTime+i*.09+.16);});}catch{}}
  return {play,toggle(){muted=!muted;return muted;},setVolume(v){volume=Math.max(0,Math.min(.5,Number(v)));}};
})();
