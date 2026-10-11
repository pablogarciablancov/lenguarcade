#!/usr/bin/env python3
"""Build clean, fixed-canvas Plumín frames from Narratoria's individual source poses.

Needs Pillow, NumPy and SciPy: python -m pip install pillow numpy scipy
"""
from __future__ import annotations

import hashlib
import json
import os
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "assets" / "plumin-poses-v2"
OUTPUT = ROOT / "assets" / "plumin-poses-v3"
CANVAS = (256, 256)
BASELINE_Y = 250
TARGET_HEIGHT = 232
TARGET_WIDTH = 248
ALPHA_THRESHOLD = 4


def build() -> None:
    sources = sorted(SOURCE.glob("pose-*.png"))
    if len(sources) != 80:
        raise RuntimeError(f"Expected 80 source poses, found {len(sources)}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    records = []

    for source in sources:
        original = source.read_bytes()
        rgba = np.asarray(Image.open(source).convert("RGBA"))
        alpha = rgba[:, :, 3]
        labels, count = ndimage.label(alpha > ALPHA_THRESHOLD, structure=np.ones((3, 3), dtype=np.uint8))
        sizes = np.bincount(labels.ravel())
        sizes[0] = 0
        main_label = int(sizes.argmax())
        keep = labels == main_label
        if int(sizes[main_label]) < 10_000:
            raise RuntimeError(f"{source.name}: main silhouette is too small")

        isolated = rgba.copy()
        isolated[:, :, 3] = np.where(keep, alpha, 0).astype(np.uint8)
        cropped = Image.fromarray(isolated, "RGBA")
        silhouette = cropped.crop(cropped.getchannel("A").getbbox())

        scale = min(TARGET_HEIGHT / silhouette.height, TARGET_WIDTH / silhouette.width)
        resized_size = (round(silhouette.width * scale), round(silhouette.height * scale))
        silhouette = silhouette.resize(resized_size, Image.Resampling.LANCZOS)

        frame = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
        frame.alpha_composite(silhouette, ((CANVAS[0] - resized_size[0]) // 2, BASELINE_Y - resized_size[1]))

        filename = source.stem + ".webp"
        destination = OUTPUT / filename
        temp_name = None
        try:
            with tempfile.NamedTemporaryFile(dir=OUTPUT, prefix=".plumin-", suffix=".webp", delete=False) as temp:
                temp_name = Path(temp.name)
            frame.save(temp_name, format="WEBP", lossless=True, method=4)
            if temp_name.stat().st_size < 10_000:
                raise RuntimeError(f"{filename}: generated frame looks incomplete")
            encoded = Image.open(temp_name).convert("RGBA")
            encoded_alpha = np.asarray(encoded)[:, :, 3]
            encoded_labels, encoded_count = ndimage.label(encoded_alpha > 24, structure=np.ones((3, 3), dtype=np.uint8))
            encoded_sizes = np.bincount(encoded_labels.ravel())
            encoded_sizes[0] = 0
            encoded_main = int(encoded_sizes.argmax())
            detached = sorted((int(size) for label, size in enumerate(encoded_sizes) if label not in (0, encoded_main)), reverse=True)
            if detached and detached[0] > 50:
                raise RuntimeError(f"{filename}: detached art fragment remains ({detached[0]} pixels)")
            os.replace(temp_name, destination)
        finally:
            if temp_name and temp_name.exists():
                temp_name.unlink()

        result = destination.read_bytes()
        records.append({
            "source": source.name,
            "sourceSha256": hashlib.sha256(original).hexdigest(),
            "frame": filename,
            "canvas": list(CANVAS),
            "bbox": list(frame.getchannel("A").getbbox()),
            "sha256": hashlib.sha256(result).hexdigest(),
            "removedComponents": int(count - 1),
            "removedPixels": int(np.count_nonzero(alpha) - np.count_nonzero(keep)),
            "maxDetachedPixels": detached[0] if detached else 0,
        })

    manifest = {
        "canvas": list(CANVAS),
        "baselineY": BASELINE_Y,
        "maxForegroundHeight": TARGET_HEIGHT,
        "frames": records,
    }
    manifest_path = OUTPUT / "manifest.json"
    temp_manifest = manifest_path.with_suffix(".json.tmp")
    temp_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temp_manifest, manifest_path)

    frame_files = sorted(OUTPUT.glob("pose-*.webp"))
    if len(frame_files) != 80:
        raise RuntimeError(f"Expected 80 generated frames, found {len(frame_files)}")
    print(f"Built {len(frame_files)} cleaned Plumín frames in {OUTPUT}")


if __name__ == "__main__":
    build()
