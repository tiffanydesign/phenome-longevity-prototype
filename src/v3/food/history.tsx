import { useMemo, useState } from "react";
import { Chevron } from "../ui/icons";
import { fmt, NUTRIENT, ZERO, type Totals } from "./data";

/** Where a day's energy came from, top of the stack first: protein, carbs, fat, then fibre at the base; the key reads in the same order. */
const PARTS = ["protein", "carbs", "fiber", "fat"] as const;
type Part = (typeof PARTS)[number];
import { dayKey, dayOffset, dayTotals, todayKey, type Meal } from "./store";

/*
 * History over five spans, as the original tracker had them: a day by the
 * hour, a week and a month by the day, six months by the week, a year by the
 * month. Every bar is stacked by where the energy came from. Days before the
 * diary's demo week are filled from a steady pattern so long spans read true.
 */

export type Span = "D" | "W" | "M" | "6M" | "Y";
export const SPANS: Span[] = ["D", "W", "M", "6M", "Y"];
const SPAN_NAME: Record<Span, string> = { D: "Day", W: "Week", M: "Month", "6M": "6 months", Y: "Year" };
const PAGES_BACK: Record<Span, number> = { D: 30, W: 12, M: 6, "6M": 2, Y: 1 };

/** A day before the demo week: about 1,300–1,820 kcal, one day in nine unlogged. */
function pastDay(d: Date): Totals {
  const n = Math.floor(d.getTime() / 864e5);
  const r = (k: number) => {
    const x = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  if (r(1) < 0.11) return { ...ZERO };
  const kcal = 1300 + r(2) * 520;
  const p = 0.19 + r(3) * 0.07;
  const f = 0.27 + r(4) * 0.08;
  const c = 1 - p - f;
  return { ...ZERO, kcal, protein: (kcal * p) / 4, carbs: (kcal * c) / 4, fat: (kcal * f) / 9, fiber: 16 + r(5) * 14 };
}

/** A day's totals: the diary for the demo week, the steady pattern before it. */
export function dayAny(meals: Meal[], d: Date): Totals {
  const k = dayKey(d);
  if (k > todayKey()) return { ...ZERO };
  return d.getTime() >= dayOffset(-7).getTime() ? dayTotals(meals, k) : pastDay(d);
}

type Bar = { label: string; t: Totals; ahead?: boolean; now?: boolean };

const avg = (ts: Totals[]): Totals => {
  const logged = ts.filter((t) => t.kcal > 0);
  if (!logged.length) return { ...ZERO };
  const out = { ...ZERO };
  logged.forEach((t) => (Object.keys(out) as (keyof Totals)[]).forEach((k) => (out[k] += t[k] / logged.length)));
  return out;
};

function bars(meals: Meal[], span: Span, page: number): { bars: Bar[]; title: string; unit: string } {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  if (span === "D") {
    const d = dayOffset(-page);
    const k = dayKey(d);
    const hours = Array.from({ length: 24 }, () => ({ ...ZERO }));
    const day = meals.filter((m) => m.day === k && m.status === "ready");
    if (day.length) {
      day.forEach((m) => {
        const h = new Date(m.at).getHours();
        const one = dayTotals([m], k);
        (Object.keys(one) as (keyof Totals)[]).forEach((x) => (hours[h][x] += one[x]));
      });
    } else {
      // an older day: its energy split across breakfast, lunch and dinner
      const t = dayAny(meals, d);
      [8, 13, 19].forEach((h, i) => (Object.keys(t) as (keyof Totals)[]).forEach((x) => (hours[h][x] = (t[x] * [0.25, 0.35, 0.4][i]))));
    }
    return {
      bars: hours.map((t, h) => ({ label: h % 6 === 0 ? String(h).padStart(2, "0") : "", t })),
      title: page === 0 ? "Today" : page === 1 ? "Yesterday" : d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
      unit: "kcal",
    };
  }
  if (span === "W" || span === "M") {
    const days: Date[] = [];
    if (span === "W") {
      const mon = (today.getDay() + 6) % 7;
      for (let i = 0; i < 7; i++) days.push(dayOffset(i - mon - page * 7));
    } else {
      const first = new Date(today.getFullYear(), today.getMonth() - page, 1, 12);
      const len = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      for (let i = 0; i < len; i++) days.push(new Date(first.getFullYear(), first.getMonth(), i + 1, 12));
    }
    const tk = todayKey();
    const title =
      span === "W"
        ? `${days[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${days[6].toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
        : days[0].toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    return {
      bars: days.map((d, i) => ({
        label: span === "W" ? d.toLocaleDateString("en-GB", { weekday: "narrow" }) : i % 7 === 0 ? String(d.getDate()) : "",
        t: dayAny(meals, d),
        ahead: dayKey(d) > tk,
        now: dayKey(d) === tk,
      })),
      title,
      unit: "kcal",
    };
  }
  if (span === "6M") {
    const weeks: Bar[] = [];
    const mon = (today.getDay() + 6) % 7;
    for (let w = 25; w >= 0; w--) {
      const start = -mon - (w + page * 26) * 7;
      const ts = Array.from({ length: 7 }, (_, i) => dayAny(meals, dayOffset(start + i)));
      const d0 = dayOffset(start);
      weeks.push({ label: d0.getDate() <= 7 ? d0.toLocaleDateString("en-GB", { month: "short" }) : "", t: avg(ts), now: w === 0 && page === 0 });
    }
    return { bars: weeks, title: page === 0 ? "Last 6 months" : "6 months before", unit: "kcal a day" };
  }
  const months: Bar[] = [];
  for (let mth = 11; mth >= 0; mth--) {
    const first = new Date(today.getFullYear(), today.getMonth() - mth - page * 12, 1, 12);
    const len = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const ts = Array.from({ length: len }, (_, i) => dayAny(meals, new Date(first.getFullYear(), first.getMonth(), i + 1, 12)));
    months.push({ label: first.toLocaleDateString("en-GB", { month: "narrow" }), t: avg(ts), now: mth === 0 && page === 0 });
  }
  return { bars: months, title: page === 0 ? "Last 12 months" : "The year before", unit: "kcal a day" };
}

export function History({ meals, goal }: { meals: Meal[]; goal: number }) {
  const [span, setSpan] = useState<Span>("W");
  const [page, setPage] = useState(0);
  const data = useMemo(() => bars(meals, span, page), [meals, span, page]);
  const logged = data.bars.filter((b) => b.t.kcal > 0);
  const total = logged.reduce((a, b) => a + b.t.kcal, 0);
  const daily = span === "D" ? total : logged.length ? total / logged.length : 0;
  const hi = logged.length ? Math.max(...logged.map((b) => b.t.kcal)) : 0;
  const lo = logged.length ? Math.min(...logged.map((b) => b.t.kcal)) : 0;
  const top = Math.max(span === "D" ? 0 : goal, hi) * 1.08 || 1;
  // energy by source: carbs in the table include fibre, so fibre is split out at its own 2 kcal/g
  const energy = (t: Totals): Record<Part, number> => ({ protein: t.protein * 4, carbs: Math.max(0, t.carbs - t.fiber) * 4, fiber: t.fiber * 2, fat: t.fat * 9 });
  const split = logged.reduce(
    (a, b) => {
      const e = energy(b.t);
      return { protein: a.protein + e.protein, carbs: a.carbs + e.carbs, fiber: a.fiber + e.fiber, fat: a.fat + e.fat };
    },
    { protein: 0, carbs: 0, fiber: 0, fat: 0 },
  );
  const splitSum = PARTS.reduce((s, id) => s + split[id], 0) || 1;
  const pick = (s: Span) => {
    setSpan(s);
    setPage(0);
  };

  return (
    <>
      <div className="mx-card fd-card mx-hist">
        <div className="mx-seg" role="tablist" style={{ "--i": SPANS.indexOf(span) } as React.CSSProperties}>
          <i aria-hidden />
          {SPANS.map((s) => (
            <button key={s} role="tab" aria-selected={s === span} aria-label={SPAN_NAME[s]} onClick={() => pick(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="fd-hs-period">
          <button aria-label={`Earlier ${SPAN_NAME[span].toLowerCase()}`} disabled={page >= PAGES_BACK[span]} onClick={() => setPage(page + 1)}>
            <Chevron dir="left" size={16} />
          </button>
          <span aria-live="polite">{data.title}</span>
          <button aria-label={`Later ${SPAN_NAME[span].toLowerCase()}`} disabled={page === 0} onClick={() => setPage(page - 1)}>
            <Chevron size={16} />
          </button>
        </div>
        <div className="fd-wk-head">
          <div>
            <b>{fmt(daily)}</b>
            <span>{span === "D" ? "kcal that day" : "kcal a day on average"}</span>
          </div>
          {span !== "D" && (
            <div>
              <b>{fmt(hi)}</b>
              <span>highest · lowest {fmt(lo)}</span>
            </div>
          )}
        </div>
        <div className="fd-wk" data-span={span} style={{ height: 150, gridTemplateColumns: `repeat(${data.bars.length}, 1fr)` }}>
          {span !== "D" && (
            <i className="fd-wk-goal" style={{ bottom: `${(goal / top) * 100}%` }}>
              <span>Goal</span>
            </i>
          )}
          {data.bars.map((b, i) => {
            const e = energy(b.t);
            return (
              <div key={i} className="fd-wk-col" data-now={b.now ? "" : undefined}>
                <span className="fd-wk-stack" style={{ height: `${(b.t.kcal / top) * 100}%` }} title={`${fmt(b.t.kcal)} kcal`}>
                  {PARTS.map((id) => (
                    <i key={id} style={{ flexGrow: e[id], background: NUTRIENT[id].hue }} />
                  ))}
                </span>
                {b.t.kcal === 0 && !b.ahead && span !== "D" && <span className="fd-wk-none" aria-label="Nothing logged" />}
              </div>
            );
          })}
        </div>
        <div className="fd-wk-axis" style={{ gridTemplateColumns: `repeat(${data.bars.length}, 1fr)` }}>
          {data.bars.map((b, i) => (
            <span key={i} data-today={b.now ? "" : undefined} data-ahead={b.ahead ? "" : undefined}>
              {b.label}
            </span>
          ))}
        </div>
        <div className="fd-wk-key">
          {PARTS.map((id) => (
            <span key={id}>
              <i style={{ background: NUTRIENT[id].hue }} />
              {id === "carbs" ? "Net carbs" : NUTRIENT[id].short}
              <small>{Math.round((split[id] / splitSum) * 100)}%</small>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
