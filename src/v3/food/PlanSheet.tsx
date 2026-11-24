import { useState } from "react";
import { Chevron } from "../ui/icons";
import { fmt, NUTRIENT, type NutrientId } from "./data";
import { NutrientMark } from "./parts";
import { DEFAULT_TARGET, gramsFor, KCAL_PER_G, MACRO_IDS, PRESETS, savePlan, splitOf, usePlan, type Macro, type PresetId } from "./targets";
import "./plan-sheet.css";

/*
 * The calorie goal, and behind one row the plan it rests on. The first view
 * is the one decision most members make: a single number, stepped. Opening
 * Advanced settings shows how that energy is shared between protein, carbs
 * and fat, as a named split or gram by gram, then the fibre and mineral
 * targets. A line under the macros says whether they add up to the goal.
 */

const KCAL = { min: 1000, max: 4000, step: 50 };
const STEP: Record<NutrientId, number> = { protein: 5, carbs: 5, fat: 2, fiber: 1, calcium: 50, iron: 1 };
const RANGE: Record<NutrientId, [number, number]> = {
  protein: [30, 300],
  carbs: [20, 500],
  fat: [20, 200],
  fiber: [10, 60],
  calcium: [500, 2000],
  iron: [5, 40],
};
const MICRO_IDS: NutrientId[] = ["fiber", "calcium", "iron"];
const clamp = (n: number, [lo, hi]: [number, number]) => Math.min(hi, Math.max(lo, n));

/** The named split these grams match at this energy, if any. */
function presetOf(kcal: number, g: Record<Macro, number>): PresetId {
  const hit = PRESETS.find((p) => {
    const want = gramsFor(kcal, p.split);
    return MACRO_IDS.every((id) => want[id] === g[id]);
  });
  return hit?.id ?? "custom";
}

