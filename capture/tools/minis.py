"""Trace the small charts inside the movement cards -> src/data/real/minis.json

Cards (M / 6M / Y pages of steps, calories, distance):
  "Most vs Least Active Month" / "Most vs Least Active Week": bars on the right half
      -> [[x, top, bottom, colour]] with x / y as fractions of the card's chart box
  "Most vs Least Active Day": two cumulative lines (most = green, least = red)
      -> {"most": [[x, y]...], "least": [[x, y]...]} fractions of the plot box
A card is read from the first frame that shows it whole (title to the next title).
"""
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MON = ROOT / "capture" / "data2" / "mon"
IDS = {"step_count": "steps", "calories": "calories", "step_distance": "distance"}
GREEN, RED, GREY = (0x65, 0xC4, 0x66), (0xEB, 0x4E, 0x3D), (0xB3, 0xB3, 0xB3)
TITLES = ["Most vs Least Active Month", "Most vs Least Active Week", "Most vs Least Active Day"]


def labels(xml: Path):
    x = xml.read_text(encoding="utf-8")
    out = []
    for n in re.finditer(r"<node ([^>]*?)/?>", x):
        a = dict(re.findall(r'(\S+?)="([^"]*)"', n.group(1)))
        lab = a.get("content-desc") or a.get("text") or ""
        b = [int(v) for v in re.findall(r"\d+", a.get("bounds", ""))]
        if lab and len(b) == 4:
            out.append((lab, b))
    return out


def card_box(ls, title):
    """(top, bottom) of the card whose title is `title`, if the next heading is also in frame."""
    t = next((b for l, b in ls if l == title), None)
    if not t:
        return None
    later = sorted(b[1] for l, b in ls if (l in TITLES or l.startswith("About ")) and b[1] > t[1] + 50)
    if not later:
        return None
    return t[1], later[0]


def mask(img, rgb, tol=30):
    return np.abs(img.astype(np.int32) - np.array(rgb)).sum(axis=2) < tol


def bars(img, top, bottom):
    x0, x1 = 560, 1200
    crop = img[top:bottom, x0:x1]
    out = []
    for name, rgb in (("grey", GREY), ("green", GREEN), ("red", RED)):
        m = mask(crop, rgb)
        cols = m.any(axis=0)
        s = None
        for x, c in enumerate(list(cols) + [False]):
            if c and s is None:
                s = x
            elif not c and s is not None:
                if x - s >= 4:
                    ys = np.where(m[:, s:x].any(axis=1))[0]
                    # split into vertical pieces (title anti-aliasing above, axis label below)
                    ps = ys[0]
                    for a, b in list(zip(ys, ys[1:])) + [(ys[-1], None)]:
                        if b is None or b - a > 4:
                            if a - ps >= 2:
                                out.append([(s + x) / 2 / (x1 - x0), ps / (bottom - top), a / (bottom - top), name])
                            ps = b
                s = None
    # keep columns standing on the shared baseline; title / axis text anti-aliasing is grey too
    base = max((o[2] for o in out if o[3] != "grey"), default=None)
    if base is None:
        return []
    keep = []
    for x, t, b, c in out:
        if abs(b - base) < 0.02 and t < base - 0.004:
            keep.append([round(x, 4), round(t, 4), round(base, 4), c])
    return sorted(keep)


def lines(img, top, bottom):
    x0, x1 = 90, 1200
    crop = img[top:bottom, x0:x1]
    res = {}
    for name, rgb in (("most", GREEN), ("least", RED)):
        m = mask(crop, rgb, 60)
        # the value text sits in the card's upper third; the plot is below it
        m[: int((bottom - top) * 0.38)] = False
        pts = []
        for x in range(0, x1 - x0, 6):
            ys = np.where(m[:, x])[0]
            if len(ys):
                pts.append([round(x / (x1 - x0), 4), round(float(ys.mean()) / (bottom - top), 4)])
        res[name] = pts
    return res


def main():
    out = {}
    for folder, mid in IDS.items():
        for per in ("M", "6M", "Y"):
            got = {}
            for n in range(6):
                png, xml = MON / folder / f"{per}_{n}.png", MON / folder / f"{per}_{n}.xml"
                if not png.exists():
                    break
                ls = labels(xml)
                img = None
                for title in TITLES:
                    if title in got:
                        continue
                    box = card_box(ls, title)
                    if not box:
                        continue
                    img = img if img is not None else np.asarray(Image.open(png).convert("RGB"))
                    key = title.split()[-1].lower()  # month / week / day
                    got[title] = True
                    out.setdefault(mid, {}).setdefault(per, {})[key] = (
                        lines(img, *box) if key == "day" else bars(img, *box)
                    )
            print(mid, per, {k: len(v) for k, v in out.get(mid, {}).get(per, {}).items()})
    (ROOT / "src" / "data" / "real" / "minis.json").write_text(json.dumps(out), encoding="utf-8")


if __name__ == "__main__":
    main()
