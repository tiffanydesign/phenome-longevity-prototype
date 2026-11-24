import type { ReactNode } from "react";
import { seriesFor, type Metric } from "../data/metrics";
import { addDays, DEFAULT_DAY, realDay, type RealDay } from "@/data/real";
import intraday from "@/data/real/intraday.json";
import { NIGHTS, PARTS, STAGES, TEMP_BAND, TEMP_NIGHT, UP } from "../metric/sleepData";
import "./card-glyph.css";

/*
 * The small picture at the right of a tab card. Each reading is drawn in
 * the form its own data takes, so no two cards on a tab look alike:
 *   a daily total             -> the week as bars, today in colour
 *   a reading through the day -> low-to-high columns, the card's reading as a dot
 *   a resting level           -> the week as a line of open points
 *   a score in classes        -> stacked class bands, the member's band lit
 *   a night                   -> the night itself: stages, parts, the curve
 * One rule for colour across all of them: grey for context, the card's own
 * colour only for today or the reading on the card.
 */

const W = 76;
const H = 56;

const n = (s: string | undefined) => {
  if (!s || s.includes("--")) return undefined;
  const clock = /^(\d+):(\d+)$/.exec(s.trim());
  if (clock) return Number(clock[1]) + Number(clock[2]) / 60;
  const v = parseFloat(s.replace(/,/g, "").replace("−", "-"));
  return Number.isFinite(v) ? v : undefined;
};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const scale = (lo: number, hi: number) => (v: number) => clamp((v - lo) / (hi - lo || 1));

/** The seven days ending on the day Home opens on: real where the ring synced, the demo series where not. */
function week(m: Metric, read?: (d: RealDay) => number | undefined) {
  return seriesFor(m, "W")
    .slice(-7)
    .map((demo, i) => {
      const d = realDay(addDays(DEFAULT_DAY, i - 6));
      const v = d && read ? read(d) : undefined;
      return v !== undefined && v > 0 ? v : demo;
    });
}

function Svg({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg className="cg" width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      {children}
    </svg>
  );
}

/* ---------- totals ---------- */

/** The week as bars from zero, today the one in colour. */
function WeekBars({ m, read }: { m: Metric; read?: (d: RealDay) => number | undefined }) {
  const v = week(m, read);
  const top = Math.max(...v, 0.0001);
  const bw = 7;
  const gap = (W - bw * 7) / 6;
  return (
    <Svg label={`${m.label}, the last seven days`}>
      {v.map((x, i) => {
        const h = Math.max(2, (x / top) * H);
        return <rect key={i} className={i === 6 ? "cg-on cg-grow" : "cg-off cg-grow"} x={i * (bw + gap)} y={H - h} width={bw} height={h} rx="1.5" style={{ animationDelay: `${i * 30}ms` }} />;
      })}
    </Svg>
  );
}

/** One column against the goal: the goal a tick, the day's distance the bar that passes it. */
function GoalColumn({ m }: { m: Metric }) {
  const v = n(m.value) ?? 0;
  const goal = n(/\/\s*([\d.,]+)/.exec(m.unit)?.[1]) ?? v;
  const top = Math.max(v, goal) * 1.04;
  const y = (x: number) => H - (x / top) * H;
  return (
    <Svg label={`${m.value} of a ${goal} goal`}>
      <rect className="cg-off" x={W - 22} y={0} width={14} height={H} rx="4" />
      <rect className="cg-on cg-grow" x={W - 22} y={y(v)} width={14} height={H - y(v)} rx="4" />
      <line className="cg-goal" x1={W - 30} x2={W} y1={y(goal)} y2={y(goal)} />
      <text className="cg-note" x={W - 34} y={y(goal) + 4} textAnchor="end">
        Goal
      </text>
    </Svg>
  );
}

