import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BlurLayers, useGo, V2Screen } from "../ui/shell";
import { Chevron } from "../ui/icons";
import { fmt } from "../food/data";
import { PLAN_HISTORY, share, span, type PlanRecord } from "./history";
import "./plan-screen.css";
import "./plan-history.css";

/*
 * Every plan the care team has written, newest first. The active plan leads
 * on its own; earlier plans follow as one column of cards. Each card answers
 * the same four questions in the same places, so plans compare at a glance:
 * when (top line), what for (goal), what it asked (energy, meals,
 * medicines), and how it went (days followed, week by week).
 */

export function PlanHistory() {
  const nav = useNavigate();
  const go = useGo();
  const [scrolled, setScrolled] = useState(false);
  const { current, earlier } = PLAN_HISTORY;

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
          <span className="pt-bar-title">Plan history</span>
          <span className="pt-bar-gap" aria-hidden />
        </header>

        <section className="pt-hero">
          <h1>Plan history</h1>
          <p>One plan is active at a time. Earlier plans stay here as your care team wrote them.</p>
        </section>

        <h2 className="pt-h2">Active</h2>
        <PlanCard p={current} onOpen={(el) => go("/v3/plan", { from: el })} />

        <h2 className="pt-h2">
          Earlier <span>{earlier.length} plans</span>
        </h2>
        <ol className="phx-list">
          {earlier.map((p) => (
            <li key={p.id}>
              <PlanCard p={p} onOpen={(el) => go(`/v3/plan/${p.id}`, { from: el })} />
            </li>
          ))}
        </ol>

        <p className="pt-foot">Your care team sees the same history in the clinic portal.</p>
      </div>
    </V2Screen>
  );
}

function PlanCard({ p, onOpen }: { p: PlanRecord; onOpen: (el: HTMLElement) => void }) {
  const active = !p.to;
  return (
    <button className="phx-card" data-active={active || undefined} onClick={(e) => onOpen(e.currentTarget)}>
      <span className="phx-top">
        {active ? <em className="phx-pill">Active</em> : <em className="phx-pill" data-ended="">Ended</em>}
        <span>{span(p)}</span>
        <Chevron size={13} />
      </span>
      <b className="phx-goal">{p.goal}</b>
      <span className="phx-by">
        {p.dietitian.replace(/, dietitian$/, "")} · {p.doctor}
      </span>

      <span className="phx-facts">
        <span>
          <b>{fmt(p.kcal)}</b>
          <small>kcal a day</small>
        </span>
        <span>
          <b>{p.meals.length}</b>
          <small>meals</small>
        </span>
        <span>
          <b>{p.meds.length}</b>
          <small>medicines</small>
        </span>
      </span>

      <Follow p={p} />
    </button>
  );
}

/** Days followed as a share and a count, with one bar per week beside it. */
export function Follow({ p, large = false }: { p: PlanRecord; large?: boolean }) {
  const { days, followed, weeks } = p.follow;
  return (
    <span className="phx-follow" data-large={large || undefined} aria-label={`Followed ${followed} of ${days} days`}>
      <span className="phx-follow-t">
        <b>{share(p)}%</b>
        <small>
          of days followed · {followed} of {days}
        </small>
      </span>
      <span className="phx-weeks" aria-hidden>
        {weeks.map((w, i) => (
          <i key={i} style={{ "--w": w } as React.CSSProperties} data-full={w >= 0.85 || undefined} />
        ))}
      </span>
    </span>
  );
}
