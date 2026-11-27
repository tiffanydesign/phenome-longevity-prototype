import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { BlurLayers, useGo, V2Screen } from "../ui/shell";
import { Chevron } from "../ui/icons";
import { fmt, NUTRIENT } from "../food/data";
import { NutrientMark } from "../food/parts";
import { HabitMark } from "./HabitMark";
import { PlanNote } from "./PlanNote";
import { findPlan, span } from "./history";
import { Follow } from "./PlanHistory";
import "./plan-screen.css";
import "./plan-history.css";

/*
 * An earlier plan, read only. It keeps the active plan's order (whose,
 * what they said, what to eat and take, the targets) so the two read side
 * by side in memory, and adds what only a finished plan has: how it went,
 * and what the next visit changed. Nothing here can be ticked.
 */

export function PlanArchive() {
  const { id } = useParams();
  const nav = useNavigate();
  const go = useGo();
  const [scrolled, setScrolled] = useState(false);
  const p = findPlan(id);
  if (!p || !p.to) return <Navigate to="/v3/plan" replace />;

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
          <span className="pt-bar-title">{span(p)}</span>
          <span className="pt-bar-gap" aria-hidden />
        </header>

        <section className="pt-hero">
          <h1>Previous plan</h1>
          <p className="pt-goal-line">{p.goal}</p>
          <p className="pt-meta">
            <span className="pt-live" data-ended="" aria-hidden />
            {span(p)} · {p.dietitian.replace(/, dietitian$/, "")} and {p.doctor}
          </p>
        </section>

        <button className="phx-banner" onClick={(e) => go("/v3/plan", { from: e.currentTarget })}>
          <span>
            <b>Ended {p.to.replace(/ \d{4}$/, "")}</b>
            <small>Replaced at your next visit</small>
          </span>
          <em>
            Active plan
            <Chevron size={12} />
          </em>
        </button>

        <PlanNote text={p.note} by={p.dietitian} />

        <h2 className="pt-h2">How it went</h2>
        <section className="phx-sec">
          <Follow p={p} large />
          {p.changed && (
            <div className="phx-changed">
              <small>Changed at the next visit</small>
              <ul>
                {p.changed.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <h2 className="pt-h2">The day</h2>
        <ol className="pt-day">
          {p.meals.map((m) => (
            <li key={m.name} className="pt-slot">
              <h3 className="pt-slot-h">
                <b>{m.time}</b>
              </h3>
              <div className="pt-card">
                <div className="pt-item">
                  <div className="pt-row" data-static="">
                    <HabitMark mark="meal" field="food" size={32} />
                    <span className="pt-row-t">
                      <b>
                        {m.name}
                        <em>about {m.kcal} kcal</em>
                      </b>
                      <small>
                        {m.choices.length} {m.choices.length === 1 ? "choice" : "choices"}
                      </small>
                    </span>
                  </div>
                  <ul className="pt-choices">
                    {m.choices.map((c) => (
                      <li key={c}>
                        <span className="pt-choice-ro">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="pt-h2">
          Medicines <span>{p.meds.length}</span>
        </h2>
        <div className="pt-card phx-meds">
          {p.meds.map((m) => (
            <div key={m.name} className="pt-item">
              <div className="pt-row" data-static="">
                <HabitMark mark="pill" field="plain" size={32} />
                <span className="pt-row-t">
                  <b>{m.name}</b>
                  <small>{m.detail}</small>
                </span>
              </div>
            </div>
          ))}
        </div>

        <h2 className="pt-h2">Daily targets</h2>
        <section className="pt-card pt-energy-card" aria-label="Energy and macros">
          <div className="pt-kcal">
            <span className="pt-kcal-t">
              <small>Energy</small>
              <b>
                {fmt(p.kcal)}
                <span> kcal a day</span>
              </b>
            </span>
          </div>
          <ul className="pt-nlist">
            {(["protein", "carbs", "fat"] as const).map((k) => (
              <li key={k} className="pt-nrow">
                <NutrientMark id={k} size={18} />
                <span className="pt-nrow-t">
                  <b>{NUTRIENT[k].short}</b>
                </span>
                <span className="pt-nrow-v">
                  <b>{p.macros[k]}</b> g
                </span>
              </li>
            ))}
          </ul>
        </section>

        <p className="pt-foot">Kept for reference. Follow the active plan; ask your care team before going back to anything here.</p>
      </div>
    </V2Screen>
  );
}
