import { metric } from "../data/metrics";

/**
 * Today's three activity goals and their colours, shared by the Home ring and
 * the walker's bubbles. Three hues at one lightness and one chroma (OKLCH
 * 0.65 / 0.13), so none shouts over the others: Phenome's blue for steps, a
 * soft coral for the energy burned, teal for distance. No violet, and no gold,
 * which belongs to Monitor.
 */
export const GOALS = [
  { id: "steps", goal: 8000, color: "#5589d7" },
  { id: "kcal", goal: 200, color: "#db735f" },
  { id: "distance", goal: 5, color: "#00a8a1" },
];

/** share of each goal done today, 0 to 1 */
export const goalShares = () => GOALS.map((g) => Math.min(1, parseFloat(metric(g.id).value.replace(",", "")) / g.goal));
