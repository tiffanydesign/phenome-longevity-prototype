import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RModal as Modal } from "./RModal";
import { RIcon } from "./RIcon";
import "./PdfFlow.css";

/** Languages offered by the report PDF generator (capture: genetic_report/modal_language). */
const LANGS: [string, string][] = [
  ["Czech", "CS"],
  ["Danish", "DA"],
  ["Dutch", "NL"],
  ["English", "EN"],
  ["Filipino", "FIL"],
  ["Finnish", "FI"],
  ["French", "FR"],
  // TODO(fidelity): rows below French were never scrolled into view in the captures.
  ["German", "DE"],
  ["Italian", "IT"],
  ["Polish", "PL"],
  ["Portuguese", "PT"],
  ["Spanish", "ES"],
  ["Swedish", "SV"],
];

export type PdfStep = "closed" | "language" | "loading" | "sent";

/**
 * "Generate PDF" flow shared by every report hub (recordings/flow_generate_pdf.mp4):
 * Select Language → Generate (button busy ~800 ms) → "Your PDF Report is Being Generated".
 * Captures: genetic_report/modal_language, modal_language_selected,
 * generate_button_loading, modal_pdf_generating, modal_pdf_ready.
 */
export function usePdfFlow() {
  // Prototype deep-link (tests/compare): #/route?pdf=language|loading|sent&lang=EN
  const [q] = useSearchParams();
  const [step, setStep] = useState<PdfStep>(() => (["language", "loading", "sent"].includes(q.get("pdf") ?? "") ? (q.get("pdf") as PdfStep) : "closed"));
  const [lang, setLang] = useState<string | null>(() => q.get("lang"));
  useEffect(() => {
    if (step !== "loading") return;
    if (q.get("pdf") === "loading") return; // frozen for the captured video frame
    const t = window.setTimeout(() => setStep("sent"), 800);
    return () => window.clearTimeout(t);
  }, [step, q]);
  const open = () => {
    setLang(null);
    setStep("language");
  };
  const close = () => setStep("closed");
  const overlay = (
    <>
      <Modal open={step === "language" || step === "loading"} onClose={step === "language" ? close : undefined} width={314}>
        <LanguageDialog lang={lang} onLang={setLang} busy={step === "loading"} onCancel={close} onGenerate={() => setStep("loading")} />
      </Modal>
      <Modal open={step === "sent"} onClose={close} width={314}>
        <div className="pdf-sent">
          <h2 className="pdf-sent-title">Your PDF Report is Being Generated</h2>
          <p className="pdf-sent-body">
            It will appear in your in-app inbox within <span style={{ whiteSpace: "nowrap" }}>5-10 minutes.</span>
          </p>
          {/* TODO(fidelity): the brief mentions a "Ready / View Report" variant; the captured
              modal_pdf_ready frame shows this same dialog with only Close. */}
          <button className="pdf-sent-close" onClick={close}>
            Close
          </button>
        </div>
      </Modal>
    </>
  );
  return { open, overlay, step };
}

function LanguageDialog({ lang, onLang, busy, onCancel, onGenerate }: { lang: string | null; onLang: (l: string) => void; busy: boolean; onCancel: () => void; onGenerate: () => void }) {
  return (
    <div className="pdf-lang">
      <div className="pdf-lang-head">
        <h2>Select Language</h2>
        <button className="pdf-lang-x" aria-label="Close" onClick={onCancel}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <p className="pdf-lang-hint">
        <RIcon name="globe" />
        Choose your preferred language
      </p>
      <div className="pdf-lang-list scroll">
        {LANGS.map(([name, code]) => (
          <button key={code} className="pdf-lang-row" data-on={lang === code || undefined} onClick={() => onLang(code)}>
            <span className="pdf-radio">
              {lang === code && (
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path d="M2 6.2l2.6 2.6L10 3.4" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className="pdf-lang-name">{name}</span>
            <span className="pdf-lang-code">{code}</span>
          </button>
        ))}
      </div>
      <div className="pdf-lang-actions">
        <button className="pdf-cancel" onClick={onCancel}>
          Cancel
        </button>
        {/* Disabled until a language is picked; stays disabled while the request is in flight.
            TODO(fidelity): the loading video frame shows no visible busy state on the button. */}
        <button className="pdf-generate" disabled={!lang || busy} data-busy={busy || undefined} onClick={onGenerate}>
          Generate
        </button>
      </div>
    </div>
  );
}

/** Right-hand "Generate PDF" soft pill of the greeting header. */
export function PdfPill({ onClick, file = false }: { onClick: () => void; file?: boolean }) {
  return (
    <button className="pdf-pill" onClick={onClick}>
      <RIcon name={file ? "pdf_file" : "pdf"} />
      Generate PDF
    </button>
  );
}
