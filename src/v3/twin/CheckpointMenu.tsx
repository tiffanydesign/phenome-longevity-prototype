import { useEffect, useRef, useState } from "react";
import { Chevron } from "../ui/icons";
import { CHECKPOINTS, clinicShort, HAS_TRENDS, type View } from "./checkpoints";

function IconTrend({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17l5.5-5.5 4 4L21 7" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

const same = (a: View, b: View) => a.kind === b.kind && (a.kind !== "visit" || (b.kind === "visit" && a.visit === b.visit));

/**
 * The view switcher at the top right. Closed, it names what is on screen; open,
 * it lists Live first, then every visit newest first, then Trends on its own
 * beneath a rule, so Trends reads as the end of the list rather than one more visit.
 */
export function CheckpointMenu({ view, onPick }: { view: View; onPick: (v: View) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const pick = (v: View) => {
    setOpen(false);
    if (!same(v, view)) onPick(v);
  };

  const label = view.kind === "live" ? "Live" : view.kind === "trends" ? "Trends" : `Visit ${view.visit}`;

  return (
    <div className="tw-cp" ref={root} data-view={view.kind}>
      <button className="tw-cp-btn" aria-haspopup="menu" aria-expanded={open} aria-label={`Showing ${label}. Change view`} onClick={() => setOpen(!open)}>
        {view.kind === "live" && <i className="tw-cp-live" aria-hidden />}
        {view.kind === "trends" && <IconTrend size={16} />}
        <span>{label}</span>
        <Chevron dir="down" size={14} />
      </button>

      {open && (
        <div className="tw-cp-menu" role="menu" aria-label="Twin view">
          <button role="menuitemradio" aria-checked={view.kind === "live"} className="tw-cp-item" onClick={() => pick({ kind: "live" })}>
            <span className="tw-cp-lead" data-kind="live">
              <i className="tw-cp-live" />
            </span>
            <span className="tw-cp-text">
              <b>Live</b>
              <small>Updates as your devices sync</small>
            </span>
            {view.kind === "live" && <IconCheck />}
          </button>

          <p className="tw-cp-head">Clinic visits</p>
          {CHECKPOINTS.map((c, i) => {
            const on = view.kind === "visit" && view.visit === c.visit;
            return (
              <button key={c.visit} role="menuitemradio" aria-checked={on} className="tw-cp-item" onClick={() => pick({ kind: "visit", visit: c.visit })}>
                <span className="tw-cp-lead" data-kind="visit">
                  {c.visit}
                </span>
                <span className="tw-cp-text">
                  <b>
                    Visit {c.visit}
                    {i === 0 && <em>Latest</em>}
                  </b>
                  <small>
                    {c.date} · {clinicShort(c.clinic)}
                  </small>
                </span>
                {on && <IconCheck />}
              </button>
            );
          })}

          <div className="tw-cp-rule" role="separator" />
          <button role="menuitemradio" aria-checked={view.kind === "trends"} className="tw-cp-item tw-cp-trends" disabled={!HAS_TRENDS} onClick={() => pick({ kind: "trends" })}>
            <span className="tw-cp-lead" data-kind="trends">
              <IconTrend />
            </span>
            <span className="tw-cp-text">
              <b>Trends</b>
              <small>{HAS_TRENDS ? `Charts across all ${CHECKPOINTS.length} visits` : "After your second visit"}</small>
            </span>
            {view.kind === "trends" ? <IconCheck /> : <Chevron size={16} />}
          </button>
        </div>
      )}
    </div>
  );
}
