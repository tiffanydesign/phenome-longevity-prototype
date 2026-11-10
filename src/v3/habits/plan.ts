import { useSyncExternalStore } from "react";
import { useMeals } from "@/data/journal-store";
import { metric } from "../data/metrics";

/*
 * The member's daily plan. Habits are where it is set: what to do, how often,
 * at which part of the day, and whether Home should ask about it. The daily
 * check-in on Home only reads this plan and today's log; it never holds a
 * list of its own.
 */

export type HabitKind = "once" | "count" | "choice";
export type DayPart = "morning" | "afternoon" | "evening" | "anytime";
export type MarkId = "moon" | "pill" | "drop" | "stretch" | "meal" | "book" | "screen" | "walk" | "sun" | "leaf";

export interface Habit {
  id: string;
  name: string;
  /** one word for tight places: the Home card, the synced line */
  short?: string;
  /** one short line under the name */
  detail?: string;
  kind: HabitKind;
  /** count habits: how many make the day, and what one of them is called */
  goal?: number;
  unit?: [string, string];
  /** choice habits: the answers offered */
  options?: string[];
  part: DayPart;
  /** days it runs, 0 = Sunday */
  days: number[];
  /** asked in the daily check-in on Home */
  checkIn: boolean;
  field: string;
  mark: MarkId;
  /** a source that fills it in without the member */
  source?: "band" | "food";
}

export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS = [1, 2, 3, 4, 5];

export const DEFAULT_PLAN: Habit[] = [
  { id: "rested", short: "Rested", name: "How rested do you feel?", detail: "Read next to last night's sleep", kind: "choice", options: ["Drained", "Okay", "Rested", "Great"], part: "morning", days: EVERY_DAY, checkIn: true, field: "sleep", mark: "moon" },
  { id: "vitamins", short: "Vitamins", name: "Morning vitamins", detail: "Vitamin D3 · Omega-3 · Magnesium", kind: "once", part: "morning", days: EVERY_DAY, checkIn: true, field: "food", mark: "pill" },
  { id: "water", short: "Water", name: "Water", detail: "A glass at a time, across the day", kind: "count", goal: 8, unit: ["glass", "glasses"], part: "anytime", days: EVERY_DAY, checkIn: true, field: "vitals", mark: "drop" },
  { id: "mobility", short: "Mobility", name: "Five minutes of mobility", detail: "Hips, spine and shoulders", kind: "once", part: "afternoon", days: EVERY_DAY, checkIn: true, field: "activity", mark: "stretch", source: "band" },
  { id: "meals", short: "Meals", name: "Log your meals", detail: "A photo or a few words", kind: "count", goal: 3, unit: ["meal", "meals"], part: "anytime", days: EVERY_DAY, checkIn: true, field: "lavender", mark: "meal", source: "food" },
  { id: "read", short: "Read", name: "Read for 20 minutes", detail: "Away from screens", kind: "once", part: "evening", days: WEEKDAYS, checkIn: true, field: "capacity", mark: "book" },
  { id: "screens", short: "Screens", name: "Screens off by 22:30", detail: "An hour before bed", kind: "once", part: "evening", days: EVERY_DAY, checkIn: false, field: "sleep", mark: "screen" },
];

/** Ideas offered when adding a habit; the member can also name their own. */
export const SUGGESTIONS: Omit<Habit, "id">[] = [
  { name: "Morning light", detail: "Ten minutes outside before noon", kind: "once", part: "morning", days: EVERY_DAY, checkIn: true, field: "capacity", mark: "sun" },
  { name: "Walk after lunch", detail: "Fifteen minutes on foot", kind: "once", part: "afternoon", days: EVERY_DAY, checkIn: true, field: "activity", mark: "walk" },
  { name: "Vegetables", detail: "A portion at a time", kind: "count", goal: 5, unit: ["portion", "portions"], part: "anytime", days: EVERY_DAY, checkIn: true, field: "food", mark: "leaf" },
  { name: "Stretch before bed", detail: "Five slow minutes", kind: "once", part: "evening", days: EVERY_DAY, checkIn: true, field: "activity", mark: "stretch" },
];

/** Each part of the day by the hours it covers; anytime runs all day. */
export const PARTS: Record<DayPart, { label: string; from: number; to: number }> = {
  morning: { label: "Morning", from: 5, to: 12 },
  afternoon: { label: "Afternoon", from: 12, to: 17 },
  evening: { label: "Evening", from: 17, to: 24 },
  anytime: { label: "Any time", from: 0, to: 24 },
};
export const PART_ORDER: DayPart[] = ["morning", "afternoon", "evening", "anytime"];

