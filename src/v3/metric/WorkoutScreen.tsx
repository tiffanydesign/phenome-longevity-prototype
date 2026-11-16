import { useParams } from "react-router-dom";
import { BackBar, BlurLayers, V2Screen } from "../ui/shell";
import { heartTrace, workoutById, ZONES } from "./activityData";
import "./metric.css";
import "./activity.css";

const W = 320;
const H = 140;

/** Heart rate through the session, minute by minute, over pale bands for each zone it reached. */
function HeartTrace({ hr, min }: { hr: number[]; min: number }) {
  const lo = 70;
  const hi = 170;
  const y = (v: number) => H - ((v - lo) / (hi - lo)) * H;
  const x = (i: number) => (i / (hr.length - 1)) * W;
  const d = hr.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg className="wk-trace" viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label="Heart rate through the workout">
      {ZONES.map((z, i) => {
        const top = i + 1 < ZONES.length ? ZONES[i + 1].from : hi;
        return <rect key={z.name} data-zone={i + 1} x="0" width={W} y={y(Math.min(top, hi))} height={Math.max(0, y(z.from) - y(Math.min(top, hi)))} />;
      })}
      <path className="wk-line" d={d} />
      {[0, Math.round(min / 2), min].map((m, i) => (
        <text key={i} className="ac-axis" x={x(m)} y={H + 14} textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}>
          {m} min
        </text>
      ))}
    </svg>
  );
}

/**
 * One workout, read top to bottom: what and when, the four numbers that sum
 * it up, the heart rate through it, how long in each zone, then the energy.
 */
export function WorkoutScreen() {
  const { id = "" } = useParams();
  const w = workoutById(id);
  if (!w)
    return (
      <V2Screen nav={false}>
        <div className="mx scroll">
          <header className="mx-bar">
            <BackBar />
          </header>
        </div>
      </V2Screen>
    );
  const hr = heartTrace(w);
  const most = w.zones.indexOf(Math.max(...w.zones));

  return (
    <V2Screen nav={false}>
      <div className="v2-veil mx-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="mx scroll" data-field="rose">
        <header className="mx-bar">
          <BackBar />
        </header>

        <section className="mx-hero">
          <p className="mx-eyebrow">Workout</p>
          <h1 className="wk-title">{w.name}</h1>
          <p className="mx-src">
            Today, {w.start}–{w.end} · {w.source}
          </p>
        </section>

        <dl className="wk-stats">
          <div>
            <dt>Duration</dt>
            <dd>
              {w.min} <u>min</u>
            </dd>
          </div>
          <div>
            <dt>Calories</dt>
            <dd>
              {w.kcal} <u>kcal</u>
            </dd>
          </div>
          <div>
            <dt>Avg heart rate</dt>
            <dd>
              {w.avgHr} <u>bpm</u>
            </dd>
          </div>
          <div>
            <dt>Max heart rate</dt>
            <dd>
              {w.maxHr} <u>bpm</u>
            </dd>
          </div>
        </dl>

        <section className="mx-block">
          <h2 className="mx-h">Heart rate</h2>
          <div className="mx-card">
            <HeartTrace hr={hr} min={w.min} />
          </div>
        </section>

        <section className="mx-block">
          <h2 className="mx-h">Time in zones</h2>
          <div className="mx-card wk-zones">
            <p className="ac-say">
              Mostly <b>{ZONES[most].label.toLowerCase()}</b> effort, {w.zones[most]} of {w.min} minutes in {ZONES[most].name.toLowerCase()}.
            </p>
            {ZONES.map((z, i) => (
              <div key={z.name} className="wk-zone" data-zone={i + 1} data-empty={w.zones[i] ? undefined : ""}>
                <span className="wk-zone-n">
                  <b>{z.name}</b>
                  <small>
                    {z.label} · {z.from}+ bpm
                  </small>
                </span>
                <span className="wk-zone-bar" aria-hidden>
                  <i style={{ width: `${(w.zones[i] / w.min) * 100}%` }} />
                </span>
                <em>{w.zones[i]} min</em>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-about">
          <h2 className="mx-h">About this workout</h2>
          <p>
            Recorded by your {w.source.replace("Phenome ", "").toLowerCase()} and counted in today's training time and energy. Minutes in zone 2 and above count toward your weekly
            target.
          </p>
        </section>
      </div>
    </V2Screen>
  );
}
