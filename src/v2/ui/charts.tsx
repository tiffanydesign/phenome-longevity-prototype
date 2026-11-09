import { useMemo, useRef, useState, type PointerEvent } from "react";

/** Bars measure from zero, or a small difference reads as a large one. Lines may zoom in. */
const scale = (values: number[], band: [number, number] | undefined, bars: boolean) => {
  const all = band ? [...values, ...band] : values;
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const pad = (hi - lo || 1) * 0.12;
  return { lo: bars ? 0 : lo - pad, hi: hi + pad };
};

const smooth = (pts: [number, number][]) =>
  pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M${x},${y}`;
    const [px, py] = pts[i - 1];
    const mid = (px + x) / 2;
    return `${d} C${mid},${py} ${mid},${y} ${x},${y}`;
  }, "");

/**
 * A reading's history, drawn as a quiet line over a pale area: a dotted guide
 * at each point, the day or visit under it, the usual limits as rules with
 * their names at the right, and the latest point as an open ring. Flat colour
 * and transparency only.
 */
export function HistoryChart({ values, labels, marks = [] }: { values: number[]; labels: string[]; marks?: { value: number; label: string }[] }) {
  const W = 300;
  // the line uses the whole width, centred in the card; a limit's name sits on its rule at the right end
  const PLOT = W;
  const TOP = 10;
  const BASE = 92;
  const all = [...values, ...marks.map((m) => m.value)];
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const pad = (hi - lo || 1) * 0.2;
  const y = (v: number) => BASE - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * (BASE - TOP);
  const x = (i: number) => 10 + (i / Math.max(1, values.length - 1)) * (PLOT - 20);
  const pts = values.map((v, i): [number, number] => [x(i), y(v)]);
  const [ex, ey] = pts[pts.length - 1];
  const line = smooth(pts);
  return (
    <svg className="v2-history" viewBox={`0 0 ${W} 116`} width="100%" role="img" aria-label={`From ${Math.round(values[0])} to ${Math.round(values[values.length - 1])}`}>
      <line x1="0" x2={PLOT} y1={BASE} y2={BASE} stroke="currentColor" strokeOpacity="0.16" />
      {pts.map(([px], i) => (
        <line key={i} x1={px} x2={px} y1={TOP} y2={BASE} stroke="currentColor" strokeOpacity="0.14" strokeDasharray="1.5 3.5" />
      ))}
      {marks.map((m) => (
        <g key={m.label}>
          <line x1="0" x2={PLOT} y1={y(m.value)} y2={y(m.value)} stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.4" />
          <text x={PLOT - 2} y={y(m.value) - 5} textAnchor="end" className="v2-history-mark">
            {m.label}
          </text>
        </g>
      ))}
      <path d={`${line} L${ex},${BASE} L${pts[0][0]},${BASE} Z`} fill="var(--mid)" opacity="0.12" />
      <path d={line} fill="none" stroke="var(--mid)" strokeOpacity="0.75" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx={ex} cy={ey} r="11" fill="var(--mid)" opacity="0.16" />
      <circle cx={ex} cy={ey} r="6" fill="#fff" stroke="var(--mid)" strokeWidth="3.4" />
      {labels.map((l, i) => (
        <text key={i} x={x(i)} y="110" textAnchor="middle" className="v2-history-label">
          {l}
        </text>
      ))}
    </svg>
  );
}

/**
 * Today against the day before, as two capsules on one scale: the earlier day
 * pale, today in the field's hue, each with its number at the end. Read at a
 * glance as longer or shorter, no axis needed.
 */
export function CompareBars({ today, before, max, labels = ["Yesterday", "Today"] }: { today: number; before: number; max: number; labels?: [string, string] }) {
  const rows: [string, number, boolean][] = [
    [labels[0], before, false],
    [labels[1], today, true],
  ];
  return (
    <span className="v2-compare" role="img" aria-label={`${labels[0]} ${before}, ${labels[1]} ${today}`}>
      {rows.map(([label, v, now]) => (
        <span key={label} className="v2-compare-row" data-now={now ? "" : undefined}>
          <small>{label}</small>
          <span className="v2-compare-bar">
            <i style={{ width: `${Math.max(14, Math.min(100, (v / max) * 100))}%` }}>
              <b>{v}</b>
            </i>
          </span>
        </span>
      ))}
    </span>
  );
}

interface TrendProps {
  values: number[];
  labels: string[];
  kind: "line" | "bars";
  band?: [number, number];
  unit: string;
  decimals?: number;
}

const CHART = { w: 361, h: 196, top: 34, bottom: 22 };

/** Detail chart. Dragging across it reads any point back. */
export function TrendChart({ values, labels, kind, band, unit, decimals = 0 }: TrendProps) {
  const [hit, setHit] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const { lo, hi } = useMemo(() => scale(values, band, kind === "bars"), [values, band, kind]);
  const inner = CHART.h - CHART.top - CHART.bottom;
  const y = (v: number) => CHART.top + inner - ((v - lo) / (hi - lo)) * inner;
  const x = (i: number) => ((i + 0.5) / values.length) * CHART.w;
  const live = hit !== null && hit < values.length ? hit : null;
  const idx = live ?? values.length - 1;
  const value = values[idx];
  const fmt = (v: number) => v.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  const read = (e: PointerEvent<SVGSVGElement>) => {
    const b = ref.current!.getBoundingClientRect();
    setHit(Math.max(0, Math.min(values.length - 1, Math.floor(((e.clientX - b.left) / b.width) * values.length))));
  };

  const reading = `${live === null ? "" : `${labels[live]}, `}${fmt(value)} ${unit}`.trim();
  const bubbleW = Math.max(84, reading.length * 7.2 + 22);
  const bubbleX = Math.max(bubbleW / 2, Math.min(CHART.w - bubbleW / 2, x(idx)));
  const pts = values.map((v, i): [number, number] => [x(i), y(v)]);
  const line = smooth(pts);
  const bar = Math.max(3, (CHART.w / values.length) * 0.58);

  return (
    <div className="v2-chart">
      <svg
        ref={ref}
        viewBox={`0 0 ${CHART.w} ${CHART.h}`}
        role="img"
        aria-label={`Trend, latest ${fmt(values[values.length - 1])} ${unit}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          read(e);
        }}
        onPointerMove={(e) => e.buttons && read(e)}
        onPointerUp={() => setHit(null)}
        onPointerCancel={() => setHit(null)}
      >
        {band && <rect x="0" y={y(band[1])} width={CHART.w} height={Math.max(2, y(band[0]) - y(band[1]))} rx="10" fill="var(--c-accent)" opacity="0.12" />}
        {kind === "bars" &&
          values.map((v, i) => (
            <rect key={i} x={x(i) - bar / 2} y={y(v)} width={bar} height={CHART.top + inner - y(v)} rx={bar / 2} fill="var(--c-accent)" opacity={i === idx ? 1 : 0.36} />
          ))}
        {kind === "line" && (
          <>
            <path d={line} fill="none" stroke="var(--c-accent)" strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
        <line x1={x(idx)} x2={x(idx)} y1={CHART.top - 6} y2={CHART.top + inner} stroke="var(--c-accent)" strokeWidth="1" strokeDasharray="2 4" />
        {kind === "line" && <circle cx={x(idx)} cy={y(value)} r="5.5" fill="#fff" stroke="var(--c-accent)" strokeWidth="2.6" />}
        <g transform={`translate(${bubbleX},0)`}>
          <rect x={-bubbleW / 2} y="0" width={bubbleW} height="24" rx="12" fill="var(--c-accent)" />
          <text y="16" textAnchor="middle" className="v2-chart-read">
            {reading}
          </text>
        </g>
      </svg>
      <div className="v2-chart-axis">
        <span>{labels[0]}</span>
        <span>{labels[Math.floor(labels.length / 2)]}</span>
        <span>Now</span>
      </div>
    </div>
  );
}

