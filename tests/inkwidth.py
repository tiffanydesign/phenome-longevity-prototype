"""Ink box (CSS px) of labelled XML nodes in a capture. Prints JSON for tests/calibrate.mjs.
usage: python -I tests/inkwidth.py <ref> "<label>" …"""
import json, re, sys
from pathlib import Path
import numpy as np
from PIL import Image
CAP = Path(__file__).resolve().parents[1] / "capture" / "screens"
ref, labels = sys.argv[1], sys.argv[2:]
xml = (CAP / f"{ref}.xml").read_text(encoding="utf-8")
img = np.asarray(Image.open(CAP / f"{ref}.png").convert("L"), dtype=np.int16)
out = []
for label in labels:
    m = re.search(r'(?:content-desc|text)="' + re.escape(label.replace("&", "&amp;")) + r'"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml)
    if not m:
        sys.stderr.write(f"not found: {label}\n"); continue
    x1, y1, x2, y2 = map(int, m.groups())
    box = img[y1:y2, x1:x2]
    bg = np.median(np.concatenate([box[0], box[-1], box[:, 0], box[:, -1]]))
    ink = np.abs(box - bg) > 50
    r, c = np.where(ink.any(1))[0], np.where(ink.any(0))[0]
    if not len(r):
        continue
    out.append({"label": label, "inkW": (c.max() - c.min() + 1) / 3.25, "inkH": (r.max() - r.min() + 1) / 3.25,
                "left": (x1 + c.min()) / 3.25, "top": (y1 + r.min()) / 3.25})
print(json.dumps(out))
