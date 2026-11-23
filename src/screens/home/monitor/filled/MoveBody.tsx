import minis from "@/data/real/minis.json";
import type { MetricDef, Period } from "@/data/home-monitor";
import type { MovePage } from "@/data/real";
import { moveSeries } from "@/data/real/series";
import { FilledChart } from "./FilledChart";
import { About, Analysis, Arrow, DeltaPill, Dot, parseShown } from "./parts";

type Bars = [number, number, number, string][];
type Lines = { most: number[][]; least: number[][] };
const MINIS = minis as unknown as Record<string, Record<string, { month?: Bars; week?: Bars; day?: Lines }>>;

const GREEN = "var(--c-success)";
const RED = "var(--c-danger)";

/**
 * Steps / Calories / Step Distance with data — capture data2/mon/{step_count,calories,step_distance}:
 * D: hourly bars, Today vs Yesterday, analysis · W: daily bars, most / least active day cards,
 * week totals, analysis · M / 6M / Y: line, period averages, most vs least active month / week /
 * day cards (their small charts traced from the screenshots into minis.json).
 */
export function MoveBody({ m, p, period }: { m: MetricDef; p: MovePage; period: Period }) {
  const s = moveSeries(m.id, period);
  const [cur, prev] = p.compare.values;
  const up = parseShown(cur) > parseShown(prev);
  const mini = MINIS[m.id]?.[period] ?? {};
  const unit = p.unit ?? (m.unit === "kcal" || m.unit === "km" ? m.unit : "");
  return (
    <>
      <span className="mon-eyebrow">{p.eyebrow}</span>
      <div className="fv-big fv-big-one">
        {p.value}
        {p.goal && <span className="fv-goal">{p.goal}</span>}
        {unit && <small style={{ color: m.color }}>{unit}</small>}
        {p.goal && <EditIcon />}
      </div>
      {p.delta && <DeltaPill text={p.delta} up={up} />}
      <p className="mon-desc">{p.desc}</p>

      <FilledChart s={s} kind={period === "D" || period === "W" ? "bar" : "line"} color={m.color} />

      {p.mostDay && p.leastDay && (
        <div className="fv-days">
          <DayCard title="Most Active Day" v={p.mostDay} up unit={unit} />
          <DayCard title="Least Active Day" v={p.leastDay} up={false} unit={unit} />
        </div>
      )}

      <h2 className="mon-h2 fv-cmp-title">{p.compare.title}</h2>
      <div className="mon-pair fv-pair">
        <span className="mon-lbl">{p.compare.labels[0]}</span>
        <span className="mon-lbl">{p.compare.labels[1]}</span>
        <span className="fv-cmp" style={{ color: up ? GREEN : RED }}>
          {cur}
          {period === "D" || period === "W" ? <Arrow up={up} /> : null}
        </span>
        <span className="fv-cmp fv-cmp-prev">
          {prev}
          <Dot />
        </span>
      </div>
      {period === "D" && <TodayCurve color={m.color} />}

      {p.analysis && <Analysis text={p.analysis} tone={up ? "good" : "bad"} />}

      {p.month && <PeriodCard title="Most vs Least Active Month" v={p.month} bars={mini.month} axis={["Jun", "Nov"]} />}
      {p.week && <PeriodCard title="Most vs Least Active Week" v={p.week} bars={mini.week} />}
      {p.day && <DayCompare v={p.day} lines={mini.day} />}

      {p.about && <About title={p.about.title} text={p.about.text} />}
    </>
  );
}

function DayCard({ title, v, up, unit }: { title: string; v: [string, string]; up: boolean; unit: string }) {
  return (
    <div className="fv-card fv-daycard">
      <span className="fv-card-lbl">{title}</span>
      <span className="fv-cardval" style={{ color: up ? GREEN : RED }}>
        {v[0]}
        {unit && <small>{unit}</small>}
        <Arrow up={up} />
      </span>
      <span className="fv-card-date">{v[1]}</span>
    </div>
  );
}

