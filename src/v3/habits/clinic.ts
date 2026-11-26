import { useMemo, useSyncExternalStore } from "react";
import { todayKey, useMeals } from "../food/store";
import type { Slot } from "../food/data";
import { useHour } from "../demo/clock";
import { useToday, type HabitToday } from "./plan";

/*
 * The plan the care team writes in the clinic portal: daily energy and
 * nutrient targets, a meal plan with a time, an energy guide and a few
 * interchangeable choices per meal, a note from the dietitian, and the
 * prescribed habits (medication, supplements) that live in the habit plan
 * with `prescribed` set. Home shows meals and doses as one day in clock
 * order, so the member ticks off what the care team asked for.
 *
 * DEMO: mock data for the prototype; the portal export does not reach the app.
 */

export interface MealChoice {
  name: string;
  kcal: number;
  /** grams of carbs, protein, fat */
  carbs: number;
  protein: number;
  fat: number;
}

export interface PlannedMeal {
  id: string;
  slot: Slot;
  name: string;
  time: string;
  kcal: number;
  choices: MealChoice[];
}

export interface Micro {
  name: string;
  value: number;
  unit: string;
  /** what the plan aims for, in words ("at least 25 g") and as a number */
  target: string;
  goal: number;
  /** a ceiling rather than a floor */
  limit?: boolean;
}

export const CLINIC_PLAN = {
  team: "Your care team",
  dietitian: "Elin Berg, dietitian",
  doctor: "Dr. Jonas Ek",
  updated: "18 Nov",
  goal: "Keep your weight steady",
  note: "Keep breakfast protein-rich and add a handful of nuts to the afternoon snack. Iron is still a little low, so pair lentils or spinach with something rich in vitamin C.",
  kcal: 1750,
  macros: { carbs: 218, protein: 88, fat: 58 },
  micros: [
    { name: "Fibre", value: 28, unit: "g", target: "at least 25 g", goal: 25 },
    { name: "Sodium", value: 1220, unit: "mg", target: "under 2,300 mg", goal: 2300, limit: true },
    { name: "Calcium", value: 1000, unit: "mg", target: "1,000 mg", goal: 1000 },
    { name: "Iron", value: 12, unit: "mg", target: "18 mg", goal: 18 },
    { name: "Vitamin D", value: 15, unit: "µg", target: "15 µg", goal: 15 },
  ] as Micro[],
  meals: [
    {
      id: "breakfast", slot: "breakfast", name: "Breakfast", time: "08:00", kcal: 400,
      choices: [
        { name: "Oats with milk, banana and chia", kcal: 400, carbs: 55, protein: 16, fat: 12 },
        { name: "Cheese omelette, wholegrain toast and tomato", kcal: 420, carbs: 40, protein: 22, fat: 14 },
        { name: "Cottage cheese sandwich with avocado", kcal: 380, carbs: 42, protein: 18, fat: 12 },
      ],
    },
    {
      id: "snack-am", slot: "snack", name: "Morning snack", time: "10:30", kcal: 180,
      choices: [
        { name: "Yoghurt with fruit and almonds", kcal: 180, carbs: 24, protein: 8, fat: 7 },
        { name: "Yoghurt, oat and strawberry smoothie", kcal: 170, carbs: 26, protein: 7, fat: 5 },
      ],
    },
    {
      id: "lunch", slot: "lunch", name: "Lunch", time: "13:00", kcal: 450,
      choices: [
        { name: "Grilled chicken, bulgur and salad", kcal: 450, carbs: 52, protein: 32, fat: 12 },
        { name: "Vegetables in olive oil with yoghurt", kcal: 430, carbs: 56, protein: 16, fat: 14 },
      ],
    },
    {
      id: "snack-pm", slot: "snack", name: "Afternoon snack", time: "16:00", kcal: 150,
      choices: [
        { name: "An apple and a few almonds", kcal: 150, carbs: 18, protein: 4, fat: 8 },
        { name: "Hummus with vegetables", kcal: 150, carbs: 14, protein: 5, fat: 8 },
      ],
    },
    {
      id: "dinner", slot: "dinner", name: "Dinner", time: "19:00", kcal: 400,
      choices: [
        { name: "Salmon, vegetables and wholegrain bread", kcal: 410, carbs: 36, protein: 30, fat: 16 },
        { name: "Lentil soup with salad", kcal: 390, carbs: 52, protein: 20, fat: 10 },
      ],
    },
  ] as PlannedMeal[],
};

