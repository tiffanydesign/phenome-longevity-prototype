import { useState, type ReactNode } from "react";
import { fmt, NUTRIENT, TARGET, type NutrientId, type Totals } from "./data";
import { NutrientCard, NutrientMark } from "./parts";
import { Ph } from "./icons";
import { ENERGY, STEP_GOAL, STEPS_TODAY, STEPS_YESTERDAY, WORKOUTS } from "../metric/activityData";
import { ScoreSegments } from "../metric/detailCharts";

/*
 * The day at a glance, as pages the member swipes through: energy and the
 * three macros, then the diet score and fibre and minerals, then how much
 * they moved. Every page shares one height so nothing below jumps.
 */

/** A diet score out of ten: how close the day is to each target, energy included. */
export function dietScore(t: Totals, goal: number) {
  const ids: NutrientId[] = ["protein", "fiber", "calcium", "iron"];
  const parts = ids.map((id) => ({ id, share: Math.min(1, t[id] / TARGET[id]) }));
  const energy = Math.max(0, 1 - Math.abs(1 - t.kcal / goal));
  const score = Math.round(((parts.reduce((a, p) => a + p.share, 0) + energy) / (ids.length + 1)) * 10);
  const low = [...parts].sort((a, b) => a.share - b.share)[0];
  return { score, low: low.id };
}

const scoreWord = (n: number) => (n >= 8 ? "Great" : n >= 6 ? "Good" : n >= 4 ? "Fair" : "Low");

/** The score as the Sleep score is shown: the arc at the left, what would lift it beside it. */
function ScoreCard({ t, goal }: { t: Totals; goal: number }) {
  const s = dietScore(t, goal);
  return (
    <section className="fd-hero fd-score" aria-label={`Diet score ${s.score} out of 10`}>
      <ScoreSegments score={s.score} max={10} word={scoreWord(s.score)} />
      <span className="fd-score-t">
        <b>Diet score</b>
        <small>
          {s.score >= 8 ? "A well-rounded day so far." : `More ${NUTRIENT[s.low].name.toLowerCase()} would lift it most.`} Energy, protein, fibre, calcium and iron each count.
        </small>
      </span>
    </section>
  );
}

const WEEK_STEPS = [7820, 5310, 9480, 8120, 10240, STEPS_YESTERDAY, STEPS_TODAY];

/** Steps today over a week of plain ink bars, today's marked with a dot. */
function StepsCard({ onOpen }: { onOpen: () => void }) {
  const top = Math.max(...WEEK_STEPS, STEP_GOAL);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return d.toLocaleDateString("en-GB", { weekday: "narrow" });
  });
  return (
    <button className="fd-move" onClick={onOpen} aria-label={`${fmt(STEPS_TODAY)} steps today`}>
      <span className="fd-move-head">
        <StepsMark />
        <span>
          <b>{fmt(STEPS_TODAY)}</b>
          <small>Steps today</small>
        </span>
      </span>
      <span className="fd-move-bars" aria-hidden>
        {WEEK_STEPS.map((v, i) => (
          <span key={i} data-today={i === 6 ? "" : undefined}>
            <em>
              <i style={{ height: `${(v / top) * 100}%` }} />
            </em>
            <small>{days[i]}</small>
          </span>
        ))}
      </span>
    </button>
  );
}

/** Calories burned by moving, with what they came from. */
function BurnCard({ onOpen }: { onOpen: () => void }) {
  const mins = WORKOUTS.reduce((a, w) => a + w.min, 0);
  const rows: { mark: ReactNode; name: string; value: string }[] = [
    { mark: <StepsMark small />, name: "Steps", value: fmt(STEPS_TODAY) },
    {
      mark: (
        <Ph name="barbell" size={17} />
      ),
      name: "Workouts",
      value: `${mins} min`,
    },
  ];
  return (
    <button className="fd-move" onClick={onOpen} aria-label={`${ENERGY.active} active calories`}>
      <span className="fd-move-head">
        <NutrientMark id="kcal" size={20} />
        <span>
          <b>{ENERGY.active}</b>
          <small>Active calories</small>
        </span>
      </span>
      <span className="fd-move-rows">
        {rows.map((r) => (
          <span key={r.name}>
            <i aria-hidden>{r.mark}</i>
            <span>
              <small>{r.name}</small>
              <b>{r.value}</b>
            </span>
          </span>
        ))}
      </span>
    </button>
  );
}

/** How much they moved today, out of ten: steps, active calories, workout minutes. */
const MOVE_GOAL = { kcal: 200, min: 45 };
function MoveScoreCard({ onOpen }: { onOpen: () => void }) {
  const mins = WORKOUTS.reduce((a, w) => a + w.min, 0);
  const parts = [STEPS_TODAY / STEP_GOAL, ENERGY.active / MOVE_GOAL.kcal, mins / MOVE_GOAL.min].map((v) => Math.min(1, v));
  const score = Math.round((parts.reduce((a, v) => a + v, 0) / parts.length) * 10);
  return (
    <button className="fd-wide" onClick={onOpen} aria-label={`Activity score ${score} out of 10`}>
      <span className="fd-core fd-core-lg" aria-hidden>
        <Ph name="lightning" size={20} />
      </span>
      <span className="fd-wide-body">
        <span className="fd-wide-top">
          <b>Activity score</b>
          <span>
            <b>{score}</b>/10
          </span>
        </span>
        <span className="fd-score-bar" aria-hidden>
          <i style={{ width: `${score * 10}%` }} />
        </span>
      </span>
    </button>
  );
}

function StepsMark({ small }: { small?: boolean }) {
  return <Ph name="footprints" size={small ? 17 : 20} />;
}

/** The swipeable pages and their dots. */
export function DaySlides({ hero, t, goal, onOpen }: { hero: ReactNode; t: Totals; goal: number; onOpen: (path: string) => void }) {
  const [page, setPage] = useState(0);
  const pages = [
    <>
      {hero}
      <div className="fd-row3">
        {(["protein", "carbs", "fat"] as const).map((id) => (
          <NutrientCard key={id} id={id} t={t} />
        ))}
      </div>
    </>,
    <>
      <ScoreCard t={t} goal={goal} />
      <div className="fd-row3">
        {(["fiber", "calcium", "iron"] as const).map((id) => (
          <NutrientCard key={id} id={id} t={t} />
        ))}
      </div>
    </>,
    <>
      <div className="fd-row2">
        <StepsCard onOpen={() => onOpen("/v3/metric/steps")} />
        <BurnCard onOpen={() => onOpen("/v3/metric/kcal")} />
      </div>
      <MoveScoreCard onOpen={() => onOpen("/v3/metric/steps")} />
    </>,
  ];
  return (
    <section className="fd-pager" aria-label="Your day">
      <div
        className="fd-pages"
        onScroll={(e) => {
          const el = e.currentTarget;
          setPage(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {pages.map((p, i) => (
          <div key={i} className="fd-slide" aria-hidden={page !== i}>
            {p}
          </div>
        ))}
      </div>
      <div className="fd-dots" aria-hidden>
        {pages.map((_, i) => (
          <i key={i} data-on={page === i ? "" : undefined} />
        ))}
      </div>
    </section>
  );
}
