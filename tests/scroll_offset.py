"""Print the CSS-px scroll offset of every scroll_N capture of a screen, relative to its `top`.

usage: python -I tests/scroll_offset.py <screen>      e.g. home
Chains top → scroll_1 → scroll_2 … and, for each consecutive pair, uses labels
present in both XML dumps to measure how far the content moved.
"""
import re
import sys
from pathlib import Path

CAP = Path(__file__).resolve().parents[1] / "capture" / "screens"


def labels(xml: str) -> dict[str, int]:
    out: dict[str, int] = {}
    for m in re.finditer(r'(?:content-desc|text)="([^"]{3,})"[^>]*?bounds="\[\d+,(\d+)\]\[\d+,(\d+)\]"', xml):
        lab, y1, y2 = m.group(1), int(m.group(2)), int(m.group(3))
        if y2 - y1 > 20 and lab not in out and y1 > 340 and y2 < 2480:  # skip clipped / nav items
            out[lab] = y1
    return out


def main() -> None:
    screen = sys.argv[1]
    names = ["top"] + sorted((p.stem for p in (CAP / screen).glob("scroll_*.xml")), key=lambda s: int(s.split("_")[1]))
    total = 0.0
    prev = labels((CAP / screen / "top.xml").read_text(encoding="utf-8"))
    print(f"{screen}/top 0")
    for n in names[1:]:
        cur = labels((CAP / screen / f"{n}.xml").read_text(encoding="utf-8"))
        deltas = sorted(prev[k] - cur[k] for k in prev.keys() & cur.keys())
        if not deltas:
            print(f"{screen}/{n} ? (no shared labels)")
            prev = cur
            continue
        total += deltas[len(deltas) // 2] / 3.25
        print(f"{screen}/{n} {round(total)}")
        prev = cur


if __name__ == "__main__":
    main()
