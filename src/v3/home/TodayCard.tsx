import { useMemo } from "react";
import { metric, type Tab } from "../data/metrics";
import { goalOf, useGoals } from "../metric/goals";
import { Chevron } from "../ui/icons";
import { useGo } from "../ui/shell";
import { fmt, SLOTS, TARGET } from "../food/data";
import { dayTotals, mealTotals, todayKey, useMeals } from "../food/store";
import { usePlan } from "../food/targets";
import { STAND_HOURS } from "../metric/activityData";
import "./today-card.css";

/*
 * The one card under every tab's verdict: today, not the week. The same
 * size as the twin's door on the Overview, so a tab never opens on a chart.
 * A ring at the left holds the tab's lead number; beside it one line naming
 * that number and what it means, then the three readings checked most. The whole card opens the
 * lead reading's page; every other reading has its own card further down.
 */

type HomeTab = Exclude<Tab, "all" | "body">;

interface Stat {
  v: string;
  unit?: string;
  label: string;
}

interface Today {
  /** 0–1, how full the ring is */
  share: number;
  /** what sits inside the ring */
  core: string;
  /** colour of the ring when it is not the tab's own */
  hue?: string;
  lead: string;
  note: string;
  stats: Stat[];
  to: string;
  aria: string;
}

const num = (v: string) => Number(v.replace(/[^\d.−-]/g, "").replace("−", "-")) || 0;
const word = (n: number) => (n >= 85 ? "Excellent" : n >= 70 ? "Good" : n >= 55 ? "Fair" : "Low");

function useToday(tab: HomeTab): Today {
  const goals = useGoals();
  const meals = useMeals();
  usePlan();
  const diet = goals.get("diet") ?? TARGET.kcal;

  return useMemo(() => {
    const m = (id: string) => goalOf(metric(id), goals.values);
    if (tab === "vitals") {
      const cap = m("capacity");
      const n = num(cap.value);
      const max = num(cap.unit) || 100;
      const share = n / max;
      return {
        share,
        core: cap.value,
        lead: "Capacity",
        note: share >= 0.7 ? "Stable, ready to train" : share >= 0.5 ? "Keep it steady" : "Take it easy",
        stats: [
          { v: m("rhr").value, unit: "bpm", label: "Resting HR" },
          { v: m("hrv").value, unit: "ms", label: "HRV" },
          { v: m("bpd").value, label: "BP" },
        ],
        to: "/v3/metric/capacity",
        aria: `Vitals today: capacity ${cap.value}`,
      };
    }
    if (tab === "activity") {
      const steps = m("steps");
      const goal = num(steps.unit) || 8000;
      const n = num(steps.value);
      const left = goal - n;
      return {
        share: n / goal,
        core: `${Math.round((n / goal) * 100)}%`,
        lead: `${steps.value} steps`,
        note: left > 0 ? `${fmt(left)} to go` : "Goal reached",
        stats: [
          { v: m("kcal").value, unit: "kcal", label: "Move" },
          { v: m("workouts").value, unit: "min", label: "Exercise" },
          { v: String(STAND_HOURS), unit: "hr", label: "Stand" },
        ],
        to: "/v3/metric/steps",
        aria: `Activity today: ${steps.value} steps`,
      };
    }
    if (tab === "sleep") {
      const score = m("sleepscore");
      const n = num(score.value);
      return {
        share: n / 100,
        core: score.value,
        lead: "Sleep score",
        note: `${word(n)} night`,
        stats: [
          { v: m("sleep").value, unit: "h", label: "Asleep" },
          { v: m("deep").value, unit: "h", label: "Deep" },
          { v: m("efficiency").value, unit: "%", label: "Efficiency" },
        ],
        to: "/v3/metric/sleep",
        aria: `Sleep last night: score ${score.value}`,
      };
    }
    // Lifestyle: energy from the food diary, then what each main meal brought; a meal not yet logged shows a dash
    const t = dayTotals(meals, todayKey());
    const share = t.kcal / diet;
    return {
      share,
      core: `${Math.round(share * 100)}%`,
      hue: share > 1.1 ? "var(--v-alert)" : share >= 0.9 ? "#34c759" : undefined,
      lead: t.kcal > diet ? `${fmt(t.kcal - diet)} kcal over` : `${fmt(diet - t.kcal)} kcal left`,
      note: `of ${fmt(diet)}`,
      stats: SLOTS.filter((sl) => sl.id !== "snack").map((sl) => {
        const list = meals.filter((x) => x.day === todayKey() && x.slot === sl.id && x.status === "ready");
        const kcal = list.reduce((n, x) => n + mealTotals(x).kcal, 0);
        return list.length ? { v: fmt(kcal), unit: "kcal", label: sl.name } : { v: "–", label: sl.name };
      }),
      to: "/v3/food",
      aria: `Lifestyle today: ${fmt(t.kcal)} of ${fmt(diet)} kcal`,
    };
  }, [tab, goals.values, meals, diet]);
}

export function TodayCard({ tab }: { tab: HomeTab }) {
  const go = useGo();
  const d = useToday(tab);
  const size = 60;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, d.share));
  return (
    <button className="v2-today" aria-label={d.aria} onClick={(e) => go(d.to, { from: e.currentTarget })}>
      <span className="v2-today-ring" aria-hidden>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle className="v2-today-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
          {v > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={d.hue ?? "var(--mid)"}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${c * v} ${c}`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
        </svg>
        <b>{d.core}</b>
      </span>
      <span className="v2-today-body">
        <span className="v2-today-lead">
          <b>{d.lead}</b>
          <small>{d.note}</small>
        </span>
        <span className="v2-today-stats">
          {d.stats.map((s) => (
            <span key={s.label}>
              <b>
                {s.v}
                {s.unit && <small>{s.unit}</small>}
              </b>
              <em>{s.label}</em>
            </span>
          ))}
        </span>
      </span>
      <span className="v2-today-go" aria-hidden>
        <Chevron size={14} />
      </span>
    </button>
  );
}
