import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { metric, metricsFor, rangeLabels, seriesFor, SOURCE_LABEL, STATUS_LABEL, visitLabels, type Range } from "../data/metrics";
import { ICON, lensOf, readingOf, REGIONS } from "../twin/regions";
import { TrendChart } from "../ui/charts";
import { Art, METRIC_ART } from "../ui/Art";
import { OrganIcon } from "../ui/OrganIcon";
import { Chevron } from "../ui/icons";
import { Num } from "../ui/Num";
import { WalkArt } from "../ui/WalkArt";
import { BackBar, useGo, V2Screen } from "../ui/shell";
import "./metric.css";

const RANGES: { id: Range; label: string }[] = [
  { id: "D", label: "Day" },
  { id: "W", label: "Week" },
  { id: "M", label: "Month" },
];

export function MetricScreen() {
  const { id = "capacity" } = useParams();
  const go = useGo();
  const m = metric(id);
  const organ = REGIONS[m.organ];
  const reading = readingOf(m.organ);
  const [range, setRange] = useState<Range>("W");

  const values = useMemo(() => (m.chart === "scan" ? [] : seriesFor(m, range)), [m, range]);
  const labels = useMemo(() => rangeLabels(range, values.length), [range, values.length]);
  const visits = useMemo(() => visitLabels(), []);
  const decimals = m.decimals ?? 0;
  const fmt = (v: number) => v.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const stats = values.length ? [{ k: "Average", v: values.reduce((a, b) => a + b, 0) / values.length }, { k: "Lowest", v: Math.min(...values) }, { k: "Highest", v: Math.max(...values) }] : [];
  const chartUnit = m.unit.startsWith("/") ? m.unit.match(/[a-z]+$/i)?.[0] ?? "" : m.unit;
  const related = metricsFor(m.organ).filter((r) => r.id !== m.id).slice(0, 3);

  return (
    <V2Screen nav={false} tone={m.field === "sleep" ? "light" : "dark"}>
      <div className="v2-veil" data-at="status" data-field={m.field} aria-hidden />
      <div className="mx scroll">
        <header className="mx-head" data-field={m.field} style={{ viewTransitionName: "v2-hero" }}>
          <BackBar tone="light" title={m.label} />
          {m.id === "steps" ? (
            <div className="mx-art" data-art="walk">
              <WalkArt size={150} />
            </div>
          ) : (
            <div className="mx-art" data-art="glyph">
              <Art name={METRIC_ART[m.id] ?? "check"} />
            </div>
          )}
          <div className="mx-value">
            <b>
              <Num v={m.value} />
            </b>{" "}
            <span>{m.unit}</span>
          </div>
          {/* status, change and source on one line: what the number means, then where it came from */}
          <p className="mx-delta">
            <em data-status={m.status}>{STATUS_LABEL[m.status]}</em>
            <span>{m.delta}</span>
            <span className="mx-source">
              {SOURCE_LABEL[m.source]}, {m.when}
            </span>
          </p>
        </header>

        <div className="mx-body" data-field={m.field}>
          <header className="v2-sec mx-sec-first">
            <h3>{m.chart === "scan" ? "Across your visits" : "Trend"}</h3>
            {m.chart === "scan" && <span>{visits.length} visits</span>}
          </header>
          {m.chart === "scan" ? (
            <section className="mx-panel">
              <TrendChart values={m.scans ?? []} labels={visits} kind="line" band={m.band} unit={chartUnit} decimals={decimals} />
              <p className="mx-foot">
                {visits.length} clinic visits, {visits[0]} to {visits[visits.length - 1]}.{m.band ? ` The band is the reference range, ${m.band[0]}–${m.band[1]}.` : ""}
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

          <header className="v2-sec">
            <h3>About this reading</h3>
          </header>
          <p className="mx-note">{m.note}</p>

          {related.length > 0 && (
            <section className="mx-related">
              <header className="v2-sec">
                <h3>Also from your {organ.name.toLowerCase()}</h3>
              </header>
              {related.map((r) => (
                <button key={r.id} data-field={r.field} onClick={() => go(`/v2/metric/${r.id}`, { replace: true })}>
                  <i className="mx-related-dot" aria-hidden />
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

          {/* the way back into the twin closes the page, one quiet row rather than a block */}
          <button className="mx-twin" onClick={() => go(`/v2/twin?lens=${lensOf(organ.id)}&organ=${organ.id}`)}>
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
        </div>
      </div>
    </V2Screen>
  );
}
