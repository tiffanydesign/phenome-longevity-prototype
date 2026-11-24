import type { ReactNode } from "react";
import { metric, type Metric } from "../data/metrics";
import { goalOf, useGoals } from "../metric/goals";
import { STAND_GOAL_HR, STAND_HOURS, TRAINING_GOAL_MIN } from "../metric/activityData";
import "./activity-rings.css";

/*
 * The Activity tab's card for the day's three movement goals, Move
 * (active calories), Exercise (training minutes) and Stand (hours with
 * movement), side by side, each a column with its name in its own pink and today's number,
 * and at the right three nested rings, one per goal, filled to its share.
 * Rings stop at a full turn; the numbers say how far past the goal it went.
 */

const num = (v: string) => Number(v.replace(/,/g, "")) || 0;
const goalIn = (m: Metric) => num(/\/\s*([\d,.]+)/.exec(m.unit)?.[1] ?? "0");

interface Part {
  id: string;
  label: string;
  value: string;
  unit: string;
  share: number;
}

/** The three parts, read from the same rows as the cards below them, with the member's own goals. */
export function useActivityParts(): Part[] {
  const goals = useGoals();
  const kcal = goalOf(metric("kcal"), goals.values);
  const train = metric("workouts");
  return [
    { id: "move", label: "Move", value: kcal.value, unit: "kcal", share: num(kcal.value) / (goalIn(kcal) || 1) },
    { id: "exercise", label: "Exercise", value: train.value, unit: "min", share: num(train.value) / TRAINING_GOAL_MIN },
    { id: "stand", label: "Stand", value: String(STAND_HOURS), unit: "hr", share: STAND_HOURS / STAND_GOAL_HR },
  ];
}

/** The columns, split by hairlines. */
export function ActivityColumns({ parts }: { parts: Part[] }) {
  return (
    <span className="ar-cols">
      {parts.map((p) => (
        <span key={p.id} data-part={p.id}>
          <small>{p.label}</small>
          <b>
            {p.value}
            {p.unit && <em>{p.unit}</em>}
          </b>
        </span>
      ))}
    </span>
  );
}

/** Three nested rings, outer to inner in the order of the columns; stroke and gap scale with the size so the inner one always keeps its hole. */
export function ActivityRings({ parts, size = 64 }: { parts: Part[]; size?: number }): ReactNode {
  const stroke = size * 0.115;
  const gap = size * 0.03;
  const c = size / 2;
  return (
    <svg className="ar-rings" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={parts.map((p) => `${p.label} ${Math.round(p.share * 100)}%`).join(", ")}>
      {parts.map((p, i) => {
        const r = c - stroke / 2 - i * (stroke + gap);
        const len = 2 * Math.PI * r;
        const v = Math.max(0, Math.min(1, p.share));
        return (
          <g key={p.id} data-part={p.id}>
            <circle className="ar-track" cx={c} cy={c} r={r} strokeWidth={stroke} />
            {v > 0 && <circle className="ar-fill" cx={c} cy={c} r={r} strokeWidth={stroke} strokeDasharray={`${len * v} ${len}`} transform={`rotate(-90 ${c} ${c})`} />}
          </g>
        );
      })}
    </svg>
  );
}

/** A larger version for the Activity page: the three columns, the rings beside them. */
export function ActivityGlance() {
  const parts = useActivityParts();
  return (
    <span className="ar-body ar-page">
      <ActivityColumns parts={parts} />
      <ActivityRings parts={parts} size={84} />
    </span>
  );
}
