import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Chevron } from "../ui/icons";
import { BlurLayers, V2Screen } from "../ui/shell";
import { dishOf, fmt, foodOf, grams, MACROS, MICROS, NUTRIENT, SLOTS, TARGET, totalsOf, type Portion, type Slot } from "./data";
import { food, useMeal } from "./store";
import { clock, MealTile, NutrientBars, NutrientMark, useAnalysing } from "./parts";
import { FixSheet } from "./FixSheet";
import "./food.css";
import "./meal.css";

/*
 * One plate. The photo stays on top so the member can check it against the
 * numbers; the sheet over it reads name, portion, energy, the three macros, a
 * sentence on what the plate means for them, then each ingredient, which can
 * be weighed again or removed. Fix result and Done stay at the foot.
 */

const STEPS = ["Finding foods", "Estimating portions", "Counting nutrients"];

export function MealScreen() {
  const { id } = useParams();
  const nav = useNavigate();
  const m = useMeal(id);
  const p = useAnalysing(m);
  const [open, setOpen] = useState<number | null>(null);
  const [fixing, setFixing] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [viewing, setViewing] = useState(false);

  if (!m) {
    return (
      <V2Screen nav={false}>
        <div className="ml3-gone">
          <p>This meal is no longer in your diary.</p>
          <button onClick={() => nav("/v3/food", { replace: true })}>Back to Nutrition</button>
        </div>
      </V2Screen>
    );
  }

  const busy = m.status === "analysing";
  const t = totalsOf(m.items, m.servings);
  const dish = m.dish ? dishOf(m.dish) : undefined;
  const setItems = (items: Portion[]) => food.update(m.id, { items });
  const weigh = (i: number, d: number) => setItems(m.items.map((x, j) => (j === i ? { ...x, grams: Math.max(5, x.grams + d) } : x)));
  const drop = (i: number) => {
    setItems(m.items.filter((_, j) => j !== i));
    setOpen(null);
  };
  const share = Math.round((t.protein / TARGET.protein) * 100);

  return (
    <V2Screen nav={false}>
      <div className="v2-veil mx-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="ml3 scroll" data-field="food">
        <article className="ml3-sheet">
          {/* the shot the read came from, small: the page is the result, not the photo */}
          <div className="ml3-shot">
            <button className="ml3-thumb" data-busy={busy ? "" : undefined} aria-label="View photo" onClick={() => m.photo && setViewing(true)}>
              {m.photo ? <img src={m.photo} alt="" /> : <MealTile name={m.name} />}
              {busy && <i className="ml3-scanline" aria-hidden />}
            </button>
            <div>
              {busy ? (
                <>
                  <small className="ml3-shot-k">Analysing</small>
                  <b className="ml3-shot-n">Reading your plate…</b>
                </>
              ) : (
                <>
                  <div className="ml3-meta">
                    <time>{clock(m.at)}</time>
                    <label className="ml3-slot">
                      <select value={m.slot} onChange={(e) => food.update(m.id, { slot: e.target.value as Slot })} aria-label="Meal">
                        {SLOTS.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      <Chevron dir="down" size={12} />
                    </label>
                  </div>
                  <h1 className="ml3-name">{m.name}</h1>
                </>
              )}
            </div>
          </div>

          {busy ? (
            <div className="ml3-wait" aria-live="polite">
              <p className="ml3-pct">
                <b>{Math.round(p * 100)}%</b> reading your plate
              </p>
              <span className="ml3-track">
                <i style={{ width: `${p * 100}%` }} />
              </span>
              <ol className="ml3-steps">
                {STEPS.map((s, i) => {
                  const done = p > (i + 1) / STEPS.length;
                  const now = !done && p > i / STEPS.length;
                  return (
                    <li key={s} data-done={done ? "" : undefined} data-now={now ? "" : undefined}>
                      <i aria-hidden />
                      {s}
                    </li>
                  );
                })}
              </ol>
              <button className="ml3-later" onClick={() => nav(-1)}>
                Keep going, we'll let you know
              </button>
            </div>
          ) : (
            <>
              <div className="ml3-serv">
                <span>Servings</span>
                <div>
                  <button aria-label="Fewer servings" disabled={m.servings <= 0.5} onClick={() => food.update(m.id, { servings: m.servings - 0.5 })}>
                    −
                  </button>
                  <b>{m.servings}</b>
                  <button aria-label="More servings" onClick={() => food.update(m.id, { servings: m.servings + 0.5 })}>
                    +
                  </button>
                </div>
              </div>

              {/* energy first and largest, the three macros under it */}
              <section className="ml3-kcal">
                <span className="ml3-kcal-mark">
                  <NutrientMark id="kcal" size={24} solid />
                </span>
                <span>
                  <small>Calories</small>
                  <b>{fmt(t.kcal)}</b>
                </span>
              </section>
              <div className="ml3-macros">
                {MACROS.map((k) => (
                  <div key={k}>
                    <small>
                      <NutrientMark id={k} size={14} solid />
                      {NUTRIENT[k].short}
                    </small>
                    <b>{Math.round(t[k])} g</b>
                  </div>
                ))}
              </div>

              <section className="ml3-for">
                <h2>For you</h2>
                <p>{dish?.note ?? "Logged from your own entry; add a photo next time for a fuller read."}</p>
                <span className="ml3-for-stat">
                  <b>{share}%</b> of today's protein · <b>{Math.round((t.fiber / TARGET.fiber) * 100)}%</b> of your fibre
                </span>
              </section>

              <section className="ml3-sec">
                <div className="ml3-h-row">
                  <h2>Ingredients</h2>
                  <small>{m.items.length} found</small>
                </div>
                <div className="ml3-items">
                  {m.items.length === 0 && <p className="ml3-none">No ingredients yet. Add what was on the plate.</p>}
                  {m.items.map((x, i) => {
                    const f = foodOf(x.food);
                    const k = (f.kcal * x.grams * m.servings) / 100;
                    const isOpen = open === i;
                    return (
                      <div key={`${x.food}-${i}`} className="ml3-item" data-open={isOpen ? "" : undefined}>
                        <button className="ml3-item-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                          <span>
                            <b>{f.name}</b>
                            <small>{grams(x.grams * m.servings)}</small>
                          </span>
                          <em>{fmt(k)} kcal</em>
                        </button>
                        {isOpen && (
                          <div className="ml3-item-edit">
                            <div className="ml3-weigh">
                              <button aria-label="Less" onClick={() => weigh(i, -10)}>
                                −10 g
                              </button>
                              <b>{x.grams} g</b>
                              <button aria-label="More" onClick={() => weigh(i, 10)}>
                                +10 g
                              </button>
                            </div>
                            <button className="ml3-remove" onClick={() => drop(i)}>
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button className="ml3-additem" onClick={() => nav(`/v3/food/add?to=${m.id}`)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add ingredient
                  </button>
                </div>
              </section>

              <section className="ml3-sec">
                <div className="ml3-h-row">
                  <h2>Nutrients</h2>
                  <small>share of your day</small>
                </div>
                <NutrientBars ids={[...MACROS, ...MICROS]} t={t} />
              </section>

              <button className="ml3-delete" onClick={() => (confirm ? (food.remove(m.id), nav(-1)) : setConfirm(true))}>
                {confirm ? "Tap again to delete" : "Delete meal"}
              </button>
            </>
          )}
        </article>
      </div>

      <header className="ml3-bar">
        <button className="ml3-round" aria-label="Back" onClick={() => nav(-1)}>
          <Chevron dir="left" size={22} />
        </button>
        <span>Result</span>
        <button className="ml3-round" aria-label={m.saved ? "Remove from saved meals" : "Save this meal"} aria-pressed={!!m.saved} onClick={() => food.update(m.id, { saved: !m.saved })}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={m.saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
            <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.5L5.5 20.5v-16a1 1 0 0 1 1-1z" />
          </svg>
        </button>
      </header>

      {!busy && (
        <footer className="ml3-foot">
          <button className="ml3-fix" onClick={() => setFixing(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
              <path d="M11 3.5 12.6 8l4.4 1.6-4.4 1.6L11 15.5l-1.6-4.3L5 9.6 9.4 8zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z" />
            </svg>
            Fix result
          </button>
          <button className="ml3-done" onClick={() => nav(-1)}>
            Done
          </button>
        </footer>
      )}
      {fixing && <FixSheet meal={m} onClose={() => setFixing(false)} />}
      {viewing && m.photo && (
        <button className="ml3-viewer" aria-label="Close photo" onClick={() => setViewing(false)}>
          <img src={m.photo} alt={m.name} />
        </button>
      )}
    </V2Screen>
  );
}
