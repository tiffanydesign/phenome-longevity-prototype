import { useSyncExternalStore } from "react";
import { addTotals, DISHES, dishOf, slotAt, totalsOf, ZERO, type Portion, type Slot, type Totals } from "./data";

/*
 * The member's food diary, kept on this device. A week of demo meals is laid
 * down relative to today the first time (and again on a new day), so the week
 * strip and history always have something true to show.
 */

export interface Meal {
  id: string;
  /** local day, YYYY-MM-DD */
  day: string;
  /** epoch ms the meal was eaten */
  at: number;
  slot: Slot;
  name: string;
  photo?: string;
  items: Portion[];
  servings: number;
  /** a scan still working out what is on the plate */
  status: "analysing" | "ready";
  /** the dish a scan recognised, for its note */
  dish?: string;
  saved?: boolean;
}

interface State {
  seededOn: string;
  meals: Meal[];
}

const KEY = "phenome.v3.food.1";
/** how long a scan takes to read the plate (ms) */
export const ANALYSE_MS = 3600;

export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayKey = () => dayKey(new Date());
export const dayOffset = (n: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
};

let seq = 0;
const uid = () => `m${Date.now().toString(36)}${(++seq).toString(36)}`;

function at(day: Date, h: number, m: number) {
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function fromDish(dishId: string, day: Date, h: number, m: number, slot: Slot): Meal {
  const d = dishOf(dishId) ?? DISHES[0];
  return { id: `seed-${dayKey(day)}-${slot}`, day: dayKey(day), at: at(day, h, m), slot, name: d.name, photo: d.photo, items: d.items, servings: 1, status: "ready", dish: d.id, saved: d.id === "salmon-bowl" || d.id === "egg-toast" };
}

function snack(day: Date, h: number, m: number): Meal {
  return {
    id: `seed-${dayKey(day)}-snack`,
    day: dayKey(day),
    at: at(day, h, m),
    slot: "snack",
    name: "Greek yogurt and blueberries",
    items: [
      { food: "yogurt", grams: 150 },
      { food: "blueberries", grams: 50 },
      { food: "flat-white", grams: 180 },
    ],
    servings: 1,
    status: "ready",
  };
}

/** Six days back plus this morning. One day is left empty: a gap reads as a gap. */
function seed(): Meal[] {
  const plan: [string, string, string | null, boolean][] = [
    ["french-toast", "green-salad", "shrimp-curry", true],
    ["egg-toast", "buddha-bowl", "salmon-bowl", false],
    ["", "", null, false],
    ["egg-toast", "salmon-bowl", "shrimp-curry", true],
    ["french-toast", "buddha-bowl", "green-salad", true],
    ["egg-toast", "green-salad", "shrimp-curry", false],
  ];
  const out: Meal[] = [];
  plan.forEach(([b, l, dn, s], i) => {
    if (!b) return;
    const day = dayOffset(i - 6);
    out.push(fromDish(b, day, 8, 5 + i * 3, "breakfast"));
    if (s) out.push(snack(day, 10, 40));
    out.push(fromDish(l, day, 12, 30 + i * 2, "lunch"));
    if (dn) out.push(fromDish(dn, day, 19, 10 + i * 4, "dinner"));
  });
  const today = dayOffset(0);
  out.push(fromDish("egg-toast", today, 8, 10, "breakfast"), snack(today, 10, 30), fromDish("salmon-bowl", today, 12, 40, "lunch"));
  // only meals already eaten by now
  return out.filter((m) => m.at <= Date.now() || m.day !== todayKey());
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (s.seededOn === todayKey()) return s;
    }
  } catch {
    // storage blocked or broken: start fresh
  }
  return { seededOn: todayKey(), meals: seed() };
}

let state: State = load();
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full (photos) or blocked: keep for this session
  }
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useMeals(): Meal[] {
  return useSyncExternalStore(subscribe, () => state.meals);
}
export const mealById = (id: string) => state.meals.find((m) => m.id === id);
export function useMeal(id: string | undefined) {
  const meals = useMeals();
  return meals.find((m) => m.id === id);
}

export const mealTotals = (m: Meal): Totals => (m.status === "ready" ? totalsOf(m.items, m.servings) : { ...ZERO });
export const dayTotals = (meals: Meal[], day: string): Totals => meals.filter((m) => m.day === day).reduce((t, m) => addTotals(t, mealTotals(m)), { ...ZERO });

export const food = {
  /** A plate photographed: logged at once as "analysing", ready after ANALYSE_MS. */
  scan(photo: string, dishId = "egg-plate", ready = false): string {
    const d = dishOf(dishId) ?? DISHES[0];
    const now = new Date();
    const m: Meal = { id: uid(), day: dayKey(now), at: now.getTime(), slot: slotAt(now), name: d.name, photo, items: d.items, servings: 1, status: ready ? "ready" : "analysing", dish: d.id };
    set({ ...state, meals: [...state.meals, m] });
    if (!ready) window.setTimeout(() => food.update(m.id, { status: "ready" }), ANALYSE_MS);
    return m.id;
  },
  add(slot: Slot, name: string, items: Portion[], day = todayKey()): string {
    const now = new Date();
    const when = day === todayKey() ? now.getTime() : new Date(`${day}T12:00:00`).getTime();
    const m: Meal = { id: uid(), day, at: when, slot, name, items, servings: 1, status: "ready" };
    set({ ...state, meals: [...state.meals, m] });
    return m.id;
  },
  update(id: string, patch: Partial<Meal>) {
    set({ ...state, meals: state.meals.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  },
  remove(id: string) {
    set({ ...state, meals: state.meals.filter((m) => m.id !== id) });
  },
  /** Re-read a plate after the member says what was wrong. */
  reanalyse(id: string, patch: Partial<Meal>) {
    food.update(id, { ...patch, status: "analysing", at: mealById(id)?.at ?? Date.now() });
    window.setTimeout(() => food.update(id, { status: "ready" }), ANALYSE_MS * 0.7);
  },
};

/** Scans in this session that never finished (page reloaded mid-scan) settle at once. */
state.meals.filter((m) => m.status === "analysing").forEach((m) => window.setTimeout(() => food.update(m.id, { status: "ready" }), 300));

/** Recently eaten foods, newest first, one row per food. */
export function recentFoods(meals: Meal[], n = 6): Portion[] {
  const seen = new Set<string>();
  const out: Portion[] = [];
  [...meals].sort((a, b) => b.at - a.at).forEach((m) =>
    m.items.forEach((p) => {
      if (!seen.has(p.food) && out.length < n) {
        seen.add(p.food);
        out.push(p);
      }
    }),
  );
  return out;
}
