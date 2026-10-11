import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(root, 'index.html'), 'utf8');
assert.ok(html.startsWith('<!DOCTYPE html>') && !html.includes('\uFFFD'), 'Narratoria debe ser HTML UTF-8 válido.');

const frameDirectory = join(root, 'assets', 'plumin-poses-v3');
assert.ok(existsSync(frameDirectory), 'Faltan los fotogramas limpios y normalizados de Plumín.');
const expectedFrames = Array.from({ length: 80 }, (_, index) => `pose-${String(index + 1).padStart(2, '0')}.webp`);
const frameNames = readdirSync(frameDirectory).filter(name => /^pose-\d{2}\.webp$/.test(name)).sort();
assert.deepEqual(frameNames, expectedFrames, 'Debe haber 80 fotogramas completos, independientes y sin hojas de sprites.');
const manifest = JSON.parse(readFileSync(join(frameDirectory, 'manifest.json'), 'utf8'));
assert.equal(manifest.canvas.join('x'), '256x256', 'Todos los fotogramas deben compartir un lienzo fijo.');
assert.equal(manifest.frames.length, 80, 'El manifiesto debe describir todas las poses.');
const hashes = new Set();
for (const [index, name] of expectedFrames.entries()) {
  const path = join(frameDirectory, name);
  const frame = readFileSync(path);
  assert.ok(statSync(path).size > 10_000, `${name} está vacío o incompleto.`);
  assert.equal(frame.toString('ascii', 0, 4), 'RIFF', `${name} no tiene cabecera RIFF.`);
  assert.equal(frame.toString('ascii', 8, 12), 'WEBP', `${name} no es WebP.`);
  assert.equal(frame.toString('ascii', 12, 16), 'VP8L', `${name} debe conservar alfa con codificación WebP lossless.`);
  assert.equal(frame[20], 0x2f, `${name} tiene un flujo WebP lossless inválido.`);
  const width = 1 + frame[21] + ((frame[22] & 0x3f) << 8);
  const height = 1 + ((frame[22] >> 6) | (frame[23] << 2) | ((frame[24] & 0x0f) << 10));
  assert.deepEqual([width, height], [256, 256], `${name} debe mantener el mismo lienzo para evitar saltos de escala.`);
  const hash = createHash('sha256').update(frame).digest('hex');
  assert.ok(!hashes.has(hash), `${name} repite otra pose.`);
  hashes.add(hash);
  const record = manifest.frames[index];
  assert.equal(record.frame, name, `El manifiesto no corresponde con ${name}.`);
  assert.equal(record.sha256, hash, `El hash de ${name} no coincide con el manifiesto.`);
  assert.deepEqual(record.canvas, [256, 256]);
}

assert.ok(html.includes("assets/plumin-poses-v3/pose-\${String(frame).padStart(2, '0')}.webp") && html.includes('idle: [owlPose(4)]'), 'El reposo y las animaciones deben usar los fotogramas normalizados.');
assert.ok(html.includes('frame.src = loadedFrames[frameIndex]'), 'La animación debe intercambiar una imagen completa en cada paso.');
assert.ok(!html.includes('owl-frame-layer') && !html.includes('transition: opacity 105ms ease-in-out'), 'No debe fundir dos poses distintas y crear fantasmas o encogimientos.');
assert.ok(!html.includes('background-position:') && !html.includes('plumin-sprites-v2.webp'), 'No debe desplazar ni recortar una tira de sprites.');
assert.ok(html.includes('idle: [owlPose(4)]'), 'Plumín debe quedarse quieto cuando nadie interactúa.');
for (const token of [
  'talk: owlSequence([5, 6, 7, 8], 33)', 'flap: owlSequence([9, 10, 11, 12], 49)',
  'think: owlSequence([1, 2, 3, 4], 17)', 'cheer: owlSequence([13, 14, 15, 16], 65)',
  'sprite.style.setProperty(\'--owl-head-angle\'', 'sprite.style.setProperty(\'--owl-body-angle\'',
  'OWL_ACCESSORY_BACK_ART', 'owlAccessoryBackMarkup(item)', 'game.awardOwlWritingCoins(c)',
  'game.upgradeOwlHome()', 'normalizeOwlState(source.owl)', 'normalizeOwlState(loaded.owl)'
]) assert.ok(html.includes(token), `Falta el comportamiento esperado de Plumín: ${token}`);

