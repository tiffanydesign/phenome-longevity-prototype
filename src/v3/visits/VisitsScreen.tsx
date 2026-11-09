import { useState } from "react";
import { metric, STATUS_LABEL, type Metric } from "../data/metrics";
import { trim, visitDate, VISITS } from "../study/data";
import { Glyph, glyphOf } from "../ui/glyphs";
import { Chevron } from "../ui/icons";
import { BackBar, useGo, V2Screen } from "../ui/shell";
import "./visits.css";

/** Everything the clinic measured, by system. Device and diary readings live on Home, not here. */
const GROUPS: { title: string; ids: string[] }[] = [
  { title: "Vitals", ids: ["bp", "pulse", "spo2", "resp"] },
  { title: "Body", ids: ["weight", "bmi", "bodyfat", "visceral", "bone", "skin"] },
  { title: "Blood", ids: ["glucose", "hba1c", "tc", "tg", "crp", "tsh", "egfr"] },
  { title: "Gut", ids: ["diversity"] },
];

/** "4 Nov 2025" as "Nov ’25", short enough for four to sit in one row. */
const short = (v: number) => {
  const [, mon, yr] = visitDate(v).split(" ");
  return `${mon} ’${yr.slice(2)}`;
};

/** The reading at a visit, in the row's own decimals; blood pressure compares by its systolic number. */
function at(m: Metric, i: number): number | null {
  const v = m.scans?.[i];
  return v === undefined || Number.isNaN(v) ? null : v;
}

function Spark({ values, a, b }: { values: (number | null)[]; a: number; b: number }) {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length < 2) return <span className="vs-spark" />;
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  const x = (i: number) => 4 + (i * 56) / Math.max(1, values.length - 1);
  const y = (v: number) => (hi === lo ? 12 : 20 - ((v - lo) / (hi - lo)) * 16);
  const pts = values.map((v, i) => (v === null ? null : `${x(i)},${y(v)}`)).filter(Boolean);
  return (
    <svg className="vs-spark" width="64" height="24" viewBox="0 0 64 24" aria-hidden>
      <polyline points={pts.join(" ")} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" opacity="0.35" />
      {[a, b].map((i, k) => {
        const v = values[i];
        return v === null ? null : <circle key={k} cx={x(i)} cy={y(v)} r={k ? 3.2 : 2.6} fill={k ? "currentColor" : "var(--v-card)"} stroke="currentColor" strokeWidth="1.6" />;
      })}
    </svg>
  );
}

function Row({ m, a, b, latest }: { m: Metric; a: number; b: number; latest: boolean }) {
  const go = useGo();
  const d = m.decimals ?? (m.id === "bp" || m.id === "pulse" || m.id === "skin" ? 0 : 1);
  const va = at(m, a);
  const vb = at(m, b);
  const change = va !== null && vb !== null ? vb - va : null;
  const flat = change === null || Number(change.toFixed(d)) === 0;
  const flagged = latest && m.status !== "normal";
  return (
    <button className="vs-row" data-field={m.field} onClick={(e) => go(`/v3/metric/${m.id}`, { from: e.currentTarget })}>
      <span className="vs-name">
        <span className="vs-mark">
          <Glyph name={glyphOf(m.id)} size={15} />
        </span>
        <span>
          {m.id === "bp" ? "Blood pressure, systolic" : m.label}
          {flagged && <em className="vs-flag" data-status={m.status}>{STATUS_LABEL[m.status]}</em>}
        </span>
      </span>
      <Spark values={(m.scans ?? []).map((_, i) => at(m, i))} a={a} b={b} />
      <span className="vs-vals">
        <span className="vs-now">
          {vb === null ? "–" : trim(vb, d)}
          <small>{m.unit}</small>
        </span>
        <span className="vs-change">
          {change === null ? "No reading" : flat ? `Same as ${short(VISITS[a])}` : `${change > 0 ? "+" : "−"}${trim(Math.abs(change), d).replace("−", "")} from ${va === null ? "–" : trim(va, d)}`}
        </span>
      </span>
    </button>
  );
}

/**
 * Every clinic reading in one place, read across visits: pick the two visits to
 * set side by side, and each row gives the newer number, the change from the
 * older one and the line through every visit.
 */
export function VisitsScreen() {
  const go = useGo();
  const last = VISITS.length - 1;
  const [a, setA] = useState(Math.max(0, last - 1));
  const [b, setB] = useState(last);
  const one = VISITS.length < 2;

  return (
    <V2Screen nav={false}>
      <div className="vs scroll">
        <BackBar title="Clinic visits" />
        <p className="vs-lead">
          {VISITS.length} {VISITS.length === 1 ? "visit" : "visits"}, the latest on {visitDate(VISITS[last])}.
        </p>

        {!one && (
          <section className="vs-pick" aria-label="Visits to compare">
            <div>
              <span>Compare</span>
              <div className="vs-seg" role="radiogroup">
                {VISITS.map((v, i) => (
                  <button key={v} role="radio" aria-checked={i === a} disabled={i >= b} onClick={() => setA(i)}>
                    {short(v)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span>With</span>
              <div className="vs-seg" role="radiogroup">
                {VISITS.map((v, i) => (
                  <button key={v} role="radio" aria-checked={i === b} disabled={i <= a} onClick={() => setB(i)}>
                    {short(v)}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {GROUPS.map((g) => {
          const rows = g.ids.map((id) => metric(id)).filter((m) => m.scans?.length);
          if (!rows.length) return null;
          return (
            <section key={g.title} className="vs-group">
              <h2>{g.title}</h2>
              <div className="vs-card">
                {rows.map((m) => (
                  <Row key={m.id} m={m} a={a} b={b} latest={b === last} />
                ))}
              </div>
            </section>
          );
        })}

        <section className="vs-group">
          <h2>More from your visits</h2>
          <div className="vs-card">
            <button className="vs-link" onClick={() => go("/v3/twin")}>
              <span>Your twin</span>
              <Chevron size={14} />
            </button>
            <button className="vs-link" onClick={() => go("/v3/study/apose")}>
              <span>Full review, study by study</span>
              <Chevron size={14} />
            </button>
            <button className="vs-link" onClick={() => go("/v3/study/natural")}>
              <span>Every laboratory marker</span>
              <Chevron size={14} />
            </button>
          </div>
        </section>
      </div>
    </V2Screen>
  );
}
