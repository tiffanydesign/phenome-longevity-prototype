import type { Metric } from "../data/metrics";
import { at, type Verdict } from "./verdict";

/**
 * A reading's place against its reference range. The scale spans every visit and
 * the range itself; the range is the pale band, the earlier visit an open ring,
 * the later one a solid dot in the verdict's colour, joined where they differ.
 */
export function RangeBar({ m, a, b, kind }: { m: Metric; a: number; b: number; kind: Verdict }) {
  const all = (m.scans ?? []).map((_, i) => at(m, i)).filter((v): v is number => v !== null);
  const va = at(m, a);
  const vb = at(m, b);
  if (!all.length || va === null || vb === null) return <span className="vc-bar" aria-hidden />;
  const pts = m.band ? [...all, ...m.band] : all;
  let lo = Math.min(...pts);
  let hi = Math.max(...pts);
  const pad = (hi - lo || Math.abs(hi) || 1) * 0.12;
  lo -= pad;
  hi += pad;
  const pos = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const pa = pos(va);
  const pb = pos(vb);
  return (
    <span className="vc-bar" data-verdict={kind} aria-hidden>
      <i className="vc-bar-track" />
      {m.band && <i className="vc-bar-band" style={{ left: `${pos(m.band[0])}%`, width: `${pos(m.band[1]) - pos(m.band[0])}%` }} />}
      <i className="vc-bar-move" style={{ left: `${Math.min(pa, pb)}%`, width: `${Math.abs(pb - pa)}%` }} />
      <i className="vc-bar-then" style={{ left: `${pa}%` }} />
      <i className="vc-bar-now" style={{ left: `${pb}%` }} />
    </span>
  );
}
