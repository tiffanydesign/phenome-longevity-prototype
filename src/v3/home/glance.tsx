import type { CSSProperties } from "react";
import type { Metric } from "../data/metrics";
import "./glance.css";

/*
 * The small charts on Home's Today cards. Each card gets the one picture its
 * reading is actually made of: steps by the hour, the night by stage, heart
 * rate as a range per block of the day, energy split into what it came from.
 * No two cards share a form, and none is decoration.
 */

/** A small deterministic generator, so a day always draws the same and the day before draws its own. */
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const num = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;
const pct = (v: number) => `${Math.max(0, Math.min(100, v))}%`;

function HourAxis() {
  return (
    <span className="gl-axis" aria-hidden>
      <i>00</i>
      <i>06</i>
      <i>12</i>
      <i>18</i>
    </span>
  );
}

/** Steps by the hour, today up to now; the hours still to come wait as faint stubs. */
export function HourBars({ m, ago }: { m: Metric; ago: number }) {
  const r = rng(`steps${ago}`);
  const now = ago === 0 ? new Date().getHours() : 23;
  // a day's shape: quiet night, a morning walk, a working day, an evening walk
  const shape = (h: number) => (h < 6 ? 0.02 : h < 8 ? 0.5 : h < 12 ? 0.35 : h < 14 ? 0.6 : h < 17 ? 0.3 : h < 20 ? 0.75 : 0.15);
  const raw = Array.from({ length: 24 }, (_, h) => (h <= now ? shape(h) * (0.5 + r()) : 0));
  const peak = Math.max(...raw, 0.01);
  return (
    <span className="gl gl-hours" role="img" aria-label={`${m.value} steps by the hour`}>
      <span className="gl-hours-bars">
        {raw.map((v, h) => (
          <i key={h} data-later={h > now ? "" : undefined} style={{ height: h > now ? undefined : pct((v / peak) * 100) }} />
        ))}
      </span>
      <HourAxis />
    </span>
  );
}

const STAGES = ["Awake", "REM", "Core", "Deep"] as const;

/** The night by stage, as the stage chart draws it: awake on top, deep at the floor. */
export function Hypnogram({ ago }: { ago: number }) {
  const r = rng(`sleep${ago}`);
  // cycles of about ninety minutes: deep early in the night, REM growing toward morning
  const blocks: { stage: number; len: number }[] = [];
  for (let c = 0; c < 5; c++) {
    blocks.push({ stage: 2, len: 14 + r() * 10 });
    blocks.push({ stage: 3, len: Math.max(4, 26 - c * 6 + r() * 6) });
    blocks.push({ stage: 2, len: 16 + r() * 10 });
    blocks.push({ stage: 1, len: 8 + c * 5 + r() * 6 });
    if (r() > 0.55) blocks.push({ stage: 0, len: 2 + r() * 3 });
  }
  const total = blocks.reduce((s, b) => s + b.len, 0);
  let at = 0;
  return (
    <span className="gl gl-night" role="img" aria-label="Last night by sleep stage">
      <span className="gl-night-lanes">
        {blocks.map((b, i) => {
          const left = (at / total) * 100;
          at += b.len;
          return <i key={i} data-stage={STAGES[b.stage]} style={{ left: pct(left), width: pct((b.len / total) * 100), top: `${b.stage * 25}%` } as CSSProperties} />;
        })}
      </span>
      <span className="gl-night-key" aria-hidden>
        {STAGES.map((s) => (
          <i key={s} data-stage={s}>
            {s}
          </i>
        ))}
      </span>
    </span>
  );
}

/** Capacity as a gauge: three quarters of a circle, filled to the score, with what the score means beside it. */
export function Gauge({ m }: { m: Metric }) {
  const v = num(m.value);
  const R = 24;
  const C = 2 * Math.PI * R;
  const arc = C * 0.75;
  const word = v >= 70 ? "Ready to train" : v >= 50 ? "Take it steady" : "Rest day";
  return (
    <span className="gl gl-gauge">
      <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden>
        <g transform="rotate(135 30 30)">
          <circle cx="30" cy="30" r={R} fill="none" stroke="var(--mid)" strokeOpacity="0.16" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${arc} ${C}`} />
          <circle cx="30" cy="30" r={R} fill="none" stroke="var(--mid)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(arc * Math.min(100, v)) / 100} ${C}`} />
        </g>
      </svg>
      <span className="gl-gauge-word">{word}</span>
    </span>
  );
}

const DAY_LETTER = ["S", "M", "T", "W", "T", "F", "S"];

/** The week as seven days: a filled disc for each day with a session, today ringed. */
export function WeekDots({ m }: { m: Metric }) {
  const sessions = num(m.value);
  const today = new Date().getDay();
  // sessions fall on alternate days counting back from yesterday
  const done = new Set(Array.from({ length: sessions }, (_, i) => (today - 1 - i * 2 + 14) % 7));
  return (
    <span className="gl gl-week" role="img" aria-label={`${sessions} sessions this week`}>
      {Array.from({ length: 7 }, (_, i) => {
        const day = (today - 6 + i + 7) % 7;
        return (
          <span key={i} className="gl-week-day" data-on={done.has(day) ? "" : undefined} data-today={i === 6 ? "" : undefined}>
            <i />
            <small>{DAY_LETTER[day]}</small>
          </span>
        );
      })}
    </span>
  );
}

