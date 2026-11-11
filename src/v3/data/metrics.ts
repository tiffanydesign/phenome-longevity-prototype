import { M, trim, visitDate, VISITS, type Rec } from "../study/data";

/**
 * The one table the redesign reads. Every number in the app is a row here, and
 * every row names the twin region it belongs to (a study of the clinic
 * presentation). That `organ` field is the link between the health data and the
 * twin: a card, a chart and a body region are three views of the same row, so
 * they cannot disagree.
 *
 * Clinic and omics rows are read from the clinic portal's results for the member
 * (src/v3/study/member.json, built by scripts/build-member.mjs), the same data
 * the twin and the full review show. Ring, band and log rows are the member's
 * devices and diary, which the portal does not hold: their numbers are demo.
 */
export type Source = "ring" | "band" | "clinic" | "omics" | "log";
/** in the portal's terms: within its range, outside it, or a critical flag */
export type Status = "normal" | "monitor" | "alert";
export type Field = "capacity" | "activity" | "sleep" | "vitals" | "heart" | "body" | "food" | "habit" | "omics" | "plain" | "rose" | "lavender" | "teal" | "sand";
/** the organ drawings OrganIcon knows */
export type OrganId = "brain" | "thyroid" | "lungs" | "heart" | "liver" | "gut" | "kidneys" | "bone" | "skin" | "immune" | "composition";
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
  /** the twin region (presentation study) it belongs to */
  organ: string;
  tab: Tab;
  field: Field;
  chart: "line" | "bars" | "scan";
  /** healthy band drawn on the chart: the portal's reference range for clinic rows */
  band?: [number, number];
  /** clinic and omics rows: the reading at each visit, oldest first */
  scans?: number[];
  note: string;
}

export const SOURCE_LABEL: Record<Source, string> = {
  ring: "Ring",
  band: "Band",
  clinic: "Clinic visit",
  omics: "Omics",
  log: "Your log",
};

export const STATUS_LABEL: Record<Status, string> = { normal: "In range", monitor: "Monitor", alert: "Discuss" };

const ring = (when = "6 min ago") => ({ source: "ring" as const, when });
const band = (when = "6 min ago") => ({ source: "band" as const, when });

/* ── clinic rows, from the portal ── */

const LAST = VISITS[VISITS.length - 1];
/** the visit before the latest; none when the member has had one visit */
const PREV: number | undefined = VISITS[VISITS.length - 2];
const at = (rows: Rec[], visit: number) => rows.find((r) => r.visit === visit) ?? rows[rows.length - 1];
const before = (rows: Rec[]): Rec | undefined => (PREV === undefined ? undefined : at(rows, PREV));
const clinic = { source: "clinic" as const, when: visitDate(LAST), chart: "scan" as const };

/** the change since the visit before, in the row's own decimals */
function since(now: number, then: number | undefined, unit: string, d = 1): string {
  if (PREV === undefined || then === undefined) return "First visit";
  if (Number(now.toFixed(d)) === Number(then.toFixed(d))) return `Unchanged since visit ${PREV}`;
  const diff = now - then;
  return `${diff > 0 ? "+" : "−"}${trim(Math.abs(diff), d).replace("−", "")}${unit ? ` ${unit}` : ""} since visit ${PREV}`;
}

const rangeWords = (v: number, low: number | null, high: number | null) => (low !== null && v < low ? "Below range" : high !== null && v > high ? "Above range" : "In range");
const statusFor = (v: number, low: number | null, high: number | null): Status => (rangeWords(v, low, high) === "In range" ? "normal" : "monitor");
const rangeText = (low: number | null, high: number | null, unit: string) => (low !== null && high !== null ? `${low}–${high} ${unit}` : low !== null ? `above ${low} ${unit}` : `below ${high} ${unit}`).trim();

