"""data2/days/NNN.txt (Home, one file per day walking back from 19 Nov 2026) -> src/data/real/days.json

{ "2026-11-19": { sleep, calories, steps, capacity, capacityText,
                  monitor: { steps, calories, distance, respiratory, spo2, bp, rhr, hr, hrv, sleep } } }
Monitor values keep the app's own strings ("2,717", "113 / 73", "7:17").
Days whose rings and monitor are all empty are left out.
"""
import json
import re
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DAYS = ROOT / "capture" / "data2" / "days"
OUT = ROOT / "src" / "data" / "real" / "days.json"
START = date(2026, 11, 19)
sys.stdout.reconfigure(encoding="utf-8")

ROWS = {
    "Step Count": "steps", "Calories": "calories", "Step Distance": "distance", "Respiratory Rate": "respiratory",
    "Blood Oxygen (SpO₂)": "spo2", "Blood Pressure": "bp", "Resting Heart Rate": "rhr", "Heart Rate": "hr",
    "Heart Rate Variability": "hrv", "Hours of Sleep": "sleep",
}


def ring(v: str) -> float:
    v = v.strip()
    return float(v[:-1]) * 1000 if v.endswith("k") else float(v)


def parse(lines: list[str]) -> dict:
    d: dict = {"monitor": {}}
    for l in lines:
        parts = [p.strip() for p in l.split("|")]
        if len(parts) >= 2 and parts[-1] == "Sleep":
            d["sleep"] = ring(parts[0])
        elif len(parts) >= 3 and parts[-1] == "Calories" and parts[1] == "kcal":
            d["calories"] = ring(parts[0])
        elif len(parts) == 2 and parts[1] == "Steps":
            d["steps"] = ring(parts[0])
        elif len(parts) >= 2 and parts[1] == "Capacity":
            d["capacity"] = ring(parts[0])
            d["capacityText"] = parts[2] if len(parts) > 2 else ""
        elif parts[0] in ROWS and len(parts) >= 2:
            d["monitor"][ROWS[parts[0]]] = parts[1]
    return d


def empty(d: dict) -> bool:
    rings = [d.get(k, 0) for k in ("sleep", "calories", "steps")]
    mon = [v for v in d["monitor"].values() if not re.fullmatch(r"[-0. /:%]*", v)]
    return not any(rings) and not mon


def main() -> None:
    out = {}
    for f in sorted(DAYS.glob("*.txt")):
        i = int(f.stem)
        d = parse(f.read_text(encoding="utf-8").splitlines())
        if not empty(d):
            out[(START - timedelta(days=i)).isoformat()] = d
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(dict(sorted(out.items())), ensure_ascii=False, indent=0), encoding="utf-8")
    print(len(out), "days with data:", ", ".join(k[5:] for k in sorted(out)))


if __name__ == "__main__":
    main()
