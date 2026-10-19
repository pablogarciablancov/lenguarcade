(function(){
  'use strict';
  const game=window.game,R=GuardianRoutes;if(!game)return;
  const oldMove=Enemy.prototype.moveAlongPath,oldUpdate=Enemy.prototype.update,oldProgress=Enemy.prototype.progressScore;
  function ensureRoute(e){
    if(e.roadRoute||!e.game.roadRoutes?.length)return;
    // A shuffled bag guarantees that every alternative is used, without a fixed visible order.
    const g=e.game;if(!g.routeBag?.length)g.routeBag=shuffle(g.roadRoutes.map((_,i)=>i));
    e.routeId=g.routeBag.pop();e.roadRoute=g.roadRoutes[e.routeId];e.travel=0;
    const p=R.sample(e.roadRoute,0);e.x=p.x;e.y=p.y;e.roadEdge=p.edge;e.roadFraction=p.fraction;
  }
  Enemy.prototype.moveAlongPath=function(amount){
    ensureRoute(this);if(!this.roadRoute)return oldMove.call(this,amount);
    this.travel=Math.min(this.roadRoute.total,this.travel+Math.max(0,amount));
    const p=R.sample(this.roadRoute,this.travel);this.x=p.x;this.y=p.y;this.roadEdge=p.edge;this.roadFraction=p.fraction;
    this.pathIndex=p.index;this.pathProgress=p.fraction;
    if(this.travel>=this.roadRoute.total)this.reachLibrary();
  };
  Enemy.prototype.progressScore=function(){ensureRoute(this);return this.roadRoute?this.travel-this.roadRoute.total:oldProgress.call(this);};
  Enemy.prototype.update=function(dt){
    if(!this.game.roadRoutes?.length)return oldUpdate.call(this,dt);
    if(!this.alive)return;ensureRoute(this);
    if(!this.pixelAnimator)this.pixelAnimator=new Animator(SPRITE_DEFINITIONS.enemies[this.type],'walk');this.pixelAnimator.update(dt);
    const now=performance.now();if(now>this.slowUntil)this.slowFactor=1;if(now>this.weakenUntil)this.weakenFactor=1;
    let speed=this.baseSpeed*this.slowFactor;if(now<this.boostUntil)speed*=1.2;
    // Congestion only on a shared directed segment. Parallel branches never brake each other.
    const ahead=this.game.enemies.filter(e=>e!==this&&e.alive&&e.roadEdge===this.roadEdge&&e.x!==undefined&&e.roadFraction>this.roadFraction).sort((a,b)=>R.distance(this,a)-R.distance(this,b))[0];
    if(ahead){const gap=R.distance(this,ahead),safe=this.size+ahead.size+18;if(gap<=safe)speed=0;else if(gap<safe+20)speed*=Math.max(.25,(gap-safe)/20);}
    this.moveAlongPath(speed*dt);
  };
  // Guardian placement and restoration use every branch, including the second fork.
  const pathPoint=GuardianCore.pathPoint;
  GuardianCore.pathPoint=function(p,path,width,height){return game.roadRoutes?.length?R.project(p,game.roadRoutes,width,height):pathPoint(p,path,width,height);};
  const oldBase=TileMapRenderer.prototype.renderBase;
  function drawRoads(ctx,preset,pad){
    const edges=R.edges(preset),colors=preset.roadColors;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    for(const [width,color] of [[24,colors[0]],[21,colors[1]],[15,colors[2]]]){
      ctx.beginPath();for(const [a,b] of edges){ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);}ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();
    }
    for(const [a,b] of edges){
      const len=R.distance(a,b),dx=(b.x-a.x)/len,dy=(b.y-a.y)/len;
      for(let step=6;step<len;step+=11){const offset=(step%3-1)*4;ctx.fillStyle=step%2?colors[0]:colors[1];ctx.globalAlpha=.4;ctx.fillRect(Math.round(a.x+dx*step-dy*offset),Math.round(a.y+dy*step+dx*offset),2,1);}
    }
    ctx.globalAlpha=1;
    for(const p of preset.buildSites){
      if(pad?.naturalWidth){ctx.drawImage(pad,p.x-14,p.y-10,28,20);continue;}
      ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(p.x,p.y+4,14,7,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5d605a';ctx.strokeStyle='#404c48';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x-12,p.y-4);ctx.lineTo(p.x-7,p.y-10);ctx.lineTo(p.x+7,p.y-10);ctx.lineTo(p.x+12,p.y-4);ctx.lineTo(p.x+12,p.y+4);ctx.lineTo(p.x+6,p.y+9);ctx.lineTo(p.x-6,p.y+9);ctx.lineTo(p.x-12,p.y+4);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='#a8aba0';ctx.fillRect(p.x-7,p.y-5,14,9);ctx.fillStyle='#c2c2ad';ctx.fillRect(p.x-5,p.y-7,10,2);ctx.fillStyle='#787e73';ctx.fillRect(p.x-1,p.y-4,1,7);ctx.fillRect(p.x-6,p.y,12,1);
    }
    ctx.restore();
  }
  TileMapRenderer.prototype.renderBase=function(ctx){
    oldBase.call(this,ctx);const preset=this.preset;if(!preset?.branching)return;
    const pad=this.assets.get('branch_pad'),ready=!!pad?.naturalWidth;
    if(!this.branchGround||this.branchPadReady!==ready){this.branchPadReady=ready;this.branchGround=document.createElement('canvas');this.branchGround.width=PIXEL_ENGINE.width;this.branchGround.height=PIXEL_ENGINE.height;drawRoads(this.branchGround.getContext('2d'),preset,pad);}
    ctx.drawImage(this.branchGround,0,0);
  };
  const direction=PixelRenderer.prototype.enemyDirection;
  PixelRenderer.prototype.enemyDirection=function(e){
    if(!e.roadRoute)return direction.call(this,e);
    const next=e.roadRoute.points[Math.min(e.pathIndex+1,e.roadRoute.points.length-1)];return next.x<e.x;
  };
  const entrance=PixelRenderer.prototype.drawEntrance;
  PixelRenderer.prototype.drawEntrance=function(ctx){
    if(!this.game.mapPreset.branching)return entrance.call(this,ctx);
    const image=this.assets.get('branch_entrance');if(image?.naturalWidth)ctx.drawImage(image,-14,151,54,39);
  };
  const goal=PixelRenderer.prototype.drawGoal;
  PixelRenderer.prototype.drawGoal=function(ctx,item){
    if(!this.game.mapPreset.branching)return goal.call(this,ctx,item);
    const image=this.assets.get('branch_library');if(image?.naturalWidth)ctx.drawImage(image,item.x-41,item.y-102,82,102);
  };
  // Short battlefield labels; full contextual sentence always remains in the question window.
  const showQuestion=UIManager.prototype.showQuestion;
  UIManager.prototype.showQuestion=function(enemy){if(this.questionCard.parentElement!==document.body)document.body.appendChild(this.questionCard);const out=showQuestion.call(this,enemy);this.qEnemyWord.textContent=enemy.question.display;return out;};
  // Eight maps fit as two rows on classroom screens; each new preview shows its actual roads.
  const previewCache={},previewImages={};
  function loadPreviewImage(src){
    if(!previewImages[src])previewImages[src]=new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=src;});
    return previewImages[src];
  }
  function preview(preset){
    if(previewCache[preset.key])return previewCache[preset.key];
    previewCache[preset.key]=Promise.all([preset.preview,EMBEDDED_PIXEL_ASSETS.branch_library,EMBEDDED_PIXEL_ASSETS.branch_entrance,EMBEDDED_PIXEL_ASSETS.branch_pad].map(loadPreviewImage)).then(([image,library,entry,pad])=>{
      if(!image)return null;
      const c=document.createElement('canvas');c.width=560;c.height=360;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(image,0,0,560,360);drawRoads(x,preset,pad);
      if(library)x.drawImage(library,473,90,82,102);if(entry)x.drawImage(entry,-14,151,54,39);
      return c.toDataURL('image/webp');
    });return previewCache[preset.key];
  }
  for(const selector of ['#startMapGrid .start-map-card','#mapGrid .map-card']){
    document.querySelectorAll(selector).forEach((card,i)=>{
      const preset=Object.values(MAP_PRESETS)[i];if(!preset?.branching)return;
      const tag=document.createElement('em');tag.className='branch-map-tag';tag.textContent=`${preset.routes.length} rutas · ${preset.difficulty}`;card.appendChild(tag);
      preview(preset).then(src=>{if(src)card.style.backgroundImage=`url(${src})`;});
    });
  }
  if(game.mapPreset.branching){
    const brief=document.createElement('div');brief.className='branch-brief';brief.textContent=`${game.mapPreset.routes.length} rutas posibles · Los monstruos eligen camino`;
    document.getElementById('mapShell').appendChild(brief);
  }
})();
