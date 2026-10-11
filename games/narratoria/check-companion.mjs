import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const htmlBytes = readFileSync(join(root, 'index.html'));
const html = htmlBytes.toString('utf8');
assert.ok(html.startsWith('<!DOCTYPE html>'), 'Narratoria index.html no comienza como una página HTML.');
assert.ok(!html.includes('\uFFFD'), 'Narratoria index.html contiene bytes que no son UTF-8 válido.');

const frameDirectory = join(root, 'assets', 'plumin-poses-v2');
assert.ok(existsSync(frameDirectory), 'Faltan los fotogramas nuevos de Plumín.');
const expectedFrames = Array.from({ length: 80 }, (_, index) => `pose-${String(index + 1).padStart(2, '0')}.png`);
const frameNames = readdirSync(frameDirectory).filter(name => name.endsWith('.png')).sort();
assert.deepEqual(frameNames, expectedFrames, 'Debe haber 80 sprites PNG separados, sin hojas de contacto.');
const hashes = new Set();
for (const name of expectedFrames) {
  const path = join(frameDirectory, name);
  const frame = readFileSync(path);
  assert.ok(statSync(path).size > 10_000, `${name} está vacío o incompleto.`);
  assert.deepEqual([...frame.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${name} no es un PNG válido.`);
  assert.equal(frame.readUInt32BE(16), 256, `${name} debe medir 256 px de ancho.`);
  assert.equal(frame.readUInt32BE(20), 256, `${name} debe medir 256 px de alto.`);
  assert.equal(frame[25], 6, `${name} debe conservar transparencia RGBA.`);
  const hash = createHash('sha256').update(frame).digest('hex');
  assert.ok(!hashes.has(hash), `${name} repite otra pose en vez de ser un fotograma individual.`);
  hashes.add(hash);
}

assert.ok(html.includes('assets/plumin-poses-v2/pose-04.png'), 'El estado de reposo debe mostrar la pose tranquila fija.');
assert.ok(html.includes("next.src = loadedFrames[frameIndex]"), 'Las animaciones deben cambiar entre archivos de imagen completos.');
assert.ok(html.includes('.owl-frame-layer.is-active') && html.includes('transition: opacity 105ms ease-in-out'), 'Los cambios entre dibujos deben fundirse con una transición breve.');
assert.ok(!html.includes('background-position:') && !html.includes('plumin-sprites-v2.webp'), 'No se debe desplazar ni recortar una tira de sprites.');
assert.ok(html.includes('assets/plumin-poses-v2/pose-${String(frame).padStart(2, \'0\')}.png'), 'Las poses deben cargarse como PNG individuales.');
assert.ok(html.includes('idle: [owlPose(4)]'), 'El modo en reposo debe quedarse en un único fotograma.');
assert.ok(html.includes('talk: owlSequence([5, 6, 7, 8], 33)'), 'Saludar debe reproducir su secuencia de poses.');
assert.ok(html.includes('flap: owlSequence([9, 10, 11, 12], 49)'), 'Escribir debe reproducir la secuencia de aleteo.');
assert.ok(html.includes('think: owlSequence([1, 2, 3, 4], 17)') && html.includes("ui.setOwlMotion('think')"), 'La evaluación incompleta debe provocar una reacción pensativa.');
assert.ok(html.includes('cheer: owlSequence([13, 14, 15, 16], 65)'), 'Completar una fase debe reproducir su celebración.');
assert.ok(html.includes("else if (typing && !phaseDone) ui.setOwlMotion('flap')"), 'La escritura debe activar el movimiento y la pausa devolverlo a reposo.');
assert.ok(!html.includes('5200 + Math.random()') && !html.includes("ui.setOwlMotion(writing ? 'flap' : (Math.random()"), 'No debe haber movimientos aleatorios mientras espera.');

const writingScreen = html.slice(html.indexOf('id="screen-writing"'), html.indexOf('id="screen-final"'));
assert.equal((writingScreen.match(/class="owl-sprite"/g) || []).length, 1, 'Debe aparecer un único Plumín grande durante la escritura.');
assert.ok(writingScreen.indexOf('id="writer-companion"') < writingScreen.indexOf('id="writing-codex"'), 'Plumín debe estar fuera del desplegable y visible al cerrarlo.');
assert.ok(writingScreen.indexOf('id="ui-writing-mission"') > writingScreen.indexOf('id="writing-codex"'), 'La misión debe permanecer dentro del desplegable.');
assert.ok(writingScreen.indexOf('id="objective-list"') > writingScreen.indexOf('id="writing-codex"'), 'Los objetivos deben permanecer dentro del desplegable.');

for (const token of [
  'id="writing-codex"', 'id="ui-writing-mission"', 'id="objective-list"', 'id="mini-cards-container"',
  'id="writing-owl-habitat"', 'id="owl-shop-container"', 'id="shop-owl-habitat"', 'ui.greetOwl',
  'game.buyOwlItem', 'game.equipOwlItem', 'normalizeOwlState(source.owl)', 'normalizeOwlState(loaded.owl)'
]) assert.ok(html.includes(token), `Falta el enlace de integración: ${token}`);

for (const item of ['skin_grafito', 'skin_nieve', 'skin_luna', 'skin_cobre', 'head_gorro', 'head_corona', 'face_gafas', 'body_capa', 'body_delantal', 'cage_roble', 'cage_jardin', 'cage_gremio', 'cage_noche']) {
  assert.ok(html.includes(`id: "${item}"`), `Falta el artículo cosmético ${item}.`);
}

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Hay identificadores HTML duplicados.');
assert.ok(html.includes('head_gorro: \'<path') && html.includes('face_gafas: \'<g') && html.includes('body_capa: \'<path'), 'Los accesorios deben dibujarse como piezas vectoriales superpuestas, no como emojis.');
assert.ok(html.includes('height: 39%') && html.includes('height: 38%') && html.includes('height: 53%'), 'Los accesorios deben ocupar una escala legible sobre el cuerpo.');
console.log('Plumín OK · 80 PNG individuales RGBA sin duplicados · transiciones cruzadas · reposo fijo · accesorios vectoriales grandes · tienda conservada.');