/** The day counted in goals: one column per goal's worth, full ones solid, the last filled as far as it got. */
function GoalCount({ m }: { m: Metric }) {
  const v = n(m.value) ?? 0;
  const goal = n(/\/\s*([\d.,]+)/.exec(m.unit)?.[1]) ?? (v || 1);
  const times = v / goal;
  const cols = Math.min(4, Math.max(1, Math.ceil(times)));
  const bw = 14;
  const gap = 6;
  const x0 = W - cols * bw - (cols - 1) * gap;
  return (
    <Svg label={`${m.value} burned, ${times.toFixed(1)} times the ${goal} goal`}>
      {Array.from({ length: cols }, (_, i) => {
        const fill = clamp(times - i);
        const h = fill * H;
        const x = x0 + i * (bw + gap);
        return (
          <g key={i}>
            <rect className="cg-off" x={x} y={0} width={bw} height={H} rx="4" />
            {fill > 0 && <rect className="cg-on cg-grow" x={x} y={H - h} width={bw} height={h} rx="4" style={{ animationDelay: `${i * 60}ms` }} />}
          </g>
        );
      })}
    </Svg>
  );
}

/** The week as seven discs: filled on days with a session, today in colour. */
function SessionDots({ m }: { m: Metric }) {
  const did = [true, false, true, false, true, false, true];
  const step = (W - 10) / 6;
  return (
    <Svg label={`${m.label}: ${did.filter(Boolean).length} sessions in seven days`}>
      {did.map((on, i) => (
        <circle key={i} cx={5 + i * step} cy={H - 6} r="5" className={i === 6 ? "cg-on" : on ? "cg-mid" : "cg-ring-off"} />
      ))}
    </Svg>
  );
}

/* ---------- readings through a day ---------- */

/** The day in two-hour blocks, each a column from its low to its high; the card's reading is the coloured dot. */
function DayColumns({ m }: { m: Metric }) {
  const rows = intraday.hr as number[][];
  const blocks = Array.from({ length: 12 }, (_, b) => rows.filter(([h]) => Math.floor(h / 2) === b).map((r) => r[1]));
  const lo = Math.min(...rows.map((r) => r[1])) - 4;
  const hi = Math.max(...rows.map((r) => r[1])) + 4;
  const y = (v: number) => H - 3 - scale(lo, hi)(v) * (H - 6);
  const now = n(m.value) ?? 0;
  const at = blocks.findIndex((b) => b.length > 0 && Math.min(...b) <= now && now <= Math.max(...b));
  const bw = 4;
  const gap = (W - bw * 12) / 11;
  return (
    <Svg label={`${m.label} through the day, low to high every two hours`}>
      {blocks.map((b, i) => {
        if (!b.length) return null;
        const top = y(Math.max(...b));
        const bot = y(Math.min(...b));
        return <rect key={i} className="cg-off" x={i * (bw + gap)} y={top - 2} width={bw} height={Math.max(bw + 4, bot - top + 4)} rx={bw / 2} />;
      })}
      {at >= 0 && <circle className="cg-dot" cx={at * (bw + gap) + bw / 2} cy={y(now)} r="3.5" />}
    </Svg>
  );
}

/** One column for the day's spread against the healthy floor, the reading as a ringed dot. */
function SpreadColumn({ m }: { m: Metric }) {
  const rows = intraday.spo2 as number[][];
  const y = (v: number) => H - 4 - scale(90, 100)(v) * (H - 8);
  const min = Math.min(...rows.map((r) => r[1]));
  const max = Math.max(...rows.map((r) => r[1]));
  const v = n(m.value) ?? max;
  const cx = W - 15;
  return (
    <Svg label={`${m.label}, ${Math.round(min)} to ${Math.round(max)}% today`}>
      <rect className="cg-off" x={cx - 7} y={0} width={14} height={H} rx="7" />
      <rect className="cg-tint-strong" x={cx - 7} y={y(max) - 4} width={14} height={y(min) - y(max) + 8} rx="7" />
      <line className="cg-goal" x1={cx - 16} x2={cx - 9} y1={y(95)} y2={y(95)} />
      <text className="cg-note" x={cx - 19} y={y(95) + 4} textAnchor="end">
        95
      </text>
      <circle className="cg-ringdot" cx={cx} cy={y(v)} r="4.5" />
    </Svg>
  );
}

/* ---------- resting levels, the week ---------- */

