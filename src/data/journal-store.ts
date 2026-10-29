import { createStore, useDataset } from "@/lib/data";
import {
  CALORIE_GOAL,
  DEFAULT_HABITS,
  FOODS,
  KCAL_PER_SECOND,
  journalSeed,
  type Food,
  type Habit,
  type MealId,
} from "./journal";

/**
 * In-memory journal state shared by Activity / Diet / Habits (resets on reload).
 * Seeds from journalSeed (real = empty account, demo = populated) are merged in by the hooks.
 */

export interface LoggedActivity {
  id: string;
  sportId: string;
  start: number;
  seconds: number;
}
export interface LoggedMeal {
  id: string;
  meal: MealId;
  foodId: string;
  grams: number;
  at: number;
}

interface JournalState {
  activities: LoggedActivity[];
  meals: LoggedMeal[];
  /** user-created habits, newest first (journal_habits/after_add shows the new one on top) */
  habits: Habit[];
  completed: string[];
  /** live workout (activity_form/running) — kept here so it survives navigation */
  running: { sportId: string; start: number } | null;
  /** true once the user logged anything in this session */
  touched: boolean;
}

const store = createStore<JournalState>({ activities: [], meals: [], habits: [], completed: [], running: null, touched: false });

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${++seq}`;

export const activityKcal = (seconds: number) => Math.round(seconds * KCAL_PER_SECOND);
export const foodById = (id: string): Food => FOODS.find((f) => f.id === id) ?? FOODS[0];

export const journalActions = {
  startActivity(sportId: string) {
    store.set((s) => ({ ...s, running: { sportId, start: Date.now() } }));
  },
  stopActivity(): string | null {
    const r = store.get().running;
    if (!r) return null;
    const entry: LoggedActivity = { id: uid("act"), sportId: r.sportId, start: r.start, seconds: Math.max(0, Math.floor((Date.now() - r.start) / 1000)) };
    store.set((s) => ({ ...s, running: null, touched: true, activities: [...s.activities, entry] }));
    return entry.id;
  },
  cancelActivity() {
    store.set((s) => ({ ...s, running: null }));
  },
  addMeal(meal: MealId, foodId: string, grams: number) {
    const entry: LoggedMeal = { id: uid("meal"), meal, foodId, grams, at: Date.now() };
    store.set((s) => ({ ...s, touched: true, meals: [...s.meals, entry] }));
  },
  completeHabit(id: string) {
    store.set((s) => ({ ...s, touched: true, completed: s.completed.includes(id) ? s.completed : [...s.completed, id] }));
  },
  addHabit(name: string, notes: string) {
    const h: Habit = { id: uid("habit"), name, notes };
    store.set((s) => ({ ...s, touched: true, habits: [h, ...s.habits] }));
  },
};

export function useRunning() {
  return store.use().running;
}

/** Activities of the seed (real/demo) + this session, oldest first. */
export function useActivities(): LoggedActivity[] {
  const seed = useDataset(journalSeed);
  const s = store.use();
  return [...seed.activities.map((a, i) => ({ id: `seed-${i}`, ...a })), ...s.activities];
}

export function useMeals(): LoggedMeal[] {
  const seed = useDataset(journalSeed);
  const s = store.use();
  return [...seed.meals.map((m, i) => ({ id: `seed-meal-${i}`, ...m })), ...s.meals];
}

export function useHabits(): { habits: Habit[]; completed: Set<string> } {
  const seed = useDataset(journalSeed);
  const s = store.use();
  return { habits: [...s.habits, ...DEFAULT_HABITS], completed: new Set([...seed.completedHabitIds, ...s.completed]) };
}

/** Nutrient totals of a list of logged meals (grams scale the per-100 g values). */
export function mealTotals(meals: LoggedMeal[]) {
  const t = { kcal: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, calcium: 0, iron: 0 };
  for (const m of meals) {
    const f = foodById(m.foodId);
    const k = m.grams / 100;
    t.kcal += f.kcal * k;
    t.protein += f.protein * k;
    t.fat += f.fat * k;
    t.carbs += f.carbs * k;
    t.fiber += f.fiber * k;
    t.calcium += f.calcium * k;
    t.iron += f.iron * k;
  }
  return t;
}

/**
 * Home → Health Journal cards (home/journal_with_data). null until the user logged anything
 * (or demo data is on).
 */
export function useJournalSummary(): { dietKcal: number; dietGoal: number; habitsPct: number } | null {
  const seed = useDataset(journalSeed);
  const s = store.use();
  const meals = useMeals();
  const { habits, completed } = useHabits();
  const seeded = seed.meals.length > 0 || seed.activities.length > 0 || seed.completedHabitIds.length > 0;
  if (!s.touched && !seeded) return null;
  const done = habits.filter((h) => completed.has(h.id)).length;
  return {
    dietKcal: Math.round(mealTotals(meals).kcal),
    dietGoal: CALORIE_GOAL,
    habitsPct: habits.length ? Math.round((done / habits.length) * 100) : 0,
  };
}
