import { metric, seriesFor, type Metric, type Range } from "../data/metrics";
import { Glyph, glyphOf } from "../ui/glyphs";
import { Num } from "../ui/Num";
import { useGo } from "../ui/shell";

/*
 * What the original Health Monitor page carried that every daily reading
 * keeps here: the period set against the one before it, a way to switch to
 * any other reading in place, and, for blood pressure, its range, extremes
 * and what moves it.
 */

/** Readings that add up over a period; the rest are averaged. */
const SUMMED = new Set(["steps", "kcal", "distance"]);

const LABELS: Record<Range, [string, string, string]> = {
  D: ["Today vs yesterday", "Today", "Yesterday"],
  W: ["This week vs last week", "This week", "Last week"],
  M: ["This month vs last month", "This month", "Last month"],
  "6M": ["These 6 months vs the 6 before", "Last 6 months", "6 before"],
  Y: ["This year vs last year", "This year", "Last year"],
};

/** The period on show against the one before it, the change said in words. */
export function CompareBlock({ m, range, page }: { m: Metric; range: Range; page: number }) {
  const now = seriesFor(m, range, page);
  const was = seriesFor(m, range, page + 1);
  const sum = range === "D" && SUMMED.has(m.id);
  const agg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (sum ? 1 : xs.length || 1);
  const a = agg(now);
  const b = agg(was);
  const dec = m.decimals ?? 0;
  const f = (v: number) => v.toLocaleString("en-GB", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const unit = m.unit.startsWith("/") ? m.unit.match(/[a-z]+$/i)?.[0] ?? "" : m.unit;
  const diff = a - b;
  const pct = b ? Math.round((diff / Math.abs(b)) * 100) : 0;
  const [title, l1, l2] = LABELS[range];
  const [cur, prev] = page === 0 ? [l1, l2] : ["This period", "The one before"];
  return (
    <section className="mx-block mx-cmp">
      <h2 className="mx-h">{page === 0 ? title : "Against the period before"}</h2>
      <div className="mx-card">
        <p className="mx-cmp-say">
          {Math.abs(pct) < 2 ? (
            <b>About the same</b>
          ) : (
            <>
              <b>
                {f(Math.abs(diff))} {unit} {diff > 0 ? "higher" : "lower"}
              </b>{" "}
              ({diff > 0 ? "+" : "−"}
              {Math.abs(pct)}%)
            </>
          )}{" "}
          {sum ? "in total" : "on average"}.
        </p>
        <dl className="mx-cmp-pair">
          <div data-k="now">
            <dt>{cur}</dt>
            <dd>
              <Num v={f(a)} /> <small>{unit}</small>
            </dd>
            <i style={{ width: `${Math.min(100, (a / Math.max(a, b)) * 100)}%` }} />
          </div>
          <div data-k="was">
            <dt>{prev}</dt>
            <dd>
              <Num v={f(b)} /> <small>{unit}</small>
            </dd>
            <i style={{ width: `${Math.min(100, (b / Math.max(a, b)) * 100)}%` }} />
          </div>
        </dl>
      </div>
    </section>
  );
}

/** Every daily reading the monitor covers, grouped as the original listed them. */
export const MONITOR_GROUPS: { title: string; ids: string[] }[] = [
  { title: "Vitals", ids: ["respd", "bpd", "spo2d", "rhr", "hr", "hrv"] },
  { title: "Move", ids: ["steps", "kcal", "distance"] },
  { title: "Sleep", ids: ["sleep", "sleepscore", "consistency", "efficiency", "hoursneeds", "restorative"] },
];
export const inMonitor = (id: string) => MONITOR_GROUPS.some((g) => g.ids.includes(id));

/** A sheet listing every reading; picking one swaps the page in place. */
export function MetricPicker({ current, onClose }: { current: string; onClose: () => void }) {
  const go = useGo();
  return (
    <div className="mx-sheet-scrim" onClick={onClose}>
      <div className="mx-sheet mx-pick" role="dialog" aria-label="Choose a reading" onClick={(e) => e.stopPropagation()}>
        <i className="mx-sheet-grab" aria-hidden />
        <h2>Your health monitor</h2>
        <div className="mx-pick-scroll">
          {MONITOR_GROUPS.map((g) => (
            <section key={g.title}>
              <h3>{g.title}</h3>
              <div className="mx-pick-list">
                {g.ids.map((id) => {
                  const r = metric(id);
                  return (
                    <button
                      key={id}
                      data-field={r.field}
                      aria-current={id === current ? "true" : undefined}
                      onClick={() => {
                        onClose();
                        if (id !== current) go(`/v3/metric/${id}`, { replace: true });
                      }}
                    >
                      <span className="mx-pick-mark">
                        <Glyph name={glyphOf(id)} size={18} />
                      </span>
                      <span className="mx-pick-name">{r.label}</span>
                      <span className="mx-pick-val">
                        <Num v={r.value} /> <small>{r.unit.startsWith("/") ? "" : r.unit}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

const FACTORS = [
  { t: "Salt", d: "High salt holds water in the body, raising blood volume and the pressure on artery walls." },
  { t: "Stress and sleep", d: "Ongoing stress and short sleep both raise cortisol, which lifts blood pressure over time." },
  { t: "Movement", d: "Regular aerobic exercise strengthens the heart so it pumps with less effort." },
];

/** Blood pressure's own sections: average and range, the four extremes, what moves it. */
export function BpDetail({ range, page }: { range: Range; page: number }) {
  const m = metric("bpd");
  const sys = seriesFor(m, range, page);
  const dia = sys.map((v, i) => v * 0.64 + Math.sin(i) * 2);
  const r = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
  const hi = (xs: number[]) => Math.round(Math.max(...xs));
  const lo = (xs: number[]) => Math.round(Math.min(...xs));
  const tiles = [
    { k: "Highest systolic", v: hi(sys) },
    { k: "Highest diastolic", v: hi(dia) },
    { k: "Lowest systolic", v: lo(sys) },
    { k: "Lowest diastolic", v: lo(dia) },
  ];
  return (
    <>
      <section className="mx-block">
        <h2 className="mx-h">Average and range</h2>
        <div className="mx-card mx-bp">
          <div className="mx-bp-row">
            <div>
              <small>Average</small>
              <b>
                {r(sys)}/{r(dia)} <u>mmHg</u>
              </b>
            </div>
            <div>
              <small>Range</small>
              <b>
                {lo(sys)}–{hi(sys)} / {lo(dia)}–{hi(dia)}
              </b>
            </div>
          </div>
          <div className="mx-bp-grid">
            {tiles.map((t) => (
              <div key={t.k}>
                <small>{t.k}</small>
                <b>
                  {t.v} <u>mmHg</u>
                </b>
              </div>
            ))}
          </div>
          <p className="mx-bp-note">
            <b>Changes through the day are normal.</b> Posture, water, meals and stress all shift blood pressure; brief changes between readings are expected.
          </p>
        </div>
      </section>
      <section className="mx-block">
        <h2 className="mx-h">What moves it</h2>
        <div className="mx-card mx-factors">
          {FACTORS.map((f) => (
            <div key={f.t}>
              <b>{f.t}</b>
              <p>{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
