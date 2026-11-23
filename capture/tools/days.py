"""Walk Home back day by day from the selected day, saving data2/days/<n>_<label>.txt (labels of top + 2 scrolls).
days.py <count>"""
import re, subprocess, sys, os, time
from pathlib import Path
ENV = {**os.environ, "MSYS_NO_PATHCONV": "1"}
OUT = Path(__file__).resolve().parents[1] / "data2" / "days"; OUT.mkdir(parents=True, exist_ok=True)
def adb(*a): return subprocess.run(["adb", *a], capture_output=True, env=ENV).stdout
def labels():
    adb("shell", "uiautomator", "dump", "/sdcard/ui.xml")
    x = adb("exec-out", "cat", "/sdcard/ui.xml").decode("utf-8", "replace")
    out = []
    for n in re.finditer(r"<node ([^>]*?)/?>", x):
        a = dict(re.findall(r'(\S+?)="([^"]*)"', n.group(1)))
        l = (a.get("content-desc") or a.get("text") or "").replace("&#10;", " | ")
        if l: out.append((a.get("bounds", ""), l))
    return out
def swipe(y1, y2): adb("shell", "input", "swipe", "640", str(y1), "640", str(y2), "450"); time.sleep(1.0)
start = int(sys.argv[2]) if len(sys.argv) > 2 else 0
for i in range(start, start + int(sys.argv[1])):
    top = labels()
    sel = next((l for b, l in top if b.startswith("[") and ",676]" in b and l and not l.startswith("C")), "?")
    sel = [l for b, l in top if re.match(r"\[\d+,676\]", b)]
    swipe(2100, 900); s1 = labels(); swipe(2100, 1000); s2 = labels()
    lines = [l for _, l in top + s1 + s2]
    seen = []; [seen.append(l) for l in lines if l not in seen]
    (OUT / f"{i:03d}.txt").write_text("\n".join(seen), encoding="utf-8")
    print(i, sel, flush=True)
    swipe(800, 2500); swipe(800, 2500)
    adb("shell", "input", "tap", "136", "709"); time.sleep(2.2)
