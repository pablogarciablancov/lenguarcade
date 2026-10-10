import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(root, 'index.html'), 'utf8');
const frameDirectory = join(root, 'assets', 'plumin-frames');
assert.ok(existsSync(frameDirectory), 'Faltan los fotogramas individuales de Plumín.');
const sequences = ['idle', 'flap', 'talk', 'react'];
const expectedFrames = sequences.flatMap(sequence => Array.from({ length: 12 }, (_, index) => `${sequence}-${String(index + 1).padStart(2, '0')}.png`));
assert.equal(readdirSync(frameDirectory).length, 48, 'Plumín debe tener 48 archivos de fotograma, sin extras.');
for (const name of expectedFrames) {
  const frame = readFileSync(join(frameDirectory, name));
  assert.ok(statSync(join(frameDirectory, name)).size > 2_000, `${name} parece incompleto.`);
  assert.equal(frame.toString('hex', 0, 8), '89504e470d0a1a0a', `${name} no es un PNG válido.`);
  assert.equal(frame.readUInt32BE(16), 256, `${name} debe tener 256 px de ancho.`);
  assert.equal(frame.readUInt32BE(20), 256, `${name} debe tener 256 px de alto.`);
  assert.equal(frame[25], 6, `${name} debe conservar canal alfa RGBA.`);
}
assert.ok(html.includes('assets/plumin-frames/idle-01.png'), 'El CSS debe usar una imagen completa por fotograma.');
assert.ok(html.includes('sprite.style.backgroundImage'), 'La animación debe cambiar archivos de fotograma completos.');
assert.ok(!html.includes('plumin-sprites-v2.webp') && !html.includes('background-position:'), 'No debe desplazar ni recortar la hoja antigua durante la animación.');
assert.match(html, /length: 12/, 'Cada secuencia debe recorrer doce poses distintas.');
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
console.log(`Plumín OK · 48 fotogramas PNG RGBA independientes de 256×256 · animaciones y reacciones · tienda y guardado verificados.`);
