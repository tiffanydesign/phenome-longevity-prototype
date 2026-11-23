import type { DataPair } from "@/lib/data";
import { DEFAULT_DAY, addDays, num, realDay } from "@/data/real";

/** Capacity detail (capture: capacity/top, scroll_1, scroll_2). */
export interface CapacityComponent {
  id: "hrv" | "rhr" | "spo2";
  label: string;
  icon: string;
  unit: string;
  /** null renders the captured "--" placeholder */
  today: number | null;
  yesterday: number | null;
  color: string;
}

export interface CapacityData {
  score: number;
  today: number;
  yesterday: number;
  components: CapacityComponent[];
  /** 0–1 fill of the "Today / Yesterday" bars inside the comparison card */
  todayBar: number;
  yesterdayBar: number;
  /** Longevity Analysis copy: plain lead + red bold tail (capture: capacity/scroll_1) */
  analysis: { lead: string; emphasis: string };
}

const ANALYSIS_LOW = {
  lead: "Your Capacity is lower than usual. Recent load may be exceeding recovery support — prioritising ",
  emphasis: "rest and consistency may help restore balance over time.",
};

const comps = (hrv: number | null, rhr: number | null, spo2: number | null, yh: number | null, yr: number | null, ys: number | null): CapacityComponent[] => [
  { id: "hrv", label: "Heart Rate Variability", icon: "hrv", unit: "ms", today: hrv, yesterday: yh, color: "var(--cap-green)" },
  { id: "rhr", label: "Resting Heart Rate", icon: "Resting_HeartRate", unit: "BPM", today: rhr, yesterday: yr, color: "var(--cap-green)" },
  { id: "spo2", label: "Blood Oxygen", icon: "Blood_Oxygen", unit: "%", today: spo2, yesterday: ys, color: "var(--cap-blue)" },
];

/*
 * Synced account (data/real): the app's Capacity page always shows today, which is empty on the
 * capture date, so the prototype fills it from the day Home opens on (17 Nov) and the day
 * before: score from the Home card, components from the Health Monitor rows, analysis = the
 * Home card's line for that day.
 */
function synced(): CapacityData {
  const t = realDay(DEFAULT_DAY);
  const y = realDay(addDays(DEFAULT_DAY, -1));
  const c = (d: typeof t, k: string) => num(d?.monitor[k]);
  const today = t?.capacity ?? 0;
  const yesterday = y?.capacity ?? 0;
  return {
    score: today,
    today,
    yesterday,
    components: comps(c(t, "hrv"), c(t, "rhr"), c(t, "spo2"), c(y, "hrv"), c(y, "rhr"), c(y, "spo2")),
    todayBar: today / 100,
    yesterdayBar: yesterday / 100,
    analysis: t?.capacityText ? { lead: t.capacityText, emphasis: "" } : ANALYSIS_LOW,
  };
}

export const capacityData: DataPair<CapacityData> = {
  real: synced(),
  // DEMO — populated values for design exploration (not from the device).
  demo: {
    score: 72,
    today: 72,
    yesterday: 66,
    components: comps(48, 58, 97, 44, 61, 96),
    todayBar: 0.72,
    yesterdayBar: 0.66,
    analysis: {
      lead: "Your Capacity is higher than usual. Recovery is keeping up with recent load — ",
      emphasis: "a good day to train or stay active.",
    },
  },
};
