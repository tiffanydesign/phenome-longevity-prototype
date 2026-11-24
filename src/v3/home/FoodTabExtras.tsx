import { useMemo } from "react";
import { useGo } from "../ui/shell";
import { Chevron } from "../ui/icons";
import { DISHES, fmt, MACROS, NUTRIENT, slotAt, slotName, TARGET, totalsOf, type NutrientId } from "../food/data";
import { dayTotals, mealTotals, todayKey, useMeals } from "../food/store";
import { MealTile, NutrientMark } from "../food/parts";
import { useGoals } from "../metric/goals";
import "./food-tab.css";

/*
 * What follows the Nutrition card on the Nutrition tab. Two questions the
 * card alone does not answer: "what did I eat lately?" (the last three
 * meals, each one tap from its result) and "what should my next meal do?"
 * (energy left plus the macro furthest behind, with one logged-before dish
 * that fits, and the two fastest ways to log).
 */

const dayWord = (day: string) => {
  if (day === todayKey()) return "Today";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yk = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
  if (day === yk) return "Yesterday";
  return new Date(`${day}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};
const clock = (ms: number) => new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const MACRO_WORD: Record<NutrientId, string> = { protein: "protein", carbs: "carbs", fat: "fat", fiber: "fibre", calcium: "calcium", iron: "iron" };

export function FoodTabExtras() {
  const go = useGo();
  const meals = useMeals();
  const goals = useGoals();
  const goal = goals.get("diet") ?? TARGET.kcal;

  const latest = useMemo(() => meals.filter((m) => m.status === "ready" && m.at <= Date.now()).sort((a, b) => b.at - a.at).slice(0, 3), [meals]);

  const next = useMemo(() => {
    const t = dayTotals(meals, todayKey());
    const left = Math.max(0, goal - t.kcal);
    const behind = MACROS.map((id) => ({ id, gap: TARGET[id] - t[id], share: t[id] / TARGET[id] })).sort((a, b) => a.share - b.share)[0];
    // the dish that brings most of the lagging macro without passing the energy left
    const fits = DISHES.map((d) => ({ d, t: totalsOf(d.items) }))
      .filter((x) => x.t.kcal <= Math.max(left, 1) * 1.05)
      .sort((a, b) => b.t[behind.id] - a.t[behind.id])[0];
    // the slot due now, moved on past any slot already logged today
    const order = ["breakfast", "lunch", "snack", "dinner"] as const;
    const logged = new Set(meals.filter((m) => m.day === todayKey()).map((m) => m.slot));
    const from = order.indexOf(slotAt(new Date()));
    const slot = order.slice(from).find((x) => !logged.has(x)) ?? "snack";
    return { left, behind, fits, slot, over: t.kcal > goal };
  }, [meals, goal]);

  return (
    <>
      <section className="v2-group" aria-label="Latest meals">
        <header className="v2-sec">
          <h3>Latest meals</h3>
          <button className="ft-link" onClick={(e) => go("/v3/food", { from: e.currentTarget })}>
            All meals
            <Chevron size={13} />
          </button>
        </header>
        {latest.length === 0 ? (
          <button className="ft-empty" onClick={() => go("/v3/food/scan")}>
            <b>No meals yet</b>
            <span>Snap your plate and it shows up here.</span>
          </button>
        ) : (
          <div className="ft-meals">
            {latest.map((m) => {
              const t = mealTotals(m);
              return (
                <button key={m.id} className="ft-meal" onClick={(e) => go(`/v3/food/meal/${m.id}`, { from: e.currentTarget })}>
                  <span className="ft-pic">{m.photo ? <img src={m.photo} alt="" /> : <MealTile name={m.name} />}</span>
                  <span className="ft-meal-t">
                    <b>{m.name}</b>
                    <small>
                      {slotName(m.slot)} · {dayWord(m.day)} {clock(m.at)}
                    </small>
                    <span className="ft-macros" aria-label={MACROS.map((id) => `${Math.round(t[id])} g ${MACRO_WORD[id]}`).join(", ")}>
                      {MACROS.map((id) => (
                        <span key={id}>
                          <NutrientMark id={id} size={12} />
                          {Math.round(t[id])}g
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="ft-kcal">
                    <b>{fmt(t.kcal)}</b>
                    <small>kcal</small>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="v2-group" aria-label="Next meal">
        <header className="v2-sec">
          <h3>Next meal</h3>
          <span>{slotName(next.slot)}</span>
        </header>
        <div className="ft-next" data-field="food">
          {next.over ? (
            <>
              <b className="ft-next-h">You have reached today's energy goal</b>
              <p className="ft-next-p">If you are still hungry, vegetables and a lean protein keep it light.</p>
            </>
          ) : (
            <>
              <div className="ft-next-nums">
                <span>
                  <b>{fmt(next.left)}</b>
                  <small>kcal left today</small>
                </span>
                <span style={{ "--hue": NUTRIENT[next.behind.id].hue, "--hue-ink": NUTRIENT[next.behind.id].ink } as React.CSSProperties}>
                  <b>{fmt(Math.max(0, next.behind.gap))} g</b>
                  <small>
                    <NutrientMark id={next.behind.id} size={13} />
                    {NUTRIENT[next.behind.id].short} to go
                  </small>
                </span>
              </div>
              {next.fits && (
                <div className="ft-fit">
                  <img src={next.fits.d.photo} alt="" />
                  <span>
                    <small>Fits well</small>
                    <b>{next.fits.d.name}</b>
                    <em>
                      {fmt(next.fits.t.kcal)} kcal · {Math.round(next.fits.t[next.behind.id])} g {MACRO_WORD[next.behind.id]}
                    </em>
                  </span>
                </div>
              )}
            </>
          )}
          <div className="ft-acts">
            <button className="ft-act ft-act-main" onClick={() => go("/v3/food/scan")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
                <circle cx="12" cy="12" r="3.2" />
              </svg>
              Scan a meal
            </button>
            <button className="ft-act" onClick={() => go(`/v3/food/add?slot=${next.slot}`)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              Search food
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
