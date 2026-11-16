/*
 * Demo activity for today and yesterday, kept consistent with metrics.ts:
 * 6,482 steps so far (goal 8,000), yesterday 9,104; 164 active kcal; 4.12 km;
 * workouts 38 min and 243 kcal across two sessions.
 */

/** A day's shape by the hour: quiet night, morning walk, working day, evening walk. */
const SHAPE = [0, 0, 0, 0, 0, 0.1, 0.6, 1.4, 1.1, 0.5, 0.6, 0.7, 1.2, 0.9, 0.5, 0.5, 0.6, 1.0, 1.5, 1.2, 0.6, 0.3, 0.1, 0];

/** Steps per hour scaled to a total, filled up to and including `upto`. */
function hourly(total: number, upto: number, wobble: number): number[] {
  const w = SHAPE.map((s, h) => (h <= upto ? s * (1 + 0.25 * Math.sin(h * 1.7 + wobble)) : 0));
  const sum = w.reduce((a, b) => a + b, 0) || 1;
  return w.map((v) => (v / sum) * total);
}

const cumulative = (xs: number[]) => xs.reduce<number[]>((acc, v) => [...acc, (acc[acc.length - 1] ?? 0) + v], []);

export const STEPS_TODAY = 6482;
export const STEPS_YESTERDAY = 9104;
export const STEP_GOAL = 8000;

export function stepDay(nowHour: number) {
  const today = cumulative(hourly(STEPS_TODAY, nowHour, 0.4));
  const yesterday = cumulative(hourly(STEPS_YESTERDAY, 23, 2.1));
  return { today, yesterday, yesterdayByNow: Math.round(yesterday[nowHour]) };
}

export const ENERGY = { active: 164, resting: 1512 };

export interface Workout {
  id: string;
  name: string;
  kind: "strength" | "walk";
  start: string;
  end: string;
  min: number;
  kcal: number;
  avgHr: number;
  maxHr: number;
  /** minutes in zones 1–5 */
  zones: number[];
  source: string;
}

/** newest first */
export const WORKOUTS: Workout[] = [
  { id: "w1", name: "Strength training", kind: "strength", start: "07:30", end: "07:54", min: 24, kcal: 158, avgHr: 118, maxHr: 146, zones: [3, 9, 8, 4, 0], source: "Phenome Band" },
  { id: "w2", name: "Morning walk", kind: "walk", start: "06:40", end: "06:54", min: 14, kcal: 85, avgHr: 102, maxHr: 116, zones: [6, 8, 0, 0, 0], source: "Phenome Band" },
];

export const workoutById = (id: string) => WORKOUTS.find((w) => w.id === id);

/** Heart rate through a workout, one point per minute: warm-up, effort with sets or pace, cool-down. */
export function heartTrace(w: Workout): number[] {
  return Array.from({ length: w.min + 1 }, (_, i) => {
    const t = i / w.min;
    const ramp = t < 0.15 ? t / 0.15 : t > 0.88 ? (1 - t) / 0.12 : 1;
    const sets = w.kind === "strength" ? 10 * Math.sin(i * 1.3) : 4 * Math.sin(i * 0.7);
    const base = 82 + (w.avgHr - 82) * 1.12 * ramp + sets;
    return Math.round(Math.min(w.maxHr, Math.max(78, base)));
  });
}

/** Heart-rate zones as a share of maximum (age 42 → max ~178). */
export const ZONES = [
  { name: "Zone 1", label: "Easy", from: 89 },
  { name: "Zone 2", label: "Steady", from: 107 },
  { name: "Zone 3", label: "Tempo", from: 125 },
  { name: "Zone 4", label: "Hard", from: 142 },
  { name: "Zone 5", label: "Max", from: 160 },
];