/** A laboratory marker as the portal reports it: the lab's own flag, the lab's own range. */
function lab(id: string, name: string, label: string, organ: string, tab: Tab, field: Field, d = 2): Metric {
  const hits = (Object.values(M.labs) as Rec[][]).flat().flatMap((p) => (p.visits as Rec[]).map((v) => ({ visit: v.visit, a: (v.analytes as Rec[]).find((x) => x.name === name) }))).filter((x) => x.a);
  const series = VISITS.map((v) => hits.find((h) => h.visit === v)?.a);
  const a = series[series.length - 1] as Rec;
  const flag = String(a.flag);
  const status: Status = flag === "normal" ? "normal" : flag.startsWith("critical") ? "alert" : "monitor";
  const unit = String(a.unit ?? "").replace("mL/min/1.73m2", "mL/min/1.73 m²");
  return {
    id,
    label,
    value: trim(a.value, d),
    unit,
    base: a.value,
    swing: 0,
    decimals: d,
    ...clinic,
    status,
    delta: status === "normal" ? since(a.value, series[series.length - 2]?.value, "", d) : rangeWords(a.value, a.low, a.high),
    organ,
    tab,
    field,
    band: a.low !== null && a.high !== null ? [a.low, a.high] : undefined,
    scans: series.map((x) => Number(x?.value)),
    note: `Reference range ${rangeText(a.low, a.high, unit)}, as your laboratory reports it.`,
  };
}