export function PlanSheet({ kcal: startKcal, onSaveKcal, onClose }: { kcal: number; onSaveKcal: (v: number) => void; onClose: () => void }) {
  const plan = usePlan();
  const [kcal, setKcal] = useState(startKcal);
  const [t, setT] = useState<Record<NutrientId, number>>(() => ({ ...plan.targets }));
  const [preset, setPreset] = useState<PresetId>(() => presetOf(startKcal, plan.targets));
  const [open, setOpen] = useState(false);

  const split = splitOf(t);
  const gap = split.sum - kcal;
  const fits = Math.abs(gap) <= kcal * 0.05;

  /* a named split follows the energy goal; custom grams stay where they were put */
  const stepKcal = (dir: number) => {
    const next = clamp(kcal + dir * KCAL.step, [KCAL.min, KCAL.max]);
    setKcal(next);
    const p = PRESETS.find((x) => x.id === preset);
    if (p) setT((s) => ({ ...s, ...gramsFor(next, p.split) }));
  };
  const pick = (id: PresetId) => {
    setPreset(id);
    const p = PRESETS.find((x) => x.id === id);
    if (p) setT((s) => ({ ...s, ...gramsFor(kcal, p.split) }));
  };
  const stepNutrient = (id: NutrientId, dir: number) => {
    setT((s) => ({ ...s, [id]: clamp(s[id] + dir * STEP[id], RANGE[id]) }));
    if ((MACRO_IDS as NutrientId[]).includes(id)) setPreset("custom");
  };
  /* custom grams that drifted from the goal: set the goal to what they add up to */
  const matchKcal = () => setKcal(clamp(Math.round(split.sum / 10) * 10, [KCAL.min, KCAL.max]));
  const reset = () => {
    setPreset("balanced");
    setT({ ...DEFAULT_TARGET, ...gramsFor(kcal, PRESETS[0].split) });
  };

  return (
    <div className="mx-sheet-scrim" onClick={onClose}>
      <div className="mx-sheet ps" role="dialog" aria-label="Daily calorie goal" data-open={open ? "" : undefined} onClick={(e) => e.stopPropagation()}>
        <i className="mx-sheet-grab" aria-hidden />
        <h2>Daily calorie goal</h2>

        <div className="mx-sheet-step">
          <button aria-label="Lower" disabled={kcal <= KCAL.min} onClick={() => stepKcal(-1)}>
            −
          </button>
          <span>
            <b>{fmt(kcal)}</b>
            <small>kcal a day</small>
          </span>
          <button aria-label="Higher" disabled={kcal >= KCAL.max} onClick={() => stepKcal(1)}>
            +
          </button>
        </div>

        {/* the energy split as one bar: always visible, so the number never stands alone */}
        <div className="ps-bar" aria-hidden>
          {MACRO_IDS.map((id) => (
            <i key={id} style={{ flexGrow: split.share[id], background: NUTRIENT[id].hue }} />
          ))}
        </div>
        <p className="ps-legend">
          {MACRO_IDS.map((id) => (
            <span key={id}>
              <i style={{ background: NUTRIENT[id].hue }} aria-hidden />
              {NUTRIENT[id].short} <b>{fmt(t[id])} g</b>
            </span>
          ))}
        </p>

        <button className="ps-adv" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span>
            <b>Advanced settings</b>
            <small>{open ? "Macros, fibre and minerals" : `${PRESETS.find((p) => p.id === preset)?.name ?? "Custom"} split · fibre ${t.fiber} g`}</small>
          </span>
          <Chevron dir={open ? "up" : "down"} size={16} />
        </button>

        {open && (
          <div className="ps-body">
            <section className="ps-sec" aria-label="Macro split">
              <h3>Macro split</h3>
              <div className="ps-seg" role="radiogroup" aria-label="Split">
                {[...PRESETS, { id: "custom" as const, name: "Custom", note: "Set each one in grams", split: null }].map((p) => (
                  <button key={p.id} role="radio" aria-checked={preset === p.id} onClick={() => pick(p.id)}>
                    {p.name}
                  </button>
                ))}
              </div>
              <p className="ps-note">{preset === "custom" ? "Set each macro in grams below." : PRESETS.find((p) => p.id === preset)?.note}</p>

              <div className="ps-rows">
                {MACRO_IDS.map((id) => (
                  <Row key={id} id={id} value={t[id]} sub={`${fmt(t[id] * KCAL_PER_G[id])} kcal · ${Math.round(split.share[id] * 100)}%`} onStep={(d) => stepNutrient(id, d)} />
                ))}
              </div>

              <div className="ps-check" data-fit={fits ? "" : undefined} role="status">
                <span>
                  {fits ? (
                    <>
                      Macros add up to <b>{fmt(split.sum)} kcal</b>, in line with your goal.
                    </>
                  ) : (
                    <>
                      Macros add up to <b>{fmt(split.sum)} kcal</b>, {fmt(Math.abs(gap))} {gap > 0 ? "over" : "under"} your goal.
                    </>
                  )}
                </span>
                {!fits && (
                  <button onClick={matchKcal}>Use {fmt(Math.round(split.sum / 10) * 10)}</button>
                )}
              </div>
            </section>

            <section className="ps-sec" aria-label="Fibre and minerals">
              <h3>Fibre and minerals</h3>
              <div className="ps-rows">
                {MICRO_IDS.map((id) => (
                  <Row key={id} id={id} value={t[id]} sub={id === "fiber" ? "Daily target" : "Daily intake"} onStep={(d) => stepNutrient(id, d)} />
                ))}
              </div>
            </section>

            <button className="ps-reset" onClick={reset}>
              Reset to recommended
            </button>
          </div>
        )}

        <button
          className="mx-sheet-save"
          onClick={() => {
            onSaveKcal(kcal);
            savePlan({ preset, targets: t });
            onClose();
          }}
        >
          Save goals
        </button>
        <button className="mx-sheet-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/** One target: its mark and name, what it means in energy, and a compact stepper. */
function Row({ id, value, sub, onStep }: { id: NutrientId; value: number; sub: string; onStep: (dir: number) => void }) {
  const n = NUTRIENT[id];
  const [lo, hi] = RANGE[id];
  return (
    <div className="ps-row">
      <span className="ps-row-mark" style={{ "--hue": n.hue } as React.CSSProperties}>
        <NutrientMark id={id} size={16} />
      </span>
      <span className="ps-row-t">
        <b>{n.short}</b>
        <small>{sub}</small>
      </span>
      <span className="ps-step">
        <button aria-label={`Less ${n.short.toLowerCase()}`} disabled={value <= lo} onClick={() => onStep(-1)}>
          −
        </button>
        <output aria-live="polite">
          {fmt(value)}
          <small>{n.unit}</small>
        </output>
        <button aria-label={`More ${n.short.toLowerCase()}`} disabled={value >= hi} onClick={() => onStep(1)}>
          +
        </button>
      </span>
    </div>
  );
}
