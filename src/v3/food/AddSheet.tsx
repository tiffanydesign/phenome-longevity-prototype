import { useMemo } from "react";
import { useGo } from "../ui/shell";
import { fmt, slotName } from "./data";
import { mealTotals, useMeals, type Meal } from "./store";
import { logAgain as relog, useSaved } from "./SavedScreen";
import { MealTile } from "./parts";

/*
 * The round + opens this: the camera first (the fastest way to log), the
 * other three ways beside it, then the plates eaten lately, one tap to log again.
 */

const WAYS = [
  {
    id: "meal",
    title: "Scan a meal",
    line: "Photo of your plate",
    to: "/v3/food/scan",
    icon: (
      <>
        <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
        <circle cx="12" cy="12" r="3.5" />
      </>
    ),
  },
  {
    id: "search",
    title: "Search foods",
    line: "Type what you ate",
    to: "/v3/food/add",
    icon: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m20 20-4.2-4.2" />
      </>
    ),
  },
  {
    id: "barcode",
    title: "Barcode",
    line: "Packaged food",
    to: "/v3/food/scan?mode=barcode",
    icon: <path d="M4 6v12M7.5 6v12M11 6v12M13.5 6v12M17 6v12M20 6v12" />,
  },
  {
    id: "label",
    title: "Food label",
    line: "Nutrition panel",
    to: "/v3/food/scan?mode=label",
    icon: (
      <>
        <rect x="5" y="3.5" width="14" height="17" rx="2" />
        <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
      </>
    ),
  },
];

export function AddSheet({ day, onClose }: { day: string; onClose: () => void }) {
  const go = useGo();
  const meals = useMeals();
  // the last plates by name, one each, newest first
  const again = useMemo(() => {
    const seen = new Set<string>();
    return [...meals]
      .filter((m) => m.status === "ready")
      .sort((a, b) => b.at - a.at)
      .filter((m) => (seen.has(m.name) ? false : (seen.add(m.name), true)))
      .slice(0, 6);
  }, [meals]);

  const saved = useSaved();
  const logAgain = (m: Meal) => {
    relog(m, day);
    onClose();
  };
  const row = (list: Meal[]) => (
    <div className="fd-again">
      {list.map((m) => (
        <button key={m.id} onClick={() => logAgain(m)} aria-label={`Log ${m.name} again`}>
          <span className="fd-again-pic">
            {m.photo ? <img src={m.photo} alt="" /> : <MealTile name={m.name} />}
            <i aria-hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </i>
          </span>
          <b>{m.name}</b>
          <small>
            {fmt(mealTotals(m).kcal)} kcal · {slotName(m.slot)}
          </small>
        </button>
      ))}
    </div>
  );

  return (
    <div className="mx-sheet-scrim" onClick={onClose}>
      <div className="mx-sheet fd-add" role="dialog" aria-label="Add food" onClick={(e) => e.stopPropagation()}>
        <i className="mx-sheet-grab" aria-hidden />
        <h2>Add food</h2>
        <div className="fd-ways">
          {WAYS.map((w) => (
            <button key={w.id} data-k={w.id} onClick={() => go(w.id === "search" ? `${w.to}?day=${day}` : w.to)}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {w.icon}
              </svg>
              <b>{w.title}</b>
              <small>{w.line}</small>
            </button>
          ))}
        </div>
        {saved.length > 0 && (
          <>
            <div className="fd-add-row">
              <h3 className="fd-add-h">Saved</h3>
              <button className="fd-more" onClick={() => go("/v3/food/saved")}>
                See all
              </button>
            </div>
            {row(saved)}
          </>
        )}
        {again.length > 0 && (
          <>
            <h3 className="fd-add-h">Eat again</h3>
            {row(again)}
          </>
        )}
      </div>
    </div>
  );
}
