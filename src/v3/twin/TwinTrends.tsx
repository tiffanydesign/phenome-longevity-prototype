import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HistoryChart } from "../ui/charts";
import { Chevron } from "../ui/icons";
import { Num } from "../ui/Num";
import { useGo } from "../ui/shell";
import { VISITS, visitDate } from "../study/data";
import { shortDate } from "./checkpoints";
import { LENS_LABEL, LENS_ORDER, readingOf, regionsOf, toneOf, type Lens, type Region } from "./regions";
import "../home/home.css";
import "./trends.css";

/** Why a study has no line to draw, in words a member can act on. */
const WHY_NOT: Record<string, string> = {
  genomics: "Read once. Your DNA does not change, so there is nothing to compare.",
  metabolomics: "Hundreds of molecules, no single score. Open it to compare them one by one.",
};

const signed = (n: number) => {
  const d = Math.abs(n) < 10 && !Number.isInteger(n) ? 1 : 0;
  const s = Math.abs(n).toFixed(d);
  return Number(s) === 0 ? "No change" : `${n > 0 ? "+" : "−"}${s}`;
};

/** The visits the URL asks to compare (?cmp=1-3-4), in time order; every visit when it asks for fewer than two. */
function pickedFrom(raw: string | null): number[] {
  const asked = (raw ?? "").split("-").map(Number).filter((v) => VISITS.includes(v));
  const set = [...new Set(asked)].sort((a, b) => a - b);
  return set.length >= 2 ? set : [...VISITS];
}

/** A study's lead reading at every visit, or nothing when it was not measured each time. */
function seriesOf(r: Region): number[] | null {
  const t = readingOf(r.id).trend;
  if (!t || t.length !== VISITS.length || t.some((n) => !Number.isFinite(n))) return null;
  return t;
}

/**
 * The head of Trends: the question, the span it answers over, and the visits
 * as capsules in time order. Any two or more; the last two stay put, and the
 * line under the title says why when one is tapped. One quiet shortcut flips
 * between every visit and the latest two.
 */
function VisitPicker({ picked, onChange }: { picked: number[]; onChange: (v: number[]) => void }) {
  const [nudge, setNudge] = useState<number | null>(null);
  const all = picked.length === VISITS.length;
  const lastTwo = VISITS.slice(-2);
  const toggle = (v: number) => {
    if (picked.includes(v)) {
      if (picked.length <= 2) {
        setNudge(v);
        window.setTimeout(() => setNudge(null), 1600);
        return;
      }
      onChange(picked.filter((p) => p !== v));
    } else onChange([...picked, v].sort((a, b) => a - b));
  };
  return (
    <>
      <header className="tt-head">
        <div className="tt-head-row">
          <h2>Compare visits</h2>
          <button className="tt-all" onClick={() => onChange(all ? lastTwo : [...VISITS])}>
            {all ? "Latest two" : "All visits"}
          </button>
        </div>
        <p aria-live="polite" data-nudge={nudge !== null ? "" : undefined}>
          {nudge !== null
            ? "Keep at least two visits to compare"
            : `${picked.length} visits · ${shortDate(visitDate(picked[0]))} to ${shortDate(visitDate(picked[picked.length - 1]))}`}
        </p>
      </header>
      <div className="tt-pick" role="group" aria-label="Visits to compare">
        {VISITS.map((v) => (
          <button key={v} className="tt-visit" aria-pressed={picked.includes(v)} data-nudge={nudge === v ? "" : undefined} onClick={() => toggle(v)}>
            <span className="tt-visit-t">
              <small>Visit {v}</small>
              <b>{shortDate(visitDate(v))}</b>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

/** One study across the picked visits: its line, then each visit's own value under it. */
function TrendCard({ r, s, picked }: { r: Region; s: number[]; picked: number[] }) {
  const go = useGo();
  const v = readingOf(r.id);
  const tone = toneOf(v);
  const at = picked.map((p) => VISITS.indexOf(p));
  const values = at.map((i) => s[i]);
  const labels = picked.map((p) => shortDate(visitDate(p)));
  const latest = picked[picked.length - 1];
  const last = readingOf(r.id, latest);
  return (
    <button className="tw-chart" data-field={r.field} onClick={(e) => go(`/v3/study/${r.id}`, { from: e.currentTarget })}>
      <span className="tw-chart-head">
        <span className="tw-chart-t">
          {r.name}
          {v.status && <small data-status={tone === "mon" || tone === "alert" ? "monitor" : "normal"}>{v.status}</small>}
        </span>
        <Chevron size={16} />
      </span>
      <span className="tw-chart-now">
        <b>
          <Num v={last.value} />
        </b>
        {last.unit && <u>{last.unit}</u>}
        <em>
          {signed(values[values.length - 1] - values[0])} since Visit {picked[0]}
        </em>
      </span>
      {v.label && <span className="tw-chart-l">{v.label}</span>}
      <HistoryChart values={values} labels={labels} />
      {/* the same visits as the chart, each with its own number, oldest first */}
      <span className="tt-cols" style={{ "--n": picked.length } as React.CSSProperties}>
        {picked.map((p) => (
          <span key={p} className="tt-col" data-latest={p === latest ? "" : undefined}>
            <small>Visit {p}</small>
            <b>{readingOf(r.id, p).value}</b>
          </span>
        ))}
      </span>
    </button>
  );
}

/**
 * Trends: the figure set aside, a body holds one moment and a chart holds many.
 * The member picks which visits to set side by side (any two or more, always
 * in time order); every study with one number per visit draws a line through
 * them, grouped by lens. Studies without one number say why, in plain words.
 */
export function TwinTrends() {
  const go = useGo();
  const [params, setParams] = useSearchParams();
  const picked = pickedFrom(params.get("cmp"));
  const setPicked = (v: number[]) => {
    const next = new URLSearchParams(params);
    if (v.length === VISITS.length) next.delete("cmp");
    else next.set("cmp", v.join("-"));
    setParams(next, { replace: true });
  };

  const rest: Region[] = [];
  const lenses = LENS_ORDER.map((l: Lens) => {
    const regions = regionsOf(l);
    const charted = regions.map((r) => ({ r, s: seriesOf(r) })).filter((x): x is { r: Region; s: number[] } => x.s !== null);
    rest.push(...regions.filter((r) => !charted.some((c) => c.r.id === r.id)));
    return { l, charted };
  });

  return (
    <section className="tw-trends tt" aria-label="Trends">
      <VisitPicker picked={picked} onChange={setPicked} />

      {lenses.map(
        ({ l, charted }) =>
          charted.length > 0 && (
            <div key={l} className="tw-trends-lens">
              <h3 className="tw-trends-title">{LENS_LABEL[l]}</h3>
              {charted.map(({ r, s }) => (
                <TrendCard key={r.id} r={r} s={s} picked={picked} />
              ))}
            </div>
          ),
      )}

      {rest.length > 0 && (
        <div className="tw-trends-lens">
          <h3 className="tw-trends-title">Not on a chart</h3>
          <p className="tt-why">These results are not one number per visit, so there is no line to draw. Their full results are one tap away.</p>
          <ul className="tw-list tw-trends-rest">
            {rest.map((r) => {
              const one = readingOf(r.id).single;
              return (
                <li key={r.id}>
                  <button onClick={(e) => go(`/v3/study/${r.id}`, { from: e.currentTarget })}>
                    <span className="tw-name">
                      {r.name}
                      <span className="tw-why">{WHY_NOT[r.id] ?? (one ? `Measured once, on ${one}.` : "Several readings, no single score.")}</span>
                    </span>
                    <Chevron size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
