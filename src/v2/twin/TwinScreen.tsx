import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar, useGo, V2Screen } from "../ui/shell";
import { Chevron } from "../ui/icons";
import { Num } from "../ui/Num";
import { TwinField } from "./TwinField";
import { COLS, ROWS, type Tint } from "./field";
import { TwinDetail } from "./TwinDetail";
import { IconLensBody, IconLensOmics, IconLensVitals } from "../ui/icons";
import { LENS_LABEL, LENS_ORDER, lensStatus, PINS, readingOf, REGIONS, regionsOf, toneOf, type Lens, type Pin, type Region } from "./regions";
import "./twin.css";

const FIELD_W = 393;
const FIELD_H = (FIELD_W / COLS) * ROWS;
const MONITOR = "#ffb600";
const ALERT = "#c4572e";
const LIVE = "#263980";

/** A region in the colour of its study's status: gold to monitor, the portal's red to discuss. */
const colourOf = (r: Region) => {
  const tone = toneOf(readingOf(r.id));
  return tone === "alert" ? ALERT : tone === "mon" ? MONITOR : LIVE;
};

/**
 * What each lens paints on the figure: its organs. A study of the whole body paints
 * nothing, since its reach is wider than the figure; its pin and row carry its status.
 */
function lensTints(lens: Lens): Tint[] {
  return regionsOf(lens)
    .filter((organ) => !organ.whole)
    .map((organ) => {
      const colour = colourOf(organ);
      return { organ, color: colour, strength: colour !== LIVE ? 1 : 0.5 };
    });
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
  const [params, setParams] = useSearchParams();
  const go = useGo();
  const asked = params.get("lens") as Lens | null;
  const lens: Lens = asked && LENS_ORDER.includes(asked) ? asked : "vitals";
  const organId = params.get("organ");
  const organ: Region | null = organId ? REGIONS[organId] ?? null : null;

  const select = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams({ lens });
      if (id) next.set("organ", id);
      setParams(next, { replace: organ !== null && id !== null });
    },
    [lens, organ, setParams],
  );

  const tints = useMemo(() => {
    if (organ) return organ.map === "body" && !organ.whole ? [{ organ, color: colourOf(organ), strength: 1 }] : NO_TINTS;
    return lensTints(lens);
  }, [lens, organ]);

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


  return (
    <V2Screen>
      <div className="v2-veil tw-veil" data-at="status" data-on={scrolled ? "" : undefined} aria-hidden />
      <div className="tw" ref={root} onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 0)}>
        <header className="v2-top tw-top">
          <h1>Twin</h1>
          <button className="tw-review" onClick={() => go("/v2/study/apose")}>
            Full review
          </button>
          <Avatar />
        </header>

        {/*
          the three lenses as tabs: a mark and a name, nothing to count. A lens with a
          study to look at carries one quiet dot; the numbers wait in the readings below.
        */}
        <div className="tw-lens" role="tablist" aria-label="Twin lens">
          {LENS_ORDER.map((l) => {
            const s = lensStatus(l);
            const Mark = LENS_ICON[l];
            return (
              <button
                key={l}
                role="tab"
                aria-selected={l === lens}
                aria-label={s.flagged ? `${LENS_LABEL[l]}, ${s.text}` : LENS_LABEL[l]}
                onClick={() => setParams({ lens: l }, { replace: true })}
              >
                <span className="tw-lens-mark" aria-hidden>
                  <Mark />
                </span>
                <b className="tw-lens-t">{LENS_LABEL[l]}</b>
                {s.flagged && <i className="tw-lens-dot" aria-hidden />}
              </button>
            );
          })}
        </div>

        <div className="tw-hero" style={{ height: FIELD_H * fit }}>
          <div className="tw-stage" data-organ={organ ? (organ.map === "body" ? "region" : "organ") : undefined} style={{ width: FIELD_W, height: FIELD_H, "--s": fit } as CSSProperties}>
            <TwinField
              className="tw-field"
              map={organ?.map ?? "body"}
              tints={tints}
              focus={organ}
              marks={organ?.id === "dermatology" || (lens === "body" && !organ)}
              label={organ ? `${organ.name}, close up` : `Your twin, ${LENS_LABEL[lens]} lens`}
            />
            {!organ && PINS[lens].map((p) => <PinMark key={p.region} pin={p} onOpen={() => go(`/v2/study/${p.region}`)} />)}
          </div>
        </div>

        <TwinDetail key={`${lens}/${organId ?? ""}`} lens={lens} region={organ} onSelect={select} />
      </div>
    </V2Screen>
  );
}

/** A reading as a small card at the figure's side; the card is the way in, opening the study it belongs to. */
function PinMark({ pin, onOpen }: { pin: Pin; onOpen: () => void }) {
  const v = readingOf(pin.region);
  const flag = colourOf(REGIONS[pin.region]) !== LIVE;
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
