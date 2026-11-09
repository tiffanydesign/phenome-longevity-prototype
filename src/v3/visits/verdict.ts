import type { Metric } from "../data/metrics";
import { trim, visitDate } from "../study/data";

/**
 * better / worse: moved toward or away from the reference range.
 * steady: no change, or in range at both visits.
 * shift: changed, but the reading has no range to judge it by.
 */
export type Verdict = "better" | "worse" | "steady" | "shift";

export const VERDICT_LABEL: Record<Verdict, string> = {
  better: "Toward range",
  worse: "Away from range",
  steady: "Steady",
  shift: "Changed",
};

/** The reading at a visit; blood pressure compares by its systolic number. */
export function at(m: Metric, i: number): number | null {
  const v = m.scans?.[i];
  return v === undefined || Number.isNaN(v) ? null : v;
}

export const decimalsOf = (m: Metric) => m.decimals ?? (m.id === "bp" || m.id === "pulse" || m.id === "skin" ? 0 : 1);

/** "3 May 2026" as "3 May ’26": short enough for two to share one bar */
export const shortDate = (v: number) => {
  const [d, mon, yr] = visitDate(v).split(" ");
  return `${d} ${mon} ’${yr.slice(2)}`;
};

/** how far a value sits outside its range; zero inside it */
const gap = (v: number, [lo, hi]: [number, number]) => (v < lo ? lo - v : v > hi ? v - hi : 0);

export function verdictOf(m: Metric, a: number, b: number): { kind: Verdict; diff: string; weight: number } {
  const va = at(m, a);
  const vb = at(m, b);
  if (va === null || vb === null) return { kind: "steady", diff: "No reading", weight: 0 };
  const d = decimalsOf(m);
  const delta = Number((vb - va).toFixed(d));
  const diff = delta === 0 ? "No change" : `${delta > 0 ? "+" : "−"}${trim(Math.abs(delta), d).replace("−", "")}`;
  if (delta === 0) return { kind: "steady", diff, weight: 0 };
  if (!m.band) return { kind: "shift", diff, weight: 0 };
  const ga = gap(va, m.band);
  const gb = gap(vb, m.band);
  const width = Math.max(1e-6, m.band[1] - m.band[0]);
  if (ga === 0 && gb === 0) return { kind: "steady", diff, weight: 0 };
  if (gb < ga) return { kind: "better", diff, weight: (ga - gb) / width };
  if (gb > ga) return { kind: "worse", diff, weight: (gb - ga) / width };
  return { kind: "steady", diff, weight: 0 };
}
