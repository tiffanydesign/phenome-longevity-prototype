import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Icon } from "@/components/Icon";
import { HomeIndicator, StatusBar } from "@/components/PhoneFrame";
import { asset } from "@/lib/asset";
import { Chevron, IconClose } from "../ui/icons";
import { useGo } from "../ui/shell";
import "../v2.css";
import { STUDIES, studyIndex } from "./catalog";
import { Hero, viewOf, visitDate, VISITS, VisitTrend } from "./panels";
import { Pill } from "./parts";
import { StudyList } from "./StudyList";
import "./study.css";

type Snap = "peek" | "full";
const SWIPE = 48;

/** The room display's own camera flight, recorded, so a phone gets it without a WebGL scene. */
function StudyFilm({ code }: { code: string }) {
  const [ready, setReady] = useState(false);
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches || code === "apose";
  const poster = asset(`twin/study/${code}.webp`);
  useEffect(() => setReady(false), [code]);
  return (
    <div className="rv-film">
      <img src={poster} alt="" data-on={still || !ready ? "" : undefined} />
      {!still && (
        <video key={code} src={asset(`twin/study/${code}.mp4`)} muted playsInline autoPlay preload="auto" onPlaying={() => setReady(true)} aria-hidden />
      )}
    </div>
  );
}

/**
 * The clinic's presentation, rebuilt for one hand. On the wall the figure and
 * its panel sit side by side and a clinician drives; here the figure takes the
 * top of the screen, the panel is a sheet under it, and the member walks the
 * same nineteen studies with a swipe.
 */
export function StudyScreen() {
  const { code } = useParams();
  const nav = useNavigate();
  const go = useGo();
  const index = studyIndex(code);
  const study = STUDIES[index];
  const [visit, setVisit] = useState(VISITS[VISITS.length - 1]);
  const [listOpen, setListOpen] = useState(false);
  const [snap, setSnap] = useState<Snap>("peek");
  const [drag, setDrag] = useState<number | null>(null);
  const view = useMemo(() => viewOf(study.code, visit), [study.code, visit]);
  const root = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(853);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const grab = useRef({ y: 0, top: 0, moved: false });
  const dragged = useRef<number | null>(null);

  useLayoutEffect(() => setHeight(root.current?.clientHeight ?? 853), []);
  useEffect(() => {
    setSnap("peek");
    body.current?.scrollTo({ top: 0 });
  }, [study.code]);

  const step = (d: number) => {
    const next = STUDIES[index + d];
    if (next) nav(`/v2/study/${next.code}`, { replace: true });
  };

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  const tops: Record<Snap, number> = { peek: Math.round(height * 0.59), full: 104 };
  const top = drag ?? tops[snap];
  const grabDown = (e: PointerEvent<HTMLElement>) => {
    grab.current = { y: e.clientY, top: tops[snap], moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const grabMove = (e: PointerEvent<HTMLElement>) => {
    if (!e.buttons) return;
    const dy = e.clientY - grab.current.y;
    if (Math.abs(dy) > 4) grab.current.moved = true;
    if (grab.current.moved) {
      dragged.current = Math.max(tops.full, Math.min(tops.peek + 40, grab.current.top + dy));
      setDrag(dragged.current);
    }
  };
  const grabUp = () => {
    // read from the ref: a fast flick can lift before the last move has rendered
    const at = dragged.current;
    dragged.current = null;
    if (at === null) {
      if (!grab.current.moved) setSnap(snap === "peek" ? "full" : "peek");
      return;
    }
    setSnap(at < (tops.full + tops.peek) / 2 ? "full" : "peek");
    setDrag(null);
  };
  const close = () => {
    // next, previous and list jumps replace, so one step back is where the review was opened
    if ((window.history.state?.idx ?? 0) > 0) nav(-1);
    else go("/v2/twin", { replace: true });
  };

  return (
    <div className="v2 rv" ref={root}>
      <StatusBar tone="dark" />
      <div
        className="rv-stage"
        onPointerDown={(e) => {
          swipe.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const start = swipe.current;
          swipe.current = null;
          if (!start) return;
          const dx = e.clientX - start.x;
          if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(e.clientY - start.y)) step(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          swipe.current = null;
        }}
      >
        <StudyFilm code={study.code} />
      </div>

      <header className="rv-top">
        <button aria-label="Close review" onClick={close}>
          <IconClose />
        </button>
        <span>{study.section}</span>
        <button className="rv-top-list" aria-label="All studies" onClick={() => setListOpen(true)}>
          <i />
          <i />
          <i />
        </button>
      </header>

      <section className="rv-sheet" data-drag={drag !== null ? "" : undefined} style={{ transform: `translateY(${top}px)`, "--tail": `${top - tops.full}px` } as React.CSSProperties} aria-label={study.name}>
        <div className="rv-grab" onPointerDown={grabDown} onPointerMove={grabMove} onPointerUp={grabUp} onPointerCancel={grabUp}>
          <i aria-hidden />
        </div>
        <div className="rv-body" ref={body}>
          <div className="rv-lead">
            <h2>{study.name}</h2>
            <p className="rv-lead-note">{study.note}</p>
            <div className="rv-lead-row">
              <div>
                <Hero value={view.value} unit={view.unit} flagged={view.flagged} />
                {view.label && <p className="rv-lead-label">{view.label}</p>}
              </div>
              {view.trend && <VisitTrend values={view.trend} at={view.at ?? 0} />}
            </div>
            {view.status && <Pill tone={view.tone ?? ""}>{view.status}</Pill>}
          </div>

          {view.single ? (
            <p className="rv-when">Recorded once, {view.single}</p>
          ) : (
            <div className="rv-visits" role="tablist" aria-label="Visit">
              {VISITS.map((v) => (
                <button key={v} role="tab" aria-selected={v === visit} onClick={() => setVisit(v)}>
                  Visit {v}
                </button>
              ))}
              <span>{visitDate(visit)}</span>
            </div>
          )}

          {view.cards}
        </div>
      </section>

      <div className="v2-nav">
        <nav className="rv-bar" aria-label="Studies">
          <button aria-label="Previous study" disabled={index === 0} onClick={() => step(-1)}>
            <Chevron dir="left" size={22} />
          </button>
          <button className="rv-bar-at" onClick={() => setListOpen(true)}>
            <b>
              {String(index + 1).padStart(2, "0")} <small>/ {STUDIES.length}</small>
            </b>
            <span className="rv-ticks-bar" aria-hidden>
              {STUDIES.map((s, i) => (
                <i key={s.code} data-on={i <= index ? "" : undefined} data-gap={i > 0 && STUDIES[i - 1].section !== s.section ? "" : undefined} />
              ))}
            </span>
          </button>
          <button aria-label="Next study" disabled={index === STUDIES.length - 1} onClick={() => step(1)}>
            <Chevron size={22} />
          </button>
        </nav>
        <button className="v2-nav-ai" aria-label="Ask Longevity AI about this study" onClick={() => go(`/v2/assistant?ask=${encodeURIComponent(`Explain my ${study.name.toLowerCase()} results`)}`)}>
          <Icon name="Nav_LongevityAI" size={26} />
        </button>
      </div>

      {listOpen && <StudyList at={index} visit={visit} onClose={() => setListOpen(false)} />}
      <HomeIndicator />
    </div>
  );
}
