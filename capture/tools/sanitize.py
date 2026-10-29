"""Redact account-sensitive data in capture/ before it is committed.

- personal e-mail → tiffany@example.com (XML/TXT/JSON) and painted out in PNGs (box from XML bounds)
- internal API host → api.example.com (text) and painted out in offline/reports.png
Files that cannot be meaningfully redacted are excluded via .gitignore instead
(report_pdf/*, meal_camera/*, booking distance states). Idempotent.

usage: python -I capture/tools/sanitize.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
# the real values live in tools/.sensitive.json (git-ignored) so they never enter the repo
_SECRET = json.loads((Path(__file__).with_name(".sensitive.json")).read_text(encoding="utf-8"))
EMAIL = _SECRET["email"]
HOST = _SECRET["host"]
TEXT_SWAPS = {EMAIL: "tiffany@example.com", HOST: "api.example.com"}

sys.stdout.reconfigure(encoding="utf-8")


def paint_out(png: Path, xml_text: str, needle: str) -> int:
    """Fill the bounds of every node whose label contains `needle` with its local background."""
    boxes = []
    for node in re.finditer(r"<node ([^>]*)>", xml_text):
        attrs = dict(re.findall(r'(\S+?)="([^"]*)"', node.group(1)))
        label = attrs.get("text", "") + " " + attrs.get("content-desc", "")
        b = re.findall(r"\d+", attrs.get("bounds", ""))
        if needle in label and len(b) == 4:
            boxes.append(tuple(int(v) for v in b))
    if not boxes:
        return 0
    img = Image.open(png).convert("RGB")
    px = img.load()
    draw = ImageDraw.Draw(img)
    for x1, y1, x2, y2 in boxes:
        if needle in (EMAIL, TEXT_SWAPS[EMAIL]) and (y2 - y1) > 120:
            # multi-line card (avatar | name / e-mail | arrow): blank only the last ink band of the text column.
            # Only on the first pass (XML still holds the real address) — afterwards the last band is the name.
            if needle != EMAIL:
                continue
            cx1, cx2 = x1 + int((x2 - x1) * 0.2), x2 - int((x2 - x1) * 0.12)
            ref = px[cx1, y1 + 14]
            ink = [y for y in range(y1 + 10, y2 - 10)
                   if any(sum(abs(a - b) for a, b in zip(px[x, y], ref)) > 60 for x in range(cx1, cx2, 2))]
            bands, start = [], ink[0]
            for a, b in zip(ink, ink[1:]):
                if b - a > 6:
                    bands.append((start, a))
                    start = b
            bands.append((start, ink[-1]))
            e0, e1 = bands[-1]
            for x in range(cx1, cx2):
                c = px[x, e0 - 8]
                for y in range(e0 - 4, e1 + 5):
                    px[x, y] = c
            continue
        bg = img.getpixel((max(x1 - 2, 0), y1 + 2))
        draw.rectangle((x1, y1, x2, y2), fill=bg)
    img.save(png)
    return len(boxes)


def main() -> None:
    painted = 0
    for xml in ROOT.glob("screens/**/*.xml"):
        text = xml.read_text(encoding="utf-8")
        png = xml.with_suffix(".png")
        # also match the already-swapped placeholders so a re-run still paints the PNGs
        for needle in (EMAIL, HOST, *TEXT_SWAPS.values()):
            if needle in text and png.exists():
                painted += paint_out(png, text, needle)
        for a, b in TEXT_SWAPS.items():
            text = text.replace(a, b)
        xml.write_text(text, encoding="utf-8")
    for f in list(ROOT.glob("screens/**/*.txt")) + [ROOT / "progress.json", ROOT / "PROGRESS.md"]:
        if f.exists():
            t = f.read_text(encoding="utf-8")
            for a, b in TEXT_SWAPS.items():
                t = t.replace(a, b)
            f.write_text(t, encoding="utf-8")
    print(f"painted {painted} regions; text swaps applied")


if __name__ == "__main__":
    main()
