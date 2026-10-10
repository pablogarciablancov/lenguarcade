import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(root, 'index.html'), 'utf8');
const spritePath = join(root, 'assets', 'plumin-sprites-v1.png');
assert.ok(existsSync(spritePath), 'Falta la hoja de sprites de Plumín.');
assert.ok(statSync(spritePath).size > 100_000, 'La hoja de sprites parece incompleta.');
assert.deepEqual([...readFileSync(spritePath).subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], 'El recurso de Plumín no es un PNG válido.');
assert.match(html, /url\("assets\/plumin-sprites-v1\.png"\)/, 'El CSS no apunta al recurso de sprites.');

for (const [animation, row] of [['owl-blink', '0'], ['owl-flap', '33\.333%'], ['owl-talk', '66\.667%'], ['owl-hop', '100%']]) {
  assert.match(html, new RegExp(`@keyframes ${animation}[\\s\\S]*?background-position:[^;]*${row}`), `Falta la animación ${animation}.`);
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
console.log(`Plumín OK · sprite ${(statSync(spritePath).size / 1024 / 1024).toFixed(1)} MB · 4 animaciones · tienda y guardado verificados.`);
