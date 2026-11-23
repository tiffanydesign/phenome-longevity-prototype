"""Read the D-period charts of 17 Nov back into numbers -> data2/intraday.json.

Bars (steps, calories, distance) are scaled so they sum to the day's total.
Dots (vitals) are scaled so the highest / lowest dot equal the page's Highest / Lowest.
x is the hour of day (float): hour h sits at x = 164 + 44.7 h on the 1280-px frame.
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

MON = Path(__file__).resolve().parents[1] / "data2" / "mon"
X0, DX = 164, 44.7


def mask_of(png: str, hx: str, box=(100, 1640, 1230, 2486), tol=40):
    rgb = np.array([int(hx[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.int32)
    img = np.asarray(Image.open(png).convert("RGB"), dtype=np.int32)
    x0, y0, x1, y1 = box
    return np.abs(img[y0:y1, x0:x1] - rgb).sum(axis=2) < tol, x0, y0


def runs(flags):
    out, s = [], None
    for i, f in enumerate(list(flags) + [False]):
        if f and s is None:
            s = i
        elif not f and s is not None:
            out.append((s, i - 1))
            s = None
    return out


def blobs(png, hx, **kw):
    """(x_centre, y_centre, top, bottom) for every vertical blob in every column run."""
    m, x0, y0 = mask_of(png, hx, **kw)
    out = []
    for a, b in runs(m.any(axis=0)):
        for t, u in runs(m[:, a:b + 1].any(axis=1)):
            if u - t < 3:
                continue
            out.append((x0 + (a + b) / 2, y0 + (t + u) / 2, y0 + t, y0 + u))
    return out


def hour(x):
    return round((x - X0) / DX, 2)


def bars(png, hx, total, digits=0):
    bs = blobs(png, hx)
    base = max(b[3] for b in bs)
    hs = [(hour(b[0]), base - b[2] + 1) for b in bs]
    k = total / sum(h for _, h in hs)
    return [[x, round(h * k, digits) if digits else round(h * k)] for x, h in hs]


def dots(png, hx, hi, lo, digits=1):
    ds = blobs(png, hx)
    ys = [d[1] for d in ds]
    top, bot = min(ys), max(ys)
    val = (lambda y: hi) if top == bot else (lambda y: lo + (bot - y) / (bot - top) * (hi - lo))
    return [[hour(d[0]), round(val(d[1]), digits)] for d in ds]


def bp(png):
    """Filled dots = systolic (upper cloud), rings = diastolic (lower cloud)."""
    ds = blobs(png, "925cb1")
    mid = (min(d[1] for d in ds) + max(d[1] for d in ds)) / 2
    sys_ = [d for d in ds if d[1] < mid]
    dia = [d for d in ds if d[1] >= mid]

    def scale(group, hi, lo):
        ys = [d[1] for d in group]
        t, b = min(ys), max(ys)
        return {round(hour(d[0])): round(lo + (b - d[1]) / (b - t) * (hi - lo)) for d in group}

    s, d = scale(sys_, 125, 100), scale(dia, 77, 61)
    return [[h, s[h], d.get(h)] for h in sorted(s)]


def main():
    f = lambda m: str(MON / m / "D_0.png")  # noqa: E731
    out = {
        "steps": bars(f("step_count"), "65c466", 10796),
        "calories": bars(f("calories"), "f09343", 567),
        "distance": bars(f("step_distance"), "65c466", 7.27, 2),
        "respiratory": dots(f("respiratory_rate"), "5aaeca", 22.0, 13.0),
        "spo2": dots(f("blood_oxygen_spo"), "5aaeca", 99.0, 95.0),
        "rhr": dots(f("resting_heart_rate"), "65c466", 49, 49, 0),
        "hr": dots(f("heart_rate"), "65c466", 134, 49, 0),
        "hrv": dots(f("heart_rate_variability"), "65c466", 73.0, 22.0),
        "bp": bp(f("blood_pressure")),
    }
    # bars sit on whole hours; dots come one per hour, so their rank is the hour
    for k in ("steps", "calories", "distance"):
        out[k] = [[round(x), v] for x, v in out[k]]
    for k in ("respiratory", "spo2", "rhr", "hr", "hrv"):
        out[k] = [[i, v] for i, (_, v) in enumerate(out[k])]
    path = MON.parents[2] / "src" / "data" / "real" / "intraday.json"
    path.write_text(json.dumps(out), encoding="utf-8")
    for k, v in out.items():
        print(k, len(v), v[:4])


if __name__ == "__main__":
    main()
