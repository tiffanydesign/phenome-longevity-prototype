import { useNavigate } from "react-router-dom";
import { MEMBER_MODES, usePrefs } from "@/lib/prefs";
import { MEMBER_LABEL, MEMBER_NOTE, Toggle } from "./DevPanel";
import { EDITION, EDITION_LABEL, type Edition } from "@/lib/edition";
import "./Launcher.css";

/** Where a review on a phone can begin: this edition's front doors only. */
const ENTRIES: Record<Edition, { to: string; name: string; note: string }[]> = {
  original: [
    { to: "/home", name: "Home", note: "The app as captured from the phone" },
    { to: "/insights", name: "Insights", note: "Reports and clinical insights" },
    { to: "/store", name: "Store", note: "Tests and kits" },
    { to: "/profile", name: "Profile", note: "Account and settings" },
  ],
  v2: [
    { to: "/v2/home", name: "Home", note: "Today, your twin and every card" },
    { to: "/v2/twin", name: "Twin", note: "Your body in three lenses" },
    { to: "/v2/study/apose", name: "Full review", note: "The nineteen clinic studies, one by one" },
    { to: "/v2/omics", name: "Omics", note: "Genome to metabolome" },
  ],
  v3: [
    { to: "/v3/home", name: "Home", note: "Today, your twin and every card" },
    { to: "/v3/omics", name: "Omics", note: "Panels, reports and clinical insights" },
    { to: "/v3/visits", name: "Clinic visits", note: "Every clinic reading, two visits side by side" },
    { to: "/v3/twin", name: "Twin", note: "Your body in three lenses" },
  ],
};

/**
 * The prototype's front page on a phone. A phone has no room for the desktop's
 * side panel, so its settings come first, here, and then the app takes the
 * whole screen. Three quick taps on the status bar bring this page back.
 */
export function Launcher({ onStart }: { onStart: () => void }) {
  const p = usePrefs();
  const nav = useNavigate();

  const start = (to: string) => {
    // a real full screen where the browser allows one (Android); elsewhere the app simply fills the page
    document.documentElement.requestFullscreen?.().catch(() => undefined);
    nav(to);
    onStart();
  };

  return (
    <div className="ln">
      <header className="ln-head">
        <p className="ln-kicker">Phenome prototype · {EDITION_LABEL[EDITION]}</p>
        <h1>Where would you like to start?</h1>
      </header>

      <nav className="ln-entries" aria-label="Start at">
        {ENTRIES[EDITION].map((e) => (
          <button key={e.to} onClick={() => start(e.to)}>
            <span>
              <b>{e.name}</b>
              <small>{e.note}</small>
            </span>
            <i aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </i>
          </button>
        ))}
      </nav>

      <section className="ln-settings" aria-label="Prototype settings">
        <h2>Settings</h2>
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
        <p className="ln-note">{MEMBER_NOTE[p.member]}</p>
        <Toggle label="Appearance" value={p.theme} options={["light", "dark"]} labels={{ light: "Light", dark: "Dark" }} onChange={(theme) => p.set({ theme })} />
      </section>

      <p className="ln-hint">In the app, tap the status bar three times to come back here.</p>
    </div>
  );
}
