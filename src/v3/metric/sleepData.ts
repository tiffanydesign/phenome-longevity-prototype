/*
 * Last night in numbers, one source for the Sleep page and every page that
 * opens from it, so a part, a stage or a reading reads the same everywhere.
 * 7:54 asleep of 7:55 in bed (100% efficient), deep + REM = 2:50 (36%): the
 * synced account's night of 16-17 Nov.
 */

export interface SleepPart {
  id: string;
  name: string;
  now: number;
  before: number;
  vs: string;
  line: string;
  unit: string;
  max?: number;
}

/**
 * The score's four parts: today and the comparison point, in the part's own unit
 * (restorative sleep is hours of deep + REM, the rest are percentages).
 */
export const PARTS: SleepPart[] = [
  { id: "hoursneeds", name: "Hours vs needs", now: 99, before: 91, vs: "Yesterday", line: "7:54 of 8:00 needed", unit: "%" },
  { id: "efficiency", name: "Efficiency", now: 100, before: 99, vs: "Yesterday", line: "Awake 1 min in bed", unit: "%" },
  { id: "restorative", name: "Restorative", now: 170, before: 157, vs: "Yesterday", line: "Deep and REM, 36% of sleep", unit: "h", max: 240 },
  { id: "consistency", name: "Consistency", now: 62, before: 65, vs: "Last week", line: "Bed and wake times drifted this week", unit: "%" },
];

/** Minutes asleep by stage, plus awake time in bed; the usual share of the night for each. */
export const STAGES = [
  { stage: "Deep", min: 78, typical: [13, 23] as [number, number], label: "13–23%" },
  { stage: "REM", min: 92, typical: [20, 25] as [number, number], label: "20–25%" },
  { stage: "Core", min: 304, typical: [45, 60] as [number, number], label: "45–60%" },
  { stage: "Awake", min: 1, typical: [0, 10] as [number, number], label: "under 10%" },
] as const;

/** The week's nights: into bed and up, as minutes after 18:00 so the night reads left to right. */
export const NIGHTS = [
  { day: "Tue", bed: "23:40", up: "07:05" },
  { day: "Wed", bed: "23:05", up: "06:50" },
  { day: "Thu", bed: "00:20", up: "07:30" },
  { day: "Fri", bed: "23:30", up: "07:45" },
  { day: "Sat", bed: "00:05", up: "08:10" },
  { day: "Sun", bed: "23:20", up: "07:00" },
  { day: "Last night", bed: "23:12", up: "07:07" },
];

/** What the ring read while the member slept; each opens its own page. */
export const OVERNIGHT = [
  { id: "rhr", label: "Resting heart rate", value: "49", unit: "bpm", word: "Steady" },
  { id: "hrv", label: "Heart rate variability", value: "59", unit: "ms", word: "Above usual" },
  { id: "spo2d", label: "Blood oxygen", value: "98", unit: "%", word: "Steady" },
  { id: "respd", label: "Respiratory rate", value: "13", unit: "/min", word: "Low and steady" },
  { id: "temp", label: "Skin temperature", value: "−0.2", unit: "°C", word: "Near baseline" },
];


export const SCORE_BEFORE = 93;
export function scoreWord(v: number) {
  return v >= 85 ? "Excellent" : v >= 70 ? "Good" : v >= 50 ? "Fair" : "Poor";
}

/** minutes as h:mm */
export const hm = (min: number) => `${Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, "0")}`;

export const ASLEEP = STAGES.filter((s) => s.stage !== "Awake").reduce((n, s) => n + s.min, 0);
export const IN_BED = ASLEEP + STAGES[3].min;
export const BED = "23:12";
export const UP = "07:07";

/** Skin temperature against the member's baseline, every half hour from bed to waking (°C). */
export const TEMP_NIGHT = [0.1, 0.05, -0.05, -0.15, -0.25, -0.3, -0.35, -0.4, -0.42, -0.4, -0.35, -0.3, -0.25, -0.2, -0.15, -0.1, -0.05];
export const TEMP_BAND: [number, number] = [-0.4, 0.4];
