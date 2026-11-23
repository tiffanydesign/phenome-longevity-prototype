"""data2/pages_raw.json -> src/data/real/monitor-pages.json (typed page content per metric x period).

Kinds:
  vital  respiratory, bp, spo2, rhr, hr, hrv
  move   steps, calories, distance
  sleep  sleep score + the four sleep sub-metrics (kept as label lists, parsed in TS)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "capture" / "data2" / "pages_raw.json"
OUT = ROOT / "src" / "data" / "real" / "monitor-pages.json"
sys.stdout.reconfigure(encoding="utf-8")

IDS = {
    "respiratory_rate": "respiratory", "blood_pressure": "bp", "blood_oxygen_spo": "spo2",
    "resting_heart_rate": "rhr", "heart_rate": "hr", "heart_rate_variability": "hrv",
    "step_count": "steps", "calories": "calories", "step_distance": "distance",
    "sleep_score": "sleep", "sleep_consistency": "sleep-consistency", "sleep_efficiency": "sleep-efficiency",
    "hours_vs_needs": "sleep-hours", "restorative_sleep": "sleep-restorative",
}
VITAL = {"respiratory", "bp", "spo2", "rhr", "hr", "hrv"}
MOVE = {"steps", "calories", "distance"}
PERIOD_TABS = {"D", "W", "M", "6M", "Y"}


def after(ls, key, n=1, start=0):
    i = ls.index(key, start)
    return ls[i + 1:i + 1 + n] if n > 1 else ls[i + 1]


def has(ls, key):
    return key in ls


def head(ls):
    """Drop the metric name and the period tabs (D W M 6M Y, or W M 6M Y for sleep sub-scores)."""
    body = ls[1:]
    while body and body[0] in PERIOD_TABS:
        body = body[1:]
    return body


def vital(ls, mid):
    b = head(ls)
    p = {"date": b[0], "eyebrow": b[1]}
    i = 2
    if mid == "bp":
        # SYSTOLIC, DIASTOLIC, sys, dia, mmHg, mmHg
        p["sys"], p["dia"] = b[4], b[5]
        i = 8
    else:
        p["value"] = b[2]
        i = 4  # value, unit
    if "range" in b[i] or "Normal" in b[i] or "Low," in b[i] or "Elevated" in b[i]:
        p["status"] = b[i]
        i += 1
    p["desc"] = b[i]
    p["usual"] = "Your Usual Range" in b
    for k, sec in (("avg", "Average"), ("range", "Range")):
        t = next((x for x in b if re.search(rf"· {sec}$", x)), None)
        if t:
            p[k] = {"title": t, "value": b[b.index(t) + 1]}
    if "Daily Changes Are Normal" in b:
        p["note"] = {"title": "Daily Changes Are Normal", "text": after(b, "Daily Changes Are Normal")}
    if "Longevity Analysis" in b:
        p["analysis"] = after(b, "Longevity Analysis")
    if mid == "bp":
        j = b.index("Highest Systolic")
        s = [x for x in b[j:j + 12] if x != "mmHg"]
        p["tiles"] = [[s[0], s[2]], [s[1], s[3]], [s[4], s[6]], [s[5], s[7]]]
    elif "Highest" in b:
        j = b.index("Highest")
        rest = b[j + 2:b.index("Influencing Factors")] if "Influencing Factors" in b else b[j + 2:b.index(next(x for x in b if x.startswith("About ")))]
        vals = [x for x in rest if x != unit_of(b)]
        p["hi"] = {"value": vals[0], "when": vals[2] if len(vals) > 2 else ""}
        p["lo"] = {"value": vals[1], "when": vals[3] if len(vals) > 3 else vals[2] if len(vals) > 2 else ""}
    if "Influencing Factors" in b:
        j = b.index("Influencing Factors")
        p["factors"] = [[b[j + 1 + 2 * k], b[j + 2 + 2 * k]] for k in range(3)]
    ab = next((x for x in b if x.startswith("About ")), None)
    if ab:
        p["about"] = {"title": ab, "text": b[b.index(ab) + 1]}
    return p


def unit_of(b):
    return b[3] if len(b) > 3 else ""


def move(ls, period):
    b = head(ls)
    p = {"date": b[0], "eyebrow": b[1], "value": b[2]}
    i = 3
    if b[i].startswith("/ "):
        p["goal"] = b[i].strip()
        i += 1
    if b[i] in ("kcal", "km"):
        p["unit"] = b[i]
        i += 1
    if re.match(r"^\d+% vs ", b[i]):
        p["delta"] = b[i]
        i += 1
    p["desc"] = b[i]
    if "Most Active Day" in b:
        for k, t in (("mostDay", "Most Active Day"), ("leastDay", "Least Active Day")):
            j = b.index(t)
            p[k] = [x for x in b[j + 1:j + 4] if x not in ("km", "kcal")][:2]
    cmp = next(x for x in b if " vs " in x and not re.match(r"^\d+%", x) and not x.startswith("Most"))
    j = b.index(cmp)
    p["compare"] = {"title": cmp, "labels": b[j + 1:j + 3], "values": b[j + 3:j + 5]}
    for key, name in (("month", "Most vs Least Active Month"), ("week", "Most vs Least Active Week")):
        if name in b:
            j = b.index(name)
            end = b.index("Most vs Least Active Week") if key == "month" else b.index("Most vs Least Active Day")
            sec = [x for x in b[j + 1:end] if x not in ("AVERAGE", "km", "kcal")]
            p[key] = {"most": sec[0:2], "least": sec[2:4]}
    if "Most vs Least Active Day" in b:
        j = b.index("Most vs Least Active Day")
        dates = b[j + 1:j + 3]
        vals = b[j + 3:j + 5]
        # a value equal to a number shown just before is de-duplicated by the screen reader merge
        p["day"] = {"dates": dates, "values": vals}
    if "Longevity Analysis" in b:
        p["analysis"] = after(b, "Longevity Analysis")
    ab = next((x for x in b if x.startswith("About ")), None)
    if ab:
        p["about"] = {"title": ab, "text": b[b.index(ab) + 1]}
    return p


def main():
    raw = json.loads(RAW.read_text(encoding="utf-8"))
    out = {}
    for folder, periods in raw.items():
        mid = IDS[folder]
        for per, ls in periods.items():
            if mid.startswith("sleep-") and per == "D":
                continue  # sub-metrics have no D tab; that capture stepped the year instead
            if mid in VITAL:
                page = {"kind": "vital", **vital(ls, mid)}
            elif mid in MOVE:
                page = {"kind": "move", **move(ls, per)}
            else:
                page = {"kind": "sleep", "labels": head(ls)}
            out.setdefault(mid, {})[per] = page
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(out["respiratory"]["D"], ensure_ascii=False, indent=1)[:1500])
    print(json.dumps(out["steps"]["6M"], ensure_ascii=False)[:1500])


if __name__ == "__main__":
    main()
