import { useMemo, useState, type ReactNode } from "react";
import { Gauge, HeartRange, HourBars, Hypnogram, MacroBar, WorkoutRings } from "../home/glance";
import "../home/glance.css";
import { CapacityDetail } from "./CapacityDetail";
import { GoalSheet, goalOf, GOALS, useGoals } from "./goals";
import { useParams } from "react-router-dom";
import { metric as baseMetric, metricsFor, periodTitle, rangeLabels, seriesFor, SOURCE_LABEL, STATUS_LABEL, visitLabels, type Range } from "../data/metrics";
import { ICON, lensOf, readingOf, REGIONS } from "../twin/regions";
import { TrendChart } from "../ui/charts";
import { Glyph, glyphOf, type GlyphName } from "../ui/glyphs";
import { OrganIcon } from "../ui/OrganIcon";
import { Chevron } from "../ui/icons";
import { Num } from "../ui/Num";
import { BackBar, BlurLayers, useGo, V2Screen } from "../ui/shell";
import "./metric.css";

const RANGES: { id: Range; label: string }[] = [
  { id: "D", label: "D" },
  { id: "W", label: "W" },
  { id: "M", label: "M" },
  { id: "6M", label: "6M" },
  { id: "Y", label: "Y" },
];
const RANGE_NAME: Record<Range, string> = { D: "Day", W: "Week", M: "Month", "6M": "6 months", Y: "Year" };
/** how far back the chart pages: a year of days, a year of weeks, two years of months */
const PAGES_BACK: Record<Range, number> = { D: 30, W: 52, M: 12, "6M": 4, Y: 2 };

/** Where a daily reading is logged by hand: the diary flows the original app already has. */
const ACTIONS: Record<string, { label: string; to: string; primary?: boolean }[]> = {
  workouts: [
    { label: "Log a workout", to: "/journal/activity/select", primary: true },
    { label: "Workout history", to: "/journal/activity" },
  ],
  steps: [
    { label: "Log an activity", to: "/journal/activity/select", primary: true },
    { label: "Activity history", to: "/journal/activity" },
  ],
  diet: [
    { label: "Log a meal", to: "/journal/diet", primary: true },
    { label: "Snap a meal", to: "/journal/diet/camera" },
  ],
};

/**
 * The Home card each daily reading opens from: the same name, hue, mark and
 * chart, so the page reads as that card grown large. The chart sits first, under
 * the number, before any history.
 */
const FROM_CARD: Record<string, { title: string; field?: string; glyph?: GlyphName; span: string; glance: (m: ReturnType<typeof baseMetric>) => ReactNode }> = {
  steps: { title: "Activity", span: "Today", glance: (m) => <HourBars m={m} ago={0} /> },
  sleep: { title: "Sleep", span: "Last night", glance: () => <Hypnogram ago={0} /> },
  capacity: { title: "Capacity", span: "Today", glance: (m) => <Gauge m={m} /> },
  workouts: { title: "Workouts", field: "rose", glyph: "dumbbell", span: "This week", glance: (m) => <WorkoutRings m={m} /> },
  rhr: { title: "Heart", span: "Today", glance: (m) => <HeartRange m={m} ago={0} /> },
  diet: { title: "Food", span: "Today", glance: (m) => <MacroBar m={m} /> },
};

/** Clinic and omics readings belong to the twin; everything else is a daily reading from a device or the diary. */
const isDaily = (m: { source: string }) => m.source !== "clinic" && m.source !== "omics";

