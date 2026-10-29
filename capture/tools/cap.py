"""ADB capture tool for the Phenome Longevity app.

Each capture writes screens/<screen>/<state>.png + .xml, validates the image
(black / FLAG_SECURE / foreign window), and records provenance in progress.json
so an interrupted run can resume.

Usage:
    python -I cap.py shot <screen> <state> [--from S/STATE] [--via TEXT] [--action TEXT] [--note TEXT] [--shot-only REGION ...]
    python -I cap.py tap <desc-regex> [--nth N]      tap a node by content-desc/text
    python -I cap.py nodes                           list labelled nodes on screen
    python -I cap.py todo <screen> <reason>          add a pending item
    python -I cap.py skip <screen> <reason>          mark a pending item as skipped
    python -I cap.py record <name> <seconds> [--then "<adb input ...>"]
    python -I cap.py report                          regenerate PROGRESS.md
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SCREENS = ROOT / "screens"
RECORDINGS = ROOT / "recordings"
PROGRESS = ROOT / "progress.json"
PACKAGE = "com.szalongevity.sza_mobile"
ENV = {**os.environ, "MSYS_NO_PATHCONV": "1"}

sys.stdout.reconfigure(encoding="utf-8")


def adb(*args: str, binary: bool = False) -> bytes | str:
    out = subprocess.run(["adb", *args], capture_output=True, env=ENV).stdout
    return out if binary else out.decode("utf-8", "replace")


def strip_to(data: bytes, magic: bytes) -> bytes:
    """Drop the vendor warning line HyperOS prints before real output."""
    i = data.find(magic)
    return data[i:] if i >= 0 else data


def screencap() -> bytes:
    return strip_to(adb("exec-out", "screencap", "-p", binary=True), b"\x89PNG")


def ui_dump() -> str:
    adb("shell", "uiautomator", "dump", "/sdcard/ui.xml")
    return strip_to(adb("exec-out", "cat", "/sdcard/ui.xml", binary=True), b"<?xml").decode("utf-8", "replace")


def focus() -> str:
    m = re.search(r"mCurrentFocus=Window\{\S+ \S+ ([^}]+)\}", adb("shell", "dumpsys", "window"))
    return m.group(1) if m else "?"


def is_secure() -> bool:
    """True if any app window carries FLAG_SECURE (shown as SECURE in its fl= line)."""
    dump = adb("shell", "dumpsys", "window", "windows")
    for block in re.split(r"\n  Window #\d+ ", dump):
        if PACKAGE in block.split("\n", 1)[0]:
            m = re.search(r"\bfl=([^\n]*)", block)
            if m and re.search(r"\bSECURE\b", m.group(1)):
                return True
    return False


def parse_nodes(xml: str) -> list[dict]:
    nodes = []
    for n in re.finditer(r"<node ([^>]*?)/?>", xml):
        a = dict(re.findall(r'(\S+?)="([^"]*)"', n.group(1)))
        b = [int(v) for v in re.findall(r"\d+", a.get("bounds", ""))]
        a["label"] = (a.get("content-desc") or a.get("text") or "").replace("&#10;", " | ")
        a["box"] = b
        nodes.append(a)
    return nodes


def structure_hash(xml: str) -> str:
    """Hash of labels + classes, ignoring bounds, to detect duplicate screens."""
    sig = "|".join(f"{n.get('class')}:{n['label']}" for n in parse_nodes(xml))
    return hashlib.sha1(sig.encode()).hexdigest()[:12]


def check_image(png: bytes) -> dict:
    img = np.asarray(Image.open(io.BytesIO(png)).convert("RGB"), dtype=np.float32)
    small = img[::8, ::8].reshape(-1, 3)
    return {
        "w": img.shape[1],
        "h": img.shape[0],
        "mean": round(float(img.mean()), 1),
        "std": round(float(img.std()), 1),
        "colors": int(len(np.unique(small.astype(np.uint8), axis=0))),
    }


def load() -> dict:
    if PROGRESS.exists():
        return json.loads(PROGRESS.read_text(encoding="utf-8"))
    return {"package": PACKAGE, "captures": [], "todo": {}, "skipped": {}, "edges": []}


def save(p: dict) -> None:
    p["edges"] = [{"from": c["from"], "to": c["id"], "via": c.get("via"), "action": c.get("action")}
                  for c in p["captures"] if c.get("from")]
    PROGRESS.write_text(json.dumps(p, ensure_ascii=False, indent=2), encoding="utf-8")
    report(p)


def cmd_shot(a: argparse.Namespace) -> None:
    p = load()
    win = focus()
    png, xml = screencap(), ui_dump()
    q = check_image(png)
    secure = is_secure()
    problems = []
    if q["std"] < 3 or q["colors"] < 4:
        problems.append("BLANK_OR_BLACK")
    if secure:
        problems.append("FLAG_SECURE")
    if "mInputShown=true" in adb("shell", "dumpsys", "input_method"):
        problems.append("KEYBOARD_OPEN")
    if PACKAGE not in win:
        problems.append(f"FOREIGN_WINDOW:{win}")

    out = SCREENS / a.screen
    out.mkdir(parents=True, exist_ok=True)
    (out / f"{a.state}.png").write_bytes(png)
    (out / f"{a.state}.xml").write_text(xml, encoding="utf-8")

    h = structure_hash(xml)
    dup = [c["id"] for c in p["captures"] if c["hash"] == h and c["id"] != f"{a.screen}/{a.state}"]
    rec = {
        "id": f"{a.screen}/{a.state}",
        "screen": a.screen,
        "state": a.state,
        "from": a.from_,
        "via": a.via,
        "action": a.action,
        "note": a.note,
        "shot_only": a.shot_only or [],
        "window": win,
        "quality": q,
        "problems": problems,
        "hash": h,
        "duplicate_of": dup,
        "time": datetime.now().isoformat(timespec="seconds"),
    }
    p["captures"] = [c for c in p["captures"] if c["id"] != rec["id"]] + [rec]
    if a.from_:
        edge = {"from": a.from_, "to": rec["id"], "via": a.via, "action": a.action}
        p["edges"] = [e for e in p["edges"] if e["to"] != rec["id"]] + [edge]
    p["todo"].pop(a.screen, None)
    save(p)
    flag = "OK" if not problems else "PROBLEM " + ",".join(problems)
    print(f"[{flag}] {rec['id']} {q} hash={h}" + (f" dup_of={dup}" if dup else ""))


def find_node(regex: str, nth: int) -> dict:
    hits = [n for n in parse_nodes(ui_dump()) if re.search(regex, n["label"], re.I) and len(n["box"]) == 4]
    if len(hits) <= nth:
        sys.exit(f"no node matching {regex!r}")
    return hits[nth]


def cmd_tap(a: argparse.Namespace) -> None:
    n = find_node(a.regex, a.nth)
    x1, y1, x2, y2 = n["box"]
    x, y = (x1 + x2) // 2, (y1 + y2) // 2
    adb("shell", "input", "tap", str(x), str(y))
    print(f"tap {x},{y} -> {n['label'][:60]!r}")


def cmd_nodes(_: argparse.Namespace) -> None:
    print("focus:", focus())
    for n in parse_nodes(ui_dump()):
        if n["label"] or n.get("clickable") == "true" or n.get("scrollable") == "true":
            tag = ("C" if n.get("clickable") == "true" else "-") + ("S" if n.get("scrollable") == "true" else "-")
            print(tag, n["box"], repr(n["label"][:90]))


def cmd_record(a: argparse.Namespace) -> None:
    RECORDINGS.mkdir(exist_ok=True)
    remote = f"/sdcard/{a.name}.mp4"
    proc = subprocess.Popen(["adb", "shell", "screenrecord", "--time-limit", str(a.seconds), remote], env=ENV)
    time.sleep(1.0)
    if a.then:
        subprocess.run(["adb", "shell", *a.then.split()], env=ENV)
    proc.wait()
    time.sleep(1.0)
    adb("pull", remote, str(RECORDINGS / f"{a.name}.mp4"))
    adb("shell", "rm", remote)
    print("saved", RECORDINGS / f"{a.name}.mp4")


def cmd_todo(a: argparse.Namespace) -> None:
    p = load()
    p["todo"][a.screen] = a.reason
    save(p)


def cmd_drop(a: argparse.Namespace) -> None:
    """Forget a capture (e.g. a scroll frame identical to the previous one)."""
    p = load()
    p["captures"] = [c for c in p["captures"] if c["id"] != a.id]
    p["edges"] = [e for e in p["edges"] if e["to"] != a.id]
    for ext in ("png", "xml"):
        (SCREENS / f"{a.id}.{ext}").unlink(missing_ok=True)
    save(p)


def cmd_skip(a: argparse.Namespace) -> None:
    p = load()
    p["todo"].pop(a.screen, None)
    p["skipped"][a.screen] = a.reason
    save(p)


def report(p: dict | None = None) -> None:
    p = p or load()
    lines = ["# Capture progress", "", f"Package: `{p['package']}`", "", "## Captured", "",
             "| id | from | via | problems | shot-only regions |", "|---|---|---|---|---|"]
    for c in p["captures"]:
        lines.append(f"| {c['id']} | {c['from'] or '-'} | {c['via'] or '-'} | "
                     f"{', '.join(c['problems']) or '-'} | {', '.join(c['shot_only']) or '-'} |")
    lines += ["", "## Pending", ""] + [f"- [ ] {k} — {v}" for k, v in p["todo"].items()]
    lines += ["", "## Skipped", ""] + [f"- {k} — {v}" for k, v in p["skipped"].items()]
    (ROOT / "PROGRESS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("shot")
    s.add_argument("screen")
    s.add_argument("state")
    s.add_argument("--from", dest="from_")
    s.add_argument("--via")
    s.add_argument("--action")
    s.add_argument("--note")
    s.add_argument("--shot-only", nargs="*")
    t = sub.add_parser("tap")
    t.add_argument("regex")
    t.add_argument("--nth", type=int, default=0)
    sub.add_parser("nodes")
    for name in ("todo", "skip"):
        x = sub.add_parser(name)
        x.add_argument("screen")
        x.add_argument("reason")
    d = sub.add_parser("drop")
    d.add_argument("id")
    r = sub.add_parser("record")
    r.add_argument("name")
    r.add_argument("seconds", type=int)
    r.add_argument("--then")
    sub.add_parser("report")
    a = ap.parse_args()
    {"shot": cmd_shot, "tap": cmd_tap, "nodes": cmd_nodes, "record": cmd_record,
     "todo": cmd_todo, "skip": cmd_skip, "drop": cmd_drop, "report": lambda _: report()}[a.cmd](a)


if __name__ == "__main__":
    main()
