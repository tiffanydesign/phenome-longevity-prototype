import { DAILY_REF } from "@/data/journal";
import type { mealTotals } from "@/data/journal-store";
import type { Macro, NutrientRow } from "../shared/parts";

type Totals = ReturnType<typeof mealTotals>;

/**
 * Number formatting reproduced from the captures: grams and % are floored
 * (2.75 g carbs → "2 g", 0.83 % → "0%"), kcal per macro rounded (8.2 g × 4 = 32.8 → "33 kcal").
 * Bars use the rounded % (carbs bar shows a 1 % sliver while the label reads 0 %).
 */
const fl = (n: number) => Math.floor(n + 1e-9);

/** sep: "g - " on the diet tracker / meal summary, "g - " glued ("8g - 33 kcal") on item detail */
export function macroTiles(t: Totals, glued = false): Macro[] {
  const g = (n: number) => (glued ? `${fl(n)}g` : `${fl(n)} g`);
  return [
    { label: "Protein", tone: "protein", value: `${g(t.protein)} - ${Math.round(t.protein * 4)} kcal` },
    { label: "Fat", tone: "fat", value: `${g(t.fat)} - ${Math.round(t.fat * 9)} kcal` },
    { label: "Carbohydrates", tone: "carbs", value: `${g(t.carbs)} - ${Math.round(t.carbs * 4)} kcal` },
    { label: "Fiber", tone: "fiber", value: g(t.fiber) },
  ];
}

export function nutrientRows(t: Totals): NutrientRow[] {
  const row = (label: string, v: number, ref: number, unit: string): NutrientRow => {
    const p = (v / ref) * 100;
    return { label, pct: fl(p), bar: Math.round(p), amount: `${fl(v)} ${unit}` };
  };
  return [
    row("Protein", t.protein, DAILY_REF.protein, "g"),
    row("Fat", t.fat, DAILY_REF.fat, "g"),
    row("Carbohydrates", t.carbs, DAILY_REF.carbs, "g"),
    row("Fiber", t.fiber, DAILY_REF.fiber, "g"),
    row("Calcium", t.calcium, DAILY_REF.calcium, "mg"),
    row("Iron", t.iron, DAILY_REF.iron, "mg"),
  ];
}
