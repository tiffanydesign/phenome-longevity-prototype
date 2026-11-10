import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGo, V2Screen } from "../ui/shell";
import { Chevron } from "../ui/icons";
import { Num } from "../ui/Num";
import { TwinField } from "./TwinField";
import { COLS, ROWS, type Tint } from "./field";
import { TwinDetail } from "./TwinDetail";
import { TwinTrends } from "./TwinTrends";
import { TwinOverview } from "./TwinOverview";
import { IconTwin } from "../ui/icons";
import { CheckpointMenu } from "./CheckpointMenu";
import { atParam, CHECKPOINTS, clinicShort, viewFrom, type View } from "./checkpoints";
import { IconLensBody, IconLensOmics, IconLensVitals } from "../ui/icons";
import { LATEST, LENS_LABEL, LENS_ORDER, lensStatus, PINS, readingOf, REGIONS, regionsOf, toneOf, type Lens, type Pin, type Region } from "./regions";
import { useDisplayFace } from "../ui/displayFace";
import "./twin.css";

const FIELD_W = 393;
const FIELD_H = (FIELD_W / COLS) * ROWS;
const MONITOR = "#ffb600";
const ALERT = "#c4572e";
const LIVE = "#263980";
const PAST = "#6b7799";

/** A region in the colour of its study's status at a visit: gold to monitor, the portal's red to discuss. */
const colourOf = (r: Region, visit: number, past: boolean) => {
  const tone = toneOf(readingOf(r.id, visit));
  return tone === "alert" ? ALERT : tone === "mon" ? MONITOR : past ? PAST : LIVE;
};
const flagged = (r: Region, visit: number) => {
  const tone = toneOf(readingOf(r.id, visit));
  return tone === "alert" || tone === "mon";
};

/**
 * What each lens paints on the figure: its organs. A study of the whole body paints
 * nothing, since its reach is wider than the figure; its pin and row carry its status.
 */
function lensTints(lens: Lens, visit: number, past: boolean): Tint[] {
  return regionsOf(lens)
    .filter((organ) => !organ.whole)
    .map((organ) => ({ organ, color: colourOf(organ, visit, past), strength: flagged(organ, visit) ? 1 : 0.5 }));
}

const NO_TINTS: Tint[] = [];

const LENS_ICON: Record<Lens, (p: { size?: number }) => JSX.Element> = { vitals: IconLensVitals, body: IconLensBody, omics: IconLensOmics };

/**
 * The twin as a destination. One figure, three lenses that are the clinic
 * presentation's own sections, and every region one of its studies. Selecting a
 * region regrows the dots into it and the study's readings follow under it, so
 * the member moves from body to number without changing place.
 */