/** Two stacked "AVERAGE value / range" rows left, traced bars right. */
function PeriodCard({ title, v, bars, axis }: { title: string; v: { most: [string, string]; least: [string, string] }; bars?: Bars; axis?: string[] }) {
  return (
    <div className="fv-card fv-pcard">
      <h3>{title}</h3>
      <div className="fv-pcard-body">
        <div className="fv-pcard-vals">
          {[
            [v.most, true] as const,
            [v.least, false] as const,
          ].map(([[val, range], up]) => (
            <div key={range}>
              <span className="fv-avg">AVERAGE</span>
              <span className="fv-cardval fv-cardval-s" style={{ color: up ? GREEN : RED }}>
                {val}
                <Arrow up={up} />
              </span>
              <span className="fv-card-date">{range}</span>
            </div>
          ))}
        </div>
        <svg className="fv-pcard-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {(bars ?? []).map(([x, t, b, c], k) => (
            <rect
              key={k}
              x={x * 100 - 1.1}
              y={t * 100}
              width={2.2}
              height={Math.max(0.8, (b - t) * 100)}
              rx={1.1}
              fill={c === "green" ? "#65c466" : c === "red" ? "#eb4e3d" : "#b3b3b3"}
            />
          ))}
        </svg>
        {axis && (
          <div className="fv-pcard-axis">
            {axis.map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DayCompare({ v, lines }: { v: { dates: [string, string]; values: [string, string] }; lines?: Lines }) {
  const path = (pts: number[][]) => pts.map(([x, y]) => `${(x * 100).toFixed(2)},${(y * 100).toFixed(2)}`).join(" ");
  return (
    <div className="fv-card fv-dcard">
      <h3>Most vs Least Active Day</h3>
      <div className="mon-pair fv-dcard-pair">
        <span className="fv-card-date">{v.dates[0]}</span>
        <span className="fv-card-date">{v.dates[1]}</span>
        <span className="fv-cardval" style={{ color: GREEN }}>
          {v.values[0]}
          <Arrow up />
        </span>
        <span className="fv-cardval" style={{ color: RED }}>
          {v.values[1]}
          <Arrow up={false} />
        </span>
      </div>
      <svg className="fv-dcard-chart" viewBox="0 38 100 62" preserveAspectRatio="none" aria-hidden>
        <line x1="0" x2="100" y1="97" y2="97" stroke="#d9d9d9" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        {lines && <polyline points={path(lines.least)} fill="none" stroke="#eb4e3d" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />}
        {lines && <polyline points={path(lines.most)} fill="none" stroke="#65c466" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />}
      </svg>
      <div className="fv-dcard-axis">
        {["00:00", "06:00", "12:00", "18:00"].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/**
 * Grey "today vs yesterday" card under the comparison on D: today's running total (metric
 * colour) over yesterday's (grey). Today's curve is the 17 Nov hourly bars summed; the
 * capture has no hourly data for the 16th, so yesterday is drawn as today's shape scaled to
 * its total. TODO(fidelity): yesterday's real hourly shape.
 */
function TodayCurve({ color }: { color: string }) {
  return (
    <div className="mon-daycard fv-curve">
      <svg width="362" height="180" viewBox="0 0 362 180" aria-hidden>
        <line x1={12} x2={350} y1={153} y2={153} stroke="#c9c9c9" strokeWidth={0.8} strokeDasharray="2 3" />
        <polyline points={curve(1)} fill="none" stroke={color} strokeWidth={1.6} />
        <polyline points={curve(0.843)} fill="none" stroke="#8c8c8c" strokeWidth={1.2} />
        {["0h", "6h", "12h", "18h"].map((t, k) => (
          <text key={t} x={19 + k * 84.6} y={170} className="mon-chart-x">
            {t}
          </text>
        ))}
      </svg>
    </div>
  );
}

// 17 Nov hourly steps → cumulative share (0..1) per hour (capture data2/mon/step_count/D_0)
const STEPS_17 = [0, 0, 0, 39, 0, 0, 18, 875, 1489, 88, 286, 122, 1512, 697, 314, 208, 259, 1210, 1466, 1030, 305, 610, 205, 62];
function curve(scale: number): string {
  const total = STEPS_17.reduce((a, b) => a + b, 0);
  let run = 0;
  return STEPS_17.map((v, h) => {
    run += v;
    const x = 18.2 + (327.2 * (h + 1)) / 24;
    const y = 153 - (run / total) * 120 * scale;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function EditIcon() {
  return (
    <svg className="mon-edit" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-label="Edit goal">
      <path d="M7.2 2.6H3.4c-.9 0-1.6.7-1.6 1.6v8.4c0 .9.7 1.6 1.6 1.6h8.4c.9 0 1.6-.7 1.6-1.6V8.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12.3 1.6a1.4 1.4 0 012 2L8.1 9.8 5.6 10.4l.6-2.5 6.1-6.3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}