/* ---------------------------------------------------------------- storage */

interface DayLog {
  /** once and choice habits: the answer given */
  done: Record<string, string>;
  /** count habits: one timestamp per tap */
  taps: Record<string, number[]>;
}

const PLAN_KEY = "phenome.v3.plan";
const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const LOG_KEY = () => `phenome.v3.log.${localDay()}`;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // storage blocked: kept for this visit
  }
}

let plan: Habit[] = readJSON(PLAN_KEY, DEFAULT_PLAN);
let log: DayLog = readJSON(LOG_KEY(), { done: {}, taps: {} });
let logDay = localDay();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** A new day starts a fresh log, whenever the app is next looked at. */
function freshLog(): DayLog {
  if (logDay !== localDay()) {
    logDay = localDay();
    log = readJSON(LOG_KEY(), { done: {}, taps: {} });
  }
  return log;
}

function setPlan(next: Habit[]) {
  plan = next;
  writeJSON(PLAN_KEY, plan);
  emit();
}
function setLog(next: DayLog) {
  log = next;
  writeJSON(LOG_KEY(), log);
  emit();
}

export const planActions = {
  save(h: Habit) {
    setPlan(plan.some((p) => p.id === h.id) ? plan.map((p) => (p.id === h.id ? h : p)) : [...plan, h]);
  },
  remove(id: string) {
    setPlan(plan.filter((p) => p.id !== id));
  },
  answer(id: string, value: string) {
    const l = freshLog();
    setLog({ ...l, done: { ...l.done, [id]: value } });
  },
  tap(id: string) {
    const l = freshLog();
    setLog({ ...l, taps: { ...l.taps, [id]: [...(l.taps[id] ?? []), Date.now()] } });
  },
  /** takes back the last thing logged for a habit: an answer, or one tap */
  undo(id: string) {
    const l = freshLog();
    const done = { ...l.done };
    const taps = { ...l.taps };
    if (id in done) delete done[id];
    else if (taps[id]?.length) taps[id] = taps[id].slice(0, -1);
    setLog({ done, taps });
  },
};

export const newHabitId = () => `h-${Date.now().toString(36)}`;

export function usePlan(): Habit[] {
  return useSyncExternalStore(subscribe, () => plan);
}

/* ---------------------------------------------------------------- today */

export interface HabitToday {
  h: Habit;
  /** count habits: how many so far; once and choice: 1 when done */
  count: number;
  goal: number;
  done: boolean;
  /** the answer, for a choice habit */
  answer?: string;
  /** where an automatic tick came from */
  by?: string;
  /** time of the last tap or answer, for count habits */
  last?: number;
}

/** Today's plan with where each habit stands: by the member, by a source, or waiting. */
export function useToday(): { all: HabitToday[]; asked: HabitToday[] } {
  const p = usePlan();
  const l = useSyncExternalStore(subscribe, freshLog);
  const meals = useMeals();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const mealsToday = meals.filter((m) => m.at >= start.getTime()).length;
  const dow = new Date().getDay();

  const all = p
    .filter((h) => h.days.includes(dow))
    .map((h): HabitToday => {
      const goal = h.kind === "count" ? h.goal ?? 1 : 1;
      const taps = l.taps[h.id] ?? [];
      if (h.kind === "count") {
        const fromFood = h.source === "food" ? mealsToday : 0;
        const count = Math.max(taps.length, fromFood);
        return { h, count, goal, done: count >= goal, by: fromFood > taps.length ? "From your food log" : undefined, last: taps[taps.length - 1] };
      }
      if (h.id in l.done) return { h, count: 1, goal, done: true, answer: l.done[h.id] };
      if (h.source === "band" && metric("workouts").value !== "0") return { h, count: 1, goal, done: true, by: "From your band" };
      return { h, count: 0, goal, done: false };
    });
  return { all, asked: all.filter((t) => t.h.checkIn) };
}

/** A habit's one-word name. */
export const shortOf = (h: Habit) => h.short ?? h.name.split(" ")[0];

/** "8 glasses", "1 meal": a count habit's unit for a number. */
export const unitFor = (h: Habit, n: number) => (h.unit ? h.unit[n === 1 ? 0 : 1] : "");

/** "Every day", "Weekdays", "Mon, Wed, Fri". */
export function daysLabel(days: number[]): string {
  const set = [...days].sort();
  if (set.length === 7) return "Every day";
  if (set.join() === WEEKDAYS.join()) return "Weekdays";
  if (set.join() === "0,6") return "Weekends";
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return set.map((d) => names[d]).join(", ");
}
