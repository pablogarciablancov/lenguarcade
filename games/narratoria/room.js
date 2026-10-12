/* Habitación de Plumín. Las posiciones se guardan como porcentajes del escenario. */
const ROOM_ITEMS = [
    {id:'room_window', name:'Ventana del bosque', kind:'window', cost:0, x:48,y:8,w:17,h:31},
    {id:'room_books', name:'Biblioteca de cuentos', kind:'bookcase', cost:0, x:5,y:25,w:20,h:60},
    {id:'room_rug', name:'Alfombra del escriba', kind:'rug', cost:0, x:35,y:78,w:43,h:17},
    {id:'room_landscape', name:'Cuadro del bosque', kind:'picture', cost:4, x:72,y:15,w:19,h:25},
    {id:'room_stars', name:'Mapa de las estrellas', kind:'stars', cost:6, x:27,y:10,w:17,h:26},
    {id:'room_sofa', name:'Sillón de lectura', kind:'sofa', cost:8, x:72,y:58,w:24,h:30},
    {id:'room_clock', name:'Reloj del Gremio', kind:'clock', cost:3, x:30,y:12,w:12,h:22},
    {id:'room_plant', name:'Planta de las ideas', kind:'plant', cost:5, x:80,y:62,w:13,h:25},
    {id:'room_lamp', name:'Lámpara de sobremesa', kind:'lamp', cost:3, x:29,y:42,w:12,h:28},
    {id:'room_globe', name:'Globo de aventuras', kind:'globe', cost:7, x:72,y:45,w:15,h:28},
    {id:'wall_paper', name:'Papel cálido', kind:'wall', color:'#ead9b6',cost:0},
    {id:'wall_sage', name:'Verde salvia', kind:'wall', color:'#bfd0bc',cost:4},
    {id:'wall_night', name:'Azul de biblioteca', kind:'wall', color:'#8499af',cost:6},
    {id:'wall_rose', name:'Arcilla suave', kind:'wall', color:'#d5aaa0',cost:4},
    {id:'floor_oak', name:'Roble',kind:'floor',color:'#b48b60',cost:0},
    {id:'floor_dark', name:'Nogal',kind:'floor',color:'#79604c',cost:5},
    {id:'floor_light', name:'Abedul',kind:'floor',color:'#dcc39b',cost:4}
];
const ROOM_LEGACY = {bookcase:[5,25,20,60],lamp:[29,42,12,28],plant:[80,62,13,25],rug:[35,78,43,17],desk:[32,63,35,25],window:[48,8,17,31]};
function normalizeRoom(raw, equipped = {}, legacyOwned = []) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const included = ROOM_ITEMS.filter(item=>item.cost===0).map(item=>item.id);
    const owned = [...new Set([...included,...(Array.isArray(source.owned)?source.owned:[])])].filter(id=>ROOM_ITEMS.some(item=>item.id===id));
    const defaults = ROOM_ITEMS.filter(item=>item.cost===0 && item.w).map(item=>({id:item.id,x:item.x,y:item.y,w:item.w,h:item.h}));
    const legacy = Object.entries(ROOM_LEGACY).filter(([slot])=>equipped[slot]).map(([slot,p])=>({id:equipped[slot],x:p[0],y:p[1],w:p[2],h:p[3]}));
    const placements = Array.isArray(source.placements)?source.placements:[...defaults.filter(p=>!legacy.some(l=>l.id===`home_${ROOM_ITEMS.find(i=>i.id===p.id).kind}` || ROOM_ITEMS.find(i=>i.id===p.id).kind==='bookcase' && l.id==='home_bookcase')),...legacy];
    const used = new Set();
    const finite = (n,fallback)=>Number.isFinite(Number(n))?Number(n):fallback;
    return {edited:!!source.edited, owned,
        wall:owned.includes(source.wall)&&ROOM_ITEMS.some(i=>i.id===source.wall&&i.kind==='wall')?source.wall:'wall_paper',
        floor:owned.includes(source.floor)&&ROOM_ITEMS.some(i=>i.id===source.floor&&i.kind==='floor')?source.floor:'floor_oak',
        placements:placements.filter(p=>p && !used.has(p.id) && (owned.includes(p.id)&&ROOM_ITEMS.some(i=>i.id===p.id&&i.w) || legacyOwned.includes(p.id)&&p.id.startsWith('home_')) && used.add(p.id))
            .slice(0,30).map(p=>{const w=Math.min(50,Math.max(8,finite(p.w,18))),h=Math.min(65,Math.max(10,finite(p.h,25)));return {id:p.id,w,h,x:Math.min(100-w,Math.max(0,finite(p.x,10))),y:Math.min(100-h,Math.max(0,finite(p.y,20)))};})};
}
function roomArt(kind) {
    const arts={
        bookcase:'<rect x="10" y="4" width="80" height="91" rx="3" fill="#896443"/><rect x="17" y="11" width="66" height="76" fill="#49392e"/><path d="M14 36h72M14 62h72M14 88h72" stroke="#c09460" stroke-width="5"/><path d="M24 16v16m12-17v17m12-20v20m14-16v16m12-18v18M24 43v15m12-16v16m14-18v18m14-15v15m12-16v16M25 69v14m13-16v16m13-14v14m14-17v17m12-14v14" stroke="#a9b79a" stroke-width="8"/><path d="M35 17v14m27 14v12m-24 14v11" stroke="#d99b69" stroke-width="7"/>',
        window:'<path d="M12 94V40a38 38 0 0 1 76 0v54z" fill="#7e6144"/><path d="M19 87V40a31 31 0 0 1 62 0v47z" fill="#b8d6df"/><path d="m19 74 20-30 19 29 11-20 12 25v9H19z" fill="#748e6b"/><path d="M50 9v79M17 48h67" stroke="#7e6144" stroke-width="5"/>',
        rug:'<ellipse cx="50" cy="50" rx="48" ry="32" fill="#69887b"/><ellipse cx="50" cy="50" rx="40" ry="24" fill="none" stroke="#d8c499" stroke-width="4"/><path d="m50 31 16 19-16 19-16-19z" fill="#c9af7b"/>',
        picture:'<rect x="3" y="9" width="94" height="80" rx="2" fill="#957047"/><rect x="10" y="16" width="80" height="66" fill="#ede4c7"/><rect x="15" y="21" width="70" height="56" fill="#b8d1cb"/><circle cx="66" cy="35" r="8" fill="#f4d896"/><path d="m15 66 18-27 20 25 13-18 19 26v5H15z" fill="#5c7e62"/>',
        stars:'<rect x="8" y="5" width="84" height="90" fill="#ad8a54"/><rect x="14" y="11" width="72" height="78" fill="#344762"/><path d="m25 30 24 16 23-19-12 44-30-3z" fill="none" stroke="#d4bf8f"/><g fill="#f6df9f"><circle cx="25" cy="30" r="3"/><circle cx="49" cy="46" r="4"/><circle cx="72" cy="27" r="3"/><circle cx="60" cy="71" r="3"/><circle cx="30" cy="68" r="3"/></g>',
        sofa:'<rect x="15" y="13" width="70" height="63" rx="20" fill="#829a89"/><rect x="7" y="49" width="86" height="38" rx="12" fill="#526d61"/><rect x="22" y="53" width="56" height="25" rx="9" fill="#a9b59a"/><path d="M18 87v8m64-8v8" stroke="#69523c" stroke-width="7"/><rect x="40" y="24" width="27" height="26" rx="5" fill="#d1ad77" transform="rotate(8 53 37)"/>',
        clock:'<circle cx="50" cy="48" r="39" fill="#896747"/><circle cx="50" cy="48" r="31" fill="#f5e8c7"/><path d="M50 23v25l17 10M50 20v3m0 50v3M22 48h4m48 0h4" fill="none" stroke="#604b38" stroke-width="3"/>',
        plant:'<path d="M50 72V25" stroke="#58704d" stroke-width="4"/><path d="M50 47Q10 43 17 16q34 0 33 31M50 58q39 0 33-32Q52 25 50 58M50 33Q35 9 55 2q17 14-5 31" fill="#7b9b66"/><path d="m27 64 7 30h32l7-30z" fill="#ba805e"/><path d="M25 65h50" stroke="#e0ad80" stroke-width="6"/>',
        lamp:'<path d="M50 35v51M25 89h50" stroke="#806442" stroke-width="7"/><path d="m30 7-16 39h72L70 7z" fill="#eac98b"/><path d="M14 46h72" stroke="#967046" stroke-width="4"/>',
        globe:'<circle cx="48" cy="37" r="29" fill="#9fbfbd"/><path d="m32 13 15 9-8 13 13 10-3 15-18-7-9-24zM60 15l13 17-10 16-9-17z" fill="#718d66"/><path d="M71 7a38 38 0 0 1-47 63M48 72v17M28 92h40" fill="none" stroke="#987749" stroke-width="5"/>',
        desk:'<path d="M7 46h86v12H7zM17 58v36m66-36v36" fill="#997044" stroke="#6c4e33" stroke-width="5"/><path d="M36 43V28h32v15" fill="#f9eccd" stroke="#7a7056" stroke-width="2"/>'
    };
    return `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${arts[kind]||arts.picture}</svg>`;
}
const room = {
    category:'objects', selected:null,
    item(id){return ROOM_ITEMS.find(i=>i.id===id)||OWL_SHOP_ITEMS.find(i=>i.id===id);},
    save(){state.owl.room.edited=true;storage.save();ui.renderOwl();if(document.getElementById('room-editor')?.open)this.render();},
    placeLegacy(item){const p=ROOM_LEGACY[item.slot];if(!p)return;state.owl.room.placements=state.owl.room.placements.filter(v=>this.item(v.id)?.slot!==item.slot);state.owl.room.placements.push({id:item.id,x:p[0],y:p[1],w:p[2],h:p[3]});state.owl.room.edited=true;},
    markup(){return state.owl.room.placements.map(p=>{const item=this.item(p.id);return `<button type="button" class="room-object ${this.selected===p.id?'selected':''}" data-room-id="${p.id}" aria-label="${escapeHTML(item.name)}" title="${escapeHTML(item.name)}" style="left:${p.x}%;top:${p.y}%;width:${p.w}%;height:${p.h}%">${roomArt(item.kind||item.slot)}</button>`;}).join('');},
    paint(habitat){const r=state.owl.room;habitat.classList.add('plumin-room');habitat.style.setProperty('--room-wall',this.item(r.wall).color);habitat.style.setProperty('--room-floor',this.item(r.floor).color);habitat.querySelector('.home-furnishing').innerHTML=this.markup();},
    renderHabitats(){document.querySelectorAll('.owl-habitat').forEach(h=>this.paint(h));},
    open(){
        state.owl=normalizeOwlState(state.owl);
        let dialog=document.getElementById('room-editor');
        if(!dialog){dialog=document.createElement('dialog');dialog.id='room-editor';dialog.innerHTML=`<div class="room-editor-heading"><div><h2>La habitación de Plumín</h2><p>Arrastra los objetos. Selecciónalos para ajustar su tamaño o guardarlos.</p></div><button class="owl-greet" onclick="document.getElementById('room-editor').close()">Volver a escribir</button></div><div class="room-editor-layout"><div><div class="owl-habitat room-canvas" id="room-canvas"><div class="home-furnishing"></div><div class="room-resident">${roomArt('desk')}<img src="assets/plumin-poses-v3/pose-04.webp" alt="Plumín en su escritorio" draggable="false"></div></div><div id="room-selection" class="room-selection"></div><p class="room-save-note" aria-live="polite">Cada cambio se guarda automáticamente · 🪶 <span id="room-coins"></span> plumillas</p></div><aside class="room-catalog"><nav aria-label="Decoración"><button class="owl-greet" data-category="objects">Objetos</button><button class="owl-greet" data-category="wall">Paredes</button><button class="owl-greet" data-category="floor">Suelos</button></nav><div id="room-catalog-items"></div></aside></div>`;document.body.append(dialog);
            dialog.querySelectorAll('[data-category]').forEach(b=>b.onclick=()=>{this.category=b.dataset.category;this.render();});
            const canvas=dialog.querySelector('.room-canvas');
            canvas.addEventListener('pointerdown',e=>this.drag(e));
            canvas.addEventListener('keydown',e=>this.moveKey(e));
            dialog.addEventListener('close',()=>{this.selected=null;ui.renderOwl();});
        }
        this.render();dialog.showModal();
    },
    render(){
        this.paint(document.getElementById('room-canvas'));
        document.getElementById('room-coins').textContent=state.owl.coins;
        document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===this.category)));
        const placed=id=>state.owl.room.placements.some(p=>p.id===id);
        const items=this.category==='objects'?[...ROOM_ITEMS.filter(i=>i.w),...OWL_SHOP_ITEMS.filter(i=>i.currency==='plumillas')]:ROOM_ITEMS.filter(i=>i.kind===this.category);
        document.getElementById('room-catalog-items').innerHTML=items.map(i=>{const owned=state.owl.room.owned.includes(i.id)||state.owl.owned.includes(i.id);const active=placed(i.id)||state.owl.room[i.kind]===i.id;return `<button class="room-catalog-item" onclick="room.use('${i.id}')" ${active||!owned&&state.owl.coins<i.cost?'disabled':''}><span class="room-item-art" ${i.color?`style="background:${i.color}"`:''}>${i.color?'':roomArt(i.kind||i.slot)}</span><span><strong>${escapeHTML(i.name)}</strong><small>${active?'Colocado':owned?'Colocar':`Comprar · ${i.cost} 🪶`}</small></span></button>`;}).join('');
        const p=state.owl.room.placements.find(p=>p.id===this.selected);
        document.getElementById('room-selection').innerHTML=p?`<strong>${escapeHTML(this.item(p.id).name)}</strong><button class="owl-greet" onclick="room.resize(-1)" aria-label="Reducir tamaño">−</button><button class="owl-greet" onclick="room.resize(1)" aria-label="Aumentar tamaño">+</button><button class="owl-greet" onclick="room.remove()">Guardar objeto</button>`:'Selecciona un objeto · También puedes moverlo con las flechas del teclado.';
    },
    use(id){state.owl=normalizeOwlState(state.owl);const i=this.item(id);if(!i)return;const legacy=id.startsWith('home_');const owned=legacy?state.owl.owned:state.owl.room.owned;if(!owned.includes(id)){if(state.owl.coins<i.cost)return;state.owl.coins-=i.cost;owned.push(id);if(legacy)state.owl.equipped[i.slot]=id;}
        if(i.kind==='wall'||i.kind==='floor')state.owl.room[i.kind]=id;
        else if(!state.owl.room.placements.some(p=>p.id===id)){const v=i.w?[i.x,i.y,i.w,i.h]:ROOM_LEGACY[i.slot];state.owl.room.placements.push({id,x:v[0],y:v[1],w:v[2],h:v[3]});this.selected=id;}
        this.save();ui.renderOwlShop();
    },
    remove(){state.owl.room.placements=state.owl.room.placements.filter(p=>p.id!==this.selected);this.selected=null;this.save();},
    resize(delta){const p=state.owl.room.placements.find(p=>p.id===this.selected);if(!p)return;const factor=delta>0?1.1:1/1.1;p.w=Math.min(50,Math.max(8,p.w*factor));p.h=Math.min(65,Math.max(10,p.h*factor));p.x=Math.min(p.x,100-p.w);p.y=Math.min(p.y,100-p.h);this.save();},
    moveKey(e){const b=e.target.closest('[data-room-id]');const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!b)return;this.selected=b.dataset.roomId;if(!d){if(e.key==='Enter'||e.key===' '){e.preventDefault();this.render();}return;}e.preventDefault();const p=state.owl.room.placements.find(p=>p.id===this.selected);p.x=Math.max(0,Math.min(100-p.w,p.x+d[0]*2));p.y=Math.max(0,Math.min(100-p.h,p.y+d[1]*2));this.save();document.querySelector(`#room-canvas [data-room-id="${p.id}"]`).focus();},
    drag(e){const b=e.target.closest('[data-room-id]');if(!b||e.button!==0)return;e.preventDefault();this.selected=b.dataset.roomId;const p=state.owl.room.placements.find(p=>p.id===this.selected);const bounds=b.parentElement.getBoundingClientRect();const start={x:e.clientX,y:e.clientY,px:p.x,py:p.y};b.setPointerCapture(e.pointerId);b.classList.add('selected');
        const move=ev=>{p.x=Math.max(0,Math.min(100-p.w,start.px+(ev.clientX-start.x)/bounds.width*100));p.y=Math.max(0,Math.min(100-p.h,start.py+(ev.clientY-start.y)/bounds.height*100));b.style.left=p.x+'%';b.style.top=p.y+'%';};
        const finish=()=>{b.removeEventListener('pointermove',move);b.removeEventListener('pointerup',finish);b.removeEventListener('pointercancel',finish);this.save();};b.addEventListener('pointermove',move);b.addEventListener('pointerup',finish);b.addEventListener('pointercancel',finish);
    }
};
