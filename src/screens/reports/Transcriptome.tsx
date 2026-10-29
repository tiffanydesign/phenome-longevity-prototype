import { Screen } from "@/components/Screen";
import { useDataset } from "@/lib/data";
import { transcriptomeData, type CellType, type EstimateCard } from "@/data/reportsTranscriptome";
import { RIcon } from "./parts/RIcon";
import { usePdfFlow } from "./parts/PdfFlow";
import { ReportHeader } from "./parts/ReportHeader";
import "./Transcriptome.css";
import "./TranscriptomeCells.css";

/** Transcriptome report — /insights/transcriptome/report. Captures: transcriptome_report/top, scroll_1…14. */
export function TranscriptomeScreen() {
  const d = useDataset(transcriptomeData);
  const pdf = usePdfFlow();
  return (
    <Screen header={<ReportHeader title="Transcriptome Analysis" fileIcon onPdf={pdf.open} />} overlay={pdf.overlay}>
      <div className="tx">
        <div className="tx-hero">
          <ScoreArc score={d.score} />
          <div className="tx-hero-text">
            <h2>
              <RIcon name="dna" />
              <span>Transcriptome Analysis</span>
            </h2>
            <p>View your transcriptomic insights</p>
            <div className="tx-tiles">
              <span className="tx-tile">
                <RIcon name="check_circle" style={{ color: "#78e2ab" }} />
                <span>
                  <b>{d.normal}</b>Normal
                </span>
              </span>
              <span className="tx-tile">
                <RIcon name="alert_circle" style={{ color: "#f19d38" }} />
                <span>
                  <b>{d.attention}</b>Attention
                </span>
              </span>
            </div>
          </div>
        </div>

        <p className="tx-eyebrow">WHOLE-BLOOD TRANSCRIPTOME</p>
        <h2 className="tx-h">Transcriptomic Health Overview</h2>
        <p className="tx-lead">{d.overview}</p>
        {d.estimates.map((e) => (
          <Estimate key={e.title} e={e} />
        ))}
        <Disclaimer text={d.disclaimer} />

        <p className="tx-eyebrow tx-eyebrow-2">TRANSCRIPTOMIC DISEASE MODEL</p>
        <h2 className="tx-h">Disease Susceptibility</h2>
        <p className="tx-lead">{d.disease.intro}</p>
        <section className="tx-card">
          <CardHead icon="bars" title="Molecular risk overview" />
          <span className="tx-label tx-mt">Healthy-model probability</span>
          <b className="tx-big">{d.disease.healthy}</b>
          <p className="tx-note">{d.disease.healthyNote}</p>
          <h4 className="tx-sub">Leading model signals</h4>
          <ol className="tx-signals">
            {d.disease.signals.map((s, i) => (
              <li key={s}>
                <i>{i + 1}</i>
                {i === 0 ? <b>{s}</b> : s}
              </li>
            ))}
          </ol>
          <hr className="tx-rule" />
          <h4 className="tx-sub">What this means</h4>
          <p className="tx-means">{d.disease.means}</p>
          <h4 className="tx-sub tx-sub-gap">Model coverage and evidence</h4>
          <div className="tx-grid tx-grid-sm">
            {d.disease.coverage.map(([l, v]) => (
              <span key={l}>
                <span className="tx-label">{l}</span>
                <b>{v}</b>
              </span>
            ))}
          </div>
        </section>
        <section className="tx-card tx-accordions">
          {/* TODO(fidelity): accordion bodies were never expanded in the captures. */}
          <button className="tx-acc">
            Ranked Disease Axes <span>{d.disease.axes}</span>
            <RIcon name="chevron_down" />
          </button>
          <button className="tx-acc">
            How to read the results
            <RIcon name="chevron_down" />
          </button>
        </section>
        <Disclaimer text={d.disease.disclaimer} />

        <h2 className="tx-h tx-h-cells">Immune-cell composition</h2>
        <section className="tx-card tx-table">
          <h3>Cell Type Summary</h3>
          <div className="tx-thead">
            <span>Cell Type</span>
            <span>Value</span>
            <span>Status</span>
          </div>
          {d.cells.map((c) => (
            <div key={c.name} className="tx-tr">
              <span className="tx-cell-name">
                <span className="tx-cell-icon">
                  <RIcon name={c.icon} />
                </span>
                {c.name}
              </span>
              <span>{c.value}</span>
              <span>{c.status}</span>
              <RIcon name="check_navy" />
            </div>
          ))}
        </section>
        {d.cells.map((c) => (
          <CellCard key={c.name} c={c} />
        ))}
      </div>
    </Screen>
  );
}

