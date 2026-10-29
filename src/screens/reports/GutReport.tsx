import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { Ring } from "@/components/Charts";
import { useDataset } from "@/lib/data";
import { gutData, type GutSection } from "@/data/reportsGut";
import { Chevron, RIcon } from "./parts/RIcon";
import { Dots } from "./parts/Pager";
import { usePdfFlow } from "./parts/PdfFlow";
import { ReportHeader } from "./parts/ReportHeader";
import "./GutReport.css";

const PAGE_W = 354;

/** Gut report hub — /insights/gut/report. Captures: gut_report/top, scroll_1, scroll_2. */
export function GutReportScreen() {
  const d = useDataset(gutData);
  const nav = useNavigate();
  const pdf = usePdfFlow();
  const ref = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const sec = d.sections[page];

  return (
    <Screen header={<ReportHeader title="Gut Health Analysis" onPdf={pdf.open} />} overlay={pdf.overlay}>
      <div className="gu">
        <div className="gu-intro">
          <span className="gu-intro-icon">
            <RIcon name="gut_microscope" />
          </span>
          <p>{d.intro}</p>
        </div>

        <section className="gu-score">
          <h2>Overall Score</h2>
          <div className="gu-ring">
            {/* shot_only: score ring — SVG reconstruction */}
            <Ring size={160} stroke={12.5} value={d.score / 100} color="var(--c-navy)" track="#e8eaf1">
              <span className="gu-ring-text">
                <b>{d.score}</b>
                <span>{d.scoreLabel}</span>
              </span>
            </Ring>
          </div>
          {d.sections.map((s) => (
            <SectionCard key={s.id} s={s} onAll={() => nav(`/insights/gut/findings/${s.id}`)} />
          ))}
        </section>

        <p className="gu-overview">{d.overview}</p>

        <div
          className="gu-pager rp-track"
          ref={ref}
          onScroll={() => ref.current && setPage(Math.round(ref.current.scrollLeft / PAGE_W))}
        >
          {d.sections.map((s) => (
            <DetailPage key={s.id} s={s} onAll={() => nav(`/insights/gut/findings/${s.id}`)} />
          ))}
        </div>
        <Dots count={d.sections.length} index={page} onPick={(i) => ref.current?.scrollTo({ left: i * PAGE_W, behavior: "smooth" })} />

        <section className="gu-about">
          <div className="gu-about-head">
            <span className="gu-about-icon">
              <RIcon name={sec.icon} scale={0.86} />
            </span>
            <h3>{sec.aboutTitle}</h3>
          </div>
          <p>{sec.about}</p>
        </section>
      </div>
    </Screen>
  );
}

function SectionCard({ s, onAll }: { s: GutSection; onAll: () => void }) {
  return (
    <div className="gu-sec">
      <div className="gu-sec-head">
        <span className="gu-sec-icon">
          <RIcon name={s.icon} />
        </span>
        <span className="gu-sec-text">
          <b>{s.title}</b>
          <span>{s.sub}</span>
        </span>
        {/* shot_only: percent ring badge */}
        <Ring size={47} stroke={4.5} value={s.score / 100} color="var(--c-navy)" track="#eceef4">
          <span className="gu-mini">
            {s.mark === "alert" ? <i className="gu-alert">!</i> : <RIcon name="check_navy" scale={0.55} />}
            <b>{s.score}</b>
          </span>
        </Ring>
      </div>
      <div className="gu-chips">
        {s.chips.map((c) => (
          <span key={c} className="gu-chip">
            {c}
          </span>
        ))}
      </div>
      <button className="gu-all" onClick={onAll}>
        View all {s.findings} findings <Chevron size={14} stroke={2} />
      </button>
    </div>
  );
}

function DetailPage({ s, onAll }: { s: GutSection; onAll: () => void }) {
  return (
    <section className="gu-page">
      <div className="gu-card">
        <div className="gu-card-head">
          <span className="gu-card-icon">
            <RIcon name={s.icon} scale={1.15} />
          </span>
          <span className="gu-card-text">
            <b>{s.title}</b>
            <span>{s.sub}</span>
          </span>
          <span className="gu-card-mark">{s.mark === "alert" ? <RIcon name="exclaim" /> : <RIcon name="check_navy" />}</span>
        </div>
        <div className="gu-stats">
          {s.stats.map(([n, l]) => (
            <span key={l}>
              <b>{n}</b>
              {l}
            </span>
          ))}
        </div>
        <h4 className="gu-list-title">{s.listTitle}</h4>
        <div className="gu-rows">
          {s.rows.map((r) => (
            <div key={r.title} className="gu-row">
              <span className="gu-row-icon">
                <RIcon name={r.icon} />
              </span>
              <span className="gu-row-text">
                <b>{r.title}</b>
                <span>{r.sub}</span>
              </span>
              {r.tag && <i className="gu-tag">{r.tag}</i>}
              <b className="gu-row-val">{r.value}</b>
            </div>
          ))}
        </div>
        <button className="gu-card-all" onClick={onAll}>
          View all {s.findings} findings <Chevron size={12} stroke={2} />
        </button>
      </div>
    </section>
  );
}