export function MetricScreen() {
  const { id = "capacity" } = useParams();
  const go = useGo();
  const goals = useGoals();
  // a goal the member set replaces the default one in the unit and the comparison
  const m = goalOf(baseMetric(id), goals.values);
  const organ = REGIONS[m.organ];
  const reading = readingOf(m.organ);
  const [range, setRangeRaw] = useState<Range>("W");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState(false);
  const setRange = (r: Range) => {
    setRangeRaw(r);
    setPage(0);
  };

  const values = useMemo(() => (m.chart === "scan" ? [] : seriesFor(m, range, page)), [m, range, page]);
  const labels = useMemo(() => rangeLabels(range, values.length, page), [range, values.length, page]);
  const visits = useMemo(() => visitLabels(), []);
  const decimals = m.decimals ?? 0;
  const fmt = (v: number) => v.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const stats = values.length ? [{ k: "Average", v: values.reduce((a, b) => a + b, 0) / values.length }, { k: "Lowest", v: Math.min(...values) }, { k: "Highest", v: Math.max(...values) }] : [];
  const chartUnit = m.unit.startsWith("/") ? m.unit.match(/[a-z]+$/i)?.[0] ?? "" : m.unit;
  // a daily page relates only to daily readings, a clinic page only to clinic ones: the two never share a page
  const related = metricsFor(m.organ)
    .filter((r) => r.id !== m.id && isDaily(r) === isDaily(m))
    .slice(0, 3);
  const actions = ACTIONS[m.id] ?? [];

  const statusWord = STATUS_LABEL[m.status];
  const card = FROM_CARD[m.id];

  return (
    <V2Screen nav={false}>
      <div className="v2-veil mx-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="mx scroll" data-field={card?.field ?? m.field}>
        {/* a round glass way back, and the goal beside it when the reading has one */}
        <header className="mx-bar">
          <BackBar />
          {GOALS[m.id] && (
            <button className="mx-round" aria-label="Edit goal" onClick={() => setEditing(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
                <path d="m13.5 6.5 4 4" />
              </svg>
            </button>
          )}
        </header>

        {/* the reading named in its own hue, the number large, then one plain sentence of what it means */}
        <section className="mx-hero" style={{ viewTransitionName: "v2-hero" }}>
          <p className="mx-eyebrow">
            <Glyph name={card?.glyph ?? glyphOf(m.id)} size={18} />
            {card?.title ?? m.label}
          </p>
          <div className="mx-value">
            <b>
              <Num v={m.value} />
            </b>
            <span>{m.unit}</span>
          </div>
          <p className="mx-sub">
            <em data-status={m.status}>{statusWord}</em>
            {m.delta && <span> · {m.delta}</span>}
          </p>
          <p className="mx-src">
            {SOURCE_LABEL[m.source]}, {m.when}
          </p>
        </section>

        {/* the Home card's own chart, grown large: the thread from the card to this page */}
        {card && (
          <section className="mx-today" aria-label={`${card.title}, ${card.span.toLowerCase()}`}>
            <h2>{card.span}</h2>
            {card.glance(m)}
          </section>
        )}

        {actions.length > 0 && (
          <div className="mx-actions">
            {actions.map((a) => (
              <button key={a.to} data-primary={a.primary ? "" : undefined} onClick={() => go(a.to)}>
                {a.label}
              </button>
            ))}
          </div>
        )}

        {/* the chart stands on the page itself, no panel round it */}
        <section className="mx-stage" aria-label={m.chart === "scan" ? "Across your visits" : "Trend"}>
          {m.chart === "scan" ? (
            <>
              <h2 className="mx-h">Across your visits</h2>
              <TrendChart values={m.scans ?? []} labels={visits} kind="line" band={m.band} unit={chartUnit} decimals={decimals} />
              <p className="mx-foot">
                {visits.length} clinic visits, {visits[0]} to {visits[visits.length - 1]}.{m.band ? ` The band is the reference range, ${m.band[0]}–${m.band[1]}.` : ""}
              </p>
            </>
          ) : (
            <>
              <h2 className="mx-h mx-h-history">History</h2>
              <div className="mx-seg" role="tablist" style={{ "--i": RANGES.findIndex((r) => r.id === range) } as React.CSSProperties}>
                <i aria-hidden />
                {RANGES.map((r) => (
                  <button key={r.id} role="tab" aria-selected={r.id === range} aria-label={RANGE_NAME[r.id]} onClick={() => setRange(r.id)}>
                    {r.label}
                  </button>
                ))}
              </div>
              {/* the period on show, stepped one at a time: back into the past, forward as far as today */}
              <div className="mx-period">
                <button aria-label={`Previous ${RANGE_NAME[range].toLowerCase()}`} disabled={page >= PAGES_BACK[range]} onClick={() => setPage(page + 1)}>
                  <Chevron dir="left" size={16} />
                </button>
                <span aria-live="polite">{periodTitle(range, page)}</span>
                <button aria-label={`Next ${RANGE_NAME[range].toLowerCase()}`} disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <Chevron size={16} />
                </button>
              </div>
              <TrendChart values={values} labels={labels} kind={m.chart} band={m.band} unit={chartUnit} decimals={decimals} />
              {/* the period in three numbers, set as a quiet ruled list */}
              <dl className="mx-stats">
                {stats.map((s) => (
                  <div key={s.k}>
                    <dt>{s.k}</dt>
                    <dd>
                      <Num v={fmt(s.v)} /> <small>{chartUnit}</small>
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>

        {m.id === "capacity" && <CapacityDetail />}

        {/* what the number means, as a headline and a plain sentence */}
        <section className="mx-about">
          <h2 className="mx-h">About this reading</h2>
          <p>{m.note}</p>
        </section>

        {related.length > 0 && (
          <section className="mx-related">
            <h2 className="mx-h">Also from your {organ.name.toLowerCase()}</h2>
            <div className="mx-grid">
              {related.map((r) => (
                <button key={r.id} className="mx-read" data-field={r.field} onClick={() => go(`/v3/metric/${r.id}`, { replace: true })}>
                  <small>
                    {r.label}
                    <Chevron size={13} />
                  </small>
                  <b>
                    <Num v={r.value} /> <u>{r.unit}</u>
                  </b>
                  <span>{STATUS_LABEL[r.status]}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* the way back into the twin closes a clinic page only; a daily reading never points into the twin */}
        {!isDaily(m) && (
          <button className="mx-twin" onClick={() => go(`/v3/twin?lens=${lensOf(organ.id)}&organ=${organ.id}`)}>
            <OrganIcon organ={ICON[organ.id]} size={40} />
            <span>
              <b>See it on your twin</b>
              <small>
                {organ.name}
                {reading.status ? `. ${reading.status}.` : "."}
              </small>
            </span>
            <Chevron size={16} />
          </button>
        )}
      </div>
      {editing && GOALS[m.id] && <GoalSheet id={m.id} current={goals.get(m.id)} onSave={(v) => goals.set(m.id, v)} onClose={() => setEditing(false)} />}
    </V2Screen>
  );
}
