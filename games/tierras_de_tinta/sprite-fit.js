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
  const heroAtlasCells = new Map();
  const resolvedHeroAtlases = new Map();
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

  function extractHeroCells(image, cols, rows) {
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    const total = width * height;
    const labels = new Int32Array(total);
    const stack = new Int32Array(total);
    const components = [null];
    const alphaThreshold = 24;

    for (let p = 0; p < total; p++) {
      const alphaIndex = p * 4 + 3;
      if (pixels[alphaIndex] <= alphaThreshold) pixels[alphaIndex] = 0;
    }

    for (let start = 0; start < total; start++) {
      if (labels[start] || pixels[start * 4 + 3] === 0) continue;
      const label = components.length;
      let top = 0;
      let minX = width, minY = height, maxX = -1, maxY = -1;
      stack[top++] = start;
      labels[start] = label;

      while (top) {
        const index = stack[--top];
        const x = index % width;
        const y = (index - x) / width;
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

      components.push({ minX, minY, maxX, maxY });
    }

    // One anchor per original portrait locates that hero's full silhouette,
    // including connected parts that cross into a neighboring atlas cell.
    const anchors = [
      [0.52, 0.56], [0.47, 0.50], [0.59, 0.45], [0.43, 0.45],
      [0.56, 0.47], [0.58, 0.44], [0.53, 0.47], [0.50, 0.47]
    ];
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    const cells = new Map();

    anchors.forEach(([anchorX, anchorY], index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      if (col >= cols || row >= rows) return;
      const x = Math.min(width - 1, Math.floor((col + anchorX) * cellWidth));
      const y = Math.min(height - 1, Math.floor((row + anchorY) * cellHeight));
      const label = labels[y * width + x];
      const bounds = components[label];
      if (!label || !bounds) return;

      const cropWidth = bounds.maxX - bounds.minX + 1;
      const cropHeight = bounds.maxY - bounds.minY + 1;
      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;
      const cropContext = cropCanvas.getContext("2d", { willReadFrequently: true });
      const crop = context.getImageData(bounds.minX, bounds.minY, cropWidth, cropHeight);
      const cropPixels = crop.data;

      for (let cy = 0; cy < cropHeight; cy++) {
        const sourceRow = (bounds.minY + cy) * width + bounds.minX;
        for (let cx = 0; cx < cropWidth; cx++) {
          if (labels[sourceRow + cx] !== label) cropPixels[(cy * cropWidth + cx) * 4 + 3] = 0;
        }
      }

      cropContext.putImageData(crop, 0, 0);
      cells.set(col + "|" + row, {
        canvas: cropCanvas,
        width: cropWidth,
        height: cropHeight,
        href: cropCanvas.toDataURL("image/png")
      });
    });

    return cells;
  }


  function heroCell(source, col, row, width, height, cols, rows) {
    const key = source + "|" + col + "|" + row;
    if (!heroCells.has(key)) {
      if (!heroAtlasCells.has(source)) {
        heroAtlasCells.set(source, loadAtlas(source).then(image => {
          const cells = extractHeroCells(image, cols, rows);
          resolvedHeroAtlases.set(source, cells);
          return cells;
        }));
      }
      heroCells.set(key, heroAtlasCells.get(source).then(cells => cells.get(col + "|" + row)));
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
      svg.setAttribute("viewBox", "0 0 " + cell.width + " " + cell.height);
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

  window.TintaHeroSprites = {
    get(col, row) {
      const source = new URL("assets/heroes-cartoon-v3.webp", document.baseURI).href;
      return resolvedHeroAtlases.get(source)?.get(col + "|" + row) || null;
    }
  };

  fit();
  new MutationObserver(records => {
    if (records.some(record => record.target.matches?.(selector) ||
      (record.type === "childList" && [...record.addedNodes].some(node => node.matches?.(selector) || node.querySelector?.(selector))))) fit();
  }).observe(document.querySelector(".app"), {
    childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"]
  });
})();