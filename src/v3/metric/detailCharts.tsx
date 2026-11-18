import { useId, type CSSProperties } from "react";
import { stepDay, STEP_GOAL, STEPS_TODAY, WORKOUTS } from "./activityData";
import "./detail-charts.css";

/*
 * The larger charts the Sleep and Activity pages open with. Each one names its
 * parts in their own hue beside the picture, so the colour is the legend:
 * stages of the night, the parts of the sleep score, and the three things a
 * day of moving is made of. Flat colour only.
 */

const hm = (min: number) => {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
};

/* ---------------- sleep score: one ring cut into its parts ---------------- */

export interface ScorePart {
  id: string;
  field: string;
  now: number;
  max: number;
}

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};
const arc = (cx: number, cy: number, r: number, from: number, to: number) => {
  const [x0, y0] = polar(cx, cy, r, from);
  const [x1, y1] = polar(cx, cy, r, to);
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
};

/**
 * The score as an arc open at the foot, filled to the score, shading from a
 * pale tint of the page's hue to the full hue. The number sits in the middle with its word under it.
 */
export function ScoreSegments({ score, word, max = 100 }: { score: number; word: string; max?: number }) {
  const grad = `dc-score-grad${useId().replace(/:/g, "")}`;
  const C = 120;
  const R = 92;
  const START = -135;
  const SWEEP = 270;
  const end = START + SWEEP * Math.max(0.01, Math.min(1, score / max));
  const fill = arc(C, C, R, START, end);
  return (
    <span className="dc-score" role="img" aria-label={`Score ${score} of ${max}, ${word}`}>
      <svg viewBox="0 0 240 216" aria-hidden>
        <defs>
          {/* light at the start of the arc, the page's full hue where the score stands */}
          <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1="20" y1="200" x2="220" y2="40">
            <stop offset="0" className="dc-score-g0" />
            <stop offset="1" className="dc-score-g1" />
          </linearGradient>
        </defs>
        <path className="dc-score-track" d={arc(C, C, R, START, START + SWEEP)} />
        <path className="dc-score-fill" d={fill} stroke={`url(#${grad})`} />
      </svg>
      <span className="dc-score-c">
        <b>{score}</b>
        <em>{word}</em>
      </span>
    </span>
  );
}

/* ---------------- the night: stages named beside the chart ---------------- */

export interface StageMinutes {
  stage: "Awake" | "REM" | "Core" | "Deep";
  min: number;
}

const LANE: Record<StageMinutes["stage"], number> = { Awake: 0, REM: 1, Core: 2, Deep: 3 };

/** Sleep cycles of about ninety minutes, scaled so each stage adds up to its real total. */
function nightBlocks(stages: StageMinutes[]) {
  const seq: [StageMinutes["stage"], number][] = [];
  for (let c = 0; c < 5; c++) {
    seq.push(["Core", 16 + c * 2], ["Deep", Math.max(4, 28 - c * 6)], ["Core", 20 - c], ["REM", 8 + c * 6]);
    if (c === 1 || c === 3 || c === 4) seq.push(["Awake", 3 + c]);
  }
  const raw: Record<string, number> = {};
  seq.forEach(([s, m]) => (raw[s] = (raw[s] ?? 0) + m));
  const want = Object.fromEntries(stages.map((s) => [s.stage, s.min]));
  return seq.map(([stage, m]) => ({ stage, min: (m / raw[stage]) * (want[stage] ?? 0) }));
}

/** Last night: each stage's name and time on the left, the night on the right, lane for lane. */
export function NightChart({ stages, bed, up }: { stages: StageMinutes[]; bed: string; up: string }) {
  const blocks = nightBlocks(stages);
  const total = blocks.reduce((n, b) => n + b.min, 0);
  const W = 180;
  const LH = 32;
  const BH = 16;
  let at = 0;
  const placed = blocks.map((b) => {
    const x = (at / total) * W;
    at += b.min;
    return { ...b, x, w: Math.max(2.5, (b.min / total) * W), y: LANE[b.stage] * LH + LH / 2 };
  });
  return (
    <div className="dc-night">
      <ul className="dc-night-key">
        {(["Awake", "REM", "Core", "Deep"] as const).map((s) => (
          <li key={s} data-stage={s}>
            <span>{s}</span>
            <b>{hm(stages.find((x) => x.stage === s)?.min ?? 0)}</b>
          </li>
        ))}
      </ul>
      <div className="dc-night-plot">
        <svg viewBox={`0 0 ${W} ${LH * 4}`} preserveAspectRatio="none" role="img" aria-label="Last night by sleep stage">
          {[1, 2, 3].map((k) => (
            <line key={k} className="dc-rule" x1="0" x2={W} y1={k * LH} y2={k * LH} />
          ))}
          {/* a thin riser joins each stage to the next, in the colour of the stage it enters */}
          {placed.slice(1).map((b, i) => (
            <line key={`r${i}`} className="dc-riser" data-stage={b.stage} x1={b.x} x2={b.x} y1={placed[i].y} y2={b.y} />
          ))}
          {placed.map((b, i) => (
            <rect key={i} data-stage={b.stage} x={b.x} y={b.y - BH / 2} width={b.w} height={BH} rx="3" />
          ))}
        </svg>
        <span className="dc-night-ends" aria-hidden>
          <i>{bed}</i>
          <i>{up}</i>
        </span>
      </div>
    </div>
  );
}