function clinicRows(): Metric[] {
  const v = at(M.vitals, LAST);
  const vb = before(M.vitals);
  const vr = M.vitalRanges;
  const sys = v.systolicBloodPressureMmhg;
  const dia = v.diastolicBloodPressureMmhg;
  const bpWords = rangeWords(sys, vr.systolicBloodPressureMmhg.low, vr.systolicBloodPressureMmhg.high) !== "In range" ? rangeWords(sys, vr.systolicBloodPressureMmhg.low, vr.systolicBloodPressureMmhg.high) : rangeWords(dia, vr.diastolicBloodPressureMmhg.low, vr.diastolicBloodPressureMmhg.high);
  const a = at(M.anthro, LAST);
  const ab = before(M.anthro);
  const bmiR = M.anthroRanges.bmiKgM2;
  const c = at(M.composition, LAST);
  const cb = before(M.composition);
  const b = at(M.bone, LAST);
  const lowest = (r: Rec) => Math.min(...r.sites.map((s: Rec) => s.tScore));
  const site = (s: Rec) => `${String(s.anatomicalSite).replace(/_/g, " ").replace(/^./, (x) => x.toUpperCase())}${s.hipSide ? `, ${s.hipSide.toLowerCase()}` : ""} ${trim(s.tScore)}`;
  const sk = at(M.skin, LAST);
  const g = at(M.gut, LAST);
  const gb = before(M.gut);
  const per = (rows: Rec[], key: string) => VISITS.map((n) => Number(at(rows, n)[key]));
  return [
    {
      id: "bp",
      label: "Blood pressure",
      value: `${sys}/${dia}`,
      unit: "mmHg",
      base: sys,
      swing: 0,
      ...clinic,
      status: bpWords === "In range" ? "normal" : "monitor",
      delta: bpWords,
      organ: "natural",
      tab: "vitals",
      field: "lavender",
      band: [vr.systolicBloodPressureMmhg.low, vr.systolicBloodPressureMmhg.high],
      scans: per(M.vitals, "systolicBloodPressureMmhg"),
      note: `Systolic ${sys} against a range of ${rangeText(vr.systolicBloodPressureMmhg.low, vr.systolicBloodPressureMmhg.high, "mmHg")}, diastolic ${dia} against ${rangeText(vr.diastolicBloodPressureMmhg.low, vr.diastolicBloodPressureMmhg.high, "mmHg")}, seated at your clinic visit. The chart follows the systolic reading.`,
    },
    {
      id: "pulse",
      label: "Pulse",
      value: String(v.pulseBpm),
      unit: "bpm",
      base: v.pulseBpm,
      swing: 0,
      ...clinic,
      status: "normal",
      delta: since(v.pulseBpm, vb?.pulseBpm, "bpm", 0),
      organ: "natural",
      tab: "vitals",
      field: "heart",
      scans: per(M.vitals, "pulseBpm"),
      note: "Taken seated at your clinic visit, with your blood pressure.",
    },
    {
      id: "spo2",
      label: "Oxygen saturation",
      value: trim(v.spo2Percent),
      unit: "%",
      base: v.spo2Percent,
      swing: 0,
      ...clinic,
      status: statusFor(v.spo2Percent, vr.spo2Percent.low, vr.spo2Percent.high),
      delta: rangeWords(v.spo2Percent, vr.spo2Percent.low, vr.spo2Percent.high),
      organ: "natural",
      tab: "vitals",
      field: "food",
      band: [vr.spo2Percent.low, vr.spo2Percent.high],
      scans: per(M.vitals, "spo2Percent"),
      note: `Reference range ${rangeText(vr.spo2Percent.low, vr.spo2Percent.high, "%")}.`,
    },
    {
      id: "resp",
      label: "Respiration",
      value: String(v.respiratoryRatePerMin),
      unit: "/ min",
      base: v.respiratoryRatePerMin,
      swing: 0,
      ...clinic,
      status: "normal",
      delta: since(v.respiratoryRatePerMin, vb?.respiratoryRatePerMin, "", 0),
      organ: "natural",
      tab: "vitals",
      field: "habit",
      scans: per(M.vitals, "respiratoryRatePerMin"),
      note: "Breaths a minute at rest, at your clinic visit.",
    },
    lab("crp", "hsCRP", "hs-CRP", "natural", "vitals", "rose"),
    lab("tc", "Total cholesterol", "Total cholesterol", "heart", "vitals", "heart"),
    lab("tg", "Triglycerides", "Triglycerides", "heart", "food", "food"),
    lab("glucose", "Glucose", "Glucose", "stomach", "food", "lavender"),
    lab("hba1c", "HbA1c", "HbA1c", "stomach", "food", "food", 1),
    lab("tsh", "TSH", "TSH", "thyroid", "vitals", "vitals"),
    lab("egfr", "eGFR", "eGFR", "kidneys", "vitals", "vitals", 0),
    {
      id: "weight",
      label: "Weight",
      value: trim(a.weightKg),
      unit: "kg",
      base: a.weightKg,
      swing: 0,
      decimals: 1,
      ...clinic,
      status: "normal",
      delta: since(a.weightKg, ab?.weightKg, "kg"),
      organ: "composition",
      tab: "body",
      field: "body",
      scans: per(M.anthro, "weightKg"),
      note: `Height ${trim(a.heightCm)} cm, waist ${trim(a.waistCircumferenceCm)} cm, hip ${trim(a.hipCircumferenceCm)} cm.`,
    },
    {
      id: "bmi",
      label: "BMI",
      value: trim(a.bmiKgM2),
      unit: "kg/m²",
      base: a.bmiKgM2,
      swing: 0,
      decimals: 1,
      ...clinic,
      status: statusFor(a.bmiKgM2, bmiR.low, bmiR.high),
      delta: rangeWords(a.bmiKgM2, bmiR.low, bmiR.high),
      organ: "composition",
      tab: "body",
      field: "capacity",
      band: [bmiR.low, bmiR.high],
      scans: per(M.anthro, "bmiKgM2"),
      note: `Reference range ${rangeText(bmiR.low, bmiR.high, "kg/m²")}.`,
    },
    {
      id: "bodyfat",
      label: "Body fat",
      value: trim(c.bodyFatPercent),
      unit: "%",
      base: c.bodyFatPercent,
      swing: 0,
      decimals: 1,
      ...clinic,
      status: "normal",
      delta: since(c.bodyFatPercent, cb?.bodyFatPercent, "%"),
      organ: "composition",
      tab: "body",
      field: "teal",
      scans: per(M.composition, "bodyFatPercent"),
      note: `Lean mass ${trim(c.leanMassKg)} kg, fat mass ${trim(c.fatMassKg)} kg, skeletal muscle ${trim(c.skeletalMuscleMassKg)} kg, from your 3D body scan.`,
    },
    {
      id: "visceral",
      label: "Visceral fat rating",
      value: String(c.visceralFatRating),
      unit: "",
      base: c.visceralFatRating,
      swing: 0,
      ...clinic,
      status: "normal",
      delta: since(c.visceralFatRating, cb?.visceralFatRating, "", 0),
      organ: "composition",
      tab: "body",
      field: "food",
      scans: per(M.composition, "visceralFatRating"),
      note: "Fat stored around the organs, from your 3D body scan.",
    },
    {
      id: "bone",
      label: "Bone T-score",
      value: trim(lowest(b)),
      unit: "",
      base: lowest(b),
      swing: 0,
      decimals: 1,
      ...clinic,
      status: "normal",
      delta: `Fracture risk ${trim(b.fractureRisk5yPercent)}% over 5 years`,
      organ: "skeletal",
      tab: "body",
      field: "sand",
      scans: VISITS.map((n) => lowest(at(M.bone, n))),
      note: `The lowest of the sites measured: ${b.sites.map((s: Rec) => site(s)).join(", ")}. ${b.findings}.`,
    },
    {
      id: "skin",
      label: "Skin lesions",
      value: String(sk.lesions.length),
      unit: "mapped",
      base: sk.lesions.length,
      swing: 0,
      ...clinic,
      status: sk.lesions.some((l: Rec) => l.risk === "high") ? "alert" : sk.lesions.some((l: Rec) => l.risk === "moderate") ? "monitor" : "normal",
      delta: sk.summary,
      organ: "dermatology",
      tab: "body",
      field: "rose",
      scans: VISITS.map((n) => at(M.skin, n).lesions.length),
      note: sk.recommendations.join(". ") + ".",
    },
    {
      id: "diversity",
      label: "Gut species",
      value: String(g.richness),
      unit: "",
      base: g.richness,
      swing: 0,
      source: "omics",
      when: g.date,
      chart: "scan",
      status: statusFor(g.richness, 115, 300),
      delta: since(g.richness, gb?.richness, "", 0),
      organ: "guthealth",
      tab: "food",
      field: "teal",
      band: [115, 300],
      scans: per(M.gut, "richness"),
      note: `Species richness, against the report's range of 115–300. Shannon diversity ${trim(g.shannon, 2)}.`,
    },
  ];
}

