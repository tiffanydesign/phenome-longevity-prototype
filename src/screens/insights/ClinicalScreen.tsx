import { useState } from "react";
import { Screen } from "@/components/Screen";
import { NavHeader } from "@/components/NavHeader";
import { createStore, useDataset, useOffline } from "@/lib/data";
import { photo } from "@/lib/asset";
import { CLINICAL_SECTIONS, TILE_UNITS, clinicalValues, type ClinicalSection, type ClinicalValue } from "@/data/insightsClinical";
import { Pencil, PdfFile } from "./icons";
import { FieldSheet, UploadNoticeSheet } from "./ClinicalSheets";
import "./Clinical.css";

/** Values typed through the "Add Value" sheet; survive navigation, reset on reload. */
const entered = createStore<Record<string, ClinicalValue>>({});

type Overlay = { kind: "field"; label: string; draft: string } | { kind: "notice" } | null;

/**
 * Prototype-only deep-link for tests/compare (the compare runner can click but not type):
 *   ?ci=edit:Weight[:68.5]            open the field sheet (optionally pre-typed)
 *   ?ci=saved:Weight:68.5:2026-10-28  seed a saved value
 *   ?ci=…;notice                      also open the Experimental Feature sheet
 */
function readDeepLink(): Overlay {
  const raw = new URLSearchParams(window.location.hash.split("?")[1] ?? "").get("ci");
  if (!raw) return null;
  let overlay: Overlay = null;
  entered.set({}); // a deep link always starts from a clean form
  for (const part of raw.split(";")) {
    const [kind, label = "", value = "", date = ""] = part.split(":");
    if (kind === "edit") overlay = { kind: "field", label, draft: value };
    if (kind === "saved") entered.set((s) => ({ ...s, [label]: { value, date: date || today() } }));
    if (kind === "notice") overlay = { kind: "notice" };
  }
  return overlay;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Clinical Insights form — capture: insights_clinical/top, scroll_1…29, field_edit, field_edit_filled,
 * field_saved, sheet_upload_notice; offline/clinical.
 */
export function ClinicalScreen() {
  const base = useDataset(clinicalValues);
  const typed = entered.use();
  const offline = useOffline();
  const [overlay, setOverlay] = useState<Overlay>(readDeepLink);
  const values = { ...base, ...typed };

  const header = <NavHeader variant="chevron" title="Clinical Insights" />;

  if (offline) {
    return (
      <Screen header={header} statusTone="light">
        <div className="cli-empty">
          <ClipboardGlyph />
          <span>No data available</span>
        </div>
      </Screen>
    );
  }

  const sheet =
    overlay?.kind === "field" ? (
      <FieldSheet
        label={overlay.label}
        initial={overlay.draft}
        onClose={() => setOverlay(null)}
        onSave={(v) => {
          entered.set((s) => ({ ...s, [overlay.label]: { value: v, date: today() } }));
          setOverlay(null);
        }}
      />
    ) : overlay?.kind === "notice" ? (
      <UploadNoticeSheet onClose={() => setOverlay(null)} />
    ) : null;

  return (
    // Status icons are white-on-white on this screen (capture insights_clinical/top shows only the battery).
    <Screen header={header} statusTone="light" overlay={sheet} bodyClassName="cli-body">
      <div className="cli">
        <button className="cli-upload" onClick={() => setOverlay({ kind: "notice" })}>
          <PdfFile size={24} />
          Upload Lab Report (AI)
        </button>
        {CLINICAL_SECTIONS.map((s) => (
          <Section key={s.id} s={s} values={values} onEdit={(label) => setOverlay({ kind: "field", label, draft: "" })} />
        ))}
      </div>
    </Screen>
  );
}

function Section({ s, values, onEdit }: { s: ClinicalSection; values: Record<string, ClinicalValue>; onEdit: (label: string) => void }) {
  // Filled tiles move to the front (capture insights_clinical/field_saved: Weight jumps before Height).
  const tiles = [...s.tiles].sort((a, b) => Number(!!values[b]) - Number(!!values[a]));
  return (
    <section className="cli-sec">
      <div className="cli-sec-head">
        <span className="cli-sec-icon" style={{ ["--ico" as string]: `url("${photo(`insights/icons/${s.icon}.png`)}")` }} />
        <span className="cli-sec-text">
          <span className="cli-sec-title">{s.title}</span>
          <span className="cli-sec-count">{s.tiles.length + s.rows.length} fields</span>
        </span>
      </div>
      {tiles.length > 0 && (
        <div className="cli-tiles">
          {tiles.map((t) => {
            const v = values[t];
            return (
              <button key={t} className="cli-tile" data-filled={v ? "" : undefined} onClick={() => onEdit(t)}>
                <span className="cli-tile-head">
                  <span className="cli-tile-label">{t}</span>
                  <Pencil size={12} />
                </span>
                {v ? (
                  <>
                    <span className="cli-tile-value">
                      {v.value} {unitOf(t)}
                    </span>
                    <span className="cli-tile-date">{v.date}</span>
                  </>
                ) : (
                  <span className="cli-tile-dash">-</span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {s.rows.map((r) => (
        // TODO(fidelity): rows show a grey skeleton pill in every capture (value never loads on the
        // test account); tapping a row did nothing visible during capture.
        <div key={r} className="cli-row" role="button">
          <span className="cli-row-label">{r}</span>
          <span className="cli-row-pill" />
        </div>
      ))}
    </section>
  );
}

const unitOf = (label: string) => TILE_UNITS[label] ?? "";

/** Material "assignment" (offline/clinical): 36 × 48 css. */
function ClipboardGlyph() {
  return (
    <svg width="36" height="48" viewBox="0 0 36 48" aria-hidden>
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M18 0a6 6 0 0 1 5.7 4.2H31a5 5 0 0 1 5 5V43a5 5 0 0 1-5 5H5a5 5 0 0 1-5-5V9.2a5 5 0 0 1 5-5h7.3A6 6 0 0 1 18 0zm0 6.3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM9.3 22a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4zm0 8.6a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4zM15.3 22.7a1.5 1.5 0 0 0 0 3h12.3a1.5 1.5 0 0 0 0-3zm0 8.6a1.5 1.5 0 0 0 0 3h12.3a1.5 1.5 0 0 0 0-3z"
      />
    </svg>
  );
}
