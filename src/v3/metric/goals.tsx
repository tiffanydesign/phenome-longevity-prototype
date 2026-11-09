import { useCallback, useEffect, useState } from "react";
import { metric, type Metric } from "../data/metrics";

/** The readings a member can set a goal for, and how the goal steps. */
export const GOALS: Record<string, { title: string; unit: string; step: number; min: number; max: number }> = {
  steps: { title: "Daily step goal", unit: "steps", step: 500, min: 2000, max: 30000 },
  kcal: { title: "Active calorie goal", unit: "kcal", step: 10, min: 50, max: 1500 },
  diet: { title: "Daily energy goal", unit: "kcal", step: 50, min: 1000, max: 4000 },
};

const KEY = "phenome.v3.goals";

function read(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, number>;
  } catch {
    // storage blocked: goals last for this session only
    return {};
  }
}

/** The goal a row ships with, read off its unit: "/ 8,000" is 8,000. */
const defaultGoal = (m: Metric) => Number(/\/\s*([\d,]+)/.exec(m.unit)?.[1]?.replace(",", "")) || 0;

/* the default for the sheet when the member has not set one: the row's own */
const defaultGoalFor = (id: string) => defaultGoal(metric(id));

const counted = (n: number) => Math.round(n).toLocaleString("en-GB");
const valueOf = (m: Metric) => Number(m.value.replace(",", ""));

/** The member's own goals, kept on this device. */
export function useGoals() {
  const [values, setValues] = useState<Record<string, number>>(read);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(values));
    } catch {
      // storage blocked: nothing to keep
    }
  }, [values]);
  const set = useCallback((id: string, v: number) => setValues((all) => ({ ...all, [id]: v })), []);
  return { values, set, get: (id: string) => values[id] };
}

/** A row with the member's goal in place of the default: the unit, and the comparison worked out against it. */
export function goalOf(m: Metric, values: Record<string, number>): Metric {
  const goal = values[m.id];
  if (!goal || !GOALS[m.id]) return m;
  const unit = m.unit.replace(/\/\s*[\d,]+/, `/ ${counted(goal)}`);
  const v = valueOf(m);
  const delta = /% of goal$/.test(m.delta) ? `${Math.round((v / goal) * 100)}% of goal` : /kcal left$/.test(m.delta) ? (v <= goal ? `${counted(goal - v)} kcal left` : `${counted(v - goal)} kcal over`) : m.delta;
  return { ...m, unit, delta };
}

/** A sheet from the bottom: the goal as one large number, stepped down or up, then kept. */
export function GoalSheet({ id, current, onSave, onClose }: { id: string; current?: number; onSave: (v: number) => void; onClose: () => void }) {
  const g = GOALS[id];
  const [v, setV] = useState(() => current ?? defaultGoalFor(id));
  const clamp = (n: number) => Math.min(g.max, Math.max(g.min, n));
  return (
    <div className="mx-sheet-scrim" onClick={onClose}>
      <div className="mx-sheet" role="dialog" aria-label={g.title} onClick={(e) => e.stopPropagation()}>
        <i className="mx-sheet-grab" aria-hidden />
        <h2>{g.title}</h2>
        <div className="mx-sheet-step">
          <button aria-label="Lower" disabled={v <= g.min} onClick={() => setV(clamp(v - g.step))}>
            −
          </button>
          <span>
            <b>{counted(v)}</b>
            <small>{g.unit}</small>
          </span>
          <button aria-label="Higher" disabled={v >= g.max} onClick={() => setV(clamp(v + g.step))}>
            +
          </button>
        </div>
        <button
          className="mx-sheet-save"
          onClick={() => {
            onSave(v);
            onClose();
          }}
        >
          Save goal
        </button>
        <button className="mx-sheet-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
