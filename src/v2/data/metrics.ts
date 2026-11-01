/**
 * The one table the redesign reads. Every number in the app is a row here, and
 * every row names the organ it belongs to. That `organ` field is the link
 * between the health data and the twin: a card, a chart and a body region are
 * three views of the same row, so they cannot disagree.
 *
 * DEMO values: wearables follow src/data/home.ts, scan results follow
 * phenome-twin-mobile.html. Nothing here comes from a real member.
 */
export type Source = "ring" | "band" | "clinic" | "omics" | "log";
export type Status = "optimal" | "normal" | "monitor";
export type Field = "capacity" | "activity" | "sleep" | "vitals" | "heart" | "body" | "food" | "habit" | "omics" | "plain";
export type OrganId = "brain" | "thyroid" | "lungs" | "heart" | "liver" | "gut" | "kidneys" | "bone" | "skin" | "immune";
export type Tab = "all" | "activity" | "sleep" | "vitals" | "body" | "food";

export interface Metric {
  id: string;
  label: string;
  value: string;
  unit: string;
  /** centre of the demo series and the number scrubbing reads back */
  base: number;
  /** day-to-day swing of the demo series */
  swing: number;
  decimals?: number;
  source: Source;
  when: string;
  status: Status;
  /** comparison shown beside the value */
  delta: string;
  organ: OrganId;
  tab: Tab;
  field: Field;
  chart: "line" | "bars" | "scan";
  /** healthy band drawn on the chart */
  band?: [number, number];
  /** clinic rows: first scan, second scan */
  scans?: [number, number];
  /** percentile among the 10,000-member cohort, clinic rows only */
  cohort?: number;
  note: string;
}

export const SOURCE_LABEL: Record<Source, string> = {
  ring: "Ring",
  band: "Band",
  clinic: "Clinic scan",
  omics: "Omics",
  log: "Your log",
};

export const STATUS_LABEL: Record<Status, string> = { optimal: "Optimal", normal: "In range", monitor: "Monitor" };

const ring = (when = "6 min ago") => ({ source: "ring" as const, when });
const band = (when = "6 min ago") => ({ source: "band" as const, when });
const clinic = { source: "clinic" as const, when: "14 Jul", chart: "scan" as const };

