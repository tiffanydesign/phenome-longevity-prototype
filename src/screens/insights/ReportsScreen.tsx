import { useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { useDataset, useOffline } from "@/lib/data";
import { reports, REPORTS_OFFLINE_ERROR } from "@/data/insights";
import { Chevron, Clock, Folder, PdfStack, Refresh } from "./icons";
import "./Reports.css";

/** Reports list — capture: insights_reports/top, offline/reports. */
export function ReportsScreen() {
  const list = useDataset(reports);
  const offline = useOffline();
  const nav = useNavigate();

  return (
    <Screen header={<ReportsHeader />}>
      {offline ? (
        // App bug reproduced: the raw exception is shown to the user (offline/reports).
        <div className="rep-error">
          <Folder size={62} />
          <p className="rep-error-text">{REPORTS_OFFLINE_ERROR}</p>
          <p className="rep-error-sub">Your reports will appear here when ready</p>
        </div>
      ) : (
        <div className="rep">
          <div className="rep-hero">
            <span className="rep-tile rep-tile-hero">
              <Folder size={30} />
            </span>
            <span className="rep-hero-text">
              <span className="rep-hero-title">Your Health Reports</span>
              <span className="rep-hero-sub">Access and view your personalized health reports</span>
            </span>
          </div>

          <h2 className="rep-h2">Available Reports ({list.length})</h2>
          {list.map((r) => (
            <button key={r.id} className="rep-row" onClick={() => nav(`/insights/reports/${r.id}`)}>
              <span className="rep-tile rep-tile-row">
                <PdfStack size={33} />
              </span>
              <span className="rep-row-text">
                <span className="rep-row-title">{r.title}</span>
                <span className="rep-row-sub">{r.lang} · Health Report PDF</span>
                <span className="rep-row-date">
                  <Clock size={12} />
                  {r.date}
                </span>
              </span>
              <Chevron size={18} />
            </button>
          ))}
        </div>
      )}
    </Screen>
  );
}

/**
 * "‹   Reports            ⟳" — chevron back + left-aligned bold title + refresh.
 * Module-local: the shared NavHeader "arrow" variant draws ← and a 21px medium title.
 */
function ReportsHeader() {
  const nav = useNavigate();
  return (
    <header className="rep-head">
      <button className="rep-head-btn" aria-label="Back" onClick={() => nav(-1)}>
        <Chevron size={24} dir="left" />
      </button>
      <h1 className="rep-head-title">Reports</h1>
      {/* TODO(fidelity): refresh just re-fetches in the app; no visible spinner was captured. */}
      <button className="rep-head-btn rep-head-refresh" aria-label="Refresh">
        <Refresh size={22} />
      </button>
    </header>
  );
}
