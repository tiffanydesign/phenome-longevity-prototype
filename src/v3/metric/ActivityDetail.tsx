import { Chevron } from "../ui/icons";
import { useGo } from "../ui/shell";
import { ENERGY, stepDay, STEP_GOAL, STEPS_TODAY, STEPS_YESTERDAY, WORKOUTS, type Workout } from "./activityData";
import "./activity.css";

/*
 * Activity's own sections, under today's hourly bars. In the order a member
 * asks: am I ahead of yesterday, what did the day burn, and what did I train.
 * Each answers in a sentence first, then shows the picture.
 */

const W = 320;
const H = 132;
const fmt = (n: number) => Math.round(n).toLocaleString("en-GB");

/** Steps adding up through the day: today solid up to now, yesterday dashed for the whole day, the goal as a rule. */
function PaceChart({ today, yesterday, now }: { today: number[]; yesterday: number[]; now: number }) {
  const top = Math.max(STEP_GOAL, STEPS_YESTERDAY) * 1.08;
  const x = (h: number) => ((h + 1) / 24) * W;
  const y = (v: number) => H - (v / top) * H;
  const path = (xs: number[], upto: number) => ["M0," + H, ...xs.slice(0, upto + 1).map((v, h) => `L${x(h).toFixed(1)},${y(v).toFixed(1)}`)].join(" ");
  return (
    <svg className="ac-pace" viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label={`Today ${fmt(today[now])} steps by now, yesterday ${fmt(yesterday[now])} by this time`}>
      <line className="ac-goal" x1="0" x2={W} y1={y(STEP_GOAL)} y2={y(STEP_GOAL)} />
      <text className="ac-goal-t" x="0" y={y(STEP_GOAL) - 5}>
        Goal {fmt(STEP_GOAL)}
      </text>
      <path className="ac-was" d={path(yesterday, 23)} />
      <path className="ac-now-area" d={`${path(today, now)} L${x(now)},${H} Z`} />
      <path className="ac-now" d={path(today, now)} />
      <line className="ac-nowline" x1={x(now)} x2={x(now)} y1="0" y2={H} />
      <circle className="ac-dot" cx={x(now)} cy={y(today[now])} r="4.5" />
      {["00", "06", "12", "18", "24"].map((t, i) => (
        <text key={t} className="ac-axis" x={(i / 4) * W} y={H + 14} textAnchor={i === 0 ? "start" : i === 4 ? "end" : "middle"}>
          {t}
        </text>
      ))}
    </svg>
  );
}

function WorkoutRow({ w }: { w: Workout }) {
  const go = useGo();
  return (
    <button className="ac-wo" onClick={(e) => go(`/v3/workout/${w.id}`, { from: e.currentTarget })}>
      <span className="ac-wo-mark" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {w.kind === "strength" ? (
            <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" />
          ) : (
            <>
              <circle cx="13" cy="4.5" r="1.8" />
              <path d="m10 21 2-6 3 3v4M8 12l2-4h4l2 3 3 1" />
            </>
          )}
        </svg>
      </span>
      <span className="ac-wo-t">
        <b>{w.name}</b>
        <small>
          {w.start}–{w.end} · avg {w.avgHr} bpm
        </small>
      </span>
      <span className="ac-wo-v">
        <b>{w.min} min</b>
        <small>{w.kcal} kcal</small>
      </span>
      <Chevron size={14} />
    </button>
  );
}

export function ActivityDetail() {
  const go = useGo();
  const now = new Date().getHours();
  const { today, yesterday, yesterdayByNow } = stepDay(now);
  const ahead = STEPS_TODAY - yesterdayByNow;
  const total = ENERGY.active + ENERGY.resting;

  return (
    <>
      {/* 1 · am I ahead of yesterday */}
      <section className="mx-block">
        <h2 className="mx-h">Today vs yesterday</h2>
        <div className="mx-card ac-card">
          <p className="ac-say">
            {ahead >= 0 ? (
              <>
                <b>{fmt(ahead)} steps ahead</b> of yesterday at this time.
              </>
            ) : (
              <>
                <b>{fmt(-ahead)} steps behind</b> yesterday at this time.
              </>
            )}
          </p>
          <PaceChart today={today} yesterday={yesterday} now={now} />
          <dl className="ac-key">
            <div data-k="now">
              <dt>Today</dt>
              <dd>{fmt(STEPS_TODAY)}</dd>
            </div>
            <div data-k="was">
              <dt>Yesterday by now</dt>
              <dd>{fmt(yesterdayByNow)}</dd>
            </div>
            <div data-k="was">
              <dt>Yesterday in all</dt>
              <dd>{fmt(STEPS_YESTERDAY)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 2 · what the day burned: movement on top of the body at rest */}
      <section className="mx-block">
        <h2 className="mx-h">Energy</h2>
        <button className="mx-card ac-card ac-energy" onClick={(e) => go("/v3/metric/kcal", { from: e.currentTarget })}>
          <p className="ac-say">
            <b>{fmt(total)} kcal</b> burned so far today.
          </p>
          <span className="ac-split" aria-hidden>
            <i data-k="active" style={{ flexGrow: ENERGY.active }} />
            <i data-k="rest" style={{ flexGrow: ENERGY.resting }} />
          </span>
          <span className="ac-legend">
            <span data-k="active">
              <i aria-hidden />
              <span>
                <b>{ENERGY.active}</b> active
                <small>of 200 kcal goal</small>
              </span>
            </span>
            <span data-k="rest">
              <i aria-hidden />
              <span>
                <b>{fmt(ENERGY.resting)}</b> resting
                <small>your body at rest</small>
              </span>
            </span>
          </span>
          <Chevron size={14} />
        </button>
        <div className="mx-grid ac-grid">
          <button className="mx-read" data-field="teal" onClick={() => go("/v3/metric/distance")}>
            <small>
              Distance
              <Chevron size={13} />
            </small>
            <b>
              4.12 <u>km</u>
            </b>
            <span>0.88 km to 5 km</span>
          </button>
          <button className="mx-read" data-field="rose" onClick={() => go("/v3/metric/workouts")}>
            <small>
              Training time
              <Chevron size={13} />
            </small>
            <b>
              38 <u>min</u>
            </b>
            <span>Goal 45 min</span>
          </button>
        </div>
      </section>

      {/* 3 · what was trained */}
      <section className="mx-block">
        <h2 className="mx-h">Workouts today</h2>
        <div className="mx-card ac-list">
          {WORKOUTS.map((w) => (
            <WorkoutRow key={w.id} w={w} />
          ))}
        </div>
      </section>
    </>
  );
}
