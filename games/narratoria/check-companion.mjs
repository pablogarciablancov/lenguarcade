import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(root, 'index.html'), 'utf8');
const frameDirectory = join(root, 'assets', 'plumin-frames-60');
assert.ok(existsSync(frameDirectory), 'Faltan los fotogramas individuales de Plumín.');
const sequences = ['idle', 'flap', 'talk', 'react'];
const expectedFrames = sequences.flatMap(sequence => Array.from({ length: 60 }, (_, index) => `${sequence}-${String(index + 1).padStart(3, '0')}.webp`));
assert.equal(readdirSync(frameDirectory).length, 240, 'Plumín debe tener 60 fotogramas independientes por secuencia.');
for (const name of expectedFrames) {
  const frame = readFileSync(join(frameDirectory, name));
  assert.ok(statSync(join(frameDirectory, name)).size > 12_000, `${name} está vacío o parece incompleto.`);
  assert.equal(frame.toString('ascii', 0, 4), 'RIFF', `${name} no tiene una cabecera RIFF válida.`);
  assert.equal(frame.toString('ascii', 8, 12), 'WEBP', `${name} no es un WebP válido.`);
}
assert.ok(html.includes('assets/plumin-frames-60/idle-001.webp'), 'El CSS debe usar una imagen completa por fotograma.');
assert.ok(html.includes('sprite.style.backgroundImage'), 'La animación debe cambiar archivos de fotograma completos.');
assert.ok(!html.includes('plumin-sprites-v2.webp') && !html.includes('background-position:'), 'No debe desplazar ni recortar la hoja antigua durante la animación.');
assert.match(html, /length: 60/, 'Cada secuencia debe recorrer sesenta posiciones.');
assert.ok(html.includes('preloadOwlSequence') && html.includes('owlMotionGeneration'), 'Los fotogramas deben precargarse antes del cambio para evitar parpadeos vacíos.');
const writingScreen = html.slice(html.indexOf('id="screen-writing"'), html.indexOf('id="screen-shop"'));
assert.equal((writingScreen.match(/class="owl-sprite"/g) || []).length, 1, 'Narratoria debe mostrar un único Plumín grande dentro del panel lateral.');
assert.ok(!html.includes('plumin-inline-sprite') && !html.includes('codex-summary-avatar'), 'No debe duplicarse Plumín junto al editor ni en el encabezado plegado.');
assert.ok(!html.includes('ui-writing-mission-inline'), 'La misión de escritura debe mostrarse desde la guía desplegable lateral.');
assert.ok(writingScreen.indexOf('id="ui-writing-mission"') < writingScreen.indexOf('id="objective-list"') && writingScreen.indexOf('id="objective-list"') < writingScreen.indexOf('id="writer-companion"'), 'Misión y objetivos deben quedar encima de Plumín en la guía lateral.');
for (const token of ['owl-cheer', 'owl-think', 'motion-cheer', 'motion-think', 'phaseCompletedNow', 'targetReachedNow']) {
  assert.ok(html.includes(token), `Falta la reacción de Plumín: ${token}`);
}

for (const token of [
  'id="writing-codex"', 'id="ui-writing-mission"', 'id="objective-list"', 'id="mini-cards-container"',
  'id="writing-owl-habitat"', 'id="owl-shop-container"', 'id="shop-owl-habitat"',
  'game.buyOwlItem', 'game.equipOwlItem', 'normalizeOwlState(source.owl)', 'normalizeOwlState(loaded.owl)'
]) assert.ok(html.includes(token), `Falta el enlace de integración: ${token}`);

for (const item of ['skin_grafito', 'skin_nieve', 'skin_luna', 'skin_cobre', 'head_gorro', 'head_corona', 'face_gafas', 'body_capa', 'body_delantal', 'cage_roble', 'cage_jardin', 'cage_gremio', 'cage_noche']) {
  assert.ok(html.includes(`id: "${item}"`), `Falta el artículo cosmético ${item}.`);
}

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Hay identificadores HTML duplicados.');
console.log(`Plumín OK · 240 fotogramas WebP independientes · 60 posiciones por secuencia · animaciones precargadas · tienda y guardado verificados.`);
