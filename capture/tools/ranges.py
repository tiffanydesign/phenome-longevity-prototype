"""Read the vitals' W / M / 6M / Y range bars back into numbers -> src/data/real/ranges.json

The chart sits between the description (or the "Your Usual Range" legend) and the next
heading in the frame's XML. Inside it, every blob in the metric colour is a bar; its top /
bottom map to values through the page's own Highest / Lowest (top of the tallest bar =
Highest, bottom of the lowest = Lowest). Resting HR bars rise from the baseline, so only
their tops count. Bars are listed left to right; the TS side pins them to the slots that
have data.

Output: {metric: {period: {"bars": [[lo, hi] | [lo, hi, dlo, dhi] for BP], "band": [lo, hi] | null}}}
"""
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MON = ROOT / "capture" / "data2" / "mon"
PAGES = json.loads((ROOT / "src" / "data" / "real" / "monitor-pages.json").read_text(encoding="utf-8"))
METRICS = {
    "respiratory_rate": ("respiratory", "5aaeca"), "blood_oxygen_spo": ("spo2", "5aaeca"),
    "resting_heart_rate": ("rhr", "65c466"), "heart_rate": ("hr", "65c466"),
    "heart_rate_variability": ("hrv", "65c466"), "blood_pressure": ("bp", "925cb1"),
}


def nodes(xml_path: Path):
    x = xml_path.read_text(encoding="utf-8")
    for n in re.finditer(r"<node ([^>]*?)/?>", x):
        a = dict(re.findall(r'(\S+?)="([^"]*)"', n.group(1)))
        lab = (a.get("content-desc") or a.get("text") or "")
        b = [int(v) for v in re.findall(r"\d+", a.get("bounds", ""))]
        if lab and len(b) == 4:
            yield lab, b


def chart_rows(xml_path: Path):
    """(top, bottom) of the chart area in this frame, or None."""
    top, bottom = None, 2700
    after_desc = False
    for lab, b in sorted(nodes(xml_path), key=lambda t: t[1][1]):
        if lab.startswith("Your Usual Range") or (len(lab) > 80 and not after_desc and "measures" in lab or "reflects" in lab or "tracks" in lab):
            top = b[3]
            after_desc = True
            continue
        if after_desc and b[1] > (top or 0) + 200:
            bottom = b[1]
            break
    return (top, bottom) if top else None


def blobs(img, rows, hx, tol=40):
    y0, y1 = rows
    rgb = np.array([int(hx[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.int32)
    m = np.abs(img[y0:y1, 100:1240].astype(np.int32) - rgb).sum(axis=2) < tol
    out, s = [], None
    cols = m.any(axis=0)
    for x, c in enumerate(list(cols) + [False]):
        if c and s is None:
            s = x
        elif not c and s is not None:
            if x - s >= 10:
                ys = np.where(m[:, s:x].any(axis=1))[0]
                parts, ps = [], ys[0]
                for a, b in zip(ys, ys[1:]):
                    if b - a > 6:
                        parts.append((ps, a))
                        ps = b
                parts.append((ps, ys[-1]))
                out.append([(y0 + t, y0 + u) for t, u in parts if u - t >= 4])
            s = None
    return [b for b in out if b]


def tint_band(img, rows, hx):
    """Rows on the right edge tinted toward the metric colour (neither white nor the grey band)."""
    y0, y1 = rows
    rgb = np.array([int(hx[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)
    hue = rgb - rgb.mean()
    refs = [np.array(r, dtype=np.float32) for r in ((255, 255, 255), (238, 240, 246), (244, 245, 249))]
    ys = []
    for y in range(y0, y1):
        c = img[y, 1150].astype(np.float32)
        dev = min((c - r for r in refs), key=lambda d: np.abs(d).sum())
        if np.abs(dev).sum() > 12 and np.dot(dev - dev.mean(), hue) > 0:
            ys.append(y)
    if len(ys) < 5:
        return None
    # keep the first contiguous run (BP draws a second band for diastolic)
    run = [ys[0]]
    for y in ys[1:]:
        if y - run[-1] > 3:
            break
        run.append(y)
    return (run[0], run[-1]) if len(run) > 4 else None


def val(s: str) -> float:
    return float(s.replace(",", ""))


def main():
    res = {}
    for folder, (mid, hx) in METRICS.items():
        for per in ("W", "M", "6M", "Y"):
            page = PAGES[mid].get(per)
            if not page:
                continue
            for n in range(3):
                png, xml = MON / folder / f"{per}_{n}.png", MON / folder / f"{per}_{n}.xml"
                if not png.exists():
                    break
                rows = chart_rows(xml)
                if not rows:
                    continue
                img = np.asarray(Image.open(png).convert("RGB"))
                bs = blobs(img, rows, hx)
                if not bs:
                    continue
                band = tint_band(img, rows, hx)
                if mid == "bp":
                    t = {k: val(v) for k, v in page["tiles"]}  # noqa
                    sys_ = [b[0] for b in bs]
                    dia = [b[-1] for b in bs]
                    def cal(group, hi, lo):
                        top = min(g[0] for g in group)
                        bot = max(g[1] for g in group)
                        return lambda y: round(lo + (bot - y) / (bot - top) * (hi - lo), 1)
                    fs = cal(sys_, t["Highest Systolic"], t["Lowest Systolic"])
                    fd = cal(dia, t["Highest Diastolic"], t["Lowest Diastolic"])
                    bars = [[fs(s[1]), fs(s[0]), fd(d[1]), fd(d[0])] for s, d in zip(sys_, dia)]
                    bandv = None
                    if band:  # two bands; keep the systolic one in systolic units
                        bandv = [fs(band[1]), fs(band[0])]
                else:
                    hi, lo = val(page["hi"]["value"]), val(page["lo"]["value"])
                    flat = [(b[0][0], b[-1][1]) for b in bs]
                    if mid == "rhr" and per != "D":
                        tops = [f[0] for f in flat]
                        top, bot = min(tops), max(tops)
                        f = (lambda y: hi) if top == bot else (lambda y: round(lo + (bot - y) / (bot - top) * (hi - lo), 1))
                        bars = [[f(t), f(t)] for t in tops]
                        bandv = None
                        if band and top != bot:
                            bandv = [f(band[1]), f(band[0])]
                    else:
                        top = min(f[0] for f in flat)
                        bot = max(f[1] for f in flat)
                        f = lambda y: round(lo + (bot - y) / (bot - top) * (hi - lo), 1)  # noqa: E731
                        bars = [[f(b), f(t)] for t, b in flat]
                        bandv = [f(band[1]), f(band[0])] if band else None
                res.setdefault(mid, {})[per] = {"bars": bars, "band": bandv}
                print(mid, per, png.name, len(bars), bars[:3], "band", bandv)
                break
    out = ROOT / "src" / "data" / "real" / "ranges.json"
    out.write_text(json.dumps(res), encoding="utf-8")


if __name__ == "__main__":
    main()
