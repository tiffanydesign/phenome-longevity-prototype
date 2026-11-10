import { useNavigate } from "react-router-dom";
import { asset } from "@/lib/asset";
import { Chevron, IconClose } from "../ui/icons";
import { Num } from "../ui/Num";
import { SECTIONS, STUDIES } from "./catalog";
import { viewOf, visitDate, VISITS } from "./panels";

/** The presentation's library: the visit it reads from, then the same four sections, each study with its result on the row. */
export function StudyList({ at, visit, onVisit, onClose }: { at: number; visit: number; onVisit: (v: number) => void; onClose: () => void }) {
  const nav = useNavigate();
  return (
    <div className="rv-list" role="dialog" aria-label="All studies">
      <header>
        <h2>Your review</h2>
        <button aria-label="Close" onClick={onClose}>
          <IconClose />
        </button>
      </header>
      <div className="rv-list-visits" role="radiogroup" aria-label="Visit">
        {[...VISITS].reverse().map((v) => (
          <button key={v} role="radio" aria-checked={v === visit} onClick={() => onVisit(v)}>
            <b>Visit {v}</b>
            <small>{visitDate(v)}</small>
          </button>
        ))}
      </div>
      <div className="rv-list-body">
        {SECTIONS.map((section) => (
          <section key={section}>
            <h3>{section}</h3>
            {STUDIES.map((s, i) => {
              if (s.section !== section) return null;
              const view = viewOf(s.code, visit);
              return (
                <button
                  key={s.code}
                  aria-current={i === at ? "true" : undefined}
                  onClick={() => {
                    onClose();
                    nav(`/v3/study/${s.code}`, { replace: true });
                  }}
                >
                  <img src={asset(`twin/study/${s.code}.webp`)} alt="" loading="lazy" />
                  <span className="rv-list-n">
                    {s.name}
                    {view.status && <small data-tone={view.tone}>{view.status}</small>}
                  </span>
                  <span className="rv-list-v">
                    <b>
                      <Num v={view.value} />
                    </b>{" "}
                    {view.unit}
                  </span>
                  <Chevron size={15} />
                </button>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