/** Each stage's share of the night on one track, the usual range as a pale band and the night as a dot. */
export function StageShares({ rows }: { rows: { stage: StageMinutes["stage"]; share: number; typical: [number, number]; label: string }[] }) {
  const TOP = 70;
  return (
    <ul className="dc-shares">
      {rows.map((r) => {
        const inside = r.share >= r.typical[0] && r.share <= r.typical[1];
        return (
          <li key={r.stage} data-stage={r.stage}>
            <span className="dc-shares-name">{r.stage}</span>
            <b>{r.share}%</b>
            <span className="dc-shares-track" style={{ "--lo": `${(r.typical[0] / TOP) * 100}%`, "--hi": `${(r.typical[1] / TOP) * 100}%`, "--at": `${(Math.min(r.share, TOP) / TOP) * 100}%` } as CSSProperties}>
              <i />
              <em />
            </span>
            <small>
              {inside ? "Within" : r.share > r.typical[1] ? "Above" : "Below"} the usual {r.label}
            </small>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------- a day of moving: three lanes on one clock ---------------- */

const MOVING_STEPS = 250;
const MOVING_GOAL = 12;
const TRAIN_GOAL = 45;

/** Minutes trained in each hour, from the day's logged workouts. */
function trainingByHour() {
  const out = Array(24).fill(0) as number[];
  WORKOUTS.forEach((w) => {
    const [h0, m0] = w.start.split(":").map(Number);
    let left = w.min;
    let h = h0;
    let m = m0;
    while (left > 0 && h < 24) {
      const take = Math.min(left, 60 - m);
      out[h] += take;
      left -= take;
      h += 1;
      m = 0;
    }
  });
  return out;
}

/**
 * Today, hour by hour: steps as bars, training as ticks, and a dot for every
 * hour with some moving in it. The totals sit at the right in the same hues.
 */
export function ActivityLanes() {
  const now = new Date().getHours();
  const { today } = stepDay(now);
  const steps = today.map((v, h) => (h > now ? 0 : v - (today[h - 1] ?? 0)));
  const train = trainingByHour();
  const peak = Math.max(...steps, 1);
  const moved = steps.filter((s, h) => h <= now && s >= MOVING_STEPS).length;
  const trained = train.reduce((a, b) => a + b, 0);
  const W = 216;
  const col = W / 24;
  const x = (h: number) => h * col + col / 2;
  return (
    <div className="dc-lanes">
      <svg viewBox={`0 0 ${W} 150`} role="img" aria-label={`${STEPS_TODAY} steps, ${trained} minutes training, ${moved} hours with movement`}>
        {/* steps */}
        <line className="dc-rule" x1="0" x2={W} y1="66" y2="66" />
        {steps.map((s, h) =>
          h > now ? null : (
            <rect key={h} data-field="activity" className="dc-bar" x={x(h) - 1.7} y={66 - Math.max(1.5, (s / peak) * 60)} width="3.2" height={Math.max(1.5, (s / peak) * 60)} rx="1.4" />
          ),
        )}
        {/* training */}
        <line className="dc-rule" x1="0" x2={W} y1="104" y2="104" />
        {train.map((t, h) =>
          t > 0 ? <rect key={h} data-field="exercise" className="dc-bar" x={x(h) - 1.6} y={104 - Math.max(8, (t / 60) * 28)} width="3.2" height={Math.max(8, (t / 60) * 28)} rx="1.4" /> : null,
        )}
        {/* moving hours */}
        {steps.map((s, h) => (
          <circle key={h} data-field="teal" className="dc-dot" data-off={h > now || s < MOVING_STEPS ? "" : undefined} cx={x(h)} cy="122" r="3.1" />
        ))}
        {["00", "06", "12", "18"].map((t, i) => (
          <text key={t} className="dc-axis" x={i * 6 * col + 1} y="146">
            {t}
          </text>
        ))}
      </svg>
      <dl className="dc-lanes-key">
        <div data-field="activity">
          <dt>Steps</dt>
          <dd>
            {STEPS_TODAY.toLocaleString("en-GB")}/{STEP_GOAL.toLocaleString("en-GB")}
          </dd>
        </div>
        <div data-field="exercise">
          <dt>Training</dt>
          <dd>
            {trained}/{TRAIN_GOAL} min
          </dd>
        </div>
        <div data-field="teal">
          <dt>Moving hours</dt>
          <dd>
            {moved}/{MOVING_GOAL} hrs
          </dd>
        </div>
      </dl>
    </div>
  );
}
