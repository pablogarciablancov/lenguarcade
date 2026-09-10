import fs from 'node:fs';

const index = fs.readFileSync(new URL('../games/versopolis/index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../games/versopolis/style.css', import.meta.url), 'utf8');
const js = fs.readFileSync(new URL('../games/versopolis/app.js', import.meta.url), 'utf8');
const bundle = `${index}\n${css}\n${js}`;
const fail = (msg) => { throw new Error(`Versópolis: ${msg}`); };
const must = (needle, label = needle) => { if (!bundle.includes(needle)) fail(`falta ${label}`); };

must('<title>Versópolis', 'título');
must('<link rel="stylesheet" href="./style.css">', 'hoja de estilos externa');
must('<script src="./app.js"></script>', 'script principal externo');
must("const GAME_ID='versopolis'", 'GAME_ID');
must("namespace:'lenguarcade-game'", 'bridge de salida');
must("namespace!=='lenguarcade-host'", 'bridge de entrada');
must("this.post('INITIALIZED'", 'INITIALIZED');
must("this.post('CHECKPOINT'", 'CHECKPOINT');
must("this.post('RESULT'", 'RESULT');
must("this.post('SESSION_STARTED'", 'SESSION_STARTED');
must('height:100dvh', 'ajuste al viewport');
must('overflow:hidden', 'control de scroll global');

for (const screen of ['city','battle','challenges','survival','words','coauthor','forge','anthology']) {
  must(`id="screen-${screen}"`, `pantalla ${screen}`);
}
for (const feature of ['validateChallenge','estimateLineSyllables','detectFigure','localRivalReply','materializeRisk','wordStart','coauthorStart','saveForge']) {
  must(`function ${feature}`, `función ${feature}`);
}
for (const text of ['Don Quijote vs. influencer','Góngora vs. Quevedo','Libro vs. móvil','Humano vs. IA']) {
  must(text, `batalla temática ${text}`);
}
if (/games\/rimopolis|Rimópolis/.test(bundle)) fail('ha reaparecido la identidad retirada Rimópolis');

const ids = [...index.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
if (duplicates.length) fail(`IDs duplicados: ${[...new Set(duplicates)].join(', ')}`);

const directRefs = [...js.matchAll(/(?<!\$)\$\('([^']+)'\)/g)].map(m => m[1]);
const missing = [...new Set(directRefs.filter(id => !ids.includes(id)))];
if (missing.length) fail(`referencias a IDs inexistentes: ${missing.join(', ')}`);

new Function(js);

const definitions = js.split("window.addEventListener('message'")[0];
const pureTests = new Function(`${definitions}\n
  const ch={id:'t',topic:'miedo',lines:2,rhyme:'consonant',scheme:'AA',rhymeA:RHYMES.find(x=>x.label==='-ón'),rhymeB:null,meter:null,figure:null,requiredWords:['noche'],forbiddenWords:[],customPrompt:''};
  const good=validateChallenge('La noche golpea fuerte mi corazón\\nLa sombra responde con otra canción',ch);
  const bad=validateChallenge('mesa azul\\nlibro verde',ch);
  const stable=materializeRisk(RISK_POOL.find(x=>x.id==='word'));
  const a=cloneChallenge(ch); a.requiredWords=[]; stable.apply(a); const first=a.requiredWords[0];
  const b=cloneChallenge(ch); b.requiredWords=[]; stable.apply(b);
  return {good,bad,stable:first===b.requiredWords[0],syllables:estimateLineSyllables('La noche camina despacio')};
`)();
if (pureTests.good.rhyme < 90) fail(`el detector de rima consonante no reconoce un caso básico (${pureTests.good.rhyme})`);
if (pureTests.good.overall <= pureTests.bad.overall) fail('el evaluador no distingue un ejemplo mejor de uno peor');
if (!pureTests.stable) fail('una carta de riesgo cambia de condición dentro del mismo turno');
if (!(pureTests.syllables > 0)) fail('el estimador métrico no devuelve un valor válido');

console.log(`Versópolis correcto: ${ids.length} IDs, JS válido, motor de retos y 8 pantallas validadas.`);
