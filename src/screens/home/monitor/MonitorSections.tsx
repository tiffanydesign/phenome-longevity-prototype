import { Icon } from "@/components/Icon";
import { Gauge } from "@/components/Charts";
import type { MetricDef, Period, PeriodValues } from "@/data/home-monitor";
import { InfoIcon, TrendMark } from "../shared/marks";
import { MonitorChart, axisFor } from "./MonitorChart";

const COMPARE: Record<Period, [string, string, string]> = {
  D: ["Today vs Yesterday", "Today", "Yesterday"],
  W: ["This Week vs Last Week", "Total This Week", "Total Last Week"],
  M: ["This Month vs Last Month", "Average This Month", "Average Last Month"],
  "6M": ["Recent 6M vs Previous 6M", "Average This 6M", "Average Previous 6M"],
  Y: ["This Year vs Last Year", "Average This Year", "Average Last Year"],
};

const num = (v: number | null, comma = true) => (v == null ? "--" : comma ? v.toLocaleString("en-GB") : String(v));

/** Steps / Calories / vitals layout — capture: steps/top, steps/scroll_1, calories/*, steps/period_*. */
export function StandardBody({ m, v, period, today }: { m: MetricDef; v: PeriodValues; period: Period; today: Date }) {
  const [title, l1, l2] = COMPARE[period];
  const axis = axisFor(period, today, v.series);
  const up = (v.current ?? 0) > (v.previous ?? 0);
  return (
    <>
      <span className="mon-eyebrow">{period === "D" ? m.dayLabel : "AVERAGE"}</span>
      <div className="mon-headline">
        <b>{num(v.headline, false)}</b>
        {period === "D" && m.goal !== undefined && (
          <>
            <span className="mon-goal">/ {m.goal}</span>
            {m.unit && (
              <span className="mon-goal-unit" style={{ color: m.color }}>
                {m.unit}
              </span>
            )}
            <EditIcon />
          </>
        )}
        {period === "D" && m.goal === undefined && m.unit && <span className="mon-goal">{m.unit}</span>}
      </div>
      <p className="mon-desc">{m.description}</p>
      <MonitorChart axis={axis} series={v.series} color={m.color} kind={period === "D" || period === "W" ? "bar" : "line"} />

      <h2 className="mon-h2 mon-compare-title" data-period={period}>
        {title}
      </h2>
      <div className="mon-pair mon-pair-std">
        <span className="mon-lbl">{l1}</span>
        <span className="mon-lbl">{l2}</span>
        {/* TODO(fidelity): today colour rule (red when not above yesterday) inferred from one capture. */}
        <span className="mon-cmp" style={{ color: up ? "var(--c-success)" : "var(--c-danger)" }}>
          {num(v.current)}
          {m.unit && <small>{m.unit}</small>}
        </span>
        <span className="mon-cmp" style={{ color: "var(--c-text-2)" }}>
          {num(v.previous)}
          {m.unit && <small>{m.unit}</small>}
          <TrendMark kind="dot" color="#a7a7a7" size={8} />
        </span>
      </div>
      {period === "D" && <DayCard color={m.color} now={today} />}

      <h2 className="mon-h2 mon-about-title">About {m.label}</h2>
      <p className="mon-about">{m.about}</p>
    </>
  );
}

/** Grey "today vs yesterday" intraday card with the now-line (capture: steps/scroll_1). */
function DayCard({ color, now }: { color: string; now: Date }) {
  const frac = (now.getHours() * 60 + now.getMinutes()) / 1440;
  const x0 = 18.2;
  const x1 = 345.4;
  const nx = x0 + (x1 - x0) * frac;
  return (
    <div className="mon-daycard">
      <svg width="362" height="180" viewBox="0 0 362 180" aria-hidden>
        <line x1={nx} x2={nx} y1={12} y2={153} stroke="#6c6c6c" strokeWidth={0.9} />
        <line x1={12} x2={350} y1={153} y2={153} stroke="#c9c9c9" strokeWidth={0.8} strokeDasharray="2 3" />
        <line x1={x0} x2={nx} y1={153} y2={153} stroke={color} strokeWidth={1.2} />
        {["0h", "6h", "12h", "18h"].map((t, k) => (
          <text key={t} x={19 + k * 84.6} y={170} className="mon-chart-x" textAnchor="start">
            {t}
          </text>
        ))}
      </svg>
    </div>
  );
}

