"""Estimate CSS font-size of text in a capture from its ink height.
usage: python -I tests/fontsize.py <ref> "<label>" [cap|x]   — ref like home/top
Finds the XML node by label, measures ink rows (pixels differing from the node's
background) and converts: cap-height ≈ 0.717 em (Helvetica Neue), x-height ≈ 0.517 em."""
import re, sys
from pathlib import Path
import numpy as np
from PIL import Image
sys.stdout.reconfigure(encoding="utf-8")
CAP = Path(__file__).resolve().parents[1] / "capture" / "screens"
ref, label = sys.argv[1], sys.argv[2]
xml = (CAP / f"{ref}.xml").read_text(encoding="utf-8")
m = re.search(r'(?:content-desc|text)="' + re.escape(label) + r'"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml)
if not m:
    sys.exit(f"label not found: {label}")
x1, y1, x2, y2 = map(int, m.groups())
img = np.asarray(Image.open(CAP / f"{ref}.png").convert("L"), dtype=np.int16)[y1:y2, x1:x2]
bg = np.median(np.concatenate([img[0], img[-1]]))
ink = np.abs(img - bg) > 60
rows = np.where(ink.any(axis=1))[0]
cols = np.where(ink.any(axis=0))[0]
h = rows.max() - rows.min() + 1
print(f"{label!r}: box {x1},{y1}-{x2},{y2}  ink h={h}px  w={cols.max()-cols.min()+1}px  "
      f"→ font ≈ {h/3.25/0.717:.1f}px (if caps/ascenders)  ink-left={(x1+cols.min())/3.25:.1f}css top={(y1+rows.min())/3.25:.1f}css")