/* ── the member's devices and diary: not in the portal, demo values ── */

const DEVICE: Metric[] = [
  { id: "rhr", label: "Resting heart rate", value: "58", unit: "bpm", base: 59, swing: 2, ...ring("overnight"), status: "normal", delta: "−3 on yesterday", organ: "heart", tab: "vitals", field: "heart", chart: "line", band: [50, 64], note: "Within 3 bpm all week. Lower resting rates usually follow better recovery." },
  { id: "hr", label: "Heart rate", value: "72", unit: "bpm", base: 70, swing: 12, ...ring(), status: "normal", delta: "58–112 today", organ: "heart", tab: "vitals", field: "heart", chart: "line", band: [55, 100], note: "Daytime rate tracks your activity. The peak at 11:00 matches your walk." },
  { id: "hrv", label: "Heart rate variability", value: "48", unit: "ms", base: 46, swing: 5, ...ring("overnight"), status: "normal", delta: "+4 on yesterday", organ: "heart", tab: "vitals", field: "vitals", chart: "line", band: [40, 60], note: "Overnight mean. Your 7-day average is 46 ms, and this is the third night it has risen." },
  // the ring's and band's own readings of what the clinic also measures: daily, kept apart from the visit rows of the same name
  { id: "bpd", label: "Blood pressure", value: "118/76", unit: "mmHg", base: 118, swing: 6, ...band("this morning"), status: "normal", delta: "Within your usual range", organ: "natural", tab: "vitals", field: "lavender", chart: "line", band: [90, 130], note: "Morning reading from your band. Your 7-day average is 119/77 mmHg." },
  { id: "spo2d", label: "Blood oxygen", value: "97", unit: "%", base: 97, swing: 1.4, ...ring("overnight"), status: "normal", delta: "Overnight average", organ: "natural", tab: "vitals", field: "teal", chart: "line", band: [95, 100], note: "Overnight average from your ring. It dipped below 94% for under a minute." },
  { id: "respd", label: "Respiratory rate", value: "14", unit: "breaths/min", base: 14, swing: 1.2, ...ring("overnight"), status: "normal", delta: "Overnight average", organ: "natural", tab: "vitals", field: "sand", chart: "line", band: [12, 20], note: "Breaths per minute while you slept. Steady nights usually mean steady recovery." },
  { id: "capacity", label: "Capacity", value: "72", unit: "/ 100", base: 68, swing: 8, ...ring(), status: "normal", delta: "+6 on yesterday", organ: "heart", tab: "vitals", field: "capacity", chart: "line", band: [60, 85], note: "Recovery is keeping up with recent load. A good day to train or stay active." },

  { id: "sleep", label: "Sleep", value: "7:24", unit: "h", base: 7.2, swing: 0.6, decimals: 1, ...ring("last night"), status: "normal", delta: "24 min over goal", organ: "brain", tab: "sleep", field: "sleep", chart: "bars", band: [7, 9], note: "You fell asleep within 14 minutes and woke once." },
  { id: "sleepscore", label: "Sleep score", value: "82", unit: "/ 100", base: 80, swing: 8, ...ring("last night"), status: "normal", delta: "+4 on yesterday", organ: "brain", tab: "sleep", field: "capacity", chart: "bars", band: [70, 100], note: "Your score combines how regular, efficient, long enough and restorative the night was." },
  { id: "consistency", label: "Sleep consistency", value: "78", unit: "%", base: 76, swing: 8, ...ring("last night"), status: "normal", delta: "Bedtime within 25 min", organ: "brain", tab: "sleep", field: "teal", chart: "bars", band: [70, 100], note: "How close your bed and wake times are to your usual ones across the week." },
  { id: "efficiency", label: "Sleep efficiency", value: "91", unit: "%", base: 89, swing: 4, ...ring("last night"), status: "normal", delta: "Awake 40 min in bed", organ: "brain", tab: "sleep", field: "rose", chart: "bars", band: [85, 100], note: "The share of time in bed you spent asleep." },
  { id: "hoursneeds", label: "Hours vs needs", value: "96", unit: "%", base: 94, swing: 8, ...ring("last night"), status: "normal", delta: "7:24 of 7:40 needed", organ: "brain", tab: "sleep", field: "habit", chart: "bars", band: [90, 110], note: "How much you slept against what your recent load says you need." },
  { id: "restorative", label: "Restorative sleep", value: "38", unit: "%", base: 36, swing: 5, ...ring("last night"), status: "normal", delta: "Deep and REM", organ: "brain", tab: "sleep", field: "vitals", chart: "bars", band: [30, 50], note: "Deep and REM sleep together, the stages that restore body and mind." },
  { id: "deep", label: "Deep sleep", value: "1:04", unit: "h", base: 1.1, swing: 0.2, decimals: 1, ...ring("last night"), status: "normal", delta: "15% of the night", organ: "brain", tab: "sleep", field: "lavender", chart: "bars", band: [1, 1.8], note: "Deep sleep came early in the night, as it should." },
  { id: "temp", label: "Skin temperature", value: "−0.2", unit: "°C", base: -0.1, swing: 0.2, decimals: 1, ...ring("last night"), status: "normal", delta: "Against your baseline", organ: "brain", tab: "sleep", field: "sand", chart: "line", band: [-0.4, 0.4], note: "Changes in skin temperature are linked to restful sleep. Yours moved normally overnight." },

  { id: "steps", label: "Steps", value: "6,482", unit: "/ 8,000", base: 7200, swing: 2600, ...band(), status: "normal", delta: "81% of goal", organ: "skeletal", tab: "activity", field: "activity", chart: "bars", band: [8000, 12000], note: "1,518 steps left. A 15-minute walk closes the gap." },
  { id: "kcal", label: "Active calories", value: "164", unit: "/ 200 kcal", base: 180, swing: 60, ...band(), status: "normal", delta: "82% of goal", organ: "heart", tab: "activity", field: "rose", chart: "bars", band: [200, 320], note: "Calories burned through movement, on top of your resting rate." },
  { id: "distance", label: "Distance", value: "4.12", unit: "km", base: 4.6, swing: 1.6, decimals: 2, ...band(), status: "normal", delta: "Goal 5.00 km", organ: "skeletal", tab: "activity", field: "teal", chart: "bars", band: [5, 8], note: "Walking and running combined." },
  { id: "workouts", label: "Workouts", value: "38", unit: "min", base: 38, swing: 18, source: "log", when: "today", status: "normal", delta: "243 kcal", organ: "heart", tab: "activity", field: "habit", chart: "bars", note: "A strength session this morning. Time is every minute you trained, calories the energy those minutes took." },

  { id: "diet", label: "Food", value: "1,240", unit: "/ 2,000 kcal", base: 1900, swing: 300, source: "log", when: "today", status: "normal", delta: "760 kcal left", organ: "stomach", tab: "food", field: "food", chart: "bars", band: [1800, 2200], note: "Two meals logged. Protein is on pace for your 110 g goal." },
  { id: "habits", label: "Habits", value: "50", unit: "%", base: 62, swing: 22, source: "log", when: "today", status: "normal", delta: "3 of 6 done", organ: "brain", tab: "food", field: "habit", chart: "bars", note: "Morning light and hydration are done. Three habits left today." },
];

