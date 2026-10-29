import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Screen } from "@/components/Screen";
import { Icon } from "@/components/Icon";
import { useDataset } from "@/lib/data";
import { reports } from "@/data/insights";
import { ArrowBack, Chevron, ListIcon, PdfFile } from "./icons";
import "./ReportPdf.css";

const PAGE_H = 541; // capture report_pdf/top: cover page y 98.7–640

/**
 * In-app PDF viewer — capture: report_pdf/top, report_pdf/scroll_1.
 * TODO(fidelity): the captured PDF contains a real patient's name / DOB / patient no., so the
 * pages are generic placeholders (green cover + grey text lines), not the real report artwork.
 */
export function ReportPdfScreen() {
  const { id } = useParams();
  const list = useDataset(reports);
  const report = list.find((r) => r.id === id) ?? list[0];
  const pages = report?.pages ?? 102;
  const [page, setPage] = useState(1);
  const nav = useNavigate();
  const pagesRef = useRef<HTMLDivElement>(null);

  // Page counter follows the screen's scroll root (the <main> rendered by Screen).
  useEffect(() => {
    const root = pagesRef.current?.closest<HTMLElement>("[data-scroll-root]");
    if (!root) return;
    const onScroll = () => setPage(Math.min(pages, Math.floor((root.scrollTop + PAGE_H * 0.45) / PAGE_H) + 1));
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [pages]);

  return (
    <Screen
      header={
        <header className="pdf-head">
          <button className="pdf-head-btn" aria-label="Back" onClick={() => nav(-1)}>
            <ArrowBack size={28} />
          </button>
          {/* TODO(fidelity): opens the outline / page list in the app — not captured. */}
          <button className="pdf-head-btn" aria-label="Outline">
            <ListIcon size={28} />
          </button>
        </header>
      }
      bodyClassName="pdf-body"
      overlay={
        <div className="pdf-pill">
          <PdfFile size={26} />
          <span>
            {page} of {pages}
          </span>
          <Chevron size={20} dir="up" />
        </div>
      }
    >
      <div className="pdf-pages" ref={pagesRef}>
        <CoverPage />
        {Array.from({ length: pages - 1 }, (_, i) => (
          <TextPage key={i} n={i + 2} />
        ))}
      </div>
    </Screen>
  );
}

function CoverPage() {
  return (
    <section className="pdf-page pdf-cover">
      <svg className="pdf-cover-art" viewBox="0 0 378 541" preserveAspectRatio="none" aria-hidden>
        {Array.from({ length: 14 }, (_, i) => (
          <path
            key={i}
            d={`M${200 + i * 6} 0 C ${120 + i * 4} 200, ${330 - i * 3} 330, ${378} ${430 + i * 6}`}
            stroke="#ffffff"
            strokeOpacity={0.35}
            strokeWidth={0.6}
            fill="none"
          />
        ))}
        {[
          [236, 18, 3],
          [176, 236, 6],
          [320, 220, 5],
          [278, 293, 6],
          [340, 450, 7],
          [300, 412, 4],
        ].map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#ffffff" />
        ))}
      </svg>
      <div className="pdf-cover-title">
        <span className="pdf-cover-t1">Lifetime</span>
        <span className="pdf-cover-t2">Health Report</span>
      </div>
      <div className="pdf-cover-box">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <Icon name="Logo_White" className="pdf-cover-logo" style={{ width: 151, height: 24 }} />
      <div className="pdf-cover-foot">
        <i />
        <i />
        <i />
      </div>
    </section>
  );
}

const LINES = [92, 100, 100, 64, 0, 100, 100, 100, 41, 0, 100, 100, 78, 0, 100, 100, 100, 100, 55, 0, 100, 96, 100, 70];

function TextPage({ n }: { n: number }) {
  return (
    <section className="pdf-page pdf-text">
      <Icon name="Logo_Dark" className="pdf-text-logo" style={{ width: 108, height: 17 }} />
      <div className="pdf-text-band" />
      <div className="pdf-lines">
        {LINES.map((w, i) => (w ? <i key={i} style={{ width: `${w}%` }} /> : <b key={i} />))}
      </div>
      <span className="pdf-text-no">{n}</span>
    </section>
  );
}
