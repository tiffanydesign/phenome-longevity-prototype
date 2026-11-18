import { useEffect, useState, type ReactNode } from "react";
import { Chevron } from "../ui/icons";
import { fmt, grams, MACROS, NUTRIENT, slotName, TARGET, type NutrientId, type Totals } from "./data";
import { ANALYSE_MS, mealTotals, type Meal } from "./store";
import { Ph, type PhName } from "./icons";

/* The pieces the food pages share: rings, nutrient marks, meal cards, bars. */

/** A progress ring: grey track, one arc in the hue, anything in the middle. */
export function Ring({ value, size = 64, stroke = 7, hue, dashed, children }: { value: number; size?: number; stroke?: number; hue: string; dashed?: boolean; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <span className="fd-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className="fd-ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} strokeDasharray={dashed ? "3 4" : undefined} />
        {v > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={hue}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c * v} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dasharray .6s cubic-bezier(.16,1,.3,1)" }}
          />
        )}
      </svg>
      {children && <span className="fd-ring-in">{children}</span>}
    </span>
  );
}

const MARK: Record<NutrientId | "kcal", PhName> = {
  kcal: "flame",
  protein: "egg",
  carbs: "grains",
  fat: "avocado",
  fiber: "leaf",
  calcium: "bone",
  iron: "hexagon",
};

/** A nutrient's small solid mark, in its hue (energy takes the text colour). */
export function NutrientMark({ id, size = 18 }: { id: NutrientId | "kcal"; size?: number; solid?: boolean }) {
  return <Ph name={MARK[id]} size={size} color={id === "kcal" ? undefined : NUTRIENT[id].hue} className="fd-mark" />;
}

/** Left of a target, or over it, said the plain way. */
export function leftOf(eaten: number, target: number) {
  const over = eaten > target;
  return { n: Math.abs(target - eaten), word: over ? "over" : "left", over };
}

/** One nutrient against its target: amount left, its name, then a ring
 *  with the nutrient's mark resting in the middle. Colour lives only in the
 *  ring and the mark; the words stay ink and grey. */
export function NutrientCard({ id, t }: { id: NutrientId; t: Totals }) {
  const n = NUTRIENT[id];
  const l = leftOf(t[id], TARGET[id]);
  return (
    <div
      className="fd-nc"
      data-over={l.over ? "" : undefined}
      aria-label={`${n.name}: ${grams(l.n, n.unit)} ${l.word} of ${fmt(TARGET[id])} ${n.unit}`}
      style={{ "--hue": n.hue } as React.CSSProperties}
    >
      <b>{grams(l.n, n.unit)}</b>
      <span>
        <strong>{n.short}</strong> <em>{l.word}</em>
      </span>
      <Ring value={t[id] / TARGET[id]} size={64} stroke={6} hue={n.hue}>
        <span className="fd-core">
          <NutrientMark id={id} size={15} solid />
        </span>
      </Ring>
    </div>
  );
}

/** Ticks forward while a scan is reading the plate. */
export function useAnalysing(m: Meal | undefined) {
  const busy = m?.status === "analysing";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!busy) return;
    let raf = 0;
    const tick = () => {
      setNow(Date.now());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [busy]);
  if (!m || !busy) return 1;
  return Math.min(0.97, (now - m.at) / ANALYSE_MS);
}

export const clock = (ms: number) => new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** A logged meal: photo, name and time, energy, then the three macros. */
export function MealCard({ m, onOpen }: { m: Meal; onOpen: (el: HTMLElement) => void }) {
  const p = useAnalysing(m);
  const t = mealTotals(m);
  const busy = m.status === "analysing";
  return (
    <button className="fd-meal" data-busy={busy ? "" : undefined} onClick={(e) => onOpen(e.currentTarget)}>
      <span className="fd-meal-pic">
        {m.photo ? <img src={m.photo} alt="" /> : <MealTile name={m.name} />}
        {busy && (
          <span className="fd-meal-prog">
            <Ring value={p} size={52} stroke={4} hue="#fff">
              <small>{Math.round(p * 100)}%</small>
            </Ring>
          </span>
        )}
      </span>
      <span className="fd-meal-body">
        <span className="fd-meal-top">
          <b className="fd-meal-name">{busy ? "Analysing your meal…" : m.name}</b>
          <time className="fd-meal-when" aria-label={`${slotName(m.slot)} at ${clock(m.at)}`}>
            {clock(m.at)}
          </time>
        </span>
        {busy ? (
          <>
            <span className="fd-skel" aria-hidden>
              <i />
              <i />
            </span>
            <small className="fd-meal-wait">We'll let you know when it's ready</small>
          </>
        ) : (
          <>
            <span className="fd-meal-kcal">
              <NutrientMark id="kcal" size={17} solid />
              <b>{fmt(t.kcal)}</b> calories
            </span>
            <span className="fd-meal-macros">
              {MACROS.map((id) => (
                <span key={id}>
                  <NutrientMark id={id} size={14} solid />
                  {Math.round(t[id])} g
                </span>
              ))}
            </span>
          </>
        )}
      </span>
    </button>
  );
}

/** A meal logged by search has no photo: a flat tile with its first letter. */
export function MealTile({ name }: { name: string }) {
  return (
    <span className="fd-tile" aria-hidden>
      {name.charAt(0)}
    </span>
  );
}

/** Nutrients against the day's need, one ruled row each. */
export function NutrientBars({ ids, t, open }: { ids: NutrientId[]; t: Totals; open?: (id: NutrientId) => void }) {
  return (
    <div className="fd-bars">
      {ids.map((id) => {
        const n = NUTRIENT[id];
        const share = t[id] / TARGET[id];
        return (
          <div key={id} className="fd-bar" onClick={open ? () => open(id) : undefined}>
            <span className="fd-bar-name">
              <NutrientMark id={id} size={16} solid />
              {n.name}
            </span>
            <span className="fd-bar-val">
              <b>{grams(t[id], n.unit)}</b> / {fmt(TARGET[id])} {n.unit}
            </span>
            <span className="fd-bar-track" aria-hidden>
              <i style={{ width: `${Math.min(100, share * 100)}%`, background: n.hue }} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** A white row that leads somewhere. */
export function RowLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button className="fd-rowlink" onClick={onClick}>
      {children}
      <Chevron size={14} />
    </button>
  );
}
