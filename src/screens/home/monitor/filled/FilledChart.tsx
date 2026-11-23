import type { Series } from "@/data/real/series";
import { niceTicks } from "@/data/real/series";

/**
 * Health Monitor chart for the synced account (capture data2/mon/*): same frame as
 * MonitorChart (five bands fading in from the left, vertical grid per label), with
 *   bar    columns from the baseline (steps, calories, distance D/W; sleep bars)
 *   line   polyline through the slots that have data (move M / 6M)
 *   dot    one dot per reading (vitals D)
 *   range  rounded capsules low→high (vitals W/M/6M/Y); BP draws diastolic as rings
 * and the "Your Usual Range" band behind vital marks.
 */
const W = 394;
const H = 263.6;
const RIGHT = 378;

export type ChartKind = "bar" | "line" | "dot" | "range";

interface Props {
  s: Series;
  kind: ChartKind;
  color: string;
  /** BP: second band for diastolic */
  band2?: [number, number];
  /** force the y range (sleep % charts are 0–100) */
  ticks?: number[];
  fmt?: (v: number) => string;
  /** print each bar's value above it (Sleep Score W) */
  valueLabels?: boolean;
  legend?: boolean;
  /** stacked bars: lo2..hi2 drawn on top in this colour (Deep + REM) */
  stack2?: string;
}

const fmtK = (v: number) => (v >= 1000 ? `${+(v / 1000).toFixed(1)}K` : String(+v.toFixed(1)));

export function FilledChart({ s, kind, color, band2, ticks: forced, fmt = fmtK, valueLabels, legend, stack2 }: Props) {
  const vals = s.marks.flatMap((m) => [m.lo, m.hi, m.lo2, m.hi2].filter((v): v is number => v !== undefined));
  if (s.band) vals.push(...s.band);
  if (band2) vals.push(...band2);
  const fromZero = kind === "bar" || kind === "line";
  const lo = vals.length ? Math.min(...vals) : 0;
  const hi = vals.length ? Math.max(...vals) : 100;
  const ticks = forced ?? niceTicks(fromZero ? 0 : lo - (hi - lo) * 0.15, hi + (hi - lo) * 0.1 || 1, fromZero);
  const tMin = ticks[0];
  const tMax = ticks[ticks.length - 1];
  const longest = Math.max(...ticks.map((t) => fmt(t).length));
  const left = 14 + longest * 5.6;
  const w = RIGHT - left;
  const slot = w / s.slots;
  const x = (i: number) => left + slot * (i + 0.5);
  const y = (v: number) => H - ((v - tMin) / (tMax - tMin || 1)) * H;
  const band = H / 5;
  const gid = `fc-band-${s.slots}-${Math.round(left)}`;
  const capW = Math.min(stack2 ? 16 : 9, slot * 0.6);

  return (
    <div className="fc">
      {legend && (
        <div className="fc-legend">
          <i style={{ background: color }} /> Your Usual Range <InfoGlyph />
        </div>
      )}
      <svg className="fc-svg" width={W} height={H + 30} viewBox={`0 0 ${W} ${H + 30}`} aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--mon-band-a)" />
            <stop offset="1" stopColor="var(--mon-band-b)" />
          </linearGradient>
        </defs>
        {[0, 2, 4].map((k) => (
          <rect key={k} x={left} y={k * band} width={w} height={band} fill={`url(#${gid})`} />
        ))}
        {s.labels.map((l) => (
          <line key={l.i} x1={left + slot * l.i} x2={left + slot * l.i} y1={0} y2={H} stroke="var(--mon-grid)" strokeWidth={0.6} />
        ))}
        {[s.band, band2].map(
          (b, k) => b && <rect key={`b${k}`} x={left} y={y(b[1])} width={w} height={Math.max(2, y(b[0]) - y(b[1]))} fill={color} opacity={0.13} />,
        )}
        {ticks.map((t) => (
          <text key={t} x={left - 8.5} y={y(t) + 3.5} textAnchor="end" className="mon-chart-tick">
            {fmt(t)}
          </text>
        ))}
        {s.labels.map((l) => (
          <text key={l.text + l.i} x={left + slot * (l.i + (s.slots > 7 ? 0 : 0.5))} y={H + 16} textAnchor={s.slots > 7 ? "start" : "middle"} className="mon-chart-x">
            {l.text}
          </text>
        ))}

        {kind === "bar" &&
          s.marks.map((m) => (
            <g key={m.i}>
              <rect x={x(m.i) - capW / 2} y={y(m.hi)} width={capW} height={Math.max(0, H - y(m.hi))} rx={stack2 ? 0 : 2} fill={color} />
              {stack2 && m.hi2 !== undefined && (
                <rect x={x(m.i) - capW / 2} y={y(m.hi2)} width={capW} height={Math.max(0, y(m.hi) - y(m.hi2))} fill={stack2} />
              )}
              {valueLabels && (
                <text x={x(m.i)} y={y(m.hi) - 5} textAnchor="middle" className="fc-val" style={{ fill: color }}>
                  {fmt(m.hi)}
                </text>
              )}
            </g>
          ))}
        {kind === "line" && (
          <polyline
            points={s.marks.map((m) => `${x(m.i)},${y(m.hi)}`).join(" ")}
            fill="none"
            stroke={color}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
        )}
        {kind === "dot" &&
          s.marks.map((m) => (
            <g key={m.i}>
              <circle cx={x(m.i)} cy={y(m.hi)} r={3.6} fill={color} />
              {m.hi2 !== undefined && <circle cx={x(m.i)} cy={y(m.hi2)} r={3.2} fill="var(--c-bg)" stroke={color} strokeWidth={1.4} />}
            </g>
          ))}
        {kind === "range" &&
          s.marks.map((m) => (
            <g key={m.i}>
              <Capsule x={x(m.i)} y1={y(m.hi)} y2={y(m.lo)} w={capW} color={color} />
              {m.lo2 !== undefined && m.hi2 !== undefined && <Capsule x={x(m.i)} y1={y(m.hi2)} y2={y(m.lo2)} w={capW} color={color} hollow />}
            </g>
          ))}
      </svg>
    </div>
  );
}

function Capsule({ x, y1, y2, w, color, hollow }: { x: number; y1: number; y2: number; w: number; color: string; hollow?: boolean }) {
  const h = Math.max(w * 0.5, y2 - y1);
  return hollow ? (
    <rect x={x - w / 2 + 0.7} y={y1} width={w - 1.4} height={h} rx={(w - 1.4) / 2} fill="var(--c-bg)" stroke={color} strokeWidth={1.4} />
  ) : (
    <rect x={x - w / 2} y={y1} width={w} height={h} rx={w / 2} fill={color} />
  );
}

function InfoGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="4.9" r="0.9" fill="currentColor" />
      <path d="M8 7.1v4.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
