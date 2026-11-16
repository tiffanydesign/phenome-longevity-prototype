import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HomeIndicator, StatusBar } from "@/components/PhoneFrame";
import { asset } from "@/lib/asset";
import { usePrefs } from "@/lib/prefs";
import { Chevron, IconClose } from "../ui/icons";
import { useGo } from "../ui/shell";
import { useDisplayFace } from "../ui/displayFace";
import "../v2.css";
import { STUDIES, studyIndex } from "./catalog";
import { Hero, viewOf, VISITS } from "./panels";
import { AcrossVisits, VisitMenu } from "./reviewChrome";
import { Pill } from "./parts";
import { StudyList } from "./StudyList";
import "./study.css";

const SWIPE = 48;

/*
 * Night ink for the films: each pixel's luminance picks a colour from this ramp.
 * The footage is pale shaded organs on a pale sky of nearly the same value, so the
 * sky's narrow band maps to the night ground, and both directions away from it
 * light up: the shaded fills and contours rise to a soft blue, the highlights to
 * a dimmer one. An organ then reads by its whole surface, not by its outline alone.
 */
const NIGHT: [number, string][] = [
  [0, "#c9dbf0"],
  [0.5, "#b3cdec"],
  [0.7, "#8ab3e0"],
  [0.8, "#6797cf"],
  [0.855, "#41689a"],
  [0.885, "#1c2b47"],
  [0.9, "#101827"],
  [0.94, "#101827"],
  [0.96, "#2c446b"],
  [0.98, "#5a7fb2"],
  [1, "#86aad8"],
];
/* the films are exposed brighter than their stills: the sky sits at the very top of the range, so the ramp climbs from there */
const NIGHT_FILM: [number, string][] = [
  [0, "#c9dbf0"],
  [0.6, "#b3cdec"],
  [0.8, "#8ab3e0"],
  [0.9, "#6f9fd4"],
  [0.94, "#4a74a8"],
  [0.962, "#2e4a74"],
  [0.976, "#1a2843"],
  [0.986, "#101827"],
  [1, "#101827"],
];

function tableOf(ramp: [number, string][]): string[] {
  const n = 128;
  const ch: number[][] = [[], [], []];
  for (let k = 0; k < n; k++) {
    const x = k / (n - 1);
    const j = Math.max(0, ramp.findIndex(([at]) => at >= x) - 1);
    const [a, ca] = ramp[j];
    const [b, cb] = ramp[Math.min(j + 1, ramp.length - 1)];
    const t = b > a ? Math.min(1, Math.max(0, (x - a) / (b - a))) : 0;
    for (let c = 0; c < 3; c++) {
      const va = parseInt(ca.slice(1 + c * 2, 3 + c * 2), 16);
      const vb = parseInt(cb.slice(1 + c * 2, 3 + c * 2), 16);
      ch[c].push((va + (vb - va) * t) / 255);
    }
  }
  return ch.map((v) => v.map((x) => x.toFixed(3)).join(" "));
}
const TABLES = { "rv-night": tableOf(NIGHT), "rv-night-film": tableOf(NIGHT_FILM) };

/** The filter the night palette applies to the film; it does nothing until the CSS asks for it. */
function NightInk() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      {Object.entries(TABLES).map(([id, t]) => (
        <filter key={id} id={id} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={t[0]} />
            <feFuncG type="table" tableValues={t[1]} />
            <feFuncB type="table" tableValues={t[2]} />
          </feComponentTransfer>
        </filter>
      ))}
    </svg>
  );
}

/** The room display's own camera flight, recorded, so a phone gets it without a WebGL scene. */
function StudyFilm({ code }: { code: string }) {
  const [ready, setReady] = useState(false);
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches || code === "apose";
  const poster = asset(`twin/study/${code}.webp`);
  useEffect(() => setReady(false), [code]);
  return (
    <div className="rv-film">
      <NightInk />
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

/**
 * The clinic's presentation, rebuilt for one hand. On the wall the figure and
 * its panel sit side by side and a clinician drives; here the figure opens the
 * page, fades into the panel under it, and the whole page scrolls as one. The
 * member walks the same nineteen studies with a swipe on the figure or the bar.
 */
export function StudyScreen() {
  useDisplayFace();
  const { theme } = usePrefs();
  const { code } = useParams();
  const nav = useNavigate();
  const go = useGo();
  const index = studyIndex(code);
  const study = STUDIES[index];
  const [visit, setVisit] = useState(VISITS[VISITS.length - 1]);
  const [listOpen, setListOpen] = useState(false);
  const view = useMemo(() => viewOf(study.code, visit), [study.code, visit]);
  const page = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    page.current?.scrollTo({ top: 0 });
  }, [study.code]);

  // another visit: the page reads from it, back at its top
  const pickVisit = (v: number) => {
    setVisit(v);
    page.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const step = (d: number) => {
    const next = STUDIES[index + d];
    if (next) nav(`/v3/study/${next.code}`, { replace: true });
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
    else go("/v3/twin", { replace: true });
  };

  return (
    <div className="v2 rv">
      <StatusBar tone={theme === "dark" ? "light" : "dark"} fixed />
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
            {/* the study's name in the twin's display face; the visit it reads from sits at the top right */}
            <h2>{study.name}</h2>
            <Hero value={view.value} unit={view.unit} flagged={view.flagged} />
            {view.label && <p className="rv-lead-label">{view.label}</p>}
            {view.status && <Pill tone={view.tone ?? ""}>{view.status}</Pill>}
          </div>

          {view.single && <p className="rv-when">Recorded once, {view.single}</p>}

          {view.cards}

          <AcrossVisits code={study.code} visit={visit} onPick={pickVisit} />
        </section>
      </div>

      <header className="rv-top">
        <button aria-label="Close review" onClick={close}>
          <IconClose />
        </button>
        <VisitMenu visit={visit} onPick={pickVisit} />
      </header>

      <div className="v2-nav">
        <nav className="rv-bar" aria-label="Studies">
          <button aria-label="Previous study" disabled={index === 0} onClick={() => step(-1)}>
            <Chevron dir="left" size={22} />
          </button>
          {/* the study's name over where the review stands; the contents mark at the end opens the list of every study */}
          <button className="rv-bar-at" aria-haspopup="dialog" onClick={() => setListOpen(true)} aria-label={`Study ${index + 1} of ${STUDIES.length}: ${study.name}. Show contents`}>
            <span className="rv-bar-text">
              <span className="rv-bar-row">
                <b>{study.name}</b>
              </span>
              <span className="rv-bar-row rv-bar-prog">
                <Progress index={index} />
                <small>
                  {index + 1} / {STUDIES.length}
                </small>
              </span>
            </span>
            <span className="rv-bar-toc" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="5" cy="6.5" r="1.4" fill="currentColor" stroke="none" />
                <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
                <circle cx="5" cy="17.5" r="1.4" fill="currentColor" stroke="none" />
                <path d="M9.5 6.5H19M9.5 12H19M9.5 17.5h6" />
              </svg>
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