/** The week as a line of open points, today's point in colour. */
function PointLine({ m, read }: { m: Metric; read: (d: RealDay) => number | undefined }) {
  const v = week(m, read);
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  const pad = (hi - lo || 1) * 0.15;
  const x = (i: number) => 4 + (i * (W - 8)) / 6;
  const y = (k: number) => H - 6 - scale(lo - pad, hi + pad)(k) * (H - 12);
  return (
    <Svg label={`${m.label}, the last seven nights`}>
      <polyline className="cg-line" points={v.map((k, i) => `${x(i)},${y(k)}`).join(" ")} />
      {v.map((k, i) => (
        <circle key={i} className={i === 6 ? "cg-pt cg-pt-on" : "cg-pt"} cx={x(i)} cy={y(k)} r="3.4" />
      ))}
    </Svg>
  );
}

/**
 * The week as seven short capsules: each spans the middle half of that day's
 * readings, built from overlapping dots so its edge keeps a soft bead; a
 * reading far above the rest sits apart as a single dot. Today is the ring's
 * real hour-by-hour values, and the card's reading is the one dot in colour.
 */
function ReadingDots({ m, read }: { m: Metric; read: (d: RealDay) => number | undefined }) {
  const avg = week(m, read);
  const q = (xs: number[], p: number) => {
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))];
  };
  const today = (intraday.hrv as number[][]).map((r) => r[1]);
  // past days: the same shape as today's spread, centred on that day's reading, a stray high on some days
  const half = (q(today, 0.75) - q(today, 0.25)) / 2;
  const days = avg.map((k, i) =>
    i === 6
      ? { lo: q(today, 0.25), hi: q(today, 0.75), out: [q(today, 1)] }
      : { lo: k - half * (0.7 + (i % 3) * 0.15), hi: k + half * (0.6 + ((i + 1) % 3) * 0.15), out: i % 3 === 0 ? [k + half * 2.6] : i % 3 === 1 ? [k + half * 2.1, k + half * 2.6] : [] },
  );
  const now = n(m.value) ?? avg[6];
  // capsules share one low band; stray highs sit in a band of their own above, a clear gap between
  const lo = Math.min(...days.map((d) => d.lo), now);
  const hi = Math.max(...days.map((d) => d.hi), now);
  const r = 3.2;
  const BAND = [H * 0.4, H - r] as const;
  const y = (k: number) => BAND[1] - scale(lo, hi)(k) * (BAND[1] - BAND[0]);
  const yOut = (j: number) => r + 1 + j * (r * 2 + 3);
  const x = (i: number) => r + 1 + (i * (W - 2 * r - 2)) / 6;
  return (
    <Svg label={`${m.label}, the spread of readings over the last seven days; today ${m.value} ${m.unit}`}>
      {days.map((d, i) => {
        const top = y(d.hi);
        const bottom = Math.max(top + r * 0.9, y(d.lo));
        const beads = Math.max(2, Math.round((bottom - top) / (r * 0.9)) + 1);
        return (
          <g key={i}>
            {Array.from({ length: beads }, (_, j) => (
              <circle key={j} className="cg-solid" cx={x(i)} cy={top + ((bottom - top) * j) / (beads - 1)} r={r} />
            ))}
            {d.out.map((_, j) => (
              <circle key={`o${j}`} className="cg-solid" cx={x(i)} cy={yOut(d.out.length - 1 - j)} r={r * 0.85} />
            ))}
          </g>
        );
      })}
      <circle className="cg-on" cx={x(6)} cy={y(now)} r={r} />
    </Svg>
  );
}

/** The week as rails, each night's reading a dot on its own rail. */
function RailDots({ m, read }: { m: Metric; read: (d: RealDay) => number | undefined }) {
  const v = week(m, read);
  const lo = Math.min(...v) - 1.5;
  const hi = Math.max(...v) + 1.5;
  const bw = 6;
  const y = (k: number) => H - bw / 2 - scale(lo, hi)(k) * (H - bw);
  const gap = (W - bw * 7) / 6;
  return (
    <Svg label={`${m.label}, the last seven nights`}>
      {v.map((k, i) => (
        <g key={i}>
          <rect className="cg-off" x={i * (bw + gap)} y={0} width={bw} height={H} rx={bw / 2} />
          <circle className={i === 6 ? "cg-dot" : "cg-dot-off"} cx={i * (bw + gap) + bw / 2} cy={y(k)} r={bw / 2 - 0.5} />
        </g>
      ))}
    </Svg>
  );
}