/* ---------------------------------------------------------------- meals eaten from the plan */

/** Today's planned meals the member ticked: meal id → index of the choice eaten. */
type Eaten = Record<string, number>;
const KEY = () => `phenome.v3.planmeals.${todayKey()}`;
let eatenDay = todayKey();
let eaten: Eaten = read();
const listeners = new Set<() => void>();

function read(): Eaten {
  try {
    return JSON.parse(localStorage.getItem(KEY()) ?? "{}") as Eaten;
  } catch {
    return {};
  }
}
function current(): Eaten {
  if (eatenDay !== todayKey()) {
    eatenDay = todayKey();
    eaten = read();
  }
  return eaten;
}
function write(next: Eaten) {
  eaten = next;
  try {
    localStorage.setItem(KEY(), JSON.stringify(next));
  } catch {
    // storage blocked: kept for this visit
  }
  listeners.forEach((l) => l());
}

export const mealActions = {
  eat(id: string, choice = 0) {
    write({ ...current(), [id]: choice });
  },
  undo(id: string) {
    const next = { ...current() };
    delete next[id];
    write(next);
  },
};

export function useEaten(): Eaten {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    current,
  );
}

/* ---------------------------------------------------------------- the day */

/** One thing due at one time: a planned meal, or one dose of a prescribed habit. */
export interface PlanItem {
  key: string;
  time: string;
  /** minutes since midnight, for ordering and "due" */
  at: number;
  done: boolean;
  due: boolean;
  meal?: PlannedMeal;
  /** the choice eaten, for a meal ticked from the plan */
  choice?: number;
  /** a meal met by a food diary entry rather than a tick */
  logged?: boolean;
  habit?: HabitToday;
  dose?: number;
}

const minutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** Today's plan in clock order, what is done, and up to three things to do next. */
export function useClinicDay(): { items: PlanItem[]; done: number; next: PlanItem[] } {
  const { all } = useToday();
  const meals = useMeals();
  const ticked = useEaten();
  const hour = useHour();
  return useMemo(() => {
    const today = todayKey();
    const now = hour * 60;
    // meals logged per slot today; two planned snacks are met by two snack logs
    const logged: Partial<Record<Slot, number>> = {};
    for (const m of meals) if (m.day === today && m.status === "ready") logged[m.slot] = (logged[m.slot] ?? 0) + 1;
    const seen: Partial<Record<Slot, number>> = {};

    const items: PlanItem[] = [];
    for (const meal of CLINIC_PLAN.meals) {
      const nth = (seen[meal.slot] = (seen[meal.slot] ?? 0) + 1);
      const fromDiary = (logged[meal.slot] ?? 0) >= nth;
      const at = minutes(meal.time);
      items.push({ key: meal.id, time: meal.time, at, due: at <= now, done: fromDiary || meal.id in ticked, meal, choice: ticked[meal.id], logged: fromDiary });
    }
    for (const t of all) {
      if (!t.h.prescribed) continue;
      (t.h.times ?? ["08:00"]).forEach((time, i) => {
        const at = minutes(time);
        const done = t.h.kind === "count" ? t.count > i : t.done;
        items.push({ key: `${t.h.id}-${i}`, time, at, due: at <= now, done, habit: t, dose: i });
      });
    }
    // meals before medication at the same time: "with breakfast" reads after breakfast
    items.sort((a, b) => a.at - b.at || Number(!!a.habit) - Number(!!b.habit));

    const open = items.filter((i) => !i.done);
    const next = [...open.filter((i) => i.due), ...open.filter((i) => !i.due)].slice(0, 3);
    return { items, done: items.length - open.length, next };
  }, [all, meals, ticked, hour]);
}
