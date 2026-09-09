(() => {
  'use strict';

  const PREFIX = 'rpg_slot_';
  const SLOT_COUNT = 3;
  const PERSISTENT_MODES = ['adventure','survival','dominio','strategy'];
  const MODE_LABELS = {
    adventure:'Aventura',
    survival:'Supervivencia',
    dominio:'Dominio',
    strategy:'Estrategia',
    practice:'Práctica'
  };
  const BACKUP_KEY = 'battlegrafia_v2_save_slots_backup_v1_adventure';
  const MODE_BACKUP_KEY = mode => 'battlegrafia_v2_save_slots_backup_v2_last_' + mode;
  const WORLDS = [
    'Montañas de Lexikon',
    'Castillo de Paper',
    'Ciénaga de Torvax',
    'Acantilados de Sintaxion',
    'Volcán de Don Pablo'
  ];
  const HERO_SPRITES = {
    mago:'https://cdn.jsdelivr.net/gh/pablogarciablancov/BATTLEGRAFIA-FINAL@main/img/heros/sprite_hero_mago.webp',
    guerrero:'https://cdn.jsdelivr.net/gh/pablogarciablancov/BATTLEGRAFIA-FINAL@main/img/heros/sprite_hero_guerrero.webp',
    ninja:'https://cdn.jsdelivr.net/gh/pablogarciablancov/BATTLEGRAFIA-FINAL@main/img/heros/sprite_hero_ninja.webp',
    robot:'https://cdn.jsdelivr.net/gh/pablogarciablancov/BATTLEGRAFIA-FINAL@main/img/heros/sprite_hero_robot.webp'
  };

  const safeParse = (value, fallback) => {
    try { return value ? JSON.parse(value) : fallback; } catch (error) { return fallback; }
  };
  const modeKey = mode => 'battlegrafia_v2_save_slots_v1_' + mode;
  const activeKey = mode => 'battlegrafia_v2_active_slot_v1_' + mode;
  const legacyKey = mode => 'battlegrafia_v2_player_pixel_historia_v6_' + mode;
  const slotId = index => PREFIX + index;
  const isEmbedded = () => !!window.__LENGUARCADE_EMBEDDED;
  let pendingNewSlotId = null;
  let pendingNewMode = null;

  function rawSlots(mode='adventure') {
    const slots = safeParse(localStorage.getItem(modeKey(mode)), []);
    return Array.isArray(slots) ? slots.filter(Boolean) : [];
  }

  function writeRawSlots(mode, slots) {
    localStorage.setItem(modeKey(mode), JSON.stringify(slots || []));
    window.dispatchEvent(new CustomEvent('bg2:slots-changed', { detail:{ mode } }));
  }

  function normalizeAdventureSlots() {
    if (isEmbedded()) return;
    const original = rawSlots('adventure');
    if (!original.length) return;

    const stable = original.filter(slot => /^rpg_slot_[123]$/.test(String(slot.id || '')));
    const legacy = original
      .filter(slot => !/^rpg_slot_[123]$/.test(String(slot.id || '')))
      .sort((a,b)=>(Number(b.updatedAt)||0)-(Number(a.updatedAt)||0));

    if (!legacy.length && stable.length <= SLOT_COUNT) return;

    try {
      if (!localStorage.getItem(BACKUP_KEY)) {
        localStorage.setItem(BACKUP_KEY, JSON.stringify(original));
      }
    } catch (error) {}

    const byIndex = new Map();
    stable.forEach(slot => {
      const index = Number(String(slot.id).replace(PREFIX,''));
      if (index >= 1 && index <= SLOT_COUNT) byIndex.set(index, slot);
    });

    for (let index=1; index<=SLOT_COUNT; index+=1) {
      if (byIndex.has(index)) continue;
      const source = legacy.shift();
      if (!source) break;
      byIndex.set(index, {...source, id:slotId(index), migratedFrom:source.id || null});
    }

    const normalized = [...byIndex.entries()]
      .sort((a,b)=>a[0]-b[0])
      .map(([,slot])=>slot);

    const oldActive = localStorage.getItem(activeKey('adventure'));
    const oldPos = original.findIndex(slot => slot && slot.id === oldActive);
    writeRawSlots('adventure', normalized);
    if (oldPos >= 0 && oldPos < SLOT_COUNT) {
      localStorage.setItem(activeKey('adventure'), slotId(oldPos + 1));
    } else if (!normalized.some(slot => slot.id === oldActive)) {
      localStorage.removeItem(activeKey('adventure'));
    }
  }

  function getSlot(index, mode='adventure') {
    const id = slotId(index);
    return rawSlots(mode).find(slot => slot && slot.id === id) || null;
  }

  function all(mode='adventure') {
    return Array.from({length:SLOT_COUNT}, (_,i) => getSlot(i+1, mode));
  }

  function progressMeta(slot, index) {
    if (!slot || !slot.data) {
      return {
        index, empty:true, id:slotId(index), name:'Ranura vacía',
        level:1, gold:0, world:'Sin comenzar', stage:'—', progress:0,
        updatedAt:null, avatarId:'mago', sprite:HERO_SPRITES.mago
      };
    }
    const data = slot.data || {};
    const defeated = Array.isArray(data.defeatedMonsters)
      ? data.defeatedMonsters.length
      : Number(data.monstersDefeated || 0);
    const worldIndex = Math.min(4, Math.max(0, Math.floor(defeated / 6)));
    const inWorld = Math.min(6, Math.max(0, defeated - worldIndex * 6));
    const progress = Math.max(0, Math.min(100, Math.round((defeated / 30) * 100)));
    const avatarId = HERO_SPRITES[data.avatarId] ? data.avatarId : 'mago';
    return {
      index,
      empty:false,
      id:slot.id,
      name:data.name || slot.name || 'Aventurero',
      level:Number(data.level || 1),
      gold:Number(data.gold || 0),
      world:WORLDS[worldIndex],
      stage:(inWorld >= 5 ? 'Jefe' : (inWorld + 1) + ' / 6 guardianes'),
      progress,
      updatedAt:Number(slot.updatedAt || 0) || null,
      avatarId,
      sprite:HERO_SPRITES[avatarId]
    };
  }

  function meta(mode='adventure') {
    return all(mode).map((slot,index)=>progressMeta(slot,index+1));
  }

  function setActive(index, mode='adventure') {
    localStorage.setItem('bg_modeId', mode);
    localStorage.setItem(activeKey(mode), slotId(index));
  }

  function erase(index, mode='adventure') {
    const id = slotId(index);
    const slots = rawSlots(mode).filter(slot => slot && slot.id !== id);
    writeRawSlots(mode, slots);
    if (localStorage.getItem(activeKey(mode)) === id) {
      localStorage.removeItem(activeKey(mode));
      localStorage.removeItem(legacyKey(mode));
    }
  }

  function prepareNew(index, mode='adventure') {
    const id = slotId(index);
    setActive(index, mode);
    erase(index, mode);
    setActive(index, mode);
    pendingNewSlotId = id;
    try { localStorage.removeItem(legacyKey(mode)); } catch (error) {}
    return id;
  }

  function touchName(index, name, mode='adventure') {
    const slots = rawSlots(mode);
    const id = slotId(index);
    const found = slots.find(slot => slot && slot.id === id);
    if (!found) return;
    found.name = String(name || found.name || 'Partida').slice(0,30);
    found.updatedAt = Date.now();
    writeRawSlots(mode, slots);
  }

  function getModeSave(mode='adventure') {
    const slots = rawSlots(mode)
      .filter(slot => slot && slot.data)
      .sort((a,b)=>(Number(b.updatedAt)||0)-(Number(a.updatedAt)||0));
    if (!slots.length) return null;

    const active = localStorage.getItem(activeKey(mode));
    const selected = slots.find(slot => slot.id === active) || slots[0];
    return selected || null;
  }

  function modeSummary(mode='adventure') {
    const slot = getModeSave(mode);
    const base = progressMeta(slot, 1);
    const data = slot?.data || {};
    const defeated = Array.isArray(data.defeatedMonsters) ? data.defeatedMonsters.length : Number(data.monstersDefeated || 0);
    const state = data.__runState || {};

    const summary = {
      ...base,
      mode,
      modeLabel:MODE_LABELS[mode] || mode,
      saved:!!(slot && slot.data),
      slotId:slot?.id || null
    };

    if(!summary.saved) return summary;

    if(mode === 'survival'){
      summary.world = 'Supervivencia · ' + defeated + ' criaturas superadas';
      summary.stage = 'Ronda ' + Math.max(1, defeated + 1);
    }else if(mode === 'dominio'){
      const streak = Math.max(0, Number(state.perfectStreak || 0));
      summary.world = 'Racha perfecta ' + streak + ' / 5';
      summary.stage = 'Dominio';
      summary.progress = Math.min(100, Math.round((streak / 5) * 100));
    }else if(mode === 'strategy'){
      const ids = Array.isArray(state.strategyMonsterIds)
        ? state.strategyMonsterIds
        : (Array.isArray(state.strategyConfig?.monsterIds) ? state.strategyConfig.monsterIds : []);
      const total = ids.length;
      const completed = total ? Math.min(total, defeated) : 0;
      summary.world = total ? ('Reto de ' + total + ' criaturas') : 'Reto sin configurar';
      summary.stage = Number(state.endsAt || 0) > Date.now() ? 'En curso' : 'Preparado';
      summary.progress = total ? Math.round((completed / total) * 100) : 0;
    }

    return summary;
  }

  function activateMode(mode='adventure') {
    const slot = getModeSave(mode);
    localStorage.setItem('bg_modeId', mode);
    if (!slot) {
      localStorage.removeItem(activeKey(mode));
      return null;
    }
    localStorage.setItem(activeKey(mode), slot.id);
    return slot;
  }

  function backupMode(mode='adventure') {
    try {
      const slots = rawSlots(mode);
      const legacy = localStorage.getItem(legacyKey(mode));
      if (!slots.length && !legacy) return;
      localStorage.setItem(MODE_BACKUP_KEY(mode), JSON.stringify({
        savedAt:Date.now(),
        slots,
        active:localStorage.getItem(activeKey(mode)) || null,
        legacy:legacy ? safeParse(legacy, null) : null
      }));
    } catch (error) {}
  }

  function clearMode(mode='adventure') {
    if (!PERSISTENT_MODES.includes(mode)) return;
    backupMode(mode);
    localStorage.removeItem(modeKey(mode));
    localStorage.removeItem(activeKey(mode));
    localStorage.removeItem(legacyKey(mode));
    window.dispatchEvent(new CustomEvent('bg2:slots-changed', { detail:{ mode } }));
  }

  function prepareModeNew(mode='adventure') {
    if (!PERSISTENT_MODES.includes(mode)) return null;
    clearMode(mode);
    localStorage.setItem('bg_modeId', mode);
    const id = slotId(1);
    localStorage.setItem(activeKey(mode), id);
    pendingNewSlotId = id;
    pendingNewMode = mode;
    return id;
  }

  function formatDate(value) {
    if (!value) return '—';
    try {
      return new Intl.DateTimeFormat('es-ES', {
        day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'
      }).format(new Date(value));
    } catch (error) { return '—'; }
  }

  normalizeAdventureSlots();

  /* El motor clásico crea IDs aleatorios al iniciar partida. En v2 respetamos
     la ranura elegida sin tocar su lógica interna. */
  try {
    const originalMakeSlotId = typeof window.makeSlotId === 'function' ? window.makeSlotId : null;
    window.makeSlotId = function(){
      const selectedMode = localStorage.getItem('bg_modeId') || 'adventure';
      if (pendingNewSlotId && (!pendingNewMode || pendingNewMode === selectedMode)) {
        const id = pendingNewSlotId;
        pendingNewSlotId = null;
        pendingNewMode = null;
        return id;
      }
      return originalMakeSlotId ? originalMakeSlotId.apply(this, arguments) : ('slot_' + Date.now());
    };
  } catch (error) {}

  window.BG2Slots = {
    SLOT_COUNT, PREFIX, PERSISTENT_MODES, MODE_LABELS,
    all, meta, getSlot, setActive, erase, prepareNew,
    touchName, formatDate, normalizeAdventureSlots, isEmbedded,
    getModeSave, modeSummary, activateMode, backupMode, clearMode, prepareModeNew
  };
})();