/** Systolic over diastolic as one stick a day, each end a dot. */
function PressureSticks({ m }: { m: Metric }) {
  const pairs = Array.from({ length: 7 }, (_, i) => {
    const raw = realDay(addDays(DEFAULT_DAY, i - 6))?.monitor.bp ?? "";
    const [s, d] = raw.split("/").map((p) => n(p));
    return s && d ? [s, d] : [110, 70];
  });
  const y = (v: number) => H - 4 - scale(58, 120)(v) * (H - 8);
  const x = (i: number) => 4 + (i * (W - 8)) / 6;
  return (
    <Svg label={`${m.label}, the last seven mornings`}>
      {pairs.map(([s, d], i) => (
        <g key={i} className={i === 6 ? "cg-stick cg-stick-on" : "cg-stick"}>
          <line x1={x(i)} x2={x(i)} y1={y(s)} y2={y(d)} />
          <circle cx={x(i)} cy={y(s)} r="3" />
          <circle cx={x(i)} cy={y(d)} r="3" />
        </g>
      ))}
    </Svg>
  );
}

/* ---------- scores and classes ---------- */

/** Four class bands from low to peak, the member's band lit and the score a dot inside it. */
function ClassBands({ m }: { m: Metric }) {
  const max = n(/\/\s*(\d+)/.exec(m.unit)?.[1]) ?? 10;
  const v = n(m.value) ?? 0;
  const cuts = [0, 0.4, 0.6, 0.8, 1].map((c) => c * max);
  const at = Math.max(0, Math.min(3, cuts.findIndex((c) => v < c) - 1 < 0 ? 3 : cuts.findIndex((c) => v < c) - 1));
  const bh = 10;
  const gap = (H - bh * 4) / 3;
  return (
    <Svg label={`${m.value} ${m.unit}, class ${at + 1} of 4`}>
      {[3, 2, 1, 0].map((band, row) => {
        const y = row * (bh + gap);
        const lit = band === at;
        const share = (v - cuts[band]) / (cuts[band + 1] - cuts[band]);
        return (
          <g key={band}>
            <rect className={lit ? "cg-tint-strong" : "cg-off"} x={0} y={y} width={W} height={bh} rx="3" />
            {lit && <circle className="cg-ringdot" cx={6 + clamp(share) * (W - 12)} cy={y + bh / 2} r="4" />}
          </g>
        );
      })}
    </Svg>
  );
}

/** A plain ring to the score, the number in the middle. */
function ScoreRing({ m }: { m: Metric }) {
  const v = clamp((n(m.value) ?? 0) / 100);
  const R = 22;
  const C = 2 * Math.PI * R;
  return (
    <span className="cg cg-ringbox" role="img" aria-label={`${m.value} percent`}>
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
        <circle className="cg-arc-off" cx="28" cy="28" r={R} />
        <circle className="cg-arc" cx="28" cy="28" r={R} strokeDasharray={`${C * v} ${C}`} transform="rotate(-90 28 28)" />
      </svg>
      <b>{m.value}</b>
    </span>
  );
}

/** The score as its four parts, one arc each with a gap between, the score in the middle. */
function PartsRing({ m }: { m: Metric }) {
  const R = 22;
  const C = 2 * Math.PI * R;
  const seg = C / 4;
  const gap = 6;
  const share = (p: (typeof PARTS)[number]) => clamp(p.now / (p.max ?? 100));
  return (
    <span className="cg cg-ringbox" role="img" aria-label={`Score ${m.value}, from ${PARTS.map((p) => p.name).join(", ")}`}>
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden>
        {PARTS.map((p, i) => (
          <g key={p.id} transform={`rotate(${-90 + i * 90 + 4} 28 28)`}>
            <circle className="cg-arc-off cg-arc-butt" cx="28" cy="28" r={R} strokeDasharray={`${seg - gap} ${C}`} />
            <circle className="cg-arc cg-arc-butt" data-part={i} cx="28" cy="28" r={R} strokeDasharray={`${(seg - gap) * share(p)} ${C}`} />
          </g>
        ))}
      </svg>
      <b>{m.value}</b>
    </span>
  );
}

