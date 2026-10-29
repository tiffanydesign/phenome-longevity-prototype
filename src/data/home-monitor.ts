import type { DataPair } from "@/lib/data";

/**
 * Health Monitor detail (capture: steps/*, calories/*, sleep/*, monitor_blood_pressure/*).
 * Copy for metrics that were not captured (respiratory, spo2, rhr, hr, hrv, distance, the
 * sleep sub-metrics) is written in the same voice — TODO(fidelity): replace with app strings.
 */
export type Period = "D" | "W" | "M" | "6M" | "Y";
export const PERIODS: readonly Period[] = ["D", "W", "M", "6M", "Y"];

export type MetricKind = "standard" | "sleep" | "bp";

export interface MetricDef {
  id: string;
  label: string;
  icon: string;
  group: "VITALS" | "MOVE" | "SLEEP";
  kind: MetricKind;
  /** unit printed after values ("kcal", "BPM"…); "" for unitless */
  unit: string;
  /** brand colour of the metric's values/series */
  color: string;
  /** daily goal shown as "-- / 8000" (D period) */
  goal?: number;
  /** headline label on D ("TODAY" / "LATEST") */
  dayLabel: string;
  description: string;
  about: string;
}

const M = (d: MetricDef) => d;

export const METRICS: MetricDef[] = [
  M({ id: "respiratory", label: "Respiratory Rate", icon: "Respiratory_rate", group: "VITALS", kind: "standard", unit: "Breaths/Min", color: "#5aaeca", dayLabel: "LATEST",
    description: "Respiratory rate is the number of breaths you take per minute at rest. A stable rate reflects healthy lung function and a calm, well-recovered nervous system.",
    about: "Respiratory rate tracks how many breaths you take per minute. Changes from your usual range can signal illness, stress, or incomplete recovery." }),
  M({ id: "bp", label: "Blood Pressure", icon: "Blood_Pressure", group: "VITALS", kind: "bp", unit: "mmHg", color: "#9a5cba", dayLabel: "LATEST",
    description: "Blood pressure tracks the force of blood against your artery walls during heartbeats (systolic) and between beats (diastolic). Maintaining healthy levels is essential for cardiovascular longevity.",
    about: "Blood pressure measures the force of blood pushing against your artery walls as your heart beats and rests. Systolic pressure (the top number) reflects the pressure in your arteries when your heart beats. Diastolic pressure (the bottom number) reflects the pressure when your heart relaxes between beats." }),
  M({ id: "spo2", label: "Blood Oxygen (SpO₂)", icon: "Blood_Oxygen", group: "VITALS", kind: "standard", unit: "%", color: "#5aaeca", dayLabel: "LATEST",
    description: "Blood oxygen saturation shows how much oxygen your red blood cells carry. Healthy levels support energy, focus, and recovery throughout the day and night.",
    about: "SpO₂ measures the percentage of oxygen-carrying haemoglobin in your blood. Most healthy adults sit between 95% and 100%." }),
  M({ id: "rhr", label: "Resting Heart Rate", icon: "Resting_HeartRate", group: "VITALS", kind: "standard", unit: "BPM", color: "#65c466", dayLabel: "LATEST",
    description: "Resting heart rate is how many times your heart beats per minute while at rest. A lower resting rate generally reflects better cardiovascular fitness and recovery.",
    about: "Resting heart rate is measured while you are calm and inactive. Trends over weeks say more than single readings." }),
  M({ id: "hr", label: "Heart Rate", icon: "HeartRate", group: "VITALS", kind: "standard", unit: "BPM", color: "#eb4e3d", dayLabel: "LATEST",
    description: "Heart rate shows how fast your heart is beating throughout the day. It rises with activity and stress and settles during rest and sleep.",
    about: "Heart rate tracks beats per minute across the day, helping you see how activity, stress, and rest affect your cardiovascular system." }),
  M({ id: "hrv", label: "Heart Rate Variability", icon: "hrv", group: "VITALS", kind: "standard", unit: "ms", color: "#65c466", dayLabel: "LATEST",
    description: "Heart rate variability measures the variation in time between heartbeats. Higher variability usually signals good recovery and a resilient nervous system.",
    about: "HRV reflects the balance of your autonomic nervous system. It is personal — compare against your own baseline rather than others." }),
  M({ id: "calories", label: "Calories", icon: "Calories", group: "MOVE", kind: "standard", unit: "kcal", color: "#f09343", goal: 200, dayLabel: "TODAY",
    description: "Your total energy expenditure including active calories from movement and basal metabolic rate. Tracking daily burn helps you understand your energy balance and recovery needs.",
    about: "Calories burned represents the total energy expenditure including both active calories from exercise and basal metabolic rate. Tracking helps you understand your energy balance." }),
  M({ id: "distance", label: "Step Distance", icon: "Step_Distance", group: "MOVE", kind: "standard", unit: "km", color: "#65c466", goal: 5, dayLabel: "TODAY",
    description: "Step distance estimates how far you have walked or run today. Covering more ground through the day supports heart health and metabolic function.",
    about: "Step distance is estimated from your step count and stride length. It is a simple way to see how much ground you cover each day." }),
  M({ id: "steps", label: "Step Count", icon: "Step_Count", group: "MOVE", kind: "standard", unit: "", color: "#65c466", goal: 8000, dayLabel: "TODAY",
    description: "Daily step count reflects your overall movement and activity level. Regular walking supports cardiovascular health, metabolic function, and mood regulation throughout the day.",
    about: "Step count tracks the total number of steps you take throughout the day. Regular walking and movement are fundamental to cardiovascular health, metabolism, and overall wellbeing." }),
  M({ id: "sleep", label: "Sleep Score", icon: "HoursOfSleep", group: "SLEEP", kind: "sleep", unit: "", color: "#af5edc", dayLabel: "TODAY",
    description: "Your total sleep duration across all stages — light, deep, and REM. Consistent, adequate sleep is one of the strongest predictors of long-term health and cognitive performance.",
    about: "Hours of sleep tracks your total sleep duration. Adequate sleep is essential for recovery, cognitive function, immune health, and overall longevity." }),
  M({ id: "sleep-consistency", label: "Sleep Consistency", icon: "sleep_consistency", group: "SLEEP", kind: "sleep", unit: "", color: "#af5edc", dayLabel: "TODAY",
    description: "Sleep consistency shows how regular your bed and wake times are. A steady rhythm helps your body clock and supports deeper, more restorative sleep.",
    about: "Sleep consistency compares your sleep timing across the week. Regular timing is linked to better mood, metabolism, and recovery." }),
  M({ id: "sleep-efficiency", label: "Sleep Efficiency", icon: "sleep_efficiency", group: "SLEEP", kind: "sleep", unit: "", color: "#af5edc", dayLabel: "TODAY",
    description: "Sleep efficiency is the share of time in bed that you actually spend asleep. Higher efficiency means less tossing, turning, and time awake at night.",
    about: "Sleep efficiency divides time asleep by time in bed. Values above 85% are generally considered healthy." }),
  M({ id: "sleep-hours", label: "Hours vs Needs", icon: "sleep_hours_vs_needs", group: "SLEEP", kind: "sleep", unit: "", color: "#af5edc", dayLabel: "TODAY",
    description: "Hours vs needs compares how long you slept with how much sleep your body needs. Meeting your need regularly is key to recovery and daytime energy.",
    about: "Your sleep need is estimated from your recent activity and sleep history. Repeatedly falling short builds sleep debt." }),
  M({ id: "sleep-restorative", label: "Restorative Sleep", icon: "sleep_restorative_sleep", group: "SLEEP", kind: "sleep", unit: "", color: "#af5edc", dayLabel: "TODAY",
    description: "Restorative sleep is the time you spend in deep and REM sleep. These stages drive physical repair, memory consolidation, and emotional balance.",
    about: "Restorative sleep combines deep and REM stages — the phases most closely tied to recovery and cognitive health." }),
];