const writingScreen = html.slice(html.indexOf('id="screen-writing"'), html.indexOf('id="screen-final"'));
assert.equal((writingScreen.match(/class="owl-sprite"/g) || []).length, 1, 'Debe aparecer un único Plumín grande durante la escritura.');
assert.ok(writingScreen.indexOf('id="writer-companion"') < writingScreen.indexOf('id="writing-codex"'), 'Plumín debe estar visible fuera del desplegable.');
assert.ok(writingScreen.indexOf('id="ui-writing-mission"') > writingScreen.indexOf('id="writing-codex"'), 'La misión debe permanecer dentro del desplegable.');
assert.ok(writingScreen.indexOf('id="objective-list"') > writingScreen.indexOf('id="writing-codex"'), 'Los objetivos deben permanecer dentro del desplegable.');
for (const token of [
  'id="writing-owl-habitat"', 'id="owl-shop-container"', 'id="shop-owl-habitat"',
  'id="writing-feathers"', 'id="shop-feathers"', 'rewardLedgers', 'mergeOwlProgress', 'homeLevel',
  'id: "home_bookcase"', 'id: "home_lamp"', 'id: "home_plant"', 'id: "home_rug"',
  'id: "home_desk"', 'id: "home_window"', 'currency: "plumillas"'
]) assert.ok(html.includes(token), `Falta la evolución del hogar: ${token}`);

for (const item of ['skin_grafito', 'skin_nieve', 'skin_luna', 'skin_cobre', 'head_gorro', 'head_corona', 'face_gafas', 'body_capa', 'body_delantal', 'cage_roble', 'cage_jardin', 'cage_gremio', 'cage_noche']) {
  assert.ok(html.includes(`id: "${item}"`), `Falta el artículo cosmético ${item}.`);
}

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Hay identificadores HTML duplicados.');
assert.ok(html.includes('head_gorro: \'<path') && html.includes('face_gafas: \'<path') && html.includes('body_capa: \'<path'), 'Los accesorios deben ser capas vectoriales y no emojis planos.');
assert.ok(html.includes('height: 39%') && html.includes('height: 38%') && html.includes('height: 53%'), 'Los accesorios deben ocupar una escala visible sobre el cuerpo.');
assert.ok(html.includes('.owl-item-preview { position: relative;') && html.includes('.owl-item-preview .owl-preview-sprite'), 'Las miniaturas deben quedarse dentro de su tarjeta.');
assert.ok(html.includes('id="owl-notebook"') && html.includes('id="owl-last-memory"'), 'El hogar debe mostrar el cuaderno persistente.');
assert.ok(html.includes('phaseRewardLedgers') && html.includes('registerOwlPhaseReward'), 'Las recompensas deben guardarse por historia y fase.');
assert.ok(html.includes('game.trackOwlWritingProgress(c)') && !html.includes('game.awardOwlWritingCoins(c)'), 'Escribir palabras no debe conceder plumillas.');
assert.ok(html.includes("companion.classList.toggle('is-thinking'") && html.includes("ui.setOwlMotion('think')"), 'Una pausa debe cambiar la postura de Plumín.');
const rewardHelper = html.match(/function registerOwlPhaseReward\([\s\S]*?\n        }/)?.[0];
assert.ok(rewardHelper, 'Falta la concesión idempotente de recompensas.');
const registerOwlPhaseReward = vm.runInNewContext(`${rewardHelper}; registerOwlPhaseReward`);
const owl = { phaseRewardLedgers: {}, memories: [], coins: 0 };
const memory = { id: 'story-a:0', phaseName: 'Inicio', excerpt: 'Una escena' };
assert.equal(registerOwlPhaseReward(owl, 'story-a', 0, memory), true);
assert.equal(registerOwlPhaseReward(owl, 'story-a', 0, memory), false);
assert.equal(owl.coins, 5, 'Una fase entrega cinco plumillas una sola vez.');
assert.equal(owl.memories.length, 1, 'Una fase añade un único recuerdo.');
console.log('Plumín OK · 80 WebP transparentes normalizados y verificados · swaps de fotograma sin solapes · accesorios anclados · hogar y economía persistentes.');
