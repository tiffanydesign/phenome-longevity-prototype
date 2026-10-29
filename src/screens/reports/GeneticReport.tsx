import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { useDataset } from "@/lib/data";
import { geneticHubData, newbornData, REPORT_TITLES, type HubPage } from "@/data/reports";
import { ArrowRight, Chevron, RIcon } from "./parts/RIcon";
import { usePdfFlow } from "./parts/PdfFlow";
import { ReportHeader } from "./parts/ReportHeader";
import { Dots } from "./parts/Pager";
import "./GeneticReport.css";

/**
 * Genetic report hub — /insights/genetic/:report.
 * genetic | sports → pager hub (captures: genetic_report/top, page_2, page_3 + PDF modals);
 * newborn | carrier → screening summary (capture: genome_report/top).
 */
export function GeneticReportScreen() {
  const { report = "genetic" } = useParams();
  const pdf = usePdfFlow();
  const title = REPORT_TITLES[report] ?? REPORT_TITLES.genetic;
  const summary = report === "newborn" || report === "carrier";
  return (
    <Screen
      header={<ReportHeader title={title} fileIcon={summary} onPdf={pdf.open} />}
      overlay={pdf.overlay}
    >
      {summary ? <ScreeningSummary /> : <GeneticHub />}
    </Screen>
  );
}

function GeneticHub() {
  const d = useDataset(geneticHubData);
  const [q] = useSearchParams();
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  // Deep link ?page=2 opens the hub on the 2nd card (captures page_2 / page_3).
  useEffect(() => {
    const p = Number(q.get("page") ?? 1) - 1;
    if (p > 0 && ref.current) ref.current.scrollLeft = p * PAGE_W;
  }, []);

  const onScroll = () => {
    const el = ref.current;
    if (el) setPage(Math.round(el.scrollLeft / PAGE_W));
  };
  const goTo = (i: number) => ref.current?.scrollTo({ left: i * PAGE_W, behavior: "smooth" });

  return (
    <div className="gr">
      <p className="gr-intro">{d.intro}</p>
      <div className="gr-pager rp-track" ref={ref} onScroll={onScroll}>
        {d.pages.map((p) => (
          <HubCard key={p.title} p={p} />
        ))}
      </div>
      <Dots count={d.pages.length} index={page} onPick={goTo} />
    </div>
  );
}

const PAGE_W = 354;

function HubCard({ p }: { p: HubPage }) {
  const nav = useNavigate();
  return (
    <section className="gr-page">
      <div className="gr-head">
        <span className="gr-head-icon">
          <RIcon name={p.icon} />
        </span>
        <span className="gr-head-text">
          <h2>{p.title}</h2>
          <span>{p.sub}</span>
        </span>
      </div>
      <div className="gr-stats" data-cols={p.stats.length}>
        {p.stats.map(([n, label], i) => (
          <div key={i} className="gr-stat">
            <b>{n}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <h3 className="gr-panels-title">{p.panelsTitle}</h3>
      <div className="gr-panels">
        {p.panels.map((r) => (
          <button key={r.title} className="gr-row" onClick={() => r.to && nav(r.to)}>
            <span className="gr-row-icon">
              <RIcon name={r.icon} />
            </span>
            <span className="gr-row-text">
              <b>{r.title}</b>
              <span>{r.sub}</span>
            </span>
            {r.badges.map(([tone, n], i) => (
              <span key={i} className="gr-badge" data-tone={tone}>
                {n}
              </span>
            ))}
            {r.chevron && (
              <span className="gr-row-chev">
                <Chevron size={18} stroke={1.8} />
              </span>
            )}
          </button>
        ))}
      </div>
      <button className="gr-viewall" onClick={() => nav(p.to)}>
        {p.viewAll} <ArrowRight size={18} />
      </button>
    </section>
  );
}

/** Newborn / carrier screening summary — capture: genome_report/top (empty account: All Clear). */
function ScreeningSummary() {
  const d = useDataset(newbornData);
  const [query, setQuery] = useState("");
  return (
    <div className="ns">
      <div className="ns-intro">
        <span className="ns-intro-icon">
          <RIcon name="baby" />
        </span>
        <p>{d.intro}</p>
      </div>
      <label className="ns-search">
        <RIcon name="search" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conditions..." />
      </label>
      <div className="ns-chips">
        <span className="ns-chip">
          All <i>{d.total}</i>
        </span>
      </div>
      <div className="ns-summary">
        <h3>Screening Summary</h3>
        <b>{d.total}</b>
        <span>Total Screened</span>
      </div>
      <div className="ns-clear">
        <RIcon name="search_big" />
        <h3>All Clear</h3>
        <p>No significant findings were detected in the newborn screening analysis.</p>
      </div>
    </div>
  );
}
