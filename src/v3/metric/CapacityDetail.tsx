import { metric, seriesFor } from "../data/metrics";
import { Chevron } from "../ui/icons";
import { useGo } from "../ui/shell";
import "../home/home.css";

/** The readings Capacity is built from, each read today and the day before. */
export const CAPACITY_PARTS = ["hrv", "rhr", "spo2d"];
const COMPONENTS = CAPACITY_PARTS;

const dayPair = (id: string) => {
  const week = seriesFor(metric(id), "W");
  return { today: week[week.length - 1], before: week[week.length - 2] };
};

/** Today's capacity and the day before, read off the change the page states so the bars and the words agree. */
function useDay() {
  const m = metric("capacity");
  const today = Number(m.value);
  const hit = /^([+−-])(\d+) on yesterday$/.exec(m.delta);
  const before = /^Same/.test(m.delta) ? today : hit ? today - Number(hit[2]) * (hit[1] === "+" ? 1 : -1) : Math.round(dayPair("capacity").before);
  return { m, today, before };
}

/** What today's number means, straight under it: a headline and one paragraph, the advice last and set bold. */
export function CapacityInsight() {
  const { today, before } = useDay();
  return (
    <section className="mx-block mx-insight">
      <h2 className="mx-h">{today >= before ? "Recovered and ready" : "Take it a little easier"}</h2>
      <p>
        {today === before ? "Your capacity is the same as yesterday." : `Your capacity is ${today > before ? "up" : "down"} ${Math.abs(today - before)} on yesterday.`} Heart rate variability sits above your usual range while your resting rate holds low,
        so load and recovery are balanced. <b>A good day for a longer walk or a strength session.</b>
      </p>
    </section>
  );
}

/** The three readings Capacity is built from, each with the day before; right under what today means. */
export function CapacityParts() {
  const go = useGo();
  return (
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
  );
}

/** Today against yesterday, drawn like the week comparison above it: one sentence, then two bars. */
export function CapacityDetail() {
  const { m, today, before } = useDay();
  const max = Number(/\/\s*(\d+)/.exec(m.unit)?.[1]) || 100;
  const diff = today - before;
  return (
    <section className="mx-block mx-cmp">
      <h2 className="mx-h">Today vs yesterday</h2>
      <div className="mx-card">
        <p className="mx-cmp-say">
          <b>{diff === 0 ? "The same" : `${Math.abs(diff)} ${diff > 0 ? "higher" : "lower"}`}</b> as yesterday.
        </p>
        <dl className="mx-cmp-pair">
          <div data-k="now">
            <dt>Today</dt>
            <dd>{today}</dd>
            <i style={{ width: `${(today / max) * 100}%` }} />
          </div>
          <div data-k="was">
            <dt>Yesterday</dt>
            <dd>{before}</dd>
            <i style={{ width: `${(before / max) * 100}%` }} />
          </div>
        </dl>
      </div>
    </section>
  );
}
