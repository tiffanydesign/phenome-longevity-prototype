"""Score prototype shots against device captures and write side-by-side review images.

Called by tests/compare.mjs with a JSON list of {name, ref}. For each case writes
tests/out/side/<name>.png (capture | prototype | diff heat) and writes
tests/out/report/<name>.json. Score = mean absolute luminance difference (0–255) on a
160×347 downsample, status bar excluded; < 12 ≈ close, > 25 ≈ visibly off.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[1]
CAP = ROOT / "capture" / "screens"
OUT = ROOT / "tests" / "out"
STATUS_PX = 143  # 44 CSS px × 3.25


def load(path: Path) -> Image.Image:
    return Image.open(path).convert("RGB").resize((1280, 2772))


def score(a: Image.Image, b: Image.Image) -> tuple[float, float]:
    ga = np.asarray(a.crop((0, STATUS_PX, 1280, 2772)).convert("L").resize((160, 330)), dtype=np.float32)
    gb = np.asarray(b.crop((0, STATUS_PX, 1280, 2772)).convert("L").resize((160, 330)), dtype=np.float32)
    d = np.abs(ga - gb)
    return float(d.mean()), float((d > 40).mean() * 100)


def side(name: str, a: Image.Image, b: Image.Image) -> None:
    w, h = 400, 866
    sa, sb = a.resize((w, h)), b.resize((w, h))
    heat = ImageOps.autocontrast(Image.fromarray(np.abs(np.asarray(sa, np.int16) - np.asarray(sb, np.int16)).astype(np.uint8)).convert("L"))
    canvas = Image.new("RGB", (w * 3 + 20, h), "white")
    canvas.paste(sa, (0, 0))
    canvas.paste(sb, (w + 10, 0))
    canvas.paste(ImageOps.colorize(heat, "black", "red"), (2 * w + 20, 0))
    (OUT / "side").mkdir(parents=True, exist_ok=True)
    canvas.save(OUT / "side" / f"{name}.png")


def main() -> None:
    cases = json.loads(sys.argv[1])
    (OUT / "report").mkdir(parents=True, exist_ok=True)
    for c in cases:
        ref = CAP / f"{c['ref']}.png"
        if not ref.exists():
            alt = CAP / f"{c['ref']}_from_video.png"
            ref = alt if alt.exists() else ref
        shot = OUT / "proto" / f"{c['name']}.png"
        if not ref.exists() or not shot.exists():
            print(f"  ! missing {ref if not ref.exists() else shot}")
            continue
        a, b = load(ref), load(shot)
        mean, pct = score(a, b)
        side(c["name"], a, b)
        row = {"name": c["name"], "ref": c["ref"], "score": round(mean, 1), "pct_px_off": round(pct, 1)}
        (OUT / "report" / f"{c['name']}.json").write_text(json.dumps(row), encoding="utf-8")
        flag = "OK " if mean < 12 else ("~  " if mean < 25 else "BAD")
        print(f"{flag} {c['name']:<34} score {mean:5.1f}  off {pct:4.1f}%")


if __name__ == "__main__":
    main()
