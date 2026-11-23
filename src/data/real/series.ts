import ranges from "./ranges.json";
import { CAPTURE_TODAY, INTRADAY, REAL_DAYS, addDays, iso, num } from "./index";

/**
 * Chart series for the synced account's Health Monitor pages.
 *   D        17 Nov intraday points (read back from the screenshots)
 *   W / M    one slot per day ending on the capture date
 *   6M       one slot per week (26), Y one slot per month (13: Nov 25 … Nov 26)
 * Vital range bars come from ranges.json in left-to-right order and are pinned to the slots
 * that hold readings in days.json.
 */
export type Period = "D" | "W" | "M" | "6M" | "Y";

export interface Mark {
  i: number;
  lo: number;
  hi: number;
  /** BP diastolic */
  lo2?: number;
  hi2?: number;
}

export interface Series {
  slots: number;
  labels: { i: number; text: string }[];
  marks: Mark[];
  band?: [number, number];
}

const RANGES = ranges as unknown as Record<string, Record<string, { bars: number[][]; band: number[] | null }>>;

/** Usual range per vital: the monthly chart's band (respiratory read off its D chart). */
const USUAL: Record<string, [number, number]> = {
  respiratory: [14, 16],
  spo2: band("spo2", "M") ?? [97, 98],
  rhr: band("rhr", "M") ?? [49, 51],
  hr: band("hr", "M") ?? [56, 73],
  hrv: band("hrv", "M") ?? [37, 52],
  bp: band("bp", "M") ?? [105, 114],
};
/** BP draws a second band for diastolic (read off the M chart). */
export const BP_DIA_USUAL: [number, number] = [68, 72];

function band(m: string, p: string): [number, number] | undefined {
  const b = RANGES[m]?.[p]?.band;
  return b ? [b[0], b[1]] : undefined;
}

const short = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
const DAY_MS = 86400000;

/** Day keys covered by each slot of a period. */
function slotDays(p: Period): Date[][] {
  const t = CAPTURE_TODAY;
  if (p === "W") return Array.from({ length: 7 }, (_, k) => [addDays(t, k - 6)]);
  if (p === "M") return Array.from({ length: 30 }, (_, k) => [addDays(t, k - 29)]);
  if (p === "6M")
    return Array.from({ length: 26 }, (_, k) => Array.from({ length: 7 }, (_, j) => addDays(t, -7 * (25 - k) - 6 + j)));
  // Y: Nov 25 … Nov 26, one slot per calendar month
  return Array.from({ length: 13 }, (_, k) => {
    const first = new Date(t.getFullYear(), t.getMonth() - 12 + k, 1);
    const n = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    return Array.from({ length: n }, (_, j) => new Date(first.getFullYear(), first.getMonth(), j + 1));
  });
}

export function xLabels(p: Period): { i: number; text: string }[] {
  const t = CAPTURE_TODAY;
  switch (p) {
    case "D":
      return ["12AM", "4AM", "8AM", "12PM", "4PM", "8PM"].map((text, k) => ({ i: k * 4, text }));
    case "W":
      return Array.from({ length: 7 }, (_, k) => ({ i: k, text: addDays(t, k - 6).toLocaleDateString("en-GB", { weekday: "short" }) }));
    case "M":
      return Array.from({ length: 6 }, (_, k) => ({ i: k * 5, text: short(addDays(t, k * 5 - 29)) }));
    case "6M":
      return Array.from({ length: 7 }, (_, k) => ({ i: k * 4, text: short(new Date(t.getTime() - (181 - 28 * k) * DAY_MS)) }));
    case "Y":
      return Array.from({ length: 6 }, (_, k) => {
        const d = new Date(t.getFullYear(), t.getMonth() - 12 + 2 * k, 1);
        return { i: k * 2, text: `${d.toLocaleDateString("en-GB", { month: "short" })} ${String(d.getFullYear()).slice(2)}` };
      });
  }
}

const SLOTS: Record<Period, number> = { D: 24, W: 7, M: 30, "6M": 26, Y: 13 };

function has(metric: string, d: Date): boolean {
  const v = num(REAL_DAYS[iso(d)]?.monitor[metric]);
  return v !== null && v > 0;
}

/** Vitals: dots for D, range bars elsewhere. */
export function vitalSeries(metric: string, p: Period): Series {
  const base = { slots: SLOTS[p], labels: xLabels(p), band: USUAL[metric] };
  if (p === "D") {
    if (metric === "bp") {
      const pts = INTRADAY.bp ?? [];
      return { ...base, marks: pts.map(([i, s, d]) => ({ i, lo: s, hi: s, lo2: d, hi2: d })) };
    }
    return { ...base, marks: (INTRADAY[metric] ?? []).map(([i, v]) => ({ i, lo: v, hi: v })) };
  }
  const bars = RANGES[metric]?.[p]?.bars ?? [];
  const filled = slotDays(p)
    .map((days, i) => ({ i, ok: days.some((d) => has(metric, d)) }))
    .filter((s) => s.ok)
    .map((s) => s.i);
  // more bars than slots with data (older weeks the crawl did not reach): keep the order, end at the last slot
  const slots = filled.length >= bars.length ? filled.slice(filled.length - bars.length) : [...Array(bars.length - filled.length)].map((_, k) => Math.max(0, (filled[0] ?? SLOTS[p]) - bars.length + filled.length + k)).concat(filled);
  return {
    ...base,
    marks: bars.map((b, k) => ({ i: slots[k], lo: b[0], hi: b[1], lo2: b[2], hi2: b[3] })),
  };
}

/** Steps / calories / distance: D hourly bars, W daily bars, M daily line, 6M weekly line, Y empty (as the app). */
export function moveSeries(metric: string, p: Period): Series {
  const base = { slots: SLOTS[p], labels: xLabels(p) };
  if (p === "D") return { ...base, marks: (INTRADAY[metric] ?? []).map(([i, v]) => ({ i, lo: 0, hi: v })) };
  if (p === "Y") return { ...base, marks: [] };
  const marks: Mark[] = [];
  slotDays(p).forEach((days, i) => {
    const vals = days.map((d) => num(REAL_DAYS[iso(d)]?.monitor[metric])).filter((v): v is number => v !== null && v > 0);
    if (vals.length) marks.push({ i, lo: 0, hi: vals.reduce((a, b) => a + b, 0) });
  });
  return { ...base, marks };
}

/** "Nice" axis: 4–6 ticks covering [lo, hi]. */
export function niceTicks(lo: number, hi: number, fromZero = false): number[] {
  const min = fromZero ? 0 : lo;
  const span = Math.max(hi - min, 1e-6);
  const raw = span / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= 5) ?? 10 * mag;
  const start = Math.floor(min / step) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + step * 0.999; v += step) out.push(+v.toFixed(6));
  if (out[out.length - 1] < hi) out.push(+(out[out.length - 1] + step).toFixed(6));
  return out;
}
