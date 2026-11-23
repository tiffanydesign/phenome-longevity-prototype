"""Locate the main chart of each data2/mon page and record its geometry in plot fractions.

charts.py -> data2/charts_raw.json
  {metric: {period: {frame, plot:[x0,y0,x1,y1], ticks:[y...], marks:{colour:[[xc,top,bottom,w]...]},
                     band:[top,bottom] | null}}}
All y values are fractions of the plot height measured from the TOP (0 = top band edge, 1 = baseline);
x values are fractions of the plot width. Values are attached later (pages_parse / TS) from the
page's own numbers.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

MON = Path(__file__).resolve().parents[1] / "data2" / "mon"
COLOURS = ["65c466", "f09343", "5aaeca", "925cb1", "af5edc", "9a5cba", "ef4444", "e5484d", "cf4df3"]


def shaded(c):
    r, g, b = c
    return 228 <= r <= 245 and 230 <= g <= 247 and 240 <= b <= 251 and b - r >= 5


def plot_box(img):
    """First run of >=3 alternating shaded bands on the right edge below the header."""
    h = img.shape[0]
    col = [shaded(tuple(img[y, 1205])) for y in range(h)]
    runs, s = [], None
    for y in range(900, h):
        if col[y] and s is None:
            s = y
        elif not col[y] and s is not None:
            if y - s > 40:
                runs.append((s, y - 1))
            s = None
    if s is not None and h - s > 40:
        runs.append((s, h - 1))
    for i in range(len(runs) - 2):
        a, b, c = runs[i:i + 3]
        ha, hb, hc = a[1] - a[0], b[1] - b[0], c[1] - c[0]
        gap1, gap2 = b[0] - a[1], c[0] - b[1]
        if abs(ha - hb) < 12 and abs(hb - hc) < 12 and abs(gap1 - ha) < 20 and abs(gap2 - ha) < 20:
            top, bottom = a[0], c[1]
            # left edge: where the shading starts on the top band row
            row = img[top + 5]
            left = next(x for x in range(60, 400) if shaded(tuple(row[x])) or tuple(row[x]) != (255, 255, 255))
            return [left, top, 1230, bottom]
    return None


def tick_rows(img, box):
    """Rows of grey label text left of the plot (y-axis ticks)."""
    x0, y0, x1, y1 = box
    strip = img[max(0, y0 - 40):y1 + 40, 20:x0 - 4]
    dark = (strip.max(axis=2) < 170).any(axis=1)
    rows, s = [], None
    for i, d in enumerate(list(dark) + [False]):
        if d and s is None:
            s = i
        elif not d and s is not None:
            if i - s > 8:
                rows.append(max(0, y0 - 40) + (s + i) / 2)
            s = None
    return rows


def marks(img, box, hx, tol=40):
    x0, y0, x1, y1 = box
    rgb = np.array([int(hx[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.int32)
    m = np.abs(img[y0 - 30:y1 + 4, x0:x1].astype(np.int32) - rgb).sum(axis=2) < tol
    out = []
    cols = m.any(axis=0)
    s = None
    for x, c in enumerate(list(cols) + [False]):
        if c and s is None:
            s = x
        elif not c and s is not None:
            sub = m[:, s:x]
            ys = np.where(sub.any(axis=1))[0]
            # split vertically separated blobs (BP: systolic over diastolic)
            parts, ps = [], ys[0]
            for a, b in zip(ys, ys[1:]):
                if b - a > 6:
                    parts.append((ps, a))
                    ps = b
            parts.append((ps, ys[-1]))
            for t, u in parts:
                if u - t >= 2:
                    out.append([x0 + (s + x - 1) / 2, y0 - 30 + t, y0 - 30 + u, x - s])
            s = None
    return out


def band(img, box, hx):
    """Usual-range band: rows on the right edge that carry a pale tint of the metric colour."""
    x0, y0, x1, y1 = box
    rgb = np.array([int(hx[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)
    rows = []
    for y in range(y0, y1):
        c = img[y, 1200].astype(np.float32)
        # pale tint: not neutral grey, hue toward the colour
        if c.max() - c.min() > 6 and np.dot(c - c.mean(), rgb - rgb.mean()) > 0 and not shaded(tuple(img[y, 1200])):
            rows.append(y)
    if len(rows) < 6:
        return None
    return [rows[0], rows[-1]]


def main():
    res = {}
    for d in sorted(MON.iterdir()):
        if not d.is_dir():
            continue
        for per in ("D", "W", "M", "6M", "Y"):
            for n in range(3):
                p = d / f"{per}_{n}.png"
                if not p.exists():
                    break
                img = np.asarray(Image.open(p).convert("RGB"))
                box = plot_box(img)
                if not box or box[3] - box[1] < 400 or box[3] > 2690:
                    continue
                found = {}
                for hx in COLOURS:
                    ms = marks(img, box, hx)
                    if ms:
                        found[hx] = ms
                main = max(found, key=lambda k: sum(m[3] * (m[2] - m[1]) for m in found[k])) if found else None
                res.setdefault(d.name, {})[per] = {
                    "frame": p.name, "plot": box, "ticks": tick_rows(img, box), "marks": found,
                    "band": band(img, box, main) if main else None,
                }
                break
    out = MON.parent / "charts_raw.json"
    out.write_text(json.dumps(res, default=float), encoding="utf-8")
    for m, ps in res.items():
        for per, c in ps.items():
            print(m, per, c["frame"], c["plot"], "ticks", len(c["ticks"]), {k: len(v) for k, v in c["marks"].items()}, "band", c["band"])


if __name__ == "__main__":
    main()
