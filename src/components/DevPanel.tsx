import { useLocation, useNavigate } from "react-router-dom";
import { MEMBER_MODES, usePrefs, type MemberMode } from "@/lib/prefs";
import { EDITION, EDITION_LABEL } from "@/lib/edition";
import "./DevPanel.css";

/**
 * Prototype controls (desktop only, outside the phone). Not part of the original app.
 * Lets reviewers flip theme / network / the member's sex and jump to any screen. Demo data is URL-only now (?data=demo).
 * Member picks whose results v2 shows: the clinic portal's member, or a design scenario built from them.
 */

export const MEMBER_LABEL: Record<MemberMode, string> = { clinic: "clinic", varied: "varied", first: "1 visit", risk: "high risk" };
export const MEMBER_NOTE: Record<MemberMode, string> = {
  clinic: "The clinic portal's member, as the presentation shows them",
  varied: "Every status at least once, some readings improving, some worsening",
  first: "First visit only, slower omics still with the lab",
  risk: "Many readings out of range, several critical",
};
export function DevPanel() {
  const p = usePrefs();
  const nav = useNavigate();
  const loc = useLocation();
  return (
    <aside className="dp">
      <h2 className="dp-title">Prototype · {EDITION_LABEL[EDITION]}</h2>
      <p className="dp-path">{loc.pathname}</p>
      <Toggle label="Theme" value={p.theme} options={["light", "dark"]} onChange={(theme) => p.set({ theme })} />
      <Toggle label="Network" value={p.network} options={["online", "offline"]} onChange={(network) => p.set({ network })} />
      <Toggle label="Sex" value={p.sex} options={["female", "male"]} onChange={(sex) => p.set({ sex })} />
      <Toggle
        label="Member"
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
      <button className="dp-link" onClick={() => nav("/__screens")}>All screens →</button>
    </aside>
  );
}

export function Toggle<T extends string>({ label, value, options, labels, wrap, onChange }: { label: string; value: T; options: T[]; labels?: Record<T, string>; wrap?: boolean; onChange: (v: T) => void }) {
  return (
    <div className="dp-row">
      <span>{label}</span>
      <div className="dp-seg" data-wrap={wrap || undefined}>
        {options.map((o) => (
          <button key={o} data-on={o === value || undefined} onClick={() => onChange(o)}>
            {labels?.[o] ?? o}
          </button>
        ))}
      </div>
    </div>
  );
}
