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

/** Small trend on a card: shape of the week only. The numbers live on the detail. */
export function CardTrend({ values, kind, w = 132, h = 44, color = "currentColor" }: { values: number[]; kind: "line" | "bars"; w?: number; h?: number; color?: string }) {
  const { lo, hi } = scale(values, undefined, kind === "bars");
  const y = (v: number) => h - 3 - ((v - lo) / (hi - lo)) * (h - 6);
  const step = w / values.length;
  if (kind === "bars") {
    const bar = Math.max(3, step * 0.56);
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
        {values.map((v, i) => {
          const top = y(v);
          return <rect key={i} x={i * step + (step - bar) / 2} y={top} width={bar} height={h - top} rx={bar / 2} fill={color} opacity={i === values.length - 1 ? 1 : 0.5} />;
        })}
      </svg>
    );
  }
  const pts = values.map((v, i): [number, number] => [(i / (values.length - 1)) * (w - 6) + 1, y(v)]);
  const [ex, ey] = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <path d={smooth(pts)} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={ex} cy={ey} r="3.4" fill={color} />
    </svg>
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

/** Detail chart. Dragging across it reads any point back, as Samsung Health's charts do. */
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
