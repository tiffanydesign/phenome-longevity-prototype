"""Find coloured marks in a chart crop.

bars.py <png> <x0> <y0> <x1> <y1> <hex> [tol]
Prints each run of matching columns: x-centre, top y, bottom y (device px), and the
baseline (lowest bottom). Points (dots, line vertices) show as short runs.
"""
import sys

import numpy as np
from PIL import Image

png, x0, y0, x1, y1, hx = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
tol = int(sys.argv[7]) if len(sys.argv) > 7 else 40
rgb = np.array([int(hx[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.int32)
img = np.asarray(Image.open(png).convert("RGB"), dtype=np.int32)[y0:y1, x0:x1]
mask = np.abs(img - rgb).sum(axis=2) < tol
cols = mask.any(axis=0)
runs, start = [], None
for x, c in enumerate(list(cols) + [False]):
    if c and start is None:
        start = x
    elif not c and start is not None:
        runs.append((start, x - 1))
        start = None
out = []
for a, b in runs:
    ys = np.where(mask[:, a:b + 1].any(axis=1))[0]
    out.append((x0 + (a + b) // 2, y0 + int(ys.min()), y0 + int(ys.max()), b - a + 1))
base = max((o[2] for o in out), default=0)
for o in out:
    print(f"x={o[0]} top={o[1]} bottom={o[2]} w={o[3]} h={base - o[1]}")
print("baseline", base, "runs", len(out))
