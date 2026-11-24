import { useState, type ReactNode } from "react";
import { fmt, MACROS, SLOTS, type Totals } from "./data";
import { mealTotals, type Meal } from "./store";
import { NutrientCard } from "./parts";
import { NutrientStrip } from "./NutrientPanel";

/*
 * The day at a glance, as pages the member swipes through, one question
 * each: how many calories are left and where they went (page 1), how the
 * day's nutrients stand against their targets, the three macros over fibre
 * and minerals, with the rest of the panel folded into one row (page 2). Nothing here is about moving; that
 * lives on the Activity tab. Every page shares one height so nothing below
 * jumps.
 */

/**
 * Where the day's calories came from: one bar whose full length is the
 * goal, a segment per meal in the order they were eaten, and under it each
 * meal's name and calories keyed to its segment by a dot.
 */
function MealSplit({ meals, goal }: { meals: Meal[]; goal: number }) {
  const rows = SLOTS.map((s, i) => {
    const list = meals.filter((m) => m.slot === s.id && m.status === "ready");
    return { ...s, tone: i, logged: list.length > 0, kcal: list.reduce((a, m) => a + mealTotals(m).kcal, 0) };
  });
  const total = rows.reduce((a, r) => a + r.kcal, 0);
  const span = Math.max(goal, total);
  return (
    <section className="fd-hero fd-split" aria-label={`Calories by meal, ${fmt(total)} of ${fmt(goal)} kcal`}>
      <p className="fd-label">
        By meal
        <span>
          {fmt(total)} of {fmt(goal)} kcal
        </span>
      </p>
      <div className="fd-split-bar" aria-hidden>
        {rows
          .filter((r) => r.kcal > 0)
          .map((r) => (
            <i key={r.id} data-tone={r.tone} style={{ flexBasis: `${(r.kcal / span) * 100}%` }} />
          ))}
      </div>
      <div className="fd-split-grid">
        {rows.map((r) => (
          <div key={r.id} data-tone={r.tone} data-empty={r.logged ? undefined : ""}>
            <small>
              <i aria-hidden />
              {r.name}
            </small>
            <b>{r.logged ? fmt(r.kcal) : "–"}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The swipeable pages and their dots. */
export function DaySlides({ hero, t, goal, meals, onMore }: { hero: ReactNode; t: Totals; goal: number; meals: Meal[]; onMore: () => void }) {
  const [page, setPage] = useState(0);
  const pages = [
    <>
      {hero}
      <MealSplit meals={meals} goal={goal} />
    </>,
    <>
      <div className="fd-row3">
        {MACROS.map((id) => (
          <NutrientCard key={id} id={id} t={t} />
        ))}
      </div>
      <div className="fd-row3">
        {(["fiber", "calcium", "iron"] as const).map((id) => (
          <NutrientCard key={id} id={id} t={t} />
        ))}
      </div>
      <NutrientStrip meals={meals} onOpen={onMore} />
    </>,
  ];

  return (
    <section className="fd-pager" aria-label="Your day">
      <div
        className="fd-pages"
        onScroll={(e) => {
          const el = e.currentTarget;
          setPage(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {pages.map((p, i) => (
          <div key={i} className="fd-slide" aria-hidden={page !== i}>
            {p}
          </div>
        ))}
      </div>
      <div className="fd-dots" aria-hidden>
        {pages.map((_, i) => (
          <i key={i} data-on={page === i ? "" : undefined} />
        ))}
      </div>
    </section>
  );
}
