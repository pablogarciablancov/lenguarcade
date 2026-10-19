/* Exact road geometry is shared by movement, targeting, map art and guardian placement. */
(function(root){
  'use strict';
  const pt=arr=>arr.map(([x,y])=>({x,y}));
  const start=[[-30,180],[50,180],[100,180]],end=[[430,180],[478,180],[510,180]];
  const join=(...parts)=>pt(parts.flat().filter((p,i,a)=>!i||p[0]!==a[i-1][0]||p[1]!==a[i-1][1]));
  const maps={
    bosque_bifurcado:{name:'Bosque de las Dos Sendas',subtitle:'Dos flancos y un último punto de reunión',terrain:'bosque-bifurcado',difficulty:'Intermedio',questionTier:2,
      routes:[join(start,[[155,125],[250,113],[345,130]],end),join(start,[[145,254],[245,282],[350,250]],end)],
      buildSites:pt([[64,145],[109,110],[200,92],[280,55],[346,162],[158,211],[257,247],[360,205],[460,141],[472,215]])},
    marisma:{name:'Marisma de los Tres Cauces',subtitle:'Tres corredores: el central es más corto',terrain:'marisma',difficulty:'Difícil',questionTier:2,
      routes:[join(start,[[132,98],[230,80],[340,92],[400,126]],end),join(start,[[175,187],[244,164],[325,185]],end),join(start,[[133,264],[240,292],[344,272],[399,238]],end)],
      buildSites:pt([[62,144],[159,122],[271,112],[365,138],[182,153],[282,211],[145,220],[226,255],[357,232],[458,141],[480,214]])},
    cumbres:{name:'Cumbres del Archivo Helado',subtitle:'Tres pasos separados y pocas zonas de cobertura común',terrain:'cumbres',difficulty:'Muy difícil',questionTier:3,
      routes:[join(start,[[117,87],[197,76],[215,122],[315,117],[335,79],[402,92]],end),join(start,[[161,199],[200,166],[280,177],[322,207],[394,191]],end),join(start,[[124,269],[209,292],[264,260],[315,289],[403,267]],end)],
      buildSites:pt([[60,144],[150,113],[247,93],[358,111],[164,160],[275,212],[370,167],[166,250],[278,300],[367,240],[463,142],[480,216]])},
    caldera:{name:'Caldera de las Encrucijadas',subtitle:'Dos bifurcaciones sucesivas · cuatro combinaciones',terrain:'caldera',difficulty:'Experto',questionTier:3,
      routes:[],buildSites:pt([[52,143],[149,153],[149,227],[193,162],[279,146],[307,105],[307,251],[387,155],[393,215],[470,145]])}
  };
  const left=[[[130,126],[196,126],[252,180]],[[129,254],[197,257],[252,180]]];
  const right=[[[302,180],[337,128],[399,128],[446,180]],[[302,180],[339,253],[400,256],[446,180]]];
  for(const a of left)for(const b of right)maps.caldera.routes.push(join(start,a,b,[[478,180],[510,180]]));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const key=(a,b)=>[a.x,a.y,b.x,b.y].join(',');
  function compile(points){
    const lengths=[],offsets=[0];let total=0;
    for(let i=0;i<points.length-1;i++){const n=distance(points[i],points[i+1]);lengths.push(n);total+=n;offsets.push(total);}
    return {points,lengths,offsets,total};
  }
  function sample(route,travel){
    const t=Math.max(0,Math.min(route.total,travel));let i=0;
    while(i<route.lengths.length-1&&t>=route.offsets[i+1])i++;
    const a=route.points[i],b=route.points[i+1],f=route.lengths[i]?(t-route.offsets[i])/route.lengths[i]:0;
    return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,index:i,fraction:f,edge:key(a,b)};
  }
  function project(p,routes,width=560,height=360){
    let best=null;
    for(const route of routes)for(let i=0;i<route.points.length-1;i++){
      const a=route.points[i],b=route.points[i+1],dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;
      const t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0,q={x:a.x+dx*t,y:a.y+dy*t};
      if(q.x<12||q.x>width-12||q.y<18||q.y>height-10)continue;
      const d=distance(p,q);if(!best||d<best.distance)best={...q,distance:d};
    }
    return best&&best.distance<=15?best:null;
  }
  function edges(preset){const seen=new Set(),out=[];for(const points of preset.routes)for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1],id=key(a,b);if(!seen.has(id)){seen.add(id);out.push([a,b]);}}return out;}
  function install(presets,assets){
    assets.branch_library="assets/maps/library-cutout.webp";assets.branch_entrance="assets/maps/entrance-cutout.webp";assets.branch_pad="assets/maps/stone-platform.webp";
    for(const [id,cfg] of Object.entries(maps)){
      presets[id]={...cfg,key:id,asset:'map_'+id,useBackground:true,bakedGoal:false,bakedEntrance:true,branching:true,exactPath:true,goal:{x:514,y:192},controlPath:cfg.routes[0],path:cfg.routes[0],roadColors:id==='cumbres'?['#596e81','#b5c7d3','#d8e7ed']:id==='caldera'?['#342d42','#84737c','#aa969a']:['#74603c','#cfb177','#e3c58c']};
      assets['map_'+id]='assets/maps/'+cfg.terrain+'.webp';presets[id].preview='assets/maps/'+cfg.terrain+'-thumb.webp';
    }
  }
  root.GuardianRoutes={maps,compile,sample,project,edges,install,distance};
  if(typeof module!=='undefined')module.exports=root.GuardianRoutes;
})(typeof globalThis!=='undefined'?globalThis:this);
