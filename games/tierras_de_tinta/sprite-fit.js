// Isolate atlas cells and remove detached atlas debris from every hero portrait.
(() => {
  const ns = "http://www.w3.org/2000/svg";
  const sheets = {
    "heroes-cartoon-v3.webp": [1774, 887, 4, 2],
    "enemies-cartoon-v3.webp": [1774, 887, 4, 2],
    "weapons-remaster-v1.webp": [1280, 640, 5, 2],
    "region-atlas-v1.webp": [900, 900, 3, 3]
  };
  const selector = ".title-hero,.rest-hero,.hero-portrait,.hero-focus-art,.weapon-art,.boss-preview,.region-scene,.destination-icon,.camp-next-art";
  const heroSelector = ".title-hero,.rest-hero,.hero-portrait,.hero-focus-art";
  const atlasLoads = new Map();
  const heroCells = new Map();
  let sequence = 0;

  function loadAtlas(source) {
    if (!atlasLoads.has(source)) {
      atlasLoads.set(source, new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("No se pudo cargar el atlas " + source));
        image.src = new URL(source, document.baseURI).href;
      }));
    }
    return atlasLoads.get(source);
  }

  function cleanCell(image, col, row, fallbackWidth, fallbackHeight, cols, rows) {
    const cellWidth = image.naturalWidth / cols || fallbackWidth / cols;
    const cellHeight = image.naturalHeight / rows || fallbackHeight / rows;
    const width = Math.max(1, Math.round(cellWidth));
    const height = Math.max(1, Math.round(cellHeight));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, col * cellWidth, row * cellHeight, cellWidth, cellHeight, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const total = width * height;
    const labels = new Int32Array(total);
    const stack = new Int32Array(total);
    const components = [];
    const alphaThreshold = 24;

    for (let p = 0; p < total; p++) {
      const alphaIndex = p * 4 + 3;
      if (pixels[alphaIndex] <= alphaThreshold) {
        pixels[alphaIndex] = 0;
      }
    }

    for (let start = 0; start < total; start++) {
      if (labels[start] || pixels[start * 4 + 3] === 0) continue;
      const label = components.length + 1;
      let top = 0;
      let area = 0;
      let minX = width, minY = height, maxX = -1, maxY = -1;
      stack[top++] = start;
      labels[start] = label;

      while (top) {
        const index = stack[--top];
        const x = index % width;
        const y = (index - x) / width;
        area++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        for (let dy = -1; dy <= 1; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= height) continue;
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            if (nx < 0 || nx >= width) continue;
            const neighbor = ny * width + nx;
            if (!labels[neighbor] && pixels[neighbor * 4 + 3] > 0) {
              labels[neighbor] = label;
              stack[top++] = neighbor;
            }
          }
        }
      }
      components.push({ label, area, minX, minY, maxX, maxY });
    }

    if (components.length > 1) {
      const core = components.reduce((largest, component) => component.area > largest.area ? component : largest);
      const marginX = Math.round(width * 0.085);
      const marginY = Math.round(height * 0.085);
      const minX = core.minX - marginX, maxX = core.maxX + marginX;
      const minY = core.minY - marginY, maxY = core.maxY + marginY;
      const minimumArea = Math.max(18, Math.floor(total * 0.0012));
      const largeDetachedArea = Math.floor(total * 0.007);
      const keep = new Uint8Array(components.length + 1);

      for (const component of components) {
        const nearCore = component.maxX >= minX && component.minX <= maxX &&
          component.maxY >= minY && component.minY <= maxY;
        if (component.area >= minimumArea && (nearCore || component.area >= largeDetachedArea)) keep[component.label] = 1;
      }

      for (let p = 0; p < total; p++) {
        if (labels[p] && !keep[labels[p]]) pixels[p * 4 + 3] = 0;
      }
      context.putImageData(imageData, 0, 0);
    }

    return { canvas, width, height, href: canvas.toDataURL("image/png") };
  }

  function heroCell(source, col, row, width, height, cols, rows) {
    const key = source + "|" + col + "|" + row;
    if (!heroCells.has(key)) {
      heroCells.set(key, loadAtlas(source).then(image => cleanCell(image, col, row, width, height, cols, rows)));
    }
    return heroCells.get(key);
  }

  function ensureSvg(el) {
    let svg = el.querySelector(":scope > .sprite-cell-art");
    if (!svg) {
      svg = document.createElementNS(ns, "svg");
      svg.classList.add("sprite-cell-art");
      svg.setAttribute("aria-hidden", "true");
      svg.style.overflow = "hidden";
      el.append(svg);
    }
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    return svg;
  }

  function renderHero(el, source, col, row, width, height, cols, rows) {
    const key = source + "|" + col + "|" + row;
    const svg = ensureSvg(el);
    if (svg.dataset.cleanCell === key) return;
    svg.dataset.cleanCell = key;
    svg.setAttribute("viewBox", "0 0 " + (width / cols) + " " + (height / rows));
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    heroCell(source, col, row, width, height, cols, rows).then(cell => {
      if (!el.isConnected || svg.dataset.cleanCell !== key) return;
      const image = document.createElementNS(ns, "image");
      image.setAttribute("width", cell.width);
      image.setAttribute("height", cell.height);
      image.setAttribute("href", cell.href);
      svg.replaceChildren(image);
    }).catch(error => console.warn("No se pudo aislar el retrato del héroe", error));
  }

  function renderOtherCell(el, source, col, row, width, height, cols, rows) {
    const cellWidth = width / cols, cellHeight = height / rows;
    const viewBox = (col * cellWidth) + " " + (row * cellHeight) + " " + cellWidth + " " + cellHeight;
    const svg = ensureSvg(el);
    svg.setAttribute("preserveAspectRatio", el.matches(".region-scene,.destination-icon,.camp-next-art") ? "xMidYMid slice" : "xMidYMid meet");
    if (svg.getAttribute("viewBox") !== viewBox || !svg.querySelector("image")) {
      svg.setAttribute("viewBox", viewBox);
      const image = document.createElementNS(ns, "image");
      image.setAttribute("width", width);
      image.setAttribute("height", height);
      image.setAttribute("href", source);
      svg.replaceChildren(image);
    } else {
      const image = svg.querySelector("image");
      if (image.getAttribute("href") !== source) image.setAttribute("href", source);
    }
  }

  function fit() {
    document.querySelectorAll(selector).forEach(el => {
      const style = getComputedStyle(el);
      const source = style.backgroundImage.match(/url\(["']?([^"')]+)["']?\)/)?.[1] || el.dataset.spriteSource;
      const sheet = source && sheets[source.split("/").pop()];
      if (!sheet) return;
      const [width, height, cols, rows] = sheet;
      const position = style.backgroundPosition.split(" ").map(value => parseFloat(value) || 0);
      const col = Math.max(0, Math.min(cols - 1, Math.round(position[0] * (cols - 1) / 100)));
      const row = Math.max(0, Math.min(rows - 1, Math.round(position[1] * (rows - 1) / 100)));
      const heroCell = source.endsWith("/heroes-cartoon-v3.webp") && el.matches(heroSelector);

      el.dataset.spriteSource = source;
      if (heroCell) renderHero(el, source, col, row, width, height, cols, rows);
      else renderOtherCell(el, source, col, row, width, height, cols, rows);
      if (el.style.backgroundImage !== "none") el.style.backgroundImage = "none";
    });
  }

  fit();
  new MutationObserver(records => {
    if (records.some(record => record.target.matches?.(selector) ||
      (record.type === "childList" && [...record.addedNodes].some(node => node.matches?.(selector) || node.querySelector?.(selector))))) fit();
  }).observe(document.querySelector(".app"), {
    childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"]
  });
})();