/** Dropdown order (capture: steps/metric_dropdown). Step Count is the open selector, so it is not listed. */
export const PICKER_GROUPS: { title: MetricDef["group"]; ids: string[] }[] = [
  { title: "VITALS", ids: ["respiratory", "bp", "spo2", "rhr", "hr", "hrv"] },
  { title: "MOVE", ids: ["calories", "distance"] },
  { title: "SLEEP", ids: ["sleep", "sleep-consistency", "sleep-efficiency", "sleep-hours", "sleep-restorative"] },
];
// TODO(fidelity): the captured list omits Step Count while Step Count is selected — assumed the
// selected metric is always hidden from the list.

export const metricById = (id: string | undefined): MetricDef => METRICS.find((m) => m.id === id) ?? METRICS.find((m) => m.id === "steps")!;

/** Per-period numbers; null = "--". Chart series are 0..1 fractions of the y-axis max. */
export interface PeriodValues {
  headline: number | null;
  current: number | null;
  previous: number | null;
  /** y values per x slot (null = gap); empty array = empty chart */
  series: (number | null)[];
}

export type MonitorValues = Record<string, Partial<Record<Period, PeriodValues>>>;

const EMPTY: PeriodValues = { headline: null, current: 0, previous: 0, series: [] };

export function valuesFor(v: MonitorValues, id: string, p: Period): PeriodValues {
  return v[id]?.[p] ?? EMPTY;
}

export const monitorData: DataPair<MonitorValues> = {
  real: {
    // capture: steps/period_6M, period_Y — the test account has a few days of steps in June.
    steps: {
      "6M": { headline: 3128, current: 3128, previous: 0, series: [...Array(5).fill(null), 876, 859, 1391, ...Array(18).fill(null)] },
      Y: { headline: 3128, current: 3128, previous: 0, series: [] },
    },
  },
  // DEMO — populated values for design exploration (not from the device).
  demo: {
    steps: {
      D: { headline: 6482, current: 6482, previous: 7120, series: [0, 0, 120, 860, 1450, 980, 620, 1310, 760, 380, 0, 0] },
      W: { headline: 7210, current: 50470, previous: 46200, series: [6200, 8400, 7100, 9800, 5600, 6900, 6482] },
      M: { headline: 6930, current: 6930, previous: 6410, series: [] },
      "6M": { headline: 6650, current: 6650, previous: 6120, series: [] },
      Y: { headline: 6400, current: 6400, previous: 5900, series: [] },
    },
    calories: { D: { headline: 164, current: 164, previous: 188, series: [0, 0, 6, 20, 32, 18, 14, 26, 18, 9, 0, 0] } },
    sleep: { D: { headline: 82, current: 7.4, previous: 6.9, series: [] } },
    bp: { D: { headline: null, current: null, previous: null, series: [] } },
    hr: { D: { headline: 72, current: 72, previous: 70, series: [] } },
    rhr: { D: { headline: 58, current: 58, previous: 60, series: [] } },
    hrv: { D: { headline: 48, current: 48, previous: 44, series: [] } },
    spo2: { D: { headline: 97, current: 97, previous: 96, series: [] } },
  },
};
