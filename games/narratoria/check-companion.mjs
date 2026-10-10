import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(root, 'index.html'), 'utf8');
const spritePath = join(root, 'assets', 'plumin-sprites-v2.webp');
assert.ok(existsSync(spritePath), 'Falta la hoja de sprites de Plumín.');
const sprite = readFileSync(spritePath);
assert.ok(statSync(spritePath).size > 100_000, 'La hoja de sprites parece incompleta.');
assert.equal(sprite.toString('ascii', 0, 4), 'RIFF', 'El recurso de Plumín no tiene cabecera WebP válida.');
assert.equal(sprite.toString('ascii', 8, 12), 'WEBP', 'El recurso de Plumín no tiene formato WebP.');
assert.match(html, /url\("assets\/plumin-sprites-v2\.webp"\)/, 'El CSS no apunta al nuevo recurso de sprites.');

for (const [animation, row] of [['owl-idle', '0'], ['owl-flap', '33\.333%'], ['owl-talk', '66\.667%'], ['owl-react', '100%']]) {
  assert.match(html, new RegExp(`@keyframes ${animation}[\\s\\S]*?background-position:[^;]*${row}`), `Falta la animación ${animation}.`);
}
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
console.log(`Plumín OK · sprite WebP 6×4 con transparencia · animaciones y reacciones · tienda y guardado verificados.`);
