// Keep each atlas cell intact, regardless of its responsive container's shape.
(() => {
  const ns = 'http://www.w3.org/2000/svg';
  const sheets = {
    'heroes-cartoon-v3.webp': [1774, 887, 4, 2],
    'enemies-cartoon-v3.webp': [1774, 887, 4, 2],
    'weapons-remaster-v1.webp': [1280, 640, 5, 2],
    'region-atlas-v1.webp': [900, 900, 3, 3]
  };
  const selector = '.title-hero,.rest-hero,.hero-portrait,.hero-focus-art,.weapon-art,.boss-preview,.region-scene,.destination-icon,.camp-next-art';
  let sequence = 0;
  function fit() {
    document.querySelectorAll(selector).forEach(el => {
      const style = getComputedStyle(el);
      const source = style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1] || el.dataset.spriteSource;
      const sheet = source && sheets[source.split('/').pop()];
      if (!sheet) return;
      const [width, height, cols, rows] = sheet;
      const position = style.backgroundPosition.split(' ').map(parseFloat);
      const col = Math.round((position[0] || 0) * (cols - 1) / 100);
      const row = Math.round((position[1] || 0) * (rows - 1) / 100);
      const viewBox = `${col * width / cols} ${row * height / rows} ${width / cols} ${height / rows}`;
      let svg = el.querySelector(':scope > .sprite-cell-art');
      if (!svg) {
        svg = document.createElementNS(ns, 'svg');
        svg.classList.add('sprite-cell-art');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('preserveAspectRatio', el.matches('.region-scene,.destination-icon,.camp-next-art') ? 'xMidYMid slice' : 'xMidYMid meet');
        svg.style.overflow = 'hidden';
        const image = document.createElementNS(ns, 'image');
        image.setAttribute('width', width);
        image.setAttribute('height', height);
        image.setAttribute('href', source);
        const defs = document.createElementNS(ns, 'defs');
        const clip = document.createElementNS(ns, 'clipPath');
        clip.id = `tinta-sprite-clip-${++sequence}`;
        clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
        clip.append(document.createElementNS(ns, 'rect'));
        defs.append(clip);
        image.setAttribute('clip-path', `url(#${clip.id})`);
        svg.append(defs, image);
        el.append(svg);
      }
      if (svg.getAttribute('viewBox') !== viewBox) {
        svg.setAttribute('viewBox', viewBox);
        const rect = svg.querySelector('clipPath rect');
        ['x', 'y', 'width', 'height'].forEach((key, i) => rect.setAttribute(key, viewBox.split(' ')[i]));
      }
      if (style.position === 'static') el.style.position = 'relative';
      el.dataset.spriteSource = source;
      if (el.style.backgroundImage !== 'none') el.style.backgroundImage = 'none';
    });
  }
  fit();
  // Menus replace their card children and update the selected atlas coordinates.
  new MutationObserver(records => {
    if (records.some(r => r.target.matches?.(selector) ||
      (r.type === 'childList' && [...r.addedNodes].some(n => n.matches?.(selector) || n.querySelector?.(selector))))) fit();
  }).observe(document.querySelector('.app'), {
    childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class']
  });
})();
