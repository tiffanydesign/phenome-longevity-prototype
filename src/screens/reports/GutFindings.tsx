import { useParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { NavHeader } from "@/components/NavHeader";
import { useDataset } from "@/lib/data";
import { gutData, type GutFinding, type GutReport } from "@/data/reportsGut";
import { RIcon } from "./parts/RIcon";
import "./GutFindings.css";

/**
 * Gut findings — /insights/gut/findings/:section.
 * Captures: gut_findings/top, scroll_1…3 (Diversity Analysis).
 * TODO(fidelity): only the diversity section was captured; other sections fall back to their
 * hub rows rendered as finding cards without range bars.
 */
export function GutFindingsScreen() {
  const d = useDataset(gutData);
  const { section = "diversity" } = useParams();
  const page = d.findings[section] ?? fallback(d, section);
  return (
    <Screen header={<NavHeader variant="arrow" align="left" title={<span className="gf-navtitle">{page.title}</span>} />}>
      <div className="gf">
        <section className="gf-intro">
          <div className="gf-intro-head">
            <span className="gf-intro-icon">
              <RIcon name="leaf" />
            </span>
            <span>
              <b>{page.heading}</b>
              <span>{page.headingSub}</span>
            </span>
          </div>
          <p>{page.body}</p>
        </section>
        {page.items.map((f) => (
          <FindingCard key={f.title} f={f} />
        ))}
      </div>
    </Screen>
  );
}

function fallback(d: GutReport, id: string): GutReport["findings"][string] {
  const s = d.sections.find((x) => x.id === id) ?? d.sections[0];
  return {
    title: s.title,
    heading: s.title,
    headingSub: s.sub,
    body: s.about,
    items: s.rows.map((r) => ({ icon: r.icon, title: r.title, sub: r.sub, status: r.tag ?? "", value: r.value, num: NaN, min: NaN, max: NaN, analysis: "", recommendation: "" })),
  };
}

function FindingCard({ f }: { f: GutFinding }) {
  return (
    <section className="gf-card">
      <div className="gf-head">
        <span className="gf-icon">
          <RIcon name={f.icon} />
        </span>
        <span className="gf-head-text">
          <b>{f.title}</b>
          <span>{f.sub}</span>
        </span>
        {f.status && <i className="gf-status">{f.status}</i>}
      </div>
      <p className="gf-value">
        Your Value: <b>{f.value}</b>
      </p>
      {Number.isFinite(f.num) && <RangeBar f={f} />}
      {f.analysis && (
        <>
          <h4 className="gf-h">Analysis</h4>
          <p className="gf-text">{f.analysis}</p>
        </>
      )}
      {f.recommendation && (
        <div className="gf-rec">
          <h5>
            <RIcon name="bulb" />
            Recommendation
          </h5>
          <p>{f.recommendation}</p>
        </div>
      )}
    </section>
  );
}

/** "1.0" / "7.0" keep one decimal, counts ("300") don't — as captured. */
const fmt = (v: number) => (Number.isInteger(v) && v < 10 ? v.toFixed(1) : String(v));

/**
 * Reference-range bar: grey track, navy range drawn over 10–90 % of it.
 * Marker = value / max along the track, pinned to the range start/end when out of range
 * (matches the captured 1.07 → 62 %, 113 < 115 → range start).
 * TODO(fidelity): the app's exact marker formula is unknown.
 */
function RangeBar({ f }: { f: GutFinding }) {
  const pos = f.num < f.min ? 0.1 : f.num > f.max ? 0.9 : f.num / f.max;
  return (
    <div className="gf-bar">
      <span className="gf-bar-range">
        <i>{fmt(f.min)}</i>
        <i>{fmt(f.max)}</i>
      </span>
      <span className="gf-bar-marker" style={{ left: `${pos * 100}%` }}>
        {f.num}
      </span>
    </div>
  );
}
