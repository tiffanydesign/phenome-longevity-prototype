"""Step the D period until its date reads <day> Nov 2026: prev.py <day>"""
import re, subprocess, sys, os, time
ENV = {**os.environ, "MSYS_NO_PATHCONV": "1"}
def adb(*a): return subprocess.run(["adb", *a], capture_output=True, env=ENV).stdout
want = int(sys.argv[1])
for _ in range(25):
    adb("shell", "uiautomator", "dump", "/sdcard/ui.xml")
    x = adb("exec-out", "cat", "/sdcard/ui.xml").decode("utf-8", "replace")
    arrows, cur = [], None
    for n in re.finditer(r"<node ([^>]*?)/?>", x):
        a = dict(re.findall(r'(\S+?)="([^"]*)"', n.group(1)))
        b = [int(v) for v in re.findall(r"\d+", a.get("bounds", ""))]
        if len(b) == 4 and 740 < b[1] < 800:
            if a.get("clickable") == "true": arrows.append(b)
            m = re.search(r"(\d+) Nov 2026", a.get("content-desc", ""))
            if m: cur = int(m.group(1))
    if cur is None: cur = 23  # "TODAY, 23 Nov" also matches; fallback
    if cur == want: print("at", cur); break
    arrows.sort()
    b = arrows[0] if cur > want else arrows[-1]
    adb("shell", "input", "tap", str((b[0]+b[2])//2), str((b[1]+b[3])//2)); time.sleep(1.6)
