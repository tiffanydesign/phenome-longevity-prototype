import { useMemo, useState } from "react";
import { Empty, SubPage, Toast } from "../profile/kit";
import { useGo } from "../ui/shell";
import { fmt, slotAt, slotName } from "./data";
import { food, mealTotals, todayKey, useMeals, type Meal } from "./store";
import { MealTile } from "./parts";
import "../metric/metric.css";
import "./food.css";

/*
 * Meals the member bookmarked on a result page, one row each by name, newest
 * first. A row opens the meal; the round + logs it again now.
 */

/** Saved meals, one per name, newest first. */
export function useSaved(): Meal[] {
  const meals = useMeals();
  return useMemo(() => {
    const seen = new Set<string>();
    return [...meals]
      .filter((m) => m.saved && m.status === "ready")
      .sort((a, b) => b.at - a.at)
      .filter((m) => (seen.has(m.name) ? false : (seen.add(m.name), true)));
  }, [meals]);
}

/** Log a saved meal again, now, in the slot the hour falls in. */
export function logAgain(m: Meal, day = todayKey()) {
  const slot = day === todayKey() ? slotAt(new Date()) : m.slot;
  const id = food.add(slot, m.name, m.items, day);
  food.update(id, { photo: m.photo, dish: m.dish, servings: m.servings });
  return slotName(slot);
}

export function SavedScreen() {
  const go = useGo();
  const saved = useSaved();
  const [toast, setToast] = useState<string | null>(null);

  return (
    <SubPage title="Saved meals" lead="Meals you bookmarked, ready to log again in one tap." overlay={<Toast text={toast} />}>
      <div className="fa">
        {saved.length === 0 ? (
          <Empty title="Nothing saved yet" line="Tap the bookmark on any meal result and it will wait for you here." />
        ) : (
          <div className="fa-list fs-list">
            {saved.map((m) => (
              <div key={m.id} className="fa-row fs-row">
                <button className="fs-main" onClick={(e) => go(`/v3/food/meal/${m.id}`, { from: e.currentTarget })}>
                  <span className="fs-pic">{m.photo ? <img src={m.photo} alt="" /> : <MealTile name={m.name} />}</span>
                  <span className="fa-row-main">
                    <b>{m.name}</b>
                    <small>
                      {fmt(mealTotals(m).kcal)} kcal · {m.items.length} ingredients
                    </small>
                  </span>
                </button>
                <button
                  className="fa-plus"
                  aria-label={`Log ${m.name} again`}
                  onClick={() => {
                    const where = logAgain(m);
                    setToast(`Added to ${where}`);
                    window.setTimeout(() => setToast(null), 1600);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </SubPage>
  );
}
