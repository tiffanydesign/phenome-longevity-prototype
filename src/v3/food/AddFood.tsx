import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SearchField, SubPage, Toast } from "../profile/kit";
import { useGo } from "../ui/shell";
import { FOODS, fmt, foodOf, grams, MACROS, NUTRIENT, searchFoods, slotAt, SLOTS, slotName, totalsOf, type Food, type Slot } from "./data";
import { food, mealById, recentFoods, todayKey, useMeals } from "./store";
import { NutrientMark } from "./parts";
import "../metric/metric.css";
import "./food.css";

/*
 * Logging by name. The meal it goes to sits on top (picked from the hour),
 * then one search field; with nothing typed, the foods eaten lately are
 * listed first so the common case is one tap. A food opens a sheet to weigh it.
 *
 * ?slot=  ?day=  preselect where it goes · ?to=<meal> adds an ingredient to that meal
 * ?pick=<food>&found=barcode|label  opens a food the camera read
 */
export function AddFood() {
  const nav = useNavigate();
  const go = useGo();
  const [params] = useSearchParams();
  const meals = useMeals();
  const to = params.get("to");
  const target = to ? mealById(to) : undefined;
  const day = params.get("day") ?? todayKey();
  const [slot, setSlot] = useState<Slot>((params.get("slot") as Slot) || slotAt(new Date()));
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<Food | null>(() => (params.get("pick") ? foodOf(params.get("pick")!) : null));
  const found = params.get("found");
  const startGrams = Number(params.get("g")) || 100;
  const [toast, setToast] = useState<string | null>(found && pick ? `${found === "barcode" ? "Barcode" : "Label"} read: ${pick.name}` : null);

  const recent = useMemo(() => recentFoods(meals, 8).map((p) => foodOf(p.food)), [meals]);
  const results = q ? searchFoods(q) : [];
  const shown = q ? results : recent.length ? recent : FOODS.slice(0, 8);

  const add = (f: Food, g: number) => {
    if (target) {
      food.update(target.id, { items: [...target.items, { food: f.id, grams: g }] });
    } else {
      food.add(slot, f.name, [{ food: f.id, grams: g }], day);
    }
    setPick(null);
    setToast(`${f.name} added`);
    window.setTimeout(() => nav(-1), 650);
  };

  return (
    <SubPage
      title={target ? "Add ingredient" : "Add food"}
      lead={target ? `To ${target.name}` : undefined}
      overlay={
        <>
          {pick && <FoodSheet f={pick} start={startGrams} where={target ? target.name : slotName(slot)} onAdd={add} onClose={() => setPick(null)} />}
          <Toast text={toast} />
        </>
      }
    >
      <div className="fa">
        {!target && (
          <div className="mx-seg fa-seg" role="tablist" aria-label="Meal" style={{ "--i": SLOTS.findIndex((s) => s.id === slot) } as React.CSSProperties}>
            <i aria-hidden />
            {SLOTS.map((s) => (
              <button key={s.id} role="tab" aria-selected={s.id === slot} onClick={() => setSlot(s.id)}>
                {s.name}
              </button>
            ))}
          </div>
        )}
        <SearchField value={q} onChange={setQ} placeholder="Search foods, e.g. eggs" />
        {!q && !target && (
          <div className="fa-quick">
            <button onClick={() => go("/v3/food/scan")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
                <circle cx="12" cy="12" r="3.5" />
              </svg>
              Scan a meal
            </button>
            <button onClick={() => go("/v3/food/scan?mode=barcode")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M5 6v12M8 6v12M11 6v12M13.5 6v12M16.5 6v12M19 6v12" />
              </svg>
              Barcode
            </button>
          </div>
        )}

        <h2 className="fa-h">{q ? (results.length ? `${results.length} found` : "No match") : recent.length ? "Recent" : "Common foods"}</h2>
        {q && results.length === 0 ? (
          <p className="fa-none">Nothing called "{q}" yet. Try a simpler word, or scan the plate instead.</p>
        ) : (
          <div className="fa-list">
            {shown.map((f) => (
              <div key={f.id} className="fa-row">
                <button className="fa-row-main" onClick={() => setPick(f)}>
                  <b>{f.name}</b>
                  <small>
                    {fmt(f.kcal)} kcal · 100 g{f.desc ? ` · ${f.desc}` : ""}
                  </small>
                </button>
                <button className="fa-plus" aria-label={`Add ${f.name}, 100 g`} onClick={() => add(f, 100)}>
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

/** A food weighed before it goes in: amount, energy, macros, then add. */
function FoodSheet({ f, start = 100, where, onAdd, onClose }: { f: Food; start?: number; where: string; onAdd: (f: Food, g: number) => void; onClose: () => void }) {
  const [g, setG] = useState(start);
  const t = totalsOf([{ food: f.id, grams: g }]);
  return (
    <div className="mx-sheet-scrim" onClick={onClose}>
      <div className="mx-sheet fd-food" role="dialog" aria-label={f.name} onClick={(e) => e.stopPropagation()}>
        <i className="mx-sheet-grab" aria-hidden />
        <h2>{f.name}</h2>
        {f.desc && <p className="fd-food-desc">{f.desc}</p>}
        <div className="mx-sheet-step">
          <button aria-label="Less" disabled={g <= 10} onClick={() => setG(g - 10)}>
            −
          </button>
          <span>
            <b>{g}</b>
            <small>grams</small>
          </span>
          <button aria-label="More" onClick={() => setG(g + 10)}>
            +
          </button>
        </div>
        <div className="fd-food-sum">
          <span>
            <NutrientMark id="kcal" size={18} solid />
            <b>{fmt(t.kcal)}</b> kcal
          </span>
          {MACROS.map((k) => (
            <span key={k}>
              <NutrientMark id={k} size={14} solid />
              <b>{grams(t[k])}</b> {NUTRIENT[k].short.toLowerCase()}
            </span>
          ))}
        </div>
        <button className="mx-sheet-save" onClick={() => onAdd(f, g)}>
          Add to {where}
        </button>
        <button className="mx-sheet-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
