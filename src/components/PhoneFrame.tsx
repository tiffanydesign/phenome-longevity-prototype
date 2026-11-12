import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePrefs } from "@/lib/prefs";
import { EDITION } from "@/lib/edition";
import { DevPanel } from "./DevPanel";
import { Launcher } from "./Launcher";
import "./PhoneFrame.css";

/**
 * Device chrome. Desktop: a centred 394×853 phone shell. Phones (≤ 500px wide):
 * full-bleed; the drawn status bar is kept (owner's choice) but pushed below the
 * real OS bar via safe-area insets, and the drawn gesture handle is hidden. On a
 * phone the prototype opens on its launcher (entry and settings) first, once per
 * session, then the app fills the screen.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const phone = useIsPhone();
  const [launched, setLaunched] = useState(() => readLaunched());
  const taps = useRef<number[]>([]);

  const start = () => {
    setLaunched(true);
    try {
      sessionStorage.setItem(LAUNCHED, "1");
    } catch {
      /* storage blocked: the launcher returns on the next load */
    }
  };

  // three quick taps on the status strip bring the prototype's front page back
  const tapStatus = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 700), now];
    if (taps.current.length < 3) return;
    taps.current = [];
    setLaunched(false);
    try {
      sessionStorage.removeItem(LAUNCHED);
    } catch {
      /* nothing stored */
    }
  };

  return (
    <div className="pf-stage">
      <div className="pf-device">
        <div className="pf-screen">{children}</div>
        {phone && launched && <button className="pf-status-hit" aria-label="Prototype settings" onClick={tapStatus} />}
      </div>
      <DevPanel />
      {phone && !launched && <Launcher onStart={start} />}
    </div>
  );
}

const LAUNCHED = `phenome.launched.${EDITION}`;

function readLaunched(): boolean {
  try {
    return sessionStorage.getItem(LAUNCHED) === "1";
  } catch {
    return false;
  }
}

/** A real phone, by width: the frame is already full-bleed there, and the side panel hidden. */
function useIsPhone(): boolean {
  const q = "(max-width: 500px)";
  const [on, setOn] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const f = () => setOn(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return on;
}

/** Android status bar as captured on the POCO X8 Pro Max (HyperOS 4). */
export function StatusBar({ tone = "dark", fixed }: { tone?: "dark" | "light"; fixed?: boolean }) {
  const { theme } = usePrefs();
  const time = useClock();
  // The app paints white status icons on Home / Capacity / Habit detail even in light mode
  // (clock invisible on white) — reproduced on purpose; dark theme makes them visible.
  // fixed: the screen keeps its own ground whatever the theme (the study review stays light)
  const fg = tone === "light" || (theme === "dark" && !fixed) ? "#ffffff" : "#3a3a3a";
  return (
    <div className="pf-status" style={{ color: fg }} aria-hidden>
      <span className="pf-time">{time}</span>
      <span className="pf-notif">
        <svg width="11" height="10" viewBox="0 0 11 10">
          <path d="M5.5 0C2.5 0 0 1.8 0 4.1c0 1.3.8 2.5 2.1 3.2L1.6 10l3-1.9h.9c3 0 5.5-1.8 5.5-4C11 1.8 8.5 0 5.5 0z" fill="currentColor" />
        </svg>
        <span className="pf-dots">···</span>
      </span>
      <span className="pf-right">
        <svg width="16" height="12" viewBox="0 0 16 12">
          <rect x="0" y="8" width="3" height="4" rx="0.6" fill="currentColor" />
          <rect x="4.3" y="5.5" width="3" height="6.5" rx="0.6" fill="currentColor" />
          <rect x="8.6" y="3" width="3" height="9" rx="0.6" fill="currentColor" />
          <rect x="12.9" y="0" width="3" height="12" rx="0.6" fill="currentColor" opacity="0.45" />
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12">
          <path d="M7.5 11.5 4.6 8.4a4.2 4.2 0 0 1 5.8 0z" fill="currentColor" />
          <path d="M2.3 6.1a7.4 7.4 0 0 1 10.4 0l-1.3 1.3a5.6 5.6 0 0 0-7.8 0z" fill="currentColor" />
          <path d="M0 3.8a10.6 10.6 0 0 1 15 0l-1.2 1.2a8.9 8.9 0 0 0-12.6 0z" fill="currentColor" opacity="0.45" />
          <text x="13.2" y="12" fontSize="5.5" fontWeight="700" fill="currentColor">6</text>
        </svg>
        <span className="pf-battery">90</span>
        <svg width="6" height="11" viewBox="0 0 6 11">
          <path d="M3.6 0 0 6.3h2.4L1.8 11 6 4.4H3.4z" fill="currentColor" />
        </svg>
      </span>
    </div>
  );
}

export function HomeIndicator() {
  return <div className="pf-home-ind" aria-hidden />;
}

function useClock(): string {
  const fmt = () => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const [t, setT] = useState(fmt);
  useEffect(() => {
    const id = window.setInterval(() => setT(fmt()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return t;
}