function EditIcon() {
  return (
    <svg className="mon-edit" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-label="Edit goal">
      <path d="M7.2 2.6H3.4c-.9 0-1.6.7-1.6 1.6v8.4c0 .9.7 1.6 1.6 1.6h8.4c.9 0 1.6-.7 1.6-1.6V8.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12.3 1.6a1.4 1.4 0 012 2L8.1 9.8 5.6 10.4l.6-2.5 6.1-6.3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

const SLEEP_TILES = [
  { label: "Hours vs Needed", icon: "sleep_hours_vs_needs" },
  { label: "Sleep Consistency", icon: "sleep_consistency" },
  { label: "Sleep Efficiency", icon: "sleep_efficiency" },
];
const SLEEP_ROWS = [
  { title: "Restorative Sleep", unit: "hours", color: "#cf4df3", l1: "Today", l2: "Yesterday" },
  { title: "Hours vs Needs", unit: "%", color: "#65c466", l1: "Today", l2: "Yesterday" },
  { title: "Sleep Consistency", unit: "%", color: "#65c466", l1: "This Week", l2: "Last Week" },
  { title: "Sleep Efficiency", unit: "%", color: "#f09343", l1: "Today", l2: "Yesterday" },
];

/** Sleep Score layout — capture: sleep/top, scroll_1, scroll_2. */
export function SleepBody({ m, v }: { m: MetricDef; v: PeriodValues }) {
  return (
    <>
      <div className="mon-gauge">
        <Gauge width={362} stroke={20} value={(v.headline ?? 0) / 100} color={m.color}>
          <span className="mon-gauge-val">{num(v.headline)}</span>
        </Gauge>
      </div>
      <p className="mon-desc mon-desc-sleep">{m.description}</p>
      <div className="mon-tiles">
        {SLEEP_TILES.map((t) => (
          <div className="mon-tile" key={t.label}>
            <Icon name={t.icon} size={19} className="mon-tile-icon" />
            <span className="mon-tile-label">{t.label}</span>
            <span className="mon-tile-val">--%</span>
            <span className="mon-tile-bar" />
          </div>
        ))}
      </div>
      {SLEEP_ROWS.map((r) => (
        <section className="mon-srow" key={r.title}>
          <h2 className="mon-h2">
            {r.title} <InfoIcon size={15} />
          </h2>
          <div className="mon-pair">
            <span className="mon-lbl">{r.l1}</span>
            <span className="mon-lbl" style={{ color: "#abb5d6" }}>
              {r.l2}
            </span>
            <span className="mon-dash" style={{ color: r.color }}>
              <b>--</b> {r.unit}
              <TrendMark kind="up" color={r.color} size={9} />
            </span>
            <span className="mon-dash" style={{ color: "#abb5d6" }}>
              <b>--</b> {r.unit}
              <TrendMark kind="dot" color="#d5daea" size={7} />
            </span>
          </div>
        </section>
      ))}
      <h2 className="mon-h2 mon-about-title mon-about-sleep">About {m.label}</h2>
      <p className="mon-about">{m.about}</p>
    </>
  );
}

const BP_FACTORS = [
  { t: "Sodium Intake", d: "High salt consumption causes water retention, increasing blood volume and arterial pressure." },
  { t: "Stress & Sleep", d: "Chronic stress and poor sleep both elevate cortisol, which raises blood pressure over time." },
  { t: "Physical Activity", d: "Regular aerobic exercise strengthens the heart, allowing it to pump blood with less effort." },
];
const CADENCE: Record<Period, string> = { D: "Daily", W: "Weekly", M: "Monthly", "6M": "6 Months", Y: "Yearly" }; // TODO(fidelity): only "Daily" captured

/** Blood Pressure layout — capture: monitor_blood_pressure/top … scroll_3. */
export function BpBody({ m, v, period, today }: { m: MetricDef; v: PeriodValues; period: Period; today: Date }) {
  const axis = axisFor(period, today, v.series, { ticks: [0, 45, 90, 135, 180], max: 180 });
  axis.bandsH = 181.5; // capture: monitor_blood_pressure/top — bands stop short of the x axis
  const c = CADENCE[period];
  return (
    <>
      <span className="mon-eyebrow">{period === "D" ? m.dayLabel : "AVERAGE"}</span>
      <div className="mon-headline">
        <b>-- / --</b>
      </div>
      <p className="mon-desc">{m.description}</p>
      <MonitorChart axis={axis} series={v.series} color={m.color} kind="line" />

      <h2 className="mon-h3 mon-bp-avg">Blood Pressure · {c} · Average</h2>
      <span className="mon-bp-val" style={{ color: m.color }}>
        <b>--</b> mmHg
      </span>
      <div className="mon-note">
        <h3>Daily Changes Are Normal</h3>
        <p>Blood pressure shifts throughout the day due to posture, hydration, meals, and stress. Brief changes between readings are expected and normal.</p>
      </div>
      <h2 className="mon-h3 mon-bp-range">Blood Pressure · {c} · Range</h2>
      <span className="mon-bp-val mon-bp-rangeval" style={{ color: m.color }}>
        <b>-- - -- / -- - --</b> mmHg
      </span>
      <div className="mon-bp-grid">
        {["Highest Systolic", "Highest Diastolic", "Lowest Systolic", "Lowest Diastolic"].map((t) => (
          <div className="mon-bp-tile" key={t}>
            <span>{t}</span>
            <span className="mon-bp-tv">
              <b>--</b> mmHg
              <TrendMark kind="dot" color="#a7a7a7" size={10} />
            </span>
          </div>
        ))}
      </div>
      <h2 className="mon-h2 mon-factors-title">Influencing Factors</h2>
      <div className="mon-factors">
        {BP_FACTORS.map((f) => (
          <div className="mon-factor" key={f.t}>
            <h3>{f.t}</h3>
            <p>{f.d}</p>
          </div>
        ))}
      </div>
      <h2 className="mon-h2 mon-about-title mon-about-bp">About {m.label}</h2>
      <p className="mon-about">{m.about}</p>
    </>
  );
}
