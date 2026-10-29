import type { Period } from "@/data/home-monitor";

/**
 * Period chart frame (shot-only in the captures: steps/top, period_W/M/6M/Y,
 * monitor_blood_pressure/top). Plot box y 466..729.6 css, right edge 378; five horizontal
 * bands (shaded / white alternating, shading fades in from the left), vertical grid per period.
 * Data (demo, or the real 6M steps) is drawn as bars (D/W) or a line (M/6M/Y).
 */
const TOP = 0;
const H = 263.6; // 466 → 729.6
const RIGHT = 378;
const AXIS_W = 394;

export interface AxisSpec {
  left: number;
  lines: number[];
  labels: { text: string; x: number }[];
  ticks: number[];
  max: number;
  /** y-label alignment: right-aligned at `left - 8`, or left-aligned at x=16 (Y period) */
  labelAlign: "right" | "left";
  /** bottom of the shaded bands (BP draws them shorter, capture: monitor_blood_pressure/top) */
  bandsH?: number;
}

const fmtTick = (v: number) => (v >= 1000 ? `${+(v / 1000).toFixed(1)}K` : String(v));

export function MonitorChart({ axis, series, color, kind }: { axis: AxisSpec; series: (number | null)[]; color: string; kind: "bar" | "line" }) {
  const { left, lines, labels, ticks, max } = axis;
  const w = RIGHT - left;
  const y = (v: number) => TOP + H - (v / max) * H;
  const bandsH = axis.bandsH ?? H;
  const band = bandsH / 5;
  const slot = series.length ? w / series.length : 0;
  const pts = series.map((v, i) => (v == null ? null : ([left + slot * (i + 0.5), y(v)] as const)));
  const gid = `mc-band-${left}`;

  return (
    <svg className="mon-chart" width={AXIS_W} height={H + 30} viewBox={`0 0 ${AXIS_W} ${H + 30}`} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--mon-band-a)" />
          <stop offset="1" stopColor="var(--mon-band-b)" />
        </linearGradient>
      </defs>
      {[0, 2, 4].map((k) => (
        <rect key={k} x={left} y={TOP + k * band} width={w} height={band} fill={`url(#${gid})`} />
      ))}
      {lines.map((x) => (
        <line key={x} x1={x} x2={x} y1={TOP} y2={TOP + H} stroke="var(--mon-grid)" strokeWidth={0.6} />
      ))}
      {ticks.map((t) => (
        <text
          key={t}
          x={axis.labelAlign === "right" ? left - 8.5 : 16}
          y={y(t) + 4}
          textAnchor={axis.labelAlign === "right" ? "end" : "start"}
          className="mon-chart-tick"
        >
          {fmtTick(t)}
        </text>
      ))}
      {labels.map((l) => (
        <text key={l.text} x={l.x} y={TOP + H + 16} textAnchor="middle" className="mon-chart-x">
          {l.text}
        </text>
      ))}
      {kind === "bar" &&
        pts.map((p, i) => p && <rect key={i} x={p[0] - slot * 0.3} y={p[1]} width={slot * 0.6} height={TOP + H - p[1]} rx={2} fill={color} />)}
      {kind === "line" && (
        <polyline
          points={pts
            .filter((p): p is readonly [number, number] => p !== null)
            .map((p) => p.join(","))
            .join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

const DAY = 86400000;
const dm = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
function range<T>(n: number, f: (k: number) => T): T[] {
  return Array.from({ length: n }, (_, k) => f(k));
}

/** Axis per period, measured from steps/top, period_W, period_M, period_6M, period_Y. */
export function axisFor(p: Period, today: Date, series: (number | null)[], fixed?: { ticks: number[]; max: number }): AxisSpec {
  const peak = Math.max(0, ...series.map((v) => v ?? 0));
  let ticks = fixed?.ticks ?? [0, 20, 40, 60, 80, 100];
  let max = fixed?.max ?? 100;
  if (!fixed && p === "M") {
    ticks = [0, 20, 40, 60, 80, 100, 120];
    max = 130; // capture: period_M (empty month axis tops out above 120)
  }
  if (!fixed && p === "Y") {
    ticks = [0, 1000, 2000, 3000, 4000];
    max = 4070;
  }
  if (!fixed && peak > 100 && p !== "Y") {
    // 6M capture: peak 1391 → max ≈ 1.3 × peak, ticks every 500.
    max = peak * 1.3;
    const step = max > 4000 ? 2000 : max > 2000 ? 1000 : 500;
    ticks = range(Math.floor(max / step) + 1, (k) => k * step);
  }

  switch (p) {
    case "D":
      return { left: 40.6, lines: range(6, (k) => 40.6 + 56.25 * k), labels: ["12AM", "4AM", "8AM", "12PM", "4PM", "8PM"].map((t, k) => ({ text: t, x: 47.5 + 56.25 * k })), ticks, max, labelAlign: "right" };
    case "W":
      return {
        left: 40.6,
        lines: range(7, (k) => 40.6 + 48.2 * k),
        labels: range(7, (k) => ({ text: new Date(today.getTime() - (6 - k) * DAY).toLocaleDateString("en-GB", { weekday: "short" }), x: 64.7 + 48.2 * k })),
        ticks,
        max,
        labelAlign: "right",
      };
    case "M":
      return { left: 40.6, lines: range(6, (k) => 40.6 + 56.25 * k), labels: range(6, (k) => ({ text: dm(new Date(today.getTime() - (29 - 5 * k) * DAY)), x: 46.2 + 56.25 * k })), ticks, max, labelAlign: "right" };
    case "6M":
      return { left: 44, lines: range(7, (k) => 44 + 51.5 * k), labels: range(7, (k) => ({ text: dm(new Date(today.getTime() - (181 - 28 * k) * DAY)), x: 50.5 + 51.5 * k })), ticks, max, labelAlign: "right" };
    case "Y":
      return {
        left: 35.5,
        lines: range(13, (k) => 35.5 + 27.9 * k),
        labels: range(6, (k) => {
          const d = new Date(today.getFullYear(), today.getMonth() - 12 + 2 * k, 1);
          return { text: `${d.toLocaleDateString("en-GB", { month: "short" })} ${String(d.getFullYear()).slice(2)}`, x: 49.6 + 55.85 * k };
        }),
        ticks,
        max,
        labelAlign: "left",
      };
  }
}
