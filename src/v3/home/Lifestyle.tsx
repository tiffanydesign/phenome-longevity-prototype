import { useSearchParams } from "react-router-dom";
import { metric, type Metric } from "../data/metrics";
import { todayKey, useMeals } from "../food/store";
import { MetricCard } from "./CategoryPage";
import { useDiaryMetric } from "./diary";
import { Chevron } from "../ui/icons";
import { useGo } from "../ui/shell";
import { HabitMark } from "../habits/HabitMark";
import { planActions, unitFor, useToday, type HabitToday } from "../habits/plan";
import { FoodTabExtras } from "./FoodTabExtras";
import "./lifestyle.css";


const num = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;
/*
 * The Lifestyle tab below its Today card: two daily routines behind a
 * two-way switch, Nutrition (what was eaten, what the next meal should do)
 * and Habits (today's plan, ticked off in place). Each side opens with its
 * own card, the way into its full page. The chosen side stays in the
 * address so a detail page pops back to it.
 */

type Side = "nutrition" | "habits";

export function LifestyleBody() {
  const [params, setParams] = useSearchParams();
  const side: Side = params.get("life") === "habits" ? "habits" : "nutrition";
  const pick = (id: Side) => {
    const next = new URLSearchParams(params);
    if (id === "nutrition") next.delete("life");
    else next.set("life", id);
    setParams(next, { replace: true });
  };
  const sides: { id: Side; label: string }[] = [
    { id: "nutrition", label: "Nutrition" },
    { id: "habits", label: "Habits" },
  ];
  return (
    <div className="lf">
      {/* the two halves as two chips, the chosen one raised; names only, the numbers live in the cards below */}
      <div className="lf-chips" role="tablist" aria-label="Lifestyle">
        {sides.map((s) => (
          <button key={s.id} role="tab" aria-selected={side === s.id} onClick={() => pick(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      {side === "nutrition" ? <NutritionSide /> : <HabitsSide />}
    </div>
  );
}

/** Nutrition: the day's card first, which opens the food diary, then the meals and the next one. */
function NutritionSide() {
  const meals = useMeals();
  const diet = useDiaryMetric(metric("diet"));
  const last = meals.filter((m) => m.status === "ready" && m.day === todayKey()).sort((a, b) => b.at - a.at)[0];
  const stamp = last ? new Date(last.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : undefined;
  return (
    <>
      <div className="lf-entry">
        <MetricCard id="diet" m={diet} stamp={stamp} to="/v3/food" glyph={<EnergyRing kcal={num(diet.value)} goal={num(diet.unit)} />} />
      </div>
      <FoodTabExtras />
    </>
  );
}

/** Habits: the day's card first, which opens the plan, then today's list to tick off in place. */
function HabitsSide() {
  const { all } = useToday();
  const done = all.filter((t) => t.done).length;
  const left = all.length - done;
  const m: Metric = {
    ...metric("habits"),
    value: String(done),
    unit: `/ ${all.length} done`,
    delta: left === 0 ? "All done today" : `${left} left today`,
  };
  return (
    <>
      <div className="lf-entry">
        <MetricCard id="habits" m={m} to="/v3/habits" glyph={<HabitRing done={done} total={all.length} />} />
      </div>
      <HabitsToday />
    </>
  );
}

/** The day's habits as one ring: the share done, a tick once all are done. */
function HabitRing({ done, total }: { done: number; total: number }) {
  return <ProgressRing share={total ? done / total : 0} done={total > 0 && done === total} label={`${done} of ${total} habits done`} />;
}

/** The day's energy against the goal as one ring: green once in range, the alert colour well past it. */
function EnergyRing({ kcal, goal }: { kcal: number; goal: number }) {
  const share = goal ? kcal / goal : 0;
  const tone = share > 1.1 ? "over" : share >= 0.9 ? "ok" : undefined;
  return <ProgressRing share={share} tone={tone} label={`${Math.round(share * 100)}% of the day's energy goal`} />;
}

/**
 * One ring for a card's right side: the share in the card's hue with the
 * percentage inside, green with a tick when done. Below 100% the arc keeps a
 * visible gap, as round caps would otherwise close it.
 */
function ProgressRing({ share, done, tone, label }: { share: number; done?: boolean; tone?: "ok" | "over"; label: string }) {
  const size = 56;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const full = done || share >= 1;
  const arc = full ? 1 : Math.min(Math.max(0, share), 1 - (stroke + 4) / c);
  return (
    <svg className="cg lf-ring" data-done={done ? "" : undefined} data-tone={tone} width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
      <circle className="lf-ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
      {arc > 0 && (
        <circle className="lf-ring-fill" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} strokeDasharray={`${c * arc} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      )}
      {done ? (
        <path d="M20.5 28.5 25.5 33.5 35.5 22.5" className="lf-ring-tick" />
      ) : (
        <text x="50%" y="50%" dy="0.35em" textAnchor="middle" className="lf-ring-n">
          {Math.round(share * 100)}%
        </text>
      )}
    </svg>
  );
}

/** What a habit row says under its name: progress, the answer given, or where a tick came from. */
function lineOf(t: HabitToday) {
  if (t.by) return t.by;
  if (t.h.kind === "count") return `${t.count} of ${t.goal} ${unitFor(t.h, t.goal)}`;
  if (t.h.kind === "choice") return t.answer ?? t.h.detail ?? "One answer";
  return t.done ? "Done" : t.h.detail ?? "Once today";
}

/** Today's habits as one grouped card; once and count habits are logged right here. */
function HabitsToday() {
  const go = useGo();
  const { all } = useToday();
  const done = all.filter((t) => t.done).length;
  const share = all.length ? done / all.length : 0;
  return (
    <section className="v2-group" aria-label="Today's habits">
      <header className="v2-sec lf-sub">
        <h3>Today's habits</h3>
      </header>
      <div className="lf-card">
        <div className="lf-progress" aria-label={`${done} of ${all.length} habits done`}>
          <span>
            <b>{done}</b> of {all.length} done
          </span>
          <span className="lf-progress-bar" aria-hidden>
            <i style={{ "--share": share } as React.CSSProperties} />
          </span>
        </div>
        {all.map((t) => (
          <div key={t.h.id} className="lf-habit" data-done={t.done ? "" : undefined}>
            <HabitMark mark={t.h.mark} field={t.h.field} done={t.done} size={36} />
            <span className="lf-habit-t">
              <b>{t.h.name}</b>
              <small>{lineOf(t)}</small>
            </span>
            <HabitAction t={t} onOpen={() => go("/v3/habits")} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** The one control a row needs: a tick, a +1, or a way to answer. */
function HabitAction({ t, onOpen }: { t: HabitToday; onOpen: () => void }) {
  const name = t.h.name.toLowerCase();
  if (t.by && t.done) {
    return (
      <span className="lf-act" data-on="" aria-label="Logged automatically">
        <Tick />
      </span>
    );
  }
  if (t.h.kind === "count") {
    return (
      <button className="lf-act lf-act-count" data-on={t.done ? "" : undefined} aria-label={`Add one: ${name}`} onClick={() => planActions.tap(t.h.id)}>
        {t.done ? <Tick /> : "+1"}
      </button>
    );
  }
  if (t.h.kind === "choice") {
    return t.done ? (
      <button className="lf-act" data-on="" aria-label={`Answered ${t.answer}. Undo`} onClick={() => planActions.undo(t.h.id)}>
        <Tick />
      </button>
    ) : (
      <button className="lf-act lf-act-go" aria-label={`Answer: ${name}`} onClick={onOpen}>
        <Chevron size={14} />
      </button>
    );
  }
  return (
    <button
      className="lf-act"
      data-on={t.done ? "" : undefined}
      aria-pressed={t.done}
      aria-label={t.done ? `Done: ${name}. Undo` : `Mark done: ${name}`}
      onClick={() => (t.done ? planActions.undo(t.h.id) : planActions.answer(t.h.id, "Done"))}
    >
      {t.done && <Tick />}
    </button>
  );
}

function Tick() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}