const LIST: Metric[] = [...DEVICE, ...clinicRows()];

export const METRICS: Record<string, Metric> = Object.fromEntries(LIST.map((m) => [m.id, m]));
export const metric = (id: string): Metric => METRICS[id] ?? METRICS.capacity;
export const metricsFor = (organ: string): Metric[] => LIST.filter((m) => m.organ === organ);

/** The visits a clinic row's chart runs across, as the portal dates them. */
export const visitLabels = (): string[] => VISITS.map((v) => visitDate(v));
/** Demo series for the device and diary rows. Seeded per metric, so a chart reads the same on every open. */
export type Range = "D" | "W" | "M" | "6M" | "Y";
const POINTS: Record<Range, number> = { D: 24, W: 7, M: 30, "6M": 26, Y: 12 };

/** `page` steps back through earlier periods: 0 is the current one, 1 the one before. */
export function seriesFor(m: Metric, range: Range, page = 0): number[] {
  let seed = [...(m.id + range + page)].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const out = Array.from({ length: POINTS[range] }, (_, i) => {
    const wave = Math.sin((i / POINTS[range]) * Math.PI * 2 - 1.2) * m.swing * 0.5;
    return m.base + wave + (rnd() - 0.5) * m.swing;
  });
  // the current period's line must land on the number at the top of the page
  const now = currentValue(m);
  if (page === 0 && Number.isFinite(now)) out[out.length - 1] = now;
  return out;
}

