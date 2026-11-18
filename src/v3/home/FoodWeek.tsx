import { useMemo } from "react";
import { useGo } from "../ui/shell";
import { useGoals } from "../metric/goals";
import { fmt, NUTRIENT, TARGET, type Totals } from "../food/data";
import { dayOffset, dayTotals, dayKey, useMeals } from "../food/store";
import { dayAny } from "../food/history";
import "./food-week.css";

/*
 * The Nutrition tab's week: calories eaten on each of the last seven days,
 * read from the same food diary as the Nutrition page. Each bar is split by
 * where its energy came from (protein, carbs, fat), the goal is one dashed
 * rule, today is outlined. The card opens Nutrition.
 */

const MACRO_KCAL = { protein: 4, carbs: 4, fat: 9 } as const;

function parts(t: Totals) {
  const k = (["protein", "carbs", "fat"] as const).map((id) => ({ id, kcal: t[id] * MACRO_KCAL[id] }));
  const sum = k.reduce((a, p) => a + p.kcal, 0) || 1;
  return k.map((p) => ({ ...p, share: p.kcal / sum }));
}

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

export function FoodWeek() {
  const go = useGo();
  const w = useFoodWeek();
  const top = Math.max(w.goal * 1.15, ...w.days.map((x) => x.t.kcal));
  return (
    <button className="fw" onClick={(e) => go("/v3/food", { from: e.currentTarget })} aria-label={`Calories this week, ${fmt(w.avg)} a day on average. Open Nutrition`}>
      <header className="fw-head">
        <span>
          <b>{fmt(w.avg)}</b>
          <small>kcal a day on average</small>
        </span>
        <em>This week</em>
      </header>
      <div className="fw-plot" aria-hidden>
        <i className="fw-goal" style={{ bottom: `${(w.goal / top) * 100}%` }}>
          <span>Goal</span>
        </i>
        {w.days.map((x) => (
          <span key={x.d.toISOString()} className="fw-col" data-today={x.today ? "" : undefined}>
            <span className="fw-bar" style={{ height: `${(x.t.kcal / top) * 100}%` }}>
              {x.t.kcal > 0 &&
                parts(x.t)
                  .reverse()
                  .map((p) => <i key={p.id} style={{ flexGrow: p.share, background: NUTRIENT[p.id].hue }} />)}
            </span>
          </span>
        ))}
      </div>
      <div className="fw-axis" aria-hidden>
        {w.days.map((x) => (
          <span key={x.d.toISOString()} data-today={x.today ? "" : undefined}>
            {x.today ? "Today" : x.d.toLocaleDateString("en-GB", { weekday: "short" })}
          </span>
        ))}
      </div>
      <div className="fw-key" aria-hidden>
        {(["protein", "carbs", "fat"] as const).map((id) => (
          <span key={id}>
            <i style={{ background: NUTRIENT[id].hue }} />
            {NUTRIENT[id].short}
          </span>
        ))}
      </div>
    </button>
  );
}