/** Heart rate through the day as a range per two hours, with the resting rate as a dashed floor. */
export function HeartRange({ m, ago }: { m: Metric; ago: number }) {
  const r = rng(`hr${ago}`);
  const rest = num(m.value);
  const LO = 40;
  const HI = 140;
  const now = ago === 0 ? Math.floor(new Date().getHours() / 2) : 11;
  const y = (v: number) => ((v - LO) / (HI - LO)) * 100;
  return (
    <span className="gl gl-range" role="img" aria-label={`Heart rate range today, resting ${rest} bpm`}>
      <span className="gl-range-plot">
        <i className="gl-range-rest" style={{ bottom: pct(y(rest)) }} />
        {Array.from({ length: 12 }, (_, b) => {
          const active = b >= 3 && b <= 10;
          const lo = rest + (active ? 6 : 0) + r() * 6;
          const hi = lo + (active ? 18 + r() * 40 : 6 + r() * 8);
          return <i key={b} className="gl-range-cap" data-later={b > now ? "" : undefined} style={{ left: `calc(${(b / 12) * 100}% + 2px)`, bottom: pct(y(lo)), height: pct(y(hi) - y(lo)) }} />;
        })}
      </span>
      <HourAxis />
    </span>
  );
}

/** Energy eaten, split into where it came from, against the day's budget. */
export function MacroBar({ m }: { m: Metric }) {
  const eaten = num(m.value);
  const goal = num(/\/\s*([\d,]+)/.exec(m.unit)?.[1] ?? "2000") || 2000;
  // a typical split by energy; grams follow from 4, 4 and 9 kcal per gram
  const parts = [
    { name: "Protein", share: 0.24, per: 4 },
    { name: "Carbs", share: 0.48, per: 4 },
    { name: "Fat", share: 0.28, per: 9 },
  ];
  return (
    <span className="gl gl-macro">
      <span className="gl-macro-track" role="img" aria-label={`${eaten} of ${goal} kcal`}>
        {parts.map((p) => (
          <i key={p.name} data-part={p.name} style={{ width: pct(((eaten * p.share) / goal) * 100) }} />
        ))}
      </span>
      <span className="gl-macro-key">
        {parts.map((p) => (
          <span key={p.name} data-part={p.name}>
            <em>
              <i />
              {p.name}
            </em>
            <b>{Math.round((eaten * p.share) / p.per)} g</b>
          </span>
        ))}
      </span>
    </span>
  );
}

const HABITS = ["Morning light", "Water", "Walk", "Stretch", "Read", "Screens off"];

/** The day's habits as a row of stops, done ones filled with a tick. */
export function HabitStops({ m }: { m: Metric }) {
  const done = Number(/^(\d+) of/.exec(m.delta)?.[1] ?? 0);
  return (
    <span className="gl gl-stops" role="img" aria-label={m.delta}>
      {HABITS.map((h, i) => (
        <span key={h} className="gl-stop" data-on={i < done ? "" : undefined}>
          <i>
            {i < done && (
              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden>
                <path d="M2.5 6.3 5 8.7 9.6 3.6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </i>
          <small>{h}</small>
        </span>
      ))}
    </span>
  );
}

/** A day's workout read two ways, each ring its own pink: time moving outside, energy spent inside. */
export function workoutDay(m: Metric) {
  const minutes = num(m.value);
  return [
    { k: "time", label: "Time", v: minutes, goal: 45, unit: "min" },
    { k: "kcal", label: "Calories", v: Math.round(minutes * 6.4), goal: 300, unit: "kcal" },
  ];
}

export function WorkoutRings({ m }: { m: Metric }) {
  const rings = workoutDay(m);
  const R = [24.5, 14.5];
  return (
    <span className="gl gl-rings" role="img" aria-label={rings.map((r) => `${r.label} ${r.v} of ${r.goal} ${r.unit}`).join(", ")}>
      <svg viewBox="0 0 60 60" width="60" height="60" aria-hidden>
        {rings.map((r, i) => {
          const C = 2 * Math.PI * R[i];
          const s = Math.max(0, Math.min(1, r.v / r.goal));
          return (
            <g key={r.k} data-ring={r.k}>
              <circle cx="30" cy="30" r={R[i]} data-track="" />
              {s > 0 && <circle cx="30" cy="30" r={R[i]} strokeDasharray={`${C * s} ${C}`} transform="rotate(-90 30 30)" />}
            </g>
          );
        })}
      </svg>
      <span className="gl-rings-key">
        {rings.map((r) => (
          <span key={r.k} data-ring={r.k}>
            <b>{r.v.toLocaleString("en-GB")}</b> {r.unit}
          </span>
        ))}
      </span>
    </span>
  );
}
