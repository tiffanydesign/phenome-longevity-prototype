import { HistoryChart } from "../ui/charts";
import { Chevron } from "../ui/icons";
import { Num } from "../ui/Num";
import { useGo } from "../ui/shell";
import { VISITS } from "../study/data";
import { CHECKPOINTS, shortDate } from "./checkpoints";
import { LENS_LABEL, readingOf, regionsOf, toneOf, type Lens, type Region } from "./regions";
import "../home/home.css";

const FIRST = CHECKPOINTS[CHECKPOINTS.length - 1];
const LAST = CHECKPOINTS[0];
/** chart labels oldest first, one per visit */
const LABELS = [...CHECKPOINTS].reverse().map((c) => shortDate(c.date));

/** A study's lead reading at every visit, or nothing when it was not measured each time. */
function seriesOf(r: Region): number[] | null {
  const t = readingOf(r.id).trend;
  if (!t || t.length !== VISITS.length || t.some((n) => !Number.isFinite(n))) return null;
  return t;
}

const signed = (n: number) => {
  const d = Math.abs(n) < 10 && !Number.isInteger(n) ? 1 : 0;
  const s = Math.abs(n).toFixed(d);
  return Number(s) === 0 ? "No change" : `${n > 0 ? "+" : "−"}${s}`;
};

/**
 * Trends: the figure set aside, a body holds one moment and a chart holds many.
 * Each study the member has every visit for becomes one chart, its own hue,
 * one point per visit; the rest are listed as measured once.
 */
export function TwinTrends({ lens, span = true }: { lens: Lens; span?: boolean }) {
  const go = useGo();
  const regions = regionsOf(lens);
  const charted = regions.map((r) => ({ r, s: seriesOf(r) })).filter((x): x is { r: Region; s: number[] } => x.s !== null);
  const rest = regions.filter((r) => !charted.some((c) => c.r.id === r.id));

  return (
    <section className="tw-trends" aria-label={`${LENS_LABEL[lens]} trends`}>
      {span && <p className="tw-trends-span">
        {VISITS.length} visits · {shortDate(FIRST.date)} to {shortDate(LAST.date)}
      </p>}

      {charted.map(({ r, s }) => {
        const v = readingOf(r.id);
        const tone = toneOf(v);
        return (
          <button key={r.id} className="tw-chart" data-field={r.field} onClick={(e) => go(`/v3/study/${r.id}`, { from: e.currentTarget })}>
            <span className="tw-chart-head">
              <span className="tw-chart-t">
                {r.name}
                {v.status && <small data-status={tone === "mon" || tone === "alert" ? "monitor" : "normal"}>{v.status}</small>}
              </span>
              <Chevron size={16} />
            </span>
            <span className="tw-chart-now">
              <b>
                <Num v={v.value} />
              </b>
              {v.unit && <u>{v.unit}</u>}
              <em>
                {signed(s[s.length - 1] - s[0])} since {shortDate(FIRST.date)}
              </em>
            </span>
            {v.label && <span className="tw-chart-l">{v.label}</span>}
            <HistoryChart values={s} labels={LABELS} />
          </button>
        );
      })}

      {rest.length > 0 && (
        <>
          <h3 className="tw-trends-h">Not charted</h3>
          <ul className="tw-list tw-trends-rest">
            {rest.map((r) => (
              <li key={r.id}>
                <button onClick={(e) => go(`/v3/study/${r.id}`, { from: e.currentTarget })}>
                  <span className="tw-name">
                    {r.name}
                    <span className="tw-why">{readingOf(r.id).single ? `Recorded once, ${readingOf(r.id).single}` : "No single number to chart"}</span>
                  </span>
                  <Chevron size={16} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
