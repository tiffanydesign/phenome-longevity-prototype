import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BlurLayers, useGo, V2Screen } from "../ui/shell";
import { Chevron } from "../ui/icons";
import { fmt, NUTRIENT, type NutrientId } from "../food/data";
import { dayTotals, todayKey, useMeals } from "../food/store";
import { NutrientMark } from "../food/parts";
import { useEnergy } from "../home/YourPlan";
import { HabitMark } from "./HabitMark";
import { PlanNote } from "./PlanNote";
import { planActions } from "./plan";
import { CLINIC_PLAN, mealActions, useClinicDay, type PlanItem } from "./clinic";
import { PLAN_HISTORY } from "./history";
import "./plan-screen.css";
import "./plan-history.css";

/*
 * The full plan behind the Home card, read top to bottom as a member asks:
 *
 *   1. what is this plan for          title, the goal, who wrote it and since when
 *   2. what did they say              the dietitian's note
 *   3. what do I do today             progress and what is next, then the day by clock
 *                                     time: each time a heading, its meals and doses
 *                                     in one full-width card
 *   4. what am I aiming for           energy and macros against today, then the
 *                                     nutrients to reach and the one to keep under
 *   5. what came before               earlier plans
 *
 * Every row inside a card shares one grid (mark 32 · words · control 28), and
 * every card sits on the same 16px gutter, so marks and controls line up
 * down the whole page.
 */

export function PlanScreen() {
  const nav = useNavigate();
  const go = useGo();
  const [scrolled, setScrolled] = useState(false);
  const { items, done, next } = useClinicDay();
  const left = items.length - done;

  // one slot per clock time, in order
  const slots: { time: string; items: PlanItem[] }[] = [];
  for (const i of items) {
    const last = slots[slots.length - 1];
    if (last && last.time === i.time) last.items.push(i);
    else slots.push({ time: i.time, items: [i] });
  }
  const since = PLAN_HISTORY.current.from.replace(/ \d{4}$/, "");

  return (
    <V2Screen nav={false}>
      <div className="v2-veil vs-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="pt scroll" data-field="food" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 64)}>
        <header className="pt-bar" data-scrolled={scrolled || undefined}>
          <button className="pt-back" aria-label="Back" onClick={() => nav(-1)}>
            <Chevron dir="left" size={22} />
          </button>
          <span className="pt-bar-title">Your plan</span>
          <button className="pt-hist" aria-label="Plan history" onClick={(e) => go("/v3/plan/history", { from: e.currentTarget })}>
            <HistoryGlyph />
          </button>
        </header>

        {/* 1 */}
        <section className="pt-hero">
          <h1>Your plan</h1>
          <p className="pt-goal-line">{CLINIC_PLAN.goal}</p>
          <p className="pt-meta">
            <span className="pt-live" aria-hidden />
            Active since {since} · {CLINIC_PLAN.dietitian.replace(/, dietitian$/, "")} and {CLINIC_PLAN.doctor}
          </p>
        </section>

        {/* 2 */}
        <PlanNote text={CLINIC_PLAN.note} by={CLINIC_PLAN.dietitian} />

        {/* 3 */}
        <h2 className="pt-h2">Today</h2>
        <Progress done={done} total={items.length} left={left} next={next[0]} />
        <ol className="pt-day">
          {slots.map((s) => {
            const allDone = s.items.every((i) => i.done);
            const due = s.items.some((i) => i.due && !i.done);
            return (
              <li key={s.time} className="pt-slot" data-done={allDone || undefined}>
                <h3 className="pt-slot-h">
                  <b>{s.time}</b>
                  {due && <em className="pt-due">Due</em>}
                  {allDone && <em className="pt-done">Done</em>}
                </h3>
                <div className="pt-card">
                  {s.items.map((i) => (i.meal ? <MealRow key={i.key} i={i} /> : <DoseRow key={i.key} i={i} />))}
                </div>
              </li>
            );
          })}
        </ol>

        {/* 4 */}
        <Targets />

        {/* 5 */}
        <button className="pt-prev" onClick={(e) => go("/v3/plan/history", { from: e.currentTarget })}>
          <span className="pt-prev-mark" aria-hidden>
            <HistoryGlyph />
          </span>
          <span className="pt-prev-t">
            <b>Previous plans</b>
            <small>{PLAN_HISTORY.earlier.length} earlier plans and how each went</small>
          </span>
          <Chevron size={14} />
        </button>

        <p className="pt-foot">Your care team updates this plan after each visit. Questions about a medicine go to your doctor, not this app.</p>
      </div>
    </V2Screen>
  );
}

