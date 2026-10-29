/** Small glyphs shared by the Home detail screens (Capacity, Health Monitor). */

/** ⓘ outline icon next to section titles (capture: capacity/scroll_2, sleep/scroll_1). */
export function InfoIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden style={{ color: "var(--c-text-2)", flexShrink: 0 }}>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="8" cy="4.9" r="0.85" fill="currentColor" />
      <path d="M8 7.1v4.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** ▲ (up) / ● (flat) trend markers after comparison values. */
export function TrendMark({ kind, color, size = 10 }: { kind: "up" | "dot"; color: string; size?: number }) {
  return kind === "up" ? (
    <svg width={size} height={size * 0.6} viewBox="0 0 10 6" aria-hidden style={{ marginLeft: 10, color }}>
      <path d="M5 0l5 6H0z" fill="currentColor" />
    </svg>
  ) : (
    <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 8 8" aria-hidden style={{ marginLeft: 6, color }}>
      <circle cx="4" cy="4" r="4" fill="currentColor" />
    </svg>
  );
}

/**
 * Current time, overridable with `?now=2026-10-28T14:38` so compare runs match the capture date
 * (captures were taken 28 Oct 2026 ~14:38). Prototype-only switch.
 */
export function nowFromSearch(search: string): Date {
  const q = new URLSearchParams(search).get("now");
  const d = q ? new Date(q) : new Date();
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