/** Slept against needed, two bars on one scale. */
function NeedBars({ m }: { m: Metric }) {
  const slept = STAGES.filter((s) => s.stage !== "Awake").reduce((t, s) => t + s.min, 0);
  const need = 480;
  const w = (v: number) => (v / need) * W;
  return (
    <Svg label={`${m.delta}`}>
      <text className="cg-note" x={0} y={12}>
        Slept
      </text>
      <rect className="cg-on cg-grow-x" x={0} y={17} width={w(slept)} height={8} rx="4" />
      <text className="cg-note" x={0} y={42}>
        Need
      </text>
      <rect className="cg-mid" x={0} y={47} width={w(need)} height={8} rx="4" />
    </Svg>
  );
}

/* ---------- the night ---------- */

const STAGE_ROW: Record<string, number> = { Awake: 0, REM: 1, Core: 2, Deep: 3 };

/** The night by stage as a small hypnogram in the stage colours: deep early, REM growing toward morning. */
function NightStages() {
  // ninety-minute cycles, shaped to last night's minutes per stage (deep 78, REM 92, core 304, awake 1)
  const plan: [string, number][] = [
    ["Core", 20], ["Deep", 32], ["Core", 30], ["REM", 12],
    ["Core", 44], ["Deep", 26], ["Core", 36], ["REM", 18],
    ["Core", 56], ["Deep", 14], ["Core", 40], ["REM", 24], ["Awake", 1],
    ["Core", 70], ["Deep", 6], ["Core", 8], ["REM", 38],
  ];
  const total = plan.reduce((s, p) => s + p[1], 0);
  const lane = H / 4;
  let at = 0;
  return (
    <Svg label="Last night by sleep stage">
      {plan.map(([stage, len], i) => {
        const x = (at / total) * W;
        at += len;
        return <rect key={i} data-stage={stage} className="cg-stage" x={x} y={STAGE_ROW[stage] * lane + 2} width={Math.max(2, (len / total) * W - 1)} height={lane - 4} rx="2" />;
      })}
    </Svg>
  );
}

/** Each stage's share of the night as its own column; deep sleep is the one in colour. */
function StageColumns({ m }: { m: Metric }) {
  const order = ["Awake", "REM", "Core", "Deep"];
  const bw = 12;
  const gap = (W - bw * 4) / 3;
  const top = Math.max(...STAGES.map((s) => s.min));
  return (
    <Svg label={`${m.label}, ${m.delta}`}>
      {order.map((st, i) => {
        const s = STAGES.find((x) => x.stage === st)!;
        const h = Math.max(3, (s.min / top) * H);
        return (
          <g key={st}>
            <rect className="cg-off" x={i * (bw + gap)} y={0} width={bw} height={H} rx="3" />
            <rect data-stage={st} className={st === "Deep" ? "cg-stage" : "cg-mid"} x={i * (bw + gap)} y={H - h} width={bw} height={h} rx="3" />
          </g>
        );
      })}
    </Svg>
  );
}

/** Bedtimes over the week as bars, taller the later past 22:00, the usual bedtime a line across. */
function BedtimeBars({ m }: { m: Metric }) {
  const mins = NIGHTS.map((x) => {
    const [h, mm] = x.bed.split(":").map(Number);
    return (h < 12 ? h + 24 : h) * 60 + mm - 22 * 60;
  });
  const avg = mins.reduce((s, v) => s + v, 0) / mins.length;
  const top = 150;
  const bw = 7;
  const gap = (W - bw * 7) / 6;
  const h = (v: number) => (v / top) * H;
  return (
    <Svg label={`${m.label}: this week's bedtimes against the usual one`}>
      {mins.map((v, i) => (
        <rect key={i} className={i === 6 ? "cg-on" : "cg-off"} x={i * (bw + gap)} y={H - Math.max(3, h(v))} width={bw} height={Math.max(3, h(v))} rx="1.5" />
      ))}
      <line className="cg-avg" x1={0} x2={W} y1={H - h(avg)} y2={H - h(avg)} />
    </Svg>
  );
}

