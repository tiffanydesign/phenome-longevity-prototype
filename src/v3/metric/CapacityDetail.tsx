import { metric, seriesFor } from "../data/metrics";
import { CompareBars } from "../ui/charts";
import { Chevron } from "../ui/icons";
import { useGo } from "../ui/shell";
import "../home/home.css";

/** The readings Capacity is built from, each read today and the day before. */
const COMPONENTS = ["hrv", "rhr", "spo2d"];

const dayPair = (id: string) => {
  const week = seriesFor(metric(id), "W");
  return { today: week[week.length - 1], before: week[week.length - 2] };
};

/**
 * Capacity's own sections, under its trend: today against yesterday as two
 * bars, a short reading of what the number means for the day, and the three
 * readings it is made from with their own day-on-day change.
 */
export function CapacityDetail() {
  const go = useGo();
  // the day before is read off the change the page states, so the bars and the headline agree
  const m = metric("capacity");
  const today = Number(m.value);
  const hit = /^([+−-])(\d+) on yesterday$/.exec(m.delta);
  const before = hit ? today - Number(hit[2]) * (hit[1] === "+" ? 1 : -1) : Math.round(dayPair("capacity").before);
  return (
    <>
      <section className="mx-block">
        <h2 className="mx-h">Today vs yesterday</h2>
        <div className="mx-card">
          <CompareBars today={today} before={before} max={100} />
        </div>
      </section>

      <section className="mx-about">
        <h2 className="mx-h">{today >= before ? "Recovered and ready" : "Take it a little easier"}</h2>
        <p>
          Your capacity is {today >= before ? "up" : "down"} {Math.abs(today - before)} on yesterday. Heart rate variability is rising while your resting rate holds low,
          which usually means your body has recovered from recent load. <b>A good day for a longer walk or a strength session.</b>
        </p>
      </section>

      <section className="mx-block">
        <h2 className="mx-h">Components</h2>
        <div className="mx-grid">
          {COMPONENTS.map((id) => {
            const c = metric(id);
            const d = dayPair(id);
            const dec = c.decimals ?? 0;
            return (
              <button key={id} className="mx-read" data-field={c.field} onClick={() => go(`/v3/metric/${id}`)}>
                <small>
                  {c.label}
                  <Chevron size={13} />
                </small>
                <b>
                  {d.today.toFixed(dec)} <u>{c.unit}</u>
                </b>
                <span>Yesterday {d.before.toFixed(dec)}</span>
              </button>
            );
          })}
        </div>
      </section>
    </>
  );
}