/** "7:24" is hours and minutes; "6,482", "118/76" and "−0.2" read as their first number. */
function currentValue(m: Metric): number {
  const v = m.value.replace("−", "-").replace(",", "");
  const clock = v.match(/^(\d+):(\d+)$/);
  return clock ? Number(clock[1]) + Number(clock[2]) / 60 : parseFloat(v);
}

/** The last day a chart reads to, `page` periods back from today. */
function periodEnd(range: Range, page: number): Date {
  const d = new Date();
  if (range === "D") d.setDate(d.getDate() - page);
  else if (range === "W") d.setDate(d.getDate() - 7 * page);
  else if (range === "M") d.setDate(d.getDate() - 30 * page);
  else if (range === "6M") d.setDate(d.getDate() - 182 * page);
  else d.setFullYear(d.getFullYear() - page);
  return d;
}

export function rangeLabels(range: Range, count: number, page = 0): string[] {
  if (range === "D") return Array.from({ length: count }, (_, i) => `${String(i).padStart(2, "0")}:00`);
  const end = periodEnd(range, page);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(end);
    const back = count - 1 - i;
    if (range === "6M") {
      d.setDate(end.getDate() - 7 * back);
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }
    if (range === "Y") {
      d.setMonth(end.getMonth() - back);
      return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    }
    d.setDate(end.getDate() - back);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  });
}

