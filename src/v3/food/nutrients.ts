import { foodOf, TARGET, type Portion } from "./data";
import type { Meal } from "./store";

/*
 * The full nutrient panel behind the six headline nutrients. Values are per
 * 100 g from the same ingredient rows the rest of the food pages read;
 * a food without a value for a nutrient (a mixed sauce, a dressing) is left
 * out of that nutrient's sum rather than guessed, and the panel says how much
 * of the day's food the sum covers. Targets are adult daily reference
 * amounts; the three "keep under" nutrients are ceilings, not goals.
 */

export type PanelId =
  | "fiber"
  | "omega3"
  | "satfat"
  | "sugar"
  | "sodium"
  | "vitc"
  | "vitd"
  | "folate"
  | "b12"
  | "calcium"
  | "iron"
  | "potassium"
  | "magnesium"
  | "zinc";

export type Group = "limit" | "fibre" | "vitamins" | "minerals";

export interface PanelNutrient {
  id: PanelId;
  name: string;
  unit: "g" | "mg" | "µg";
  /** a daily goal to reach, or a ceiling to keep under */
  kind: "goal" | "limit";
  target: number;
  group: Group;
  /** why it matters, in one line, shown under the name */
  why: string;
}

export const GROUPS: { id: Group; name: string }[] = [
  { id: "limit", name: "Keep under" },
  { id: "fibre", name: "Fibre & fats" },
  { id: "vitamins", name: "Vitamins" },
  { id: "minerals", name: "Minerals" },
];

export const PANEL: PanelNutrient[] = [
  { id: "satfat", name: "Saturated fat", unit: "g", kind: "limit", target: 22, group: "limit", why: "Raises LDL cholesterol" },
  { id: "sugar", name: "Sugars", unit: "g", kind: "limit", target: 50, group: "limit", why: "Spikes glucose, adds empty energy" },
  { id: "sodium", name: "Sodium", unit: "mg", kind: "limit", target: 2300, group: "limit", why: "Pushes blood pressure up" },
  { id: "fiber", name: "Fibre", unit: "g", kind: "goal", target: TARGET.fiber, group: "fibre", why: "Feeds the gut, steadies glucose" },
  { id: "omega3", name: "Omega-3", unit: "g", kind: "goal", target: 1.6, group: "fibre", why: "Heart rhythm and inflammation" },
  { id: "vitd", name: "Vitamin D", unit: "µg", kind: "goal", target: 15, group: "vitamins", why: "Bone, muscle and immunity" },
  { id: "b12", name: "Vitamin B12", unit: "µg", kind: "goal", target: 2.4, group: "vitamins", why: "Nerves and red blood cells" },
  { id: "folate", name: "Folate", unit: "µg", kind: "goal", target: 400, group: "vitamins", why: "Cell repair, keeps homocysteine low" },
  { id: "vitc", name: "Vitamin C", unit: "mg", kind: "goal", target: 90, group: "vitamins", why: "Collagen and iron uptake" },
  { id: "potassium", name: "Potassium", unit: "mg", kind: "goal", target: 3400, group: "minerals", why: "Balances sodium, lowers blood pressure" },
  { id: "magnesium", name: "Magnesium", unit: "mg", kind: "goal", target: 400, group: "minerals", why: "Muscle, sleep and glucose control" },
  { id: "calcium", name: "Calcium", unit: "mg", kind: "goal", target: TARGET.calcium, group: "minerals", why: "Bone density" },
  { id: "iron", name: "Iron", unit: "mg", kind: "goal", target: TARGET.iron, group: "minerals", why: "Carries oxygen in the blood" },
  { id: "zinc", name: "Zinc", unit: "mg", kind: "goal", target: 11, group: "minerals", why: "Immunity and healing" },
];

type Extra = Partial<Record<Exclude<PanelId, "fiber" | "calcium" | "iron">, number>>;

/* columns: saturated fat g, sugars g, sodium mg, omega-3 g, potassium mg, magnesium mg, zinc mg, vitamin C mg, vitamin D µg, folate µg, B12 µg; null where the table has no value */
const row = (...v: (number | null)[]): Extra => {
  const keys = ["satfat", "sugar", "sodium", "omega3", "potassium", "magnesium", "zinc", "vitc", "vitd", "folate", "b12"] as const;
  const out: Extra = {};
  keys.forEach((k, i) => {
    if (v[i] !== null && v[i] !== undefined) out[k] = v[i] as number;
  });
  return out;
};

