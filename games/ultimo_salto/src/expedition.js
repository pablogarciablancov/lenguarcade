export const ZONES = [
 {id:'temple', name:'Templo de las Tildes', first:1, fog:0x4b777c, sun:0xffdb9e, stone:0xd7c9a6},
 {id:'grove', name:'Jardín Suspendido', first:6, fog:0x386657, sun:0xcaf5aa, stone:0xb9cf9d},
 {id:'crystal', name:'Gruta de Cristal', first:10, fog:0x393e70, sun:0xb9c8ff, stone:0xc6c6e3},
 {id:'forge', name:'Forja del Abismo', first:15, fog:0x774137, sun:0xffae6c, stone:0xe7b995}
];

export function zoneFor(level) {
 return ZONES.findLast(zone => level >= zone.first) ?? ZONES[0];
}

export function challengeFor(level) {
 if (level === 20) return {name:'Los tres sellos', goal:'Completa los tres sellos sin caer.', met:run => run.errors === 0};
 if (level >= 15) return {name:'Paso firme', goal:'Completa el nivel sin errores ni ayudas.', met:run => run.errors === 0 && run.hints === 0};
 if (level >= 10) return {name:'Lee la piedra', goal:'Deduce la regla y llega al umbral sin ayudas.', met:run => run.hints === 0};
 if (level >= 6) return {name:'Cartografía', goal:'Pisa al menos siete piedras distintas y llega al umbral.', met:run => run.visited.length >= 7};
 return {name:'Cruce limpio', goal:'Llega al umbral sin cometer errores.', met:run => run.errors === 0};
}

export const EXPEDITION_ACHIEVEMENTS = [
 ...ZONES.map(zone => ({id:'zone_'+zone.id,name:zone.name,desc:'Supera un nivel en esta zona.'})),
 {id:'challenge_1', name:'Acepto el reto', desc:'Completa tu primer reto.'},
 {id:'challenge_5', name:'Explorador tenaz', desc:'Completa cinco retos distintos.'},
 {id:'challenge_12', name:'Maestro de las ruinas', desc:'Completa doce retos distintos.'},
 {id:'challenge_20', name:'Leyenda del abismo', desc:'Completa los veinte retos.'}
];

export function awardExpedition(profile, run) {
 const challenge = challengeFor(run.level);
 const earned = challenge.met(run) && !profile.challenges[run.level];
 if (earned) profile.challenges[run.level] = true;
 const count = Object.keys(profile.challenges).length;
 const candidates = ['zone_'+zoneFor(run.level).id];
 for (const milestone of [1,5,12,20]) {
  if (count >= milestone) candidates.push('challenge_'+milestone);
 }
 const unlocked = candidates.filter(id => !profile.achievements.includes(id));
 profile.achievements.push(...unlocked);
 return {challengeEarned:earned, bonusCoins:earned?12:0, unlocked};
}
