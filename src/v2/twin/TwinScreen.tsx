import { useCallback, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import type { OrganId } from "../data/metrics";
import { CHRONOLOGICAL_AGE, LENS_ORDER, LENSES, ORGANS, type Lens, type Organ, type Pin } from "../data/organs";
import { Avatar, useGo, V2Screen } from "../ui/shell";
import { Num } from "../ui/Num";
import { TwinField } from "./TwinField";
import { COLS, ROWS, toCell, type Tint } from "./field";
import { TwinSheet } from "./TwinSheet";
import "./twin.css";

const FIELD_W = 393;
const FIELD_H = (FIELD_W / COLS) * ROWS;
const MONITOR = "#b27f00";
const YOUNGER = "#1c8fb0";
const LIVE = "#203a85";

/** What each lens paints on the figure. Gold stays reserved for Monitor, as it always was. */
function lensTints(lens: Lens): Tint[] {
  const organs = LENSES[lens].organs.map((id) => ORGANS[id]).filter((o) => o.id !== "skin");
  if (lens === "omics") {
    return organs
      .filter((o) => o.age !== undefined && o.age !== CHRONOLOGICAL_AGE)
      .map((organ) => {
        // immune is systemic: a low swell the organs still read through, not a filled torso
        if (organ.id === "immune") return { organ, color: MONITOR, strength: 0.3 };
        const d = organ.age! - CHRONOLOGICAL_AGE;
        return { organ, color: d > 0 ? MONITOR : YOUNGER, strength: Math.min(1, 0.4 + Math.abs(d) * 0.13) };
      });
  }
  return organs.map((organ) => ({ organ, color: organ.status === "monitor" ? MONITOR : LIVE, strength: organ.status === "monitor" ? 1 : 0.5 }));
}

const NO_TINTS: Tint[] = [];

/**
 * The twin as a destination. One figure, three lenses over the same three
 * categories the app files data under, and every region a way into that data.
 * Selecting an organ regrows the dots into it and the sheet opens on the rows
 * that feed it, so the member moves from body to number without changing place.
 */
export function TwinScreen() {
  const [params, setParams] = useSearchParams();
  const go = useGo();
  const asked = params.get("lens") as Lens | null;
  const lens: Lens = asked && LENSES[asked] ? asked : "vitals";
  const organId = params.get("organ") as OrganId | null;
  const organ: Organ | null = organId ? ORGANS[organId] ?? null : null;

  const select = useCallback(
    (id: OrganId | null) => {
      const next = new URLSearchParams({ lens });
      if (id) next.set("organ", id);
      setParams(next, { replace: organ !== null && id !== null });
    },
    [lens, organ, setParams],
  );

  const tints = useMemo(() => {
    if (organ) return organ.map === "body" ? [{ organ, color: organ.status === "monitor" ? MONITOR : LIVE, strength: organ.id === "skin" ? 0.12 : 1 }] : NO_TINTS;
    return lensTints(lens);
  }, [lens, organ]);

  // the figure is drawn for a 393 screen; a real phone scales it to its own width
  const root = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const w = root.current?.clientWidth ?? FIELD_W;
    setFit(Math.min(1.12, w / FIELD_W));
  }, []);

  const tap = (x: number, y: number) => {
    if (organ) return;
    const sx = x * 312 - 56;
    const sy = y * 358.8 - 8;
    const hits = LENSES[lens].organs
      .map((id) => ORGANS[id])
      .filter((o) => o.id !== "skin")
      .map((o) => ({ o, d: Math.hypot((sx - o.at[0]) / o.radius[0], (sy - o.at[1]) / o.radius[1]) }))
      .filter((h) => h.d < 1.3)
      .sort((a, b) => a.d - b.d);
    // immune covers the torso, so it only answers where no organ does
    const hit = hits.find((h) => h.o.id !== "immune") ?? hits[0];
    if (hit) select(hit.o.id);
  };

  return (
    <V2Screen>
      <div className="tw" ref={root}>
        <header className="v2-top tw-top">
          <h1>Twin</h1>
          <button className="tw-review" onClick={() => go("/v2/study/apose")}>
            Full review
          </button>
          <Avatar />
        </header>

        <div className="tw-lens" role="tablist" aria-label="Twin lens" style={{ "--i": LENS_ORDER.indexOf(lens) } as CSSProperties}>
          <i aria-hidden />
          {LENS_ORDER.map((l) => (
            <button key={l} role="tab" aria-selected={l === lens} onClick={() => setParams({ lens: l }, { replace: true })}>
              {LENSES[l].label}
            </button>
          ))}
        </div>

        <div className="tw-stage" data-organ={organ ? (organ.map === "body" ? "region" : "organ") : undefined} style={{ width: FIELD_W, height: FIELD_H, "--s": fit } as CSSProperties}>
          <TwinField
            className="tw-field"
            map={organ?.map ?? "body"}
            tints={tints}
            focus={organ}
            alive={lens === "vitals" && !organ}
            marks={organ?.id === "skin" || (lens === "body" && !organ)}
            label={organ ? `${organ.name}, close up` : `Your twin, ${LENSES[lens].label} lens`}
            onTapCell={tap}
          />
          {!organ && LENSES[lens].pins.map((p) => <PinMark key={p.organ + p.caption} pin={p} onSelect={() => select(p.organ)} />)}
        </div>

        <TwinSheet lens={lens} organ={organ} onSelect={select} />
      </div>
    </V2Screen>
  );
}

/** A reading on a hairline leader, running back to the part of the body it came from. */
function PinMark({ pin, onSelect }: { pin: Pin; onSelect: () => void }) {
  const o = ORGANS[pin.organ];
  const [cx, cy] = toCell(o.at[0], o.at[1]);
  const x = (cx / COLS) * FIELD_W;
  const y = (cy / ROWS) * FIELD_H;
  const edge = pin.side === "l" ? 104 : FIELD_W - 104;
  const anchor = pin.y + 30;
  const flag = pin.flag === true;
  return (
    <>
      <svg className="tw-lead" width={FIELD_W} height={FIELD_H} aria-hidden>
        <path d={`M${edge},${anchor} L${x},${y}`} fill="none" stroke={flag ? MONITOR : LIVE} strokeOpacity={flag ? 0.75 : 0.36} />
        <circle cx={x} cy={y} r="3" fill={flag ? MONITOR : LIVE} />
      </svg>
      <button className="tw-pin" data-side={pin.side} data-flag={flag ? "" : undefined} style={{ top: pin.y }} onClick={onSelect}>
        <small>{pin.caption}</small>
        <span>
          <b>
            <Num v={pin.value} />
          </b>
          {pin.unit && <u>{pin.unit}</u>}
        </span>
      </button>
    </>
  );
}