const EXTRA: Record<string, Extra> = {
  sourdough: row(0.4, 2.5, 510, 0.05, 115, 25, 0.9, 0, 0, 90, 0),
  avocado: row(2.1, 0.7, 7, 0.11, 485, 29, 0.6, 10, 0, 81, 0),
  "egg-fried": row(4.3, 0.4, 207, 0.1, 152, 13, 1.4, 0, 2.2, 49, 1),
  "egg-boiled": row(3.3, 1.1, 124, 0.08, 126, 10, 1.1, 0, 2.2, 44, 1.1),
  yogurt: row(3.3, 4, 36, 0.02, 141, 11, 0.5, 0.5, 0.1, 7, 0.75),
  blueberries: row(0, 10, 1, 0.06, 77, 6, 0.2, 9.7, 0, 6, 0),
  "flat-white": row(1.9, 4.8, 43, 0.01, 150, 11, 0.4, 0, 1.1, 5, 0.45),
  salmon: row(2.5, 0, 61, 2.2, 384, 30, 0.4, 0, 11, 26, 3.2),
  "brown-rice": row(0.2, 0.4, 5, 0.02, 86, 43, 0.6, 0, 0, 9, 0),
  edamame: row(0.6, 2.2, 6, 0.3, 436, 64, 1.4, 6.1, 0, 311, 0),
  cucumber: row(0, 1.7, 2, 0, 147, 13, 0.2, 2.8, 0, 7, 0),
  "red-cabbage": row(0, 3.8, 27, 0.03, 243, 16, 0.2, 57, 0, 18, 0),
  corn: row(0.3, 4.5, 15, 0.02, 218, 26, 0.6, 5.5, 0, 23, 0),
  tomato: row(0, 2.6, 5, 0, 237, 11, 0.2, 14, 0, 15, 0),
  "sesame-dressing": row(3.7, 10, 1800, null, null, null, null, null, 0, null, 0),
  chickpeas: row(0.3, 4.8, 7, 0.04, 291, 48, 1.5, 1.3, 0, 172, 0),
  "sweet-potato": row(0.1, 6.5, 36, 0, 475, 27, 0.3, 19.6, 0, 6, 0),
  greens: row(0, 0.5, 40, 0.1, 450, 50, 0.4, 20, 0, 150, 0),
  radish: row(0, 1.9, 39, 0, 233, 10, 0.3, 14.8, 0, 25, 0),
  tahini: row(7.5, 0.5, 115, 0.4, 414, 95, 4.6, 0, 0, 98, 0),
  prawns: row(0.1, 0, 111, 0.3, 170, 39, 1.6, 0, 0, 3, 1.4),
  "curry-sauce": row(10, 3, 520, null, null, null, null, 2, 0, null, 0),
  "jasmine-rice": row(0.1, 0.1, 1, 0, 35, 12, 0.5, 0, 0, 3, 0),
  "brioche-toast": row(6, 12, 300, 0.1, 130, 18, 0.7, 0, 0.5, 40, 0.3),
  banana: row(0.1, 12, 1, 0.03, 358, 27, 0.2, 8.7, 0, 20, 0),
  maple: row(0, 60, 12, 0, 212, 21, 1.5, 0, 0, 0, 0),
  pomegranate: row(0.1, 13.7, 3, 0, 236, 12, 0.4, 10.2, 0, 38, 0),
  feta: row(15, 4, 917, 0.3, 62, 19, 2.9, 0, 0.4, 32, 1.7),
  almonds: row(3.8, 4.4, 1, 0, 733, 270, 3.1, 0, 0, 44, 0),
  apple: row(0, 10.4, 1, 0.01, 107, 5, 0, 4.6, 0, 3, 0),
  oats: row(0.3, 0.3, 4, 0.02, 70, 27, 1, 0, 0, 9, 0),
  chicken: row(1, 0, 74, 0.06, 256, 29, 1, 0, 0.1, 4, 0.3),
  "lentil-soup": row(0.3, 1.5, 300, 0.03, 220, 20, 0.7, 1.5, 0, 50, 0),
  zucchini: row(0.1, 2.5, 8, 0, 261, 18, 0.3, 17.9, 0, 24, 0),
  carrot: row(0, 4.7, 69, 0, 320, 12, 0.2, 5.9, 0, 19, 0),
  kale: row(0.1, 2.3, 53, 0.1, 348, 33, 0.4, 93, 0, 62, 0),
  "yogurt-strawberry": row(2, 12, 50, null, 150, 12, 0.5, 4, null, 8, 0.4),
};

export interface PanelRow {
  n: PanelNutrient;
  amount: number;
  /** share of the day's food, by weight, that has a value for this nutrient */
  coverage: number;
}

/** The day's panel: each nutrient summed over the foods that have a value for it. */
export function panelOf(meals: Meal[]): PanelRow[] {
  const portions: Portion[] = meals.flatMap((m) => m.items.map((p) => ({ food: p.food, grams: p.grams * m.servings })));
  const weight = portions.reduce((s, p) => s + p.grams, 0);
  return PANEL.map((n) => {
    let amount = 0;
    let known = 0;
    for (const p of portions) {
      const k = p.grams / 100;
      let v: number | undefined;
      if (n.id === "fiber" || n.id === "calcium" || n.id === "iron") v = foodOf(p.food)[n.id];
      else v = EXTRA[p.food]?.[n.id];
      if (v === undefined) continue;
      amount += v * k;
      known += p.grams;
    }
    return { n, amount, coverage: weight ? known / weight : 0 };
  });
}
