import days from "./days.json";
import pages from "./monitor-pages.json";
import intraday from "./intraday.json";
import type { MonitorMetric } from "@/data/home";

/**
 * The captured account after the ring synced (adb capture 23 Nov 2026).
 * days.json      Home, one entry per day that has data (capture/tools/days_json.py)
 * monitor-pages  every Health Monitor metric x period as the app printed it (pages_parse.py)
 * intraday.json  17 Nov D-period charts read back from the screenshots (intraday.py)
 *
 * The prototype's clock stands still at the capture date, and Home opens on Tue 17 Nov:
 * the last full day the ring synced (Thu 19 is half a day, 20-23 are empty).
 */
export const CAPTURE_TODAY = new Date(2026, 10, 23, 11, 20);
export const DEFAULT_DAY = new Date(2026, 10, 17, 12, 0);

export interface RealDay {
  sleep?: number;
  calories?: number;
  steps?: number;
  capacity?: number;
  capacityText?: string;
  monitor: Partial<Record<string, string>>;
}

export const REAL_DAYS = days as unknown as Record<string, RealDay>;

export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export function realDay(d: Date): RealDay | undefined {
  return REAL_DAYS[iso(d)];
}

/** "10,796" → 10796, "7:54" → 7.9, "--" → null */
export function num(s: string | undefined): number | null {
  if (!s) return null;
  const t = s.replace(/[%,\s]/g, "");
  if (/^\d+:\d+$/.test(t)) {
    const [h, m] = t.split(":").map(Number);
    return h + m / 60;
  }
  const v = parseFloat(t);
  return Number.isNaN(v) ? null : v;
}

/** Ring label the way Home prints it: 10.8k, 9.2k, 567, 98 */
export function ringLabel(v: number): string {
  return v >= 1000 ? `${+(v / 1000).toFixed(1)}k` : String(Math.round(v));
}

/** Home monitor rows for one day: same labels/goals as the empty capture, the day's values. */
export function monitorRows(base: MonitorMetric[], day: RealDay | undefined): MonitorMetric[] {
  if (!day) return base;
  return base.map((m) => {
    const v = day.monitor[m.id];
    if (!v) return m;
    // the app prints "98%" for SpO₂ and the value alone elsewhere
    return { ...m, value: v };
  });
}

/* ---------- Health Monitor pages ---------- */

export type PageKind = "vital" | "move" | "sleep";
export interface Pair {
  title: string;
  value: string;
}
export interface VitalPage {
  kind: "vital";
  date: string;
  eyebrow: string;
  value?: string;
  sys?: string;
  dia?: string;
  status?: string;
  desc: string;
  usual: boolean;
  avg?: Pair;
  range?: Pair;
  note?: { title: string; text: string };
  analysis?: string;
  hi?: { value: string; when: string };
  lo?: { value: string; when: string };
  tiles?: [string, string][];
  factors?: [string, string][];
  about?: { title: string; text: string };
}
export interface MovePage {
  kind: "move";
  date: string;
  eyebrow: string;
  value: string;
  goal?: string;
  unit?: string;
  delta?: string;
  desc: string;
  mostDay?: [string, string];
  leastDay?: [string, string];
  compare: { title: string; labels: [string, string]; values: [string, string] };
  month?: { most: [string, string]; least: [string, string] };
  week?: { most: [string, string]; least: [string, string] };
  day?: { dates: [string, string]; values: [string, string] };
  analysis?: string;
  about?: { title: string; text: string };
}
export interface SleepPage {
  kind: "sleep";
  labels: string[];
}
export type RealPage = VitalPage | MovePage | SleepPage;

const PAGES = pages as unknown as Record<string, Record<string, RealPage>>;

export function realPage(metric: string, period: string): RealPage | undefined {
  return PAGES[metric]?.[period];
}

/** Periods the app offers for a metric (the four sleep sub-scores have no D tab). */
export function realPeriods(metric: string): string[] {
  return metric.startsWith("sleep-") ? ["W", "M", "6M", "Y"] : ["D", "W", "M", "6M", "Y"];
}

export const INTRADAY = intraday as unknown as Record<string, number[][]>;