/** The period a chart shows, as its heading reads: "Today", "3 Nov - 9 Nov", "Nov 2025 - Oct 2026". */
export function periodTitle(range: Range, page: number): string {
  const end = periodEnd(range, page);
  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-GB", o);
  if (range === "D") return page === 0 ? "Today" : page === 1 ? "Yesterday" : fmt(end, { weekday: "long", day: "numeric", month: "short" });
  const start = new Date(end);
  if (range === "W") start.setDate(end.getDate() - 6);
  else if (range === "M") start.setDate(end.getDate() - 29);
  else if (range === "6M") start.setDate(end.getDate() - 181);
  else start.setMonth(end.getMonth() - 11);
  const long = range === "6M" || range === "Y";
  const o: Intl.DateTimeFormatOptions = long ? { month: "short", year: "numeric" } : { day: "numeric", month: "short" };
  return `${fmt(start, o)} – ${fmt(end, o)}`;
}

/** "1,240" with thousands marked, as the cards print counts. */
const counted = (n: number) => Math.round(n).toLocaleString("en-GB");

/**
 * A device or diary reading as it stood `ago` days back, read off the week's
 * series so the card, its chart and the detail page agree. Visit readings and
 * weekly totals do not change by day and come back as they are. The comparison
 * under the number is worked out again for that day.
 */
export function metricOn(id: string, ago: number): Metric {
  const m = metric(id);
  if (ago <= 0 || m.chart === "scan" || !m.swing || m.when === "this week") return m;
  const week = seriesFor(m, "W");
  const v = week[week.length - 1 - ago];
  const before = week[week.length - 2 - ago] ?? m.base;
  const clock = /^\d+:\d+$/.test(m.value);
  const value = clock
    ? `${Math.floor(v)}:${String(Math.round((v % 1) * 60) % 60).padStart(2, "0")}`
    : m.value.includes(",") || v >= 1000
      ? counted(v)
      : (v < 0 ? "−" : "") + Math.abs(v).toFixed(m.decimals ?? 0);
  const goal = Number(/\/\s*([\d,]+)/.exec(m.unit)?.[1]?.replace(",", ""));
  let delta = m.delta;
  if (/% of goal$/.test(m.delta) && goal) delta = `${Math.round((v / goal) * 100)}% of goal`;
  else if (/kcal left$/.test(m.delta) && goal) delta = v <= goal ? `${counted(goal - v)} kcal left` : `${counted(v - goal)} kcal over`;
  else if (/on yesterday$/.test(m.delta)) {
    const d = Math.round(v) - Math.round(before);
    delta = `${d >= 0 ? "+" : "−"}${Math.abs(d)} on the day before`;
  } else if (/min (over|under) goal$/.test(m.delta) && clock) {
    const [, n, way] = /^(\d+) min (over|under)/.exec(m.delta)!;
    const target = currentValue(m) - (way === "over" ? 1 : -1) * (Number(n) / 60);
    const off = Math.round((v - target) * 60);
    delta = `${Math.abs(off)} min ${off >= 0 ? "over" : "under"} goal`;
  } else if (/^\d+ of (\d+) done$/.test(m.delta)) {
    const total = Number(/of (\d+)/.exec(m.delta)![1]);
    delta = `${Math.round((v / 100) * total)} of ${total} done`;
  }
  return { ...m, value, delta };
}
