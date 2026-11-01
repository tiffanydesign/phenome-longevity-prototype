import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { metric, metricsFor, rangeLabels, seriesFor, SOURCE_LABEL, STATUS_LABEL, type Metric, type Range } from "../data/metrics";
import { LENS_ORDER, LENSES, ORGANS } from "../data/organs";
import { CohortCurve, TrendChart } from "../ui/charts";
import { DotArt } from "../ui/DotArt";
import { Chevron } from "../ui/icons";
import { Num } from "../ui/Num";
import { BackBar, useGo, V2Screen } from "../ui/shell";
import "./metric.css";

const RANGES: { id: Range; label: string }[] = [
  { id: "D", label: "Day" },
  { id: "W", label: "Week" },
  { id: "M", label: "Month" },
];

/** The lens an organ opens under: the one matching where this number came from, if it holds the organ. */
function lensFor(m: Metric) {
  const want = m.source === "omics" ? "omics" : m.source === "clinic" && m.tab === "body" ? "body" : "vitals";
  return LENSES[want].organs.includes(m.organ) ? want : LENS_ORDER.find((l) => LENSES[l].organs.includes(m.organ)) ?? "vitals";
}

export function MetricScreen() {
  const { id = "capacity" } = useParams();
  const go = useGo();
  const m = metric(id);
  const organ = ORGANS[m.organ];
  const [range, setRange] = useState<Range>("W");

  const values = useMemo(() => (m.chart === "scan" ? [] : seriesFor(m, range)), [m, range]);
  const labels = useMemo(() => rangeLabels(range, values.length), [range, values.length]);
  const decimals = m.decimals ?? 0;
  const fmt = (v: number) => v.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const stats = values.length ? [{ k: "Average", v: values.reduce((a, b) => a + b, 0) / values.length }, { k: "Lowest", v: Math.min(...values) }, { k: "Highest", v: Math.max(...values) }] : [];
  const flagged = metricsFor(m.organ).find((r) => r.status === "monitor");
  const chartUnit = m.unit.startsWith("/") ? m.unit.match(/[a-z]+$/i)?.[0] ?? "" : m.unit;
  const related = metricsFor(m.organ).filter((r) => r.id !== m.id).slice(0, 3);

  return (
    <V2Screen nav={false} tone="light">
      <div className="mx scroll">
        <header className="mx-head" data-field={m.field} style={{ viewTransitionName: "v2-hero" }}>
          <BackBar tone="light" title={m.label} />
          <div className="mx-art">
            <DotArt organ={organ.map} size={190} />
          </div>
          <div className="mx-value">
            <b>
              <Num v={m.value} />
            </b>{" "}
            <span>{m.unit}</span>
          </div>
          <p className="mx-delta">
            <em data-status={m.status}>{STATUS_LABEL[m.status]}</em>
            {m.delta}
          </p>
          <p className="mx-source">
            {SOURCE_LABEL[m.source]}, {m.when}
          </p>
        </header>

        <div className="mx-body" data-field={m.field}>
          {m.chart === "scan" ? (
            <section className="mx-panel">
              <h2>Against 10,000 members your age</h2>
              <CohortCurve percentile={m.cohort ?? 50} first={m.scans?.[0] ?? m.base} second={m.scans?.[1] ?? m.base} unit={m.unit} />
              <p className="mx-foot">
                Scan 1, Feb 2024 to scan 2, 14 Jul 2026. You sit at the {m.cohort}th percentile.
              </p>
            </section>
          ) : (
            <section className="mx-panel">
              <div className="mx-seg" role="tablist" style={{ "--i": RANGES.findIndex((r) => r.id === range) } as React.CSSProperties}>
                <i aria-hidden />
                {RANGES.map((r) => (
                  <button key={r.id} role="tab" aria-selected={r.id === range} onClick={() => setRange(r.id)}>
                    {r.label}
                  </button>
                ))}
              </div>
              <TrendChart values={values} labels={labels} kind={m.chart} band={m.band} unit={chartUnit} decimals={decimals} />
              <dl className="mx-stats">
                {stats.map((s) => (
                  <div key={s.k}>
                    <dt>{s.k}</dt>
                    <dd>
                      <Num v={fmt(s.v)} />
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <p className="mx-note">{m.note}</p>

          <button className="mx-twin" onClick={() => go(`/v2/twin?lens=${lensFor(m)}&organ=${organ.id}`)}>
            <span className="mx-twin-art">
              <DotArt organ={organ.map} size={84} color="#ffffff" crop={organ.map === "body" ? 1.3 : 1.1} />
            </span>
            <span>
              <b>See it on your twin</b>
              <small>
                {organ.name}
                {organ.age ? `, reads ${organ.age}` : ""}. {flagged ? `${flagged.label} on Monitor` : STATUS_LABEL[organ.status]}.
              </small>
            </span>
            <Chevron />
          </button>

          {related.length > 0 && (
            <section className="mx-related">
              <h2>Also from your {organ.name.toLowerCase()}</h2>
              {related.map((r) => (
                <button key={r.id} onClick={() => go(`/v2/metric/${r.id}`, { replace: true })}>
                  <span>{r.label}</span>
                  <span className="mx-related-v">
                    <b>
                      <Num v={r.value} />
                    </b>{" "}
                    {r.unit}
                  </span>
                  <Chevron size={16} />
                </button>
              ))}
            </section>
          )}
        </div>
      </div>
    </V2Screen>
  );
}
