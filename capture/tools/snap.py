"""Quick snapshot for the populated-account capture: snap.py <screen> <state>
Writes capture/data2/<screen>/<state>.png + .xml and prints labelled nodes."""
import io, re, subprocess, sys, os
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1] / "data2"
ENV = {**os.environ, "MSYS_NO_PATHCONV": "1"}
sys.stdout.reconfigure(encoding="utf-8")
def adb(*a):
    return subprocess.run(["adb", *a], capture_output=True, env=ENV).stdout
d = ROOT / sys.argv[1]; d.mkdir(parents=True, exist_ok=True)
png = adb("exec-out", "screencap", "-p"); png = png[png.find(b"\x89PNG"):]
Image.open(io.BytesIO(png)).save(d / f"{sys.argv[2]}.png")
adb("shell", "uiautomator", "dump", "/sdcard/ui.xml")
xml = adb("exec-out", "cat", "/sdcard/ui.xml"); xml = xml[xml.find(b"<?xml"):].decode("utf-8", "replace")
(d / f"{sys.argv[2]}.xml").write_text(xml, encoding="utf-8")
for n in re.finditer(r"<node ([^>]*?)/?>", xml):
    a = dict(re.findall(r'(\S+?)="([^"]*)"', n.group(1)))
    lab = (a.get("content-desc") or a.get("text") or "").replace("&#10;", " | ")
    if lab: print(a.get("bounds"), repr(lab[:160]))