/** 273° score arc (caps 46.6° below the horizontal), r 48, stroke 8.5 — capture: transcriptome_report/top. */
function ScoreArc({ score }: { score: number }) {
  const cx = 52;
  const cy = 52;
  const r = 48;
  const a0 = (226.6 * Math.PI) / 180;
  const a1 = (-46.6 * Math.PI) / 180;
  const p = (a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy - r * Math.sin(a)).toFixed(2)}`;
  const d = `M ${p(a0)} A ${r} ${r} 0 1 1 ${p(a1)}`;
  return (
    <div className="tx-score">
      <svg width="104" height="104" style={{ overflow: "visible" }} aria-hidden>
        <defs>
          <linearGradient id="tx-g" x1="0" x2="1">
            <stop offset="0" stopColor="#47579a" />
            <stop offset="1" stopColor="#7283bd" />
          </linearGradient>
        </defs>
        <path d={d} fill="none" stroke="#e8eaf1" strokeWidth={8.5} strokeLinecap="round" />
        <path d={d} fill="none" stroke="url(#tx-g)" strokeWidth={8.5} strokeLinecap="round" pathLength={1} strokeDasharray={`${score / 100} 1`} />
      </svg>
      <b>{score}</b>
      <span>Score</span>
    </div>
  );
}

function CardHead({ icon, title }: { icon: "hourglass" | "weight" | "lungs" | "bars"; title: string }) {
  return (
    <div className="tx-card-head">
      <span className="tx-card-icon">
        <RIcon name={icon} />
      </span>
      <h3>{title}</h3>
    </div>
  );
}

function Estimate({ e }: { e: EstimateCard }) {
  return (
    <section className="tx-card">
      <CardHead icon={e.icon} title={e.title} />
      {e.pill && (
        <>
          <span className="tx-label tx-mt">{e.pill.label}</span>
          <span className="tx-pill">{e.pill.value}</span>
        </>
      )}
      <div className="tx-grid">
        {e.grid.map(([l, v], i) => (
          <span key={l}>
            <span className="tx-label">{l}</span>
            <b className={i === 0 ? "tx-big" : undefined}>{v}</b>
          </span>
        ))}
      </div>
      <hr className="tx-rule" />
      <h4 className="tx-sub">What this means</h4>
      <p className="tx-means">{e.means}</p>
      <p className="tx-missing">Missing model genes: {e.missing}</p>
      <button className="tx-acc">
        About this estimate
        <RIcon name="chevron_down" />
      </button>
    </section>
  );
}

function Disclaimer({ text }: { text: string }) {
  return (
    <p className="tx-disc">
      <RIcon name="info_small" />
      <span>{text}</span>
    </p>
  );
}

function CellCard({ c }: { c: CellType }) {
  const pos = c.max > c.min ? Math.max(0, Math.min(1, (c.num - c.min) / (c.max - c.min))) : 0;
  return (
    <section className="tx-card tx-cellcard">
      <div className="tx-cc-head">
        <span className="tx-cc-icon">
          <RIcon name={c.icon} scale={1.9} />
        </span>
        <span className="tx-cc-title">
          <b>{c.name}</b>
          <span>{c.status}</span>
        </span>
        <span className="tx-cc-val">{c.value}</span>
      </div>
      <p className="tx-cc-desc">{c.description}</p>
      <div className="tx-range">
        <span className="tx-range-fill">
          <i className="tx-range-mark" style={{ left: `${pos * 100}%` }} />
        </span>
      </div>
      <div className="tx-range-labels">
        <span>{c.min.toFixed(1)}%</span>
        <span>{c.max.toFixed(1)}%</span>
      </div>
      <div className="tx-box">
        <h5>
          <RIcon name="analysis" />
          Analysis
        </h5>
        <p>{c.analysis}</p>
      </div>
      <div className="tx-box">
        <h5>
          <RIcon name="rec_bulb" />
          Recommendations
        </h5>
        <p>{c.recommendations}</p>
      </div>
    </section>
  );
}
