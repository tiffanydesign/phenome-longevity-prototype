import { useEffect, useState, type ReactNode } from "react";
import { Chevron } from "../ui/icons";
import { fmt, grams, MACROS, NUTRIENT, slotName, TARGET, type NutrientId, type Totals } from "./data";
import { ANALYSE_MS, mealTotals, type Meal } from "./store";

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

const MARK: Record<NutrientId | "kcal", ReactNode> = {
  kcal: (
    <>
      <path d="M12 2.8c.9 3.4 5.8 5.6 5.8 10.9a5.8 5.8 0 0 1-11.6 0c0-2.6 1.4-4.4 2.6-5.4.1 1.7.9 2.8 2 3.2-.4-3.1.3-6.3 1.2-8.7z" />
      <path d="M12 20.5a2.4 2.4 0 0 1-2.4-2.4c0-1.7 2.4-3.6 2.4-3.6s2.4 1.9 2.4 3.6a2.4 2.4 0 0 1-2.4 2.4z" />
    </>
  ),
  protein: <ellipse cx="12" cy="13" rx="5.5" ry="7" />,
  carbs: <path d="M12 21V8M12 8c-2.2-.6-3-2.4-3-4.5 2.2.5 3 2.3 3 4.5zm0 0c2.2-.6 3-2.4 3-4.5-2.2.5-3 2.3-3 4.5zm0 5c-2.4-.5-3.5-2.2-3.5-4.5 2.4.5 3.5 2.2 3.5 4.5zm0 0c2.4-.5 3.5-2.2 3.5-4.5-2.4.5-3.5 2.2-3.5 4.5zm0 5c-2.4-.5-3.5-2.2-3.5-4.5 2.4.5 3.5 2.2 3.5 4.5zm0 0c2.4-.5 3.5-2.2 3.5-4.5-2.4.5-3.5 2.2-3.5 4.5z" />,
  fat: <path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z" />,
  fiber: <path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14zm0 0 8-8" />,
  calcium: <path d="M8 3h8l-1.2 4.5V20a1 1 0 0 1-1 1h-3.6a1 1 0 0 1-1-1V7.5z" />,
  iron: <path d="m12 3 7.8 4.5v9L12 21l-7.8-4.5v-9z" />,
};

/** A nutrient's small mark, in its hue. */
export function NutrientMark({ id, size = 18, solid }: { id: NutrientId | "kcal"; size?: number; solid?: boolean }) {
  const hue = id === "kcal" ? "currentColor" : NUTRIENT[id].hue;
  const filled = solid && id !== "carbs" && id !== "fiber" && id !== "kcal";
  return (
    <svg className="fd-mark" width={size} height={size} viewBox="0 0 24 24" fill={filled ? hue : "none"} stroke={hue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {MARK[id]}
    </svg>
  );
}

/** Left of a target, or over it, said the plain way. */
export function leftOf(eaten: number, target: number) {
  const over = eaten > target;
  return { n: Math.abs(target - eaten), word: over ? "over" : "left", over };
}

/** One nutrient against its target: amount left large, ring under it. */
export function NutrientCard({ id, t }: { id: NutrientId; t: Totals }) {
  const n = NUTRIENT[id];
  const l = leftOf(t[id], TARGET[id]);
  return (
    <div className="fd-nc" data-over={l.over ? "" : undefined} style={{ "--hue": n.hue } as React.CSSProperties}>
      <p className="fd-nc-label">
        <NutrientMark id={id} size={14} solid />
        {n.short}
      </p>
      <b>{grams(l.n, n.unit)}</b>
      <span>
        <em>{l.word}</em> of {fmt(TARGET[id])} {n.unit}
      </span>
      <Ring value={t[id] / TARGET[id]} size={58} stroke={6} hue={n.hue}>
        <small className="fd-nc-pct">{Math.round((t[id] / TARGET[id]) * 100)}%</small>
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
        <time className="fd-meal-when">
          {slotName(m.slot)} · {clock(m.at)}
        </time>
        <b className="fd-meal-name">{busy ? "Analysing your meal…" : m.name}</b>
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
              <b>{fmt(t.kcal)}</b> kcal
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
