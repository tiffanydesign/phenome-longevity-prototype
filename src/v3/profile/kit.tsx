import { useState, type ReactNode } from "react";
import { BackBar, BlurLayers, V2Screen } from "../ui/shell";
import { veilOnScroll } from "../devices/veil";
import "../devices/devices.css";
import "./profile.css";
import "./subpages.css";

/*
 * The parts every Profile sub-page is built from, so they read as one family
 * with Devices and the metric pages: glass back (and one glass action at the
 * right), a 34px title on its own line, one quiet line under it, then white
 * grouped cards with 20px headings 32 apart.
 */

export function SubPage({ title, lead, right, overlay, onBack, children }: { title: string; lead?: string; right?: ReactNode; overlay?: ReactNode; onBack?: () => void; children: ReactNode }) {
  return (
    <V2Screen nav={false}>
      <div className="v2-veil mx-veil dv-veil" data-at="status" aria-hidden>
        <BlurLayers />
      </div>
      <div className="dv scroll pf" onScroll={veilOnScroll}>
        <header className="dv-bar pf-bar">
          <BackBar onBack={onBack} />
          {right}
        </header>
        {title && <h1 className="dv-title">{title}</h1>}
        {lead && <p className="dv-lead">{lead}</p>}
        {children}
      </div>
      {overlay}
    </V2Screen>
  );
}

/** Edit / Done in a glass capsule; Done fills navy. */
export function EditPill({ editing, onToggle }: { editing: boolean; onToggle: () => void }) {
  return (
    <button className="pf-pill" data-on={editing ? "" : undefined} onClick={onToggle}>
      {editing ? "Done" : "Edit"}
    </button>
  );
}

export function Group({ title, note, children }: { title?: string; note?: string; children: ReactNode }) {
  return (
    <section className="dv-sec">
      {title && <h2 className="dv-h">{title}</h2>}
      {children}
      {note && <p className="pf-note">{note}</p>}
    </section>
  );
}

/** A value read off the record: "—" and empty both read as not set. */
const shown = (v: string) => (v && v !== "—" ? v : "Not set");

/** Label-and-value rows that become fields in place while editing. */
export function Fields<T extends object>({
  rows,
  value,
  editing,
  onChange,
}: {
  rows: [string, keyof T & string][];
  value: T;
  editing: boolean;
  onChange: (patch: Partial<T>) => void;
}) {
  return (
    <dl className="dv-group dd-spec pf-fields">
      {rows.map(([label, k]) => {
        const v = String((value as Record<string, unknown>)[k] ?? "");
        return (
          <div key={k} data-edit={editing ? "" : undefined}>
            <dt>
              <label htmlFor={`pf-${k}`}>{label}</label>
            </dt>
            <dd data-empty={!editing && shown(v) === "Not set" ? "" : undefined}>
              {editing ? (
                <input id={`pf-${k}`} value={v === "—" ? "" : v} placeholder="Not set" onChange={(e) => onChange({ [k]: e.target.value } as Partial<T>)} />
              ) : (
                shown(v)
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/** View / edit state over a store: Edit copies the value into a draft, Done saves it. */
export function useEdit<T>(value: T, save: (v: T) => void) {
  const [draft, setDraft] = useState<T | null>(null);
  return {
    editing: draft !== null,
    v: draft ?? value,
    set: (patch: Partial<T>) => setDraft((d) => ({ ...(d ?? value), ...patch })),
    toggle: () => {
      if (draft !== null) {
        save(draft);
        setDraft(null);
      } else setDraft(value);
    },
  };
}

/** The page's one solid action, full width, brand navy. */
export function PrimaryButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick?: () => void }) {
  return (
    <button className="pf-primary" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export function Empty({ title, line, children }: { title: string; line: string; children?: ReactNode }) {
  return (
    <div className="pf-empty">
      <b>{title}</b>
      <p>{line}</p>
      {children}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="pf-search">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
      <input value={value} placeholder={placeholder} aria-label={placeholder} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <button type="button" aria-label="Clear" onClick={() => onChange("")}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <path d="m9 9 6 6M15 9l-6 6" stroke="var(--v-card)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </label>
  );
}

export function Tick() {
  return (
    <svg className="pf-tick" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/** A short confirmation that floats up from the foot and leaves on its own. */
export function Toast({ text }: { text: string | null }) {
  return text ? (
    <div className="pf-toast" role="status">
      <Tick />
      {text}
    </div>
  ) : null;
}
