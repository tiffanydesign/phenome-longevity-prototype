import { useMemo } from "react";
import type { Metric } from "../data/metrics";
import { useGoals } from "../metric/goals";
import { fmt, TARGET } from "../food/data";
import { dayKey, dayOffset, dayTotals, useMeals } from "../food/store";
import { dayAny } from "../food/history";

/** A reading that may carry the day's macro grams, for cards that split energy by source. */
export type DiaryMetric = Metric & { grams?: { protein: number; carbs: number; fat: number } };

/**
 * Nutrition cards on Home read the food diary itself, so they always agree
 * with the Nutrition page: energy eaten, the member's own goal, what is left,
 * and the day's real protein, carbs and fat. `ago` steps back whole days.
 * Every other reading passes through untouched.
 */
export function useDiaryMetric(m: Metric, ago = 0): DiaryMetric {
  const meals = useMeals();
  const goals = useGoals();
  const goal = goals.get("diet") ?? TARGET.kcal;
  return useMemo(() => {
    if (m.id !== "diet") return m;
    const d = dayOffset(-ago);
    const t = ago === 0 ? dayTotals(meals, dayKey(d)) : dayAny(meals, d);
    const left = goal - t.kcal;
    return {
      ...m,
      value: fmt(t.kcal),
      unit: `/ ${fmt(goal)} kcal`,
      delta: t.kcal === 0 ? "Nothing logged yet" : left >= 0 ? `${fmt(left)} kcal left` : `${fmt(-left)} kcal over`,
      grams: { protein: t.protein, carbs: t.carbs, fat: t.fat },
    };
  }, [m, meals, goal, ago]);
}
