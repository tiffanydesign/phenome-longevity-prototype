import bars from "./sleepbars.json";
import { CAPTURE_TODAY, REAL_DAYS, addDays, iso, num } from "./index";
import type { Period, Series } from "./series";

/**
 * Sleep charts of the synced account. The app draws one bar per night with data, packed
 * side by side (no gaps for missing nights), labelled "Thu 05" every few bars; W keeps the
 * calendar week (17–23 Nov), and Sleep Consistency always shows the seven nights to 18 Nov.
 *   sleep               score per night (Home ring, days.json)
 *   sleep-hours         % of the 8 h need, read back from the screenshots (sleepbars.json)
 *   sleep-consistency / sleep-efficiency   % read back from the screenshots
 *   sleep-restorative   the app plots total sleep in minutes here (0–600 axis)
 *   sleep-stack         deep (hi) + REM (hi2 stacked on top), minutes
 */
export interface SleepChart {
  s: Series;
  ticks: number[];
  fmt: (v: number) => string;
}

const BARS = bars as unknown as Record<string, Record<string, (number | number[])[]>>;

/** Nights with a sleep reading, oldest first. */
const NIGHTS = Object.keys(REAL_DAYS)
  .filter((k) => (num(REAL_DAYS[k].monitor.sleep) ?? 0) > 0 || (REAL_DAYS[k].sleep ?? 0) > 0)
  .sort();

const dayLabel = (k: string) => {
  const d = new Date(`${k}T12:00`);
  return `${d.toLocaleDateString("en-GB", { weekday: "short" })} ${String(d.getDate()).padStart(2, "0")}`;
};

const pct = (v: number) => String(Math.round(v));
const hrs = (v: number) => `${Math.round(v / 60)}h`;

function packed(keys: string[], values: (number | number[])[], every: number): Series {
  return {
    slots: values.length,
    labels: keys.map((k, i) => ({ i, text: dayLabel(k) })).filter((_, i) => i % every === 0 || i === keys.length - 1),
    marks: values.map((v, i) => (Array.isArray(v) ? { i, lo: 0, hi: v[0], lo2: v[0], hi2: v[0] + v[1] } : { i, lo: 0, hi: v })),
  };
}

export function sleepSeries(id: string, p: Period): SleepChart {
  const tickPct = [0, 25, 50, 75, 100];
  if (p === "W" && id !== "sleep-consistency") {
    // calendar week 17–23 Nov, bars on the nights that have data
    const week = Array.from({ length: 7 }, (_, k) => iso(addDays(CAPTURE_TODAY, k - 6)));
    const src = id === "sleep" ? null : BARS[id]?.W ?? BARS[id]?.[p] ?? [];
    const withData = week.map((k, i) => ({ k, i })).filter(({ k }) => NIGHTS.includes(k));
    const marks = withData
      .map(({ k, i }, n) => {
        const v = id === "sleep" ? REAL_DAYS[k].sleep ?? 0 : src?.[n];
        if (v === undefined) return null;
        return Array.isArray(v) ? { i, lo: 0, hi: v[0], lo2: v[0], hi2: v[0] + v[1] } : { i, lo: 0, hi: v };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
    const labels = week.map((k, i) => ({ i, text: dayLabel(k) }));
    return { s: { slots: 7, labels, marks }, ...axis(id) };
  }
  let values: (number | number[])[];
  if (id === "sleep") values = NIGHTS.map((k) => REAL_DAYS[k].sleep ?? 0);
  else values = BARS[id]?.[p] ?? [];
  if (id === "sleep" && p === "M") values = values.slice(-monthCount());
  const keys = id === "sleep-consistency" ? consistencyNights(values.length) : NIGHTS.slice(-values.length);
  return { s: packed(keys, values, values.length > 10 ? 5 : 1), ...axis(id) };

  function axis(m: string) {
    if (m === "sleep-restorative") return { ticks: [0, 100, 200, 300, 400, 500, 600], fmt: String };
    if (m === "sleep-stack") return { ticks: [0, 60, 120, 180], fmt: hrs };
    return { ticks: m === "sleep" ? tickPct : [0, 20, 40, 60, 80, 100], fmt: pct };
  }
}

/** Nights of the capture month. */
function monthCount() {
  const m = iso(CAPTURE_TODAY).slice(0, 7);
  return NIGHTS.filter((k) => k.startsWith(m)).length;
}

/** Consistency is scored per night over the week before 19 Nov (capture: Thu 12 … Wed 18). */
function consistencyNights(n: number) {
  return Array.from({ length: n }, (_, k) => iso(addDays(new Date(2026, 10, 18, 12), k - n + 1)));
}