export function TwinScreen() {
  useDisplayFace();
  const [params, setParams] = useSearchParams();
  const go = useGo();
  const back = useNavigate();
  const asked = params.get("lens") as Lens | null;
  // no lens asked for: the twin opens on its overview
  const overview = !(asked && LENS_ORDER.includes(asked));
  const lens: Lens = overview ? "vitals" : (asked as Lens);
  const organId = params.get("organ");
  const view = viewFrom(params.get("at"));
  const trends = view.kind === "trends";
  // live and a checkpoint read the same studies; live reads them at the newest visit
  const visit = view.kind === "visit" ? view.visit : LATEST;
  const past = view.kind === "visit";
  const organ: Region | null = organId && !trends ? REGIONS[organId] ?? null : null;

  /** the URL for a lens, an organ and a view; the view rides along whatever else changes */
  const query = useCallback((l: Lens | null, id: string | null, v: View) => {
    const next = new URLSearchParams(l ? { lens: l } : {});
    if (id) next.set("organ", id);
    const at = atParam(v);
    if (at) next.set("at", at);
    return next;
  }, []);

  const select = useCallback(
    (id: string | null) => setParams(query(lens, id, view), { replace: organ !== null && id !== null }),
    [lens, organ, view, query, setParams],
  );

  // switching view keeps the lens; trends has no figure to hold an organ open on
  const pickView = (v: View) => setParams(query(overview ? null : lens, v.kind === "trends" ? null : organId, v), { replace: true });

  const tints = useMemo(() => {
    if (organ) return organ.map === "body" && !organ.whole ? [{ organ, color: colourOf(organ, visit, past), strength: 1 }] : NO_TINTS;
    return lensTints(lens, visit, past);
  }, [lens, organ, visit, past]);
  const checkpoint = CHECKPOINTS.find((c) => c.visit === visit);

  // the figure is drawn for a 393 screen; a real phone scales it to its own width
  const root = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  const [scrolled, setScrolled] = useState(false);
  useLayoutEffect(() => {
    const w = root.current?.clientWidth ?? FIELD_W;
    setFit(Math.min(1.12, w / FIELD_W));
  }, []);

  // opening or closing an organ regrows the figure: bring it back into view, its readings follow under it
  useEffect(() => {
    root.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [organId]);


  // every view with a figure opens on its sky, from the status bar down to the figure's title
  const sky = !trends;

  return (
    <V2Screen nav={false}>
      <div className="v2-veil tw-veil" data-at="status" data-on={scrolled ? "" : undefined} data-sky={sky ? (past ? "past" : "") : undefined} aria-hidden />
      <div className="tw" ref={root} data-sky={sky ? (past ? "past" : "") : undefined} data-one={overview && !trends ? "" : undefined} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}>
        <header className="v2-top tw-top">
          <button className="v2-round tw-back" aria-label="Back" onClick={() => back(-1)}>
            <Chevron dir="left" size={20} />
          </button>
          <h1>Twin</h1>
          <CheckpointMenu view={view} onPick={pickView} />
        </header>

        {/* a checkpoint says so above everything else, and the way back to now sits in the same line */}
        {past && checkpoint && (
          <div className="tw-snap" role="status">
            <span className="tw-snap-mark" aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
                <path d="M3.5 4.5V8H7" />
                <path d="M12 8v4.2l2.8 1.8" />
              </svg>
            </span>
            <span className="tw-snap-text">
              <b>{checkpoint.date}</b>
              <small>{clinicShort(checkpoint.clinic)} · Snapshot</small>
            </span>
            <button className="tw-snap-back" onClick={() => pickView({ kind: "live" })}>
              <i className="tw-cp-live" aria-hidden />
              Back to live
            </button>
          </div>
        )}

        {/* trends compares visits across every lens at once, so it has no lens tabs */}
        {!trends && (
          <>
        {/*
          the three lenses as tabs: a mark and a name, nothing to count. A lens with a
          study to look at carries one quiet dot; the numbers wait in the readings below.
        */}
        <div className="tw-lens" role="tablist" aria-label="Twin lens">
          <button role="tab" className="tw-lens-all" aria-selected={overview} aria-label="Overview" onClick={() => setParams(query(null, null, view), { replace: true })}>
            <span className="tw-lens-mark" aria-hidden>
              <IconTwin size={20} />
            </span>
          </button>
          {LENS_ORDER.map((l) => {
            const s = lensStatus(l, visit);
            const Mark = LENS_ICON[l];
            return (
              <button
                key={l}
                role="tab"
                aria-selected={!overview && l === lens}
                aria-label={s.flagged ? `${LENS_LABEL[l]}, ${s.text}` : LENS_LABEL[l]}
                onClick={() => setParams(query(l, null, view), { replace: true })}
              >
                <span className="tw-lens-mark" aria-hidden>
                  <Mark size={18} />
                </span>
                <b className="tw-lens-t">{LENS_LABEL[l]}</b>
                {s.flagged && <i className="tw-lens-dot" aria-hidden />}
              </button>
            );
          })}
        </div>

          </>
        )}

        {trends ? (
          <TwinTrends />
        ) : overview ? (
          <TwinOverview visit={visit} past={past} onLens={(l) => setParams(query(l, null, view))} />
        ) : (
          <>
            <div className="twl-sky" data-past={past ? "" : undefined}>
            <div className="tw-hero" data-past={past ? "" : undefined} style={{ height: FIELD_H * fit }}>
              <div className="tw-stage" data-organ={organ ? (organ.map === "body" ? "region" : "organ") : undefined} style={{ width: FIELD_W, height: FIELD_H, "--s": fit } as CSSProperties}>
                <TwinField
                  className="tw-field"
                  map={organ?.map ?? "body"}
                  tints={tints}
                  focus={organ}
                  past={past}
                  marks={organ?.id === "dermatology" || (lens === "body" && !organ)}
                  label={organ ? `${organ.name}, close up` : past ? `Your twin at visit ${visit}, ${LENS_LABEL[lens]} lens` : `Your twin, ${LENS_LABEL[lens]} lens`}
                />
                {!organ && PINS[lens].map((p) => <PinMark key={p.region} pin={p} visit={visit} onOpen={() => go(`/v3/study/${p.region}`)} />)}
              </div>
            </div>

            {/* the lens names itself where the figure fades, as the overview does */}
            {!organ && (
              <header className="two-head twl-head">
                <span>
                  <h2>{LENS_LABEL[lens]}</h2>
                  {checkpoint && (
                    <p>
                      Visit {checkpoint.visit} · {checkpoint.date} · {clinicShort(checkpoint.clinic)}
                    </p>
                  )}
                </span>
              </header>
            )}
            </div>

            <TwinDetail key={`${lens}/${organId ?? ""}/${visit}`} lens={lens} region={organ} visit={visit} past={past} onSelect={select} />
          </>
        )}
      </div>
    </V2Screen>
  );
}

/** A reading as a small card at the figure's side; the card is the way in, opening the study it belongs to. */
function PinMark({ pin, visit, onOpen }: { pin: Pin; visit: number; onOpen: () => void }) {
  const v = readingOf(pin.region, visit);
  const flag = flagged(REGIONS[pin.region], visit);
  return (
    <button className="tw-pin" data-side={pin.side} data-flag={flag ? "" : undefined} style={{ top: pin.y }} onClick={onOpen} aria-label={`${pin.caption ?? v.label}, ${v.value}${v.unit ? ` ${v.unit}` : ""}. Open the study`}>
      <small>{pin.caption ?? v.label}</small>
      <span>
        <b>
          <Num v={v.value} />
        </b>
        {v.unit && <u>{v.unit}</u>}
        <Chevron />
      </span>
      {flag && v.status && <em>{v.status}</em>}
    </button>
  );
}