/** Today's progress: a ring of things done, the count, and the next thing due. */
function Progress({ done, total, left, next }: { done: number; total: number; left: number; next?: PlanItem }) {
  const size = 52;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const all = total > 0 && done === total;
  const arc = all ? 1 : Math.min(total ? done / total : 0, 1 - (stroke + 4) / c);
  const nextName = next ? (next.meal ? next.meal.name : next.habit?.h.name) : undefined;
  return (
    <section className="pt-sum" aria-label="Today so far">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pt-ring" data-done={all || undefined} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="pt-ring-track" />
        {arc > 0 && <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="pt-ring-fill" strokeDasharray={`${c * arc} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />}
      </svg>
      <div className="pt-sum-t">
        <b>
          {done}
          <span> of {total} done</span>
        </b>
        <small>{all ? "Everything in today's plan is done" : next ? `Next: ${nextName} at ${next.time}` : `${left} left today`}</small>
      </div>
    </section>
  );
}

/** A meal: its name and energy guide, then the choices; tap the one eaten. Logged in the diary, the choices fold away. */
function MealRow({ i }: { i: PlanItem }) {
  const m = i.meal!;
  return (
    <div className="pt-item" data-done={i.done || undefined}>
      <div className="pt-row">
        <HabitMark mark="meal" field="food" size={32} />
        <span className="pt-row-t">
          <b>
            {m.name}
            <em>about {m.kcal} kcal</em>
          </b>
          <small>{i.logged ? "Logged in your food diary" : i.done ? "Eaten as planned" : "Pick what you ate"}</small>
        </span>
        {i.done && <Done />}
      </div>
      {!i.logged && (
        <ul className="pt-choices">
          {m.choices.map((c, n) => {
            const on = i.choice === n;
            return (
              <li key={c.name}>
                <button aria-pressed={on} onClick={() => (on ? mealActions.undo(m.id) : mealActions.eat(m.id, n))}>
                  <span className="pt-choice-t">{c.name}</span>
                  <small className="pt-choice-k">{c.kcal} kcal</small>
                  <span className="pt-radio" data-on={on || undefined} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** A dose: mark, name and dose, and a round control to mark it taken. */
function DoseRow({ i }: { i: PlanItem }) {
  const h = i.habit!.h;
  const multi = h.kind === "count" && (h.times?.length ?? 0) > 1;
  const toggle = () => {
    if (i.done) return planActions.undo(h.id);
    return h.kind === "count" ? planActions.tap(h.id) : planActions.answer(h.id, "Done");
  };
  return (
    <div className="pt-item" data-done={i.done || undefined}>
      <div className="pt-row">
        <HabitMark mark={h.mark} field={h.field} size={32} />
        <span className="pt-row-t">
          <b>
            {h.name}
            {multi && <em>{`dose ${(i.dose ?? 0) + 1} of ${h.times?.length}`}</em>}
          </b>
          <small>{h.detail}</small>
        </span>
        <button className="pt-tick" data-on={i.done || undefined} aria-pressed={i.done} aria-label={i.done ? `Undo: ${h.name}` : `Mark taken: ${h.name}`} onClick={toggle}>
          {i.done && <TickMark />}
        </button>
      </div>
    </div>
  );
}

function Done() {
  return (
    <span className="pt-tick" data-on="" aria-label="Done">
      <TickMark />
    </span>
  );
}

function TickMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/*
 * Daily targets. Every tracked nutrient reads the same way: its mark and
 * name, what it still needs in plain words ("17 g to go", "Goal reached"),
 * today's amount against the target, and a bar in its own colour. Energy
 * leads, larger. Nutrients the food diary can't count (vitamin D, sodium)
 * close the card as guidance, saying what to aim for and where it comes from.
 */
const MACRO_ROWS: NutrientId[] = ["protein", "carbs", "fat"];
const MICRO_ID: Record<string, NutrientId> = { Fibre: "fiber", Calcium: "calcium", Iron: "iron" };

function Targets() {
  const e = useEnergy();
  const meals = useMeals();
  const diary = dayTotals(meals, todayKey());
  const kLeft = e.goal - e.kcal;
  const tracked = CLINIC_PLAN.micros.filter((m) => MICRO_ID[m.name]);
  const guides = CLINIC_PLAN.micros.filter((m) => !MICRO_ID[m.name]);
  return (
    <>
      <h2 className="pt-h2">Daily targets</h2>

      <section className="pt-card pt-energy-card" aria-label="Energy and macros today">
        <div className="pt-kcal">
          <span className="pt-kcal-t">
            <small>Energy today</small>
            <b>
              {fmt(e.kcal)}
              <span> / {fmt(e.goal)} kcal</span>
            </b>
          </span>
          <em>{kLeft >= 0 ? `${fmt(kLeft)} kcal left` : `${fmt(-kLeft)} kcal over`}</em>
        </div>
        <Bar v={e.kcal} goal={e.goal} large />

        <ul className="pt-nlist">
          {MACRO_ROWS.map((id) => {
            const k = id as "protein" | "carbs" | "fat";
            return <NRow key={id} id={id} name={NUTRIENT[id].short} v={e[k]} goal={CLINIC_PLAN.macros[k]} unit="g" />;
          })}
        </ul>
      </section>

      <section className="pt-card pt-micro-card" aria-label="Fibre, vitamins and minerals">
        <h3 className="pt-card-h">Fibre, vitamins and minerals</h3>
        <ul className="pt-nlist">
          {tracked.map((m) => {
            const id = MICRO_ID[m.name];
            return <NRow key={m.name} id={id} name={m.name} v={diary[id]} goal={m.goal} unit={m.unit} />;
          })}
        </ul>
        {guides.length > 0 && (
          <>
            <h3 className="pt-card-h pt-card-h-sub">Not counted by your food diary</h3>
            <ul className="pt-guides">
              {guides.map((m) => (
                <li key={m.name}>
                  <span className="pt-guide-mark" aria-hidden>
                    {m.limit ? <LimitGlyph /> : <SunGlyph />}
                  </span>
                  <span className="pt-nrow-t">
                    <b>{m.name}</b>
                    <small>{m.limit ? "Go easy on salty bread, cheese and ready meals" : "In your morning vitamins"}</small>
                  </span>
                  <span className="pt-nrow-v">
                    {m.limit ? "Under " : ""}
                    <b>{fmt(m.goal)}</b> {m.unit}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}

const amount = (v: number) => (v > 0 && v < 20 ? Math.round(v * 10) / 10 : Math.round(v));

/** One nutrient: mark, name and what it still needs, today against the target, and its bar. */
function NRow({ id, name, v, goal, unit }: { id: NutrientId; name: string; v: number; goal: number; unit: string }) {
  const n = amount(v);
  const met = n >= goal;
  const togo = amount(goal - v);
  return (
    <li className="pt-nrow" style={{ "--hue": NUTRIENT[id].hue } as React.CSSProperties}>
      <NutrientMark id={id} size={18} />
      <span className="pt-nrow-t">
        <b>{name}</b>
        <small data-met={met || undefined}>{met ? "Goal reached" : `${fmt(togo)} ${unit} to go`}</small>
      </span>
      <span className="pt-nrow-v">
        <b>{fmt(n)}</b> / {fmt(goal)} {unit}
      </span>
      <Bar v={v} goal={goal} />
    </li>
  );
}

function Bar({ v, goal, large = false }: { v: number; goal: number; large?: boolean }) {
  return (
    <span className="pt-track" data-large={large || undefined} aria-hidden>
      <i style={{ width: `${Math.min(100, goal > 0 ? (v / goal) * 100 : 0)}%` }} />
    </span>
  );
}

function SunGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </svg>
  );
}

function LimitGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8 12h8" />
    </svg>
  );
}

/** A clock with a turning arrow: earlier versions of this plan. */
function HistoryGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3.5 4v4.5H8" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
