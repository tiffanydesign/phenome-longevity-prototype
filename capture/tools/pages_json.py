"""Turn data2/mon/<metric>/<period>_<n>.xml scroll frames into one label list per page
-> data2/pages_raw.json  {metric: {period: [labels in reading order]}}

Frames overlap; each next frame's leading labels that repeat the tail of the
merged list are dropped (longest overlap wins), so repeated values that really
appear twice on a page survive.
"""
import json
import re
import sys
from pathlib import Path

MON = Path(__file__).resolve().parents[1] / "data2" / "mon"
SKIP = {"Your Health Monitor"}
sys.stdout.reconfigure(encoding="utf-8")


def frame(path: Path) -> list[str]:
    x = path.read_text(encoding="utf-8")
    items = []
    for n in re.finditer(r"<node ([^>]*?)/?>", x):
        a = dict(re.findall(r'(\S+?)="([^"]*)"', n.group(1)))
        lab = (a.get("content-desc") or a.get("text") or "").replace("&#10;", " | ").replace("&amp;", "&").strip()
        b = [int(v) for v in re.findall(r"\d+", a.get("bounds", ""))]
        if not lab or lab in SKIP or len(b) < 4 or b[1] < 300:
            continue
        items.append((b[1], b[0], lab))
    return [lab for _, _, lab in sorted(items)]


def merge(frames: list[list[str]]) -> list[str]:
    out = list(frames[0])
    for f in frames[1:]:
        best = 0
        for k in range(1, min(len(out), len(f)) + 1):
            if out[-k:] == f[:k]:
                best = k
        out += f[best:]
    return out


def main() -> None:
    res: dict = {}
    for d in sorted(MON.iterdir()):
        if not d.is_dir():
            continue
        groups: dict[str, list[Path]] = {}
        for p in d.glob("*.xml"):
            groups.setdefault(p.stem.rsplit("_", 1)[0], []).append(p)
        for period, ps in groups.items():
            ps.sort(key=lambda p: int(p.stem.rsplit("_", 1)[1]))
            res.setdefault(d.name, {})[period] = merge([frame(p) for p in ps])
    out = MON.parent / "pages_raw.json"
    out.write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    print("pages", sum(len(v) for v in res.values()))


if __name__ == "__main__":
    main()
