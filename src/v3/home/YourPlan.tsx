import { useGo } from "../ui/shell";
import { Chevron } from "../ui/icons";
import { fmt } from "../food/data";
import { dayTotals, todayKey, useMeals } from "../food/store";
import { HabitMark } from "../habits/HabitMark";
import { planActions } from "../habits/plan";
import { CLINIC_PLAN, mealActions, useClinicDay, type PlanItem } from "../habits/clinic";
import "./your-plan.css";

/*
 * Your plan: what the care team asked for today, on one card at the top of
 * the Lifestyle tab. Reading order follows the member's questions: whose
 * plan and how far am I (head), what did they say (one line of the
 * dietitian's note), what do I do now (up to three rows in clock order, each
 * with one control), and the day's energy against the plan. The full plan
 * sits behind the foot.
 */

export function YourPlan() {
  const go = useGo();
  const { items, done, next } = useClinicDay();
  const total = items.length;
  const allDone = total > 0 && done === total;
  const open = (el: HTMLElement) => go("/v3/plan", { from: el });
  const shown = next.slice(0, 2);

  return (
    <section className="yp" aria-label="Your plan">
      {/* head: title and progress, then the dietitian's note as one quiet line */}
      <button className="yp-head" onClick={(e) => open(e.currentTarget)}>
        <span className="yp-title">
          <b>Your plan</b>
          <small>{CLINIC_PLAN.note}</small>
        </span>
        <Progress done={done} total={total} />
      </button>

      {allDone ? (
        <p className="yp-clear">
          <span aria-hidden>
            <TickMark />
          </span>
          Everything in today's plan is done
        </p>
      ) : (
        <ol className="yp-list">
          {shown.map((i, n) => (
            <PlanRow key={i.key} i={i} first={n === 0 || shown[n - 1].time !== i.time} />
          ))}
        </ol>
      )}

      {/* foot: the day's energy and the way to the full plan on one line */}
      <button className="yp-foot" onClick={(e) => open(e.currentTarget)}>
        <Energy />
        <span className="yp-foot-go">
          Full plan
          <Chevron size={12} />
        </span>
      </button>
    </section>
  );
}

/** "5 of 12" with a small ring, the ring in the tab hue, green once the day is done. */
function Progress({ done, total }: { done: number; total: number }) {
  const r = 7;
  const c = 2 * Math.PI * r;
  const share = total ? done / total : 0;
  return (
    <span className="yp-prog" data-done={share === 1 ? "" : undefined} aria-label={`${done} of ${total} done today`}>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <circle className="yp-prog-track" cx="9" cy="9" r={r} />
        {share > 0 && <circle className="yp-prog-fill" cx="9" cy="9" r={r} strokeDasharray={`${c * share} ${c}`} transform="rotate(-90 9 9)" />}
      </svg>
      <span>
        <b>{done}</b> of {total}
      </span>
    </span>
  );
}

/** One thing due: the clock time (once per time), its mark, what it is, and its one control. */
function PlanRow({ i, first }: { i: PlanItem; first: boolean }) {
  const h = i.habit?.h;
  const meal = i.meal;
  const name = meal ? meal.name : h?.name ?? "";
  const line = meal ? (i.logged ? "Logged in your food diary" : meal.choices[i.choice ?? 0].name) : h?.detail ?? "";
  const tag = meal ? `~${meal.kcal} kcal` : h?.kind === "count" && (h.times?.length ?? 0) > 1 ? `Dose ${(i.dose ?? 0) + 1} of ${h.times?.length}` : undefined;
  return (
    <li className="yp-row" data-group={first ? "" : undefined} data-done={i.done ? "" : undefined}>
      <span className="yp-time">
        {first && <b>{i.time}</b>}
        {first && i.due && !i.done && <small>Due</small>}
      </span>
      <HabitMark mark={meal ? "meal" : h?.mark ?? "pill"} field={meal ? "food" : h?.field ?? "plain"} size={30} />
      <span className="yp-row-t">
        <b>
          {name}
          {tag && <em>{tag}</em>}
        </b>
        <small>{line}</small>
      </span>
      <Tick i={i} />
    </li>
  );
}

/** One tap: a meal eaten as planned (the first choice unless another was picked), or a dose taken. */
function Tick({ i }: { i: PlanItem }) {
  const h = i.habit?.h;
  const what = i.meal ? i.meal.name.toLowerCase() : h?.name ?? "";
  if (i.done && i.logged) {
    return (
      <span className="yp-tick" data-on="" aria-label={`${what}: logged in your food diary`}>
        <TickMark />
      </span>
    );
  }
  const toggle = () => {
    if (i.meal) return i.done ? mealActions.undo(i.meal.id) : mealActions.eat(i.meal.id, i.choice ?? 0);
    if (!h) return;
    if (i.done) return planActions.undo(h.id);
    return h.kind === "count" ? planActions.tap(h.id) : planActions.answer(h.id, "Done");
  };
  return (
    <button
      className="yp-tick"
      data-on={i.done ? "" : undefined}
      aria-pressed={i.done}
      aria-label={i.done ? `Undo: ${what}` : i.meal ? `Ate ${what} as planned` : `Mark taken: ${what}`}
      onClick={toggle}
    >
      {i.done && <TickMark />}
    </button>
  );
}

function TickMark() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Energy eaten today (food diary plus meals ticked from the plan) against the plan's target. */
export function useEnergy() {
  const meals = useMeals();
  const { items } = useClinicDay();
  // a meal already in the food diary counts from there, never twice
  const ticked = items.filter((i) => i.meal && i.choice != null && !i.logged);
  const plus = (k: "kcal" | "carbs" | "protein" | "fat") => ticked.reduce((n, i) => n + (i.meal?.choices[i.choice ?? 0][k] ?? 0), 0);
  const diary = dayTotals(meals, todayKey());
  return {
    kcal: diary.kcal + plus("kcal"),
    goal: CLINIC_PLAN.kcal,
    carbs: diary.carbs + plus("carbs"),
    protein: diary.protein + plus("protein"),
    fat: diary.fat + plus("fat"),
  };
}

function Energy() {
  const { kcal, goal } = useEnergy();
  const share = Math.min(1, kcal / goal);
  const over = kcal > goal * 1.1;
  return (
    <div className="yp-energy" data-over={over ? "" : undefined} aria-label={`${fmt(kcal)} of ${fmt(goal)} kcal eaten today`}>
      <span className="yp-energy-l">Energy</span>
      <span className="yp-energy-bar" aria-hidden>
        <i style={{ "--share": share } as React.CSSProperties} />
      </span>
      <span className="yp-energy-v">
        <b>{fmt(kcal)}</b> / {fmt(goal)} kcal
      </span>
    </div>
  );
}
