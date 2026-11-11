import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { BackBar, BlurLayers, V2Screen } from "../ui/shell";
import { historyOf, type Level } from "./history";
import "../home/home.css";
import "./kits.css";

const LEVEL_TONE: Record<Level, string> = { Lower: "ok", Typical: "ok", Raised: "watch", High: "flag" };

/** A reading as a small word with a dot in its tone; nothing read, a dash. */
function Reading({ v }: { v?: Level }) {
  if (!v) return <span className="kc-v" data-none="">Not read</span>;
  return (
    <span className="kc-v" data-tone={LEVEL_TONE[v]}>
      <i aria-hidden />
      {v}
    </span>
  );
}

/**
 * Two runs of the same kit side by side. The earlier run on the left, the later
 * on the right; with more than two runs, either side can be changed. What read
 * differently comes first, and the rest can be shown or hidden.
 */
export function KitCompareScreen() {
  const { kind = "genome" } = useParams();
  const [params] = useSearchParams();
  const title = params.get("test") ?? "Genetic Insights";
  const h = historyOf(kind, title);
  const n = h?.runs.length ?? 0;
  const [a, setA] = useState(0);
  const [b, setB] = useState(Math.max(n - 1, 0));
  const [all, setAll] = useState(false);

  if (!h || n < 2)
    return (
      <V2Screen nav={false}>
        <div className="kc scroll">
          <header className="kc-bar">
            <BackBar />
          </header>
          <p className="kc-lead">There is only one result for this test, so there is nothing to compare yet.</p>
        </div>
      </V2Screen>
    );

  const A = h.runs[a];
  const B = h.runs[b];
  const changed = h.findings.filter((f) => A.levels[f.id] !== B.levels[f.id]);
  const shown = all ? h.findings : changed;
  const groups = [...new Set(shown.map((f) => f.group))];

  const Picker = ({ value, other, onPick, side }: { value: number; other: number; onPick: (i: number) => void; side: string }) => (
    <label className="kc-run">
      <small>{side}</small>
      {n > 2 ? (
        <select value={value} onChange={(e) => onPick(Number(e.target.value))}>
          {h.runs.map((r, i) => (
            <option key={r.date} value={i} disabled={i === other}>
              {r.date}
            </option>
          ))}
        </select>
      ) : (
        <b>{h.runs[value].date}</b>
      )}
      <span>{h.runs[value].panel}</span>
    </label>
  );

  return (
    <V2Screen nav={false}>
      <div className="v2-veil vs-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="kc scroll">
        <header className="kc-bar">
          <BackBar />
        </header>

        <section className="kc-hero">
          <p className="kc-eyebrow">{title}</p>
          <h1>Compare results</h1>
          <p className="kc-lead">Your DNA is the same in every run. What can change is how the lab reads it, as new studies come in and newer panels read more.</p>
        </section>

        {/* the two runs, earlier left and later right, joined by an arrow */}
        <div className="kc-runs">
          <Picker side="Earlier" value={a} other={b} onPick={setA} />
          <span className="kc-arrow" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
          <Picker side="Later" value={b} other={a} onPick={setB} />
        </div>

        <div className="kc-sum">
          <b>{changed.length === 0 ? "Everything reads the same" : `${changed.length} of ${h.findings.length} read differently`}</b>
          <button className="kc-toggle" aria-pressed={all} onClick={() => setAll(!all)}>
            {all ? "Changes only" : "Show all"}
          </button>
        </div>

        {groups.map((g) => (
          <section key={g} className="kc-group">
            <h2>{g}</h2>
            <ul className="kc-list">
              {shown
                .filter((f) => f.group === g)
                .map((f) => {
                  const diff = A.levels[f.id] !== B.levels[f.id];
                  const fresh = !A.levels[f.id] && !!B.levels[f.id];
                  return (
                    <li key={f.id} data-same={diff ? undefined : ""}>
                      <span className="kc-name">
                        {f.name}
                        {diff && <em>{fresh ? "New" : "Updated"}</em>}
                      </span>
                      <span className="kc-pair">
                        <Reading v={A.levels[f.id]} />
                        <svg className="kc-to" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                        <Reading v={B.levels[f.id]} />
                      </span>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}

        <p className="kc-note">A changed reading is worth a word with your clinician before acting on it.</p>
      </div>
    </V2Screen>
  );
}
