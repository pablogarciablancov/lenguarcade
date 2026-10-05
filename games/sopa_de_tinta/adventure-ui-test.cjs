const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES
  ? path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright') : 'playwright');

(async () => {
  const browser = await chromium.launch({headless: true,
    ...(process.env.TINTA_CHROMIUM_PATH ? {executablePath: process.env.TINTA_CHROMIUM_PATH} : {}),
    args: ['--no-sandbox', '--disable-gpu', '--no-zygote']});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(process.env.TINTA_TEST_URL || pathToFileURL(path.join(__dirname, 'index.html')).href);
    for (const [width, height] of [[1366,768],[1440,900],[1920,1080],[1366,600],[390,844],[375,667]]) {
      await page.setViewportSize({width, height});
      await page.evaluate(() => TintaGame.home());
      await page.getByRole('button', {name: /JUGAR AVENTURA/}).click();
      assert.equal(await page.locator('.district-play').count(), 7);
      const categories = await page.locator('.district-play').evaluateAll(es => es.map(e => e.dataset.category));
      for (const category of categories) {
        const button = page.locator(`.district-play[data-category="${category}"]`);
        await button.scrollIntoViewIfNeeded();
        const visible = await button.evaluate(e => {
          const rect = e.getBoundingClientRect(), card = e.closest('.district').getBoundingClientRect();
          const hit = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
          return rect.height >= 44 && rect.top >= card.top && rect.bottom <= card.bottom && (hit === e || e.contains(hit));
        });
        assert(visible, `Botón recortado u oculto: ${category}, ${width}×${height}`);
        await button.click();
        if (await page.locator('#replace-run').isVisible()) await page.locator('#replace-run').click();
        assert.equal(await page.evaluate(() => TintaGame.getScreen()), 'play');
        assert.equal(await page.evaluate(() => TintaGame.run.category), category);
        await page.locator('[data-action="pause"]').click();
        await page.getByRole('button', {name: /JUGAR AVENTURA/}).click();
      }
    }
    assert.deepEqual(errors, []);
    console.log('OK: 42 entradas reales, siete distritos, seis tamaños y botones visibles sin recortes.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
