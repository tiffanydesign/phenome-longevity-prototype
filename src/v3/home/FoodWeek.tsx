import { useMemo } from "react";
import { useGoals } from "../metric/goals";
import { fmt, TARGET } from "../food/data";
import { dayOffset, dayTotals, dayKey, useMeals } from "../food/store";
import { dayAny } from "../food/history";

/*
 * The Lifestyle tab's week in numbers: calories eaten on each of the last
 * seven days, read from the same food diary as the Nutrition page, and the
 * tab's headline worked out from today.
 */

/** The week's numbers, shared by the card and the tab's headline. */
export function useFoodWeek() {
  const meals = useMeals();
  const goals = useGoals();
  const goal = goals.get("diet") ?? TARGET.kcal;
  return useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = dayOffset(i - 6);
      const today = i === 6;
      const t = today ? dayTotals(meals, dayKey(d)) : dayAny(meals, d);
      return { d, t, today };
    });
    const logged = days.filter((x) => !x.today && x.t.kcal > 0);
    const avg = logged.length ? logged.reduce((a, x) => a + x.t.kcal, 0) / logged.length : 0;
    return { days, goal, avg, today: days[6].t };
  }, [meals, goal]);
}

/** Headline and read for the tab, from today's diary rather than fixed copy. */
export function foodVerdict(w: ReturnType<typeof useFoodWeek>) {
  const t = w.today;
  const share = t.kcal / w.goal;
  const protein = t.protein / TARGET.protein;
  if (t.kcal === 0) return { headline: "Nothing logged yet", text: "Snap your first plate and the day's numbers fill in on their own." };
  if (share > 1) return { headline: "Over today's budget", text: `${fmt(t.kcal - w.goal)} kcal over your goal. A lighter evening keeps the week on track.` };
  const p = protein >= 0.6 ? "Protein is tracking toward your goal" : `Protein is behind, ${fmt(TARGET.protein - t.protein)} g to go`;
  return { headline: "On pace for today", text: `${p}, and ${fmt(w.goal - t.kcal)} kcal are left in the day's budget.` };
}
