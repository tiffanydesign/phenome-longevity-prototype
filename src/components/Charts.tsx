import type { CSSProperties, ReactNode } from "react";

/**
 * Circular progress ring (home Sleep / Calories / Steps, gut score, finding badges).
 * value: 0–1. The original draws these natively; arcs here are SVG reconstructions.
 */
export function Ring({
  size,
  stroke,
  value,
  color,
  track = "var(--c-track)",
  start = -90,
  children,
}: {
  size: number;
  stroke: number;
  value: number;
  color: string;
  track?: string;
  start?: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: `rotate(${start}deg)` }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {v > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${c * v} ${c}`}
            style={{ transition: "stroke-dasharray 600ms var(--ease-out)" }}
          />
        )}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>{children}</div>
    </div>
  );
}

/** Semicircle gauge (Capacity detail, Personal-traits "Less / More likely"). */
export function Gauge({ width, stroke, value, color, track = "var(--c-track)", children }: { width: number; stroke: number; value: number; color: string; track?: string; children?: ReactNode }) {
  const r = (width - stroke) / 2;
  const h = r + stroke / 2;
  const len = Math.PI * r;
  const d = `M ${stroke / 2} ${h} A ${r} ${r} 0 0 1 ${width - stroke / 2} ${h}`;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div style={{ position: "relative", width, height: h, flexShrink: 0 }}>
      <svg width={width} height={h} style={{ overflow: "visible" }}>
        <path d={d} fill="none" stroke={track} strokeWidth={stroke} />
        {v > 0 && <path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${len * v} ${len}`} />}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

export function Spinner({ size = 28, color = "var(--c-navy)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" style={{ animation: "spin 0.9s linear infinite" }} aria-label="Loading">
      <path d="M14 3a11 11 0 0 1 11 11" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Grey placeholder block used by skeleton states (capacity/loading). */
export function Skeleton({ w = "100%", h, r = 12, style }: { w?: number | string; h: number; r?: number; style?: CSSProperties }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: "#dcdcdc", ...style }} />;
}
