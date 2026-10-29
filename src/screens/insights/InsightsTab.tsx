import { useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { useDataset } from "@/lib/data";
import { insightsTab, type PortfolioCard } from "@/data/insights";
import { Chevron } from "./icons";
import "./InsightsTab.css";

/** Insights tab — capture: tab_insights/top, scroll_1, scroll_2, dark_tab_insights/top. */
export function InsightsTab() {
  const d = useDataset(insightsTab);
  const nav = useNavigate();

  return (
    // Status icons are white-on-white here too (capture tab_insights/top shows only the battery pill).
    <Screen tabs statusTone="light" header={<InsightsLogo />}>
      <div className="ins">
        <h1 className="ins-h1">Your Health Data</h1>
        <p className="ins-lead">
          Your genetic makeup and other biological factors provide insights into your well-being, as well as the microbial composition on and
          inside your body.
        </p>

        <button className="ins-pdf" onClick={() => nav("/insights/reports")}>
          <span className="ins-pdf-label">View Generated PDF Reports</span>
          <span className="ins-badge">{d.reportCount}</span>
          <Chevron size={19} />
        </button>

        <button className="ins-card ins-card-clinical" onClick={() => nav("/insights/clinical")}>
          <span className="ins-card-title">Clinical Insights</span>
          <span className="ins-card-sub">Analyse your clinical data</span>
          <span className="ins-card-chev">
            <Chevron size={19} />
          </span>
        </button>

        <h2 className="ins-h2">Omics Portfolio</h2>
        <div className="ins-list">
          {d.omics.map((c) => (
            <PortfolioTile key={c.title} c={c} onOpen={(to) => nav(to)} />
          ))}
        </div>

        <h2 className="ins-h2 ins-h2-results">Results</h2>
        <div className="ins-list">
          {d.results.map((c) => (
            <PortfolioTile key={c.title} c={c} onOpen={(to) => nav(to)} />
          ))}
        </div>
      </div>
    </Screen>
  );
}

function PortfolioTile({ c, onOpen }: { c: PortfolioCard; onOpen: (to: string) => void }) {
  const cls = `ins-card ins-card-${c.tone}${c.to ? "" : " ins-card-off"}`;
  if (!c.to) {
    // Disabled in the app: greyed-out, not tappable (tab_insights/scroll_1).
    return (
      <div className={cls} aria-disabled>
        <span className="ins-card-title">{c.title}</span>
        <span className="ins-card-sub">{c.sub}</span>
      </div>
    );
  }
  const to = c.to;
  return (
    <button className={cls} onClick={() => onOpen(to)}>
      <span className="ins-card-title">{c.title}</span>
      <span className="ins-card-sub">{c.sub}</span>
      <span className="ins-card-chev">
        <Chevron size={19} />
      </span>
    </button>
  );
}

function InsightsLogo() {
  return (
    <div className="ins-logo">
      <Icon name="PL_Logo" size={36} style={{ height: 24 }} />
    </div>
  );
}
