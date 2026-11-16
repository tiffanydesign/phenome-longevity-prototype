import { lazy, Suspense } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MEMBER_MODES, usePrefs, type MemberMode } from "@/lib/prefs";
import { EDITION, EDITION_LABEL } from "@/lib/edition";
import "./DevPanel.css";

/**
 * Prototype controls (desktop only, outside the phone). Not part of the original app.
 * Grouped by what they change: how the app looks, whose record it reads, and,
 * in the clinical edition, the states a screen can be in on a given day.
 */

/** The clinical edition's day-to-day switches, loaded only in that edition. */
const ScenarioControls = lazy(() => import("@/v3/demo/ScenarioControls").then((m) => ({ default: m.ScenarioControls })));

export const MEMBER_LABEL: Record<MemberMode, string> = { clinic: "Portal record", varied: "Mixed results", first: "First visit", risk: "High risk" };
export const MEMBER_NOTE: Record<MemberMode, string> = {
  clinic: "The clinic portal's real member, as the presentation shows them",
  varied: "Every status at least once; some readings improving, some worsening",
  first: "Only one clinic visit so far; slower omics still with the lab",
  risk: "Many readings out of range, several critical",
};

export function DevPanel() {
  const p = usePrefs();
  const nav = useNavigate();
  const loc = useLocation();
  return (
    <aside className="dp">
      <header>
        <h2 className="dp-title">Prototype · {EDITION_LABEL[EDITION]}</h2>
        <p className="dp-path">{loc.pathname}</p>
      </header>

      <section className="dp-group">
        <h3>Display</h3>
        <Toggle label="Appearance" value={p.theme} options={["light", "dark"]} labels={{ light: "Light", dark: "Dark" }} onChange={(theme) => p.set({ theme })} />
        <Toggle label="Connection" value={p.network} options={["online", "offline"]} labels={{ online: "Online", offline: "Offline" }} onChange={(network) => p.set({ network })} />
      </section>

      <section className="dp-group">
        <h3>Member</h3>
        <Toggle label="Sex" value={p.sex} options={["female", "male"]} labels={{ female: "Female", male: "Male" }} onChange={(sex) => p.set({ sex })} />
        <Toggle
          label="Health record"
          value={p.member}
          options={MEMBER_MODES}
          labels={MEMBER_LABEL}
          wrap
          onChange={(member) => {
            // the data is read once at load: save the choice first, then load the app again on it
            p.set({ member });
            window.setTimeout(() => window.location.reload(), 60);
          }}
        />
        <p className="dp-note">{MEMBER_NOTE[p.member]}</p>
      </section>

      {EDITION === "v3" && (
        <Suspense fallback={null}>
          <ScenarioControls />
        </Suspense>
      )}

      <button className="dp-link" onClick={() => nav("/__screens")}>
        All screens →
      </button>
    </aside>
  );
}

export function Toggle<T extends string>({
  label,
  value,
  options,
  labels,
  wrap,
  onChange,
}: {
  label: string;
  value: T | null;
  options: T[];
  labels?: Partial<Record<T, string>>;
  wrap?: boolean;
  onChange: (v: T) => void;
}) {
  return (
    <div className="dp-row">
      <span>{label}</span>
      <div className="dp-seg" data-wrap={wrap || undefined} role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o} role="radio" aria-checked={o === value} data-on={o === value || undefined} onClick={() => onChange(o)}>
            {labels?.[o] ?? o}
          </button>
        ))}
      </div>
    </div>
  );
}
