"""Sleep charts read back into numbers -> src/data/real/sleepbars.json

main   the first chart of each sleep sub-score page (W/M/6M/Y): purple bars from the baseline.
       Value = bar height / plot height x axis top (100 % or 600 min), the plot being the
       five alternating bands (the top tick sits on the top band edge).
stack  Sleep Score pages: the Deep (purple, bottom) + REM (orange, top) chart under
       "Average Sleep". Scaled so 17 Nov's column equals that night's restorative sleep
       (2:50 = 170 min, capture sleep_score/D).
Bars are listed left to right; the TS side pins them to the slots with sleep data.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from charts import plot_box  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
MON = ROOT / "capture" / "data2" / "mon"
SUBS = {"hours_vs_needs": ("sleep-hours", 100), "sleep_consistency": ("sleep-consistency", 100),
        "sleep_efficiency": ("sleep-efficiency", 100), "restorative_sleep": ("sleep-restorative", 600)}
PURPLE, ORANGE = (0xAF, 0x5E, 0xDC), (0xF0, 0x93, 0x43)


def cols(img, box, rgb, tol=45):
    x0, y0, x1, y1 = box
    m = np.abs(img[y0:y1 + 3, x0:x1].astype(np.int32) - np.array(rgb)).sum(axis=2) < tol
    out, s = [], None
    for x, c in enumerate(list(m.any(axis=0)) + [False]):
        if c and s is None:
            s = x
        elif not c and s is not None:
            if x - s >= 6:
                ys = np.where(m[:, s:x].any(axis=1))[0]
                out.append((x0 + (s + x) / 2, y0 + ys.min(), y0 + ys.max()))
            s = None
    return out


def label_y(xml: Path, text: str):
    x = xml.read_text(encoding="utf-8")
    for n in re.finditer(r"<node ([^>]*?)/?>", x):
        a = dict(re.findall(r'(\S+?)="([^"]*)"', n.group(1)))
        if (a.get("content-desc") or a.get("text")) == text:
            return [int(v) for v in re.findall(r"\d+", a["bounds"])]
    return None


def main():
    res = {}
    for folder, (mid, top) in SUBS.items():
        for per in ("W", "M", "6M", "Y"):
            png = MON / folder / f"{per}_0.png"
            if not png.exists():
                continue
            img = np.asarray(Image.open(png).convert("RGB"))
            box = plot_box(img)
            if not box:
                print("no plot", mid, per)
                continue
            bars = cols(img, box, PURPLE)
            base = max(b[2] for b in bars) if bars else box[3]
            h = base - box[1]
            res.setdefault(mid, {})[per] = [round((base - t) / h * top, 1) for _, t, _ in bars]
            print(mid, per, res[mid][per])
    # Deep + REM stacks on the Sleep Score pages
    for per in ("W", "M", "6M", "Y"):
        for n in range(6):
            png, xml = MON / "sleep_score" / f"{per}_{n}.png", MON / "sleep_score" / f"{per}_{n}.xml"
            if not png.exists():
                break
            leg = label_y(xml, "REM")
            nxt = label_y(xml, "Average Restorative Sleep")
            if not leg or not nxt or nxt[1] - leg[3] < 400:
                continue
            img = np.asarray(Image.open(png).convert("RGB"))
            box = [100, leg[3] + 10, 1230, nxt[1] - 10]
            deep = cols(img, box, PURPLE)
            rem = cols(img, box, ORANGE)
            base = max(d[2] for d in deep)
            pairs = []
            for x, t, _ in deep:
                r = next((q for q in rem if abs(q[0] - x) < 15), None)
                pairs.append((base - t, (t - r[1]) if r else 0))
            res.setdefault("sleep-stack", {})[per] = pairs
            print("stack", per, png.name, len(pairs))
            break
    # scale stacks: W's first column is Tue 17 → 170 min restorative
    w = res.get("sleep-stack", {}).get("W")
    if w:
        k = 170 / (w[0][0] + w[0][1])
        for per, pairs in res["sleep-stack"].items():
            res["sleep-stack"][per] = [[round(d * k), round(r * k)] for d, r in pairs]
    (ROOT / "src" / "data" / "real" / "sleepbars.json").write_text(json.dumps(res), encoding="utf-8")


if __name__ == "__main__":
    main()
