import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BlurLayers, V2Screen } from "../ui/shell";
import { Chevron } from "../ui/icons";
import { fmt } from "../food/data";
import { useEnergy } from "../home/YourPlan";
import { HabitMark } from "./HabitMark";
import { planActions } from "./plan";
import { CLINIC_PLAN, mealActions, useClinicDay, type PlanItem } from "./clinic";
import "./plan-screen.css";

/*
 * The full plan behind the Home card, read top to bottom as a member asks:
 *
 *   1. whose plan is this              title, authors, the goal
 *   2. how is today going              one summary: ring, what is left, energy
 *   3. what did they say               the dietitian's note, as a quote
 *   4. what do I do, and when          one timeline: meals and doses together
 *   5. what am I aiming for            macros against the plan, then nutrients
 *
 * Every row in the timeline shares one grid (time · mark · words · control),
 * so times, marks and controls line up down the whole page.
 */

export function PlanScreen() {
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const { items, done } = useClinicDay();
  const left = items.length - done;

  // one slot per clock time, in order
  const slots: { time: string; items: PlanItem[] }[] = [];
  for (const i of items) {
    const last = slots[slots.length - 1];
    if (last && last.time === i.time) last.items.push(i);
    else slots.push({ time: i.time, items: [i] });
  }

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
          <span className="pt-bar-gap" aria-hidden />
        </header>

        {/* 1 */}
        <section className="pt-hero">
          <h1>Your plan</h1>
          <p>
            {CLINIC_PLAN.dietitian} · {CLINIC_PLAN.doctor}
          </p>
          <div className="pt-hero-tags">
            <span className="pt-goal">{CLINIC_PLAN.goal}</span>
            <span className="pt-updated">Updated {CLINIC_PLAN.updated}</span>
          </div>
        </section>

        {/* 2 */}
        <Summary done={done} total={items.length} left={left} />

        {/* 3 */}
        <figure className="pt-note">
          <blockquote>{CLINIC_PLAN.note}</blockquote>
          <figcaption>{CLINIC_PLAN.dietitian}</figcaption>
        </figure>

        {/* 4 */}
        <h2 className="pt-h2">
          Today <span>{left === 0 ? "All done" : `${left} to go`}</span>
        </h2>
        <ol className="pt-line">
          {slots.map((s) => {
            const allDone = s.items.every((i) => i.done);
            const due = s.items.some((i) => i.due && !i.done);
            return (
              <li key={s.time} className="pt-slot" data-done={allDone || undefined} data-due={due || undefined}>
                <span className="pt-time">
                  <b>{s.time}</b>
                  {due && <small>Due</small>}
                </span>
                <span className="pt-node" aria-hidden />
                <div className="pt-card">
                  {s.items.map((i) => (i.meal ? <MealRow key={i.key} i={i} /> : <DoseRow key={i.key} i={i} />))}
                </div>
              </li>
            );
          })}
        </ol>

        {/* 5 */}
        <Targets />

        <p className="pt-foot">Your care team updates this plan after each visit. Questions about a medicine go to your doctor, not this app.</p>
      </div>
    </V2Screen>
  );
}

/** How today is going, in one card: the ring of things done, what is left, and energy against the plan. */
function Summary({ done, total, left }: { done: number; total: number; left: number }) {
  const { kcal, goal } = useEnergy();
  const size = 64;
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const all = total > 0 && done === total;
  const arc = all ? 1 : Math.min(total ? done / total : 0, 1 - (stroke + 4) / c);
  return (
    <section className="pt-sum" aria-label="Today so far">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pt-ring" data-done={all || undefined} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="pt-ring-track" />
        {arc > 0 && <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="pt-ring-fill" strokeDasharray={`${c * arc} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />}
      </svg>
      <div className="pt-sum-t">
        <b>
          {done} <span>of {total} done</span>
        </b>
        <small>{all ? "Everything in today's plan is done" : `${left} left today`}</small>
        <div className="pt-energy" aria-label={`${fmt(kcal)} of ${fmt(goal)} kcal`}>
          <span className="pt-bar-track">
            <i style={{ width: `${Math.min(100, (kcal / goal) * 100)}%` }} />
          </span>
          <em>
            <b>{fmt(kcal)}</b> / {fmt(goal)} kcal
          </em>
        </div>
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
          <b>{m.name}</b>
          <small>{i.logged ? "Logged in your food diary" : `About ${m.kcal} kcal · pick what you ate`}</small>
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
                  <span className="pt-choice-t">
                    <b>{c.name}</b>
                    <small>
                      {c.kcal} kcal · C {c.carbs} · P {c.protein} · F {c.fat} g
                    </small>
                  </span>
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
            {multi && <em>{`${(i.dose ?? 0) + 1} of ${h.times?.length}`}</em>}
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

/** Macros eaten against the plan as three columns, then the nutrients the plan aims for. */
function Targets() {
  const e = useEnergy();
  const macros = [
    { id: "carbs", name: "Carbs", goal: CLINIC_PLAN.macros.carbs, hue: "#3478f6" },
    { id: "protein", name: "Protein", goal: CLINIC_PLAN.macros.protein, hue: "#af52de" },
    { id: "fat", name: "Fat", goal: CLINIC_PLAN.macros.fat, hue: "#fa6431" },
  ] as const;
  return (
    <>
      <h2 className="pt-h2">
        Daily targets <span>{fmt(CLINIC_PLAN.kcal)} kcal</span>
      </h2>
      <section className="pt-targets">
        <div className="pt-macros">
          {macros.map((m) => {
            const v = Math.round(e[m.id]);
            return (
              <div key={m.id} className="pt-macro">
                <small>{m.name}</small>
                <b>
                  {v}
                  <span> / {m.goal} g</span>
                </b>
                <span className="pt-bar-track">
                  <i style={{ width: `${Math.min(100, (v / m.goal) * 100)}%`, background: m.hue }} />
                </span>
              </div>
            );
          })}
        </div>
        <dl className="pt-micros">
          {CLINIC_PLAN.micros.map((x) => (
            <div key={x.name}>
              <dt>{x.name}</dt>
              <dd>{x.target}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
