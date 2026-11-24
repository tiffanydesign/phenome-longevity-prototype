import { createStore } from "@/lib/data";
import { TARGET, type NutrientId } from "./data";

/*
 * The member's own nutrient targets. TARGET in data.ts holds the defaults
 * and is the one object every food page reads, so a saved target is written
 * into it in place and the pages that render it subscribe here to redraw.
 * Energy stays with the other daily goals (goals.tsx, id "diet").
 */

const KEY = "phenome.v3.targets";
export const DEFAULT_TARGET: Record<NutrientId, number> = {
  protein: TARGET.protein,
  carbs: TARGET.carbs,
  fat: TARGET.fat,
  fiber: TARGET.fiber,
  calcium: TARGET.calcium,
  iron: TARGET.iron,
};

/** Energy in one gram of each macro. */
export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const;
export type Macro = keyof typeof KCAL_PER_G;
export const MACRO_IDS: Macro[] = ["protein", "carbs", "fat"];

/** How the day's energy is split, as whole percentages of calories. */
export interface Split {
  protein: number;
  carbs: number;
  fat: number;
}

export interface Plan {
  /** a named split, or "custom" when the grams were set one by one */
  preset: PresetId;
  targets: Record<NutrientId, number>;
}

export type PresetId = "balanced" | "protein" | "lowcarb" | "custom";
export const PRESETS: { id: Exclude<PresetId, "custom">; name: string; note: string; split: Split }[] = [
  { id: "balanced", name: "Balanced", note: "An even day for most goals", split: { protein: 22, carbs: 45, fat: 33 } },
  { id: "protein", name: "High protein", note: "Builds and keeps muscle", split: { protein: 30, carbs: 40, fat: 30 } },
  { id: "lowcarb", name: "Lower carb", note: "Steadier blood sugar", split: { protein: 28, carbs: 27, fat: 45 } },
];

function read(): Plan {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Plan | null;
    if (saved?.targets) return { preset: saved.preset ?? "custom", targets: { ...DEFAULT_TARGET, ...saved.targets } };
  } catch {
    // storage blocked or malformed: fall back to the defaults
  }
  return { preset: "balanced", targets: { ...DEFAULT_TARGET } };
}

const store = createStore<Plan>(read());
Object.assign(TARGET, store.get().targets);

/** Keeps a new plan: written into TARGET, kept on this device, every reader redrawn. */
export function savePlan(plan: Plan) {
  Object.assign(TARGET, plan.targets);
  try {
    localStorage.setItem(KEY, JSON.stringify(plan));
  } catch {
    // storage blocked: the plan lasts for this session only
  }
  store.set({ preset: plan.preset, targets: { ...plan.targets } });
}

/** Subscribes a page to the plan, so a saved target redraws it. */
export const usePlan = () => store.use();

/** Grams of each macro for an energy goal and a split. */
export function gramsFor(kcal: number, split: Split): Split {
  return {
    protein: Math.round((kcal * split.protein) / 100 / KCAL_PER_G.protein),
    carbs: Math.round((kcal * split.carbs) / 100 / KCAL_PER_G.carbs),
    fat: Math.round((kcal * split.fat) / 100 / KCAL_PER_G.fat),
  };
}

/** The split a set of grams makes, as shares of the energy they carry. */
export function splitOf(g: Split) {
  const kcal = MACRO_IDS.map((id) => g[id] * KCAL_PER_G[id]);
  const sum = kcal.reduce((a, b) => a + b, 0);
  return { sum, share: Object.fromEntries(MACRO_IDS.map((id, i) => [id, sum ? kcal[i] / sum : 0])) as Record<Macro, number> };
}