const LIST: Metric[] = [
  { id: "rhr", label: "Resting heart rate", value: "58", unit: "bpm", base: 59, swing: 2, ...ring("overnight"), status: "optimal", delta: "−3 on yesterday", organ: "heart", tab: "vitals", field: "heart", chart: "line", band: [50, 64], note: "Within 3 bpm all week. Lower resting rates usually follow better recovery." },
  { id: "hr", label: "Heart rate", value: "72", unit: "bpm", base: 70, swing: 12, ...ring(), status: "normal", delta: "58–112 today", organ: "heart", tab: "vitals", field: "heart", chart: "line", band: [55, 100], note: "Daytime rate tracks your activity. The peak at 11:00 matches your walk." },
  { id: "hrv", label: "Heart rate variability", value: "48", unit: "ms", base: 46, swing: 5, ...ring("overnight"), status: "optimal", delta: "+4 on yesterday", organ: "heart", tab: "vitals", field: "vitals", chart: "line", band: [40, 60], note: "Overnight mean. Your 7-day average is 46 ms, and this is the third night it has risen." },
  { id: "bp", label: "Blood pressure", value: "118/76", unit: "mmHg", base: 118, swing: 5, ...band("this morning"), status: "normal", delta: "124/74 at clinic", organ: "heart", tab: "vitals", field: "vitals", chart: "line", band: [100, 125], note: "Band readings are estimates. Your clinic cuff reading is the reference." },
  { id: "spo2", label: "Blood oxygen", value: "97", unit: "%", base: 97, swing: 1, ...ring("overnight mean"), status: "normal", delta: "95–99 overnight", organ: "lungs", tab: "vitals", field: "vitals", chart: "line", band: [95, 100], note: "Steady through the night, with no dips below 95%." },
  { id: "resp", label: "Respiratory rate", value: "14", unit: "/ min", base: 14, swing: 1, ...ring("overnight"), status: "normal", delta: "Usual for you", organ: "lungs", tab: "vitals", field: "vitals", chart: "line", band: [12, 18], note: "Your breathing rate at rest sits in the middle of your normal range." },
  { id: "capacity", label: "Capacity", value: "72", unit: "/ 100", base: 68, swing: 8, ...ring(), status: "optimal", delta: "+6 on yesterday", organ: "heart", tab: "vitals", field: "capacity", chart: "line", band: [60, 85], note: "Recovery is keeping up with recent load. A good day to train or stay active." },

  { id: "sleep", label: "Sleep", value: "7:24", unit: "h", base: 7.2, swing: 0.6, decimals: 1, ...ring("last night"), status: "optimal", delta: "24 min over goal", organ: "brain", tab: "sleep", field: "sleep", chart: "bars", band: [7, 9], note: "You fell asleep within 14 minutes and woke once." },
  { id: "deep", label: "Deep sleep", value: "1:04", unit: "h", base: 1.1, swing: 0.2, decimals: 1, ...ring("last night"), status: "normal", delta: "15% of the night", organ: "brain", tab: "sleep", field: "sleep", chart: "bars", band: [1, 1.8], note: "Deep sleep came early in the night, as it should." },
  { id: "temp", label: "Skin temperature", value: "−0.2", unit: "°C", base: -0.1, swing: 0.2, decimals: 1, ...ring("last night"), status: "normal", delta: "Against your baseline", organ: "brain", tab: "sleep", field: "sleep", chart: "line", band: [-0.4, 0.4], note: "Changes in skin temperature are linked to restful sleep. Yours moved normally overnight." },

  { id: "steps", label: "Steps", value: "6,482", unit: "/ 8,000", base: 7200, swing: 2600, ...band(), status: "normal", delta: "81% of goal", organ: "bone", tab: "activity", field: "activity", chart: "bars", band: [8000, 12000], note: "1,518 steps left. A 15-minute walk closes the gap." },
  { id: "kcal", label: "Active calories", value: "164", unit: "/ 200 kcal", base: 180, swing: 60, ...band(), status: "normal", delta: "82% of goal", organ: "heart", tab: "activity", field: "activity", chart: "bars", band: [200, 320], note: "Calories burned through movement, on top of your resting rate." },
  { id: "distance", label: "Distance", value: "4.12", unit: "km", base: 4.6, swing: 1.6, decimals: 2, ...band(), status: "normal", delta: "Goal 5.00 km", organ: "bone", tab: "activity", field: "activity", chart: "bars", band: [5, 8], note: "Walking and running combined." },
  { id: "workouts", label: "Workouts this week", value: "3", unit: "sessions", base: 3, swing: 2, source: "log", when: "this week", status: "optimal", delta: "124 active min", organ: "heart", tab: "activity", field: "habit", chart: "bars", note: "Two walks and a strength session. Your load is in the range your heart recovers from." },

  { id: "weight", label: "Weight", value: "86", unit: "kg", base: 86, swing: 0.5, decimals: 1, source: "clinic", when: "14 Jul", status: "normal", delta: "Held since July", organ: "liver", tab: "body", field: "body", chart: "scan", scans: [87.4, 86], cohort: 64, note: "Lean mass 62%, fat 29%, bone 9%." },
  { id: "bmi", label: "BMI", value: "27", unit: "kg/m²", base: 27, swing: 0, ...clinic, status: "monitor", delta: "Above 25", organ: "liver", tab: "body", field: "body", scans: [27.4, 27], cohort: 61, note: "Above the optimal range. Your clinician links this to liver fat at grade 1." },
  { id: "visceral", label: "Visceral fat index", value: "9", unit: "", base: 9, swing: 0, ...clinic, status: "normal", delta: "Healthy under 10", organ: "liver", tab: "body", field: "body", scans: [10, 9], cohort: 52, note: "Fat stored around the organs. Down one point since your first scan." },
  { id: "liverfat", label: "Liver fat", value: "1", unit: "grade", base: 1, swing: 0, ...clinic, status: "normal", delta: "Grade 1 of 3", organ: "liver", tab: "body", field: "body", scans: [1, 1], cohort: 48, note: "Mild, unchanged since your first scan." },
  { id: "bone", label: "Bone density", value: "+0.6", unit: "T-score", base: 0.6, swing: 0, decimals: 1, ...clinic, status: "normal", delta: "Normal at all sites", organ: "bone", tab: "body", field: "body", scans: [0.5, 0.6], cohort: 71, note: "Lumbar spine. Hip +0.2, femoral neck −0.1." },
  { id: "skin", label: "Skin markings", value: "727", unit: "logged", base: 727, swing: 0, ...clinic, status: "normal", delta: "0 flagged", organ: "skin", tab: "body", field: "body", scans: [715, 727], cohort: 83, note: "12 more than your first scan. All logged and tracked between visits." },

  { id: "diet", label: "Food", value: "1,240", unit: "/ 2,000 kcal", base: 1900, swing: 300, source: "log", when: "today", status: "normal", delta: "760 kcal left", organ: "gut", tab: "food", field: "food", chart: "bars", band: [1800, 2200], note: "Two meals logged. Protein is on pace for your 110 g goal." },
  { id: "habits", label: "Habits", value: "50", unit: "%", base: 62, swing: 22, source: "log", when: "today", status: "normal", delta: "3 of 6 done", organ: "brain", tab: "food", field: "habit", chart: "bars", note: "Morning light and hydration are done. Three habits left today." },

  { id: "crp", label: "hs-CRP", value: "3.8", unit: "mg/L", base: 3.8, swing: 0, decimals: 1, ...clinic, status: "monitor", delta: "Up from 2.4", organ: "heart", tab: "vitals", field: "heart", scans: [2.4, 3.8], cohort: 88, note: "A marker of inflammation in the blood vessels. It rose between scans, so your clinician wants a repeat test." },
  { id: "tc", label: "Total cholesterol", value: "3.25", unit: "mmol/L", base: 3.25, swing: 0, decimals: 2, ...clinic, status: "optimal", delta: "Down from 3.6", organ: "heart", tab: "vitals", field: "heart", scans: [3.6, 3.25], cohort: 12, note: "Low for your age group." },
  { id: "glucose", label: "Glucose", value: "6.2", unit: "mmol/L", base: 6.2, swing: 0, decimals: 1, ...clinic, status: "normal", delta: "Top of range", organ: "liver", tab: "food", field: "food", scans: [5.9, 6.2], cohort: 74, note: "Fasting value, at the top of the normal range." },
  { id: "hba1c", label: "HbA1c", value: "35", unit: "mmol/mol", base: 35, swing: 0, ...clinic, status: "optimal", delta: "Unchanged", organ: "liver", tab: "food", field: "food", scans: [35, 35], cohort: 38, note: "Three-month average of blood sugar." },
  { id: "tg", label: "Triglycerides", value: "0.72", unit: "mmol/L", base: 0.72, swing: 0, decimals: 2, ...clinic, status: "normal", delta: "Down from 0.81", organ: "liver", tab: "food", field: "food", scans: [0.81, 0.72], cohort: 22, note: "Blood fat that responds quickly to diet." },
  { id: "tsh", label: "TSH", value: "1.8", unit: "mIU/L", base: 1.8, swing: 0, decimals: 1, ...clinic, status: "optimal", delta: "Mid range", organ: "thyroid", tab: "vitals", field: "vitals", scans: [1.9, 1.8], cohort: 46, note: "The signal that sets your thyroid's output." },
  { id: "egfr", label: "eGFR", value: "98", unit: "mL/min", base: 98, swing: 0, ...clinic, status: "optimal", delta: "Stable", organ: "kidneys", tab: "vitals", field: "vitals", scans: [97, 98], cohort: 58, note: "How much blood your kidneys filter each minute." },
  { id: "diversity", label: "Gut diversity", value: "High", unit: "", base: 74, swing: 0, source: "omics", when: "20 Oct", chart: "scan", status: "optimal", delta: "+8% since scan 1", organ: "gut", tab: "food", field: "food", scans: [68, 74], cohort: 77, note: "More species usually means a more resilient gut." },
];