/** Skin temperature through the night around the baseline: the healthy band, a zero line, the curve. */
function NightCurve({ m }: { m: Metric }) {
  const lo = TEMP_BAND[0] - 0.15;
  const hi = TEMP_BAND[1] + 0.15;
  const y = (v: number) => H - scale(lo, hi)(v) * H;
  const x = (i: number) => 4 + (i * (W - 8)) / (TEMP_NIGHT.length - 1);
  const last = TEMP_NIGHT.length - 1;
  return (
    <Svg label={`${m.label} through the night against your baseline`}>
      <rect className="cg-tint" x={0} y={y(TEMP_BAND[1])} width={W} height={y(TEMP_BAND[0]) - y(TEMP_BAND[1])} rx="4" />
      <line className="cg-zero" x1={0} x2={W} y1={y(0)} y2={y(0)} />
      <polyline className="cg-curve" points={TEMP_NIGHT.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
      <circle className="cg-ringdot" cx={x(last)} cy={y(TEMP_NIGHT[last])} r="3.5" />
    </Svg>
  );
}

/* ---------- which picture each card gets ---------- */

const PICTURES: Record<string, (m: Metric) => ReactNode> = {
  // vitals
  capacity: (m) => <ClassBands m={m} />,
  rhr: (m) => <PointLine m={m} read={(d) => n(d.monitor.rhr)} />,
  hr: (m) => <DayColumns m={m} />,
  hrv: (m) => <ReadingDots m={m} read={(d) => n(d.monitor.hrv)} />,
  bpd: (m) => <PressureSticks m={m} />,
  spo2d: (m) => <SpreadColumn m={m} />,
  respd: (m) => <RailDots m={m} read={(d) => n(d.monitor.respiratory)} />,
  // sleep
  sleepscore: (m) => <PartsRing m={m} />,
  sleep: () => <NightStages />,
  deep: (m) => <StageColumns m={m} />,
  consistency: (m) => <BedtimeBars m={m} />,
  efficiency: (m) => <ScoreRing m={m} />,
  hoursneeds: (m) => <NeedBars m={m} />,
  restorative: (m) => <WeekBars m={m} />,
  temp: (m) => <NightCurve m={m} />,
  // activity
  steps: (m) => <WeekBars m={m} read={(d) => n(d.monitor.steps)} />,
  kcal: (m) => <GoalCount m={m} />,
  distance: (m) => <GoalColumn m={m} />,
  workouts: (m) => <SessionDots m={m} />,
};

/** The card's picture, or nothing for a reading without one. */
export function CardGlyph({ m }: { m: Metric }) {
  const draw = PICTURES[m.id];
  return draw ? <>{draw(m)}</> : null;
}

/* ---------- when the reading was last written ---------- */

/** The last hour the band wrote a sample for a series on the day Home opens on. */
const lastHour = (key: keyof typeof intraday) => {
  const rows = intraday[key] as number[][];
  const h = rows.length ? rows[rows.length - 1][0] : undefined;
  return h === undefined ? undefined : `${String(h).padStart(2, "0")}:00`;
};

/** Readings the ring scores on waking carry the wake time; live band totals carry their last sample. */
const STAMP: Record<string, string | undefined> = {
  steps: lastHour("steps"),
  kcal: lastHour("calories"),
  distance: lastHour("distance"),
  hr: lastHour("hr"),
  capacity: UP,
};

/** The time a card's reading was last updated, or nothing when the source keeps none. */
export function stampOf(m: Metric): string | undefined {
  if (m.id in STAMP) return STAMP[m.id];
  if (m.source === "ring" && (m.when === "overnight" || m.when === "last night")) return UP;
  return undefined;
}
