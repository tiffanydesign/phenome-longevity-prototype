import { useNavigate } from "react-router-dom";
import { Chevron } from "../ui/icons";
import { STUDIES } from "./catalog";
import { viewOf } from "./panels";
import type { Tone } from "./parts";

export interface Reading {
  label: string;
  value?: string | number | null;
  unit?: string;
  /** The study that explains this reading; the reading opens it. */
  study: string;
}

export interface Area {
  name: string;
  meta?: string;
  readings: Reading[];
}

const has = (code: string) => STUDIES.some((s) => s.code === code);

/**
 * The visit at a glance, and the way into it. Each area is a band of readings;
 * every reading opens the study that explains it, and carries that study's
 * status as a small dot, so what needs a look is visible before anything is opened.
 */
export function AtThisVisit({ areas, visit }: { areas: Area[]; visit: number }) {
  const nav = useNavigate();
  return (
    <section className="rv-card rv-glance" aria-label="At this visit">
      <header className="rv-head">
        <h3>At this visit</h3>
      </header>
      {areas.map((a) => (
        <div key={a.name} className="rv-glance-area">
          <p className="rv-glance-name">
            {a.name}
            {a.meta && <span>{a.meta}</span>}
          </p>
          <div className="rv-glance-grid">
            {a.readings
              .filter((r) => r.value !== undefined && r.value !== null && r.value !== "")
              .map((r) => {
                const tone: Tone = has(r.study) ? (viewOf(r.study, visit).tone ?? "") : "";
                const flagged = tone === "mon" || tone === "alert";
                const body = (
                  <>
                    <span className="rv-glance-l">
                      {flagged && <i data-tone={tone} aria-label={tone === "alert" ? "To discuss" : "Worth a look"} />}
                      {r.label}
                      {has(r.study) && <Chevron size={12} />}
                    </span>
                    <b data-tone={flagged ? tone : undefined}>
                      {r.value}
                      {r.unit && <em>{r.unit}</em>}
                    </b>
                  </>
                );
                return has(r.study) ? (
                  <button key={r.label} className="rv-glance-r" onClick={() => nav(`/v3/study/${r.study}`, { replace: true })}>
                    {body}
                  </button>
                ) : (
                  <div key={r.label} className="rv-glance-r">
                    {body}
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </section>
  );
}