export const METRICS: Record<string, Metric> = Object.fromEntries(LIST.map((m) => [m.id, m]));
export const metric = (id: string): Metric => METRICS[id] ?? METRICS.capacity;
export const metricsFor = (organ: OrganId): Metric[] => LIST.filter((m) => m.organ === organ);

/** Demo series. Seeded per metric, so a chart reads the same on every open. */
export type Range = "D" | "W" | "M";
const POINTS: Record<Range, number> = { D: 24, W: 7, M: 30 };

export function seriesFor(m: Metric, range: Range): number[] {
  let seed = [...(m.id + range)].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const out = Array.from({ length: POINTS[range] }, (_, i) => {
    const wave = Math.sin((i / POINTS[range]) * Math.PI * 2 - 1.2) * m.swing * 0.5;
    return m.base + wave + (rnd() - 0.5) * m.swing;
  });
  // the line must land on the number at the top of the page
  const now = currentValue(m);
  if (Number.isFinite(now)) out[out.length - 1] = now;
  return out;
}

/** "7:24" is hours and minutes; "6,482", "118/76" and "−0.2" read as their first number. */
function currentValue(m: Metric): number {
  const v = m.value.replace("−", "-").replace(",", "");
  const clock = v.match(/^(\d+):(\d+)$/);
  return clock ? Number(clock[1]) + Number(clock[2]) / 60 : parseFloat(v);
}

export function rangeLabels(range: Range, count: number): string[] {
  if (range === "D") return Array.from({ length: count }, (_, i) => `${String(i).padStart(2, "0")}:00`);
  const end = new Date(2026, 9, 30);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (count - 1 - i));
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  });
}
