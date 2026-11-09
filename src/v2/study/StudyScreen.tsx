import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

/** Where the member is in the review: one thin line, filled to the study in view. */
function Progress({ index }: { index: number }) {
  return (
    <span className="rv-path" aria-hidden>
      <i style={{ width: `${((index + 1) / STUDIES.length) * 100}%` }} />
    </span>
  );
}

/** The twin's display face, loaded for the review's study names only. */
const KIT = "https://use.typekit.net/omf6kcr.css";
function useDisplayFace() {
  useEffect(() => {
    if (document.querySelector(`link[href="${KIT}"]`)) return;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = KIT;
    document.head.appendChild(l);
  }, []);
}

/**
 * The clinic's presentation, rebuilt for one hand. On the wall the figure and
 * its panel sit side by side and a clinician drives; here the figure opens the
 * page, fades into the panel under it, and the whole page scrolls as one. The
 * member walks the same nineteen studies with a swipe on the figure or the bar.
 */
export function StudyScreen() {
  const { code } = useParams();
  const nav = useNavigate();
  const go = useGo();
  const index = studyIndex(code);
  const study = STUDIES[index];
  const [visit, setVisit] = useState(VISITS[VISITS.length - 1]);
  const [listOpen, setListOpen] = useState(false);
  const view = useMemo(() => viewOf(study.code, visit), [study.code, visit]);
  useDisplayFace();
  const page = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    page.current?.scrollTo({ top: 0 });
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

  const close = () => {
    // next, previous and list jumps replace, so one step back is where the review was opened
    if ((window.history.state?.idx ?? 0) > 0) nav(-1);
    else go("/v2/twin", { replace: true });
  };

  return (
    <div className="v2 rv">
      <StatusBar tone="dark" />
      <div className="rv-page" ref={page}>
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

        <section className="rv-body" aria-label={study.name}>
          <div className="rv-lead">
            {/* the study's name in the twin's display face; its section rides in the bar below */}
            <h2>{study.name}</h2>
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
        </section>
      </div>

      <header className="rv-top">
        <button aria-label="Close review" onClick={close}>
          <IconClose />
        </button>
        <span />
        <button className="rv-top-list" aria-label="All studies" onClick={() => setListOpen(true)}>
          <i />
          <i />
          <i />
        </button>
      </header>

      <div className="v2-nav">
        <nav className="rv-bar" aria-label="Studies">
          <button aria-label="Previous study" disabled={index === 0} onClick={() => step(-1)}>
            <Chevron dir="left" size={22} />
          </button>
          <button className="rv-bar-at" onClick={() => setListOpen(true)} aria-label={`Study ${index + 1} of ${STUDIES.length}: ${study.name}. Show all studies`}>
            <span className="rv-bar-text">
              <span className="rv-bar-row">
                {study.section !== "Baseline" && <span className="rv-section">{study.section}</span>}
                <b>{study.name}</b>
                <small>
                  {index + 1} / {STUDIES.length}
                </small>
              </span>
              <Progress index={index} />
            </span>
          </button>
          <button aria-label="Next study" disabled={index === STUDIES.length - 1} onClick={() => step(1)}>
            <Chevron size={22} />
          </button>
        </nav>
      </div>

      {listOpen && <StudyList at={index} visit={visit} onClose={() => setListOpen(false)} />}
      <HomeIndicator />
    </div>
  );
}
