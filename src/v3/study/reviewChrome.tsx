import { useEffect, useRef, useState } from "react";
import { Chevron } from "../ui/icons";
import { Num } from "../ui/Num";
import { CHECKPOINTS, clinicShort } from "../twin/checkpoints";
import { visitDate, VISITS, viewOf } from "./panels";

function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/** "1 Aug 2026" → "1 Aug 26", for the narrow columns. */
const short = (d: string) => d.replace(/ 20(\d\d)$/, " ’$1");

/**
 * The visit the review reads from, at the top right: closed it names the visit
 * and its date; open it lists every visit newest first, the way the twin's own
 * switcher does.
 */
export function VisitMenu({ visit, onPick }: { visit: number; onPick: (v: number) => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="rv-vm" ref={root}>
      <button className="rv-vm-btn" aria-haspopup="menu" aria-expanded={open} aria-label={`Reading visit ${visit}, ${visitDate(visit)}. Change visit`} onClick={() => setOpen(!open)}>
        <span>
          <b>Visit {visit}</b>
          <small>{visitDate(visit)}</small>
        </span>
        <Chevron dir="down" size={14} />
      </button>
      {open && (
        <div className="rv-vm-menu" role="menu" aria-label="Visit">
          <p className="rv-vm-head">Read this review from</p>
          {CHECKPOINTS.map((c, i) => (
            <button
              key={c.visit}
              role="menuitemradio"
              aria-checked={c.visit === visit}
              className="rv-vm-item"
              onClick={() => {
                setOpen(false);
                onPick(c.visit);
              }}
            >
              <span className="rv-vm-lead">{c.visit}</span>
              <span className="rv-vm-text">
                <b>
                  Visit {c.visit}
                  {i === 0 && <em>Latest</em>}
                </b>
                <small>
                  {c.date} · {clinicShort(c.clinic)}
                </small>
              </span>
              {c.visit === visit && <IconCheck />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** The change from one reading to the next as a signed percentage: "+2.1%", "−1.9%", "0%". */
function pct(from: number, to: number): string | null {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === 0) return null;
  const d = ((to - from) / Math.abs(from)) * 100;
  const txt = Math.abs(d) < 10 ? Math.abs(d).toFixed(1) : String(Math.round(Math.abs(d)));
  if (Number(txt) === 0) return "0%";
  return `${d > 0 ? "+" : "−"}${txt}%`;
}

/**
 * Every visit's reading for this study at the foot of its page: the shape as a
 * line, then one column per visit with its date and value. The visit in view is
 * marked; tapping another reads the page from that visit.
 */
export function AcrossVisits({ code, visit, onPick }: { code: string; visit: number; onPick: (v: number) => void }) {
  const here = viewOf(code, visit);
  if (here.single || !here.trend || here.trend.length < 2) return null;
  const values = here.trend;
  const visits = VISITS.slice(-values.length);
  const views = visits.map((v) => viewOf(code, v));
  const at = Math.max(0, visits.indexOf(visit));

  const lo = Math.min(...values);
  const hi = Math.max(...values);
  // the plot leaves room above each point for its percentage
  const W = 300;
  const H = 92;
  const TOP = 30;
  const BOTTOM = 10;
  const x = (i: number) => ((i + 0.5) / values.length) * W;
  const y = (v: number) => (hi === lo ? (TOP + H - BOTTOM) / 2 : H - BOTTOM - ((v - lo) / (hi - lo)) * (H - TOP - BOTTOM));
  const pts = values.map((v, i) => [x(i), y(v)] as const);
  const line = pts.map(([px, py]) => `${px},${py}`).join(" ");
  const area = `${pts[0][0]},${H} ${line} ${pts[pts.length - 1][0]},${H}`;
  const total = pct(values[0], values[values.length - 1]);

  return (
    <section className="rv-card rv-across" aria-label="Across your visits">
      <header className="rv-head">
        <h3>Across your visits</h3>
        <small>{[here.label, here.unit].filter(Boolean).join(" · ")}</small>
      </header>
      {total && (
        <p className="rv-across-sum">
          <b>{total}</b> since Visit {visits[0]}
        </p>
      )}
      {/* line and points share one box, so each point sits exactly on the line */}
      <div className="rv-across-plot" style={{ height: H }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
          <polygon points={area} fill="#a9b5d9" opacity="0.14" />
          <polyline points={line} fill="none" stroke="#a9b5d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="rv-across-dots" aria-hidden>
          {values.map((v, i) => {
            const change = i > 0 ? pct(values[i - 1], v) : null;
            return (
              <span key={i} className="rv-across-pt" data-on={i === at ? "" : undefined} data-tone={views[i].tone} style={{ left: `${(x(i) / W) * 100}%`, top: `${(y(v) / H) * 100}%` }}>
                <i />
                {change && <em>{change}</em>}
              </span>
            );
          })}
        </div>
      </div>
      <div className="rv-across-cols" role="radiogroup" aria-label="Visit">
        {visits.map((v, i) => (
          <button key={v} role="radio" aria-checked={v === visit} data-tone={views[i].tone} onClick={() => onPick(v)}>
            <small>Visit {v}</small>
            <b>
              <Num v={views[i].value} />
            </b>
            <span>{short(visitDate(v))}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