/** Scan results have two points, so the trend is drawn against the 10,000-member cohort instead. */
export function CohortCurve({ percentile, first, second, unit }: { percentile: number; first: number; second: number; unit: string }) {
  const W = 361;
  const H = 120;
  const base = H - 24;
  const bell = (p: number) => Math.exp(-((p - 50) ** 2) / (2 * 22 ** 2));
  const points = Array.from({ length: 51 }, (_, i): [number, number] => [(i / 50) * W, base - bell(i * 2) * (base - 14)]);
  const px = (percentile / 100) * W;
  return (
    <div className="v2-cohort">
      <svg viewBox={`0 0 ${W} ${H}`} aria-hidden>
        <path d={`${smooth(points)} L${W},${base} L0,${base} Z`} fill="var(--c-accent)" opacity="0.12" />
        <path d={smooth(points)} fill="none" stroke="var(--c-accent)" strokeWidth="1.6" opacity="0.5" />
        <line x1={px} x2={px} y1="8" y2={base} stroke="var(--c-accent)" strokeWidth="1.6" />
        <circle cx={px} cy={base - bell(percentile) * (base - 14)} r="6" fill="#fff" stroke="var(--c-accent)" strokeWidth="2.6" />
        <line x1="0" x2={W} y1={base} y2={base} stroke="var(--v-line)" />
      </svg>
      <div className="v2-chart-axis">
        <span>Lowest</span>
        <span>
          You, {first} → {second} {unit}
        </span>
        <span>Highest</span>
      </div>
    </div>
  );
}
