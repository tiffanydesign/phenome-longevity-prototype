import { visitDate, VISITS } from "../study/data";

/**
 * Where the twin is read from. The live twin follows the member as devices sync;
 * a checkpoint is the twin as it stood after one clinic visit and never changes;
 * trends sets the figure aside and draws every visit as a chart.
 */
export type View = { kind: "live" } | { kind: "visit"; visit: number } | { kind: "trends" };

export interface Checkpoint {
  visit: number;
  date: string;
  clinic: string;
}

/*
 * The portal's export has no clinic per visit, so each visit takes a name from the
 * booking list. Demo data: replace with the visit's own clinic once the API carries it.
 */
const CLINIC: Record<number, string> = {
  1: "Phenome Stockholm Clinic",
  2: "Phenome Stockholm Clinic",
  3: "Phenome Clinic - Zorlu Istanbul",
  4: "Phenome Stockholm Clinic",
};

/** Every visit, newest first: the one the member is most likely to look back to sits nearest. */
export const CHECKPOINTS: Checkpoint[] = [...VISITS].reverse().map((visit) => ({ visit, date: visitDate(visit), clinic: CLINIC[visit] ?? "Phenome Clinic" }));

/** Trends need two visits to draw a line through. */
export const HAS_TRENDS = VISITS.length > 1;

/** The view a URL asks for: ?at=3 is visit 3, ?at=trends the charts, anything else live. */
export function viewFrom(at: string | null): View {
  if (at === "trends") return HAS_TRENDS ? { kind: "trends" } : { kind: "live" };
  const visit = Number(at);
  return at && VISITS.includes(visit) ? { kind: "visit", visit } : { kind: "live" };
}

export const atParam = (v: View): string | null => (v.kind === "live" ? null : v.kind === "trends" ? "trends" : String(v.visit));

/** "Phenome Clinic - Zorlu Istanbul" as "Zorlu Istanbul", short enough for a menu line. */
export const clinicShort = (name: string) => name.replace(/^Phenome\s+(Clinic\s*-\s*)?/, "").replace(/\s+Clinic$/, "");

/** "4 Nov 2025" as "Nov ’25", for chart labels. */
export const shortDate = (date: string) => {
  const [, mon, yr] = date.split(" ");
  return `${mon} ’${yr.slice(2)}`;
};
