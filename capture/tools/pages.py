"""Merge scroll frames of each data2 page into one ordered unique label list: pages.py <glob> <out>"""
import collections
import glob
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
pages: "collections.OrderedDict[tuple[str, str], list[str]]" = collections.OrderedDict()
for f in sorted(glob.glob(sys.argv[1])):
    p = Path(f)
    key = (p.parent.name, re.sub(r"_\d+$", "", p.stem))
    x = p.read_text(encoding="utf-8")
    seen = pages.setdefault(key, [])
    for n in re.finditer(r"<node ([^>]*?)/?>", x):
        a = dict(re.findall(r'(\S+?)="([^"]*)"', n.group(1)))
        lab = (a.get("content-desc") or a.get("text") or "").replace("&#10;", " | ")
        if lab and lab not in ("D", "W", "M", "6M", "Y", "Your Health Monitor") and lab not in seen:
            seen.append(lab)
with open(sys.argv[2], "w", encoding="utf-8") as o:
    for (m, p), ls in pages.items():
        o.write(f"## {m} {p}\n" + "\n".join("  " + lab for lab in ls) + "\n")
