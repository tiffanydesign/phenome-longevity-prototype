import { Chevron } from "../ui/icons";
import { useGo } from "../ui/shell";
import { CHECKPOINTS, clinicShort } from "./checkpoints";
import { ResultsBar, TwinHero } from "./TwinHero";
import type { Lens } from "./regions";

/**
 * The twin's front page. The half-length figure stands on the page's own sky with
 * two readings of the visit; the title sits where the figure fades out, the way
 * into the full review closes the sky, and every laboratory marker follows as
 * one bar. Everything here is from the clinic; daily readings stay on Home.
 */
export function TwinOverview({ visit, past, onLens }: { visit: number; past: boolean; onLens: (l: Lens) => void }) {
  const go = useGo();
  const checkpoint = CHECKPOINTS.find((c) => c.visit === visit);

  return (
    <section className="two" data-past={past ? "" : undefined} aria-label="Twin overview">
      <div className="two-sky">
        <div className="two-hero">
          <TwinHero visit={visit} past={past} />
        </div>

        <header className="two-head">
          <span>
            <h2>Your twin</h2>
            {checkpoint && (
              <p>
                Visit {checkpoint.visit} · {checkpoint.date} · {clinicShort(checkpoint.clinic)}
              </p>
            )}
          </span>
          <button className="two-open" aria-label="Open the body lens" onClick={() => onLens("body")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" />
            </svg>
          </button>
        </header>

        <button className="two-plan" onClick={(e) => go("/v3/study/apose", { from: e.currentTarget })}>
          <span>
            <b>Your full review</b>
            <small>Every study from this visit, one by one</small>
          </span>
          <Chevron size={18} />
        </button>
      </div>

      <div className="two-rest">
        <section className="two-sec" aria-label="Results">
          <header>
            <h3>Results</h3>
            <button onClick={(e) => go("/v3/visits", { from: e.currentTarget })}>View all</button>
          </header>
          <ResultsBar visit={visit} />
        </section>
      </div>
    </section>
  );
}
